import { describe, it, expect } from 'vitest';
import { AKTUALNA_VERZIA_SCHEMY, createEmptyAreal, createEmptyBudova } from '../../types/areal';
import { migrateAreal } from '../../hooks/useArealState';
import {
  chybajuceNovePolia,
  jeNevyplneneNovePole,
  jeStarsiaVerzia,
  verziaArealu,
} from '../schemaVersion';

/** Relácia uložená pred zavedením verziovania — bez `schemaVersion` a bez nových polí. */
function starsiaRelacia() {
  const areal = createEmptyAreal();
  areal.nazov = 'ZŠ Lipová';
  areal.budovy[0].nazov = 'Hlavná budova';
  const json = JSON.parse(JSON.stringify(areal)) as Record<string, unknown>;
  delete json.schemaVersion;
  const budovy = json.budovy as Record<string, unknown>[];
  budovy.forEach((b) => {
    delete b.hydraulickeVyregulovanieUK;
    delete b.hydraulickeVyregulovanieTV;
    delete b.izolaciaRozvodov;
  });
  return json;
}

describe('verziovanie uložených relácií (issue #177)', () => {
  it('nový areál má aktuálnu verziu schémy a nič nepripomína', () => {
    const areal = createEmptyAreal();
    expect(verziaArealu(areal)).toBe(AKTUALNA_VERZIA_SCHEMY);
    expect(jeStarsiaVerzia(areal)).toBe(false);
    expect(chybajuceNovePolia(areal)).toEqual([]);
  });

  it('relácia bez čísla verzie sa načíta ako verzia 1', () => {
    const nacitany = migrateAreal(starsiaRelacia());
    expect(verziaArealu(nacitany)).toBe(1);
    expect(jeStarsiaVerzia(nacitany)).toBe(true);
  });

  it('chýbajúce odpovede sa po načítaní nastavia na „neviem" (2), nie na „nie"', () => {
    const nacitany = migrateAreal(starsiaRelacia());
    expect(nacitany.budovy[0].hydraulickeVyregulovanieUK).toBe(2);
    expect(nacitany.budovy[0].hydraulickeVyregulovanieTV).toBe(2);
    expect(nacitany.budovy[0].izolaciaRozvodov).toBe(2);
  });

  it('pripomienka vymenuje budovu a všetky tri nové otázky', () => {
    const nacitany = migrateAreal(starsiaRelacia());
    const chybajuce = chybajuceNovePolia(nacitany);

    expect(chybajuce).toHaveLength(1);
    expect(chybajuce[0].budovaNazov).toBe('Hlavná budova');
    expect(chybajuce[0].polia).toEqual([
      'Hydraulicky vyregulovaný vykurovací systém',
      'Hydraulicky vyregulované rozvody teplej vody',
      'Zaizolované rozvody tepla a teplej vody',
    ]);
  });

  it('po zodpovedaní otázky pole z pripomienky zmizne', () => {
    const nacitany = migrateAreal(starsiaRelacia());
    nacitany.budovy[0].hydraulickeVyregulovanieUK = 1;

    expect(chybajuceNovePolia(nacitany)[0].polia).toEqual([
      'Hydraulicky vyregulované rozvody teplej vody',
      'Zaizolované rozvody tepla a teplej vody',
    ]);
  });

  it('po zodpovedaní všetkých otázok sa pripomienka nezobrazí', () => {
    const nacitany = migrateAreal(starsiaRelacia());
    nacitany.budovy[0].hydraulickeVyregulovanieUK = 1;
    nacitany.budovy[0].hydraulickeVyregulovanieTV = 1;
    nacitany.budovy[0].izolaciaRozvodov = 0;

    expect(chybajuceNovePolia(nacitany)).toEqual([]);
  });

  it('budova bez názvu sa v pripomienke pomenuje poradím', () => {
    const json = starsiaRelacia() as Record<string, unknown>;
    (json.budovy as Record<string, unknown>[])[0].nazov = '';
    const nacitany = migrateAreal(json);

    expect(chybajuceNovePolia(nacitany)[0].budovaNazov).toBe('Budova 1');
  });
});

describe('zvýraznenie nových polí vo formulári (issue #177)', () => {
  it('nevyplnené nové pole staršej relácie sa zvýrazní', () => {
    const b = createEmptyBudova(); // predvolene „neviem"
    expect(jeNevyplneneNovePole(1, b, 'hydraulickeVyregulovanieUK')).toBe(true);
    expect(jeNevyplneneNovePole(1, b, 'hydraulickeVyregulovanieTV')).toBe(true);
    expect(jeNevyplneneNovePole(1, b, 'izolaciaRozvodov')).toBe(true);
  });

  it('v aktuálnej verzii sa nezvýrazňuje nič — „neviem" je legitímny východiskový stav', () => {
    const b = createEmptyBudova();
    expect(jeNevyplneneNovePole(AKTUALNA_VERZIA_SCHEMY, b, 'hydraulickeVyregulovanieUK')).toBe(false);
  });

  it('zodpovedané pole sa nezvýrazňuje ani v staršej relácii', () => {
    const b = createEmptyBudova();
    b.izolaciaRozvodov = 0; // „nie" je platná odpoveď
    expect(jeNevyplneneNovePole(1, b, 'izolaciaRozvodov')).toBe(false);
  });

  it('staré pole (nie je nové v žiadnej verzii) sa nezvýrazňuje', () => {
    const b = createEmptyBudova();
    expect(jeNevyplneneNovePole(1, b, 'termohlavice')).toBe(false);
  });
});
