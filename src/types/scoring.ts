import { ScoringWeights } from './areal';

export interface ScoreResult {
  celkove: number; // 0-100
  mzi: MZIScore;
  oze: OZEScore;
  energia: EnergiaScore;
  mziPotencial: number; // absolútny potenciál v m²·váha jednotkách (vyššie = viac možností)
}

/** Päťstupňová škála Klimaskenu — A = najlepší stav, E = najhorší. */
export type KlimaskenStupen = 'A' | 'B' | 'C' | 'D' | 'E';

/** Jeden komponent MZI skóre — získané body a maximum, ktoré mohol dosiahnuť. */
export interface MZIKomponent {
  body: number;
  max: number;
}

/**
 * MZI skóre podľa metodiky Klimaskenu (metodické listy B-GOV2, B-GOV3, B-AD10).
 * Komponent má hodnotu `null`, ak preň v dotazníku nie sú údaje — do celkového
 * skóre sa vtedy nezapočíta (pozri `calculateMZI` v `utils/mziKlimasken.ts`).
 */
export interface MZIScore {
  celkove: number; // 0-100
  /** B-GOV2 — priepustnosť a zeleň plôch areálu */
  okolie: MZIKomponent | null;
  /** B-GOV3 — zeleň a retencia na strechách a fasádach */
  budovy: MZIKomponent | null;
  /** B-AD10 — kapacita akumulácie zrážkovej vody */
  akumulacia: MZIKomponent | null;
  /** Podiel plôch, z ktorých voda ide do vsaku alebo retencie (doplnok VESMA) */
  odtok: MZIKomponent | null;

  /** Vážený koeficient MZI okolia (0–1) podľa B-GOV2 */
  koefOkolie: number | null;
  /** Vážený koeficient MZI budov (0–1) podľa B-GOV3 */
  koefBudovy: number | null;
  /** Naplnenie optimálneho objemu akumulačných nádrží (%) podľa B-AD10 */
  akumulaciaPercent: number | null;
  /** Podiel zadržaného odtoku (0–1) */
  podielZadrzanehoOdtoku: number | null;

  stupenOkolie: KlimaskenStupen | null;
  stupenBudovy: KlimaskenStupen | null;
  stupenAkumulacia: KlimaskenStupen | null;
}

/** Jedna položka, ktorá v podskóre pridala alebo odobrala body. */
export interface PolozkaSkore {
  nazov: string;
  body: number;
  /** Ktorej budovy sa týka — pri parametroch za celý areál chýba. */
  budova?: string;
}

/**
 * Rozpis jedného podskóre OZE alebo energetiky (issue #213, etapa 2).
 *
 * Body sa počítajú ako `orez(round(sucet / delenePoctom) + pausal)`. Keď sa
 * podskóre nepriemeruje cez budovy, `delenePoctom` je 0.
 */
export interface RozpisPodskore {
  polozky: PolozkaSkore[];
  /** Súčet položiek pred spriemerovaním */
  sucet: number;
  /** Počet budov, ktorými sa súčet delí; 0 = nedelí sa */
  delenePoctom: number;
  /** Paušál pripočítaný po spriemerovaní */
  pausal: number;
  /** Výsledné body po zaokrúhlení a orezaní — zhodné s plochým poľom skóre */
  body: number;
  max: number;
}

export interface OZEScore {
  celkove: number;
  vhodnostStrechyPreSolar: number; // 0-30
  existujuceOZE: number; // 0-20
  potencialTepelnehoCerpadla: number; // 0-25
  potencialDalsichOZE: number; // 0-25
  /** Počet budov, z ktorých sa OZE skóre počítalo. */
  hodnotenychBudov: number;
  /**
   * Rozpis, za čo body sú. Pole `body` každého rozpisu je zhodné s plochou
   * hodnotou vyššie — plochá zostáva kvôli existujúcim konzumentom skóre.
   */
  rozpis: {
    vhodnostStrechyPreSolar: RozpisPodskore;
    existujuceOZE: RozpisPodskore;
    potencialTepelnehoCerpadla: RozpisPodskore;
    potencialDalsichOZE: RozpisPodskore;
  };
}

export interface EnergiaScore {
  celkove: number;
  zateplenie: number; // 0-30
  kvalitaOkien: number; // 0-20
  vykurovaciSystem: number; // 0-25
  vetranie: number; // 0-25
  /** Počet budov, ktoré do hodnotenia vstúpili (bez sezónnych nevykurovaných stavieb). */
  hodnotenychBudov: number;
  /** Počet sezónnych nevykurovaných stavieb vynechaných z hodnotenia. */
  vynechanychSezonnych: number;
  /** Rozpis, za čo body sú — pozri `OZEScore.rozpis`. */
  rozpis: {
    zateplenie: RozpisPodskore;
    kvalitaOkien: RozpisPodskore;
    vykurovaciSystem: RozpisPodskore;
    vetranie: RozpisPodskore;
  };
}

/**
 * Má sa energetické skóre vôbec brať do úvahy?
 *
 * Nie, keď do hodnotenia nevstúpila ani jedna budova — či už preto, že areál
 * budovy nemá (issue #204), alebo preto, že sú všetky sezónne nevykurované
 * stavby (issue #203). Oba prípady sú to isté: nie je čo hodnotiť a nula by sa
 * čítala ako „veľký priestor na zlepšenie".
 */
export function saHodnotiEnergetika(energia: EnergiaScore): boolean {
  return energia.hodnotenychBudov > 0;
}

/** Prečo sa energetika nehodnotí — rozlišuje texty pre používateľa. */
export function dovodNehodnoteniaEnergetiky(energia: EnergiaScore): 'bezBudov' | 'lenSezonne' | null {
  if (saHodnotiEnergetika(energia)) return null;
  return energia.vynechanychSezonnych > 0 ? 'lenSezonne' : 'bezBudov';
}

/**
 * Má sa OZE skóre brať do úvahy? (issue #205)
 *
 * Celé stojí na budovách — vhodnosť strechy pre solár, existujúce OZE, potenciál
 * tepelného čerpadla aj potenciál ďalších OZE. Bez jedinej budovy nie je z čoho
 * počítať a nula by sa čítala ako zlý stav.
 *
 * Sezónne nevykurované stavby sa tu NEvynechávajú — z OZE ich netýka len podiel
 * „potenciál tepelného čerpadla" (pozri src/utils/sezonnaStavba.ts); strecha
 * chaty je pre fotovoltiku rovnako použiteľná ako ktorákoľvek iná.
 */
export function saHodnotiOZE(oze: OZEScore): boolean {
  return oze.hodnotenychBudov > 0;
}

/**
 * Oblasti, ktoré do celkového skóre vstupujú. Nehodnotená oblasť sa vynecháva —
 * jej nula by inak stiahla celý areál dole (issues #203, #204, #205).
 */
export function hodnoteneOblasti(score: ScoreResult): Array<{ oblast: 'mzi' | 'oze' | 'energia'; skore: number }> {
  const oblasti: Array<{ oblast: 'mzi' | 'oze' | 'energia'; skore: number }> = [
    { oblast: 'mzi', skore: score.mzi.celkove },
  ];
  if (saHodnotiOZE(score.oze)) oblasti.push({ oblast: 'oze', skore: score.oze.celkove });
  if (saHodnotiEnergetika(score.energia)) oblasti.push({ oblast: 'energia', skore: score.energia.celkove });
  return oblasti;
}

/**
 * Vážené celkové skóre. Váhy nehodnotených oblastí sa do súčtu nezapočítajú.
 */
export function vazeneCelkoveSkore(score: ScoreResult, vahy: ScoringWeights): number {
  const hodnotene = hodnoteneOblasti(score);
  const sucet = hodnotene.reduce((acc, o) => acc + o.skore * vahy[o.oblast], 0);
  const sumVah = hodnotene.reduce((acc, o) => acc + vahy[o.oblast], 0);
  if (sumVah === 0) return 0;
  return Math.round(sucet / sumVah);
}

export type ScoreLevel = 'cervena' | 'oranzova' | 'zlta' | 'zelena' | 'tmavaZelena';

export interface ScoreLevelInfo {
  level: ScoreLevel;
  color: string;
  bgColor: string;
  label: string;
}

export function getScoreLevel(score: number): ScoreLevelInfo {
  if (score <= 30) return { level: 'cervena', color: '#DC2626', bgColor: '#FEE2E2', label: 'Veľký priestor na zlepšenie' };
  if (score <= 50) return { level: 'oranzova', color: '#EA580C', bgColor: '#FFF7ED', label: 'Priemerný stav' };
  if (score <= 70) return { level: 'zlta', color: '#CA8A04', bgColor: '#FEFCE8', label: 'Dobrý základ' };
  if (score <= 85) return { level: 'zelena', color: '#16A34A', bgColor: '#F0FDF4', label: 'Veľmi dobrý stav' };
  return { level: 'tmavaZelena', color: '#166534', bgColor: '#DCFCE7', label: 'Vynikajúci stav' };
}
