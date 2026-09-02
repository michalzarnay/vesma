import { AlertTriangle, X } from 'lucide-react';
import { ChybajucePoliaBudovy } from '../../utils/schemaVersion';

interface NovePoliaPripomienkaProps {
  chybajuce: ChybajucePoliaBudovy[];
  onZavriet: () => void;
  onPrejstNaBudovy: () => void;
}

/**
 * Pripomienka po načítaní relácie uloženej v staršej verzii schémy (issue #177).
 * Vypíše, ktoré budovy majú nové nevyplnené polia — tie sú vo formulári budovy
 * navyše červeno orámované.
 */
export function NovePoliaPripomienka({ chybajuce, onZavriet, onPrejstNaBudovy }: NovePoliaPripomienkaProps) {
  if (chybajuce.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-900">
            Relácia je z staršej verzie — pribudli nové otázky
          </h3>
          <p className="text-xs text-amber-800 mt-1">
            Tieto polia zatiaľ majú hodnotu „neviem“. Doplňte ich, prosím — vo formulári budovy
            sú červeno orámované.
          </p>
          <ul className="mt-2 space-y-1.5">
            {chybajuce.map((b) => (
              <li key={b.budovaId} className="text-xs text-amber-900">
                <span className="font-medium">{b.budovaNazov}</span>
                <ul className="list-disc list-inside ml-2 text-amber-800">
                  {b.polia.map((pole) => (
                    <li key={pole}>{pole}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onPrejstNaBudovy}
            className="mt-3 text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700"
          >
            Prejsť na Budovy
          </button>
        </div>
        <button
          type="button"
          onClick={onZavriet}
          title="Zavrieť pripomienku"
          className="text-amber-500 hover:text-amber-700 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
