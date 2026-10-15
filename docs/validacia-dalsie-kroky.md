# VESMA — kroky a časová os validácie

Verzia 4, stav k 15. 10. 2026. Po piatich prezentáciách pre subregióny.

Zmena oproti verzii 3: pribudol súbor s účasťou na workshopoch (§1 — skutočná
účasť nahrádza zoznam prihlásených, teplý zoznam je 27 obcí, nie 23). Podľa
neho sú prepočítané R6, poznámka k prahu v §5 a ročné KPI v §6. Nový §9 spája
tento plán s plánom INOVIE pre nových lídrov po voľbách a nový §10 zbiera otázky
k záujmu Banskobystrického samosprávneho kraja. Čísla §7 a §8 ostali.

Zmena verzie 3 oproti verzii 2: pribudol zoznam prihlásených na workshopy (§1), krok R6
(obvolať obce, ktoré sa na workshop zapísali a v aplikácii ešte nie sú),
poznámka k prahu z 31. 3. 2027 (§5) a návrh ročného KPI (§6). Čísla sekcií
„Čo sa nerobí" a „Otvorené" sa posunuli na §7 a §8.

Zmena verzie 2 oproti verzii 1: vypadlo meranie v aplikácii a organizácie
v zriaďovateľskej pôsobnosti kraja, pribudla časť K a presmerovanie dopytu od
tímu zadávateľky. Žiadny krok v tomto dokumente nie je vývoj.

---

## 1. Východiskový stav

### Zoznam prihlásení do aplikácie (k 30. 9. 2026)

Nie sú to registrácie. `api/overenie.ts` zapisuje jeden riadok pri každom kliknutí
na prihlasovací odkaz, takže opakované prihlásenie tej istej osoby je nový riadok.

| | |
| --- | --- |
| Riadkov (prihlásení) | 36 |
| Unikátnych adries | 20 |
| Z toho mimo INOVIA | 18 |
| Z toho zo samosprávy | **3** — Martin, Žabokreky, Turčianske Teplice |
| Obcí v ŽSK celkom | 315 |
| Posledné prihlásenie | 22. 9. 2026 — ticho 8 dní |

Rozdelenie 20 adries: INOVIA 2 · ŽSK 2 · samospráva 3 · verejný sektor a blízke
organizácie 4 (SHMÚ, UNIZA, MAS Dolný Liptov, Orava) · firmy 3 · neurčiteľné
freemailové adresy 6. Z 36 prihlásení pripadá 24 na 8. a 9. 9., teda na dni
prezentácií.

### Účasť na workshopoch (k 12. 10. 2026)

Zdroj: SharePoint › Samosprávy – Mapovanie areálov › „prezentácia prvej verzie" ›
`účasť na workshopoch_CLIMAAX-MAXICONZA_ŽSK.xlsx` (naposledy zmenený 12. 10.).
Je to prihlasovací formulár doplnený stĺpcom „účasť áno/nie" a ručne pridanými
riadkami. **Stĺpec čítam ako skutočnú účasť** (tak súbor označil tím); či ide
o prezenčku alebo o potvrdenie prihlášky, treba overiť. Osobné údaje z neho sa do
repozitára neprepisujú.

| | |
| --- | --- |
| Riadkov | 180 — 159 z formulára (ID 1 – 174, 15 ID chýba) + 21 pridaných ručne |
| Účasť „áno" | **150 riadkov** (147 unikátnych e-mailov), „nie" 28, nevyplnené 2 |
| Podľa workshopu (prítomní / riadkov) | Žilina 43/49 · Martin 23/26 · Trstená 30/36 · Čadca 23/25 · Liptovský Mikuláš 31/42 |

Čadca bola podľa súboru 21. 9. (v predchádzajúcej verzii tohto dokumentu bolo
14. 9.).

**Kto prišiel** (150 riadkov, hrubé triedenie podľa názvu organizácie, ±niekoľko
riadkov):

| Typ organizácie | Riadkov | Podiel |
| --- | ---: | ---: |
| štátna správa a agentúry (okresné úrady, SHMÚ, SAŽP, inšpekcia, MV SR) | 43 | 29 % |
| **samospráva — obec, mesto** | **36** | **24 %** |
| lesy a ochrana prírody | 19 | 13 % |
| vodárne | 10 | 7 % |
| samosprávne kraje | 9 | 6 % |
| MAS a mikroregióny | 8 | 5 % |
| INOVIA | 2 | 1 % |
| iné (firmy, mimovládky, školy, jednotlivci) | 23 | 15 % |

Tri štvrtiny prítomných (76 %) nie sú obec ani mesto. Workshopy stále oslovili
hlavne odborníkov a štátnu správu, nie rozhodovateľov obcí.

**Obce s prítomným zástupcom: 27.** Ďalších 6 sa zapísalo a neprišlo.

| Kat. | Obcí | Prítomných | Zapísaných, neprítomných | V aplikácii (k 30. 9.) |
| --- | ---: | --- | ---: | ---: |
| A + B | 293 | 18 (6,1 %) | 5 | 1 (Žabokreky) |
| C | 17 | 5 (29 %) | 0 | 1 (Turčianske Teplice) |
| D | 5 | 4 (80 %) | 1 (Ružomberok) | 1 (Martin) |
| spolu | 315 | **27 (8,6 %)** | 6 | 3 |

- **D prítomné:** Žilina, Martin, Liptovský Mikuláš, Čadca. **C prítomné:** Dolný
  Kubín, Námestovo, Krásno nad Kysucou, Turčianske Teplice, Raková.
- **A a B sú spolu**, lebo zoznam obcí s počtom obyvateľov (zdroj v #243) nebol
  pri tejto aktualizácii dostupný; rozdelenie sa doplní z neho. Spolu je to
  zároveň nezávislé od nejasnosti s Konskou (231 alebo 1 676 obyvateľov).
- **Všetky tri obce v aplikácii boli na workshope.** Z 27 prítomných obcí sú
  v aplikácii 3 (11 %, 95 % interval približne 4 – 28 %); zo 33 zapísaných 9 %.
  Sú to tri prípady — neextrapolovať. Údaj o aplikácii je z 30. 9., nový treba
  stiahnuť z hárku „Registrácie".
- **Strop z tohto zoznamu je 27 prítomných (33 zapísaných) obcí**, nie 39.
  V aplikácii ešte nie je 24 prítomných — teplý zoznam pre krok R6.
- **Priradenie obce je podľa názvu organizácie** a názvy sa opakujú (Konská,
  Jakubovany). Že je všetkých 27 v ŽSK, som neoveril.
- **Rozdiel oproti verzii z 2. 10.:** tá vychádzala zo súboru „1-148" a hovorila
  o 23 obciach vrátane Kysuckého Nového Mesta a Tvrdošína ako obcí C. V novom
  súbore sa tieto dve nachádzajú len ako okresné úrady, Čadca pribudla a malých
  obcí je viac. Z ID 1 – 148 v súbore chýba 14 (vymazané), pribudlo 25
  prihlásení a 21 ručných riadkov. Čo presne sa zmenilo, neviem rozlíšiť;
  **zdrojom pravdy je nový súbor**.

### Prihlásení na workshopy (k 2. 10. 2026) — prekonané súborom s účasťou

Pôvodný rozbor zo súboru „1-148". Zachované kvôli dohľadateľnosti, platia čísla
z tabuľky vyššie.

Zdroj: SharePoint › Samosprávy – Mapovanie areálov › „prezentácia prvej verzie" ›
`MAXICONZA-PRIHLASOVACÍ FORMULÁR (1-148).xlsx`. Je to zoznam **prihlásených**,
nie účastníkov — účasť bola podľa tímu nízka a jej skutočný počet nepoznáme.
Osobné údaje z neho sa do repozitára neprepisujú. Obce sú priradené podľa názvu
organizácie, kategórie podľa počtu obyvateľov (stav k 31. 12. 2024).

| | |
| --- | --- |
| Prihlásených | 148 (137 unikátnych e-mailov) |
| Workshopy | Žilina 42 · Martin 21 (8. 9.) · Trstená 37 (9. 9.) · Čadca 12 (14. 9.) · Liptovský Mikuláš 36 (16. 9.) |
| Zo samospráv | 30 prihlásení (20 %) = **23 obcí** |
| Iné organizácie | 101 (68 %) — okresné úrady, SHMÚ, SAŽP, inšpekcia, správy NP, vodárne, mimovládky, firmy |
| Združenia obcí a MAS · ŽSK · INOVIA | 8 · 6 · 3 |

Štyri z piatich prihlásených (80 %) nie sú samospráva. Workshopy oslovili hlavne
odborníkov a štátnu správu, nie rozhodovateľov obcí.

| Kat. | Obcí | Prihlásených na workshop | V aplikácii |
| --- | ---: | --- | ---: |
| A | 155 | 6 (3,9 %) | 0 |
| B | 138 | 7 (5,1 %) | 1 (Žabokreky) |
| C | 17 | 6 (35 %) | 1 (Turčianske Teplice) |
| D | 5 | 4 (80 %) | 1 (Martin) |
| spolu | 315 | 23 (7,3 %) | 3 |

- **Pri A a B je problém dosah:** na workshop sa zapísalo 13 z 293 obcí (4,4 %).
- **Pri C a D je problém prechod do aplikácie:** zapísalo sa 10 z 22 sídiel (45 %),
  v aplikácii sú 2.
- **Z workshopov do aplikácie prešlo 3 z 23 obcí (13 %).** Pri troch prípadoch je
  to veľmi neistý odhad (95 % interval približne 5 – 32 %); workshopy boli
  8.–16. 9., posledné prihlásenie do aplikácie 22. 9., niektoré obce môžu prísť
  neskôr.
- **Strop z tohto zoznamu je 23 obcí.** 20 z nich v aplikácii ešte nie je — je to
  teplý zoznam pre krok R6.
- Konská je v kraji dvakrát (231 a 1 676 obyvateľov), zo zoznamu nie je jasné,
  ktorá sa prihlásila: A je preto 5 alebo 6, B 7 alebo 8.

### Zadanie a zadávateľka

- Zadanie vzniklo v dobrej viere, že nástroj je pre obce užitočný. Reality obcí
  sa to overiť ešte musí.
- Zadávateľka je s výstupom spokojná a ďalšie nároky nemá.
- Úprava produktu aj cieľovej skupiny je v našej kompetencii.
- Meradlo úspechu zo strany zadávateľky: keď si starosta alebo úradník chce túto
  operáciu urobiť, neosloví ju a jej tím, ale použije VESMA.

### Obce

- Odborné kapacity na takéto hodnotenie sa u obcí nepredpokladajú. Nástroj ich má
  nahradiť.
- Prekážky na strane obcí: chýbajúca kapacita, chýbajúca motivácia, neefektívne
  fungovanie a bariéra „nie som odborník".
- Organizácie v zriaďovateľskej pôsobnosti kraja sú **mimo hry** — hodnotenie za
  ne robil kraj, pretože odborné kapacity nemali.

---

## 2. Hypotéza, ktorú overujeme

| # | Tvrdenie | Stav |
| --- | --- | --- |
| H1 | Obec potrebuje vedieť, čo so svojimi budovami a pozemkami | čiastočne potvrdené — organizácie kraja to potrebovali a kraj to za ne robil |
| H2 | Laik v obci to s VESMA zvládne urobiť sám | neoverené |
| H3 | Laik sa do toho pustí — prekoná bariéru, že nie je odborník | neoverené, najrizikovejšie |
| H4 | Obec výsledok použije a zmení podľa neho rozhodnutie | neoverené |

Celá kampaň smeruje na H3. H2 a H4 sa merajú pri sedeniach a pri spätnej otázke
po dvoch týždňoch.

---

## 3. Kroky

Formát: **číslo · krok · kto · dokedy**.

### Z — Zadanie validácie

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| Z1 | Napísať, čo je validovaný zákazník a pri akom výsledku sa projekt zastavuje. Návrh definície: obec dokončí hodnotenie skutočného areálu bez našej účasti a vráti sa druhýkrát | M. Ž. | 2. 10. |

### K — Prekonanie bariéry laika

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| K1 | Dohodnúť s tímom zadávateľky, že dopyt obce na takéto hodnotenie presmerujú na VESMA a pripoja ponuku spoločného prvého areálu | M. Ž. | 7. 10. |
| K2 | Zistiť od tímu zadávateľky, koľko takých dopytov im chodilo doteraz — východisková hodnota pre meradlo úspechu | M. Ž. | 7. 10. |
| K3 | Zmapovať jeden skutočný areál sami a rozposlať ako ukážku výstupu spolu s časom, ktorý to trvalo | M. Ž. | 10. 10. |
| K4 | Ponuku „prvý areál prejdeme s vami online za 30 minút" zaradiť do každej komunikácie s obcou | M. Ž. | od 10. 10. |
| K5 | Pri sedeniach odmerať čas jedného areálu a zapísať, ktoré údaje obec nemá po ruke | M. Ž. | priebežne |

### R — Rozhovory a sedenia

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| R1 | Osloviť individuálne všetkých 18 adries mimo INOVIA a dohodnúť 15-minútový hovor | M. Ž. | 3. 10. |
| R2 | Odviesť 8 hovorov. Otázky: čo ste hľadali · kde ste sa zastavili · čo by muselo platiť, aby ste to použili na skutočnú budovu · čo vás na tom odrádza | M. Ž. | 17. 10. |
| R3 | Odviesť 3 asistované sedenia (Martin, Žabokreky, Turčianske Teplice) — oni klikajú, my mlčíme a píšeme | M. Ž. | 24. 10. |
| R4 | Dva týždne po každom sedení sa opýtať, či s výsledkom niečo urobili | M. Ž. | do 7. 11. |
| R5 | Zapisovať do jedného hárku, jeden riadok na osobu | M. Ž. | priebežne |
| R6 | [návrh] Obvolať obce, ktoré boli na workshope a v aplikácii ešte nie sú — **24 obcí** (zoznam z §1; Martin, Žabokreky a Turčianske Teplice sú už v R3). Rozdeliť: D a C (7 obcí) osobne do 24. 10., A a B (17 obcí) až po voľbách spolu s Programom pre nových lídrov (§9, P3). Najprv overiť, či súhlas vo formulári („na účely projektu") pokrýva telefonát. Pri hovore zapísať funkciu volaného. Je to iný zoznam než R1 | doplniť | D, C 24. 10. · A, B od 26. 10. |

### D — Dodávatelia a sprostredkovatelia

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| D1 | Osloviť 5 energetických audítorov, projektantov alebo MAS. Otázka: použili by ste to pre svojich klientov a čo by vám to muselo šetriť. Kandidáti zo zoznamu workshopov (§1): 8 prihlásených zo združení a MAS a niekoľko projekčných a poradenských firiem — vybrať ručne | doplniť | 17. 10. |
| D2 | Zapísať rozhodnutie: pokračovať alebo zastaviť | M. Ž. | 24. 10. |

### M — Model

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| M1 | Zmraziť platený štart. Nestavať účty, evidenciu predplatného ani fakturáciu | M. Ž. | 3. 10. |
| M2 | Informovať zadávateľku o stave (3 obce z 315, ticho 8 dní) a dohodnúť s ňou meradlo presmerovaného dopytu | M. Ž. | 10. 10. |
| M3 | Premietnuť M1 a M2 do `docs/monetizacia-navrh.md` | M. Ž. | do 5 dní po M1 |

---

## 4. Časová os

### Fáza 1 · 30. 9. – 24. 10. 2026 — do volieb

Samosprávy sa plošne neoslovujú. Bežia Z1, K1 – K5, R1 – R3, D1 – D2, M1 – M3.

Výstup fázy: 8 zapísaných rozhovorov, 3 asistované sedenia, dohodnuté
presmerovanie dopytu od tímu zadávateľky.

### Fáza 2 · 25. 10. – 15. 12. 2026 — po voľbách

Nové vedenia obcí, odovzdávanie agendy. Pokračujú K4 a R4.

Oslovenie nových starostov jedinou vecou: prehľad budov a pozemkov, ktoré
preberajú. Ponuka spoločného prvého areálu, bez ceny a bez registrácie.

[návrh zmeny, pozri §9] Program INOVIE pre nových lídrov neoslovuje do konca
novembra a v decembri posiela len newsletter. Aktívne oslovenie v tejto fáze by
sa preto obmedzilo na teplý zoznam (§1), nové vedenia sa oslovia newsletterom.

Výstup fázy: počet obcí, ktoré dokončili hodnotenie bez našej účasti.

### Fáza 3 · 1. 1. – 31. 3. 2027 — prvý plný cyklus

Rozpočty na 2027, časť obcí v provizóriu. Bežná prevádzka bez kampane, sleduje sa
presmerovaný dopyt a dokončené hodnotenia.

Výstup fázy: rozhodnutie, či sa pokračuje, mení zadanie alebo zastavuje.

---

## 5. Rozhodovacie body

Prahy sú návrh a treba ich potvrdiť v kroku Z1.

| Kedy | Otázka | Prah | Ak sa nesplní |
| --- | --- | --- | --- |
| 24. 10. 2026 | Koľko obcí prijalo ponuku spoločného prvého areálu? | 3 | Bariéra nie je v odbornosti, ale v motivácii — zmeniť oslovenie, nie nástroj |
| 24. 10. 2026 | Koľko z 8 opýtaných povedalo, že nástroj použije na skutočný objekt? | 4 | Vrátiť sa k zadaniu produktu |
| 15. 12. 2026 | Koľko obcí dokončilo hodnotenie bez našej účasti? | 3 | Zastaviť oslovovanie, riešiť, kde ľudia odpadávajú |
| 31. 3. 2027 | Koľko obcí dokončilo hodnotenie a koľko sa vrátilo druhýkrát? | 10 / 3 | Zmeniť cieľovú skupinu na dodávateľov alebo projekt zastaviť |

Poznámka k prahu z 31. 3. 2027: teplý zoznam z §1 má 27 prítomných obcí a 3 z nich
sú v aplikácii. Aby sa 10 dokončených hodnotení dosiahlo len z neho, muselo by
dokončiť 10 z 27 (37 %), pričom dnes z neho prechod do aplikácie je 11 %
a dokončenie nepoznáme. Prah 10 preto stojí buď na výraznom zlepšení konverzie
(K3, K4, R6), alebo na novom kanáli (K1, hromadné stretnutia podľa §9). Je to
aritmetika z troch prípadov, nie predpoveď.

Poznámka k bráne z 15. 12. 2026: nové vedenia obcí nemá do tohto dňa čo osloviť
(§9), takže sa hodnotí len teplý zoznam. Nové vedenia sa merajú v bráne 31. 3.

---

## 6. Ročné KPI — návrh na poradu

[návrh] Cieľové hodnoty potvrdzuje tím. Podklad a výpočty: issue #243. KPI
nadväzuje na krok Z1 a rozhodovacie body v §5 a **nenahrádza ich**.

Východiskový návrh z porady: A 16 · B 14 · C 6 · D 3 = 39 obcí (12 % z 315)
za najbližší rok.

### Čo sa počíta

Jednotkou je **unikátna obec**, nie riadok ani osoba. Zoznam prihlásení sa
deduplikuje, obce na freemailových adresách sa priraďujú ručne. Meria sa od
1. 1. 2027, posledný štvrťrok 2026 je východisko (voľby, odovzdávanie agendy).

| Úroveň | Čo sa počíta | Východisko | Ako sa meria |
| --- | --- | --- | --- |
| Záujem | obec prihlásená na workshop alebo osobne oslovená, ktorá odpovedala | 27 prítomných (A+B 18 · C 5 · D 4); 33 zapísaných | súbor s účasťou, hárok rozhovorov (R5) |
| Dosah | unikátna obec s overeným e-mailom v aplikácii | 3 (B 1 · C 1 · D 1) | hárok „Registrácie" po deduplikácii |
| Použitie | obec dokončila hodnotenie skutočného areálu bez našej účasti | nezmerané | telefonát (R4) |
| Návrat | obec sa vrátila druhýkrát | nezmerané | telefonát (R4) |

**Záujem je vedúci ukazovateľ** — ovládame ho priamo. Dosah je jeho dôsledok:
keď Záujem stojí, Dosah nebude.

### Ciele podľa kategórií [návrh]

| Kat. | Obcí | Dnes v aplikácii | Cieľ z porady | Čo cieľ vyžaduje |
| --- | ---: | ---: | ---: | --- |
| D | 5 | 1 | 3 | zo štyroch prítomných (Žilina, Martin, Liptovský Mikuláš, Čadca) je v aplikácii Martin; prihlásiť dve ďalšie — dá sa osobne |
| C | 17 | 1 | 6 | prítomných je 5, takže cieľ 6 **nedosiahne ani 100 % konverzia** — aspoň jedna obec musí prísť zvonka. Pri polovičnej konverzii vyjde spolu 3 (aritmetika, nie odhad) |
| A + B | 293 | 1 | 30 (16 + 14) | prítomných je 18, 1 v aplikácii. Aj pri 100 % konverzii chýba aspoň 12 obcí z nového kanála (K1, §9) |
| spolu | 315 | 3 | 39 | |

Použitie: 10 do 31. 3. 2027. Návrat: 3 do 31. 3. 2027 (body z §5).

Z teplého zoznamu je strop 27 prítomných obcí; po odpočítaní prebytku v D (štyri
prítomné na cieľ tri) je využiteľných 26. **Aj pri stopercentnej konverzii musí
aspoň 13 obcí z 39 prísť z kanála, ktorý ešte nefunguje** (A+B 12, C 1). Cieľ
pre A a B preto držať ako **ambiciózny, nie záväzný**, kým nie je potvrdený K1
a hromadné stretnutia z §9. Záväzne sa dá plánovať len pri D.

### Pravidlá

- KPI na obce platí najviac do 31. 3. 2027, potom sa prehodnotí — plán pri tejto
  bráne pripúšťa zmenu cieľovej skupiny na dodávateľov.
- Použitie a Návrat sa merajú telefonátom, nie udalosťou v aplikácii (§7).
- Konverziu 11 % (3 z 27) neextrapolovať — sú to tri prípady. Prepočítať po R6,
  ktorý prinesie 24 nových pozorovaní.
- Kampaň z plánu pre nových lídrov (§9) nie je v tomto KPI rozlíšená od práce
  s teplým zoznamom. Dosah z hromadných stretnutí v januári a februári sa zapisuje
  osobitne, aby sa dalo povedať, ktorý kanál obec priniesol.
- BBSK a ostatné kraje sa do 315 ani do 39 nezapočítavajú (§10).
- Štvrťročné míľniky nerozkladať lineárne. Kampaň prináša skoky v dňoch
  prezentácií (24 z 36 prihlásení do aplikácie pripadlo na dva dni).

---


## 7. Čo sa nerobí

- Žiadny vývoj, kým neprejde brána k 24. 10. 2026.
- Žiadne meranie používania v aplikácii — pri 18 ľuďoch ho nahrádza telefonát.
- Žiadne oslovovanie organizácií v zriaďovateľskej pôsobnosti kraja.
- Žiadne plošné oslovovanie obcí do 24. 10. 2026.
- Žiadne ďalšie prezentácie pre subregióny, kým nie sú hotové rozhovory R2.
- Nestavia sa databáza účtov, evidencia predplatného ani fakturácia.
- Nespúšťa sa balík PLUS ani spracovanie skenov.

---

## 8. Otvorené

- Kto vedie krok D1.
- Či sa oslovenie nových starostov robí cez ZMOS a Úniu miest, alebo priamo.
  Program pre nových lídrov počíta s valnými zhromaždeniami MAS a regionálnymi
  zasadnutiami ZMOS v januári a februári 2027 (§9) — potvrdiť.
- Či sa cieľová skupina mení z obcí na ich dodávateľov — rozhoduje sa v D2.
- Ktorý areál sa použije ako ukážka v kroku K3.
- Čo presne znamená stĺpec „účasť áno/nie" v súbore s účasťou (prezenčka alebo
  potvrdenie prihlášky) — od toho závisí 150 prítomných.
- Čo sa zmenilo medzi súborom „1-148" a súborom s účasťou (14 vymazaných ID,
  Kysucké Nové Mesto a Tvrdošín už nie sú obce).
- Rozdelenie 18 malých obcí na A a B — chýba zoznam s počtom obyvateľov.
- Funkcia prítomných z obcí (starosta, úradník) — súbor ju nemá.
- Či sa R6 pre A a B robí pred voľbami alebo až po nich (§9, P3).
- Či sa brána z 15. 12. hodnotí len na teplom zozname a brána z 31. 3. posúva
  Použitie a Návrat o kvartál (§9).
- Či je VESMA medzi „3 vybranými riešeniami" v Programe pre nových lídrov (P4).
- Súhlas na newsletter pre prítomných na workshope — iný účel než „projekt
  CLIMAAX / Maxiconza".
- Otázky k BBSK (§10), najmä č. 1 a č. 2.
- Či súhlas vo formulári na workshopy pokrýva telefonát o VESMA (R6).
- Kto vedie R6.
- Potvrdiť cieľové hodnoty ročného KPI (§6).

---

## 9. Po voľbách — súlad s Programom pre nových lídrov

Zdroj: `Program pre nových lídrov v samospráve 2026.docx` (SharePoint › Samosprávy ›
INOVIA-Samospráva – stratégia, zmenený 15. 10. 2026). Je to plán INOVIE ako celku,
VESMA je v ňom najviac jednou z „inteligentných riešení". Nižšie je, čo z neho
plynie pre tento plán. Všetko označené [návrh] potvrdzuje tím.

### Čo Program hovorí

| Obdobie | Fáza | Podstatné |
| --- | --- | --- |
| 24. 10. 2026 | Voľby | |
| od 26. 10. | Identifikácia | z oficiálnych výsledkov určiť zvolených nováčikov |
| november | Príprava materiálov | **žiadne oslovovanie**; PPTX (prehľad riešení + 3 vybrané + „čo je INOVIA"), prehľad bežiacich projektov, obsah newslettera, pipeline „Noví lídri samosprávy 2026" v HubSpote, termíny valných zhromaždení MAS a regionálnych zasadnutí ZMOS na Q1 2027 |
| nov. – dec. | Ustanovujúce zasadnutia | sľub do 30 dní od volieb |
| december | Prvý kontakt | newsletter ako prvý nenáročný kontakt; koniec decembra = rozpočet 2027, **žiadne žiadosti o stretnutie** |
| január – február | Hromadné stretnutia | valné zhromaždenia MAS a regionálne zasadnutia ZMOS, PPTX, zber záujmu a kontaktov na mieste |
| od marca | Individuálne stretnutia | len vytipované priority (veľkosť, existujúca spolupráca, prejavený záujem), nadviazanie na konkrétne projekty |
| priebežne | Sledovanie | HubSpot: kto dostal newsletter, reagoval, bol na stretnutí, má dohodnuté stretnutie |

### Kde sa plány zrážajú

1. **Fáza 2 (§4) hovorí „oslovenie nových starostov", Program do decembra nič.**
   Do konca novembra Program neoslovuje, v decembri posiela newsletter. Návrh:
   Fáza 2 je pre nových lídrov **bez aktívneho oslovenia**; VESMA ide do
   newslettera ako jedna položka s ponukou „prvý areál prejdeme s vami online za
   30 minút" (K4), bez ceny a bez registrácie. Aktívne pokračuje len práca
   s teplým zoznamom (§1).
2. **Brána z 15. 12. (3 obce dokončili hodnotenie) predchádza hromadným
   stretnutiam.** Z nových lídrov do 15. 12. nemá odkiaľ prísť nič, okrem
   newslettera. Návrh: brána 15. 12. sa vyhodnotí **len na teplom zozname**
   (27 obcí), nové vedenia sa merajú až v bráne 31. 3.
3. **Fáza 3 (§4) je „bez kampane", Program má v januári a februári kampaň cez MAS
   a ZMOS.** Hromadné stretnutia končia vo februári, brána 31. 3. je mesiac po
   nich — obec, ktorá sa na stretnutí prihlási, ešte nemusí mať dokončený areál.
   Návrh: brána 31. 3. ostáva, ale hodnotí sa **Záujem a Dosah**; Použitie
   a Návrat sa posúvajú o kvartál (pozri otvorené otázky).
4. **„Žiadne ďalšie prezentácie pre subregióny" (§7) vs. MAS a ZMOS.** Program
   prezentuje na existujúcich zasadnutiach, nie na nových workshopoch, takže
   rozpor je len formálny. Zároveň tým **dostáva odpoveď otvorená otázka z §8**
   („cez ZMOS a Úniu miest, alebo priamo"): kanál sú valné zhromaždenia MAS
   a regionálne zasadnutia ZMOS.
5. **Kanál K1 a termíny MAS/ZMOS sú jedna úloha.** Program ukladá zistiť termíny
   na Q1 2027 v novembri; K1 (presmerovanie dopytu od tímu zadávateľky) a návrh
   KPI pre A a B stoja na tom istom kanáli. Šesť MAS a mikroregiónov sa prihlásilo
   na workshopy (Dolný a Horný Liptov, Turiec, Rajecká dolina, Terchovská dolina,
   Bystrická dolina), štyri boli prítomné — je to prirodzený prvý zoznam.

### Teplý zoznam a voľby

Z 27 prítomných obcí (§1) sa po 24. 10. časť dostane pod nové vedenie. Nevieme,
**kto z obce prišiel** — starosta (mandát sa mení) alebo úradník (zostáva).
Súbor má meno a organizáciu, nie funkciu. To rozhoduje, či je teplý zoznam voči
voľbám odolný. Návrh: pri hovoroch R6 zapisovať funkciu a po 26. 10. porovnať
27 obcí s oficiálnymi výsledkami, aby sa teplý zoznam rozdelil na „pokračujúce"
a „noví lídri" (v HubSpote ako štítok).

### Návrh ďalších krokov [návrh]

| # | Krok | Kedy |
| --- | --- | --- |
| P1 | Overiť význam stĺpca „účasť áno/nie" (prezenčka, alebo potvrdenie prihlášky) | tento týždeň |
| P2 | Stiahnuť nový počet adries z hárku „Registrácie", deduplikovať, priradiť obce | tento týždeň |
| P3 | **R6 rozdeliť:** D a C (7 obcí z 24 prítomných, ktoré ešte nie sú v aplikácii: Žilina, Liptovský Mikuláš, Čadca · Dolný Kubín, Námestovo, Krásno nad Kysucou, Raková) osloviť osobne už teraz; A a B (17 obcí) až po voľbách spolu s Programom. Najprv vyriešiť súhlas (§8) | D a C do 24. 10. · A a B od 26. 10. |
| P4 | Požiadať autorov Programu o zaradenie VESMA medzi „3 vybrané riešenia" alebo aspoň do newslettera; dodať text a odkaz | do polovice novembra |
| P5 | V HubSpote pri pipeline „Noví lídri samosprávy 2026" založiť aj štítky „VESMA: workshop · v aplikácii · asistované sedenie · dokončilo · vrátilo sa", aby sa KPI (§6) čítalo z jedného miesta, nie z dvoch hárkov | november |
| P6 | Zistiť termíny valných zhromaždení MAS a zasadnutí ZMOS na Q1 2027 a spojiť s K1 | november |
| P7 | Do newslettera na december dať ponuku K4 a odkaz na aplikáciu; v decembri nežiadať o stretnutie | december |
| P8 | Po 26. 10. rozdeliť teplý zoznam na „pokračujúce" a „noví lídri" | november |

---

## 10. Banskobystrický samosprávny kraj (BBSK) — otvorené

Stav k 15. 10. 2026: BBSK prejavil záujem o VESMA pre samosprávy vo svojom kraji
(kontakt: Andrea Rúfusová, BBSK). Na workshopoch mal kraj zástupcu (v súbore sú
dva riadky, jeden prítomný, jeden zapísaný a neprítomný; či ide o tú istú osobu,
nevieme). **Nič sa nesľubuje, kým nie sú zodpovedané otázky nižšie.**

### Čo už v dokumentoch platí

- **Územný rozsah:** podkladové mapy existujú len pre ŽSK. Rozšírenie do ďalších
  krajov len po zafinancovaní dátového podkladu treťou stranou
  (`kontext-monetizacia-a-validacia.md` §3).
- **Vývoj a mapy zaplatil ŽSK**, ktorý je zároveň zadávateľ a zriaďovateľ INOVIE.
  Mapy spracovala ČZU.
- **Obec mimo kraja** má dostať tréningový režim a formulár „máme záujem"
  (`monetizacia-navrh.md` B.9) — najlacnejší podklad pre rokovanie s inou VÚC.
- **B.11:** hodnota prvého roka je v preukázanej ochote platiť, ktorú možno
  ukázať ďalšej VÚC. Dnes je to 3 obce z 315 v aplikácii a žiadna dokončená
  mapa, takže BBSK prichádza **pred dôkazom**, nie po ňom.
- Aplikácia samotná adresy z BBSK vie zadať (`src/data/slovakLocations.ts`
  obsahuje aj Banskobystrický kraj); export na xMatik a Klimasken je ŽSK.

### Otázky, ktoré treba vyriešiť (v tomto poradí)

1. **Čo presne BBSK chce?** (a) VESMA pre vlastné organizácie kraja — to, čo ŽSK
   robil pre svoje a čo je v tomto pláne mimo hry; (b) nástroj pre obce v kraji,
   zadarmo alebo platený; (c) pilot s niekoľkými obcami. Každé je iný produkt,
   iný zákazník a iný platiaci.
2. **Povolenie od ŽSK.** Môže INOVIA ponúkať nástroj inému kraju — aké sú
   podmienky financovania a práva k výsledku (CLIMAAX / Maxiconza, zmluva so
   ŽSK)? Zadávateľku treba informovať skôr, než sa BBSK odpovie vecne (krok M2).
3. **Podkladové mapy pre BBSK.** Existujú? Kto ich zaplatí a koľko stoja? Cenu
   ČZU nepoznáme a nevymýšľa sa; bez máp je pre obec BBSK len tréningový režim.
4. **Kto platí.** Dohoda „kraj neplatí" platí pre ŽSK, nie pre BBSK. Cenník
   (50 / 100 / 250 / 500 €) je návrh pre obce ŽSK a pre BBSK sa nepoužíva.
5. **Súhlas a údaje.** Súhlas z formulára na workshopy odkazuje na zásady ŽSK
   a projekt CLIMAAX / Maxiconza. Pre obce BBSK treba vlastný právny základ
   a určiť, kto je prevádzkovateľ e-mailov z prihlásenia a z podnetov.
6. **Kapacita.** VESMA prakticky vedie jeden človek a plán validácie je
   v ŽSK postavený na osobnom kontakte (K4: 30 minút s obcou). Podpora ďalšieho
   kraja ho nemá z čoho nahradiť; pre BBSK to znamená, kto ju robí.
7. **Súlad s validáciou.** Plán hovorí „žiadny vývoj do 24. 10." a H3 (laik sa
   pustí) je neoverená. BBSK vývoj nepotrebuje — potrebuje rozhodnutie. BBSK sa
   **nezapočítava** do 315 ani do 39; ak sa sleduje, tak samostatným
   ukazovateľom „záujem inej VÚC" (B.9).
8. **Prečo teraz.** Čo ho viedlo — workshop, kolegyňa, projekt? Z toho plynie,
   čo skutočne chce.

### Návrh odpovede BBSK [návrh, neodoslané]

Poďakovať, potvrdiť záujem, **bez ceny a bez termínu**. Opýtať sa na body 1 a 8
a uviesť územné obmedzenie (mapy len pre ŽSK; pre ďalší kraj treba zafinancovať
podklad). Najprv informovať zadávateľku z ŽSK. Odoslať môže iba človek.

---

Súvisiace: `docs/kontext-monetizacia-a-validacia.md` — odovzdávací kontext pre
novú konverzáciu · `docs/validacia-casova-os.puml` — diagram krokov a časovej osi ·
`docs/monetizacia-navrh.md` — model monetizácie, mení ho krok M3.
