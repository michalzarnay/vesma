import { X } from 'lucide-react';
import { VysvetlenieKomponentu, tabulkaAkoText } from '../../utils/skoreVysvetlenie';
import { CopyButton } from '../ui/CopyButton';

interface VypocetDialogProps {
  vysvetlenie: VysvetlenieKomponentu;
  onClose: () => void;
}

/** Modálne okno s tabuľkou výpočtu jedného komponentu skóre (issue #213). */
export function VypocetDialog({ vysvetlenie, onClose }: VypocetDialogProps) {
  const poslednyIndex = vysvetlenie.riadky.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Výpočet – ${vysvetlenie.nadpis}`}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{vysvetlenie.nadpis}</h3>
            {vysvetlenie.metodika && (
              <p className="text-xs text-gray-500 mt-0.5">Metodika {vysvetlenie.metodika}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <CopyButton text={tabulkaAkoText(vysvetlenie)} label="Kopírovať tabuľku" />
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Zavrieť"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-auto px-5 pb-5 space-y-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                {vysvetlenie.hlavicka.map((h, i) => (
                  <th key={h} className={`py-1.5 font-medium ${i === 0 ? 'pr-3' : 'px-3 text-right'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vysvetlenie.riadky.map((riadok, ri) => (
                <tr
                  key={riadok.join('|')}
                  className={ri === poslednyIndex
                    ? 'font-semibold text-gray-800 border-t border-gray-300'
                    : 'border-b border-gray-100 text-gray-700'}
                >
                  {riadok.map((bunka, bi) => (
                    <td key={bi} className={`py-1.5 ${bi === 0 ? 'pr-3' : 'px-3 text-right'}`}>
                      {bunka}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-gray-700 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
            {vysvetlenie.zaver}
          </p>

          <p className="text-[11px] text-gray-400 leading-snug">
            Tlačidlo kopírovania vloží tabuľku ako text oddelený tabulátormi — vo Worde ju
            prevediete cez Vložiť → Previesť text na tabuľku, do Excelu sa vloží priamo.
          </p>
        </div>
      </div>
    </div>
  );
}
