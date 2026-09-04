import * as XLSX from 'xlsx';
import { Areal } from '../types/areal';
import { xlsxFilename } from './exportFilenames';
import {
  KlimaskenStupen, MZIKomponent, ScoreResult,
  dovodNehodnoteniaEnergetiky, saHodnotiEnergetika, saHodnotiOZE, vazeneCelkoveSkore,
} from '../types/scoring';
import { Odporucanie } from '../types/catalog';
import {
  NADPISY_MZI, VysvetlenieKomponentu, chybajuceUdajeMZI,
  vysvetleniaEnergetiky, vysvetleniaMZI, vysvetleniaOZE,
} from './skoreVysvetlenie';
import { UPOZORNENIE_ROZSAH_HODNOTENIA } from '../data/constants';
import { getParagraf11 } from './paragraf11';

/**
 * Riadok detailu MZI. Komponent bez údajov nezostane pri holom „bez údajov" —
 * do stĺpca hodnoty sa vypíše, ktorý údaj chýba (#213), aby hodnotiteľ vedel,
 * či na niečo zabudol.
 */
function mziRiadok(
  nazov: string,
  komponent: MZIKomponent | null,
  hodnota: string | null,
  stupen: KlimaskenStupen | null,
  coChyba?: string,
): (string | number)[] {
  if (komponent === null) return [nazov, 'bez údajov', '', coChyba ?? '', ''];
  return [nazov, komponent.body, komponent.max, hodnota ?? '', stupen ?? ''];
}

const weightedScore = vazeneCelkoveSkore;

/** Text do bunky skóre — nula nehodnotenej oblasti sa nemá tváriť ako výsledok. */
function skoreCell(hodnoti: boolean, skore: number): string | number {
  return hodnoti ? skore : 'nehodnotené';
}

const ozeCell = (score: ScoreResult) => skoreCell(saHodnotiOZE(score.oze), score.oze.celkove);
const energiaCell = (score: ScoreResult) => skoreCell(saHodnotiEnergetika(score.energia), score.energia.celkove);

function sheetSuhrn(areal: Areal, score: ScoreResult): (string | number)[][] {
  const ws = (vahy: Areal['vahy']) => weightedScore(score, vahy);
  const chyba = chybajuceUdajeMZI(areal, score.mzi);
  return [
    ['VESMA – Hodnotenie areálu'],
    [UPOZORNENIE_ROZSAH_HODNOTENIA],
    [],
    ['Dátum hodnotenia', new Date().toLocaleDateString('sk')],
    ['Názov areálu', areal.nazov],
    ['Ulica + číslo', areal.adresa],
    ['Krajina', areal.krajina ?? 'Slovensko'],
    ['Obec', areal.obec],
    ['Kraj', areal.kraj],
    ['Okres', areal.okres],
    ['Množstvo zrážok (mm/m²)', areal.mnozstvoZrazok ?? ''],
    ['Potenciál slnečného svitu (kWh/rok)', areal.potencialSlnecnehoSvitu ?? ''],
    [],
    ['ZÁZNAM Z OBHLIADKY'],
    ['Organizácia', areal.organizaciaVZriadovatelskejPobnonosti],
    ['Obhliadku vykonal', areal.obhliadkuVykonal],
    ['Dátum obhliadky', areal.datumObhliadky],
    ['Prítomné osoby', areal.pritomnePOSOBY],
    ['Kapacita zariadenia', areal.kapacitaZariadenia],
    ['Aktuálna obsadenosť klientov/žiakov (%)', areal.aktualnaObsadenost],
    ['Počet zamestnancov', areal.pocetZamestnancov],
    [],
    ['Počet pozemkov', areal.pozemky.length],
    ['Počet budov', areal.budovy.length],
    [],
    ['SKÓRE', '', ''],
    ['Oblasť', 'Skóre (0–100)', 'Váha'],
    ['MZI – Modro-zelená infraštruktúra', score.mzi.celkove, areal.vahy.mzi],
    ['OZE – Obnoviteľné zdroje energie', ozeCell(score), areal.vahy.oze],
    ['Energia – Energetická efektívnosť', energiaCell(score), areal.vahy.energia],
    [],
    ['Vážené celkové skóre', ws(areal.vahy)],
    ['Nevážené celkové skóre', score.celkove],
    [],
    ['DETAIL MZI (metodika KLIMASKEN)'],
    ['Komponent', 'Body', 'Maximum', 'Hodnota indikátora', 'Stupeň A–E'],
    mziRiadok('Priepustnosť a zeleň areálu (B-GOV2)', score.mzi.okolie,
      score.mzi.koefOkolie === null ? null : `koeficient MZI ${score.mzi.koefOkolie.toFixed(2)}`,
      score.mzi.stupenOkolie, chyba.get('okolie')),
    mziRiadok('Zeleň a retencia na budovách (B-GOV3)', score.mzi.budovy,
      score.mzi.koefBudovy === null ? null : `koeficient MZI ${score.mzi.koefBudovy.toFixed(2)}`,
      score.mzi.stupenBudovy, chyba.get('budovy')),
    areal.nadrzNieJeMozna === 1
      ? ['Akumulácia zrážkovej vody (B-AD10)', 'nehodnotí sa',
        `Nádrž nie je možné inštalovať${areal.nadrzNemoznaDovod.trim() ? ` — ${areal.nadrzNemoznaDovod.trim()}` : ''}`, '', '']
      : mziRiadok('Akumulácia zrážkovej vody (B-AD10)', score.mzi.akumulacia,
        score.mzi.akumulaciaPercent === null ? null : `${Math.round(score.mzi.akumulaciaPercent)} % optimálneho objemu`,
        score.mzi.stupenAkumulacia, chyba.get('akumulacia')),
    mziRiadok('Odtok zo spevnených plôch', score.mzi.odtok,
      score.mzi.podielZadrzanehoOdtoku === null ? null : `${Math.round(score.mzi.podielZadrzanehoOdtoku * 100)} % odtokovej plochy do vsaku alebo retencie`,
      null, chyba.get('odtok')),
    [],
    ['DETAIL OZE'],
    ...(saHodnotiOZE(score.oze)
      ? []
      : [['OZE sa nehodnotí — areál nemá zadanú žiadnu budovu.', '', '']]),
    ['Vhodnosť strechy pre solár', score.oze.vhodnostStrechyPreSolar, '/ 30'],
    ['Existujúce OZE', score.oze.existujuceOZE, '/ 20'],
    ['Potenciál tepelného čerpadla', score.oze.potencialTepelnehoCerpadla, '/ 25'],
    ['Potenciál ďalších OZE', score.oze.potencialDalsichOZE, '/ 25'],
    [],
    ['DETAIL ENERGIA'],
    ...(saHodnotiEnergetika(score.energia)
      ? []
      : [[dovodNehodnoteniaEnergetiky(score.energia) === 'bezBudov'
        ? 'Energetika sa nehodnotí — areál nemá zadanú žiadnu budovu.'
        : 'Energetika sa nehodnotí — všetky budovy areálu sú sezónne nevykurované stavby.', '', '']]),
    ['Zateplenie', score.energia.zateplenie, '/ 30'],
    ['Kvalita okien', score.energia.kvalitaOkien, '/ 20'],
    ['Vykurovací systém', score.energia.vykurovaciSystem, '/ 25'],
    ['Vetranie / LED', score.energia.vetranie, '/ 25'],
    [],
    ['ZÁVERY'],
    ['Záver BG (MZI)', areal.zaverBG],
    ['Záver OZE', areal.zaverOZE],
  ];
}

/**
 * Rozpis, za čo vznikli body vo všetkých troch oblastiach skóre (issue #213) —
 * rovnaké tabuľky, aké aplikácia ukazuje v modálnom okne, aby sa dali priložiť
 * k správe pre obec.
 */
function sheetVypocetSkore(areal: Areal, score: ScoreResult): (string | number)[][] {
  const riadky: (string | number)[][] = [
    ['VÝPOČET SKÓRE'],
    ['Koeficienty MZI a päťstupňová škála A–E podľa metodiky KLIMASKEN (www.klimasken.sk).'],
    [],
  ];

  // Komponenty MZI, ktoré sa nedali vypočítať, sa nezamlčia — hodnotiteľ musí
  // vedieť, ktorý údaj doplniť, aby výsledok vznikol (#213).
  const chybaMZI = [...chybajuceUdajeMZI(areal, score.mzi)].map(
    ([kluc, text]) => [`${NADPISY_MZI[kluc]}: bez údajov`, text],
  );

  const oblasti: Array<{
    nazov: string;
    vysvetlenia: VysvetlenieKomponentu[];
    prazdne: string;
    chybajuce?: (string | number)[][];
  }> = [
    {
      nazov: 'MZI – MODRO-ZELENÁ INFRAŠTRUKTÚRA',
      vysvetlenia: vysvetleniaMZI(areal, score.mzi),
      prazdne: 'Žiadny komponent MZI sa nedal vypočítať:',
      chybajuce: chybaMZI,
    },
    {
      nazov: 'OZE – OBNOVITEĽNÉ ZDROJE ENERGIE',
      vysvetlenia: vysvetleniaOZE(score.oze),
      prazdne: 'OZE sa nehodnotí — areál nemá zadanú žiadnu budovu.',
    },
    {
      nazov: 'ENERGETICKÁ EFEKTÍVNOSŤ',
      vysvetlenia: vysvetleniaEnergetiky(score.energia),
      prazdne: dovodNehodnoteniaEnergetiky(score.energia) === 'bezBudov'
        ? 'Energetika sa nehodnotí — areál nemá zadanú žiadnu budovu.'
        : 'Energetika sa nehodnotí — všetky budovy areálu sú sezónne nevykurované stavby.',
    },
  ];

  for (const oblast of oblasti) {
    riadky.push([oblast.nazov]);
    if (oblast.vysvetlenia.length === 0) {
      riadky.push([oblast.prazdne]);
    }
    for (const v of oblast.vysvetlenia) {
      riadky.push([v.metodika ? `${v.nadpis} (${v.metodika})` : v.nadpis]);
      riadky.push([v.sumar]);
      riadky.push(v.hlavicka);
      riadky.push(...v.riadky);
      riadky.push([v.zaver]);
      riadky.push([]);
    }
    riadky.push(...(oblast.chybajuce ?? []));
    if (oblast.vysvetlenia.length === 0) riadky.push([]);
  }
  return riadky;
}

function sheetPozemky(areal: Areal): (string | number)[][] {
  const header = [
    'Pozemok', 'Parcela', 'Využitie', 'Celková výmera (m²)', 'Plocha bez budov (m²)',
    'Odvod – jednotná kanal. (%)', 'Odvod – splašková kanal. (%)', 'Odvod – zrážková kanal. (%)',
    'Odvod – vodný tok (%)', 'Odvod – vsakovanie (%)', 'Odvod – retenčná nádrž (%)', 'Odvod – neriešený (%)',
    'Prírodný (vsakovací) povrch (m²)', 'Spevnený (polopriepustný) povrch (m²)', 'Nepriepustný povrch (m²)',
    'Stromy – podiel mladých (%)', 'Stromy – podiel nezdravých (%)',
    'Dažďová záhrada – plocha (m²)', 'Dažďová záhrada – hĺbka (cm)',
    'Dažďová záhrada – plocha strechy (m²)', 'Dažďová záhrada – plocha terénu (m²)',
    'Jazierko – plocha (m²)', 'Jazierko – hĺbka (cm)', 'Jazierko – prepad riešený', 'Jazierko – smer prepadu',
    'Nádrže nadzemné (m³)', 'Nádrže podzemné (m³)', 'Spôsob využitia vody', 'Kapacita nádrže – postačuje',
    'Zelená strecha celkom (m²)', 'ZS extenzívna plochá (m²)', 'ZS extenzívna šikmá (m²)',
    'ZS intenzívna (m²)', 'ZS modrozelená (m²)', 'ZS štrková (m²)', 'Zelená stena (m²)',
    'Vsak. priehlbeň – bezpečnostný prepad (m²)', 'Vsak. priehlbeň – regulovaný odtok (m²)',
    'Prekoreniteľný priestor pre stromy (m²)',
  ];
  const yn = (v: 0 | 1) => v ? 'áno' : 'nie';
  const rows = areal.pozemky.map((p, i) => [
    `Pozemok ${i + 1}`, p.parcela, p.aktualneVyuzitie, p.celkovaVymera, p.plochaBezBudov,
    p.odvodVodyJednotnaKanalizacia, p.odvodVodySplaskovaKanalizacia, p.odvodVodyZrazkovaKanalizacia,
    p.odvodVodyVodnyTok, p.odvodVodyVsakovanie, p.odvodVodyRetencnaNadrzou, p.odvodVodyNerieseny,
    p.priepustnaPlochaCelkom, p.polopriepustnaPlochaCelkom, p.spevnenaPlochaCelkom,
    p.stromyPodielMladych, p.stromyPodielNezdravych,
    p.dazdovaZahradaPlocha, p.dazdovaZahradaHlbka, p.dazdovaZahradaPlochaStrechy, p.dazdovaZahradaPlochaTerenu,
    p.jazierkoPlocha, p.jazierkoHlbka, yn(p.jazierkoPrepadRieseny), p.jazierkoSmerPrepadu,
    p.nadzemneNadobyObjem, p.podzemneNadobyObjem, p.sposobVyuzitiaVody, yn(p.kapacitaNadrzSebahodnotenie),
    p.zelenaStrechaPlocha, p.zelenaStrechaExtenzivnaPloca, p.zelenaStrechaExtenzivnaSikma,
    p.zelenaStrechaIntenzivna, p.zelenaStrechaModrozelena, p.zelenaStrechaStrkova, p.zelenaStenaNaPozemku,
    p.vsakovaciaPrehlbenaBezpecnostnyPrepad, p.vsakovaciaPrehlbenaRegulovanyOdtok,
    p.prekorenetelnyPriestorPreStromy,
  ]);
  return [header, ...rows];
}

function sheetBudovy(areal: Areal): (string | number)[][] {
  const header = [
    'Budova', 'Parcela', 'Plocha pôdorysu (m²)', 'NUS (m²)', 'Kategória',
    'Trieda energetickej hospodárnosti',
    // Vypočítaná potreba z certifikátu — nie nameraná spotreba (issue #170)
    'Certifikát – potreba na vykurovanie (kWh/(m²·rok))',
    'Certifikát – potreba na teplú vodu (kWh/(m²·rok))',
    'Certifikát – primárna energia (kWh/(m²·rok))',
    // Povodne
    'Povodňové riziko (1–5)',
    'Zaplavená v posl. rokoch', 'Časť pod terénom', 'Tech. zariadenia v suteréne',
    'Kanal. vpuste nie nad podlahou', 'Potrubia nespĺňajú normy', 'Chýbajú mriežky',
    'Dažď. kanal. bez záchytného zariadenia', 'Prípojka bez spätnej klapky',
    'El. zariadenia v suteréne nízko', 'Chýba uzáver plynu v suteréne',
    // Strecha
    'Typ strechy', 'Zateplenie strechy', 'Orientácia na juh (m²)',
    // Voda
    'Odvod do retenčnej nádrže (%)',
    'Využitie dažďovej vody v objekte',
    // Úspory
    'Materiál obvodových stien', 'Zateplenie fasády', 'Materiál zateplenia fasády',
    'Plocha presklenia (m²)', 'Termoizolačné okná (%)', 'Vek termoizol. okien (rok)',
    'LED osvetlenie (%)', 'Počet svietidiel (ks)', 'Z toho LED (ks)', 'Objem vetrávania (m³/deň)',
    // Rekuperácia
    'Rekuperácia', 'Centrálna – účinnosť (%)',
    'Lokálne do 75% (ks)', 'Lokálne 76–89% (ks)', 'Lokálne 90%+ (ks)',
    // Rozvody tepla a TV — § 11 ods. 1 zákona č. 321/2014 Z. z.
    'Hydraulicky vyregulované ÚK', 'Hydraulicky vyregulované rozvody TV',
    'Zaizolované rozvody tepla a TV', 'Dopadá § 11 ods. 1',
    // Kúrenie
    'Kúrenie plynom', 'Kúrenie elektrinou', 'Tepelné čerpadlo',
    'Kúrenie peletami', 'Kúrenie CZT',
    'Celková spotreba (kWh)',
    // Elektrina
    'Fotovoltika', 'Plocha FV (m²)', 'Batériové úložisko (kWh)',
    // Zelená infra
    'Zelená strecha celkom (m²)', 'ZS extenzívna plochá (m²)', 'ZS extenzívna šikmá (m²)',
    'ZS intenzívna (m²)', 'ZS modrozelená (m²)', 'ZS štrková (m²)',
    'Zelená stena budovy (m²)', 'Solárne kolektory (m²)',
    // Stav
    'Celkový stav budovy',
    // Nový stĺpec sa pridáva na koniec, aby sa poradie doterajších stĺpcov neposunulo.
    'Sezónna nevykurovaná stavba',
  ];
  const yn = (v: 0 | 1) => v ? 'áno' : 'nie';
  const ynu = (v: 0 | 1 | 2) => v === 1 ? 'áno' : v === 0 ? 'nie' : 'neviem';
  const typStrechy = (t: number) => t === 1 ? 'plochá' : t === 2 ? 'šikmá' : 'strmá';
  const zateplenie = (z: number) => z === 1 ? 'áno' : z === 2 ? 'čiastočne' : 'nie';
  const rows = areal.budovy.map((b, i) => [
    b.nazov || `Budova ${i + 1}`, b.parcela, b.plochaPodorysu, b.uzitkovaPlochaNUS,
    b.kategoriaBudovy ?? '',
    b.energetickaTrieda ?? '',
    b.certifikatPotrebaVykurovanie || '',
    b.certifikatPotrebaTeplaVoda || '',
    b.certifikatPrimarnaEnergia || '',
    b.povodnovoRiziko || '',
    yn(b.budovaZaplavenaPoslednychRokov), yn(b.castPodTerenomBezOdcerpania),
    yn(b.technologickeZariadenieSuteren), yn(b.kanalizacneVpusteNadSuterenom),
    yn(b.potrubiaNeSpljajuNormy), yn(b.chybajuMriazkyNaVtokoch),
    yn(b.dazdovaKanalizaciaBezZariadenia), yn(b.pripojkaBezSpatnejKlapky),
    yn(b.elektrickeZariadeniaSuterenNizko), yn(b.uzaverPlynuSuteren),
    typStrechy(b.strechaTyp), zateplenie(b.strechaZateplenie), b.strechaOrientovanaPlochaNaJuh,
    b.budovaOdvodVodyRetencnaNadrz,
    yn(b.vyuzitieDazdovejVodyVObjekte),
    b.obvodoveStenyMaterial, zateplenie(b.zateplenieFasady), b.zateplenieFasadyMaterial,
    b.celkovaPlochaPresklenia, b.termoizolacneOkna, b.vekTermoizolacnychOkien || '',
    b.osvetlenieLED, b.osvetleniePocetSvietidiel ?? 0, b.osvetleniePocetSvietidielLED ?? 0,
    b.objemVyvetranehoPrezduchu,
    yn(b.rekuperacia), b.rekuperaciaCentralnaUcinnost,
    b.rekuperaciaLokalnaDo75, b.rekuperaciaLokalnaOd76do89, b.rekuperaciaLokalnaOd90,
    ynu(b.hydraulickeVyregulovanieUK), ynu(b.hydraulickeVyregulovanieTV),
    ynu(b.izolaciaRozvodov), getParagraf11(b).dopada ? 'áno' : 'nie',
    yn(b.kurenePlynom), yn(b.kurenieElektrinou), yn(b.tepelneCerpadlo),
    yn(b.kureniePeletami), yn(b.kurenieCZT),
    b.celkovaSpotreba ?? 0,
    yn(b.fotovoltika), b.fotovoltikaPlocha, b.bateriovyUlozisko,
    b.zelenaStrechaPlocha, b.zelenaStrechaBudovExtenzivnaPloca, b.zelenaStrechaBudovExtenzivnaSikma,
    b.zelenaStrechaBudovIntenzivna, b.zelenaStrechaBudovModrozelena, b.zelenaStrechaBudovStrkova,
    b.zelenaStenaBudov, b.solarnePanelyPlocha,
    b.celkovyStavBudovy,
    yn(b.sezonnaNevykurovana),
  ]);
  return [header, ...rows];
}

/**
 * Iné stavby z Kroku 4 (issue #209) — oplotenie, chodníky, parkoviská.
 * Do skóre nevstupujú (o tom, či zastavaná plocha patrí do MZI, rozhoduje
 * človek), ale zadané údaje musia byť vo výstupe.
 */
function sheetIneStavby(areal: Areal): (string | number)[][] {
  const header = [
    'Stavba', 'Parcela', 'Číslo listu vlastníctva', 'Typ stavby', 'Popis stavby',
    'Aktuálne využitie', 'Celková výmera parciel (m²)', 'Zastavaná plocha (m²)',
  ];
  const rows = areal.ineStavby.map((s, i) => [
    s.nazov || `Stavba ${i + 1}`, s.parcela, s.listVlastnictva, s.typStavby, s.popisStavby,
    s.aktualneVyuzitie, s.celkovaVymeraParciel, s.zastavanaPlocha,
  ]);
  return [header, ...rows];
}

/**
 * Zamýšľané B&G opatrenia z Kroku 5 (issue #223). Stĺpce sú rovnaké ako
 * v porovnaní areálov (`comparisonXlsxExport.ts`), aby oba exporty hovorili
 * rovnakým jazykom. Sú to plány, nie stav — do skóre preto nevstupujú.
 */
function sheetBGOpatrenia(areal: Areal): (string | number)[][] {
  const header = [
    'Opatrenie', 'Na parcele', 'Iná budova/pozemok mimo areálu',
    'Ochranné pásma a technická infraštruktúra', 'Potenciál znečistenia',
    'Hladina podzemnej vody', 'Vzdialenosť vodného toku (m)',
    'Vplyv na ochranu pred povodňami', 'Vplyv na zraniteľné skupiny', 'Prekážky',
  ];
  const rows = areal.bgOpatrenia.map((bg, i) => [
    bg.nazov || `Opatrenie ${i + 1}`, bg.naParcele, bg.inaBudovaMimoUSK,
    bg.ochrannePasma, bg.potencialZnecistenia, bg.hladinaPodzemnejVody,
    bg.vzdialenostVodnehoToku, bg.vplyvOchranaPredPovodniami, bg.vplyvZranitelneSkupiny, bg.prekazky,
  ]);
  return [header, ...rows];
}

function sheetOdporucania(recommendations: Odporucanie[]): (string | number)[][] {
  const header = [
    'Por.', 'Opatrenie', 'Kategória', 'Priorita', 'Dôvod',
    'Potenciál', 'Orientačná cena', 'Návratnosť', 'Náročnosť', 'Dotácie',
  ];
  const rows = recommendations.map((r, i) => [
    i + 1,
    r.opatrenie.nazov,
    r.opatrenie.kategoria,
    r.priorita,
    r.dovod,
    r.potencial ?? '',
    r.opatrenie.orientacnaCena,
    r.opatrenie.navratnost,
    r.opatrenie.narocnostRealizacie,
    r.opatrenie.dotacie,
  ]);
  return [header, ...rows];
}

function sheetVahy(areal: Areal, score: ScoreResult): (string | number)[][] {
  const { mzi } = areal.vahy;
  // Váhy nehodnotených oblastí sa do súčtu nezapočítajú — pozri vazeneCelkoveSkore().
  const oze = saHodnotiOZE(score.oze) ? areal.vahy.oze : 0;
  const energia = saHodnotiEnergetika(score.energia) ? areal.vahy.energia : 0;
  const sumVah = mzi + oze + energia;
  return [
    ['Nastavenie váh pre porovnanie areálov'],
    [],
    ['Oblasť', 'Skóre (0–100)', 'Váha', 'Vážená hodnota'],
    ['MZI', score.mzi.celkove, mzi, sumVah > 0 ? Math.round(score.mzi.celkove * mzi / sumVah) : 0],
    ['OZE', ozeCell(score), oze, sumVah > 0 ? Math.round(score.oze.celkove * oze / sumVah) : 0],
    ['Energia', energiaCell(score), energia, sumVah > 0 ? Math.round(score.energia.celkove * energia / sumVah) : 0],
    [],
    ['Vážené celkové skóre', weightedScore(score, areal.vahy)],
    [],
    ['Pokyny: Zmeňte hodnoty Váha (stĺpec C, riadky 4-6) pre prispôsobenie hodnotenia.'],
    ['Suma váh nemusí byť 1 – prepočet sa vykoná automaticky.'],
  ];
}

/** Jeden hárok exportu — názov a riadky buniek. */
export interface HarokExportu {
  nazov: string;
  riadky: (string | number)[][];
}

/**
 * Obsah exportu areálu — jeden zdroj pravdy pre XLSX aj CSV.
 *
 * Oba exporty čítajú z tohto zoznamu, takže nemôžu rozísť: nový hárok sa
 * objaví v zošite aj v CSV bez ďalšieho zásahu. Pridanie hárku je podľa
 * `CLAUDE.md` voľná zmena — exportný kontrakt na xMatik a Klimasken sa tým
 * neruší, poradie a význam doterajších hárkov zostáva.
 */
export function harkyExportu(
  areal: Areal,
  score: ScoreResult,
  recommendations: Odporucanie[],
): HarokExportu[] {
  return [
    { nazov: 'Súhrn', riadky: sheetSuhrn(areal, score) },
    { nazov: 'Výpočet skóre', riadky: sheetVypocetSkore(areal, score) },
    { nazov: 'Pozemky', riadky: sheetPozemky(areal) },
    { nazov: 'Budovy', riadky: sheetBudovy(areal) },
    { nazov: 'Iné stavby', riadky: sheetIneStavby(areal) },
    { nazov: 'B&G opatrenia', riadky: sheetBGOpatrenia(areal) },
    { nazov: 'Odporúčania', riadky: sheetOdporucania(recommendations) },
    { nazov: 'Váhy a skóre', riadky: sheetVahy(areal, score) },
  ];
}

export function exportToXlsx(
  areal: Areal,
  score: ScoreResult,
  recommendations: Odporucanie[]
): void {
  const wb = XLSX.utils.book_new();

  for (const harok of harkyExportu(areal, score, recommendations)) {
    const ws = XLSX.utils.aoa_to_sheet(harok.riadky);
    // Šírka stĺpcov
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, harok.nazov);
  }

  const fileName = xlsxFilename(areal.nazov, new Date().toISOString().slice(0, 10));
  XLSX.writeFile(wb, fileName);
}
