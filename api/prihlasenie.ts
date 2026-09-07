/**
 * Prihlásenie e-mailom — odoslanie prihlasovacieho odkazu.
 *
 *  GET  /api/prihlasenie          → { aktivne: boolean }
 *       Či je prihlásenie nakonfigurované. Keď nie je (chýba kľúč služby na
 *       odosielanie pošty alebo tajomstvo), aplikácia bránu neukáže — inak by
 *       chýbajúca konfigurácia zamkla appku všetkým.
 *  POST /api/prihlasenie { email } → { ok: true }
 *       Pošle na e-mail odkaz s tokenom typu `odkaz` (platí 24 h). Odkaz vedie
 *       na `APP_URL?token=…`, kde ho aplikácia odovzdá na /api/overenie.
 *
 * Posielanie ide cez Resend (https://resend.com) — REST volanie bez SDK.
 *
 * Premenné prostredia (Vercel):
 *   RESEND_API_KEY    kľúč služby Resend
 *   EMAIL_ODOSIELATEL  napr. "VESMA <vesma@inovia.sk>" — doména musí byť v Resende overená (SPF, DKIM)
 *   OVERENIE_SECRET    tajomstvo na podpis tokenov (dlhý náhodný reťazec)
 *   APP_URL            verejná adresa aplikácie bez lomky na konci, napr. https://inovia.sk/vesma
 */
import { jePlatnyEmail, normalizujEmail, vytvorToken } from './_lib/token';

type Req = { method?: string; body?: { email?: string } };
type Res = { status: (c: number) => { json: (d: unknown) => void }; json: (d: unknown) => void };

export function konfiguracia() {
  return {
    resendKey: process.env.RESEND_API_KEY ?? '',
    odosielatel: process.env.EMAIL_ODOSIELATEL ?? '',
    secret: process.env.OVERENIE_SECRET ?? '',
    appUrl: (process.env.APP_URL ?? '').replace(/\/+$/, ''),
  };
}

export function jeAktivne(k = konfiguracia()): boolean {
  return Boolean(k.resendKey && k.odosielatel && k.secret && k.appUrl);
}

/** Text e-mailu — jednoduchý, bez obrázkov, aby prešiel filtrami. */
export function telo(odkaz: string): { subject: string; text: string; html: string } {
  const subject = 'Prihlásenie do VESMA';
  const text =
    `Dobrý deň,\n\n` +
    `kliknutím na odkaz sa prihlásite do aplikácie VESMA (odkaz platí 24 hodín):\n\n${odkaz}\n\n` +
    `Ak ste o prihlásenie nežiadali, e-mail ignorujte.\n\n` +
    `VESMA – Voda a energia – sprievodca mapovaním areálov\nINOVIA`;
  const html =
    `<p>Dobrý deň,</p>` +
    `<p>kliknutím na odkaz sa prihlásite do aplikácie VESMA (odkaz platí 24 hodín):</p>` +
    `<p><a href="${odkaz}">${odkaz}</a></p>` +
    `<p>Ak ste o prihlásenie nežiadali, e-mail ignorujte.</p>` +
    `<p>VESMA – Voda a energia – sprievodca mapovaním areálov<br>INOVIA</p>`;
  return { subject, text, html };
}

export default async function handler(req: Req, res: Res) {
  const k = konfiguracia();

  if (req.method === 'GET') {
    return res.json({ aktivne: jeAktivne(k) });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!jeAktivne(k)) {
    return res.status(503).json({ error: 'Prihlásenie nie je nakonfigurované.' });
  }

  const email = normalizujEmail(String(req.body?.email ?? ''));
  if (!jePlatnyEmail(email)) {
    return res.status(400).json({ error: 'Zadajte platnú e-mailovú adresu.' });
  }

  const token = vytvorToken('odkaz', email, k.secret);
  const odkaz = `${k.appUrl}/?token=${encodeURIComponent(token)}`;
  const { subject, text, html } = telo(odkaz);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${k.resendKey}` },
      body: JSON.stringify({ from: k.odosielatel, to: [email], subject, text, html }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      return res.status(502).json({ error: `Odoslanie e-mailu zlyhalo (${resp.status}).` });
    }
    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Neznáma chyba';
    return res.status(502).json({ error: msg });
  }
}
