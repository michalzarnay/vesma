import { Info } from 'lucide-react';
import { poznamkaMimoRozsahu } from '../../../utils/rozsahMapovania';

/**
 * Poznámka na kroku alebo v sekcii, ktorá je mimo rozsahu mapovania.
 * Krok ostáva v lište (čísla krokov sedia s Príručkou), len sa vysvetlí,
 * prečo ho mapér môže preskočiť.
 */
export function MimoRozsahuPoznamka({ oblast }: { oblast: 'voda' | 'energia' }) {
  return (
    <div
      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 flex items-start gap-2"
      data-testid="mimo-rozsahu"
    >
      <Info className="w-4 h-4 flex-shrink-0 text-gray-400" />
      <span>{poznamkaMimoRozsahu(oblast)}</span>
    </div>
  );
}
