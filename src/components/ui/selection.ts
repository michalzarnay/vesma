/**
 * Spoločný predikát „je táto možnosť vybraná" pre všetky výberové prvky
 * (SelectCard, výber areálov). Samostatná funkcia, aby sa dala testovať
 * bez vykresľovania a aby žiadny prvok nespoliehal len na farbu (podnety 96, 128).
 *
 * Prázdna hodnota (undefined, null, '') nikdy nevyberie žiadnu možnosť.
 */
export function jeVybrana(
  hodnota: number | string | null | undefined,
  moznost: number | string,
): boolean {
  if (hodnota === undefined || hodnota === null || hodnota === '') return false;
  return hodnota === moznost;
}
