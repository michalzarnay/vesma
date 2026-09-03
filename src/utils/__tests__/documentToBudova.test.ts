import { describe, it, expect } from 'vitest';
import { budovaUpdatesFromDocument } from '../documentToBudova';
import { ParsedDocument } from '../pdfParser';

function certifikat(c: ParsedDocument['certifikat']): ParsedDocument {
  return { typ: 'energetickyCertifikat', rawText: '', certifikat: c };
}

describe('budovaUpdatesFromDocument — energetický certifikát (issue #170)', () => {
  it('uloží potrebu na vykurovanie, teplú vodu aj primárnu energiu', () => {
    const updates = budovaUpdatesFromDocument(certifikat({
      energetickaTrieda: 'C',
      celkovaPlochaMsq: 1200,
      potrebaEnergieKurenie: 95,
      potrebaEnergieVoda: 18,
      primarnaEnergia: 142,
    }));

    expect(updates.certifikatPotrebaVykurovanie).toBe(95);
    expect(updates.certifikatPotrebaTeplaVoda).toBe(18);
    expect(updates.certifikatPrimarnaEnergia).toBe(142);
    expect(updates.energetickaTrieda).toBe('C');
    expect(updates.uzitkovaPlochaNUS).toBe(1200);
  });

  it('nezapíše hodnoty z certifikátu do polí nameranej spotreby', () => {
    const updates = budovaUpdatesFromDocument(certifikat({
      potrebaEnergieKurenie: 95,
      potrebaEnergieVoda: 18,
      primarnaEnergia: 142,
    }));

    // Vypočítaná potreba a nameraná spotreba sú dve rôzne veličiny.
    expect(updates.kureniePlynSpotreba).toBeUndefined();
    expect(updates.kurenieElektrinaSpotreba).toBeUndefined();
    expect(updates.spotrebaElektriny).toBeUndefined();
  });

  it('označí budovu ako budovu s certifikátom, aby polia neboli skryté', () => {
    const updates = budovaUpdatesFromDocument(certifikat({ potrebaEnergieKurenie: 95 }));
    expect(updates.energetickyCertifikat).toBe(1);
  });

  it('z prázdneho certifikátu nerobí žiadne zmeny', () => {
    expect(budovaUpdatesFromDocument(certifikat({}))).toEqual({});
  });

  it('chýbajúce hodnoty nechá nevyplnené namiesto núl', () => {
    const updates = budovaUpdatesFromDocument(certifikat({ potrebaEnergieKurenie: 95 }));
    expect(updates.certifikatPotrebaTeplaVoda).toBeUndefined();
    expect(updates.certifikatPrimarnaEnergia).toBeUndefined();
  });
});

describe('budovaUpdatesFromDocument — ostatné dokumenty', () => {
  it('z auditu berie nameranú spotrebu, nie potrebu', () => {
    const updates = budovaUpdatesFromDocument({
      typ: 'auditSprava',
      rawText: '',
      audit: { spotrebaElektrina: 40000, spotrebaPlyn: 120000 },
    });

    expect(updates.kurenieElektrinaSpotreba).toBe(40000);
    expect(updates.kureniePlynSpotreba).toBe(120000);
    expect(updates.certifikatPotrebaVykurovanie).toBeUndefined();
  });

  it('z projektovej dokumentácie odvodí typ strechy', () => {
    const ploche = budovaUpdatesFromDocument({
      typ: 'projektovaDokumentacia', rawText: '', projekt: { typStrechy: 'plochá' },
    });
    const sikme = budovaUpdatesFromDocument({
      typ: 'projektovaDokumentacia', rawText: '', projekt: { typStrechy: 'šikmá' },
    });

    expect(ploche.strechaTyp).toBe(1);
    expect(sikme.strechaTyp).toBe(2);
  });
});
