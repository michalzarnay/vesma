import { test, expect } from '@playwright/test';
import { TYPY_ENTIT, prejdiDotaznikSEntitami, stiahniXlsx, textZosita } from './helpers/entity';

/**
 * ČO SOM ZADAL, TO JE VO VÝSTUPE (issue #220).
 *
 * Doterajšie e2e testy strážia, že sa kroky vykreslia a že export stiahne
 * súbor. Nestrážia to, na čo chodia podnety od testerov: či sa zadaná entita
 * do výstupu vôbec dostane. Najčerstvejší príklad je #209 — „Iné stavby"
 * z Kroku 4 sa neexportujú ani nezobrazujú vo Výsledkoch.
 *
 * Scenár preto prejde celý dotazník, zadá jednu entitu od každého typu
 * a overí obsah oboch výstupov. Typy sú v zozname `TYPY_ENTIT`, nie
 * v troch kópiách toho istého testu — nová entita v dotazníku sa pokryje
 * pridaním položky do zoznamu.
 *
 * Výstupy sa overujú mäkkými (`soft`) očakávaniami, aby jeden beh dotazníka
 * povedal aj to, čo chýba vo Výsledkoch, aj to, čo chýba v exporte.
 *
 * Dlhší časový limit: test prechádza všetkými šiestimi krokmi a formuláre
 * budovy aj pozemku sú v dev serveri pomalé (rovnako ako sezonna-stavba.spec.ts).
 */
test.setTimeout(120_000);

for (const typ of TYPY_ENTIT) {
  // Známa chyba => `fixme`. Test sa nespustí, ale je vidieť, na čo sa čaká;
  // opraviť sa má produkčný kód v tom issue, nie tento test.
  const definuj = typ.chyba ? test.fixme : test;
  const nazovTestu = typ.chyba
    ? `${typ.nazov}: zadaná entita chýba vo výstupe (čaká na ${typ.chyba})`
    : `${typ.nazov}: zadaná entita je vo Výsledkoch aj v exporte XLSX`;

  definuj(nazovTestu, async ({ page }) => {
    const chyby: string[] = [];
    page.on('pageerror', (e) => chyby.push(String(e)));

    await prejdiDotaznikSEntitami(page);

    // 1. Výsledky (Krok 6) — entita je vidieť na obrazovke.
    if (typ.overVoVysledkoch) {
      await typ.overVoVysledkoch(page);
    } else {
      await expect
        .soft(page.getByText(typ.znacka).first(), `„${typ.znacka}" nie je vidieť vo Výsledkoch`)
        .toBeVisible();
    }

    // 2. Export XLSX — entita je v niektorom z hárkov zošita.
    const zosit = await stiahniXlsx(page);
    expect
      .soft(textZosita(zosit), `„${typ.znacka}" chýba v exportovanom zošite`)
      .toContain(typ.znacka);

    expect(chyby, `Nezachytené chyby: ${chyby.join('\n')}`).toHaveLength(0);
  });
}
