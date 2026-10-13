import { test, expect } from '@playwright/test';
import { openClean, clickNext, goToResults } from './helpers/stubs';

/**
 * SMOKE: preklik celým dotazníkom.
 *
 * Navigácia v useWizard NIE JE blokovaná validáciou, takže prejdeme všetkými
 * 6 krokmi aj s prázdnym areálom. Tento test je prvá obranná línia – chytí
 * pád pri vykreslení ktoréhokoľvek kroku (vrátane stavu bez dát na Výsledkoch).
 */
test.describe('Smoke – preklik wizardom', () => {
  test.beforeEach(async ({ page }) => {
    await openClean(page);
  });

  test('appka nabehne na Kroku 1', async ({ page }) => {
    // Krok 1 = Identifikácia areálu. Hlavné tlačidlo "Ďalej" je viditeľné,
    // tlačidlo "Späť" je na prvom kroku zakázané.
    await expect(page.getByRole('button', { name: /Ďalej/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Späť/ }).first()).toBeDisabled();
  });

  test('prejde všetkými 6 krokmi až na Výsledky', async ({ page }) => {
    // 5× Ďalej → Krok 6
    for (let i = 0; i < 5; i++) {
      await clickNext(page);
    }

    // Na Kroku 6 sa zobrazuje sekcia exportu a tri exportné tlačidlá.
    await expect(page.getByText('Export výsledkov')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportovať XLSX' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stiahnuť PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportovať CSV' })).toBeVisible();

    // Žiadne nezachytené chyby v konzole pri prechode (voliteľná, ale užitočná poistka).
  });

  test('rýchla navigácia späť na Krok 1 funguje', async ({ page }) => {
    await goToResults(page);
    // Na vyšších krokoch je k dispozícii skratka "Na začiatok".
    await page.getByRole('button', { name: /Na začiatok/ }).click();
    await expect(page.getByRole('button', { name: /Späť/ }).first()).toBeDisabled();
  });
});
