import { describe, it, expect } from 'vitest';
import { calculateMZI, calculateOZE } from '../useScoring';
import { createEmptyAreal, createEmptyPozemok } from '../../types/areal';

describe('calculateOZE – vhodnosť strechy pre solár iba zo striech do 15° (issue #179)', () => {
  it('plochá strecha s využiteľnou plochou zvyšuje skóre, šikmá orientovaná na juh nie', () => {
    const plocha = createEmptyAreal();
    plocha.budovy[0].plochaPodorysu = 400;
    plocha.budovy[0].strechaTyp = 1;
    plocha.budovy[0].strechaOrientovanaPlochaNaJuh = 300;

    const sikma = createEmptyAreal();
    sikma.budovy[0].plochaPodorysu = 400;
    sikma.budovy[0].strechaTyp = 2;
    sikma.budovy[0].strechaOrientovanaPlochaNaJuh = 300;

    expect(calculateOZE(plocha).vhodnostStrechyPreSolar).toBeGreaterThan(0);
    expect(calculateOZE(sikma).vhodnostStrechyPreSolar).toBe(0);
    expect(calculateOZE(plocha).potencialDalsichOZE).toBeGreaterThan(calculateOZE(sikma).potencialDalsichOZE);
  });
});

describe('calculateMZI – stav zelene s poľom priepustnaPlochaHolaPoda', () => {
  it('započíta holú pôdu do skóre rovnako ako byliny (issue #128 – pole skryté z formulára)', () => {
    const arealSByliny = createEmptyAreal();
    const pByliny = createEmptyPozemok();
    pByliny.priepustnaPlochaCelkom = 100;
    pByliny.priepustnaPlochaByliny = 40;
    arealSByliny.pozemky = [pByliny];

    const arealSHolouPodou = createEmptyAreal();
    const pHolaPoda = createEmptyPozemok();
    pHolaPoda.priepustnaPlochaCelkom = 100;
    pHolaPoda.priepustnaPlochaHolaPoda = 40;
    arealSHolouPodou.pozemky = [pHolaPoda];

    const skoreByliny = calculateMZI(arealSByliny);
    const skoreHolaPoda = calculateMZI(arealSHolouPodou);

    expect(skoreHolaPoda.stavZelene).toBe(skoreByliny.stavZelene);
  });

  it('existujúce nenulové hodnoty priepustnaPlochaHolaPoda naďalej prispievajú ku skóre (nie sú ignorované)', () => {
    const arealBezHolejPody = createEmptyAreal();
    const pBez = createEmptyPozemok();
    pBez.priepustnaPlochaCelkom = 100;
    arealBezHolejPody.pozemky = [pBez];

    const arealSHolouPodou = createEmptyAreal();
    const pS = createEmptyPozemok();
    pS.priepustnaPlochaCelkom = 100;
    pS.priepustnaPlochaHolaPoda = 40;
    arealSHolouPodou.pozemky = [pS];

    const skoreBez = calculateMZI(arealBezHolejPody);
    const skoreS = calculateMZI(arealSHolouPodou);

    expect(skoreS.stavZelene).toBeGreaterThan(skoreBez.stavZelene);
  });
});
