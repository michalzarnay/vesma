import { useEffect, useMemo, useState } from 'react';
import { Leaf, Loader2, Mail } from 'lucide-react';
import { apiUrl } from '../../utils/apiUrl';
import {
  Pouzivatel, PouzivatelContext, nacitajPouzivatela, ulozPouzivatela, zabudniPouzivatela,
} from '../../hooks/usePouzivatel';

/**
 * Prihlasovacia brána — e-mail bez hesla.
 *
 * Kto chce VESMU používať, zadá e-mail a dostane prihlasovací odkaz. Kliknutím
 * na odkaz (v tom istom prehliadači) sa appka odomkne na rok. Zbierame tak
 * overené e-maily všetkých používateľov pre validáciu.
 *
 * Keď prihlásenie nie je na serveri nakonfigurované (GET /api/prihlasenie
 * vráti `aktivne: false`, alebo endpoint neexistuje — lokálny dev server),
 * brána sa neukáže a appka beží ako doteraz.
 */

type Stav =
  | { typ: 'zistujem' }
  | { typ: 'vypnute' }
  | { typ: 'formular'; chyba?: string }
  | { typ: 'odosielam' }
  | { typ: 'odoslane'; email: string }
  | { typ: 'overujem' }
  | { typ: 'prihlaseny'; pouzivatel: Pouzivatel };

const PARAM_TOKEN = 'token';

function tokenZUrl(): string | null {
  return new URLSearchParams(window.location.search).get(PARAM_TOKEN);
}

function odstranTokenZUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM_TOKEN);
  window.history.replaceState(null, '', url.toString());
}

async function jeAktivne(): Promise<boolean> {
  try {
    const resp = await fetch(apiUrl('prihlasenie'));
    if (!resp.ok) return false;
    const data = (await resp.json()) as { aktivne?: boolean };
    return data.aktivne === true;
  } catch {
    return false;
  }
}

export function PrihlasenieBrana({ children }: { children: React.ReactNode }) {
  const [stav, setStav] = useState<Stav>({ typ: 'zistujem' });
  const [email, setEmail] = useState('');

  useEffect(() => {
    let zrusene = false;
    const bezpecne = (s: Stav) => { if (!zrusene) setStav(s); };

    (async () => {
      // 1. Odkaz z e-mailu — vymeniť za reláciu.
      const token = tokenZUrl();
      if (token) {
        bezpecne({ typ: 'overujem' });
        try {
          const resp = await fetch(apiUrl('overenie'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, url: window.location.origin + window.location.pathname }),
          });
          const data = (await resp.json()) as { ok?: boolean; email?: string; relacia?: string; error?: string };
          odstranTokenZUrl();
          if (resp.ok && data.ok && data.email && data.relacia) {
            const pouzivatel = { email: data.email, relacia: data.relacia };
            ulozPouzivatela(pouzivatel);
            bezpecne({ typ: 'prihlaseny', pouzivatel });
            return;
          }
          bezpecne({ typ: 'formular', chyba: data.error ?? 'Odkaz sa nepodarilo overiť. Požiadajte o nový.' });
          return;
        } catch {
          odstranTokenZUrl();
          bezpecne({ typ: 'formular', chyba: 'Odkaz sa nepodarilo overiť. Skúste to znova.' });
          return;
        }
      }
      // 2. Už prihlásený v tomto prehliadači.
      const ulozeny = nacitajPouzivatela();
      if (ulozeny) {
        bezpecne({ typ: 'prihlaseny', pouzivatel: ulozeny });
        return;
      }
      // 3. Inak podľa toho, či je prihlásenie vôbec zapnuté.
      bezpecne((await jeAktivne()) ? { typ: 'formular' } : { typ: 'vypnute' });
    })();

    return () => { zrusene = true; };
  }, []);

  const odhlasit = () => {
    zabudniPouzivatela();
    setEmail('');
    setStav({ typ: 'formular' });
  };

  const kontext = useMemo(
    () => ({ pouzivatel: stav.typ === 'prihlaseny' ? stav.pouzivatel : null, odhlasit }),
    [stav],
  );

  async function posliOdkaz(e: React.FormEvent) {
    e.preventDefault();
    const adresa = email.trim().toLowerCase();
    setStav({ typ: 'odosielam' });
    try {
      const resp = await fetch(apiUrl('prihlasenie'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adresa }),
      });
      const data = (await resp.json().catch(() => ({}))) as { error?: string };
      if (!resp.ok) {
        setStav({ typ: 'formular', chyba: data.error ?? 'Odoslanie zlyhalo. Skúste to znova.' });
        return;
      }
      setStav({ typ: 'odoslane', email: adresa });
    } catch {
      setStav({ typ: 'formular', chyba: 'Odoslanie zlyhalo. Skontrolujte pripojenie a skúste to znova.' });
    }
  }

  if (stav.typ === 'vypnute' || stav.typ === 'prihlaseny') {
    return <PouzivatelContext.Provider value={kontext}>{children}</PouzivatelContext.Provider>;
  }

  if (stav.typ === 'zistujem' || stav.typ === 'overujem') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500" data-testid="brana-cakam">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        {stav.typ === 'overujem' ? 'Overujem prihlasovací odkaz…' : 'Načítavam…'}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" data-testid="brana">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#52A8DE] rounded-xl flex items-center justify-center flex-shrink-0">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800 leading-tight">VESMA</h1>
            <p className="text-xs text-gray-500">Voda a energia – sprievodca mapovaním areálov</p>
          </div>
        </div>

        {stav.typ === 'odoslane' ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Prihlasovací odkaz sme poslali na <strong>{stav.email}</strong>.
            </p>
            <p className="text-xs text-gray-500">
              Prihlási sa to okno prehliadača, v ktorom odkaz otvoríte. Ak sa vám e-mail otvára
              inde (napríklad toto je súkromné okno), odkaz z e-mailu skopírujte a vložte do
              adresného riadka <strong>tohto</strong> okna. Odkaz platí 24 hodín a dá sa použiť
              aj opakovane. Ak e-mail nevidíte, pozrite priečinok so spamom.
            </p>
            <button
              type="button"
              onClick={() => setStav({ typ: 'formular' })}
              className="text-xs text-[#52A8DE] hover:underline"
            >
              Poslať na inú adresu
            </button>
          </div>
        ) : (
          <form onSubmit={posliOdkaz} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-gray-800">Prihlásenie e-mailom</h2>
              <p className="text-xs text-gray-500">
                Zadajte svoj e-mail. Pošleme vám odkaz, ktorým sa prihlásite — bez hesla.
                E-mail používame len na overenie, že aplikáciu používajú ľudia, a na
                prípadnú otázku k vášmu podnetu.
              </p>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">E-mail</span>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="meno@obec.sk"
                  className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none"
                />
              </div>
            </label>
            {stav.typ === 'formular' && stav.chyba && (
              <p className="text-xs text-red-600">{stav.chyba}</p>
            )}
            <button
              type="submit"
              disabled={stav.typ === 'odosielam' || !email.includes('@')}
              className="w-full px-4 py-2 text-sm font-medium bg-[#52A8DE] text-white rounded-xl hover:bg-[#52A8DE]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {stav.typ === 'odosielam' ? 'Odosielam…' : 'Poslať prihlasovací odkaz'}
            </button>
          </form>
        )}

        <p className="text-[11px] text-gray-400">
          V spolupráci s INOVIA. Údaje o areáloch ostávajú vo vašom prehliadači; e-mail sa
          ukladá do zoznamu používateľov VESMA.
        </p>
      </div>
    </div>
  );
}
