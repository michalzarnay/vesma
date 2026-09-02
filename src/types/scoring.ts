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
