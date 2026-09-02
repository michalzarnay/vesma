import { test, expect } from '@playwright/test';
import { openClean, goToResults } from './helpers/stubs';

/**
 * VÝSLEDKY + EXPORT.
 *
 * Overuje, že krok Výsledky sa korektne vykreslí a že export XLSX/CSV reálne
 * spustí stiahnutie súboru (generuje sa na klientovi, funguje aj offline).
 * Export je v `CLAUDE.md` označený ako kontrakt – tento test ho NEMENÍ,
 * len stráži, že tlačidlo stále produkuje súbor so správnym názvom.
 */

const NAZOV_AREALU = 'Testovací areál'; // rovnaká hodnota ako v openClean

test.describe('Výsledky a export', () => {
  test.beforeEach(async ({ page }) => {
    await openClean(page);
  });

  test('export XLSX – názov súboru obsahuje názov areálu a dnešný dátum', async ({ page }) => {
    await goToResults(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportovať XLSX' }).click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.xlsx$/i);
    expect(filename).toContain(NAZOV_AREALU);
    // Dátum vo formáte YYYY-MM-DD je implicitný kontrakt exportu.
    expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('obrazovka Výsledky uvádza, že VESMA nie je energetický audit (issue #175)', async ({ page }) => {
    await goToResults(page);
    await expect(page.getByText(/nie energetický audit podľa § 2 vyhlášky MH SR č\. 179\/2015 Z\. z\./)).toBeVisible();
  });

  test('export CSV – názov súboru obsahuje názov areálu', async ({ page }) => {
    await goToResults(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportovať CSV' }).click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.csv$/i);
    expect(filename).toContain(NAZOV_AREALU);
  });
});
