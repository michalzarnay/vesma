import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OBCE_ZAZNAMY } from '../../data/slovakLocations';
import {
  cestaSuboruAdries, dekodujCisla, lokalneNavrhy, nacitajAdresyObce, navrhyCisel, slugNazvu, type AdresyObce,
} from '../adresySR';
import { jednoznacnaObec, nacitajUliceKraja, uliceObce } from '../uliceSR';

// @ts-expect-error – skript je čistý ESM bez typov.
import { kodujCisla, nazovSuboruObce, slugNazvu as slugNazvuSkript } from '../../../scripts/vyrob-ciselnik-obci.mjs';

const KOREN = process.cwd();

describe('dekodujCisla', () => {
  it('rozvinie rady a ponechá ostatné čísla po jednom', () => {
    expect(dekodujCisla('1-3,7,9-10,150/2,2A')).toEqual(['1', '2', '3', '7', '9', '10', '150/2', '2A']);
  });

  it('prázdny a chýbajúci zápis je prázdny zoznam', () => {
    expect(dekodujCisla('')).toEqual([]);
    expect(dekodujCisla(undefined)).toEqual([]);
  });

  it('porušený rad (obrátený alebo obrovský) nerozvinie a nezasekne sa', () => {
    expect(dekodujCisla('9-3')).toEqual(['9-3']);
    expect(dekodujCisla('1-99999999')).toEqual(['1-99999999']);
  });

  it('je opakom zápisu, ktorý vyrába skript', () => {
    const cisla = ['1', '2', '3', '5', '8', '9', '150/2', '150/2', '2A', '10B', '100'];
    const rozvinute = dekodujCisla(kodujCisla(cisla));
    expect(new Set(rozvinute)).toEqual(new Set(cisla));
    expect(rozvinute).toHaveLength(new Set(cisla).size);
  });
});

describe('navrhyCisel', () => {
  const CISLA = ['8229/1', '8230/3', '8231/5', '8283/2', '8284/4', '2442/11A', '5231/4A', '12', '120', '1200'];

  it('najprv ponúkne čísla, ktorých orientačná časť začína zadaným číslom', () => {
    expect(navrhyCisel(CISLA, '1')).toEqual(['8229/1', '2442/11A', '12', '120', '1200']);
  });

  it('potom čísla, ktorých súpisná časť začína zadaným číslom, radené podľa súpisného', () => {
    expect(navrhyCisel(CISLA, '82')).toEqual(['8229/1', '8230/3', '8231/5', '8283/2', '8284/4']);
  });

  it('nerozlišuje veľkosť písmen a nájde aj písmenové čísla', () => {
    expect(navrhyCisel(CISLA, '4a')).toEqual(['5231/4A']);
  });

  it('presne napísané číslo neponúka a prázdny text ponúkne najnižšie čísla po ľudsky', () => {
    expect(navrhyCisel(['2', '10', '2A', '1'], '2')).toEqual(['2A']);
    expect(navrhyCisel(['2', '10', '2A', '1'], '')).toEqual(['1', '2', '2A', '10']);
  });

  it('počet návrhov je obmedzený', () => {
    const veľa = Array.from({ length: 50 }, (_, i) => String(i + 1));
    expect(navrhyCisel(veľa, '', 5)).toHaveLength(5);
  });
});

describe('lokalneNavrhy – čo sa ponúkne v poli Ulica + číslo', () => {
  const ULICE = ['1.mája', 'Hlavná', 'Hlavná stanica'];
  const ADRESY: AdresyObce = { '1.mája': '1-9', Hlavná: '10/1,12/2,14/3', 'Hlavná stanica': '5', '': '1-3' };

  it('začiatok ulice ponúkne ulice', () => {
    expect(lokalneNavrhy('Hla', ULICE, ADRESY)).toEqual({ druh: 'ulice', ulica: '', polozky: ['Hlavná', 'Hlavná stanica'] });
  });

  it('celá ulica a medzera ponúkne jej čísla', () => {
    expect(lokalneNavrhy('Hlavná ', ULICE, ADRESY)).toEqual({ druh: 'cisla', ulica: 'Hlavná', polozky: ['10/1', '12/2', '14/3'] });
  });

  it('číslo za ulicou ponúkne najprv čísla s takým orientačným, potom so súpisným číslom', () => {
    expect(lokalneNavrhy('Hlavná 1', ULICE, ADRESY)?.polozky).toEqual(['10/1', '12/2', '14/3']);
    expect(lokalneNavrhy('Hlavná 2', ULICE, ADRESY)?.polozky).toEqual(['12/2']);
  });

  it('ulica s číslicou v názve ponúkne čísla domov, nie ulice', () => {
    expect(lokalneNavrhy('1.mája 5', ULICE, ADRESY)).toBeNull(); // 5 je už napísané celé
    expect(lokalneNavrhy('1.mája ', ULICE, ADRESY)).toEqual({
      druh: 'cisla', ulica: '1.mája', polozky: ['1', '2', '3', '4', '5', '6', '7', '8'],
    });
  });

  it('celá ulica bez medzery, ku ktorej nepasuje iná, ponúkne čísla', () => {
    expect(lokalneNavrhy('1.mája', ULICE, ADRESY)?.druh).toBe('cisla');
  });

  it('celá ulica, ktorá je predponou inej, najprv ponúkne tú dlhšiu', () => {
    expect(lokalneNavrhy('Hlavná', ULICE, ADRESY)).toEqual({ druh: 'ulice', ulica: '', polozky: ['Hlavná stanica'] });
  });

  it('obec bez ulíc ponúkne čísla domov po zadaní číslice', () => {
    expect(lokalneNavrhy('2', [], { '': '1-3,20' })).toEqual({ druh: 'cisla', ulica: '', polozky: ['20'] });
    expect(lokalneNavrhy('Hlav', [], { '': '1-3' })).toBeNull();
  });

  it('bez textu alebo bez zhody nič neponúka', () => {
    expect(lokalneNavrhy('', ULICE, ADRESY)).toBeNull();
    expect(lokalneNavrhy('Xyz', ULICE, ADRESY)).toBeNull();
  });

  it('keď súbor s adresami ešte nie je načítaný, ponúkne aspoň ulice', () => {
    expect(lokalneNavrhy('Hla', ULICE, null)?.druh).toBe('ulice');
    expect(lokalneNavrhy('Hlavná ', ULICE, null)).toBeNull();
  });
});

describe('nacitajAdresyObce', () => {
  const poloha = { obec: 'Testovo', okres: 'Test', kraj: 'Žilinský kraj' };

  it('stiahne súbor z adresára data/adresy a zapamätá si ho', async () => {
    let volani = 0;
    const nacitac = (async (url: string) => {
      volani += 1;
      expect(url).toMatch(/data\/adresy\/zilinsky\/test__testovo\.json$/);
      return new Response('{"Hlavná":"1-3"}', { status: 200 });
    }) as unknown as typeof fetch;
    expect(await nacitajAdresyObce(poloha, nacitac)).toEqual({ Hlavná: '1-3' });
    expect(await nacitajAdresyObce(poloha, nacitac)).toEqual({ Hlavná: '1-3' });
    expect(volani).toBe(1);
  });

  it('pri zlyhaní vráti null a nabudúce sa skúsi znova', async () => {
    const zla = { ...poloha, obec: 'Zlovo' };
    let volani = 0;
    const nacitac = (async () => {
      volani += 1;
      return new Response('', { status: 404 });
    }) as unknown as typeof fetch;
    expect(await nacitajAdresyObce(zla, nacitac)).toBeNull();
    expect(await nacitajAdresyObce(zla, nacitac)).toBeNull();
    expect(volani).toBe(2);
  });
});

describe('súbory adries z Registra adries (public/data/adresy)', () => {
  it('cesta súboru v aplikácii je rovnaká ako cesta, ktorú zapisuje skript', () => {
    expect(slugNazvu('Žilina – Bánová')).toBe(slugNazvuSkript('Žilina – Bánová'));
    for (const [obec, okres, kraj] of OBCE_ZAZNAMY.slice(0, 300)) {
      const cesta = cestaSuboruAdries({ obec, okres, kraj });
      expect(cesta.endsWith(`/${nazovSuboruObce(okres, obec)}`)).toBe(true);
    }
  });

  it('pre každú obec z číselníka existuje súbor a nikde sa neopakuje cesta', () => {
    const cesty = new Set<string>();
    const chyby: string[] = [];
    for (const [obec, okres, kraj] of OBCE_ZAZNAMY) {
      const cesta = cestaSuboruAdries({ obec, okres, kraj });
      if (cesty.has(cesta)) chyby.push(`opakovaná cesta ${cesta}`);
      cesty.add(cesta);
      if (!existsSync(join(KOREN, 'public', 'data', 'adresy', cesta))) chyby.push(`chýba ${cesta}`);
    }
    expect(chyby.slice(0, 10)).toEqual([]);
    expect(cesty.size).toBe(OBCE_ZAZNAMY.length);
  });

  it('ulice v súboroch obcí sú rovnaké ako ulice v súboroch krajov (krok 2)', async () => {
    const chyby: string[] = [];
    for (const [obec, okres, kraj] of OBCE_ZAZNAMY) {
      const poloha = { obec, okres, kraj };
      const adresy = JSON.parse(
        readFileSync(join(KOREN, 'public', 'data', 'adresy', cestaSuboruAdries(poloha)), 'utf8'),
      ) as AdresyObce;
      const zAdries = Object.keys(adresy).filter((k) => k !== '').sort();
      const zUlic = [...uliceObce(await nacitajUliceKraja(kraj), poloha)].sort();
      if (JSON.stringify(zAdries) !== JSON.stringify(zUlic)) chyby.push(`${obec} / ${okres}`);
    }
    expect(chyby.slice(0, 10)).toEqual([]);
  });

  it('mesto Ružomberok má čísla domov na ulici a dajú sa vybrať podľa polohy', () => {
    const poloha = jednoznacnaObec('Ružomberok', '')!;
    const adresy = JSON.parse(
      readFileSync(join(KOREN, 'public', 'data', 'adresy', cestaSuboruAdries(poloha)), 'utf8'),
    ) as AdresyObce;
    const cisla = dekodujCisla(adresy['Andreja Hlinku']);
    expect(cisla.length).toBeGreaterThan(50);
    expect(cisla.some((c) => /^\d+\/\d+[A-Z]?$/.test(c))).toBe(true);
  });

  it('žiadne číslo domu v súboroch neobsahuje čiarku ani pomlčku (zápis je jednoznačný)', () => {
    for (const [obec, okres, kraj] of OBCE_ZAZNAMY.slice(0, 400)) {
      const adresy = JSON.parse(
        readFileSync(join(KOREN, 'public', 'data', 'adresy', cestaSuboruAdries({ obec, okres, kraj })), 'utf8'),
      ) as AdresyObce;
      for (const kodovane of Object.values(adresy)) {
        expect(kodovane).toMatch(/^[0-9A-Za-z,/-]*$/);
        for (const cast of kodovane.split(',')) {
          if (cast.includes('-')) expect(cast).toMatch(/^\d+-\d+$/);
        }
      }
    }
  });
});
