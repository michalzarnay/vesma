import {
  BGOpatrenie, Budova, InaStavba, Pozemok,
  createEmptyBGOpatrenie, createEmptyBudova, createEmptyInaStavba, createEmptyPozemok,
} from '../types/areal';

/**
 * Predikát „položka má vyplnený obsah" — spoločný pre všetky miesta, kde sa
 * jedným klikom maže používateľom zadaný obsah (parcela, budova, iná stavba,
 * BG opatrenie). Položka je prázdna, ak sa okrem `id` zhoduje s čerstvo
 * vytvorenou prázdnou položkou.
 */
function hlbokoRovnake(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => hlbokoRovnake((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

function lisiSaOdPrazdnej<T extends { id: string }>(polozka: T, prazdna: T): boolean {
  const bezId = (o: { id: string }) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'id'));
  return !hlbokoRovnake(bezId(polozka), bezId(prazdna));
}

export const maVyplnenyPozemok = (p: Pozemok): boolean => lisiSaOdPrazdnej(p, createEmptyPozemok());
export const maVyplnenuBudovu = (b: Budova): boolean => lisiSaOdPrazdnej(b, createEmptyBudova());
export const maVyplnenuInuStavbu = (s: InaStavba): boolean => lisiSaOdPrazdnej(s, createEmptyInaStavba());
export const maVyplneneBGOpatrenie = (o: BGOpatrenie): boolean => lisiSaOdPrazdnej(o, createEmptyBGOpatrenie());

/** Text potvrdenia — rovnaký štýl ako v SessionManageri (`Zmazať reláciu „…"?`). */
export function textPotvrdeniaMazania(druh: string, nazov: string): string {
  return `Zmazať ${druh} „${nazov}"? Vyplnené údaje sa nedajú vrátiť.`;
}
