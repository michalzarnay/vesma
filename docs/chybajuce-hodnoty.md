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

## Register adries SR — čaká na stiahnutie dát a rozhodnutie majiteľa

Podnety č. 13 (#127), 98 a 99: výber adresy areálu z registra adries a predvyplnenie
obce, okresu a kraja. Majiteľ rozhodol ísť do registra. Zdroj sa z prostredia, v ktorom
vznikajú zmeny (žiadny výstup na internet), nedá overiť, preto sa nič neimplementovalo.

### Čo je zistené (z opisov datasetov na portáli, ktoré vložil majiteľ 16. 10. 2026)

Zistenia sú z textov na portáli data.slovensko.sk / data.gov.sk. Formát súborov,
veľkosť, API ani licenciu zatiaľ nikto neotvoril, preto sú tieto veci v tabuľke nižšie.

- **Register adries** (MV SR) je dataset s vysokou hodnotou (HVD), územná platnosť SR,
  aktualizácia každých 24 hodín. URI: `https://data.gov.sk/set/a08562a8-e237-4e7f-a40a-9d0622445c6d`.
- **Register ulíc** (`f2b3af7a-b4d4-45d7-9605-29fa5d7ad115`) je *len zoznam ulíc*, nie
  úplných adries. Aktualizácia nepravidelná, posledná zmena 12. 4. 2024. Samotný nestačí na
  výber adresy s číslom, ani na predvyplnenie okresu a kraja.
- **Datasety z tej istej série** na data.slovensko.sk (podľa ID z portálu):
  - Adresy podľa krajov (csv): `b27f57f1-7e76-45e0-8968-631f9176b2e9`
  - Register obcí: `1277119c-0c20-40c5-9416-30afcc31e7b3`
  - Register okresov: `e3b16084-a8e5-4c68-90d3-c96d71511bcc`
  - Register krajov: `fdf7a94c-6ce6-490a-a9a7-b979823735b8`
  - Register častí obcí: `dde68094-8187-4a8a-88f3-e79a6565d6d5`
  - Register ulíc: `f2b3af7a-b4d4-45d7-9605-29fa5d7ad115`
  - Register vchodov (orientačných čísiel): `db1e7bd7-a7d4-4eac-8e5e-0c843b9dc7d5`
  - Register budov (súpisných čísiel): `14fae22e-96ff-4d26-82af-435f8d7a4fb6`
  - Register bytov: `0114b6e3-27a6-4549-9a58-3a9033a77675`
  - Cestné úseky ulíc (geografická reprezentácia): `6a81933d-2871-46b9-a26e-8ca980f83e99`
  - Zmenové dávky: `7c196993-fcd2-407c-ac6c-f4a4ca68cef5`, od 27. 5. 2024 do 31. 1. 2025 `de3dd18f-9124-4acb-ae00-705555332256`
- **Navrhované poradie** (od najľahšieho, každý krok je samostatný PR):
  1. obce + okresy + kraje do jedného malého statického súboru v repozitári (bez externého volania, bez dopadu na súkromie) → podnety 99 a 100;
  2. ulice podľa obce → výber ulice (podnet 98);
  3. úplné adresy so súpisným a orientačným číslom len cez serverovú funkciu alebo vlastný index (dáta budú veľké) → podnet 13, vyžaduje rozhodnutie R3.
  Súbor v kroku 1 a 2 by vznikol skriptom v `scripts/`, aby sa dal obnoviť, keď sa zdroj zmení.

| # | Čo chýba | Kto / čo je potrebné | Stav | Čo bez toho nefunguje |
|---|---|---|---|---|
| R1 | Pre každý dataset z kroku 1 a 2 (obce, okresy, kraje, ulice): odkaz na distribúciu (súbor alebo API), formát, veľkosť, licencia a podmienky použitia (uvedenie zdroja), ukážka aspoň 20 riadkov so stĺpcami | človek s prístupom na internet (stránky datasetov na data.slovensko.sk), alebo povolenie sieťového prístupu pre prostredie, v ktorom pracuje Claude (domény `data.slovensko.sk`, `data.gov.sk`) | čaká | Bez toho sa nedá napísať skript na spracovanie ani test na fixtúrach; nič sa nesmie vymýšľať. |
| R2 | Väzby medzi číselníkmi: či záznam obce nesie kód okresu a záznam okresu kód kraja (potrebné pre obec → okres → kraj). Dnes je v `src/data/slovakLocations.ts` len zoznam názvov obcí `OBCE_SR` bez väzby a okresy podľa krajov | pozrie sa do ukážky z R1 (alebo číselník obcí Štatistického úradu SR) | čaká | Pri ručne zadanej obci (podnet 99) sa kraj a okres nedajú predvyplniť. Dnes sa dopĺňajú len po výbere návrhu z Photonu (OSM). |
| R3 | Rozhodnutie o odosielaní rozpísanej adresy externej službe (Photon, serverová funkcia, register) a o texte upozornenia pri poli | majiteľ (CLAUDE.md, bod 3) | čaká | Aplikácia tvrdí, že dáta ostávajú v prehliadači. Platí len pre krok 3; kroky 1 a 2 so statickým súborom nič neodosielajú. Návrh textu je v PR #259. |
| R4 | Veľkosť súborov ulíc a adries a rozhodnutie, čo sa môže dostať do prehliadača (celý súbor, súbor po obciach, alebo len cez server) | po R1; rozhodnutie majiteľa a Claude | čaká | Určuje, či sa dá krok 2 a 3 spraviť ako statický súbor. |

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
