import { describe, it, expect } from 'vitest';
import { migrateAreal, applyBudovaUpdate } from '../../hooks/useArealState';
import { createEmptyAreal, createEmptyBudova } from '../../types/areal';

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

  it('staršej budove bez vykurovanej plochy ju predvyplní z úžitkovej (issue #181) a nové polia doplní nulou', () => {
    const empty = createEmptyAreal();
    const budova = JSON.parse(JSON.stringify(empty.budovy[0])) as Record<string, unknown>;
    budova.uzitkovaPlochaNUS = 850;
    delete budova.vykurovanaPlocha;
    delete budova.plochaObvodovehoPlasta;
    delete budova.spotrebaRok;
    delete budova.kureniePlynNakladyRok;
    delete budova.spotrebaElektrinyNakladyRok;
    delete budova.certifikatPotrebaVykurovanie;
    delete budova.certifikatPotrebaTeplaVoda;
    delete budova.certifikatPrimarnaEnergia;
    delete budova.hydraulickeVyregulovanieUK;
    delete budova.hydraulickeVyregulovanieTV;
    delete budova.izolaciaRozvodov;
    const pozemok = JSON.parse(JSON.stringify(empty.pozemky[0])) as Record<string, unknown>;
    delete pozemok.plochaVhodnaPreFV;

    const restored = migrateAreal({ ...empty, budovy: [budova], pozemky: [pozemok] });
    expect(restored.budovy[0].vykurovanaPlocha).toBe(850);
    expect(restored.budovy[0].plochaObvodovehoPlasta).toBe(0);
    expect(restored.budovy[0].spotrebaRok).toBe(0);
    expect(restored.budovy[0].kureniePlynNakladyRok).toBe(0);
    expect(restored.budovy[0].spotrebaElektrinyNakladyRok).toBe(0);
    expect(restored.budovy[0].certifikatPotrebaVykurovanie).toBe(0);
    expect(restored.budovy[0].certifikatPotrebaTeplaVoda).toBe(0);
    expect(restored.budovy[0].certifikatPrimarnaEnergia).toBe(0);
    // issue #177: pri chýbajúcej odpovedi je „neviem" (2), nie „nie"
    expect(restored.budovy[0].hydraulickeVyregulovanieUK).toBe(2);
    expect(restored.budovy[0].hydraulickeVyregulovanieTV).toBe(2);
    expect(restored.budovy[0].izolaciaRozvodov).toBe(2);
    expect(restored.pozemky[0].plochaVhodnaPreFV).toBe(0);
  });

  it('ručne zadanú vykurovanú plochu (aj 0) migrácia neprepíše', () => {
    const empty = createEmptyAreal();
    const budova = { ...empty.budovy[0], uzitkovaPlochaNUS: 850, vykurovanaPlocha: 0 };
    const restored = migrateAreal({ ...empty, budovy: [budova] });
    expect(restored.budovy[0].vykurovanaPlocha).toBe(0);
  });
});

describe('applyBudovaUpdate – predvyplnenie vykurovanej plochy (issue #181)', () => {
  it('vykurovaná plocha sleduje úžitkovú, kým ju používateľ neupraví', () => {
    let b = createEmptyBudova();
    b = applyBudovaUpdate(b, { uzitkovaPlochaNUS: 1000 });
    expect(b.vykurovanaPlocha).toBe(1000);

    b = applyBudovaUpdate(b, { uzitkovaPlochaNUS: 1200 });
    expect(b.vykurovanaPlocha).toBe(1200);
  });

  it('po ručnej úprave vykurovanej plochy sa už z úžitkovej neprepisuje', () => {
    let b = createEmptyBudova();
    b = applyBudovaUpdate(b, { uzitkovaPlochaNUS: 1000 });
    b = applyBudovaUpdate(b, { vykurovanaPlocha: 700 });
    b = applyBudovaUpdate(b, { uzitkovaPlochaNUS: 1500 });
    expect(b.vykurovanaPlocha).toBe(700);
  });

  it('prepočíta celkové ročné náklady na kúrenie (issue #173)', () => {
    const b = applyBudovaUpdate(createEmptyBudova(), {
      kureniePlynNakladyRok: 1500,
      kurenieCZTSpotreba: 10_000,
      kurenieCZTCenaKWh: 0.1,
    });
    expect(b.celkoveNakladyKurenie).toBeCloseTo(2500);
  });
});
