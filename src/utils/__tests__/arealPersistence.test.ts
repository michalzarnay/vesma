import { describe, it, expect } from 'vitest';
import { migrateAreal } from '../../hooks/useArealState';
import { createEmptyAreal } from '../../types/areal';

describe('migrateAreal – round-trip localStorage', () => {
  it('zachová všetky základné polia po serializácii a deserializácii', () => {
    const original = createEmptyAreal();
    original.nazov = 'ZŠ Lipová';
    original.adresa = 'Lipová 15';
    original.obec = 'Ružomberok';
    original.kraj = 'Žilinský kraj';
    original.okres = 'Ružomberok';

    const json = JSON.parse(JSON.stringify(original));
    const restored = migrateAreal(json);

    expect(restored.nazov).toBe('ZŠ Lipová');
    expect(restored.adresa).toBe('Lipová 15');
    expect(restored.obec).toBe('Ružomberok');
    expect(restored.kraj).toBe('Žilinský kraj');
    expect(restored.okres).toBe('Ružomberok');
  });

  it('zachová počet pozemkov a budov', () => {
    const original = createEmptyAreal();
    const json = JSON.parse(JSON.stringify(original));
    const restored = migrateAreal(json);

    expect(restored.pozemky).toHaveLength(original.pozemky.length);
    expect(restored.budovy).toHaveLength(original.budovy.length);
  });

  it('zachová váhy skóre', () => {
    const original = createEmptyAreal();
    original.vahy = { mzi: 2, oze: 1, energia: 3 };
    const restored = migrateAreal(JSON.parse(JSON.stringify(original)));

    expect(restored.vahy).toEqual({ mzi: 2, oze: 1, energia: 3 });
  });
});

describe('migrateAreal – migrácia starého formátu', () => {
  it('skonvertuje legacy odvodVodyKanalizacia na odvodVodyJednotnaKanalizacia', () => {
    const old = {
      ...createEmptyAreal(),
      pozemky: [{
        ...createEmptyAreal().pozemky[0],
        odvodVodyKanalizacia: 75,
        odvodVodyJednotnaKanalizacia: undefined,
      }],
    };

    const restored = migrateAreal(JSON.parse(JSON.stringify(old)));
    expect(restored.pozemky[0].odvodVodyJednotnaKanalizacia).toBe(75);
  });

  it('skonvertuje legacy priepustnaPlochaHolaPoda na priepustnaPlochaObrabanaPoda (issue #196)', () => {
    const old = {
      ...createEmptyAreal(),
      pozemky: [{
        ...createEmptyAreal().pozemky[0],
        priepustnaPlochaHolaPoda: 40,
        priepustnaPlochaObrabanaPoda: undefined,
      }],
    };

    const restored = migrateAreal(JSON.parse(JSON.stringify(old)));
    expect(restored.pozemky[0].priepustnaPlochaObrabanaPoda).toBe(40);
  });

  it('doplní chýbajúce nové polia hodnotou 0', () => {
    const minimal = {
      id: 'test-id',
      nazov: 'Test',
      pozemky: [],
      budovy: [],
    };

    const restored = migrateAreal(minimal);
    expect(restored.aktualnaObsadenost).toBe(0);
    expect(restored.pocetZamestnancov).toBe(0);
    expect(restored.zaverBG).toBe('');
  });
});
