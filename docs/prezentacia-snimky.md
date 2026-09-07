# VESMA — texty snímok pre PPTX

Zdroj textov pre generovanie prezentácie. **Toto je súbor, ktorý sa upravuje,
keď sa mení obsah snímok** — PPTX sa z neho zloží nanovo (postup v
`docs/prezentacia-scenar.md`, kap. 7). Scenár, časovanie a ukážka sú tam,
tu je len to, čo je na snímkach a v poznámkach rečníka.

Formát: každá snímka je blok medzi riadkami `---`. Kľúče `id`, `rozlozenie`,
`nadpis`, `podnadpis`, `odrazky` (riadky začínajúce `- `), `vizual`,
`qr` (adresa, z ktorej sa vygeneruje QR kód), `poznamky`. Prázdny kľúč sa vynechá. Text v `poznamky` ide do poznámok
snímky, `vizual` sa vloží ako prázdny rámček s popisom.

Rozloženia: `titulna`, `obsah` (nadpis + odrážky), `obsah_obrazok`
(nadpis + odrážky + miesto na obrázok), `zaver`.

Hranaté zátvorky = doplniť pred prezentáciou.

---
id: S1
rozlozenie: titulna
nadpis: VESMA
podnadpis: Voda a energia
odrazky:
- Sprievodca mapovaním areálov
- "[Meno rečníka], [rola]"
- "[subregión] · [dátum]"
- ŽSK · UNIZA · INOVIA
poznamky: Jedna veta o sebe a o tom, že VESMA vznikla v spolupráci ŽSK, UNIZA a INOVIE pre obce kraja. Bez dlhého úvodu — publikum čakalo na iné body programu. Cieľ prvej minúty je, aby ľudia vedeli, že toto je o ich škole a ich úrade, nie o klíme vo všeobecnosti.
---
id: S2
rozlozenie: obsah
nadpis: Čo si dnes odnesiete
odrazky:
- Nástroj, ktorý vám za 1–2 hodiny povie, kde v areáli obce začať s vodou
- Ukážku na areáli, aký má takmer každá obec
- Odkaz, príručku a spôsob, ako nám povedať, čo zlepšiť
poznamky: "Nebudem vás presviedčať, že klíma je problém. Ukážem vám nástroj, ktorý vám pomôže rozhodnúť, do ktorého areálu dať peniaze ako prvé — a poprosím vás, aby ste ho vyskúšali." Toto je jediný cieľ dnešných dvadsiatich minút.
---
id: S3
rozlozenie: obsah_obrazok
nadpis: Areály, ktoré má každá obec
odrazky:
- Škola, škôlka, úrad, kultúrny dom, stredisko
- Každý má strechu, dvor, parkovisko, kotolňu
- Voda: prívalový dážď, sucho, odtok do kanalizácie
- Energia: účty za teplo a elektrinu
- Peniaze: výzvy chcú dáta a poradie priorít
vizual: Fotka typického areálu obce — škola s asfaltovým dvorom, alebo úrad s parkoviskom.
poznamky: Hovoriť rečou starostu — účet za plyn, zatopený dvor školy po búrke, rozpálené parkovisko pred úradom. "Väčšina z vás má tri až pätnásť takýchto areálov a nikto nemá na jednom mieste prehľad, ktorý je na tom najhoršie."
---
id: S4
rozlozenie: obsah
nadpis: Dnes sa to rozhoduje takto
odrazky:
- Údaje sú roztrúsené: kataster, faktúry, energetické certifikáty, hlavy ľudí
- Čo prvé sa rozhodne podľa toho, čo je akútne alebo na čo je výzva
- Odborná štúdia na jeden areál stojí čas a peniaze
poznamky: Pomenovať bolesť bez kritiky. "Nie je to zlé rozhodovanie — nie je z čoho rozhodovať." Toto je most k VESME - ona údaje zbiera na jedno miesto a dáva z nich porovnateľné číslo.
---
id: S5
rozlozenie: obsah_obrazok
nadpis: Čo je VESMA
odrazky:
- Webová aplikácia, zadarmo, bez inštalácie
- Vyberiete si rozsah - Voda, Energia, oboje
- Šesť krokov - od pozemkov po výsledky
- Výstup - skóre, opatrenia, poradie areálov
vizual: Schéma šiestich krokov s ikonami plus screenshot výberu "Čo chcete mapovať" z kroku 1.
poznamky: Tri oblasti hodnotenia jednou vetou každú. Modro-zelená infraštruktúra je to, ako areál zadržiava vodu a chladí sa zeleňou. Obnoviteľné zdroje sú to, koľko energie si vie areál vyrobiť sám. Energetická efektívnosť je to, koľko energie zbytočne míňa. Dôležité povedať nahlas - "Viacerí ste nám povedali, že energetika vás až tak nezaujíma, kalkulačiek a povinností je dosť. Preto si na začiatku vyberiete Voda a dotazník aj hodnotenie sa zúžia len na ňu." Skratku B&G rozviesť ako blue-green, teda modro-zelené.
---
id: S6
rozlozenie: obsah
nadpis: Ako to funguje v praxi
odrazky:
- Prihlásite sa e-mailom - príde odkaz, heslo nie je, platí rok
- Presné hodnoty tam, kde ich máte; odhad tam, kde nie
- Zrážky, slnečný svit a povodňové zóny si aplikácia stiahne sama
- Energetický certifikát nahráte ako PDF a hodnoty sa predvyplnia
- Postup - z kancelárie, uložiť, do terénu s mobilom, doplniť
- Údaje o areáli ostávajú vo vašom prehliadači
poznamky: Dve veci treba povedať rovno. Prvá - "Stačí odhad." To zníži strach, že na to nemám dáta. Druhá je prihlásenie, otvorene - "Pýtame si e-mail, lebo je to verzia na overenie v praxi a potrebujeme vedieť, kto ju používa. A keď nám pošlete podnet, chceme sa vedieť spýtať na detail. Heslo si nevymýšľate, príde vám odkaz." Zdroje dát pomenovať presne - Open-Meteo, PVGIS, mapy Slovenského vodohospodárskeho podniku. V sále môžu sedieť ľudia zo SHMÚ.
---
id: S7
rozlozenie: obsah_obrazok
nadpis: Ukážka - obecný úrad s kultúrnym domom
odrazky:
- Areál, aký má takmer každá obec
- Budova z roku 1975, plochá strecha, plyn
- Asfaltové parkovisko, voda do kanalizácie
- Porovnáme so školou a zdravotným strediskom
vizual: Ilustračná fotka úradu s kultúrnym domom, prípadne jednoduchý pôdorys areálu.
poznamky: "Zoberieme areál, aký má každý z vás. Je vymyslený, aby sa nikto nespoznal, ale čísla sú typické." Potom prepnúť na web. Podľa subregiónu sa mení len adresa zadaná v aplikácii, nie táto snímka.
---
id: S8
rozlozenie: obsah
nadpis: Čo s výsledkom
odrazky:
- Skóre nie je známka - je to poradie, kde investícia pomôže najviac
- Odporúčané opatrenia s orientačnou cenou a návratnosťou
- Poradie areálov sa mení podľa hrozby - sucho, horúčavy, voda, energia
- Export do XLSX, PDF a CSV - podklad k žiadosti aj pre projektanta
poznamky: "Výstup nie je projekt. Je to argument, s ktorým idete za projektantom alebo do zastupiteľstva." Ak sa ukážka natiahla, túto snímku preskočiť - obsah odznel pri Výsledkoch.
---
id: S9
rozlozenie: obsah
nadpis: Kde VESMA dnes je
odrazky:
- Verzia na overenie v praxi - používajte ju na ostro a hovorte nám, čo nesedí
- Hodnotenie vody vychádza z metodiky KLIMASKEN, energetika z vyhlášky 179/2015
- Časť referenčných hodnôt je návrh a čaká na potvrdenie expertov
- Pripravujeme prepojenie na systémy kraja a na evidenciu majetku obcí
poznamky: Kľúčová snímka pre dôveru. "Radšej vám poviem, čo ešte nie je hotové, než aby ste na to prišli sami." Zoznam otvorených hodnôt vedieme a na požiadanie ho pošleme. Nesľubovať termíny prepojení - čakáme na špecifikáciu formátu od druhej strany.
---
id: S10
rozlozenie: obsah_obrazok
nadpis: Vyskúšajte VESMU
odrazky:
- vesma.inovia.sk
- Príručka je odkazom v hlavičke aplikácie
- Spätná väzba - tlačidlo Podnet pri každom poli
- Prosba - vyplňte jeden svoj areál do [termín]
- Napíšte nám, kde ste sa zasekli
qr: https://vesma.inovia.sk
poznamky: Konkrétna, malá prosba. Nie "používajte", ale "jeden areál do [termín]". Zásada tímu - "Ak sa zaseknete, nie je to vaša chyba, je to náš podnet. Napíšte nám ho tlačidlom Podnet a my nástroj upravíme." Neponúkať, že prídeme areál vyplniť za nich; nástroj a Príručka na to majú stačiť.
---
id: S11
rozlozenie: zaver
nadpis: Ďakujem
odrazky:
- Otázky?
- vesma.inovia.sk
- "[meno a kontakt rečníka]"
qr: https://vesma.inovia.sk
poznamky: Snímka ostáva na plátne počas celej diskusie, aby si ľudia stihli odfotiť QR kód. Otázky si niekto z tímu zapisuje - sú to podnety.
---
id: Z1
rozlozenie: obsah
nadpis: Záložná ukážka (nepremieta sa)
odrazky:
- Sem patrí sedem screenshotov v poradí ukážky
- Prihlásenie, krok 1 s výberom rozsahu, krok 2, krok 3
- Výsledky, rozbalené vysvetlenie bodov, porovnanie areálov
poznamky: Použije sa, keď zlyhá pripojenie. Text hovoreného slova ostáva rovnaký ako pri živej ukážke - ide sa po tých istých obrazovkách. Screenshoty doplní hlavný tvorca pri vypĺňaní ukážkových areálov.
---
id: Z2
rozlozenie: obsah
nadpis: Zdroje dát a metodiky
odrazky:
- Zrážky - Open-Meteo
- Slnečný svit - PVGIS (Európska komisia)
- Povodňové ohrozenie - mapy Slovenského vodohospodárskeho podniku
- Energetika - vyhláška č. 179/2015 Z. z.
- Hodnotenie vody - metodika KLIMASKEN (CI2, projekt LIFE DELIVER)
- Tvorcovia nástroja - ŽSK, UNIZA, INOVIA
poznamky: Táto snímka je pre odborné publikum, najmä pre zástupcov inštitúcií. Premietnuť len na otázku o zdrojoch dát alebo o metodike.
---
id: Z3
rozlozenie: obsah
nadpis: Slovníček
odrazky:
- MZI - modro-zelená infraštruktúra, teda voda a zeleň v areáli
- OZE - obnoviteľné zdroje energie
- B&G opatrenia - blue-green, modro-zelené opatrenia
- HDV - hospodárenie s dažďovou vodou
- Koeficient MZI - číslo od 0 do 1, ako plocha zadržiava vodu
- ETICS - kontaktné zateplenie fasády
poznamky: Použiť, keď v sále sedia ľudia, ktorí s témou začínajú. Skratky sa dajú aj len povedať priebežne, snímka je poistka.
---
id: Z4
rozlozenie: obsah
nadpis: Ako sa počíta skóre vody
odrazky:
- B-GOV2 - zadržiavanie zrážkovej vody v okolí budovy (45 bodov)
- B-GOV3 - zachytávanie zrážkovej vody na budove (25 bodov)
- B-AD10 - kapacita na akumuláciu dažďovej vody (15 bodov)
- Odtok zo spevnených plôch - doplnok VESMA (15 bodov)
- Komponent bez údajov sa do skóre nezapočíta, areál sa nepenalizuje
poznamky: Pre odborné publikum. Podstatné je posledné - kto na otázku neodpovie, nedostane nulu, komponent sa vynechá a skóre sa normalizuje cez zvyšné.
---
id: Z5
rozlozenie: obsah
nadpis: Dáta a súkromie
odrazky:
- Údaje o areáli sú vo vašom prehliadači, nie na našom serveri
- Na server ide e-mail pri prihlásení, podnety a otázky na chatbota
- E-mail používame na kontakt k podnetom, nie na marketing
- Reláciu zdieľate súborom vtedy, keď chcete vy
poznamky: Toto je najčastejšia obava. Odpovedať pokojne a konkrétne - kde čo je. Prihlasovací odkaz odomkne aplikáciu v tom prehliadači, v ktorom ho človek otvorí, a platí rok.
