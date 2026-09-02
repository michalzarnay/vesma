import { describe, it, expect } from 'vitest';
import { findMatchingSessions, Session } from '../useSessionManager';
import { createEmptyAreal } from '../../types/areal';

function vytvorSession(over: Partial<Session['areal']>, datumUlozenia = '2024-01-01T00:00:00.000Z'): Session {
  const areal = { ...createEmptyAreal(), ...over };
  return { id: crypto.randomUUID(), nazov: areal.nazov || 'bez názvu', areal, datumUlozenia };
}

describe('findMatchingSessions – rozpoznanie tej istej relácie pri ukladaní (issue #161)', () => {
  it('nájde zhodu podľa ID areálu, aj keď sa medzitým zmenil názov aj adresa', () => {
    const ulozena = vytvorSession({ id: 'areal-1', nazov: 'Pôvodný názov', adresa: 'Pôvodná adresa' });
    const aktualny = { ...createEmptyAreal(), id: 'areal-1', nazov: 'Nový názov', adresa: 'Nová adresa' };

    expect(findMatchingSessions([ulozena], aktualny)).toEqual([ulozena]);
  });

  it('nájde zhodu podľa rovnakého názvu areálu, aj keď má iné ID', () => {
    const ulozena = vytvorSession({ id: 'areal-1', nazov: 'ZŠ Lipová' });
    const aktualny = { ...createEmptyAreal(), id: 'areal-2', nazov: '  zš lipová  ', adresa: '' };

    expect(findMatchingSessions([ulozena], aktualny)).toEqual([ulozena]);
  });

  it('nájde zhodu podľa rovnakej adresy areálu, aj keď má iné ID aj názov', () => {
    const ulozena = vytvorSession({ id: 'areal-1', nazov: 'Areál A', adresa: 'Hlavná 1, Bratislava' });
    const aktualny = { ...createEmptyAreal(), id: 'areal-2', nazov: 'Areál B', adresa: 'Hlavná 1, Bratislava' };

    expect(findMatchingSessions([ulozena], aktualny)).toEqual([ulozena]);
  });

  it('nevráti zhodu, ak sa ID, názov ani adresa nezhodujú', () => {
    const ulozena = vytvorSession({ id: 'areal-1', nazov: 'Areál A', adresa: 'Hlavná 1' });
    const aktualny = { ...createEmptyAreal(), id: 'areal-2', nazov: 'Areál B', adresa: 'Vedľajšia 2' };

    expect(findMatchingSessions([ulozena], aktualny)).toEqual([]);
  });

  it('nezhoduje relácie iba na základe prázdneho názvu/adresy', () => {
    const ulozena = vytvorSession({ id: 'areal-1', nazov: '', adresa: '' });
    const aktualny = { ...createEmptyAreal(), id: 'areal-2', nazov: '', adresa: '' };

    expect(findMatchingSessions([ulozena], aktualny)).toEqual([]);
  });

  it('pri viacerých zhodách navrhne najnovšie uloženú ako prvú', () => {
    const stara = vytvorSession({ id: 'areal-1', nazov: 'Areál A' }, '2024-01-01T00:00:00.000Z');
    const nova = vytvorSession({ id: 'areal-1', nazov: 'Areál A' }, '2024-06-01T00:00:00.000Z');
    const aktualny = { ...createEmptyAreal(), id: 'areal-1', nazov: 'Areál A' };

    expect(findMatchingSessions([stara, nova], aktualny)).toEqual([nova, stara]);
  });
});
