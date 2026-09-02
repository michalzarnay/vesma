import { describe, it, expect } from 'vitest';
import { bezDiakritiky } from '../formatters';
import { UPOZORNENIE_ROZSAH_HODNOTENIA } from '../../data/constants';

describe('bezDiakritiky', () => {
  it('odstráni slovenskú diakritiku vrátane ľ, ť, ď, ň, ô, ä, ŕ', () => {
    expect(bezDiakritiky('ľščťžýáíéúäôďňŕĽŠČŤŽÝÁÍÉÚÄÔĎŇŔ')).toBe('lsctzyaieuaodnrLSCTZYAIEUAODNR');
  });

  it('text bez diakritiky nechá nezmenený vrátane znaku §', () => {
    expect(bezDiakritiky('§ 2 vyhlasky c. 179/2015 Z. z.')).toBe('§ 2 vyhlasky c. 179/2015 Z. z.');
  });
});

describe('UPOZORNENIE_ROZSAH_HODNOTENIA (issue #175)', () => {
  it('uvádza, že nejde o energetický audit podľa § 2 vyhlášky č. 179/2015 Z. z.', () => {
    expect(UPOZORNENIE_ROZSAH_HODNOTENIA).toContain('nie energetický audit');
    expect(UPOZORNENIE_ROZSAH_HODNOTENIA).toContain('§ 2 vyhlášky MH SR č. 179/2015 Z. z.');
    expect(UPOZORNENIE_ROZSAH_HODNOTENIA).toContain('orientačné');
  });
});
