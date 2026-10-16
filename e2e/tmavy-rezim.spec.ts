import { test, expect, Page } from '@playwright/test';
import { openClean } from './helpers/stubs';

/**
 * Svetlý / tmavý režim (docs/tmavy-rezim.md): voľba v Menu, predvolene Auto
 * podľa systému/prehliadača, voľba sa pamätá po obnovení stránky.
 */
const tema = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);

async function zvolVzhlad(page: Page, nazov: 'Svetlý' | 'Tmavý' | 'Auto') {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('volba-vzhladu').getByRole('radio', { name: nazov }).click();
}

test('Auto sa riadi systémom: tmavý systém → tmavá VESMA', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openClean(page);
  expect(await tema(page)).toBe('dark');
  // Plocha kariet naozaj stmavne (nie je biela).
  const pozadie = await page.locator('header').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(pozadie).not.toBe('rgb(255, 255, 255)');
});

test('Auto sa riadi systémom: svetlý systém → svetlá VESMA s pôvodnou bielou', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await openClean(page);
  expect(await tema(page)).toBe('light');
  const pozadie = await page.locator('header').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(pozadie).toBe('rgb(255, 255, 255)');
});

test('voľba v menu prepne režim, pamätá sa a Auto sa znova riadi systémom', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await openClean(page);

  await zvolVzhlad(page, 'Tmavý');
  expect(await tema(page)).toBe('dark');

  await page.reload();
  expect(await tema(page)).toBe('dark');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByTestId('volba-vzhladu').getByRole('radio', { name: 'Tmavý' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');

  await zvolVzhlad(page, 'Auto');
  expect(await tema(page)).toBe('light');

  // Pri Auto sa zmena v systéme prejaví bez obnovenia stránky.
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => tema(page)).toBe('dark');

  await zvolVzhlad(page, 'Svetlý');
  expect(await tema(page)).toBe('light');
});
