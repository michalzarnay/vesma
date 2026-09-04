import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-expect-error – skript je čistý ESM bez typov.
import {
  zvysVerziu, skontrolujVerziu, verziaNaMain, skontrolujPosunNaMain,
} from '../bump-version.mjs';
// @ts-expect-error – generátor je čistý ESM skript bez typov.
import { SUBOR_VERZIE } from '../generate-version.mjs';

/**
 * Číslo verzie prináša sama vetva a CI ho pri PR overí — push do `main`
 * z Actions neprejde cez ruleset „Changes must be made through a pull request".
 *
 * Testy držia to podstatné: číslo sa počíta z `main`, nie prírastkom k tomu,
 * čo je vo vetve. Inak by dva súbežne otvorené PR-y dostali rovnaké číslo
 * a testeri by dve rôzne zostavy nerozlíšili.
 */

const docasneAdresare: string[] = [];

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function zapisVerziu(dir: string, verzia: number): void {
  writeFileSync(join(dir, SUBOR_VERZIE), `${JSON.stringify({ verzia }, null, 2)}\n`);
}

function precitajVerziu(dir: string): number {
  return JSON.parse(readFileSync(join(dir, SUBOR_VERZIE), 'utf8')).verzia;
}

/** Repozitár s vetvou `main`, na ktorej je zadaná verzia. */
function vytvorRepo(verziaNaMaine: number): string {
  const dir = mkdtempSync(join(tmpdir(), 'vesma-verzia-'));
  docasneAdresare.push(dir);
  git(['init', '-b', 'main'], dir);
  git(['config', 'user.email', 'test@example.com'], dir);
  git(['config', 'user.name', 'Test VESMA'], dir);
  git(['config', 'commit.gpgsign', 'false'], dir);
  zapisVerziu(dir, verziaNaMaine);
  git(['add', '-A'], dir);
  git(['commit', '-m', 'kotva'], dir);
  return dir;
}

/** Prejde na novú vetvu — `main` zostane tam, kde bol. */
function novaVetva(dir: string, nazov: string): void {
  git(['checkout', '-q', '-b', nazov], dir);
}

/** Posunie `main` o jeden zlúčený PR (ako keby sa medzitým niečo zlúčilo). */
function zlucDoMain(dir: string, verzia: number): void {
  const vetva = git(['rev-parse', '--abbrev-ref', 'HEAD'], dir);
  git(['checkout', '-q', 'main'], dir);
  zapisVerziu(dir, verzia);
  git(['add', '-A'], dir);
  git(['commit', '-m', `chore: verzia ${verzia}`], dir);
  git(['checkout', '-q', vetva], dir);
}

afterEach(() => {
  while (docasneAdresare.length) {
    rmSync(docasneAdresare.pop() as string, { recursive: true, force: true });
  }
});

describe('verziaNaMain', () => {
  it('prečíta číslo z vetvy main, nie z pracovného adresára', () => {
    const dir = vytvorRepo(190);
    novaVetva(dir, 'vetva');
    zapisVerziu(dir, 999); // nezacommitované

    expect(verziaNaMain(dir)).toBe(190);
  });
});

describe('zvysVerziu', () => {
  it('nastaví číslo na main + 1', () => {
    const dir = vytvorRepo(190);
    novaVetva(dir, 'vetva');

    expect(zvysVerziu({ korenRepozitara: dir })).toEqual({ zmenene: true, verzia: 191 });
    expect(precitajVerziu(dir)).toBe(191);
  });

  it('druhé spustenie v tej istej vetve číslo nezvýši', () => {
    const dir = vytvorRepo(190);
    novaVetva(dir, 'vetva');

    zvysVerziu({ korenRepozitara: dir });
    expect(zvysVerziu({ korenRepozitara: dir })).toEqual({ zmenene: false, verzia: 191 });
    expect(precitajVerziu(dir)).toBe(191);
  });

  it('po zlúčení cudzieho PR dá ďalšie číslo, nie to isté', () => {
    const dir = vytvorRepo(190);
    novaVetva(dir, 'vetva');
    zvysVerziu({ korenRepozitara: dir }); // 191

    zlucDoMain(dir, 191); // niekto iný medzitým zlúčil svoj PR

    expect(zvysVerziu({ korenRepozitara: dir })).toEqual({ zmenene: true, verzia: 192 });
  });
});

describe('skontrolujVerziu', () => {
  it('main + 1 prejde', () => {
    const dir = vytvorRepo(190);
    novaVetva(dir, 'vetva');
    zapisVerziu(dir, 191);

    expect(skontrolujVerziu({ korenRepozitara: dir })).toMatchObject({ sedi: true, ocakavana: 191 });
  });

  it('nezvýšená verzia neprejde — to je hlavný prípad, ktorý má kontrola chytiť', () => {
    const dir = vytvorRepo(190);
    novaVetva(dir, 'vetva');

    expect(skontrolujVerziu({ korenRepozitara: dir })).toMatchObject({
      sedi: false,
      nezvysena: true,
      ocakavana: 191,
    });
  });

  it('zabudnuté zvýšenie po zlúčení cudzieho PR neprejde', () => {
    const dir = vytvorRepo(190);
    novaVetva(dir, 'vetva');
    zapisVerziu(dir, 191);
    zlucDoMain(dir, 191);

    // 191 už je na main — vetva musí ísť na 192.
    expect(skontrolujVerziu({ korenRepozitara: dir })).toMatchObject({ sedi: false, ocakavana: 192 });
  });

  it('preskočené číslo neprejde', () => {
    const dir = vytvorRepo(190);
    novaVetva(dir, 'vetva');
    zapisVerziu(dir, 195);

    expect(skontrolujVerziu({ korenRepozitara: dir })).toMatchObject({ sedi: false, ocakavana: 191 });
  });
});

/**
 * Kontrola po zlúčení (#231). Kontrola pri PR nestačí — beží pri otvorení
 * a pri pushi do vetvy, nie pri zlúčení, takže dva súbežne otvorené PR-y
 * prejdú s rovnakým číslom a druhý merge ho ticho použije znova.
 */
describe('skontrolujPosunNaMain', () => {
  /**
   * Zlúčený PR: mení kód a nesie číslo verzie. Číslo môže byť aj rovnaké ako
   * predtým — práve to je chyba, ktorú má kontrola chytiť, a commit vtedy
   * vzniká vďaka zmene v kóde.
   */
  function zlucPR(dir: string, verzia: number, poradie: number): void {
    zapisVerziu(dir, verzia);
    writeFileSync(join(dir, `zmena-${poradie}.txt`), 'kód\n');
    git(['add', '-A'], dir);
    git(['commit', '-m', `feat: zmena ${poradie}`], dir);
  }

  it('posun o jedna prejde', () => {
    const dir = vytvorRepo(190);
    zlucPR(dir, 191, 1);

    expect(skontrolujPosunNaMain({ korenRepozitara: dir })).toMatchObject({
      teraz: 191, predtym: 190, sedi: true,
    });
  });

  it('rovnaké číslo v dvoch zlúčeniach neprejde — to je prípad z #231', () => {
    const dir = vytvorRepo(195);
    zlucPR(dir, 196, 1);
    zlucPR(dir, 196, 2); // druhý súbežne otvorený PR s tým istým číslom

    expect(skontrolujPosunNaMain({ korenRepozitara: dir })).toMatchObject({
      teraz: 196, predtym: 196, sedi: false,
    });
  });

  it('preskočené číslo neprejde — zostavy medzitým neexistujú', () => {
    const dir = vytvorRepo(190);
    zlucPR(dir, 195, 1);

    expect(skontrolujPosunNaMain({ korenRepozitara: dir })).toMatchObject({ sedi: false });
  });

  it('znížené číslo neprejde', () => {
    const dir = vytvorRepo(191);
    zlucPR(dir, 190, 1);

    expect(skontrolujPosunNaMain({ korenRepozitara: dir })).toMatchObject({ sedi: false });
  });

  it('prvý commit nemá s čím porovnávať a nepadá', () => {
    const dir = vytvorRepo(1);

    expect(skontrolujPosunNaMain({ korenRepozitara: dir })).toMatchObject({
      sedi: true, bezPredchodcu: true,
    });
  });
});
