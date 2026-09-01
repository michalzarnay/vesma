import { Page, expect } from '@playwright/test';

/**
 * Zmocnenie (stub) externých sietí, aby boli testy deterministické a nezávislé
 * od dostupnosti tretích strán. Volá sa pred `goto`.
 *
 * VESMA volá:
 *  - nominatim.openstreetmap.org  – geokódovanie adresy (Krok 1)
 *  - archive-api.open-meteo.com   – zrážkové dáta (Krok 1)
 *  - photon.komoot.io             – našepkávač adresy
 *  - /api/pvgis, /api/svp-flood   – serverless proxy (solár, povodne)
 *
 * Defaultne vracajú "prázdny" výsledok – appka to spracuje ako stav bez dát,
 * čo je presne to, čo chceme mať pod kontrolou. Konkrétne testy si môžu
 * stub prepísať vlastnými dátami cez `page.route(...)` PO zavolaní tejto funkcie.
 */
export async function stubExternalApis(page: Page): Promise<void> {
  await page.route(/nominatim\.openstreetmap\.org/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );

  await page.route(/archive-api\.open-meteo\.com/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ daily: { precipitation_sum: [] } }),
    }),
  );

  await page.route(/photon\.komoot\.io/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ features: [] }),
    }),
  );

  await page.route('**/api/pvgis**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  await page.route('**/api/svp-flood**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

/**
 * Otvorí appku s čistým stavom (žiadny localStorage z predchádzajúceho behu).
 * Vždy začíname na Kroku 1 s prázdnym areálom.
 */
export async function openClean(page: Page): Promise<void> {
  await stubExternalApis(page);
  // Appka beží pod základnou cestou /vesma/ (rovnako lokálne aj v produkcii).
  await page.goto('/vesma/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  // Vyplň názov areálu, aby prešla validácia Kroku 1 a tlačidlo "Ďalej" bolo aktívne.
  await page.getByPlaceholder('napr. Základná škola Lipová').fill('Testovací areál');
}

/**
 * Klikne na hlavné tlačidlo "Ďalej" a posunie wizard o krok ďalej.
 * Na kroku 1–5 existuje práve jedno tlačidlo s textom "Ďalej".
 */
export async function clickNext(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Ďalej/ }).first().click();
}

/**
 * Preklikne celý wizard z Kroku 1 až na Krok 6 (Výsledky).
 */
export async function goToResults(page: Page): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await clickNext(page);
  }
  // Kotva: sekcia exportu je na Kroku 6 vždy.
  await expect(page.getByText('Export výsledkov')).toBeVisible();
}
