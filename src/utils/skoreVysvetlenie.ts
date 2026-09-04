// Vysvetlenie, ako vznikli body v jednotlivých komponentoch MZI skóre (issue #213).
//
// Modul stojí medzi výpočtom (`mziKlimasken.ts`) a zobrazením: z rozpisu plôch
// a medzivýsledkov poskladá vetu na kartu a tabuľku do modálneho okna, obe
// pripravené na skopírovanie do správy pre obec.
//
// Čísla sa formátujú v slovenskom tvare (desatinná čiarka, medzera ako oddeľovač
// tisícov), aby ich Excel po vložení prevzal ako čísla, nie ako text.

import { Areal } from '../types/areal';
import {
  EnergiaScore, MZIScore, OZEScore, RozpisPodskore, saHodnotiEnergetika, saHodnotiOZE,
} from '../types/scoring';
import {
  Plocha, detailAkumulacie, detailOdtoku, odtokovaPlochaArealu, plochyBudov, plochyOkolia,
  zluceneRiadky,
} from './mziKlimasken';

/** Kľúč komponentu, ktorého sa vysvetlenie týka. */
export type KlucKomponentu =
  | 'okolie' | 'budovy' | 'akumulacia' | 'odtok'
  | 'vhodnostStrechyPreSolar' | 'existujuceOZE' | 'potencialTepelnehoCerpadla' | 'potencialDalsichOZE'
  | 'zateplenie' | 'kvalitaOkien' | 'vykurovaciSystem' | 'vetranie';

/** Vysvetlenie jedného komponentu skóre — veta na kartu a tabuľka do modálu. */
export interface VysvetlenieKomponentu {
  kluc: KlucKomponentu;
  nadpis: string;
  /** Odkaz na metodický list, ak komponent z metodiky vychádza */
  metodika?: string;
  /** Jedna veta na kartu */
  sumar: string;
  hlavicka: string[];
  riadky: string[][];
  /** Ako sa z tabuľky dostal výsledok */
  zaver: string;
}

function cislo(n: number, desatinne = 0): string {
  return n.toLocaleString('sk-SK', {
    minimumFractionDigits: desatinne,
    maximumFractionDigits: desatinne,
  });
}

const m2 = (n: number) => `${cislo(n)} m²`;
const m3 = (n: number) => `${cislo(n, 1)} m³`;

/** Riadky rozpisu plôch zoradené od najväčšieho príspevku, plus súčtový riadok. */
function tabulkaPloch(plochy: Plocha[]): { riadky: string[][]; vymeraSpolu: number; prispevokSpolu: number } {
  const zlucene = zluceneRiadky(plochy).sort((a, b) => b.vymera * b.koef - a.vymera * a.koef);
  const vymeraSpolu = zlucene.reduce((acc, p) => acc + p.vymera, 0);
  const prispevokSpolu = zlucene.reduce((acc, p) => acc + p.vymera * p.koef, 0);

  const riadky = zlucene.map((p) => [
    p.nazov,
    p.kod,
    m2(p.vymera),
    cislo(p.koef, 2),
    cislo(p.vymera * p.koef),
  ]);
  riadky.push(['Spolu', '', m2(vymeraSpolu), '', cislo(prispevokSpolu)]);
  return { riadky, vymeraSpolu, prispevokSpolu };
}

/** Veta typu „najviac prispieva trávnik (800 m²) a stromy (400 m²)". */
function najvacsiPrispievatelia(plochy: Plocha[]): string {
  const kladne = zluceneRiadky(plochy)
    .filter((p) => p.koef > 0)
    .sort((a, b) => b.vymera * b.koef - a.vymera * a.koef)
    .slice(0, 2);
  if (kladne.length === 0) return 'Žiadna plocha areálu neplní funkciu modro-zelenej infraštruktúry.';
  const popis = kladne.map((p) => `${p.nazov.toLowerCase()} (${m2(p.vymera)})`).join(' a ');
  return `Najviac prispieva ${popis}.`;
}

function bezFunkcie(plochy: Plocha[], oznacenie: string): string {
  const nulove = zluceneRiadky(plochy).filter((p) => p.koef === 0);
  const vymera = nulove.reduce((acc, p) => acc + p.vymera, 0);
  return vymera > 0 ? ` ${m2(vymera)} tvorí ${oznacenie} s nulovým koeficientom.` : '';
}

function vysvetlenieOkolia(areal: Areal, score: MZIScore): VysvetlenieKomponentu | null {
  const komponent = score.okolie;
  if (komponent === null || score.koefOkolie === null) return null;

  const plochy = plochyOkolia(areal);
  const { riadky, vymeraSpolu, prispevokSpolu } = tabulkaPloch(plochy);
  const percent = Math.round(score.koefOkolie * 100);

  return {
    kluc: 'okolie',
    nadpis: NADPISY_MZI.okolie,
    metodika: 'KLIMASKEN B-GOV2',
    sumar:
      `${percent} % plochy areálu plní funkciu modro-zelenej infraštruktúry. ` +
      najvacsiPrispievatelia(plochy) +
      bezFunkcie(plochy, 'nepriepustná spevnená plocha'),
    hlavicka: ['Povrch', 'Kód', 'Výmera', 'Koeficient', 'Príspevok'],
    riadky,
    zaver:
      `Koeficient MZI = ${cislo(prispevokSpolu)} / ${cislo(vymeraSpolu)} = ` +
      `${cislo(score.koefOkolie, 2)} → stupeň ${score.stupenOkolie} → ` +
      `${komponent.body} z ${komponent.max} bodov`,
  };
}

function vysvetlenieBudov(areal: Areal, score: MZIScore): VysvetlenieKomponentu | null {
  const komponent = score.budovy;
  if (komponent === null || score.koefBudovy === null) return null;

  const plochy = plochyBudov(areal);
  const { riadky, vymeraSpolu, prispevokSpolu } = tabulkaPloch(plochy);
  const percent = Math.round(score.koefBudovy * 100);

  return {
    kluc: 'budovy',
    nadpis: NADPISY_MZI.budovy,
    metodika: 'KLIMASKEN B-GOV3',
    sumar:
      `${percent} % plochy striech a stien zadržiava zrážkovú vodu. ` +
      najvacsiPrispievatelia(plochy) +
      bezFunkcie(plochy, 'strecha bez vegetácie a zásypu'),
    hlavicka: ['Konštrukcia', 'Kód', 'Výmera', 'Koeficient', 'Príspevok'],
    riadky,
    zaver:
      `Koeficient MZI = ${cislo(prispevokSpolu)} / ${cislo(vymeraSpolu)} = ` +
      `${cislo(score.koefBudovy, 2)} → stupeň ${score.stupenBudovy} → ` +
      `${komponent.body} z ${komponent.max} bodov`,
  };
}

function vysvetlenieAkumulacie(areal: Areal, score: MZIScore): VysvetlenieKomponentu | null {
  const komponent = score.akumulacia;
  if (komponent === null || score.akumulaciaPercent === null) return null;

  const d = detailAkumulacie(areal);
  const rozhoduje =
    d.objemPodlaZrazok !== null && d.objemPodlaSpotreby !== null
      ? (d.objemPodlaZrazok <= d.objemPodlaSpotreby ? 'množstvo zachytiteľnej vody' : 'spotreba vody v areáli')
      : d.objemPodlaZrazok !== null
        ? 'množstvo zachytiteľnej vody (počet osôb nie je zadaný)'
        : 'spotreba vody v areáli (úhrn zrážok nie je zadaný)';

  const riadky: string[][] = [
    ['Úhrn zrážok', 'j', `${cislo(d.zrazky)} mm/rok`],
    ['Využiteľná plocha striech', 'P', m2(d.plochaStriech)],
    ['Zachytená zrážková voda', 'Q = j × P × 0,8 × 0,9 / 1000', `${cislo(d.zachytenaVoda, 1)} m³/rok`],
    ['Počet osôb', 'n', cislo(d.osoby)],
  ];
  if (d.objemPodlaSpotreby !== null) {
    riadky.push(['Potrebný objem podľa spotreby', 'Vv = n × 140 × 0,5 × 20 / 1000', m3(d.objemPodlaSpotreby)]);
  }
  if (d.objemPodlaZrazok !== null) {
    riadky.push(['Potrebný objem podľa zrážok', 'Vp = 20 × Q / 365', m3(d.objemPodlaZrazok)]);
  }
  riadky.push(['Optimálny objem nádrže', 'Vn = min(Vv; Vp)', m3(d.potrebnyObjem ?? 0)]);
  riadky.push(['Skutočný objem nádrží', 'Va', m3(d.skutocnyObjem)]);

  return {
    kluc: 'akumulacia',
    nadpis: NADPISY_MZI.akumulacia,
    metodika: 'KLIMASKEN B-AD10',
    sumar:
      `Nádrže areálu majú ${m3(d.skutocnyObjem)} z optimálnych ${m3(d.potrebnyObjem ?? 0)}, ` +
      `teda ${Math.round(score.akumulaciaPercent)} %. O optimálnom objeme rozhoduje ${rozhoduje}.`,
    hlavicka: ['Veličina', 'Značka a výpočet', 'Hodnota'],
    riadky,
    zaver:
      `Naplnenie = ${cislo(d.skutocnyObjem, 1)} / ${cislo(d.potrebnyObjem ?? 0, 1)} × 100 = ` +
      `${cislo(score.akumulaciaPercent)} % → stupeň ${score.stupenAkumulacia} → ` +
      `${komponent.body} z ${komponent.max} bodov`,
  };
}

function vysvetlenieOdtoku(areal: Areal, score: MZIScore): VysvetlenieKomponentu | null {
  const komponent = score.odtok;
  if (komponent === null || score.podielZadrzanehoOdtoku === null) return null;

  const d = detailOdtoku(areal);
  const zoradene = [...d.ciele].sort((a, b) => b.vymera - a.vymera);
  const riadky = zoradene.map((c) => [c.nazov, c.zadrzana ? 'áno' : 'nie', m2(c.vymera)]);
  riadky.push(['Spolu', '', m2(d.odtokovaPlocha)]);

  const percent = Math.round(score.podielZadrzanehoOdtoku * 100);
  const odvedene = d.odtokovaPlocha - d.zadrzanaPlocha;

  return {
    kluc: 'odtok',
    nadpis: NADPISY_MZI.odtok,
    sumar:
      `Z ${m2(d.odtokovaPlocha)} spevnených plôch a striech zostáva ${m2(d.zadrzanaPlocha)} ` +
      `(${percent} %) na mieste vo vsaku alebo v retencii; ${m2(odvedene)} odteká preč. ` +
      'Priepustné plochy sa sem nerátajú — z nich voda vsiakne tam, kde spadne.',
    hlavicka: ['Kam voda smeruje', 'Zadržaná na mieste', 'Výmera'],
    riadky,
    zaver:
      `Podiel = ${cislo(d.zadrzanaPlocha)} / ${cislo(d.odtokovaPlocha)} = ${percent} % → ` +
      `${komponent.body} z ${komponent.max} bodov`,
  };
}

/** Vysvetlenia všetkých komponentov MZI, ktoré sa dali vypočítať. */
export function vysvetleniaMZI(areal: Areal, score: MZIScore): VysvetlenieKomponentu[] {
  return [
    vysvetlenieOkolia(areal, score),
    vysvetlenieBudov(areal, score),
    vysvetlenieAkumulacie(areal, score),
    vysvetlenieOdtoku(areal, score),
  ].filter((v): v is VysvetlenieKomponentu => v !== null);
}

/** Kľúč komponentu MZI — tie štyri, ktoré tvoria skóre modro-zelenej infraštruktúry. */
export type KlucMZI = 'okolie' | 'budovy' | 'akumulacia' | 'odtok';

/** Názvy komponentov MZI tak, ako ich vidí hodnotiteľ — jedno miesto pre kartu aj export. */
export const NADPISY_MZI: Record<KlucMZI, string> = {
  okolie: 'Priepustnosť a zeleň areálu',
  budovy: 'Zeleň a retencia na budovách',
  akumulacia: 'Akumulácia zrážkovej vody',
  odtok: 'Odtok zo spevnených plôch',
};

/**
 * Prečo komponent MZI nemá výsledok — ktorý údaj v dotazníku chýba, alebo že
 * v areáli nie je čo hodnotiť.
 *
 * „bez údajov" samo osebe hodnotiteľovi nepovie, či na niečo zabudol, alebo či
 * je taký areál. Vysvetlenie preto pomenuje konkrétnu otázku a krok, kde sa
 * údaj dopĺňa — to je podstata #213 aj pre komponenty, ktoré body nedostali.
 *
 * Mapa obsahuje len komponenty, ktoré sa nedali vypočítať. Akumulácia sem
 * nepatrí, keď používateľ sám označil, že nádrž nie je možná (#222) — to nie je
 * chýbajúci údaj, ale odpoveď, a vysvetľuje sa vlastným textom.
 */
export function chybajuceUdajeMZI(areal: Areal, score: MZIScore): Map<KlucMZI, string> {
  const chyba = new Map<KlucMZI, string>();

  if (score.okolie === null) {
    chyba.set('okolie',
      'V kroku Pozemky nie je zadaná výmera žiadneho povrchu — ani prírodného ' +
      '(vsakovacieho), ani spevneného, ani nepriepustného.');
  }

  if (score.budovy === null) {
    chyba.set('budovy',
      'V kroku Budovy nie je zadaná plocha pôdorysu ani plocha zelenej strechy ' +
      'či zelenej steny.');
  }

  if (score.akumulacia === null && areal.nadrzNieJeMozna !== 1) {
    const d = detailAkumulacie(areal);
    const chybaju: string[] = [];
    // Optimálny objem vzniká z dvojice (zrážky × strechy) alebo z počtu osôb;
    // stačí jedna z nich, preto sa vypíšu všetky nevyplnené vstupy.
    if (d.zrazky <= 0) chybaju.push('úhrn zrážok (krok Úvod)');
    if (d.plochaStriech <= 0) chybaju.push('plocha pôdorysu budov (krok Budovy)');
    if (d.osoby <= 0) chybaju.push('počet zamestnancov (krok Úvod)');
    chyba.set('akumulacia',
      `Optimálny objem nádrže sa nedá určiť — chýba ${zoznamPoloziek(chybaju)}.`);
  }

  if (score.odtok === null) {
    chyba.set('odtok', odtokovaPlochaArealu(areal) > 0
      ? 'Plochy sú zadané, ale nie je vyplnené, kam z nich voda odteká — ' +
        'skupina „Odvod vody z pozemku" v kroku Pozemky a odvod vody pri budovách.'
      : 'Areál nemá spevnené ani polopriepustné plochy a strechy, z ktorých by ' +
        'voda odtekala — nie je čo hodnotiť.');
  }

  return chyba;
}

/** „a", „a a b", „a, b a c" — vymenovanie do vety. */
function zoznamPoloziek(polozky: string[]): string {
  if (polozky.length <= 1) return polozky[0] ?? '';
  return `${polozky.slice(0, -1).join(', ')} a ${polozky[polozky.length - 1]}`;
}

// ───────────────────────── OZE a energetika (etapa 2) ─────────────────────────

/**
 * Vysvetlenie podskóre, ktoré vzniká zbieraním bodových položiek.
 *
 * Body sa počítajú ako `orez(round(sucet / delenePoctom) + pausal)`, takže
 * tabuľka vypíše položky a záver ukáže celý ten reťazec vrátane orezania na
 * maximum, ak k nemu došlo.
 */
function vysvetleniePodskore(
  kluc: KlucKomponentu,
  nadpis: string,
  r: RozpisPodskore,
  poznamka?: string,
): VysvetlenieKomponentu {
  const riadky = r.polozky.map((p) => [p.nazov, p.budova ?? '—', znamienko(p.body)]);
  riadky.push(['Súčet položiek', '', znamienko(r.sucet)]);

  const kroky: string[] = [`Súčet ${cislo(r.sucet, 1)} b`];
  if (r.delenePoctom > 0) {
    kroky.push(`delené počtom hodnotených budov (${r.delenePoctom}) = ${cislo(r.sucet / r.delenePoctom, 1)} b`);
  }
  if (r.pausal !== 0) kroky.push(`paušál ${znamienko(r.pausal)} b`);

  const predOrezanim = Math.round(r.delenePoctom > 0 ? r.sucet / r.delenePoctom : r.sucet) + r.pausal;
  if (predOrezanim !== r.body) {
    kroky.push(`orezané na rozsah 0–${r.max}`);
  }

  return {
    kluc,
    nadpis,
    sumar: sumarPodskore(nadpis, r, poznamka),
    hlavicka: ['Položka', 'Budova', 'Body'],
    riadky,
    zaver: `${kroky.join(' → ')} → ${r.body} z ${r.max} bodov`,
  };
}

function znamienko(n: number): string {
  const zaokruhlene = Math.round(n * 10) / 10;
  return zaokruhlene > 0 ? `+${cislo(zaokruhlene, zaokruhlene % 1 === 0 ? 0 : 1)}` : cislo(zaokruhlene, zaokruhlene % 1 === 0 ? 0 : 1);
}

function sumarPodskore(nadpis: string, r: RozpisPodskore, poznamka?: string): string {
  const zaklad = `${nadpis}: ${r.body} z ${r.max} b.`;
  if (r.polozky.length === 0) {
    return `${zaklad} Žiadna položka do skóre neprispela.${poznamka ? ` ${poznamka}` : ''}`;
  }

  const zoradene = [...r.polozky].sort((a, b) => Math.abs(b.body) - Math.abs(a.body));
  const kladne = zoradene.filter((p) => p.body > 0).slice(0, 2);
  const zaporne = zoradene.filter((p) => p.body < 0);

  const casti: string[] = [];
  if (kladne.length > 0) {
    casti.push(`Najviac pridáva ${kladne.map((p) => `${p.nazov.toLowerCase()} (${znamienko(p.body)})`).join(' a ')}.`);
  }
  if (zaporne.length > 0) {
    const unikatne = [...new Set(zaporne.map((p) => p.nazov.toLowerCase()))];
    casti.push(`Body odoberá ${unikatne.join(', ')}.`);
  }
  if (poznamka) casti.push(poznamka);
  return [zaklad, ...casti].join(' ');
}

/** Vysvetlenia podskóre OZE. Prázdne, keď sa OZE nehodnotí (areál bez budov). */
export function vysvetleniaOZE(score: OZEScore): VysvetlenieKomponentu[] {
  if (!saHodnotiOZE(score)) return [];
  const r = score.rozpis;
  return [
    vysvetleniePodskore('vhodnostStrechyPreSolar', 'Vhodnosť strechy pre solár', r.vhodnostStrechyPreSolar,
      'Počítajú sa len ploché a málo šikmé strechy do 15°.'),
    vysvetleniePodskore('existujuceOZE', 'Existujúce OZE', r.existujuceOZE),
    vysvetleniePodskore('potencialTepelnehoCerpadla', 'Potenciál tepelného čerpadla', r.potencialTepelnehoCerpadla,
      'Sezónne nevykurované stavby sa sem nezapočítavajú — tepelné čerpadlo tam nedáva zmysel.'),
    vysvetleniePodskore('potencialDalsichOZE', 'Potenciál ďalších OZE', r.potencialDalsichOZE),
  ];
}

/** Vysvetlenia podskóre energetiky. Prázdne, keď sa energetika nehodnotí. */
export function vysvetleniaEnergetiky(score: EnergiaScore): VysvetlenieKomponentu[] {
  if (!saHodnotiEnergetika(score)) return [];
  const r = score.rozpis;
  const sezonne = score.vynechanychSezonnych > 0
    ? `${score.vynechanychSezonnych === 1 ? 'Jedna sezónna nevykurovaná stavba je' : `${score.vynechanychSezonnych} sezónnych nevykurovaných stavieb je`} z hodnotenia vynechaná.`
    : undefined;

  return [
    vysvetleniePodskore('zateplenie', 'Zateplenie', r.zateplenie, sezonne),
    vysvetleniePodskore('kvalitaOkien', 'Kvalita okien', r.kvalitaOkien, sezonne),
    vysvetleniePodskore('vykurovaciSystem', 'Vykurovací systém', r.vykurovaciSystem, sezonne),
    vysvetleniePodskore('vetranie', 'Vetranie a LED', r.vetranie, sezonne),
  ];
}

/**
 * Tabuľka ako text oddelený tabulátormi.
 *
 * Word aj Excel z takého textu spravia skutočnú tabuľku (Word: Vložiť →
 * Previesť text na tabuľku, Excel priamo pri vložení).
 */
export function tabulkaAkoText(v: VysvetlenieKomponentu): string {
  const nadpis = v.metodika ? `${v.nadpis} (${v.metodika})` : v.nadpis;
  return [
    nadpis,
    v.hlavicka.join('\t'),
    ...v.riadky.map((r) => r.join('\t')),
    '',
    v.zaver,
  ].join('\n');
}
