/**
 * Stav súčtu skupiny percent (napr. „Odvod vody z pozemku"), ktorých súčet má byť 100 %.
 * Čisto prezentačná logika: o ukladaní ani o pokračovaní v dotazníku nerozhoduje.
 *
 *  - prazdny:    nič nezadané (0 %) — neutrálne, nie je čo hlásiť
 *  - neuplny:    súčet je pod 100 % — používateľ je ešte v priebehu vypĺňania
 *  - hotovy:     súčet je 100 %
 *  - prekroceny: súčet je nad 100 % — jediný stav, ktorý je naozaj chybou
 */
export type StavSuctu = 'prazdny' | 'neuplny' | 'hotovy' | 'prekroceny';

const TOLERANCIA = 0.01;

export function stavSuctu(sucet: number): StavSuctu {
  if (Math.abs(sucet - 100) < TOLERANCIA) return 'hotovy';
  if (sucet > 100) return 'prekroceny';
  if (sucet > 0) return 'neuplny';
  return 'prazdny';
}

const zaokruhli = (n: number) => Math.round(n * 10) / 10;

/** Text o priebehu súčtu, ktorý sa ukazuje pri skupine percent. */
export function textSuctu(sucet: number): string {
  switch (stavSuctu(sucet)) {
    case 'prazdny':
      return 'Súčet: 0 % zo 100 %';
    case 'neuplny':
      return `Zatiaľ rozdelených ${zaokruhli(sucet)} % zo 100 %, ostáva ${zaokruhli(100 - sucet)} %`;
    case 'hotovy':
      return 'Rozdelených 100 % – súčet sedí';
    case 'prekroceny':
      return `Rozdelených ${zaokruhli(sucet)} % – o ${zaokruhli(sucet - 100)} % viac, než je 100 %`;
  }
}
