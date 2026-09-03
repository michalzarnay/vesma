import { describe, it, expect } from 'vitest';
import { createEmptyBudova } from '../../types/areal';
import {
  maPocetSvietidiel,
  odhadPrikonuOsvetleniaW,
  pocetNieLedSvietidiel,
  podielLED,
  prikonLedOsvetleniaW,
  prikonNieLedOsvetleniaW,
} from '../lighting';
import { HUSTOTA_PRIKONU_OSVETLENIA, hustotaPrikonuOsvetlenia } from '../../data/lightingPowerDensity';

describe('podielLED (issue #183)', () => {
  it('počíta podiel z počtu svietidiel, keď je zadaný', () => {
    const b = createEmptyBudova();
    b.osvetleniePocetSvietidiel = 40;
    b.osvetleniePocetSvietidielLED = 10;
    b.osvetlenieLED = 90; // percento sa má ignorovať

    expect(maPocetSvietidiel(b)).toBe(true);
    expect(podielLED(b)).toBe(0.25);
  });

  it('bez počtu svietidiel použije percento LED', () => {
    const b = createEmptyBudova();
    b.osvetlenieLED = 40;

    expect(maPocetSvietidiel(b)).toBe(false);
    expect(podielLED(b)).toBeCloseTo(0.4);
  });

  it('relácia uložená pred zmenou (chýbajúce polia) sa správa ako bez počtu svietidiel', () => {
    const b = createEmptyBudova();
    delete b.osvetleniePocetSvietidiel;
    delete b.osvetleniePocetSvietidielLED;
    b.osvetlenieLED = 30;

    expect(maPocetSvietidiel(b)).toBe(false);
    expect(podielLED(b)).toBeCloseTo(0.3);
    expect(pocetNieLedSvietidiel(b)).toBe(0);
  });

  it('viac LED než svietidiel celkom neprekročí 100 %', () => {
    const b = createEmptyBudova();
    b.osvetleniePocetSvietidiel = 10;
    b.osvetleniePocetSvietidielLED = 25;

    expect(podielLED(b)).toBe(1);
    expect(pocetNieLedSvietidiel(b)).toBe(0);
  });
});

describe('pocetNieLedSvietidiel', () => {
  it('vráti počet svietidiel, ktoré ešte nie sú LED', () => {
    const b = createEmptyBudova();
    b.osvetleniePocetSvietidiel = 40;
    b.osvetleniePocetSvietidielLED = 15;

    expect(pocetNieLedSvietidiel(b)).toBe(25);
  });

  it('je nula, keď počet svietidiel nie je zadaný (percento nestačí na počet kusov)', () => {
    const b = createEmptyBudova();
    b.osvetlenieLED = 20;

    expect(pocetNieLedSvietidiel(b)).toBe(0);
  });
});

describe('odhad príkonu osvetlenia z plochy', () => {
  it('použije hustotu podľa typu objektu', () => {
    const b = createEmptyBudova();
    b.uzitkovaPlochaNUS = 1000;

    expect(odhadPrikonuOsvetleniaW(b, 'sklad')).toBe(1000 * HUSTOTA_PRIKONU_OSVETLENIA.sklady_haly);
    expect(odhadPrikonuOsvetleniaW(b, 'obchod')).toBe(1000 * HUSTOTA_PRIKONU_OSVETLENIA.predajne);
    expect(odhadPrikonuOsvetleniaW(b, 'rd')).toBe(1000 * HUSTOTA_PRIKONU_OSVETLENIA.byvanie);
  });

  it('neznámy alebo nevyplnený typ objektu spadne na predvolenú kategóriu kancelárií', () => {
    expect(hustotaPrikonuOsvetlenia(undefined)).toBe(HUSTOTA_PRIKONU_OSVETLENIA.kancelarie);
    expect(hustotaPrikonuOsvetlenia('neexistujuci_typ')).toBe(HUSTOTA_PRIKONU_OSVETLENIA.kancelarie);
  });

  it('rozdelí príkon medzi nie-LED a LED podľa podielu z počtu svietidiel', () => {
    const b = createEmptyBudova();
    b.uzitkovaPlochaNUS = 500;
    b.osvetleniePocetSvietidiel = 20;
    b.osvetleniePocetSvietidielLED = 5; // 25 % LED

    const celkom = 500 * HUSTOTA_PRIKONU_OSVETLENIA.kancelarie;
    expect(prikonNieLedOsvetleniaW(b, 'urad')).toBeCloseTo(celkom * 0.75);
    expect(prikonLedOsvetleniaW(b, 'urad')).toBeCloseTo(celkom * 0.25);
    expect(prikonNieLedOsvetleniaW(b, 'urad') + prikonLedOsvetleniaW(b, 'urad')).toBeCloseTo(celkom);
  });
});
