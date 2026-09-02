// Sezónne nevykurované stavby — záhradná chata, altánok, sklad náradia.
//
// Taká stavba je letné sídlo: užíva sa v teplej časti roka, nevykuruje sa
// a spravidla sa v nej ani nespáva. Zateplenie obálky, výmena okien, rekuperácia
// ani obnova zdroja tepla v nej nemajú zmysel — nie je čo šetriť. Preto sa
// vynecháva:
//
//  - z energetického skóre areálu (useScoring.ts, calculateEnergia) aj z podielu
//    „potenciál tepelného čerpadla" v OZE skóre,
//  - z návrhov opatrení na zateplenie, okná, rekuperáciu a vykurovanie
//    (useRecommendations.ts),
//  - z energetických parametrov porovnania areálov, ktoré merajú potenciál
//    zlepšenia obálky alebo vykurovania (comparisonWeights.ts).
//
// Naopak sa z nej NEvynecháva to, čo so sezónnosťou nesúvisí: plocha strechy
// vhodná pre fotovoltiku, zelená strecha, odvod zrážkovej vody a LED osvetlenie.
// Chata môže mať svetlá aj strechu vhodnú pre panely rovnako ako iná budova.

import { Budova } from '../types/areal';

/** Je budova sezónna nevykurovaná stavba, ktorú netreba hodnotiť energeticky? */
export function jeSezonnaNevykurovana(b: Budova): boolean {
  return b.sezonnaNevykurovana === 1;
}

/** Budovy, ktoré vstupujú do hodnotenia obálky a vykurovania. */
export function budovyNaEnergetickeHodnotenie<T extends Budova>(budovy: T[]): T[] {
  return budovy.filter((b) => !jeSezonnaNevykurovana(b));
}

/** Súčet cez budovy, ktoré sa hodnotia energeticky — sezónne stavby prispejú nulou. */
export function sumVykurovanych(budovy: Budova[], fn: (b: Budova) => number): number {
  return budovy.reduce((acc, b) => acc + (jeSezonnaNevykurovana(b) ? 0 : fn(b)), 0);
}
