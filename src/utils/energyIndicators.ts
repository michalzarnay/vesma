// Ukazovatele energetickej hospodárnosti (EnPI) — issue #171.
//
// Všetky hodnoty vychádzajú z NAMERANEJ spotreby (z faktúr), ktorú používateľ zadal
// vo formulári budovy. Nie sú to vypočítané potreby energie z energetického certifikátu —
// tie sú iná veličina (normované podmienky užívania a klímy) a nesmú sa s nameranou
// spotrebou miešať do jedného ukazovateľa. Klimatická normalizácia (dennostupňová
// metóda) ani zaradenie do kategórie podľa referenčnej hodnoty sa tu nerobia.
//
// Vykurovanie a elektrina sa vedú oddelene, lebo pole „spotreba elektriny" môže
// zahŕňať aj elektrinu na vykurovanie — súčet by ju mohol započítať dvakrát.

import { Areal, Budova } from '../types/areal';
import { getTotalHeatingConsumption, getVykurovanaPlocha } from './calculations';

export interface BudovaEnPI {
  /** Nameraná ročná spotreba všetkých zdrojov kúrenia (kWh/rok). */
  spotrebaVykurovanie: number;
  /** Nameraná ročná spotreba elektriny (kWh/rok). */
  spotrebaElektrina: number;
  /** Vykurovaná plocha použitá ako menovateľ (m²); ak nie je zadaná, úžitková plocha. */
  vykurovanaPlocha: number;
  /** Úžitková plocha (m²) — menovateľ pre elektrinu. */
  uzitkovaPlocha: number;
  /** Merná spotreba na vykurovanie, kWh/(m²·rok) na vykurovanú plochu. */
  mernaSpotrebaVykurovanie?: number;
  /** Merná spotreba elektriny, kWh/(m²·rok) na úžitkovú plochu. */
  mernaSpotrebaElektrina?: number;
  /** Hodiny prevádzky za rok = dni v roku × hodín denne. */
  hodinyPrevadzky?: number;
  /** Spotreba na vykurovanie na hodinu prevádzky (kWh/h). */
  vykurovanieNaHodinu?: number;
  /** Spotreba elektriny na hodinu prevádzky (kWh/h). */
  elektrinaNaHodinu?: number;
}

export interface ArealEnPI {
  budovy: Array<{ budova: Budova; enpi: BudovaEnPI }>;
  spotrebaVykurovanie: number;
  spotrebaElektrina: number;
  vykurovanaPlocha: number;
  uzitkovaPlocha: number;
  mernaSpotrebaVykurovanie?: number;
  mernaSpotrebaElektrina?: number;
  /** Počet osôb v areáli (zamestnanci + klienti/žiaci podľa kapacity a obsadenosti). */
  pocetOsob: number;
  vykurovanieNaOsobu?: number;
  elektrinaNaOsobu?: number;
  /** Roky, za ktoré sú spotreby uvedené (bez duplicít, bez 0). */
  roky: number[];
}

function podiel(citatel: number, menovatel: number): number | undefined {
  return citatel > 0 && menovatel > 0 ? citatel / menovatel : undefined;
}

export function computeBudovaEnPI(b: Budova): BudovaEnPI {
  const spotrebaVykurovanie = getTotalHeatingConsumption(b);
  const spotrebaElektrina = b.spotrebaElektriny;
  const vykurovanaPlocha = getVykurovanaPlocha(b);
  const uzitkovaPlocha = b.uzitkovaPlochaNUS;
  const hodiny = b.vyuzitieDniVRoku * b.vyuzitieHodinDenne;

  return {
    spotrebaVykurovanie,
    spotrebaElektrina,
    vykurovanaPlocha,
    uzitkovaPlocha,
    mernaSpotrebaVykurovanie: podiel(spotrebaVykurovanie, vykurovanaPlocha),
    mernaSpotrebaElektrina: podiel(spotrebaElektrina, uzitkovaPlocha),
    hodinyPrevadzky: hodiny > 0 ? hodiny : undefined,
    vykurovanieNaHodinu: podiel(spotrebaVykurovanie, hodiny),
    elektrinaNaHodinu: podiel(spotrebaElektrina, hodiny),
  };
}

/**
 * Kapacita zariadenia je voľný text („450 žiakov") — vezme sa prvé číslo v ňom.
 * Vráti 0, ak text neobsahuje číslo.
 */
export function parseKapacitaZariadenia(text: string): number {
  const m = /\d+([.,]\d+)?/.exec(text ?? '');
  if (!m) return 0;
  const n = parseFloat(m[0].replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/**
 * Počet osôb pre ukazovateľ kWh/osobu/rok: zamestnanci + klienti/žiaci.
 * Klienti = kapacita zariadenia × aktuálna obsadenosť (%); ak obsadenosť nie je
 * vyplnená, počíta sa s plnou kapacitou.
 */
export function getPocetOsob(areal: Pick<Areal, 'pocetZamestnancov' | 'kapacitaZariadenia' | 'aktualnaObsadenost'>): number {
  const kapacita = parseKapacitaZariadenia(areal.kapacitaZariadenia);
  const klienti = areal.aktualnaObsadenost > 0 ? kapacita * (areal.aktualnaObsadenost / 100) : kapacita;
  return Math.round((areal.pocetZamestnancov || 0) + klienti);
}

export function computeArealEnPI(areal: Areal): ArealEnPI {
  const budovy = areal.budovy.map((budova) => ({ budova, enpi: computeBudovaEnPI(budova) }));
  const sum = (fn: (e: BudovaEnPI) => number) => budovy.reduce((acc, x) => acc + fn(x.enpi), 0);

  const spotrebaVykurovanie = sum((e) => e.spotrebaVykurovanie);
  const spotrebaElektrina = sum((e) => e.spotrebaElektrina);
  // Do menovateľa idú len budovy, ktoré majú zadanú spotrebu — inak by prázdna
  // budova s plochou umelo znižovala mernú spotrebu areálu.
  const vykurovanaPlocha = budovy.reduce((acc, x) => acc + (x.enpi.spotrebaVykurovanie > 0 ? x.enpi.vykurovanaPlocha : 0), 0);
  const uzitkovaPlocha = budovy.reduce((acc, x) => acc + (x.enpi.spotrebaElektrina > 0 ? x.enpi.uzitkovaPlocha : 0), 0);
  const pocetOsob = getPocetOsob(areal);
  const roky = Array.from(new Set(areal.budovy.map((b) => b.spotrebaRok).filter((r) => r > 0))).sort();

  return {
    budovy,
    spotrebaVykurovanie,
    spotrebaElektrina,
    vykurovanaPlocha,
    uzitkovaPlocha,
    mernaSpotrebaVykurovanie: podiel(spotrebaVykurovanie, vykurovanaPlocha),
    mernaSpotrebaElektrina: podiel(spotrebaElektrina, uzitkovaPlocha),
    pocetOsob,
    vykurovanieNaOsobu: podiel(spotrebaVykurovanie, pocetOsob),
    elektrinaNaOsobu: podiel(spotrebaElektrina, pocetOsob),
    roky,
  };
}
