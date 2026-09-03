// Váhy pre porovnanie areálov — prevzaté z "VESMA_vahy pre vibe coding.xlsx"
// (hárky "MZI - spoločná dohoda" a "OZE+energetika", stav 2026-08-13).
//
// Každý parameter má getValue(areal), ktorá vráti súhrnnú hodnotu za celý areál
// (m², m³ alebo počet budov) — kritériálna funkcia potom hodnotu vynásobí váhou
// a spočíta cez všetky parametre danej oblasti/hrozby.
//
// Kladná váha = existujúci nevyužitý potenciál (problém na riešenie).
// Záporná váha = existujúce opatrenie, ktoré potenciál znižuje.
//
// POZOR — parameter vynechaný oproti zdrojovej tabuľke, lebo chýba referenčný údaj
// (pozri docs/porovnanie-arealov-zmeny.md):
//  - OZE: "Spotreba energie nad referenčnou hodnotou" (referenčná hodnota kWh/m²/rok
//    nie je nikde v aplikácii definovaná)
//
// Pripomienky energetického experta (docs/energetika-poziadavky.md, kap. D0) zapracované:
//  - FV potenciál striech iba zo striech do 15° (issue #179),
//  - nezateplená obálka z celej fasády, nie zo južnej (issue #176),
//  - plocha pozemkov vhodná pre FV s váhou 3 (issue #184),
//  - parametre viazané na budovy počítajú vykurovanú plochu (issues #180 a #181).
//
// ENERGETICKÉ VÁHY SÚ NÁVRH, NIE FINÁLNE HODNOTY (issues #180 a #182).
// Energetický expert žiadal parametre viazané na počet budov previesť na plochu.
// Prevod jednotky nemá meniť to, ako dôležitý parameter je, preto zostávajú pôvodné
// čísla (6, 6, 4, −1) a mení sa len veličina, na ktorú sa aplikujú. Až touto zmenou
// začnú tieto parametre v súčte reálne vážiť: pri počte budov prispievali jednotkami,
// kým plošné parametre tisíckami, takže boli prakticky neviditeľné.
//
// SEZÓNNE NEVYKUROVANÉ STAVBY (záhradná chata, altánok, sklad náradia) sa do
// parametrov, ktoré merajú potenciál obálky a vykurovania, nezapočítavajú —
// zateplovať ani obnovovať zdroj tepla tam, kde sa nekúri, nedáva zmysel a areál
// by tým dostal potenciál, ktorý nikto nebude realizovať. Týka sa to parametrov
// "nezateplená obálka", "prechod na TČ/biomasu" (plyn aj elektrina), "výstavba
// pred 1980" a im zodpovedajúcich odpočtov existujúcich riešení (zateplenie, TČ).
// Naopak plocha strechy pre FV, plocha pozemku pre FV a osvetlenie sa počítajú
// zo všetkých budov — so sezónnosťou nesúvisia (pozri src/utils/sezonnaStavba.ts).
//
// Nový parameter "prechod plyn → biomasa" má váhu 3, teda polovicu váhy prechodu na
// tepelné čerpadlo. Dôvod: ide o alternatívnu cestu pre tie isté budovy, nie o ďalší
// nezávislý potenciál — plocha plynom kúrenej budovy sa započíta do oboch parametrov.
// Nižšia váha to má kompenzovať. Expert obe hodnoty doladí.

import { Areal, Budova, Pozemok } from '../types/areal';
import { Hrozba } from '../types/comparison';
import { getPlochaObvodovehoPlasta, getPlochaStrechyPreFV, getVykurovanaPlocha } from '../utils/calculations';
import { prikonLedOsvetleniaW, prikonNieLedOsvetleniaW } from '../utils/lighting';
import { sumVykurovanych } from '../utils/sezonnaStavba';

export interface MziParameter {
  key: string;
  nazov: string;
  vahy: Record<Hrozba, number>;
  getValue: (areal: Areal) => number;
}

export interface EnergiaParameter {
  key: string;
  nazov: string;
  vaha: number;
  getValue: (areal: Areal) => number;
}

function sum<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((acc, item) => acc + fn(item), 0);
}

function plochaPozemku(p: Pozemok): number {
  return p.plochaBezBudov || p.celkovaVymera;
}

/**
 * Plocha budovy použitá pri energetických parametroch viazaných na vykurovanie.
 *
 * Energetický expert žiada „celkovú úžitkovú plochu/vykurovanú" (issue #180).
 * Používa sa vykurovaná plocha (issue #181); ak nie je vyplnená, úžitková.
 */
function plochaBudovy(b: Budova): number {
  return getVykurovanaPlocha(b);
}

/** Rovnaká podmienka ako v useScoring.ts calculateMZIPotencial — strecha, ktorú treba obnoviť. */
function trebaNovuStrechu(b: Budova): boolean {
  return (b.strechaTyp === 1 || b.strechaTyp === 2) && (b.strechaZateplenie === 0 || b.strechaProblemy === 1);
}

export const MZI_PARAMETERS: MziParameter[] = [
  {
    key: 'pozemky_odvod_kanalizacia',
    nazov: 'Odvod vody z nepriepustných pozemkov do kanalizácie sa zachytí na pozemku',
    vahy: { sucho: 7, horucavy: 5, voda: 10 },
    getValue: (areal) => sum(areal.pozemky, (p) => {
      const podielKanalizacia = (p.odvodVodyJednotnaKanalizacia + p.odvodVodySplaskovaKanalizacia + p.odvodVodyZrazkovaKanalizacia) / 100;
      return plochaPozemku(p) * podielKanalizacia;
    }),
  },
  {
    key: 'pozemky_odvod_vodny_tok',
    nazov: 'Odvod vody z nepriepustných pozemkov do vodného toku sa zachytí na pozemku',
    vahy: { sucho: 7, horucavy: 4, voda: 10 },
    getValue: (areal) => sum(areal.pozemky, (p) => plochaPozemku(p) * (p.odvodVodyVodnyTok / 100)),
  },
  {
    key: 'pozemky_mlade_stromy_potencial',
    nazov: 'Na lúku, prípadne namiesto krov sa vysadia mladé stromy',
    vahy: { sucho: 2, horucavy: 6, voda: 4 },
    // Pravidelne obrábaná pôda (hriadky, záhony, polia) sa nezapočítava — stromy sa
    // na ňu spravidla nesadia, započítanie by nadhodnotilo potenciál areálu (#196).
    getValue: (areal) => sum(areal.pozemky, (p) =>
      p.priepustnaPlochaCelkom * ((p.priepustnaPlochaByliny + p.priepustnaPlochaKry) / 100)
    ),
  },
  {
    key: 'pozemky_nahrada_poskodenych_stromov',
    nazov: 'Náhrada poškodených stromov mladými',
    vahy: { sucho: 2, horucavy: 6, voda: 4 },
    getValue: (areal) => sum(areal.pozemky, (p) =>
      p.priepustnaPlochaCelkom * (p.priepustnaPlochaStromy / 100) * (p.stromyPodielNezdravych / 100)
    ),
  },
  {
    key: 'pozemky_existujuci_sad',
    nazov: 'Sad stromov v dobrom stave — existujúci (celková plocha stromov)',
    vahy: { sucho: -4, horucavy: -8, voda: -6 },
    getValue: (areal) => sum(areal.pozemky, (p) => p.priepustnaPlochaCelkom * (p.priepustnaPlochaStromy / 100)),
  },
  {
    key: 'pozemky_dazdova_zahrada',
    nazov: 'Dažďová záhrada — existujúca',
    vahy: { sucho: -6, horucavy: -4, voda: -10 },
    getValue: (areal) => sum(areal.pozemky, (p) => p.dazdovaZahradaPlocha),
  },
  {
    key: 'pozemky_jazierko',
    nazov: 'Jazierko — existujúce',
    vahy: { sucho: -4, horucavy: -6, voda: -6 },
    getValue: (areal) => sum(areal.pozemky, (p) => p.jazierkoPlocha),
  },
  {
    key: 'pozemky_nadzemne_nadrze',
    nazov: 'Nadzemné nádrže — existujúce',
    vahy: { sucho: -10, horucavy: 0, voda: -8 },
    getValue: (areal) => sum(areal.pozemky, (p) => p.nadzemneNadobyObjem),
  },
  {
    key: 'pozemky_podzemne_nadrze',
    nazov: 'Podzemné nádrže — existujúce',
    vahy: { sucho: -10, horucavy: 0, voda: -10 },
    getValue: (areal) => sum(areal.pozemky, (p) => p.podzemneNadobyObjem),
  },
  {
    key: 'pozemky_zelena_strecha',
    nazov: 'Zelená strecha na pozemkoch — existujúca',
    vahy: { sucho: 0, horucavy: -3, voda: -6 },
    getValue: (areal) => sum(areal.pozemky, (p) => p.zelenaStrechaPlocha),
  },
  {
    key: 'budovy_strecha_na_obnovu',
    nazov: 'Strecha vhodná na obnovu',
    vahy: { sucho: 0, horucavy: 6, voda: 8 },
    getValue: (areal) => sum(areal.budovy, (b) => trebaNovuStrechu(b) ? Math.max(0, b.plochaPodorysu - b.zelenaStrechaPlocha) : 0),
  },
  {
    key: 'budovy_odvod_kanalizacia',
    nazov: 'Odvod vody zo striech budov do kanalizácie sa zachytí na pozemku',
    vahy: { sucho: 10, horucavy: 5, voda: 8 },
    getValue: (areal) => sum(areal.budovy, (b) => b.plochaPodorysu * (b.budovaOdvodVodyKanalizacia / 100)),
  },
  {
    key: 'budovy_odvod_vodny_tok',
    nazov: 'Odvod vody zo striech budov do vodného toku sa zachytí na pozemku',
    vahy: { sucho: 10, horucavy: 4, voda: 8 },
    getValue: (areal) => sum(areal.budovy, (b) => b.plochaPodorysu * (b.budovaOdvodVodyVodnyTok / 100)),
  },
  {
    key: 'budovy_odvod_nerieseny',
    nazov: 'Odvod vody zo striech budov neriešený sa zachytí na pozemku',
    vahy: { sucho: 5, horucavy: 3, voda: 6 },
    getValue: (areal) => sum(areal.budovy, (b) => b.plochaPodorysu * (b.budovaOdvodVodyNerieseny / 100)),
  },
  {
    key: 'budovy_zelena_strecha',
    nazov: 'Zelená strecha na budovách — existujúca',
    vahy: { sucho: 0, horucavy: -4, voda: -6 },
    getValue: (areal) => sum(areal.budovy, (b) => b.zelenaStrechaPlocha),
  },
];

export const ENERGIA_PARAMETERS: EnergiaParameter[] = [
  {
    key: 'energia_pozemky_fv',
    nazov: 'Plocha pozemkov vhodná pre FV alebo solárne kolektory',
    vaha: 3,
    getValue: (areal) => sum(areal.pozemky, (p) => p.plochaVhodnaPreFV),
  },
  {
    key: 'energia_strecha_fv',
    nazov: 'Plocha striech vhodných pre FV (iba plochá / málo šikmá strecha do 15°)',
    vaha: 10,
    getValue: (areal) => sum(areal.budovy, getPlochaStrechyPreFV),
  },
  {
    key: 'energia_nezateplena_obalka',
    nazov: 'Nezateplená fasáda alebo strecha budovy',
    vaha: 8,
    getValue: (areal) => sumVykurovanych(areal.budovy, (b) => {
      const strecha = b.strechaZateplenie === 0 ? b.plochaPodorysu : b.strechaZateplenie === 2 ? b.plochaPodorysu * 0.5 : 0;
      const plocha = getPlochaObvodovehoPlasta(b);
      const fasada = b.zateplenieFasady === 0 ? plocha : b.zateplenieFasady === 2 ? plocha * 0.5 : 0;
      return strecha + fasada;
    }),
  },
  {
    key: 'energia_plyn_potencial_tc',
    nazov: 'Vykurovanie plynom → potenciál prechodu na tepelné čerpadlo (m² plochy budov)',
    vaha: 6,
    getValue: (areal) => sumVykurovanych(areal.budovy, (b) => (b.kurenePlynom === 1 && b.tepelneCerpadlo === 0) ? plochaBudovy(b) : 0),
  },
  {
    key: 'energia_plyn_potencial_biomasa',
    nazov: 'Vykurovanie plynom → potenciál prechodu na biomasu (pelety/štiepka, m² plochy budov)',
    vaha: 3,
    getValue: (areal) => sumVykurovanych(areal.budovy, (b) =>
      (b.kurenePlynom === 1 && b.kureniePeletami === 0 && b.kurenieStiepkou === 0) ? plochaBudovy(b) : 0
    ),
  },
  {
    key: 'energia_elektrina_potencial_tc',
    nazov: 'Vykurovanie elektrinou (priamotopy) → potenciál tepelného čerpadla (m² plochy budov)',
    vaha: 6,
    getValue: (areal) => sumVykurovanych(areal.budovy, (b) => (b.kurenieElektrinou === 1 && b.tepelneCerpadlo === 0) ? plochaBudovy(b) : 0),
  },
  {
    key: 'energia_vystavba_pred_1980',
    nazov: 'Rok výstavby pred rokom 1980 (m² plochy budov)',
    vaha: 4,
    getValue: (areal) => sumVykurovanych(areal.budovy, (b) => b.vystavbaPred1980 === 1 ? plochaBudovy(b) : 0),
  },
  // Osvetlenie (issue #183) — veličinou je odhad inštalovaného príkonu vo wattoch,
  // nie m² úžitkovej plochy. Podiel LED sa berie z počtu svietidiel, keď je zadaný,
  // inak z percenta. Príkon odhaduje konfiguračná tabuľka W/m² podľa typu objektu
  // (src/data/lightingPowerDensity.ts).
  //
  // PREPOČET VÁHY podľa novej veličiny: pôvodná váha 3 platila pre m². Pri
  // predvolenej hustote 6 W/m² je hodnota parametra šesťnásobná, preto 3 ÷ 6 = 0,5.
  // Vplyv parametra na poradie areálov teda ostáva rovnaký ako predtým;
  // zmenila sa jednotka, nie dôležitosť. Na doladenie expertom.
  {
    key: 'energia_osvetlenie_nie_led',
    nazov: 'Osvetlenie nie-LED → potenciál výmeny (odhad inštalovaného príkonu, W)',
    vaha: 0.5,
    getValue: (areal) => sum(areal.budovy, (b) => prikonNieLedOsvetleniaW(b, areal.typObjektu)),
  },
  {
    key: 'energia_odratat_fv',
    nazov: 'Odrátať existujúce riešenia: FV inštalácia',
    vaha: -2,
    getValue: (areal) => sum(areal.budovy, (b) => b.fotovoltikaPlocha),
  },
  {
    key: 'energia_odratat_zateplenie',
    nazov: 'Odrátať existujúce riešenia: zateplenie fasády/strechy',
    vaha: -2,
    getValue: (areal) => sumVykurovanych(areal.budovy, (b) => {
      const strecha = b.strechaZateplenie === 1 ? b.plochaPodorysu : b.strechaZateplenie === 2 ? b.plochaPodorysu * 0.5 : 0;
      const plocha = getPlochaObvodovehoPlasta(b);
      const fasada = b.zateplenieFasady === 1 ? plocha : b.zateplenieFasady === 2 ? plocha * 0.5 : 0;
      return strecha + fasada;
    }),
  },
  {
    key: 'energia_odratat_tc',
    nazov: 'Odrátať existujúce riešenia: tepelné čerpadlo (m² plochy budov)',
    vaha: -1,
    getValue: (areal) => sumVykurovanych(areal.budovy, (b) => b.tepelneCerpadlo === 1 ? plochaBudovy(b) : 0),
  },
  {
    // Prepočet váhy rovnako ako pri parametri vyššie: −1 ÷ 6 W/m² ≈ −0,17.
    key: 'energia_odratat_led',
    nazov: 'Odrátať existujúce riešenia: LED osvetlenie (odhad inštalovaného príkonu, W)',
    vaha: -0.17,
    getValue: (areal) => sum(areal.budovy, (b) => prikonLedOsvetleniaW(b, areal.typObjektu)),
  },
];
