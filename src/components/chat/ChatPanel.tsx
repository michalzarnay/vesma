import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, ChevronDown, Bot } from 'lucide-react';
import { Areal } from '../../types/areal';
import { apiUrl } from '../../utils/apiUrl';

interface Sprava {
  id: string;
  odosielatel: 'user' | 'bot';
  text: string;
  cas: string;
}

interface ChatPanelProps {
  // areal reserved for future AI integration
  areal?: Areal;
  currentStep: number;
}

// Kontextové nápovedy podľa kroku
const KONTEXTOVE_OTAZKY: Record<number, string[]> = {
  1: [
    'Kde nájdem množstvo zrážok pre moju obec?',
    'Čo je potenciál slnečného svitu a kde ho zistím?',
    'Ako definovať hranice areálu?',
    'Čo je VESMA?',
  ],
  2: [
    'Ako rozlíšiť priepustné a polopriepustné plochy?',
    'Čo patrí do spevnenej plochy?',
    'Ako odhadnúť percentá odvodu dažďovej vody?',
    'Čo je dažďová záhrada?',
  ],
  3: [
    'Ako určiť typ strechy?',
    'Čo znamená orientácia strechy na juh?',
    'Kde nájdem spotrebu plynu/elektriny?',
    'Čo je rekuperácia?',
    'Ako odhadnúť % termoizolačných okien?',
    'Kam patrí záhradná chatka?',
  ],
  4: [
    'Čo patrí medzi iné stavby?',
    'Ako zadať oplotenie alebo parkovisko?',
    'Kam patrí záhradná chatka?',
  ],
  5: [
    'Čo sú ochranné pásma?',
    'Ako posúdiť potenciál znečistenia?',
    'Čo znamená hladina podzemnej vody?',
  ],
  6: [
    'Ako interpretovať celkové skóre?',
    'Čo znamenajú váhy pri porovnávaní areálov?',
    'Ako exportovať výsledky do XLSX?',
    'Ktoré opatrenia sú najdôležitejšie?',
    'Aké sú orientačné ceny opatrení?',
  ],
};

// Databáza odpovedí
const ODPOVEDE: Record<string, string> = {
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
  'priepustné a polopriepustné': 'Priepustné plochy **prepúšťajú vodu priamo do pôdy**: tráva, záhony, lesná pôda, štrk bez podkladu. Polopriepustné plochy prepúšťajú vodu **čiastočne**: priepustný asfalt, vegetačné tvarovky, mlat, štrk na pevnom podklade. Spevnené plochy (betón, klasický asfalt) vodu **neprepúšťajú vôbec**.',

  'spevnená plocha': 'Do spevnenej plochy patria: klasický asfalt, betónové plochy, dlažba bez spár, terasy. Sú to plochy, kde dažďová voda **nevsákne** – odtečie po povrchu do odtoku alebo kanalizácie.',

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
  'iné stavby': 'Do kroku **Iné stavby** patria objekty **bez strechy alebo bez uzavretého vnútorného priestoru**:\n• Oplotenie, brány, múry\n• Chodníky, terasy, spevnené plochy\n• Parkoviská a príjazdové cesty\n• Altánky a pergoly bez stien, prístrešky\n• Technické objekty (trafostanice, studne, žumpy)\n\nObjekt so strechou a vnútorným priestorom – **záhradná chatka, domček na náradie, garáž** – patrí medzi **Budovy** (krok 3).\n\nAk takéto stavby nemáte, krok preskočte – nie je povinný.',

  'kam patrí záhradná chatka': 'Záhradná chatka, domček na náradie aj garáž patria medzi **Budovy** (krok 3), nie medzi iné stavby. Rozhoduje **strecha a vnútorný priestor**, nie veľkosť ani vykurovanie.\n\nAk sa v chatke v zime nekúri, odpovedzte v kroku 3 „áno" na otázku **Je to sezónna nevykurovaná stavba (letné sídlo)?**. VESMA jej potom nebude počítať potenciál zateplenia, okien, rekuperácie ani vykurovania – ale naďalej vyhodnotí to, čo so sezónnosťou nesúvisí:\n• strechu vhodnú pre fotovoltiku\n• potenciál zelenej strechy\n• odvod zrážkovej vody\n• osvetlenie\n\nMedzi Inými stavbami by sa tieto údaje vôbec nezisťovali.',

  'oplotenie parkovisko': 'Oplotenie, chodníky a parkoviská zadajte ako samostatné položky v kroku **Iné stavby**:\n1. Kliknite na "Pridať inú stavbu"\n2. Zadajte názov (napr. "Oplotenie areálu")\n3. Vyplňte typ stavby a zastavanou plochu\n\nPre parkovisko je dôležitý **typ povrchu** – klasický asfalt je nepriepustný, priepustná dlažba alebo štrk zlepšujú skóre MZI.',

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

function najdiOdpoved(otazka: string): string {
  const q = otazka.toLowerCase();

  for (const [kluc, odpoved] of Object.entries(ODPOVEDE)) {
    const kluce = kluc.split(' ');
    if (kluce.every((k) => q.includes(k))) {
      return odpoved;
    }
  }

  // Fallback podľa kľúčových slov
  if (q.includes('vesma') || q.includes('čo je tento')) {
    return ODPOVEDE['čo je vesma'];
  }
  if (q.includes('zrážok') || q.includes('srážok') || q.includes('prší')) {
    return ODPOVEDE['kde nájdem množstvo zrážok'];
  }
  if (q.includes('slnk') || q.includes('pvgis') || q.includes('solar') || q.includes('slnečn')) {
    return ODPOVEDE['potenciál slnečného svitu'];
  }
  if (q.includes('spevnen')) {
    return ODPOVEDE['spevnená plocha'];
  }
  if (q.includes('priepust')) {
    return ODPOVEDE['priepustné a polopriepustné'];
  }
  if (q.includes('strech') && (q.includes('typ') || q.includes('druh') || q.includes('zel'))) {
    return q.includes('zel') ? ODPOVEDE['zelená strecha'] : ODPOVEDE['typ strechy'];
  }
  if (q.includes('spotreb') && (q.includes('plyn') || q.includes('elektrin') || q.includes('energ'))) {
    return ODPOVEDE['spotreba plynu elektriny'];
  }
  if (q.includes('termoizol')) {
    return ODPOVEDE['termoizolačné okná'];
  }
  if (q.includes('rekuperáci') || q.includes('rekuperac')) {
    return ODPOVEDE['rekuperácia'];
  }
  if (q.includes('skóre') && q.includes('interpret')) {
    return ODPOVEDE['interpretovať celkové skóre'];
  }
  if (q.includes('xlsx') || q.includes('export') || q.includes('excel')) {
    return ODPOVEDE['exportovať výsledky do xlsx'];
  }
  if (q.includes('fotovolt') || q.includes('fve') || q.includes('panel')) {
    return ODPOVEDE['fotovoltika fve'];
  }
  if (q.includes('tepeln') && q.includes('čerpadl')) {
    return ODPOVEDE['tepelné čerpadlo'];
  }
  if (q.includes('zateplen') || q.includes('etics') || q.includes('fasád')) {
    return ODPOVEDE['zateplenie fasády'];
  }
  if (q.includes('dažďová záhrad') || q.includes('dazdova zahrad')) {
    return ODPOVEDE['dažďová záhrada'];
  }
  if (q.includes('rigol') || q.includes('vsakov')) {
    return ODPOVEDE['vsakovací rigol'];
  }
  if (q.includes('retenčn') || q.includes('nádrž') || q.includes('nadrz')) {
    return ODPOVEDE['retenčná nádrž'];
  }
  if (q.includes('dlažb') || q.includes('priepustn') && q.includes('dlažb')) {
    return ODPOVEDE['priepustná dlažba'];
  }
  // Skôr než všeobecná odpoveď o iných stavbách — chatka a podobné objekty patria medzi budovy.
  if (q.includes('chatk') || q.includes('chata') || q.includes('domček') || q.includes('domcek') || q.includes('garáž') || q.includes('garaz')) {
    return ODPOVEDE['kam patrí záhradná chatka'];
  }
  if (q.includes('iné stavb') || q.includes('ine stavb') || (q.includes('čo patrí') && q.includes('stavb'))) {
    return ODPOVEDE['iné stavby'];
  }
  if (q.includes('oploteni') || q.includes('parkovisk') || q.includes('altánok') || q.includes('chodník')) {
    return ODPOVEDE['oplotenie parkovisko'];
  }
  if (q.includes('ochranné pásm') || q.includes('ochranné pasm') || q.includes('ochranné pásk') || (q.includes('pásm') && q.includes('ochran'))) {
    return ODPOVEDE['ochranné pásma'];
  }
  if (q.includes('znečisten') || q.includes('kontaminác') || q.includes('záťaž')) {
    return ODPOVEDE['potenciál znečistenia'];
  }
  if (q.includes('podzemn') && q.includes('vod')) {
    return ODPOVEDE['hladina podzemnej vody'];
  }
  if (q.includes('dotáci') || q.includes('grant') || q.includes('podpora')) {
    return ODPOVEDE['dotácie'];
  }
  if (q.includes('cen') || q.includes('koľko stoj') || q.includes('náklad')) {
    return ODPOVEDE['ceny opatrení'];
  }
  if (q.includes('mzi') || q.includes('modro') || q.includes('zelená infra')) {
    return ODPOVEDE['mzi opatrenia'];
  }
  if (q.includes('oze') || q.includes('obnoviteľn')) {
    return ODPOVEDE['oze opatrenia'];
  }
  if (q.includes('energia') || q.includes('energetick')) {
    return ODPOVEDE['energetické opatrenia'];
  }

  return 'Prepáčte, na túto otázku nemám presnú odpoveď. Skúste otázku preformulovať alebo sa pozrite do nápovedy pri konkrétnom poli (ikona ?).\n\nMôžete sa pýtať na: VESMA metodiku, zrážky, slnečný svit, typy plôch, odvod vody, dažďovú záhradu, retenčnú nádrž, zelenú strechu, fotovoltiku, tepelné čerpadlo, zateplenie, rekuperáciu, dotácie, ceny opatrení alebo interpretáciu skóre.';
}

function formatText(text: string): React.ReactNode {
  // Jednoduchý markdown: **tučné**, nové riadky
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part.split('\n').map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </span>
        ));
      })}
    </>
  );
}

export function ChatPanel({ currentStep }: ChatPanelProps) {
  const [otvoreny, setOtvoreny] = useState(false);
  const [spravy, setSpravy] = useState<Sprava[]>([
    {
      id: '0',
      odosielatel: 'bot',
      text: 'Dobrý deň! Som asistent VESMA – nástroja pre mapovanie areálov z hľadiska vody a energie. Môžem vám vysvetliť, ako vyplniť polia, a odpovedať na otázky o MZI, OZE, energetických opatreniach, ich cenách a dotáciách.',
      cas: new Date().toLocaleTimeString('sk', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [vstup, setVstup] = useState('');
  const koniecRef = useRef<HTMLDivElement>(null);
  const vstupRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (otvoreny) {
      koniecRef.current?.scrollIntoView({ behavior: 'smooth' });
      vstupRef.current?.focus();
    }
  }, [otvoreny, spravy]);

  const odosliSprav = (text: string) => {
    if (!text.trim()) return;

    const cas = new Date().toLocaleTimeString('sk', { hour: '2-digit', minute: '2-digit' });
    const textOtazky = text.trim();
    const textOdpovede = najdiOdpoved(textOtazky);

    const novaSprava: Sprava = {
      id: crypto.randomUUID(),
      odosielatel: 'user',
      text: textOtazky,
      cas,
    };

    const odpoved: Sprava = {
      id: crypto.randomUUID(),
      odosielatel: 'bot',
      text: textOdpovede,
      cas,
    };

    // Ak asistent nevie odpovedať, zaznamenaj otázku do Google Sheetu
    if (textOdpovede.startsWith('Prepáčte')) {
      fetch(apiUrl('feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textOtazky,
          step: currentStep,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // fire-and-forget – chyba nezobrazí sa používateľovi
      });
    }

    setSpravy((prev) => [...prev, novaSprava, odpoved]);
    setVstup('');
  };

  const kontextoveOtazky = KONTEXTOVE_OTAZKY[currentStep] ?? [];

  // Počet správ od posledného otvorenia (pre badge)
  const neprecitane = otvoreny ? 0 : Math.max(0, spravy.filter((s) => s.odosielatel === 'bot').length - 1);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOtvoreny(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white font-medium text-sm transition-all ${
          otvoreny ? 'opacity-0 pointer-events-none' : 'opacity-100'
        } bg-[#52A8DE] hover:bg-[#52A8DE]/90`}
      >
        <MessageCircle className="w-5 h-5" />
        <span>Asistent</span>
        {neprecitane > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {neprecitane}
          </span>
        )}
      </button>

      {/* Panel */}
      {otvoreny && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 h-[500px] sm:h-[520px] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Hlavička */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#52A8DE] text-white flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Asistent VESMA</p>
              <p className="text-xs text-white/70">
                Krok {currentStep}: {['', 'Identifikácia', 'Pozemky', 'Budovy', 'Iné stavby', 'B&G opatrenia', 'Výsledky'][currentStep]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOtvoreny(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Správy */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {spravy.map((sprava) => (
              <div
                key={sprava.id}
                className={`flex ${sprava.odosielatel === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    sprava.odosielatel === 'user'
                      ? 'bg-[#52A8DE] text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {formatText(sprava.text)}
                  <p className={`text-[10px] mt-1 ${sprava.odosielatel === 'user' ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                    {sprava.cas}
                  </p>
                </div>
              </div>
            ))}
            <div ref={koniecRef} />
          </div>

          {/* Kontextové otázky */}
          {kontextoveOtazky.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
              <p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1">
                <ChevronDown className="w-3 h-3" /> Časté otázky pre tento krok
              </p>
              <div className="flex flex-wrap gap-1.5">
                {kontextoveOtazky.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => odosliSprav(q)}
                    className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-[#52A8DE]/10 text-gray-700 hover:text-[#52A8DE] rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vstup */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 flex-shrink-0 bg-gray-50">
            <input
              ref={vstupRef}
              type="text"
              value={vstup}
              onChange={(e) => setVstup(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && odosliSprav(vstup)}
              placeholder="Napíšte otázku…"
              className="flex-1 text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-[#52A8DE]"
            />
            <button
              type="button"
              onClick={() => odosliSprav(vstup)}
              disabled={!vstup.trim()}
              className="p-2 bg-[#52A8DE] text-white rounded-full hover:bg-[#52A8DE]/90 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overlay pre mobil */}
      {otvoreny && (
        <div
          className="fixed inset-0 z-40 bg-black/30 sm:hidden"
          onClick={() => setOtvoreny(false)}
        />
      )}
    </>
  );
}

