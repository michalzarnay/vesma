# VESMA — kontext k monetizácii a validácii

Odovzdávací dokument. Zhŕňa všetko podstatné z práce na monetizácii a validácii
VESMA od konca augusta do 2. 10. 2026 tak, aby sa dalo pokračovať bez pôvodnej
konverzácie.

Značky: **[dohodnuté]** rozhodol človek · **[návrh]** čaká na rozhodnutie ·
**[zmerať]** hodnota, ktorú nikto nevie a nesmie sa odhadovať.

---

## 1. Produkt

VESMA je webový dotazníkový nástroj, ktorý hodnotí areály samospráv z pohľadu
modrozelenej infraštruktúry (metodika Klimasken) a energetiky. Vyvíja ho INOVIA
na zadanie Žilinského samosprávneho kraja.

- Stack: React + Vite + TypeScript + Tailwind, nasadenie na Verceli,
  verejná adresa `vesma.inovia.sk`.
- Mapér prejde šiestimi krokmi (Úvod, Pozemky, Budovy, Iné stavby, Opatrenia
  pre MZI, Výsledky) a dostane hodnotenie s odporúčanými opatreniami.
- Exporty: XLSX, CSV, PDF. Porovnanie viacerých areálov medzi sebou.
- Od septembra 2026 si mapér v kroku 1 volí **rozsah**: voda, energia alebo
  oboje (`docs/rozsah-mapovania.md`).
- Prihlásenie e-mailom cez odkaz v pošte (Resend), podpísané tokeny,
  bez databázy (`docs/prihlasenie-emailom.md`).

### Technický stav, ktorý je dôležitý pre rozhodovanie

| Vec | Stav |
| --- | --- |
| Dáta používateľa | `localStorage` prehliadača, fotografie v IndexedDB (`sma-nastroj-media`). **Server o nich nevie nič.** |
| Databáza | **Neexistuje žiadna.** |
| Serverové funkcie | `api/feedback.ts` (most do Google hárku), `api/prihlasenie.ts`, `api/overenie.ts`, `api/pvgis.ts`, `api/svp-flood.ts` |
| Vyťažovanie PDF | `src/utils/pdfParser.ts` — `pdfjs-dist` v prehliadači. **Nula tokenov, nula servera.** Skenované PDF bez textovej vrstvy nefungujú. |
| AI funkcie | `ChatAssistant.tsx` a `PhotoAnalyzer.tsx` sú **atrapy** — zobrazia `alert('bude dostupné čoskoro')`. Chatbot (`ChatPanel.tsx`) je pravidlový, nie generatívny. |
| Export do Xmatik a URBIS | Takisto **atrapy** s `alert` (`Step6_Vysledky.tsx`) |
| Energetický modul | Nedokončený |

Dôsledok: režim „len na čítanie" po nezaplatení aj limit balíka PLUS (časť 3)
predpokladajú, že dáta a počítadlá sú na našej strane. Dnes nie sú.

---

## 2. Ľudia a vzťahy

- **INOVIA** — vyvíja nástroj. Michal Žarnay (`zarnay@inovia.sk`) ho vedie
  a prakticky sám vyvíja.
- **Žilinský samosprávny kraj (ŽSK)** — zadávateľ aj zriaďovateľ INOVIE.
  Zaplatil vývoj aj podkladové vodozádržné mapy (spracovala ČZU).
- **Zadávateľka** — kontaktná osoba na strane kraja.
- **ZMOS a Únia miest** — zamýšľaný komunikačný kanál k obciam namiesto
  oslovovania jednotlivých starostov. Kontakt M. Červenák, podpredseda ZMOS.

### Postoj zadávateľky (stav k 30. 9. 2026)

- Zadanie vzniklo **v dobrej viere**, že nástroj je pre obce užitočný. Či to
  zodpovedá realite obcí, sa ešte overuje.
- Je s výstupom **spokojná a ďalšie nároky nemá**.
- **Úprava produktu aj cieľovej skupiny je v kompetencii INOVIE.**
- Jej meradlo úspechu: keď si starosta alebo úradník chce túto operáciu urobiť,
  **neosloví ju a jej tím, ale použije VESMA**.
- Súhlasila so spoplatnením nástroja aj pre obce ŽSK. Dôvod, ktorý uviedla:
  nástroj s cenovkou je vnímaný ako hodnotnejší než nástroj zadarmo.
- **Kraj sám neplatí** — ani za vlastné budovy, ani za obce v kraji. Dôvod: je
  zriaďovateľ aj zadávateľ a na začiatku sa dohodlo, že ho to nebude stáť nič.

---

## 3. Model monetizácie — dohodnutý stav

Plné znenie: `docs/monetizacia-navrh.md`.

### Základ

- Základná verzia je pre obce ŽSK **platená**, cena podľa **počtu obyvateľov**
  [dohodnuté].
- **Prechodné obdobie bez poplatku bude** [dohodnuté]; termín ešte nie je
  potvrdený.
- Trvalý bezplatný skúšobný režim — jeden areál, hodnotenie na obrazovke, bez
  uloženia a bez exportu [návrh].

### Cenník [návrh]

| Kategória | Obyvatelia | Základ / rok | S balíkom PLUS |
| --- | --- | --- | --- |
| A | do 1 000 | 50 € | 75 € |
| B | 1 001 – 5 000 | 100 € | 150 € |
| C | 5 001 – 20 000 | 250 € | 375 € |
| D | nad 20 000 | 500 € | 750 € |

Pravidlá, na ktorých záleží viac než na sumách: cena pod hranicou, kde
rozhoduje starosta sám · jedna faktúra ročne, nie mesačné platby kartou ·
cena rastie pomalšie než počet obyvateľov. Otvorené: či sú sumy s DPH.

### Balík PLUS

- Je to **druhý rozmer cenníka, nie piata veľkostná kategória** [dohodnuté].
- Príplatok **+50 %** k ročnému poplatku [dohodnuté].
- Obsahuje všetko s variabilným nákladom: vyťaženie **naskenovaných** listov
  vlastníctva a energetických certifikátov, analýza fotografií, opätovné
  spracovanie pri obnove certifikátu.
- Textové PDF zostávajú v základe zadarmo — číta ich prehliadač.
- Limit: **tri dokumenty na každý zmapovaný objekt** [dohodnuté].
- Kvóta platí aj počas prechodného obdobia [dohodnuté]; jej výška (návrh
  5 dokumentov na obec) čaká na potvrdenie.
- Párovanie s výzvami do balíka **nepatrí** — iný typ zodpovednosti.

### Dáta obce, ktorá nezaplatí [dohodnuté]

Účet sa prepne do režimu **len na čítanie**: obec vidí svoje areály a môže si
ich kedykoľvek vyexportovať, ale nemôže zadávať nové údaje ani prepočítavať.
Režim trvá **12 mesiacov** (jeden rozpočtový cyklus). Upozornenie e-mailom
30 a 7 dní pred zmazaním. Skoršie zmazanie na požiadanie kedykoľvek.

### Územný rozsah

Podkladové mapy existujú len pre ŽSK. Obec mimo kraja dostane upozornenie,
prípadne tréningový režim bez záverečného hodnotenia. Rozšírenie do ďalších
krajov len po zafinancovaní dátového podkladu treťou stranou.

### Čo model momentálne blokuje

Platený štart je **zmrazený** — pozri časť 6. Kým sa nerozhodne nový termín,
nestavia sa databáza účtov, evidencia predplatného ani fakturácia.

---

## 4. Stav validácie

### Čo sa stalo

Päť workshopov pre subregióny: Žilina a Martin 8. 9., Trstená 9. 9., Čadca
14. 9., Liptovský Mikuláš 16. 9. 2026. Účasť bola podľa tímu nízka; skutočný
počet účastníkov nepoznáme.

### Zoznam prihlásení do aplikácie (k 30. 9. 2026)

Nie sú to registrácie. `api/overenie.ts` zapisuje jeden riadok pri **každom
kliknutí na prihlasovací odkaz**, takže opakované prihlásenie tej istej osoby
je nový riadok.

| | |
| --- | --- |
| Riadkov (prihlásení) | 36 |
| Unikátnych adries | 20 |
| Z toho mimo INOVIA | 18 |
| **Z toho zo samosprávy** | **3** — Martin, Žabokreky, Turčianske Teplice |
| Obcí v ŽSK celkom | 315 (z toho 19 miest, 11 okresov) |
| Posledné prihlásenie | 22. 9. 2026 |

Rozdelenie 20 adries: INOVIA 2 · ŽSK 2 · samospráva 3 · verejný sektor a blízke
organizácie 4 (SHMÚ, UNIZA, MAS Dolný Liptov, Orava) · firmy 3 · neurčiteľné
freemailové adresy 6. Z 36 prihlásení pripadá 24 na 8. a 9. 9., teda na dni
prezentácií.

### Prihlásení na workshopy (k 2. 10. 2026)

Zoznam **prihlásených**, nie účastníkov (SharePoint › Samosprávy – Mapovanie
areálov › „prezentácia prvej verzie"). Postup spracovania a podrobnosti:
`docs/validacia-dalsie-kroky.md` §1. Osobné údaje sa do repozitára neprepisujú.

148 prihlásení (137 unikátnych e-mailov). Zo samospráv je 30 z nich (20 %),
101 (68 %) z iných organizácií — okresné úrady, SHMÚ, SAŽP, inšpekcia, správy
národných parkov, vodárne, mimovládky, firmy — 8 zo združení a MAS, 6 z ŽSK,
3 z INOVIE. Prihlásených obcí je **23**.

| Kat. | Obcí | Prihlásených na workshop | V aplikácii |
| --- | ---: | --- | ---: |
| A | 155 | 6 (3,9 %) | 0 |
| B | 138 | 7 (5,1 %) | 1 |
| C | 17 | 6 (35 %) | 1 |
| D | 5 | 4 (80 %) | 1 |
| spolu | 315 | 23 (7,3 %) | 3 |

- **Pri A a B je problém dosah** — na workshop sa zapísalo 13 z 293 obcí (4,4 %).
- **Pri C a D je problém prechod do aplikácie** — zapísalo sa 10 z 22 sídiel,
  v aplikácii sú 2.
- **Z workshopov do aplikácie prešlo 3 z 23 obcí (13 %).** Tri prípady, 95 %
  interval približne 5 – 32 %; neextrapolovať.
- **Strop z tohto zoznamu je 23 obcí.** 20 z nich v aplikácii ešte nie je.

### Čo o používaní nevieme

**Nič.** Zapisujú sa len prihlásenia, podnety z formulára a nezodpovedané otázky
chatbota. Nevieme, či niekto zmapoval areál, či sa dostal na Výsledky, ani kde
prestal.

Meranie v aplikácii sa **zámerne nerobí** — pri 18 ľuďoch ho nahrádza telefonát.
Má zmysel až pri stovkách používateľov.

### Čo už z rozhovorov vyšlo

Energetická časť nie je pre samosprávy atraktívna — kalkulačiek a zákonných
povinností v energetike je veľa. Vodná časť je to, čo VESMA prináša navyše.
Preto pribudol výber rozsahu v kroku 1. Energetika sa nevyhadzuje, rozsah sa
ukladá s areálom a je v exporte, takže sa dá vyhodnotiť.

### Prekážky na strane obcí

Chýbajúca kapacita · chýbajúca motivácia · neefektívne fungovanie · bariéra
**„nie som odborník"**. Odborné kapacity na takéto hodnotenie sa u obcí
nepredpokladajú — nástroj ich má nahradiť.

**Organizácie v zriaďovateľskej pôsobnosti kraja sú mimo hry.** Hodnotenie za ne
robil kraj práve preto, že odborné kapacity nemali.

### Vonkajšie okolnosti

Komunálne voľby **24. 10. 2026**. Prebieha kampaň, v samospráve nemá na tieto
témy nikto čas. Po voľbách nastupujú nové vedenia, odovzdáva sa agenda a tvoria
sa rozpočty na 2027 — časť obcí pôjde do rozpočtového provizória. Samospráva je
reálne dosiahnuteľná od januára 2027.

---

## 5. Hypotézy, ktoré sa overujú

| # | Tvrdenie | Stav |
| --- | --- | --- |
| H1 | Obec potrebuje vedieť, čo so svojimi budovami a pozemkami | čiastočne potvrdené — organizácie kraja to potrebovali a kraj to za ne robil |
| H2 | Laik v obci to s VESMA zvládne urobiť sám | neoverené |
| H3 | Laik sa do toho pustí — prekoná bariéru, že nie je odborník | **neoverené, najrizikovejšie** |
| H4 | Obec výsledok použije a zmení podľa neho rozhodnutie | neoverené |

Celá kampaň smeruje na H3. Pôvodne bol plán postavený na otázke, či problém
existuje; skúsenosť kraja s vlastnými organizáciami ju posunula na H3.

Prvé dáta k H3 (2. 10. 2026): z 10 sídiel kategórií C a D, ktoré sa zapísali na
workshop, sú v aplikácii 2; z 13 malých obcí (A, B) 1. Je to prechod zo záujmu
do prvého kroku, nie dôkaz o použití — to sa zatiaľ nemeria.

---

## 6. Platný plán

Plné znenie: `docs/validacia-dalsie-kroky.md` (verzia 3, stav k 2. 10. 2026).
Diagram: `docs/validacia-casova-os.puml` + vykreslené PNG.

### Tvrdé pravidlo

> **Bez ďalšej validácie sa vývoju nevenuje ani minúta.** Ak nie sú zákazníci,
> nevylepšuje sa. Žiadny krok v platnom pláne nie je vývoj.

### Skupiny krokov

- **Z** — napísať, čo je validovaný zákazník a pri akom výsledku sa projekt
  zastavuje. Prvý krok, aby sa výsledok nedal spätne zracionalizovať.
- **K** — prekonanie bariéry laika. Najdôležitejšie: dohodnúť s tímom
  zadávateľky **presmerovanie dopytu obcí na VESMA** a zistiť doterajší počet
  takých dopytov ako východiskovú hodnotu. Ďalej: ukážkový zmapovaný areál
  s časom trvania, ponuka „prvý areál prejdeme s vami online za 30 minút",
  meranie skutočného času a chýbajúcich údajov.
- **R** — obvolať 18 adries mimo INOVIA, 8 hovorov po 15 minút, 3 asistované
  sedenia (Martin, Žabokreky, Turčianske Teplice), spätná otázka po dvoch
  týždňoch, či s výsledkom niečo urobili. **R6 [návrh]:** obvolať 20 obcí,
  ktoré sa prihlásili na workshop a v aplikácii ešte nie sú — iný a väčší
  zoznam než R1; najprv overiť, či súhlas z formulára pokrýva telefonát.
- **D** — osloviť 5 energetických audítorov, projektantov alebo MAS.
  Hypotéza dodávateľa: audítor, ktorý robí desať obcí ročne, volebný cyklus
  nemá. Tri z nevyžiadaných prihlásení boli firmy; kandidátov dáva aj zoznam
  workshopov (8 prihlásených zo združení a MAS).
- **M** — zmraziť platený štart, informovať zadávateľku, premietnuť do
  `docs/monetizacia-navrh.md`.

### Fázy

| Fáza | Obdobie | Obsah |
| --- | --- | --- |
| 1 | 30. 9. – 24. 10. 2026 | Do volieb. Samosprávy sa plošne neoslovujú. Z, K, R, D, M. |
| 2 | 25. 10. – 15. 12. 2026 | Po voľbách. Nové vedenia obcí — prehľad majetku, ktorý preberajú. Bez ceny, bez registrácie. |
| 3 | 1. 1. – 31. 3. 2027 | Prvý plný cyklus. Bežná prevádzka bez kampane. |

### Rozhodovacie body [návrh prahov]

| Kedy | Otázka | Prah | Ak sa nesplní |
| --- | --- | --- | --- |
| 24. 10. 2026 | Koľko obcí prijalo ponuku spoločného prvého areálu? | 3 | Bariéra je v motivácii — zmeniť oslovenie, nie nástroj |
| 24. 10. 2026 | Koľko z 8 opýtaných to použije na skutočný objekt? | 4 | Vrátiť sa k zadaniu produktu |
| 15. 12. 2026 | Koľko obcí dokončilo hodnotenie bez našej účasti? | 3 | Zastaviť oslovovanie, riešiť, kde ľudia odpadávajú |
| 31. 3. 2027 | Koľko obcí dokončilo hodnotenie / vrátilo sa druhýkrát? | 10 / 3 | Zmeniť cieľovú skupinu na dodávateľov alebo zastaviť |

Prah 10 dokončených by z teplého zoznamu 23 obcí znamenal 43 % — dnes z neho
prechod do aplikácie je 13 %. Stojí teda na lepšej konverzii (K3, K4, R6) alebo
na novom kanáli (K1).

### Ročné KPI [návrh na poradu]

Podklad v issue #243, plné znenie v `docs/validacia-dalsie-kroky.md` §6. Tri
úrovne vedľa seba: **Záujem** (obec zapísaná alebo oslovená, východisko 23),
**Dosah** (unikátna obec v aplikácii, východisko 3), **Použitie / Návrat**
(dokončila / vrátila sa, merané telefonátom). Návrh z porady A 16 · B 14 · C 6 ·
D 3 = 39 obcí drží ako ambiciózny cieľ; záväzne sa dá plánovať len pri C a D,
kde sú to pomenované zoznamy. A a B stoja na kanáli K1. Meria sa od 1. 1. 2027
a prehodnotí sa 31. 3. 2027.

### Čo sa nerobí

Žiadny vývoj do brány 24. 10. · žiadne meranie používania v aplikácii · žiadne
oslovovanie organizácií kraja · žiadne plošné oslovovanie obcí do 24. 10. ·
žiadne ďalšie prezentácie pre subregióny · nestavia sa databáza účtov,
evidencia predplatného ani fakturácia · nespúšťa sa balík PLUS.

---

## 7. Otvorené rozhodnutia

| Čoho sa týka | Rozhodnutie | Kde |
| --- | --- | --- |
| Termín | Nový termín plateného štartu. Pôvodne 1. 1. 2027, zmrazené. Návrh z analýzy: prechodné obdobie do 31. 12. 2027, platené od 1. 1. 2028 | monetizacia-navrh.md |
| Cenník | Potvrdiť 50 / 100 / 250 / 500 € a doplniť, či sú sumy s DPH | monetizacia-navrh.md |
| PLUS | Potvrdiť výšku kvóty počas prechodného obdobia (návrh 5 dokumentov) | monetizacia-navrh.md |
| Náklad | Zmerať náklad na spracovanie jedného naskenovaného dokumentu [zmerať] | chybajuce-hodnoty.md |
| Produkt | Atrapy AI a exportov v UI — skryť alebo prerobiť na „pripravujeme" | monetizacia-navrh.md |
| Produkt | Vyžadovať e-mail na vstupe alebo až pred výsledkom (návrh: pred výsledkom) | monetizacia-navrh.md |
| Infraštruktúra | Potvrdiť cloud namiesto vlastného servera (návrh: cloud, región EU, obyčajný PostgreSQL bez uzamknutia na dodávateľa) | monetizacia-navrh.md |
| Prevádzka | Kto fakturuje a vymáha · kto rieši podporu používateľov | monetizacia-navrh.md |
| Validácia | Potvrdiť prahy v rozhodovacích bodoch | validacia-dalsie-kroky.md |
| Validácia | Potvrdiť ročné KPI (návrh A 16 · B 14 · C 6 · D 3, merané od 1. 1. 2027) | validacia-dalsie-kroky.md §6 |
| Validácia | Zistiť skutočnú účasť na workshopoch | validacia-dalsie-kroky.md §8 |
| Validácia | Overiť, či súhlas vo formulári na workshopy pokrýva telefonát (R6) | validacia-dalsie-kroky.md §8 |
| Validácia | Kto vedie oslovenie dodávateľov (krok D1) | validacia-dalsie-kroky.md |
| Validácia | Či sa cieľová skupina mení z obcí na ich dodávateľov | validacia-dalsie-kroky.md |
| Riziko | Či bude tím zadávateľky ochotný presmerovať dopyt na VESMA. Ak to budú vnímať tak, že im to berie prácu, padá najhodnotnejší kanál | validacia-dalsie-kroky.md |

---

## 8. Mapa súborov

| Súbor | Čo je v ňom |
| --- | --- |
| `docs/kontext-monetizacia-a-validacia.md` | tento dokument |
| `docs/monetizacia-navrh.md` | model monetizácie — dohodnuté, pripomienky, otvorené rozhodnutia, infraštruktúra |
| `docs/validacia-dalsie-kroky.md` | platný plán validácie, verzia 3 |
| `docs/validacia-casova-os.puml` | UML activity s krokmi podľa fáz + gantt s časovou osou |
| `docs/validacia-kroky.png`, `docs/validacia-casova-os.png` | vykreslené diagramy |
| `docs/VESMA_monetizacia_model.docx` | model monetizácie pre kolegov |
| `docs/VESMA_dalsie_kroky.docx` | plán validácie pre kolegov, s diagramami v prílohe |
| `docs/VESMA_monetizacia_podklad_pre_rozhovor_2026-09-04.docx` | **prekonané.** Sľubuje, že jadro zostane bezplatné natrvalo — neposielať ďalej |
| `docs/chybajuce-hodnoty.md` | register hodnôt, ktoré čakajú na potvrdenie odborníkom |
| `docs/verziovanie-pravidiel.md` | mechanizmus verzií pravidiel hodnotenia |
| `docs/prihlasenie-emailom.md` | ako funguje prihlásenie a zber e-mailov |
| `docs/rozsah-mapovania.md` | výber voda / energia / oboje |
| `docs/nasadenie-inovia-sk.md` | nasadenie na `vesma.inovia.sk` |

DOCX sa generujú z markdownu skriptom, ktorý nie je v repozitári. Zdrojom pravdy
je vždy markdown. **Diagramy (`.puml`, `.png`) a oba DOCX zodpovedajú verzii 2
plánu** — neobsahujú krok R6, poznámku k prahu z 31. 3. ani ročné KPI.
Aktualizujú sa pri najbližšej úprave diagramov.

---

## 9. Pravidlá práce v repozitári

Plné znenie v `CLAUDE.md`. Podstatné:

- Pracovať na samostatnej vetve, otvoriť PR, **nikdy nepushovať priamo do `main`**.
- **Číslo verzie nikdy neupravovať ručne** — spustiť `npm run verzia`, ktorý ho
  nastaví na (verzia na `main`) + 1, a commitnúť `version.json`. Platí pre každý
  PR vrátane čisto dokumentačného.
- Štyri veci rozhoduje človek: **vymyslené čísla** (referenčné hodnoty, ceny,
  návratnosti — keď zdroj nie je, hodnota zostáva prázdna a zapíše sa do
  `docs/chybajuce-hodnoty.md`) · **pravidlá hodnotenia** (`useScoring.ts`,
  `comparisonWeights.ts`) · **nezvratné kroky** · **rozbitie exportného
  kontraktu** na xMatik a Klimasken.
- Opravovať triedu, nie výskyt — nájsť všetky miesta, ktoré používajú ten istý
  predikát, a opraviť ich v jednom PR.
- Commit správy a popis PR po slovensky.

---

## 10. Na čo si dať pozor

- **Zoznam prihlásení nie sú registrácie.** Každé kliknutie na odkaz je nový
  riadok. Pri akejkoľvek úvahe o počtoch treba deduplikovať.
- **Zoznam prihlásených na workshopy nie je zoznam účastníkov.** Skutočná účasť
  bola nižšia a nepoznáme ju. Obce v ňom sú priradené podľa názvu organizácie;
  Konská je v kraji dvakrát a nie je jasné, ktorá sa prihlásila.
- **Čísla rozhodnutí v `monetizacia-navrh.md` sú stabilné** aj po vyriešení —
  vyriešené sa z tabuľky vyberú do samostatnej sekcie, neprečíslujú sa.
- **Náklad na OCR nikdy neodhadovať.** Cena balíka PLUS na ňom stojí a nikto ho
  nezmeral. Zmerať sa dá na desiatich skutočných certifikátoch.
- **Starý docx z 4. 9.** tvrdí opak dnešného modelu. Dátum je v názve zámerne.
- **Kraj neplatí a nemá platiť.** Akýkoľvek model, ktorý to mení, je proti
  dohode z úvodu projektu.
- **Prvý rok spoplatnenia nie je o výnose.** Odhad 10 – 12 tisíc € ročne
  (`monetizacia-navrh.md`, B.11) predpokladá adopciu 15 – 25 % obcí v prvom
  roku. Dnešné dáta ju nepodporujú: v aplikácii sú 3 obce z 315 (1 %), na
  workshopy sa zapísalo 23 (7,3 %) — pozri poznámku pri B.11. Hodnota je
  v preukázanej ochote platiť, ktorá sa dá ukázať ďalšej VÚC alebo donorovi.
