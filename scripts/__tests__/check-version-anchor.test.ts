import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-expect-error – kontrolný skript je čistý ESM bez typov.
import { skontroluj, PRAH_MERGEOV } from '../check-version-anchor.mjs';

/**
 * Regresný test k issue #187: kotva sa v `main` postupne vzďaľuje a keď sa
 * dostane mimo hĺbky plytkého klonu na Verceli, build spadne bez varovania.
 * `skontroluj` má to odchytiť skôr — kým je ešte čas kotvu pokojne posunúť.
 */

const docasneAdresare: string[] = [];

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function vytvorRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'vesma-kotva-'));
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

/** Vetva zlúčená do `main` merge commitom (ako PR z GitHubu) — počíta sa ako +1. */
function zlucVetvu(dir: string, nazov: string): void {
  git(['checkout', '-b', nazov], dir);
  commit(dir, `${nazov} commit`);
  git(['checkout', 'main'], dir);
  git(['merge', '--no-ff', '-m', `Merge pull request ${nazov}`, nazov], dir);
}

afterEach(() => {
  while (docasneAdresare.length) {
    rmSync(docasneAdresare.pop() as string, { recursive: true, force: true });
  }
});

describe('skontroluj', () => {
  it('pri kotve presne na main vráti 0 a neprekročí prah', () => {
    const dir = vytvorRepo();
    const kotva = commit(dir, 'kotva');

    const vysledok = skontroluj({ cwd: dir, baseCommit: kotva, dotiahnut: false });

    expect(vysledok).toEqual({ pocet: 0, prah: PRAH_MERGEOV, prekroceny: false });
  });

  it('presne na prahu ešte neprekročí', () => {
    const dir = vytvorRepo();
    const kotva = commit(dir, 'kotva');
    for (let i = 1; i <= PRAH_MERGEOV; i += 1) zlucVetvu(dir, `vetva-${i}`);

    const vysledok = skontroluj({ cwd: dir, baseCommit: kotva, dotiahnut: false });

    expect(vysledok.pocet).toBe(PRAH_MERGEOV);
    expect(vysledok.prekroceny).toBe(false);
  });

  it('o jeden merge nad prahom už prekročí', () => {
    const dir = vytvorRepo();
    const kotva = commit(dir, 'kotva');
    for (let i = 1; i <= PRAH_MERGEOV + 1; i += 1) zlucVetvu(dir, `vetva-${i}`);

    const vysledok = skontroluj({ cwd: dir, baseCommit: kotva, dotiahnut: false });

    expect(vysledok.pocet).toBe(PRAH_MERGEOV + 1);
    expect(vysledok.prekroceny).toBe(true);
  });
});
