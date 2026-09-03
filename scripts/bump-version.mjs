// Práca s číslom verzie vo `version.json`:
//   node scripts/bump-version.mjs            — nastaví číslo na (verzia na main) + 1
//   node scripts/bump-version.mjs --kontrola  — len overí, nič nezapisuje (beží v CI)
//
// PRAVIDLO
//   Číslo vo vetve musí byť presne o jedna vyššie než číslo na `main`.
//   Zlúčením PR sa tak `main` posunie o +1 — jeden zlúčený PR = jedna verzia.
//
// PREČO TO ROBÍ VETVA A NIE `main`
//   Prvá verzia tohto mechanizmu zvyšovala číslo workflowom po zlúčení, teda
//   pushom priamo do `main`. To nefunguje: `main` má ruleset „Changes must be
//   made through a pull request" a push z Actions odmietol s GH013. Verzia by
//   tichom zamrzla na poslednej hodnote.
//
//   Preto číslo prináša sama vetva a CI ho pri PR len overí. Nič sa neobchádza
//   a nikto nepotrebuje výnimku z pravidiel repozitára.
//
// ČO KEĎ SA MEDZITÝM ZLÚČI INÝ PR
//   Kontrola pri ďalšom behu zlyhá — číslo vo vetve už nie je o jedna vyššie
//   než na `main`. Spusti `npm run verzia` znova. Práve toto je dôvod, prečo
//   sa číslo počíta z `main` a nie prírastkom k tomu, čo je vo vetve: dva PR-y
//   otvorené naraz by inak dostali rovnaké číslo a testeri by dve rôzne
//   zostavy nerozlíšili.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { SUBOR_VERZIE, nacitajVerziu } from './generate-version.mjs';

/** Referencie na `main`, v poradí, v akom ich skúšame. */
const MAIN_REFS = ['origin/main', 'refs/remotes/origin/main', 'main', 'FETCH_HEAD'];

function gitOrNull(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

/** Číslo verzie zapísané vo `version.json` na `main`. */
export function verziaNaMain(cwd) {
  for (const ref of MAIN_REFS) {
    const obsah = gitOrNull(['show', `${ref}:${SUBOR_VERZIE}`], cwd);
    if (obsah === null) continue;

    const verzia = JSON.parse(obsah)?.verzia;
    if (Number.isInteger(verzia) && verzia >= 0) return verzia;
  }

  throw new Error(
    `${SUBOR_VERZIE} sa nedá prečítať zo žiadnej z referencií ${MAIN_REFS.join(', ')}. ` +
      'Skús `git fetch origin main`.',
  );
}

/**
 * Porovná číslo vo vetve s číslom na `main`.
 * @returns {{ vetva: number, main: number, ocakavana: number, sedi: boolean, jeMain: boolean }}
 */
export function skontrolujVerziu({ korenRepozitara }) {
  const vetva = nacitajVerziu(korenRepozitara);
  const main = verziaNaMain(korenRepozitara);

  return {
    vetva,
    main,
    ocakavana: main + 1,
    sedi: vetva === main + 1,
    // Najčastejší prípad zlyhania: vetva verziu vôbec nezvýšila. Rozlíšený
    // preto, aby hláška povedala, čo spraviť, a nie len že sa čísla líšia.
    nezvysena: vetva === main,
  };
}

/**
 * Nastaví číslo vo `version.json` na (verzia na `main`) + 1.
 * @returns {{ zmenene: boolean, verzia: number }}
 */
export function zvysVerziu({ korenRepozitara }) {
  const cesta = join(korenRepozitara, SUBOR_VERZIE);
  const doterajsia = nacitajVerziu(korenRepozitara);
  const nova = verziaNaMain(korenRepozitara) + 1;

  if (doterajsia === nova) {
    return { zmenene: false, verzia: nova };
  }

  writeFileSync(cesta, `${JSON.stringify({ verzia: nova }, null, 2)}\n`);
  return { zmenene: true, verzia: nova };
}

function main() {
  const koren = join(dirname(fileURLToPath(import.meta.url)), '..');
  const lenKontrola = process.argv.includes('--kontrola');

  try {
    if (lenKontrola) {
      const { vetva, main: naMain, ocakavana, sedi, nezvysena } = skontrolujVerziu({ korenRepozitara: koren });

      if (!sedi) {
        console.error(
          nezvysena
            ? `[verzia] version.json má ${vetva} — rovnako ako main. Táto zmena verziu nezvýšila.`
            : `[verzia] version.json má ${vetva}, ale na main je ${naMain} — očakáva sa ${ocakavana}.`,
        );
        console.error('[verzia] Spusti `npm run verzia` a commitni version.json.');
        process.exit(1);
      }

      console.log(`[verzia] ${vetva} = main (${naMain}) + 1 — OK.`);
      return;
    }

    const { zmenene, verzia } = zvysVerziu({ korenRepozitara: koren });
    console.log(
      zmenene
        ? `[verzia] Nová verzia: ${verzia}. Nezabudni commitnúť ${SUBOR_VERZIE}.`
        : `[verzia] Verzia už je ${verzia} — nemením nič.`,
    );
  } catch (err) {
    console.error(`[verzia] ${err.message}`);
    process.exit(1);
  }
}

// Spusti len pri priamom volaní, nie pri importe z testov.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
