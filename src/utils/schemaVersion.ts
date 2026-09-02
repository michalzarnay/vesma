// Verziovanie uložených relácií (issue #177).
//
// Keď pribudne otázka, ktorú majú používatelia doplniť aj v starších reláciách:
//  1. zvýš `AKTUALNA_VERZIA_SCHEMY` v `src/types/areal.ts`,
//  2. pridaj sem záznam do `NOVE_POLIA_VO_VERZII` s číslom novej verzie,
//  3. v `migrateBudova` (src/hooks/useArealState.ts) daj poľu predvolenú hodnotu.
//
// Relácia uložená v staršej verzii sa načíta bez chyby; používateľ hneď po otvorení
// dostane pripomienku so zoznamom budov a polí, ktoré treba doplniť, a tie polia
// sú vo formulári farebne odlíšené.

import { AKTUALNA_VERZIA_SCHEMY, Areal, Budova } from '../types/areal';

/** Pole budovy, ktoré pribudlo v danej verzii schémy. */
export interface NovePole {
  /** Kľúč v `Budova`. */
  pole: keyof Budova;
  /** Popis pre používateľa — rovnaký text ako vo formulári. */
  label: string;
  /** Je pole ešte nevyplnené? (napr. trojstavová odpoveď zostala na „neviem") */
  chyba: (b: Budova) => boolean;
}

const neviem = (b: Budova, pole: 'hydraulickeVyregulovanie' | 'izolaciaRozvodov') => (b[pole] ?? 2) === 2;

/** Polia pridané v jednotlivých verziách schémy. Kľúč = verzia, v ktorej pribudli. */
export const NOVE_POLIA_VO_VERZII: Record<number, NovePole[]> = {
  2: [
    {
      pole: 'hydraulickeVyregulovanie',
      label: 'Je sústava hydraulicky vyregulovaná?',
      chyba: (b) => neviem(b, 'hydraulickeVyregulovanie'),
    },
    {
      pole: 'izolaciaRozvodov',
      label: 'Majú rozvody tepelnú izoláciu?',
      chyba: (b) => neviem(b, 'izolaciaRozvodov'),
    },
  ],
};

/** Verzia relácie; relácie spred zavedenia verziovania sa berú ako verzia 1. */
export function verziaArealu(areal: Areal): number {
  return areal.schemaVersion ?? 1;
}

/** Bola relácia uložená v staršej verzii schémy, než je aktuálna? */
export function jeStarsiaVerzia(areal: Areal): boolean {
  return verziaArealu(areal) < AKTUALNA_VERZIA_SCHEMY;
}

/** Polia, ktoré pribudli od verzie relácie po aktuálnu verziu. */
export function poliaPribudnuteOd(verzia: number): NovePole[] {
  return Object.entries(NOVE_POLIA_VO_VERZII)
    .filter(([v]) => Number(v) > verzia)
    .flatMap(([, polia]) => polia);
}

export interface ChybajucePoliaBudovy {
  budovaId: string;
  budovaNazov: string;
  polia: string[];
}

/**
 * Zoznam budov a v nich nevyplnených nových polí — podklad pre pripomienku
 * po načítaní staršej relácie. Pre aktuálnu verziu vracia prázdny zoznam.
 */
export function chybajuceNovePolia(areal: Areal): ChybajucePoliaBudovy[] {
  if (!jeStarsiaVerzia(areal)) return [];
  const nove = poliaPribudnuteOd(verziaArealu(areal));
  if (nove.length === 0) return [];

  return areal.budovy
    .map((b, i) => ({
      budovaId: b.id,
      budovaNazov: b.nazov || `Budova ${i + 1}`,
      polia: nove.filter((p) => p.chyba(b)).map((p) => p.label),
    }))
    .filter((r) => r.polia.length > 0);
}

/**
 * Má sa pole budovy vo formulári farebne odlíšiť ako nevyplnené nové pole?
 * Zvýrazňujú sa iba relácie načítané zo staršej verzie — v novom areáli
 * je „neviem" legitímny východiskový stav, nie chyba.
 */
export function jeNevyplneneNovePole(verziaRelacie: number, budova: Budova, pole: keyof Budova): boolean {
  if (verziaRelacie >= AKTUALNA_VERZIA_SCHEMY) return false;
  const definicia = poliaPribudnuteOd(verziaRelacie).find((p) => p.pole === pole);
  return definicia ? definicia.chyba(budova) : false;
}
