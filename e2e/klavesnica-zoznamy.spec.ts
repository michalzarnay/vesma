import { test, expect } from '@playwright/test';
import { openClean } from './helpers/stubs';

/**
 * Zoznamy návrhov sa dajú ovládať klávesnicou: šípka nadol vojde do zoznamu,
 * šípky posúvajú, Enter vyberie, Escape zavrie (podnet z testovania).
 */

test('obec: šípka nadol a Enter vyberú návrh bez myši', async ({ page }) => {
  await openClean(page);
  const pole = page.getByPlaceholder('napr. Likavka');
  await pole.fill('Ruž');
  await expect(page.getByRole('listbox').getByRole('option').first()).toBeVisible();

  await pole.press('ArrowDown');
  await expect(page.getByRole('listbox').getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  const nazov = (await page.getByRole('listbox').getByRole('option').first().innerText()).trim();

  await pole.press('Enter');
  await expect(pole).toHaveValue(nazov);
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(0);
});

test('obec: šípka nahor ide od konca a Escape zoznam zavrie', async ({ page }) => {
  await openClean(page);
  const pole = page.getByPlaceholder('napr. Likavka');
  await pole.fill('Ruž');
  const moznosti = page.getByRole('listbox').getByRole('option');
  await expect(moznosti.first()).toBeVisible();
  const pocet = await moznosti.count();

  await pole.press('ArrowUp');
  await expect(moznosti.nth(pocet - 1)).toHaveAttribute('aria-selected', 'true');

  await pole.press('Escape');
  await expect(moznosti).toHaveCount(0);
});

test('ulica: výber ulice šípkami a Enter dosadí ulicu', async ({ page }) => {
  await openClean(page);
  const obec = page.getByPlaceholder('napr. Likavka');
  await obec.fill('Ružomberok');
  await page.getByRole('listbox').getByRole('option').filter({ hasText: /^Ružomberok$/ }).first().click();

  const adresa = page.getByPlaceholder('napr. Hlavná 15');
  await adresa.fill('Andr');
  await adresa.press('ArrowDown');
  const prva = page.getByRole('listbox').getByRole('option').first();
  await expect(prva).toHaveAttribute('aria-selected', 'true');
  const ulica = (await prva.innerText()).trim();

  await adresa.press('Enter');
  await expect(adresa).toHaveValue(new RegExp(`^${ulica}`));
});
