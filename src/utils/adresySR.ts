import { navrhyUlic, rozdelAdresu, slugKraja, type PolohaObce } from './uliceSR';

/**
 * Čísla domov z Registra adries (podnety 13 a 98, krok 3).
 *
 * Pre každú obec je v `public/data/adresy/<kraj>/<okres>__<obec>.json` jeden súbor:
 * `{ ulica: čísla }`, kde `""` je kľúč pre adresy bez ulice (číslo domu v obci bez
 * ulíc). Čísla sú zapísané úsporne: čisto číselné v radoch (`1-5,7`), ostatné po jednom
 * (`8229/1` = súpisné/orientačné, `2A`). Súbory skript vyrába z registra, aplikácia si
 * stiahne súbor jednej obce z vlastného servera, takže zadaný text nikam neodchádza.
 */
export type AdresyObce = Record<string, string>;

/** Názov v súbore: bez diakritiky, malými písmenami, ostatné znaky ako pomlčka. */
export function slugNazvu(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Cesta súboru s adresami obce, rovnaká ako ju zapisuje `scripts/vyrob-ciselnik-obci.mjs`. */
export function cestaSuboruAdries(poloha: PolohaObce): string {
  return `${slugKraja(poloha.kraj)}/${slugNazvu(poloha.okres)}__${slugNazvu(poloha.obec)}.json`;
}

/** Najväčší rad, ktorý sa pri dekódovaní rozvinie (poistka proti poškodenému súboru). */
const NAJVACSI_RAD = 100_000;

/** Rozvinie úsporný zápis čísel domov na zoznam. */
export function dekodujCisla(kodovane: string | undefined): string[] {
  if (!kodovane) return [];
  const vystup: string[] = [];
  for (const cast of kodovane.split(',')) {
    const rad = cast.match(/^(\d+)-(\d+)$/);
    if (rad) {
      const od = Number(rad[1]);
      const do_ = Number(rad[2]);
      if (do_ >= od && do_ - od < NAJVACSI_RAD) {
        for (let i = od; i <= do_; i += 1) vystup.push(String(i));
        continue;
      }
    }
    if (cast) vystup.push(cast);
  }
  return vystup;
}

/** Orientačné číslo (za lomkou), ak je len jedno číslo, tak to. */
function orientacne(cislo: string): string {
  const casti = cislo.split('/');
  return casti[casti.length - 1];
}

/** Porovnanie čísel domov po ľudsky: 2, 2A, 10 (nie 10, 2, 2A). */
function poradieCisel(a: string, b: string): number {
  return orientacne(a).localeCompare(orientacne(b), 'sk', { numeric: true })
    || a.localeCompare(b, 'sk', { numeric: true });
}

/** Súpisné číslo (pred lomkou), ak je len jedno číslo, tak to. */
function supisne(cislo: string): string {
  return cislo.split('/')[0];
}

/**
 * Návrhy čísel domov k zadanému číslu. Najprv tie, ktorých orientačné číslo začína
 * zadaným textom (v meste píše mapér číslo z tabuľky), potom tie, ktorých súpisné číslo
 * ním začína (radené podľa súpisného čísla). Presne napísané číslo sa neponúka. Prázdny
 * text ponúkne najnižšie čísla.
 */
export function navrhyCisel(cisla: readonly string[], zadane: string, limit = 8): string[] {
  const hladane = zadane.trim().toUpperCase();
  const poOrientacnom: string[] = [];
  const poSupisnom: string[] = [];
  for (const cislo of cisla) {
    const c = cislo.toUpperCase();
    if (c === hladane) continue;
    if (hladane === '' || orientacne(c).startsWith(hladane)) poOrientacnom.push(cislo);
    else if (c.includes('/') && supisne(c).startsWith(hladane)) poSupisnom.push(cislo);
  }
  poSupisnom.sort((a, b) => supisne(a).localeCompare(supisne(b), 'sk', { numeric: true }) || poradieCisel(a, b));
  return [...poOrientacnom.sort(poradieCisel), ...poSupisnom].slice(0, limit);
}

export interface LokalneNavrhy {
  druh: 'ulice' | 'cisla';
  /** Pri číslach ulica, ku ktorej patria (prázdna = adresy bez ulice). */
  ulica: string;
  polozky: string[];
}

/**
 * Čo sa má ponúknuť k aktuálnemu textu v poli „Ulica + číslo“, keď sú k dispozícii
 * ulice a čísla domov zvolenej obce:
 * - text je celá ulica a za ňou medzera alebo číslo: čísla domov tejto ulice;
 * - inak ulice, ktoré text pripomína (aj ulice s číslicou, `1.mája`);
 * - ak nič také nie je a text je celá ulica: čísla domov tejto ulice;
 * - obec bez ulíc (alebo adresy bez ulice) a text začína číslicou: čísla domov bez ulice.
 * Ak sa nič neponúka, vráti `null`.
 */
export function lokalneNavrhy(
  text: string,
  ulice: readonly string[],
  adresy: AdresyObce | null,
  limit = 8,
): LokalneNavrhy | null {
  if (text.trim() === '') return null;
  const zoznamUlic = ulice.length > 0 ? ulice : Object.keys(adresy ?? {}).filter((k) => k !== '');
  const casti = rozdelAdresu(text, zoznamUlic);

  const cislaUlice = (ulica: string, zadane: string): LokalneNavrhy | null => {
    const polozky = navrhyCisel(dekodujCisla(adresy?.[ulica]), zadane, limit);
    return polozky.length > 0 ? { druh: 'cisla', ulica, polozky } : null;
  };

  if (casti.presna && (casti.cislo !== '' || /\s$/.test(text))) {
    return cislaUlice(casti.ulica, casti.cislo);
  }

  const ulicneNavrhy = navrhyUlic(zoznamUlic, text, limit);
  if (ulicneNavrhy.length > 0) return { druh: 'ulice', ulica: '', polozky: ulicneNavrhy };

  if (casti.presna) return cislaUlice(casti.ulica, '');
  if (adresy && '' in adresy && /^\s*\d/.test(text)) return cislaUlice('', text);
  return null;
}

const medzipamat = new Map<string, Promise<AdresyObce | null>>();

/**
 * Stiahne (a zapamätá) adresy obce. Pri zlyhaní (sieť, chýbajúci súbor) vráti `null`
 * a nabudúce sa skúsi znova; pole potom funguje ako bez čísel domov.
 */
export function nacitajAdresyObce(
  poloha: PolohaObce,
  nacitac: typeof fetch = (...argumenty) => fetch(...argumenty),
): Promise<AdresyObce | null> {
  const cesta = cestaSuboruAdries(poloha);
  let vysledok = medzipamat.get(cesta);
  if (!vysledok) {
    vysledok = nacitac(`${import.meta.env.BASE_URL}data/adresy/${cesta}`)
      .then((odpoved) => (odpoved.ok ? (odpoved.json() as Promise<AdresyObce>) : null))
      .catch(() => null)
      .then((data) => {
        if (data === null) medzipamat.delete(cesta);
        return data;
      });
    medzipamat.set(cesta, vysledok);
  }
  return vysledok;
}
