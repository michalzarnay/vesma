/**
 * Adresy serverless funkcií (`/api/…`) vrátane základnej cesty nasadenia.
 *
 * VESMA sa nasadzuje pod cestou `/vesma/` (na Verceli aj za proxy na
 * https://inovia.sk/vesma/), takže volania API musia ísť na `/vesma/api/…` —
 * inak by za proxy skončili mimo nej, na `https://inovia.sk/api/…`.
 * Základnú cestu dopĺňa Vite cez `import.meta.env.BASE_URL`.
 */
export function apiUrl(cesta: string, base: string = import.meta.env.BASE_URL): string {
  const zaklad = base.endsWith('/') ? base : `${base}/`;
  return `${zaklad}api/${cesta.replace(/^\/+/, '')}`;
}
