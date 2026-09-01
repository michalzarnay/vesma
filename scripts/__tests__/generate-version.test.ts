import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-expect-error – generátor je čistý ESM skript bez typov.
import { vypocitajVerziu } from '../generate-version.mjs';

/**
 * Regresné testy k nekonzistentnému číslovaniu verzií.
 *
 * Pôvodná logika počítala `git rev-list --count BASE..HEAD`, čo spôsobovalo:
 *  - skok o toľko čísel, koľko commitov mal zlúčený PR (merge commit),
 *  - iné číslo pri builde z vetvy než z `main`,
 *  - tichý pád na BASE_VERSION (23) pri plytkom klone.
 *
 * Testy nižšie držia všetky tri veci na uzde.
 */

const ZAKLAD = 100;
const docasneAdresare: string[] = [];

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function vytvorRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'vesma-verzia-'));
  docasneAdresare.push(dir);
  git(['init', '-b', 'main'], dir);
  git(['config', 'user.email', 'test@example.com'], dir);
  git(['config', 'user.name', 'Test VESMA'], dir);
  git(['config', 'commit.gpgsign', 'false'], dir);
  return dir;
}

function commit(dir: string, sprava: string): string {
  writeFileSync(join(dir, 'subor.txt'), `${sprava}\n`);
  git(['add', '-A'], dir);
  git(['commit', '-m', sprava], dir);
  return git(['rev-parse', 'HEAD'], dir);
}

/** Vetva s `pocet` commitmi, zlúčená do `main` merge commitom (ako PR z GitHubu). */
function zlucVetvu(dir: string, nazov: string, pocet: number): void {
  git(['checkout', '-b', nazov], dir);
  for (let i = 1; i <= pocet; i += 1) commit(dir, `${nazov} commit ${i}`);
  git(['checkout', 'main'], dir);
  git(['merge', '--no-ff', '-m', `Merge pull request ${nazov}`, nazov], dir);
}

function verzia(dir: string, baseCommit: string): number {
  return vypocitajVerziu({ cwd: dir, baseCommit, baseVersion: ZAKLAD, dotiahnut: false }) as number;
}

afterEach(() => {
  while (docasneAdresare.length) {
    rmSync(docasneAdresare.pop() as string, { recursive: true, force: true });
  }
});

describe('vypocitajVerziu', () => {
  it('pri kotviacom commite vráti presne základnú verziu', () => {
    const dir = vytvorRepo();
    const zaklad = commit(dir, 'kotva');

    expect(verzia(dir, zaklad)).toBe(ZAKLAD);
  });

  it('zlúčený PR posunie verziu o 1 bez ohľadu na počet commitov vo vetve', () => {
    const dir = vytvorRepo();
    const zaklad = commit(dir, 'kotva');

    zlucVetvu(dir, 'vetva-a', 7);

    // Stará logika (`rev-list --count`) by tu vrátila 100 + 8 = 108.
    expect(verzia(dir, zaklad)).toBe(ZAKLAD + 1);
  });

  it('squash merge posunie verziu tiež presne o 1', () => {
    const dir = vytvorRepo();
    const zaklad = commit(dir, 'kotva');

    git(['checkout', '-b', 'vetva-squash'], dir);
    commit(dir, 'vetva commit 1');
    commit(dir, 'vetva commit 2');
    git(['checkout', 'main'], dir);
    git(['merge', '--squash', 'vetva-squash'], dir);
    git(['commit', '-m', 'fix: nieco (#1)'], dir);

    expect(verzia(dir, zaklad)).toBe(ZAKLAD + 1);
  });

  it('viac zlúčení dáva rastúcu postupnosť po jednotkách', () => {
    const dir = vytvorRepo();
    const zaklad = commit(dir, 'kotva');

    const postupnost: number[] = [];
    for (let i = 1; i <= 3; i += 1) {
      zlucVetvu(dir, `vetva-${i}`, i * 2);
      postupnost.push(verzia(dir, zaklad));
    }

    expect(postupnost).toEqual([ZAKLAD + 1, ZAKLAD + 2, ZAKLAD + 3]);
  });

  it('build z nezlúčenej vetvy ukáže verziu main, z ktorej vetva vychádza', () => {
    const dir = vytvorRepo();
    const zaklad = commit(dir, 'kotva');
    zlucVetvu(dir, 'vetva-a', 2);
    const verziaMain = verzia(dir, zaklad);

    git(['checkout', '-b', 'rozrobena-vetva'], dir);
    commit(dir, 'rozrobene 1');
    commit(dir, 'rozrobene 2');
    commit(dir, 'rozrobene 3');

    // Kľúčové: vetva NESMIE vyskočiť nad main, inak by číslo po squash merge kleslo.
    expect(verzia(dir, zaklad)).toBe(verziaMain);
  });

  it('build zo staršieho commitu než kotva vráti základnú verziu', () => {
    const dir = vytvorRepo();
    const stary = commit(dir, 'kotva-1');
    zlucVetvu(dir, 'vetva-a', 2);
    const kotva = git(['rev-parse', 'HEAD'], dir);

    // Napr. rollback deploy na Verceli – kotva je v histórii, ale nie je
    // predchodcom buildovaného commitu.
    git(['checkout', stary], dir);

    expect(verzia(dir, kotva)).toBe(ZAKLAD);
  });

  it('chýbajúci kotviaci commit skončí chybou, nie tichým nižším číslom', () => {
    const dir = vytvorRepo();
    commit(dir, 'kotva');
    zlucVetvu(dir, 'vetva-a', 2);

    // Presne toto sa dialo pri plytkom klone: kotva chýbala a stará logika
    // ticho vypísala BASE_VERSION (23), hoci reálna verzia bola v stovkách.
    expect(() => verzia(dir, '0'.repeat(40))).toThrow();
  });

  it('plytký klon nedá nižšie číslo — história sa najprv dotiahne', () => {
    const zdroj = vytvorRepo();
    const zaklad = commit(zdroj, 'kotva');
    zlucVetvu(zdroj, 'vetva-a', 3);
    zlucVetvu(zdroj, 'vetva-b', 3);
    const ocakavana = verzia(zdroj, zaklad);

    const cielovy = mkdtempSync(join(tmpdir(), 'vesma-verzia-klon-'));
    docasneAdresare.push(cielovy);
    const klon = join(cielovy, 'repo');
    git(['clone', '--depth', '1', `file://${zdroj}`, klon], cielovy);
    expect(git(['rev-parse', '--is-shallow-repository'], klon)).toBe('true');

    const spocitana = vypocitajVerziu({
      cwd: klon,
      baseCommit: zaklad,
      baseVersion: ZAKLAD,
    }) as number;

    expect(spocitana).toBe(ocakavana);
  });
});
