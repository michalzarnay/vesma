import { describe, expect, it } from 'vitest';
import type { OpatrenieKategoria, Priorita } from '../../types/catalog';
import { stitkyRozlisitelne, stitokKategorie, stitokPriority } from '../stitkyOpatreni';

const PRIORITY: Priorita[] = ['vysoká', 'stredná', 'nízka'];
const KATEGORIE: OpatrenieKategoria[] = ['MZI', 'OZE', 'ENERGETIKA'];

describe('stitokPriority', () => {
  it('namapuje prioritu na text so slovom „Priorita:“', () => {
    expect(stitokPriority('vysoká').text).toBe('Priorita: vysoká');
    expect(stitokPriority('stredná').text).toBe('Priorita: stredná');
    expect(stitokPriority('nízka').text).toBe('Priorita: nízka');
  });

  it('tri priority majú navzájom rôzny text aj ikonu (nie len farbu)', () => {
    const s = PRIORITY.map(stitokPriority);
    expect(new Set(s.map((x) => x.text)).size).toBe(3);
    expect(new Set(s.map((x) => x.ikona)).size).toBe(3);
  });
});

describe('stitkyRozlisitelne', () => {
  it('každá priorita je rozlíšiteľná od každej kategórie', () => {
    for (const p of PRIORITY) {
      for (const k of KATEGORIE) {
        expect(stitkyRozlisitelne(stitokPriority(p), stitokKategorie(k))).toBe(true);
      }
    }
  });

  it('stredná priorita a energetika (pôvodný podnet 141) sa líšia tvarom, ikonou aj textom', () => {
    const p = stitokPriority('stredná');
    const k = stitokKategorie('ENERGETIKA');
    expect(p.tvar).not.toBe(k.tvar);
    expect(p.ikona).not.toBe(k.ikona);
    expect(p.text).not.toBe(k.text);
  });

  it('priorita a kategória nezdieľajú žiadnu farbu z palety', () => {
    const farbyPriorit = new Set(PRIORITY.map((p) => stitokPriority(p).farba));
    for (const k of KATEGORIE) expect(farbyPriorit.has(stitokKategorie(k).farba)).toBe(false);
  });

  it('dva štítky, ktoré sa líšia len farbou, rozlíšiteľné nie sú', () => {
    const a = stitokKategorie('MZI');
    expect(stitkyRozlisitelne(a, { ...a, farba: 'cervena' })).toBe(false);
  });
});
