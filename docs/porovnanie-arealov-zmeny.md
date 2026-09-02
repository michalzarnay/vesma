# Porovnanie areálov — zoznam zmien a rozhodnutí na kontrolu

Implementované 2026-08-13 na základe zadania a dvoch priložených súborov:
`VESMA_vahy pre vibe coding.xlsx` (váhy) a `Vyhodnotenie.xlsx` (vzor exportu).

## Čo bolo pridané

- **Nová funkcia „Porovnanie areálov"** — tlačidlo v hlavičke vedľa „Relácie".
  Načíta uložené relácie (+ aktuálne rozpracovaný areál, ak má názov),
  používateľ vyberie ≥2 areály, appka spočíta štyri sumárne hodnoty
  (Sucho / Horúčavy / Voda / Energia) a zoradí areály podľa potenciálu.
- **Export do XLSX** („Vyhodnotenie" zošit) so 6 hárkami: `váhy`,
  `Vyhodnotenie`, `export-areál`, `export-pozemky`, `export-budovy`,
  `export-BG` — štruktúra podľa vzoru, hlavičky prepočítané na aktuálny
  dátový model v2.4 a pôvodná jedna hodnota „Potenciál areálu pre BG
  opatrenia" nahradená štyrmi hodnotami (sucho/horúčavy/voda/energia).
- **Nové pole `Budova.vystavbaPred1980`** (áno/nie) — pridané na explicitnú
  žiadosť v priebehu úlohy, otázka „Je rok výstavby budovy pred rokom 1980?"
  vo formulári budovy (Krok 3, sekcia Základné informácie).
- Nové súbory: `src/types/comparison.ts`, `src/data/comparisonWeights.ts`,
  `src/utils/comparisonScoring.ts`, `src/utils/comparisonXlsxExport.ts`,
  `src/components/comparison/AreaComparisonView.tsx`,
  `src/utils/__tests__/comparisonScoring.test.ts`.
- Existujúci export jedného areálu (`src/utils/xlsxExport.ts`) a jeho
  dátový/exportný kontrakt **neboli menené** (mimo rozsahu úlohy).

## Rozhodnutia, ktoré treba potvrdiť/skontrolovať

1. **Odvod vody do kanalizácie (pozemky)** — váhová tabuľka má jednu
   kategóriu „kanalizácia", schéma v2.4 ju delí na 3 polia (jednotná/
   splašková/zrážková). Použil som **súčet všetkých troch**
   (`comparisonWeights.ts` → `pozemky_odvod_kanalizacia`). Ak má byť použitá
   len jednotná kanalizácia, treba zmeniť jeden riadok.

2. **Aproximácie pri energetických parametroch** (kde presné pole
   neexistuje, ale dá sa rozumne odvodiť z existujúcich polí — bez zmeny
   dátového modelu):
   - ~~„Plocha striech vhodných pre FV (orientácia J/V/Z/JV/JZ)" →
     použité `strechaOrientovanaPlochaNaJuh`~~ — **zmenené (issue #179,
     pripomienka energetického experta):** započítava sa iba plochá / málo
     šikmá strecha do 15° (`strechaTyp === 1`), kde pole
     `strechaOrientovanaPlochaNaJuh` znamená „využiteľná plocha strechy".
     Šikmé a strmé strechy sa nezapočítavajú bez ohľadu na orientáciu.
     Rovnaký filter platí v skóre OZE (`useScoring.calculateOZE`)
     a v odporúčaniach fotovoltiky a solárnych kolektorov.
   - ~~„Nezateplená fasáda/strecha" a jej odpočet → `fasadaOrientovanaNaJuh`~~
     — **opravené (issue #176):** fasáda sa počíta z celého obvodového
     plášťa — nové pole `Budova.plochaObvodovehoPlasta`; ak nie je
     vyplnené, odhadne sa ako obvod štvorcového pôdorysu (4·√pôdorys) ×
     počet podlaží (úžitková / pôdorys, min. 1) × 3,3 m
     (`getPlochaObvodovehoPlasta` v `src/utils/calculations.ts`).
     Strecha zostáva `plochaPodorysu`, čiastočné zateplenie = 50 %.
   - „Osvetlenie nie-LED" a jeho odpočet → `uzitkovaPlochaNUS × (1 −
     osvetlenieLED %)` ako m² proxy (appka eviduje LED iba ako %, nie m²
     ani počet svietidiel).

3. **Vynechané parametre** oproti zdrojovej tabuľke váh (OZE+energetika):
   - ~~„Plocha pozemkov vhodná pre FV alebo solárne kolektory"~~ —
     **doplnené (issue #184):** nové pole `Pozemok.plochaVhodnaPreFV`
     a parameter `energia_pozemky_fv` s váhou 3 podľa tabuľky; vo formulári
     je pri otázke upozornenie na regulačnú neistotu umiestňovania FVE
     na zelených plochách.
   - „Spotreba energie nad referenčnou hodnotou [kWh/m²/rok]" — referenčná
     (benchmark) hodnota nie je nikde v appke definovaná; vymyslieť si ju
     bez podkladu by bolo riskantné. Zostáva mimo výpočtu; keď pribudnú
     podklady, dá sa doplniť ako ďalší riadok v `ENERGIA_PARAMETERS`.

4. **Energetické váhy nie sú finálne** (potvrdené v zadaní) — momentálne sa
   používa jedna spoločná váha na parameter (bez delenia na podoblasti).
   Štruktúra (`EnergiaParameter[]`) je pripravená na budúce rozdelenie.

5. **Export XLSX** — hárky `export-pozemky`, `export-budovy`, `export-BG`
   sú surový dump dát za všetky vybrané areály (rovnaká logika ako
   jednoareálový export, len s pridaným stĺpcom „Areál"). Hárok
   `Vyhodnotenie` vynecháva pôvodné ručne dopĺňané stĺpce s odporúčaniami
   (zoznam „x" značiek pre konkrétne opatrenia a textové závery) — tie vo
   vzore vznikali manuálne/expertne, appka ich zatiaľ automaticky
   negeneruje.

## Čo som nestihol/nemohol overiť

- SharePoint odkaz na vzor exportu vyžadoval prihlásenie cez Microsoft
  konto — nebolo možné ho otvoriť automaticky, preto bol následne priložený
  lokálny súbor `Vyhodnotenie.xlsx`, z ktorého štruktúra vychádza.
- Presné poradie/názvy stĺpcov v exporte odporúčam ešte raz prejsť oproti
  aktuálnym reálnym dátam (napr. cez skúšobný export s 2–3 reálnymi
  areálmi) predtým, než sa použije produkčne.
