import { test, expect } from '@playwright/test';
import { openClean, openCleanBezNazvu, goToResults } from './helpers/stubs';
import { kartaSkore, stiahniXlsx, textZosita } from './helpers/entity';

/**
 * STAV BEZ DÁT.
 *
 * Zdokumentovaný krehký bod VESMA: prázdny areál / čerstvá session občas
 * vyzerá ako "chyba zobrazenia", hoci ide o legitímny stav bez dát.
 * Tento test fixuje očakávanie: s úplne prázdnym areálom sa Výsledky
 * vykreslia BEZ pádu, komponenty MZI sa priznajú ako „bez údajov" (nula by
 * sa čítala ako zlý výsledok, hoci hodnotiť nie je z čoho) a export prejde —
 * mapér si zošit sťahuje aj z rozrobenej obhliadky.
 *
 * Slúži aj ako ochrana pred slepými UI opravami auto-fix agenta:
 * ak "oprava" rozbije render prázdneho stavu, tento test spadne.
 */
test('Výsledky s prázdnym areálom: vykreslia sa, MZI je bez údajov a export prejde', async ({ page }) => {
  test.setTimeout(90_000);
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  await openClean(page);
  await goToResults(page);

  // Stránka žije, exportná sekcia je prítomná, žiadna nezachytená výnimka.
  await expect(page.getByText('Export výsledkov')).toBeVisible();
  await expect(kartaSkore(page, 'MZI')).toContainText('bez údajov');

  const zosit = await stiahniXlsx(page);
  expect(zosit.SheetNames).toEqual(
    expect.arrayContaining(['Súhrn', 'Pozemky', 'Budovy', 'Odporúčania']),
  );
  // Zošit prázdneho areálu nie je prázdny súbor — nesie aspoň to, čo je zadané.
  expect(textZosita(zosit)).toContain('Testovací areál');

  expect(consoleErrors, `Nezachytené chyby: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

/**
 * Čerstvá relácia — používateľ otvorí VESMA prvýkrát a ešte nič nezadal.
 * Prázdny formulár nie je chyba zobrazenia: Krok 1 sa vykreslí, „Ďalej" je
 * zakázané, kým nie je názov areálu, a po jeho zadaní sa odomkne.
 */
test('čerstvá relácia sa otvorí na Kroku 1 a Ďalej odomkne až názov areálu', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  await openCleanBezNazvu(page);

  const dalej = page.getByRole('button', { name: /Ďalej/ }).first();
  await expect(dalej).toBeDisabled();

  await page.getByPlaceholder('napr. Základná škola Lipová').fill('Testovací areál');
  await expect(dalej).toBeEnabled();

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

  // To isté pravidlo platí aj pre export — inak by si obec zo zošita prečítala
  // nulu tam, kde sa nehodnotí (#203, #206, #208 je jedna trieda opráv, nie tri).
  const text = textZosita(await stiahniXlsx(page));
  expect(text).toContain('OZE sa nehodnotí — areál nemá zadanú žiadnu budovu.');
  expect(text).toContain('Energetika sa nehodnotí — areál nemá zadanú žiadnu budovu.');
  expect(text).toContain('nehodnotené');

  expect(consoleErrors, `Nezachytené chyby: ${consoleErrors.join('\n')}`).toHaveLength(0);
});
