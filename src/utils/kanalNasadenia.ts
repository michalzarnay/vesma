/**
 * Kanál nasadenia (issue #236).
 *
 * Verejná adresa vesma.inovia.sk mieri na stabilné nasadenie (vetva
 * `stabilna`), ktoré sa mení len vedomým vydaním; každé zlúčenie do `main`
 * ide na testovaciu preview adresu. Rozdiel v aplikácii je len v hlavičke:
 * testovací kanál ukazuje „VESMA Test N", stabilný „VESMA N".
 *
 * Kanál určuje premenná `VITE_VESMA_KANAL` nastavená pri builde — na Verceli
 * len v preview prostredí (`test`). Bez premennej je lokálny dev server
 * testovací a produkčný build stabilný.
 */
export function jeTestovaciKanal(
  kanal: string | undefined = import.meta.env.VITE_VESMA_KANAL,
  dev: boolean = import.meta.env.DEV,
): boolean {
  if (kanal !== undefined && kanal !== '') return kanal === 'test';
  return dev;
}
