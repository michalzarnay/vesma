import { describe, it, expect } from 'vitest';
import { createEmptyAreal, createEmptyPozemok } from '../../types/areal';
import { computeRecommendations } from '../useRecommendations';

/** Areál so spevneným povrchom nad prahom, ktorý spustí odporúčania na hospodárenie s vodou. */
function arealSoSpevnenouPlochou() {
  const areal = createEmptyAreal();
  areal.budovy = [];
  const p = createEmptyPozemok();
  p.celkovaVymera = 1000;
  p.spevnenaPlochaCelkom = 500;
  areal.pozemky = [p];
  return areal;
}

function idOdporucani(areal: ReturnType<typeof createEmptyAreal>): string[] {
  return computeRecommendations(areal).map((r) => r.opatrenie.id);
}

describe('computeRecommendations – nádrž nie je možná (issue #215)', () => {
  it('bez príznaku odporučí zachytenie vody do nádob', () => {
    expect(idOdporucani(arealSoSpevnenouPlochou())).toContain('zachytenie-do-nadob');
  });

  it('s príznakom nádrž neodporučí — nemá zmysel navrhovať nerealizovateľné opatrenie', () => {
    const areal = arealSoSpevnenouPlochou();
    areal.nadrzNieJeMozna = 1;
    areal.nadrzNemoznaDovod = 'pamiatková zóna, nie je kde nádrž umiestniť';

    expect(idOdporucani(areal)).not.toContain('zachytenie-do-nadob');
  });

  it('ostatné opatrenia na hospodárenie s vodou zostávajú', () => {
    const areal = arealSoSpevnenouPlochou();
    areal.nadrzNieJeMozna = 1;

    const id = idOdporucani(areal);
    expect(id).toContain('dazdova-zahrada');
    expect(id).toContain('vsakovaci-rigol');
    expect(id).toContain('priepustna-dlazba');
  });
});
