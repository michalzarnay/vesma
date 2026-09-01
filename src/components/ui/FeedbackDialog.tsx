import { useState } from 'react';
import { X } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { apiUrl } from '../../utils/apiUrl';

interface FeedbackDialogProps {
  fieldLabel?: string;
  onClose: () => void;
}

export function FeedbackDialog({ fieldLabel, onClose }: FeedbackDialogProps) {
  const [prvok, setPrvok] = useState(fieldLabel ?? '');
  const [nazov, setNazov] = useState('');
  const [opis, setOpis] = useState('');
  const [menoTestera, setMenoTestera] = useLocalStorage('vesma_meno_testera', '');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  async function handleSubmit() {
    setStatus('sending');
    try {
      const resp = await fetch(apiUrl('feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldLabel: prvok.trim(),
          nazovPodnetu: nazov.trim(),
          opisPodnetu: opis.trim(),
          url: window.location.href,
          menoTestera: menoTestera.trim(),
        }),
      });
      if (!resp.ok) throw new Error();
      setStatus('ok');
      setTimeout(onClose, 1800);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            {fieldLabel !== undefined ? (
              <>Podnet k: <span className="text-[#52A8DE]">{fieldLabel}</span></>
            ) : (
              'Nový podnet'
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Zavrieť"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === 'ok' ? (
          <p className="text-sm text-green-600 text-center py-4">Podnet odoslaný. Ďakujeme!</p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Názov prvku</label>
              <input
                value={prvok}
                onChange={(e) => setPrvok(e.target.value)}
                placeholder="napr. Plocha strechy, krok 3..."
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Názov podnetu</label>
              <input
                value={nazov}
                onChange={(e) => setNazov(e.target.value)}
                placeholder="napr. Chýba jednotka, Nejasný popis..."
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Opis podnetu <span className="text-gray-400 font-normal">(nepovinné)</span>
              </label>
              <textarea
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                placeholder="Čo by sa malo zmeniť alebo doplniť?"
                rows={3}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Meno testera <span className="text-gray-400 font-normal">(nepovinné)</span>
              </label>
              <input
                value={menoTestera}
                onChange={(e) => setMenoTestera(e.target.value)}
                placeholder="napr. Ján Novák"
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-500">Odoslanie zlyhalo. Skús znova.</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl transition-colors"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!nazov.trim() || status === 'sending'}
                className="px-4 py-2 text-sm font-medium bg-[#52A8DE] text-white rounded-xl hover:bg-[#52A8DE]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'sending' ? 'Odosiela...' : 'Odoslať'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
