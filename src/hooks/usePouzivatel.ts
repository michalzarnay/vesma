import { createContext, useContext } from 'react';

/**
 * Prihlásený používateľ — overený e-mail a token relácie (pozri api/overenie.ts).
 *
 * Uložený v prehliadači pod `vesma_pouzivatel`. Token nesie e-mail a platnosť;
 * podpis vie overiť len server, preto ho appka posiela s každým podnetom
 * a nezodpovedanou otázkou a server z neho číta overený e-mail.
 */
export interface Pouzivatel {
  email: string;
  relacia: string;
}

export const KLUC_POUZIVATELA = 'vesma_pouzivatel';

/** Platnosť z tela tokenu (bez overenia podpisu — na to je server). */
export function platnostTokenu(relacia: string): number | null {
  try {
    const telo = relacia.split('.')[0];
    const dekodovane = atob(telo.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = Number(dekodovane.split('|')[2]);
    return Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

export function nacitajPouzivatela(teraz = Date.now()): Pouzivatel | null {
  try {
    const raw = window.localStorage.getItem(KLUC_POUZIVATELA);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Pouzivatel>;
    if (!p.email || !p.relacia) return null;
    const exp = platnostTokenu(p.relacia);
    if (exp === null || exp < teraz) return null;
    return { email: p.email, relacia: p.relacia };
  } catch {
    return null;
  }
}

export function ulozPouzivatela(p: Pouzivatel): void {
  try {
    window.localStorage.setItem(KLUC_POUZIVATELA, JSON.stringify(p));
  } catch {
    // súkromné okno a pod. — prihlásenie platí do obnovenia stránky
  }
}

export function zabudniPouzivatela(): void {
  try {
    window.localStorage.removeItem(KLUC_POUZIVATELA);
  } catch {
    // nič
  }
}

export interface PouzivatelContextValue {
  /** null = prihlásenie nie je nakonfigurované, appka beží bez neho. */
  pouzivatel: Pouzivatel | null;
  odhlasit: () => void;
}

export const PouzivatelContext = createContext<PouzivatelContextValue>({ pouzivatel: null, odhlasit: () => {} });

export function usePouzivatel(): PouzivatelContextValue {
  return useContext(PouzivatelContext);
}

/** Polia odosielateľa do podnetu alebo otázky — server e-mail z tokenu overí. */
export function poliaOdosielatela(pouzivatel: Pouzivatel | null, nahradnyEmail = ''): { email: string; relacia?: string } {
  return pouzivatel
    ? { email: pouzivatel.email, relacia: pouzivatel.relacia }
    : { email: nahradnyEmail.trim() };
}
