import { test, expect, type Page } from '@playwright/test';
import { openClean } from './helpers/stubs';

/**
 * Ulice zvolenej obce z Registra adries (podnet 98). Keď sú ulice obce k dispozícii,
 * návrhy sú lokálne a externá služba (Photon) sa nevolá. V obci bez ulíc platí pôvodné
 * správanie.
 */

async function vyberObec(page: Page, nazov: string) {
  await page.getByPlaceholder('napr. Likavka').fill(nazov);
  await page.getByRole('listitem').filter({ hasText: new RegExp(`^${nazov}$`) }).first().click();
}

function pocitajPhoton(page: Page): { pocet: () => number } {
  let n = 0;
  // Registrácia po openClean má prednosť pred predvoleným stubom.
  void page.route(/photon\.komoot\.io/, (route) => {
    n += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: [] }) });
  });
  return { pocet: () => n };
}

test('v obci s ulicami sa ponúkajú ulice z registra a Photon sa nevolá', async ({ page }) => {
  await openClean(page);
  const photon = pocitajPhoton(page);
  await vyberObec(page, 'Ružomberok');

  const ulica = page.getByPlaceholder('napr. Hlavná 15');
  await ulica.fill('Andr');
  await expect(page.getByText('Ulice v obci Ružomberok (Register adries)')).toBeVisible();
  await page.getByRole('listitem').filter({ hasText: /^Andreja Hlinku$/ }).click();
  await expect(ulica).toHaveValue('Andreja Hlinku ');

  // Po dopísaní čísla a ďalšom hľadaní sa číslo zachová a Photon sa stále nevolal.
  await ulica.fill('Andreja Hl 12');
  await page.getByRole('listitem').filter({ hasText: /^Andreja Hlinku$/ }).click();
  await expect(ulica).toHaveValue('Andreja Hlinku 12');
  await page.waitForTimeout(500);
  expect(photon.pocet()).toBe(0);
});

test('v obci bez ulíc ostáva pôvodné správanie (návrhy z externej služby)', async ({ page }) => {
  await openClean(page);
  const photon = pocitajPhoton(page);
  await vyberObec(page, 'Likavka');

  await page.getByPlaceholder('napr. Hlavná 15').fill('Hlavná');
  await expect.poll(() => photon.pocet(), { timeout: 5000 }).toBeGreaterThan(0);
  await expect(page.getByText(/Register adries\)/)).toHaveCount(0);
});

test('obec vo viacerých okresoch ponúkne ulice až po výbere okresu', async ({ page }) => {
  await openClean(page);
  await vyberObec(page, 'Selce');

  const ulica = page.getByPlaceholder('napr. Hlavná 15');
  await ulica.fill('Hlav');
  await expect(page.getByText(/Register adries\)/)).toHaveCount(0);

  await page.locator('select').filter({ has: page.locator('option', { hasText: 'Banská Bystrica' }) })
    .selectOption('Banská Bystrica');
  await ulica.fill('');
  await ulica.fill('a');
  await expect(page.getByText('Ulice v obci Selce (Register adries)')).toBeVisible();
});

test('ulica s číslicou v názve (1.mája) sa ponúkne a číslo domu sa nerozreže', async ({ page }) => {
  await openClean(page);
  await vyberObec(page, 'Námestovo');

  const ulica = page.getByPlaceholder('napr. Hlavná 15');
  await ulica.fill('1.m');
  await page.getByRole('listitem').filter({ hasText: /^1\.mája$/ }).click();
  await expect(ulica).toHaveValue('1.mája ');

  await ulica.fill('1.mája 7');
  await ulica.press('Home');
  await ulica.press('End');
  await expect(ulica).toHaveValue('1.mája 7');
});
