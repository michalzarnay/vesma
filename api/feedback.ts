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
import { overToken } from './_lib/token';
import { posliNaMost } from './_lib/most';

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
    // POZOR: na poradí kľúčov záleží. VESMA most zapisuje hodnoty do hárku
    // v poradí, v akom prídu v payloade (kľúče `secret` a `action` preskočí),
    // takže poradie nižšie určuje stĺpce:
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
