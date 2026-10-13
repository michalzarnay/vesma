import { describe, it, expect } from 'vitest';
import {
  createEmptyBGOpatrenie, createEmptyBudova, createEmptyInaStavba, createEmptyPozemok,
} from '../../types/areal';
import {
  maVyplnenyPozemok, maVyplnenuBudovu, maVyplnenuInuStavbu, maVyplneneBGOpatrenie,
  textPotvrdeniaMazania,
} from '../vyplnenyObsah';

describe('maVyplnenyPozemok', () => {
  it('čerstvá prázdna parcela nie je vyplnená (id sa ignoruje)', () => {
    expect(maVyplnenyPozemok(createEmptyPozemok())).toBe(false);
  });
  it('textové pole alebo číslo = vyplnená', () => {
    expect(maVyplnenyPozemok({ ...createEmptyPozemok(), parcela: '123/4' })).toBe(true);
    expect(maVyplnenyPozemok({ ...createEmptyPozemok(), celkovaVymera: 500 })).toBe(true);
  });
});

describe('maVyplnenuBudovu', () => {
  it('prázdna budova nie je vyplnená', () => {
    expect(maVyplnenuBudovu(createEmptyBudova())).toBe(false);
  });
  it('akákoľvek zmena oproti prázdnej = vyplnená', () => {
    expect(maVyplnenuBudovu({ ...createEmptyBudova(), nazov: 'Škola' })).toBe(true);
    expect(maVyplnenuBudovu({ ...createEmptyBudova(), vykurovanaPlocha: 90 })).toBe(true);
  });
});

describe('maVyplnenuInuStavbu / maVyplneneBGOpatrenie', () => {
  it('prázdne nie sú vyplnené', () => {
    expect(maVyplnenuInuStavbu(createEmptyInaStavba())).toBe(false);
    expect(maVyplneneBGOpatrenie(createEmptyBGOpatrenie())).toBe(false);
  });
  it('vyplnené sú vyplnené', () => {
    expect(maVyplnenuInuStavbu({ ...createEmptyInaStavba(), zastavanaPlocha: 20 })).toBe(true);
    expect(maVyplneneBGOpatrenie({ ...createEmptyBGOpatrenie(), nazov: 'Dažďová záhrada' })).toBe(true);
  });
});

describe('textPotvrdeniaMazania', () => {
  it('obsahuje druh a názov', () => {
    expect(textPotvrdeniaMazania('parcelu', 'Dvor')).toBe('Zmazať parcelu „Dvor"? Vyplnené údaje sa nedajú vrátiť.');
  });
});
