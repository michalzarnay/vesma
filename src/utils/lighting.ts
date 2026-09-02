// Osvetlenie — podiel LED a odhad inštalovaného príkonu (issue #183).
//
// VESMA eviduje osvetlenie dvoma spôsobmi:
//  1. počet svietidiel celkom a z toho LED — presnejšie, uprednostňuje sa,
//  2. percento LED (`osvetlenieLED`) — záložný údaj, keď počet nie je známy.
//
// Príkon vo wattoch sa odhaduje z plochy budovy cez konfiguračnú tabuľku
// (src/data/lightingPowerDensity.ts), lebo VESMA nezbiera príkon jednotlivých
// svietidiel. Ide o odhad — pozri docs/osvetlenie-prepocet.md.

import { Budova } from '../types/areal';
import { hustotaPrikonuOsvetlenia } from '../data/lightingPowerDensity';

/** Uložené relácie spred issue #183 nové polia nemajú — čítame ich obozretne. */
function pocetCelkom(b: Budova): number {
  return b.osvetleniePocetSvietidiel ?? 0;
}

function pocetLED(b: Budova): number {
  return b.osvetleniePocetSvietidielLED ?? 0;
}

/** Je podiel LED známy z počtu svietidiel (presnejší údaj), alebo len z percenta? */
export function maPocetSvietidiel(b: Budova): boolean {
  return pocetCelkom(b) > 0;
}

/**
 * Podiel LED svietidiel (0–1). Z počtu kusov, ak je zadaný, inak z percenta.
 * Počet LED väčší než celkový počet sa oreže — chyba v zadaní nesmie skresliť skóre.
 */
export function podielLED(b: Budova): number {
  const celkom = pocetCelkom(b);
  if (celkom > 0) return Math.min(pocetLED(b), celkom) / celkom;
  return Math.min(Math.max(b.osvetlenieLED, 0), 100) / 100;
}

/** Počet svietidiel, ktoré ešte nie sú LED. Nula, keď počet svietidiel nie je zadaný. */
export function pocetNieLedSvietidiel(b: Budova): number {
  const celkom = pocetCelkom(b);
  if (celkom === 0) return 0;
  return Math.max(0, celkom - Math.min(pocetLED(b), celkom));
}

/**
 * Odhad inštalovaného príkonu osvetlenia budovy [W] — plocha × hustota príkonu
 * podľa typu objektu. Používa sa ako spoločná jednotka pre váhy porovnania,
 * aby sa osvetlenie nesčítavalo v m² spolu so strechami a obálkou.
 */
export function odhadPrikonuOsvetleniaW(b: Budova, typObjektu?: string): number {
  return b.uzitkovaPlochaNUS * hustotaPrikonuOsvetlenia(typObjektu);
}

/** Odhad inštalovaného príkonu nie-LED osvetlenia [W] — potenciál výmeny za LED. */
export function prikonNieLedOsvetleniaW(b: Budova, typObjektu?: string): number {
  return odhadPrikonuOsvetleniaW(b, typObjektu) * (1 - podielLED(b));
}

/** Odhad inštalovaného príkonu už vymeneného LED osvetlenia [W]. */
export function prikonLedOsvetleniaW(b: Budova, typObjektu?: string): number {
  return odhadPrikonuOsvetleniaW(b, typObjektu) * podielLED(b);
}
