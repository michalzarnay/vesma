import { describe, it, expect } from 'vitest';
import { createEmptyAreal, createEmptyPozemok, createEmptyBudova } from '../../types/areal';
import { calculateMZI } from '../mziKlimasken';
import { vysvetleniaMZI, tabulkaAkoText } from '../mziVysvetlenie';

/** Areál s jedným pozemkom a bez budov — izoluje komponent B-GOV2. */
function arealSPozemkom(uprav: (p: ReturnType<typeof createEmptyPozemok>) => void) {
  const areal = createEmptyAreal();
  const p = createEmptyPozemok();
  uprav(p);
  areal.pozemky = [p];
  areal.budovy = [];
  return areal;
}

function vysvetlenie(areal: ReturnType<typeof createEmptyAreal>, kluc: string) {
  return vysvetleniaMZI(areal, calculateMZI(areal)).find((v) => v.kluc === kluc);
}

describe('vysvetleniaMZI – priepustnosť a zeleň (B-GOV2)', () => {
  it('rozpíše plochy s kódmi metodiky a súčet sedí s koeficientom', () => {
    // 100 m² trávnika (0,7) + 100 m² betónu (0) → koeficient 0,35
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
      p.spevnenaPlochaCelkom = 100;
    });

    const v = vysvetlenie(areal, 'okolie')!;
    expect(v.metodika).toBe('KLIMASKEN B-GOV2');
    expect(v.hlavicka).toEqual(['Povrch', 'Kód', 'Výmera', 'Koeficient', 'Príspevok']);

    const kody = v.riadky.map((r) => r[1]);
    expect(kody).toContain('H'); // trávnik
    expect(kody).toContain('A'); // nepriepustná plocha

    // Posledný riadok je súčtový.
    const spolu = v.riadky[v.riadky.length - 1];
    expect(spolu[0]).toBe('Spolu');
    expect(spolu[2]).toBe('200 m²');

    expect(v.zaver).toContain('0,35');
    expect(v.zaver).toContain('stupeň C');
  });

  it('vetný sumár povie podiel, najväčšieho prispievateľa aj plochu bez funkcie', () => {
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
      p.spevnenaPlochaCelkom = 100;
    });

    const v = vysvetlenie(areal, 'okolie')!;
    expect(v.sumar).toContain('35 %');
    expect(v.sumar).toContain('byliny');
    expect(v.sumar).toContain('100 m²');
  });

  it('zlúči rovnaký typ povrchu naprieč viacerými pozemkami do jedného riadku', () => {
    const areal = createEmptyAreal();
    areal.budovy = [];
    areal.pozemky = [0, 1].map(() => {
      const p = createEmptyPozemok();
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
      return p;
    });

    const v = vysvetlenie(areal, 'okolie')!;
    const travnik = v.riadky.filter((r) => r[1] === 'H');
    expect(travnik).toHaveLength(1);
    expect(travnik[0][2]).toBe('200 m²');
  });
});

describe('vysvetleniaMZI – akumulácia (B-AD10)', () => {
  it('vypíše medzivýsledky a povie, ktorý objem rozhodol', () => {
    const areal = createEmptyAreal();
    areal.budovy = [];
    areal.pocetZamestnancov = 10; // Vv = 14 m³
    const p = createEmptyPozemok();
    p.podzemneNadobyObjem = 7;
    areal.pozemky = [p];

    const v = vysvetlenie(areal, 'akumulacia')!;
    expect(v.metodika).toBe('KLIMASKEN B-AD10');
    expect(v.riadky.some((r) => r[1].startsWith('Vv'))).toBe(true);
    expect(v.sumar).toContain('spotreba vody v areáli');
    expect(v.zaver).toContain('50 %');
  });
});

describe('vysvetleniaMZI – odtok zo spevnených plôch', () => {
  it('rozpíše, kam voda smeruje, a nepočíta priepustnú plochu', () => {
    const areal = arealSPozemkom((p) => {
      p.celkovaVymera = 1000;
      p.priepustnaPlochaCelkom = 900; // do odtokovej plochy nevstupuje
      p.priepustnaPlochaByliny = 100;
      p.spevnenaPlochaCelkom = 100;
      p.odvodVodyVsakovanie = 50;
      p.odvodVodyJednotnaKanalizacia = 50;
    });

    const v = vysvetlenie(areal, 'odtok')!;
    const spolu = v.riadky[v.riadky.length - 1];
    expect(spolu[2]).toBe('100 m²'); // len spevnená plocha, nie 1 000 m²
    expect(v.sumar).toContain('Priepustné plochy sa sem nerátajú');
    expect(v.zaver).toContain('50 %');
  });
});

describe('vysvetleniaMZI – chýbajúce údaje', () => {
  it('komponent bez údajov nemá vysvetlenie', () => {
    const areal = createEmptyAreal();
    areal.pozemky = [];
    areal.budovy = [];

    expect(vysvetleniaMZI(areal, calculateMZI(areal))).toHaveLength(0);
  });

  it('areál s budovou má vysvetlenie aj pre B-GOV3', () => {
    const areal = createEmptyAreal();
    areal.pozemky = [];
    const b = createEmptyBudova();
    b.plochaPodorysu = 200;
    b.zelenaStrechaBudovIntenzivna = 200;
    areal.budovy = [b];

    const v = vysvetlenie(areal, 'budovy')!;
    expect(v.metodika).toBe('KLIMASKEN B-GOV3');
    expect(v.riadky.some((r) => r[1] === 'F')).toBe(true);
    expect(v.zaver).toContain('stupeň A');
  });
});

describe('tabulkaAkoText', () => {
  it('oddelí bunky tabulátormi a riadky novým riadkom', () => {
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
    });

    const text = tabulkaAkoText(vysvetlenie(areal, 'okolie')!);
    const riadky = text.split('\n');

    expect(riadky[0]).toBe('Priepustnosť a zeleň areálu (KLIMASKEN B-GOV2)');
    expect(riadky[1]).toBe('Povrch\tKód\tVýmera\tKoeficient\tPríspevok');
    expect(riadky[2].split('\t')).toHaveLength(5);
    expect(riadky[riadky.length - 1]).toContain('bodov');
  });

  it('používa slovenský formát čísel, aby ich Excel prevzal ako čísla', () => {
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 2000;
      p.priepustnaPlochaByliny = 100;
    });

    const text = tabulkaAkoText(vysvetlenie(areal, 'okolie')!);
    expect(text).toContain('0,70'); // desatinná čiarka, nie bodka
    expect(text).toMatch(/2\s000 m²/); // medzera ako oddeľovač tisícov
  });
});
