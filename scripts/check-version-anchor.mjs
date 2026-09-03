// Zlyhá v CI, keď je kotva v scripts/generate-version.mjs príliš ďaleko za
// `main` — teda skôr, než to strhne skutočný build na Verceli.
//
// PREČO
//   Vercel klonuje plytko. Keď sa kotva (BASE_COMMIT) dostane mimo hĺbky
//   klonu, generate-version.mjs ju v histórii nenájde a build spadne — bez
//   varovania, uprostred inej práce. Presne to sa stalo 2. 9. 2026 pri
//   10 merge-och za kotvou (pozri docs/verziovanie.md, "Kotva sa musí
//   občas posunúť"). Tento skript beží pri každom PR aj push do `main`
//   a zlyhá skôr, kým je ešte čas kotvu pokojne posunúť.
//
// PRAH
//   Predošlý pád nastal pri 10 merge-och za kotvou. 6 necháva rezervu, aby
//   sa dalo zareagovať skôr, než sa problém zopakuje.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { pocetMergeovOdKotvy, BASE_COMMIT } from './generate-version.mjs';

export const PRAH_MERGEOV = 6;

/**
 * Zistí, či je kotva ešte v bezpečnej vzdialenosti od `main`.
 * Parameter `baseCommit` je kvôli testom — inak sa vždy použije skutočná
 * kotva (BASE_COMMIT) v generate-version.mjs.
 */
export function skontroluj({
  cwd = process.cwd(),
  baseCommit = BASE_COMMIT,
  prah = PRAH_MERGEOV,
  dotiahnut = true,
} = {}) {
  const pocet = pocetMergeovOdKotvy({ cwd, baseCommit, dotiahnut });
  return { pocet, prah, prekroceny: pocet > prah };
}

function main() {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..');

  let vysledok;
  try {
    vysledok = skontroluj({ cwd: dir });
  } catch (err) {
    console.error(`[check-version-anchor] Kotvu sa nepodarilo overiť: ${err.message}`);
    process.exit(1);
  }

  const { pocet, prah, prekroceny } = vysledok;
  if (prekroceny) {
    console.error(
      `[check-version-anchor] Kotva ${BASE_COMMIT.slice(0, 7)} je už ${pocet} merge-ov za main ` +
        `(prah ${prah}). Posuň ju skôr, než to strhne build na Verceli — postup je v ` +
        'docs/verziovanie.md, sekcia "Kotva sa musí občas posunúť".',
    );
    process.exit(1);
  }

  console.log(`[check-version-anchor] Kotva je ${pocet} merge-ov za main (prah ${prah}) — OK.`);
}

// Spusti len pri priamom volaní (`node scripts/check-version-anchor.mjs`),
// nie pri importe z testov.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
