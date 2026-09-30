import { test, expect } from '@playwright/test';
import { openClean } from './helpers/stubs';

/**
 * CHATBOT – asistent mapera.
 *
 * Chatbot je klientský FAQ bot bez externých volaní – odpovede sú synchrónne.
 * Test overuje základný tok: panel sa otvorí, správa odíde, odpoveď príde.
 */
test.describe('Chatbot – asistent mapera', () => {
  test.beforeEach(async ({ page }) => {
    await openClean(page);
  });

  test('panel sa otvorí kliknutím na tlačidlo Asistent', async ({ page }) => {
    await page.getByRole('button', { name: /Asistent/ }).click();
    await expect(page.getByPlaceholder('Napíšte otázku…')).toBeVisible();
  });

  test('odoslaná správa dostane odpoveď od bota', async ({ page }) => {
    await page.getByRole('button', { name: /Asistent/ }).click();

    const input = page.getByPlaceholder('Napíšte otázku…');
    await input.fill('Čo je VESMA?');
    await input.press('Enter');

    // Odpoveď obsahuje unikátny fragment z FAQ – kontrakt základnej odpovede.
    await expect(page.getByText(/metodický nástroj vyvinutý/)).toBeVisible();
  });

  test('na otázku o záhradnej chatke odpovie, že rozhodujú základy', async ({ page }) => {
    await page.getByRole('button', { name: /Asistent/ }).click();

    const input = page.getByPlaceholder('Napíšte otázku…');
    await input.fill('Kam patrí záhradná chatka?');
    await input.press('Enter');

    await expect(page.getByText(/základy v zemi/).first()).toBeVisible();
    await expect(page.getByText(/sezónna nevykurovaná stavba/).first()).toBeVisible();
  });

  test('na neznámu otázku príde fallback odpoveď', async ({ page }) => {
    await page.getByRole('button', { name: /Asistent/ }).click();

    const input = page.getByPlaceholder('Napíšte otázku…');
    await input.fill('blablabla nezmysel xyz');
    await input.press('Enter');

    await expect(page.getByText(/nemám presnú odpoveď/)).toBeVisible();
  });

  test('klik na kontextovú otázku odošle správu a dostane odpoveď', async ({ page }) => {
    await page.getByRole('button', { name: /Asistent/ }).click();

    // Na Kroku 1 sú kontextové otázky – prvá z nich je vždy prítomná.
    const kontextOtazka = page.getByText('Čo je VESMA?');
    await kontextOtazka.click();

    await expect(page.getByText(/metodický nástroj vyvinutý/)).toBeVisible();
  });
});
