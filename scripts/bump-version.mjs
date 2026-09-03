// Zvýši číslo vo `version.json` o jedna. Volá to workflow „Číslo verzie"
// (.github/workflows/verzia.yml) po každom push do `main`, teda po každom
// zlúčenom PR. Ručne to spúšťať netreba a nemá sa.
//
// IDEMPOTENCIA
//   Vo `version.json` je okrem čísla aj `commit` — sha commitu na `main`,
//   ktorý toto číslo vyrobil. Keď skript dostane ten istý sha znova
//   (opakovaný beh workflowu, ručné spustenie), číslo nezvýši. Bez toho by
//   jeden merge vedel pridať dve čísla.
//
//   Dva merge-y tesne za sebou dajú dva rôzne sha, teda +2. To je správne —
//   pravidlo je „jeden zlúčený PR = +1". Behy workflowu sa neprekrývajú,
//   drží ich `concurrency` v .github/workflows/verzia.yml.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { SUBOR_VERZIE, nacitajVerziu } from './generate-version.mjs';

/**
 * Zvýši verziu v `version.json` o jedna a zapíše k nej sha commitu, ktorý ju
 * vyrobil. Keď je pri čísle už ten istý sha, nerobí nič.
 *
 * @returns {{ zmenene: boolean, verzia: number }}
 */
export function zvysVerziu({ korenRepozitara, sha }) {
  if (typeof sha !== 'string' || sha.trim() === '') {
    throw new Error('Chýba sha commitu, ktorý verziu zvyšuje.');
  }

  const cesta = join(korenRepozitara, SUBOR_VERZIE);
  const doterajsia = nacitajVerziu(korenRepozitara);
  const udaje = JSON.parse(readFileSync(cesta, 'utf8'));

  if (udaje.commit === sha) {
    return { zmenene: false, verzia: doterajsia };
  }

  const nova = doterajsia + 1;
  writeFileSync(cesta, `${JSON.stringify({ verzia: nova, commit: sha }, null, 2)}\n`);
  return { zmenene: true, verzia: nova };
}

function main() {
  const koren = join(dirname(fileURLToPath(import.meta.url)), '..');
  const sha = process.argv[2] ?? process.env.GITHUB_SHA;

  let vysledok;
  try {
    vysledok = zvysVerziu({ korenRepozitara: koren, sha });
  } catch (err) {
    console.error(`[bump-version] Verziu sa nepodarilo zvýšiť: ${err.message}`);
    process.exit(1);
  }

  if (!vysledok.zmenene) {
    console.log(`[bump-version] Commit ${sha} už verziu ${vysledok.verzia} vyrobil — nemením nič.`);
    return;
  }

  console.log(`[bump-version] Nová verzia: ${vysledok.verzia} (commit ${sha}).`);
}

// Spusti len pri priamom volaní, nie pri importe z testov.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
