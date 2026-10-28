import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, ChevronDown, Bot } from 'lucide-react';
import { Areal } from '../../types/areal';
import { apiUrl } from '../../utils/apiUrl';
import { poliaOdosielatela, usePouzivatel } from '../../hooks/usePouzivatel';
import { WIZARD_STEPS } from '../../types/wizard';
import { ODPOVEDE_ASISTENTA } from '../../data/odpovedeAsistenta';

interface Sprava {
  id: string;
  odosielatel: 'user' | 'bot';
  text: string;
  cas: string;
}

interface ChatPanelProps {
  // areal reserved for future AI integration
  areal?: Areal;
  currentStep: number;
}

// Kontextové nápovedy podľa kroku
const KONTEXTOVE_OTAZKY: Record<number, string[]> = {
  1: [
    'Kde nájdem množstvo zrážok pre moju obec?',
    'Čo je potenciál slnečného svitu a kde ho zistím?',
    'Ako definovať hranice areálu?',
    'Čo je VESMA?',
  ],
  2: [
    'Ako rozlíšiť priepustné a polopriepustné plochy?',
    'Čo patrí do spevnenej plochy?',
    'Ako odhadnúť percentá odvodu dažďovej vody?',
    'Čo je dažďová záhrada?',
  ],
  3: [
    'Ako určiť typ strechy?',
    'Čo znamená orientácia strechy na juh?',
    'Kde nájdem spotrebu plynu/elektriny?',
    'Čo je rekuperácia?',
    'Ako odhadnúť % termoizolačných okien?',
    'Kam patrí záhradná chatka?',
  ],
  4: [
    'Čo patrí medzi iné stavby?',
    'Ako zadať altánok alebo parkovisko?',
    'Kam patrí záhradná chatka?',
  ],
  5: [
    'Čo sú ochranné pásma?',
    'Ako posúdiť potenciál znečistenia?',
    'Čo znamená hladina podzemnej vody?',
  ],
  6: [
    'Ako interpretovať celkové skóre?',
    'Čo znamenajú váhy pri porovnávaní areálov?',
    'Ako exportovať výsledky do XLSX?',
    'Ktoré opatrenia sú najdôležitejšie?',
    'Aké sú orientačné ceny opatrení?',
  ],
};

function najdiOdpoved(otazka: string): string {
  const q = otazka.toLowerCase();

  for (const [kluc, odpoved] of Object.entries(ODPOVEDE_ASISTENTA)) {
    const kluce = kluc.split(' ');
    if (kluce.every((k) => q.includes(k))) {
      return odpoved;
    }
  }

  // Fallback podľa kľúčových slov
  if (q.includes('vesma') || q.includes('čo je tento')) {
    return ODPOVEDE_ASISTENTA['čo je vesma'];
  }
  if (q.includes('zrážok') || q.includes('srážok') || q.includes('prší')) {
    return ODPOVEDE_ASISTENTA['kde nájdem množstvo zrážok'];
  }
  if (q.includes('slnk') || q.includes('pvgis') || q.includes('solar') || q.includes('slnečn')) {
    return ODPOVEDE_ASISTENTA['potenciál slnečného svitu'];
  }
  if (q.includes('spevnen')) {
    return ODPOVEDE_ASISTENTA['spevnená plocha'];
  }
  if (q.includes('priepust')) {
    return ODPOVEDE_ASISTENTA['priepustné a polopriepustné'];
  }
  if (q.includes('strech') && (q.includes('typ') || q.includes('druh') || q.includes('zel'))) {
    return q.includes('zel') ? ODPOVEDE_ASISTENTA['zelená strecha'] : ODPOVEDE_ASISTENTA['typ strechy'];
  }
  if (q.includes('spotreb') && (q.includes('plyn') || q.includes('elektrin') || q.includes('energ'))) {
    return ODPOVEDE_ASISTENTA['spotreba plynu elektriny'];
  }
  if (q.includes('termoizol')) {
    return ODPOVEDE_ASISTENTA['termoizolačné okná'];
  }
  if (q.includes('rekuperáci') || q.includes('rekuperac')) {
    return ODPOVEDE_ASISTENTA['rekuperácia'];
  }
  if (q.includes('skóre') && q.includes('interpret')) {
    return ODPOVEDE_ASISTENTA['interpretovať celkové skóre'];
  }
  if (q.includes('xlsx') || q.includes('export') || q.includes('excel')) {
    return ODPOVEDE_ASISTENTA['exportovať výsledky do xlsx'];
  }
  if (q.includes('fotovolt') || q.includes('fve') || q.includes('panel')) {
    return ODPOVEDE_ASISTENTA['fotovoltika fve'];
  }
  if (q.includes('tepeln') && q.includes('čerpadl')) {
    return ODPOVEDE_ASISTENTA['tepelné čerpadlo'];
  }
  if (q.includes('zateplen') || q.includes('etics') || q.includes('fasád')) {
    return ODPOVEDE_ASISTENTA['zateplenie fasády'];
  }
  if (q.includes('dažďová záhrad') || q.includes('dazdova zahrad')) {
    return ODPOVEDE_ASISTENTA['dažďová záhrada'];
  }
  if (q.includes('rigol') || q.includes('vsakov')) {
    return ODPOVEDE_ASISTENTA['vsakovací rigol'];
  }
  if (q.includes('retenčn') || q.includes('nádrž') || q.includes('nadrz')) {
    return ODPOVEDE_ASISTENTA['retenčná nádrž'];
  }
  if (q.includes('dlažb') || q.includes('priepustn') && q.includes('dlažb')) {
    return ODPOVEDE_ASISTENTA['priepustná dlažba'];
  }
  // Skôr než všeobecná odpoveď o iných stavbách — chatka a podobné objekty patria medzi budovy.
  if (q.includes('chatk') || q.includes('chata') || q.includes('domček') || q.includes('domcek') || q.includes('garáž') || q.includes('garaz')) {
    return ODPOVEDE_ASISTENTA['kam patrí záhradná chatka'];
  }
  if (q.includes('iné stavb') || q.includes('ine stavb') || q.includes('altán') || q.includes('altan')
    || q.includes('pergol') || q.includes('prístreš') || q.includes('pristres') || q.includes('búd')
    || (q.includes('čo patrí') && q.includes('stavb'))) {
    return ODPOVEDE_ASISTENTA['iné stavby'];
  }
  if (q.includes('oploteni') || q.includes('parkovisk') || q.includes('chodník')) {
    return ODPOVEDE_ASISTENTA['oplotenie parkovisko'];
  }
  if (q.includes('ochranné pásm') || q.includes('ochranné pasm') || q.includes('ochranné pásk') || (q.includes('pásm') && q.includes('ochran'))) {
    return ODPOVEDE_ASISTENTA['ochranné pásma'];
  }
  if (q.includes('znečisten') || q.includes('kontaminác') || q.includes('záťaž')) {
    return ODPOVEDE_ASISTENTA['potenciál znečistenia'];
  }
  if (q.includes('podzemn') && q.includes('vod')) {
    return ODPOVEDE_ASISTENTA['hladina podzemnej vody'];
  }
  if (q.includes('dotáci') || q.includes('grant') || q.includes('podpora')) {
    return ODPOVEDE_ASISTENTA['dotácie'];
  }
  if (q.includes('cen') || q.includes('koľko stoj') || q.includes('náklad')) {
    return ODPOVEDE_ASISTENTA['ceny opatrení'];
  }
  if (q.includes('mzi') || q.includes('modro') || q.includes('zelená infra')) {
    return ODPOVEDE_ASISTENTA['mzi opatrenia'];
  }
  if (q.includes('oze') || q.includes('obnoviteľn')) {
    return ODPOVEDE_ASISTENTA['oze opatrenia'];
  }
  if (q.includes('energia') || q.includes('energetick')) {
    return ODPOVEDE_ASISTENTA['energetické opatrenia'];
  }

  return 'Prepáčte, na túto otázku nemám presnú odpoveď. Skúste otázku preformulovať alebo sa pozrite do nápovedy pri konkrétnom poli (ikona ?).\n\nMôžete sa pýtať na: VESMA metodiku, zrážky, slnečný svit, typy plôch, odvod vody, dažďovú záhradu, retenčnú nádrž, zelenú strechu, fotovoltiku, tepelné čerpadlo, zateplenie, rekuperáciu, dotácie, ceny opatrení alebo interpretáciu skóre.';
}

function formatText(text: string): React.ReactNode {
  // Jednoduchý markdown: **tučné**, nové riadky
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part.split('\n').map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </span>
        ));
      })}
    </>
  );
}

export function ChatPanel({ currentStep }: ChatPanelProps) {
  const { pouzivatel } = usePouzivatel();
  const [otvoreny, setOtvoreny] = useState(false);
  const [spravy, setSpravy] = useState<Sprava[]>([
    {
      id: '0',
      odosielatel: 'bot',
      text: 'Dobrý deň! Som asistent VESMA – nástroja pre mapovanie areálov z hľadiska vody a energie. Môžem vám vysvetliť, ako vyplniť polia, a odpovedať na otázky o MZI, OZE, energetických opatreniach, ich cenách a dotáciách.',
      cas: new Date().toLocaleTimeString('sk', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [vstup, setVstup] = useState('');
  const koniecRef = useRef<HTMLDivElement>(null);
  const vstupRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (otvoreny) {
      koniecRef.current?.scrollIntoView({ behavior: 'smooth' });
      vstupRef.current?.focus();
    }
  }, [otvoreny, spravy]);

  const odosliSprav = (text: string) => {
    if (!text.trim()) return;

    const cas = new Date().toLocaleTimeString('sk', { hour: '2-digit', minute: '2-digit' });
    const textOtazky = text.trim();
    const textOdpovede = najdiOdpoved(textOtazky);

    const novaSprava: Sprava = {
      id: crypto.randomUUID(),
      odosielatel: 'user',
      text: textOtazky,
      cas,
    };

    const odpoved: Sprava = {
      id: crypto.randomUUID(),
      odosielatel: 'bot',
      text: textOdpovede,
      cas,
    };

    // Ak asistent nevie odpovedať, zaznamenaj otázku do Google Sheetu
    if (textOdpovede.startsWith('Prepáčte')) {
      fetch(apiUrl('feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textOtazky,
          step: currentStep,
          timestamp: new Date().toISOString(),
          ...poliaOdosielatela(pouzivatel),
        }),
      }).catch(() => {
        // fire-and-forget – chyba nezobrazí sa používateľovi
      });
    }

    setSpravy((prev) => [...prev, novaSprava, odpoved]);
    setVstup('');
  };

  const kontextoveOtazky = KONTEXTOVE_OTAZKY[currentStep] ?? [];

  // Počet správ od posledného otvorenia (pre badge)
  const neprecitane = otvoreny ? 0 : Math.max(0, spravy.filter((s) => s.odosielatel === 'bot').length - 1);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOtvoreny(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white font-medium text-sm transition-all ${
          otvoreny ? 'opacity-0 pointer-events-none' : 'opacity-100'
        } bg-brand-strong hover:bg-brand-strong/90`}
      >
        <MessageCircle className="w-5 h-5" />
        <span>Asistent</span>
        {neprecitane > 0 && (
          <span className="bg-pevna-red-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {neprecitane}
          </span>
        )}
      </button>

      {/* Panel */}
      {otvoreny && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 h-[500px] sm:h-[520px] flex flex-col bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Hlavička */}
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-strong text-white flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Asistent VESMA</p>
              <p className="text-xs text-white/90">
                Krok {currentStep}: {WIZARD_STEPS.find((k) => k.id === currentStep)?.nazov ?? ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOtvoreny(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Správy */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {spravy.map((sprava) => (
              <div
                key={sprava.id}
                className={`flex ${sprava.odosielatel === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    sprava.odosielatel === 'user'
                      ? 'bg-brand-strong text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {formatText(sprava.text)}
                  <p className={`text-xs mt-1 ${sprava.odosielatel === 'user' ? 'text-white/90 text-right' : 'text-gray-400'}`}>
                    {sprava.cas}
                  </p>
                </div>
              </div>
            ))}
            <div ref={koniecRef} />
          </div>

          {/* Kontextové otázky */}
          {kontextoveOtazky.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                <ChevronDown className="w-3 h-3" /> Časté otázky pre tento krok
              </p>
              <div className="flex flex-wrap gap-1.5">
                {kontextoveOtazky.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => odosliSprav(q)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-[#52A8DE]/10 text-gray-700 hover:text-brand-ink rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vstup */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 flex-shrink-0 bg-gray-50">
            <input
              ref={vstupRef}
              type="text"
              value={vstup}
              onChange={(e) => setVstup(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && odosliSprav(vstup)}
              placeholder="Napíšte otázku…"
              className="flex-1 text-sm bg-surface border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-[#52A8DE]"
            />
            <button
              type="button"
              onClick={() => odosliSprav(vstup)}
              disabled={!vstup.trim()}
              className="p-2 bg-brand-strong text-white rounded-full hover:bg-brand-strong/90 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overlay pre mobil */}
      {otvoreny && (
        <div
          className="fixed inset-0 z-40 bg-black/30 sm:hidden"
          onClick={() => setOtvoreny(false)}
        />
      )}
    </>
  );
}

