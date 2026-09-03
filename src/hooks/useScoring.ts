import { useMemo } from 'react';
import { Areal } from '../types/areal';
import { ScoreResult, MZIScore, OZEScore, EnergiaScore, hodnoteneOblasti } from '../types/scoring';
import { getPlochaStrechyPreFV } from '../utils/calculations';
import { podielLED } from '../utils/lighting';
import { budovyNaEnergetickeHodnotenie } from '../utils/sezonnaStavba';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateMZI(areal: Areal): MZIScore {
  const pozemky = areal.pozemky;
  if (pozemky.length === 0) return { celkove: 0, podielPriepustnychPloch: 0, existujuceOpatrenia: 0, stavZelene: 0, potencialZlepsenia: 0 };

  // 1. Podiel priepustnych ploch (0-25)
  let totalPlocha = 0;
  let totalPriepustna = 0;
  let totalPolopriepustna = 0;
  let totalSpevnena = 0;

  for (const p of pozemky) {
    const plocha = p.plochaBezBudov || p.celkovaVymera;
    totalPlocha += plocha;
    totalPriepustna += p.priepustnaPlochaCelkom;
    totalPolopriepustna += p.polopriepustnaPlochaCelkom;
    totalSpevnena += p.spevnenaPlochaCelkom;
  }

  let podielPriepustnych = 0;
  if (totalPlocha > 0) {
    podielPriepustnych = (totalPriepustna + 0.5 * totalPolopriepustna) / totalPlocha;
  }
  const podielPriepustnychPloch = clamp(Math.round(podielPriepustnych * 25), 0, 25);

  // 2. Existujuce opatrenia (0-25)
  let opatreniaScore = 0;
  for (const p of pozemky) {
    if (p.dazdovaZahradaPlocha > 0) opatreniaScore += 5;
    if (p.jazierkoPlocha > 0) opatreniaScore += 4;
    if (p.nadzemneNadobyObjem > 0 || p.podzemneNadobyObjem > 0) opatreniaScore += 5;
    if (p.zelenaStrechaPlocha > 0) opatreniaScore += 5;
    // Bonus for water directed to vsakovanie/retention
    if ((p.odvodVodyVsakovanie ?? 0) > 20) opatreniaScore += 3;
    if ((p.odvodVodyRetencnaNadrzou ?? 0) > 0) opatreniaScore += 2;
    if ((p.odvodVodyNerieseny ?? 0) < 30) opatreniaScore += 3;
  }
  const existujuceOpatrenia = clamp(Math.round(opatreniaScore / pozemky.length), 0, 25);

  // 3. Stav zelene (0-25)
  let zeleneScore = 0;
  for (const p of pozemky) {
    if (p.priepustnaPlochaCelkom > 0 && totalPriepustna > 0) {
      const weight = p.priepustnaPlochaCelkom / totalPriepustna;
      // Trees and shrubs bonus
      zeleneScore += (p.priepustnaPlochaStromy / 100) * 8 * weight;
      zeleneScore += (p.priepustnaPlochaKry / 100) * 5 * weight;
      zeleneScore += ((p.priepustnaPlochaByliny + p.priepustnaPlochaHolaPoda) / 100) * 3 * weight;
      // Young trees bonus
      if (p.stromyPodielMladych > 20) zeleneScore += 3 * weight;
      // Penalty for unhealthy trees
      if (p.stromyPodielNezdravych > 30) zeleneScore -= 3 * weight;
    }
  }
  const stavZelene = clamp(Math.round(zeleneScore + 5), 0, 25); // +5 base

  // 4. Potencial zlepsenia (0-25) - higher if more room for improvement
  let potencialScore = 0;
  if (totalSpevnena > 0 && totalPlocha > 0) {
    potencialScore += (totalSpevnena / totalPlocha) * 10; // More impervious = more potential
  }
  // Unresolved water drainage
  let avgNerieseny = 0;
  for (const p of pozemky) {
    avgNerieseny += p.odvodVodyNerieseny ?? 0;
  }
  avgNerieseny /= pozemky.length;
  if (avgNerieseny > 50) potencialScore += 8;
  else if (avgNerieseny > 20) potencialScore += 4;

  // Green roof potential on buildings
  let totalGreenRoofPotential = 0;
  for (const b of areal.budovy) {
    if (b.strechaTyp === 1 && b.zelenaStrechaPlocha === 0) {
      totalGreenRoofPotential += b.plochaPodorysu;
    }
  }
  if (totalGreenRoofPotential > 500) potencialScore += 7;
  else if (totalGreenRoofPotential > 100) potencialScore += 4;

  const potencialZlepsenia = clamp(Math.round(potencialScore), 0, 25);

  const celkove = podielPriepustnychPloch + existujuceOpatrenia + stavZelene + potencialZlepsenia;

  return { celkove, podielPriepustnychPloch, existujuceOpatrenia, stavZelene, potencialZlepsenia };
}

export function calculateOZE(areal: Areal): OZEScore {
  // Bez jedinej budovy sa OZE nehodnotí — celé skóre stojí na budovách
  // a nula by sa čítala ako zlý stav (issue #205).
  const budovy = areal.budovy;
  if (budovy.length === 0) {
    return { celkove: 0, vhodnostStrechyPreSolar: 0, existujuceOZE: 0, potencialTepelnehoCerpadla: 0, potencialDalsichOZE: 0, hodnotenychBudov: 0 };
  }

  // 1. Vhodnost strechy pre solar (0-30) — iba ploché / málo šikmé strechy do 15° (issue #179)
  let totalPlochaPreFV = 0;
  let totalPlochaBudov = 0;
  let goodRoofCount = 0;

  for (const b of budovy) {
    const plochaPreFV = getPlochaStrechyPreFV(b);
    totalPlochaPreFV += plochaPreFV;
    totalPlochaBudov += b.plochaPodorysu;
    if (plochaPreFV > 0 && b.strechaProblemy === 0) {
      goodRoofCount++;
    }
  }

  let solarScore = 0;
  if (totalPlochaBudov > 0) {
    solarScore += (totalPlochaPreFV / totalPlochaBudov) * 15;
  }
  if (goodRoofCount > 0) solarScore += Math.min(goodRoofCount * 5, 15);
  const vhodnostStrechyPreSolar = clamp(Math.round(solarScore), 0, 30);

  // 2. Existujuce OZE (0-20)
  let ozeScore = 0;
  for (const b of budovy) {
    if (b.fotovoltika === 1) ozeScore += 6;
    if (b.solarnePanelyPlocha > 0) ozeScore += 4;
    if (b.tepelneCerpadlo === 1) ozeScore += 6;
    if (b.bateriovyUlozisko > 0) ozeScore += 4;
  }
  const existujuceOZE = clamp(Math.round(ozeScore / budovy.length), 0, 20);

  // 3. Potencial tepelneho cerpadla (0-25) — len z vykurovaných budov;
  // sezónna chata sa nevykuruje, takže na ňu tepelné čerpadlo nenavrhujeme.
  const vykurovaneBudovy = budovyNaEnergetickeHodnotenie(budovy);
  let tcPotencial = 0;
  const currentYear = new Date().getFullYear();
  for (const b of vykurovaneBudovy) {
    if (b.tepelneCerpadlo === 0) {
      // Old gas/electric heating = high potential
      if (b.kurenePlynom === 1 && b.kureniePlynRokInstalacie > 0) {
        const age = currentYear - b.kureniePlynRokInstalacie;
        if (age > 15) tcPotencial += 8;
        else if (age > 10) tcPotencial += 4;
      }
      if (b.kurenieElektrinou === 1) tcPotencial += 6;
      if (b.kurenieUhlimDrevom > 0) tcPotencial += 8;
    }
  }
  const potencialTepelnehoCerpadla = vykurovaneBudovy.length > 0
    ? clamp(Math.round(tcPotencial / vykurovaneBudovy.length), 0, 25)
    : 0;

  // 4. Potencial dalsich OZE (0-25)
  let dalsieOZE = 0;
  for (const b of budovy) {
    // Unused flat-roof area suitable for FV (issue #179)
    const unusedFV = getPlochaStrechyPreFV(b) - b.fotovoltikaPlocha - b.solarnePanelyPlocha;
    if (unusedFV > 50) dalsieOZE += 8;
    else if (unusedFV > 20) dalsieOZE += 4;

    // PC network = smart grid ready
    if (b.pocitacovaSiet === 1) dalsieOZE += 3;

    // Self-sufficiency gap
    if (b.spotrebaElektriny > 0 && b.vyrobaElektriny < b.spotrebaElektriny * 0.5) {
      dalsieOZE += 5;
    }
  }
  const potencialDalsichOZE = clamp(Math.round(dalsieOZE / budovy.length), 0, 25);

  const celkove = vhodnostStrechyPreSolar + existujuceOZE + potencialTepelnehoCerpadla + potencialDalsichOZE;

  return { celkove, vhodnostStrechyPreSolar, existujuceOZE, potencialTepelnehoCerpadla, potencialDalsichOZE, hodnotenychBudov: budovy.length };
}

export function calculateEnergia(areal: Areal): EnergiaScore {
  // Sezónne nevykurované stavby (záhradná chata a pod.) sa nehodnotia — nemá
  // zmysel merať zateplenie ani vykurovanie tam, kde sa nekúri.
  const budovy = budovyNaEnergetickeHodnotenie(areal.budovy);
  const vynechanychSezonnych = areal.budovy.length - budovy.length;
  if (budovy.length === 0) {
    return { celkove: 0, zateplenie: 0, kvalitaOkien: 0, vykurovaciSystem: 0, vetranie: 0, hodnotenychBudov: 0, vynechanychSezonnych };
  }

  // 1. Zateplenie (0-30)
  let zatepScore = 0;
  for (const b of budovy) {
    // Fasada
    if (b.zateplenieFasady === 1) zatepScore += 10;
    else if (b.zateplenieFasady === 2) zatepScore += 4;

    // Strecha
    if (b.strechaZateplenie === 1) zatepScore += 10;
    else if (b.strechaZateplenie === 2) zatepScore += 4;
  }
  const zateplenie = clamp(Math.round(zatepScore / budovy.length) + 5, 0, 30);

  // 2. Kvalita okien (0-20)
  let oknaTotal = 0;
  let oknaWeight = 0;
  for (const b of budovy) {
    const weight = b.uzitkovaPlochaNUS || 1;
    oknaTotal += (b.termoizolacneOkna / 100) * weight;
    oknaWeight += weight;
  }
  const oknaRatio = oknaWeight > 0 ? oknaTotal / oknaWeight : 0;
  const kvalitaOkien = clamp(Math.round(oknaRatio * 20), 0, 20);

  // 3. Vykurovaci system (0-25)
  let vykScore = 0;
  for (const b of budovy) {
    // Positive: heat pump
    if (b.tepelneCerpadlo === 1) vykScore += 10;
    // Negative: coal/wood
    if (b.kurenieUhlimDrevom > 0) vykScore -= 5;
    // Zony
    if (b.rozdelenieDozOn === 1) vykScore += 3;
    // Harmonogram
    if (b.kurenieHarmonogram === 1) vykScore += 3;
    // Termohlavice
    if (b.termohlavice === 1) vykScore += 2;
    // Auto regulacia
    if (b.automatickaRegulacia === 1) vykScore += 3;
  }
  const vykurovaciSystem = clamp(Math.round(vykScore / budovy.length) + 10, 0, 25);

  // 4. Vetranie (0-25)
  let vetScore = 0;
  for (const b of budovy) {
    if (b.rekuperacia === 1) vetScore += 15;
    // LED — podiel z počtu svietidiel, keď je zadaný, inak z percenta (issue #183)
    const ledBonus = podielLED(b) * 10;
    vetScore += ledBonus;
  }
  const vetranie = clamp(Math.round(vetScore / budovy.length), 0, 25);

  const celkove = zateplenie + kvalitaOkien + vykurovaciSystem + vetranie;

  return { celkove, zateplenie, kvalitaOkien, vykurovaciSystem, vetranie, hodnotenychBudov: budovy.length, vynechanychSezonnych };
}

function calculateMZIPotencial(areal: Areal): number {
  let skore = 0;

  for (const p of areal.pozemky) {
    const plocha = p.plochaBezBudov || p.celkovaVymera;
    const fracKan = ((p.odvodVodyJednotnaKanalizacia || 0) + (p.odvodVodySplaskovaKanalizacia || 0) + (p.odvodVodyZrazkovaKanalizacia || 0)) / 100;
    skore += fracKan * plocha * 10;
    skore += (p.odvodVodyVodnyTok / 100) * plocha * 10;
    skore += (p.odvodVodyNerieseny / 100) * plocha * 5;
    skore += (p.stromyPodielMladych / 100) * p.priepustnaPlochaCelkom * plocha / 10000 * 3;
    skore += (p.stromyPodielNezdravych / 100) * p.priepustnaPlochaCelkom * plocha / 10000 * 3;
    skore -= p.dazdovaZahradaPlocha;
    skore -= p.jazierkoPlocha;
    skore -= p.nadzemneNadobyObjem;
    skore -= p.podzemneNadobyObjem;
    skore -= p.zelenaStrechaPlocha;
  }

  for (const b of areal.budovy) {
    const trebaNovuStrechu = (b.strechaTyp === 1 || b.strechaTyp === 2) &&
      (b.strechaZateplenie === 0 || b.strechaProblemy === 1);
    if (trebaNovuStrechu) skore += Math.max(0, b.plochaPodorysu - b.zelenaStrechaPlocha);
    if (b.zvodyDazdovejVody === 1) {
      skore += (b.budovaOdvodVodyKanalizacia / 100) * b.plochaPodorysu * 10;
      skore += (b.budovaOdvodVodyVodnyTok / 100) * b.plochaPodorysu * 10;
      skore += (b.budovaOdvodVodyNerieseny / 100) * b.plochaPodorysu * 5;
    }
    skore -= b.zelenaStrechaPlocha;
  }

  return Math.max(0, Math.round(skore));
}

/**
 * Skóre areálu. Čistá funkcia — hook ju len memoizuje, aby sa pravidlá
 * hodnotenia dali priamo testovať.
 */
export function computeScore(areal: Areal): ScoreResult {
  const mzi = calculateMZI(areal);
  const oze = calculateOZE(areal);
  const energia = calculateEnergia(areal);
  const mziPotencial = calculateMZIPotencial(areal);
  const ciastkove: ScoreResult = { celkove: 0, mzi, oze, energia, mziPotencial };

  // Do priemeru vstupujú len oblasti, ktoré sa naozaj hodnotia — nula
  // nehodnotenej oblasti by inak stiahla celý areál dole (#203, #204, #205).
  const hodnotene = hodnoteneOblasti(ciastkove);
  const celkove = Math.round(hodnotene.reduce((acc, o) => acc + o.skore, 0) / hodnotene.length);

  return { ...ciastkove, celkove };
}

export function useScoring(areal: Areal): ScoreResult {
  return useMemo(() => computeScore(areal), [areal]);
}
