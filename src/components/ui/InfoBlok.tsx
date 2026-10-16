import type { ReactNode } from 'react';
import { INFO_BLOK_TRIEDY, type InfoBlokVariant } from './infoBlokTriedy';

/**
 * Spoločný vzor informačného / nápovedného bloku (podnety 101, 113).
 *
 * - `info`: čisto informačný obsah — jeden neutrálny sivý štýl ako úvodná
 *   sekcia v Kroku 1 (bez modrej, oranžovej či žltej).
 * - `varovanie`: funkčná stavová hláška (chyba, nesúlad v údajoch) — ostáva
 *   farebná, lebo nesie stav.
 */
interface InfoBlokProps {
  variant?: InfoBlokVariant;
  /** Veľkosť textu; predvolene `text-xs`. */
  velkost?: 'text-xs' | 'text-sm';
  className?: string;
  children: ReactNode;
}

export function InfoBlok({ variant = 'info', velkost = 'text-xs', className = '', children }: InfoBlokProps) {
  return (
    <div className={`rounded-xl px-3 py-2 ${velkost} ${INFO_BLOK_TRIEDY[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
}
