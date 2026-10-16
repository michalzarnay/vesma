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
| E6 | Výhrevnosti palív (`FUEL_CONVERSIONS`: pelety 4,8 / štiepka 4,0 / uhlie 8,0 / drevo 4,3 kWh/kg) | `src/data/constants.ts` | návrh | Hodnoty v kóde sú, ale bez zdroja — a používateľ ich nevie prepísať, hoci bod 3 písm. a) prílohy č. 1 vyhlášky č. 179/2015 Z. z. žiada výhrevnosť zistenú z dokladov. Prepočítava sa nimi zadané palivo v kg na kWh, takže chyba sa premietne do mernej spotreby aj do porovnania. Drevo s vlhkosťou 20 % a 50 % sa líši takmer dvojnásobne (pozri A1 v `docs/energetika-poziadavky.md`). |

## Modrozelená infraštruktúra — čaká na expertku

Podklad so všetkými tabuľkami: `docs/VESMA_podklad_pre_MZI_experta.xlsx` (žlté
bunky sú na vyplnenie), rozbor v `docs/mzi-podklad-pre-experta.md`. Hodnotenie
podľa metodiky KLIMASKEN zaviedol #212, podklad #214.

| # | Hodnota | Kde v kóde | Stav | Čo bez nej nefunguje |
|---|---|---|---|---|
| M1 | Váhy komponentov skóre MZI (`MZI_VAHY` = 45 / 25 / 15 / 15) | `src/utils/mziKlimasken.ts` | návrh | Klimasken váhu medzi indikátormi nedáva — rozdelenie je naše. Otvorené je aj to, či má byť v skóre štvrtý komponent „zadržanie odtoku na mieste". |
| M2 | Koeficienty pre povrchy, ktoré metodika nepozná: `neurcenyPolopriepustny` a polovegetačné tvárnice 0,3, jazierko ako plošné HDV 1,0, nezdravé stromy ako mladé 0,4, zelená strecha 16 – 35° (`extenzivnaSikma`) 0,3 | `src/utils/mziKlimasken.ts` (`KOEF_OKOLIE`, `KOEF_BUDOVY`) | návrh | Štyri zaradenia sme rozhodli sami, lebo metodika na ne odpoveď nedáva. |
| M3 | Koeficient odtoku strechy `KOEF_ODTOKU_STRECHY = 0,8` | `src/utils/mziKlimasken.ts` | návrh | Metodika ho odvodzuje z krytiny, VESMA má krytinu len ako voľný text. |
| M4 | Počet osôb pre návrh nádrže (B-AD10) | `src/utils/mziKlimasken.ts` | čaká | Dnes sa berie z počtu zamestnancov. V škole to nie sú žiaci. |
| M5 | Čísla v textoch odporúčaní: koeficient „zachytí 0,3 m³ na m² strechy ročne" a „nahradiť až 50 %" spevnenej plochy (`useRecommendations.ts`), „min. 30–50 m²" pri jazierku a „min. 3 m³" pri nádrži (`catalog.ts`) | `src/hooks/useRecommendations.ts`, `src/data/catalog.ts` | čaká | Čísla sú bez zdroja. Pri koeficiente zádrže navyše nesedia jednotky — kým to nie je podložené, je správnejšie vetu zrušiť než nechať číslo. |
| M6 | Ceny a návratnosť 14 opatrení MZI | `src/data/catalog.ts` | čaká | Zdroj nie je v nástroji zaznamenaný. Pri dažďovej záhrade či kvitnúcej lúke navyše nie je jasné, čo má „návratnosť" znamenať. |
| M7 | Váha delenej zrážkovej kanalizácie oproti jednotnej | `src/data/comparisonWeights.ts` | čaká | Otvorené rozhodnutie z revízie MZI. |
| M8 | Ceny a návratnosť troch opatrení pre pravidelne obrábanú pôdu (mulčovanie, krycie plodiny, obmedzenie orby) | zatiaľ nie sú v kóde — návrh v [#200](https://github.com/michalzarnay/vesma/issues/200) | čaká | Bez potvrdených cien sa opatrenia do katalógu nepridajú, takže VESMA pri obrábanej pôde zníži skóre, ale nepovie, čo s ňou. Otvorené je aj to, čo pri nich znamená „návratnosť" (je skôr agronomická), či zaradiť aj vetrolam a prahy 50 m² / 500 m². |

## Register adries SR — zdroj overený, čaká na rozhodnutie majiteľa

Podnety č. 13 (#127), 98 a 99: výber adresy areálu z registra adries a predvyplnenie
obce, okresu a kraja. Majiteľ rozhodol ísť do registra. Zdroj bol overený 16. 10. 2026
(postup a čísla nižšie); implementácia ešte nezačala.

### Overený zdroj

Dataset **Adresy podľa krajov (csv)**, Ministerstvo vnútra SR, v katalógu
data.slovensko.sk / data.gov.sk: `b27f57f1-7e76-45e0-8968-631f9176b2e9`
(`https://data.gov.sk/set/b27f57f1-7e76-45e0-8968-631f9176b2e9`).

- **Licencia: CC0 1.0** (verejná doména) pri všetkých distribúciách, bez povinnosti uviesť zdroj.
- **Aktualizácia:** štvrťročne. Názvy súborov nesú mesiac vydania (väčšina `08_2026`;
  súbor Trenčianskeho kraja a súbor „všetky kraje“ majú `04_2026`).
- **Formát:** CSV v UTF-8, oddeľovač `;`, desatinná čiarka v súradniciach, hlavička
  `IDENTIFIKATOR;KRAJ;OKRES;OBEC;CAST_OBCE;ULICA;SUPISNE_CISLO;ORIENTACNE_CISLO_CELE;PSC;ADRBOD_X;ADRBOD_Y`.
  Kraj je bez slova „kraj“ (napr. `Banskobystrický`), v kóde je `Banskobystrický kraj`.
- **Distribúcie:** 9 súborov, jeden na kraj (16 – 25 MB) a jeden „všetky kraje“ (162 MB).
  Odkazy majú tvar `https://data.slovensko.sk/download?id=<UUID distribúcie>`; UUID sa
  zistí cez katalóg (`POST https://data.slovensko.sk/datasets/search`, telo
  `{"language":"sk","page":1,"filters":{},"pageSize":100,"orderBy":"name","queryText":"Adresy podľa krajov"}`).
  Je to rozhranie, ktoré používa samotný web portálu; nie je dokumentované ako verejné API,
  preto skript na spracovanie nemá byť od neho závislý (adresu súboru dostane ako parameter).
- **CORS a limity** sa neoverovali: súbory sa do prehliadača nesmú sťahovať a sťahuje ich
  len skript pri vytváraní číselníkov.
- Samostatné datasety Register obcí / okresov / krajov / ulíc (z opisu série) sa vo
  vyhľadávaní katalógu nenašli. Nie sú potrebné: tento súbor má všetky potrebné stĺpce.

### Čo obsahuje (zmerané na súbore „všetky kraje“)

| Údaj | Hodnota |
|---|---|
| Riadkov (adries) | 1 739 536 |
| Kraje / okresy | 8 / 79 |
| Obce (kombinácia kraj + okres + obec) | 2 927 |
| Rôzne názvy obcí | 2 817 (z toho **95 názvov** je vo viac ako jednom okrese, napr. Riečka, Selce, Podhorie) |
| Časti obcí | 1 744 |
| Dvojice obec + ulica | 27 710 |
| Riadkov bez PSČ | 401 |

Zdroj sa líši od súčasného zoznamu v `src/data/slovakLocations.ts`:
`OBCE_SR` má **821 obcí z 2 817** (723 sa zhoduje, 98 názvov v kóde v registri nie je,
napr. `Abrahamovce` bez dĺžňa, `Bratislava`), zo 79 okresov chýbajú **Prievidza** a
**Svidník** a `Košice-okolie` je v registri `Košice - okolie`.

### Veľkosť odvodených súborov (JSON, nestlačené)

- obec + okres + kraj: **126 kB** → vhodné ako statický súbor v repozitári;
- dvojice obec + ulica: **1,6 MB** → vhodné ako súbor sťahovaný na požiadanie (po krajoch);
- úplné adresy (162 MB): **nie do prehliadača**, len cez server alebo vlastný index.

### Navrhované poradie (každý krok je samostatný PR)

1. **Obce, okresy, kraje** (hotové v PR #288, issue #287) → statický súbor + skript v `scripts/`, ktorý ho vyrobí z CSV
   (podnety 99 a 100). Bez externého volania, preto nič neodchádza z prehliadača.
   Pri 95 názvoch obcí, ktoré sú vo viacerých okresoch, sa okres nesmie hádať: používateľ si
   vyberie okres, alebo sa predvyplní až po jednoznačnej voľbe.
2. **Ulice** podľa obce (súbory po krajoch, načítané až po výbere obce) → výber ulice (podnet 98).
3. **Úplné adresy** s číslami len cez serverovú funkciu alebo index → podnet 13. Vyžaduje
   rozhodnutie R3.

| # | Čo chýba | Kto / čo je potrebné | Stav | Čo bez toho nefunguje |
|---|---|---|---|---|
| R1 | Zdroj: odkaz na súbory, formát, licencia, hlavička a stĺpce | — | **overené 16. 10. 2026** (viď vyššie) | — |
| R2 | Väzba obec → okres → kraj | — | **hotové v PR #288** (`src/data/obceSR.json`, skript `scripts/vyrob-ciselnik-obci.mjs`); väzba je v každom riadku zdroja: v súbore je v každom riadku (2 927 kombinácií). Ostáva len rozhodnutie, ako riešiť 95 názvov obcí vo viacerých okresoch | Podnet 99 sa dá spraviť, treba len dohodnúť správanie pri duplicitných názvoch (návrh: používateľ vyberie okres, predvyplnenie len pri jednoznačnej obci). |
| R3 | Rozhodnutie o odosielaní rozpísanej adresy externej službe (Photon, serverová funkcia) a o texte upozornenia pri poli | majiteľ (CLAUDE.md, bod 3) | čaká | Platí len pre krok 3; kroky 1 a 2 so statickým súborom nič neodosielajú. Dnes už odchádza adresa do Photonu (OSM). Návrh textu je v PR #259. |
| R4 | Rozhodnutie, ktoré súbory sa smú pridať do repozitára / nasadenia: 141 kB (obce) a asi 430 kB (ulice, po krajoch) | majiteľ | **súhlasil 16. 10. 2026** | Určuje rozsah krokov 1 a 2. Licencia CC0 to dovoľuje bez uvedenia zdroja. |
| R5 | Kto a ako často obnoví číselníky (dataset sa mení štvrťročne) | majiteľ | **súhlasil 16. 10. 2026**: skript spúšťa ručne po každom vydaní | Návrh: skript v `scripts/`, spúšťaný ručne po každom vydaní, mesiac vydania uvedený v súbore. |

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
