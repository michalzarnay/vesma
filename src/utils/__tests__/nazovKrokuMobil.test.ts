import { describe, it, expect } from 'vitest';
import { nazovKrokuNaMobile, DOTYK_MOBIL } from '../nazovKrokuMobil';
import { WIZARD_STEPS } from '../../types/wizard';

describe('nazovKrokuNaMobile', () => {
  it('pre každý krok vráti jeho číslo, počet krokov a názov', () => {
    for (const s of WIZARD_STEPS) {
      expect(nazovKrokuNaMobile(s.id)).toBe(`Krok ${s.id} z ${WIZARD_STEPS.length} – ${s.nazov}`);
    }
  });
  it('neznámy krok nevráti nič', () => {
    expect(nazovKrokuNaMobile(99)).toBe('');
  });
});

describe('DOTYK_MOBIL', () => {
  it('určuje 44 px (min-h-11) na mobile a od sm ho ruší', () => {
    expect(DOTYK_MOBIL).toContain('min-h-11');
    expect(DOTYK_MOBIL).toContain('sm:min-h-0');
  });
});
