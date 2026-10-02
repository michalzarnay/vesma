# VESMA — kroky a časová os validácie

Verzia 2, stav k 30. 9. 2026. Po piatich prezentáciách pre subregióny.

Zmena oproti verzii 1: vypadlo meranie v aplikácii a organizácie v zriaďovateľskej
pôsobnosti kraja, pribudla časť K a presmerovanie dopytu od tímu zadávateľky.
Žiadny krok v tomto dokumente nie je vývoj.

---

## 1. Východiskový stav

### Zoznam prihlásení

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

### D — Dodávatelia a sprostredkovatelia

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| D1 | Osloviť 5 energetických audítorov, projektantov alebo MAS. Otázka: použili by ste to pre svojich klientov a čo by vám to muselo šetriť | doplniť | 17. 10. |
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

---

## 6. Čo sa nerobí

- Žiadny vývoj, kým neprejde brána k 24. 10. 2026.
- Žiadne meranie používania v aplikácii — pri 18 ľuďoch ho nahrádza telefonát.
- Žiadne oslovovanie organizácií v zriaďovateľskej pôsobnosti kraja.
- Žiadne plošné oslovovanie obcí do 24. 10. 2026.
- Žiadne ďalšie prezentácie pre subregióny, kým nie sú hotové rozhovory R2.
- Nestavia sa databáza účtov, evidencia predplatného ani fakturácia.
- Nespúšťa sa balík PLUS ani spracovanie skenov.

---

## 7. Otvorené

- Kto vedie krok D1.
- Či sa oslovenie nových starostov robí cez ZMOS a Úniu miest, alebo priamo.
- Či sa cieľová skupina mení z obcí na ich dodávateľov — rozhoduje sa v D2.
- Ktorý areál sa použije ako ukážka v kroku K3.

---

Súvisiace: `docs/kontext-monetizacia-a-validacia.md` — odovzdávací kontext pre
novú konverzáciu · `docs/validacia-casova-os.puml` — diagram krokov a časovej osi ·
`docs/monetizacia-navrh.md` — model monetizácie, mení ho krok M3.
