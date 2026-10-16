/**
 * Načítanie klimatických údajov oblasti (Krok 1) podľa adresy a obce.
 *
 * Tok: Nominatim (poloha) -> Open-Meteo (zrážky) -> PVGIS cez /api/pvgis (slnečné žiarenie).
 * Zdroje sú rovnaké ako doteraz; tu je len čistá logika okolo nich:
 * skladanie dotazu, záložný pokus s obcou, rozlíšenie druhov zlyhania a ich text.
 */
import { matchKraj, matchOkres } from './locationMatchers';

/**
 * Ak pokus s celou adresou nič nenájde, skúsi sa ešte raz len s obcou
 * (a krajinou). Rovnaká služba (Nominatim), nič iné sa neodosiela než dnes.
 * Vypnutím (false) sa tok vráti na jediný pokus s celou adresou.
 */
export const POVOLIT_ZALOZNY_POKUS_OBEC = true;

/** Časový limit jednej požiadavky na externú službu. */
export const CASOVY_LIMIT_MS = 20000;

export type DruhChyby =
  | 'adresa_nenajdena'
  | 'sluzba_nedostupna'
  | 'casovy_limit'
  | 'siet'
  | 'nekompletna_odpoved'
  | 'ine';

export type SluzbaKlimy = 'poloha' | 'zrazky' | 'slnko';

export class KlimaChyba extends Error {
  druh: DruhChyby;
  sluzba?: SluzbaKlimy;
  constructor(druh: DruhChyby, sluzba?: SluzbaKlimy, detail?: string) {
    super(detail ?? druh);
    this.name = 'KlimaChyba';
    this.druh = druh;
    this.sluzba = sluzba;
  }
}

const NEDOSTUPNA: Record<SluzbaKlimy, string> = {
  poloha: 'Vyhľadávanie polohy je teraz nedostupné.',
  zrazky: 'Zdroj zrážkových údajov je teraz nedostupný.',
  slnko: 'Zdroj údajov o slnečnom žiarení je teraz nedostupný.',
};

/** Zaradí ľubovoľnú chybu (aj z `fetch`) do niektorého z druhov zlyhania. */
export function klasifikujChybu(err: unknown, online: boolean = typeof navigator === 'undefined' || navigator.onLine !== false): KlimaChyba {
  if (err instanceof KlimaChyba) return err;
  const name = err instanceof Error ? err.name : '';
  if (name === 'AbortError' || name === 'TimeoutError') return new KlimaChyba('casovy_limit');
  if (!online) return new KlimaChyba('siet');
  // `fetch` pri výpadku siete, DNS, CORS či blokovaní hlási TypeError.
  if (err instanceof TypeError) return new KlimaChyba('siet');
  return new KlimaChyba('ine');
}

/** Zrozumiteľná, nenápadná hláška: čo sa stalo a čo môže používateľ spraviť. */
export function textChyby(chyba: KlimaChyba): string {
  const rucne = 'Údaje môžete doplniť ručne.';
  switch (chyba.druh) {
    case 'adresa_nenajdena':
      return `Podľa zadanej adresy sa poloha nenašla. Skúste zadať len obec alebo skontrolujte písanie. ${rucne}`;
    case 'sluzba_nedostupna':
      return `${NEDOSTUPNA[chyba.sluzba ?? 'poloha']} Skúste to neskôr. ${rucne}`;
    case 'casovy_limit':
      return `Služba neodpovedala včas. Skúste to o chvíľu znova. ${rucne}`;
    case 'siet':
      return `Nepodarilo sa spojiť so serverom. Skontrolujte pripojenie k internetu a skúste znova. ${rucne}`;
    case 'nekompletna_odpoved':
      return `Služba pre túto polohu nevrátila úplné údaje. ${rucne}`;
    default:
      return `Údaje sa teraz nepodarilo načítať. Skúste znova neskôr. ${rucne}`;
  }
}

/**
 * Dotazy na geokódovanie v poradí pokusov: najprv celá adresa (+ obec + krajina),
 * potom (ak je povolený a má zmysel) len obec + krajina.
 */
export function dotazyNaPolohu(
  adresa: string,
  obec: string,
  krajina: string,
  zalozny: boolean = POVOLIT_ZALOZNY_POKUS_OBEC,
): string[] {
  const stat = krajina.trim() || 'Slovensko';
  const a = adresa.trim();
  const o = obec.trim();
  const plny = [a, o, stat].filter(Boolean).join(', ');
  const dotazy = [plny];
  if (zalozny && a && o) dotazy.push([o, stat].join(', '));
  return dotazy;
}

export interface KlimaVysledok {
  zrazky: number;
  solar: number;
  kraj: string;
  okres: string;
  /** Poloha určená len podľa obce (celá adresa sa nenašla). */
  polohaPodlaObce: boolean;
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

async function fetchSLimitom(
  fetchFn: FetchFn,
  url: string,
  sluzba: SluzbaKlimy,
  init: RequestInit = {},
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), CASOVY_LIMIT_MS);
  try {
    const res = await fetchFn(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new KlimaChyba('sluzba_nedostupna', sluzba, `${sluzba} ${res.status}`);
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function jsonAleboChyba<T>(res: Response, sluzba: SluzbaKlimy): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new KlimaChyba('nekompletna_odpoved', sluzba);
  }
}

interface NominatimZaznam {
  lat: string;
  lon: string;
  address?: { state?: string; county?: string; state_district?: string };
}

export async function nacitajKlimatickeUdaje(
  vstup: { adresa: string; obec: string; krajina: string },
  onStatus: (msg: string) => void,
  fetchFn: FetchFn = (u, i) => fetch(u, i),
  buildPvgisUrl: (lat: number, lon: number) => string = (lat, lon) => `/api/pvgis?lat=${lat}&lon=${lon}`,
  rok: number = new Date().getFullYear(),
): Promise<KlimaVysledok> {
  const dotazy = dotazyNaPolohu(vstup.adresa, vstup.obec, vstup.krajina);

  // 1. Poloha (Nominatim)
  onStatus('Hľadám polohu adresy…');
  let nalez: NominatimZaznam | null = null;
  let polohaPodlaObce = false;
  for (let i = 0; i < dotazy.length && !nalez; i++) {
    const res = await fetchSLimitom(
      fetchFn,
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dotazy[i])}&format=json&limit=1&addressdetails=1`,
      'poloha',
      { headers: { 'Accept-Language': 'sk' } },
    );
    const data = await jsonAleboChyba<NominatimZaznam[]>(res, 'poloha');
    if (Array.isArray(data) && data.length) {
      nalez = data[0];
      polohaPodlaObce = i > 0;
    }
  }
  if (!nalez) throw new KlimaChyba('adresa_nenajdena', 'poloha');
  const lat = parseFloat(nalez.lat);
  const lon = parseFloat(nalez.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new KlimaChyba('nekompletna_odpoved', 'poloha');

  const addr = nalez.address ?? {};
  const kraj = matchKraj(addr.state ?? '');
  const okres = matchOkres(addr.county ?? addr.state_district ?? '', kraj);

  // 2. Zrážky (Open-Meteo)
  onStatus('Načítavam zrážkové dáta…');
  const precipRes = await fetchSLimitom(
    fetchFn,
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
      `&start_date=${rok - 6}-01-01&end_date=${rok - 1}-12-31` +
      `&daily=precipitation_sum&timezone=Europe%2FBerlin`,
    'zrazky',
  );
  const precip = await jsonAleboChyba<{ error?: boolean; daily?: { precipitation_sum?: (number | null)[] } }>(precipRes, 'zrazky');
  if (precip.error) throw new KlimaChyba('sluzba_nedostupna', 'zrazky');
  const sums = precip.daily?.precipitation_sum ?? [];
  if (!sums.length) throw new KlimaChyba('nekompletna_odpoved', 'zrazky');
  const zrazky = Math.round(sums.reduce<number>((a, b) => a + (b ?? 0), 0) / 5);

  // 3. Slnečné žiarenie (PVGIS cez server proxy kvôli CORS)
  onStatus('Načítavam dáta slnečného svitu…');
  const pvRes = await fetchSLimitom(fetchFn, buildPvgisUrl(lat, lon), 'slnko');
  const pv = await jsonAleboChyba<{ solar?: number; error?: string }>(pvRes, 'slnko');
  if (pv.error) throw new KlimaChyba('sluzba_nedostupna', 'slnko');
  if (typeof pv.solar !== 'number' || !(pv.solar > 0)) throw new KlimaChyba('nekompletna_odpoved', 'slnko');

  return { zrazky, solar: pv.solar, kraj, okres, polohaPodlaObce };
}
