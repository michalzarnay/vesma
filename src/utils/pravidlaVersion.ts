// Verziovanie pravidiel a parametrov hodnotenia.
//
// Odpovede v relácii sa neukladajú spolu s výsledkom — skóre, poradie v porovnaní
// aj odporúčania sa počítajú nanovo pri každom otvorení. Keď sa medzitým zmenia
// pravidlá (useScoring.ts, comparisonWeights.ts, useRecommendations.ts, referenčné
// hodnoty v data/), používateľ uvidí iné čísla než naposledy — bez toho, aby čokoľvek
// zmenil. Preto si relácia pamätá, podľa akej verzie pravidiel bola vyhodnotená, a po
// otvorení staršej relácie dostane používateľ upozornenie.
//
// Keď meníš pravidlá hodnotenia:
//  1. zvýš `AKTUALNA_VERZIA_PRAVIDIEL` v `src/types/areal.ts`,
//  2. pridaj sem do `ZMENY_PRAVIDIEL` záznam s číslom novej verzie a popisom zmeny
//     v reči používateľa (nie názvami funkcií).
// Podrobnejšie: `docs/verziovanie-pravidiel.md`.

import { AKTUALNA_VERZIA_PRAVIDIEL, Areal } from '../types/areal';

/** Oblasť hodnotenia, ktorej sa zmena týka — používateľ podľa nej vidí, kde hľadať rozdiel. */
export type OblastPravidiel = 'Skóre areálu' | 'Porovnanie areálov' | 'Odporúčania';

export interface ZmenaPravidiel {
  oblast: OblastPravidiel;
  /** Jedna veta pre používateľa: čo sa zmenilo a čo to preňho znamená. */
  popis: string;
}

/**
 * Zmeny pravidiel podľa verzie, v ktorej nastali. Kľúč = číslo novej verzie,
 * teda hodnota `AKTUALNA_VERZIA_PRAVIDIEL` po zvýšení.
 *
 * Verzia 1 je východiskový stav pri zavedení sledovania, preto tu záznam nemá.
 */
export const ZMENY_PRAVIDIEL: Record<number, ZmenaPravidiel[]> = {
  2: [
    {
      oblast: 'Skóre areálu',
      popis:
        'Zastavaná plocha stavieb z kroku Iné stavby sa už započítava do skóre modro-zelenej ' +
        'infraštruktúry ako nepriepustná plocha. Ak ste tie plochy zadali aj do výmer v kroku ' +
        'Pozemky, odrátajte ich tam — inak sa zarátajú dvakrát a skóre bude nižšie, než má byť.',
    },
  ],
  3: [
    {
      oblast: 'Skóre areálu',
      popis:
        'Upresnilo sa, čo je iná stavba: drobná stavba bez základov v zemi — altánok, pergola, ' +
        'prístrešok, plechová búda. Chodníky, terasy a parkoviská medzi ne už nepatria; zadávajú ' +
        'sa ako povrch pozemku v kroku Pozemky a jednoduché oplotenie sa nezadáva nikam. ' +
        'Skontrolujte krok Iné stavby: čo tam podľa tohto nepatrí, presuňte do kroku Pozemky, ' +
        'inak sa plocha hodnotí ako nepriepustná bez ohľadu na to, aký má povrch.',
    },
  ],
};

/**
 * Prvá verzia, od ktorej vieme zmeny vymenovať. Relácia uložená skôr (verzia 0)
 * dostane len všeobecné upozornenie — ktoré pravidlá vtedy platili, nevieme.
 */
export const PRVA_SLEDOVANA_VERZIA = 1;

/** Verzia pravidiel relácie; relácia spred zavedenia sledovania je verzia 0. */
export function verziaPravidielArealu(areal: Areal): number {
  return areal.pravidlaVersion ?? 0;
}

/** Bola relácia vyhodnotená podľa starších pravidiel, než platia teraz? */
export function jeStarsiaVerziaPravidiel(areal: Areal): boolean {
  return verziaPravidielArealu(areal) < AKTUALNA_VERZIA_PRAVIDIEL;
}

/**
 * Zmeny zapísané vo verziách (odVerzie, poVerziu>, v poradí od najstaršej.
 * Vydelené z `zmenyPravidielOd`, aby sa výber dal testovať aj pre stavy, ktoré
 * v appke ešte nenastali (zoznam zmien je pri zavedení sledovania prázdny).
 */
export function vyberZmeny(
  zmeny: Record<number, ZmenaPravidiel[]>,
  odVerzie: number,
  poVerziu: number,
): ZmenaPravidiel[] {
  return Object.entries(zmeny)
    .filter(([v]) => Number(v) > odVerzie && Number(v) <= poVerziu)
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([, zoznam]) => zoznam);
}

/** Zmeny pravidiel, ktoré nastali od danej verzie po aktuálnu. */
export function zmenyPravidielOd(verzia: number): ZmenaPravidiel[] {
  return vyberZmeny(ZMENY_PRAVIDIEL, verzia, AKTUALNA_VERZIA_PRAVIDIEL);
}

export interface UpozornenieZmenaPravidiel {
  /** Verzia pravidiel, podľa ktorej bola relácia naposledy vyhodnotená. */
  verziaRelacie: number;
  aktualnaVerzia: number;
  /** Zmeny, ktoré vieme vymenovať. Môže byť prázdny zoznam. */
  zmeny: ZmenaPravidiel[];
  /**
   * Vieme vymenovať všetky zmeny, ktoré sa relácie týkajú? Pri reláciách spred
   * zavedenia sledovania nie — vtedy zostáva len všeobecná veta.
   */
  zoznamUplny: boolean;
}

/**
 * Podklad pre upozornenie po otvorení uloženej relácie. `null` = pravidlá sa od
 * posledného vyhodnotenia relácie nezmenili, netreba nič zobrazovať.
 */
export function upozornenieNaZmenuPravidiel(areal: Areal): UpozornenieZmenaPravidiel | null {
  const verziaRelacie = verziaPravidielArealu(areal);
  if (verziaRelacie >= AKTUALNA_VERZIA_PRAVIDIEL) return null;

  return {
    verziaRelacie,
    aktualnaVerzia: AKTUALNA_VERZIA_PRAVIDIEL,
    zmeny: zmenyPravidielOd(verziaRelacie),
    zoznamUplny: verziaRelacie >= PRVA_SLEDOVANA_VERZIA,
  };
}
