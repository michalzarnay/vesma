/**
 * Svetlý / tmavý režim (docs/tmavy-rezim.md).
 *
 * Používateľ volí v menu jednu z troch možností; „auto" sa riadi nastavením
 * systému, ktoré prehliadač hlási cez `prefers-color-scheme`. Keď prehliadač
 * preferenciu nehlási vôbec (ani svetlú, ani tmavú), použije sa tmavý režim.
 *
 * Tú istú logiku má aj krátky skript v `index.html`, ktorý režim nastaví ešte
 * pred načítaním aplikácie, aby stránka pri štarte nezablikla na bielo.
 * Ich zhodu stráži test `src/utils/__tests__/tema.test.ts`.
 */

export type VolbaTemy = 'svetly' | 'tmavy' | 'auto';
export type Tema = 'light' | 'dark';

export const KLUC_TEMY = 'vesma_vzhlad';
export const PREDVOLENA_VOLBA: VolbaTemy = 'auto';
/** Režim pre „auto", keď prehliadač systémovú preferenciu nehlási. */
export const TEMA_BEZ_PREFERENCIE: Tema = 'dark';

export const VOLBY_TEMY: ReadonlyArray<{ hodnota: VolbaTemy; nazov: string; popis: string }> = [
  { hodnota: 'svetly', nazov: 'Svetlý', popis: 'Vždy svetlý vzhľad' },
  { hodnota: 'tmavy', nazov: 'Tmavý', popis: 'Vždy tmavý vzhľad' },
  { hodnota: 'auto', nazov: 'Auto', popis: 'Podľa nastavenia systému alebo prehliadača' },
];

export function jeVolbaTemy(x: unknown): x is VolbaTemy {
  return x === 'svetly' || x === 'tmavy' || x === 'auto';
}

/** Systémová preferencia: 'dark', 'light', alebo null, keď ju prehliadač nehlási. */
export type SystemovaPreferencia = Tema | null;

export function vyriesTemu(volba: VolbaTemy, system: SystemovaPreferencia): Tema {
  if (volba === 'svetly') return 'light';
  if (volba === 'tmavy') return 'dark';
  return system ?? TEMA_BEZ_PREFERENCIE;
}

export function systemovaPreferencia(): SystemovaPreferencia {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return null;
}

export function nacitajVolbu(): VolbaTemy {
  try {
    const ulozena = window.localStorage.getItem(KLUC_TEMY);
    return jeVolbaTemy(ulozena) ? ulozena : PREDVOLENA_VOLBA;
  } catch {
    return PREDVOLENA_VOLBA;
  }
}

export function ulozVolbu(volba: VolbaTemy): void {
  try {
    window.localStorage.setItem(KLUC_TEMY, volba);
  } catch {
    // Bez úložiska (súkromné okno) platí voľba len do zatvorenia stránky.
  }
}

/** Nastaví `<html data-theme>` podľa voľby a systému. */
export function aplikujTemu(volba: VolbaTemy = nacitajVolbu()): Tema {
  const tema = vyriesTemu(volba, systemovaPreferencia());
  document.documentElement.dataset.theme = tema;
  return tema;
}

/**
 * Pri voľbe „auto" sleduje zmenu systémového režimu (napr. automatické
 * prepnutie večer) a prekreslí aplikáciu bez obnovenia stránky.
 */
export function sledujSystemovuTemu(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const naZmenu = () => {
    if (nacitajVolbu() === 'auto') aplikujTemu('auto');
  };
  mq.addEventListener('change', naZmenu);
  return () => mq.removeEventListener('change', naZmenu);
}
