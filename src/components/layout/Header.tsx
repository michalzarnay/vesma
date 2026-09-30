import { BookOpen, Leaf, MoreHorizontal } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { WIZARD_STEPS } from '../../types/wizard';
import { APP_VERSION } from '../../version';
import { jeTestovaciKanal } from '../../utils/kanalNasadenia';

interface HeaderProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
  visitedSteps: number[];
  onGoTo: (step: number) => void;
  /** Akcie, ktoré zostávajú stále na očiach (Podnet, prihlásený používateľ). */
  extraActions?: ReactNode;
  /**
   * Akcie schované pod tlačidlo „Menu" (podnet 85) — päť tlačidiel vedľa seba
   * sa v hlavičke nedalo prehľadne prečítať. Kliknutie kdekoľvek v paneli menu
   * zavrie, takže položky nemusia zatváranie riešiť samy.
   */
  menuActions?: ReactNode;
  /** Názov práve vyplňovaného areálu — má byť viditeľný na každej karte (podnet 84). */
  nazovArealu?: string;
  stepTooltips?: Record<number, string>;
}

/** Adresa online Príručky (issue #237) — bez nej sa odkaz v hlavičke neukáže. */
const PRIRUCKA_URL: string = import.meta.env.VITE_PRIRUCKA_URL ?? '';

export function Header({ currentStep, totalSteps, visitedSteps, onGoTo, extraActions, menuActions, nazovArealu, stepTooltips }: HeaderProps) {
  const test = jeTestovaciKanal();
  const [menuOtvorene, setMenuOtvorene] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const nazov = nazovArealu?.trim() ?? '';

  // Klik mimo menu a Escape ho zavrú — inak by ostalo visieť nad obsahom.
  useEffect(() => {
    if (!menuOtvorene) return;
    const naKlik = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOtvorene(false);
    };
    const naKlaves = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOtvorene(false);
    };
    document.addEventListener('mousedown', naKlik);
    document.addEventListener('keydown', naKlaves);
    return () => {
      document.removeEventListener('mousedown', naKlik);
      document.removeEventListener('keydown', naKlaves);
    };
  }, [menuOtvorene]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-[#52A8DE] rounded-xl flex items-center justify-center flex-shrink-0">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-800 leading-tight">VESMA <span className="font-normal text-gray-400">{test ? 'Test ' : ''}{APP_VERSION}</span></h1>
              {/* Kým areál nemá názov, zostáva na riadku podtitul aplikácie. */}
              {nazov ? (
                <p className="text-[11px] font-medium text-[#52A8DE] truncate" title={nazov} data-testid="nazov-arealu">{nazov}</p>
              ) : (
                <p className="text-[10px] text-gray-500 hidden sm:block">Voda a energia – sprievodca mapovaním areálov</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {extraActions}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOtvorene((o) => !o)}
                title="Menu"
                aria-haspopup="true"
                aria-expanded={menuOtvorene}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Menu</span>
              </button>
              {menuOtvorene && (
                <div
                  className="absolute right-0 mt-1 w-60 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-1 flex flex-col gap-0.5"
                  onClick={() => setMenuOtvorene(false)}
                >
                  {PRIRUCKA_URL && (
                    <a
                      href={PRIRUCKA_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Príručka VESMA (otvorí sa v novej karte)"
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Príručka</span>
                    </a>
                  )}
                  {menuActions}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-1">
          {WIZARD_STEPS.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isVisited = visitedSteps.includes(step.id);
            const isClickable = isVisited && !isActive;
            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => isClickable && onGoTo(step.id)}
                  disabled={!isClickable}
                  title={stepTooltips?.[step.id] ?? step.nazov}
                  className={`flex items-center gap-1 w-full rounded-xl px-1.5 py-1 text-left transition-colors min-w-0
                    ${isActive
                      ? 'bg-[#52A8DE] text-white cursor-default'
                      : isVisited
                        ? 'bg-[#52A8DE]/10 text-[#52A8DE] hover:bg-[#52A8DE]/20 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-default'
                    }`}
                >
                  <span className="text-xs font-bold flex-shrink-0 w-4 text-center">{step.id}</span>
                  <span className="text-[10px] font-medium truncate hidden sm:block">{step.nazov}</span>
                </button>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className="w-1 flex-shrink-0 h-px bg-gray-200 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-[#52A8DE] h-1 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max((currentStep / totalSteps) * 100, 5)}%` }}
          />
        </div>
      </div>
    </header>
  );
}
