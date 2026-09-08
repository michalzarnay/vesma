import { describe, it, expect, beforeEach } from 'vitest';
import {
  KLUC_AREALU, KLUC_RELACII, nacitajUlozeneRelacie, zalohaZPrehliadaca,
} from '../ulozeneRelacie';
import { createEmptyAreal } from '../../types/areal';

/** Minimálny localStorage — vitest beží v prostredí `node`, kde ho niet. */
function stubLocalStorage(): void {
  const data = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v); },
    removeItem: (k: string) => { data.delete(k); },
    clear: () => data.clear(),
  };
}

function ulozenaRelacia(nazov: string) {
  return {
    id: `id-${nazov}`,
    nazov,
    areal: { ...createEmptyAreal(), nazov },
    datumUlozenia: '2026-06-10T10:00:00.000Z',
  };
}

describe('nacitajUlozeneRelacie – čítanie relácií mimo appky (issue #251)', () => {
  beforeEach(stubLocalStorage);

  it('vráti prázdny zoznam, keď v prehliadači nič nie je', () => {
    expect(nacitajUlozeneRelacie()).toEqual([]);
  });

  it('prečíta uložené relácie', () => {
    const relacie = [ulozenaRelacia('ZŠ Lipová'), ulozenaRelacia('Dom vo Svederníku')];
    localStorage.setItem(KLUC_RELACII, JSON.stringify(relacie));

    expect(nacitajUlozeneRelacie().map((s) => s.nazov)).toEqual(['ZŠ Lipová', 'Dom vo Svederníku']);
  });

  it('neskončí chybou pri poškodenom obsahu — radšej prázdny zoznam než biela stránka', () => {
    localStorage.setItem(KLUC_RELACII, '{nie je to JSON');
    expect(nacitajUlozeneRelacie()).toEqual([]);

    localStorage.setItem(KLUC_RELACII, '{"toto":"nie je pole"}');
    expect(nacitajUlozeneRelacie()).toEqual([]);
  });
});

describe('zalohaZPrehliadaca – čo sa dá z tejto adresy zachrániť', () => {
  beforeEach(stubLocalStorage);

  it('nevráti nič, keď sa na tejto adrese ešte nemapovalo', () => {
    expect(zalohaZPrehliadaca()).toEqual([]);
  });

  it('pridá k uloženým reláciám aj rozpracovaný areál, aby sa nestratil', () => {
    localStorage.setItem(KLUC_RELACII, JSON.stringify([ulozenaRelacia('ZŠ Lipová')]));
    localStorage.setItem(KLUC_AREALU, JSON.stringify({ ...createEmptyAreal(), id: 'areal-9', nazov: 'Dom vo Svederníku' }));

    const zaloha = zalohaZPrehliadaca();

    expect(zaloha).toHaveLength(2);
    expect(zaloha[1].nazov).toBe('Dom vo Svederníku (rozpracovaný)');
    expect(zaloha[1].areal.nazov).toBe('Dom vo Svederníku');
  });

  it('rozpracovaný areál bez názvu je stále stiahnuteľný', () => {
    localStorage.setItem(KLUC_AREALU, JSON.stringify(createEmptyAreal()));

    expect(zalohaZPrehliadaca().map((s) => s.nazov)).toEqual(['Bez názvu (rozpracovaný)']);
  });
});
