import { describe, it, expect } from 'vitest';
import { createEmptyAreal, createEmptyBudova } from '../../types/areal';
import { computeBudovaEnPI, computeArealEnPI, getPocetOsob, parseKapacitaZariadenia } from '../energyIndicators';

describe('computeBudovaEnPI (issue #171)', () => {
  it('merná spotreba na vykurovanie sa počíta z nameranej spotreby a vykurovanej plochy (issue #181)', () => {
    const b = createEmptyBudova();
    b.uzitkovaPlochaNUS = 1000;
    b.vykurovanaPlocha = 800;
    b.kureniePlynSpotreba = 80_000;

    const e = computeBudovaEnPI(b);
    expect(e.spotrebaVykurovanie).toBe(80_000);
    expect(e.vykurovanaPlocha).toBe(800);
    expect(e.mernaSpotrebaVykurovanie).toBe(100);
  });

  it('bez vykurovanej plochy použije úžitkovú plochu', () => {
    const b = createEmptyBudova();
    b.uzitkovaPlochaNUS = 500;
    b.kurenieCZTSpotreba = 50_000;

    const e = computeBudovaEnPI(b);
    expect(e.mernaSpotrebaVykurovanie).toBe(100);
  });

  it('sčíta všetky zdroje kúrenia vrátane prepočtu tuhých palív na kWh', () => {
    const b = createEmptyBudova();
    b.vykurovanaPlocha = 100;
    b.kureniePlynSpotreba = 1_000;
    b.kureniePeletySpotreba_kg = 1_000; // × 4,8 = 4 800 kWh

    const e = computeBudovaEnPI(b);
    expect(e.spotrebaVykurovanie).toBe(5_800);
    expect(e.mernaSpotrebaVykurovanie).toBe(58);
  });

  it('merná spotreba elektriny je vztiahnutá na úžitkovú plochu a vedie sa oddelene od vykurovania', () => {
    const b = createEmptyBudova();
    b.uzitkovaPlochaNUS = 1000;
    b.vykurovanaPlocha = 500;
    b.spotrebaElektriny = 20_000;

    const e = computeBudovaEnPI(b);
    expect(e.mernaSpotrebaElektrina).toBe(20);
    expect(e.mernaSpotrebaVykurovanie).toBeUndefined();
  });

  it('spotreba na hodinu prevádzky = spotreba / (dni × hodiny denne)', () => {
    const b = createEmptyBudova();
    b.vyuzitieDniVRoku = 200;
    b.vyuzitieHodinDenne = 10;
    b.kureniePlynSpotreba = 40_000;
    b.spotrebaElektriny = 10_000;

    const e = computeBudovaEnPI(b);
    expect(e.hodinyPrevadzky).toBe(2_000);
    expect(e.vykurovanieNaHodinu).toBe(20);
    expect(e.elektrinaNaHodinu).toBe(5);
  });

  it('bez plochy alebo bez spotreby ukazovateľ nevráti (nedelí nulou)', () => {
    const b = createEmptyBudova();
    b.kureniePlynSpotreba = 1_000;
    expect(computeBudovaEnPI(b).mernaSpotrebaVykurovanie).toBeUndefined();

    const b2 = createEmptyBudova();
    b2.vykurovanaPlocha = 100;
    expect(computeBudovaEnPI(b2).mernaSpotrebaVykurovanie).toBeUndefined();
    expect(computeBudovaEnPI(b2).vykurovanieNaHodinu).toBeUndefined();
  });
});

describe('getPocetOsob', () => {
  it('vyparsuje číslo z textovej kapacity zariadenia', () => {
    expect(parseKapacitaZariadenia('450 žiakov')).toBe(450);
    expect(parseKapacitaZariadenia('cca 120 lôžok')).toBe(120);
    expect(parseKapacitaZariadenia('')).toBe(0);
    expect(parseKapacitaZariadenia('neuvedené')).toBe(0);
  });

  it('osoby = zamestnanci + kapacita × obsadenosť', () => {
    expect(getPocetOsob({ pocetZamestnancov: 30, kapacitaZariadenia: '400 žiakov', aktualnaObsadenost: 50 })).toBe(230);
  });

  it('bez obsadenosti počíta s plnou kapacitou', () => {
    expect(getPocetOsob({ pocetZamestnancov: 10, kapacitaZariadenia: '100', aktualnaObsadenost: 0 })).toBe(110);
  });
});

describe('computeArealEnPI', () => {
  it('sumuje budovy a počíta spotrebu na osobu', () => {
    const areal = createEmptyAreal();
    areal.pocetZamestnancov = 20;
    areal.kapacitaZariadenia = '180 žiakov';
    areal.aktualnaObsadenost = 100;

    const b1 = createEmptyBudova();
    b1.vykurovanaPlocha = 1000;
    b1.kureniePlynSpotreba = 100_000;
    b1.spotrebaElektriny = 30_000;
    b1.uzitkovaPlochaNUS = 1000;
    b1.spotrebaRok = 2025;

    const b2 = createEmptyBudova();
    b2.vykurovanaPlocha = 500;
    b2.kurenieCZTSpotreba = 80_000;
    b2.uzitkovaPlochaNUS = 600;
    b2.spotrebaRok = 2025;

    areal.budovy = [b1, b2];
    const e = computeArealEnPI(areal);

    expect(e.spotrebaVykurovanie).toBe(180_000);
    expect(e.vykurovanaPlocha).toBe(1500);
    expect(e.mernaSpotrebaVykurovanie).toBe(120);
    expect(e.pocetOsob).toBe(200);
    expect(e.vykurovanieNaOsobu).toBe(900);
    expect(e.elektrinaNaOsobu).toBe(150);
    expect(e.roky).toEqual([2025]);
  });

  it('budova bez zadanej spotreby nevstupuje do menovateľa mernej spotreby areálu', () => {
    const areal = createEmptyAreal();
    const b1 = createEmptyBudova();
    b1.vykurovanaPlocha = 1000;
    b1.kureniePlynSpotreba = 100_000;
    const prazdna = createEmptyBudova();
    prazdna.vykurovanaPlocha = 5000;
    areal.budovy = [b1, prazdna];

    expect(computeArealEnPI(areal).mernaSpotrebaVykurovanie).toBe(100);
  });
});
