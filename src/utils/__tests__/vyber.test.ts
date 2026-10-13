import { describe, it, expect } from 'vitest';
import { jeMoznostVybrana, jeVyberNevyplneny } from '../vyber';

const ANO_NIE = [{ value: 1 }, { value: 0 }] as const;

describe('jeMoznostVybrana', () => {
  it('rozlišuje 0 od nevyplneného', () => {
    expect(jeMoznostVybrana(0, 0)).toBe(true);
    expect(jeMoznostVybrana(0, 1)).toBe(false);
    expect(jeMoznostVybrana(undefined, 0)).toBe(false);
    expect(jeMoznostVybrana(null, 0)).toBe(false);
  });
  it('porovnáva striktne (číslo vs. text)', () => {
    expect(jeMoznostVybrana('1', 1)).toBe(false);
    expect(jeMoznostVybrana('voda', 'voda')).toBe(true);
  });
});

describe('jeVyberNevyplneny', () => {
  it('je nevyplnené pre prázdnu alebo cudziu hodnotu', () => {
    expect(jeVyberNevyplneny(ANO_NIE, undefined)).toBe(true);
    expect(jeVyberNevyplneny(ANO_NIE, null)).toBe(true);
    expect(jeVyberNevyplneny(ANO_NIE, '')).toBe(true);
    expect(jeVyberNevyplneny(ANO_NIE, 2)).toBe(true);
  });
  it('nie je nevyplnené pre 0 ani 1', () => {
    expect(jeVyberNevyplneny(ANO_NIE, 0)).toBe(false);
    expect(jeVyberNevyplneny(ANO_NIE, 1)).toBe(false);
  });
});
