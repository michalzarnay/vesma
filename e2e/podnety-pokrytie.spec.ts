import { test, expect } from '@playwright/test';
import { openClean, clickNext } from './helpers/stubs';

/**
 * POKRYTIE ZBERU PODNETOV.
 *
 * Ikonka „Pridať podnet" bola pôvodne len v NumberInput a TextInput, takže
 * pri skupinách percent, výberových otázkach, obci a adrese chýbala.
 * Testy fixujú rozšírené pokrytie, aby sa ikonka nestratila pri ďalších
 * úpravách týchto komponentov.
 *
 * Skladacie sekcie (ConditionalSection) podnet zámerne NEMAJÚ — ich nadpis
 * je vnútri prepínacieho tlačidla a tlačidlo v tlačidle je neplatné HTML.
 */

const PODNET = 'button[aria-label="Pridať podnet"]';

test('Krok 1: podnet je aj pri adrese a obci', async ({ page }) => {
  await openClean(page);

  const prvky = await page.locator(PODNET).evaluateAll((btns) =>
    btns.map((b) => b.parentElement?.textContent?.trim() ?? ''),
  );

  expect(prvky).toContain('Názov areálu'); // TextInput – pôvodné pokrytie
  expect(prvky).toContain('Ulica + číslo'); // AddressAutocomplete – nové
  expect(prvky).toContain('Obec'); // ComboboxInput – nové
});

test('Krok 2: podnet je pri nadpise skupiny percent aj pri jej položkách', async ({ page }) => {
  await openClean(page);
  await clickNext(page);

  // Skupina „Odvod vody z pozemku" sa zobrazí až po zadaní výmery parcely.
  await page.getByRole('button', { name: 'Zobraziť nápovedu' }).first().waitFor();
  await page.locator('input[type="number"]').first().fill('1000');

  const nadpisSkupiny = page.locator('h4', { hasText: 'Odvod vody z pozemku' });
  await expect(nadpisSkupiny).toBeVisible();

  // Podnet k celej skupine.
  await expect(nadpisSkupiny.locator(PODNET)).toHaveCount(1);
  await nadpisSkupiny.locator(PODNET).click();
  const nadpisDialogu = page.getByRole('heading', { name: /^Podnet k:/ });
  await expect(nadpisDialogu).toHaveText('Podnet k: Odvod vody z pozemku');
  await page.getByRole('button', { name: 'Zavrieť' }).click();

  // Podnet k jednotlivej položke nesie aj názov skupiny, aby bol zaradený.
  const polozka = page.locator('label', { hasText: 'cielené vsakovanie' }).first();
  await polozka.locator(PODNET).click();
  await expect(nadpisDialogu).toContainText('Podnet k: Odvod vody z pozemku – ');
});

test('Krok 3: podnet je aj pri výberových otázkach (SelectCard)', async ({ page }) => {
  await openClean(page);
  await clickNext(page);
  await clickNext(page);

  const otazka = page
    .locator('label', { hasText: 'Je rok výstavby budovy pred rokom 1980?' })
    .first();
  await expect(otazka.locator(PODNET)).toHaveCount(1);
});

test('Ikonka podnetu nikdy nevytvorí tlačidlo vnútri tlačidla', async ({ page }) => {
  await openClean(page);
  await clickNext(page);

  expect(await page.locator('button button').count()).toBe(0);
});
