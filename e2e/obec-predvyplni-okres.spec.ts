import { test, expect } from '@playwright/test';
import { openClean } from './helpers/stubs';

/**
 * Výber obce z číselníka (Register adries) predvyplní okres a kraj (podnety 99, 100).
 * Obec, ktorá je vo viacerých okresoch, okres nehádá, len na to upozorní.
 */

async function vyberObec(page: import('@playwright/test').Page, nazov: string) {
  const pole = page.getByPlaceholder('napr. Likavka');
  await pole.fill(nazov);
  await page.getByRole('listitem').filter({ hasText: new RegExp(`^${nazov}$`) }).first().click();
}

test('obec v jedinom okrese doplní okres aj kraj', async ({ page }) => {
  await openClean(page);
  await vyberObec(page, 'Likavka');

  await expect(page.locator('select').filter({ has: page.locator('option', { hasText: '– vyberte kraj –' }) }))
    .toHaveValue('Žilinský kraj');
  await expect(page.locator('select').filter({ has: page.locator('option', { hasText: 'Ružomberok' }) }))
    .toHaveValue('Ružomberok');
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('obec vo viacerých okresoch okres nehádá a upozorní na výber', async ({ page }) => {
  await openClean(page);
  await vyberObec(page, 'Selce');

  await expect(page.getByRole('status')).toContainText('vo viacerých okresoch');
  await expect(page.locator('select').filter({ has: page.locator('option', { hasText: '– vyberte okres –' }) }))
    .toHaveValue('');

  // Po zvolení jedného z okresov upozornenie zmizne.
  const okres = page.locator('select').filter({ has: page.locator('option', { hasText: 'Poltár' }) });
  await okres.selectOption('Poltár');
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('obec, ktorá v starom zozname chýbala, sa už dá vybrať', async ({ page }) => {
  await openClean(page);
  await vyberObec(page, 'Abrahámovce');
  await expect(page.getByPlaceholder('napr. Likavka')).toHaveValue('Abrahámovce');
});
