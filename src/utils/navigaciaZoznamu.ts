/**
 * Pohyb šípkami v zozname návrhov (výber obce, adresa). Čistá logika bez Reactu,
 * aby sa dala testovať samostatne; používa ju `useNavigaciaZoznamu`.
 */
export type SmerPohybu = 'dole' | 'hore';

/**
 * Index zvýraznenej položky po stlačení šípky. `-1` znamená, že nie je zvýraznená
 * žiadna (pole je v stave písania). Z poslednej položky sa pokračuje na prvú a naopak.
 */
export function dalsiAktivny(aktivny: number, pocet: number, smer: SmerPohybu): number {
  if (pocet <= 0) return -1;
  if (smer === 'dole') return aktivny < 0 || aktivny >= pocet - 1 ? 0 : aktivny + 1;
  return aktivny <= 0 || aktivny >= pocet ? pocet - 1 : aktivny - 1;
}

/** Je zvýraznená platná položka zoznamu? */
export function jePlatnyIndex(aktivny: number, pocet: number): boolean {
  return Number.isInteger(aktivny) && aktivny >= 0 && aktivny < pocet;
}
