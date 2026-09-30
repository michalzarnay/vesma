import { test, expect } from '@playwright/test';
import { openClean, clickNext } from './helpers/stubs';

/**
 * ROZSAH MAPOVANIA (voda / energia / oboje).
 *
 * Mapér si na kroku 1 vyberie, čo mapuje, a časti dotazníka aj hodnotenia
 * mimo rozsahu sa skryjú. Kroky ostávajú v lište (čísla sedia s Príručkou),
 * len sa vysvetlí, prečo ich možno preskočiť.
 */

/** Tlačidlo výberu rozsahu (SelectCard) — prístupný názov začína menovkou možnosti. */
const ROZSAH = (page: import('@playwright/test').Page, label: string) =>
  page.getByRole('button', { name: new RegExp(`^${label} [A-ZČ]`) });

test('predvolene sa mapuje oboje — dotazník aj Výsledky sú úplné', async ({ page }) => {
  await openClean(page);
  await clickNext(page); // Pozemky
  await expect(page.getByRole('heading', { name: 'Potenciál pre fotovoltiku alebo solárne kolektory' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stromy' })).toBeVisible();
  await clickNext(page); // Budovy
  await expect(page.getByRole('heading', { name: 'Úspory energie' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Voda a splašky' })).toBeVisible();
});

test('„len voda" skryje energetické sekcie, ukazovatele OZE/energie aj energetické odporúčania', async ({ page }) => {
  await openClean(page);
  await ROZSAH(page, 'Voda').click();
  await expect(page.getByText('Potenciál slnečného svitu')).toHaveCount(0);

  await clickNext(page); // Pozemky
  await expect(page.getByRole('heading', { name: 'Stromy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Potenciál pre fotovoltiku alebo solárne kolektory' })).toHaveCount(0);

  await clickNext(page); // Budovy
  await expect(page.getByRole('heading', { name: 'Voda a splašky' })).toBeVisible();
  for (const sekcia of ['Úspory energie', 'Vykurovanie', 'Elektrická energia']) {
    await expect(page.getByRole('heading', { name: sekcia, exact: true })).toHaveCount(0);
  }

  for (let i = 0; i < 3; i++) await clickNext(page); // → Výsledky
  await expect(page.getByText('Export výsledkov')).toBeVisible();
  await expect(page.getByText('Modro-zelená infraštruktúra', { exact: true })).toBeVisible();
  await expect(page.getByText('Obnoviteľné zdroje energie', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Energetická efektívnosť', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Nastavenie váh pre porovnanie areálov')).toHaveCount(0);
});

test('„len energia" skryje vodné sekcie a kroky Iné stavby a Opatrenia pre MZI len upozornia', async ({ page }) => {
  await openClean(page);
  await ROZSAH(page, 'Energia').click();
  await expect(page.getByText('Množstvo zrážok v oblasti')).toHaveCount(0);

  await clickNext(page); // Pozemky
  await expect(page.getByRole('heading', { name: 'Potenciál pre fotovoltiku alebo solárne kolektory' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stromy' })).toHaveCount(0);

  await clickNext(page); // Budovy
  await expect(page.getByRole('heading', { name: 'Úspory energie' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Voda a splašky' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ohrozenie budovy záplavami' })).toHaveCount(0);

  await clickNext(page); // Iné stavby
  await expect(page.getByTestId('mimo-rozsahu')).toBeVisible();
  await clickNext(page); // Opatrenia pre MZI
  await expect(page.getByTestId('mimo-rozsahu')).toBeVisible();

  await clickNext(page); // → Výsledky
  await expect(page.getByText('Export výsledkov')).toBeVisible();
  await expect(page.getByText('Modro-zelená infraštruktúra', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Obnoviteľné zdroje energie', { exact: true })).toBeVisible();
});

test('zmena rozsahu späť na oboje vráti skryté sekcie a údaje sa nestratia', async ({ page }) => {
  await openClean(page);
  await clickNext(page);
  await clickNext(page); // Budovy
  const plyn = page.getByRole('heading', { name: 'Vykurovanie', exact: true });
  await expect(plyn).toBeVisible();

  // Späť na Úvod, prepnúť na vodu a znova na oboje.
  await page.getByRole('button', { name: /Späť|Predchádzajúci/ }).first().click();
  await page.getByRole('button', { name: /Späť|Predchádzajúci/ }).first().click();
  await ROZSAH(page, 'Voda').click();
  await ROZSAH(page, 'Voda aj energia').click();
  await clickNext(page);
  await clickNext(page);
  await expect(plyn).toBeVisible();
});
