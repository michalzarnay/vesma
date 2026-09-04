import { describe, it, expect } from 'vitest';
import {
  createEmptyAreal, createEmptyBGOpatrenie, createEmptyBudova, createEmptyInaStavba,
  createEmptyPozemok,
} from '../../types/areal';
import { computeScore } from '../../hooks/useScoring';
import { harkyExportu } from '../xlsxExport';
import { csvExportu } from '../csvExport';

/**
 * Areál s jednou entitou od každého typu — čo je v ňom zadané, musí byť
 * v exporte (issues #209 a #223).
 */
function arealSoVsetkymEntitami() {
  const areal = createEmptyAreal();
  areal.nazov = 'Testovací areál';

  const pozemok = createEmptyPozemok();
  pozemok.parcela = '2307/1';
  pozemok.aktualneVyuzitie = 'školský dvor';
  pozemok.celkovaVymera = 1200;
  areal.pozemky = [pozemok];

  const budova = createEmptyBudova();
  budova.nazov = 'Hlavná budova';
  budova.uzitkovaPlochaNUS = 800;
  areal.budovy = [budova];

  const stavba = createEmptyInaStavba();
  stavba.nazov = 'Oplotenie areálu';
  stavba.typStavby = 'oplotenie';
  stavba.zastavanaPlocha = 40;
  areal.ineStavby = [stavba];

  const opatrenie = createEmptyBGOpatrenie();
  opatrenie.nazov = 'Dažďová záhrada pri vstupe';
  opatrenie.naParcele = '2307/1';
  areal.bgOpatrenia = [opatrenie];

  return areal;
}

function csvTestovaciehoArealu(areal = arealSoVsetkymEntitami()) {
  return csvExportu(areal, computeScore(areal), []);
}

describe('harkyExportu', () => {
  it('má hárok pre každý typ entity dotazníka', () => {
    const areal = arealSoVsetkymEntitami();
    const nazvy = harkyExportu(areal, computeScore(areal), []).map((h) => h.nazov);

    expect(nazvy).toEqual([
      'Súhrn', 'Výpočet skóre', 'Pozemky', 'Budovy',
      'Iné stavby', 'B&G opatrenia', 'Odporúčania', 'Váhy a skóre',
    ]);
  });

  it('hárok Iné stavby nesie zadané údaje (#209)', () => {
    const areal = arealSoVsetkymEntitami();
    const harok = harkyExportu(areal, computeScore(areal), []).find((h) => h.nazov === 'Iné stavby')!;

    expect(harok.riadky[0]).toContain('Zastavaná plocha (m²)');
    expect(harok.riadky[1]).toEqual([
      'Oplotenie areálu', '', '', 'oplotenie', '', '', 0, 40,
    ]);
  });

  it('hárok B&G opatrenia nesie zadané údaje (#223)', () => {
    const areal = arealSoVsetkymEntitami();
    const harok = harkyExportu(areal, computeScore(areal), []).find((h) => h.nazov === 'B&G opatrenia')!;

    expect(harok.riadky[0][0]).toBe('Opatrenie');
    expect(harok.riadky[1][0]).toBe('Dažďová záhrada pri vstupe');
    expect(harok.riadky[1][1]).toBe('2307/1');
  });

  it('entita bez názvu dostane poradové označenie, nezmizne', () => {
    const areal = createEmptyAreal();
    areal.ineStavby = [createEmptyInaStavba()];
    const harok = harkyExportu(areal, computeScore(areal), []).find((h) => h.nazov === 'Iné stavby')!;

    expect(harok.riadky).toHaveLength(2);
    expect(harok.riadky[1][0]).toBe('Stavba 1');
  });
});

describe('csvExportu', () => {
  it('obsahuje všetky sekcie zošita — CSV je plnohodnotný export', () => {
    const csv = csvTestovaciehoArealu();

    for (const sekcia of ['Súhrn', 'Výpočet skóre', 'Pozemky', 'Budovy',
      'Iné stavby', 'B&G opatrenia', 'Odporúčania', 'Váhy a skóre']) {
      expect(csv, `chýba sekcia ${sekcia}`).toContain(`"### ${sekcia}"`);
    }
  });

  it('nesie každú zadanú entitu, nielen jej počet', () => {
    const csv = csvTestovaciehoArealu();

    expect(csv).toContain('Testovací areál');
    expect(csv).toContain('2307/1');
    expect(csv).toContain('Hlavná budova');
    expect(csv).toContain('Oplotenie areálu');
    expect(csv).toContain('Dažďová záhrada pri vstupe');
  });

  it('začína BOM a oddeľuje bunky bodkočiarkou — slovenský Excel to otvorí správne', () => {
    const csv = csvTestovaciehoArealu();

    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('";"');
  });

  it('zdvojí úvodzovku v texte, aby predčasne neukončila bunku', () => {
    const areal = arealSoVsetkymEntitami();
    areal.ineStavby[0].popisStavby = 'plot typu "žabička"';

    expect(csvTestovaciehoArealu(areal)).toContain('"plot typu ""žabička"""');
  });

  it('prázdny areál dá súbor so sekciami, nie prázdny súbor', () => {
    const areal = createEmptyAreal();
    const csv = csvExportu(areal, computeScore(areal), []);

    expect(csv).toContain('"### Súhrn"');
    expect(csv).toContain('"### Iné stavby"');
  });
});
