import { useMemo, useState, useRef } from 'react';
import { Save, FolderOpen, Trash2, Download, Upload, X, Clock, ChevronDown, Share2 } from 'lucide-react';
import { Areal } from '../../types/areal';
import { findMatchingSessions, Session, useSessionManager } from '../../hooks/useSessionManager';

interface SessionManagerProps {
  areal: Areal;
  onLoad: (areal: Areal) => void;
  onNew: () => void;
  /** Či má aktuálny areál reálne neuložené zmeny (riadi zobrazenie varovaní). */
  isDirty: boolean;
  /** Zavolá sa po úspešnom uložení relácie — stav sa označí za uložený. */
  onSaved: () => void;
}

export function SessionManager({ areal, onLoad, onNew, isDirty, onSaved }: SessionManagerProps) {
  const { sessions, saveSession, updateSession, deleteSession, exportSession, shareSession, importSession } = useSessionManager();
  const [otvoreny, setOtvoreny] = useState(false);
  const [rezim, setRezim] = useState<'ulozit' | 'nacitat'>('ulozit');
  const [nazov, setNazov] = useState(areal.nazov || '');
  const [potvrdenie, setPotvrdenie] = useState<string | null>(null);
  const [chyba, setChyba] = useState<string | null>(null);
  const [cielUlozenia, setCielUlozenia] = useState<string>('nova');
  const importRef = useRef<HTMLInputElement>(null);

  // Relácie, ktoré vyzerajú ako ten istý areál (rovnaké ID, názov alebo adresa) — issue #161.
  const zhody = useMemo(() => findMatchingSessions(sessions, areal), [sessions, areal]);
  const zhodneId = useMemo(() => new Set(zhody.map((s) => s.id)), [zhody]);

  const ulozit = () => {
    if (!nazov.trim()) {
      setChyba('Zadajte názov relácie');
      return;
    }
    if (cielUlozenia !== 'nova' && zhody.some((s) => s.id === cielUlozenia)) {
      updateSession(cielUlozenia, nazov.trim(), areal);
      setPotvrdenie(`Relácia „${nazov}" bola prepísaná.`);
    } else {
      saveSession(nazov.trim(), areal);
      setPotvrdenie(`Relácia „${nazov}" bola uložená.`);
    }
    onSaved();
    setChyba(null);
    setTimeout(() => setPotvrdenie(null), 3000);
  };

  const nacitat = (session: Session) => {
    // Varujeme len ak by sa stratili reálne neuložené zmeny.
    if (isDirty && !confirm(`Načítať reláciu „${session.nazov}"? Neuložené zmeny budú stratené.`)) return;
    onLoad(session.areal);
    setOtvoreny(false);
  };

  const zmazat = (session: Session) => {
    if (!confirm(`Zmazať reláciu „${session.nazov}"?`)) return;
    deleteSession(session.id);
  };

  const importovat = async (file: File) => {
    try {
      const nacitany = await importSession(file);
      if (isDirty && !confirm(`Importovať areál „${nacitany.nazov || 'bez názvu'}"? Neuložené zmeny budú stratené.`)) return;
      onLoad(nacitany);
      setOtvoreny(false);
    } catch {
      setChyba('Nepodarilo sa importovať súbor. Skontrolujte formát.');
    }
  };

  const formatDatum = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('sk', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <>
      {/* Trigger tlačidlo */}
      <button
        type="button"
        onClick={() => { setCielUlozenia(zhody[0]?.id ?? 'nova'); setOtvoreny(true); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Relácie</span>
        {sessions.length > 0 && (
          <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
            {sessions.length}
          </span>
        )}
      </button>

      {/* Modal */}
      {otvoreny && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOtvoreny(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Hlavička */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Správa relácií</h2>
              <button type="button" onClick={() => setOtvoreny(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => setRezim('ulozit')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  rezim === 'ulozit' ? 'text-[#52A8DE] border-b-2 border-[#52A8DE]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Save className="w-4 h-4 inline mr-1.5" />
                Uložiť
              </button>
              <button
                type="button"
                onClick={() => setRezim('nacitat')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  rezim === 'nacitat' ? 'text-[#52A8DE] border-b-2 border-[#52A8DE]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FolderOpen className="w-4 h-4 inline mr-1.5" />
                Načítať ({sessions.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {rezim === 'ulozit' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Názov relácie</label>
                    <input
                      type="text"
                      value={nazov}
                      onChange={(e) => setNazov(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && ulozit()}
                      placeholder={areal.nazov || 'napr. ZŠ Lipová – terénny prieskum'}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#52A8DE]"
                      autoFocus
                    />
                  </div>

                  {zhody.length > 0 && (
                    <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-1.5">
                      <p className="text-xs text-amber-800">
                        Nájdená podobná relácia (rovnaké ID, názov alebo adresa areálu). Prepísať existujúcu, alebo uložiť ako novú?
                      </p>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="cielUlozenia"
                          checked={cielUlozenia === 'nova'}
                          onChange={() => setCielUlozenia('nova')}
                        />
                        Uložiť ako novú reláciu
                      </label>
                      {zhody.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="cielUlozenia"
                            checked={cielUlozenia === s.id}
                            onChange={() => setCielUlozenia(s.id)}
                          />
                          Prepísať „{s.nazov}" ({formatDatum(s.datumUlozenia)})
                        </label>
                      ))}
                    </div>
                  )}

                  {chyba && <p className="text-sm text-red-600">{chyba}</p>}
                  {potvrdenie && <p className="text-sm text-[#52A8DE]">{potvrdenie}</p>}

                  <button
                    type="button"
                    onClick={ulozit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#52A8DE] text-white rounded-xl text-sm font-medium hover:bg-[#52A8DE]/90 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Uložiť aktuálny stav
                  </button>

                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Importovať JSON súbor relácie:</p>
                    <button
                      type="button"
                      onClick={() => importRef.current?.click()}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#52A8DE] transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Importovať zo súboru…
                    </button>
                    <input
                      ref={importRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && importovat(e.target.files[0])}
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => { if (!isDirty || confirm('Začať nový areál? Neuložené zmeny budú stratené.')) { onNew(); setOtvoreny(false); } }}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      + Nový prázdny areál
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Žiadne uložené relácie</p>
                      <p className="text-xs mt-1">Uložte aktuálny areál cez záložku „Uložiť"</p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <SessionKarta
                        key={session.id}
                        session={session}
                        zvyraznena={zhodneId.has(session.id)}
                        onNacitat={() => nacitat(session)}
                        onExportovat={() => exportSession(session)}
                        onZdielat={() => shareSession(session)}
                        onZmazat={() => zmazat(session)}
                        formatDatum={formatDatum}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SessionKarta({
  session,
  zvyraznena,
  onNacitat,
  onExportovat,
  onZdielat,
  onZmazat,
  formatDatum,
}: {
  session: Session;
  zvyraznena: boolean;
  onNacitat: () => void;
  onExportovat: () => void;
  onZdielat: () => void;
  onZmazat: () => void;
  formatDatum: (iso: string) => string;
}) {
  const [rozbalenych, setRozbalenych] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onNacitat}
        title={zvyraznena ? 'Zodpovedá aktuálne otvorenému areálu' : undefined}
        className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
      >
        <FolderOpen className="w-4 h-4 text-[#52A8DE] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-gray-800 truncate ${zvyraznena ? 'font-bold' : 'font-medium'}`}>{session.nazov}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatDatum(session.datumUlozenia)}
          </div>
          <div className="flex gap-2 mt-1 text-xs text-gray-400">
            <span>{session.areal.pozemky.length} pozemkov</span>
            <span>·</span>
            <span>{session.areal.budovy.length} budov</span>
            <span>·</span>
            <span>{session.areal.media?.length ?? 0} médií</span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${rozbalenych ? 'rotate-180' : ''}`}
          onClick={(e) => { e.stopPropagation(); setRozbalenych(!rozbalenych); }}
        />
      </button>

      {rozbalenych && (
        <div className="flex gap-2 px-3 pb-3 border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={onNacitat}
            className="flex items-center gap-1 text-xs text-[#52A8DE] hover:underline"
          >
            <FolderOpen className="w-3 h-3" />
            Načítať
          </button>
          <button
            type="button"
            onClick={onExportovat}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <Download className="w-3 h-3" />
            Exportovať JSON
          </button>
          <button
            type="button"
            onClick={onZdielat}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <Share2 className="w-3 h-3" />
            Zdieľať
          </button>
          <button
            type="button"
            onClick={onZmazat}
            className="flex items-center gap-1 text-xs text-red-500 hover:underline ml-auto"
          >
            <Trash2 className="w-3 h-3" />
            Zmazať
          </button>
        </div>
      )}
    </div>
  );
}
