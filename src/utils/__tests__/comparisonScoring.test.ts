import { describe, it, expect } from 'vitest';
import { Areal, createEmptyAreal } from '../../types/areal';
import { ENERGIA_PARAMETERS } from '../../data/comparisonWeights';
import { computeAreaComparisonScore, rankAreaComparisons } from '../comparisonScoring';

/**
 * Príspevok jedného energetického parametra do skóre areálu.
 * Celkové `score.energia` sa nedá použiť na overenie jedného parametra — akonáhle
 * budova dostane úžitkovú plochu, prispeje aj parameter osvetlenia.
 */
function prispevokEnergia(areal: Areal, key: string): number {
  const parameter = ENERGIA_PARAMETERS.find((p) => p.key === key);
  if (!parameter) throw new Error(`Neznámy energetický parameter: ${key}`);
  const detail = computeAreaComparisonScore(areal).podrobnostiEnergia.find((p) => p.nazov === parameter.nazov);
  if (!detail) throw new Error(`Parameter ${key} chýba v podrobnostiach`);
  return detail.prispevok;
}

describe('computeAreaComparisonScore', () => {
  it('vráti nulové hodnoty pre prázdny areál', () => {
    const areal = createEmptyAreal();
    const score = computeAreaComparisonScore(areal);
    expect(score.sucho).toBe(0);
    expect(score.horucavy).toBe(0);
    expect(score.voda).toBe(0);
    expect(score.energia).toBe(0);
  });

  it('spočíta vodný parameter podľa m² a váhy (odvod do kanalizácie)', () => {
    const areal = createEmptyAreal();
    areal.pozemky[0].plochaBezBudov = 1000;
    areal.pozemky[0].odvodVodyJednotnaKanalizacia = 50; // 500 m²

    const score = computeAreaComparisonScore(areal);
    // Váha sucho=7, horúčavy=5, voda=10 pre tento parameter (jediný nenulový v areáli)
    expect(score.sucho).toBe(Math.round(500 * 7));
    expect(score.horucavy).toBe(Math.round(500 * 5));
    expect(score.voda).toBe(Math.round(500 * 10));
  });

  it('sčíta odvod z jednotnej, splaškovej aj zrážkovej kanalizácie', () => {
    const areal = createEmptyAreal();
    areal.pozemky[0].plochaBezBudov = 1000;
    areal.pozemky[0].odvodVodyJednotnaKanalizacia = 20;
    areal.pozemky[0].odvodVodySplaskovaKanalizacia = 10;
    areal.pozemky[0].odvodVodyZrazkovaKanalizacia = 10;
    // spolu 40 % z 1000 m² = 400 m²

    const score = computeAreaComparisonScore(areal);
    expect(score.voda).toBe(Math.round(400 * 10));
  });

  it('existujúce opatrenie (dažďová záhrada) znižuje potenciál (záporná váha)', () => {
    const areal = createEmptyAreal();
    areal.pozemky[0].dazdovaZahradaPlocha = 50;

    const score = computeAreaComparisonScore(areal);
    expect(score.sucho).toBe(50 * -6);
    expect(score.horucavy).toBe(50 * -4);
    expect(score.voda).toBe(50 * -10);
  });

  it('počíta "vykurovanie plynom" z plochy budov, nie z ich počtu (issue #180)', () => {
    const areal = createEmptyAreal();
    areal.budovy[0].kurenePlynom = 1;
    areal.budovy[0].tepelneCerpadlo = 0;
    areal.budovy[0].uzitkovaPlochaNUS = 800;

    expect(prispevokEnergia(areal, 'energia_plyn_potencial_tc')).toBe(800 * 6);
  });

  it('plynom kúrená budova ponúka aj cestu na biomasu, s polovičnou váhou (issue #182)', () => {
    const areal = createEmptyAreal();
    areal.budovy[0].kurenePlynom = 1;
    areal.budovy[0].uzitkovaPlochaNUS = 800;

    expect(prispevokEnergia(areal, 'energia_plyn_potencial_biomasa')).toBe(800 * 3);
  });

  it('dve budovy s rovnakou celkovou plochou dajú rovnaké skóre ako jedna veľká (issue #180)', () => {
    const jedna = createEmptyAreal();
    jedna.budovy[0].kurenieElektrinou = 1;
    jedna.budovy[0].uzitkovaPlochaNUS = 1000;

    const dve = createEmptyAreal();
    dve.budovy[0].kurenieElektrinou = 1;
    dve.budovy[0].uzitkovaPlochaNUS = 400;
    dve.budovy.push({ ...createEmptyAreal().budovy[0], kurenieElektrinou: 1, uzitkovaPlochaNUS: 600 });

    expect(computeAreaComparisonScore(dve).energia).toBe(computeAreaComparisonScore(jedna).energia);
  });

  it('vystavbaPred1980 prispieva do energetického skóre plochou budovy s váhou 4', () => {
    const areal = createEmptyAreal();
    areal.budovy[0].vystavbaPred1980 = 1;
    areal.budovy[0].uzitkovaPlochaNUS = 250;

    expect(prispevokEnergia(areal, 'energia_vystavba_pred_1980')).toBe(250 * 4);
  });

  it('prechod plyn → biomasa sa nezapočíta budove, ktorá už biomasu má (issue #182)', () => {
    const areal = createEmptyAreal();
    areal.budovy[0].kurenePlynom = 1;
    areal.budovy[0].kureniePeletami = 1;
    areal.budovy[0].uzitkovaPlochaNUS = 500;

    expect(prispevokEnergia(areal, 'energia_plyn_potencial_biomasa')).toBe(0);
  });

  it('existujúce tepelné čerpadlo znižuje skóre podľa plochy budovy (issue #180)', () => {
    const areal = createEmptyAreal();
    areal.budovy[0].tepelneCerpadlo = 1;
    areal.budovy[0].uzitkovaPlochaNUS = 300;

    expect(prispevokEnergia(areal, 'energia_odratat_tc')).toBe(300 * -1);
  });

  it('FV potenciál striech počíta iba z plochých / málo šikmých striech do 15° (issue #179)', () => {
    const plocha = createEmptyAreal();
    plocha.budovy[0].strechaTyp = 1;
    plocha.budovy[0].strechaOrientovanaPlochaNaJuh = 200;
    plocha.budovy[0].strechaZateplenie = 1;
    plocha.budovy[0].zateplenieFasady = 1;
    expect(computeAreaComparisonScore(plocha).energia).toBe(200 * 10);

    const sikma = createEmptyAreal();
    sikma.budovy[0].strechaTyp = 2;
    sikma.budovy[0].strechaOrientovanaPlochaNaJuh = 200;
    sikma.budovy[0].strechaZateplenie = 1;
    sikma.budovy[0].zateplenieFasady = 1;
    expect(computeAreaComparisonScore(sikma).energia).toBe(0);
  });

  it('nezateplená obálka sa počíta z celého obvodového plášťa, nie z južnej fasády (issue #176)', () => {
    const areal = createEmptyAreal();
    areal.budovy[0].zateplenieFasady = 0;
    areal.budovy[0].strechaZateplenie = 1; // strecha zateplená → do parametra ide iba fasáda
    areal.budovy[0].plochaObvodovehoPlasta = 900;
    areal.budovy[0].fasadaOrientovanaNaJuh = 100;

    const score = computeAreaComparisonScore(areal);
    // váha 8 pre nezateplenú obálku, −2 za zateplenú strechu s pôdorysom 0 → 0
    expect(score.energia).toBe(900 * 8);
  });

  it('rovnaká obálka s inou južnou orientáciou dáva rovnaký potenciál (issue #176)', () => {
    const a = createEmptyAreal();
    a.budovy[0].zateplenieFasady = 0;
    a.budovy[0].strechaZateplenie = 1;
    a.budovy[0].plochaObvodovehoPlasta = 900;
    a.budovy[0].fasadaOrientovanaNaJuh = 400;

    const b = createEmptyAreal();
    b.budovy[0].zateplenieFasady = 0;
    b.budovy[0].strechaZateplenie = 1;
    b.budovy[0].plochaObvodovehoPlasta = 900;
    b.budovy[0].fasadaOrientovanaNaJuh = 50;

    expect(computeAreaComparisonScore(a).energia).toBe(computeAreaComparisonScore(b).energia);
  });

  it('plocha pozemku vhodná pre FV vstupuje do energetického skóre s váhou 3 (issue #184)', () => {
    const areal = createEmptyAreal();
    areal.pozemky[0].plochaVhodnaPreFV = 500;

    const score = computeAreaComparisonScore(areal);
    expect(score.energia).toBe(500 * 3);
  });

  it('osvetlenie sa počíta z odhadu príkonu vo wattoch, nie z m² (issue #183)', () => {
    const areal = createEmptyAreal();
    areal.typObjektu = 'urad'; // kategória kancelárie → 6 W/m²
    areal.budovy[0].uzitkovaPlochaNUS = 1000;
    areal.budovy[0].osvetlenieLED = 0;

    // 1000 m² × 6 W/m² = 6000 W príkonu, celý nie-LED, váha 0,5
    expect(prispevokEnergia(areal, 'energia_osvetlenie_nie_led')).toBeCloseTo(6000 * 0.5);
    expect(prispevokEnergia(areal, 'energia_odratat_led')).toBeCloseTo(0);
  });

  it('typ objektu mení odhad príkonu osvetlenia — hala a predajňa rovnakej plochy nie sú rovnaké (issue #183)', () => {
    const hala = createEmptyAreal();
    hala.typObjektu = 'sklad'; // 5 W/m²
    hala.budovy[0].uzitkovaPlochaNUS = 1000;

    const predajna = createEmptyAreal();
    predajna.typObjektu = 'obchod'; // 12 W/m²
    predajna.budovy[0].uzitkovaPlochaNUS = 1000;

    expect(prispevokEnergia(hala, 'energia_osvetlenie_nie_led')).toBeCloseTo(5000 * 0.5);
    expect(prispevokEnergia(predajna, 'energia_osvetlenie_nie_led')).toBeCloseTo(12000 * 0.5);
  });

  it('podiel LED z počtu svietidiel má prednosť pred percentom (issue #183)', () => {
    const areal = createEmptyAreal();
    areal.typObjektu = 'urad';
    areal.budovy[0].uzitkovaPlochaNUS = 1000;
    areal.budovy[0].osvetlenieLED = 100;              // percento tvrdí 100 % LED
    areal.budovy[0].osvetleniePocetSvietidiel = 40;   // počet tvrdí 25 % LED
    areal.budovy[0].osvetleniePocetSvietidielLED = 10;

    expect(prispevokEnergia(areal, 'energia_osvetlenie_nie_led')).toBeCloseTo(6000 * 0.75 * 0.5);
    expect(prispevokEnergia(areal, 'energia_odratat_led')).toBeCloseTo(6000 * 0.25 * -0.17);
  });
});

describe('rankAreaComparisons', () => {
  it('priradí poradie #1 areálu s najvyššou hodnotou v každej oblasti', () => {
    const arealA = createEmptyAreal();
    arealA.nazov = 'A';
    arealA.pozemky[0].dazdovaZahradaPlocha = 0; // nižší potenciál sucha (nič neexistuje, ale aj nič netreba)

    const arealB = createEmptyAreal();
    arealB.nazov = 'B';
    arealB.pozemky[0].plochaBezBudov = 1000;
    arealB.pozemky[0].odvodVodyJednotnaKanalizacia = 100; // vysoký potenciál vo všetkých hrozbách

    const riadky = rankAreaComparisons([
      computeAreaComparisonScore(arealA),
      computeAreaComparisonScore(arealB),
    ]);

    const riadokB = riadky.find((r) => r.nazov === 'B')!;
    const riadokA = riadky.find((r) => r.nazov === 'A')!;

    expect(riadokB.poradieSucho).toBe(1);
    expect(riadokB.poradieVoda).toBe(1);
    expect(riadokA.poradieSucho).toBe(2);
    expect(riadokA.poradieVoda).toBe(2);
  });
});
