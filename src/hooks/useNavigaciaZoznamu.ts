import { useCallback, useEffect, useId, useState } from 'react';
import { dalsiAktivny, jePlatnyIndex, type SmerPohybu } from '../utils/navigaciaZoznamu';

interface Parametre {
  /** Počet položiek v zozname návrhov. */
  pocet: number;
  /** Je zoznam otvorený (zobrazený)? */
  otvoreny: boolean;
  /** Otvorí zoznam (šípka nadol pri zatvorenom zozname). */
  otvor: () => void;
  zatvor: () => void;
  /** Vyberie položku s daným indexom. */
  vyber: (index: number) => void;
  /** Mení sa, keď sa zmení obsah zoznamu (zvýraznenie sa vtedy zruší). */
  kluc: string;
}

/**
 * Ovládanie zoznamu návrhov klávesnicou podľa vzoru ARIA „combobox“: šípka nadol otvorí
 * zoznam a posúva po položkách, šípka nahor posúva späť, Enter vyberie zvýraznenú položku,
 * Escape zoznam zatvorí. Tab a písanie fungujú ako doteraz.
 */
export function useNavigaciaZoznamu({ pocet, otvoreny, otvor, zatvor, vyber, kluc }: Parametre) {
  const idZoznamu = useId();
  // Zvýraznenie patrí k obsahu zoznamu (`kluc`): keď sa obsah zmení, platí znova „nič nezvýraznené“.
  const [stav, nastavStav] = useState({ kluc, index: -1 });
  // Šípka pri zatvorenom zozname ho otvorí a zvýrazní prvú (resp. poslednú) položku, až keď sa objaví.
  const [cakajuci, nastavCakajuci] = useState<SmerPohybu | null>(null);

  const zakladny = otvoreny && stav.kluc === kluc ? stav.index : -1;
  const aktivny = zakladny < 0 && cakajuci && otvoreny && pocet > 0
    ? dalsiAktivny(-1, pocet, cakajuci)
    : zakladny;

  const nastavAktivny = useCallback(
    (index: number) => {
      nastavCakajuci(null);
      nastavStav({ kluc, index });
    },
    [kluc],
  );

  const idMoznosti = useCallback((index: number) => `${idZoznamu}-${index}`, [idZoznamu]);

  useEffect(() => {
    if (aktivny >= 0) document.getElementById(idMoznosti(aktivny))?.scrollIntoView?.({ block: 'nearest' });
  }, [aktivny, idMoznosti]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const smer = e.key === 'ArrowDown' ? 'dole' : 'hore';
        if (!otvoreny) {
          e.preventDefault();
          nastavCakajuci(smer);
          otvor();
          return;
        }
        if (pocet === 0) return;
        e.preventDefault();
        nastavAktivny(dalsiAktivny(aktivny, pocet, smer));
      } else if (e.key === 'Enter') {
        if (otvoreny && jePlatnyIndex(aktivny, pocet)) {
          e.preventDefault();
          vyber(aktivny);
        }
      } else if (e.key === 'Escape') {
        if (otvoreny) {
          e.preventDefault();
          nastavCakajuci(null);
          zatvor();
        }
      }
    },
    [otvoreny, pocet, aktivny, otvor, zatvor, vyber, nastavAktivny],
  );

  return {
    aktivny: jePlatnyIndex(aktivny, pocet) ? aktivny : -1,
    nastavAktivny,
    onKeyDown,
    idZoznamu,
    idMoznosti,
  };
}
