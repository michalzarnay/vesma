// Využitie objektu (krok 3, budova): dni v roku, počet mesiacov, hodiny denne
// a podiel plného výkonu.
//
// Čo sa z toho v kóde skutočne používa (overené 2026-10): iba súčin
// dni v roku × hodiny denne = hodiny prevádzky za rok (energyIndicators.ts),
// z ktorých sa počíta ukazovateľ „kWh na hodinu prevádzky". Počet mesiacov
// a podiel plného výkonu sa zatiaľ nikde nepoužívajú a do exportu sa ukladajú
// len ako zadané hodnoty.

import { Budova } from '../types/areal';

export const VYUZITIE_OBJEKTU_VYSVETLENIE =
  'Tieto údaje opisujú, ako dlho sa budova využíva. Z počtu dní v roku a hodín denne ' +
  'sa vypočíta počet hodín prevádzky za rok a z neho ukazovateľ „spotreba na hodinu prevádzky". ' +
  'Ak sa budova využíva celý rok, zadajte 365 dní a 12 mesiacov; ' +
  '„hodín denne" je priemerný denný čas využívania.';

type Vyuzitie = Pick<Budova, 'vyuzitieDniVRoku' | 'vyuzitieMesiacovVRoku' | 'vyuzitieHodinDenne'>;

/** Hodiny prevádzky za rok (dni × hodiny denne); undefined, ak chýba niektorý údaj. */
export function hodinyPrevadzkyZaRok(b: Vyuzitie): number | undefined {
  const h = b.vyuzitieDniVRoku * b.vyuzitieHodinDenne;
  return h > 0 ? h : undefined;
}

/**
 * Upozornenie na zjavný nesúlad údajov (nie chyba, nič sa neblokuje):
 * počet dní presahuje to, čo sa zmestí do zadaného počtu mesiacov.
 * Vráti undefined, ak je všetko v poriadku alebo mesiace nie sú vyplnené.
 */
export function upozorneniePoctuDni(b: Vyuzitie): string | undefined {
  const { vyuzitieDniVRoku: dni, vyuzitieMesiacovVRoku: mes } = b;
  if (!(dni > 0) || !(mes > 0)) return undefined;
  const maxDni = Math.min(365, Math.ceil(mes * 31));
  if (dni > maxDni) {
    return `${dni} dní sa nezmestí do ${mes} ${mes === 1 ? 'mesiaca' : 'mesiacov'}. Skontrolujte počet dní alebo počet mesiacov.`;
  }
  return undefined;
}
