import { describe, it, expect } from 'vitest';
import { createEmptyAreal, createEmptyPozemok, createEmptyBudova } from '../../types/areal';
import { calculateMZI } from '../mziKlimasken';
import { calculateOZE, calculateEnergia } from '../../hooks/useScoring';
import {
  vysvetleniaMZI, vysvetleniaOZE, vysvetleniaEnergetiky, tabulkaAkoText, chybajuceUdajeMZI,
} from '../skoreVysvetlenie';

/** Areál s jedným pozemkom a bez budov — izoluje komponent B-GOV2. */
function arealSPozemkom(uprav: (p: ReturnType<typeof createEmptyPozemok>) => void) {
  const areal = createEmptyAreal();
  const p = createEmptyPozemok();
  uprav(p);
  areal.pozemky = [p];
  areal.budovy = [];
  return areal;
}

function vysvetlenie(areal: ReturnType<typeof createEmptyAreal>, kluc: string) {
  return vysvetleniaMZI(areal, calculateMZI(areal)).find((v) => v.kluc === kluc);
}

describe('vysvetleniaMZI – priepustnosť a zeleň (B-GOV2)', () => {
  it('rozpíše plochy s kódmi metodiky a súčet sedí s koeficientom', () => {
    // 100 m² trávnika (0,7) + 100 m² betónu (0) → koeficient 0,35
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
      p.spevnenaPlochaCelkom = 100;
    });

    const v = vysvetlenie(areal, 'okolie')!;
    expect(v.metodika).toBe('KLIMASKEN B-GOV2');
    expect(v.hlavicka).toEqual(['Povrch', 'Kód', 'Výmera', 'Koeficient', 'Príspevok']);

    const kody = v.riadky.map((r) => r[1]);
    expect(kody).toContain('H'); // trávnik
    expect(kody).toContain('A'); // nepriepustná plocha

    // Posledný riadok je súčtový.
    const spolu = v.riadky[v.riadky.length - 1];
    expect(spolu[0]).toBe('Spolu');
    expect(spolu[2]).toBe('200 m²');

    expect(v.zaver).toContain('0,35');
    expect(v.zaver).toContain('stupeň C');
  });

  it('vetný sumár povie podiel, najväčšieho prispievateľa aj plochu bez funkcie', () => {
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
      p.spevnenaPlochaCelkom = 100;
    });

    const v = vysvetlenie(areal, 'okolie')!;
    expect(v.sumar).toContain('35 %');
    expect(v.sumar).toContain('byliny');
    expect(v.sumar).toContain('100 m²');
  });

  it('zlúči rovnaký typ povrchu naprieč viacerými pozemkami do jedného riadku', () => {
    const areal = createEmptyAreal();
    areal.budovy = [];
    areal.pozemky = [0, 1].map(() => {
      const p = createEmptyPozemok();
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
      return p;
    });

    const v = vysvetlenie(areal, 'okolie')!;
    const travnik = v.riadky.filter((r) => r[1] === 'H');
    expect(travnik).toHaveLength(1);
    expect(travnik[0][2]).toBe('200 m²');
  });
});

describe('vysvetleniaMZI – akumulácia (B-AD10)', () => {
  it('vypíše medzivýsledky a povie, ktorý objem rozhodol', () => {
    const areal = createEmptyAreal();
    areal.budovy = [];
    areal.pocetZamestnancov = 10; // Vv = 14 m³
    const p = createEmptyPozemok();
    p.podzemneNadobyObjem = 7;
    areal.pozemky = [p];

    const v = vysvetlenie(areal, 'akumulacia')!;
    expect(v.metodika).toBe('KLIMASKEN B-AD10');
    expect(v.riadky.some((r) => r[1].startsWith('Vv'))).toBe(true);
    expect(v.sumar).toContain('spotreba vody v areáli');
    expect(v.zaver).toContain('50 %');
  });
});

describe('vysvetleniaMZI – odtok zo spevnených plôch', () => {
  it('rozpíše, kam voda smeruje, a nepočíta priepustnú plochu', () => {
    const areal = arealSPozemkom((p) => {
      p.celkovaVymera = 1000;
      p.priepustnaPlochaCelkom = 900; // do odtokovej plochy nevstupuje
      p.priepustnaPlochaByliny = 100;
      p.spevnenaPlochaCelkom = 100;
      p.odvodVodyVsakovanie = 50;
      p.odvodVodyJednotnaKanalizacia = 50;
    });

    const v = vysvetlenie(areal, 'odtok')!;
    const spolu = v.riadky[v.riadky.length - 1];
    expect(spolu[2]).toBe('100 m²'); // len spevnená plocha, nie 1 000 m²
    expect(v.sumar).toContain('Priepustné plochy sa sem nerátajú');
    expect(v.zaver).toContain('50 %');
  });
});

describe('vysvetleniaMZI – chýbajúce údaje', () => {
  it('komponent bez údajov nemá vysvetlenie', () => {
    const areal = createEmptyAreal();
    areal.pozemky = [];
    areal.budovy = [];

    expect(vysvetleniaMZI(areal, calculateMZI(areal))).toHaveLength(0);
  });

  it('areál s budovou má vysvetlenie aj pre B-GOV3', () => {
    const areal = createEmptyAreal();
    areal.pozemky = [];
    const b = createEmptyBudova();
    b.plochaPodorysu = 200;
    b.zelenaStrechaBudovIntenzivna = 200;
    areal.budovy = [b];

    const v = vysvetlenie(areal, 'budovy')!;
    expect(v.metodika).toBe('KLIMASKEN B-GOV3');
    expect(v.riadky.some((r) => r[1] === 'F')).toBe(true);
    expect(v.zaver).toContain('stupeň A');
  });
});

describe('tabulkaAkoText', () => {
  it('oddelí bunky tabulátormi a riadky novým riadkom', () => {
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
    });

    const text = tabulkaAkoText(vysvetlenie(areal, 'okolie')!);
    const riadky = text.split('\n');

    expect(riadky[0]).toBe('Priepustnosť a zeleň areálu (KLIMASKEN B-GOV2)');
    expect(riadky[1]).toBe('Povrch\tKód\tVýmera\tKoeficient\tPríspevok');
    expect(riadky[2].split('\t')).toHaveLength(5);
    expect(riadky[riadky.length - 1]).toContain('bodov');
  });

  it('používa slovenský formát čísel, aby ich Excel prevzal ako čísla', () => {
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 2000;
      p.priepustnaPlochaByliny = 100;
    });

    const text = tabulkaAkoText(vysvetlenie(areal, 'okolie')!);
    expect(text).toContain('0,70'); // desatinná čiarka, nie bodka
    expect(text).toMatch(/2\s000 m²/); // medzera ako oddeľovač tisícov
  });
});

describe('vysvetleniaOZE / vysvetleniaEnergetiky (etapa 2)', () => {
  /** Areál s jednou budovou, na ktorej je čo hodnotiť. */
  function arealSBudovou(uprav: (b: ReturnType<typeof createEmptyBudova>) => void) {
    const areal = createEmptyAreal();
    areal.pozemky = [];
    const b = createEmptyBudova();
    b.nazov = 'Hlavná budova';
    b.plochaPodorysu = 400;
    b.uzitkovaPlochaNUS = 800;
    uprav(b);
    areal.budovy = [b];
    return areal;
  }

  it('rozpíše položky OZE s názvom budovy a body sedia so skóre', () => {
    const areal = arealSBudovou((b) => {
      b.fotovoltika = 1;
      b.tepelneCerpadlo = 1;
    });
    const skore = calculateOZE(areal);
    const v = vysvetleniaOZE(skore).find((x) => x.kluc === 'existujuceOZE')!;

    expect(v.hlavicka).toEqual(['Položka', 'Budova', 'Body']);
    expect(v.riadky).toContainEqual(['Fotovoltika', 'Hlavná budova', '+6']);
    expect(v.riadky).toContainEqual(['Tepelné čerpadlo', 'Hlavná budova', '+6']);
    // Súčtový riadok je posledný a zodpovedá súčtu položiek.
    expect(v.riadky[v.riadky.length - 1]).toEqual(['Súčet položiek', '', '+12']);
    expect(v.zaver).toContain(`${skore.existujuceOZE} z 20 bodov`);
  });

  it('záver ukáže delenie počtom budov aj paušál', () => {
    const areal = arealSBudovou((b) => { b.zateplenieFasady = 1; });
    const v = vysvetleniaEnergetiky(calculateEnergia(areal)).find((x) => x.kluc === 'zateplenie')!;

    expect(v.zaver).toContain('delené počtom hodnotených budov (1)');
    expect(v.zaver).toContain('paušál +5 b');
  });

  it('sumár vymenuje aj položku, ktorá body odoberá', () => {
    const areal = arealSBudovou((b) => { b.kurenieUhlimDrevom = 1; });
    const v = vysvetleniaEnergetiky(calculateEnergia(areal)).find((x) => x.kluc === 'vykurovaciSystem')!;

    expect(v.sumar).toContain('odoberá');
    expect(v.sumar).toContain('vykurovanie uhlím alebo drevom');
  });

  it('záver spomenie orezanie, keď súčet prekročí maximum', () => {
    const areal = arealSBudovou((b) => {
      b.rekuperacia = 1;   // +15
      b.osvetlenieLED = 100; // +10 → spolu 25, bez orezania
      b.tepelneCerpadlo = 1;
    });
    const v = vysvetleniaEnergetiky(calculateEnergia(areal)).find((x) => x.kluc === 'vykurovaciSystem')!;
    // Tepelné čerpadlo (+10) + paušál (+10) = 20, teda bez orezania.
    expect(v.zaver).not.toContain('orezané');

    const zateplene = arealSBudovou((b) => {
      b.zateplenieFasady = 1;   // +10
      b.strechaZateplenie = 1;  // +10
    });
    // 20 + paušál 5 = 25, maximum je 30 — tiež bez orezania.
    const vz = vysvetleniaEnergetiky(calculateEnergia(zateplene)).find((x) => x.kluc === 'zateplenie')!;
    expect(vz.zaver).toContain('25 z 30 bodov');
  });

  it('nehodnotená oblasť nemá vysvetlenia', () => {
    const bezBudov = createEmptyAreal();
    bezBudov.budovy = [];

    expect(vysvetleniaOZE(calculateOZE(bezBudov))).toHaveLength(0);
    expect(vysvetleniaEnergetiky(calculateEnergia(bezBudov))).toHaveLength(0);
  });

  it('sumár energetiky spomenie vynechané sezónne stavby', () => {
    const areal = createEmptyAreal();
    areal.pozemky = [];
    const vykurovana = createEmptyBudova();
    vykurovana.nazov = 'Škola';
    vykurovana.plochaPodorysu = 400;
    vykurovana.zateplenieFasady = 1;
    const chata = createEmptyBudova();
    chata.nazov = 'Záhradná chata';
    chata.plochaPodorysu = 20;
    chata.sezonnaNevykurovana = 1;
    areal.budovy = [vykurovana, chata];

    const skore = calculateEnergia(areal);
    expect(skore.vynechanychSezonnych).toBe(1);
    expect(skore.hodnotenychBudov).toBe(1);

    const v = vysvetleniaEnergetiky(skore).find((x) => x.kluc === 'zateplenie')!;
    expect(v.sumar).toContain('Jedna sezónna nevykurovaná stavba je z hodnotenia vynechaná');
    // Chata sa nedostane ani do rozpisu položiek.
    expect(v.riadky.some((r) => r[1] === 'Záhradná chata')).toBe(false);
  });
});

describe('chybajuceUdajeMZI – prečo komponent nemá body (#213)', () => {
  /** Úplne prázdny areál — žiadny komponent MZI sa nedá vypočítať. */
  function prazdnyAreal() {
    const areal = createEmptyAreal();
    areal.pozemky = [createEmptyPozemok()];
    areal.budovy = [createEmptyBudova()];
    return areal;
  }

  it('pomenuje chýbajúci údaj pri každom nevypočítanom komponente', () => {
    const areal = prazdnyAreal();
    const chyba = chybajuceUdajeMZI(areal, calculateMZI(areal));

    expect([...chyba.keys()].sort()).toEqual(['akumulacia', 'budovy', 'odtok', 'okolie']);
    expect(chyba.get('okolie')).toContain('V kroku Pozemky');
    expect(chyba.get('budovy')).toContain('V kroku Budovy');
  });

  it('pri akumulácii vymenuje všetky chýbajúce vstupy výpočtu', () => {
    const areal = prazdnyAreal();
    const text = chybajuceUdajeMZI(areal, calculateMZI(areal)).get('akumulacia')!;

    expect(text).toContain('úhrn zrážok');
    expect(text).toContain('plocha pôdorysu budov');
    expect(text).toContain('počet zamestnancov');
  });

  it('akumulácia nechýba, keď používateľ označil, že nádrž nie je možná (#222)', () => {
    const areal = prazdnyAreal();
    areal.nadrzNieJeMozna = 1;

    // Nie je to chýbajúci údaj, ale odpoveď — vysvetľuje sa vlastným textom.
    expect(chybajuceUdajeMZI(areal, calculateMZI(areal)).has('akumulacia')).toBe(false);
  });

  it('odlíši „nie je čo hodnotiť" od „nie je vyplnené, kam voda odteká"', () => {
    const bezPloch = prazdnyAreal();
    expect(chybajuceUdajeMZI(bezPloch, calculateMZI(bezPloch)).get('odtok'))
      .toContain('nie je čo hodnotiť');

    // Plocha zadaná, ale odvod vody nevyplnený — to je chyba v zadaní.
    const sPlochou = prazdnyAreal();
    sPlochou.pozemky[0].spevnenaPlochaCelkom = 500;
    expect(chybajuceUdajeMZI(sPlochou, calculateMZI(sPlochou)).get('odtok'))
      .toContain('Odvod vody z pozemku');
  });

  it('vypočítaný komponent v zozname chýbajúcich údajov nie je', () => {
    const areal = arealSPozemkom((p) => {
      p.priepustnaPlochaCelkom = 100;
      p.priepustnaPlochaByliny = 100;
    });

    expect(chybajuceUdajeMZI(areal, calculateMZI(areal)).has('okolie')).toBe(false);
  });
});
