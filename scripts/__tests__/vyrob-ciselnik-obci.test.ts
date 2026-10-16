import { describe, it, expect } from 'vitest';

// @ts-expect-error – skript je čistý ESM bez typov.
import {
  rozdelRiadok, spracujCsv, zoradTrojice, vydanieZNazvu, nazovKraja, nazovOkresu, zostavVystup,
  slugKraja, zostavUlice, kodujCisla, cisloDomu, slugNazvu, nazovSuboruObce, zostavAdresy,
} from '../vyrob-ciselnik-obci.mjs';

const HLAVICKA = 'IDENTIFIKATOR;KRAJ;OKRES;OBEC;CAST_OBCE;ULICA;SUPISNE_CISLO;ORIENTACNE_CISLO_CELE;PSC;ADRBOD_X;ADRBOD_Y';

function riadok(kraj: string, okres: string, obec: string, ulica = '', psc = '97632'): string {
  return `1;${kraj};${okres};${obec};;${ulica};150;2;${psc};19,12;48,66`;
}

describe('rozdelRiadok', () => {
  it('rozdelí podľa bodkočiarky a zachová prázdne polia', () => {
    expect(rozdelRiadok('a;;c')).toEqual(['a', '', 'c']);
  });

  it('bodkočiarka v úvodzovkách nedelí pole a zdvojená úvodzovka je jedna', () => {
    expect(rozdelRiadok('a;"b;c";"d""e"')).toEqual(['a', 'b;c', 'd"e']);
  });
});

describe('spracujCsv – číselník obec → okres → kraj', () => {
  it('z mnohých adries nechá jednu trojicu na obec a okres', () => {
    const text = [HLAVICKA, riadok('Žilinský', 'Bytča', 'Bytča', 'A'), riadok('Žilinský', 'Bytča', 'Bytča', 'B')].join('\n');
    const { trojice, riadkov } = spracujCsv(text);
    expect(riadkov).toBe(2);
    expect([...trojice.values()]).toEqual([['Bytča', 'Bytča', 'Žilinský kraj']]);
  });

  it('doplní „kraj“ ku názvu kraja a prepíše názov okresu podľa aliasu', () => {
    const text = [HLAVICKA, riadok('Košický', 'Košice - okolie', 'Bidovce')].join('\n');
    expect([...spracujCsv(text).trojice.values()]).toEqual([['Bidovce', 'Košice-okolie', 'Košický kraj']]);
    expect(nazovKraja('Košický')).toBe('Košický kraj');
    expect(nazovKraja('Košický kraj')).toBe('Košický kraj');
    expect(nazovOkresu('Prievidza')).toBe('Prievidza');
  });

  it('rovnaký názov obce v rôznych okresoch zostane ako dve trojice', () => {
    const text = [
      HLAVICKA,
      riadok('Banskobystrický', 'Poltár', 'Selce'),
      riadok('Banskobystrický', 'Krupina', 'Selce'),
    ].join('\r\n');
    const { trojice } = spracujCsv(text);
    expect(trojice.size).toBe(2);
  });

  it('spojí viac súborov do jednej mapy a preskočí riadky s chýbajúcim údajom', () => {
    const mapa = new Map();
    spracujCsv([HLAVICKA, riadok('Nitriansky', 'Nitra', 'Nitra')].join('\n'), mapa);
    const druhy = spracujCsv([HLAVICKA, riadok('Nitriansky', 'Nitra', 'Nitra'), riadok('Nitriansky', '', 'Zobor')].join('\n'), mapa);
    expect(mapa.size).toBe(1);
    expect(druhy.preskocene).toBe(1);
  });

  it('zvládne BOM na začiatku súboru', () => {
    const text = `\uFEFF${HLAVICKA}\n${riadok('Trnavský', 'Galanta', 'Galanta')}`;
    expect(spracujCsv(text).trojice.size).toBe(1);
  });

  it('bez stĺpcov KRAJ, OKRES, OBEC skončí chybou', () => {
    expect(() => spracujCsv('A;B;C\n1;2;3')).toThrow(/chýba stĺpec/);
  });
});

describe('zoradTrojice a výstup', () => {
  it('zoradí podľa slovenskej abecedy (Č až po C, Š až po S)', () => {
    const mapa = new Map([
      ['1', ['Šaľa', 'Šaľa', 'Nitriansky kraj']],
      ['2', ['Čadca', 'Čadca', 'Žilinský kraj']],
      ['3', ['Cífer', 'Trnava', 'Trnavský kraj']],
      ['4', ['Zvolen', 'Zvolen', 'Banskobystrický kraj']],
    ]);
    expect(zoradTrojice(mapa).map((t: string[]) => t[0])).toEqual(['Cífer', 'Čadca', 'Šaľa', 'Zvolen']);
  });

  it('výstup nesie licenciu, zdroj a zoznam súborov', () => {
    const v = zostavVystup(new Map(), ['a.csv (08/2026)']);
    expect(v.licencia).toBe('CC0 1.0');
    expect(v.subory).toEqual(['a.csv (08/2026)']);
    expect(v.obce).toEqual([]);
  });

  it('mesiac vydania zistí z názvu súboru', () => {
    expect(vydanieZNazvu('Adresy_BBkraj_UTF8_08_2026.csv')).toBe('08/2026');
    expect(vydanieZNazvu('Adresy BBkraj UTF8_04_2026.csv')).toBe('04/2026');
    expect(vydanieZNazvu('adresy.csv')).toBeNull();
  });
});

describe('ulice podľa obce a okresu', () => {
  it('zbiera ulice len vtedy, keď je zadaná mapa, a preskočí prázdne ulice', () => {
    const text = [
      HLAVICKA,
      riadok('Žilinský', 'Ružomberok', 'Ružomberok', 'Hlavná'),
      riadok('Žilinský', 'Ružomberok', 'Ružomberok', 'Hlavná'),
      riadok('Žilinský', 'Ružomberok', 'Ružomberok', 'Čerešňová'),
      riadok('Žilinský', 'Ružomberok', 'Likavka', ''),
    ].join('\n');
    expect(spracujCsv(text).trojice.size).toBe(2);

    const ulice = new Map();
    spracujCsv(text, new Map(), ulice);
    expect(zostavUlice(ulice)).toEqual({
      'Žilinský kraj': { Ružomberok: { Ružomberok: ['Čerešňová', 'Hlavná'] } },
    });
  });

  it('rovnaká obec v dvoch okresoch má ulice oddelene', () => {
    const text = [
      HLAVICKA,
      riadok('Banskobystrický', 'Poltár', 'Selce', 'Dolná'),
      riadok('Banskobystrický', 'Krupina', 'Selce', 'Horná'),
    ].join('\n');
    const ulice = new Map();
    spracujCsv(text, new Map(), ulice);
    expect(zostavUlice(ulice)['Banskobystrický kraj'].Selce).toEqual({ Krupina: ['Horná'], Poltár: ['Dolná'] });
  });

  it('názov súboru kraja je bez diakritiky a bez slova kraj', () => {
    expect(slugKraja('Žilinský kraj')).toBe('zilinsky');
    expect(slugKraja('Banskobystrický kraj')).toBe('banskobystricky');
    expect(slugKraja('Prešovský')).toBe('presovsky');
  });
});

describe('čísla domov podľa obce a ulice', () => {
  it('čísla zapíše úsporne: rady čisto číselných, ostatné po jednom', () => {
    expect(kodujCisla(['3', '1', '2', '7', '9', '10', '11'])).toBe('1-3,7,9-11');
    expect(kodujCisla(['150/2', '2A', '5', '150/2'])).toBe('5,2A,150/2');
    expect(kodujCisla([''])).toBe('');
  });

  it('číslo domu je súpisné/orientačné, alebo jediné číslo', () => {
    expect(cisloDomu('8229', '1')).toBe('8229/1');
    expect(cisloDomu('150', '')).toBe('150');
    expect(cisloDomu('', '12')).toBe('12');
    expect(cisloDomu(' 7 ', ' 2A ')).toBe('7/2A');
  });

  it('názov súboru obce nesie okres a obec bez diakritiky', () => {
    expect(slugNazvu('Žilina – Bánová')).toBe('zilina-banova');
    expect(nazovSuboruObce('Ružomberok', 'Likavka')).toBe('ruzomberok__likavka.json');
    expect(nazovSuboruObce('Košice-okolie', 'Čaňa')).toBe('kosice-okolie__cana.json');
  });

  it('zbiera čísla domov podľa obce a ulice, aj adresy bez ulice', () => {
    const text = [
      HLAVICKA,
      '1;Žilinský;Ružomberok;Ružomberok;;Hlavná;8229;1;03401;1;1',
      '2;Žilinský;Ružomberok;Ružomberok;;Hlavná;8230;3;03401;1;1',
      '3;Žilinský;Ružomberok;Ružomberok;;;59;;03401;1;1',
      '4;Žilinský;Ružomberok;Likavka;;;1;;03421;1;1',
      '5;Žilinský;Ružomberok;Likavka;;;2;;03421;1;1',
    ].join('\n');
    const adresy = new Map();
    spracujCsv(text, new Map(), null, adresy);
    const subory = zostavAdresy(adresy);
    expect(subory.map((f: { cesta: string }) => f.cesta)).toEqual([
      'zilinsky/ruzomberok__likavka.json',
      'zilinsky/ruzomberok__ruzomberok.json',
    ]);
    expect(subory[0].obsah).toEqual({ '': '1-2' });
    expect(subory[1].obsah).toEqual({ '': '59', Hlavná: '8229/1,8230/3' });
  });

  it('riadok bez čísla domu sa preskočí', () => {
    const adresy = new Map();
    spracujCsv([HLAVICKA, '1;Žilinský;Bytča;Bytča;;Hlavná;;;01401;1;1'].join('\n'), new Map(), null, adresy);
    expect(adresy.size).toBe(0);
  });

  it('dve obce s rovnakým názvom súboru skončia chybou, nie tichým prepísaním', () => {
    const adresy = new Map([
      ['Žilinský\u0000Bytča\u0000Šaľa', new Map([['', new Set(['1'])]])],
      ['Žilinský\u0000Bytča\u0000Sala', new Map([['', new Set(['2'])]])],
    ]);
    expect(() => zostavAdresy(adresy)).toThrow(/rovnaký názov súboru/);
  });
});
