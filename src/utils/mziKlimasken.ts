// Hodnotenie modro-zelenej infraštruktúry (MZI) podľa metodiky KLIMASKEN
// (CI2, o. p. s. — www.klimasken.sk, projekt LIFE17 CCA/SK/000126 LIFE DELIVER).
//
// Použité metodické listy pre budovy:
//  - B-GOV2 „Zadržiavanie zrážkovej vody v okolí budovy" — vážený koeficient MZI
//    plôch v okolí budovy (v VESMA: pozemky areálu).
//  - B-GOV3 „Zachytávanie zrážkovej vody na budove" — vážený koeficient MZI
//    striech a zvislých konštrukcií.
//  - B-AD10 „Kapacita budovy na akumuláciu dažďovej vody" — podiel skutočného
//    objemu nádrží na objeme, ktorý je pre daný objekt optimálny.
//
// Klimasken pri oboch koeficientoch počíta vážený priemer `Σ(k · S) / Σ(S)`, kde
// k je funkčný koeficient MZI daného typu povrchu a S jeho výmera. Prvky MZI,
// ktoré ležia „nad" základným povrchom (stromy, objekty hospodárenia s dažďovou
// vodou, prekoreniteľný priestor), sa podľa príkladu v metodickom liste B-GOV2
// pripočítavajú do čitateľa aj menovateľa ako samostatné plochy.
//
// ODCHÝLKY OD METODIKY (vynútené rozsahom dotazníka VESMA — sú zámerné a
// zdokumentované, nie sú to chyby):
//  - B-GOV2 ohraničuje okolie kolmicou 20 m od stien budovy. VESMA nemá geometriu
//    areálu, preto sa počíta z celej plochy zadaných pozemkov.
//  - B-GOV3 dáva do menovateľa plochu striech aj fasád. VESMA neeviduje celkovú
//    plochu fasád, preto menovateľ tvorí pôdorysná plocha striech a nahlásená
//    plocha zelených stien. Koeficient je tým mierne optimistickejší.
//  - B-AD10 určuje koeficient odtoku strechy `fs` podľa materiálu krytiny.
//    VESMA má materiál len ako voľný text, preto sa používa typická hodnota 0,8.
//  - Typy polopriepustných povrchov, ktoré metodika nepozná (polovegetačné
//    tvárnice, „iný povrch"), sú zaradené medzi kódy B a C hodnotou 0,3.

import { Areal, Budova, Pozemok } from '../types/areal';
import { KlimaskenStupen, MZIKomponent, MZIScore } from '../types/scoring';

/** Funkčné koeficienty MZI pre povrchy v okolí budovy — metodický list B-GOV2. */
export const KOEF_OKOLIE = {
  /** A — nepriepustné spevnené plochy */
  nepriepustne: 0,
  /** B — dlažba na štrkovom lôžku so škárou < 15 mm, mlatová plocha */
  dlazbaMlat: 0.2,
  /** C — priepustný kryt, nespevnená plocha bez rastlinného krytu */
  priepustnyKryt: 0.4,
  /** G — súvislý rastlinný kryt na silno zhutnenom podklade */
  zhutnenaZelen: 0.4,
  /** H — zatrávnená plocha s intenzívnou údržbou */
  travnik: 0.7,
  /** CH — extenzívne udržiavaná plocha so zmiešaným vegetačným krytom */
  travnikExtenzivny: 1,
  /** J — mohutné stromy v zapojenom poraste */
  stromyMohutne: 1,
  /** K — vzrastovo menšie a mladé stromy */
  stromyMlade: 0.4,
  /** L — plochy kríkov výšky nad 1 m */
  kry: 0.4,
  /** P — podzemný prekoreniteľný priestor pre stromy */
  prekorenitelnyPriestor: 0.6,
  /** R — objekty HDV regulujúce odtok vody */
  hdvRegulovanyOdtok: 0.8,
  /** S — plošné objekty HDV umožňujúce vsak vody */
  hdvVsak: 1,
  /** Povrchy mimo zoznamu metodiky — zaradené medzi kódy B a C */
  neurcenyPolopriepustny: 0.3,
} as const;

/** Funkčné koeficienty MZI pre konštrukcie budovy — metodický list B-GOV3. */
export const KOEF_BUDOVY = {
  /** XX — povrch strechy a fasády bez úprav */
  bezUprav: 0,
  /** D — zelená stena, popínavé rastliny */
  zelenaStena: 0.6,
  /** E1 — extenzívna strešná záhrada na plochej streche */
  extenzivnaPloha: 0.6,
  /** E2 — extenzívna strešná záhrada so sklonom od 35° */
  extenzivnaSikma: 0.3,
  /** F — intenzívna strešná záhrada */
  intenzivna: 0.8,
  /** Y — modrá, resp. modrozelená strecha */
  modrozelena: 1,
  /** Z — strecha so štrkovým zásypom */
  strkova: 0.4,
} as const;

/** Koeficienty pre jednotlivé typy polopriepustných povrchov v dotazníku VESMA. */
const KOEF_POLOPRIEPUSTNE: Array<{ nazov: string; kod: string; podiel: (p: Pozemok) => number; koef: number }> = [
  { nazov: 'Priepustný asfalt', kod: 'C', podiel: (p) => p.polopriepustnaPriepustnyAsfalt, koef: KOEF_OKOLIE.priepustnyKryt },
  { nazov: 'Priepustný betón', kod: 'C', podiel: (p) => p.polopriepustnaPriepustnyBeton, koef: KOEF_OKOLIE.priepustnyKryt },
  { nazov: 'Vodopriepustná dlažba', kod: 'C', podiel: (p) => p.polopriepustnaVodopriepustnaDlazba, koef: KOEF_OKOLIE.priepustnyKryt },
  { nazov: 'Živica s kremičitým štrkom', kod: 'C', podiel: (p) => p.polopriepustnaZivicaKremicityStrk, koef: KOEF_OKOLIE.priepustnyKryt },
  { nazov: 'Stered', kod: 'C', podiel: (p) => p.polopriepustnaStered, koef: KOEF_OKOLIE.priepustnyKryt },
  { nazov: 'Plnevegetačné tvárnice', kod: 'G', podiel: (p) => p.polopriepustnaPlnevegetacneTvarnice, koef: KOEF_OKOLIE.zhutnenaZelen },
  { nazov: 'Mlatový povrch', kod: 'B', podiel: (p) => p.polopriepustnaMlatovyPovrch, koef: KOEF_OKOLIE.dlazbaMlat },
  { nazov: 'Polovegetačné tvárnice', kod: 'B/C', podiel: (p) => p.polopriepustnaPolovegetacneTvarnice, koef: KOEF_OKOLIE.neurcenyPolopriepustny },
  { nazov: 'Iný polopriepustný povrch', kod: 'B/C', podiel: (p) => p.polopriepustnaInyPovrch, koef: KOEF_OKOLIE.neurcenyPolopriepustny },
];

/** Váhy komponentov výsledného MZI skóre (0–100). */
export const MZI_VAHY = { okolie: 45, budovy: 25, akumulacia: 15, odtok: 15 } as const;

/** Koeficient odtoku strechy — metodika ho odvodzuje z krytiny, VESMA má typickú hodnotu. */
const KOEF_ODTOKU_STRECHY = 0.8;
/** Účinnosť filtra mechanických nečistôt — odporúčaná hodnota metodiky B-AD10. */
const UCINNOST_FILTRA = 0.9;
/** Spotreba vody na osobu a deň (l) — odporúčaná hodnota metodiky B-AD10. */
const SPOTREBA_NA_OSOBU_DEN = 140;
/** Koeficient využitia zrážkovej vody — odporúčaná hodnota metodiky B-AD10. */
const KOEF_VYUZITIA_ZRAZKOVEJ_VODY = 0.5;
/** Koeficient optimálnej veľkosti nádrže — odporúčaná hodnota metodiky B-AD10. */
const KOEF_OPTIMALNEJ_VELKOSTI = 20;

/** Jedna položka výpočtu váženého koeficientu MZI. */
export interface Plocha {
  /** Označenie povrchu alebo objektu tak, ako sa má zobraziť hodnotiteľovi. */
  nazov: string;
  /** Kód povrchu podľa metodického listu (A, B, C, H, J/K, E1, …). */
  kod: string;
  vymera: number;
  koef: number;
}

function vazenyKoeficient(plochy: Plocha[]): number | null {
  let celkom = 0;
  let funkcia = 0;
  for (const { vymera, koef } of plochy) {
    if (vymera <= 0) continue;
    celkom += vymera;
    funkcia += vymera * koef;
  }
  return celkom > 0 ? funkcia / celkom : null;
}

/**
 * Zlúči rovnaké typy povrchov naprieč pozemkami a budovami do jedného riadku,
 * aby tabuľka výpočtu nemala pri areáli s piatimi pozemkami päťkrát „trávnik".
 *
 * Koeficient sa dopočíta z príspevku a výmery — pri stromoch sa totiž líši podľa
 * podielu mladých a nezdravých jedincov, takže zlúčený riadok ukáže výsledný
 * vážený koeficient, nie ten z prvého pozemku.
 */
export function zluceneRiadky(plochy: Plocha[]): Plocha[] {
  const podlaTypu = new Map<string, Plocha>();
  for (const p of plochy) {
    if (p.vymera <= 0) continue;
    const kluc = `${p.kod}|${p.nazov}`;
    const doteraz = podlaTypu.get(kluc);
    if (doteraz) {
      const prispevok = doteraz.vymera * doteraz.koef + p.vymera * p.koef;
      doteraz.vymera += p.vymera;
      doteraz.koef = doteraz.vymera > 0 ? prispevok / doteraz.vymera : 0;
    } else {
      podlaTypu.set(kluc, { ...p });
    }
  }
  return [...podlaTypu.values()];
}

/**
 * Koeficient MZI priepustnej plochy pozemku — vážený priemer podľa podielu
 * obrábanej pôdy, bylín, krov a stromov (kódy C, H, L, J/K metodiky B-GOV2).
 *
 * Pravidelne obrábaná pôda bez mulča (hriadky, záhony, polia) patrí pod kód C
 * „nespevnené plochy bez rastlinného krytu" — po zoraní sa pri prívalovej zrážke
 * zaškrupinatie, horšie drží vlahu a mimo vegetačnej sezóny sa prehrieva.
 *
 * Mladé a nezdravé stromy sa hodnotia koeficientom pre vzrastovo menšie stromy
 * (K = 0,4), pretože podľa metodiky zachytia výrazne menej zrážok než zapojený
 * porast mohutných stromov (J = 1,0).
 */
function plochyPriepustnej(p: Pozemok): Plocha[] {
  const celkom = p.priepustnaPlochaCelkom;
  if (celkom <= 0) return [];

  const podielSlabychStromov = Math.min(1, (p.stromyPodielMladych + p.stromyPodielNezdravych) / 100);
  const koefStromov =
    KOEF_OKOLIE.stromyMlade * podielSlabychStromov +
    KOEF_OKOLIE.stromyMohutne * (1 - podielSlabychStromov);

  return [
    { nazov: 'Pravidelne obrábaná pôda', kod: 'C', vymera: celkom * (p.priepustnaPlochaObrabanaPoda / 100), koef: KOEF_OKOLIE.priepustnyKryt },
    { nazov: 'Byliny (trávnik, lúka)', kod: 'H', vymera: celkom * (p.priepustnaPlochaByliny / 100), koef: KOEF_OKOLIE.travnik },
    { nazov: 'Kry', kod: 'L', vymera: celkom * (p.priepustnaPlochaKry / 100), koef: KOEF_OKOLIE.kry },
    { nazov: 'Stromy', kod: 'J/K', vymera: celkom * (p.priepustnaPlochaStromy / 100), koef: koefStromov },
  ];
}

/** Koeficient MZI polopriepustnej plochy — vážený priemer nahlásených typov povrchov. */
function plochyPolopriepustnej(p: Pozemok): Plocha[] {
  const celkom = p.polopriepustnaPlochaCelkom;
  if (celkom <= 0) return [];

  const plochy: Plocha[] = [];
  let pokryteProcenta = 0;
  for (const { nazov, kod, podiel, koef } of KOEF_POLOPRIEPUSTNE) {
    const percenta = podiel(p);
    if (percenta <= 0) continue;
    pokryteProcenta += percenta;
    plochy.push({ nazov, kod, vymera: celkom * (percenta / 100), koef });
  }

  // Nešpecifikovaný zvyšok polopriepustnej plochy — konzervatívna hodnota medzi B a C.
  const zvysok = Math.max(0, 100 - pokryteProcenta);
  if (zvysok > 0) {
    plochy.push({
      nazov: 'Polopriepustná plocha bez rozpisu',
      kod: 'B/C',
      vymera: celkom * (zvysok / 100),
      koef: KOEF_OKOLIE.neurcenyPolopriepustny,
    });
  }
  return plochy;
}

/** Rozpis plôch areálu pre indikátor B-GOV2 — vstup do výpočtu aj do vysvetlenia. */
export function plochyOkolia(areal: Areal): Plocha[] {
  const plochy: Plocha[] = [];

  for (const p of areal.pozemky) {
    plochy.push({ nazov: 'Nepriepustné spevnené plochy', kod: 'A', vymera: p.spevnenaPlochaCelkom, koef: KOEF_OKOLIE.nepriepustne });
    plochy.push(...plochyPolopriepustnej(p));
    plochy.push(...plochyPriepustnej(p));

    // Prvky MZI ležiace nad základným povrchom — podľa príkladu v metodickom liste
    // sa započítavajú ako samostatné plochy do čitateľa aj menovateľa.
    plochy.push({ nazov: 'Dažďová záhrada', kod: 'S', vymera: p.dazdovaZahradaPlocha, koef: KOEF_OKOLIE.hdvVsak });
    plochy.push({ nazov: 'Jazierko', kod: 'S', vymera: p.jazierkoPlocha, koef: KOEF_OKOLIE.hdvVsak });
    plochy.push({ nazov: 'Vsakovacia priehlbeň s bezpečnostným prepadom', kod: 'S', vymera: p.vsakovaciaPrehlbenaBezpecnostnyPrepad, koef: KOEF_OKOLIE.hdvVsak });
    plochy.push({ nazov: 'Vsakovacia priehlbeň s regulovaným odtokom', kod: 'R', vymera: p.vsakovaciaPrehlbenaRegulovanyOdtok, koef: KOEF_OKOLIE.hdvRegulovanyOdtok });
    plochy.push({ nazov: 'Prekoreniteľný priestor pre stromy', kod: 'P', vymera: p.prekorenetelnyPriestorPreStromy, koef: KOEF_OKOLIE.prekorenitelnyPriestor });
  }

  return plochy;
}

/**
 * B-GOV2 — vážený koeficient MZI plôch areálu (0–1).
 * Vráti `null`, ak na pozemkoch nie je zadaná žiadna výmera.
 */
export function koeficientOkolia(areal: Areal): number | null {
  return vazenyKoeficient(plochyOkolia(areal));
}

/** Rozpis zelenej strechy budovy na typy podľa metodiky B-GOV3. */
function plochyZelenejStrechyBudovy(b: Budova): Plocha[] {
  const rozpis: Plocha[] = [
    { nazov: 'Extenzívna zelená strecha — plochá', kod: 'E1', vymera: b.zelenaStrechaBudovExtenzivnaPloca, koef: KOEF_BUDOVY.extenzivnaPloha },
    { nazov: 'Extenzívna zelená strecha — šikmá', kod: 'E2', vymera: b.zelenaStrechaBudovExtenzivnaSikma, koef: KOEF_BUDOVY.extenzivnaSikma },
    { nazov: 'Intenzívna zelená strecha', kod: 'F', vymera: b.zelenaStrechaBudovIntenzivna, koef: KOEF_BUDOVY.intenzivna },
    { nazov: 'Modrozelená strecha', kod: 'Y', vymera: b.zelenaStrechaBudovModrozelena, koef: KOEF_BUDOVY.modrozelena },
    { nazov: 'Strecha so štrkovým zásypom', kod: 'Z', vymera: b.zelenaStrechaBudovStrkova, koef: KOEF_BUDOVY.strkova },
  ];
  const rozpisSpolu = rozpis.reduce((acc, p) => acc + Math.max(0, p.vymera), 0);
  if (rozpisSpolu > 0) return rozpis;

  // Zadaná je len celková plocha bez rozpisu — typ sa odhadne z tvaru strechy
  // (plochá → extenzívna plochá E1, šikmá a strmá → extenzívna šikmá E2).
  if (b.zelenaStrechaPlocha > 0) {
    const plocha = b.strechaTyp === 1;
    return [{
      nazov: `Zelená strecha bez rozpisu (odhad: ${plocha ? 'extenzívna plochá' : 'extenzívna šikmá'})`,
      kod: plocha ? 'E1' : 'E2',
      vymera: b.zelenaStrechaPlocha,
      koef: plocha ? KOEF_BUDOVY.extenzivnaPloha : KOEF_BUDOVY.extenzivnaSikma,
    }];
  }
  return [];
}

/** Rozpis zelenej strechy na inej stavbe pozemku na typy podľa metodiky B-GOV3. */
function plochyZelenejStrechyPozemku(p: Pozemok): Plocha[] {
  const rozpis: Plocha[] = [
    { nazov: 'Extenzívna zelená strecha na pozemku — plochá', kod: 'E1', vymera: p.zelenaStrechaExtenzivnaPloca, koef: KOEF_BUDOVY.extenzivnaPloha },
    { nazov: 'Extenzívna zelená strecha na pozemku — šikmá', kod: 'E2', vymera: p.zelenaStrechaExtenzivnaSikma, koef: KOEF_BUDOVY.extenzivnaSikma },
    { nazov: 'Intenzívna zelená strecha na pozemku', kod: 'F', vymera: p.zelenaStrechaIntenzivna, koef: KOEF_BUDOVY.intenzivna },
    { nazov: 'Modrozelená strecha na pozemku', kod: 'Y', vymera: p.zelenaStrechaModrozelena, koef: KOEF_BUDOVY.modrozelena },
    { nazov: 'Strecha so štrkovým zásypom na pozemku', kod: 'Z', vymera: p.zelenaStrechaStrkova, koef: KOEF_BUDOVY.strkova },
  ];
  const rozpisSpolu = rozpis.reduce((acc, x) => acc + Math.max(0, x.vymera), 0);
  if (rozpisSpolu > 0) return rozpis;
  if (p.zelenaStrechaPlocha > 0) {
    return [{
      nazov: 'Zelená strecha na pozemku bez rozpisu (odhad: extenzívna plochá)',
      kod: 'E1',
      vymera: p.zelenaStrechaPlocha,
      koef: KOEF_BUDOVY.extenzivnaPloha,
    }];
  }
  return [];
}

/** Rozpis konštrukcií budov pre indikátor B-GOV3 — vstup do výpočtu aj do vysvetlenia. */
export function plochyBudov(areal: Areal): Plocha[] {
  const plochy: Plocha[] = [];

  for (const b of areal.budovy) {
    const zelenaStrecha = plochyZelenejStrechyBudovy(b);
    const zelenaSpolu = zelenaStrecha.reduce((acc, p) => acc + Math.max(0, p.vymera), 0);
    plochy.push(...zelenaStrecha);
    // Zvyšok strechy bez vegetácie a zásypu — kód XX.
    plochy.push({
      nazov: 'Strecha bez vegetácie a zásypu',
      kod: 'XX',
      vymera: Math.max(0, b.plochaPodorysu - zelenaSpolu),
      koef: KOEF_BUDOVY.bezUprav,
    });
    plochy.push({ nazov: 'Zelená stena budovy', kod: 'D', vymera: b.zelenaStenaBudov, koef: KOEF_BUDOVY.zelenaStena });
  }

  for (const p of areal.pozemky) {
    plochy.push(...plochyZelenejStrechyPozemku(p));
    plochy.push({ nazov: 'Zelená stena na pozemku', kod: 'D', vymera: p.zelenaStenaNaPozemku, koef: KOEF_BUDOVY.zelenaStena });
  }

  return plochy;
}

/**
 * B-GOV3 — vážený koeficient MZI striech a zvislých konštrukcií (0–1).
 * Vráti `null`, ak nie je zadaná žiadna plocha strechy ani zelenej steny.
 */
export function koeficientBudov(areal: Areal): number | null {
  return vazenyKoeficient(plochyBudov(areal));
}

/** Medzivýsledky výpočtu B-AD10 — pre skóre aj pre vysvetlenie hodnotiteľovi. */
export interface DetailAkumulacie {
  /** j — úhrn zrážok (mm/rok) */
  zrazky: number;
  /** P — využiteľná plocha striech (m²) */
  plochaStriech: number;
  /** Q — množstvo zachytenej zrážkovej vody (m³/rok) */
  zachytenaVoda: number;
  /** n — počet osôb v areáli */
  osoby: number;
  /** Vp — potrebný objem podľa množstva využiteľnej vody (m³) */
  objemPodlaZrazok: number | null;
  /** Vv — potrebný objem podľa spotreby (m³) */
  objemPodlaSpotreby: number | null;
  /** Vn = min(Vv; Vp) — ak je známy len jeden vstup, použije sa ten */
  potrebnyObjem: number | null;
  /** Va — skutočný objem nadzemných a podzemných nádrží (m³) */
  skutocnyObjem: number;
  /** X = Va / Vn × 100 (%) */
  percent: number | null;
}

/** Rozpis výpočtu B-AD10 podľa metodického listu. */
export function detailAkumulacie(areal: Areal): DetailAkumulacie {
  const plochaStriech = areal.budovy.reduce((acc, b) => acc + b.plochaPodorysu, 0);
  const zrazky = areal.mnozstvoZrazok ?? 0;
  const osoby = areal.pocetZamestnancov;

  const zachytenaVoda = (zrazky * plochaStriech * KOEF_ODTOKU_STRECHY * UCINNOST_FILTRA) / 1000;

  // Vp — potrebný objem podľa množstva využiteľnej zrážkovej vody.
  const objemPodlaZrazok =
    zachytenaVoda > 0 ? (KOEF_OPTIMALNEJ_VELKOSTI * zachytenaVoda) / 365 : null;

  // Vv — potrebný objem podľa spotreby budovy.
  const objemPodlaSpotreby =
    osoby > 0
      ? (osoby * SPOTREBA_NA_OSOBU_DEN * KOEF_VYUZITIA_ZRAZKOVEJ_VODY * KOEF_OPTIMALNEJ_VELKOSTI) / 1000
      : null;

  const skutocnyObjem = areal.pozemky.reduce(
    (acc, p) => acc + p.nadzemneNadobyObjem + p.podzemneNadobyObjem,
    0,
  );

  const kandidati = [objemPodlaZrazok, objemPodlaSpotreby].filter((v): v is number => v !== null);
  // Vn = min(Vv; Vp) — ak je známy len jeden vstup, použije sa ten.
  const potrebnyObjem = kandidati.length > 0 && Math.min(...kandidati) > 0 ? Math.min(...kandidati) : null;

  return {
    zrazky,
    plochaStriech,
    zachytenaVoda,
    osoby,
    objemPodlaZrazok,
    objemPodlaSpotreby,
    potrebnyObjem,
    skutocnyObjem,
    percent: potrebnyObjem === null ? null : (skutocnyObjem / potrebnyObjem) * 100,
  };
}

/**
 * B-AD10 — podiel skutočného objemu akumulačných nádrží na optimálnom objeme (%).
 * Vráti `null`, ak nie je známy ani úhrn zrážok, ani počet osôb v areáli.
 */
export function akumulaciaPercent(areal: Areal): number | null {
  return detailAkumulacie(areal).percent;
}

/**
 * Odtoková plocha pozemku (m²) — spevnená a polopriepustná plocha.
 *
 * Z priepustného povrchu zrážka vsiakne tam, kde spadne. „Neriešený" odvod na
 * ňom preto nie je nedostatok, ale práve žiaduci stav — záhrada s celou plochou
 * v tráve vodu zadrží lepšie než akékoľvek technické riešenie. Otázka „kam
 * odteká voda" má zmysel len pre povrchy, ktoré odtok naozaj tvoria.
 */
function odtokovaPlocha(p: Pozemok): number {
  return p.spevnenaPlochaCelkom + p.polopriepustnaPlochaCelkom;
}

/**
 * Podiel odtokovej plochy, z ktorej zrážková voda smeruje do vsaku alebo
 * retencie namiesto kanalizácie, vodného toku či neriešeného odtoku (0–1).
 *
 * Nejde o indikátor Klimaskenu — dopĺňa koeficienty MZI o údaj, ktorý dotazník
 * VESMA zbiera a ktorý rozhoduje o tom, či voda z areálu vôbec zostane na mieste.
 *
 * Počíta sa len zo spevnených a polopriepustných plôch pozemkov a zo striech
 * budov (pozri `odtokovaPlocha`). Areál bez takých plôch vráti `null` —
 * komponent sa do skóre nezapočíta, lebo nie je čo hodnotiť. Priepustná plocha
 * je ocenená koeficientom MZI v indikátore B-GOV2, tam sa jej kvalita prejaví.
 */
/** Kam smeruje voda z odtokovej plochy — jeden riadok rozpisu. */
export interface CielOdtoku {
  nazov: string;
  /** m² odtokovej plochy, z ktorej voda smeruje týmto spôsobom */
  vymera: number;
  /** Počíta sa ako zadržaná na mieste? */
  zadrzana: boolean;
}

/** Medzivýsledky výpočtu komponentu „odtok zo spevnených plôch". */
export interface DetailOdtoku {
  ciele: CielOdtoku[];
  /** Celková odtoková plocha (m²) */
  odtokovaPlocha: number;
  /** Z toho zadržaná na mieste (m²) */
  zadrzanaPlocha: number;
  podiel: number | null;
}

/** Rozpis, kam z odtokovej plochy smeruje zrážková voda. */
export function detailOdtoku(areal: Areal): DetailOdtoku {
  const vymery = new Map<string, CielOdtoku>();
  const pridaj = (nazov: string, zadrzana: boolean, vymera: number) => {
    if (vymera <= 0) return;
    const doteraz = vymery.get(nazov);
    if (doteraz) doteraz.vymera += vymera;
    else vymery.set(nazov, { nazov, zadrzana, vymera });
  };

  let odtokovaPlochaSpolu = 0;
  let zadrzanaPlocha = 0;

  for (const p of areal.pozemky) {
    const plocha = odtokovaPlocha(p);
    if (plocha <= 0) continue;
    const kanalizacia =
      p.odvodVodyJednotnaKanalizacia + p.odvodVodySplaskovaKanalizacia + p.odvodVodyZrazkovaKanalizacia +
      (p.odvodVodyKanalizacia ?? 0);
    const zadrzane = p.odvodVodyVsakovanie + p.odvodVodyRetencnaNadrzou;
    const spolu = zadrzane + kanalizacia + p.odvodVodyVodnyTok + p.odvodVodyNerieseny;
    if (spolu <= 0) continue;

    const naPlochu = (percenta: number) => (plocha * percenta) / spolu;
    pridaj('Cielené vsakovanie', true, naPlochu(p.odvodVodyVsakovanie));
    pridaj('Retenčná nádrž', true, naPlochu(p.odvodVodyRetencnaNadrzou));
    pridaj('Kanalizácia', false, naPlochu(kanalizacia));
    pridaj('Vodný tok', false, naPlochu(p.odvodVodyVodnyTok));
    pridaj('Neriešený odtok', false, naPlochu(p.odvodVodyNerieseny));

    odtokovaPlochaSpolu += plocha;
    zadrzanaPlocha += (plocha * zadrzane) / spolu;
  }

  for (const b of areal.budovy) {
    const plocha = b.plochaPodorysu;
    if (plocha <= 0) continue;
    const zadrzane = b.budovaOdvodVodyNaPozemok + b.budovaOdvodVodyRetencnaNadrz;
    const spolu =
      zadrzane + b.budovaOdvodVodyKanalizacia + b.budovaOdvodVodyVodnyTok + b.budovaOdvodVodyNerieseny;
    if (spolu <= 0) continue;

    const naPlochu = (percenta: number) => (plocha * percenta) / spolu;
    pridaj('Zo strechy na pozemok', true, naPlochu(b.budovaOdvodVodyNaPozemok));
    pridaj('Retenčná nádrž', true, naPlochu(b.budovaOdvodVodyRetencnaNadrz));
    pridaj('Kanalizácia', false, naPlochu(b.budovaOdvodVodyKanalizacia));
    pridaj('Vodný tok', false, naPlochu(b.budovaOdvodVodyVodnyTok));
    pridaj('Neriešený odtok', false, naPlochu(b.budovaOdvodVodyNerieseny));

    odtokovaPlochaSpolu += plocha;
    zadrzanaPlocha += (plocha * zadrzane) / spolu;
  }

  return {
    ciele: [...vymery.values()],
    odtokovaPlocha: odtokovaPlochaSpolu,
    zadrzanaPlocha,
    podiel: odtokovaPlochaSpolu > 0 ? zadrzanaPlocha / odtokovaPlochaSpolu : null,
  };
}

export function podielZadrzanehoOdtoku(areal: Areal): number | null {
  return detailOdtoku(areal).podiel;
}

/** Zaradenie koeficientu B-GOV2 do päťstupňovej škály Klimaskenu. */
export function stupenOkolia(koef: number): KlimaskenStupen {
  if (koef > 0.8) return 'A';
  if (koef > 0.6) return 'B';
  if (koef > 0.3) return 'C';
  if (koef > 0.2) return 'D';
  return 'E';
}

/** Zaradenie koeficientu B-GOV3 do päťstupňovej škály Klimaskenu. */
export function stupenBudov(koef: number): KlimaskenStupen {
  if (koef > 0.5) return 'A';
  if (koef > 0.3) return 'B';
  if (koef > 0.1) return 'C';
  if (koef > 0) return 'D';
  return 'E';
}

/** Zaradenie hodnoty B-AD10 (%) do päťstupňovej škály Klimaskenu. */
export function stupenAkumulacie(percent: number): KlimaskenStupen {
  if (percent > 75) return 'A';
  if (percent > 50) return 'B';
  if (percent > 20) return 'C';
  if (percent > 1) return 'D';
  return 'E';
}

function clamp01(podiel: number): number {
  return Math.max(0, Math.min(1, podiel));
}

function komponent(podiel: number | null, max: number): MZIKomponent | null {
  if (podiel === null) return null;
  return { body: Math.round(clamp01(podiel) * max), max };
}

/** Vypočíta MZI skóre areálu (0–100) podľa metodiky Klimaskenu. */
export function calculateMZI(areal: Areal): MZIScore {
  const koefOkolie = koeficientOkolia(areal);
  const koefBudovy = koeficientBudov(areal);
  const akumulacia = akumulaciaPercent(areal);
  const odtok = podielZadrzanehoOdtoku(areal);

  const podiely: Array<{ podiel: number | null; max: number }> = [
    { podiel: koefOkolie, max: MZI_VAHY.okolie },
    { podiel: koefBudovy, max: MZI_VAHY.budovy },
    { podiel: akumulacia === null ? null : akumulacia / 100, max: MZI_VAHY.akumulacia },
    { podiel: odtok, max: MZI_VAHY.odtok },
  ];

  const komponenty = {
    okolie: komponent(koefOkolie, MZI_VAHY.okolie),
    budovy: komponent(koefBudovy, MZI_VAHY.budovy),
    akumulacia: komponent(akumulacia === null ? null : akumulacia / 100, MZI_VAHY.akumulacia),
    odtok: komponent(odtok, MZI_VAHY.odtok),
  };

  // Skóre sa normalizuje len cez komponenty, ktoré sa dali vypočítať — chýbajúci
  // údaj tak areál nepenalizuje, len zväčší váhu ostatných komponentov.
  //
  // Počíta sa z nezaokrúhlených podielov, nie zo zobrazovaných bodov: `body` sú
  // zaokrúhlené na celé číslo pre výpis a ich chyba by sa preniesla do skóre
  // (napr. koeficient 0,7 dá v pohyblivej rádovej čiarke 31,4999… → 31 bodov
  // a skóre 69 namiesto 70).
  const dostupne = podiely.filter((p): p is { podiel: number; max: number } => p.podiel !== null);
  const bodySpolu = dostupne.reduce((acc, p) => acc + clamp01(p.podiel) * p.max, 0);
  const maxSpolu = dostupne.reduce((acc, p) => acc + p.max, 0);

  return {
    celkove: maxSpolu > 0 ? Math.round((bodySpolu / maxSpolu) * 100) : 0,
    ...komponenty,
    koefOkolie,
    koefBudovy,
    akumulaciaPercent: akumulacia,
    podielZadrzanehoOdtoku: odtok,
    stupenOkolie: koefOkolie === null ? null : stupenOkolia(koefOkolie),
    stupenBudovy: koefBudovy === null ? null : stupenBudov(koefBudovy),
    stupenAkumulacia: akumulacia === null ? null : stupenAkumulacie(akumulacia),
  };
}
