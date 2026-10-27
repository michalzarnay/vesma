import { describe, it, expect } from 'vitest';
import { checklistPripravy } from '../uvodChecklist';
import { NAZOV_KROKU_1, WIZARD_STEPS } from '../../types/wizard';
import { poznamkaMimoRozsahu } from '../rozsahMapovania';
import { glossary } from '../../data/glossary';

const ids = (r: Parameters<typeof checklistPripravy>[0]) => checklistPripravy(r).map((p) => p.id);

describe('checklistPripravy', () => {
  it('pri rozsahu „oboje" obsahuje energie aj vodu', () => {
    expect(ids('oboje')).toEqual(['identifikacia', 'parcely', 'budovy', 'energie', 'voda', 'fotky']);
  });
  it('pri rozsahu „voda" nežiada faktúry za energie', () => {
    expect(ids('voda')).not.toContain('energie');
    expect(ids('voda')).toContain('voda');
  });
  it('pri rozsahu „energia" nežiada údaje o povrchoch a vode', () => {
    expect(ids('energia')).toContain('energie');
    expect(ids('energia')).not.toContain('voda');
  });
});

describe('sprievodca mapovaním povrchov', () => {
  const povrchy = checklistPripravy('voda').find((p) => p.id === 'voda')!;
  const text = povrchy.podrobnosti!.join(' ');

  it('pomenúva všetky tri skupiny povrchov rovnako ako formulár', () => {
    for (const k of ['priepustnaPlochaDef', 'polopriepustnaPlochaDef', 'spevnenaPlochaDef']) {
      expect(text).toContain(glossary[k].term);
    }
  });
  it('zaraďuje mulčované záhony a štrkový chodník v súlade s nápovedou kroku Pozemky', () => {
    expect(glossary.obrabanaPodaDef.whereToFind).toMatch(/Mulčované záhony .* ako byliny/);
    expect(text).toMatch(/Prírodný \(vsakovací\) povrch:[^.]*mulčované záhony/);
    expect(glossary.polopriepustnaPlochaDef.example).toContain('štrkový chodník');
    expect(text).toMatch(/Spevnený \(polopriepustný\) povrch: štrkový chodník/);
  });
  it('podrobnosti ku katastru sú aj bez rozsahu vody', () => {
    expect(checklistPripravy('energia').find((p) => p.id === 'parcely')?.podrobnosti?.length).toBeGreaterThan(0);
  });
});

describe('názov prvého kroku', () => {
  it('hlavička a texty používajú jednu konštantu', () => {
    expect(WIZARD_STEPS[0].nazov).toBe(NAZOV_KROKU_1);
    expect(poznamkaMimoRozsahu('voda')).toContain(NAZOV_KROKU_1);
    expect(poznamkaMimoRozsahu('energia')).toContain(NAZOV_KROKU_1);
  });
});
