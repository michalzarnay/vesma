// Pripravené odpovede asistenta (ChatPanel) podľa kľúčových slov otázky.
export const ODPOVEDE_ASISTENTA: Record<string, string> = {
  // VESMA všeobecne
  'čo je vesma': '**VESMA** (Voda a energia – sprievodca mapovaním areálov) je metodický nástroj vyvinutý v spolupráci INOVIA, Žilinský samosprávny kraj a UNIZA. Pomáha organizáciám verejného sektora zmapovať stav svojich areálov z hľadiska:\n• **MZI** – modro-zelená infraštruktúra (hospodárenie s vodou)\n• **OZE** – obnoviteľné zdroje energie\n• **Energetika** – efektívnosť budov\n\nNa základe zberu dát nástroj odporúča konkrétne opatrenia vrátane orientačných cien.',

  'mzi opatrenia': '**MZI – modro-zelená infraštruktúra** pomáha zadržiavať vodu v krajine a znižovať povodňové riziká. Orientačné ceny opatrení:\n• **Dažďová záhrada**: 500–3 000 €\n• **Vsakovací rigol**: 1 500–5 000 €\n• **Priepustná dlažba**: 25–60 €/m²\n• **Výsadba stromov**: 50–500 €/strom\n• **Retenčná nádrž**: 2 000–8 000 €\n• **Zelená strecha extenzívna**: 40–80 €/m²',

  'oze opatrenia': '**OZE – obnoviteľné zdroje energie** znižujú závislosť od fosílnych palív. Orientačné ceny:\n• **Fotovoltická elektráreň (FVE)**: 800–1 200 €/kWp\n• **Tepelné čerpadlo (TČ)**: 8 000–18 000 €\n• **Batériové úložisko**: 4 000–10 000 €\n\nFVE je vhodná pre ploché a šikmé strechy s južnou orientáciou. TČ nahrádza plynové kotly pri dobrom pomere COP.',

  'energetické opatrenia': '**Energetické opatrenia** zvyšujú tepelný komfort a znižujú spotrebu energie. Orientačné ceny:\n• **Zateplenie fasády ETICS**: 50–100 €/m²\n• **Výmena okien**: 250–600 €/m²\n• **LED osvetlenie**: 3–30 €/svietidlo\n• **Rekuperácia**: 5 000–15 000 €\n\nNajväčší efekt má zateplenie budov postavených pred rokom 2000 bez dodatočného zateplenia.',

  'ceny opatrení': 'Orientačné ceny opatrení (VESMA metodika V1.0, 2026):\n\n**MZI:**\n• Dažďová záhrada: 500–3 000 €\n• Vsakovací rigol: 1 500–5 000 €\n• Priepustná dlažba: 25–60 €/m²\n• Retenčná nádrž: 2 000–8 000 €\n• Zelená strecha: 40–80 €/m²\n• Výsadba stromov: 50–500 €/strom\n\n**OZE:**\n• FVE: 800–1 200 €/kWp\n• Tepelné čerpadlo: 8 000–18 000 €\n• Batériové úložisko: 4 000–10 000 €\n\n**Energia:**\n• Zateplenie fasády: 50–100 €/m²\n• Výmena okien: 250–600 €/m²\n• LED: 3–30 €/svietidlo\n• Rekuperácia: 5 000–15 000 €',

  // Step 1
  'kde nájdem množstvo zrážok': 'Množstvo zrážok pre vašu obec nájdete na stránke **SHMÚ (shmu.sk)** v sekcii Klimatológia → Zrážky. Pre rýchly odhad: väčšina Slovenska má 600–800 mm/rok, hornaté oblasti 800–1 200 mm/rok. Nástroj VESMA dokáže zrážky načítať automaticky podľa adresy cez tlačidlo "Načítať klimatické údaje".',

  'potenciál slnečného svitu': 'Potenciál slnečného svitu (kWh/m²/rok) pochádza z európskej databázy **PVGIS** (re.jrc.ec.europa.eu/pvgis). Pre väčšinu Slovenska je to 1 000–1 200 kWh/m²/rok. Nástroj VESMA dokáže túto hodnotu načítať automaticky podľa adresy – kliknite na "Načítať klimatické údaje".',

  'hranice areálu': 'Areál definujte ako **súvislé územie** (pozemky + budovy), ktoré patria k jednej organizácii alebo projektu. Ideálne využite katastrálnu mapu (katasterportal.sk) na identifikáciu parciel. Jeden areál = jedna položka v tomto nástroji. Ak má organizácia viacero oddelených areálov, každý zadajte zvlášť.',

  // Step 2
  'priepustné a polopriepustné': 'Priepustné plochy **prepúšťajú vodu priamo do pôdy**: tráva, záhony, lesná pôda. Polopriepustné plochy prepúšťajú vodu **čiastočne**: priepustný asfalt, vegetačné tvarovky, mlat, štrk na zemine alebo geotextílii. Pri štrku rozhoduje, **čo je pod ním**: zemina, geotextília či iný vsakovací podklad → spevnený (polopriepustný) povrch; betón → nepriepustný. Spevnené plochy (betón, klasický asfalt) vodu **neprepúšťajú vôbec**.',

  'spevnená plocha': 'Do spevnenej plochy patria: klasický asfalt, betónové plochy, dlažba bez spár, terasy, štrk nasypaný na betóne. Sú to plochy, kde dažďová voda **nevsákne** – odtečie po povrchu do odtoku alebo kanalizácie.',

  'odvod dažďovej vody': 'Percentá odvodu odhadnite takto:\n• Kanalizácia: ak väčšina odtokov vedie do splaškovej/daž. kanalizácie\n• Vodný tok: ak areál susedí s potokom/riekou a voda odtečie priamo\n• Vsakovanie: ak máte zelené plochy, kde voda vsákne\n• Retenčná nádrž: ak je na pozemku záchytná nádrž\n• Neriešený: ak neviete kam voda odtečie (problém!)\nSúčet musí dať 100 %.',

  'dažďová záhrada': 'Dažďová záhrada je **zahlbená záhon** (10–30 cm pod úrovňou okolia), do ktorej sa zvádza dažďová voda zo striech alebo spevnených plôch. Rastliny v nej sú odolné voči krátkodobému zaplaveniu aj suchu. Pomáha vsáknutiu vody do pôdy a znižuje záťaž kanalizácie. Orientačná cena: **500–3 000 €** (VESMA V1.0).',

  'vsakovací rigol': 'Vsakovací rigol je **podzemná vsakovacia štruktúra** – priekopa vyplnená štrkom alebo špeciálnym modulom, do ktorej sa odvádza dažďová voda a postupne vsáka do pôdy. Vhodný pre parkoviská a dvorce. Cena: **1 500–5 000 €** (VESMA V1.0).',

  'retenčná nádrž': 'Retenčná nádrž je **záchytná nádoba** na dažďovú vodu (nadzemná alebo podzemná). Voda sa využíva na závlahu, úžitkovú potrebu alebo sa regulovane vypúšťa. Znižuje nápor na kanalizáciu počas prívalových dažďov. Cena: **2 000–8 000 €** (VESMA V1.0).',

  'zelená strecha': 'Zelená strecha je strecha pokrytá vegetáciou. Typy:\n• **Extenzívna** (nízke rastliny, 6–20 cm substrátu): 40–80 €/m² – nenáročná na údržbu\n• **Intenzívna** (záhrada na streche, 20–100+ cm): vyššia cena, vyžaduje statiku\n\nZnižuje odtok dažďovej vody, izoluje budovu a ochladzuje okolie.',

  'priepustná dlažba': '**Priepustná dlažba** umožňuje vsakovanie dažďovej vody cez spáry alebo priepustný materiál. Vhodná pre parkoviská, chodníky, dvorce. Cena: **25–60 €/m²**. Pri renovácii parkoviska ide o jednoduchú náhradu klasického asfaltu.',

  // Step 3
  'typ strechy': 'Typy striech:\n• **Plochá** (sklon do 10°): ideálna pre zelenú strechu alebo fotovoltiku\n• **Šikmá** (10°–45°): vhodná pre FV panely, možná zelená strecha extenzívna\n• **Strmá** (nad 45°): menej vhodná pre FV, väčšie tienenie\n\nTyp strechy zásadne ovplyvňuje odporúčania nástroja VESMA.',

  'orientácia strechy na juh': 'Zadajte **plochu strešnej roviny** (v m²) otočenej na juh (± 45° od juhu). Táto plocha je kľúčová pre výpočet solárneho potenciálu FVE. Ak má strecha viac rovín, sčítajte plochy orientované na juh, juhozápad alebo juhovýchod.',

  'spotreba plynu elektriny': 'Spotrebu nájdete na **ročnom vyúčtovaní** od dodávateľa energie:\n• Plyn: v m³ alebo kWh (prepočet: 1 m³ ≈ 10,5 kWh)\n• Elektrina: v kWh\nAk nemáte vyúčtovanie, odhadnite podľa výkonu kotla × hodiny prevádzky za rok. Správna hodnota spotreby zlepšuje kvalitu odporúčaní nástroja.',

  'rekuperácia': 'Rekuperácia (spätné získavanie tepla) je systém vetrania, ktorý **ohrieva čerstvý vzduch** tepelnou energiou odpadového vzduchu. Znižuje straty tepla pri vetraní o 60–90 %. Ak má budova takýto systém, zadajte "áno". Inštalácia novej rekuperácie: **5 000–15 000 €** (VESMA V1.0).',

  'termoizolačné okná': 'Zadajte **percentuálny podiel** okien s tepelnoizolačným zasklením (dvojsklo/trojsklo) z celkových okien budovy. Ak si nie ste istí, odhadnite: okná staršie ako 25 rokov sú väčšinou bez termoizolácie. Výmena okien: **250–600 €/m²** (VESMA V1.0).',

  'fotovoltika fve': '**Fotovoltická elektráreň (FVE)** premieňa slnečnú energiu na elektrinu. Odporúčaná pre:\n• Ploché a šikmé strechy s južnou orientáciou\n• Spotreba elektriny v budove (vlastná spotreba znižuje návratnosť)\n\nNáklady: **800–1 200 €/kWp**. Na Slovensku dostupné dotácie z Environmentálneho fondu a eurofondov. Typická návratnosť: 7–12 rokov.',

  'tepelné čerpadlo': '**Tepelné čerpadlo (TČ)** využíva teplo zo vzduchu, zeme alebo vody na vykurovanie. Ideálne ako náhrada plynového kotla:\n• COP (efektívnosť) 3–5: na 1 kWh elektriny → 3–5 kWh tepla\n• Vhodné pre budovy s nižšou teplotou vykurovacej sústavy\n\nCena: **8 000–18 000 €** + prípadná úprava vykurovacej sústavy (VESMA V1.0).',

  'zateplenie fasády': '**Zateplenie fasády systémom ETICS** (kontaktné zatepľovacie systémy) znižuje tepelné straty o 30–60 %. Cena: **50–100 €/m²** podľa hrúbky izolácie a materiálu. Najefektívnejšie pri budovách bez zateplenia postavených pred rokom 2000. Dotácie: dostupné cez OPKZP, OP Slovensko.',

  // Step 4
  'iné stavby': 'Do kroku **Iné stavby** patria **drobné stavby bez základov v zemi**. Majú zvislú konštrukciu a spravidla aj strechu, ale sú také jednoduché, že sa na nich modrozelené ani energetické opatrenia nedajú robiť:\n• Altánky a pergoly\n• Prístrešky (na bicykle, na autá)\n• Plechové búdy a sklady náradia bez základov\n\nStavba **na základoch** – murovaná chatka, murovaný domček na náradie, garáž – patrí medzi **Budovy** (krok 3).\n\n**Chodníky, terasy a parkoviská sem nepatria** – to sú povrchy pozemku, zadajte ich v kroku **Pozemky** (krok 2) podľa toho, či vodu prepúšťajú. **Jednoduché oplotenie** sa nezadáva nikam, na hodnotenie nemá vplyv.\n\nAk takéto stavby nemáte, krok preskočte – nie je povinný.',

  'kam patrí záhradná chatka': 'Rozhodujú **základy v zemi**, nie veľkosť ani vykurovanie. Murovaná záhradná chatka, murovaný domček na náradie aj garáž stoja na základoch, takže patria medzi **Budovy** (krok 3). Plechová búda či altánok bez základov patria medzi **Iné stavby** (krok 4).\n\nAk sa v chatke v zime nekúri, odpovedzte v kroku 3 „áno" na otázku **Je to sezónna nevykurovaná stavba (letné sídlo)?**. VESMA jej potom nebude počítať potenciál zateplenia, okien, rekuperácie ani vykurovania – ale naďalej vyhodnotí to, čo so sezónnosťou nesúvisí:\n• strechu vhodnú pre fotovoltiku\n• potenciál zelenej strechy\n• odvod zrážkovej vody\n• osvetlenie\n\nMedzi Inými stavbami by sa tieto údaje vôbec nezisťovali.',

  'oplotenie parkovisko': 'Chodníky, terasy a parkoviská **nie sú iné stavby** – sú to povrchy pozemku. Zadajte ich v kroku **Pozemky** (krok 2) do výmery podľa toho, či vodu prepúšťajú:\n• klasický asfalt, betón, bežná dlažba, štrk na betóne → **nepriepustný povrch**\n• priepustná dlažba, zatrávňovacie tvárnice, štrk na zemine alebo geotextílii → **spevnený (polopriepustný) povrch**\n\nPri parkovisku je teda dôležitý **typ povrchu** a rozhoduje o ňom to, do ktorej z týchto výmer ho zarátate.\n\n**Jednoduché oplotenie** sa nezadáva nikam – na hodnotenie nemá vplyv.\n\nAltánok, prístrešok či plechovú búdu zadajte v kroku **Iné stavby** (krok 4).',

  // Step 5
  'ochranné pásma': 'Ochranné pásma sú zóny, kde je obmedzená stavebná činnosť kvôli technickej infraštruktúre. Uveďte, či sú v blízkosti zamýšľaného opatrenia:\n• **Plynovod** – ochranné pásmo 1–4 m (výkopové práce zakázané)\n• **Vodovod a kanalizácia** – pásmo 1,5–3 m\n• **Elektrické vedenie** – podľa napätia 1–30 m\n• **Teplovod** – pásmo 2,5 m\n\nPreskúmajte katastrálnu mapu a kontaktujte správcov sietí pred plánovaním opatrení.',

  'potenciál znečistenia': 'Uveďte, či existuje riziko znečistenia pôdy alebo vody v areáli:\n• **Povrchový odtok** z parkovísk alebo skladovacích plôch (ropné látky)\n• **Staré environmentálne záťaže** – skládky, kontaminovaná pôda z minulosti\n• **Chemické látky** – sklady hnojív, posypové soli, technické kvapaliny\n• **Odpadové vody** – nelegálne zaústenie do pôdy\n\nRiziko znečistenia môže obmedziť realizáciu vsakovacích opatrení (dažďová záhrada, rigol).',

  'hladina podzemnej vody': 'Hladina podzemnej vody ovplyvňuje, či je vsakovanie vody do pôdy bezpečné a efektívne:\n• **Hlboko (viac ako 2 m)**: vsakovanie je vhodné – dažďová záhrada, rigol\n• **Blízko povrchu (menej ako 1 m)**: vsakovanie môže zaplavovať základy budov\n• **Sezónne kolísanie**: overte v jarných mesiacoch\n\nOdhadnúť ju môžete podľa geologickej mapy Slovenska (geology.sk) alebo sa opýtajte správcu obecného vodovodu.',

  // Step 6
  'interpretovať celkové skóre': 'Skóre VESMA vyjadruje **pripravenosť areálu** na klimatické opatrenia (0 = nič nie je urobené, 100 = všetko optimálne):\n• 0–30: nízka – veľký potenciál zlepšenia, priorita investícií\n• 31–50: podpriemerná – niekoľko kľúčových oblastí bez riešenia\n• 51–70: priemerná – základné opatrenia sú, rezervy existujú\n• 71–85: dobrá – areál je dobre vybavený\n• 86–100: výborná – príkladový areál\n\nNižšie skóre = väčší priestor pre dotácie.',

  'váhy pri porovnávaní': 'Váhy umožňujú **zvýrazniť dôležitosť** konkrétnej oblasti pre daný typ areálu:\n• Ak prioritizujete vodu: nastavte MZI váhu vyššie (napr. 2)\n• Ak riešite energiu: zvýšte váhu Energia\n• Vážené skóre sa zobrazí v XLSX v záložke "Váhy a skóre"\n\nVáhy neovplyvňujú odporúčania, iba celkové skóre pre porovnanie viacerých areálov.',

  'exportovať výsledky do xlsx': 'Kliknite na tlačidlo **"Exportovať XLSX"** v sekcii Výsledky (krok 6). Súbor obsahuje 5 záložiek:\n• **Súhrn**: identifikácia, skóre, závery\n• **Pozemky**: dáta o každom pozemku\n• **Budovy**: dáta o každej budove\n• **Odporúčania**: opatrenia zoradené podľa priority\n• **Váhy a skóre**: pre porovnanie viacerých areálov\n\nSúbor môžete odovzdať ako podklad pre projektantov alebo žiadosť o dotáciu.',

  'najdôležitejšie opatrenia': 'Opatrenia VESMA sú zoradené podľa **priority** (vysoká → stredná → nízka). Priorita zohľadňuje:\n• Ako veľmi zlepší skóre v danej oblasti\n• Dostupnosť dotácií\n• Realizovateľnosť bez stavebného povolenia\n\nOdporúčame začať s opatreniami s **vysokou prioritou** – zvyčajne sú to zateplenie, LED osvetlenie a dažďová záhrada alebo priepustná dlažba.',

  'dotácie': 'Pre opatrenia VESMA sú dostupné viaceré dotačné schémy:\n• **MZI (voda)**: Environmentálny fond SR, OP Slovensko (výzvy pre samosprávy)\n• **OZE (energia)**: Plán obnovy SR, Zelená domácnostiam (pre menšie zariadenia)\n• **Energetika**: OP Slovensko, Fond na podporu zatepľovania\n\nPre verejné inštitúcie (školy, kultúrne centrá) sú dostupné preferencie. Konkrétne výzvy overte na enviroportal.sk a slovensko.sk.',
};
