# VESMA — model monetizácie

Stav: **po rozhovore so zadávateľkou (4. 9. 2026)**. Oproti prvej verzii tohto
dokumentu sa model zmenil zásadne — základná verzia už nie je bezplatná.

Podklady, z ktorých dokument vznikol:

- poznámky z porady (OneNote: *Zápisy z porád → VESMA - monetizácia*, 31. 8. 2026),
- zápisnica z porady AT Park z audiozáznamu (`Zapisnica_AT_Park_VESMA.docx`, GreenHUB),
- rozhovor so zadávateľkou 4. 9. 2026 a následná diskusia.

Ako čítať značky:

- **[dohodnuté]** — rozhodnuté človekom, nemeniť bez novej dohody,
- **[návrh]** — moje odporúčanie, čaká na rozhodnutie,
- **[zmerať]** — hodnota, ktorú nikto nevie a nesmie sa odhadovať.

> **Pozor na starý dokument.** `docs/VESMA_monetizacia_podklad_pre_rozhovor_2026-09-04.docx`
> je podklad pripravený **pred** rozhovorom. Sľubuje, že základná verzia zostane
> bezplatná natrvalo — čo už neplatí. Neposielať ďalej; je tam len ako záznam
> východiskovej pozície.

---

## Zhrnutie na jednu minútu

**Rozhodnuté:**

- Základná verzia je pre obce Žilinského kraja **platená**, cena podľa **počtu
  obyvateľov**. Dôvod, ktorý dala zadávateľka: nástroj s cenovkou je vnímaný
  ako hodnotnejší než nástroj zadarmo.
- **Župa neplatí** — ani za vlastné budovy, ani za obce v kraji.
- **Bude prechodné obdobie bez poplatku** (návrh termínu: do 31. 12. 2026).
- Funkcie s variabilným nákladom (vyťaženie skenov, fotografie) tvoria
  **balík PLUS: +50 %** k ročnému poplatku, s limitom **tri dokumenty na
  zmapovaný objekt**. Kvóta platí aj počas prechodného obdobia.
- Obci, ktorá nezaplatí, sa účet prepne do režimu **len na čítanie na 12 mesiacov**
  — dáta si vie kedykoľvek vyexportovať, mazanie až po dvoch upozorneniach.

**Otvorené a horí do 8. 9.:** potvrdiť termín a cenník · zmerať, čo nás stojí
spracovanie jedného skenu · skryť atrapy AI a exportov v aplikácii · získať
od župy písomné potvrdenie.

**Čo si treba uvedomiť:** 31. 12. nie je len marketingový termín, ale
**vývojový deadline**. Platba od 1. 1. 2027 vyžaduje účet, databázu, úložisko
a evidenciu predplatného — dnes je všetko v prehliadači používateľa a server
o dátach nevie nič. Čo to znamená a čo na to treba, je v časti D.

---

## A. Dohodnutý model

### A.1 Čo sa zmenilo oproti pôvodnému zadaniu

Pôvodné zadanie Žilinského samosprávneho kraja predpokladalo bezodplatné
poskytnutie nástroja samosprávam kraja. **Zadávateľka súhlasila so spoplatnením
aj pre obce v Žilinskom kraji [dohodnuté]** s odôvodnením, že nástroj s cenovkou
bude vnímaný ako hodnotnejší než nástroj zadarmo.

Model sa tým mení z **freemium** (jadro zadarmo navždy, platia sa nadstavby)
na **platený produkt s bezplatnou skúškou**. Nie je to kozmetická zmena — mení
obsah prezentácií pre samosprávy aj to, čo musí byť hotové v kóde do konca roka
(časť D).

### A.2 Kto platí a kto nie

| | |
| --- | --- |
| Obce a mestá v ŽSK | **platia** ročný poplatok podľa veľkosti [dohodnuté] |
| Žilinský samosprávny kraj — za vlastné budovy | **neplatí** [dohodnuté] |
| Žilinský samosprávny kraj — za obce v kraji | **neplatí** [dohodnuté] |

Dôvod, prečo kraj neplatí: je zriaďovateľ INOVIE aj zadávateľ projektu a na
začiatku sa dohodlo, že ho nástroj nebude stáť nič. Rozhodnutie je vedomé aj
za cenu výpadku príjmu. Formulácia „zatiaľ" ponecháva dvere otvorené — cestou,
ako ich otvoriť, je bod B.5.

Praktický dôsledok pre komunikáciu: správa smerom k obciam je jednoduchšia než
predtým — *„Vývoj nástroja zaplatil kraj. My účtujeme len prevádzku."*

### A.3 Prechodné obdobie bez poplatku

**Prechodné obdobie bude [dohodnuté]**; jeho dĺžka je ešte na potvrdenie.

**Návrh: do 31. 12. 2026** (alternatíva bola 15. 11.). Rozhoduje o tom jeden
argument, ktorý prebíja ostatné:

> **Rozpočtový cyklus obcí.** Obec schvaľuje rozpočet na ďalší rok v novembri
> až decembri. Pri poplatku od 15. 11. nemá obec v rozpočte 2026 položku,
> z ktorej by ho zaplatila — a nemôže ho zaplatiť, ani keby chcela. Termín
> 31. 12. trafí okno, keď starostovia položku na rok 2027 tvoria.

Tri ďalšie dôvody:

- Prezentácie pokračujú po regióne. Obec, ktorá príde na prezentáciu v októbri,
  by pri termíne 15. 11. mala tri týždne.
- Fakturácia je čistá: prvé faktúry k 1. 1. 2027, celý rok, žiadne pomerné časti.
- Je to zároveň **náš vývojový deadline** (časť D). Pri 15. 11. by sme spustili
  platenú verziu, ktorá nemá kam ukladať dáta.

**Znenie pre prezentáciu [návrh]** — termín má byť odmena, nie hrozba:

> Do 31. 12. 2026 je nástroj bezplatný v plnom rozsahu. **Čo si do vtedy
> zmapujete, to vám zostáva** — dáta aj exporty, bez podmienok. Kto sa do
> 31. 12. zaregistruje, má rok 2027 za zavádzaciu cenu.

Prvá veta odstraňuje strach zo straty práce a technicky nás nestojí nič (export
už funguje). Druhá dáva dôvod nečakať.

Zamietnutá alternatíva: „prvý rok zadarmo od registrácie" — 315 rôznych dátumov
ukončenia, žiadna urgencia, nikto si nespomenie, kedy mu to končí.

### A.4 Cenník podľa počtu obyvateľov

**Diferenciácia podľa počtu obyvateľov [dohodnuté]** (nie podľa počtu objektov —
ten používateľ pri registrácii ešte nepozná, kým kategória obce je známa okamžite
a je zakotvená v legislatíve).

Tri pravidlá, na ktorých záleží viac než na konkrétnych sumách:

1. Cena musí byť **pod hranicou, kde o nej rozhoduje starosta sám** — bez
   zastupiteľstva a bez verejného obstarávania.
2. **Fakturuje sa raz ročne, jednou faktúrou obci.** Nie mesačne, nie kartou —
   mesačných 5 € je administratívne drahších než sama suma.
3. Cena rastie **oveľa pomalšie než počet obyvateľov**. Žilina nemá 80× viac
   budov než obec s tisíc obyvateľmi.

**Návrh cenníka** — východisková hypotéza na otestovanie v dotazníku:

| Kategória | Obyvatelia | Základ / rok | S balíkom PLUS |
| --- | --- | --- | --- |
| A | do 1 000 | **50 €** | **75 €** |
| B | 1 001 – 5 000 | **100 €** | **150 €** |
| C | 5 001 – 20 000 | **250 €** | **375 €** |
| D | nad 20 000 | **500 €** | **750 €** |

Zámerne okrúhle čísla, nie 49/99 — pre samosprávu vyzerá okrúhla suma
serióznejšie a lepšie sa rozpočtuje.

**Otvorené: DPH.** Treba doplniť, či sú sumy s DPH alebo bez. Obce si DPH
väčšinou neodpočítajú, takže ich zaujíma suma s DPH a tak by mala byť aj uvedená.

Test dostupnosti: pre obec do 1 000 obyvateľov je 50 €/rok rádovo stotina percenta
rozpočtu, teda asi 4 € mesačne. Cenovka, ktorá signalizuje hodnotu, ale nie je
to rozhodnutie.

### A.5 Balík PLUS — funkcie s variabilným nákladom

**Funkcie, ktoré nám generujú variabilný náklad, sa spoplatňujú príplatkom
+50 % k ročnému poplatku [dohodnuté].** Podoba balíka nižšie je odsúhlasená
6. 9. 2026.

**PLUS je druhý rozmer cenníka, nie piata kategória [dohodnuté].** Veľkostné kategórie
hovoria *kto* je zákazník; vyťažovanie dokumentov hovorí, *koľko nás ten
zákazník stojí*. Sú to nezávislé veci — mesto s 30 000 obyvateľmi môže mať všetky
certifikáty naskenované aj v tabuľke. Piata kategória by ich zlepila dokopy.

Do balíka patrí **všetko, čo generuje variabilný náklad**, nie len listy
vlastníctva:

- vyťaženie **naskenovaných** listov vlastníctva a energetických certifikátov,
- analýza fotografií objektov,
- opätovné spracovanie pri obnove certifikátu alebo pri zmene v katastri.

Posledná odrážka je dôležitá: robí z PLUS zmysluplné **ročné** predplatné.
Bez nej by obec zaplatila balík raz počas mapovania a druhý rok ho zrušila —
oprávnene, lebo by za nič neplatila.

**Textové PDF zostávajú v základe zadarmo.** Dnes ich číta `pdfjs-dist` priamo
v prehliadači, bez nášho servera a bez tokenov (`src/utils/pdfParser.ts`).
Spoplatniť ich by bolo neobhájiteľné. Platí sa až za to, čo dnes nefunguje
vôbec — **skeny bez textovej vrstvy**, teda presne tie dokumenty, ktoré
starostovia reálne majú.

**Párovanie s výzvami do balíka nepatrí** — je to služba s iným typom
zodpovednosti (pozri B.7) a patrí mimo cenník.

**Prečo +50 % dáva zmysel:** počet dokumentov na spracovanie rastie zhruba
rovnako ako veľkosť obce, takže pomer „cena PLUS / počet dokumentov" vychádza
vo všetkých štyroch kategóriách približne rovnako. Nie je to náhoda a je to
argument, prečo je model férový — dá sa to takto povedať aj obciam.

**Limit — bez neho model nefunguje [dohodnuté]:**

> V balíku PLUS je zahrnuté spracovanie **troch dokumentov na každý zmapovaný
> objekt** (typicky list vlastníctva, energetický certifikát a jeden ďalší).
> Nad tento rámec po dohode.

Základ môže byť neobmedzený — obec so 40 objektmi nás nestojí prakticky nič
navyše. PLUS neobmedzený byť nesmie, lebo tam každé použitie stojí peniaze.
Pravidlo naviazané na počet objektov sa vysvetlí jednou vetou, škáluje samo
s veľkosťou obce a zastaví prípad, keď niekto nahrá dvetisíc skenov.

**PLUS počas prechodného obdobia [dohodnuté]:** ani počas prechodného obdobia
nie je PLUS zadarmo v plnom rozsahu — platí preň kvóta, aby si ho obce mohli
vyskúšať bez toho, aby nám odtiekla hotovosť. **Výška kvóty [návrh]: 5 dokumentov
na obec.**

Štyri mesiace neobmedzeného spracovania skenov zadarmo sú jediné miesto v celom
modeli, kde nám môže reálne odtiecť hotovosť — a to práve v čase, keď ešte
nevieme, koľko nás jeden dokument stojí (B.1). Preto kvóta, a nie dobrá viera.

### A.6 Čo zostáva bezplatné navždy

Cenovka signalizuje hodnotu len tomu, kto už videl, za čo platí. Preto musí
zostať trvalý bezplatný skúšobný režim [návrh]:

> Jeden areál, hodnotenie na obrazovke, **bez uloženia a bez exportu.**

Obec vidí, že nástroj funguje; výsledok si odnesie až po zaplatení. Bez tohto
sa nikto nezaregistruje a zadávateľkin argument o cenovke prestane platiť.

### A.7 Územný rozsah — nezmenené

Podkladové vodozádržné mapy spracovala ČZU na náklady kraja a existujú len pre
Žilinský kraj; výstupy pre obce z iných krajov by boli nevierohodné. Obec mimo
ŽSK dostane upozornenie, prípadne tréningový režim bez záverečného hodnotenia.

Rozšírenie do ďalších krajov je podmienené zafinancovaním dátového podkladu
treťou stranou. Záujemcovia z iných krajov slúžia ako databáza dopytu pri
rokovaniach s ďalšími krajmi (pozri B.9).

### A.8 Dáta obce, ktorá nezaplatí

**[dohodnuté]** — znenie do VOP:

> Po skončení predplatného sa účet prepne do režimu **len na čítanie**: obec
> vidí svoje areály a môže si ich kedykoľvek vyexportovať (XLSX, CSV, PDF, JSON),
> ale nemôže zadávať nové údaje ani prepočítavať hodnotenie. Tento režim trvá
> **12 mesiacov**. Na zmazanie upozorníme e-mailom 30 a 7 dní vopred. Skoršie
> zmazanie na požiadanie kedykoľvek.

Dvanásť mesiacov preto, že je to presne jeden rozpočtový cyklus — obec, ktorá to
nestihla dať do rozpočtu, má šancu to napraviť budúci rok bez toho, aby prišla
o odvedenú prácu.

Toto musí byť hotové **pred 8. 9.**, lebo patrí do VOP a do GDPR informácie,
ktorú ľudia podpíšu už pri septembrovej registrácii.

### A.9 Validácia a dotazník

Prvá prezentácia **8. 9. 2026**, ďalšie postupne po regióne. Po nich online
dotazník; spätná väzba sa zbiera aj priamo v aplikácii hneď po zobrazení
hodnotenia. Komunikácia cez **ZMOS a Úniu miest** (M. Červenák), nie
oslovovaním jednotlivých starostov.

Sumy 2 € a 10 € z pôvodnej diskusie už nedávajú zmysel. **Otázky do dotazníka
[návrh]:**

- Ročný poplatok pre obec vašej veľkosti by ste považovali za primeraný:
  **do 50 € / 50 – 150 € / 150 – 300 € / viac ako 300 € / nezaplatili by sme nič**
- Kto o takom výdavku vo vašej obci rozhoduje: **starosta / ekonóm / zastupiteľstvo**
- Dokedy to potrebujete vedieť, aby sa to stihlo do rozpočtu na rok 2027?

Tretia otázka je diagnostická — ak väčšina odpovie „do konca novembra", vieme
hneď, či bol termín 31. 12. správny, alebo či máme s cenníkom von skôr.

Energetický modul nie je dokončený; komunikuje sa ako pripravovaný. Vodozádržná
časť je funkčná a hodnotí sa v plnom rozsahu.

---

## B. Pripomienky a otvorené riziká

Vychádzajú zo stavu kódu a z doterajšieho priebehu vývoja. Zoradené podľa
naliehavosti.

### B.1 Cenu balíka PLUS sme stanovili bez toho, aby sme poznali náklad [zmerať]

Nikdy sme nezmerali, **čo stojí spracovanie jedného naskenovaného dokumentu**.
Doteraz to bola poznámka v zozname; teraz je z toho cenotvorná premenná. Bez nej
je +50 % odôvodnené pocitovo, nie nákladovo — a PLUS je jediná časť cenníka,
kde nám môže vzniknúť strata.

Odhadovať sa to nesmie. Zmerať sa dá za jedno popoludnie: vziať **10 reálnych
naskenovaných certifikátov** od starostov, prehnať ich a pozrieť sa na účet.
Patrí to do `docs/chybajuce-hodnoty.md` a malo by to byť hotové **pred 8. 9.**,
nie „priebežne".

### B.2 V aplikácii sú tlačidlá, ktoré nič nerobia

- `src/components/ai-ready/ChatAssistant.tsx` a `PhotoAnalyzer.tsx` —
  zobrazia `alert('Táto funkcia bude dostupná čoskoro…')`.
- Export do **Xmatik** a **URBIS** v kroku 6 (`Step6_Vysledky.tsx`) — takisto
  `alert` o tom, že integrácia príde po dodaní špecifikácie.

Ak na prezentácii povieme, že analýza fotografií je súčasťou plateného balíka
PLUS, niekto na to tlačidlo v ten istý deň klikne. Pri bezplatnom nástroji je to
trápne; pri platenom je to sľub, ktorý sme nesplnili.

**Návrh:** pred 8. 9. atrapy skryť, alebo prerobiť na jednoznačné karty
„pripravujeme" bez vzhľadu funkčného tlačidla. Malá zmena, treba len rozhodnúť
ktorú z dvoch možností.

### B.3 Registrácia hneď na vstupe zníži množstvo spätnej väzby

Prezentácie robíme kvôli validácii — potrebujeme, aby si to čo najviac ľudí
vyskúšalo. Tvrdá bariéra na vstupe ide proti tomu.

**Návrh:** e-mail pýtať **až pred zobrazením alebo exportom hodnotenia**, nie
pri otvorení aplikácie. Zapadá to do bezplatného skúšobného režimu z A.6:
pozrieť si hodnotenie sa dá bez registrácie, odniesť si ho nie. Lepší konverzný
bod (človek už vidí, že to funguje) aj čistejšie GDPR (jasný a viditeľný účel).

### B.4 Písomné potvrdenie od župy je teraz dôležitejšie, nie menej

Predtým sme župe sľubovali „čo ste zaplatili, zostáva zadarmo". Teraz
spoplatnenie otvorila sama — výborne, ale **musí to byť napísané.** Inak to
o rok zvonku vyzerá tak, že INOVIA speňažila nástroj financovaný z verejných
zdrojov, a odpoveď „zadávateľka s tým súhlasila po telefóne" nikoho zaujímať
nebude.

Stačí e-mail s potvrdením troch vecí: že kraj so spoplatnením obcí súhlasí,
že kraj sám neplatí, a odkedy poplatok platí.

### B.5 Budovy kraja zmapovať zadarmo aj tak

Stredné školy, sociálne zariadenia a kultúrne budovy ŽSK sú najväčšie portfólio
v regióne. Nebude to príjem, ale bude to **referenčný dataset a prípadová
štúdia** — presne to, čo potrebujeme ukazovať mestám aj ďalšej VÚC. Zadarmo
odvedená práca, ktorá sa dá predať dvakrát.

Je to zároveň najlepšia cesta, ako sa raz môže „zatiaľ" z bodu A.2 zmeniť.

### B.6 Fakturácia je prevádzka, ktorú musí niekto robiť

Aj 50 € je zmluvný vzťah s obcou: VOP alebo objednávka, faktúra, upomienka,
evidencia. Pri stovke platiacich obcí je to celoročná agenda a pri kategórii A
zožerie veľkú časť z tých 50 €.

Treba na to **meno**, nie predpoklad — a treba rozhodnúť, či sa fakturuje
automatizovane (systém pošle faktúru e-mailom) alebo ručne. Pri navrhovaných
sumách je ručná fakturácia stratová.

### B.7 Success fee otvára iný typ podnikania

Poplatok za úspech pri žiadosti znamená zmluvu, zodpovednosť za kvalitu žiadosti
a možný spor o to, či žiadosť uspela vďaka nám. Pre verejnoprospešnú organizáciu
je to aj otázka súladu s tým, na čo je nastavená.

**Návrh:** v prvej fáze len fixný poplatok za spracovanie. Success fee na
prezentácii vôbec neotvárať — nie je to niečo, čo sa dá povedať polovične.

### B.8 Verziovanie pravidiel sa s platenou verziou stretne

Máme `AKTUALNA_VERZIA_PRAVIDIEL` a dialóg pri otvorení staršej relácie (#230).
Pri bezplatnom nástroji je prečíslovanie areálov po zmene pravidiel nepríjemnosť.
Pri platenom je to sťažnosť — najmä ak sa medzitým podľa poradia areálov
rozhodlo o investícii.

**Návrh:** pravidlo mať hotové pred spustením platenej verzie — uložená relácia
si drží verziu pravidiel, s ktorou vznikla, a prepočet je vždy vedomé rozhodnutie
používateľa. Pozri `docs/verziovanie-pravidiel.md`.

### B.9 Obce mimo ŽSK — spraviť z upozornenia funkciu

Obec mimo kraja dostane tréningový režim **a formulár „máme záujem"**. Je to
takmer tá istá práca ako samotné upozornenie a vzniká z toho najlacnejší možný
podklad pri rokovaní s inou VÚC — *„máme X obcí z vášho kraja, ktoré si to už
vyskúšali."*

### B.10 Počet budov samospráv v ŽSK

Odhad 5 500 bol na porade spochybnený. Na to, na čo číslo potrebujeme (veľkosť
trhu, nastavenie limitov), stačí odvodenie: **ŽSK má 315 obcí, z toho 19 miest,
v 11 okresoch** (overené). Typický počet objektov na obec sa zistí zo vzorky
5 – 10 obcí, ktoré nástroj po prezentáciách reálne prejdú. Do dovtedy neuvádzať
žiadne číslo — nepresný odhad v prezentácii je horší než žiadny.

### B.11 Prvý rok nie je o výnose, ale o dôkaze

Pri 315 obciach s drvivou väčšinou v kategóriách A a B a realistickej adopcii
15 – 25 % v prvom roku vychádza hrubý výnos rádovo **8 – 10 tisíc € za základ**,
plus **1,5 – 2,5 tisíca**, ak si PLUS kúpi asi tretina platiacich. Spolu niečo
medzi 10 a 12 tisíc.

Treba to povedať dopredu, aby to o rok nebolo prekvapenie: **prvý rok je o dôkaze,
že obce sú ochotné platiť.** To je to, čo sa dá predať ďalšej VÚC alebo donorovi.
PLUS tomu dôkazu pomáha viac než základ — ochota priplatiť si za konkrétnu
funkciu je oveľa silnejší signál než zaplatenie vstupného.

---

## C. Otvorené rozhodnutia

Čísla rozhodnutí zostávajú stabilné aj po vyriešení — na uzavreté sa odkazuje
inde a prečíslovaním by odkazy prestali sedieť. Vyriešené položky preto z tabuľky
miznú a sú vypísané nižšie.

### Rozhodnuté 6. 9. 2026

| # | Rozhodnutie | Výsledok |
| --- | --- | --- |
| C3 | PLUS ako druhý rozmer, alebo ako piata kategória | **druhý rozmer** |
| C4 | Limit balíka PLUS | **tri dokumenty na zmapovaný objekt** |
| C5 | Rozsah balíka PLUS počas prechodného obdobia | **kvóta sa použije** (výška ešte na potvrdenie) |

### Pred 8. 9. 2026

| # | Rozhodnutie | Odkaz |
| --- | --- | --- |
| C1 | Potvrdiť termín prechodného obdobia (návrh 31. 12. 2026) | A.3 |
| C2 | Potvrdiť cenník 50 / 100 / 250 / 500 € a doplniť, či je s DPH | A.4 |
| C5b | Potvrdiť výšku kvóty PLUS počas prechodného obdobia (návrh 5 dokumentov) | A.5 |
| C6 | Zmerať náklad na spracovanie jedného skenu | B.1 |
| C16 | Potvrdiť cloud namiesto vlastného servera (návrh: cloud, región EU) | D.2 |
| C7 | Atrapy AI a exportov v UI — skryť alebo prerobiť na „pripravujeme" | B.2 |
| C8 | Vyžadovať e-mail na vstupe alebo pred výsledkom (návrh: pred výsledkom) | B.3 |
| C9 | Získať písomné potvrdenie od župy | B.4 |
| C10 | Znenie cenových otázok v dotazníku | A.9 |

### Priebežne

| # | Rozhodnutie | Odkaz |
| --- | --- | --- |
| C11 | Kto a ako fakturuje; automatizovaná alebo ručná fakturácia | B.6 |
| C12 | Success fee áno/nie, a kedy | B.7 |
| C13 | Pravidlo pre verzie pravidiel v platenej verzii | B.8 |
| C14 | Rozsah tréningového režimu a formulára záujmu mimo ŽSK | B.9 |
| C15 | Kedy a ako zmapovať budovy kraja ako referenciu | B.5 |
| C17 | Výber konkrétnych služieb — databáza, prihlásenie, úložisko, e-maily | D.3 |
| C18 | VOP a aktualizované zásady ochrany osobných údajov | D.7 |
| C19 | Kto rieši podporu používateľov a na akej adrese | D.5, D.7 |

---

## D. Infraštruktúra a čo treba pripraviť

Toto je najpodceňovanejšia časť rozhodnutia. Platba od 1. 1. 2027 znamená, že
do konca roka musí existovať niečo, čo dnes neexistuje vôbec.

### D.1 Kde sme dnes

Relácie sú v `localStorage` prehliadača, fotografie v IndexedDB
(`src/utils/mediaDb.ts`, databáza `sma-nastroj-media`). **Server o dátach
používateľa nevie nič — a žiadna databáza neexistuje.** Jediné serverové časti
sú tri bezstavové funkcie na Verceli: `api/feedback.ts` (most do Google Sheetu),
`api/pvgis.ts` a `api/svp-flood.ts`. Nasadenie beží pod `inovia.sk/vesma/` cez
reverse proxy (`docs/nasadenie-inovia-sk.md`).

Dôsledok, ktorý treba povedať nahlas: dnes **nemáme čo zamykať ani zálohovať**.
Režim „len na čítanie" z A.8 aj limit balíka PLUS z A.5 predpokladajú, že dáta
a počítadlá sú na našej strane.

### D.2 Vlastný server, alebo cloud?

**Odporúčanie: cloud, a vlastný server neriešiť [návrh].**

Vlastný server by znamenal, že niekto v INOVII aktualizuje operačný systém,
obnovuje certifikáty, sleduje výpadky, robí zálohy a skúša ich obnovu. Pri
jednom vývojárovi na čiastočný úväzok je to práca, ktorá zožerie kapacitu
určenú na samotný nástroj. Objem dát je pritom malý — rádovo stovky obcí,
tisíce objektov a fotografie.

Dve podmienky, ktoré z toho robím:

1. **Región EU.** Databáza aj úložisko musia byť v Európskej únii a poskytovateľ
   musí byť menovaný v zásadách ochrany osobných údajov. Toto sa obce aj kraj
   budú pýtať.
2. **Žiadne uzamknutie na dodávateľa.** Držať sa obyčajného PostgreSQL a
   S3-kompatibilného úložiska, bez proprietárnych vychytávok. Ak by raz kraj
   vyžadoval prevádzku u seba, presun má byť sťahovanie, nie prepisovanie.

Náklad na tento objem je pri bežných službách rádovo jednotky až nižšie desiatky
eur mesačne — **presné sumy si treba vytiahnuť z aktuálnych cenníkov [zmerať]**,
menia sa a nechcem ich odhadovať. Pri výnose z B.11 to nie je zanedbateľná
položka a patrí do kalkulácie skôr než do prezentácie.

### D.3 Čo všetko treba okrem databázy

Databáza je len jedna zo siedmich vecí. Zvyšok sa zvykne objaviť až v decembri.

| Čo | Načo to je | Poznámka |
| --- | --- | --- |
| **Databáza** (PostgreSQL) | účty, relácie, predplatné, počítadlá | jadro, bez nej nič ďalšie nedáva zmysel |
| **Prihlásenie a overenie e-mailu** | A.2 — bez identity nevieme, kto zaplatil | **nepísať vlastné**, použiť hotovú službu |
| **Úložisko súborov** | fotografie objektov, dnes v IndexedDB | S3-kompatibilné, objemovo najväčšia položka |
| **Odosielanie e-mailov** | overenie adresy, upozornenia 30 a 7 dní pred zmazaním, faktúry | pozri D.5 — už dnes máme hlásený problém s doručovaním |
| **Serverové spracovanie skenov** | balík PLUS (A.5) | kľúč k modelu **nikdy nesmie byť v prehliadači** |
| **Počítadlo dokumentov** | limit „tri na objekt" (A.5) | limit, ktorý sa nedá odmerať, nie je limit |
| **Zálohovanie a skúška obnovy** | predávame „vaše dáta sú u nás v bezpečí" | záloha, ktorá sa nikdy neobnovovala, nie je záloha |

Poznámka k prihláseniu: existujú služby, ktoré dávajú databázu, prihlásenie aj
úložisko súborov v jednom balíku. Pri našej veľkosti to je pravdepodobne
rozumnejšie než skladať tri veci od troch dodávateľov — ale to je technické
rozhodnutie, ktoré patrí kolegom, nie do tohto dokumentu.

### D.4 Fakturácia — pravdepodobne netreba platobnú bránu

Obce neplatia kartou, ale na faktúru. Namiesto platobnej brány preto treba:

- prehľad, ktorá obec má akú kategóriu a dokedy má zaplatené,
- vygenerovanie podkladu na faktúru,
- ručné alebo poloautomatické označenie „zaplatené".

Je to výrazne menej práce než integrácia brány a pre samosprávy je to zároveň
jediná forma, ktorá im vyhovuje. Bránu zvážiť až vtedy, ak by sa nástroj otvoril
mimo B2G.

### D.5 Doručovanie e-mailov — vyriešiť skôr než sa naň spoľahneme

Zo zápisnice: jedna adresa bola hlásená ako neplatná, s podozrením na blacklist
alebo plnú schránku. Model teraz na e-mailoch stojí — overenie adresy,
upozornenia pred zmazaním dát aj faktúry. Ak nedoručíme upozornenie 30 dní pred
zmazaním, je to nielen zlá služba, ale aj právny problém.

Treba **službu na transakčné e-maily** a poriadne nastavené SPF, DKIM a DMARC
pre doménu, z ktorej sa odosiela. Nie posielanie z bežnej schránky.

### D.6 Postupnosť — nie všetko naraz

Otázka „od ktorej verzie" sa nedá zodpovedať číslom: verzia sa zvyšuje o jedna
pri každom zlúčenom PR, takže ktoré číslo to vyjde, sa dopredu nedá povedať.
Dajú sa však pomenovať tri míľniky.

**M1 — do 8. 9. 2026: žiadna nová infraštruktúra.**
Na prezentácie stačí zbierať e-mailové adresy a spätnú väzbu. To vie existujúci
most `api/feedback.ts` → Google Apps Script → Google Sheet, ktorý beží.
Databáza, účty ani úložisko na to netreba. **Toto je dôležité povedať kolegom:
pred pondelkom nie je čo stavať.**

**M2 — do 31. 12. 2026: celý zvyšok z D.3.**
Účty, databáza, úložisko fotografií, evidencia predplatného, režim len na
čítanie, podklad na fakturáciu. Toto je ten skutočný projekt a je ho viac než
dokončenie energetického modulu. Šestnásť týždňov je reálnych len vtedy, ak sa
začne teraz.

**M3 — po spustení: balík PLUS.**
Spracovanie skenov má zmysel stavať až po zmeraní nákladu (B.1). Kvóta počas
prechodného obdobia (A.5) sa dá dovtedy riešiť aj ručne — obec pošle dokumenty,
spracujeme ich a započítame. Neelegantné, ale funkčné a lacné.

### D.7 Čo treba okrem techniky

Toto sa na poradách zvykne prehliadnuť, hoci to blokuje spustenie rovnako
spoľahlivo ako chýbajúca databáza:

- **VOP alebo objednávkový formulár** pre obce, vrátane pravidla z A.8.
- **Aktualizované zásady ochrany osobných údajov** s menovaným poskytovateľom
  cloudu a umiestnením dát.
- **Rozhodnutie o DPH** — sumy v A.4 musia byť uvedené tak, ako ich obec zaplatí.
- **Meno človeka, ktorý fakturuje a vymáha** (B.6).
- **Meno človeka, ktorý rieši podporu** — starosta, ktorý si zabudne heslo,
  napíše niekomu.
- **Funkčná adresa na podporu**, nadväzne na D.5.


## Súvisiace súbory

- `docs/VESMA_monetizacia_podklad_pre_rozhovor_2026-09-04.docx` — podklad
  pripravený **pred** rozhovorom so zadávateľkou. Popisuje prekonanú
  východiskovú pozíciu (jadro zadarmo natrvalo). Neposielať ďalej.
- `docs/chybajuce-hodnoty.md` — register hodnôt, ktoré čakajú na potvrdenie;
  patrí doň náklad na spracovanie skenu (B.1).
- `docs/verziovanie-pravidiel.md` — mechanizmus verzií pravidiel hodnotenia (B.8).
