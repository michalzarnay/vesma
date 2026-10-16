import { describe, it, expect } from 'vitest';
import { KRAJE, OBCE_SR, OBCE_ZAZNAMY, OKRESY_BY_KRAJ, type ZaznamObce } from '../../data/slovakLocations';
import { okresyObce, potrebujeVyberOkresu, predvyplnenieZObce } from '../obceSR';

const ZAZNAMY: ZaznamObce[] = [
  ['Likavka', 'Ružomberok', 'Žilinský kraj'],
  ['Selce', 'Poltár', 'Banskobystrický kraj'],
  ['Selce', 'Krupina', 'Banskobystrický kraj'],
  ['Selce', 'Banská Bystrica', 'Banskobystrický kraj'],
  ['Podhorie', 'Žilina', 'Žilinský kraj'],
  ['Podhorie', 'Banská Štiavnica', 'Banskobystrický kraj'],
  ['Abrahámovce', 'Bardejov', 'Prešovský kraj'],
];

const PRAZDNE = { kraj: '', okres: '' };

describe('okresyObce', () => {
  it('nájde obec v jedinom okrese', () => {
    expect(okresyObce('Likavka', ZAZNAMY)).toEqual([{ okres: 'Ružomberok', kraj: 'Žilinský kraj' }]);
  });

  it('nájde všetky okresy obce s rovnakým názvom', () => {
    expect(okresyObce('Selce', ZAZNAMY).map((m) => m.okres)).toEqual(['Poltár', 'Krupina', 'Banská Bystrica']);
  });

  it('ignoruje veľkosť písmen, diakritiku a okolité medzery', () => {
    expect(okresyObce('  abrahamovce ', ZAZNAMY)).toHaveLength(1);
  });

  it('neznáma alebo prázdna obec nemá okres', () => {
    expect(okresyObce('Neexistuje', ZAZNAMY)).toEqual([]);
    expect(okresyObce('', ZAZNAMY)).toEqual([]);
  });
});

describe('predvyplnenieZObce – pravidlá predvyplnenia (podnety 99, 100)', () => {
  it('jednoznačná obec doplní okres aj kraj', () => {
    expect(predvyplnenieZObce('Likavka', PRAZDNE, true, ZAZNAMY)).toEqual({
      okres: 'Ružomberok', kraj: 'Žilinský kraj',
    });
  });

  it('po zmene obce prepíše pozostatok po predošlej obci', () => {
    expect(
      predvyplnenieZObce('Likavka', { kraj: 'Prešovský kraj', okres: 'Bardejov' }, true, ZAZNAMY),
    ).toEqual({ okres: 'Ružomberok', kraj: 'Žilinský kraj' });
  });

  it('keď sa obec nezmenila, ručnú voľbu neprepíše', () => {
    expect(
      predvyplnenieZObce('Likavka', { kraj: 'Prešovský kraj', okres: 'Bardejov' }, false, ZAZNAMY),
    ).toEqual({});
  });

  it('keď sa obec nezmenila, doplní aspoň prázdne polia', () => {
    expect(predvyplnenieZObce('Likavka', PRAZDNE, false, ZAZNAMY)).toEqual({
      okres: 'Ružomberok', kraj: 'Žilinský kraj',
    });
  });

  it('už správne vyplnené hodnoty nemení', () => {
    expect(
      predvyplnenieZObce('Likavka', { kraj: 'Žilinský kraj', okres: 'Ružomberok' }, true, ZAZNAMY),
    ).toEqual({});
  });

  it('obec vo viacerých okresoch v jednom kraji doplní len kraj, okres nehádá', () => {
    expect(predvyplnenieZObce('Selce', PRAZDNE, true, ZAZNAMY)).toEqual({ kraj: 'Banskobystrický kraj' });
  });

  it('obec vo viacerých okresoch v rôznych krajoch nedoplní nič', () => {
    expect(predvyplnenieZObce('Podhorie', PRAZDNE, true, ZAZNAMY)).toEqual({});
  });

  it('obec vo viacerých okresoch zachová zvolený okres, ak je medzi možnými', () => {
    expect(
      predvyplnenieZObce('Selce', { kraj: 'Banskobystrický kraj', okres: 'Krupina' }, true, ZAZNAMY),
    ).toEqual({});
  });

  it('po zmene na obec vo viacerých okresoch zruší okres, ktorý k nej nepatrí', () => {
    expect(
      predvyplnenieZObce('Selce', { kraj: 'Žilinský kraj', okres: 'Ružomberok' }, true, ZAZNAMY),
    ).toEqual({ kraj: 'Banskobystrický kraj', okres: '' });
  });

  it('neznáma obec nič nemení (iná krajina, preklep)', () => {
    expect(predvyplnenieZObce('Brno', { kraj: 'Žilinský kraj', okres: 'Bytča' }, true, ZAZNAMY)).toEqual({});
  });
});

describe('potrebujeVyberOkresu', () => {
  it('upozorní, keď obec je vo viacerých okresoch a okres nie je zvolený', () => {
    expect(potrebujeVyberOkresu('Selce', '', ZAZNAMY)).toBe(true);
    expect(potrebujeVyberOkresu('Selce', 'Ružomberok', ZAZNAMY)).toBe(true);
  });

  it('neupozorňuje po zvolení správneho okresu ani pri jednoznačnej obci', () => {
    expect(potrebujeVyberOkresu('Selce', 'Poltár', ZAZNAMY)).toBe(false);
    expect(potrebujeVyberOkresu('Likavka', '', ZAZNAMY)).toBe(false);
  });
});

describe('číselník obcí z Registra adries (src/data/obceSR.json)', () => {
  it('pokrýva všetky obce, nie len pár stoviek', () => {
    expect(OBCE_SR.length).toBeGreaterThan(2800);
    expect(OBCE_SR).toContain('Abrahámovce');
    expect(OBCE_SR).toContain('Likavka');
  });

  it('každý kraj z registra je v KRAJE a každý okres je v zozname okresov svojho kraja', () => {
    const chyby: string[] = [];
    for (const [obec, okres, kraj] of OBCE_ZAZNAMY) {
      if (!KRAJE.includes(kraj)) chyby.push(`${obec}: kraj ${kraj}`);
      else if (!(OKRESY_BY_KRAJ[kraj] ?? []).includes(okres)) chyby.push(`${obec}: okres ${okres} (${kraj})`);
    }
    expect(chyby.slice(0, 10)).toEqual([]);
  });

  it('zoznam okresov má 79 okresov a každý z nich má v registri aspoň jednu obec', () => {
    const vsetky = Object.values(OKRESY_BY_KRAJ).flat();
    expect(vsetky).toHaveLength(79);
    const sObcou = new Set(OBCE_ZAZNAMY.map(([, okres]) => okres));
    expect(vsetky.filter((o) => !sObcou.has(o))).toEqual([]);
  });

  it('obec z príkladu Selce je vo viacerých okresoch, nie je to preklep v dátach', () => {
    expect(okresyObce('Selce').length).toBeGreaterThan(1);
    expect(okresyObce('Likavka')).toEqual([{ okres: 'Ružomberok', kraj: 'Žilinský kraj' }]);
  });
});
