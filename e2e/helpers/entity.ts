import { readFile } from 'node:fs/promises';
import { Locator, Page, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import { clickNext, openClean } from './stubs';

/**
 * Zoznam typov entít dotazníka a spoločné náradie na overenie výstupu.
 *
 * Pravidlo, ktoré tu strážime, je jedno: **čo používateľ zadal, to musí byť
 * vidieť vo Výsledkoch aj v exporte.** Preto tu nie sú tri kópie toho istého
 * scenára, ale jeden zoznam typov (`TYPY_ENTIT`) — keď v dotazníku pribudne
 * nová entita, stačí pridať položku do zoznamu a scenár ju pokryje sám
 * (pozri `CLAUDE.md`, „Oprav triedu, nie výskyt").
 */

/** Escapovanie textu menovky do regulárneho výrazu na presnú zhodu. */
function presneText(text: string): RegExp {
  return new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}

/**
 * Pole formulára (TextInput/NumberInput) podľa presného textu jeho menovky.
 *
 * Menovka nie je s poľom zviazaná cez `htmlFor`, takže `getByLabel` nefunguje;
 * chytáme obal `div.flex.flex-col.gap-1`, ktorý oba komponenty vykresľujú.
 * Presná zhoda odlíši napr. „Parcela" od „Parcela pod budovou".
 */
export function pole(page: Page, menovka: string): Locator {
  return page
    .locator('div.flex.flex-col.gap-1')
    .filter({ has: page.locator('label').filter({ hasText: presneText(menovka) }) })
    .locator('input');
}

/** Karta rozpisu skóre (MZI, OZE, Energetika) na Výsledkoch. */
export function kartaSkore(page: Page, nadpis: string): Locator {
  // Najvnútornejší `div`, ktorý obsahuje nadpis karty — teda koreň karty samotnej.
  return page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: nadpis, exact: true }) })
    .last();
}

export interface TypEntity {
  /** Pole v `Areal`, ktoré entita napĺňa — kvôli dohľadaniu v kóde. */
  kluc: 'pozemky' | 'budovy' | 'ineStavby' | 'bgOpatrenia';
  /** Pomenovanie do názvu testu. */
  nazov: string;
  /** Krok wizardu, v ktorom sa entita zadáva. */
  krok: number;
  /** Jedinečný text zadaný do dotazníka — musí sa objaviť v exporte. */
  znacka: string;
  /** Zadá entitu; stránka je na kroku `krok`. */
  zadaj: (page: Page) => Promise<void>;
  /**
   * Overí, že sa entita objavila vo Výsledkoch (krok 6). Predvolene hľadá
   * `znacka`; typy, ktoré sa vo Výsledkoch neukazujú menom, si overenie
   * predpíšu vlastné.
   */
  overVoVysledkoch?: (page: Page) => Promise<void>;
  /**
   * Odkaz na issue, kým sa entita do výstupu vôbec nedostane. Test sa vtedy
   * označí ako `fixme`, aby PR s testami nezhodil CI — opravou je to issue,
   * nie zmena testu.
   */
  chyba?: string;
}

/** Výmera polopriepustnej plochy pozemku — hodnota, ktorú hľadáme vo Výsledkoch. */
const VYMERA_POZEMKU = '250';

export const TYPY_ENTIT: TypEntity[] = [
  {
    kluc: 'pozemky',
    nazov: 'pozemok',
    krok: 2,
    znacka: 'E2E-parcela-7001',
    async zadaj(page) {
      await pole(page, 'Parcela').fill('E2E-parcela-7001');
      // Bez zadanej výmery nemá komponent „Priepustnosť a zeleň areálu"
      // z čoho počítať a vo Výsledkoch by ostalo „bez údajov".
      await pole(page, 'Spevnený (polopriepustný) povrch celkom').fill(VYMERA_POZEMKU);
    },
    async overVoVysledkoch(page) {
      // Pozemok sa vo Výsledkoch neukazuje menom, ale zadanou výmerou
      // v rozpise MZI (metodika KLIMASKEN B-GOV2).
      await expect
        .soft(kartaSkore(page, 'MZI'), 'Výmera zadaná pri pozemku nie je v rozpise MZI')
        .toContainText(`${VYMERA_POZEMKU} m²`);
    },
  },
  {
    kluc: 'budovy',
    nazov: 'budova',
    krok: 3,
    znacka: 'E2E budova Alfa',
    async zadaj(page) {
      await pole(page, 'Názov budovy').fill('E2E budova Alfa');
      // Budova sa v prehľade energetických ukazovateľov objaví, až keď má
      // zadanú nameranú spotrebu.
      await pole(page, 'Spotreba elektriny za minulý rok').fill('4321');
    },
  },
  {
    kluc: 'ineStavby',
    nazov: 'iná stavba',
    krok: 4,
    znacka: 'E2E altánok pri vstupe',
    async zadaj(page) {
      await page.getByRole('button', { name: 'Pridať inú stavbu' }).click();
      await pole(page, 'Názov stavby').fill('E2E altánok pri vstupe');
      await pole(page, 'Zastavaná plocha').fill('40');
    },
  },
  {
    kluc: 'bgOpatrenia',
    nazov: 'B&G opatrenie',
    krok: 5,
    znacka: 'E2E dažďová záhrada',
    async zadaj(page) {
      await page.getByRole('button', { name: 'Pridať B&G opatrenie' }).click();
      await pole(page, 'Názov B&G opatrenia').fill('E2E dažďová záhrada');
      // Zámerne iné číslo parcely ako pri pozemku — každá značka musí vo výstupe
      // patriť práve jednej entite, inak by test prešiel na cudzí zápis.
      await pole(page, 'Na parcele').fill('2307');
    },
  },
];

/**
 * Prejde dotazník od Kroku 1 po Výsledky a po ceste zadá jednu entitu od
 * každého typu zo `TYPY_ENTIT`. Nový typ v zozname sa vyplní sám — stačí,
 * že má vyplnený `krok`.
 */
export async function prejdiDotaznikSEntitami(page: Page): Promise<void> {
  await openClean(page);

  for (let krok = 1; krok <= 6; krok++) {
    for (const typ of TYPY_ENTIT.filter((t) => t.krok === krok)) {
      await typ.zadaj(page);
    }
    if (krok < 6) await clickNext(page);
  }

  await expect(page.getByText('Export výsledkov')).toBeVisible();
}

/**
 * Klikne na „Exportovať XLSX" a vráti stiahnutý zošit načítaný v teste.
 * Súbor sa generuje na klientovi, takže obsah je presne to, čo dostane obec.
 */
export async function stiahniXlsx(page: Page): Promise<XLSX.WorkBook> {
  const stahovanie = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportovať XLSX' }).click();
  const cesta = await (await stahovanie).path();
  // `XLSX.readFile` v ESM builde knižnice nemá prístup k `fs`, preto súbor
  // načítame sami a parsujeme z buffera.
  return XLSX.read(await readFile(cesta), { type: 'buffer' });
}

/** Obsah všetkých hárkov zošita ako jeden text — na hľadanie zadaných hodnôt. */
export function textZosita(zosit: XLSX.WorkBook): string {
  return zosit.SheetNames.map((nazov) => XLSX.utils.sheet_to_csv(zosit.Sheets[nazov])).join('\n');
}
