// KONFIGURÁCIA — hustota inštalovaného príkonu osvetlenia [W/m²]
// ---------------------------------------------------------------------------
// Slúži ako ZÁLOŽNÝ ODHAD pre budovy, kde používateľ nepozná počet svietidiel
// (issue #183). Keď počet svietidiel zadaný je, počíta sa z neho — táto tabuľka
// sa vtedy použije len na prepočet počtu kusov na watty.
//
// ⚠️ POZOR — ide o ODHADY, nie o záväzné hodnoty:
// Oficiálna prepočtová tabuľka „plocha → W" pre osvetlenie v slovenskej
// legislatíve NEEXISTUJE. Vyhláška č. 541/2007 Z. z. a STN EN 12464-1 predpisujú
// výstupnú osvetlenosť v luxoch, nie inštalovaný príkon; vyhláška č. 364/2012 Z. z.
// počíta príkon osvetlenia metódou LENI podľa STN EN 15193 z konkrétnych svietidiel
// a prevádzkových časov. Hodnoty nižšie sú preto len orientačné pásma z bežnej
// projekčnej praxe pri LED technológii (zadané 2. 9. 2026 v issue #183) a môžu byť
// časom spresnené.
//
// AKO HODNOTY ZMENIŤ: prepíšte čísla v tabuľke HUSTOTA_PRIKONU_OSVETLENIA nižšie.
// Nič iné meniť netreba — všetky výpočty čítajú hodnoty odtiaľto.
// Podrobnosti a zdôvodnenie: docs/osvetlenie-prepocet.md

/** Kategórie priestorov, pre ktoré je hustota príkonu odhadnutá. */
export type KategoriaOsvetlenia = 'kancelarie' | 'sklady_haly' | 'byvanie' | 'predajne';

/** Hustota inštalovaného príkonu osvetlenia [W/m²] — odhad, na spresnenie expertom. */
export const HUSTOTA_PRIKONU_OSVETLENIA: Record<KategoriaOsvetlenia, number> = {
  kancelarie: 6,   // kancelárie, školy, úrady (pásmo z praxe 3–8 W/m² pri 500 lx)
  sklady_haly: 5,  // sklady, výrobné a poľnohospodárske haly (pásmo 3–6 W/m²)
  byvanie: 4,      // byty a rodinné domy (pásmo 2–5 W/m²)
  predajne: 12,    // predajne s vyššími nárokmi na osvetlenie (pásmo 8–15 W/m²)
};

/**
 * Priradenie typu objektu (`Areal.typObjektu`) ku kategórii osvetlenia.
 * Typy, ktoré tu nie sú uvedené, spadajú pod predvolenú kategóriu `kancelarie`.
 */
const TYP_OBJEKTU_KATEGORIA: Record<string, KategoriaOsvetlenia> = {
  // Sklady a haly
  vyrobna_hala: 'sklady_haly',
  sklad: 'sklady_haly',
  polnohospodarsky: 'sklady_haly',
  hasicska_zbrojnica: 'sklady_haly',
  // Bývanie
  rd: 'byvanie',
  bd: 'byvanie',
  chalupa: 'byvanie',
  zahradna_chata: 'byvanie',
  ine_sukromne: 'byvanie',
  // Predajne
  obchod: 'predajne',
};

/** Predvolená kategória, keď typ objektu nie je vyplnený alebo nie je v tabuľke. */
export const PREDVOLENA_KATEGORIA_OSVETLENIA: KategoriaOsvetlenia = 'kancelarie';

export function kategoriaOsvetlenia(typObjektu?: string): KategoriaOsvetlenia {
  if (!typObjektu) return PREDVOLENA_KATEGORIA_OSVETLENIA;
  return TYP_OBJEKTU_KATEGORIA[typObjektu] ?? PREDVOLENA_KATEGORIA_OSVETLENIA;
}

/** Hustota inštalovaného príkonu osvetlenia [W/m²] pre daný typ objektu. */
export function hustotaPrikonuOsvetlenia(typObjektu?: string): number {
  return HUSTOTA_PRIKONU_OSVETLENIA[kategoriaOsvetlenia(typObjektu)];
}
