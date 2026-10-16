import { useEffect, useState } from 'react';
import { jednoznacnaObec } from '../utils/uliceSR';
import { nacitajAdresyObce, type AdresyObce } from '../utils/adresySR';

/**
 * Čísla domov zvolenej obce z Registra adries. Vráti `null`, kým nie je obec
 * jednoznačná, kým sa súbor sťahuje, alebo ak sa nepodarilo stiahnuť. Súbor je z vlastného
 * servera (public/data/adresy), nič z toho, čo mapér píše, sa neodosiela.
 */
export function useAdresyObce(jeSlovensko: boolean, obec: string, okres: string): AdresyObce | null {
  const [adresy, setAdresy] = useState<{ kluc: string; data: AdresyObce } | null>(null);
  const poloha = jeSlovensko ? jednoznacnaObec(obec, okres) : null;
  const kluc = poloha ? `${poloha.kraj}|${poloha.okres}|${poloha.obec}` : '';

  useEffect(() => {
    if (!poloha) return undefined;
    let zrusene = false;
    nacitajAdresyObce(poloha).then((data) => {
      if (!zrusene && data) setAdresy({ kluc, data });
    });
    return () => { zrusene = true; };
    // `poloha` je odvodená z `kluc`, preto stačí sledovať ten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kluc]);

  if (!poloha || !adresy || adresy.kluc !== kluc) return null;
  return adresy.data;
}
