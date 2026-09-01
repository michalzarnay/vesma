/**
 * Vercel serverless proxy pre VESMA most (Google Apps Script Web App).
 * Most zapisuje prijaté záznamy do Google Sheetu.
 *
 * POST /api/feedback obsluhuje dva typy záznamov, rozlíšené podľa tela požiadavky:
 *  - podnet z formulára     { fieldLabel?, nazovPodnetu, opisPodnetu?, url?, menoTestera? } → action 'feedback'
 *  - nezodpovedaná otázka   { question, step?, timestamp? }                                 → action 'unanswered'
 */

const WEBAPP_URL = process.env.SHEET_WEBAPP_URL ?? '';
const WEBHOOK_SECRET = process.env.SHEET_WEBHOOK_SECRET ?? '';

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
};

export default async function handler(
  req: { method?: string; body?: TeloPoziadavky },
  res: { status: (c: number) => { json: (d: unknown) => void }; json: (d: unknown) => void },
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const telo = req.body ?? {};
  let payload: Record<string, unknown>;

  if (typeof telo.question === 'string' && telo.question.trim().length > 0) {
    payload = {
      secret: WEBHOOK_SECRET,
      action: 'unanswered',
      question: telo.question.trim(),
      step: telo.step ?? 0,
      timestamp: telo.timestamp ?? new Date().toISOString(),
    };
  } else if (typeof telo.nazovPodnetu === 'string' && telo.nazovPodnetu.trim().length > 0) {
    // POZOR: na poradí kľúčov záleží. VESMA most zapisuje hodnoty do hárku
    // v poradí, v akom prídu v payloade (kľúče `secret` a `action` preskočí),
    // takže poradie nižšie určuje stĺpce:
    //   A číslo | B verzia | C zapísal(a) | D názov | E kde | F opis | G meno testera
    payload = {
      secret: WEBHOOK_SECRET,
      action: 'feedback',
      cislo: '', // A – dopĺňa sa v hárku ručne
      datum: new Date().toISOString(), // B – verzia
      url: telo.url ?? '', // C – zapísal(a)
      nazov: telo.nazovPodnetu.trim(), // D – názov
      prvok: telo.fieldLabel ?? '', // E – kde (stránka, karta)
      opis: telo.opisPodnetu?.trim() ?? '', // F – opis
      menoTestera: telo.menoTestera?.trim() ?? '', // G – meno testera
    };
  } else {
    return res.status(400).json({ error: 'Chýba názov podnetu alebo otázka.' });
  }

  if (!WEBAPP_URL || !WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Backend nie je nakonfigurovaný.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const resp = await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      return res.status(502).json({ error: `VESMA most vrátil ${resp.status}` });
    }
    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Neznáma chyba';
    return res.status(502).json({ error: msg });
  }
}
