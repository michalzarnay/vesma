# VESMA — scenár prezentácie pre subregióny ŽSK

Scenár na 20 minút prezentácie + 10 minút otázok. Pripravený tak, aby ho
odviedol ktokoľvek z tímu — hlavný tvorca aj členka tímu, ktorá aplikáciu
testovala a dotvárala Príručku. Každá snímka má „čo povedať" (poznámky pre
rečníka), nie len odrážky. Text snímok v podobe, v akej ide do PPTX, je
v `docs/prezentacia-snimky.md`.

Stav aplikácie, z ktorého scenár vychádza (verzia 201, september 2026):

- **prihlásenie e-mailom** — aplikácia je za bránou, používateľ zadá e-mail
  a príde mu prihlasovací odkaz (`docs/prihlasenie-emailom.md`),
- **rozsah mapovania** — na kroku 1 sa vyberá Voda / Energia / Voda aj energia
  a časti mimo výberu sa skryjú (`docs/rozsah-mapovania.md`),
- 6 krokov dotazníka: Úvod, Pozemky, Budovy, Iné stavby, B&G opatrenia, Výsledky,
- skóre v troch oblastiach: modro-zelená infraštruktúra (metodika KLIMASKEN),
  obnoviteľné zdroje, energetická efektívnosť,
- porovnanie areálov, export XLSX/PDF/CSV, relácie s uložením a zdieľaním,
- tlačidlo **Podnet** pri každom poli, odkaz na **Príručku** v hlavičke,
- **dve nasadenia**: stabilné na verejnej adrese, testovacie pre tím
  (`docs/verziovanie.md`).

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
   inštalovať, dáta ostávajú u nich. **A že sa dá zúžiť na vodu**, ak ich
   energetika nezaujíma.
3. **Že ich spätná väzba mení nástroj** — tlačidlo Podnet, Príručka, e-mail,
   ktorým sa vieme spýtať na detail.

### Čo naopak nehovoriť

- Nepredávať to ako hotový certifikovaný nástroj. Časť hodnôt čaká na
  potvrdenie expertmi (`docs/chybajuce-hodnoty.md`). Otvorenosť tu buduje
  dôveru, prikrášľovanie ju zničí pri prvej otázke.
- Nesľubovať prepojenie na xMatik/URBIS ako hotové — v aplikácii je zatiaľ
  len tlačidlo s upozornením.
- Nesľubovať AI asistenta.
- Nezľahčovať prihlásenie („to je len formalita"). Je to vedomé rozhodnutie
  a má svoj dôvod — povedz ho rovno, pozri S6.

---

## 2. Časový plán (20 minút)

| Čas | Blok | Snímky |
|---|---|---|
| 0:00 – 1:30 | Otvorenie: kto sme, prečo tu sme, čo si odnesiete | INOVIA úvodné + S1, S2 |
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
PPTX pre rečníka. „Vizuál" = návrh obrázka. Finálne znenie textov je
v `docs/prezentacia-snimky.md` — tam sa upravuje, keď sa mení PPTX.

### S1 — Titulná (šablóna INOVIA)

- VESMA — Voda a energia: sprievodca mapovaním areálov
- INOVIA · [subregión] · [dátum]
- Meno rečníka, rola
- Tvorcovia: Žilinský samosprávny kraj · Žilinská univerzita · INOVIA

**Povedať:** jedna veta o sebe a o tom, že VESMA vznikla v spolupráci ŽSK,
UNIZA a INOVIE pre obce kraja. Bez dlhého úvodu — publikum čakalo na iné
body programu.

### S2 — Čo si dnes odnesiete

- Nástroj, ktorý vám za 1–2 hodiny povie, kde v areáli obce začať s vodou
- Ukážka na konkrétnom areáli, aký má každá obec
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

**Vizuál:** fotka typického areálu obce (škola s asfaltovým dvorom).

### S4 — Dnes to obce riešia takto

- Údaje sú roztrúsené: kataster, faktúry, energetické certifikáty, hlavy ľudí
- Rozhodnutie „čo prvé" padá podľa toho, čo je akútne alebo na čo je výzva
- Odborná štúdia na jeden areál = čas a peniaze

**Povedať:** pomenovať bolesť bez kritiky. „Nie je to zlé rozhodovanie — nie je
z čoho rozhodovať." Most k VESME: údaje **zbiera na jedno miesto** a dáva z nich
**porovnateľné číslo**.

### S5 — Čo je VESMA

- Webová aplikácia, zadarmo, bez inštalácie, v prehliadači
- Vyberiete si rozsah: **Voda**, **Energia**, alebo oboje
- Sprievodca 6 krokmi: Úvod → Pozemky → Budovy → Iné stavby → B&G opatrenia → Výsledky
- Výstup: skóre + odporúčané opatrenia + poradie areálov

**Povedať:** tri oblasti hodnotenia jednou vetou každú: MZI = „ako areál
zadržiava vodu a chladí sa zeleňou", OZE = „koľko energie si vie areál vyrobiť
sám", energetická efektívnosť = „koľko energie zbytočne míňa". **Dôležité:**
„Viacerí ste nám povedali, že energetika vás až tak nezaujíma — kalkulačiek
a povinností je dosť. Preto si na začiatku vyberiete Voda a dotazník aj
hodnotenie sa zúžia len na ňu." Skratku B&G (blue-green, modro-zelené)
povedať nahlas.

**Vizuál:** schéma 6 krokov s ikonami + screenshot výberu „Čo chcete mapovať".

### S6 — Ako to funguje v praxi

- Prihlásenie e-mailom — príde odkaz, bez hesla, platí rok
- Presné hodnoty tam, kde ich máte; odhad tam, kde nie — oboje má zmysel
- Časť údajov si stiahne sama: zrážky (Open-Meteo), slnečný svit (PVGIS), povodňové zóny (SVP)
- Energetický certifikát nahráte ako PDF, hodnoty sa predvyplnia
- Postup: z kancelárie → uložiť → do terénu s mobilom → doplniť
- Dáta o areáli ostávajú vo vašom prehliadači

**Povedať:** dve veci, ktoré publikum potrebuje počuť rovno:
1. „Stačí odhad." Zníži to strach „na to nemám dáta".
2. Prihlásenie otvorene: „Pýtame si e-mail, lebo je to verzia na overenie
   v praxi a potrebujeme vedieť, kto ju používa — a vedieť sa spýtať na detail,
   keď nám pošlete podnet. Heslo si nevymýšľate, príde vám odkaz."
Zdroje dát pomenovať presne — v sále môžu sedieť ľudia zo SHMÚ.

### S7 — Prípadová štúdia: Obecný úrad s kultúrnym domom

- Ukážková obec — areál, aký má takmer každá obec
- Budova z roku 1975, plochá strecha, plynový kotol
- Asfaltové parkovisko, všetka voda do kanalizácie
- Porovnáme ho so školou a zdravotným strediskom

**Povedať:** „Zoberieme areál, aký má každý z vás. Je vymyslený — aby sa nikto
nespoznal — ale čísla sú typické." Potom prepnúť na web.

**Vizuál:** ilustračná fotka + jednoduchý pôdorys. Podľa subregiónu sa mení
len adresa v aplikácii, nie snímka.

> Živá ukážka — pozri kap. 4. Po nej sa vrátiť do PPTX na S8.

### S8 — Čo s výsledkom

- Skóre nie je známka — je to poradie, kde investícia pomôže najviac
- Odporúčané opatrenia s orientačnou cenou a návratnosťou
- Porovnanie areálov: podľa hrozby (sucho, horúčavy, voda, energia) sa poradie mení
- Export XLSX / PDF / CSV — podklad k žiadosti, do zastupiteľstva, pre projektanta

**Povedať:** „Výstup nie je projekt. Je to argument, s ktorým idete za
projektantom alebo do zastupiteľstva." Ak ukážka bežala dlho, túto snímku
preskočiť.

### S9 — Kde VESMA dnes je (otvorene)

- Verzia na overenie v praxi — používajte ju na ostro, ale hovorte nám, čo nesedí
- Hodnotenie vody vychádza z metodiky KLIMASKEN, energetika z vyhlášky 179/2015
- Časť referenčných hodnôt (ceny, váhy) je návrh a čaká na potvrdenie expertov
- Pripravuje sa: prepojenie na systémy ŽSK (xMatik) a evidenciu majetku (URBIS)

**Povedať:** kľúčová snímka pre dôveru. „Radšej vám poviem, čo ešte nie je
hotové, než aby ste na to prišli sami." Zoznam otvorených hodnôt je
v repozitári, na požiadanie ho pošleme.

### S10 — Vyskúšajte VESMU

- Adresa + QR kód: **[verejná adresa — potvrdiť, pozri kap. 6 bod 2]**
- Príručka: odkaz priamo v hlavičke aplikácie
- Spätná väzba: tlačidlo **Podnet** pri každom poli
- Čo prosíme: vyplňte **jeden svoj areál** do [termín] a povedzte nám, kde ste sa zasekli

**Povedať:** konkrétna, malá prosba. Nie „používajte", ale „jeden areál do
[termín]". Zásada tímu: všetko sa má dať zvládnuť s nástrojom a Príručkou —
„ak sa zaseknete, nie je to vaša chyba, je to náš podnet. Napíšte nám ho
tlačidlom Podnet a my nástroj upravíme." Bez ponuky, že prídeme vyplniť
areál za nich.

**Vizuál:** veľký QR kód, adresa čitateľne, screenshot tlačidla Podnet.

### S11 — Ďakujem / otázky

- Adresa + QR (znova)
- Kontakty tímu
- Zostáva na plátne počas otázok

### Záložné snímky (za S11, nepremietajú sa, ak netreba)

- **Z1 – Ukážka bez internetu:** 7 screenshotov ukážky v poradí (prihlásenie,
  krok 1 s výberom rozsahu, krok 2, krok 3, výsledky, vysvetlenie bodov,
  porovnanie). Použije sa, ak zlyhá pripojenie.
- **Z2 – Zdroje dát a metodiky:** Open-Meteo (zrážky), PVGIS (slnečný svit),
  SVP mapy povodňového ohrozenia, vyhláška 179/2015 Z. z. (energetika),
  KLIMASKEN (CI2, LIFE DELIVER) — metodika hodnotenia vody. Tvorcovia
  nástroja: ŽSK, UNIZA, INOVIA.
- **Z3 – Slovníček:** MZI, OZE, B&G opatrenia, HDV (hospodárenie s dažďovou
  vodou), koeficient MZI, tepelné čerpadlo, ETICS.
- **Z4 – Ako sa počíta skóre vody:** indikátory B-GOV2 / B-GOV3 / B-AD10
  + odtok zo spevnených plôch (pre odborné publikum).
- **Z5 – Dáta a súkromie:** údaje o areáli sú v prehliadači; na server ide
  e-mail pri prihlásení, podnety a nezodpovedané otázky chatbota; relácia sa
  zdieľa súborom, keď chce používateľ.

---

## 4. Živá ukážka — scenár na 8 minút

Zásada: **nič sa nevypĺňa naživo od nuly.** Ukazuje sa vopred pripravená
uložená relácia; naživo sa spraví len niekoľko akcií, ktoré sú spoľahlivé a
efektné (výber rozsahu, načítanie dát podľa adresy, export, porovnanie).

### Príprava (deň vopred, na notebooku rečníka)

1. Otvoriť aplikáciu na adrese, ktorá sa bude komunikovať publiku (nie inú),
   a **prihlásiť sa** — brána sa má odbaviť pred prezentáciou, nie počas nej.
   Relácia platí rok, ale platí len v tom prehliadači a profile.
2. Importovať pripravené relácie (JSON) cez **Relácie**: tri areály
   z `docs/prezentacia-pripadova-studia.md` (A úrad, B škola, C zdravotné
   stredisko), v A prepísať adresu na miesto konania.
3. Overiť, že sa relácie otvoria bez dialógu o zmene pravidiel hodnotenia
   (ak vyskočí, potvrdiť prepočet a reláciu znova uložiť).
4. Priblíženie prehliadača 125–150 %, zavrieť ostatné karty, vypnúť
   notifikácie, skryť lištu záložiek.
5. Overiť, že ide načítanie zrážok/slnka (krok 1) a export PDF/XLSX — obe
   idú cez server.
6. Mať otvorené záložné snímky Z1 v PPTX.
7. Ak sa má ukazovať prihlásenie naživo (odporúčané, pozri nižšie), mať
   pripravený **druhý prehliadač alebo anonymné okno** a prístup k schránke
   na e-mail, ktorý sa premietne. Použiť tímovú adresu, nie súkromnú.

### Priebeh

| Čas | Kde | Čo ukázať | Čo povedať |
|---|---|---|---|
| 0:00 – 0:45 | Brána | V anonymnom okne ukázať prihlasovaciu obrazovku, zadať e-mail, ukázať prijatý odkaz (nemusí sa čakať — v hlavnom okne je už prihlásené) | „Toto uvidíte ako prvé. Zadáte e-mail, príde odkaz, kliknete. Žiadne heslo. Prihlásenie platí rok." |
| 0:45 – 1:15 | Hlavička, Relácie | Prepnúť do hlavného okna; ukázať odkaz **Príručka** a tlačidlo **Relácie**, otvoriť pripravený areál | „Príručka je stále po ruke. Ja mám areál už vyplnený, prejdeme ním." |
| 1:15 – 2:45 | Krok 1 Úvod | **Naživo** prepnúť „Čo chcete mapovať" na *Voda* a ukázať, že sa dotazník zúži; vrátiť na *Voda aj energia*. Potom kliknúť načítanie zrážok a slnečného svitu | „Ak vás energetika nezaujíma, vyberiete Voda — a už sa vás na kotly nikto nepýta." + „Zrážky a slnko si aplikácia stiahne sama podľa adresy." |
| 2:45 – 4:00 | Krok 2 Pozemky | Plochy podľa priepustnosti, stromy, prvky HDV; tooltip pri jednom poli a tlačidlo **Podnet** | „Toto je najviac práce — ale väčšinou z katastra a z jedného obhliadnutia dvora." + „Ak niečo nedáva zmysel, tu nám to napíšete. Podnet nesie váš e-mail, takže sa vieme spýtať na detail." |
| 4:00 – 5:00 | Krok 3 Budovy | Jedna budova: strecha, vykurovanie, spotreba; ukázať tlačidlo importu energetického certifikátu z PDF (nespúšťať) | „Kto má energetický certifikát, nahrá PDF a polovica polí sa vyplní." |
| 5:00 – 5:30 | Kroky 4 a 5 | Len preletieť: altánok/prístrešok; zamýšľané opatrenia | „Iné stavby sú drobné stavby bez základov. Piaty krok — čo už plánujete, aby to vedel zohľadniť." |
| 5:30 – 7:00 | Krok 6 Výsledky | Skóre + vážené; **rozkliknúť vysvetlenie bodov** („prečo toľko"); odporúčané opatrenia s cenou a návratnosťou; **naživo** export XLSX alebo PDF | „Skóre vám nepovie len číslo, ale prečo. Tu vidíte, čo vám body dalo a čo zobralo." + „Toto si stiahnete a idete s tým za projektantom." |
| 7:00 – 8:00 | Porovnanie areálov | Vybrať 3 uložené areály (A, B, C); ukázať poradie v stĺpcoch Sucho / Horúčavy / Voda / Energia — škola je prvá pri vode, zdravotné stredisko pri energii | „Toto je hlavná otázka starostu: ktorý areál prvý? Odpoveď závisí od toho, čoho sa bojíte viac — pri záplavách škola, pri účtoch stredisko." |

**Poznámka k stĺpcom v porovnaní:** ukazujú sa podľa rozsahu **aktuálne
otvoreného** areálu. Aby boli vidieť všetky štyri, musí byť otvorený areál
s rozsahom „Voda aj energia" — preto majú všetky tri ukážkové areály *oboje*.

### Ak niečo zlyhá

- Nejde prihlásenie v anonymnom okne → nečakať na e-mail, prepnúť do hlavného
  okna: „takto to vyzerá po prihlásení". Ukážku prihlásenia radšej skrátiť
  než naťahovať.
- Nejde načítanie dát v kroku 1 → „hodnoty tu už mám z minula" a ísť ďalej.
- Nejde export → ukázať tlačidlá, povedať, čo generujú, ísť ďalej.
- Nejde web vôbec → záložné snímky Z1, text zostáva rovnaký.
- Vyskočí dialóg o zmene pravidiel → potvrdiť, jedna veta: „Nástroj sa vyvíja,
  hodnotenie sa spresňuje, na to vás upozorní."

---

## 5. Otázky a odpovede — na čo sa pripraviť

| Otázka | Odpoveď (jadro) | Kde je detail |
|---|---|---|
| Koľko to stojí? | Nič. Vzniklo v spolupráci ŽSK, UNIZA a INOVIA pre obce kraja. | — |
| **Prečo musím zadávať e-mail?** | Je to verzia na overenie v praxi. Potrebujeme vedieť, kto ju používa, a vedieť sa spýtať na detail k podnetu. Heslo nie je, príde odkaz, platí rok. | S6 |
| **Čo s mojím e-mailom spravíte?** | Zapíše sa do nášho zoznamu registrácií a pripojí sa k podnetom, ktoré pošlete. Nikam inam nejde a na marketing sa nepoužíva. | Z5 |
| Kde sú moje dáta o areáli? Kto ich vidí? | Vo vašom prehliadači. Na server ide e-mail pri prihlásení a podnety. Reláciu zdieľate súborom, keď chcete vy. | Z5 |
| **Nezaujíma ma energetika, mám na to iné nástroje.** | Vyberte si na začiatku *Voda*. Dotazník aj hodnotenie sa zúžia a na kotly sa vás nikto nespýta. | S5, ukážka |
| Ako presné je skóre? Dá sa použiť do žiadosti o dotáciu? | Je to porovnávací nástroj, nie znalecký posudok. Voda podľa metodiky KLIMASKEN, energetika podľa vyhlášky 179/2015. Do žiadosti ako podklad áno, ako náhrada projektu nie. | Z2, Z4 |
| Nemám údaje o spotrebe / plochách. | Stačí odhad. Nástroj hodnotí len to, čo zadáte, a nepenalizuje nezodpovedané otázky. | S6 |
| Kto určil váhy a ceny opatrení? | Tím ŽSK, UNIZA a INOVIA s expertmi na vodu a energetiku; hodnotenie vody vychádza z metodiky KLIMASKEN. Časť hodnôt je návrh a čaká na potvrdenie. | S9 |
| Prečo sa mi zmenilo skóre po čase? | Pravidlá hodnotenia sa vyvíjajú; pri otvorení staršej relácie na to aplikácia upozorní a prepočíta. | `docs/verziovanie-pravidiel.md` |
| Funguje to na mobile? | Áno, v prehliadači. V teréne sa dajú nahrať fotky a poznámky. Prihlasovací odkaz otvorte v tom prehliadači, v ktorom budete mapovať. | `docs/prihlasenie-emailom.md` |
| Prepojí sa to s xMatik / URBIS / GIS mesta? | Pripravujeme, čakáme na špecifikáciu formátu. Dnes je export XLSX/CSV. | — |
| Čo keď mám 15 areálov? | Každý ako samostatná relácia, potom Porovnanie areálov. | ukážka |
| Môže to vyplniť aj externá firma / školník? | Áno, reláciu si posielate súborom. Postup: kancelária → terén → doplniť. | S6 |
| Bude aj pre firmy / bytové domy? | Dnes je cielené na areály obcí, ale kategórie objektov tam sú. Podnet radi zapíšeme. | — |
| Čo bude ďalej? | Podnety spracúvame priebežne, opravy prídu na tú istú adresu. [termín ďalšieho kola — rozhodnúť] | kap. 6 |
| Dostanem odpoveď na podnet? | Každý podnet čítame a zapisujeme ako úlohu. Podnet nesie váš e-mail, takže sa vieme ozvať. | kap. 6 |

Členka tímu má pri technických otázkach (ako sa presne počíta, zdroje dát)
právo povedať: „Toto vám odpovie kolega písomne — napíšte to ako podnet."
Nemá vymýšľať čísla.

---

## 6. Rozhodnutia

Stav k 14. 9. 2026. Vyriešené položky sú tu preto, aby členka tímu videla,
z čoho scenár vychádza; otvorené sú označené **OTVORENÉ**.

### Prípadová štúdia

1. **Fiktívny, typický areál.** Tri areály (obecný úrad s kultúrnym domom,
   základná škola s materskou školou, zdravotné stredisko) sú v
   `docs/prezentacia-pripadova-studia.md`. Vypĺňa hlavný tvorca. Adresa sa
   mení podľa subregiónu, areál nie.

### Adresa, verzie, prihlásenie

2. **Verejná adresa — OTVORENÉ, drobnosť.** Dokumentácia si protirečí:
   `docs/nasadenie-inovia-sk.md` a `docs/verziovanie.md` hovoria
   `inovia.sk/vesma`, `docs/prihlasenie-emailom.md` (`APP_URL`) hovorí
   `vesma.inovia.sk/vesma`. Na QR kóde, v Príručke aj v ukážke musí byť
   **jedna** adresa a musí sedieť s `APP_URL`, inak prihlasovací odkaz
   vedie inam, než kam ide publikum. Potvrdiť, ktorá platí.
3. **Stabilné a testovacie nasadenie — hotové** (#236). Verejná adresa beží
   z vetvy `stabilna`, testovacia dostáva každé zlúčenie do `main`. Hlavička
   ukazuje „VESMA 201" na stabilnom a „VESMA Test 201" na testovacom.
   Vydanie = zlúčenie `main` do `stabilna`, ľudské rozhodnutie.
4. **Zmrazenie počas turné.** Medzi prvou a poslednou prezentáciou nevydávať
   do stabilného kanála nič okrem opráv. Testovací kanál beží ďalej.
5. **Prihlásenie e-mailom — hotové** (#238). Pred prvou prezentáciou treba
   ešte **nastaviť Resend a premenné na Verceli** (`RESEND_API_KEY`,
   `EMAIL_ODOSIELATEL`, `OVERENIE_SECRET`, `APP_URL`) a doplniť hárky vo
   VESMA moste. Kým to nie je, brána sa neukáže a podnet pýta e-mail ako
   neoverený. Postup je v `docs/prihlasenie-emailom.md`. **OTVORENÉ — kto
   a kedy to nastaví.**
6. **Rozsah mapovania — hotové** (#238). Do prezentácie zaradené ako
   odpoveď na „energetika nás nezaujíma".

### Ukážka

7. **Kto ovláda notebook** pri dvoch prezentáciách členky tímu: kliká a hovorí
   sama (2 nácviky), alebo hovorí ona a kliká druhý člen tímu. **OTVORENÉ.**
8. **Internet:** Wi-Fi na mieste, mobilný hotspot ako záloha, screenshoty Z1
   v PPTX.
9. **Prihlásenie v ukážke:** ukazuje sa naživo v anonymnom okne, na tímovú
   adresu. Rečník je v hlavnom okne prihlásený vopred.

### Spätná väzba

10. **Kanál:** tlačidlo Podnet → Google Sheet (VESMA most) → spracovanie do
    GitHub issues. Podnet nesie overený e-mail (#238), takže sa vieme ozvať.
11. **Bez asistovaného mapovania.** Všetko sa má dať zvládnuť s nástrojom
    a Príručkou. Kto sa zasekne, je to podnet na úpravu nástroja.
12. **Termín prosby „jeden areál do…":** **OTVORENÉ.** Návrh: 4 týždne po
    poslednom subregióne.

### Obsah a partneri

13. **Príručka — OTVORENÉ.** Odkaz v hlavičke je hotový (#238), zapne sa
    premennou `VITE_PRIRUCKA_URL`. Treba **online adresu** finálnej Príručky
    (`VESMA_prirucka_v1.2_CITACIE_UPRAVA_FINAL.docx` v SharePointe → PDF
    niekde na `inovia.sk`) a doplniť do nej dva nové odseky: prihlásenie
    a výber rozsahu (návrhy textov sú v `docs/prihlasenie-emailom.md`
    a `docs/rozsah-mapovania.md`).
14. **Otvorené hodnoty (S9):** ak sa nestihne potvrdenie expertmi, použijú sa
    navrhnuté hodnoty a S9 to povie otvorene.
15. **Tvorcovia:** ŽSK, UNIZA, INOVIA. KLIMASKEN len pri zmienke o metodike,
    bez loga.
16. **Firemné snímky INOVIA na úvod a záver — OTVORENÉ**, ktoré presne.
    Pozri kap. 7.
17. **Poznámky pre rečníka:** slovensky, plné vety.

### Logistika — OTVORENÉ

18. Poradie v programe dňa.
19. Technika: projektor, HDMI, vlastný notebook, prezentér.
20. Kto zapisuje otázky z publika — aj tie sú podnety.

---

## 7. Ako sa dostaneme k PPTX s čo najmenej ručnej práce

Cieľ: súbor `.pptx`, ktorý sa dá ďalej normálne upravovať v PowerPointe,
postavený na šablóne INOVIA, s firemnými snímkami na úvode a závere.

### Nájdená šablóna

`INOVIA_Samosprávy_šablóna_PP_prezentácia.pptx` — SharePoint, Marketing →
`01 INOVIA brand / 2 – Corporate_Identity / Šablony_prezentácie /
FINAL_PP_prezentácie_šablóny/`. Je to správna vetva šablóny pre toto publikum.

### Prečo to nejde spraviť úplne bez teba

Konektory na SharePoint vracajú text dokumentov, nie samotný súbor. Aby nové
snímky **dedili** rozloženia, fonty a farby šablóny (a nie boli len
„vizuálne podobné"), potrebujem šablónu ako súbor.

### Postup

Skript `scripts/prezentacia-pptx.py` je hotový a otestovaný. Vkladá snímky
**do súboru šablóny**, takže dedia jej rozloženia, fonty, farby aj pozadia,
a firemné snímky, ktoré v súbore už sú, ostávajú nedotknuté.

1. **Ty (2 minúty):** priložíš do tejto relácie jeden súbor `.pptx` — šablónu
   INOVIA, ideálne rovno s firemnými snímkami na začiatku a na konci
   (stačí ich tam nakopírovať a povedať, koľko ich je na úvode). Ak sú
   firemné snímky v inom súbore, priložíš oba.
2. **Ja:** spustím skript a pošlem hotový `.pptx`:

   ```bash
   pip install python-pptx
   # najprv sa pozrieť, aké rozloženia a snímky šablóna má
   python3 scripts/prezentacia-pptx.py --sablona SABLONA.pptx --iba-zoznam
   # potom zložiť prezentáciu
   python3 scripts/prezentacia-pptx.py --sablona SABLONA.pptx \
       --vystup VESMA_prezentacia.pptx --vlozit-po 2 --zmazat 3,4,5
   ```

   `--zmazat` odstráni ukážkové snímky šablóny („NADPIS / Text Text"),
   `--vlozit-po` povie, za ktorú snímku sa vložia naše. Skript vypíše, ktoré
   rozloženie na aký typ snímky použil; keď sa netrafí, priradenie sa dá zadať
   ručne cez `--rozlozenia '{"obsah_obrazok":8}'`.
3. **Ty (ručne, ~15 minút):** doplníš fotky a QR kód do pripravených miest
   a prípadne prehodíš poradie. Text meniť netreba — mení sa v
   `docs/prezentacia-snimky.md` a prezentácia sa zloží nanovo.

### Čo skript spraví sám

- 16 snímok (11 prezentačných + 5 záložných) s finálnymi textami,
- poznámky pre rečníka v poznámkach snímky, plnými vetami po slovensky,
- na snímkach s obrázkom nechá prázdny obrázkový placeholder šablóny a popis
  toho, čo tam patrí, dá do poznámok; ak rozloženie taký placeholder nemá,
  vloží rámček s popisom priamo na snímku.

### Čo urýchli druhý krok

- Ak povieš, ktoré rozloženia šablóny sa majú použiť na titulnú, obsahovú,
  obrázkovú a záverečnú snímku, použijem ich; inak ich vyberiem podľa názvov
  a napíšem, čo som vybral.
- QR kód vygenerujem a vložím, len čo bude potvrdená verejná adresa
  (kap. 6 bod 2).
- Screenshoty z ukážky vznikajú tak či tak pre záložné snímky Z1 — keď mi ich
  dáš, vložím ich rovno na miesto.

## 8. Ďalší krok

1. Potvrdiť verejnú adresu (kap. 6 bod 2) a nastaviť Resend s premennými na
   Verceli (bod 5) — bez toho prihlásenie na prezentácii nefunguje.
2. Hlavný tvorca vyplní tri areály podľa
   `docs/prezentacia-pripadova-studia.md`, uloží relácie ako JSON a spraví
   screenshoty pre Z1.
3. Priložiť šablónu INOVIA a firemné snímky → vznikne PPTX (kap. 7).
4. Doplniť online adresu Príručky a rozhodnúť termín prosby (body 12 a 13).
