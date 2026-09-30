import { test, expect, Page } from '@playwright/test';
import { openClean, clickNext } from './helpers/stubs';

/**
 * Hlavička a pohyb medzi kartami — podnety 78, 84, 85.
 *
 * Karty v hlavičke sú v `sticky` páse, takže sa na ne dá kliknúť bez skrolovania.
 * Testy ich preto používajú namiesto tlačidla „Ďalej" na konci karty — inak by
 * Playwright pri klikaní sám odskroloval stránku a zmeral by vlastný pohyb.
 */
function kartaVHlavicke(page: Page, krok: number) {
  return page.locator('header button', { hasText: new RegExp(`^${krok}`) }).first();
}

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

test('názov areálu zostáva v hlavičke viditeľný na každej karte (podnet 84)', async ({ page }) => {
  await openClean(page);
  const nazov = page.getByTestId('nazov-arealu');
  await expect(nazov).toHaveText('Testovací areál');

  for (const krok of [2, 3, 4]) {
    await kartaVHlavicke(page, krok).click();
    await expect(nazov).toHaveText('Testovací areál');
  }
});

test('bez názvu areálu hlavička ukáže podtitul aplikácie (podnet 84)', async ({ page }) => {
  await openClean(page);
  await page.getByPlaceholder('napr. Základná škola Lipová').fill('');
  await expect(page.getByTestId('nazov-arealu')).toHaveCount(0);
  await expect(page.locator('header').getByText('Voda a energia – sprievodca mapovaním areálov')).toBeVisible();
});

test('vedľajšie akcie sú schované pod tlačidlom Menu (podnet 85)', async ({ page }) => {
  await openClean(page);

  // Priamo v hlavičke zostáva len Podnet — zvyšok je v menu.
  await expect(page.getByRole('button', { name: 'Podnet', exact: true })).toBeVisible();
  for (const akcia of ['Nový areál', 'Uložené relácie', 'Porovnanie areálov']) {
    await expect(page.getByRole('button', { name: akcia })).toHaveCount(0);
  }

  await page.getByRole('button', { name: 'Menu' }).click();
  for (const akcia of ['Nový areál', 'Uložené relácie', 'Porovnanie areálov']) {
    await expect(page.getByRole('button', { name: akcia })).toBeVisible();
  }

  // Dialóg relácií prežije zavretie menu — komponent je mimo neho.
  await page.getByRole('button', { name: 'Uložené relácie' }).click();
  await expect(page.getByRole('heading', { name: 'Správa relácií' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nový areál' })).toHaveCount(0);
});

test('nová karta sa otvorí od vrchu, návrat obnoví miesto, kde mapér skončil (podnet 78)', async ({ page }) => {
  await openClean(page);

  // Karta Budovy je dosť dlhá na to, aby sa dala odskrolovať.
  await kartaVHlavicke(page, 3).click();
  expect(await scrollY(page)).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 700));
  const kdeSomSkoncil = await scrollY(page);
  expect(kdeSomSkoncil).toBeGreaterThan(300);

  // Prvý príchod na Iné stavby — karta začína hore, nie tam, kde skončili Budovy.
  await kartaVHlavicke(page, 4).click();
  expect(await scrollY(page)).toBe(0);

  // Návrat na Budovy vráti mapéra tam, kde prestal.
  await kartaVHlavicke(page, 3).click();
  expect(await scrollY(page)).toBe(kdeSomSkoncil);
});

test('nový areál zabudne uložené pozície kariet (podnet 78)', async ({ page }) => {
  await openClean(page);
  await kartaVHlavicke(page, 3).click();
  await page.evaluate(() => window.scrollTo(0, 700));
  expect(await scrollY(page)).toBeGreaterThan(300);

  await kartaVHlavicke(page, 2).click();
  // Areál má vyplnený názov, takže „Nový areál" pýta potvrdenie.
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Nový areál' }).click();

  await kartaVHlavicke(page, 3).click();
  expect(await scrollY(page)).toBe(0);
});

test('pri jedinej hodnotenej oblasti dostane rozpis skóre celú šírku (podnet 86)', async ({ page }) => {
  await openClean(page);
  // „Len voda" — hodnotí sa jedine MZI, mriežka teda nemá mať tri stĺpce.
  await page.getByRole('button', { name: /^Voda [A-ZČ]/ }).click();
  for (let i = 0; i < 5; i++) await clickNext(page);

  const mriezka = page.locator('div.grid').filter({ hasText: 'Priepustnosť a zeleň areálu' }).last();
  await expect(mriezka).not.toHaveClass(/md:grid-cols-3/);
});
