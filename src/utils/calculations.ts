import { Budova, Pozemok, Areal } from '../types/areal';
import { FUEL_CONVERSIONS } from '../data/constants';

// Building category by uzitkovaPlochaNUS
export function getBuildingCategory(uzitkova: number): 'S' | 'M' | 'L' {
  if (uzitkova <= 500) return 'S';
  if (uzitkova <= 1500) return 'M';
  return 'L';
}

// Green roof potential = podorys area if flat roof
export function getGreenRoofPotential(budova: Budova): number | null {
  return budova.strechaTyp === 1 ? budova.plochaPodorysu : null;
}

// Fuel consumption conversion to kWh
export function convertFuelToKWh(kg: number, fuelType: 'pelety' | 'stiepka' | 'uhlie' | 'drevo'): number {
  return kg * FUEL_CONVERSIONS[fuelType];
}

// Total heating consumption for a building
export function getTotalHeatingConsumption(budova: Budova): number {
  let total = budova.kureniePlynSpotreba + budova.kurenieElektrinaSpotreba + budova.tepelneCerpadloSpotreba;

  total += budova.kureniePeletySpotreba_kg * FUEL_CONVERSIONS.pelety;
  total += budova.kurenieStiepkaSpotreba_kg * FUEL_CONVERSIONS.stiepka;

  if (budova.kurenieUhlimDrevom === 1) {
    total += budova.kurenieUhlimDrevomSpotreba_kg * FUEL_CONVERSIONS.uhlie;
  } else if (budova.kurenieUhlimDrevom === 2) {
    total += budova.kurenieUhlimDrevomSpotreba_kg * FUEL_CONVERSIONS.drevo;
  }

  total += budova.kurenieCZTSpotreba;
  return total;
}

// Weighted average of water drainage across pozemky
export function getWeightedWaterDrainage(pozemky: Pozemok[]): {
  kanalizacia: number;
  vodnyTok: number;
  vsakovanie: number;
  nerieseny: number;
} {
  let totalPlocha = 0;
  let wKan = 0, wVod = 0, wVsak = 0, wNer = 0;

  for (const p of pozemky) {
    const plocha = p.plochaBezBudov || p.celkovaVymera;
    totalPlocha += plocha;
    wKan += (p.odvodVodyKanalizacia ?? 0) * plocha;
    wVod += p.odvodVodyVodnyTok * plocha;
    wVsak += p.odvodVodyVsakovanie * plocha;
    wNer += p.odvodVodyNerieseny * plocha;
  }

  if (totalPlocha === 0) return { kanalizacia: 0, vodnyTok: 0, vsakovanie: 0, nerieseny: 0 };

  return {
    kanalizacia: wKan / totalPlocha,
    vodnyTok: wVod / totalPlocha,
    vsakovanie: wVsak / totalPlocha,
    nerieseny: wNer / totalPlocha,
  };
}

// Total areal area stats
export function getArealStats(areal: Areal) {
  let totalPlocha = 0;
  let totalPriepustna = 0;
  let totalPolopriepustna = 0;
  let totalSpevnena = 0;
  let totalZastavana = 0;

  for (const p of areal.pozemky) {
    totalPlocha += p.celkovaVymera;
    totalPriepustna += p.priepustnaPlochaCelkom;
    totalPolopriepustna += p.polopriepustnaPlochaCelkom;
    totalSpevnena += p.spevnenaPlochaCelkom;
  }

  for (const b of areal.budovy) {
    totalZastavana += b.plochaPodorysu;
  }

  return { totalPlocha, totalPriepustna, totalPolopriepustna, totalSpevnena, totalZastavana };
}

// FV potential calculation
export function getFVPotential(juznaPlochm2: number): { kWp: number; kWhRok: number } {
  const kWp = juznaPlochm2 * 0.15;
  const kWhRok = kWp * 1050;
  return { kWp: Math.round(kWp * 10) / 10, kWhRok: Math.round(kWhRok) };
}

/**
 * Plocha strechy vhodná pre FV (issue #179, pripomienka energetického experta):
 * do výpočtu sa započíta iba plochá alebo málo šikmá strecha do 15° (strechaTyp === 1),
 * kde sa panely natočia ľubovoľne a orientácia budovy nie je rozhodujúca. Pri šikmej
 * a strmej streche rozhoduje orientácia a sklon, ktoré VESMA spoľahlivo nezachytáva,
 * preto sa nezapočítavajú.
 *
 * Pri plochej streche pole `strechaOrientovanaPlochaNaJuh` znamená „využiteľná plocha
 * strechy" (pozri roofOrientationText.ts), preto sa použije ako vstup.
 */
export function getPlochaStrechyPreFV(budova: Budova): number {
  return budova.strechaTyp === 1 ? budova.strechaOrientovanaPlochaNaJuh : 0;
}

/** Vykurovaná plocha budovy (issue #181); ak nie je vyplnená, použije sa úžitková plocha. */
export function getVykurovanaPlocha(budova: Budova): number {
  return budova.vykurovanaPlocha > 0 ? budova.vykurovanaPlocha : budova.uzitkovaPlochaNUS;
}

/** Predpokladaná konštrukčná výška jedného podlažia pre odhad plochy fasády. */
export const VYSKA_PODLAZIA_M = 3.3;

/**
 * Plocha obvodového plášťa (celá fasáda, všetky orientácie) — issue #176.
 * Ak je zadaná (`plochaObvodovehoPlasta` > 0), použije sa priamo. Inak sa odhadne
 * z pôdorysu: obvod štvorcového pôdorysu (4·√pôdorys) × výška budovy, kde počet
 * podlaží sa odvodí ako úžitková plocha / pôdorys (najmenej 1 podlažie).
 */
export function getPlochaObvodovehoPlasta(budova: Budova): number {
  if (budova.plochaObvodovehoPlasta > 0) return budova.plochaObvodovehoPlasta;
  if (budova.plochaPodorysu <= 0) return 0;
  const podlazia = budova.uzitkovaPlochaNUS > 0
    ? Math.max(1, Math.round(budova.uzitkovaPlochaNUS / budova.plochaPodorysu))
    : 1;
  const obvod = 4 * Math.sqrt(budova.plochaPodorysu);
  return obvod * podlazia * VYSKA_PODLAZIA_M;
}

/** Celkové ročné náklady na všetky zdroje kúrenia v EUR (issue #173); CZT = spotreba × cena. */
export function getTotalHeatingCost(budova: Budova): number {
  return (
    budova.kureniePlynNakladyRok +
    budova.kurenieElektrinaNakladyRok +
    budova.tepelneCerpadloNakladyRok +
    budova.kureniePeletyNakladyRok +
    budova.kurenieStiepkaNakladyRok +
    budova.kurenieUhlimDrevomNakladyRok +
    budova.kurenieCZTSpotreba * budova.kurenieCZTCenaKWh
  );
}
