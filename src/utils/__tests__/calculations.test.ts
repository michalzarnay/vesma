import { describe, it, expect } from 'vitest';
import { createEmptyBudova } from '../../types/areal';
import {
  getPlochaStrechyPreFV, getVykurovanaPlocha, getPlochaObvodovehoPlasta, getTotalHeatingCost, VYSKA_PODLAZIA_M,
} from '../calculations';

describe('getPlochaStrechyPreFV (issue #179)', () => {
  it('započíta plochú / málo šikmú strechu do 15°', () => {
    const b = createEmptyBudova();
    b.strechaTyp = 1;
    b.strechaOrientovanaPlochaNaJuh = 300;
    expect(getPlochaStrechyPreFV(b)).toBe(300);
  });

  it('šikmú (16–35°) ani strmú strechu nezapočíta, aj keď je orientovaná na juh', () => {
    const sikma = createEmptyBudova();
    sikma.strechaTyp = 2;
    sikma.strechaOrientovanaPlochaNaJuh = 300;
    expect(getPlochaStrechyPreFV(sikma)).toBe(0);

    const strma = createEmptyBudova();
    strma.strechaTyp = 3;
    strma.strechaOrientovanaPlochaNaJuh = 300;
    expect(getPlochaStrechyPreFV(strma)).toBe(0);
  });
});

describe('getVykurovanaPlocha (issue #181)', () => {
  it('použije vykurovanú plochu, ak je zadaná, inak úžitkovú', () => {
    const b = createEmptyBudova();
    b.uzitkovaPlochaNUS = 1000;
    expect(getVykurovanaPlocha(b)).toBe(1000);
    b.vykurovanaPlocha = 700;
    expect(getVykurovanaPlocha(b)).toBe(700);
  });
});

describe('getPlochaObvodovehoPlasta (issue #176)', () => {
  it('použije zadanú plochu obvodového plášťa', () => {
    const b = createEmptyBudova();
    b.plochaObvodovehoPlasta = 1200;
    b.plochaPodorysu = 400;
    expect(getPlochaObvodovehoPlasta(b)).toBe(1200);
  });

  it('bez zadania odhadne plochu z pôdorysu a počtu podlaží (úžitková / pôdorys)', () => {
    const b = createEmptyBudova();
    b.plochaPodorysu = 400; // obvod 4·√400 = 80 m
    b.uzitkovaPlochaNUS = 1200; // 3 podlažia
    expect(getPlochaObvodovehoPlasta(b)).toBeCloseTo(80 * 3 * VYSKA_PODLAZIA_M);
  });

  it('bez úžitkovej plochy počíta s jedným podlažím; bez pôdorysu vráti 0', () => {
    const b = createEmptyBudova();
    b.plochaPodorysu = 100; // obvod 40 m
    expect(getPlochaObvodovehoPlasta(b)).toBeCloseTo(40 * VYSKA_PODLAZIA_M);
    expect(getPlochaObvodovehoPlasta(createEmptyBudova())).toBe(0);
  });
});

describe('getTotalHeatingCost (issue #173)', () => {
  it('sčíta ročné náklady všetkých médií, CZT ako spotreba × cena', () => {
    const b = createEmptyBudova();
    b.kureniePlynNakladyRok = 1000;
    b.kurenieElektrinaNakladyRok = 200;
    b.tepelneCerpadloNakladyRok = 300;
    b.kureniePeletyNakladyRok = 400;
    b.kurenieStiepkaNakladyRok = 50;
    b.kurenieUhlimDrevomNakladyRok = 60;
    b.kurenieCZTSpotreba = 10_000;
    b.kurenieCZTCenaKWh = 0.12;
    expect(getTotalHeatingCost(b)).toBeCloseTo(1000 + 200 + 300 + 400 + 50 + 60 + 1200);
  });
});
