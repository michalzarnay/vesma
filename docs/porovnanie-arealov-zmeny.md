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
   - „Plocha striech vhodných pre FV (orientácia J/V/Z/JV/JZ)" →
     použité `strechaOrientovanaPlochaNaJuh` (appka eviduje iba orientáciu
     na juh, nie ostatné svetové strany).
   - „Nezateplená fasáda/strecha" a jej odpočet → odvodené zo
     `strechaZateplenie`/`zateplenieFasady` (0/1/2) krát `plochaPodorysu`
     resp. `fasadaOrientovanaNaJuh` (čiastočné zateplenie = 50 %).
   - „Osvetlenie nie-LED" a jeho odpočet → `uzitkovaPlochaNUS × (1 −
     osvetlenieLED %)` ako m² proxy (appka eviduje LED iba ako %, nie m²
     ani počet svietidiel).

3. **Vynechané parametre** oproti zdrojovej tabuľke váh (OZE+energetika):
   - „Plocha pozemkov vhodná pre FV alebo solárne kolektory" — `Pozemok`
     nemá žiadny údaj o orientácii/vhodnosti pre FV.
   - „Spotreba energie nad referenčnou hodnotou [kWh/m²/rok]" — referenčná
     (benchmark) hodnota nie je nikde v appke definovaná; vymyslieť si ju
     bez podkladu by bolo riskantné.
   - Tieto dva zostávajú mimo výpočtu; keď pribudnú podklady, dá sa doplniť
     ako ďalší riadok v `ENERGIA_PARAMETERS`.

4. **Energetické váhy nie sú finálne** (potvrdené v zadaní) — momentálne sa
   používa jedna spoločná váha na parameter (bez delenia na podoblasti).
   Štruktúra (`EnergiaParameter[]`) je pripravená na budúce rozdelenie.
   Aktualizované 2026-09-02 — pozri nižšie.

5. **Export XLSX** — hárky `export-pozemky`, `export-budovy`, `export-BG`
   sú surový dump dát za všetky vybrané areály (rovnaká logika ako
   jednoareálový export, len s pridaným stĺpcom „Areál"). Hárok
   `Vyhodnotenie` vynecháva pôvodné ručne dopĺňané stĺpce s odporúčaniami
   (zoznam „x" značiek pre konkrétne opatrenia a textové závery) — tie vo
   vzore vznikali manuálne/expertne, appka ich zatiaľ automaticky
   negeneruje.

## Zmeny 2026-09-02 — pripomienky energetického experta (issues #180 a #182)

Zdroj pripomienok: `VESMA_viac_LuGrkomentare.xlsx`, karta „OZE+energetika";
súvislosti sú rozpísané v `docs/energetika-poziadavky.md`, kap. D0.

- **Štyri energetické parametre prešli z počtu budov na plochu** —
  `energia_plyn_potencial_tc`, `energia_elektrina_potencial_tc`,
  `energia_vystavba_pred_1980` a `energia_odratat_tc`. Expert to žiadal pri
  všetkých parametroch viazaných na počet budov.
- **Nový parameter `energia_plyn_potencial_biomasa`** — prechod z plynu na
  pelety alebo štiepku, ako alternatíva k tepelnému čerpadlu pri starších
  budovách. Nezapočíta sa budove, ktorá už biomasu má.
- Pribudlo opatrenie `kotol-na-biomasu` v `src/data/catalog.ts` a pravidlo
  v `useRecommendations.ts` (staršia budova na plyne).

### Váhy na doladenie expertom

Hodnoty **6, 6, 4, −1** zostali nezmenené, zmenila sa len veličina, na ktorú sa
aplikujú (z „počet budov" na „m²"). Prevod jednotky nemá meniť dôležitosť
parametra, preto sa zachovalo poradie, ktoré expert schválil. Až touto zmenou
začnú tieto parametre v súčte reálne vážiť — pri počte budov prispievali
jednotkami, kým plošné parametre tisíckami, takže boli prakticky neviditeľné.

Váha nového parametra biomasy je **3**, teda polovica váhy prechodu na tepelné
čerpadlo. Dôvod: ide o alternatívnu cestu pre tie isté budovy, nie o ďalší
nezávislý potenciál — plocha plynom kúrenej budovy sa započíta do oboch
parametrov naraz a nižšia váha to má kompenzovať. **Ak expert považuje
dvojité započítanie za neželané, treba sa rozhodnúť medzi znížením váh a tým,
že sa budove priradí len jedna (vhodnejšia) cesta.**

### Použitá plocha

Expert žiadal „úžitkovú **plochu/vykurovanú**". Vykurovanú plochu dátový model
zatiaľ neeviduje (dopĺňa ju issue #181), preto sa dočasne používa
`uzitkovaPlochaNUS` cez pomocnú funkciu `plochaBudovy()` v
`comparisonWeights.ts` — po #181 stačí zmeniť túto jednu funkciu.

### Ceny v katalógu

Orientačná cena a návratnosť pri opatrení `kotol-na-biomasu` sú označené ako
hodnoty na potvrdenie energetickým expertom. Pri dotáciách sú uvedené programy
bez konkrétnych súm, keďže tie sa menia s každou výzvou.

## Čo som nestihol/nemohol overiť

- SharePoint odkaz na vzor exportu vyžadoval prihlásenie cez Microsoft
  konto — nebolo možné ho otvoriť automaticky, preto bol následne priložený
  lokálny súbor `Vyhodnotenie.xlsx`, z ktorého štruktúra vychádza.
- Presné poradie/názvy stĺpcov v exporte odporúčam ešte raz prejsť oproti
  aktuálnym reálnym dátam (napr. cez skúšobný export s 2–3 reálnymi
  areálmi) predtým, než sa použije produkčne.
