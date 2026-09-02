import { useMemo } from 'react';
import { Areal } from '../types/areal';
import { ScoreResult, OZEScore, EnergiaScore } from '../types/scoring';
import { calculateMZI } from '../utils/mziKlimasken';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// MZI sa hodnotí podľa metodiky Klimaskenu — pozri utils/mziKlimasken.ts.
export { calculateMZI };

function calculateOZE(areal: Areal): OZEScore {
  const budovy = areal.budovy;
  if (budovy.length === 0) return { celkove: 0, vhodnostStrechyPreSolar: 0, existujuceOZE: 0, potencialTepelnehoCerpadla: 0, potencialDalsichOZE: 0 };

  // 1. Vhodnost strechy pre solar (0-30)
  let totalJuznaPlochaBudov = 0;
  let totalPlochaBudov = 0;
  let goodRoofCount = 0;

  for (const b of budovy) {
    totalJuznaPlochaBudov += b.strechaOrientovanaPlochaNaJuh;
    totalPlochaBudov += b.plochaPodorysu;
    if (b.strechaOrientovanaPlochaNaJuh > 0 && b.strechaProblemy === 0) {
      goodRoofCount++;
    }
  }

  let solarScore = 0;
  if (totalPlochaBudov > 0) {
    solarScore += (totalJuznaPlochaBudov / totalPlochaBudov) * 15;
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

  // 3. Potencial tepelneho cerpadla (0-25)
  let tcPotencial = 0;
  const currentYear = new Date().getFullYear();
  for (const b of budovy) {
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
  const potencialTepelnehoCerpadla = clamp(Math.round(tcPotencial / budovy.length), 0, 25);

  // 4. Potencial dalsich OZE (0-25)
  let dalsieOZE = 0;
  for (const b of budovy) {
    // Unused south-facing roof area
    const unusedJuh = b.strechaOrientovanaPlochaNaJuh - b.fotovoltikaPlocha - b.solarnePanelyPlocha;
    if (unusedJuh > 50) dalsieOZE += 8;
    else if (unusedJuh > 20) dalsieOZE += 4;

    // PC network = smart grid ready
    if (b.pocitacovaSiet === 1) dalsieOZE += 3;

    // Self-sufficiency gap
    if (b.spotrebaElektriny > 0 && b.vyrobaElektriny < b.spotrebaElektriny * 0.5) {
      dalsieOZE += 5;
    }
  }
  const potencialDalsichOZE = clamp(Math.round(dalsieOZE / budovy.length), 0, 25);

  const celkove = vhodnostStrechyPreSolar + existujuceOZE + potencialTepelnehoCerpadla + potencialDalsichOZE;

  return { celkove, vhodnostStrechyPreSolar, existujuceOZE, potencialTepelnehoCerpadla, potencialDalsichOZE };
}

function calculateEnergia(areal: Areal): EnergiaScore {
  const budovy = areal.budovy;
  if (budovy.length === 0) return { celkove: 0, zateplenie: 0, kvalitaOkien: 0, vykurovaciSystem: 0, vetranie: 0 };

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
    // LED
    const ledBonus = (b.osvetlenieLED / 100) * 10;
    vetScore += ledBonus;
  }
  const vetranie = clamp(Math.round(vetScore / budovy.length), 0, 25);

  const celkove = zateplenie + kvalitaOkien + vykurovaciSystem + vetranie;

  return { celkove, zateplenie, kvalitaOkien, vykurovaciSystem, vetranie };
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

export function useScoring(areal: Areal): ScoreResult {
  return useMemo(() => {
    const mzi = calculateMZI(areal);
    const oze = calculateOZE(areal);
    const energia = calculateEnergia(areal);
    const celkove = Math.round((mzi.celkove + oze.celkove + energia.celkove) / 3);
    const mziPotencial = calculateMZIPotencial(areal);

    return { celkove, mzi, oze, energia, mziPotencial };
  }, [areal]);
}
