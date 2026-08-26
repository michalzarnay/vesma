import { describe, it, expect } from 'vitest';
import { createEmptyBudova } from '../areal';

describe('createEmptyBudova', () => {
  it('má predvolene zapnutú počítačovú sieť (LAN/Wi-Fi)', () => {
    const budova = createEmptyBudova();
    expect(budova.pocitacovaSiet).toBe(1);
  });
});
