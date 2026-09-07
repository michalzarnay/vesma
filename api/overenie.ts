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
import { overToken, vytvorToken } from './_lib/token';
import { posliNaMost } from './_lib/most';

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
