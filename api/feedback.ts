/**
 * Vercel serverless proxy pre VESMA most (Google Apps Script Web App).
 * Most zapisuje prijaté záznamy do Google Sheetu.
 *
 * POST /api/feedback obsluhuje dva typy záznamov, rozlíšené podľa tela požiadavky:
 *  - podnet z formulára     { fieldLabel?, nazovPodnetu, opisPodnetu?, url?, menoTestera?, email?, relacia? } → action 'feedback'
 *  - nezodpovedaná otázka   { question, step?, timestamp?, email?, relacia? }                                → action 'unanswered'
 *
 * E-mail odosielateľa: keď príde platný token relácie (`relacia`, pozri
 * api/overenie.ts), e-mail sa berie z neho a je označený ako overený. Inak sa
 * použije e-mail z tela požiadavky ako neoverený — to je stav, keď prihlásenie
 * ešte nie je nakonfigurované.
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
// Most (Apps Script) zapisuje podnety podľa názvov stĺpcov v hlavičke hárku
// (stav 7. 9. 2026), otázky a registrácie podľa poradia kľúčov. Poradie kľúčov
// preto drž nemenné — test api/__tests__/feedback.test.ts ho stráži.
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

type TeloPoziadavky = {
  // podnet
  fieldLabel?: string;
  nazovPodnetu?: string;
  opisPodnetu?: string;
  url?: string;
  menoTestera?: string;
  // nezodpovedaná otázka
  question?: string;
  step?: number;
  timestamp?: string;
  // odosielateľ
  email?: string;
  relacia?: string;
};

/** E-mail odosielateľa a či je overený tokenom relácie. */
export function emailOdosielatela(telo: TeloPoziadavky, secret = process.env.OVERENIE_SECRET ?? ''): { email: string; overeny: boolean } {
  const zTokenu = telo.relacia ? overToken(telo.relacia, secret) : null;
  if (zTokenu && zTokenu.typ === 'relacia') return { email: zTokenu.email, overeny: true };
  return { email: (telo.email ?? '').trim().toLowerCase(), overeny: false };
}

export default async function handler(
  req: { method?: string; body?: TeloPoziadavky },
  res: { status: (c: number) => { json: (d: unknown) => void }; json: (d: unknown) => void },
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const telo = req.body ?? {};
  const odosielatel = emailOdosielatela(telo);
  let payload: Record<string, unknown>;

  if (typeof telo.question === 'string' && telo.question.trim().length > 0) {
    // Stĺpce hárku nezodpovedaných otázok: otázka | krok | čas | e-mail | e-mail overený
    payload = {
      action: 'unanswered',
      question: telo.question.trim(),
      step: telo.step ?? 0,
      timestamp: telo.timestamp ?? new Date().toISOString(),
      email: odosielatel.email,
      emailOvereny: odosielatel.overeny ? 'áno' : 'nie',
    };
  } else if (typeof telo.nazovPodnetu === 'string' && telo.nazovPodnetu.trim().length > 0) {
    // Kľúče, ktoré most (Apps Script) mapuje na stĺpce podľa hlavičky hárku —
    // názvy kľúčov sú kontrakt, poradie drž nemenné (pôvodne určovalo stĺpce):
    //   A číslo | B verzia | C zapísal(a) | D názov | E kde | F opis | G meno testera
    //   H e-mail | I e-mail overený
    payload = {
      action: 'feedback',
      cislo: '', // A – dopĺňa sa v hárku ručne
      datum: new Date().toISOString(), // B – verzia
      url: telo.url ?? '', // C – zapísal(a)
      nazov: telo.nazovPodnetu.trim(), // D – názov
      prvok: telo.fieldLabel ?? '', // E – kde (stránka, karta)
      opis: telo.opisPodnetu?.trim() ?? '', // F – opis
      menoTestera: telo.menoTestera?.trim() ?? '', // G – meno testera
      email: odosielatel.email, // H – e-mail testera
      emailOvereny: odosielatel.overeny ? 'áno' : 'nie', // I – prešiel prihlasovacím odkazom?
    };
  } else {
    return res.status(400).json({ error: 'Chýba názov podnetu alebo otázka.' });
  }

  const vysledok = await posliNaMost(payload);
  if (!vysledok.ok) {
    return res.status(vysledok.status).json({ error: vysledok.error });
  }
  return res.json({ ok: true });
}
