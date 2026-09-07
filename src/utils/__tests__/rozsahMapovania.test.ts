import { describe, expect, it } from 'vitest';
import { createEmptyAreal, createEmptyBudova, createEmptyPozemok } from '../../types/areal';
import { mapujeEnergiu, mapujeVodu } from '../rozsahMapovania';
import { calculateEnergia, calculateOZE, computeScore } from '../../hooks/useScoring';
import { calculateMZI } from '../mziKlimasken';
import {
  dovodNehodnoteniaEnergetiky, dovodNehodnoteniaOZE, hodnoteneOblasti, saHodnotiMZI, vazeneCelkoveSkore,
} from '../../types/scoring';
import { computeRecommendations, jeVRozsahu } from '../../hooks/useRecommendations';
import { migrateAreal } from '../../hooks/useArealState';
import { chybajuceNovePolia } from '../schemaVersion';
import { vysvetleniaMZI, chybajuceUdajeMZI } from '../skoreVysvetlenie';

/**
 * Rozsah mapovania (voda / energia / oboje) — jedno pravidlo, ktoré musí
 * platiť všade: mimo rozsahu sa nič nehodnotí, neodporúča ani nepripomína.
 * Relácie spred zavedenia rozsahu sa správajú ako „oboje".
 */

function arealSBudovou() {
  const areal = createEmptyAreal();
  const pozemok = createEmptyPozemok();
  pozemok.celkovaVymera = 1000;
  pozemok.plochaBezBudov = 800;
  pozemok.spevnenaPlochaCelkom = 600; // >15 % → MZI odporúčania
  pozemok.priepustnaPlochaCelkom = 200;
  const budova = createEmptyBudova();
  budova.nazov = 'Škola';
  budova.plochaPodorysu = 400;
  budova.uzitkovaPlochaNUS = 800;
  budova.strechaTyp = 1;
  budova.strechaOrientovanaPlochaNaJuh = 300; // FV odporúčanie
  budova.zateplenieFasady = 0; // zateplenie odporúčanie
  areal.pozemky = [pozemok];
  areal.budovy = [budova];
  return areal;
}

describe('predikáty rozsahu mapovania', () => {
  it('„oboje" mapuje vodu aj energiu', () => {
    expect(mapujeVodu('oboje')).toBe(true);
    expect(mapujeEnergiu('oboje')).toBe(true);
  });
  it('„voda" mapuje len vodu, „energia" len energiu', () => {
    expect(mapujeVodu('voda')).toBe(true);
    expect(mapujeEnergiu('voda')).toBe(false);
    expect(mapujeVodu('energia')).toBe(false);
    expect(mapujeEnergiu('energia')).toBe(true);
  });
  it('prijíma aj areál', () => {
    const areal = createEmptyAreal();
    areal.rozsahMapovania = 'voda';
    expect(mapujeEnergiu(areal)).toBe(false);
  });
});

describe('predvolený rozsah', () => {
  it('nový areál mapuje oboje', () => {
    expect(createEmptyAreal().rozsahMapovania).toBe('oboje');
  });
  it('relácia spred zavedenia rozsahu sa načíta ako „oboje"', () => {
    const stara = { ...createEmptyAreal() } as Record<string, unknown>;
    delete stara.rozsahMapovania;
    expect(migrateAreal(stara).rozsahMapovania).toBe('oboje');
  });
  it('uložený rozsah sa zachová', () => {
    const areal = createEmptyAreal();
    areal.rozsahMapovania = 'voda';
    expect(migrateAreal(areal).rozsahMapovania).toBe('voda');
  });
});

describe('skóre podľa rozsahu', () => {
  it('„oboje" hodnotí rovnako ako doteraz — všetky tri oblasti', () => {
    const score = computeScore(arealSBudovou());
    expect(hodnoteneOblasti(score).map((o) => o.oblast)).toEqual(['mzi', 'oze', 'energia']);
    expect(score.mzi.mimoRozsahu).toBe(false);
    expect(score.oze.mimoRozsahu).toBe(false);
    expect(score.energia.mimoRozsahu).toBe(false);
  });

  it('„len voda": OZE a energetika sú mimo rozsahu, celkové skóre je čisto MZI', () => {
    const areal = arealSBudovou();
    areal.rozsahMapovania = 'voda';
    const score = computeScore(areal);
    expect(calculateOZE(areal).mimoRozsahu).toBe(true);
    expect(calculateEnergia(areal).mimoRozsahu).toBe(true);
    expect(dovodNehodnoteniaOZE(score.oze)).toBe('mimoRozsahu');
    expect(dovodNehodnoteniaEnergetiky(score.energia)).toBe('mimoRozsahu');
    expect(hodnoteneOblasti(score).map((o) => o.oblast)).toEqual(['mzi']);
    expect(score.celkove).toBe(score.mzi.celkove);
    expect(vazeneCelkoveSkore(score, { mzi: 1, oze: 5, energia: 5 })).toBe(score.mzi.celkove);
  });

  it('„len voda" nemení MZI skóre oproti „oboje"', () => {
    const oboje = arealSBudovou();
    const voda = arealSBudovou();
    voda.rozsahMapovania = 'voda';
    expect(computeScore(voda).mzi.celkove).toBe(computeScore(oboje).mzi.celkove);
  });

  it('„len energia": MZI je mimo rozsahu a nevstupuje do skóre ani vysvetlení', () => {
    const areal = arealSBudovou();
    areal.rozsahMapovania = 'energia';
    const score = computeScore(areal);
    const mzi = calculateMZI(areal);
    expect(mzi.mimoRozsahu).toBe(true);
    expect(saHodnotiMZI(mzi)).toBe(false);
    expect(hodnoteneOblasti(score).map((o) => o.oblast)).toEqual(['oze', 'energia']);
    expect(vysvetleniaMZI(areal, mzi)).toEqual([]);
    expect(chybajuceUdajeMZI(areal, mzi).size).toBe(0);
  });

  it('„len energia" bez budov: nič sa nehodnotí a skóre je 0, nie NaN', () => {
    const areal = createEmptyAreal();
    areal.rozsahMapovania = 'energia';
    areal.budovy = [];
    const score = computeScore(areal);
    expect(hodnoteneOblasti(score)).toEqual([]);
    expect(score.celkove).toBe(0);
    expect(vazeneCelkoveSkore(score, areal.vahy)).toBe(0);
  });
});

describe('odporúčania podľa rozsahu', () => {
  it('kategória MZI patrí k vode, OZE a ENERGETIKA k energii', () => {
    const voda = createEmptyAreal();
    voda.rozsahMapovania = 'voda';
    expect(jeVRozsahu('MZI', voda)).toBe(true);
    expect(jeVRozsahu('OZE', voda)).toBe(false);
    expect(jeVRozsahu('ENERGETIKA', voda)).toBe(false);
    const energia = createEmptyAreal();
    energia.rozsahMapovania = 'energia';
    expect(jeVRozsahu('MZI', energia)).toBe(false);
    expect(jeVRozsahu('OZE', energia)).toBe(true);
    expect(jeVRozsahu('ENERGETIKA', energia)).toBe(true);
  });

  it('„len voda" neodporúča energetické opatrenia, „len energia" vodné', () => {
    const oboje = computeRecommendations(arealSBudovou());
    expect(oboje.some((r) => r.opatrenie.kategoria === 'MZI')).toBe(true);
    expect(oboje.some((r) => r.opatrenie.kategoria !== 'MZI')).toBe(true);

    const voda = arealSBudovou();
    voda.rozsahMapovania = 'voda';
    const lenVoda = computeRecommendations(voda);
    expect(lenVoda.length).toBeGreaterThan(0);
    expect(lenVoda.every((r) => r.opatrenie.kategoria === 'MZI')).toBe(true);

    const energia = arealSBudovou();
    energia.rozsahMapovania = 'energia';
    const lenEnergia = computeRecommendations(energia);
    expect(lenEnergia.length).toBeGreaterThan(0);
    expect(lenEnergia.every((r) => r.opatrenie.kategoria !== 'MZI')).toBe(true);
  });
});

describe('pripomienka nových polí podľa rozsahu', () => {
  it('energetické polia sa pri „len voda" nepripomínajú', () => {
    const areal = arealSBudovou();
    areal.schemaVersion = 1; // staršia relácia, energetické polia (#177) na „neviem"
    expect(chybajuceNovePolia(areal).length).toBeGreaterThan(0);
    areal.rozsahMapovania = 'voda';
    expect(chybajuceNovePolia(areal)).toEqual([]);
  });
});
