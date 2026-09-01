# Energetika vo VESMA — čo treba doplniť, aby nástroj plnil účel a bol v súlade s predpismi

Analýza z 1. 9. 2026. Podklad: zákon č. 321/2014 Z. z. o energetickej efektívnosti
(znenie k 1. 8. 2024), vyhláška MH SR č. 179/2015 Z. z. o energetickom audite
a normy STN EN 16247-1/-2/-3: 2024 (Energetické audity — Všeobecné požiadavky /
Budovy / Procesy).

> **Poznámka k podkladom.** Priložené PDF súbory noriem STN EN 16247-1/-2/-3 sú
> **náhľady** — obsahujú titulnú stranu, národný a európsky predhovor, úvod, predmet,
> normatívne odkazy a **obsah** (zoznam článkov a príloh). Vlastný text článkov 3 až 5
> a informatívnych príloh v nich nie je. Nižšie preto z noriem vychádzam z ich
> štruktúry, predmetu a národného predhovoru; **detailné požiadavky beriem z vyhlášky
> č. 179/2015 Z. z.**, ktorá je pre SR záväzná a ktorú norma podľa národného predhovoru
> STN EN 16247-2 iba dopĺňa „pre časti, ktoré vyhláška nerieši do požadovaných detailov".
> Pred finálnym rozhodnutím o metodike odporúčam pozrieť plné znenia príloh B, C, D, E, F
> normy STN EN 16247-2 (kontrolné zoznamy, členenie spotreby, príklady ukazovateľov
> a opatrení) — sú to presne tie časti, ktoré by sa do VESMA premietli najviac.

---

## 0. Východisko: čím VESMA je a čím nesmie tvrdiť, že je

Energetický audit podľa § 2 vyhlášky č. 179/2015 Z. z. je definovaný proces
(identifikácia predmetu → zistenie stavu → vyhodnotenie stavu → návrh opatrení →
ekonomické a environmentálne vyhodnotenie → súbor odporúčaných opatrení → písomná
správa → súhrnný informačný list → súbor údajov pre monitorovací systém) a smie ho
vykonávať iba energetický audítor zapísaný v zozname (§ 12 a § 13 zákona č. 321/2014 Z. z.).

**VESMA je a má zostať predbežným skríningom („pre-audit", úroveň 1 podľa prílohy B
STN EN 16247-1)** — nástroj pre nadšeného laika, ktorý:
- pripraví a utriedi údaje tak, aby ich audítor vedel prevziať,
- dá orientačné hodnotenie stavu a potenciálu,
- ukáže, kde sa oplatí objednať skutočný audit.

Z toho vyplýva **prvá vec na doplnenie, ktorá nič nestojí**: explicitná deklarácia
rozsahu a limitov vo výstupe (PDF aj XLSX) — „toto nie je energetický audit podľa
§ 2 vyhlášky č. 179/2015 Z. z.". Dnes vo výstupoch nie je.

---

## A. Údaje, ktoré VESMA nezbiera (dátový model)

Príloha č. 1 vyhlášky určuje rozsah zistenia súčasného stavu. Porovnanie s dnešným
modelom (`src/types/areal.ts`):

### A1. Energetická bilancia je neúplná — chýbajú palivá, ceny a výhrevnosti
Tabuľka č. 1.1 prílohy č. 1 žiada za každé palivo/formu energie: **jednotku, množstvo,
výhrevnosť, obsah energie v MWh a ročné náklady v eurách**.

VESMA má spotrebu podľa zdrojov kúrenia (plyn, elektrina, TČ, pelety, štiepka,
uhlie/drevo, CZT) + `spotrebaElektriny`. Chýba:
- **ročné náklady v EUR pri všetkých médiách** (dnes je cena len pri CZT —
  `kurenieCZTCenaKWh`). Bez ceny sa nedá vyčísliť úspora nákladov ani návratnosť,
  teda ani § 2 ods. 4 písm. c) a f) vyhlášky;
- **výhrevnosť ako zadávateľný údaj** — dnes je natvrdo v `FUEL_CONVERSIONS`
  (`src/data/constants.ts`: pelety 4,8 / štiepka 4,0 / uhlie 8,0 / drevo 4,3 kWh/kg).
  Bod 3 písm. a) prílohy č. 1 žiada druh, výhrevnosť **a cenu** zistené z dokladov.
  Drevo s vlhkosťou 20 % a 50 % sa líši takmer dvojnásobne — dnes to VESMA nevie zachytiť;
- **množstvo plynu v m³** (dnes iba kWh) a **zmena stavu zásob** pri tuhých palivách;
- **ďalšie médiá z tabuľky 1.1**: ľahký/ťažký vykurovací olej, nafta, koks, iné
  energeticky využiteľné plyny.

### A2. Jeden rok namiesto štyroch
Bod 2 prílohy č. 1 a bod 9 prílohy č. 2: použijú sa **priemerné ročné hodnoty za
najviac štyri predchádzajúce kalendárne roky**. VESMA sa pýta „spotreba za minulý rok"
— jedna hodnota, bez uvedenia roka. Treba doplniť aspoň rok, ku ktorému sa údaj viaže,
a ideálne rad 2–4 rokov (aj kvôli tomu, aby bolo vidno trend a vplyv už zrealizovaných
opatrení).

### A3. Teplá voda vôbec nie je v modeli
Bod 6 prílohy č. 2 výslovne žiada posúdiť spotrebu energie **na vykurovanie a na prípravu
teplej vody**, vrátane **spotreby teplej vody na osobu**. V `Budova` nie je ani jedno pole
o príprave TV (zdroj, zásobník, cirkulácia, spotreba, počet odberných miest).
Pri školách, DSS, hoteloch a telocvičniach je to jedna z najväčších položiek — a zároveň
oblasť s najrýchlejšou návratnosťou (cirkulácia, izolácia, solárne kolektory).

### A4. Chladenie a vetranie ako spotreba
Úvod STN EN 16247-2 vymenúva služby budovy: vykurovanie, **chladenie**, zvlhčovanie,
odvlhčovanie, vetranie, osvetlenie, príprava teplej vody, dopravné systémy (výťahy),
informačné systémy. VESMA nemá **žiadny údaj o chladení/klimatizácii** (počet a príkon
jednotiek, prevádzka), hoci `catalog.ts` odporúča vonkajšie tienenie kvôli úspore na
chladení. Rekuperáciu zbiera (aj s účinnosťou), ale ako spotrebič ju nikde nepočíta.

### A5. Osvetlenie, spotrebiče a technológie bez príkonu a prevádzky
Bod 8 prílohy č. 1 žiada pri osvetlení charakteristiku sústavy, spôsob prevádzkovania
a spotrebu; pri technologických zariadeniach príkon, prevádzkovú dobu, spotrebu
a špecifickú spotrebu. VESMA má osvetlenie iba ako **percento LED**. Z toho sa nedá
vyčísliť úspora v kWh — a `comparisonWeights.ts` to dnes obchádza proxy hodnotou
„úžitková plocha × (100 − % LED)", čo nemá fyzikálny rozmer.
Chýbajú aj typické veľké spotrebiče areálov samospráv: školská kuchyňa, práčovňa,
bazén, serverovňa, čerpadlá, výťahy.

### A6. Zdroje energie — chýba účinnosť a typ
Bod 6 prílohy č. 1 (a tabuľka č. 1.2) žiada pri každom zdroji: počet, typ, označenie,
výrobcu, rok výroby, menovitý tepelný a elektrický výkon, parametre médií, predpokladanú
životnosť, **ročnú účinnosť** a **ročné využitie inštalovaného výkonu**.
VESMA má rok inštalácie, výkon a spotrebu. Chýba najmä **účinnosť a typ kotla**
(kondenzačný / nízkoteplotný / klasický) — bez toho sa nedá odhadnúť úspora z výmeny
zdroja, čo je jedno z troch najčastejšie odporúčaných opatrení v `catalog.ts`.

### A7. Rozvody energie — a s nimi zákonná povinnosť, ktorú VESMA vie skontrolovať
Bod 7 prílohy č. 1 žiada údaje o rozvodoch vrátane **stavu tepelnej izolácie**.
Zároveň § 11 ods. 1 zákona č. 321/2014 Z. z. ukladá vlastníkovi budovy s celkovou
podlahovou plochou **nad 1 000 m²** s ústredným teplovodným vykurovaním alebo spoločnou
prípravou TV povinnosť:
- a) zabezpečiť a udržiavať **hydraulicky vyregulovaný** vykurovací systém,
- b) vybaviť systém **automatickou reguláciou** na každom tepelnom spotrebiči,
- c) zabezpečiť **hydraulicky vyregulované rozvody teplej vody**,
- d) vybaviť rozvody tepla a TV **vhodnou tepelnou izoláciou**.

VESMA sa pýta na termohlavice a automatickú reguláciu, ale **nie na hydraulické
vyregulovanie ani na izoláciu rozvodov**. Pritom `uzitkovaPlochaNUS` už má — vie teda
**automaticky upozorniť, že na budovu dopadá § 11 ods. 1**, a skontrolovať jeho splnenie.
To je pre samosprávu veľmi konkrétny a užitočný výstup, ktorý dnes žiadny „skríningový"
nástroj nedáva.

### A8. Vlastná výroba a predaj energie
Tabuľka 2.1 prílohy č. 2 má riadok „predaj energie iným subjektom"; tabuľka 1.2 rieši
výrobu elektriny a jej predaj. VESMA má `fotovoltika` (áno/nie), `fotovoltikaPlocha`,
`vyrobaElektriny`, `bateriovyUlozisko` (kWh). Chýba:
- **inštalovaný výkon FV v kWp** a rok inštalácie (dnes sa kWp odhaduje z plochy
  konštantou 0,15 kWp/m² v `calculations.ts`),
- **podiel vlastnej spotreby vs. dodávky do siete** — bez toho je ekonomika FV nepresná,
- výkon a výnos solárnych kolektorov.

### A9. Údaje z energetického certifikátu, ktoré appka prečíta a zahodí
`src/utils/pdfParser.ts` už z certifikátu vyťahuje `potrebaEnergieKurenie`,
`potrebaEnergieVoda` a `primarnaEnergia` **v kWh/(m²·a)** — teda presne tie ukazovatele,
ktoré normy nazývajú globálnymi EnPI. `BudovaForm.tsx` z nich do modelu prenesie **iba
energetickú triedu a plochu**, zvyšok sa zahodí, lebo v `Budova` preň nie je pole.
Toto je najlacnejšie možné doplnenie s najvyššou hodnotou.

### A10. SK NACE
Príloha č. 5 (súbor údajov pre monitorovací systém) žiada zatriedenie podľa SK NACE.
VESMA má `kategoriaObjektu` a `typObjektu` (vlastná taxonómia), NACE nie.

---

## B. Výpočty, ktoré VESMA nerobí

### B1. Ukazovatele energetickej hospodárnosti (EnPI) — úplne chýbajú
Článok 5.7.3 STN EN 16247-1 aj -2 (a príloha E normy -2 „Príklady ukazovateľov
energetickej hospodárnosti v budovách" — globálne aj podrobné) robia z EnPI jadro
analýzy. VESMA počíta **jedinú agregovanú hodnotu** — `celkovaSpotreba` (súčet kWh
zdrojov kúrenia, `useArealState.ts`) — a **nikde ju nedelí plochou**.

Pole `normovanaSpotreba` aj `kategoriaEnergetickejNarocnosti` v `types/areal.ts`
existujú, v glosári je dokonca definícia normovanej spotreby s príkladom
„80 kWh/m²/rok" — ale **v celom kóde sa nikdy nepočítajú ani nezobrazujú** (mŕtve polia).

Treba doplniť aspoň:
- `kWh/(m²·rok)` na úžitkovú plochu (globálny EnPI, priamo porovnateľný s certifikátom),
- `kWh/osobu/rok` a `kWh/hodinu prevádzky` — VESMA už má `pocetZamestnancov`,
  `kapacitaZariadenia`, `aktualnaObsadenost`, `vyuzitieDniVRoku`, `vyuzitieHodinDenne`,
  `vyuzitieMesiacovVRoku`, `vyuzitieEnergiaPercent` a **žiadne z nich vo výpočtoch
  nepoužíva**,
- podiel elektriny / tepla / paliva na konečnej spotrebe (rozčlenenie podľa 5.7.2).

### B2. Klimatická normalizácia (dennostupňová metóda)
Bod 4 prílohy č. 1: „Údaje o množstve energie, ktorej spotreba závisí od klimatických
podmienok, sa **prepočítajú dennostupňovou metódou**" (poznámka 6 odkazuje na STN 73 0550).
VESMA neprepočítava nič. Bez toho:
- porovnanie dvoch areálov v rôznych lokalitách (Bratislava vs. Orava) je skreslené,
- porovnanie toho istého areálu medzi rokmi je skreslené počasím.

Pre nástroj, ktorého jednou z dvoch hlavných funkcií je **porovnanie viacerých areálov**,
je to metodicky najzávažnejšia chýbajúca vec. Potrebný podklad: tabuľka dennostupňov
(alebo priemerných vonkajších teplôt vykurovacieho obdobia) pre okresy/klimatické oblasti
SR. VESMA už okres eviduje (`Areal.okres`).

### B3. Referenčná (benchmarková) hodnota
Úvod STN EN 16247-2 hovorí, že referenčné porovnávacie hodnoty alebo priemerné štatistické
údaje o mernej spotrebe sa zvyčajne zverejňujú na národnej úrovni pre rôzne typy budov
a ich vekové kategórie a **majú sa použiť na porovnávacie hodnotenie**.

`docs/porovnanie-arealov-zmeny.md` bod 3 už dnes priznáva, že parameter „Spotreba energie
nad referenčnou hodnotou [kWh/m²/rok]" **musel byť z váh vynechaný**, lebo referenčná
hodnota nie je v appke definovaná. To je presne táto medzera.

VESMA má na to dobrú štartovaciu pozíciu — `TYP_OBJEKTU_OPTIONS` už rozlišuje MŠ, ZŠ, SŠ,
VŠ, zdravotnícke stredisko, nemocnicu, DSS, kultúru, úrad, zbrojnicu, halu, sklad,
kanceláriu, obchod, gastro, hotel, RD, BD… Treba k tomu **tabuľku referenčných hodnôt
kWh/(m²·rok) na typ objektu** (a ideálne vekovú kategóriu — pole `vystavbaPred1980` už existuje).

⚠️ Hodnoty **nevymýšľať**. Zdroje na overenie s človekom: prílohy vyhlášky č. 364/2012 Z. z.
(škály energetických tried podľa kategórií budov k zákonu č. 555/2005 Z. z.), dáta
monitorovacieho systému energetickej efektívnosti (§ 24 zákona), publikácie SIEA.
Toto je zásah do znalostnej bázy → podľa `CLAUDE.md` **rozhoduje človek, nie automat**.

### B4. Environmentálne vyhodnotenie — CO₂ a emisie
§ 2 ods. 5 písm. f) vyhlášky a príloha č. 5 žiadajú pre súbor opatrení emisie
**tuhých znečisťujúcich látok, SO₂, NOₓ, CO a CO₂** pred realizáciou, po realizácii
a rozdiel. VESMA **nepočíta žiadne emisie**. Pritom emisné faktory na palivo sú
jednoduchý, dobre definovaný doplnok a pre samosprávy (klimatické plány, Klimasken)
je uhlíková stopa často dôležitejšia motivácia než eurá.

### B5. Ekonomika opatrení
§ 2 ods. 4 vyhlášky žiada pri každom opatrení úsporu energie v technických jednotkách,
úsporu nákladov, investičné náklady, prevádzkové náklady a **návratnosť**; príloha č. 3
predpisuje jednoduchú dobu návratnosti `Ts = IN / CF` a podľa možnosti aj dynamické
metódy (reálna doba návratnosti, NPV, IRR).

VESMA má v `catalog.ts` iba **statické textové rozpätia** („2 000 – 8 000 EUR",
„5 – 10 rokov") nezávislé od konkrétneho areálu. Doplniť treba jednotkové náklady
(EUR/m², EUR/kW, EUR/kWp) a jednotkové úspory, aby sa dala pre daný areál vypočítať:
úspora v kWh → úspora v EUR (cez cenu z A1) → jednoduchá návratnosť. Aj hrubý odhad
s uvedeným rozpätím je pre laika neporovnateľne užitočnejší než tabuľkový text — a je
to presne štruktúra prílohy č. 3.

### B6. Pravidlo 90 % pokrytia
§ 2 ods. 2 písm. a) vyhlášky: predmetom auditu majú byť objekty, ktorých spotreba
predstavuje **najmenej 90 % celkovej spotreby energie objednávateľa**. VESMA sa nikdy
nepýta na celkovú spotrebu areálu/organizácie, takže nevie povedať, či zadané budovy
tvoria reprezentatívnu časť. Jedna otázka („ročná spotreba celej organizácie podľa
faktúr") umožní zobraziť pokrytie v % — zároveň je to skvelá krížová kontrola kvality dát.

---

## C. Pravidlá hodnotenia jedného areálu (`useScoring.ts`)

### C1. Energetické skóre nepracuje so spotrebou
`calculateEnergia()` hodnotí výlučne **prítomnosť opatrení** (zateplenie fasády/strechy,
% okien, TČ, uhlie, zóny, harmonogram, termohlavice, regulácia, rekuperácia, % LED).
Nameraná spotreba do skóre **nevstupuje vôbec**. Logika normy je opačná: bilancia
a EnPI sú východiskom, opatrenia sú až vysvetlením.

Návrh (na rozhodnutie s človekom): rozdeliť energetické skóre na dve vrstvy —
- **stav** = EnPI vs. referencia (B1 + B2 + B3),
- **potenciál** = chýbajúce opatrenia (dnešná logika),

čo je zároveň presne to, čo potrebuje porovnanie areálov (viď D).

### C2. Bezdôvodné bonusy a stropy
`zateplenie` má `+5`, `vykurovaciSystem` `+10`. Prázdna, nevyplnená budova tak dostane
15 bodov zo 100 „zadarmo" a vyzerá lepšie než budova s poctivo zadanými zlými údajmi.
To je pre nástroj, ktorý má porovnávať, priama chyba stimulov.

### C3. Priemerovanie cez počet budov namiesto váženia plochou
`calculateEnergia` aj `calculateOZE` delia `budovy.length`. Kôlňa 50 m² váži rovnako
ako škola 3 000 m². Pritom `kvalitaOkien` v tej istej funkcii **už váži úžitkovou plochou**
— logika je nekonzistentná sama so sebou. Energetická bilancia je zo svojej podstaty
aditívna (kWh sa sčítavajú), takže vážiť treba plochou alebo spotrebou.

### C4. Zozbierané, ale nehodnotené údaje
Nasledujúce polia sa v `Budova` zbierajú a **do žiadneho skóre nevstupujú**:
`rekuperaciaCentralnaUcinnost`, `rekuperaciaLokalnaDo75/Od76do89/Od90`,
`celkovaPlochaPresklenia`, `vekTermoizolacnychOkien`, `objemVyvetranehoPrezduchu`,
`obvodoveStenyMaterial`, `zateplenieFasadyMaterial`, `strechaRokObnovy`,
`celkovyStavBudovy`, `energetickyCertifikat`, `energetickyAudit`, `energetickyAuditRok`,
`energetickaTrieda` (používa sa len v odporúčaniach, nie v skóre), `vystavbaPred1980`
(len v porovnaní areálov), `kurenieCZTCenaKWh`, celá skupina o využití objektu.

Buď ich zapojiť do hodnotenia, alebo z formulára odstrániť — laika stojí každá otázka
trpezlivosť. Toto je otázka na človeka (mení rozsah funkcií).

### C5. Chýba ukazovateľ kvality a úplnosti dát
Článok 4.1.4 (transparentnosť) a 5.3–5.5 STN EN 16247-1 (zber údajov, plán merania,
metódy vzorkovania) stoja na tom, že je zrejmé, odkiaľ údaj pochádza a akú má kvalitu.
VESMA dnes zobrazí skóre rovnako sebavedomo pri troch aj pri tridsiatich vyplnených
údajoch. Minimum: údaj „skóre stojí na X z Y relevantných údajov" + rozlíšenie
**meraný / z faktúry / odhad**.

---

## D. Parametre a váhy pre porovnanie viacerých areálov (`comparisonWeights.ts`)

### D1. Energetické skóre sčítava nesúrodé jednotky
`ENERGIA_PARAMETERS` sčítava do jedného čísla: m² strechy × 10, m² nezateplenej obálky × 8,
**počet budov** × 6, počet budov × 4, m² proxy pre osvetlenie × 3… Výsledok nemá fyzikálny
rozmer a váhy sa nedajú zmysluplne kalibrovať (čo znamená, že „strecha na FV" je 10
a „budova s plynom" je 6?).

**Odporúčanie:** previesť všetky energetické parametre na spoločnú jednotku
**kWh/rok potenciálnej úspory** (a odvodene EUR/rok a t CO₂/rok). Potom:
- váhy prestanú byť dohodou a stanú sa fyzikálnym odhadom,
- porovnanie areálov je vysvetliteľné laikovi („tu viete ušetriť 240 MWh, tam 40 MWh"),
- výstup priamo zodpovedá § 2 ods. 4 vyhlášky a prílohe č. 5 („celkový potenciál úspor
  energie v MWh").

Dokumentácia (`porovnanie-arealov-zmeny.md`, bod 4) sama uvádza, že energetické váhy
nie sú finálne — toto je príležitosť urobiť ich rovno metodicky obhájiteľné.

### D2. Chýba normalizácia veľkosti
Skóre je súčet absolútnych hodnôt, takže **väčší areál skončí v rebríčku vždy vyššie**.
Pre samosprávu, ktorá vyberá, kam dať prvé peniaze, je to niekedy správne (absolútny
potenciál), ale často zavádzajúce. Treba doplniť druhý pohľad: potenciál **na m²
úžitkovej plochy** alebo **na užívateľa**, prípadne pomer potenciál/investícia.

### D3. Aproximácie, ktoré prežili z núdze
Podľa `porovnanie-arealov-zmeny.md`:
- plocha vhodná pre FV = iba `strechaOrientovanaPlochaNaJuh` (appka nepozná V/Z/JV/JZ
  orientácie ani sklon a tienenie),
- „nezateplená fasáda" sa počíta z `fasadaOrientovanaNaJuh`, hoci tepelné straty idú
  cez **celú** obálku, nielen cez južnú fasádu — to je vecná chyba, nie len aproximácia,
- osvetlenie ako `plocha × (1 − % LED)`.

Doplniť: obvod/plochu celej obálky (alebo aspoň počet podlaží + obvod), orientáciu
a sklon striech, tienenie.

### D4. PVGIS sa využíva len na polovicu
`api/pvgis.ts` sťahuje **horizontálny úhrn ožiarenia** (kWh/m²). Výnos FV sa pritom
počíta paušálom v `calculations.ts`: `kWp = plocha × 0,15`, `kWh = kWp × 1050`.
Konštanta 1 050 je celoslovenský priemer — PVGIS pritom vie vrátiť výnos pre konkrétnu
polohu, azimut a sklon (PVcalc). Ide o presnejšie číslo takmer zadarmo.

### D5. Chýbajúci parameter: plochy pozemkov vhodné pre FV
Uvedený v `porovnanie-arealov-zmeny.md` ako vynechaný, lebo `Pozemok` nemá údaj
o orientácii/vhodnosti. Pri poľnohospodárskych a priemyselných areáloch (typy objektov,
ktoré VESMA pozná) je to podstatný potenciál.

---

## E. Výstup, štruktúra a terminológia

### E1. Export ako podklad pre energetický audit
Ak má byť VESMA „v súlade s normami", najsilnejšie ju to spraví tak, že jej výstup bude
**priamo použiteľný ako vstup do auditu**. Štruktúra podľa vyhlášky:
- identifikácia predmetu (§ 2 ods. 2 — objekty, miesto, majetkovoprávny vzťah;
  VESMA má parcely, LV, adresu, zriaďovateľa → takmer hotové),
- energetické vstupy/výstupy (tabuľka 1.1),
- základná ročná bilancia spotreby (tabuľky 2.1 a 2.2),
- návrh opatrení + ekonomické vyhodnotenie (tabuľky 3.1, 3.2),
- súhrnný informačný list (príloha 4),
- súbor údajov pre monitorovací systém (príloha 5).

⚠️ `CLAUDE.md` označuje **exportný kontrakt na xMatik a Klimasken (G-label sekvencie)**
za zakázanú oblasť. Nové hárky/výstup treba preto riešiť ako **prídavok**, nie zmenu
existujúceho kontraktu, a s odsúhlasením človekom.

### E2. Terminológia podľa národného predhovoru STN EN 16247-2
Norma má k tomu výslovnú národnú poznámku: pri technológiách sa používa „energetická
**účinnosť**" (v %), všeobecne pri hospodárení s energiou „energetická **efektívnosť**"
(zákon č. 321/2014 Z. z.), pri budovách „energetická **hospodárnosť**"
(zákon č. 555/2005 Z. z.).

VESMA to má zmiešané — napr. `Step6_Vysledky.tsx` používa label
**„Energetická efektivita"**; správny právny tvar je **„efektívnosť"**. Glosár má naopak
„Trieda energetickej hospodárnosti" správne. Zjednotenie je drobná, ale lacná zmena
dôveryhodnosti.

### E3. Vzorkovanie pri viacerých rovnakých budovách
Príloha C STN EN 16247-1 (vzorkovanie podľa ISO 19011) a príloha D STN EN 16247-3
(minimálne kritériá pre reprezentatívny odber vzoriek pri organizáciách s viacerými
pracoviskami) dávajú základ pre pravidlo, ktoré by laikovi ušetrilo veľa práce:
„máte 6 rovnakých pavilónov — vyplňte 2 a označte zvyšok ako podobné".
VESMA takúto možnosť nemá, každú budovu treba vyplniť celú.

---

## F. Priorizácia

**Poradie podľa pomeru prínos / náročnosť:**

| # | Krok | Prečo prvé |
|---|------|-----------|
| 1 | Uložiť EnPI z energetického certifikátu (A9) + počítať kWh/(m²·rok) (B1) | Parser ich už číta a zahadzuje; polia `normovanaSpotreba` a `kategoriaEnergetickejNarocnosti` už v modeli sú |
| 2 | Ceny energie v EUR pri každom médiu (A1) | Odomkne úspory v EUR a návratnosť (B5) — bez toho je ekonomika slepá |
| 3 | Rok, ku ktorému sa spotreba viaže (A2) | Jedno pole, bez neho nie je možná ani normalizácia, ani trend |
| 4 | Deklarácia rozsahu „nie je energetický audit" vo výstupoch (kap. 0) | Právna hygiena, nulová technická cena |
| 5 | Kontrola § 11 ods. 1 pri budovách nad 1 000 m² (A7) | Vysoká hodnota pre samosprávu z údajov, ktoré appka väčšinou už má |
| 6 | Teplá voda ako samostatná položka (A3) | Chýba celá veľká časť bilancie |
| 7 | Emisné faktory a CO₂ (B4) | Malý výpočet, veľká motivačná hodnota, väzba na Klimasken |
| 8 | Referenčné hodnoty na typ objektu (B3) | **Potrebuje rozhodnutie človeka o zdroji dát** |
| 9 | Dennostupňová normalizácia (B2) | **Potrebuje klimatické dáta pre okresy** |
| 10 | Prepočet porovnávacích váh na kWh/rok (D1) + normalizácia (D2) | Najväčší metodický posun; má zmysel až po 1–3 a 8–9 |
| 11 | Prestavba energetického skóre na dve vrstvy (C1–C3) | Mení pravidlá hodnotenia → **iba so súhlasom človeka** |

---

## G. Čo sa podľa `CLAUDE.md` nesmie meniť bez rozhodnutia človeka

Táto analýza je zámerne len pomenovaním medzier — **nič z nej som neimplementoval**,
lebo väčšina bodov spadá do zakázaných oblastí:

- **dátová schéma a dátový model** — A1 až A10 sú zmeny `Budova`/`Areal`/`Pozemok`,
- **metodická príručka a znalostná báza chatbota** — B3 (referenčné hodnoty),
  B4 (emisné faktory), B5 (jednotkové náklady), A1 (výhrevnosti),
- **exportný kontrakt na xMatik a Klimasken** — E1,
- **zmena správania, UX a rozsahu funkcií** — C1 až C5, D1, D2, E3
  (nové otázky vo formulári, iné skóre, iné poradie v rebríčku).

Odporúčaný ďalší krok: prejsť tabuľku v kapitole F, rozhodnúť rozsah a zdroje dát
(najmä body 8 a 9) a z odsúhlasených položiek založiť samostatné issues.
