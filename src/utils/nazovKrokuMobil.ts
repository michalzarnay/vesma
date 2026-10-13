import { WIZARD_STEPS } from '../types/wizard';

/**
 * Text pre mobilnú hlavičku (podnet 93): názvy všetkých krokov sa na úzkom displeji
 * nezmestia (v pase ostávajú len čísla), preto sa pod pásom ukáže aspoň názov
 * AKTUÁLNEHO kroku, napr. „Krok 3 z 6 – Budovy". Pre neznámy krok vráti prázdny reťazec.
 */
export function nazovKrokuNaMobile(krok: number, kroky = WIZARD_STEPS): string {
  const s = kroky.find((k) => k.id === krok);
  return s ? `Krok ${s.id} z ${kroky.length} – ${s.nazov}` : '';
}

/**
 * Minimálna dotyková plocha 44×44 px na mobile (WCAG 2.5.5 / Apple HIG). Zväčšuje sa
 * len klikacia plocha (min-h/min-w), vizuál ikoniek a písma zostáva; od `sm` sa vracia
 * pôvodná veľkosť.
 */
export const DOTYK_MOBIL = 'min-h-11 min-w-11 sm:min-h-0 sm:min-w-0';
