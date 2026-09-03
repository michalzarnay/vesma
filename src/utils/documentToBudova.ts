// Mapovanie údajov z načítaných dokumentov (PDF) na polia budovy.
//
// Vytiahnuté z BudovaForm.tsx, aby sa dalo testovať — práve tu sa strácali
// ukazovatele z energetického certifikátu (issue #170).
//
// PRAVIDLO: vypočítaná potreba energie z certifikátu a nameraná spotreba
// z faktúr sú dve rôzne veličiny a majú vlastné polia. Hodnoty z certifikátu
// sa preto nikdy nezapisujú do spotrebných polí a naopak.

import { Budova } from '../types/areal';
import { ParsedDocument } from './pdfParser';

/** Zostaví zmeny budovy z načítaného dokumentu. Prázdny objekt = nič použiteľné. */
export function budovaUpdatesFromDocument(doc: ParsedDocument): Partial<Budova> {
  const updates: Partial<Budova> = {};

  if (doc.projekt) {
    const p = doc.projekt;
    if (p.uzitkovaPlocha) updates.uzitkovaPlochaNUS = p.uzitkovaPlocha;
    if (p.zastavanahPlocha) updates.plochaPodorysu = p.zastavanahPlocha;
    if (p.obvodoveStenyMaterial) updates.obvodoveStenyMaterial = p.obvodoveStenyMaterial;
    if (p.typStrechy) {
      const t = p.typStrechy.toLowerCase();
      if (t.includes('ploch')) updates.strechaTyp = 1;
      else if (t.includes('šikm') || t.includes('sikm')) updates.strechaTyp = 2;
    }
  }

  if (doc.certifikat) {
    const c = doc.certifikat;
    if (c.celkovaPlochaMsq) updates.uzitkovaPlochaNUS = c.celkovaPlochaMsq;
    if (c.energetickaTrieda) updates.energetickaTrieda = c.energetickaTrieda;
    // Vypočítané potreby energie — do vlastných polí, nie do spotrebných.
    if (c.potrebaEnergieKurenie) updates.certifikatPotrebaVykurovanie = c.potrebaEnergieKurenie;
    if (c.potrebaEnergieVoda) updates.certifikatPotrebaTeplaVoda = c.potrebaEnergieVoda;
    if (c.primarnaEnergia) updates.certifikatPrimarnaEnergia = c.primarnaEnergia;
    // Keď certifikát niečo dal, označ budovu ako budovu s certifikátom —
    // inak by polia zostali skryté za podmienenou sekciou.
    if (c.energetickaTrieda || c.potrebaEnergieKurenie || c.potrebaEnergieVoda || c.primarnaEnergia) {
      updates.energetickyCertifikat = 1;
    }
  }

  if (doc.audit) {
    const a = doc.audit;
    if (a.spotrebaElektrina) updates.kurenieElektrinaSpotreba = a.spotrebaElektrina;
    if (a.spotrebaPlyn) updates.kureniePlynSpotreba = a.spotrebaPlyn;
  }

  return updates;
}
