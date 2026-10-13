import { describe, it, expect } from 'vitest';
import {
  findMatchingSessions, predvolenyNazovRelacie, rozparsujImportRelacie, Session, vytvorImportovanuRelaciu,
} from '../useSessionManager';
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

describe('import relácie z JSON – podnet 149', () => {
  const sessionJson = (over: Partial<Session['areal']>, nazov: string) =>
    JSON.stringify({ id: 's-1', nazov, areal: { ...createEmptyAreal(), ...over }, datumUlozenia: '2024-01-01T00:00:00.000Z' });

  it('z celej relácie zachová jej názov', () => {
    const { areal, nazov } = rozparsujImportRelacie(sessionJson({ nazov: 'ZŠ Lipová' }, 'Terénny prieskum'));
    expect(nazov).toBe('Terénny prieskum');
    expect(areal.nazov).toBe('ZŠ Lipová');
  });

  it('z holého areálu odvodí názov relácie z názvu areálu', () => {
    const json = JSON.stringify({ ...createEmptyAreal(), nazov: 'ZŠ Lipová' });
    expect(rozparsujImportRelacie(json).nazov).toBe('ZŠ Lipová');
  });

  it('pre súbor bez akéhokoľvek názvu použije náhradný názov', () => {
    expect(rozparsujImportRelacie(JSON.stringify(createEmptyAreal())).nazov).toBe('Importovaná relácia');
  });

  it('neplatný JSON vyhodí chybu', () => {
    expect(() => rozparsujImportRelacie('nie je json')).toThrow();
  });

  it('importovaná relácia sa zhoduje s areálom, ktorý sa po importe otvorí (zoznam ju ukáže)', () => {
    const { areal, nazov } = rozparsujImportRelacie(sessionJson({ id: '', nazov: 'ZŠ Lipová' }, 'Terénny prieskum'));
    const relacia = vytvorImportovanuRelaciu(areal, nazov);

    expect(relacia.areal.id).toBeTruthy();
    // Otvorí sa areál z relácie, nie pôvodný bez ID — inak by ho zoznam nespoznal.
    expect(findMatchingSessions([relacia], relacia.areal)).toEqual([relacia]);
  });

  it('nezmení verziu schémy ani pravidiel, s ktorou areál vznikol', () => {
    const { areal } = rozparsujImportRelacie(sessionJson({ pravidlaVersion: 1 }, 'X'));
    const relacia = vytvorImportovanuRelaciu(areal, 'X');
    expect(relacia.areal.pravidlaVersion).toBe(areal.pravidlaVersion);
    expect(relacia.areal.schemaVersion).toBe(areal.schemaVersion);
  });
});

describe('predvolenyNazovRelacie – názov v dialógu Uložiť nie je starý', () => {
  it('bez zhody ponúkne názov areálu', () => {
    const areal = { ...createEmptyAreal(), nazov: 'Nový areál' };
    expect(predvolenyNazovRelacie([], 'nova', areal)).toBe('Nový areál');
  });

  it('pri prepise zhodnej relácie ponúkne jej názov', () => {
    const ulozena = vytvorSession({ id: 'a-1', nazov: 'Areál A' });
    ulozena.nazov = 'Relácia A';
    const areal = { ...createEmptyAreal(), id: 'a-1', nazov: 'Areál A' };
    expect(predvolenyNazovRelacie([ulozena], ulozena.id, areal)).toBe('Relácia A');
  });

  it('keď mapér zvolí „uložiť ako novú“, ponúkne názov areálu, nie zhodnej relácie', () => {
    const ulozena = vytvorSession({ id: 'a-1', nazov: 'Areál A' });
    ulozena.nazov = 'Relácia A';
    const areal = { ...createEmptyAreal(), id: 'a-1', nazov: 'Areál A' };
    expect(predvolenyNazovRelacie([ulozena], 'nova', areal)).toBe('Areál A');
  });
});
