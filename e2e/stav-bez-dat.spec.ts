import { test, expect } from '@playwright/test';
import { openClean, goToResults } from './helpers/stubs';

/**
 * STAV BEZ DÁT.
 *
 * Zdokumentovaný krehký bod VESMA: prázdny areál / čerstvá session občas
 * vyzerá ako "chyba zobrazenia", hoci ide o legitímny stav bez dát.
 * Tento test fixuje očakávanie: s úplne prázdnym areálom sa Výsledky
 * vykreslia BEZ pádu a zobrazia exportnú sekciu.
 *
 * Slúži aj ako ochrana pred slepými UI opravami auto-fix agenta:
 * ak "oprava" rozbije render prázdneho stavu, tento test spadne.
 */
test('Výsledky s prázdnym areálom sa vykreslia bez pádu', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  await openClean(page);
  await goToResults(page);

  // Stránka žije, exportná sekcia je prítomná, žiadna nezachytená výnimka.
  await expect(page.getByText('Export výsledkov')).toBeVisible();
  expect(consoleErrors, `Nezachytené chyby: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

/**
 * Areál bez jedinej budovy (issues #204 a #205). OZE ani energetiku nie je
 * z čoho počítať — obe stoja na budovách — tak sa nehodnotia: namiesto
 * ukazovateľa je vysvetlenie a do celkového skóre nevstupuje nula.
 */
test('areál bez budov nezobrazí OZE ani energetiku ako nulu, ale ako nehodnotené', async ({ page }) => {
  // Test appku načíta dvakrát (podstrčenie areálu do localStorage + reload),
  // čo v dev serveri prekračuje predvolený limit — rovnako ako nove-polia-verzia.spec.ts.
  test.setTimeout(90_000);
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  await openClean(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('sma-nastroj-areal');
    const areal = raw ? JSON.parse(raw) : {};
    areal.budovy = [];
    localStorage.setItem('sma-nastroj-areal', JSON.stringify(areal));
  });
  await page.reload();
  await goToResults(page);

  await expect(page.getByText('nehodnotí sa')).toHaveCount(2);
  await expect(page.getByText(/OZE skóre stojí na strechách a zdrojoch tepla budov/)).toBeVisible();
  await expect(page.getByText(/Energetickú efektívnosť nie je z čoho počítať/)).toBeVisible();
  expect(consoleErrors, `Nezachytené chyby: ${consoleErrors.join('\n')}`).toHaveLength(0);
});
