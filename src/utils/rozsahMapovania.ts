import { Areal, RozsahMapovania } from '../types/areal';

/**
 * Rozsah mapovania — jediné miesto, kde sa rozhoduje, či sa voda alebo energia
 * v areáli mapuje.
 *
 * Každé miesto v aplikácii, ktoré niečo skrýva alebo vynecháva podľa rozsahu
 * (sekcie dotazníka, ukazovatele vo Výsledkoch, odporúčania, oblasti
 * porovnania), sa pýta týchto dvoch predikátov. Nikde inde sa hodnota
 * `rozsahMapovania` neporovnáva priamo — keď sa pravidlo zmení, mení sa tu.
 *
 * Export (XLSX, CSV) rozsah neberie do úvahy: stĺpce ostávajú úplné, aby sa
 * nerozbil kontrakt pre xMatik a Klimasken; energetické polia sú len prázdne.
 */

type SRozsahom = Pick<Areal, 'rozsahMapovania'> | RozsahMapovania;

function rozsah(x: SRozsahom): RozsahMapovania {
  return typeof x === 'string' ? x : x.rozsahMapovania;
}

/** Mapuje sa voda — modro-zelená infraštruktúra, odvod a zadržiavanie vody? */
export function mapujeVodu(x: SRozsahom): boolean {
  return rozsah(x) !== 'energia';
}

/** Mapuje sa energia — OZE, zateplenie, vykurovanie, elektrina? */
export function mapujeEnergiu(x: SRozsahom): boolean {
  return rozsah(x) !== 'voda';
}

/** Text pre používateľa, prečo časť dotazníka alebo hodnotenia nevidí. */
export function poznamkaMimoRozsahu(oblast: 'voda' | 'energia'): string {
  return oblast === 'voda'
    ? 'Tento krok sa týka vody. Areál mapujete len pre energiu — krok preskočte alebo zmeňte rozsah mapovania na kroku 1 (Úvod).'
    : 'Táto časť sa týka energie. Areál mapujete len pre vodu — časť je skrytá; rozsah mapovania zmeníte na kroku 1 (Úvod).';
}
