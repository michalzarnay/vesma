# Osvetlenie: počet svietidiel a odhad príkonu z plochy

Podklad k issue [#183](https://github.com/michalzarnay/vesma/issues/183).

## Ako VESMA počíta osvetlenie

Poradie zdrojov údajov, od najpresnejšieho:

1. **Počet svietidiel celkom a z toho LED** (`osvetleniePocetSvietidiel`,
   `osvetleniePocetSvietidielLED` v `Budova`). Keď je počet zadaný, podiel LED sa
   počíta z neho a percento LED sa nepoužije.
2. **Percento LED** (`osvetlenieLED`) — záložný údaj, keď počet svietidiel nie je známy.

Veličinou pre váhy porovnania areálov je **odhad inštalovaného príkonu vo wattoch**,
nie m² úžitkovej plochy. Príkon sa odhaduje ako `úžitková plocha × hustota príkonu
podľa typu objektu`. Vďaka tomu osvetlenie nevstupuje do súčtu v m² spolu so
strechami a obálkou budovy (pozri `docs/energetika-poziadavky.md`, kap. D1).

## Hodnoty hustoty príkonu

Zdroj hodnôt: `src/data/lightingPowerDensity.ts` — **tam sa hodnoty menia**, nikde inde.

| Kategória | Hustota príkonu | Pásmo z praxe | Typy objektov |
|---|---|---|---|
| kancelárie | **6 W/m²** | 3–8 W/m² | kancelárie, školy, úrady, zdravotníctvo, kultúra a všetko ostatné (predvolené) |
| sklady, haly | **5 W/m²** | 3–6 W/m² | výrobná hala, sklad, poľnohospodársky areál, hasičská zbrojnica |
| bývanie | **4 W/m²** | 2–5 W/m² | rodinný dom, bytový dom, chalupa, záhradná chata, iný súkromný objekt |
| predajne | **12 W/m²** | 8–15 W/m² | obchod / predajňa |

## Prečo sú to odhady

**Oficiálna prepočtová tabuľka „plocha → W" pre osvetlenie neexistuje.**

- Vyhláška MZ SR č. 541/2007 Z. z. a STN EN 12464-1 predpisujú **výstupnú
  osvetlenosť v luxoch** na pracovnej ploche, nie inštalovaný príkon vo wattoch.
- Vyhláška č. 364/2012 Z. z. počíta príkon osvetlenia metódou **LENI** podľa
  STN EN 15193 — z konkrétnych svietidiel, prevádzkových časov, činiteľa využitia
  denného svetla a činiteľa obsadenosti. Ide o výpočet, nie o tabuľkový prevod.
- Jediná paušálna hodnota vo vyhláške č. 364/2012 Z. z. je náhradná ročná potreba
  energie na osvetlenie (päťdesiatnásobok podlahovej plochy, teda 50 kWh/(m²·rok)) —
  to je ročná spotreba, nie inštalovaný príkon.

Hodnoty v tabuľke vyššie sú preto **orientačné pásma z bežnej projekčnej praxe pri
LED technológii**, zadané zadávateľom 2. 9. 2026 v issue #183. Nie sú záväzné a môžu
byť časom spresnené. Presný postup pre konkrétny priestor je: požadovaná osvetlenosť
(lx) podľa STN EN 12464-1 → návrh svietidiel s ich mernou účinnosťou (lm/W) →
dopočet skutočného príkonu.

## Vplyv na váhy porovnania

Prepočet veličiny z m² na watty si vyžiadal prepočet váh v `src/data/comparisonWeights.ts`,
aby sa nezmenila dôležitosť parametra, len jednotka:

| Parameter | Pôvodne (m²) | Teraz (W) |
|---|---|---|
| Osvetlenie nie-LED → potenciál výmeny | 3 | 0,5 (= 3 ÷ 6 W/m²) |
| Odrátať existujúce LED osvetlenie | −1 | −0,17 (= −1 ÷ 6 W/m²) |

Deliteľom je predvolená hustota 6 W/m². Pri budovách zaradených do iných kategórií
sa príspevok parametra oproti pôvodnému stavu mierne posunie — to je zámer, lebo
hala a predajňa rovnakej plochy nemajú rovnaký potenciál úspory na osvetlení.
Váhy sú návrh na doladenie energetickým expertom.
