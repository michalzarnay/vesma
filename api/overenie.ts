/**
 * Overenie prihlasovacieho odkazu.
 *
 *  POST /api/overenie { token }  → { ok: true, email, relacia }
 *
 * Token z odkazu (typ `odkaz`, 24 h) sa vymení za token relácie (typ
 * `relacia`, rok), ktorý si aplikácia uloží v prehliadači a posiela s podnetmi
 * a otázkami — tie tak nesú overený e-mail. Pri prvom úspešnom overení sa
 * registrácia zapíše do Google hárku cez VESMA most (action `registracia`);
 * zápis do hárku je pomocný — keď zlyhá, prihlásenie prejde aj tak, aby
 * výpadok hárku nezamkol aplikáciu.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

// ─── Podpísané tokeny (kópia v prihlasenie.ts, overenie.ts a feedback.ts) ──────
// Vercel funkcie bežia ako ESM a relatívny import bez prípony pri behu zlyhá
// (HTTP 500, 7. 9. 2026 na produkcii). Preto je každá funkcia sebestačná —
// bez importov z api/_lib. Keď meníš token, zmeň ho vo všetkých troch súboroch;
// test api/__tests__/prihlasenie.test.ts kontroluje, že sú kópie zhodné.
//
// Token nesie e-mail, typ a čas platnosti, podpísaný HMAC-SHA256 tajomstvom
// OVERENIE_SECRET. Tvar: base64url(`${typ}|${email}|${expMs}`) + '.' + base64url(HMAC).
//  - `odkaz`   — v prihlasovacom odkaze v e-maile, platí 24 h
//  - `relacia` — uložený v prehliadači po kliknutí na odkaz, platí rok

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
// ─── koniec kópie tokenov ─────────────────────────────────────────────────────

// ─── VESMA most (kópia v overenie.ts a feedback.ts) ─────────────────────────────
// Odoslanie záznamu do Google Apps Script Web App, ktorý ho zapíše do hárku.
// POZOR: na poradí kľúčov v `payload` záleží — most zapisuje hodnoty do hárku
// v poradí, v akom prídu (kľúče `secret` a `action` preskočí).
async function posliNaMost(
  payload: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const WEBAPP_URL = process.env.SHEET_WEBAPP_URL ?? '';
  const WEBHOOK_SECRET = process.env.SHEET_WEBHOOK_SECRET ?? '';
  if (!WEBAPP_URL || !WEBHOOK_SECRET) {
    return { ok: false, status: 503, error: 'Backend nie je nakonfigurovaný.' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const resp = await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: WEBHOOK_SECRET, ...payload }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return { ok: false, status: 502, error: `VESMA most vrátil ${resp.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, status: 502, error: err instanceof Error ? err.message : 'Neznáma chyba' };
  }
}
// ─── koniec kópie mostu ───────────────────────────────────────────────────────

type Req = { method?: string; body?: { token?: string; url?: string } };
type Res = { status: (c: number) => { json: (d: unknown) => void }; json: (d: unknown) => void };

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.OVERENIE_SECRET ?? '';
  if (!secret) {
    return res.status(503).json({ error: 'Prihlásenie nie je nakonfigurované.' });
  }

  const obsah = overToken(String(req.body?.token ?? ''), secret);
  if (!obsah || obsah.typ !== 'odkaz') {
    return res.status(400).json({ error: 'Odkaz je neplatný alebo mu uplynula platnosť. Požiadajte o nový.' });
  }

  // Poradie kľúčov = stĺpce hárku „Registrácie": A e-mail | B dátum | C odkiaľ (URL)
  const zapis = await posliNaMost({
    action: 'registracia',
    email: obsah.email,
    datum: new Date().toISOString(),
    url: req.body?.url ?? '',
  });
  if (!zapis.ok) {
    console.warn(`[overenie] registrácia sa nezapísala do hárku: ${zapis.error}`);
  }

  return res.json({ ok: true, email: obsah.email, relacia: vytvorToken('relacia', obsah.email, secret) });
}
