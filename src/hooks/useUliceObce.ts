import { useEffect, useState } from 'react';
import { jednoznacnaObec, nacitajUliceKraja, uliceObce } from '../utils/uliceSR';

/**
 * Ulice zvolenej obce z Registra adries. Vráti `null`, kým nie je obec jednoznačná,
 * kým sa ulice načítavajú, alebo ak obec nemá pomenované ulice. Pole `jeSlovensko`
 * vypína načítanie pre iné krajiny.
 */
export function useUliceObce(jeSlovensko: boolean, obec: string, okres: string): string[] | null {
  const [ulice, setUlice] = useState<{ kluc: string; zoznam: string[] } | null>(null);
  const poloha = jeSlovensko ? jednoznacnaObec(obec, okres) : null;
  const kluc = poloha ? `${poloha.kraj}|${poloha.okres}|${poloha.obec}` : '';

  useEffect(() => {
    if (!poloha) return undefined;
    let zrusene = false;
    nacitajUliceKraja(poloha.kraj).then((data) => {
      if (!zrusene) setUlice({ kluc, zoznam: uliceObce(data, poloha) });
    });
    return () => { zrusene = true; };
    // `poloha` je odvodená z `kluc`, preto stačí sledovať ten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kluc]);

  if (!poloha || !ulice || ulice.kluc !== kluc || ulice.zoznam.length === 0) return null;
  return ulice.zoznam;
}
