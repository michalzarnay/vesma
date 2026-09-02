import * as XLSX from 'xlsx';
import { Areal } from '../types/areal';
import { xlsxFilename } from './exportFilenames';
import { ScoreResult } from '../types/scoring';
import { Odporucanie } from '../types/catalog';
import { UPOZORNENIE_ROZSAH_HODNOTENIA } from '../data/constants';

function weightedScore(score: ScoreResult, vahy: Areal['vahy']): number {
  const sumVah = vahy.mzi + vahy.oze + vahy.energia;
  if (sumVah === 0) return 0;
  return Math.round(
    (score.mzi.celkove * vahy.mzi + score.oze.celkove * vahy.oze + score.energia.celkove * vahy.energia) / sumVah
  );
}

function sheetSuhrn(areal: Areal, score: ScoreResult): (string | number)[][] {
  const ws = (vahy: Areal['vahy']) => weightedScore(score, vahy);
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
    ['OZE – Obnoviteľné zdroje energie', score.oze.celkove, areal.vahy.oze],
    ['Energia – Energetická efektívnosť', score.energia.celkove, areal.vahy.energia],
    [],
    ['Vážené celkové skóre', ws(areal.vahy)],
    ['Nevážené celkové skóre', score.celkove],
    [],
    ['DETAIL MZI'],
    ['Podiel priepustných plôch', score.mzi.podielPriepustnychPloch, '/ 25'],
    ['Existujúce opatrenia', score.mzi.existujuceOpatrenia, '/ 25'],
    ['Stav zelene', score.mzi.stavZelene, '/ 25'],
    ['Potenciál zlepšenia', score.mzi.potencialZlepsenia, '/ 25'],
    [],
    ['DETAIL OZE'],
    ['Vhodnosť strechy pre solár', score.oze.vhodnostStrechyPreSolar, '/ 30'],
    ['Existujúce OZE', score.oze.existujuceOZE, '/ 20'],
    ['Potenciál tepelného čerpadla', score.oze.potencialTepelnehoCerpadla, '/ 25'],
    ['Potenciál ďalších OZE', score.oze.potencialDalsichOZE, '/ 25'],
    [],
    ['DETAIL ENERGIA'],
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
    // Kúrenie
    // Rozvody tepla — § 11 ods. 1 zákona č. 321/2014 Z. z. (issue #177)
    'Hydraulicky vyregulovaná sústava', 'Izolácia rozvodov',
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
  ];
  const yn = (v: 0 | 1) => v ? 'áno' : 'nie';
  const ann = (v?: 0 | 1 | 2) => v === 1 ? 'áno' : v === 0 ? 'nie' : 'neviem';
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
    ann(b.hydraulickeVyregulovanie), ann(b.izolaciaRozvodov),
    yn(b.kurenePlynom), yn(b.kurenieElektrinou), yn(b.tepelneCerpadlo),
    yn(b.kureniePeletami), yn(b.kurenieCZT),
    b.celkovaSpotreba ?? 0,
    yn(b.fotovoltika), b.fotovoltikaPlocha, b.bateriovyUlozisko,
    b.zelenaStrechaPlocha, b.zelenaStrechaBudovExtenzivnaPloca, b.zelenaStrechaBudovExtenzivnaSikma,
    b.zelenaStrechaBudovIntenzivna, b.zelenaStrechaBudovModrozelena, b.zelenaStrechaBudovStrkova,
    b.zelenaStenaBudov, b.solarnePanelyPlocha,
    b.celkovyStavBudovy,
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

function sheetVahy(areal: Areal, score: ScoreResult): (string | number | { f: string })[][] {
  const { mzi, oze, energia } = areal.vahy;
  const sumVah = mzi + oze + energia;
  return [
    ['Nastavenie váh pre porovnanie areálov'],
    [],
    ['Oblasť', 'Skóre (0–100)', 'Váha', 'Vážená hodnota'],
    ['MZI', score.mzi.celkove, mzi, sumVah > 0 ? Math.round(score.mzi.celkove * mzi / sumVah) : 0],
    ['OZE', score.oze.celkove, oze, sumVah > 0 ? Math.round(score.oze.celkove * oze / sumVah) : 0],
    ['Energia', score.energia.celkove, energia, sumVah > 0 ? Math.round(score.energia.celkove * energia / sumVah) : 0],
    [],
    ['Vážené celkové skóre', weightedScore(score, areal.vahy)],
    [],
    ['Pokyny: Zmeňte hodnoty Váha (stĺpec C, riadky 4-6) pre prispôsobenie hodnotenia.'],
    ['Suma váh nemusí byť 1 – prepočet sa vykoná automaticky.'],
  ];
}

export function exportToXlsx(
  areal: Areal,
  score: ScoreResult,
  recommendations: Odporucanie[]
): void {
  const wb = XLSX.utils.book_new();

  const addSheet = (name: string, data: (string | number | { f: string })[][]) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    // Šírka stĺpcov
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet('Súhrn', sheetSuhrn(areal, score));
  addSheet('Pozemky', sheetPozemky(areal));
  addSheet('Budovy', sheetBudovy(areal));
  addSheet('Odporúčania', sheetOdporucania(recommendations));
  addSheet('Váhy a skóre', sheetVahy(areal, score));

  const fileName = xlsxFilename(areal.nazov, new Date().toISOString().slice(0, 10));
  XLSX.writeFile(wb, fileName);
}
