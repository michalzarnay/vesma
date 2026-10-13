/**
 * Predikáty pre výberové prvky (SelectCard, taby, voľba areálov na porovnanie).
 * Jedno miesto pre otázku „je táto možnosť vybraná?" a „je v poli niečo vybrané?",
 * aby sa označenie výberu nerozchádzalo medzi komponentmi (podnety č. 96, 128).
 */
export type HodnotaMoznosti = number | string;

/** Je možnosť `moznost` práve vybraná pri aktuálnej hodnote `hodnota`? */
export function jeMoznostVybrana(hodnota: HodnotaMoznosti | null | undefined, moznost: HodnotaMoznosti): boolean {
  return hodnota !== null && hodnota !== undefined && hodnota === moznost;
}

/** Je pole nevyplnené, t. j. hodnota nezodpovedá žiadnej z ponúkaných možností? */
export function jeVyberNevyplneny(
  moznosti: readonly { value: HodnotaMoznosti }[],
  hodnota: HodnotaMoznosti | null | undefined,
): boolean {
  return !moznosti.some((m) => jeMoznostVybrana(hodnota, m.value));
}
