# VESMA — ďalšie kroky a časová os validácie

Stav k 30. 9. 2026. Po piatich prezentáciách pre subregióny.

---

## 1. Východiskový stav

### Čo hovorí zoznam prihlásení

Zoznam nie sú registrácie. `api/overenie.ts` zapisuje **jeden riadok pri každom
kliknutí na prihlasovací odkaz**, takže opakované prihlásenie tej istej osoby je
nový riadok.

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
freemailové adresy 6.

Časovo: 24 z 36 prihlásení pripadá na 8. a 9. 9. (dni prezentácií). Zvyšok sú
jednotlivé prihlásenia rozptýlené do 22. 9.

### Čo nevieme

O používaní nemáme **žiadny údaj**. Zapisujú sa len prihlásenia, podnety
z formulára a nezodpovedané otázky chatbota. Nevieme, či niekto zmapoval areál,
či sa dostal na Výsledky, ani kde prestal. Bez toho sa validovať nedá.

### Kontext termínu

24 dní do komunálnych volieb (24. 10. 2026). Po nich nástup nových vedení obcí,
odovzdávanie agendy a rozpočty na rok 2027 — časť obcí pôjde do rozpočtového
provizória. Samospráva je reálne dosiahnuteľná od januára 2027.

---

## 2. Kroky

Formát: **číslo · krok · kto · dokedy**.

### V — Meranie

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| V1 | Odlíšiť v hárku prvé prihlásenie od opakovaného | M. Ž. | 10. 10. |
| V2 | Zapisovať anonymné udalosti cez existujúci most: otvorenie appky, dokončenie každého kroku, zobrazenie hodnotenia, export | M. Ž. | 10. 10. |
| V3 | Vyhodnocovať stĺpec „odkiaľ (URL)", ktorý sa už zapisuje | M. Ž. | 10. 10. |
| V4 | Týždenný prehľad: koľko ľudí došlo po Výsledky, v ktorom kroku odpadli | M. Ž. | od 13. 10. |

### R — Rozhovory s tými, čo sa prihlásili

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| R1 | Osloviť individuálne všetkých 18 adries mimo INOVIA, dohodnúť 15-minútový hovor | M. Ž. | 10. 10. |
| R2 | Odviesť 8 hovorov. Tri otázky: čo ste hľadali · kde ste sa zastavili · čo by muselo platiť, aby ste to použili na skutočný objekt | M. Ž. | 24. 10. |
| R3 | Zapisovať do jedného hárku, jeden riadok na osobu | M. Ž. | priebežne |
| R4 | S Martinom, Žabokrekmi a Turčianskymi Teplicami dohodnúť spoločné zmapovanie jedného areálu za našej účasti | M. Ž. | 24. 10. |

### S — Segmenty na preverenie

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| S1 | Organizácie v zriaďovateľskej pôsobnosti ŽSK (stredné školy, sociálne zariadenia) — osloviť cez príslušné odbory, cieľ 5 zmapovaných budov | doplniť | 30. 11. |
| S2 | Miestne akčné skupiny — osloviť 5 MAS v kraji (MAS Dolný Liptov už prihlásená) | doplniť | 30. 11. |
| S3 | Energetickí audítori a projektanti — osloviť 5, zistiť, či by nástroj použili pre svojich klientov | doplniť | 30. 11. |
| S4 | Firmy, ktoré sa prihlásili samy (Projekt Metro, ui42, ICARI) — dohovoriť si s nimi hovor | M. Ž. | 31. 10. |
| S5 | Po každom segmente zapísať rozhodnutie: pokračovať alebo zastaviť | M. Ž. | 30. 11. |

### M — Model a termíny

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| M1 | Rozhodnúť posun plateného štartu. Návrh: prechodné obdobie do 31. 12. 2027, platená verzia od 1. 1. 2028 | M. Ž. + zadávateľka | 15. 11. |
| M2 | Do rozhodnutia M1 nestavať evidenciu predplatného ani fakturáciu | M. Ž. | — |
| M3 | Premietnuť M1 do `docs/monetizacia-navrh.md` | M. Ž. | do 5 dní po M1 |
| M4 | Informovať zadávateľku o stave: 3 obce z 315, 8 dní ticho | M. Ž. | 10. 10. |

### P — Produkt

| # | Krok | Kto | Dokedy |
| --- | --- | --- | --- |
| P1 | Presunúť prihlásenie e-mailom až za prvé zobrazenie hodnotenia | M. Ž. | 17. 10. |
| P2 | Skryť nefunkčné tlačidlá — AI asistent, analýza fotografií, export do Xmatik a URBIS | M. Ž. | 17. 10. |
| P3 | Dokončiť energetický modul | M. Ž. | 31. 12. |
| P4 | Meranie nákladu na spracovanie skenu odložiť, kým sa balík PLUS nezačne stavať | — | odložené |

---

## 3. Časová os

### Fáza 1 · 30. 9. – 24. 10. 2026 — pred voľbami

Samosprávy plošne neoslovovať. Bežia V1–V4, R1–R4, S4.

Výstup fázy: funkčné meranie používania a 8 zapísaných rozhovorov.

### Fáza 2 · 25. 10. – 30. 11. 2026 — po voľbách

Nové vedenia obcí, odovzdávanie agendy. Bežia S1–S3, M1, M3.

Oslovenie nových starostov s jednou vecou: prehľad budov a pozemkov, ktoré
preberajú. Bez ceny, bez registrácie.

Výstup fázy: rozhodnutie o posune plateného štartu, prvé zmapované budovy
mimo obcí.

### Fáza 3 · 1. 12. 2026 – 28. 2. 2027 — rozpočty

Obce schvaľujú rozpočty na 2027, časť v provizóriu. Cieľ fázy je používanie,
nie predaj.

Výstup fázy: počet dokončených hodnotení od používateľov mimo INOVIA.

### Fáza 4 · marec – december 2027 — škálovanie a príprava platenej verzie

Podľa výsledku fázy 3: rozšírenie do ďalších segmentov alebo prepracovanie
produktu. Cenník sa fixuje na jeseň 2027, aby sa dostal do rozpočtov obcí
na rok 2028.

### 1. 1. 2028 — platená verzia

---

## 4. Rozhodovacie body

Prahy sú návrh a treba ich potvrdiť.

| Kedy | Otázka | Prah | Ak sa nesplní |
| --- | --- | --- | --- |
| 24. 10. 2026 | Koľko z 18 oslovených povedalo, že nástroj použije na skutočný objekt? | 5 | Problém je v hodnote, nie v komunikácii — vrátiť sa k zadaniu produktu |
| 30. 11. 2026 | Koľko dokončených hodnotení od ľudí mimo INOVIA? | 10 | Zastaviť oslovovanie, riešiť, kde ľudia odpadávajú |
| 28. 2. 2027 | Koľko obcí a organizácií má dokončené hodnotenie? | 30 | Odložiť platenú verziu a prehodnotiť segment |
| 30. 9. 2027 | Je cenník potvrdený a komunikovaný pre rozpočty na 2028? | áno/nie | Platená verzia sa posúva na 2029 |

---

## 5. Čo sa nerobí

- Žiadne plošné oslovovanie obcí do 24. 10. 2026.
- Žiadne ďalšie prezentácie pre subregióny, kým nie sú hotové rozhovory R2.
- Nestavia sa databáza účtov, evidencia predplatného ani fakturácia, kým nie je
  rozhodnuté M1.
- Nespúšťa sa balík PLUS ani spracovanie skenov.

---

## 6. Otvorené

- Kto vedie segmenty S1 – S3.
- Či sa oslovenie nových starostov robí cez ZMOS a Úniu miest, alebo priamo.
- Či sa mení cieľová skupina z obcí na ich dodávateľov (audítori, projektanti).

---

Súvisiace: `docs/monetizacia-navrh.md` — model monetizácie; body M1 a M3 ho menia.
