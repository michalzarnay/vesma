import { describe, expect, it } from 'vitest';
import { jeTestovaciKanal } from '../kanalNasadenia';

describe('kanál nasadenia (#236)', () => {
  it('VITE_VESMA_KANAL=test je testovací, čokoľvek iné stabilné', () => {
    expect(jeTestovaciKanal('test', false)).toBe(true);
    expect(jeTestovaciKanal('test', true)).toBe(true);
    expect(jeTestovaciKanal('stabilna', true)).toBe(false);
    expect(jeTestovaciKanal('produkcia', false)).toBe(false);
  });
  it('bez premennej rozhoduje dev server: lokálne test, produkčný build stabilný', () => {
    expect(jeTestovaciKanal(undefined, true)).toBe(true);
    expect(jeTestovaciKanal('', true)).toBe(true);
    expect(jeTestovaciKanal(undefined, false)).toBe(false);
  });
});
