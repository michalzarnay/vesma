import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
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
import { FilePlus, FolderOpen, GitCompare } from 'lucide-react';
import { useState } from 'react';
import { chybajuceNovePolia, verziaArealu } from '../../utils/schemaVersion';
import { NovePoliaPripomienka } from './NovePoliaPripomienka';
import { upozornenieNaZmenuPravidiel } from '../../utils/pravidlaVersion';
import { ZmenaPravidielDialog } from './ZmenaPravidielDialog';
import { RozsahContext } from '../../hooks/useRozsah';
import { WIZARD_STEPS } from '../../types/wizard';

/** Riadok v menu hlavičky (podnet 85) — jednotný vzhľad pre všetky položky. */
const POLOZKA_MENU =
  'flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-left';

/** „Krok 3 – Budovy" — predvyplnené „kde" pri všeobecnom podnete z hlavičky. */
function nazovKroku(krok: number): string {
  const s = WIZARD_STEPS.find((k) => k.id === krok);
  return s ? `Krok ${s.id} – ${s.nazov}` : `Krok ${krok}`;
}
import { PrihlasenyPouzivatel } from '../auth/PrihlasenyPouzivatel';

export function WizardContainer() {
  const wizard = useWizard();
  const arealState = useArealState();
  const [zobrazitPorovnanie, setZobrazitPorovnanie] = useState(false);
  const [relacieOtvorene, setRelacieOtvorene] = useState(false);
  // Pripomienka nových polí po načítaní staršej relácie (issue #177).
  // Zatvorenie sa viaže na konkrétnu reláciu — po načítaní inej sa ukáže znova.
  const [zavretaPripomienkaPre, setZavretaPripomienkaPre] = useState<string | null>(null);
  const chybajucePolia = useMemo(
    () => (zavretaPripomienkaPre === arealState.areal.id ? [] : chybajuceNovePolia(arealState.areal)),
    [arealState.areal, zavretaPripomienkaPre],
  );
  // Upozornenie na zmenu pravidiel hodnotenia od posledného vyplnenia relácie.
  // Potvrdenie sa zapíše do areálu (`pravidlaVersion`), takže sa dialóg
  // neopakuje po obnovení stránky.
  const zmenaPravidiel = useMemo(
    () => upozornenieNaZmenuPravidiel(arealState.areal),
    [arealState.areal],
  );
  // Podnet 78: karta sa nemá otvoriť preskrolovaná tam, kde skončila tá
  // predchádzajúca. Pri prvom príchode na kartu ju ukážeme od vrchu, pri návrate
  // obnovíme miesto, kde mapér skončil. Nová alebo načítaná relácia pamäť zmaže.
  const poziciaKariet = useRef(new Map<number, number>());
  const zapamatajPoziciu = useCallback(() => {
    poziciaKariet.current.set(wizard.currentStep, window.scrollY);
  }, [wizard.currentStep]);
  const prejstNaKrok = useCallback((krok: number) => {
    zapamatajPoziciu();
    wizard.goToStep(krok);
  }, [zapamatajPoziciu, wizard]);
  const dalsiKrok = useCallback(() => {
    zapamatajPoziciu();
    wizard.nextStep();
  }, [zapamatajPoziciu, wizard]);
  const predchadzajuciKrok = useCallback(() => {
    zapamatajPoziciu();
    wizard.prevStep();
  }, [zapamatajPoziciu, wizard]);
  useLayoutEffect(() => {
    window.scrollTo({ top: poziciaKariet.current.get(wizard.currentStep) ?? 0 });
  }, [wizard.currentStep]);

  /** Nová alebo načítaná relácia — každá karta začína zase od vrchu. */
  const zabudniPozicie = useCallback(() => {
    poziciaKariet.current.clear();
  }, []);
  const novyAreal = useCallback(() => {
    zabudniPozicie();
    arealState.resetAreal();
  }, [zabudniPozicie, arealState]);
  const nacitajAreal = useCallback((areal: Parameters<typeof arealState.setAreal>[0]) => {
    zabudniPozicie();
    arealState.setAreal(areal);
  }, [zabudniPozicie, arealState]);

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
            plochaInychStavieb={arealState.areal.ineStavby.reduce((acc, s) => acc + s.zastavanaPlocha, 0)}
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
    <RozsahContext.Provider value={arealState.areal.rozsahMapovania}>
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        progress={wizard.progress}
        currentStep={wizard.currentStep}
        totalSteps={wizard.totalSteps}
        visitedSteps={effectiveVisitedSteps}
        stepTooltips={step6Unlocked ? undefined : { 6: 'Vyplňte aspoň jeden pozemok alebo budovu – po zadaní dát sa karta odomkne.' }}
        onGoTo={prejstNaKrok}
        nazovArealu={arealState.areal.nazov}
        extraActions={
          <>
            <FeedbackButton variant="header" predvyplnenyPrvok={nazovKroku(wizard.currentStep)} />
            <PrihlasenyPouzivatel />
          </>
        }
        menuActions={
          <>
            <button
              type="button"
              onClick={() => {
                // Varujeme len ak sú v aktuálnom areáli reálne neuložené zmeny.
                if (!arealState.isDirty || confirm('Začať nový areál? Neuložené zmeny budú stratené.')) {
                  novyAreal();
                  wizard.goToStep(1);
                }
              }}
              className={POLOZKA_MENU}
            >
              <FilePlus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Nový areál</span>
            </button>
            <button
              type="button"
              onClick={() => setRelacieOtvorene(true)}
              className={POLOZKA_MENU}
            >
              <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Uložené relácie</span>
            </button>
            <button
              type="button"
              onClick={() => setZobrazitPorovnanie(true)}
              className={POLOZKA_MENU}
            >
              <GitCompare className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Porovnanie areálov</span>
            </button>
          </>
        }
      />

      {/* Správa relácií žije mimo menu — inak by sa jej dialóg zavrel spolu s ním. */}
      <SessionManager
        areal={arealState.areal}
        onLoad={nacitajAreal}
        onNew={novyAreal}
        isDirty={arealState.isDirty}
        onSaved={arealState.markSaved}
        ovladanieZvonka={{ otvoreny: relacieOtvorene, nastavOtvoreny: setRelacieOtvorene }}
      />

      {zmenaPravidiel && (
        <ZmenaPravidielDialog
          upozornenie={zmenaPravidiel}
          onZavriet={arealState.potvrdZmenuPravidiel}
        />
      )}

      {zobrazitPorovnanie && (
        <AreaComparisonView
          aktualnyAreal={arealState.areal}
          onClose={() => setZobrazitPorovnanie(false)}
        />
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <NovePoliaPripomienka
          chybajuce={chybajucePolia}
          onZavriet={() => setZavretaPripomienkaPre(arealState.areal.id)}
          onPrejstNaBudovy={() => prejstNaKrok(3)}
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {renderStep()}
          <StepNavigation
            currentStep={wizard.currentStep}
            totalSteps={wizard.totalSteps}
            onNext={dalsiKrok}
            onPrev={predchadzajuciKrok}
            onGoTo={prejstNaKrok}
            visitedSteps={effectiveVisitedSteps}
            canProceed={wizard.currentStep !== 1 || step1CanProceed(arealState.areal)}
          />
        </div>
      </main>

      <Footer />

      {/* Chatbot asistent */}
      <ChatPanel areal={arealState.areal} currentStep={wizard.currentStep} />
    </div>
    </RozsahContext.Provider>
  );
}
