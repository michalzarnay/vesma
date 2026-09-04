import { AlertTriangle, X } from 'lucide-react';
import { UpozornenieZmenaPravidiel } from '../../utils/pravidlaVersion';

interface ZmenaPravidielDialogProps {
  upozornenie: UpozornenieZmenaPravidiel;
  onZavriet: () => void;
}

/**
 * Upozornenie po otvorení relácie, ktorá bola naposledy vyhodnotená podľa
 * starších pravidiel hodnotenia.
 *
 * Odpovede sa v relácii ukladajú, výsledok nie — skóre, poradie v porovnaní aj
 * odporúčania sa počítajú nanovo. Keď sa medzitým zmenili pravidlá alebo
 * parametre hodnotenia, používateľ uvidí iné čísla než naposledy, hoci sám nič
 * nezmenil. Dialóg mu to povie skôr, než na rozdiel narazí.
 *
 * Ak zmeny vieme vymenovať, vymenujeme ich; pri reláciách spred zavedenia
 * sledovania verzií zostáva len všeobecná veta.
 */
export function ZmenaPravidielDialog({ upozornenie, onZavriet }: ZmenaPravidielDialogProps) {
  const { zmeny, zoznamUplny } = upozornenie;
  const vypisatZmeny = zmeny.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onZavriet(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onZavriet(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Pravidlá hodnotenia sa od uloženia relácie zmenili"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-start gap-3 p-5 pb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <h3 className="flex-1 text-sm font-semibold text-gray-800">
            Pravidlá hodnotenia sa od uloženia relácie zmenili
          </h3>
          <button
            type="button"
            onClick={onZavriet}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Zavrieť"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-auto px-5 pb-2 space-y-3 text-sm text-gray-700">
          <p>
            Vaše odpovede zostali nezmenené, ale skóre, poradie v porovnaní areálov aj
            odporúčania sa počítajú nanovo podľa aktuálnych pravidiel. <strong>Hodnotenie
            a odporúčania preto môžu byť iné než pri poslednom vyplnení relácie.</strong>
          </p>

          {vypisatZmeny && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Čo sa zmenilo
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {zmeny.map((z) => (
                  <li key={`${z.oblast}|${z.popis}`} className="text-sm text-gray-700">
                    <span className="font-medium">{z.oblast}:</span> {z.popis}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!zoznamUplny && (
            <p className="text-xs text-gray-500">
              {vypisatZmeny
                ? 'Zoznam nemusí byť úplný — relácia bola uložená ešte pred zavedením sledovania verzií pravidiel.'
                : 'Zoznam konkrétnych zmien pri tejto relácii uviesť nevieme — bola uložená ešte pred zavedením sledovania verzií pravidiel.'}
            </p>
          )}

          <p className="text-xs text-gray-500">
            Odporúčame prejsť Výsledky a reláciu znova uložiť — uloží sa už podľa
            aktuálnych pravidiel.
          </p>
        </div>

        <div className="flex justify-end px-5 py-4">
          <button
            type="button"
            onClick={onZavriet}
            className="px-4 py-2 bg-[#52A8DE] text-white rounded-xl text-sm font-medium hover:bg-[#52A8DE]/90 transition-colors"
            autoFocus
          >
            Rozumiem, pokračovať
          </button>
        </div>
      </div>
    </div>
  );
}
