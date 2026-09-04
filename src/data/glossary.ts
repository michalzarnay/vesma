export interface GlossaryEntry {
  term: string;
  definition: string;
  example?: string;
  whereToFind?: string;
}

export const glossary: Record<string, GlossaryEntry> = {
  priepustnaPlochaDef: {
    term: 'Prírodný (vsakovací) povrch',
    definition: 'Povrch, cez ktorý môže voda voľne vsiaknuť do zeme.',
    example: 'Trávnik, lúka, záhon, zeleninové hriadky, nezhutnená zemina.',
    whereToFind: 'Odhadnite podľa toho, koľko vášho pozemku tvorí trávnik, záhrady alebo prirodzená pôda.',
  },
  obrabanaPodaDef: {
    term: 'Pravidelne obrábaná pôda',
    definition: 'Pôda, ktorá sa aspoň dvakrát do roka orie, ryje alebo kyprí a ostáva nezakrytá. Po obrobení sa pri prívalovom daždi zaškrupinatie a voda odteká namiesto vsakovania, horšie drží vlahu a mimo vegetačnej sezóny sa prehrieva.',
    example: 'Zeleninové hriadky, záhony, poľnohospodárske polia.',
    whereToFind: 'Mulčované záhony sem nepatria — mulč pôdu chráni pred škrupinatením aj výparom, preto ich uveďte ako byliny. Rovnako sem nepatrí trávnik, lúka ani dočasne holé miesto v trávniku.',
  },
  polopriepustnaPlochaDef: {
    term: 'Spevnený (polopriepustný) povrch',
    definition: 'Povrch, ktorý čiastočne prepúšťa vodu – časť vsiakne, časť odtečie.',
    example: 'Zatrávňovacia dlažba, štrkový chodník, priepustný asfalt, vodopriepustná dlažba.',
    whereToFind: 'Pozrite sa na chodníky, parkoviská alebo terasy – ak medzi dlaždicami rastie tráva alebo je viditeľný štrk, ide o spevnený (polopriepustný) povrch.',
  },
  spevnenaPlochaDef: {
    term: 'Nepriepustný povrch',
    definition: 'Nepriepustný povrch, ktorý vodu neprepúšťa – voda po ňom steká.',
    example: 'Asfalt, betón, klasická dlažba, budovy.',
  },
  vyspadovanyPozemokDef: {
    term: 'Spevnená plocha vo svahu s sklonom',
    definition: 'Pozemok, ktorý nie je rovný – má svah alebo sklon. Voda po ňom steká smerom nadol.',
    example: 'Ak položíte loptu na zem a sama sa rozkotúľa, pozemok je vyspádovaný.',
  },
  modroZelenaInfrastrukturaDef: {
    term: 'Modro-zelená infraštruktúra (MZI)',
    definition: 'Súbor opatrení, ktoré pracujú s vodou a zeleňou na zmiernenie dôsledkov zmeny klímy.',
    example: 'Dažďové záhrady, zelené strechy, retenčné nádrže, vsakovacie rigoly.',
  },
  fotovoltikaDef: {
    term: 'Fotovoltika',
    definition: 'Solárne panely na výrobu elektrickej energie zo slnečného svetla. Panely premieňajú svetlo priamo na elektrinu.',
    example: 'Panely na streche, ktoré vyrábajú elektrinu pre domácnosť alebo budovu.',
  },
  solarnePanelyDef: {
    term: 'Solárne kolektory',
    definition: 'Panely, ktoré zachytávajú teplo slnečného žiarenia a používajú ho na ohrev vody. Na rozdiel od fotovoltiky nevyrábajú elektrinu, ale teplo.',
    example: 'Tmavé panely na streche napojené na bojler – slnko ohrieva vodu na kúpanie alebo vykurovanie.',
  },
  kurenieElektrinouDef: {
    term: 'Kúrenie elektrinou',
    definition: "Zaškrtnite 'kúrenie elektrikou' len ak má nehnuteľnosť samostatný elektrický zdroj kúrenia (napr. priamovýhrevné panely, elektrické kotly, akumulačné kachle) mimo tepelného čerpadla. Ak má nehnuteľnosť tepelné čerpadlo s bivalentným elektrickým dokurovaním (bežné napr. pri veľkých mrazoch alebo dezinfekcii TÚV), toto sa NEPOVAŽUJE za 'kúrenie elektrikou' — počíta sa ako tepelné čerpadlo.",
  },
  tepelneCerpadloDef: {
    term: 'Tepelné čerpadlo',
    definition: 'Zariadenie, ktoré odoberá teplo z okolitého prostredia (vzduch, zem, voda) a používa ho na vykurovanie budovy alebo ohrev vody.',
    example: 'Funguje ako chladnička naopak – odoberá teplo zvonku a presúva ho dovnútra.',
  },
  energetickyCertifikatDef: {
    term: 'Energetický certifikát',
    definition: 'Úradný dokument hodnotiaci energetickú náročnosť budovy na škále od A (najúspornejšia) po G (najnáročnejšia).',
    whereToFind: 'Ak ho máte, nájdete ho medzi dokumentáciou k budove. Býva povinný pri predaji alebo prenájme nehnuteľnosti.',
  },
  energetickyAuditDef: {
    term: 'Energetický audit',
    definition: 'Odborné posúdenie energetickej spotreby budovy s návrhmi na zníženie spotreby.',
    whereToFind: 'Ak bol spracovaný, nájdete ho u správcu budovy alebo v archíve projektovej dokumentácie.',
  },
  energetickaTriedaDef: {
    term: 'Trieda energetickej hospodárnosti',
    definition: 'Zaradenie budovy podľa energetického certifikátu na škále A0 (najúspornejšia, napr. pasívny dom) až G (najnáročnejšia).',
    example: 'Pasívny dom má mernú potrebu tepla na vykurovanie približne 15–20 kWh/m²/rok (trieda A0), nízkoenergetický dom okolo 30 kWh/m²/rok (trieda A1/B).',
    whereToFind: 'Nájdete ju na titulnej strane energetického certifikátu budovy.',
  },
  certifikatPotrebaDef: {
    term: 'Potreba energie podľa certifikátu',
    definition: 'Vypočítaná spotreba energie na meter štvorcový za rok pri normovaných podmienkach užívania a počasia. Nie je to vaša skutočná spotreba z faktúr — tá závisí od toho, ako budovu naozaj používate a aká bola zima.',
    example: 'Certifikát uvádza 95 kWh/(m²·rok) na vykurovanie, no z faktúr vám vyjde 130 — rozdiel býva v prevádzke budovy alebo v tom, že certifikát počítal s inými podmienkami.',
    whereToFind: 'Nájdete ju v energetickom certifikáte budovy pri jednotlivých miestach spotreby (vykurovanie, príprava teplej vody).',
  },
  primarnaEnergiaDef: {
    term: 'Primárna energia',
    definition: 'Celková energia potrebná na prevádzku budovy vrátane strát pri výrobe a doprave energie k budove. Podľa nej sa budova zaraďuje do triedy energetickej hospodárnosti (A0 až G).',
    example: 'Budova kúrená elektrinou má vyššiu primárnu energiu než rovnaká budova na drevo, hoci v budove spotrebujú rovnako — elektrina má vyššie straty pri výrobe.',
    whereToFind: 'Nájdete ju v energetickom certifikáte v riadku globálneho ukazovateľa.',
  },
  hydraulickeVyregulovanieDef: {
    term: 'Hydraulické vyregulovanie',
    definition: 'Nastavenie prietoku vody vo vykurovacom systéme tak, aby sa teplo dostalo rovnomerne do všetkých miestností. Bez neho býva pri kotolni prekúrené a na konci rozvodov zima — a kúri sa zbytočne viac, aby aj tie vzdialené miestnosti boli teplé.',
    example: 'Poznáte to podľa toho, že v niektorých miestnostiach musíte mať radiátor stále naplno a inde ho zaškrcujete.',
    whereToFind: 'Vie to správca budovy alebo kúrenár. Robí sa pomocou regulačných ventilov na stúpačkách a radiátoroch.',
  },
  izolaciaRozvodovDef: {
    term: 'Izolácia rozvodov',
    definition: 'Tepelná izolácia potrubí, ktorými sa rozvádza teplo a teplá voda. Neizolované potrubie v nevykurovanom priestore (suterén, šachta) odovzdáva teplo tam, kde ho nikto nevyužije.',
    example: 'Holé kovové potrubie v suteréne je neizolované; potrubie obalené sivým penovým alebo minerálnym púzdrom izolované je.',
    whereToFind: 'Vidno pohľadom v kotolni, suteréne alebo v technických šachtách.',
  },
  sezonnaNevykurovanaDef: {
    term: 'Sezónna nevykurovaná stavba',
    definition: 'Stavba užívaná len v teplej časti roka, ktorá sa nevykuruje a spravidla sa v nej ani nespáva — murovaná záhradná chatka, murovaný domček na náradie, nevykurovaná garáž. Zateplovať ju alebo v nej meniť zdroj tepla nemá zmysel, lebo nie je čo šetriť. VESMA jej preto nepočíta potenciál zateplenia, okien, rekuperácie ani vykurovania a nenavrhuje v tomto smere opatrenia. Zostáva ale medzi Budovami — hodnotí sa jej strecha pre fotovoltiku, zelená strecha, odvod zrážkovej vody aj osvetlenie.',
    example: 'Záhradná chatka, kde sa cez leto obeduje a v zime sa zamkne, je sezónna nevykurovaná stavba. Chalupa, ktorú v zime vykurujete krbom alebo elektrickými telesami, nie je — tam má zateplenie zmysel.',
    whereToFind: 'Rozhodnite podľa toho, či sa v stavbe v zime kúri. Ak áno čo i len občas, odpovedzte „nie".',
  },
  kamPatriStavbaDef: {
    term: 'Budova alebo iná stavba?',
    definition: 'Rozhodujú základy v zemi. Stavba na základoch je Budova — aj keď je malá a nevykurovaná (vtedy ju označte ako sezónnu nevykurovanú stavbu). Stavba bez základov, ktorá len stojí na teréne, patrí medzi Iné stavby: má zvislú konštrukciu a spravidla aj strechu, ale je taká jednoduchá, že sa na nej modrozelené ani energetické opatrenia nedajú robiť. Chodníky, parkoviská a spevnené plochy nie sú stavby — tie patria medzi povrchy pozemku v kroku Pozemky.',
    example: 'Medzi Budovy: murovaná záhradná chatka, murovaný domček na náradie, garáž. Medzi Iné stavby: altánok, pergola, prístrešok, plechová búda na náradie. Do Pozemkov ako povrch: chodník, terasa, parkovisko. Jednoduché oplotenie sa nezadáva nikam — na hodnotenie nemá vplyv.',
    whereToFind: 'Keď neviete rozhodnúť, pozrite sa na spodok stavby: betónový základový pás alebo doska pod celou stavbou znamená Budovu. Stavba na pätkách, na dlažbe alebo priamo na zemi je Iná stavba. Chatka zaradená medzi Budovy si zachová hodnotenie strechy pre fotovoltiku, zelenej strechy, odvodu zrážkovej vody aj osvetlenia.',
  },
  retenciaVodyDef: {
    term: 'Retencia vody',
    definition: 'Schopnosť areálu zadržať dažďovú vodu a spomaliť jej odtok do kanalizácie alebo vodného toku.',
    example: 'Dažďová záhrada, retenčná nádrž, jazierko – všetko, čo zachytí vodu a nedovolí jej rýchlo odtiecť.',
  },
  rekuperaciaDef: {
    term: 'Rekuperácia',
    definition: 'Systém vetrania, ktorý z odvádzaného teplého vzduchu odoberá teplo a odovzdáva ho čerstvému prichádzajúcemu vzduchu. Šetrí energiu na vykurovanie.',
    example: 'Vzduch odchádzajúci z kúpeľne alebo kuchyne odovzdá svoje teplo čerstvému vzduchu z vonku, takže ho netreba znova ohrievať.',
  },
  dazdovaZahradaDef: {
    term: 'Dažďová záhrada',
    definition: 'Záhradný záhon v miernej priehlbine, kam steká dažďová voda. Rastliny a pôda vodu postupne vsiaknu a prefiltrujú.',
    example: 'Plytký kvetinový záhon pri okapovom zvode, kam steká voda zo strechy.',
  },
  zelenaStrechaDef: {
    term: 'Zelená strecha',
    definition: 'Strecha pokrytá vrstvou zeminy a rastlín. Zadržiava dažďovú vodu, izoluje budovu a zlepšuje klímu v okolí.',
    example: 'Plochá strecha porastená rozchodníkmi alebo trávou.',
  },
  vsakovaciRigolDef: {
    term: 'Vsakovací rigol',
    definition: 'Plytký výkop vyplnený štrkom, do ktorého sa zvádza dažďová voda. Voda postupne vsiakne do zeme.',
    example: 'Štrková priekopa pozdĺž chodníka alebo parkoviska.',
  },
  retencnaNadrzDef: {
    term: 'Retenčná/akumulačná nádrž',
    definition: 'Podzemná alebo nadzemná nádrž na zachytávanie dažďovej vody. Vodu možno použiť na polievanie, splachovanie WC alebo technické účely.',
    example: 'Podzemná plastová nádrž pod záhradou, napojená na okapové zvody.',
  },
  priepustnaDlazbaDef: {
    term: 'Priepustná/vodopriepustná dlažba',
    definition: 'Špeciálna dlažba s medzerami alebo poréznym materiálom, cez ktorý môže voda vsiaknuť do podložia.',
    example: 'Dlažba s trávou v medzerách na parkovisku alebo chodníku.',
  },
  zateplenieFasadyDef: {
    term: 'Zateplenie fasády (ETICS)',
    definition: 'Vonkajšie zateplenie stien budovy izolačným materiálom (polystyrén, minerálna vlna). Znižuje tepelné straty a náklady na vykurovanie.',
    example: 'Polystyrénové dosky nalepené na vonkajšie steny a pokryté omietkou.',
  },
  termoizolacneOknaDef: {
    term: 'Termoizolačné okná/dvere',
    definition: 'Moderné okná s dvojsklom alebo trojsklom, ktoré výrazne znižujú tepelné straty oproti starým jednoduchým oknám.',
    whereToFind: 'Pozrite sa na okná – ak majú medzi sklami hliníkový rámik a sú ťažšie, pravdepodobne ide o termoizolačné okná. Dátum výroby nájdete na štítku medzi sklami.',
  },
  CZTDef: {
    term: 'CZT (Centrálne zásobovanie teplom)',
    definition: 'Systém, kde teplo vyrába centrálna teplárna a rozvádzaným potrubím ho dodáva do jednotlivých budov.',
    example: 'Typické pre sídliská – teplo prichádza z teplárne cez rozvody do radiátorov.',
  },
  peletyDef: {
    term: 'Pelety',
    definition: 'Malé valčeky z lisovaných drevených pilín. Ekologické palivo s vysokou výhrevnosťou.',
    example: 'Automatický kotol sám dávkuje pelety zo zásobníka.',
  },
  stiepkaDef: {
    term: 'Štiepka',
    definition: 'Drobné kúsky dreva vzniknuté štiepením konárov a kmeňov. Používa sa ako palivo v špeciálnych kotloch.',
    example: 'Kotol na štiepku s automatickým podávaním paliva.',
  },
  termohlaviceDef: {
    term: 'Termohlavice',
    definition: 'Regulačné hlavice na radiátoroch, ktoré automaticky regulujú prietok teplej vody podľa nastavenej teploty.',
    example: 'Otočný regulátor na radiátore s číslami 1-5, ktorý automaticky privrie ventil keď je v miestnosti dosť teplo.',
  },
  plochaPodorysuDef: {
    term: 'Plocha pôdorysu budovy (zastavaná plocha)',
    definition: 'Plocha, ktorú budova zaberá na zemi – jej „odtlačok" pri pohľade zhora.',
    whereToFind: 'Nájdete v katastri nehnuteľností, v projektovej dokumentácii alebo zmerajte vonkajšie rozmery budovy.',
  },
  uzitkovaPlochaDef: {
    term: 'Úžitková plocha',
    definition: 'Celková plocha všetkých miestností budovy, ktoré sa dajú využívať – súčet plôch všetkých podlaží.',
    whereToFind: 'Nájdete v projektovej dokumentácii, energetickom certifikáte alebo v liste vlastníctva.',
  },
  PCsietDef: {
    term: 'Počítačová sieť (LAN/Wi-Fi)',
    definition: 'Prítomnosť dátovej siete v budove. Existencia siete je predpokladom pre inštaláciu inteligentných meračov a diaľkového riadenia kúrenia alebo osvetlenia.',
    example: 'Kabeláž s routerom alebo Wi-Fi prístupový bod dostupný v kanceláriách či technickej miestnosti.',
  },
  normovanaSpotreba: {
    term: 'Normovaná spotreba budovy',
    definition: 'Štandardizovaná hodnota spotreby energie budovy prepočítaná na štandardné klimatické podmienky. Umožňuje porovnávať budovy medzi sebou bez ohľadu na to, či bol rok chladnejší alebo teplejší.',
    example: 'Budova A spotrebuje 80 kWh/m²/rok normovane — to je lepší výsledok ako budova B so 120 kWh/m²/rok, aj keď reálne merania môžu vyzerať inak kvôli počasiu.',
  },
  listVlastnictvaDef: {
    term: 'List vlastníctva',
    definition: 'Úradný dokument z katastra nehnuteľností, ktorý obsahuje údaje o vlastníkoch a nehnuteľnostiach.',
    whereToFind: 'Nájdete na katasterportál.sk alebo na príslušnom katastrálnom úrade.',
  },
  parcelaDef: {
    term: 'Parcela',
    definition: 'Konkrétny kus pozemku evidovaný v katastri nehnuteľností pod vlastným číslom. Parcela, na ktorej je iba budova, patrí len medzi Budovy – nezadávajte ju medzi Pozemky. Ak je na jednej parcele budova aj nezastavaný pozemok, zaraďte ju podľa toho, čo na nej prevažuje (dominantné využitie) – buď medzi Budovy, alebo medzi Pozemky.',
    whereToFind: 'Číslo parcely nájdete na liste vlastníctva alebo na katasterportál.sk.',
  },
  projektovaDokumentaciaDef: {
    term: 'Projektová dokumentácia',
    definition: 'Súbor výkresov, technických správ a výpočtov, podľa ktorých sa budova stavia alebo rekonštruuje.',
    whereToFind: 'U správcu budovy, v archíve organizácie alebo na príslušnom stavebnom úrade. Staršie budovy nemusia mať dokumentáciu v digitálnej podobe.',
  },
  BGOpatreniaDef: {
    term: 'B&G opatrenia',
    definition: 'Blue & Green (modro-zelené) opatrenia – investície do vodného hospodárstva a zelene na pozemku/areáli.',
    example: 'Vsakovacie rigoly, dažďové záhrady, zelené strechy, retenčné nádrže, výsadba stromov.',
  },
};
