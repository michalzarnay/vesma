import { describe, it, expect } from 'vitest';
import { KRAJE, OBCE_ZAZNAMY, type ZaznamObce } from '../../data/slovakLocations';
import {
  dosadUlicu, jednoznacnaObec, nacitajUliceKraja, NACITACE_ULIC, navrhyUlic, nazovUliceZTextu, rozdelAdresu, slugKraja,
  uliceObce,
  type UliceKraja,
} from '../uliceSR';

const ZAZNAMY: ZaznamObce[] = [
  ['Ružomberok', 'Ružomberok', 'Žilinský kraj'],
  ['Likavka', 'Ružomberok', 'Žilinský kraj'],
  ['Selce', 'Poltár', 'Banskobystrický kraj'],
  ['Selce', 'Krupina', 'Banskobystrický kraj'],
];

const ULICE = ['Hlavná', 'Hrabovská cesta', 'Čerešňová', 'Za mostom', 'Nová', 'Vyšná Hlavná'];

describe('jednoznacnaObec', () => {
  it('obec v jedinom okrese je jednoznačná aj bez okresu', () => {
    expect(jednoznacnaObec('Ružomberok', '', ZAZNAMY)).toEqual({
      obec: 'Ružomberok', okres: 'Ružomberok', kraj: 'Žilinský kraj',
    });
  });

  it('nezhodný starý okres jednoznačnú obec nezruší', () => {
    expect(jednoznacnaObec('Ružomberok', 'Poltár', ZAZNAMY)?.okres).toBe('Ružomberok');
  });

  it('obec vo viacerých okresoch bez zvoleného okresu jednoznačná nie je', () => {
    expect(jednoznacnaObec('Selce', '', ZAZNAMY)).toBeNull();
  });

  it('obec vo viacerých okresoch so zvoleným okresom je jednoznačná', () => {
    expect(jednoznacnaObec('Selce', 'Krupina', ZAZNAMY)).toEqual({
      obec: 'Selce', okres: 'Krupina', kraj: 'Banskobystrický kraj',
    });
  });

  it('neznáma obec nemá polohu', () => {
    expect(jednoznacnaObec('Brno', '', ZAZNAMY)).toBeNull();
  });
});

describe('uliceObce', () => {
  const data: UliceKraja = { Ružomberok: { Ružomberok: ULICE } };

  it('vráti ulice obce v okrese', () => {
    expect(uliceObce(data, { obec: 'Ružomberok', okres: 'Ružomberok', kraj: 'Žilinský kraj' })).toEqual(ULICE);
  });

  it('obec bez ulíc má prázdny zoznam', () => {
    expect(uliceObce(data, { obec: 'Likavka', okres: 'Ružomberok', kraj: 'Žilinský kraj' })).toEqual([]);
  });
});

describe('nazovUliceZTextu', () => {
  it('odstráni číslo domu', () => {
    expect(nazovUliceZTextu('Hlavná 15')).toBe('Hlavná');
    expect(nazovUliceZTextu('Hlavná 15/3')).toBe('Hlavná');
    expect(nazovUliceZTextu('  Za mostom 2a ')).toBe('Za mostom');
  });

  it('text bez čísla nechá celý', () => {
    expect(nazovUliceZTextu('Za mos')).toBe('Za mos');
    expect(nazovUliceZTextu('')).toBe('');
  });
});

describe('navrhyUlic', () => {
  it('najprv ponúkne ulice, ktoré začínajú zadaným textom, potom tie, čo ho obsahujú', () => {
    expect(navrhyUlic(ULICE, 'hla')).toEqual(['Hlavná', 'Vyšná Hlavná']);
  });

  it('nerozlišuje veľkosť písmen ani diakritiku', () => {
    expect(navrhyUlic(ULICE, 'CERESN')).toEqual(['Čerešňová']);
  });

  it('číslo domu pri hľadaní ignoruje', () => {
    expect(navrhyUlic(ULICE, 'Hrab 12')).toEqual(['Hrabovská cesta']);
  });

  it('presne napísanú ulicu už neponúka', () => {
    expect(navrhyUlic(['Nová', 'Hlavná'], 'Nová 5')).toEqual([]);
  });

  it('prázdny text nič neponúka a počet návrhov je obmedzený', () => {
    expect(navrhyUlic(ULICE, '')).toEqual([]);
    const veľa = Array.from({ length: 30 }, (_, i) => `Ulica ${String.fromCharCode(65 + (i % 26))}${i}`);
    expect(navrhyUlic(veľa, 'ul', 5)).toHaveLength(5);
  });
});

const S_CISLICOU = ['1.mája', '1. mája', '29. augusta', 'Hlavná', 'Hlavná stanica', 'Mája'];

describe('ulice s číslicami v názve (1.mája, 29. augusta)', () => {
  it('rozpozná celú ulicu s číslicou a oddelí od nej číslo domu', () => {
    expect(rozdelAdresu('1.mája 12', S_CISLICOU)).toEqual({ ulica: '1.mája', cislo: '12', presna: true });
    expect(rozdelAdresu('29. augusta 3/5', S_CISLICOU)).toEqual({ ulica: '29. augusta', cislo: '3/5', presna: true });
  });

  it('pri ulici, ktorej názov je predponou inej, berie najdlhšiu zhodu', () => {
    expect(rozdelAdresu('Hlavná stanica 4', S_CISLICOU)).toEqual({ ulica: 'Hlavná stanica', cislo: '4', presna: true });
    expect(rozdelAdresu('Hlavná 4', S_CISLICOU)).toEqual({ ulica: 'Hlavná', cislo: '4', presna: true });
  });

  it('rozpísaný začiatok ulice s číslicou nerozreže na číslo domu', () => {
    expect(rozdelAdresu('1.m', S_CISLICOU)).toEqual({ ulica: '1.m', cislo: '', presna: false });
    expect(rozdelAdresu('29', S_CISLICOU)).toEqual({ ulica: '29', cislo: '', presna: false });
  });

  it('ponúkne ulice s číslicou už pri písaní ich začiatku', () => {
    expect(navrhyUlic(S_CISLICOU, '1.m')).toEqual(['1.mája', '1. mája']);
    expect(navrhyUlic(S_CISLICOU, '29. a')).toEqual(['29. augusta']);
  });

  it('po výbere ulice s číslicou zachová už napísané číslo domu', () => {
    expect(dosadUlicu('1.m', '1.mája', S_CISLICOU)).toBe('1.mája ');
    expect(dosadUlicu('Hl 12', 'Hlavná', S_CISLICOU)).toBe('Hlavná 12');
  });

  it('v registri sa ulica s číslicou po rozpísaní pozná', async () => {
    const poloha = jednoznacnaObec('Námestovo', '');
    const ulice = uliceObce(await nacitajUliceKraja(poloha!.kraj), poloha!);
    expect(ulice).toContain('1.mája');
    expect(rozdelAdresu('1.mája 12', ulice)).toMatchObject({ ulica: '1.mája', cislo: '12' });
    expect(navrhyUlic(ulice, '1.m')).toContain('1.mája');
  });
});

describe('dosadUlicu', () => {
  it('za vybranú ulicu pridá medzeru na zadanie čísla', () => {
    expect(dosadUlicu('Hla', 'Hlavná')).toBe('Hlavná ');
  });

  it('zachová číslo domu, ktoré už mapér napísal', () => {
    expect(dosadUlicu('Hla 15', 'Hlavná')).toBe('Hlavná 15');
  });
});

describe('súbory ulíc z Registra adries (src/data/ulice)', () => {
  it('pre každý kraj existuje súbor a názov súboru zodpovedá názvu kraja', () => {
    expect(KRAJE.map(slugKraja).sort()).toEqual(Object.keys(NACITACE_ULIC).sort());
  });

  it('obce a okresy v súboroch existujú v číselníku obcí a patria do správneho kraja', async () => {
    const chyby: string[] = [];
    let ulic = 0;
    for (const kraj of KRAJE) {
      const data = await nacitajUliceKraja(kraj);
      for (const [obec, okresy] of Object.entries(data)) {
        for (const [okres, zoznam] of Object.entries(okresy)) {
          ulic += zoznam.length;
          if (!OBCE_ZAZNAMY.some(([o, ok, k]) => o === obec && ok === okres && k === kraj)) {
            chyby.push(`${kraj}: ${obec} / ${okres}`);
          }
          if (zoznam.length === 0 || zoznam.some((u) => u.trim() !== u || u === '')) chyby.push(`zlé ulice: ${obec}`);
        }
      }
    }
    expect(chyby.slice(0, 10)).toEqual([]);
    expect(ulic).toBeGreaterThan(25000);
  });

  it('mesto Ružomberok má ulice a vybrať sa dajú podľa polohy', async () => {
    const poloha = jednoznacnaObec('Ružomberok', '');
    expect(poloha).not.toBeNull();
    const ulice = uliceObce(await nacitajUliceKraja(poloha!.kraj), poloha!);
    expect(ulice.length).toBeGreaterThan(100);
    expect(ulice).toContain('Andreja Hlinku');
  });

  it('neznámy kraj nespôsobí chybu', async () => {
    expect(await nacitajUliceKraja('Moravskoslezský kraj')).toEqual({});
  });
});
