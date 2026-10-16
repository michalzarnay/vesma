# Svetlý a tmavý režim

## Voľba používateľa

V **Menu → Vzhľad** sú tri možnosti (bežná konvencia, napr. GitHub, Google, MDN):

| Voľba   | Správanie |
|---------|-----------|
| Svetlý  | vždy svetlý vzhľad |
| Tmavý   | vždy tmavý vzhľad |
| **Auto** (predvolené) | podľa nastavenia systému, ktoré prehliadač hlási cez `prefers-color-scheme`; pri zmene v systéme sa VESMA prepne bez obnovenia stránky |

Ak prehliadač preferenciu nehlási vôbec (nepodporuje `prefers-color-scheme`),
použije sa **tmavý** režim. Pozor: bežné prehliadače preferenciu hlásia vždy —
keď v systéme nie je nič nastavené, hlásia „svetlý". Tmavý režim teda bez
zásahu používateľa naskočí len tomu, kto ho má zapnutý v systéme/prehliadači.

Voľba sa pamätá v `localStorage` (`vesma_vzhlad`), nie v relácii areálu — je to
nastavenie zariadenia, nie údaj o areáli. Exporty (PDF, XLSX, CSV) sú v oboch
režimoch rovnaké.

## Ako to funguje

- `<html data-theme="light|dark">` nastaví skript v `index.html` ešte pred
  načítaním aplikácie (stránka pri štarte nezabliká na bielo) a potom
  `src/utils/tema.ts`. Zhodu oboch kópií logiky stráži `tema.test.ts`.
- V `src/index.css` blok `:root[data-theme='dark']` prestaví paletu cez CSS
  premenné. Sivé a farebné odtiene sa „otočia": 50–300 (plochy, okraje) sú
  tmavé, 400–900 (text, ikony) svetlé. Komponenty preto **nepotrebujú
  `dark:` varianty** — `text-red-700` na `bg-red-50` je čitateľné v oboch režimoch.

## Pravidlá pre nový kód

- Plocha karty/dialógu/poľa: **`bg-surface`**, nie `bg-white` (test to stráži).
  `bg-white/10`, `/20` ako priesvitné prekrytie na fotke či modrej ploche je v poriadku.
- Text značkovou modrou: **`text-brand-ink`**. `bg-brand-strong` ostáva pre
  plochy s bielym textom (v oboch režimoch rovnaká).
- Plná farebná plocha s bielym textom: **`bg-pevna-*`** (napr. `bg-pevna-red-600`),
  lebo `red-600` sa v tmavom režime zosvetlí.
- Farby v SVG/inline štýloch cez premenné: `var(--color-gray-200)`,
  farby skóre cez `farbaUrovneNaObrazovke()` (`src/types/scoring.ts`).
- Nové pevné hex farby v komponentoch nepridávať; ak treba novú farbu, pridaj
  token do oboch blokov v `src/index.css` a jeho kontrast do `kontrast.test.ts`.

Kontrast tmavej palety (WCAG AA 4,5 : 1 pre text, 3 : 1 pre ikony) strážia testy
v `src/utils/__tests__/kontrast.test.ts` rovnako ako pri svetlej.
