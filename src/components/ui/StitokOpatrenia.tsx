import { Droplets, SignalHigh, SignalLow, SignalMedium, Sun, Zap, type LucideIcon } from 'lucide-react';
import type { IkonaStitku, Stitok } from '../../utils/stitkyOpatreni';

const IKONY: Record<IkonaStitku, LucideIcon> = {
  'signal-high': SignalHigh,
  'signal-medium': SignalMedium,
  'signal-low': SignalLow,
  droplets: Droplets,
  sun: Sun,
  zap: Zap,
};

// Plná pilulka = priorita; obrys so slabším zaoblením a bielym podkladom = kategória.
// Palety sa nekryjú (červená/oranžová/sivá vs. zelená/modrá/fialová) — a aj tak
// štítky odlišuje text, tvar a ikona, nie farba (pozri utils/stitkyOpatreni.ts).
const TRIEDY_FARBY: Record<string, string> = {
  cervena: 'bg-red-600 text-white',
  oranzova: 'bg-orange-700 text-white',
  siva: 'bg-gray-500 text-white',
  zelena: 'border-green-700 text-green-800',
  modra: 'border-sky-700 text-sky-800',
  fialova: 'border-violet-700 text-violet-800',
};

export function StitokOpatrenia({ stitok }: { stitok: Stitok }) {
  const Ikona = IKONY[stitok.ikona];
  const tvar = stitok.tvar === 'pilulka'
    ? 'rounded-full px-2 py-0.5 font-semibold'
    : 'rounded-md border bg-white px-1.5 py-0.5 font-medium';
  return (
    <span
      title={stitok.popis}
      className={`inline-flex items-center gap-1 text-xs leading-none whitespace-nowrap ${tvar} ${TRIEDY_FARBY[stitok.farba] ?? ''}`}
    >
      <Ikona className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      {stitok.text}
    </span>
  );
}
