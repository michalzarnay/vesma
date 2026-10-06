// Obsah karty Výsledky ako dáta — jedno miesto pre kartu aj PDF export.
//
// Karta aj PDF ukazujú to isté: ktoré oblasti sa hodnotia, rozpis komponentov
// skóre, zadané entity. Podmienky („oblasť mimo rozsahu", „areál bez budov")
// sa preto skladajú tu a nie dvakrát v dvoch súboroch — inak sa raz rozídu
// (CLAUDE.md, „oprav triedu, nie výskyt").

import { Areal, ScoringWeights } from '../types/areal';
import {
  EnergiaScore, KlimaskenStupen, MZIKomponent, ScoreResult,
  dovodNehodnoteniaEnergetiky, saHodnotiEnergetika, saHodnotiMZI, saHodnotiOZE, vazeneCelkoveSkore,
} from '../types/scoring';
import {
  VysvetlenieKomponentu, chybajuceUdajeMZI, vysvetleniaEnergetiky, vysvetleniaMZI, vysvetleniaOZE,
} from './skoreVysvetlenie';
import { formatArea } from './formatters';
import { mapujeEnergiu, mapujeVodu } from './rozsahMapovania';

export const fmtNum = (n: number | undefined, digits = 0) =>
  n === undefined ? '–' : n.toLocaleString('sk', { maximumFractionDigits: digits });

/** Legenda skratiek — `title` je dlhý názov do bubliny, `popis` text v legende. */
export const SKRATKY: Array<{ skratka: string; title: string; popis: string }> = [
  { skratka: 'MZI', title: 'Modro-zelená infraštruktúra', popis: 'Modro-zelená infraštruktúra' },
  { skratka: 'OZE', title: 'Obnoviteľné zdroje energie', popis: 'Obnoviteľné zdroje energie' },
  { skratka: 'TČ', title: 'Tepelné čerpadlo', popis: 'Tepelné čerpadlo' },
  { skratka: 'NUS', title: 'Netto úžitková plocha', popis: 'Netto úžitková plocha' },
  { skratka: 'FV', title: 'Fotovoltika', popis: 'Fotovoltika (solárne panely)' },
  { skratka: 'CZT', title: 'Centrálne zásobovanie teplom', popis: 'Centrálne zásobovanie teplom' },
  { skratka: 'LED', title: 'Light Emitting Diode – dióda emitujúca svetlo', popis: 'Úsporné osvetlenie' },
];

export type KlucOblasti = 'mzi' | 'oze' | 'energia';

export const NAZOV_OBLASTI_KRATKY: Record<KlucOblasti, string> = { mzi: 'MZI', oze: 'OZE', energia: 'Energia' };

export const NAZOV_OBLASTI_DLHY = {
  mzi: 'Modro-zelená infraštruktúra',
  oze: 'Obnoviteľné zdroje energie',
  energia: 'Energetická efektívnosť',
} as const;

export const VYSVETLENIE_OZE_BEZ_BUDOV =
  'Areál nemá zadanú žiadnu budovu. OZE skóre stojí na strechách a zdrojoch tepla budov, takže ho nie je z čoho počítať — do celkového skóre nevstupuje.';

/** Prečo sa energetika nehodnotí — bez budov, alebo sú všetky budovy sezónne nevykurované. */
export function vysvetlenieEnergetikaNehodnotena(energia: EnergiaScore): string {
  if (dovodNehodnoteniaEnergetiky(energia) === 'bezBudov') {
    return 'Areál nemá zadanú žiadnu budovu. Energetickú efektívnosť nie je z čoho počítať, preto do celkového skóre nevstupuje.';
  }
  const pocet = energia.vynechanychSezonnych;
  const uvod = pocet === 1
    ? 'Jediná stavba areálu je sezónna nevykurovaná (letné sídlo).'
    : `Všetkých ${pocet} stavieb areálu je sezónnych nevykurovaných (letné sídlo).`;
  return `${uvod} Zateplenie ani obnova vykurovania v nich nemajú zmysel, preto sa areálu nepočíta ani potenciál zlepšenia v tejto oblasti.`;
}

/** Ktoré oblasti sa vo Výsledkoch ukazujú a hodnotia, a z toho vážené skóre. */
export interface ZakladVysledkov {
  /** Oblasť mimo rozsahu mapovania sa vo Výsledkoch vôbec neukazuje. */
  ukazVodu: boolean;
  ukazEnergiu: boolean;
  hodnotiOZE: boolean;
  hodnotiEnergetiku: boolean;
  /** Oblasti, pre ktoré má váha zmysel. */
  oblastiVah: KlucOblasti[];
  sumVah: number;
  vazeneSkore: number;
  /** Body radarového grafu — nehodnotená oblasť sa v ňom neukazuje ako nula. */
  radar: Array<{ subject: string; value: number }>;
}

export function zakladVysledkov(areal: Areal, score: ScoreResult): ZakladVysledkov {
  const ukazVodu = mapujeVodu(areal);
  const ukazEnergiu = mapujeEnergiu(areal);
  const hodnotiOZE = saHodnotiOZE(score.oze);
  const hodnotiEnergetiku = saHodnotiEnergetika(score.energia);
  const { mzi, oze, energia } = areal.vahy;
  const sumVah = mzi + oze + energia;
  return {
    ukazVodu,
    ukazEnergiu,
    hodnotiOZE,
    hodnotiEnergetiku,
    oblastiVah: (['mzi', 'oze', 'energia'] as const).filter((o) => (o === 'mzi' ? ukazVodu : ukazEnergiu)),
    sumVah,
    vazeneSkore: sumVah > 0 ? vazeneCelkoveSkore(score, areal.vahy) : score.celkove,
    radar: [
      ...(saHodnotiMZI(score.mzi) ? [{ subject: 'MZI', value: score.mzi.celkove }] : []),
      ...(hodnotiOZE ? [{ subject: 'OZE', value: score.oze.celkove }] : []),
      ...(hodnotiEnergetiku ? [{ subject: 'Energia', value: score.energia.celkove }] : []),
    ],
  };
}

/** Text váh pod celkovým skóre; `null`, keď sa na karte neukazuje. */
export function textVah(vahy: ScoringWeights, zaklad: ZakladVysledkov): string | null {
  if (zaklad.sumVah === 3 || zaklad.oblastiVah.length <= 1) return null;
  return `Váhy: ${zaklad.oblastiVah.map((o) => `${NAZOV_OBLASTI_KRATKY[o]}×${vahy[o]}`).join(' ')}`;
}

export interface ScoreDetailItem {
  label: string;
  /** `null` = komponent sa nedal vypočítať, do skóre sa nezapočítal */
  score: number | null;
  max: number;
  /** Doplnková hodnota indikátora (koeficient, percento, stupeň A–E) */
  hodnota?: string | null;
  /** Vysvetlenie, za čo body sú — veta na kartu a tabuľka do modálu (#213) */
  vysvetlenie?: VysvetlenieKomponentu;
  /**
   * Prečo sa komponent nehodnotí, keď to nie je chýbajúcimi údajmi —
   * napr. nádrž nie je možné inštalovať (#215).
   */
  dovodNehodnotenia?: string | null;
  /** Prečo komponent nemá výsledok — ktorý údaj v dotazníku chýba (#213). */
  coChyba?: string;
}

/** Jedna karta rozpisu skóre (MZI, OZE, Energetika). */
export interface KartaDetailuSkore {
  title: string;
  items: ScoreDetailItem[];
  poznamka?: string;
}

/** Rozloží komponent MZI skóre na tvar, ktorý zobrazuje karta. */
function komponentBody(
  komponent: MZIKomponent | null,
  max: number,
): { score: number | null; max: number } {
  return komponent === null ? { score: null, max } : { score: komponent.body, max: komponent.max };
}

function koeficientText(koef: number | null, stupen: KlimaskenStupen | null): string | null {
  if (koef === null || stupen === null) return null;
  return `${koef.toFixed(2)} · ${stupen}`;
}

/** Karty rozpisu skóre, ktoré sa naozaj vykreslia — nehodnotená oblasť kartu nemá. */
export function kartyDetailuSkore(areal: Areal, score: ScoreResult): KartaDetailuSkore[] {
  const zaklad = zakladVysledkov(areal, score);
  const vysvetlenia = new Map(
    [
      ...vysvetleniaMZI(areal, score.mzi),
      ...vysvetleniaOZE(score.oze),
      ...vysvetleniaEnergetiky(score.energia),
    ].map((v) => [v.kluc, v]),
  );
  // Prečo komponent MZI nedostal body — „bez údajov" samo nepovie, čo doplniť (#213).
  const chybaMZI = chybajuceUdajeMZI(areal, score.mzi);
  const karty: KartaDetailuSkore[] = [];

  if (zaklad.ukazVodu) {
    karty.push({
      title: 'MZI',
      items: [
        {
          label: 'Priepustnosť a zeleň areálu',
          ...komponentBody(score.mzi.okolie, 45),
          hodnota: koeficientText(score.mzi.koefOkolie, score.mzi.stupenOkolie),
          vysvetlenie: vysvetlenia.get('okolie'),
          coChyba: chybaMZI.get('okolie'),
        },
        {
          label: 'Zeleň a retencia na budovách',
          ...komponentBody(score.mzi.budovy, 25),
          hodnota: koeficientText(score.mzi.koefBudovy, score.mzi.stupenBudovy),
          vysvetlenie: vysvetlenia.get('budovy'),
          coChyba: chybaMZI.get('budovy'),
        },
        {
          label: 'Akumulácia zrážkovej vody',
          ...komponentBody(score.mzi.akumulacia, 15),
          hodnota: score.mzi.akumulaciaPercent === null || score.mzi.stupenAkumulacia === null
            ? null
            : `${Math.round(score.mzi.akumulaciaPercent)} % · ${score.mzi.stupenAkumulacia}`,
          vysvetlenie: vysvetlenia.get('akumulacia'),
          coChyba: chybaMZI.get('akumulacia'),
          dovodNehodnotenia: areal.nadrzNieJeMozna === 1
            ? `Nádrž nie je možné inštalovať${areal.nadrzNemoznaDovod.trim() ? ` — ${areal.nadrzNemoznaDovod.trim()}` : ''}.`
            : null,
        },
        {
          label: 'Odtok zo spevnených plôch',
          ...komponentBody(score.mzi.odtok, 15),
          hodnota: score.mzi.podielZadrzanehoOdtoku === null
            ? null
            : `${Math.round(score.mzi.podielZadrzanehoOdtoku * 100)} %`,
          vysvetlenie: vysvetlenia.get('odtok'),
          coChyba: chybaMZI.get('odtok'),
        },
      ],
      poznamka: 'Koeficienty MZI a päťstupňová škála A–E podľa metodiky KLIMASKEN (metodické listy B-GOV2, B-GOV3, B-AD10). Komponenty bez údajov sa do skóre nezapočítavajú.',
    });
  }
  if (zaklad.hodnotiOZE) {
    karty.push({
      title: 'OZE',
      items: [
        { label: 'Vhodnosť strechy', score: score.oze.vhodnostStrechyPreSolar, max: 30, vysvetlenie: vysvetlenia.get('vhodnostStrechyPreSolar') },
        { label: 'Existujúce OZE', score: score.oze.existujuceOZE, max: 20, vysvetlenie: vysvetlenia.get('existujuceOZE') },
        { label: 'Potenciál tepelného čerpadla (TČ)', score: score.oze.potencialTepelnehoCerpadla, max: 25, vysvetlenie: vysvetlenia.get('potencialTepelnehoCerpadla') },
        { label: 'Potenciál ďalších OZE', score: score.oze.potencialDalsichOZE, max: 25, vysvetlenie: vysvetlenia.get('potencialDalsichOZE') },
      ],
    });
  }
  if (zaklad.hodnotiEnergetiku) {
    karty.push({
      title: 'Energetika',
      items: [
        { label: 'Zateplenie', score: score.energia.zateplenie, max: 30, vysvetlenie: vysvetlenia.get('zateplenie') },
        { label: 'Kvalita okien', score: score.energia.kvalitaOkien, max: 20, vysvetlenie: vysvetlenia.get('kvalitaOkien') },
        { label: 'Vykurovací systém', score: score.energia.vykurovaciSystem, max: 25, vysvetlenie: vysvetlenia.get('vykurovaciSystem') },
        { label: 'Vetranie/LED', score: score.energia.vetranie, max: 25, vysvetlenie: vysvetlenia.get('vetranie') },
      ],
    });
  }
  return karty;
}

/** Jedna zadaná entita v prehľade — čím sa volá a čím je bližšie určená. */
export interface PolozkaPrehladu {
  id: string;
  nazov: string;
  popis: string;
}

/** Skupina entít jedného typu (Pozemky, Budovy, Iné stavby, opatrenia pre MZI). */
export interface SkupinaPrehladu {
  nadpis: string;
  krok: number;
  polozky: PolozkaPrehladu[];
  /** Prečo skupina nevstupuje do skóre; `undefined` = do skóre vstupuje. */
  mimoSkore?: string;
}

/** Spojí neprázdne časti popisu do jedného riadku. */
function popis(...casti: (string | false | undefined)[]): string {
  return casti.filter((c): c is string => Boolean(c)).join(' · ');
}

/**
 * Čo používateľ zadal v dotazníku, po typoch entít.
 *
 * Zoznam je jedno miesto, kam sa pridá nový typ entity — pribudnutím položky
 * sa objaví v prehľade aj v PDF bez ďalšieho zásahu (`CLAUDE.md`, „oprav
 * triedu, nie výskyt"). Rovnaké entity nesie aj export, pozri `harkyExportu()`.
 */
export function skupinyPrehladu(areal: Areal): SkupinaPrehladu[] {
  return [
    {
      nadpis: 'Pozemky',
      krok: 2,
      polozky: areal.pozemky.map((p, i) => ({
        id: p.id,
        nazov: p.parcela || p.aktualneVyuzitie || `Parcela ${i + 1}`,
        popis: popis(
          p.parcela && p.aktualneVyuzitie,
          p.celkovaVymera > 0 && `celková výmera ${formatArea(p.celkovaVymera)}`,
          p.plochaBezBudov > 0 && `bez budov ${formatArea(p.plochaBezBudov)}`,
        ),
      })),
    },
    {
      nadpis: 'Budovy',
      krok: 3,
      polozky: areal.budovy.map((b, i) => ({
        id: b.id,
        nazov: b.nazov || `Budova ${i + 1}`,
        popis: popis(
          b.parcela && `parcela ${b.parcela}`,
          b.uzitkovaPlochaNUS > 0 && `NUS ${formatArea(b.uzitkovaPlochaNUS)}`,
          b.sezonnaNevykurovana === 1 && 'sezónna nevykurovaná',
        ),
      })),
    },
    {
      nadpis: 'Iné stavby',
      krok: 4,
      // Zastavaná plocha vstupuje do MZI ako nepriepustná plocha (#233).
      mimoSkore: 'Zastavaná plocha vstupuje do skóre ako nepriepustná plocha.',
      polozky: areal.ineStavby.map((s, i) => ({
        id: s.id,
        nazov: s.nazov || `Stavba ${i + 1}`,
        popis: popis(
          s.typStavby,
          s.parcela && `parcela ${s.parcela}`,
          s.zastavanaPlocha > 0 && `zastavaná plocha ${formatArea(s.zastavanaPlocha)}`,
        ),
      })),
    },
    {
      nadpis: 'Zamýšľané opatrenia pre MZI',
      krok: 5,
      // Zamýšľané opatrenie ešte nie je zrealizované, takže hodnotenie nemení (#223).
      mimoSkore: 'Sú to plány, nie stav areálu — do skóre preto nevstupujú.',
      polozky: areal.bgOpatrenia.map((o, i) => ({
        id: o.id,
        nazov: o.nazov || `Opatrenie ${i + 1}`,
        popis: popis(
          o.naParcele && `na parcele ${o.naParcele}`,
          o.prekazky && `prekážky: ${o.prekazky}`,
        ),
      })),
    },
  ];
}
