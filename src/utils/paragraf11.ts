// Kontrola povinností podľa § 11 ods. 1 zákona č. 321/2014 Z. z.
// o energetickej efektívnosti (issue #177).
//
// Zákon ukladá vlastníkovi budovy s celkovou podlahovou plochou nad 1 000 m²
// s ústredným teplovodným vykurovaním alebo so spoločnou prípravou teplej vody:
//   a) zabezpečiť a udržiavať hydraulicky vyregulovaný vykurovací systém,
//   b) vybaviť systém automatickou reguláciou na každom tepelnom spotrebiči,
//   c) zabezpečiť hydraulicky vyregulované rozvody teplej vody,
//   d) vybaviť rozvody tepla a teplej vody vhodnou tepelnou izoláciou.
//
// DVA PREDPOKLADY, ktoré appka nevie overiť presne — sú zámerne na strane
// „radšej upozorniť" a v UI sa uvádzajú spolu s upozornením:
//
// 1. Plocha. Zákon myslí celkovú podlahovú plochu z vonkajších rozmerov
//    (§ 2 písm. i), VESMA eviduje úžitkovú. Pri budove tesne nad hranicou
//    môže byť skutočná plocha vyššia, nie nižšia — použitie úžitkovej teda
//    upozorní menej často, nie viac.
// 2. Teplovodný systém. Appka sa nepýta priamo, či ide o ústredné teplovodné
//    vykurovanie. Odvodzuje sa zo zdroja tepla: plyn, CZT, tepelné čerpadlo,
//    pelety a štiepka sú v praxi teplovodné. Priamotopná elektrina a lokálne
//    kúrenie uhlím/drevom nie.

import { Budova } from '../types/areal';

/** Hranica celkovej podlahovej plochy podľa § 11 ods. 1. */
export const PARAGRAF_11_PLOCHA_M2 = 1000;

export interface Paragraf11Povinnost {
  /** Písmeno v § 11 ods. 1. */
  pismeno: 'a' | 'b' | 'c' | 'd';
  nazov: string;
  /** 1 = splnené, 0 = nesplnené, 2 = používateľ nevie. */
  stav: 0 | 1 | 2;
}

export interface Paragraf11Vysledok {
  /** Či na budovu povinnosti podľa § 11 ods. 1 dopadajú. */
  dopada: boolean;
  povinnosti: Paragraf11Povinnost[];
  /** Povinnosti, ktoré budova preukázateľne nespĺňa. */
  nesplnene: Paragraf11Povinnost[];
  /** Povinnosti, pri ktorých používateľ odpoveď nepozná. */
  nezname: Paragraf11Povinnost[];
}

/** Teplovodný zdroj tepla — pozri predpoklad 2 v hlavičke súboru. */
function maTeplovodnyZdroj(b: Budova): boolean {
  return b.kurenePlynom === 1
    || b.kurenieCZT === 1
    || b.tepelneCerpadlo === 1
    || b.kureniePeletami === 1
    || b.kurenieStiepkou === 1;
}

export function getParagraf11(b: Budova): Paragraf11Vysledok {
  const dopada = b.uzitkovaPlochaNUS > PARAGRAF_11_PLOCHA_M2 && maTeplovodnyZdroj(b);

  const povinnosti: Paragraf11Povinnost[] = [
    { pismeno: 'a', nazov: 'Hydraulicky vyregulovaný vykurovací systém', stav: b.hydraulickeVyregulovanieUK },
    { pismeno: 'b', nazov: 'Automatická regulácia na tepelných spotrebičoch', stav: b.automatickaRegulacia },
    { pismeno: 'c', nazov: 'Hydraulicky vyregulované rozvody teplej vody', stav: b.hydraulickeVyregulovanieTV },
    { pismeno: 'd', nazov: 'Tepelná izolácia rozvodov tepla a teplej vody', stav: b.izolaciaRozvodov },
  ];

  return {
    dopada,
    povinnosti,
    nesplnene: dopada ? povinnosti.filter((p) => p.stav === 0) : [],
    nezname: dopada ? povinnosti.filter((p) => p.stav === 2) : [],
  };
}
