import { test, expect } from '@playwright/test';
import { openClean } from './helpers/stubs';

/**
 * UPOZORNENIE NA ZMENU PRAVIDIEL HODNOTENIA.
 *
 * Overuje to, čo sa z kódu overiť nedá: že relácia vyhodnotená podľa starších
 * pravidiel naozaj otvorí dialógové okno, že sa dá zavrieť a že sa po potvrdení
 * pri ďalšom otvorení už neopakuje.
 *
 * Dlhší časový limit: test appku dvakrát znovu načíta a dev server je pri prvom
 * načítaní pomalší.
 */
test.setTimeout(90_000);

test('relácia zo staršej verzie pravidiel otvorí upozornenie a po potvrdení sa neopakuje', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', (e) => chyby.push(String(e)));

  await openClean(page);
  // Podstrčíme areál vyhodnotený pred zavedením sledovania verzií pravidiel.
  await page.evaluate(() => {
    const raw = localStorage.getItem('sma-nastroj-areal');
    const areal = raw ? JSON.parse(raw) : {};
    delete areal.pravidlaVersion;
    areal.nazov = 'Relácia zo starých pravidiel';
    localStorage.setItem('sma-nastroj-areal', JSON.stringify(areal));
  });
  await page.reload();

  const dialog = page.getByRole('dialog', { name: 'Pravidlá hodnotenia sa od uloženia relácie zmenili' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('môžu byť iné')).toBeVisible();

  await dialog.getByRole('button', { name: 'Rozumiem, pokračovať' }).click();
  await expect(dialog).toBeHidden();

  // Potvrdenie sa zapíše do areálu, takže obnovenie stránky upozornenie neprinesie znova.
  await page.reload();
  await expect(page.getByText('Pravidlá hodnotenia sa od uloženia relácie zmenili')).toBeHidden();

  expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
});

test('čerstvá relácia žiadne upozornenie na zmenu pravidiel nedostane', async ({ page }) => {
  await openClean(page);

  await expect(page.getByText('Pravidlá hodnotenia sa od uloženia relácie zmenili')).toBeHidden();
});
