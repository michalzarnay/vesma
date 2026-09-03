import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-expect-error – generátor je čistý ESM skript bez typov.
import { nacitajVerziu, zapisVerziu, SUBOR_VERZIE } from '../generate-version.mjs';

/**
 * Verzia sa už nepočíta z histórie `main`, ale číta z `version.json`.
 * Dôvod je v hlavičke generate-version.mjs: výpočet z histórie padal na
 * plytkom klone Vercelu a kotvu bolo treba ručne posúvať.
 *
 * Testy držia dve veci:
 *  - číslo sa prečíta presne také, aké je v súbore,
 *  - pri chýbajúcom alebo poškodenom súbore sa padá, nie mlčky pokračuje.
 *    Tichý fallback bol pôvodná príčina skokov typu 145 → 23.
 */

const docasneAdresare: string[] = [];

function vytvorKoren(obsahSuboru?: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'vesma-verzia-'));
  docasneAdresare.push(dir);
  if (obsahSuboru !== undefined) {
    writeFileSync(join(dir, SUBOR_VERZIE), obsahSuboru);
  }
  return dir;
}

afterEach(() => {
  while (docasneAdresare.length) {
    rmSync(docasneAdresare.pop() as string, { recursive: true, force: true });
  }
});

describe('nacitajVerziu', () => {
  it('prečíta číslo zo súboru', () => {
    const dir = vytvorKoren('{ "verzia": 190, "commit": "abc123" }');

    expect(nacitajVerziu(dir)).toBe(190);
  });

  it('sha commitu na číslo nemá vplyv', () => {
    const dir = vytvorKoren('{ "verzia": 7 }');

    expect(nacitajVerziu(dir)).toBe(7);
  });

  it('pri chýbajúcom súbore padne', () => {
    const dir = vytvorKoren();

    expect(() => nacitajVerziu(dir)).toThrow(/nedá prečítať/);
  });

  it('pri poškodenom JSON-e padne', () => {
    const dir = vytvorKoren('{ "verzia": ');

    expect(() => nacitajVerziu(dir)).toThrow(/platný JSON/);
  });

  it('pri chýbajúcom čísle padne namiesto tichej nuly', () => {
    const dir = vytvorKoren('{ "commit": "abc123" }');

    expect(() => nacitajVerziu(dir)).toThrow(/platné číslo verzie/);
  });

  it('desatinné ani záporné číslo neprejde', () => {
    expect(() => nacitajVerziu(vytvorKoren('{ "verzia": 1.5 }'))).toThrow(/platné číslo verzie/);
    expect(() => nacitajVerziu(vytvorKoren('{ "verzia": -1 }'))).toThrow(/platné číslo verzie/);
  });
});

describe('zapisVerziu', () => {
  it('zapíše APP_VERSION a upozorní, že súbor je generovaný', () => {
    const dir = vytvorKoren('{ "verzia": 190 }');
    const outFile = join(dir, 'version.ts');

    zapisVerziu(190, outFile);

    const obsah = readFileSync(outFile, 'utf8');
    expect(obsah).toContain('export const APP_VERSION = 190;');
    expect(obsah).toContain('generovaný');
  });
});

describe('skutočný version.json v repozitári', () => {
  it('je čitateľný a dáva kladné číslo', () => {
    const koren = join(__dirname, '..', '..');

    expect(nacitajVerziu(koren)).toBeGreaterThan(0);
  });
});
