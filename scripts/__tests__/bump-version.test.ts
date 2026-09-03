import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-expect-error – skript je čistý ESM bez typov.
import { zvysVerziu } from '../bump-version.mjs';
// @ts-expect-error – generátor je čistý ESM skript bez typov.
import { SUBOR_VERZIE } from '../generate-version.mjs';

/**
 * Verziu zvyšuje workflow po každom zlúčení do `main`. Dve veci sa nesmú
 * pokaziť: jeden merge nesmie pridať dve čísla (opakovaný beh workflowu)
 * a dva merge-y musia pridať dve.
 */

const docasneAdresare: string[] = [];

function vytvorKoren(obsahSuboru: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'vesma-bump-'));
  docasneAdresare.push(dir);
  writeFileSync(join(dir, SUBOR_VERZIE), obsahSuboru);
  return dir;
}

function precitaj(dir: string): { verzia: number; commit?: string } {
  return JSON.parse(readFileSync(join(dir, SUBOR_VERZIE), 'utf8'));
}

afterEach(() => {
  while (docasneAdresare.length) {
    rmSync(docasneAdresare.pop() as string, { recursive: true, force: true });
  }
});

describe('zvysVerziu', () => {
  it('zvýši číslo o jedna a zapíše sha commitu', () => {
    const dir = vytvorKoren('{ "verzia": 190, "commit": "stary" }');

    const vysledok = zvysVerziu({ korenRepozitara: dir, sha: 'novy' });

    expect(vysledok).toEqual({ zmenene: true, verzia: 191 });
    expect(precitaj(dir)).toEqual({ verzia: 191, commit: 'novy' });
  });

  it('ten istý commit druhýkrát číslo nezvýši', () => {
    const dir = vytvorKoren('{ "verzia": 190, "commit": "stary" }');

    zvysVerziu({ korenRepozitara: dir, sha: 'novy' });
    const druhy = zvysVerziu({ korenRepozitara: dir, sha: 'novy' });

    expect(druhy).toEqual({ zmenene: false, verzia: 191 });
    expect(precitaj(dir).verzia).toBe(191);
  });

  it('dva rôzne commity pridajú dve čísla', () => {
    const dir = vytvorKoren('{ "verzia": 190, "commit": "nulty" }');

    zvysVerziu({ korenRepozitara: dir, sha: 'prvy' });
    zvysVerziu({ korenRepozitara: dir, sha: 'druhy' });

    expect(precitaj(dir)).toEqual({ verzia: 192, commit: 'druhy' });
  });

  it('bez sha odmietne pracovať — inak by sa idempotencia stratila', () => {
    const dir = vytvorKoren('{ "verzia": 190, "commit": "stary" }');

    expect(() => zvysVerziu({ korenRepozitara: dir, sha: '' })).toThrow(/Chýba sha/);
    expect(precitaj(dir).verzia).toBe(190);
  });

  it('zapísaný súbor zostáva čitateľný pre generátor', () => {
    const dir = vytvorKoren('{ "verzia": 190, "commit": "stary" }');

    zvysVerziu({ korenRepozitara: dir, sha: 'novy' });

    const obsah = readFileSync(join(dir, SUBOR_VERZIE), 'utf8');
    expect(obsah.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(obsah)).not.toThrow();
  });
});
