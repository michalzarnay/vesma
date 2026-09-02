import { describe, it, expect } from 'vitest';
import { calculateMZI } from '../useScoring';
import { createEmptyAreal, createEmptyPozemok, createEmptyBudova } from '../../types/areal';

/** Areál len s pozemkami — budovy by inak pridali komponent B-GOV3 s nulovou strechou. */
function arealSPozemkom(uprav: (p: ReturnType<typeof createEmptyPozemok>) => void) {
  const areal = createEmptyAreal();
  const p = createEmptyPozemok();
  uprav(p);
  areal.pozemky = [p];
  areal.budovy = [];
  return areal;
}

describe('calculateMZI – priepustná plocha (metodika KLIMASKEN B-GOV2)', () => {
  it('existujúce nenulové hodnoty priepustnaPlochaHolaPoda naďalej prispievajú ku skóre (issue #128 – pole skryté z formulára)', () => {
    // Holá pôda je podľa B-GOV2 kód C (nespevnená plocha bez rastlinného krytu,
    // koeficient 0,4). Oproti prázdnemu pozemku teda skóre zvyšuje.
    const bezHolejPody = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.spevnenaPlochaCelkom = 100;
    });
    const sHolouPodou = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.spevnenaPlochaCelkom = 100;
      p.priepustnaPlochaHolaPoda = 40;
    });

    expect(calculateMZI(sHolouPodou).okolie!.body).toBeGreaterThan(
      calculateMZI(bezHolejPody).okolie!.body,
    );
  });

  it('trávnik má vyšší koeficient MZI než holá pôda (kód H = 0,7 vs. kód C = 0,4)', () => {
    const holaPoda = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaHolaPoda = 100;
    });
    const byliny = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
    });

    expect(calculateMZI(holaPoda).koefOkolie).toBeCloseTo(0.4, 5);
    expect(calculateMZI(byliny).koefOkolie).toBeCloseTo(0.7, 5);
  });

  it('mladé a nezdravé stromy sa hodnotia nižším koeficientom než zapojený porast (K = 0,4 vs. J = 1,0)', () => {
    const vzrastle = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaStromy = 100;
    });
    const mlade = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaStromy = 100;
      p.stromyPodielMladych = 100;
    });

    expect(calculateMZI(vzrastle).koefOkolie).toBeCloseTo(1, 5);
    expect(calculateMZI(mlade).koefOkolie).toBeCloseTo(0.4, 5);
  });

  it('spevnená plocha má koeficient 0 a znižuje vážený priemer', () => {
    // 100 m² trávnika (0,7) + 100 m² nepriepustnej plochy (0) → 0,35
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
      p.spevnenaPlochaCelkom = 100;
    });

    expect(calculateMZI(areal).koefOkolie).toBeCloseTo(0.35, 5);
  });

  it('objekty hospodárenia s dažďovou vodou sa započítajú ako samostatné plochy', () => {
    const bezVsaku = arealSPozemkom((p) => {
      p.spevnenaPlochaCelkom = 100;
    });
    const sVsakom = arealSPozemkom((p) => {
      p.spevnenaPlochaCelkom = 100;
      p.vsakovaciaPrehlbenaBezpecnostnyPrepad = 100;
    });

    expect(calculateMZI(bezVsaku).koefOkolie).toBeCloseTo(0, 5);
    // 100 m² × 0 + 100 m² × 1 = 100, delené 200 m² → 0,5
    expect(calculateMZI(sVsakom).koefOkolie).toBeCloseTo(0.5, 5);
  });

  it('zaradí koeficient do päťstupňovej škály Klimaskenu', () => {
    const zeleny = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaStromy = 100;
    });
    const spevneny = arealSPozemkom((p) => {
      p.spevnenaPlochaCelkom = 100;
    });

    expect(calculateMZI(zeleny).stupenOkolie).toBe('A');
    expect(calculateMZI(spevneny).stupenOkolie).toBe('E');
  });
});

describe('calculateMZI – budovy (metodika KLIMASKEN B-GOV3)', () => {
  it('strecha bez vegetácie má koeficient 0, intenzívna zelená strecha 0,8', () => {
    const holaStrecha = createEmptyAreal();
    holaStrecha.pozemky = [];
    const b1 = createEmptyBudova();
    b1.plochaPodorysu = 200;
    holaStrecha.budovy = [b1];

    const zelenaStrecha = createEmptyAreal();
    zelenaStrecha.pozemky = [];
    const b2 = createEmptyBudova();
    b2.plochaPodorysu = 200;
    b2.zelenaStrechaBudovIntenzivna = 200;
    zelenaStrecha.budovy = [b2];

    expect(calculateMZI(holaStrecha).koefBudovy).toBeCloseTo(0, 5);
    expect(calculateMZI(zelenaStrecha).koefBudovy).toBeCloseTo(0.8, 5);
  });
});

describe('calculateMZI – chýbajúce údaje', () => {
  it('prázdny areál dá skóre 0 a všetky komponenty bez údajov', () => {
    const areal = createEmptyAreal();
    areal.pozemky = [];
    areal.budovy = [];
    const skore = calculateMZI(areal);

    expect(skore.celkove).toBe(0);
    expect(skore.okolie).toBeNull();
    expect(skore.budovy).toBeNull();
    expect(skore.akumulacia).toBeNull();
    expect(skore.odtok).toBeNull();
  });

  it('komponent bez údajov areál nepenalizuje — skóre sa normalizuje cez dostupné komponenty', () => {
    // Len pozemok so samou zeleňou: dostupný je iba komponent B-GOV2 (koeficient 1,0),
    // takže výsledné skóre je 100, nie 45/100.
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaStromy = 100;
    });

    expect(calculateMZI(areal).celkove).toBe(100);
  });
});

describe('calculateMZI – akumulácia zrážkovej vody (metodika KLIMASKEN B-AD10)', () => {
  it('vypočíta naplnenie optimálneho objemu nádrží a zaradí ho do škály', () => {
    const areal = createEmptyAreal();
    areal.pozemky = [];
    areal.budovy = [];
    areal.pocetZamestnancov = 10;
    // Vv = 10 × 140 × 0,5 × 20 / 1000 = 14 m³
    const p = createEmptyPozemok();
    p.podzemneNadobyObjem = 14;
    areal.pozemky = [p];

    const skore = calculateMZI(areal);
    expect(skore.akumulaciaPercent).toBeCloseTo(100, 5);
    expect(skore.stupenAkumulacia).toBe('A');
  });
});

describe('calculateMZI – zadržanie odtoku', () => {
  it('podiel plôch so vsakom a retenciou tvorí samostatný komponent', () => {
    const areal = arealSPozemkom((p) => {
      p.celkovaVymera = 1000;
      p.spevnenaPlochaCelkom = 1000;
      p.odvodVodyVsakovanie = 75;
      p.odvodVodyJednotnaKanalizacia = 25;
    });

    expect(calculateMZI(areal).podielZadrzanehoOdtoku).toBeCloseTo(0.75, 5);
  });
});
