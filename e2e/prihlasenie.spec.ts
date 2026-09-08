import { test, expect, Page } from '@playwright/test';
import { stubExternalApis } from './helpers/stubs';

/**
 * PRIHLÁSENIE E-MAILOM.
 *
 * Keď je prihlásenie na serveri zapnuté, appka je za bránou: e-mail →
 * prihlasovací odkaz → kliknutie odomkne appku na rok. Podnety a otázky potom
 * nesú overený e-mail. Keď je vypnuté (lokálny dev server, chýbajúca
 * konfigurácia), brána sa neukáže — to strážia ostatné e2e testy cez stub.
 */

async function zapniPrihlasenie(page: Page, overenieOk = true) {
  await stubExternalApis(page);
  const poziadavky: Array<{ url: string; body: unknown }> = [];
  await page.route('**/api/prihlasenie**', (route) => {
    if (route.request().method() === 'POST') {
      poziadavky.push({ url: route.request().url(), body: route.request().postDataJSON() });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"aktivne":true}' });
  });
  await page.route('**/api/overenie**', (route) => {
    poziadavky.push({ url: route.request().url(), body: route.request().postDataJSON() });
    return route.fulfill(
      overenieOk
        ? { status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, email: 'starosta@obec.sk', relacia: tokenRelacie() }) }
        : { status: 400, contentType: 'application/json', body: '{"error":"Odkaz je neplatný alebo mu uplynula platnosť. Požiadajte o nový."}' },
    );
  });
  await page.route('**/api/feedback**', (route) => {
    poziadavky.push({ url: route.request().url(), body: route.request().postDataJSON() });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  return poziadavky;
}

/** Token relácie s platnosťou o rok — podpis appka neoveruje, len platnosť z tela. */
function tokenRelacie(): string {
  const telo = Buffer.from(`relacia|starosta@obec.sk|${Date.now() + 365 * 24 * 3600 * 1000}`).toString('base64url');
  return `${telo}.podpis`;
}

test('bez prihlásenia je appka za bránou a odkaz sa pošle na zadaný e-mail', async ({ page }) => {
  const poziadavky = await zapniPrihlasenie(page);
  await page.goto('/vesma/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByTestId('brana')).toBeVisible();
  await expect(page.getByPlaceholder('napr. Základná škola Lipová')).toHaveCount(0);

  await page.getByPlaceholder('meno@obec.sk').fill('Starosta@Obec.sk');
  await page.getByRole('button', { name: 'Poslať prihlasovací odkaz' }).click();
  await expect(page.getByText('Prihlasovací odkaz sme poslali na')).toBeVisible();
  // Odkaz z e-mailu otvorí systém v predvolenom okne — brána musí poradiť, ako
  // ho dostať do okna, v ktorom človek naozaj mapuje (napr. súkromné okno).
  await expect(page.getByText('vložte do adresného riadka')).toBeVisible();
  expect(poziadavky.at(-1)?.body).toEqual({ email: 'starosta@obec.sk' });
});

test('odkaz z e-mailu odomkne appku, prihlásenie prežije obnovenie a podnet nesie e-mail', async ({ page }) => {
  const poziadavky = await zapniPrihlasenie(page);
  await page.goto('/vesma/?token=odkaz-z-emailu');

  // Token sa vymenil za reláciu a zmizol z adresy.
  await expect(page.getByPlaceholder('napr. Základná škola Lipová')).toBeVisible();
  expect(poziadavky[0].body).toMatchObject({ token: 'odkaz-z-emailu' });
  expect(page.url()).not.toContain('token=');
  await expect(page.getByTestId('prihlaseny-pouzivatel')).toContainText('starosta@obec.sk');

  await page.reload();
  await expect(page.getByPlaceholder('napr. Základná škola Lipová')).toBeVisible();

  // Podnet: e-mail je predvyplnený z prihlásenia a odchádza s tokenom relácie.
  await page.getByRole('button', { name: 'Podnet', exact: true }).click();
  await expect(page.getByTitle('E-mail z prihlásenia')).toHaveValue('starosta@obec.sk');
  await page.getByPlaceholder('napr. Chýba jednotka, Nejasný popis...').fill('Testovací podnet');
  await page.getByRole('button', { name: 'Odoslať' }).click();
  await expect(page.getByText('Podnet odoslaný')).toBeVisible();
  const podnet = poziadavky.find((p) => p.url.includes('/api/feedback'))?.body as Record<string, unknown>;
  expect(podnet.email).toBe('starosta@obec.sk');
  expect(typeof podnet.relacia).toBe('string');

  // Odhlásenie vráti bránu.
  await page.getByTestId('prihlaseny-pouzivatel').click();
  await expect(page.getByTestId('brana')).toBeVisible();
});

test('neplatný odkaz ukáže chybu a formulár', async ({ page }) => {
  await zapniPrihlasenie(page, false);
  await page.goto('/vesma/?token=stary');
  await expect(page.getByTestId('brana')).toBeVisible();
  await expect(page.getByText('Odkaz je neplatný alebo mu uplynula platnosť.')).toBeVisible();
});

test('bez prihlásenia je e-mail v podnete povinný', async ({ page }) => {
  await stubExternalApis(page);
  await page.goto('/vesma/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Podnet', exact: true }).click();
  await page.getByPlaceholder('napr. Chýba jednotka, Nejasný popis...').fill('Podnet bez e-mailu');
  const odoslat = page.getByRole('button', { name: 'Odoslať' });
  await expect(odoslat).toBeDisabled();
  await page.getByPlaceholder('meno@obec.sk').fill('tester@obec.sk');
  await expect(odoslat).toBeEnabled();
});
