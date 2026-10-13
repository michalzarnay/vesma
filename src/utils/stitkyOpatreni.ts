// Štítky priority a kategórie opatrení ako dáta (podnet 141).
//
// Priorita a kategória sa predtým líšili len farbou a veľkosťou písma — stredná
// priorita aj energetika boli jantárové, a kto farby nerozlišuje, videl dva
// rovnaké štítky. Preto sa líšia aj TVAROM (priorita je plná pilulka, kategória
// obrys so zaoblenými rohmi), TEXTOM (priorita začína slovom „Priorita:") a IKONOU.
// Farba je len doplnok. Vzťah „dva štítky sú rozlíšiteľné" je funkcia
// `stitkyRozlisitelne()`, aby sa dal testovať bez vykresľovania.

import type { OpatrenieKategoria, Priorita } from '../types/catalog';

export type TvarStitku = 'pilulka' | 'obrys';
export type RodStitku = 'priorita' | 'kategoria';
export type IkonaStitku =
  | 'signal-high' | 'signal-medium' | 'signal-low'
  | 'droplets' | 'sun' | 'zap';

export interface Stitok {
  rod: RodStitku;
  /** Text, ktorý štítok nesie — sám o sebe stačí na rozlíšenie, bez farby. */
  text: string;
  /** Dlhší popis do `title` / čítačky obrazovky. */
  popis: string;
  tvar: TvarStitku;
  ikona: IkonaStitku;
  /** Názov farby v palete rodu — priorita a kategória nezdieľajú ani jednu. */
  farba: string;
}

const PRIORITA: Record<Priorita, Pick<Stitok, 'ikona' | 'farba'>> = {
  'vysoká': { ikona: 'signal-high', farba: 'cervena' },
  'stredná': { ikona: 'signal-medium', farba: 'oranzova' },
  'nízka': { ikona: 'signal-low', farba: 'siva' },
};

const KATEGORIA: Record<OpatrenieKategoria, { text: string; popis: string; ikona: IkonaStitku; farba: string }> = {
  MZI: { text: 'MZI', popis: 'Kategória: modro-zelená infraštruktúra', ikona: 'droplets', farba: 'zelena' },
  OZE: { text: 'OZE', popis: 'Kategória: obnoviteľné zdroje energie', ikona: 'sun', farba: 'modra' },
  ENERGETIKA: { text: 'Energetika', popis: 'Kategória: energetická efektívnosť', ikona: 'zap', farba: 'fialova' },
};

/** Mapovanie priorita → štítok. Text vždy začína slovom „Priorita:". */
export function stitokPriority(priorita: Priorita): Stitok {
  const p = PRIORITA[priorita];
  return {
    rod: 'priorita',
    text: `Priorita: ${priorita}`,
    popis: `Priorita opatrenia: ${priorita}`,
    tvar: 'pilulka',
    ikona: p.ikona,
    farba: p.farba,
  };
}

/** Mapovanie kategória → štítok. */
export function stitokKategorie(kategoria: OpatrenieKategoria): Stitok {
  const k = KATEGORIA[kategoria];
  return { rod: 'kategoria', text: k.text, popis: k.popis, tvar: 'obrys', ikona: k.ikona, farba: k.farba };
}

/**
 * Dva štítky sú rozlíšiteľné aj bez farby, keď sa líšia textom a zároveň
 * tvarom alebo ikonou. Farba do toho zámerne nevstupuje.
 */
export function stitkyRozlisitelne(a: Stitok, b: Stitok): boolean {
  return a.text !== b.text && (a.tvar !== b.tvar || a.ikona !== b.ikona);
}
