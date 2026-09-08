import { describe, it, expect } from 'vitest';
import { WIZARD_STEPS } from '../wizard';
import { harkyExportu } from '../../utils/xlsxExport';
import { createEmptyAreal } from '../areal';
import { computeScore } from '../../hooks/useScoring';

describe('WIZARD_STEPS', () => {
  it('krok 5 sa v aplikácii volá „Opatrenia pre MZI", nie B&G (podnet 87)', () => {
    const krok5 = WIZARD_STEPS.find((k) => k.id === 5)!;
    expect(krok5.nazov).toBe('Opatrenia pre MZI');
    // Skratka B&G už nemá zostať v žiadnom názve kroku — MZI používame všade.
    for (const krok of WIZARD_STEPS) expect(krok.nazov).not.toContain('B&G');
  });

  it('názov hárku v exporte zostáva „B&G opatrenia" — je to existujúci kontrakt', () => {
    // Premenovanie kroku je zmena textu v UI. Názvy hárkov v XLSX čítajú xMatik
    // a Klimasken, preto ich toto premenovanie zámerne nechalo tak.
    const areal = createEmptyAreal();
    const nazvy = harkyExportu(areal, computeScore(areal), []).map((h) => h.nazov);
    expect(nazvy).toContain('B&G opatrenia');
  });
});
