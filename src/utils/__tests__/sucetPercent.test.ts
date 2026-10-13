import { describe, it, expect } from 'vitest';
import { stavSuctu, textSuctu } from '../sucetPercent';

describe('stavSuctu', () => {
  it('nič nezadané je prázdny stav, nie chyba', () => {
    expect(stavSuctu(0)).toBe('prazdny');
  });
  it('súčet pod 100 % je neúplný (nie prekročený)', () => {
    expect(stavSuctu(1)).toBe('neuplny');
    expect(stavSuctu(60)).toBe('neuplny');
    expect(stavSuctu(99.5)).toBe('neuplny');
  });
  it('presne 100 % je hotový, aj s drobnou odchýlkou desatinných čísel', () => {
    expect(stavSuctu(100)).toBe('hotovy');
    expect(stavSuctu(33.3 + 33.3 + 33.4)).toBe('hotovy');
  });
  it('nad 100 % je prekročený', () => {
    expect(stavSuctu(100.5)).toBe('prekroceny');
    expect(stavSuctu(130)).toBe('prekroceny');
  });
});

describe('textSuctu', () => {
  it('pri neúplnom súčte ukáže priebeh a koľko ostáva', () => {
    expect(textSuctu(60)).toBe('Zatiaľ rozdelených 60 % zo 100 %, ostáva 40 %');
  });
  it('pri 100 % potvrdí', () => {
    expect(textSuctu(100)).toContain('súčet sedí');
  });
  it('pri prekročení povie o koľko', () => {
    expect(textSuctu(130)).toContain('o 30 % viac');
  });
  it('neúplný súčet nepoužíva slová „musí" ani „chyba"', () => {
    expect(textSuctu(60)).not.toMatch(/musí|chyb/i);
  });
});
