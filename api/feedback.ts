/**
 * POST /api/feedback
 * Jeden endpoint pre dva druhy záznamov, ktoré VESMA most (Google Apps Script
 * Web App) zapisuje do Google Sheetu:
 *  - action 'feedback'   – podnet používateľa k prvku formulára,
 *  - action 'unanswered' – otázka, na ktorú chatbot nevedel odpovedať.
 * Druh sa rozlíši podľa tvaru tela požiadavky.
 */

const WEBAPP_URL = process.env.SHEET_WEBAPP_URL ?? '';
const WEBHOOK_SECRET = process.env.SHEET_WEBHOOK_SECRET ?? '';

interface FeedbackBody {
  fieldLabel?: string;
  nazovPodnetu?: string;
  opisPodnetu?: string;
  url?: string;
  question?: string;
  step?: number;
  timestamp?: string;
}

export default async function handler(
  req: { method?: string; body?: FeedbackBody },
  res: { status: (c: number) => { json: (d: unknown) => void }; json: (d: unknown) => void },
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fieldLabel, nazovPodnetu, opisPodnetu, url, question, step, timestamp } = req.body ?? {};

  let payload: Record<string, unknown>;

  if (typeof question === 'string' && question.trim()) {
    payload = {
      secret: WEBHOOK_SECRET,
      action: 'unanswered',
      question: question.trim(),
      step: step ?? 0,
      timestamp: timestamp ?? new Date().toISOString(),
    };
  } else if (nazovPodnetu?.trim()) {
    payload = {
      secret: WEBHOOK_SECRET,
      action: 'feedback',
      datum: new Date().toISOString(),
      prvok: fieldLabel ?? '',
      nazov: nazovPodnetu.trim(),
      opis: opisPodnetu?.trim() ?? '',
      url: url ?? '',
    };
  } else {
    return res.status(400).json({ error: 'Chýba názov podnetu.' });
  }

  if (!WEBAPP_URL || !WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Backend nie je nakonfigurovaný.' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const resp = await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      return res.status(502).json({ error: `VESMA most vrátil ${resp.status}` });
    }
    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Neznáma chyba';
    return res.status(502).json({ error: `Nedá sa spojiť s VESMA mostom: ${msg}` });
  }
}
