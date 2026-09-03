import { test, expect } from '@playwright/test';
import { openClean, clickNext } from './helpers/stubs';

/**
 * SEZÓNNA NEVYKUROVANÁ STAVBA (letné sídlo – záhradná chata).
 *
 * Z kódu sa nedá overiť, že sa otázka naozaj vykreslí a že po jej zapnutí
 * vidí používateľ vysvetlenie, čo to s hodnotením urobí. Test overuje presne to.
 *
 * Dlhší časový limit: formulár budovy je rozsiahly a v dev serveri sa vykresľuje
 * pomalšie (rovnaký dôvod ako v nove-polia-verzia.spec.ts).
 */
test.setTimeout(90_000);

const OTAZKA = 'Je to sezónna nevykurovaná stavba (letné sídlo)?';

test('otázka o sezónnej nevykurovanej stavbe je vo formulári budovy', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  await clickNext(page);
  await clickNext(page); // krok 3 – Budovy

  await expect(page.getByText(OTAZKA)).toBeVisible();
  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});

test('po označení stavby ako sezónnej sa zobrazí vysvetlenie hodnotenia', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  await clickNext(page);
  await clickNext(page); // krok 3 – Budovy

  // Odpoveď „áno" pri tejto otázke — SelectCard vykresľuje možnosti ako tlačidlá.
  const otazka = page.locator('div').filter({ hasText: OTAZKA }).last();
  await otazka.getByRole('button', { name: 'áno', exact: true }).click();

  await expect(page.getByText('sezónna nevykurovaná').first()).toBeVisible();
  await expect(page.getByText(/nebude počítať potenciál zateplenia/).first()).toBeVisible();
  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});
