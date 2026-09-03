import { test, expect } from '@playwright/test';
import { openClean, goToResults } from './helpers/stubs';
import { kartaSkore, stiahniXlsx, textZosita } from './helpers/entity';

/**
 * PREČO KOMPONENT NEMÁ BODY (issue #213).
 *
 * Rozpis skóre vie povedať, za čo body sú. Komponent, ktorý sa nedal vypočítať,
 * však ukazoval len „bez údajov" — hodnotiteľ z toho nezistil, či na niečo
 * zabudol, alebo či je taký areál. Teraz je pri ňom napísané, ktorý údaj chýba,
 * a to isté nesie aj export.
 *
 * Dlhší časový limit: test prechádza celý wizard a sťahuje zošit.
 */
test.setTimeout(90_000);

test('prázdny areál povie pri každom komponente MZI, ktorý údaj chýba', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  await goToResults(page);

  const mzi = kartaSkore(page, 'MZI');
  await expect(mzi).toContainText('bez údajov');
  await expect(mzi).toContainText('V kroku Pozemky nie je zadaná výmera žiadneho povrchu');
  await expect(mzi).toContainText('V kroku Budovy nie je zadaná plocha pôdorysu');
  await expect(mzi).toContainText('Optimálny objem nádrže sa nedá určiť');
  await expect(mzi).toContainText('nie je čo hodnotiť');

  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});

test('dôvod, prečo komponent nemá body, je aj v exporte', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  await goToResults(page);

  const text = textZosita(await stiahniXlsx(page));
  expect(text).toContain('Žiadny komponent MZI sa nedal vypočítať:');
  expect(text).toContain('Priepustnosť a zeleň areálu: bez údajov');
  expect(text).toContain('V kroku Pozemky nie je zadaná výmera žiadneho povrchu');

  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});
