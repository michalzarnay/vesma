import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { INFO_BLOK_TRIEDY } from '../infoBlokTriedy';

const FAREBNA = /\b(?:bg|border|text)-(?:red|amber|orange|yellow|blue|sky|green)-/;

describe('InfoBlok – mapovanie variant na triedy', () => {
  it('informačný variant je neutrálny sivý, bez farebných tried', () => {
    expect(INFO_BLOK_TRIEDY.info).not.toMatch(FAREBNA);
    expect(INFO_BLOK_TRIEDY.info).toContain('bg-gray-50');
    expect(INFO_BLOK_TRIEDY.info).toContain('border-gray-200');
  });

  it('stavový variant ostáva farebný', () => {
    expect(INFO_BLOK_TRIEDY.varovanie).toMatch(FAREBNA);
  });
});

describe('Informačné bloky v krokoch 2 a 3', () => {
  const subory = [
    '../../wizard/Step2_Pozemky.tsx',
    '../../wizard/Step3_Budovy.tsx',
    '../../wizard/shared/PozemokForm.tsx',
  ];
  it.each(subory)('%s nemá modrý/oranžový/žltý panel', (cesta) => {
    const zdroj = readFileSync(new URL(cesta, import.meta.url), 'utf8');
    expect(zdroj).not.toMatch(/\b(?:bg|border)-(?:blue|sky|amber|orange|yellow)-/);
  });
});
