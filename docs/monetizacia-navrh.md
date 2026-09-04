# VESMA — model monetizácie: zhrnutie návrhu a pripomienky

Podklad pre rozhodovanie. Vznikol zlúčením dvoch zdrojov:

- poznámky z porady (OneNote: *Zápisy z porád → VESMA - monetizácia*, 31. 8. 2026),
- zápisnica z porady AT Park spracovaná z audiozáznamu (`Zapisnica_AT_Park_VESMA.docx`, GreenHUB).

Časť **A** je zhrnutie toho, na čom sme sa dohodli. Časť **B** sú moje pripomienky
z pohľadu kódu a doterajšieho vývoja — nie sú dohodnuté a treba o nich rozhodnúť.
Časť **C** je zoznam otvorených rozhodnutí zoradený podľa toho, dokedy ich treba spraviť.

---

## A. Zhrnutie navrhovaného modelu

### A.1 Východisko

VESMA vzniká v INOVII na zadanie Žilinského samosprávneho kraja: hodnotí areály
samospráv z pohľadu modrozelenej infraštruktúry a energetiky. Pôvodné zadanie
predpokladá **bezodplatné poskytnutie nástroja samosprávam Žilinského kraja**.

Podnet na monetizáciu prišiel zo synchronizačnej porady: hľadá sa cesta
k udržateľnosti INOVIE z vlastných zdrojov do roku 2029, pri zachovaní
verejnoprospešnej funkcie. Prioritný segment je **B2G**; validácia B2B a B2C sa
odkladá.

### A.2 Štyri piliere modelu

1. **Bezplatné jadro zostáva bezplatné.** Všetko, čo je dnes vyvinuté — vrátane
   záverečného hodnotenia — zostáva pre samosprávy ŽSK bezplatné. Rozsah
   bezplatnej a platenej verzie sa má zadefinovať **pred prvou prezentáciou**,
   aby sa neskôr nemuseli obmedzovať už poskytnuté funkcie.
2. **Spoplatní sa to, čo generuje náklady** — AI tokeny, server, úložisko.
   Dnešné prevádzkové náklady sú minimálne: dáta sa ukladajú lokálne v prehliadači
   používateľa, metodika beží na zatiaľ bezplatnom serveri.
3. **Cena sa diferencuje podľa veľkosti samosprávy**, resp. počtu hodnotených
   objektov. Malé obce bez obmedzenia; väčšie mestá platia nad stanovený počet
   objektov (v diskusii padla hranica cca 20 – 35). Kategorizácia obcí podľa
   počtu obyvateľov je bežná aj v legislatíve.
4. **Územný rozsah = Žilinský kraj.** Podkladové vodozádržné mapy spracovala ČZU
   na náklady župy a existujú len pre ŽSK; výstupy pre obce z iných krajov by boli
   nevierohodné. Pri obci mimo ŽSK sa zobrazí upozornenie, prípadne sa hodnotenie
   nevydá vôbec (tréningový režim).

### A.3 Kandidáti na platené nadstavby

| Nadstavba | Poznámka z porady |
| --- | --- |
| Párovanie objektov s výzvami + predvypĺňanie žiadostí | Preferuje sa integrácia existujúceho nástroja (Maroš) namiesto vlastného vývoja. Model: poplatok za vypracovanie + success fee. |
| Zálohovanie a úložisko dát u INOVIE | Bezplatná alternatíva zostáva „exportuj si k sebe". Platená verzia vyžaduje nákladový model na server/cloud. |
| Automatické vyťažovanie listov vlastníctva | Kandidát kvôli AI tokenom. |
| Spracovanie fotografií | Dnes sa fotografie iba prikladajú, bez analýzy. |
| Integrácia na inventarizačné systémy obcí | Pôvodná požiadavka VÚC. Treba preskúmať používané systémy a prepojenie cez jednotný identifikátor. |

### A.4 Hodnotová argumentácia pre samosprávy

Približne **75 – 80 % investícií obcí do infraštruktúry** je financovaných
z externých zdrojov. VESMA uľahčuje prístup k nim a pomáha prioritizovať
investície aj prevádzkové úspory.

### A.5 Podmienky používania

Používanie aplikácie bude podmienené **registráciou e-mailovej adresy so súhlasom
v zmysle GDPR**, vrátane validácie adresy. Umožní to zasielať dotazníky
a informácie o novinkách.

### A.6 Rozšírenie mimo ŽSK

Podmienené **zafinancovaním dátového podkladu treťou stranou** (iná VÚC, prípadne
B2B partner v rámci CSR). V takom prípade môže byť spoplatnená aj základná verzia.
Záujemcovia z iných krajov slúžia ako **databáza dopytu** pri rokovaniach s ďalšími
krajmi. Rovnaké obmedzenie zatiaľ limituje aj B2B segment — medzikrajské porovnania
nie sú možné.

### A.7 Validácia na prezentáciách

- Prvá prezentácia **8. 9. 2026**, ďalšie postupne po regióne.
- Komunikačný rámec: základná verzia je bezplatná vďaka kraju a INOVII,
  pripravované nadstavby budú spoplatnené; **konkrétne ceny sa zatiaľ neuvádzajú**.
- Zber ochoty platiť (v diskusii padli testovacie sumy 2 € a 10 €), po prezentácii
  online dotazník.
- Spätná väzba priamo v aplikácii — existujúci formulár podnetov sa rozšíri o výzvu
  bezprostredne po zobrazení hodnotenia.
- Komunikácia cez partnerstvá so **ZMOS a Úniou miest** (M. Červenák), nie
  oslovovaním jednotlivých starostov.

---

## B. Moje pripomienky

Vychádzajú z toho, čo je v kóde k verzii 198, a z doterajšieho priebehu vývoja.
Zoradené podľa toho, ako veľmi menia návrh.

### B.1 „Spoplatníme to, čo generuje náklady" je slabý základ ceny

Náklady dnes sú takmer nulové a ešte dlho budú. Ak sa cena odvodí od nákladov,
predávame tokeny — a obec bude porovnávať 2 € s cenou tokenu, nie s hodnotou
dotácie, ktorú vďaka nástroju získa. Argument z A.4 (75 – 80 % investícií
z externých zdrojov) je pritom oveľa silnejší a ide proti tomu.

**Návrh:** oddeliť dve veci, ktoré sa v zápisnici zlievajú do jednej vety.

- **Kde je hranica bezplatnosti** — odvodiť od nákladov a od zneužiteľnosti.
  Toto je interná logika, nemusí zaznieť na prezentácii.
- **Koľko stojí to nad hranicou** — odvodiť od hodnoty pre obec. Toto zaznie
  na prezentácii.

Prakticky ide o jednu vetu navyše pri príprave prezentácie, ale mení to, či
o cene vyjednávame my alebo obec.

### B.2 Najsilnejšia platená funkcia dnes nie je AI, ale trvalosť dát

Fakt z kódu: relácie sú v `localStorage` prehliadača, fotografie v IndexedDB
(`sma-nastroj-media`). Server o nich nevie nič. Z toho plynie:

- vyčistenie prehliadača = strata celej práce,
- iný počítač = iné dáta, žiadna synchronizácia,
- kolega nevidí, čo som zadal,
- pri výmene zamestnanca alebo starostu nezostane obci nič.

Pre obec s jedným areálom je to nepríjemnosť. Pre mesto s 30 objektmi, kde na
mapovaní robia traja ľudia, je to **prekážka nasadenia**, nie chýbajúci komfort.

Zároveň je to funkcia, ktorú aj tak musíme postaviť — registrácia e-mailom
z bodu A.5 znamená, že backend s používateľmi bude existovať. „Účet VESMA"
(dáta u nás, viac používateľov za obec, história hodnotení) je preto:

- najzrozumiteľnejší dôvod platiť, aký dnes máme,
- to, čo zákazníka udrží (kto má dáta u nás, neodíde),
- a to, čo prirodzene rastie s veľkosťou obce, teda **nesie aj diferenciáciu ceny
  z bodu A.3**.

**Návrh:** postaviť účet a úložisko do stredu platenej verzie, nie ako jednu
z piatich položiek v zozname nadstavieb.

### B.3 Registrácia hneď na vstupe zníži množstvo spätnej väzby

Bod A.5 hovorí, že používanie bude podmienené registráciou. Prezentácie 8. 9.
však robíme kvôli validácii — potrebujeme, aby si to čo najviac ľudí vyskúšalo
a povedalo nám, čo im chýba. Tvrdá bariéra na vstupe ide priamo proti tomu.

**Návrh:** e-mail pýtať **až pred zobrazením alebo exportom hodnotenia**, nie
pri otvorení aplikácie. Vyskúšať sa dá bez registrácie; kto si chce odniesť
výsledok, identifikuje sa. Je to lepší konverzný bod (človek už vidí, že to
funguje) aj čistejšie GDPR (jasný a viditeľný účel). Adresy získame prakticky
tie isté — len od ľudí, ktorí dosiaľli až po výsledok, čo je presne tá skupina,
ktorej odpovede nás zaujímajú.

### B.4 Vyťažovanie LV dnes AI nepoužíva — a to mení, čo sa dá spoplatniť

Zápisnica uvádza vyťažovanie LV a certifikátov medzi kandidátmi „kvôli AI
tokenom". V kóde (`src/utils/pdfParser.ts`) sa však PDF číta cez `pdfjs-dist`
priamo v prehliadači: **nula tokenov, nula servera**. Spoplatniť to v dnešnej
podobe by bolo ťažko obhájiteľné.

Čo nefunguje, sú **skenované PDF bez textovej vrstvy** — a to sú presne tie,
ktoré starostovia majú (staršie certifikáty z eurofondov, papierové LV).
Skutočná platená funkcia teda nie je „načítanie certifikátu", ale
**„prepíšeme vám aj naskenované dokumenty"**. To je jasne ohraničené,
zrozumiteľné a náklad je reálny.

Úloha 7 zo zápisnice („overiť tokenové náklady") má teda dve odpovede:
textové PDF stojí 0 €, sken stojí jedno volanie modelu nad obrázkami strán.
**Konkrétne číslo si netrúfam odhadnúť** — navrhujem ho zmerať na desiatich
skutočných certifikátoch od starostov a až potom cenníkovať. Do dovtedy patrí
do `docs/chybajuce-hodnoty.md`.

### B.5 Na prezentácii nesmú byť tlačidlá, ktoré nič nerobia

Dnes v aplikácii sú:

- `ChatAssistant.tsx` a `PhotoAnalyzer.tsx` — tlačidlá, ktoré zobrazia
  `alert('Táto funkcia bude dostupná čoskoro…')`,
- export do **Xmatik** a **URBIS** v Krok 6 — takisto `alert` s textom, že
  integrácia bude implementovaná po dodaní špecifikácie.

Ak na prezentácii povieme „AI funkcie a integrácie budú platené", niekto to
v ten istý deň skúsi a nájde `alert`. Pôsobí to horšie, než keby tam neboli
vôbec.

**Návrh:** pred 8. 9. tieto atrapy buď skryť, alebo prerobiť na jednoznačné
karty „pripravujeme" bez vzhľadu funkčného tlačidla. Je to malá zmena a viem
ju spraviť — potrebujem len rozhodnutie, ktorú z dvoch možností.

### B.6 Success fee otvára iný typ podnikania, než aký dnes robíme

Poplatok za úspech pri žiadosti znamená zmluvu, zodpovednosť za kvalitu žiadosti
a potenciálny spor o to, či žiadosť uspela vďaka nám. Pre verejnoprospešnú
organizáciu je to aj otázka súladu s tým, na čo je nastavená.

**Návrh:** v prvej fáze len **fixný poplatok za spracovanie**. Success fee
na prezentácii vôbec neotvárať — nie je to niečo, čo sa dá povedať polovične.

### B.7 Hranica podľa počtu objektov je zrozumiteľná, ale nemerateľná dopredu

Počet objektov je legitímna cenotvorná metrika — škáluje s veľkosťou obce a je
férová. Má však dve slabiny:

- **Používateľ ju dopredu nepozná.** Starosta pri registrácii nevie, koľko
  objektov nakoniec zmapuje. Kategória obce podľa počtu obyvateľov (spomínaná
  na porade) je známa okamžite a je zakotvená v legislatíve.
- **Nesúvisí s nákladom**, kým dáta ležia v prehliadači. Prvá bystrá obec nám
  povie „veď to beží u mňa v počítači".

**Návrh:** cenník postaviť na **kategórii obce podľa počtu obyvateľov**
(zrozumiteľné, overiteľné, nediskutovateľné) a počet objektov použiť len ako
férový strop v rámci kategórie. Toto je rozhodnutie pre človeka — dávam obe
možnosti, nerozhodujem ho.

### B.8 „2 € alebo 10 €" — chýba jednotka, a bez nej je odpoveď bezcenná

V dotazníku po prezentácii treba povedať **za čo a ako často**. „Zaplatili by ste
10 €?" bez jednotky nedáva použiteľnú odpoveď.

Dôležitejšie: **obec neplatí ako spotrebiteľ.** Suma 2 € či 10 € mesačne je
administratívne drahšia než sama suma — faktúra, rozpočtová položka, podpis.
Reálne to znamená **jeden ročný poplatok fakturovaný raz za rok**, nie
mikroplatby kartou.

**Návrh:** v dotazníku testovať ročnú sumu za obec, nie mesačnú za používateľa,
a pýtať sa aj na to, **kto o výdavku rozhoduje** (starosta / ekonóm / zastupiteľstvo).
Ochota platiť a schopnosť zaplatiť sú pri samospráve dve rôzne veci.

### B.9 Riziko, ktoré v zápisnici nie je: ako to bude vnímať župa

Župa zaplatila vývoj aj dátový podklad. To, že INOVIA na tom istom nástroji
začne zarábať — hoci len na nadstavbách — si zaslúži vysvetlenie skôr, než sa
to dozvie od niekoho iného alebo z prezentácie pre obce.

**Návrh:** mať pripravenú a **písomne potvrdenú** vetu v duchu: *„Všetko, čo
kraj zaplatil, zostáva pre obce Žilinského kraja bezplatné natrvalo. Spoplatnené
je len to, čo pribudne nad rámec zadania a čo nám vytvára prevádzkové náklady."*
Ústna dohoda pri tomto nestačí — o rok si to nikto nebude pamätať rovnako.

Toto je vlastne hlavný účel dokumentu, ktorý ide zadávateľke pred telefonátom.

### B.10 Verziovanie pravidiel sa s platenou verziou stretne

Už dnes máme `AKTUALNA_VERZIA_PRAVIDIEL` a dialóg pri otvorení staršej relácie
(#230). Pri bezplatnom nástroji je prečíslovanie areálov po zmene pravidiel
nepríjemnosť. Pri platenom je to sťažnosť — najmä ak sa medzitým podľa poradia
areálov rozhodlo o investícii.

**Návrh:** ešte pred spustením platenej verzie mať k tomu pravidlo a vedieť ho
povedať nahlas (napr.: uložená relácia si drží verziu pravidiel, s ktorou vznikla,
a prepočet je vždy vedomé rozhodnutie používateľa).

### B.11 Obce mimo ŽSK — spraviť z upozornenia funkciu

Zápisnica správne hovorí o „databáze dopytu". Odporúčam to nenechať pri poznámke:
obec mimo kraja dostane tréningový režim **a formulár „máme záujem"**. Je to
takmer tá istá práca ako samotné upozornenie (úloha 5) a vzniká z toho najlacnejší
možný podklad pri rokovaní s inou VÚC — *„máme X obcí z vášho kraja, ktoré si to
už vyskúšali."*

### B.12 Počet budov v ŽSK — netreba presné číslo, treba obhájiteľné

Odhad 5 500 bol na porade spochybnený a cez ZMOS sa overuje ťažko. Na to, na čo
to potrebujeme (veľkosť trhu a nastavenie hraníc), stačí odvodenie: počet obcí
v kraji je verejne známy, typický počet objektov na obec vieme zistiť **zo
vzorky 5 – 10 obcí, ktoré nástroj reálne prejdú** po prezentáciách. Do dovtedy
neuvádzať žiadne číslo — nepresný odhad v prezentácii je horší než žiadny.

---

## C. Otvorené rozhodnutia

### Pred 8. 9. 2026

| # | Rozhodnutie | Poznámka |
| --- | --- | --- |
| C1 | Presná hranica bezplatnej verzie (počet objektov / kategória obce) | A.3 vs. B.7 |
| C2 | Vyžadovať e-mail na vstupe alebo pred výsledkom | A.5 vs. B.3 |
| C3 | Čo s atrapami AI a exportov v UI — skryť alebo prerobiť na „pripravujeme" | B.5 |
| C4 | Znenie a jednotka cenových otázok v dotazníku | B.8 |
| C5 | Písomné potvrdenie od župy, že bezplatné jadro zostáva bezplatné | B.9 |

**Cenník pred 8. 9. potrebný nie je** a je rizikom — číslo, ktoré raz zaznie
na prezentácii, sa už nedá vziať späť. Stačia tri vety: čo je zadarmo a zostane
zadarmo, čo bude platené a prečo, a že ceny nastavíme podľa toho, čo nám poviete.

### Priebežne

| # | Rozhodnutie | Poznámka |
| --- | --- | --- |
| C6 | Či je platená verzia postavená na účte a úložisku, alebo na AI funkciách | B.2 |
| C7 | Success fee áno/nie, a kedy | B.6 |
| C8 | Náklad na OCR jedného skenovaného dokumentu (zmerať, nie odhadnúť) | B.4, patrí do `docs/chybajuce-hodnoty.md` |
| C9 | Pravidlo pre verzie pravidiel v platenej verzii | B.10 |
| C10 | Rozsah tréningového režimu a formulára záujmu mimo ŽSK | B.11 |

---

## Súvisiace súbory

- `docs/VESMA_monetizacia_pre_zadavatela.docx` — verzia pre zadávateľku (bez
  interných pochybností a bez čísel, ktoré nie sú rozhodnuté).
- `docs/chybajuce-hodnoty.md` — register hodnôt, ktoré čakajú na potvrdenie.
- `docs/verziovanie-pravidiel.md` — mechanizmus verzií pravidiel hodnotenia (B.10).
