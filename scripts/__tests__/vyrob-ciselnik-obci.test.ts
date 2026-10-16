import { describe, it, expect } from 'vitest';

// @ts-expect-error – skript je čistý ESM bez typov.
import {
  rozdelRiadok, spracujCsv, zoradTrojice, vydanieZNazvu, nazovKraja, nazovOkresu, zostavVystup,
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
