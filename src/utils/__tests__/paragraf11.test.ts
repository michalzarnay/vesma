import { describe, it, expect } from 'vitest';
import { createEmptyBudova } from '../../types/areal';
import { getParagraf11, PARAGRAF_11_PLOCHA_M2 } from '../paragraf11';

/** Budova, na ktorú § 11 ods. 1 dopadá: nad hranicou plochy a teplovodné kúrenie. */
function budovaPodParagrafom() {
  const b = createEmptyBudova();
  b.uzitkovaPlochaNUS = PARAGRAF_11_PLOCHA_M2 + 200;
  b.kurenePlynom = 1;
  return b;
}

describe('getParagraf11 — kedy povinnosti dopadajú', () => {
  it('dopadá na veľkú budovu s teplovodným kúrením', () => {
    expect(getParagraf11(budovaPodParagrafom()).dopada).toBe(true);
  });

  it('nedopadá na budovu presne na hranici — zákon hovorí „väčšia ako"', () => {
    const b = budovaPodParagrafom();
    b.uzitkovaPlochaNUS = PARAGRAF_11_PLOCHA_M2;
    expect(getParagraf11(b).dopada).toBe(false);
  });

  it('nedopadá na malú budovu', () => {
    const b = budovaPodParagrafom();
    b.uzitkovaPlochaNUS = 300;
    expect(getParagraf11(b).dopada).toBe(false);
  });

  it('nedopadá na veľkú budovu s priamotopmi — nie je to teplovodný systém', () => {
    const b = createEmptyBudova();
    b.uzitkovaPlochaNUS = 5000;
    b.kurenieElektrinou = 1;
    expect(getParagraf11(b).dopada).toBe(false);
  });

  it('dopadá aj pri CZT, tepelnom čerpadle, peletách a štiepke', () => {
    for (const zdroj of ['kurenieCZT', 'tepelneCerpadlo', 'kureniePeletami', 'kurenieStiepkou'] as const) {
      const b = createEmptyBudova();
      b.uzitkovaPlochaNUS = 2000;
      b[zdroj] = 1;
      expect(getParagraf11(b).dopada, zdroj).toBe(true);
    }
  });
});

describe('getParagraf11 — vyhodnotenie štyroch povinností', () => {
  it('nevyplnenú budovu vedie ako „neviem", nie ako nesplnené', () => {
    const v = getParagraf11(budovaPodParagrafom());
    // automatickaRegulacia je áno/nie a v prázdnej budove je 0 → nesplnená
    expect(v.nesplnene.map((p) => p.pismeno)).toEqual(['b']);
    expect(v.nezname.map((p) => p.pismeno)).toEqual(['a', 'c', 'd']);
  });

  it('pri splnení všetkých štyroch nehlási nič', () => {
    const b = budovaPodParagrafom();
    b.hydraulickeVyregulovanieUK = 1;
    b.automatickaRegulacia = 1;
    b.hydraulickeVyregulovanieTV = 1;
    b.izolaciaRozvodov = 1;

    const v = getParagraf11(b);
    expect(v.nesplnene).toHaveLength(0);
    expect(v.nezname).toHaveLength(0);
  });

  it('vymenuje konkrétne nesplnené povinnosti aj s písmenom', () => {
    const b = budovaPodParagrafom();
    b.hydraulickeVyregulovanieUK = 0;
    b.automatickaRegulacia = 1;
    b.hydraulickeVyregulovanieTV = 1;
    b.izolaciaRozvodov = 0;

    const v = getParagraf11(b);
    expect(v.nesplnene.map((p) => p.pismeno)).toEqual(['a', 'd']);
  });

  it('pri budove mimo § 11 nehlási nesplnené povinnosti, aj keď sú odpovede „nie"', () => {
    const b = createEmptyBudova();
    b.uzitkovaPlochaNUS = 200;
    b.kurenePlynom = 1;
    b.hydraulickeVyregulovanieUK = 0;
    b.izolaciaRozvodov = 0;

    const v = getParagraf11(b);
    expect(v.dopada).toBe(false);
    expect(v.nesplnene).toHaveLength(0);
    expect(v.nezname).toHaveLength(0);
  });
});
