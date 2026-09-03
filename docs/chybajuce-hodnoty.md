# Register chýbajúcich hodnôt

Jedno miesto pre všetky čísla, ktoré VESMA potrebuje, ale nemá ich kto vymyslieť —
referenčné hodnoty, koeficienty, ceny, návratnosti a váhy. Pravidlo je v `CLAUDE.md`,
bod 1 sekcie „Štyri veci, ktoré rozhoduje človek": **keď zdroj nie je, hodnota
zostáva prázdna a zapíše sa sem.** Na výstupe nie je vidieť, že je odhadnutá,
a nástroj pre samosprávy by tým začal klamať sebavedomo.

Doteraz boli tieto veci rozsypané po `docs/energetika-poziadavky.md`, po dvoch
xlsx podkladoch pre expertov a po komentároch v kóde. Nedalo sa povedať, koľko
ich je ani na kom ktorá visí.

## Stavy

| Stav | Znamená |
|---|---|
| **čaká** | Otázka je položená (alebo pripravená v podklade), odpoveď nie je. Hodnota je v kóde prázdna alebo označená ako odhad. |
| **návrh** | Hodnota v kóde je, ale je to náš odhad — expert ju má potvrdiť alebo prepísať. |
| **potvrdené** | Expert hodnotu potvrdil. Dopíš dátum a meno; riadok tu môže zostať ako záznam. |
| **zamietnuté** | Rozhodli sme, že hodnota nebude a funkcia sa nerobí. Dopíš prečo. |

## Energetika — čaká na energetického experta

Podklad so všetkými tabuľkami: `docs/VESMA_podklad_pre_energetickeho_experta.xlsx`
(žlté bunky sú na vyplnenie). Rozbor je v `docs/energetika-poziadavky.md`.

| # | Hodnota | Kde v kóde | Stav | Čo bez nej nefunguje |
|---|---|---|---|---|
| E1 | Referenčné hodnoty kWh/(m²·rok) podľa typu budovy | nikde — zámerne nedefinované | čaká | VESMA vie povedať, koľko budova spotrebuje, ale nie či je to veľa. Kvôli tomu je z porovnania areálov vynechaný celý parameter „Spotreba nad referenčnou hodnotou". |
| E2 | Finálne energetické váhy | `src/data/comparisonWeights.ts` | návrh | Poradie areálov stojí na hodnotách označených „NIE FINÁLNE HODNOTY". |
| E3 | Cena a návratnosť kotla na biomasu | `src/data/catalog.ts` | čaká | Jediné opatrenie v katalógu s poznámkou „hodnotu potvrdí energetický expert". |
| E4 | Hustota príkonu osvetlenia [W/m²] | `src/data/lightingPowerDensity.ts` | návrh | Odhad z projekčnej praxe. Oficiálna prepočtová tabuľka „plocha → W" v SR neexistuje — pozri `docs/osvetlenie-prepocet.md`. Použije sa len vtedy, keď používateľ nepozná počet svietidiel. |
| E5 | Dennostupne podľa okresu | nikde | čaká | Bez klimatickej normalizácie (STN 73 0550) sa nedá porovnať spotreba z rôznych okresov ani z rôznych rokov. Toto je otázka zdroja dát, nie odhadu. |

## Modrozelená infraštruktúra — čaká na expertku

Podklad a rozbor prichádzajú s PR #214; hodnotenie podľa metodiky KLIMASKEN
zaviedol #212.

| # | Hodnota | Kde v kóde | Stav | Čo bez nej nefunguje |
|---|---|---|---|---|
| M1 | Váhy komponentov skóre MZI (`MZI_VAHY` = 45 / 25 / 15 / 15) | `src/utils/mziKlimasken.ts` | návrh | Klimasken váhu medzi indikátormi nedáva — rozdelenie je naše. Otvorené je aj to, či má byť v skóre štvrtý komponent „zadržanie odtoku na mieste". |
| M2 | Koeficienty pre povrchy, ktoré metodika nepozná: `neurcenyPolopriepustny` a polovegetačné tvárnice 0,3, jazierko ako plošné HDV 1,0, nezdravé stromy ako mladé 0,4, zelená strecha 16 – 35° (`extenzivnaSikma`) 0,3 | `src/utils/mziKlimasken.ts` (`KOEF_OKOLIE`, `KOEF_BUDOVY`) | návrh | Štyri zaradenia sme rozhodli sami, lebo metodika na ne odpoveď nedáva. |
| M3 | Koeficient odtoku strechy `KOEF_ODTOKU_STRECHY = 0,8` | `src/utils/mziKlimasken.ts` | návrh | Metodika ho odvodzuje z krytiny, VESMA má krytinu len ako voľný text. |
| M4 | Počet osôb pre návrh nádrže (B-AD10) | `src/utils/mziKlimasken.ts` | čaká | Dnes sa berie z počtu zamestnancov. V škole to nie sú žiaci. |
| M5 | Čísla v textoch odporúčaní: „nahradiť až 50 %" spevnenej plochy (`useRecommendations.ts:45`), „min. 30–50 m²" pri jazierku a „min. 3 m³" pri nádrži (`catalog.ts`), a koeficient „zachytí 0,3 m³ na m² strechy ročne", ak sa vráti s PR #214 | `src/hooks/useRecommendations.ts`, `src/data/catalog.ts` | čaká | Čísla sú bez zdroja. Pri koeficiente zádrže navyše nesedia jednotky — kým to nie je podložené, je správnejšie vetu zrušiť než nechať číslo. |
| M6 | Ceny a návratnosť 14 opatrení MZI | `src/data/catalog.ts` | čaká | Zdroj nie je v nástroji zaznamenaný. Pri dažďovej záhrade či kvitnúcej lúke navyše nie je jasné, čo má „návratnosť" znamenať. |
| M7 | Váha delenej zrážkovej kanalizácie oproti jednotnej | `src/data/comparisonWeights.ts` | čaká | Otvorené rozhodnutie z revízie MZI. |

## Ako register používať

**Keď narazíš na hodnotu, ktorú by si si musel vymyslieť:** nechaj ju v kóde
prázdnu (alebo ju označ ako odhad), pridaj sem riadok so stavom *čaká* alebo
*návrh* a v PR to napíš. Nový riadok sem patrí aj vtedy, keď hodnotu doplníš
podľa zdroja — s odkazom na ten zdroj a stavom *potvrdené*.

**Keď expert odpovie:** prepíš hodnotu v kóde, zmeň stav na *potvrdené*, dopíš
dátum a od koho. Riadok nemaž — z registra má byť vidieť aj to, čo sa už uzavrelo
a odkiaľ hodnota pochádza.

**Keď sa rozhodne, že hodnota nebude:** stav *zamietnuté* a jedna veta prečo.
Funkcia, ktorá na nej stála, sa má zrušiť, nie nechať s odhadom.
