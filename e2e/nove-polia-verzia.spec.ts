import { test, expect } from '@playwright/test';
import { openClean, clickNext } from './helpers/stubs';

/**
 * NOVÉ POLIA A VERZIA RELÁCIE (issues #177 a #183).
 *
 * Overuje dve veci, ktoré sa z kódu nedajú overiť:
 *  1. nové otázky sa naozaj vykreslia vo formulári budovy,
 *  2. relácia uložená v staršej verzii schémy zobrazí po otvorení pripomienku
 *     a dotknuté polia sú vo formulári farebne odlíšené.
 *
 * Dlhší časový limit: vykreslenie kroku Budovy je v dev serveri pomalšie,
 * formulár je rozsiahly a test ho otvára dvakrát.
 */
test.setTimeout(90_000);

test('nové otázky o rozvodoch a počet svietidiel sú vo formulári budovy', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  await clickNext(page);
  await clickNext(page); // krok 3 – Budovy

  await expect(page.getByText('Hydraulicky vyregulovaný vykurovací systém')).toBeVisible();
  await expect(page.getByText('Zaizolované rozvody tepla a teplej vody')).toBeVisible();
  await expect(page.getByText('Počet svietidiel celkom')).toBeVisible();
  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});

test('relácia zo staršej verzie zobrazí pripomienku a zvýrazní nové polia', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  // Podstrčíme areál "starej verzie" – bez čísla verzie a bez nových polí budovy.
  await page.evaluate(() => {
    const raw = localStorage.getItem('sma-nastroj-areal');
    const areal = raw ? JSON.parse(raw) : {};
    delete areal.schemaVersion;
    areal.nazov = 'Stará relácia';
    areal.budovy = [{ id: 'b1', nazov: 'Hlavná budova', uzitkovaPlochaNUS: 800 }];
    localStorage.setItem('sma-nastroj-areal', JSON.stringify(areal));
  });
  await page.reload();

  await expect(page.getByText('pribudli nové otázky')).toBeVisible();
  await expect(page.getByText('Hlavná budova')).toBeVisible();

  await page.getByRole('button', { name: 'Prejsť na Budovy' }).click();
  await expect(page.getByText('nové pole — doplňte').first()).toBeVisible();
  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});
