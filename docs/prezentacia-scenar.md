# VESMA — scenár prezentácie pre subregióny ŽSK

Pracovný scenár na 20 minút prezentácie + 10 minút otázok. Pripravené tak, aby
prezentáciu odviedol ktokoľvek z tímu — hlavný tvorca aj členka tímu, ktorá
aplikáciu testovala a dotvárala Príručku. Každá snímka má „čo povedať"
(poznámky pre rečníka), nie len odrážky.

Stav aplikácie, z ktorého scenár vychádza: verzia 199 (`version.json`),
6 krokov dotazníka (Úvod, Pozemky, Budovy, Iné stavby, B&G opatrenia, Výsledky),
skóre v troch oblastiach (modro-zelená infraštruktúra podľa metodiky KLIMASKEN,
obnoviteľné zdroje energie, energetická efektívnosť), porovnanie areálov,
export XLSX/PDF/CSV, relácie s uložením a zdieľaním, tlačidlo Podnet.

---

## 1. Rámec

| Položka | Hodnota |
|---|---|
| Publikum | starostovia obcí, úradníci miest a väčších obcí ŽSK, zástupcovia inštitúcií (SHMÚ a pod.) |
| Úroveň publika | zmiešaná — od „prvýkrát počujem o modro-zelenej infraštruktúre" po odborníkov |
| Hlavný odkaz | **Tu je VESMA, na toto je určená. Vyskúšajte ju na vlastnom areáli. Povedzte nám, čo zlepšiť.** |
| Čas | 20 min prezentácia (z toho ~8 min živá ukážka) + 10 min otázky |
| Rečník | 3× hlavný tvorca, 2× členka tímu (posledné dva subregióny) |
| Forma | PPTX v šablóne INOVIA + živá ukážka na webe |

### Tri veci, ktoré si má publikum odniesť

1. **Čo VESMA robí** — z údajov o areáli (škola, úrad, škôlka, kultúrny dom…)
   spraví skóre, odporúčané opatrenia a poradie areálov podľa toho, kde
   investícia pomôže najviac.
2. **Že je to pre nich a zadarmo** — funguje v prehliadači, netreba
   inštalovať, dáta ostávajú u nich.
3. **Že ich spätná väzba mení nástroj** — tlačidlo Podnet, Príručka, kontakt.

### Čo naopak nehovoriť

- Nepredávať to ako hotový certifikovaný nástroj. Je to testovacia verzia,
  časť hodnôt čaká na potvrdenie expertmi (pozri `docs/chybajuce-hodnoty.md`).
  Otvorenosť tu buduje dôveru, prikrášľovanie ju zničí pri prvej otázke.
- Nesľubovať prepojenie na xMatik/URBIS ako hotové — v aplikácii je zatiaľ len
  tlačidlo s upozornením.
- Nesľubovať AI asistenta — tlačidlo existuje, funkcia nie.

---

## 2. Časový plán (20 minút)

| Čas | Blok | Snímky |
|---|---|---|
| 0:00 – 1:30 | Otvorenie: kto sme, prečo tu sme, čo si odnesiete | S1, S2 |
| 1:30 – 4:00 | Problém: areály obcí, voda, energia, peniaze | S3, S4 |
| 4:00 – 6:30 | Čo je VESMA a ako funguje | S5, S6 |
| 6:30 – 7:00 | Uvedenie prípadovej štúdie | S7 |
| 7:00 – 15:00 | **Živá ukážka** (8 min, pozri kap. 4) | web |
| 15:00 – 17:00 | Čo s výsledkom; kde nástroj dnes je | S8, S9 |
| 17:00 – 19:30 | Vyskúšajte + ako dať spätnú väzbu | S10 |
| 19:30 – 20:00 | Ďakujem, prechod na otázky | S11 (ostáva na plátne) |
| 20:00 – 30:00 | Otázky a odpovede (kap. 5) | S11 / záložné snímky |

Rezerva: ak sa ukážka natiahne, vynechá sa S8 (obsah sa dá povedať pri
Výsledkoch v ukážke) a S9 sa skráti na jednu vetu.

---

## 3. Snímky — obsah a poznámky pre rečníka

Odrážky = text na snímke (krátko, max. 5 riadkov). „Povedať" = poznámky do
PPTX pre rečníka. „Vizuál" = návrh obrázka.

### S1 — Titulná (šablóna INOVIA)

- VESMA — Voda a energia: sprievodca mapovaním areálov
- INOVIA · [subregión] · [dátum]
- Meno rečníka, rola

**Povedať:** jedna veta o sebe a o tom, že VESMA vznikla v INOVII pre obce
ŽSK. Bez dlhého úvodu — publikum čakalo na iné body programu.

### S2 — Čo si dnes odnesiete

- Nástroj, ktorý vám za 1–2 hodiny povie, kde v areáli obce začať s vodou a energiou
- Ukážka na konkrétnom areáli z vášho regiónu
- Odkaz, príručka a spôsob, ako nám povedať, čo zlepšiť

**Povedať:** „Nebudem vás presviedčať, že klíma je problém. Ukážem vám nástroj,
ktorý vám pomôže rozhodnúť, do ktorého areálu dať peniaze ako prvé — a poprosím
vás, aby ste ho vyskúšali."

### S3 — Prečo: areály obcí

- Škola, škôlka, úrad, kultúrny dom, zdravotné stredisko, športový areál
- Každý má strechu, dvor, parkovisko, vykurovanie, osvetlenie
- Voda: prívalový dážď, sucho, odtok do kanalizácie
- Energia: účty za teplo a elektrinu, staré obálky budov
- Peniaze: výzvy chcú dáta a poradie priorít

**Povedať:** hovoriť rečou starostu — účet za plyn, zatopený dvor školy po
búrke, rozpálené parkovisko pred úradom. „Väčšina z vás má 3 až 15 takýchto
areálov a nikto nemá na jednom mieste prehľad, ktorý je na tom najhoršie."

**Vizuál:** fotka typického areálu obce (škola s asfaltovým dvorom) — INOVIA
môže dodať; alternatívne 4 ikony (budova, dvor, strecha, kotolňa).

### S4 — Dnes to obce riešia takto

- Údaje sú roztrúsené: kataster, faktúry, energetické certifikáty, hlavy ľudí
- Rozhodnutie „čo prvé" padá podľa toho, čo je akútne alebo na čo je výzva
- Odborná štúdia na jeden areál = čas a peniaze

**Povedať:** pomenovať bolesť bez kritiky. „Nie je to zlé rozhodovanie — nie je
z čoho rozhodovať." Toto je most k VESME: ona údaje **zbiera na jedno miesto** a
dáva z nich **porovnateľné číslo**.

### S5 — Čo je VESMA

- Webová aplikácia, zadarmo, bez inštalácie, v prehliadači
- Sprievodca 6 krokmi: Úvod → Pozemky → Budovy → Iné stavby → B&G opatrenia → Výsledky
- Výstup: skóre v 3 oblastiach + odporúčané opatrenia + porovnanie areálov
- Hodnotí: modro-zelenú infraštruktúru, obnoviteľné zdroje, energetickú efektívnosť

**Povedať:** vysvetliť tri oblasti jednou vetou každú: MZI = „ako areál
zadržiava vodu a chladí sa zeleňou", OZE = „koľko energie si vie areál vyrobiť
sám", energetická efektívnosť = „koľko energie zbytočne míňa". Skratku B&G
(blue-green, modro-zelené) povedať nahlas — na snímke bude v zátvorke.

**Vizuál:** schéma 6 krokov s ikonami (rovnaké názvy ako v aplikácii) a
3 „budíky" skóre (screenshot z Výsledkov).

### S6 — Ako to funguje v praxi

- Presné hodnoty tam, kde ich máte; odhad tam, kde nie — oboje má zmysel
- Časť údajov si stiahne sama: zrážky (Open-Meteo), slnečný svit (PVGIS), povodňové zóny (SVP)
- Energetický certifikát nahráte ako PDF, hodnoty sa predvyplnia
- Odporúčaný postup: z kancelárie → uložiť → do terénu s mobilom → doplniť
- Dáta ostávajú vo vašom prehliadači; zdieľate ich vy, keď chcete

**Povedať:** toto je snímka, ktorá zníži strach „na to nemám dáta". Zdôrazniť
„stačí odhad" a „nikto vám dáta neberie". SHMÚ-čkarom bude záležať na zdrojoch —
pomenovať ich presne.

### S7 — Prípadová štúdia: [názov areálu]

- [Základná škola X, obec Y] — [subregión]
- Čo vieme: [rozloha, počet budov, rok výstavby, vykurovanie]
- Čo teraz uvidíte: načítanie dát → vyplnené kroky → výsledok → porovnanie s [areál 2]

**Povedať:** „Zoberieme areál, aký má každý z vás." Jedna veta, prečo práve
tento (blízkosť, typickosť, súhlas obce). Potom prepnúť na web.

**Vizuál:** fotka areálu + mapový výrez. **Toto je jediná snímka, ktorá sa mení
podľa subregiónu.**

> Živá ukážka — pozri kap. 4. Po nej sa vrátiť do PPTX na S8.

### S8 — Čo s výsledkom

- Skóre nie je známka — je to poradie, kde investícia pomôže najviac
- Odporúčané opatrenia s orientačnou cenou a návratnosťou
- Porovnanie areálov: podľa hrozby (prívalový dážď, sucho, teplo…) sa poradie mení
- Export XLSX / PDF / CSV — podklad k žiadosti, do zastupiteľstva, pre projektanta

**Povedať:** „Výstup nie je projekt. Je to argument, s ktorým idete za
projektantom alebo do zastupiteľstva." Ak ukážka bežala dlho, túto snímku
preskočiť — obsah odznel pri Výsledkoch.

### S9 — Kde VESMA dnes je (otvorene)

- Testovacia verzia — hodnotenie MZI podľa metodiky KLIMASKEN, energetika v spolupráci s expertmi
- Časť referenčných hodnôt (ceny, váhy) je návrh a čaká na potvrdenie expertov
- Pripravuje sa: prepojenie na systémy ŽSK (xMatik) a evidenciu majetku (URBIS), AI asistent
- Preto vás potrebujeme: reálne areály, reálne otázky

**Povedať:** Kľúčová snímka pre dôveru. „Radšej vám poviem, čo ešte nie je
hotové, než aby ste na to prišli sami." Zoznam otvorených hodnôt je verejný
(`docs/chybajuce-hodnoty.md`) — ak sa niekto opýta, dá sa naň odkázať.

### S10 — Vyskúšajte VESMU

- Adresa + QR kód: [URL]
- Príručka: [odkaz/QR]
- Spätná väzba: tlačidlo **Podnet** priamo v aplikácii (pri každom poli aj v hlavičke)
- Alebo e-mail: [kontakt]
- Čo prosíme: vyplňte **jeden svoj areál** do [termín] a povedzte nám, kde ste sa zasekli

**Povedať:** Konkrétna, malá prosba. Nie „používajte", ale „jeden areál do
konca mesiaca". Ponúknuť pomoc: „Ak chcete, prídeme a prvý areál vyplníme
s vami." (Len ak sa na to tím dohodne — pozri rozhodnutia.)

**Vizuál:** veľký QR kód, adresa čitateľne, screenshot tlačidla Podnet.

### S11 — Ďakujem / otázky

- Adresa + QR (znova)
- Kontakty tímu
- Zostáva na plátne počas otázok

### Záložné snímky (za S11, nepremietajú sa, ak netreba)

- **Z1 – Ukážka bez internetu:** 5–6 screenshotov ukážky v poradí (krok 1, krok 2, krok 3, výsledky, vysvetlenie bodov, porovnanie). Použije sa, ak zlyhá pripojenie.
- **Z2 – Zdroje dát a metodiky:** KLIMASKEN (CI2, LIFE DELIVER), Open-Meteo, PVGIS, SVP mapy povodňového ohrozenia, vyhláška 179/2015 Z. z. (energetika).
- **Z3 – Slovníček:** MZI, OZE, B&G opatrenia, HDV (hospodárenie s dažďovou vodou), koeficient MZI, tepelné čerpadlo, ETICS.
- **Z4 – Ako sa počíta skóre MZI:** tabuľka indikátorov B-GOV2 / B-GOV3 / B-AD10 + odtok (pre odborné publikum).
- **Z5 – Súkromie dát:** kde dáta sú (prehliadač), čo odchádza na server (len podnety a nezodpovedané otázky do Google Sheetu tímu), ako sa zdieľa relácia (súbor JSON / e-mail).

---

## 4. Živá ukážka — scenár na 8 minút

Zásada: **nič sa nevypĺňa naživo od nuly.** Ukazuje sa vopred pripravená
uložená relácia; naživo sa spraví len 2–3 akcie, ktoré sú spoľahlivé a
efektné (načítanie dát podľa adresy, prepnutie hrozby v porovnaní, export).

### Príprava (deň vopred, na notebooku rečníka)

1. Otvoriť aplikáciu na adrese, ktorá sa bude komunikovať publiku (nie inú).
2. Importovať pripravené relácie (JSON) cez **Relácie**: prípadový areál
   subregiónu + 1–2 ďalšie areály na porovnanie. Overiť, že sa otvoria bez
   dialógu o zmene pravidiel hodnotenia (ak vyskočí, potvrdiť prepočet a
   reláciu znova uložiť).
3. Priblíženie prehliadača 125–150 %, zavrieť ostatné karty, vypnúť
   notifikácie, skryť lištu záložiek.
4. Overiť, že ide načítanie zrážok/slnka (Krok 1) a export PDF/XLSX — obe
   idú cez server, závisia od siete.
5. Mať otvorené záložné snímky Z1 v PPTX.
6. Na mobile mať tú istú adresu — ak niekto chce vidieť mobilnú verziu.

### Priebeh

| Čas | Kde | Čo ukázať | Čo povedať |
|---|---|---|---|
| 0:00 – 0:30 | Hlavička, Relácie | Otvoriť aplikáciu, kliknúť **Relácie**, otvoriť pripravený areál | „Toto je adresa, ktorú dostanete. Ja mám areál už vyplnený, prejdeme ním." |
| 0:30 – 2:00 | Krok 1 Úvod | Názov, adresa; **naživo** kliknúť načítanie zrážok a slnečného svitu; ukázať box „Presné hodnoty vs. odhady" a „Odporúčaný postup" | „Toto si aplikácia stiahne sama — zrážky z Open-Meteo, slnko z PVGIS. Vy zadáte adresu." + „Stačí odhad." |
| 2:00 – 3:30 | Krok 2 Pozemky | Plochy podľa priepustnosti, stromy, prvky HDV; ukázať tooltip pri jednom poli a tlačidlo **Podnet** pri poli | „Toto je najviac práce — ale je to väčšinou z katastra a z jedného obhliadnutia dvora." + „Ak niečo nedáva zmysel, tu nám to napíšete — priamo pri poli." |
| 3:30 – 4:30 | Krok 3 Budovy | Jedna budova: strecha, vykurovanie, spotreba; spomenúť import energetického certifikátu z PDF (ukázať tlačidlo, nespúšťať) | „Kto má energetický certifikát, nahrá PDF a polovica polí sa vyplní." |
| 4:30 – 5:00 | Kroky 4 a 5 | Len preletieť: altánok/prístrešok; zamýšľané opatrenia | „Iné stavby sú drobné stavby bez základov. Piaty krok — čo už plánujete, aby to vedel zohľadniť." |
| 5:00 – 7:00 | Krok 6 Výsledky | Tri skóre + vážené; **rozkliknúť vysvetlenie bodov** („prečo toľko"); odporúčané opatrenia s cenou/návratnosťou; **naživo** export XLSX alebo PDF | „Skóre vám nepovie len číslo, ale prečo. Tu vidíte, čo vám body dalo a čo zobralo." + „Toto si stiahnete a idete s tým za projektantom." |
| 7:00 – 8:00 | Porovnanie areálov | Vybrať 2–3 uložené areály; **naživo** prepnúť hrozbu (prívalový dážď → sucho → teplo) a ukázať, že sa poradie mení | „Toto je hlavná otázka starostu: ktorý areál prvý? A odpoveď závisí od toho, čoho sa bojíte viac." |

### Ak niečo zlyhá

- Nejde načítanie dát v Kroku 1 → „Hodnoty tu už mám z minula" a ísť ďalej. Nepokúšať sa znova.
- Nejde export → ukázať tlačidlá, povedať čo generujú, ísť ďalej.
- Nejde web vôbec → záložné snímky Z1, text zostáva rovnaký.
- Vyskočí dialóg o zmene pravidiel → potvrdiť, jedna veta: „Nástroj sa vyvíja, hodnotenie sa spresňuje, na to vás upozorní."

---

## 5. Otázky a odpovede — na čo sa pripraviť

| Otázka | Odpoveď (jadro) | Kto vie doplniť |
|---|---|---|
| Koľko to stojí? | Nič. Vzniklo v INOVII pre obce ŽSK. | — |
| Kde sú moje dáta? Kto ich vidí? | Vo vašom prehliadači. Na server odchádza len podnet, ktorý pošlete. Reláciu zdieľate súborom alebo e-mailom, keď chcete vy. | Z5 |
| Ako presné je skóre? Dá sa použiť do žiadosti o dotáciu? | Je to porovnávací nástroj, nie znalecký posudok. MZI je podľa metodiky KLIMASKEN, energetika podľa vyhlášky 179/2015. Do žiadosti ako podklad a argument áno, ako náhrada projektu nie. | Z2, Z4 |
| Nemám údaje o spotrebe / plochách. | Stačí odhad. Nástroj hodnotí len to, čo zadáte, a nepenalizuje nezodpovedané otázky. Čím viac doplníte, tým presnejšie. | S6 |
| Kto určil váhy a ceny opatrení? | Časť KLIMASKEN, časť expert MZI a energetický expert; časť je návrh a čaká na potvrdenie — zoznam je verejný. | S9 |
| Prečo sa mi zmenilo skóre po čase? | Pravidlá hodnotenia sa vyvíjajú; pri otvorení staršej relácie na to aplikácia upozorní a prepočíta. | `docs/verziovanie-pravidiel.md` |
| Funguje to na mobile? | Áno, v prehliadači. V teréne sa dajú nahrať fotky a poznámky. | — |
| Prepojí sa to s xMatik / URBIS / GIS mesta? | Pripravujeme, čakáme na špecifikáciu formátu. Dnes je export XLSX/CSV, ktorý sa dá importovať. | — |
| Čo keď mám 15 areálov? | Každý ako samostatná relácia, potom Porovnanie areálov. | ukážka |
| Môže to vyplniť aj externá firma / školník? | Áno, reláciu si posielate súborom. Odporúčaný postup: kancelária → terén → doplniť. | S6 |
| Bude aj pre firmy / bytové domy? | Dnes je cielené na areály obcí. Podnet radi zapíšeme. | — |
| Čo bude ďalej / kedy „ostrá" verzia? | Po tomto kole spätnej väzby a potvrdení hodnôt expertmi. [termín — rozhodnúť] | rozhodnutie |

Členka tímu má pri technických otázkach (ako sa presne počíta, zdroje dát)
právo povedať: „Toto vám odpovie kolega písomne — napíšte to ako podnet."
Nemá vymýšľať čísla.

---

## 6. Čo treba rozhodnúť (pred tvorbou PPTX)

Zoradené podľa toho, čo blokuje najviac.

### A. Prípadová štúdia (blokuje S7 a ukážku)

1. **Jeden areál pre všetkých 5 subregiónov, alebo jeden na subregión?**
   Návrh: jeden pre každý subregión (5 relácií JSON), lebo „blízky obecenstvu"
   je hlavná požiadavka. Náklad: každý treba vyplniť a overiť. Kompromis: 1
   dôkladne vyplnený „referenčný" areál (napr. ZŠ) + 1 lokálny na subregión
   len na porovnanie.
2. **Reálny areál so súhlasom obce, alebo typický fiktívny?** Reálny je
   presvedčivejší, ale treba súhlas starostu a možno mu vopred ukázať výsledok
   (nikto nechce byť verejne „najhorší"). Fiktívny (napr. „ZŠ Lipová, 1978,
   plochá strecha, plyn") je bezpečný, ale slabší.
3. **Kto areály vyplní a odkiaľ dáta** (kataster, certifikát, obhliadka)?
   Kto ich skontroluje, že skóre dáva zmysel?
4. **Druhý a tretí areál na porovnanie** — musia byť reálne odlišné (jeden
   „vodný" problém, jeden „energetický"), aby prepnutie hrozby zmenilo poradie.

### B. Ukážka a technika

5. **Adresa, ktorú komunikujeme:** `inovia.sk/vesma` (ak je proxy nasadená,
   pozri `docs/nasadenie-inovia-sk.md`) alebo priama Vercel adresa? Musí to
   byť jedna adresa na QR kóde, v Príručke aj v ukážke.
6. **Zmrazenie verzie počas turné:** nezlučovať do `main` nič medzi prvou a
   poslednou prezentáciou (alebo len opravy). Inak sa ukážka a Príručka
   rozídu s tým, čo ľudia otvoria.
7. **Hlavička „VESMA Test 199":** nechať (podporuje otvorenosť z S9) alebo
   prezentovať bez „Test"? Návrh: nechať.
8. **Internet na miestach konania** — overiť vopred; ak neistý, rečník má
   mobilný hotspot a záložné snímky Z1. Zvážiť aj 2-minútovú nahrávku
   obrazovky ako tretiu poistku.
9. **Kto klikne pri dvoch subregiónoch členky tímu:** ona sama (najlepšie, ale
   treba 2 nácviky), alebo kliká druhý člen tímu a ona hovorí.

### C. Spätná väzba a čo sľubujeme

10. **Kanál spätnej väzby:** tlačidlo Podnet ide do Google Sheetu tímu.
    Pridávame e-mail? Krátky formulár? Kto podnety spracúva a ako rýchlo
    odpovedá (aspoň „prijaté")?
11. **Konkrétna prosba a termín:** „vyplňte jeden areál do [dátum]". Bez
    termínu sa to nestane.
12. **Ponúkame asistované mapovanie** (INOVIA príde a vyplní prvý areál s
    obcou)? Silný ťah, ale kapacita.
13. **Čo bude po kole spätnej väzby** — termín ďalšej verzie, či bude druhé
    stretnutie. Publikum sa opýta.

### D. Obsah a partneri

14. **Čo hovoriť o otvorených hodnotách** (S9): koľko detailu. Návrh: jedna
    snímka otvorene, detail len na otázku. Ideálne pred prvou prezentáciou
    získať aspoň potvrdenie energetických váh (E2) a váh MZI (M1) — sú to
    hodnoty, ktoré menia poradie areálov, teda hlavný výstup ukážky.
15. **Koho menovať ako partnera / zdroj:** ŽSK, KLIMASKEN (CI2), SHMÚ (ak
    sedia v sále, zdroje dát treba mať presne), xMatik, URBIS. Treba súhlas
    s použitím loga?
16. **Príručka:** kde je zverejnená (PDF na inovia.sk? v aplikácii?), či sa
    tlačí na stretnutie, či má vlastný QR.
17. **Snímky INOVIA, ktoré dodáš:** ktoré a kam — na začiatok (kto je INOVIA)
    pred S2, alebo na koniec pred S10? Návrh: 1–2 snímky pred S2, nie viac,
    aby sa nestratil čas.
18. **Jazyk poznámok:** slovensky, plné vety, aby členka tímu vedela
    prezentáciu odviesť bez skúšky s autorom. (Predpokladám áno.)

### E. Logistika

19. Poradie v programe dňa — čo je pred nami a po nás (ovplyvňuje S1–S2).
20. Technika: projektor, HDMI, možnosť vlastného notebooku, prezentér.
21. Kto zapisuje otázky z publika (aj tie sú spätná väzba).

---

## 7. Ďalší krok

Po rozhodnutiach A a B sa dá pripraviť: 5 relácií JSON, screenshoty pre Z1,
QR kódy a PPTX v šablóne INOVIA s poznámkami pre rečníka.
