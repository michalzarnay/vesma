// Generuje src/version.ts s číslom verzie pre hlavičku aplikácie.
//
// PRAVIDLO
//   Verzia je zapísaná vo `version.json` v koreni repozitára. Build ju len
//   prečíta — nepočíta nič a **git vôbec nepotrebuje**.
//
//   Číslo tam nezapisuje človek ani agent. Po každom zlúčení do `main` ho
//   zvýši o jedna workflow „Číslo verzie" (.github/workflows/verzia.yml),
//   ktorý volá scripts/bump-version.mjs. Jeden zlúčený PR = presne +1.
//
// PREČO PRÁVE TAKTO
//   Predtým sa verzia počítala z histórie `main` od kotviaceho commitu
//   (`git rev-list --count --first-parent KOTVA..main`). Vercel však klonuje
//   plytko a fetch v jeho build kontajneri neprejde, takže keď sa kotva
//   dostala mimo hĺbky klonu, build spadol — na preview aj na produkcii.
//   Kotvu bolo treba ručne posúvať a stálo to šesť PR-ov (#164, #189, #191,
//   #192, #199, #208). Súbor s číslom žiadnu históriu nepotrebuje, takže
//   celá tá trieda pádov zaniká aj s kotvou.
//
//   Ostatné vlastnosti zostávajú:
//     - Jeden merge = +1, bez ohľadu na počet commitov v PR a spôsob merge-u.
//     - Číslo nezávisí od toho, kto build spustil. Build z vetvy ukáže verziu
//       `main`, z ktorej vetva vychádza — nikdy nie vyššiu.
//     - Číslo nikdy neklesne.
//     - src/version.ts je v .gitignore a generuje sa pred každým `dev`,
//       `build`, `preview` aj `test` behom, takže sa nedá ručne prepísať.
//
// ČO SA TÝM MENÍ V PREVÁDZKE
//   Číslo sa na `main` objaví až commitom, ktorý ho zvýši — teda desiatky
//   sekúnd po zlúčení PR. Vercel medzitým môže stihnúť nasadiť merge commit
//   ešte so starým číslom; nasadenie z commitu s novým číslom ho vzápätí
//   nahradí. Podrobnosti sú v docs/verziovanie.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

/** Cesta k súboru s číslom verzie, relatívne ku koreňu repozitára. */
export const SUBOR_VERZIE = 'version.json';

/**
 * Prečíta číslo verzie z `version.json`.
 * Pri chýbajúcom, nečitateľnom alebo nezmyselnom súbore vyhodí výnimku —
 * tichý fallback bol pôvodná príčina skokov typu 145 → 23.
 */
export function nacitajVerziu(korenRepozitara) {
  const cesta = join(korenRepozitara, SUBOR_VERZIE);

  let obsah;
  try {
    obsah = readFileSync(cesta, 'utf8');
  } catch (err) {
    throw new Error(`${SUBOR_VERZIE} sa nedá prečítať: ${err.message}`);
  }

  let udaje;
  try {
    udaje = JSON.parse(obsah);
  } catch (err) {
    throw new Error(`${SUBOR_VERZIE} nie je platný JSON: ${err.message}`);
  }

  const verzia = udaje?.verzia;
  if (!Number.isInteger(verzia) || verzia < 0) {
    throw new Error(`${SUBOR_VERZIE} neobsahuje platné číslo verzie (našlo sa: ${JSON.stringify(verzia)}).`);
  }

  return verzia;
}

/** Zapíše src/version.ts a vráti zapísanú verziu. */
export function zapisVerziu(verzia, outFile) {
  const content = `// Tento súbor je generovaný skriptom scripts/generate-version.mjs.
// Needituj ho ručne a necommituj — je v .gitignore a pri každom builde sa prepíše.
export const APP_VERSION = ${verzia};
`;
  writeFileSync(outFile, content);
  return verzia;
}

function main() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const koren = join(dir, '..');
  const outFile = join(koren, 'src', 'version.ts');

  // Núdzový východ pre prostredie bez repozitára (napr. build z tarballu).
  const override = process.env.VESMA_VERSION;
  if (override) {
    const verzia = Number.parseInt(override, 10);
    if (!Number.isFinite(verzia) || verzia < 0) {
      console.error(`[generate-version] VESMA_VERSION="${override}" nie je platné číslo.`);
      process.exit(1);
    }
    zapisVerziu(verzia, outFile);
    console.log(`[generate-version] APP_VERSION = ${verzia} (z VESMA_VERSION)`);
    return;
  }

  let verzia;
  try {
    verzia = nacitajVerziu(koren);
  } catch (err) {
    // Zámerne padáme. Zlé číslo vo verzii nie je vidieť, spadnutý build áno.
    console.error(`[generate-version] Verziu sa nepodarilo prečítať: ${err.message}`);
    console.error('[generate-version] Dočasne sa dá obísť cez VESMA_VERSION=<číslo>.');
    process.exit(1);
  }

  zapisVerziu(verzia, outFile);
  console.log(`[generate-version] APP_VERSION = ${verzia}`);
}

// Spusti len pri priamom volaní (`node scripts/generate-version.mjs`),
// nie pri importe z testov.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
