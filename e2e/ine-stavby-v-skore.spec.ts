import { test, expect } from '@playwright/test';
import { openClean, clickNext } from './helpers/stubs';
import { kartaSkore, pole, stiahniXlsx, textZosita } from './helpers/entity';

/**
 * INÉ STAVBY VSTUPUJÚ DO MZI (issue #233).
 *
 * Rozhodnutie zadávateľa: zastavaná plocha oplotenia, chodníka či parkoviska
 * je nepriepustná plocha a do skóre vstupuje. Dvojité započítanie rieši Krok 2,
 * kde sa výmery zadávajú bez týchto stavieb — a Krok 2 to musí povedať nahlas,
 * inak mapér tú istú plochu zadá dvakrát a areál si bezdôvodne pohorší.
 *
 * Z kódu sa nedá overiť ani jedno: ani že sa plocha cez UI naozaj dostane do
 * rozpisu skóre, ani že upozornenie v Kroku 2 vidno.
 *
 * Dlhší časový limit: test prechádza celý wizard a sťahuje zošit.
 */
test.setTimeout(120_000);

const PLOCHA_STAVBY = '300';

test('zadaná iná stavba je v rozpise MZI ako nepriepustná plocha', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  await clickNext(page); // Krok 2 – Pozemky

  // 100 m² polopriepustnej plochy; 300 m² altánku ju v koeficiente preváži.
  await pole(page, 'Spevnený (polopriepustný) povrch celkom').fill('100');

  await clickNext(page); // Krok 3 – Budovy
  await clickNext(page); // Krok 4 – Iné stavby

  await page.getByRole('button', { name: 'Pridať inú stavbu' }).click();
  await pole(page, 'Názov stavby').fill('Altánok na dvore');
  await pole(page, 'Zastavaná plocha').fill(PLOCHA_STAVBY);

  await clickNext(page); // Krok 5
  await clickNext(page); // Krok 6 – Výsledky
  await expect(page.getByText('Export výsledkov')).toBeVisible();

  // Plocha je v rozpise MZI — teda naozaj vstúpila do hodnotenia.
  const mzi = kartaSkore(page, 'MZI');
  await expect(mzi).toContainText(`${PLOCHA_STAVBY} m²`);
  await expect(mzi).toContainText('nepriepustná spevnená plocha');

  // A to isté nesie export, nielen obrazovka.
  const text = textZosita(await stiahniXlsx(page));
  expect(text).toContain('Iné stavby (zastavaná plocha)');
  expect(text).toContain('Altánok na dvore');

  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});

test('Krok 2 upozorní, že plochy iných stavieb sa do výmer nezapočítavajú', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  await clickNext(page);

  // Pravidlo je na Kroku 2 napísané aj bez jedinej zadanej stavby.
  await expect(page.getByText(/zastavanú plochu stavieb z kroku/)).toBeVisible();

  // Po zadaní stavby pribudne konkrétne číslo, aby mapér vedel, čo neopakovať.
  for (let i = 0; i < 2; i++) await clickNext(page);
  await page.getByRole('button', { name: 'Pridať inú stavbu' }).click();
  await pole(page, 'Zastavaná plocha').fill(PLOCHA_STAVBY);

  await page.getByRole('button', { name: /Späť/ }).first().click();
  await page.getByRole('button', { name: /Späť/ }).first().click();

  await expect(page.getByText(/V kroku Iné stavby máte zadaných/)).toContainText(`${PLOCHA_STAVBY} m²`);

  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});
