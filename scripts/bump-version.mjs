// Práca s číslom verzie vo `version.json`:
//   node scripts/bump-version.mjs                 — nastaví číslo na (verzia na main) + 1
//   node scripts/bump-version.mjs --kontrola      — overí vetvu oproti main (beží pri PR)
//   node scripts/bump-version.mjs --kontrola-main — overí, že posledné zlúčenie
//                                                   číslo zvýšilo (beží po pushi do main)
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
//   Kontrola pri ďalšom **pushi** do vetvy zlyhá — číslo už nie je o jedna
//   vyššie než na `main`. Spusti `npm run verzia` znova.
//
//   Pozor, kontrola pri PR na to nestačí (#231): beží pri otvorení a pri pushi,
//   nie pri zlúčení. Dva súbežne otvorené PR-y teda obidva uvidia to isté
//   `main`, obidva si nastavia rovnaké číslo a obidvom kontrola prejde —
//   presne to sa stalo pri verzii 196, ktorú nesú tri zlúčené PR-y. Preto je
//   tu ešte `--kontrola-main`, ktorá po zlúčení overí, že sa číslo na `main`
//   naozaj posunulo. Nezabráni tomu, len to hneď pomenuje; zabráni tomu až
//   nastavenie repozitára „Require branches to be up to date before merging".
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

/** Číslo verzie zapísané vo `version.json` v danom commite; `null`, keď commit nie je. */
function verziaVCommite(cwd, ref) {
  const obsah = gitOrNull(['show', `${ref}:${SUBOR_VERZIE}`], cwd);
  if (obsah === null) return null;

  const verzia = JSON.parse(obsah)?.verzia;
  return Number.isInteger(verzia) && verzia >= 0 ? verzia : null;
}

/**
 * Overí, že posledné zlúčenie do `main` zvýšilo číslo verzie o jedna.
 *
 * Kontrola pri PR na to nestačí — beží pri otvorení a pri pushi do vetvy, nie
 * pri zlúčení. Dva súbežne otvorené PR-y tak môžu prejsť s rovnakým číslom
 * a druhý merge ho ticho použije znova (#231).
 *
 * @returns {{ teraz: number, predtym: number|null, sedi: boolean, bezPredchodcu: boolean }}
 */
export function skontrolujPosunNaMain({ korenRepozitara, ref = 'HEAD' }) {
  const teraz = verziaVCommite(korenRepozitara, ref);
  if (teraz === null) {
    throw new Error(`${SUBOR_VERZIE} sa nedá prečítať z commitu ${ref}.`);
  }

  // Prvý commit repozitára nemá s čím porovnávať — to nie je chyba.
  const predtym = verziaVCommite(korenRepozitara, `${ref}^`);
  if (predtym === null) {
    return { teraz, predtym: null, sedi: true, bezPredchodcu: true };
  }

  return { teraz, predtym, sedi: teraz === predtym + 1, bezPredchodcu: false };
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

/** Hláška pre `--kontrola-main` podľa toho, čo sa s číslom stalo. */
function hlaskaPosunu({ teraz, predtym }) {
  if (teraz === predtym) {
    return `[verzia] main je stále na ${teraz} — posledné zlúčenie číslo nezvýšilo. ` +
      'Dve rôzne zostavy tak nesú rovnaké číslo a tester ich nemá ako rozlíšiť.';
  }
  if (teraz < predtym) {
    return `[verzia] Číslo na main kleslo z ${predtym} na ${teraz}.`;
  }
  return `[verzia] Číslo na main skočilo z ${predtym} na ${teraz} — zostavy ` +
    `${predtym + 1}–${teraz - 1} neexistujú.`;
}

function main() {
  const koren = join(dirname(fileURLToPath(import.meta.url)), '..');
  const lenKontrola = process.argv.includes('--kontrola');
  const kontrolaMain = process.argv.includes('--kontrola-main');

  try {
    if (kontrolaMain) {
      const { teraz, predtym, sedi, bezPredchodcu } = skontrolujPosunNaMain({ korenRepozitara: koren });

      if (bezPredchodcu) {
        console.log(`[verzia] ${teraz} — prvý commit, nie je s čím porovnávať.`);
        return;
      }

      if (!sedi) {
        console.error(hlaskaPosunu({ teraz, predtym }));
        console.error(
          '[verzia] Pravidlo je jeden zlúčený PR = presne +1 (docs/verziovanie.md). ' +
          'Spätne sa to už neopraví — ide o signál, aby sa to nedialo ďalej.',
        );
        process.exit(1);
      }

      console.log(`[verzia] main: ${predtym} → ${teraz} — OK.`);
      return;
    }

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
