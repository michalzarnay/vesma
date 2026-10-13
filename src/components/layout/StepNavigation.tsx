import { ChevronLeft, ChevronRight, ChevronsLeft } from 'lucide-react';
import { WIZARD_STEPS } from '../../types/wizard';
import { DOTYK_MOBIL } from '../../utils/nazovKrokuMobil';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (step: number) => void;
  visitedSteps: number[];
  canProceed?: boolean;
}

export function StepNavigation({ currentStep, totalSteps, onNext, onPrev, onGoTo, visitedSteps, canProceed = true }: StepNavigationProps) {
  const prevStep = currentStep - 1;
  const nextStep = currentStep + 1;
  const prevName = WIZARD_STEPS.find(s => s.id === prevStep)?.nazov;
  const nextName = WIZARD_STEPS.find(s => s.id === nextStep)?.nazov;
  const isLast = currentStep === totalSteps;

  return (
    <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
      {/* Rýchla navigácia na kroky */}
      {visitedSteps.length > 1 && (
        <div className="flex flex-wrap gap-2 sm:gap-1.5 justify-center">
          {WIZARD_STEPS.map(step => {
            const isActive = step.id === currentStep;
            const isVisited = visitedSteps.includes(step.id);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isVisited && !isActive && onGoTo(step.id)}
                disabled={!isVisited || isActive}
                title={step.nazov}
                className={`flex items-center justify-center gap-1 px-2 py-1 ${DOTYK_MOBIL} text-xs rounded-md transition-colors
                  ${isActive
                    ? 'bg-brand-strong text-white cursor-default font-semibold'
                    : isVisited
                      ? 'bg-[#52A8DE]/10 text-brand-strong hover:bg-[#52A8DE]/20 cursor-pointer'
                      : 'bg-gray-100 text-gray-300 cursor-default'
                  }`}
              >
                <span className="font-bold w-3 text-center">{step.id}</span>
                <span className="hidden sm:inline">{step.nazov}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Hlavné tlačidlá */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5 px-4 py-2 min-h-11 sm:min-h-0 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Späť{prevName ? <span className="hidden sm:inline"> – {prevName}</span> : null}</span>
        </button>

        {currentStep > 1 && (
          <button
            type="button"
            onClick={() => onGoTo(1)}
            className="flex items-center gap-1 px-3 py-2 min-h-11 sm:min-h-0 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
            Na začiatok
          </button>
        )}

        {/* Na poslednom kroku (Výsledky) už nie je kam ísť — tlačidlo „Zobraziť výsledky"
            len nastavilo nepoužitý príznak a nikam nevedlo, preto sa tam nezobrazuje. */}
        {!isLast && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="flex items-center gap-1.5 px-6 py-2 min-h-11 sm:min-h-0 text-sm font-medium text-white bg-brand-strong rounded-xl hover:bg-brand-strong/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Ďalej{nextName ? <span className="hidden sm:inline"> – {nextName}</span> : null}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
