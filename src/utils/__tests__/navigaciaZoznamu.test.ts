import { describe, expect, it } from 'vitest';
import { dalsiAktivny, jePlatnyIndex } from '../navigaciaZoznamu';

describe('dalsiAktivny', () => {
  it('šípka nadol bez zvýraznenia začne od prvej položky', () => {
    expect(dalsiAktivny(-1, 3, 'dole')).toBe(0);
  });
  it('šípka nadol posúva a na konci sa vráti na začiatok', () => {
    expect(dalsiAktivny(0, 3, 'dole')).toBe(1);
    expect(dalsiAktivny(2, 3, 'dole')).toBe(0);
  });
  it('šípka nahor bez zvýraznenia začne od poslednej položky', () => {
    expect(dalsiAktivny(-1, 3, 'hore')).toBe(2);
  });
  it('šípka nahor posúva späť a na začiatku skočí na koniec', () => {
    expect(dalsiAktivny(2, 3, 'hore')).toBe(1);
    expect(dalsiAktivny(0, 3, 'hore')).toBe(2);
  });
  it('v prázdnom zozname nie je nič zvýraznené', () => {
    expect(dalsiAktivny(0, 0, 'dole')).toBe(-1);
    expect(dalsiAktivny(-1, 0, 'hore')).toBe(-1);
  });
  it('index mimo zoznamu (zoznam sa skrátil) sa berie ako bez zvýraznenia', () => {
    expect(dalsiAktivny(7, 3, 'dole')).toBe(0);
    expect(dalsiAktivny(7, 3, 'hore')).toBe(2);
  });
});

describe('jePlatnyIndex', () => {
  it('platí len pre index v rozsahu zoznamu', () => {
    expect(jePlatnyIndex(0, 2)).toBe(true);
    expect(jePlatnyIndex(1, 2)).toBe(true);
    expect(jePlatnyIndex(2, 2)).toBe(false);
    expect(jePlatnyIndex(-1, 2)).toBe(false);
    expect(jePlatnyIndex(NaN, 2)).toBe(false);
  });
});
