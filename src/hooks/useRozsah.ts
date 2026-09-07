import { createContext, useContext } from 'react';
import { RozsahMapovania } from '../types/areal';

/**
 * Rozsah mapovania aktuálneho areálu pre formuláre hlboko v strome
 * (PozemokForm, BudovaForm), aby sa neprenášal cez každý krok ako prop.
 * Poskytuje ho WizardContainer; mimo neho platí „oboje" — nič sa neskrýva.
 */
export const RozsahContext = createContext<RozsahMapovania>('oboje');

export function useRozsah(): RozsahMapovania {
  return useContext(RozsahContext);
}
