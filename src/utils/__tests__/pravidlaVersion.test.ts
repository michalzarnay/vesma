import { describe, it, expect } from 'vitest';
import { AKTUALNA_VERZIA_PRAVIDIEL, createEmptyAreal } from '../../types/areal';
import { migrateAreal } from '../../hooks/useArealState';
import {
  ZMENY_PRAVIDIEL,
  ZmenaPravidiel,
  jeStarsiaVerziaPravidiel,
  upozornenieNaZmenuPravidiel,
  verziaPravidielArealu,
  vyberZmeny,
  zmenyPravidielOd,
} from '../pravidlaVersion';

/** Relácia uložená pred zavedením sledovania verzií pravidiel — bez `pravidlaVersion`. */
function relaciaBezVerziePravidiel() {
  const areal = createEmptyAreal();
  areal.nazov = 'ZŠ Lipová';
  const json = JSON.parse(JSON.stringify(areal)) as Record<string, unknown>;
  delete json.pravidlaVersion;
  return json;
}

describe('verziovanie pravidiel hodnotenia', () => {
  it('nový areál je vyhodnotený podľa aktuálnych pravidiel a neupozorňuje na nič', () => {
    const areal = createEmptyAreal();

    expect(verziaPravidielArealu(areal)).toBe(AKTUALNA_VERZIA_PRAVIDIEL);
    expect(jeStarsiaVerziaPravidiel(areal)).toBe(false);
    expect(upozornenieNaZmenuPravidiel(areal)).toBeNull();
  });

  it('relácia bez čísla verzie pravidiel sa načíta ako verzia 0', () => {
    const nacitany = migrateAreal(relaciaBezVerziePravidiel());

    expect(verziaPravidielArealu(nacitany)).toBe(0);
    expect(jeStarsiaVerziaPravidiel(nacitany)).toBe(true);
  });

  it('pri relácii spred sledovania upozorní, ale zoznam zmien označí za neúplný', () => {
    const upozornenie = upozornenieNaZmenuPravidiel(migrateAreal(relaciaBezVerziePravidiel()));

    expect(upozornenie).not.toBeNull();
    expect(upozornenie?.verziaRelacie).toBe(0);
    expect(upozornenie?.aktualnaVerzia).toBe(AKTUALNA_VERZIA_PRAVIDIEL);
    // Ktoré pravidlá vtedy platili, nevieme — zostáva len všeobecná veta.
    expect(upozornenie?.zoznamUplny).toBe(false);
  });

  it('relácia s aktuálnou verziou pravidiel neupozorňuje', () => {
    const areal = { ...createEmptyAreal(), pravidlaVersion: AKTUALNA_VERZIA_PRAVIDIEL };

    expect(upozornenieNaZmenuPravidiel(areal)).toBeNull();
  });

  it('relácia z budúcej verzie (novšia zostava) neupozorňuje', () => {
    const areal = { ...createEmptyAreal(), pravidlaVersion: AKTUALNA_VERZIA_PRAVIDIEL + 1 };

    expect(upozornenieNaZmenuPravidiel(areal)).toBeNull();
  });

  it('zoznam zmien je pri zavedení sledovania prázdny — verzia 1 je východiskový stav', () => {
    expect(ZMENY_PRAVIDIEL[1]).toBeUndefined();
    expect(zmenyPravidielOd(AKTUALNA_VERZIA_PRAVIDIEL)).toEqual([]);
    expect(zmenyPravidielOd(0)).toEqual([]);
  });
});

/**
 * Výber zmien sa v appke naplno prejaví až po prvom zvýšení verzie pravidiel,
 * preto sa testuje na vlastnom zozname — inak by pravidlo ostalo nepokryté.
 */
describe('výber zmien pre konkrétnu reláciu', () => {
  const zmena = (popis: string): ZmenaPravidiel => ({ oblast: 'Skóre areálu', popis });
  const zmeny: Record<number, ZmenaPravidiel[]> = {
    2: [zmena('zmena vo verzii 2')],
    3: [zmena('zmena vo verzii 3a'), zmena('zmena vo verzii 3b')],
  };

  it('vymenuje len zmeny novšie než verzia relácie', () => {
    expect(vyberZmeny(zmeny, 2, 3).map((z) => z.popis)).toEqual([
      'zmena vo verzii 3a',
      'zmena vo verzii 3b',
    ]);
  });

  it('pri relácii spred sledovania vymenuje všetko, čo poznáme', () => {
    expect(vyberZmeny(zmeny, 0, 3)).toHaveLength(3);
  });

  it('zmeny novšie než aktuálna verzia appky nevypisuje — appka ich ešte nepočíta', () => {
    expect(vyberZmeny(zmeny, 0, 2).map((z) => z.popis)).toEqual(['zmena vo verzii 2']);
  });

  it('zoradí zmeny od najstaršej verzie', () => {
    const naopak: Record<number, ZmenaPravidiel[]> = { 3: zmeny[3], 2: zmeny[2] };
    expect(vyberZmeny(naopak, 0, 3)[0].popis).toBe('zmena vo verzii 2');
  });
});
