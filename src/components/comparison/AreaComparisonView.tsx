import { useMemo, useState } from 'react';
import { X, GitCompare, Download, Droplets, Thermometer, CloudRain, Zap } from 'lucide-react';
import { useSessionManager } from '../../hooks/useSessionManager';
import { Areal } from '../../types/areal';
import { computeAreaComparisonScore, rankAreaComparisons } from '../../utils/comparisonScoring';
import { exportComparisonToXlsx } from '../../utils/comparisonXlsxExport';
import { AreaComparisonRow } from '../../types/comparison';
import { mapujeEnergiu, mapujeVodu } from '../../utils/rozsahMapovania';

interface AreaComparisonViewProps {
  aktualnyAreal: Areal;
  onClose: () => void;
}

const VSETKY_OBLASTI: Array<{ key: 'sucho' | 'horucavy' | 'voda' | 'energia'; poradieKey: 'poradieSucho' | 'poradieHorucavy' | 'poradieVoda' | 'poradieEnergia'; label: string; icon: typeof Droplets; oblast: 'voda' | 'energia' }> = [
  { key: 'sucho', poradieKey: 'poradieSucho', label: 'Sucho', icon: Thermometer, oblast: 'voda' },
  { key: 'horucavy', poradieKey: 'poradieHorucavy', label: 'Horúčavy', icon: Zap, oblast: 'voda' },
  { key: 'voda', poradieKey: 'poradieVoda', label: 'Voda (záplavy)', icon: CloudRain, oblast: 'voda' },
  { key: 'energia', poradieKey: 'poradieEnergia', label: 'Energia', icon: Droplets, oblast: 'energia' },
];

export function AreaComparisonView({ aktualnyAreal, onClose }: AreaComparisonViewProps) {
  const { sessions } = useSessionManager();
  // Oblasti mimo rozsahu mapovania aktuálneho areálu sa v tabuľke neukazujú.
  // Export do XLSX ostáva úplný — porovnávané areály môžu mať rozsah rôzny.
  const OBLASTI = VSETKY_OBLASTI.filter((o) =>
    o.oblast === 'voda' ? mapujeVodu(aktualnyAreal) : mapujeEnergiu(aktualnyAreal),
  );

  // Ponúkame na výber všetky uložené relácie + aktuálne rozpracovaný areál (ak má názov).
  const dostupneArealy = useMemo(() => {
    const zoRelacii = sessions.map((s) => s.areal);
    const maAktualny = aktualnyAreal.nazov.trim().length > 0;
    const uzExistuje = zoRelacii.some((a) => a.id === aktualnyAreal.id);
    return maAktualny && !uzExistuje ? [aktualnyAreal, ...zoRelacii] : zoRelacii;
  }, [sessions, aktualnyAreal]);

  const [vybraneIds, setVybraneIds] = useState<Set<string>>(() => new Set(dostupneArealy.slice(0, Math.min(3, dostupneArealy.length)).map((a) => a.id)));

  const toggleVyber = (id: string) => {
    setVybraneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const vybraneArealy = dostupneArealy.filter((a) => vybraneIds.has(a.id));

  const riadky: AreaComparisonRow[] = useMemo(() => {
    const skore = vybraneArealy.map((a) => computeAreaComparisonScore(a));
    return rankAreaComparisons(skore);
  }, [vybraneArealy]);

  const export_ = () => {
    exportComparisonToXlsx(riadky, vybraneArealy);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[#52A8DE]" />
            Porovnanie areálov
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {dostupneArealy.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <GitCompare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Zatiaľ nemáte uložené žiadne areály na porovnanie.</p>
              <p className="text-xs mt-1">Vyplňte areál a uložte ho cez „Relácie", alebo pridajte ďalší areál.</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Vyberte aspoň 2 areály na porovnanie:</p>
                <div className="flex flex-wrap gap-2">
                  {dostupneArealy.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                        vybraneIds.has(a.id) ? 'border-[#52A8DE] bg-[#52A8DE]/10 text-[#52A8DE]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={vybraneIds.has(a.id)}
                        onChange={() => toggleVyber(a.id)}
                        className="hidden"
                      />
                      {a.nazov || 'Areál bez názvu'}
                    </label>
                  ))}
                </div>
              </div>

              {riadky.length < 2 ? (
                <p className="text-sm text-gray-400 text-center py-6">Na porovnanie vyberte aspoň 2 areály.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="py-2 pr-3 font-medium">Areál</th>
                          {OBLASTI.map(({ key, label, icon: Icon }) => (
                            <th key={key} className="py-2 px-3 font-medium">
                              <div className="flex items-center gap-1"><Icon className="w-3.5 h-3.5" />{label}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {riadky.map((r) => (
                          <tr key={r.arealId} className="border-b border-gray-100">
                            <td className="py-2 pr-3 font-medium text-gray-800">{r.nazov}</td>
                            {OBLASTI.map(({ key, poradieKey }) => (
                              <td key={key} className="py-2 px-3">
                                <span className="text-gray-800 font-semibold">{r[key]}</span>
                                <span className="text-xs text-gray-400 ml-1">(#{r[poradieKey]})</span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400">
                    Vyššia hodnota = vyšší potenciál pre opatrenia v danej oblasti. Poradie #1 = najvyšší potenciál spomedzi vybraných areálov.
                  </p>

                  <button
                    type="button"
                    onClick={export_}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#52A8DE] text-white rounded-xl text-sm font-medium hover:bg-[#52A8DE]/90 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exportovať vyhodnotenie do XLSX
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
