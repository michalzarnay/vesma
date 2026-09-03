import { useMemo } from 'react';
import { Areal } from '../types/areal';
import { Odporucanie, Priorita } from '../types/catalog';
import { katalogOpatreni } from '../data/catalog';
import { getPlochaStrechyPreFV } from '../utils/calculations';
import { pocetNieLedSvietidiel, podielLED } from '../utils/lighting';
import { jeSezonnaNevykurovana } from '../utils/sezonnaStavba';

function findOpatrenie(id: string) {
  return katalogOpatreni.find((o) => o.id === id);
}

function addRec(recs: Odporucanie[], id: string, priorita: Priorita, dovod: string, potencial?: string) {
  const opatrenie = findOpatrenie(id);
  if (opatrenie && !recs.some((r) => r.opatrenie.id === id)) {
    recs.push({ opatrenie, priorita, dovod, potencial });
  }
}

/**
 * Odporúčané opatrenia pre areál. Čistá funkcia — hook ju len memoizuje,
 * aby sa pravidlá dali priamo testovať.
 */
export function computeRecommendations(areal: Areal): Odporucanie[] {
  const recs: Odporucanie[] = [];
  const currentYear = new Date().getFullYear();

  // Analyze pozemky
  let totalPlocha = 0;
  let totalSpevnena = 0;

  for (const p of areal.pozemky) {
    const plocha = p.plochaBezBudov || p.celkovaVymera;
    totalPlocha += plocha;
    totalSpevnena += p.spevnenaPlochaCelkom;
  }

  // ── MZI — Pravidlo 1: Spevnený povrch ────────────────────────────────────
  const spevnenyPodiel = totalPlocha > 0 ? totalSpevnena / totalPlocha : 0;
  if (spevnenyPodiel > 0.15) {
    const pct = Math.round(spevnenyPodiel * 100);
    const dovod = `${pct} % areálu tvorí spevnená nepriepustná plocha — zrážková voda nie je zadržiavaná na mieste.`;
    const dovodVsak = `${dovod} (ak podložie pozemku nie je nepriepustné a plocha sa v zime nesypie soľou)`;
    addRec(recs, 'priepustna-dlazba', 'vysoká', dovod,
      `Potenciál nahradiť až ${Math.round(totalSpevnena * 0.5)} m² priepustným povrchom.`);
    addRec(recs, 'dazdova-zahrada', 'vysoká', dovodVsak);
    addRec(recs, 'vsakovaci-rigol', 'vysoká', dovodVsak);
    // Nádrž sa neodporúča tam, kde ju nie je možné inštalovať (issue #215).
    if (areal.nadrzNieJeMozna !== 1) {
      addRec(recs, 'zachytenie-do-nadob', 'stredná', dovod);
    }
    addRec(recs, 'podzemne-vsakovanie', 'stredná', dovodVsak);
    if (totalPlocha >= 500) {
      addRec(recs, 'jazierko', 'stredná', dovod);
    }
  }

  // Green roof potential on buildings
  let totalGreenRoofPotential = 0;
  let hasExistingFV = false;
  let hasExistingSolar = false;
  let hasTC = false;
  let hasBateria = false;
  let totalPlochaStrechPreFV = 0; // iba ploché / málo šikmé strechy do 15° (issue #179)
  let hasBezZateplenia = false;
  let hasStareOkna = false;
  let hasBezRekuperacie = false;
  let hasStareKurenie = false;
  let hasUhlieDrevo = false;
  let hasBezLED = false;
  let totalNieLedSvietidiel = 0;
  let hasBezTermohlavic = false;
  let hasPoorEnergyClass = false;
  let poorEnergyClassLabel = '';
  let hasStarsiaBudovaNaPlyne = false;

  for (const b of areal.budovy) {
    totalPlochaStrechPreFV += getPlochaStrechyPreFV(b);

    if (b.strechaTyp === 1 && b.zelenaStrechaPlocha === 0) {
      totalGreenRoofPotential += b.plochaPodorysu;
    }
    if (b.fotovoltika === 1) hasExistingFV = true;
    if (b.solarnePanelyPlocha > 0) hasExistingSolar = true;
    if (b.tepelneCerpadlo === 1) hasTC = true;
    if (b.bateriovyUlozisko > 0) hasBateria = true;
    // Podiel LED z počtu svietidiel, keď je zadaný, inak z percenta (issue #183)
    if (podielLED(b) < 0.5) hasBezLED = true;
    totalNieLedSvietidiel += pocetNieLedSvietidiel(b);

    // Ďalej už len budovy, ktoré sa vykurujú. V sezónnej nevykurovanej stavbe
    // (záhradná chata) nemá zmysel navrhovať zateplenie, okná, rekuperáciu
    // ani obnovu zdroja tepla — nie je čo šetriť.
    if (jeSezonnaNevykurovana(b)) continue;

    if (b.zateplenieFasady === 0) hasBezZateplenia = true;
    if (b.termoizolacneOkna < 50) hasStareOkna = true;
    if (b.rekuperacia === 0) hasBezRekuperacie = true;
    if (b.kurenieUhlimDrevom > 0) hasUhlieDrevo = true;
    if (b.termohlavice === 0 && (b.kurenePlynom === 1 || b.tepelneCerpadlo === 1)) hasBezTermohlavic = true;
    // Staršia budova na plyne bez biomasy — kotol na biomasu je alternatíva k TČ (issue #182)
    if (b.kurenePlynom === 1 && b.vystavbaPred1980 === 1 && b.kureniePeletami === 0 && b.kurenieStiepkou === 0) {
      hasStarsiaBudovaNaPlyne = true;
    }
    if (b.energetickaTrieda && ['D', 'E', 'F', 'G'].includes(b.energetickaTrieda)) {
      hasPoorEnergyClass = true;
      poorEnergyClassLabel = b.energetickaTrieda;
    }

    // Check for old heating
    if (b.kurenePlynom === 1 && b.kureniePlynRokInstalacie > 0) {
      const age = currentYear - b.kureniePlynRokInstalacie;
      if (age > 15) hasStareKurenie = true;
    }
    if (b.kurenieElektrinou === 1 && b.kurenieElektrinaRokInstalacie > 0) {
      const age = currentYear - b.kurenieElektrinaRokInstalacie;
      if (age > 15) hasStareKurenie = true;
    }
  }

  if (totalGreenRoofPotential > 50) {
    addRec(recs, 'zelena-strecha-ext', 'stredná', `${Math.round(totalGreenRoofPotential)} m² plochých striech bez zelene.`, `Potenciál zachytiť ${Math.round(totalGreenRoofPotential * 0.3)} m³ dažďovej vody ročne.`);
  }

  // ── MZI — Pravidlo 3: Pokryvnosť korunami stromov a krov ─────────────────
  let lowCanopyPozemky = 0;
  for (const p of areal.pozemky) {
    if (p.priepustnaPlochaCelkom > 0 && (p.priepustnaPlochaStromy + p.priepustnaPlochaKry) < 30) {
      lowCanopyPozemky++;
    }
  }
  if (lowCanopyPozemky > 0) {
    const n = lowCanopyPozemky;
    addRec(
      recs, 'vysadba-stromov', 'stredná',
      `${n} ${n === 1 ? 'pozemok má' : 'pozemky/pozemkov majú'} pokryvnosť korunami stromov a krov pod 30 % zelenej plochy.`,
    );
  }

  // OZE recommendations
  if (!hasExistingFV && totalPlochaStrechPreFV > 20) {
    const kWp = Math.round(totalPlochaStrechPreFV * 0.15);
    const kWhRok = kWp * 1050;
    addRec(recs, 'fotovoltika', 'vysoká', `${Math.round(totalPlochaStrechPreFV)} m² plochej strechy (do 15°) bez fotovoltiky.`, `Potenciál: ${kWp} kWp, cca ${kWhRok.toLocaleString('sk')} kWh/rok.`);
  }

  if (!hasExistingSolar && totalPlochaStrechPreFV > 10) {
    addRec(recs, 'solarne-kolektory', 'stredná', 'Areál nevyužíva solárne kolektory na ohrev vody.');
  }

  if (!hasTC && (hasStareKurenie || hasUhlieDrevo || hasPoorEnergyClass)) {
    const dovod = hasUhlieDrevo
      ? 'Areál používa uhlie/drevo na vykurovanie.'
      : hasStareKurenie
        ? 'Vykurovací systém je starší ako 15 rokov.'
        : `Budova je podľa energetického certifikátu v triede ${poorEnergyClassLabel}.`;
    addRec(recs, 'tepelne-cerpadlo-vzduch', 'vysoká', dovod);
  }

  if (hasStarsiaBudovaNaPlyne) {
    addRec(
      recs, 'kotol-na-biomasu', 'stredná',
      'Staršia budova vykurovaná plynom — kotol na pelety alebo štiepku býva v takých budovách realizovateľnejší než tepelné čerpadlo, lebo pokrýva širší rozsah výkonu a nevyžaduje nízkoteplotnú sústavu.',
    );
  }

  if (hasExistingFV && !hasBateria) {
    addRec(recs, 'bateriove-ulozisko', 'stredná', 'Areál má fotovoltiku, ale nemá batériové úložisko.');
  }

  // Energia recommendations
  if (hasBezZateplenia || hasPoorEnergyClass) {
    const dovod = hasBezZateplenia
      ? 'Niektoré budovy nemajú zateplenú fasádu.'
      : `Budova je podľa energetického certifikátu v triede ${poorEnergyClassLabel}.`;
    addRec(recs, 'zateplenie-fasady', 'vysoká', dovod);
  }

  // Roof insulation
  let hasBezZateplenejStrechy = false;
  for (const b of areal.budovy) {
    if (jeSezonnaNevykurovana(b)) continue;
    if (b.strechaZateplenie === 0) hasBezZateplenejStrechy = true;
  }
  if (hasBezZateplenejStrechy) {
    addRec(recs, 'zateplenie-strechy', 'vysoká', 'Niektoré budovy nemajú zateplenú strechu.');
  }

  if (hasStareOkna || hasPoorEnergyClass) {
    const dovod = hasStareOkna
      ? 'Niektoré budovy majú menej ako 50% termoizolačných okien.'
      : `Budova je podľa energetického certifikátu v triede ${poorEnergyClassLabel}.`;
    addRec(recs, 'vymena-okien', 'vysoká', dovod);
  }

  if (hasBezRekuperacie) {
    addRec(recs, 'rekuperacia', 'stredná', 'Niektoré budovy nemajú rekuperáciu vzduchu.');
  }

  if (hasStareKurenie || hasPoorEnergyClass) {
    const dovod = hasStareKurenie
      ? 'Vykurovací systém je starší ako 15 rokov.'
      : `Budova je podľa energetického certifikátu v triede ${poorEnergyClassLabel}.`;
    addRec(recs, 'vymena-vykurovania', 'vysoká', dovod);
  }

  if (hasBezTermohlavic) {
    addRec(recs, 'smart-termostaty', 'stredná', 'Niektoré budovy nemajú termohlavice na radiátoroch.');
  }

  if (hasBezLED) {
    addRec(
      recs, 'led-osvetlenie', 'nízka',
      'Niektoré budovy majú menej ako 50 % LED osvetlenia.',
      totalNieLedSvietidiel > 0
        ? `Na výmenu je ${totalNieLedSvietidiel} ${totalNieLedSvietidiel === 1 ? 'svietidlo' : totalNieLedSvietidiel < 5 ? 'svietidlá' : 'svietidiel'}.`
        : undefined,
    );
  }

  // Sort by priority
  const priorityOrder: Record<Priorita, number> = { 'vysoká': 0, 'stredná': 1, 'nízka': 2 };
  recs.sort((a, b) => priorityOrder[a.priorita] - priorityOrder[b.priorita]);

  return recs;
}

export function useRecommendations(areal: Areal): Odporucanie[] {
  return useMemo(() => computeRecommendations(areal), [areal]);
}
