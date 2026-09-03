import { ScoringWeights } from './areal';

export interface ScoreResult {
  celkove: number; // 0-100
  mzi: MZIScore;
  oze: OZEScore;
  energia: EnergiaScore;
  mziPotencial: number; // absolútny potenciál v m²·váha jednotkách (vyššie = viac možností)
}

export interface MZIScore {
  celkove: number;
  podielPriepustnychPloch: number; // 0-25
  existujuceOpatrenia: number; // 0-25
  stavZelene: number; // 0-25
  potencialZlepsenia: number; // 0-25
}

export interface OZEScore {
  celkove: number;
  vhodnostStrechyPreSolar: number; // 0-30
  existujuceOZE: number; // 0-20
  potencialTepelnehoCerpadla: number; // 0-25
  potencialDalsichOZE: number; // 0-25
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
 * Vážené celkové skóre. Ak sa energetika nehodnotí, jej váha sa do súčtu
 * nezapočíta — inak by nulové skóre nehodnotenej oblasti stiahlo celý areál dole.
 */
export function vazeneCelkoveSkore(score: ScoreResult, vahy: ScoringWeights): number {
  const vahaEnergia = saHodnotiEnergetika(score.energia) ? vahy.energia : 0;
  const sumVah = vahy.mzi + vahy.oze + vahaEnergia;
  if (sumVah === 0) return 0;
  return Math.round(
    (score.mzi.celkove * vahy.mzi + score.oze.celkove * vahy.oze + score.energia.celkove * vahaEnergia) / sumVah,
  );
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
