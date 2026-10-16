import { OBCE_ZAZNAMY, type ZaznamObce } from '../data/slovakLocations';

/**
 * Obec → okres → kraj podľa Registra adries (podnety 99 a 100).
 *
 * Názov obce nie je jednoznačný: 95 názvov (Riečka, Selce, Podhorie…) je vo
 * viacerých okresoch. Okres sa preto nikdy nehádá, predvyplní sa len vtedy, keď
 * ho názov určuje jednoznačne, alebo keď ho mapér už zvolil.
 */

export interface OkresAKraj {
  okres: string;
  kraj: string;
}

function normalizuj(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** Okresy (a kraje), v ktorých leží obec s týmto názvom. Prázdne pole = neznáma obec. */
export function okresyObce(obec: string, zaznamy: readonly ZaznamObce[] = OBCE_ZAZNAMY): OkresAKraj[] {
  const hladany = normalizuj(obec);
  if (!hladany) return [];
  return zaznamy
    .filter(([nazov]) => normalizuj(nazov) === hladany)
    .map(([, okres, kraj]) => ({ okres, kraj }));
}

export interface PolohaArealu {
  kraj: string;
  okres: string;
}

/**
 * Čo sa má po zadaní obce doplniť do kraja a okresu.
 *
 * - Obec je v jedinom okrese: doplní sa okres aj kraj. Keď sa obec zmenila
 *   (mapér ju práve zvolil), prepíšu sa aj nezhodné hodnoty, lebo sú pozostatkom
 *   predošlej obce. Keď sa obec nezmenila, dopĺňajú sa len prázdne polia a ručná
 *   voľba mapéra ostane.
 * - Obec je vo viacerých okresoch: okres sa nehádá. Zachová sa, ak je medzi
 *   možnými. Kraj sa doplní, ak je pre všetky možnosti rovnaký.
 * - Neznáma obec (iná krajina, preklep): nič sa nemení.
 *
 * Vráti len polia, ktoré sa majú zmeniť.
 */
export function predvyplnenieZObce(
  obec: string,
  aktualne: PolohaArealu,
  obecSaZmenila: boolean,
  zaznamy: readonly ZaznamObce[] = OBCE_ZAZNAMY,
): Partial<PolohaArealu> {
  const moznosti = okresyObce(obec, zaznamy);
  if (moznosti.length === 0) return {};

  const zhoda = moznosti.some((m) => m.okres === aktualne.okres && m.kraj === aktualne.kraj);
  if (zhoda) return {};

  if (moznosti.length === 1) {
    const [{ okres, kraj }] = moznosti;
    if (!obecSaZmenila && aktualne.kraj && aktualne.okres) return {};
    const zmena: Partial<PolohaArealu> = {};
    if (aktualne.kraj !== kraj) zmena.kraj = kraj;
    if (aktualne.okres !== okres) zmena.okres = okres;
    return zmena;
  }

  // Viac okresov: okres sa nehádá.
  const kraje = new Set(moznosti.map((m) => m.kraj));
  const zmena: Partial<PolohaArealu> = {};
  if (kraje.size === 1) {
    const [kraj] = kraje;
    if (aktualne.kraj !== kraj && (obecSaZmenila || !aktualne.kraj)) zmena.kraj = kraj;
  }
  const okresJeMoznost = moznosti.some((m) => m.okres === aktualne.okres);
  if (obecSaZmenila && aktualne.okres && !okresJeMoznost) zmena.okres = '';
  return zmena;
}

/**
 * Obec je vo viacerých okresoch a mapér okres ešte nezvolil (alebo zvolil taký,
 * v ktorom obec s týmto názvom nie je): treba ho na to upozorniť.
 */
export function potrebujeVyberOkresu(obec: string, okres: string, zaznamy: readonly ZaznamObce[] = OBCE_ZAZNAMY): boolean {
  const moznosti = okresyObce(obec, zaznamy);
  return moznosti.length > 1 && !moznosti.some((m) => m.okres === okres);
}
