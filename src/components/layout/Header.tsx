import { BookOpen, Leaf } from 'lucide-react';
import { ReactNode } from 'react';
import { WIZARD_STEPS } from '../../types/wizard';
import { APP_VERSION } from '../../version';
import { jeTestovaciKanal } from '../../utils/kanalNasadenia';

interface HeaderProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
  visitedSteps: number[];
  onGoTo: (step: number) => void;
  extraActions?: ReactNode;
  stepTooltips?: Record<number, string>;
}

/** Adresa online Príručky (issue #237) — bez nej sa odkaz v hlavičke neukáže. */
const PRIRUCKA_URL: string = import.meta.env.VITE_PRIRUCKA_URL ?? '';

export function Header({ currentStep, totalSteps, visitedSteps, onGoTo, extraActions, stepTooltips }: HeaderProps) {
  const test = jeTestovaciKanal();
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#52A8DE] rounded-xl flex items-center justify-center flex-shrink-0">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 leading-tight">VESMA <span className="font-normal text-gray-400">{test ? 'Test ' : ''}{APP_VERSION}</span></h1>
              <p className="text-[10px] text-gray-500 hidden sm:block">Voda a energia – sprievodca mapovaním areálov</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {PRIRUCKA_URL && (
              <a
                href={PRIRUCKA_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Príručka VESMA (otvorí sa v novej karte)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Príručka</span>
              </a>
            )}
            {extraActions}
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
