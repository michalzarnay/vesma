import { describe, it, expect } from 'vitest';
import { jeVybrana } from '../selection';
import { YES_NO, YES_NO_UNKNOWN } from '../../../data/constants';

describe('jeVybrana – predikát „možnosť je vybraná" (podnety 96, 128)', () => {
  it('vyberie práve jednu možnosť zhodnú s hodnotou', () => {
    const vybrane = YES_NO.filter((o) => jeVybrana(0, o.value));
    expect(vybrane.map((o) => o.label)).toEqual(['nie']);
  });

  it('číselná 0 je platná hodnota (nie je to „nevyplnené")', () => {
    expect(jeVybrana(0, 0)).toBe(true);
  });

  it('prázdna hodnota nevyberie žiadnu možnosť', () => {
    for (const prazdna of [undefined, null, ''] as const) {
      expect(YES_NO_UNKNOWN.some((o) => jeVybrana(prazdna, o.value))).toBe(false);
    }
  });

  it('nezamieňa číslo a text', () => {
    expect(jeVybrana('1', 1)).toBe(false);
    expect(jeVybrana('oboje', 'oboje')).toBe(true);
  });
});
