import { OBCE_ZAZNAMY, type ZaznamObce } from '../data/slovakLocations';
import { okresyObce } from './obceSR';

/**
 * Ulice z Registra adries (podnet 98). Súbory sú po krajoch (src/data/ulice/<kraj>.json)
 * a sťahujú sa až po výbere obce. Tvar súboru: { obec: { okres: [ulice] } }.
 * Obce bez pomenovaných ulíc (väčšina dedín) v súbore nie sú.
 */
export type UliceKraja = Record<string, Record<string, string[]>>;

/** Názov súboru kraja: „Žilinský kraj“ → „zilinsky“ (rovnako ako v skripte, ktorý ho vyrába). */
export function slugKraja(kraj: string): string {
  return kraj
    .replace(/ kraj$/, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizuj(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export interface PolohaObce {
  obec: string;
  okres: string;
  kraj: string;
}

/**
 * Obec, ktorej ulice sa majú ponúknuť. Vyžaduje jednoznačnú obec: názov v jedinom
 * okrese, alebo okres, ktorý mapér zvolil. Pri obci vo viacerých okresoch bez zvoleného
 * okresu je výsledok `null`, aby sa nenavrhovali ulice z inej obce.
 */
export function jednoznacnaObec(
  obec: string,
  okres: string,
  zaznamy: readonly ZaznamObce[] = OBCE_ZAZNAMY,
): PolohaObce | null {
  const moznosti = okresyObce(obec, zaznamy);
  if (moznosti.length === 0) return null;
  const podlaOkresu = moznosti.filter((m) => m.okres === okres);
  const vyber = podlaOkresu.length === 1 ? podlaOkresu : moznosti;
  if (vyber.length !== 1) return null;
  const nazov = zaznamy.find(
    ([n, o, k]) => normalizuj(n) === normalizuj(obec) && o === vyber[0].okres && k === vyber[0].kraj,
  )?.[0];
  return { obec: nazov ?? obec, okres: vyber[0].okres, kraj: vyber[0].kraj };
}

/** Ulice obce z načítaného súboru kraja. Prázdne pole = obec nemá pomenované ulice. */
export function uliceObce(data: UliceKraja, poloha: PolohaObce): string[] {
  return data[poloha.obec]?.[poloha.okres] ?? [];
}

/** Časť zadaného textu, ktorá je názvom ulice: všetko pred prvým číslom (Hlavná 15 → Hlavná). */
export function nazovUliceZTextu(text: string): string {
  const m = text.match(/^(.*?)(?:\s+\d.*|\d.*)?$/);
  return (m?.[1] ?? text).trim();
}

function bezMedzier(text: string): string {
  return normalizuj(text).replace(/\s+/g, '');
}

/**
 * Text normalizovaný po znakoch (bez diakritiky, malými písmenami), aby jeho dĺžka
 * zodpovedala pôvodnému textu a dalo sa podľa nej rezať. Pri znakoch, ktoré by dĺžku
 * zmenili, vráti `null`.
 */
function zarovnanyNormalizovany(text: string): string | null {
  let vystup = '';
  for (const znak of text) vystup += znak.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return vystup.length === text.length ? vystup : null;
}

export interface CastiAdresy {
  /** Názov ulice: presne podľa registra, ak je napísaná celá, inak to, čo mapér zatiaľ napísal. */
  ulica: string;
  /** Všetko za ulicou (číslo domu), bez okolitých medzier. */
  cislo: string;
  /** Pravda, ak je napísaná celá ulica z registra. */
  presna: boolean;
}

/**
 * Rozdelí zadaný text na ulicu a číslo domu. Ulice, ktoré samy obsahujú číslice
 * (`1.mája`, `29. augusta`; v registri ich je 255, patria k najčastejším), sa rozpoznajú
 * podľa registra: berie sa najdlhšia ulica, ktorou text začína a za ktorou je koniec
 * textu, medzera alebo číslica. Ak taká nie je, ale text je začiatkom niektorej ulice
 * (`1.m`), je celý názvom ulice. Inak sa odreže všetko od prvého čísla.
 */
export function rozdelAdresu(text: string, ulice: readonly string[]): CastiAdresy {
  const t = text.trimStart();
  const nt = zarovnanyNormalizovany(t);
  if (nt) {
    let najlepsia: string | null = null;
    for (const ulica of ulice) {
      const nu = zarovnanyNormalizovany(ulica);
      if (!nu || !nt.startsWith(nu)) continue;
      const dalsi = nt.charAt(nu.length);
      if (dalsi !== '' && !/[\s\d]/.test(dalsi)) continue;
      if (najlepsia === null || ulica.length > najlepsia.length) najlepsia = ulica;
    }
    if (najlepsia !== null) {
      return { ulica: najlepsia, cislo: t.slice(najlepsia.length).trim(), presna: true };
    }
  }

  const cely = bezMedzier(t);
  if (cely && ulice.some((ulica) => bezMedzier(ulica).startsWith(cely))) {
    return { ulica: t.trim(), cislo: '', presna: false };
  }

  const ulica = nazovUliceZTextu(t);
  return { ulica, cislo: t.slice(t.indexOf(ulica) + ulica.length).trim(), presna: false };
}

/**
 * Návrhy ulíc k zadanému textu: najprv tie, ktoré začínajú zadaným textom, potom tie,
 * ktoré ho obsahujú (bez ohľadu na veľkosť písmen a diakritiku). Číslo domu sa ignoruje.
 */
export function navrhyUlic(ulice: readonly string[], text: string, limit = 8): string[] {
  const hladany = bezMedzier(rozdelAdresu(text, ulice).ulica);
  if (!hladany) return [];
  const zaciatok: string[] = [];
  const obsahuje: string[] = [];
  for (const ulica of ulice) {
    const n = bezMedzier(ulica);
    if (n === hladany) continue; // presná zhoda sa neponúka, už je napísaná
    if (n.startsWith(hladany)) zaciatok.push(ulica);
    else if (n.includes(hladany)) obsahuje.push(ulica);
    if (zaciatok.length >= limit) break;
  }
  return [...zaciatok, ...obsahuje].slice(0, limit);
}

/**
 * Dosadí vybranú ulicu do zadaného textu a zachová číslo domu, ak ho už mapér napísal.
 * Zoznam ulíc obce je potrebný, aby sa správne rozpoznali ulice s číslicami (`1.mája`).
 */
export function dosadUlicu(text: string, ulica: string, ulice: readonly string[] = []): string {
  const { cislo } = rozdelAdresu(text, ulice);
  return cislo ? `${ulica} ${cislo}` : `${ulica} `;
}

type NacitacKraja = () => Promise<{ default: UliceKraja }>;

/** Súbory ulíc po krajoch; načítajú sa ako samostatné časti balíka až pri prvom použití. */
export const NACITACE_ULIC: Record<string, NacitacKraja> = {
  banskobystricky: () => import('../data/ulice/banskobystricky.json') as Promise<{ default: UliceKraja }>,
  bratislavsky: () => import('../data/ulice/bratislavsky.json') as Promise<{ default: UliceKraja }>,
  kosicky: () => import('../data/ulice/kosicky.json') as Promise<{ default: UliceKraja }>,
  nitriansky: () => import('../data/ulice/nitriansky.json') as Promise<{ default: UliceKraja }>,
  presovsky: () => import('../data/ulice/presovsky.json') as Promise<{ default: UliceKraja }>,
  trenciansky: () => import('../data/ulice/trenciansky.json') as Promise<{ default: UliceKraja }>,
  trnavsky: () => import('../data/ulice/trnavsky.json') as Promise<{ default: UliceKraja }>,
  zilinsky: () => import('../data/ulice/zilinsky.json') as Promise<{ default: UliceKraja }>,
};

const medzipamat = new Map<string, Promise<UliceKraja>>();

/** Načíta (a zapamätá) ulice kraja. Pre neznámy kraj vráti prázdny objekt. */
export function nacitajUliceKraja(kraj: string): Promise<UliceKraja> {
  const slug = slugKraja(kraj);
  const nacitac = NACITACE_ULIC[slug];
  if (!nacitac) return Promise.resolve({});
  let vysledok = medzipamat.get(slug);
  if (!vysledok) {
    vysledok = nacitac().then((m) => m.default).catch(() => {
      medzipamat.delete(slug); // pri zlyhaní sa pri ďalšom pokuse skúsi znova
      return {};
    });
    medzipamat.set(slug, vysledok);
  }
  return vysledok;
}
