import { useMemo } from 'react';
import { Areal, Budova } from '../types/areal';
import {
  ScoreResult, OZEScore, EnergiaScore, PolozkaSkore, RozpisPodskore, hodnoteneOblasti,
} from '../types/scoring';
import { calculateMZI } from '../utils/mziKlimasken';
import { getPlochaStrechyPreFV } from '../utils/calculations';
import { podielLED } from '../utils/lighting';
import { budovyNaEnergetickeHodnotenie } from '../utils/sezonnaStavba';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Označenie budovy v rozpise bodov — vlastný názov, inak poradie. */
function nazovBudovy(b: Budova, index: number): string {
  return b.nazov.trim() || `Budova ${index + 1}`;
}

/**
 * Zberač položiek jedného podskóre (issue #213, etapa 2).
 *
 * Súčet vedie samotný zberač, takže rozpis a výsledné body nemôžu rozísť —
 * skóre sa počíta z tých istých čísel, ktoré sa hodnotiteľovi zobrazia.
 */
function zberac(max: number) {
  const polozky: PolozkaSkore[] = [];
  let sucet = 0;
  return {
    pridaj(nazov: string, body: number, budova?: string) {
      if (body === 0) return;
      sucet += body;
      polozky.push({ nazov, body, budova });
    },
    get sucet() { return sucet; },
    /** Uzavrie rozpis: `orez(round(sucet / delenePoctom) + pausal)`. */
    vysledok(delenePoctom = 0, pausal = 0): RozpisPodskore {
      const priemer = delenePoctom > 0 ? sucet / delenePoctom : sucet;
      const body = clamp(Math.round(priemer) + pausal, 0, max);
      return { polozky, sucet, delenePoctom, pausal, body, max };
    },
  };
}

/** Prázdny rozpis pre oblasť, ktorá sa nehodnotí (bez budov, len sezónne stavby). */
function prazdnyRozpis(max: number): RozpisPodskore {
  return { polozky: [], sucet: 0, delenePoctom: 0, pausal: 0, body: 0, max };
}

// MZI sa hodnotí podľa metodiky Klimaskenu — pozri utils/mziKlimasken.ts.
export { calculateMZI };

export function calculateOZE(areal: Areal): OZEScore {
  // Bez jedinej budovy sa OZE nehodnotí — celé skóre stojí na budovách
  // a nula by sa čítala ako zlý stav (issue #205).
  const budovy = areal.budovy;
  if (budovy.length === 0) {
    return {
      celkove: 0, vhodnostStrechyPreSolar: 0, existujuceOZE: 0,
      potencialTepelnehoCerpadla: 0, potencialDalsichOZE: 0, hodnotenychBudov: 0,
      rozpis: {
        vhodnostStrechyPreSolar: prazdnyRozpis(30),
        existujuceOZE: prazdnyRozpis(20),
        potencialTepelnehoCerpadla: prazdnyRozpis(25),
        potencialDalsichOZE: prazdnyRozpis(25),
      },
    };
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

  const zStrechy = zberac(30);
  if (totalPlochaBudov > 0) {
    zStrechy.pridaj(
      `Podiel strechy vhodnej pre FV — ${Math.round(totalPlochaPreFV)} z ${Math.round(totalPlochaBudov)} m²`,
      (totalPlochaPreFV / totalPlochaBudov) * 15,
    );
  }
  if (goodRoofCount > 0) {
    zStrechy.pridaj(
      `Strechy vhodné pre FV a bez porúch (${goodRoofCount}), max 15 b`,
      Math.min(goodRoofCount * 5, 15),
    );
  }
  const rozpisStrechy = zStrechy.vysledok();
  const vhodnostStrechyPreSolar = rozpisStrechy.body;

  // 2. Existujuce OZE (0-20)
  const zOZE = zberac(20);
  budovy.forEach((b, i) => {
    const nazov = nazovBudovy(b, i);
    if (b.fotovoltika === 1) zOZE.pridaj('Fotovoltika', 6, nazov);
    if (b.solarnePanelyPlocha > 0) zOZE.pridaj('Solárne kolektory', 4, nazov);
    if (b.tepelneCerpadlo === 1) zOZE.pridaj('Tepelné čerpadlo', 6, nazov);
    if (b.bateriovyUlozisko > 0) zOZE.pridaj('Batériové úložisko', 4, nazov);
  });
  const rozpisOZE = zOZE.vysledok(budovy.length);
  const existujuceOZE = rozpisOZE.body;

  // 3. Potencial tepelneho cerpadla (0-25) — len z vykurovaných budov;
  // sezónna chata sa nevykuruje, takže na ňu tepelné čerpadlo nenavrhujeme.
  const vykurovaneBudovy = budovyNaEnergetickeHodnotenie(budovy);
  const zTC = zberac(25);
  const currentYear = new Date().getFullYear();
  vykurovaneBudovy.forEach((b, i) => {
    const nazov = nazovBudovy(b, i);
    if (b.tepelneCerpadlo === 0) {
      // Old gas/electric heating = high potential
      if (b.kurenePlynom === 1 && b.kureniePlynRokInstalacie > 0) {
        const age = currentYear - b.kureniePlynRokInstalacie;
        if (age > 15) zTC.pridaj(`Plynový kotol starší ako 15 rokov (${b.kureniePlynRokInstalacie})`, 8, nazov);
        else if (age > 10) zTC.pridaj(`Plynový kotol starší ako 10 rokov (${b.kureniePlynRokInstalacie})`, 4, nazov);
      }
      if (b.kurenieElektrinou === 1) zTC.pridaj('Vykurovanie elektrinou', 6, nazov);
      if (b.kurenieUhlimDrevom > 0) zTC.pridaj('Vykurovanie uhlím alebo drevom', 8, nazov);
    }
  });
  const rozpisTC = vykurovaneBudovy.length > 0 ? zTC.vysledok(vykurovaneBudovy.length) : prazdnyRozpis(25);
  const potencialTepelnehoCerpadla = rozpisTC.body;

  // 4. Potencial dalsich OZE (0-25)
  const zDalsie = zberac(25);
  budovy.forEach((b, i) => {
    const nazov = nazovBudovy(b, i);
    // Unused flat-roof area suitable for FV (issue #179)
    const unusedFV = getPlochaStrechyPreFV(b) - b.fotovoltikaPlocha - b.solarnePanelyPlocha;
    if (unusedFV > 50) zDalsie.pridaj(`Nevyužitá strecha pre FV nad 50 m² (${Math.round(unusedFV)} m²)`, 8, nazov);
    else if (unusedFV > 20) zDalsie.pridaj(`Nevyužitá strecha pre FV nad 20 m² (${Math.round(unusedFV)} m²)`, 4, nazov);

    // PC network = smart grid ready
    if (b.pocitacovaSiet === 1) zDalsie.pridaj('Počítačová sieť (pripravenosť na riadenie)', 3, nazov);

    // Self-sufficiency gap
    if (b.spotrebaElektriny > 0 && b.vyrobaElektriny < b.spotrebaElektriny * 0.5) {
      zDalsie.pridaj('Vlastná výroba pokrýva menej než polovicu spotreby', 5, nazov);
    }
  });
  const rozpisDalsie = zDalsie.vysledok(budovy.length);
  const potencialDalsichOZE = rozpisDalsie.body;

  const celkove = vhodnostStrechyPreSolar + existujuceOZE + potencialTepelnehoCerpadla + potencialDalsichOZE;

  return {
    celkove, vhodnostStrechyPreSolar, existujuceOZE, potencialTepelnehoCerpadla, potencialDalsichOZE,
    hodnotenychBudov: budovy.length,
    rozpis: {
      vhodnostStrechyPreSolar: rozpisStrechy,
      existujuceOZE: rozpisOZE,
      potencialTepelnehoCerpadla: rozpisTC,
      potencialDalsichOZE: rozpisDalsie,
    },
  };
}

export function calculateEnergia(areal: Areal): EnergiaScore {
  // Sezónne nevykurované stavby (záhradná chata a pod.) sa nehodnotia — nemá
  // zmysel merať zateplenie ani vykurovanie tam, kde sa nekúri.
  const budovy = budovyNaEnergetickeHodnotenie(areal.budovy);
  const vynechanychSezonnych = areal.budovy.length - budovy.length;
  if (budovy.length === 0) {
    return {
      celkove: 0, zateplenie: 0, kvalitaOkien: 0, vykurovaciSystem: 0, vetranie: 0,
      hodnotenychBudov: 0, vynechanychSezonnych,
      rozpis: {
        zateplenie: prazdnyRozpis(30),
        kvalitaOkien: prazdnyRozpis(20),
        vykurovaciSystem: prazdnyRozpis(25),
        vetranie: prazdnyRozpis(25),
      },
    };
  }

  // 1. Zateplenie (0-30) — paušál 5 b dostane každý areál s hodnotenou budovou
  const zZateplenie = zberac(30);
  budovy.forEach((b, i) => {
    const nazov = nazovBudovy(b, i);
    // Fasada
    if (b.zateplenieFasady === 1) zZateplenie.pridaj('Zateplená fasáda', 10, nazov);
    else if (b.zateplenieFasady === 2) zZateplenie.pridaj('Čiastočne zateplená fasáda', 4, nazov);

    // Strecha
    if (b.strechaZateplenie === 1) zZateplenie.pridaj('Zateplená strecha', 10, nazov);
    else if (b.strechaZateplenie === 2) zZateplenie.pridaj('Čiastočne zateplená strecha', 4, nazov);
  });
  const rozpisZateplenie = zZateplenie.vysledok(budovy.length, 5);
  const zateplenie = rozpisZateplenie.body;

  // 2. Kvalita okien (0-20) — vážený priemer podľa úžitkovej plochy budov
  let oknaTotal = 0;
  let oknaWeight = 0;
  for (const b of budovy) {
    const weight = b.uzitkovaPlochaNUS || 1;
    oknaTotal += (b.termoizolacneOkna / 100) * weight;
    oknaWeight += weight;
  }
  const oknaRatio = oknaWeight > 0 ? oknaTotal / oknaWeight : 0;
  const zOkna = zberac(20);
  zOkna.pridaj(
    `Termoizolačné okná — ${Math.round(oknaRatio * 100)} % plochy budov (vážené úžitkovou plochou)`,
    oknaRatio * 20,
  );
  const rozpisOkna = zOkna.vysledok();
  const kvalitaOkien = rozpisOkna.body;

  // 3. Vykurovaci system (0-25) — paušál 10 b
  const zVykurovanie = zberac(25);
  budovy.forEach((b, i) => {
    const nazov = nazovBudovy(b, i);
    // Positive: heat pump
    if (b.tepelneCerpadlo === 1) zVykurovanie.pridaj('Tepelné čerpadlo', 10, nazov);
    // Negative: coal/wood
    if (b.kurenieUhlimDrevom > 0) zVykurovanie.pridaj('Vykurovanie uhlím alebo drevom', -5, nazov);
    // Zony
    if (b.rozdelenieDozOn === 1) zVykurovanie.pridaj('Rozdelenie na vykurovacie zóny', 3, nazov);
    // Harmonogram
    if (b.kurenieHarmonogram === 1) zVykurovanie.pridaj('Harmonogram vykurovania', 3, nazov);
    // Termohlavice
    if (b.termohlavice === 1) zVykurovanie.pridaj('Termohlavice na radiátoroch', 2, nazov);
    // Auto regulacia
    if (b.automatickaRegulacia === 1) zVykurovanie.pridaj('Automatická regulácia', 3, nazov);
  });
  const rozpisVykurovanie = zVykurovanie.vysledok(budovy.length, 10);
  const vykurovaciSystem = rozpisVykurovanie.body;

  // 4. Vetranie (0-25)
  const zVetranie = zberac(25);
  budovy.forEach((b, i) => {
    const nazov = nazovBudovy(b, i);
    if (b.rekuperacia === 1) zVetranie.pridaj('Rekuperácia vzduchu', 15, nazov);
    // LED — podiel z počtu svietidiel, keď je zadaný, inak z percenta (issue #183)
    const podiel = podielLED(b);
    zVetranie.pridaj(`LED osvetlenie — ${Math.round(podiel * 100)} %`, podiel * 10, nazov);
  });
  const rozpisVetranie = zVetranie.vysledok(budovy.length);
  const vetranie = rozpisVetranie.body;

  const celkove = zateplenie + kvalitaOkien + vykurovaciSystem + vetranie;

  return {
    celkove, zateplenie, kvalitaOkien, vykurovaciSystem, vetranie,
    hodnotenychBudov: budovy.length, vynechanychSezonnych,
    rozpis: {
      zateplenie: rozpisZateplenie,
      kvalitaOkien: rozpisOkna,
      vykurovaciSystem: rozpisVykurovanie,
      vetranie: rozpisVetranie,
    },
  };
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
