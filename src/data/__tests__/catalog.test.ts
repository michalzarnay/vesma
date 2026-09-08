import { describe, it, expect } from 'vitest';
import { katalogOpatreni } from '../catalog';

describe('katalóg opatrení', () => {
  it('smart termostaty nepredpokladajú radiátory — platia aj pri podlahovom kúrení (podnety 79, 83)', () => {
    const termostaty = katalogOpatreni.find((o) => o.id === 'smart-termostaty')!;
    expect(termostaty.popis).toContain('podlahovom kúrení');
    expect(termostaty.popis).toContain('priestorové');
  });
});
