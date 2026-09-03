# Modrozelená infraštruktúra — čo zostáva na expertke

Prehľad z 3. 9. 2026, po zavedení hodnotenia podľa metodiky KLIMASKEN
(`docs/mzi-hodnotenie-klimasken.md`). Rovnaký formát ako kapitola „Čo zostáva na
energetickom expertovi" v [`energetika-poziadavky.md`](energetika-poziadavky.md),
len pre časť o vode a zeleni.

Zošit so všetkými tabuľkami naraz je
[`VESMA_podklad_pre_MZI_experta.xlsx`](VESMA_podklad_pre_MZI_experta.xlsx) —
žlté bunky sú na vyplnenie, zelený riadok je vzor formátu, pri každej tabuľke je
vysvetlené, načo slúži a čo bez nej VESMA nevie.

## Čo už rozhodnuté je

Aby sa expertka nepýtala dvakrát na to isté:

| Bolo otvorené | Vyriešilo to |
|---|---|
| Koeficienty priepustnosti povrchov (predtým paušálnych 0,5 pre všetky polopriepustné) | Funkčné koeficienty MZI z metodických listov B-GOV2 a B-GOV3 |
| Bodové pravidlá skóre („dažďová záhrada → +5 b") | Skóre je odvodené z koeficientov a päťstupňovej škály A – E |
| Zložka „potenciál zlepšenia", ktorá pridávala body za zlý stav | Zanikla — potenciál sa v skóre už nemieša so stavom |
| Ako sa z m² a mm zrážok stane m³ | Výpočet B-AD10 (`Q = j · P · fs · ff`), vrátane potrebného objemu nádrže |
| Objem verzus plocha pri dažďovej záhrade a jazierku | Metodika pracuje s plochou; objem má zmysel pri nádržiach a ten B-AD10 počíta |
| Prahy odporúčaní: spevnená plocha nad 15 %, jazierko od 500 m², pokryvnosť korunami pod 30 %, ponuka opatrení | Expertná revízia pravidiel z 1. 9. 2026 ([#156](https://github.com/michalzarnay/vesma/pull/156)) |

## Čo zostáva

| Čo chýba | Kde v kóde | Dôsledok, kým to chýba |
|---|---|---|
| Zaradenie povrchov, ktoré metodika nepozná | `KOEF_OKOLIE.neurcenyPolopriepustny` v `src/utils/mziKlimasken.ts` | Polovegetačné tvárnice, „iný povrch" a nešpecifikovaný zvyšok polopriepustnej plochy sme zaradili medzi kódy B a C hodnotou 0,3. Rovnako sme sami rozhodli, že jazierko je plošný objekt HDV (k = 1,0), že nezdravé stromy sa hodnotia ako mladé (k = 0,4) a že zelená strecha na streche 16 – 35° patrí pod E2 (0,3), hoci metodika E2 definuje „od 35°". |
| Váhy komponentov skóre | `MZI_VAHY` v `src/utils/mziKlimasken.ts` | Klimasken hodnotí každý indikátor samostatným štítkom A – E a váhu medzi indikátormi nedáva. Rozdelenie 45 / 25 / 15 / 15 je naše. Otvorené je aj to, či má byť súčasťou skóre štvrtý komponent „zadržanie odtoku na mieste", ktorý je doplnkom VESMA nad rámec metodiky. |
| Dva vstupy výpočtu B-AD10 | `KOEF_ODTOKU_STRECHY`, `akumulaciaPercent` v `src/utils/mziKlimasken.ts` | Koeficient odtoku strechy `fs = 0,8` je typická hodnota — metodika ho odvodzuje z krytiny, VESMA má krytinu len ako voľný text. Počet osôb `n` berieme z počtu zamestnancov, čo v škole nie sú žiaci ani v kultúrnom dome návštevníci. Ostatné parametre (`ff`, `Sd`, `R`, `z`) sú z metodického listu. |
| Štyri čísla v odporúčaniach | `src/hooks/useRecommendations.ts`, `src/data/catalog.ts` | Veta „Potenciál zachytiť X m³ dažďovej vody ročne" počíta X ako plochu plochých striech × 0,3 — koeficient bez zdroja a s nesediacimi jednotkami (z m² vyjde m³/rok bez zrážok). Ďalej „nahradiť až 50 %" spevnenej plochy a katalógové „min. 3 m³" a „min. 30 – 50 m²". |
| Ceny a návratnosť 14 opatrení MZI | `src/data/catalog.ts` | V repozitári nie je zaznamenané, odkiaľ ceny pochádzajú. Navyše pri opatreniach ako dažďová záhrada či kvitnúca lúka nie je zrejmé, čo má „návratnosť" znamenať — priamy finančný výnos nemajú. |

## Otvorené rozhodnutia

Tri veci mimo skóre, kde nejde o číslo, ale o pravidlo.

| Otázka | Ako to je dnes |
|---|---|
| Má voda odvedená do delenej zrážkovej kanalizácie vážiť rovnako ako voda do jednotnej stokovej siete? | Pri porovnaní areálov sa tri polia sčítavajú do jednej hodnoty s váhami 7 / 5 / 10 (`pozemky_odvod_kanalizacia` v `comparisonWeights.ts`). Otvorené od augusta 2026, pozri [`porovnanie-arealov-zmeny.md`](porovnanie-arealov-zmeny.md), bod 1. |
| Ako má do hodnotenia vstúpiť povodňové riziko budovy? | `Budova.povodnovoRiziko` (1 – 5) sa zisťuje a vie sa načítať z máp SVP, ale nepoužíva sa v skóre, v odporúčaniach ani pri porovnaní areálov. |
| Platia váhy 15 parametrov MZI pri porovnaní areálov aj naďalej? | Pochádzajú z tabuľky „MZI — spoločná dohoda" (august 2026). Zmenil sa im jeden vstup: pravidelne obrábaná pôda sa už nezapočítava do potenciálu na výsadbu stromov. |

## Poznámka k vete o zádrži zelenej strechy

Po zavedení metodiky vie VESMA zachytenú zrážkovú vodu počítať poriadne
(`Q = j · P · fs · ff` z B-AD10). Koeficient 0,3 v odporúčaní zelenej strechy sa
tým dá nahradiť výpočtom — chýba k nemu už len podiel ročného úhrnu, ktorý
extenzívna zelená strecha zadrží. Ak taký údaj expertka nemá, správnejšie je
vetu o potenciáli zrušiť než ju nechať s vymysleným koeficientom.
