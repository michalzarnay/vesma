import { useMemo } from 'react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { StepNavigation } from '../layout/StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { useArealState } from '../../hooks/useArealState';
import { useRecommendations } from '../../hooks/useRecommendations';
import { Step1_Uvod } from './Step1_Uvod';
import { Step2_Pozemky } from './Step2_Pozemky';
import { Step3_Budovy } from './Step3_Budovy';
import { Step4_IneStavby } from './Step4_IneStavby';
import { Step5_BGOpatrenia } from './Step5_BGOpatrenia';
import { Step6_Vysledky } from './Step6_Vysledky';
import { ChatPanel } from '../chat/ChatPanel';
import { step1CanProceed } from '../../utils/stepValidation';
import { SessionManager } from '../sessions/SessionManager';
import { AreaComparisonView } from '../comparison/AreaComparisonView';
import { FeedbackButton } from '../ui/FeedbackButton';
import { FilePlus, GitCompare } from 'lucide-react';
import { useState } from 'react';
import { chybajuceNovePolia, verziaArealu } from '../../utils/schemaVersion';
import { NovePoliaPripomienka } from './NovePoliaPripomienka';

export function WizardContainer() {
  const wizard = useWizard();
  const arealState = useArealState();
  const [zobrazitPorovnanie, setZobrazitPorovnanie] = useState(false);
  // Pripomienka nových polí po načítaní staršej relácie (issue #177).
  // Zatvorenie sa viaže na konkrétnu reláciu — po načítaní inej sa ukáže znova.
  const [zavretaPripomienkaPre, setZavretaPripomienkaPre] = useState<string | null>(null);
  const chybajucePolia = useMemo(
    () => (zavretaPripomienkaPre === arealState.areal.id ? [] : chybajuceNovePolia(arealState.areal)),
    [arealState.areal, zavretaPripomienkaPre],
  );
  const setPripomienkaZavreta = (zavreta: boolean) =>
    setZavretaPripomienkaPre(zavreta ? arealState.areal.id : null);
  const recommendations = useRecommendations(arealState.areal);
  const step6Unlocked = recommendations.length > 0;
  const effectiveVisitedSteps = useMemo(() => {
    const steps = new Set([...wizard.visitedSteps, 1, 2, 3, 4, 5]);
    if (step6Unlocked) steps.add(6);
    return [...steps];
  }, [wizard.visitedSteps, step6Unlocked]);

  const renderStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return (
          <Step1_Uvod
            areal={arealState.areal}
            updateAreal={arealState.updateAreal}
            addMedia={arealState.addMedia}
            updateMedia={arealState.updateMedia}
            removeMedia={arealState.removeMedia}
            mediaReady={arealState.mediaReady}
          />
        );
      case 2:
        return (
          <Step2_Pozemky
            pozemky={arealState.areal.pozemky}
            addPozemok={arealState.addPozemok}
            updatePozemok={arealState.updatePozemok}
            removePozemok={arealState.removePozemok}
          />
        );
      case 3:
        return (
          <Step3_Budovy
            budovy={arealState.areal.budovy}
            addBudova={arealState.addBudova}
            updateBudova={arealState.updateBudova}
            removeBudova={arealState.removeBudova}
            arealAdresa={{ adresa: arealState.areal.adresa, obec: arealState.areal.obec }}
            verziaRelacie={verziaArealu(arealState.areal)}
          />
        );
      case 4:
        return (
          <Step4_IneStavby
            ineStavby={arealState.areal.ineStavby}
            addInaStavba={arealState.addInaStavba}
            updateInaStavba={arealState.updateInaStavba}
            removeInaStavba={arealState.removeInaStavba}
          />
        );
      case 5:
        return (
          <Step5_BGOpatrenia
            bgOpatrenia={arealState.areal.bgOpatrenia}
            addBGOpatrenie={arealState.addBGOpatrenie}
            updateBGOpatrenie={arealState.updateBGOpatrenie}
            removeBGOpatrenie={arealState.removeBGOpatrenie}
          />
        );
      case 6:
        return (
          <Step6_Vysledky
            areal={arealState.areal}
            updateVahy={arealState.updateVahy}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        progress={wizard.progress}
        currentStep={wizard.currentStep}
        totalSteps={wizard.totalSteps}
        visitedSteps={effectiveVisitedSteps}
        stepTooltips={step6Unlocked ? undefined : { 6: 'Vyplňte aspoň jeden pozemok alebo budovu – po zadaní dát sa karta odomkne.' }}
        onGoTo={wizard.goToStep}
        extraActions={
          <>
            <button
              type="button"
              title="Nový areál"
              onClick={() => {
                // Varujeme len ak sú v aktuálnom areáli reálne neuložené zmeny.
                if (!arealState.isDirty || confirm('Začať nový areál? Neuložené zmeny budú stratené.')) {
                  arealState.resetAreal();
                  wizard.goToStep(1);
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nový areál</span>
            </button>
            <SessionManager
              areal={arealState.areal}
              onLoad={arealState.setAreal}
              onNew={arealState.resetAreal}
              isDirty={arealState.isDirty}
              onSaved={arealState.markSaved}
            />
            <button
              type="button"
              title="Porovnanie areálov"
              onClick={() => setZobrazitPorovnanie(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Porovnanie areálov</span>
            </button>
            <FeedbackButton variant="header" />
          </>
        }
      />

      {zobrazitPorovnanie && (
        <AreaComparisonView
          aktualnyAreal={arealState.areal}
          onClose={() => setZobrazitPorovnanie(false)}
        />
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <NovePoliaPripomienka
          chybajuce={chybajucePolia}
          onZavriet={() => setPripomienkaZavreta(true)}
          onPrejstNaBudovy={() => wizard.goToStep(3)}
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {renderStep()}
          <StepNavigation
            currentStep={wizard.currentStep}
            totalSteps={wizard.totalSteps}
            onNext={wizard.nextStep}
            onPrev={wizard.prevStep}
            onGoTo={wizard.goToStep}
            visitedSteps={effectiveVisitedSteps}
            canProceed={wizard.currentStep !== 1 || step1CanProceed(arealState.areal)}
          />
        </div>
      </main>

      <Footer />

      {/* Chatbot asistent */}
      <ChatPanel areal={arealState.areal} currentStep={wizard.currentStep} />
    </div>
  );
}
