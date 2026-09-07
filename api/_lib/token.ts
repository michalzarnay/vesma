/**
 * Podpísané tokeny pre prihlásenie e-mailom (bez databázy).
 *
 * Token nesie e-mail, typ a čas platnosti a je podpísaný HMAC-SHA256 tajomstvom
 * `OVERENIE_SECRET`. Server tak vie overiť, že e-mail naozaj prešiel cez
 * prihlasovací odkaz, bez toho, aby si čokoľvek pamätal.
 *
 *  - `odkaz`   — token v prihlasovacom odkaze v e-maile, platí krátko (24 h)
 *  - `relacia` — token uložený v prehliadači po kliknutí na odkaz, platí dlho
 *
 * Tvar: base64url(`${typ}|${email}|${expMs}`) + '.' + base64url(HMAC).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export type TypTokenu = 'odkaz' | 'relacia';

export interface ObsahTokenu {
  typ: TypTokenu;
  email: string;
  /** Koniec platnosti v ms od epochy. */
  exp: number;
}

export const PLATNOST_MS: Record<TypTokenu, number> = {
  odkaz: 24 * 60 * 60 * 1000,
  relacia: 365 * 24 * 60 * 60 * 1000,
};

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const unb64 = (s: string) => Buffer.from(s, 'base64url').toString('utf8');

function podpis(telo: string, secret: string): string {
  return createHmac('sha256', secret).update(telo).digest('base64url');
}

/** Normalizovaný e-mail — malé písmená, bez medzier. */
export function normalizujEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Základná kontrola tvaru e-mailu; ostré overenie robí až doručený odkaz. */
export function jePlatnyEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function vytvorToken(typ: TypTokenu, email: string, secret: string, teraz = Date.now()): string {
  const telo = b64(`${typ}|${normalizujEmail(email)}|${teraz + PLATNOST_MS[typ]}`);
  return `${telo}.${podpis(telo, secret)}`;
}

/** Vráti obsah tokenu, ak je podpis pravý a platnosť neuplynula; inak null. */
export function overToken(token: string, secret: string, teraz = Date.now()): ObsahTokenu | null {
  if (typeof token !== 'string' || !secret) return null;
  const [telo, sig] = token.split('.');
  if (!telo || !sig) return null;
  const ocakavany = podpis(telo, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(ocakavany);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [typ, email, expText] = unb64(telo).split('|');
  const exp = Number(expText);
  if ((typ !== 'odkaz' && typ !== 'relacia') || !email || !Number.isFinite(exp)) return null;
  if (exp < teraz) return null;
  return { typ, email, exp };
}
