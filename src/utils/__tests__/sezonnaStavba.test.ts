import { describe, it, expect } from 'vitest';
import { Areal, Budova, createEmptyAreal, createEmptyBudova } from '../../types/areal';
import { dovodNehodnoteniaEnergetiky, saHodnotiEnergetika, saHodnotiOZE, vazeneCelkoveSkore } from '../../types/scoring';
import { calculateEnergia, calculateOZE, computeScore } from '../../hooks/useScoring';
import { computeRecommendations } from '../../hooks/useRecommendations';
import { ENERGIA_PARAMETERS } from '../../data/comparisonWeights';
import { computeAreaComparisonScore } from '../comparisonScoring';
import { budovyNaEnergetickeHodnotenie, jeSezonnaNevykurovana, sumVykurovanych } from '../sezonnaStavba';

/**
 * Budova s nezateplenou obálkou a starým plynovým kotlom — teda budova, ktorá
 * bez označenia „sezónna" vygeneruje celý rad energetických odporúčaní.
 */
function budovaSPotencialom(over: Partial<Budova> = {}): Budova {
  return {
    ...createEmptyBudova(),
    plochaPodorysu: 100,
    uzitkovaPlochaNUS: 90,
    vykurovanaPlocha: 90,
    plochaObvodovehoPlasta: 200,
    strechaTyp: 2,
    strechaZateplenie: 0,
    zateplenieFasady: 0,
    termoizolacneOkna: 0,
    rekuperacia: 0,
    vystavbaPred1980: 1,
    kurenePlynom: 1,
    kureniePlynRokInstalacie: 1990,
    ...over,
  };
}

/** Príspevok jedného energetického parametra porovnania do skóre areálu. */
function prispevokEnergia(areal: Areal, key: string): number {
  const parameter = ENERGIA_PARAMETERS.find((p) => p.key === key);
  if (!parameter) throw new Error(`Neznámy energetický parameter: ${key}`);
  const detail = computeAreaComparisonScore(areal).podrobnostiEnergia.find((p) => p.nazov === parameter.nazov);
  if (!detail) throw new Error(`Parameter ${key} chýba v podrobnostiach`);
  return detail.prispevok;
}

function idOdporucani(areal: Areal): string[] {
  return computeRecommendations(areal).map((r) => r.opatrenie.id);
}

describe('jeSezonnaNevykurovana', () => {
  it('nová budova sezónna nie je', () => {
    expect(jeSezonnaNevykurovana(createEmptyBudova())).toBe(false);
  });

  it('rozdelí budovy a spočíta len vykurované', () => {
    const bezna = budovaSPotencialom();
    const chata = budovaSPotencialom({ sezonnaNevykurovana: 1 });

    expect(budovyNaEnergetickeHodnotenie([bezna, chata])).toEqual([bezna]);
    expect(sumVykurovanych([bezna, chata], (b) => b.plochaPodorysu)).toBe(100);
  });
});

describe('Odporúčania — sezónna nevykurovaná stavba (záhradná chata)', () => {
  it('nenavrhne zateplenie, okná, rekuperáciu ani obnovu vykurovania', () => {
    const areal = createEmptyAreal();
    areal.budovy = [budovaSPotencialom({ sezonnaNevykurovana: 1 })];

    const idcka = idOdporucani(areal);
    for (const id of ['zateplenie-fasady', 'zateplenie-strechy', 'vymena-okien', 'rekuperacia',
      'vymena-vykurovania', 'tepelne-cerpadlo-vzduch', 'kotol-na-biomasu', 'smart-termostaty']) {
      expect(idcka, `odporúčanie ${id} sa pre sezónnu stavbu nemá navrhovať`).not.toContain(id);
    }
  });

  it('tú istú budovu bez označenia hodnotí ako doteraz', () => {
    const areal = createEmptyAreal();
    areal.budovy = [budovaSPotencialom()];

    const idcka = idOdporucani(areal);
    expect(idcka).toContain('zateplenie-fasady');
    expect(idcka).toContain('zateplenie-strechy');
    expect(idcka).toContain('vymena-okien');
    expect(idcka).toContain('vymena-vykurovania');
  });

  it('nezakryje potenciál ostatných budov v tom istom areáli', () => {
    const areal = createEmptyAreal();
    areal.budovy = [budovaSPotencialom({ sezonnaNevykurovana: 1 }), budovaSPotencialom()];

    expect(idOdporucani(areal)).toContain('zateplenie-fasady');
  });

  it('naďalej navrhne výmenu osvetlenia — so sezónnosťou nesúvisí', () => {
    const areal = createEmptyAreal();
    areal.budovy = [budovaSPotencialom({
      sezonnaNevykurovana: 1,
      osvetleniePocetSvietidiel: 10,
      osvetleniePocetSvietidielLED: 0,
    })];

    expect(idOdporucani(areal)).toContain('led-osvetlenie');
  });
});

describe('Skóre areálu — sezónna nevykurovaná stavba sa nehodnotí', () => {
  it('energetické skóre počíta len z vykurovaných budov', () => {
    const lenBezna = createEmptyAreal();
    lenBezna.budovy = [budovaSPotencialom()];

    const sChatou = createEmptyAreal();
    sChatou.budovy = [budovaSPotencialom(), budovaSPotencialom({ sezonnaNevykurovana: 1 })];

    expect(calculateEnergia(sChatou).celkove).toBe(calculateEnergia(lenBezna).celkove);
    expect(calculateEnergia(sChatou).hodnotenychBudov).toBe(1);
    expect(calculateEnergia(sChatou).vynechanychSezonnych).toBe(1);
  });

  it('OZE sa hodnotí aj pri areáli so samou sezónnou stavbou — strecha pre FV so sezónnosťou nesúvisí', () => {
    const areal = createEmptyAreal();
    areal.budovy = [budovaSPotencialom({ sezonnaNevykurovana: 1 })];

    expect(saHodnotiOZE(calculateOZE(areal))).toBe(true);
  });

  it('potenciál tepelného čerpadla neberie zo sezónnej stavby', () => {
    const areal = createEmptyAreal();
    areal.budovy = [budovaSPotencialom({ sezonnaNevykurovana: 1 })];

    expect(calculateOZE(areal).potencialTepelnehoCerpadla).toBe(0);
  });

  it('areál so samými sezónnymi stavbami sa energeticky nehodnotí', () => {
    const areal = createEmptyAreal();
    areal.budovy = [budovaSPotencialom({ sezonnaNevykurovana: 1 })];

    const energia = calculateEnergia(areal);
    expect(energia.hodnotenychBudov).toBe(0);
    expect(saHodnotiEnergetika(energia)).toBe(false);
  });

  it('ani areál bez budov sa energeticky nehodnotí (issue #204)', () => {
    const areal = createEmptyAreal();
    areal.budovy = [];

    const energia = calculateEnergia(areal);
    expect(saHodnotiEnergetika(energia)).toBe(false);
    expect(dovodNehodnoteniaEnergetiky(energia)).toBe('bezBudov');
  });

  it('rozlíši dôvod nehodnotenia — samé sezónne stavby vs. žiadna budova', () => {
    const chata = createEmptyAreal();
    chata.budovy = [budovaSPotencialom({ sezonnaNevykurovana: 1 })];

    expect(dovodNehodnoteniaEnergetiky(calculateEnergia(chata))).toBe('lenSezonne');
    expect(dovodNehodnoteniaEnergetiky(calculateEnergia(arealSBudovou()))).toBeNull();
  });

  it('areál bez budov má celkové skóre rovné MZI — OZE ani energetika sa nehodnotia', () => {
    const areal = arealLenPozemky();

    const score = computeScore(areal);
    expect(saHodnotiOZE(score.oze)).toBe(false);
    expect(saHodnotiEnergetika(score.energia)).toBe(false);
    expect(score.celkove).toBe(score.mzi.celkove);
    expect(vazeneCelkoveSkore(score, { mzi: 1, oze: 1, energia: 1 })).toBe(score.mzi.celkove);
  });

  it('nehodnotená oblasť sa nezapočíta ani pri nerovnakých váhach', () => {
    const score = computeScore(arealLenPozemky());

    // Váha OZE aj energetiky je nulová, takže vyjde čisté MZI bez ohľadu na čísla.
    expect(vazeneCelkoveSkore(score, { mzi: 2, oze: 5, energia: 7 })).toBe(score.mzi.celkove);
  });

  it('nehodnotená energetika nevstúpi do váženého celkového skóre', () => {
    const score = computeScore(arealSoSamouChatou());
    const vahy = { mzi: 1, oze: 1, energia: 1 };

    // Bez energetiky je vážené skóre priemerom MZI a OZE, nie tretinou s nulou.
    expect(vazeneCelkoveSkore(score, vahy)).toBe(
      Math.round((score.mzi.celkove + score.oze.celkove) / 2),
    );
  });
});

function arealLenPozemky(): Areal {
  const areal = createEmptyAreal();
  areal.budovy = [];
  areal.pozemky[0].celkovaVymera = 500;
  areal.pozemky[0].priepustnaPlochaCelkom = 400;
  areal.pozemky[0].priepustnaPlochaByliny = 100;
  return areal;
}

function arealSBudovou(): Areal {
  const areal = createEmptyAreal();
  areal.budovy = [budovaSPotencialom()];
  return areal;
}

function arealSoSamouChatou(): Areal {
  const areal = createEmptyAreal();
  areal.budovy = [budovaSPotencialom({ sezonnaNevykurovana: 1 })];
  areal.pozemky[0].celkovaVymera = 500;
  areal.pozemky[0].priepustnaPlochaCelkom = 400;
  areal.pozemky[0].priepustnaPlochaByliny = 100;
  return areal;
}

describe('Porovnanie areálov — sezónna stavba nezvyšuje energetický potenciál', () => {
  const vylucene = [
    'energia_nezateplena_obalka',
    'energia_plyn_potencial_tc',
    'energia_plyn_potencial_biomasa',
    'energia_vystavba_pred_1980',
  ];

  for (const key of vylucene) {
    it(`parameter ${key} sezónnu stavbu nezapočíta`, () => {
      const bezna = createEmptyAreal();
      bezna.budovy = [budovaSPotencialom()];
      const chata = createEmptyAreal();
      chata.budovy = [budovaSPotencialom({ sezonnaNevykurovana: 1 })];

      expect(prispevokEnergia(bezna, key)).toBeGreaterThan(0);
      expect(prispevokEnergia(chata, key)).toBe(0);
    });
  }

  it('parameter elektrického vykurovania sezónnu stavbu nezapočíta', () => {
    const over = { kurenePlynom: 0 as const, kurenieElektrinou: 1 as const };
    const bezna = createEmptyAreal();
    bezna.budovy = [budovaSPotencialom(over)];
    const chata = createEmptyAreal();
    chata.budovy = [budovaSPotencialom({ ...over, sezonnaNevykurovana: 1 })];

    expect(prispevokEnergia(bezna, 'energia_elektrina_potencial_tc')).toBeGreaterThan(0);
    expect(prispevokEnergia(chata, 'energia_elektrina_potencial_tc')).toBe(0);
  });

  it('odpočet existujúceho zateplenia sa na sezónnu stavbu tiež neuplatní', () => {
    const zateplene = { strechaZateplenie: 1 as const, zateplenieFasady: 1 as const };
    const bezna = createEmptyAreal();
    bezna.budovy = [budovaSPotencialom(zateplene)];
    const chata = createEmptyAreal();
    chata.budovy = [budovaSPotencialom({ ...zateplene, sezonnaNevykurovana: 1 })];

    expect(prispevokEnergia(bezna, 'energia_odratat_zateplenie')).toBeLessThan(0);
    expect(prispevokEnergia(chata, 'energia_odratat_zateplenie')).toBeCloseTo(0);
  });

  it('plocha strechy pre FV sa počíta aj zo sezónnej stavby', () => {
    const chata = createEmptyAreal();
    chata.budovy = [budovaSPotencialom({
      sezonnaNevykurovana: 1,
      strechaTyp: 1,
      strechaOrientovanaPlochaNaJuh: 80,
    })];

    expect(prispevokEnergia(chata, 'energia_strecha_fv')).toBeGreaterThan(0);
  });
});
