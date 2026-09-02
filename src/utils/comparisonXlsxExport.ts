// Export "Vyhodnotenie" zošita pre porovnanie viacerých areálov.
// Štruktúra hárkov vychádza zo vzoru (Vyhodnotenie.xlsx, dodaný 2026-08-13):
// váhy / 2-vyhodnotenie / export-areál / export-pozemky / export-budovy / export-BG.
// Záhlavia stĺpcov sú prepočítané na aktuálnu verziu dátového modelu (v2.4) a
// pôvodná jediná hodnota "Potenciál areálu pre BG opatrenia" je nahradená
// štyrmi hodnotami (sucho/horúčavy/voda/energia) — pozri docs/porovnanie-arealov-zmeny.md.
import * as XLSX from 'xlsx';
import { Areal, Budova, Pozemok, BGOpatrenie } from '../types/areal';
import { AreaComparisonRow } from '../types/comparison';
import { MZI_PARAMETERS, ENERGIA_PARAMETERS } from '../data/comparisonWeights';
import { UPOZORNENIE_ROZSAH_HODNOTENIA } from '../data/constants';
import { getParagraf11 } from './paragraf11';

function sheetVahy(): (string | number)[][] {
  const header = ['Oblasť', 'Parameter', 'Váha – sucho', 'Váha – horúčavy', 'Váha – voda'];
  const mziRows = MZI_PARAMETERS.map((p) => ['MZI (voda)', p.nazov, p.vahy.sucho, p.vahy.horucavy, p.vahy.voda]);
  const energiaHeader = ['Oblasť', 'Parameter', 'Váha'];
  const energiaRows = ENERGIA_PARAMETERS.map((p) => ['Energia', p.nazov, p.vaha]);
  return [
    ['VESMA – Váhy použité pri porovnaní areálov'],
    ['Kladná váha = nevyužitý potenciál, záporná váha = existujúce opatrenie znižuje potenciál.'],
    [],
    header,
    ...mziRows,
    [],
    energiaHeader,
    ...energiaRows,
  ];
}

function sheetVyhodnotenie(riadky: AreaComparisonRow[], arealyById: Map<string, Areal>): (string | number)[][] {
  const header = [
    'Id', 'Názov', 'Adresa', 'Obec', 'Kraj', 'Okres',
    'Potenciál – sucho', 'Poradie – sucho',
    'Potenciál – horúčavy', 'Poradie – horúčavy',
    'Potenciál – voda', 'Poradie – voda',
    'Potenciál – energia', 'Poradie – energia',
    'Priemerný ročný úhrn zrážok (mm/m²)', 'Potenciál slnečného svitu (kWh/rok)',
    'Záver BG', 'Záver OZE',
  ];
  const rows = riadky.map((r) => {
    const a = arealyById.get(r.arealId);
    return [
      r.arealId, r.nazov, a?.adresa ?? '', a?.obec ?? '', a?.kraj ?? '', a?.okres ?? '',
      r.sucho, r.poradieSucho,
      r.horucavy, r.poradieHorucavy,
      r.voda, r.poradieVoda,
      r.energia, r.poradieEnergia,
      a?.mnozstvoZrazok ?? '', a?.potencialSlnecnehoSvitu ?? '',
      a?.zaverBG ?? '', a?.zaverOZE ?? '',
    ];
  });
  return [
    ['VESMA – Vyhodnotenie porovnania areálov'],
    ['Dátum exportu', new Date().toLocaleDateString('sk')],
    ['Vyššia hodnota = vyšší potenciál pre opatrenia v danej oblasti. Poradie #1 = najvyšší potenciál spomedzi vybraných areálov.'],
    [UPOZORNENIE_ROZSAH_HODNOTENIA],
    [],
    header,
    ...rows,
  ];
}

function sheetExportAreal(riadky: AreaComparisonRow[], arealyById: Map<string, Areal>): (string | number)[][] {
  const header = [
    'Id', 'Názov', 'Adresa', 'Obec', 'Kraj', 'Okres',
    'Priemerný ročný úhrn zrážok (mm/m²)', 'Potenciál slnečného svitu (kWh/rok)',
    'Záver BG', 'Záver OZE',
    'Potenciál – sucho', 'Potenciál – horúčavy', 'Potenciál – voda', 'Potenciál – energia',
    ...MZI_PARAMETERS.map((p) => p.nazov),
    ...ENERGIA_PARAMETERS.map((p) => p.nazov),
  ];
  const rows = riadky.map((r) => {
    const a = arealyById.get(r.arealId);
    const mziHodnoty = MZI_PARAMETERS.map((p) => p.getValue(a!));
    const energiaHodnoty = ENERGIA_PARAMETERS.map((p) => p.getValue(a!));
    return [
      r.arealId, r.nazov, a?.adresa ?? '', a?.obec ?? '', a?.kraj ?? '', a?.okres ?? '',
      a?.mnozstvoZrazok ?? '', a?.potencialSlnecnehoSvitu ?? '',
      a?.zaverBG ?? '', a?.zaverOZE ?? '',
      r.sucho, r.horucavy, r.voda, r.energia,
      ...mziHodnoty, ...energiaHodnoty,
    ];
  });
  return [header, ...rows];
}

const POZEMOK_HEADER = [
  'Areál', 'Pozemok', 'Parcela', 'Využitie', 'Celková výmera (m²)', 'Plocha bez budov (m²)',
  'Odvod – jednotná kanal. (%)', 'Odvod – splašková kanal. (%)', 'Odvod – zrážková kanal. (%)',
  'Odvod – vodný tok (%)', 'Odvod – vsakovanie (%)', 'Odvod – retenčná nádrž (%)', 'Odvod – neriešený (%)',
  'Prírodný (vsakovací) povrch (m²)', 'Spevnený (polopriepustný) povrch (m²)', 'Nepriepustný povrch (m²)',
  'Stromy – podiel mladých (%)', 'Stromy – podiel nezdravých (%)',
  'Dažďová záhrada – plocha (m²)', 'Dažďová záhrada – hĺbka (cm)',
  'Jazierko – plocha (m²)', 'Jazierko – hĺbka (cm)',
  'Nádrže nadzemné (m³)', 'Nádrže podzemné (m³)', 'Spôsob využitia vody',
  'Zelená strecha celkom (m²)',
];

function riadokPozemku(arealNazov: string, p: Pozemok, i: number): (string | number)[] {
  return [
    arealNazov, `Pozemok ${i + 1}`, p.parcela, p.aktualneVyuzitie, p.celkovaVymera, p.plochaBezBudov,
    p.odvodVodyJednotnaKanalizacia, p.odvodVodySplaskovaKanalizacia, p.odvodVodyZrazkovaKanalizacia,
    p.odvodVodyVodnyTok, p.odvodVodyVsakovanie, p.odvodVodyRetencnaNadrzou, p.odvodVodyNerieseny,
    p.priepustnaPlochaCelkom, p.polopriepustnaPlochaCelkom, p.spevnenaPlochaCelkom,
    p.stromyPodielMladych, p.stromyPodielNezdravych,
    p.dazdovaZahradaPlocha, p.dazdovaZahradaHlbka,
    p.jazierkoPlocha, p.jazierkoHlbka,
    p.nadzemneNadobyObjem, p.podzemneNadobyObjem, p.sposobVyuzitiaVody,
    p.zelenaStrechaPlocha,
  ];
}

function sheetExportPozemky(arealy: Areal[]): (string | number)[][] {
  const rows = arealy.flatMap((a) => a.pozemky.map((p, i) => riadokPozemku(a.nazov, p, i)));
  return [POZEMOK_HEADER, ...rows];
}

const BUDOVA_HEADER = [
  'Areál', 'Budova', 'Parcela', 'Plocha pôdorysu (m²)', 'NUS (m²)', 'Kategória',
  'Trieda energetickej hospodárnosti', 'Vystavaná pred rokom 1980',
  // Vypočítaná potreba z certifikátu — nie nameraná spotreba (issue #170)
  'Certifikát – potreba na vykurovanie (kWh/(m²·rok))',
  'Certifikát – potreba na teplú vodu (kWh/(m²·rok))',
  'Certifikát – primárna energia (kWh/(m²·rok))',
  'Typ strechy', 'Zateplenie strechy', 'Orientácia strechy na juh (m²)', 'Fasáda orientovaná na juh (m²)',
  'Odvod – kanalizácia (%)', 'Odvod – vodný tok (%)', 'Odvod – retenčná nádrž (%)', 'Odvod – neriešený (%)',
  'Zateplenie fasády', 'Termoizolačné okná (%)', 'LED osvetlenie (%)',
  'Hydraulicky vyregulované ÚK', 'Hydraulicky vyregulované rozvody TV',
  'Zaizolované rozvody tepla a TV', 'Dopadá § 11 ods. 1',
  'Kúrenie plynom', 'Kúrenie elektrinou', 'Tepelné čerpadlo', 'Kúrenie peletami', 'Kúrenie CZT',
  'Celková spotreba (kWh)',
  'Fotovoltika', 'Plocha FV (m²)', 'Batériové úložisko (kWh)',
  'Zelená strecha celkom (m²)', 'Solárne kolektory (m²)',
];

function riadokBudovy(arealNazov: string, b: Budova, i: number): (string | number)[] {
  const yn = (v: 0 | 1) => v ? 'áno' : 'nie';
  const ynu = (v: 0 | 1 | 2) => v === 1 ? 'áno' : v === 0 ? 'nie' : 'neviem';
  const typStrechy = (t: number) => t === 1 ? 'plochá' : t === 2 ? 'šikmá' : 'strmá';
  const zateplenie = (z: number) => z === 1 ? 'áno' : z === 2 ? 'čiastočne' : 'nie';
  return [
    arealNazov, b.nazov || `Budova ${i + 1}`, b.parcela, b.plochaPodorysu, b.uzitkovaPlochaNUS,
    b.kategoriaBudovy ?? '', b.energetickaTrieda ?? '', yn(b.vystavbaPred1980),
    b.certifikatPotrebaVykurovanie || '', b.certifikatPotrebaTeplaVoda || '',
    b.certifikatPrimarnaEnergia || '',
    typStrechy(b.strechaTyp), zateplenie(b.strechaZateplenie), b.strechaOrientovanaPlochaNaJuh, b.fasadaOrientovanaNaJuh,
    b.budovaOdvodVodyKanalizacia, b.budovaOdvodVodyVodnyTok, b.budovaOdvodVodyRetencnaNadrz, b.budovaOdvodVodyNerieseny,
    zateplenie(b.zateplenieFasady), b.termoizolacneOkna, b.osvetlenieLED,
    ynu(b.hydraulickeVyregulovanieUK), ynu(b.hydraulickeVyregulovanieTV),
    ynu(b.izolaciaRozvodov), getParagraf11(b).dopada ? 'áno' : 'nie',
    yn(b.kurenePlynom), yn(b.kurenieElektrinou), yn(b.tepelneCerpadlo), yn(b.kureniePeletami), yn(b.kurenieCZT),
    b.celkovaSpotreba ?? 0,
    yn(b.fotovoltika), b.fotovoltikaPlocha, b.bateriovyUlozisko,
    b.zelenaStrechaPlocha, b.solarnePanelyPlocha,
  ];
}

function sheetExportBudovy(arealy: Areal[]): (string | number)[][] {
  const rows = arealy.flatMap((a) => a.budovy.map((b, i) => riadokBudovy(a.nazov, b, i)));
  return [BUDOVA_HEADER, ...rows];
}

const BG_HEADER = [
  'Areál', 'Názov opatrenia', 'Na parcele', 'Iná budova/pozemok mimo areálu',
  'Ochranné pásma a technická infraštruktúra', 'Potenciál znečistenia', 'Hladina podzemnej vody',
  'Vzdialenosť vodného toku (m)', 'Vplyv na ochranu pred povodňami', 'Vplyv na zraniteľné skupiny', 'Prekážky',
];

function riadokBG(arealNazov: string, bg: BGOpatrenie): (string | number)[] {
  return [
    arealNazov, bg.nazov, bg.naParcele, bg.inaBudovaMimoUSK,
    bg.ochrannePasma, bg.potencialZnecistenia, bg.hladinaPodzemnejVody,
    bg.vzdialenostVodnehoToku, bg.vplyvOchranaPredPovodniami, bg.vplyvZranitelneSkupiny, bg.prekazky,
  ];
}

function sheetExportBG(arealy: Areal[]): (string | number)[][] {
  const rows = arealy.flatMap((a) => a.bgOpatrenia.map((bg) => riadokBG(a.nazov, bg)));
  return [BG_HEADER, ...rows];
}

export function exportComparisonToXlsx(riadky: AreaComparisonRow[], arealy: Areal[]): void {
  const wb = XLSX.utils.book_new();
  const arealyById = new Map(arealy.map((a) => [a.id, a]));

  const addSheet = (name: string, data: (string | number)[][], firstColWidth = 40) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: firstColWidth }];
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet('váhy', sheetVahy(), 55);
  addSheet('Vyhodnotenie', sheetVyhodnotenie(riadky, arealyById));
  addSheet('export-areál', sheetExportAreal(riadky, arealyById));
  addSheet('export-pozemky', sheetExportPozemky(arealy));
  addSheet('export-budovy', sheetExportBudovy(arealy));
  addSheet('export-BG', sheetExportBG(arealy));

  const datum = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `vesma-vyhodnotenie-porovnania-${datum}.xlsx`);
}
