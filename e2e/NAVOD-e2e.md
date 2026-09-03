# E2E testy VESMA (Playwright)

Funkčné testy, ktoré preklikajú dotazník ako reálny používateľ a strážia, že
sa nerozbije navigácia, vykreslenie krokov ani export. Sú postavené tak, aby
chránili pred slepými UI opravami auto-fix agenta (pozri `CLAUDE.md`).

## Inštalácia (jednorazovo)

```bash
npm i -D @playwright/test
npx playwright install chromium
```

Pridaj do `package.json` (sekcia `scripts`):

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

> Poznámka: úprava `package.json` je na tebe (ľudská brána). Vyššie sú navrhnuté
> riadky, nie automatická zmena.

## Spustenie

```bash
npm run test:e2e        # bežne v termináli
npm run test:e2e:ui     # interaktívny režim na ladenie selektorov
```

Playwright si sám spustí `npm run dev` (port 5173) a po teste ho zhasne.

## Čo testy pokrývajú

| Súbor | Pokrýva |
|---|---|
| `smoke.spec.ts` | nábeh appky, preklik všetkými 6 krokmi, rýchla navigácia |
| `vysledky-export.spec.ts` | vykreslenie Výsledkov, stiahnutie XLSX a CSV |
| `vystup-obsahuje-zadane.spec.ts` | čo som zadal, to je vo Výsledkoch aj v exporte — pre každý typ entity |
| `stav-bez-dat.spec.ts` | čerstvá relácia, prázdny areál a areál bez budov na Výsledkoch aj v exporte |
| `sezonna-stavba.spec.ts` | otázka o sezónnej stavbe a nehodnotená energetika vo Výsledkoch aj v exporte |
| `vysvetlenie-skore.spec.ts` | pri komponente bez bodov je napísané, ktorý údaj chýba (aj v exporte) |
| `nove-polia-verzia.spec.ts` | nové otázky vo formulári budovy, pripomienka pri staršej relácii |
| `podnety-pokrytie.spec.ts` | ikonka „Pridať podnet" naprieč typmi polí |
| `pozemok-nadrze-objem.spec.ts` | objem nádrží prijme desatinné m³ |
| `chatbot.spec.ts` | asistent mapera: otvorenie panelu, odpovede z FAQ |

`helpers/stubs.ts` zmocňuje externé siete (Nominatim, Open-Meteo, Photon,
`/api/pvgis`, `/api/svp-flood`), aby boli testy deterministické.

`helpers/entity.ts` drží zoznam typov entít dotazníka (`TYPY_ENTIT`) a náradie
na čítanie obsahu exportovaného zošita. Platí tu pravidlo „oprav triedu, nie
výskyt" z `CLAUDE.md`: **keď v dotazníku pribudne nová entita, pridá sa položka
do zoznamu — nie štvrtá kópia toho istého scenára.** Entita, ktorá sa do výstupu
zatiaľ nedostane, má v položke `chyba: '#<číslo issue>'`; test na nej beží ako
`test.fixme`, takže nezhadzuje CI a je vidieť, na čo sa čaká. Opravuje sa
produkčný kód v tom issue, nie test.

Dnes takto čakajú:

- **#209** — „Iné stavby" (krok 4) nie sú v exporte ani vo Výsledkoch,
- **#223** — „Zamýšľané B&G opatrenia" (krok 5) tiež nie; v exporte figurujú
  len pri porovnaní viacerých areálov.

## Známe obmedzenia / čo doladiť pri prvom behu

- **Žiadne `data-testid`.** Selektory idú cez rolu + slovenský text (`Ďalej`,
  `Exportovať XLSX`…). Ak sa text v UI zmení, treba upraviť selektor. Odporúčam
  doplniť zopár stabilných `data-testid` na najkrehkejšie miesta (prepínač
  entít `EntityTabBar`, `ScoreGauge`, hlavné navigačné tlačidlá) — je to malá,
  bezpečná zmena, ktorá testy spevní.
- Polia formulárov sa hľadajú cez presný text menovky (`pole()` v
  `helpers/entity.ts`) — menovka nie je s poľom zviazaná cez `htmlFor`, takže
  `getByLabel` nefunguje. Premenovanie otázky v UI si vyžiada úpravu testu.

## Ďalšie rozšírenie (návrh poradia)

1. Perzistencia: reload zachová rozpracovaný areál; „Nový areál" ho vyčistí.
2. Podmienené sekcie (`ConditionalSection`): zobrazenie/skrytie podľa odpovedí.
3. Kontrakt exportu: porovnanie štruktúry XLSX/CSV oproti očakávaným
   stĺpcom (G-label) — ako strážny test, ktorý kontrakt NEMENÍ.
4. Porovnanie viacerých areálov (`comparisonXlsxExport.ts`) — dnes bez
   e2e pokrytia.
