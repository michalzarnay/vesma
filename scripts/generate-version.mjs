// Generuje src/version.ts s číslom verzie pre hlavičku aplikácie.
//
// PRAVIDLO
//   verzia = BASE_VERSION + počet commitov v prvej rodičovskej línii (`--first-parent`)
//            vetvy `main` od BASE_COMMIT po bod, z ktorého vychádza aktuálny build.
//
// PREČO PRÁVE TAKTO (čo to rieši)
//   1. Jeden merge do `main` = presne +1. Predtým sa počítali všetky commity
//      (`rev-list BASE..HEAD`), takže PR zlúčený merge commitom pridal toľko
//      čísel, koľko mal commitov — verzia skákala o 1, 5 aj 20 naraz.
//   2. Číslo nezávisí od toho, kto build spustil. Predtým sa počítalo od `HEAD`,
//      takže build z vetvy (Vercel preview, beh agenta) dal iné číslo než build
//      z `main`. Teraz sa vždy počíta po `merge-base(HEAD, main)`, čiže build
//      z vetvy ukáže verziu `main`, z ktorej vetva vychádza — nikdy nie vyššiu,
//      ktorá by po squash merge „klesla".
//   3. Číslo nikdy ticho nespadne. Predtým sa pri plytkom (shallow) klone
//      výpočet nepodaril a skript ticho vypísal BASE_VERSION (23) — odtiaľ skoky
//      typu 145 → 23. Teraz sa história najprv dotiahne a keď sa verzia spočítať
//      nedá, skript skončí chybou. Núdzový východ: premenná VESMA_VERSION.
//   4. src/version.ts je v .gitignore a generuje sa pred každým `dev`, `build`,
//      `preview` aj `test` behom. Nie je čo ručne prepísať — ani človekom,
//      ani agentom.
//
// KOTVA
//   BASE_COMMIT = commit na `main`, od ktorého sa počíta.
//   BASE_VERSION = verzia platná v čase tohto commitu.
//
//   POZOR — kotvu treba občas posunúť. Vercel klonuje plytko a keď sa kotva
//   dostane mimo hĺbky klonu, `cat-file` ju nenájde, dotiahnuť sa nedá (fetch
//   na Verceli neprejde) a build spadne. Presne to sa stalo 2. 9. 2026, keď sa
//   pôvodná kotva cd36452 dostala 10 merge-ov za `main`.
//
//   Ako kotvu posunúť bez toho, aby verzia skočila:
//     1. zisti aktuálnu verziu `main`  →  node scripts/generate-version.mjs
//     2. BASE_COMMIT = HEAD vetvy `main`, BASE_VERSION = to číslo z kroku 1
//   Verzia potom vyjde rovnaká ako predtým a postupnosť nikde neklesne.
//
//   Trvalé riešenie (aby sa posúvanie nemuselo opakovať) je predmetom
//   samostatného issue — pozri docs/verziovanie.md.
//
//   História kotiev:
//     cd36452 / 160 — zavedenie tohto pravidla (predtým 23 + všetky commity)
//     8959835 / 170 — posun kvôli plytkému klonu na Verceli (2. 9. 2026)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

export const BASE_VERSION = 170;
export const BASE_COMMIT = '8959835ae07c2001085fd7bbaf45bb98edae9082';

/** Vetvy, ktoré považujeme za `main` — v poradí, v akom ich skúšame. */
const MAIN_REFS = ['refs/remotes/origin/main', 'refs/heads/main', 'refs/remotes/upstream/main'];

/** Spustí git a vráti očistený výstup. Pri chybe vyhodí výnimku. */
function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/** Spustí git a pri chybe vráti null (namiesto výnimky). */
function gitOrNull(args, cwd) {
  try {
    return git(args, cwd);
  } catch {
    return null;
  }
}

/**
 * Dotiahne plnú históriu, ak je klon plytký.
 * Vercel aj actions/checkout klonujú plytko — bez tohto kroku by BASE_COMMIT
 * v histórii vôbec nebol a verzia by vyšla nižšia (alebo by sa nespočítala).
 */
function dotiahniHistoriu(cwd) {
  if (gitOrNull(['rev-parse', '--is-shallow-repository'], cwd) !== 'true') return;
  if (gitOrNull(['fetch', '--unshallow', '--quiet'], cwd) !== null) return;
  // Keď `--unshallow` nie je možný (napr. bez remote), skús aspoň prehĺbiť.
  gitOrNull(['fetch', '--deepen=1000', '--quiet'], cwd);
}

/** Nájde referenciu na `main`; ak lokálne nie je, skúsi ju dotiahnuť z origin. */
function najdiMainRef(cwd) {
  for (const ref of MAIN_REFS) {
    if (gitOrNull(['rev-parse', '--verify', '--quiet', ref], cwd)) return ref;
  }
  if (gitOrNull(['fetch', 'origin', 'main', '--quiet'], cwd) !== null) {
    if (gitOrNull(['rev-parse', '--verify', '--quiet', 'FETCH_HEAD'], cwd)) return 'FETCH_HEAD';
  }
  return null;
}

/**
 * Bod na `main`, po ktorý sa počíta — `merge-base(HEAD, main)`.
 * Na `main` je to samotný HEAD, na vetve bod, z ktorého vetva vychádza.
 */
function najdiKotvu(cwd) {
  const mainRef = najdiMainRef(cwd);
  if (!mainRef) return 'HEAD';
  return gitOrNull(['merge-base', 'HEAD', mainRef], cwd) ?? 'HEAD';
}

/**
 * Spočíta verziu pre repozitár v `cwd`.
 * Parametre `baseCommit` a `baseVersion` sú kvôli testom.
 */
export function vypocitajVerziu({
  cwd = process.cwd(),
  baseCommit = BASE_COMMIT,
  baseVersion = BASE_VERSION,
  dotiahnut = true,
} = {}) {
  if (gitOrNull(['rev-parse', '--is-inside-work-tree'], cwd) !== 'true') {
    throw new Error('Nie je to git repozitár — verziu sa nedá spočítať.');
  }

  if (dotiahnut) dotiahniHistoriu(cwd);

  const kotva = najdiKotvu(cwd);

  if (gitOrNull(['cat-file', '-e', `${baseCommit}^{commit}`], cwd) === null) {
    throw new Error(
      `Kotviaci commit ${baseCommit} nie je v histórii (plytký klon?). ` +
        'Naklonuj s plnou históriou (fetch-depth: 0) alebo nastav VESMA_VERSION.',
    );
  }

  // Kotva v histórii je, ale build je zo staršieho commitu (napr. rollback
  // na Verceli). Vtedy je základná verzia správna odpoveď — starší kód
  // objektívne neobsahuje žiadny z merge-ov započítaných od kotvy.
  if (gitOrNull(['merge-base', '--is-ancestor', baseCommit, kotva], cwd) === null) {
    return baseVersion;
  }

  const vystup = git(['rev-list', '--count', '--first-parent', `${baseCommit}..${kotva}`], cwd);
  const pocet = Number.parseInt(vystup, 10);
  if (!Number.isFinite(pocet) || pocet < 0) {
    throw new Error(`Neplatný počet commitov od kotvy: "${vystup}".`);
  }

  return baseVersion + pocet;
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
  const outFile = join(dir, '..', 'src', 'version.ts');

  // Núdzový východ pre prostredie bez gitu (napr. build z tarballu).
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
    verzia = vypocitajVerziu({ cwd: join(dir, '..') });
  } catch (err) {
    // Zámerne padáme. Tichý fallback na BASE_VERSION bol príčinou skokov
    // typu 145 → 23; radšej nech je chyba vidieť pri builde.
    console.error(`[generate-version] Verziu sa nepodarilo spočítať: ${err.message}`);
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
