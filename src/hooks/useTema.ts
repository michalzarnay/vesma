import { useCallback, useState } from 'react';
import { aplikujTemu, nacitajVolbu, ulozVolbu, type VolbaTemy } from '../utils/tema';

/** Voľba vzhľadu (Svetlý / Tmavý / Auto) pre prepínač v menu. */
export function useTema(): [VolbaTemy, (volba: VolbaTemy) => void] {
  const [volba, setVolba] = useState<VolbaTemy>(nacitajVolbu);

  const nastav = useCallback((nova: VolbaTemy) => {
    ulozVolbu(nova);
    aplikujTemu(nova);
    setVolba(nova);
  }, []);

  return [volba, nastav];
}
