// Data model matching Excel questionnaire v2_4 structure

export interface MediaItem {
  id: string;
  nazov: string;
  typ: 'foto' | 'video';
  dataUrl: string;
  velkost: number; // bytes
  popis: string;
  datumNahratia: string;
}

export interface ScoringWeights {
  mzi: number;
  oze: number;
  energia: number;
}

export type KategoriaObjektu = 'verejny_sektor' | 'firma' | 'sukromne';

export const KATEGORIE_OBJEKTU: Array<{ value: KategoriaObjektu; label: string }> = [
  { value: 'verejny_sektor', label: 'Samospráva a verejný sektor' },
  { value: 'firma', label: 'Firma a organizácia' },
  { value: 'sukromne', label: 'Súkromný obytný objekt' },
];

export const TYP_OBJEKTU_OPTIONS: Record<KategoriaObjektu, Array<{ value: string; label: string }>> = {
  verejny_sektor: [
    { value: 'ms', label: 'Materská škola' },
    { value: 'zs', label: 'Základná škola' },
    { value: 'ss', label: 'Stredná škola' },
    { value: 'vs', label: 'Vysoká škola' },
    { value: 'zdravotnicke_stredisko', label: 'Zdravotnícke stredisko' },
    { value: 'nemocnica', label: 'Nemocnica' },
    { value: 'dss', label: 'Dom sociálnych služieb' },
    { value: 'kultura', label: 'Dom kultúry / knižnica' },
    { value: 'urad', label: 'Obecný / mestský úrad' },
    { value: 'hasicska_zbrojnica', label: 'Hasičská zbrojnica' },
    { value: 'iny_verejny', label: 'Iný verejný objekt' },
  ],
  firma: [
    { value: 'vyrobna_hala', label: 'Výrobná hala' },
    { value: 'sklad', label: 'Sklad / logistika' },
    { value: 'kancelaria', label: 'Kancelárska budova' },
    { value: 'obchod', label: 'Obchod / predajňa' },
    { value: 'gastro', label: 'Reštaurácia / kaviareň' },
    { value: 'hotel', label: 'Hotel / penzión' },
    { value: 'polnohospodarsky', label: 'Poľnohospodársky areál' },
    { value: 'ina_firma', label: 'Iná firma' },
  ],
  sukromne: [
    { value: 'rd', label: 'Rodinný dom' },
    { value: 'bd', label: 'Bytový dom' },
    { value: 'chalupa', label: 'Chalupa / rekreačný objekt' },
    { value: 'zahradna_chata', label: 'Záhradná chata' },
    { value: 'ine_sukromne', label: 'Iný súkromný objekt' },
  ],
};

export const FIRMA_TYPY_S_KAPACITOU = ['gastro', 'hotel', 'obchod'] as const;

export interface Areal {
  id: string;
  nazov: string;
  adresa: string;
  krajina: string;
  obec: string;
  /** @deprecated use kraj + okres instead */
  region: string;
  kraj: string;
  okres: string;
  mnozstvoZrazok?: number;        // mm/m2
  potencialSlnecnehoSvitu?: number; // kWh/rok

  kategoriaObjektu?: KategoriaObjektu;
  typObjektu?: string;

  // Záznam z obhliadky
  organizaciaVZriadovatelskejPobnonosti: string;
  obhliadkuVykonal: string;
  datumObhliadky: string;
  pritomnePOSOBY: string;
  kapacitaZariadenia: string;
  aktualnaObsadenost: number; // %
  pocetZamestnancov: number;

  // Závery
  zaverBG: string;
  zaverOZE: string;

  pozemky: Pozemok[];
  budovy: Budova[];
  ineStavby: InaStavba[];
  bgOpatrenia: BGOpatrenie[];
  media: MediaItem[];
  vahy: ScoringWeights;
}

export interface Pozemok {
  id: string;
  aktualneVyuzitie: string;
  parcela: string;
  listVlastnictva: string;
  celkovaVymera: number;   // m2
  plochaBezBudov: number;  // m2
  clenitosTerenu: string;

  // Odvod vody (% plochy, súčet = 100%) — 7 kategórií podľa v2_4
  odvodVodyJednotnaKanalizacia: number;  // do jednotnej stokovej siete
  odvodVodySplaskovaKanalizacia: number; // do delenej splaškovej
  odvodVodyZrazkovaKanalizacia: number;  // do delenej zrážkovej
  odvodVodyVodnyTok: number;
  odvodVodyVsakovanie: number;
  odvodVodyRetencnaNadrzou: number;      // do retenčnej nádrže
  odvodVodyNerieseny: number;
  // Legacy (pre-v2_4 backcompat — used in scoring as fallback)
  odvodVodyKanalizacia?: number;

  // Priepustna plocha
  priepustnaPlochaCelkom: number; // m2
  priepustnaPlochaHolaPoda: number; // %, skryté z formulára (issue #128) — ponechané pre kompatibilitu dát a exportu
  priepustnaPlochaByliny: number; // %
  priepustnaPlochaKry: number; // %
  priepustnaPlochaStromy: number; // %
  priepustnaPlochaZatienena: number; // %, nezadáva sa vo formulári (issue #159) — zobrazuje sa ako informatívny súčet stromov a krov

  // Polopriepustna plocha
  polopriepustnaPlochaCelkom: number; // m2
  polopriepustnaPriepustnyAsfalt: number; // %
  polopriepustnaPriepustnyBeton: number; // %
  polopriepustnaPlnevegetacneTvarnice: number; // %
  polopriepustnaPolovegetacneTvarnice: number; // %
  polopriepustnaVodopriepustnaDlazba: number; // %
  polopriepustnaZivicaKremicityStrk: number; // %
  polopriepustnaMlatovyPovrch: number; // %
  polopriepustnaStered: number; // %
  polopriepustnaInyPovrch: number; // %
  polopriepustnaVyspadovana: number; // %

  // Spevnena plocha
  spevnenaPlochaCelkom: number; // m2
  spevnenaPlochaVyspadovana: number; // %

  // Stromy
  stromyPodielMladych: number; // %
  stromyPodielNezdravych: number; // %

  // Dažďová záhrada
  dazdovaZahradaPlocha: number;        // m2
  dazdovaZahradaHlbka: number;         // cm
  dazdovaZahradaPlochaStrechy: number; // m2 odvodnená plocha strechy
  dazdovaZahradaPlochaTerenu: number;  // m2 odvodnená plocha terénu

  // Jazierko
  jazierkoPlocha: number;          // m2
  jazierkoHlbka: number;           // cm
  jazierkoPrepadRieseny: 0 | 1;
  jazierkoSmerPrepadu: string;

  // Nádrže
  nadzemneNadobyObjem: number;         // m3
  podzemneNadobyObjem: number;         // m3
  sposobVyuzitiaVody: string;
  kapacitaNadrzSebahodnotenie: 0 | 1;  // postačuje kapacita?

  // Zelená strecha na pozemkoch
  zelenaStrechaPlocha: number;                    // m2 celková
  zelenaStrechaExtenzivnaPloca: number;           // m2
  zelenaStrechaExtenzivnaSikma: number;           // m2
  zelenaStrechaIntenzivna: number;                // m2
  zelenaStrechaModrozelena: number;               // m2
  zelenaStrechaStrkova: number;                   // m2
  zelenaStenaNaPozemku: number;                   // m2

  // Vsakovacie priehlbne
  vsakovaciaPrehlbenaBezpecnostnyPrepad: number;  // m2
  vsakovaciaPrehlbenaRegulovanyOdtok: number;     // m2

  // Prekoreniteľný priestor
  prekorenetelnyPriestorPreStromy: number;        // m2

  // Potenciál OZE na pozemku (issue #184)
  plochaVhodnaPreFV: number; // m2 — plocha pozemku vhodná pre FV alebo solárne kolektory
}

export interface Budova {
  id: string;
  nazov: string;
  parcela: string;
  listVlastnictva: string;
  plochaPodorysu: number;    // m2
  uzitkovaPlochaNUS: number; // m2
  vykurovanaPlocha: number;  // m2 — vykurovaná plocha (issue #181); predvypĺňa sa z úžitkovej, 0 = použije sa úžitková
  kategoriaBudovy?: 'S' | 'M' | 'L'; // auto

  // Využitie objektu
  vyuzitieDniVRoku: number;
  vyuzitieMesiacovVRoku: number;
  vyuzitieHodinDenne: number;
  vyuzitieEnergiaPercent: number; // %

  // Ohrozenie budovy záplavami (nové v v2_4)
  povodnovoRiziko: number;                    // 1-5 (0=nezadané)
  budovaZaplavenaPoslednychRokov: 0 | 1;
  castPodTerenomBezOdcerpania: 0 | 1;
  technologickeZariadenieSuteren: 0 | 1;
  kanalizacneVpusteNadSuterenom: 0 | 1;
  potrubiaNeSpljajuNormy: 0 | 1;
  chybajuMriazkyNaVtokoch: 0 | 1;
  dazdovaKanalizaciaBezZariadenia: 0 | 1;
  pripojkaBezSpatnejKlapky: 0 | 1;
  elektrickeZariadeniaSuterenNizko: 0 | 1;
  uzaverPlynuSuteren: 0 | 1;

  // Strecha
  strechaTyp: 1 | 2 | 3; // 1=plocha, 2=sikma, 3=strma
  strechaMaterial: string;
  strechaPopisZateplenia: string;
  strechaNosnaKonstrukcia: string;
  strechaZateplenie: 0 | 1 | 2;
  strechaRokObnovy: number;
  strechaProblemy: 0 | 1;
  potencialZelenejStrechy?: number; // m2, auto
  strechaOrientovanaPlochaNaJuh: number; // m2
  fasadaOrientovanaNaJuh: number; // m2
  plochaObvodovehoPlasta: number; // m2 — celá fasáda (všetky orientácie, vrátane otvorov), issue #176; 0 = odhad z pôdorysu
  strechaTvarKrovu?: string;

  // Voda a splašky
  splaskovod: 1 | 2;
  zvodyDazdovejVody: 1 | 2;
  budovaOdvodVodyKanalizacia: number;     // %
  budovaOdvodVodyVodnyTok: number;        // %
  budovaOdvodVodyNaPozemok: number;       // %
  budovaOdvodVodyRetencnaNadrz: number;   // %
  budovaOdvodVodyNerieseny: number;       // %
  oddeleneRozvodyVody: 0 | 1;
  vyuzitieDazdovejVodyVObjekte: 0 | 1; // nové

  // Úspory energie
  obvodoveStenyMaterial: string;         // nové
  zateplenieFasady: 0 | 1 | 2;
  zateplenieFasadyMaterial: string;      // nové
  celkovaPlochaPresklenia: number;       // m2, nové
  termoizolacneOkna: number;            // %
  vekTermoizolacnychOkien: number;      // rok (vážený priemer), nové
  osvetlenieLED: number;                // %
  objemVyvetranehoPrezduchu: number;    // m3/deň, nové

  // Rekuperácia — detailná (v2_4)
  rekuperacia: 0 | 1;
  rekuperaciaCentralnaUcinnost: number;  // %
  rekuperaciaLokalnaDo75: number;        // počet
  rekuperaciaLokalnaOd76do89: number;    // počet
  rekuperaciaLokalnaOd90: number;        // počet

  // Rok, za ktorý sú uvedené ročné spotreby a náklady (issue #172); 0 = neuvedené
  spotrebaRok: number;

  // Vykurovanie - Plyn
  kurenePlynom: 0 | 1;
  kureniePlynRokInstalacie: number;
  kureniePlynVykon: number;
  kureniePlynSpotreba: number;
  kureniePlynNakladyRok: number; // EUR/rok (issue #173)

  // Vykurovanie - Elektrina
  kurenieElektrinou: 0 | 1;
  kurenieElektrinaRokInstalacie: number;
  kurenieElektrinaVykon: number;
  kurenieElektrinaSpotreba: number;
  kurenieElektrinaNakladyRok: number; // EUR/rok

  // Vykurovanie - TČ
  tepelneCerpadlo: 0 | 1;
  tepelneCerpadloRokInstalacie: number;
  tepelneCerpadloVykon: number;
  tepelneCerpadloSpotreba: number;
  tepelneCerpadloNakladyRok: number; // EUR/rok

  // Vykurovanie - Pelety
  kureniePeletami: 0 | 1;
  kureniePeletyRokInstalacie: number;
  kureniePeletyVykon: number;
  kureniePeletySpotreba_kg: number;
  kureniePeletySpotreba_kWh?: number; // auto
  kureniePeletyNakladyRok: number; // EUR/rok

  // Vykurovanie - Štiepka
  kurenieStiepkou: 0 | 1;
  kurenieStiepkaRokInstalacie: number;
  kurenieStiepkaVykon: number;
  kurenieStiepkaSpotreba_kg: number;
  kurenieStiepkaSpotreba_kWh?: number; // auto
  kurenieStiepkaNakladyRok: number; // EUR/rok

  // Vykurovanie - Uhlie/Drevo
  kurenieUhlimDrevom: 0 | 1 | 2;
  kurenieUhlimDrevomRokInstalacie: number;
  kurenieUhlimDrevomVykon: number;
  kurenieUhlimDrevomSpotreba_kg: number;
  kurenieUhlimDrevomSpotreba_kWh?: number; // auto
  kurenieUhlimDrevomNakladyRok: number; // EUR/rok

  // Vykurovanie - CZT
  kurenieCZT: 0 | 1;
  kurenieCZTSpotreba: number;
  kurenieCZTCenaKWh: number; // EUR/kWh — ročné náklady CZT sa počítajú ako spotreba × cena

  celkovaSpotreba?: number; // auto, kWh/rok — súčet všetkých zdrojov kúrenia
  celkoveNakladyKurenie?: number; // auto, EUR/rok — súčet ročných nákladov všetkých zdrojov kúrenia

  // Vykurovacie telesá
  vykurovacieTelesaDruh: string;
  termohlavice: 0 | 1;
  automatickaRegulacia: 0 | 1;
  rozdelenieDozOn: 0 | 1;
  kurenieHarmonogram: 0 | 1;

  // Povinnosti podľa § 11 ods. 1 zákona č. 321/2014 Z. z. a bodu 7 prílohy č. 1
  // vyhlášky č. 179/2015 Z. z. (issue #177). 0 = nie, 1 = áno, 2 = neviem.
  hydraulickeVyregulovanieUK: 0 | 1 | 2;  // vykurovací systém
  hydraulickeVyregulovanieTV: 0 | 1 | 2;  // rozvody teplej vody
  izolaciaRozvodov: 0 | 1 | 2;            // tepelná izolácia rozvodov tepla a TV

  // Elektrická energia
  spotrebaElektriny: number;
  spotrebaElektrinyNakladyRok: number; // EUR/rok (issue #173)
  vyrobaElektriny: number;
  fotovoltika: 0 | 1;
  fotovoltikaPlocha: number;
  bateriovyUlozisko: number;
  pocitacovaSiet: 0 | 1;

  // Celkový stav budovy (nové)
  celkovyStavBudovy: string;

  // Projektová dokumentácia
  energetickyCertifikat: 0 | 1;
  energetickyCertifikatCislo: string;
  energetickaTrieda?: string; // A0–G, voliteľné, podľa energetického certifikátu

  // Ukazovatele z energetického certifikátu (issue #170), kWh/(m²·a).
  // POZOR — je to VYPOČÍTANÁ potreba energie za normovaných podmienok užívania
  // a klímy, nie nameraná spotreba z faktúr. Obe veličiny sa vedú oddelene
  // a nesmú sa miešať do jedného ukazovateľa (pozri src/utils/energyIndicators.ts).
  certifikatPotrebaVykurovanie: number; // kWh/(m²·a)
  certifikatPotrebaTeplaVoda: number;   // kWh/(m²·a)
  certifikatPrimarnaEnergia: number;    // kWh/(m²·a)
  energetickyAudit: 0 | 1;
  energetickyAuditRok: number;
  vystavbaPred1980: 0 | 1; // rok výstavby budovy pred rokom 1980 (voliteľné)
  pd1Nazov: string; pd1Uroven: number; pd1Rok: number; pd1Forma: 1 | 2;
  pd2Nazov: string; pd2Uroven: number; pd2Rok: number; pd2Forma: 1 | 2;
  pd3Nazov: string; pd3Uroven: number; pd3Rok: number; pd3Forma: 1 | 2;

  // Zrealizovaná infraštruktúra — zelené strechy na budovách (detailné)
  zelenaStrechaPlocha: number;             // m2 celková
  zelenaStrechaBudovExtenzivnaPloca: number;
  zelenaStrechaBudovExtenzivnaSikma: number;
  zelenaStrechaBudovIntenzivna: number;
  zelenaStrechaBudovModrozelena: number;
  zelenaStrechaBudovStrkova: number;
  zelenaStenaBudov: number;
  solarnePanelyPlocha: number;

  // Merná spotreba (kWh/(m²·rok)) sa nepersistuje — počíta ju
  // src/utils/energyIndicators.ts z nameranej spotreby a vykurovanej plochy (issue #171).
}

export interface InaStavba {
  id: string;
  nazov: string;
  parcela: string;
  listVlastnictva: string;
  typStavby: string;
  popisStavby: string;
  aktualneVyuzitie: string;
  celkovaVymeraParciel: number;
  zastavanaPlocha: number;
}

export interface BGOpatrenie {
  id: string;
  nazov: string;
  naParcele: string;
  inaBudovaMimoUSK: string;
  ochrannePasma: string;
  potencialZnecistenia: string;
  hladinaPodzemnejVody: string;
  vzdialenostVodnehoToku: number;
  vplyvOchranaPredPovodniami: string;
  vplyvZranitelneSkupiny: string;
  prekazky: string;
}

// Factory functions
export function createEmptyPozemok(): Pozemok {
  return {
    id: crypto.randomUUID(),
    aktualneVyuzitie: '',
    parcela: '',
    listVlastnictva: '',
    celkovaVymera: 0,
    plochaBezBudov: 0,
    clenitosTerenu: '',
    odvodVodyJednotnaKanalizacia: 0,
    odvodVodySplaskovaKanalizacia: 0,
    odvodVodyZrazkovaKanalizacia: 0,
    odvodVodyVodnyTok: 0,
    odvodVodyVsakovanie: 0,
    odvodVodyRetencnaNadrzou: 0,
    odvodVodyNerieseny: 0,
    priepustnaPlochaCelkom: 0,
    priepustnaPlochaHolaPoda: 0,
    priepustnaPlochaByliny: 0,
    priepustnaPlochaKry: 0,
    priepustnaPlochaStromy: 0,
    priepustnaPlochaZatienena: 0,
    polopriepustnaPlochaCelkom: 0,
    polopriepustnaPriepustnyAsfalt: 0,
    polopriepustnaPriepustnyBeton: 0,
    polopriepustnaPlnevegetacneTvarnice: 0,
    polopriepustnaPolovegetacneTvarnice: 0,
    polopriepustnaVodopriepustnaDlazba: 0,
    polopriepustnaZivicaKremicityStrk: 0,
    polopriepustnaMlatovyPovrch: 0,
    polopriepustnaStered: 0,
    polopriepustnaInyPovrch: 0,
    polopriepustnaVyspadovana: 0,
    spevnenaPlochaCelkom: 0,
    spevnenaPlochaVyspadovana: 0,
    stromyPodielMladych: 0,
    stromyPodielNezdravych: 0,
    dazdovaZahradaPlocha: 0,
    dazdovaZahradaHlbka: 0,
    dazdovaZahradaPlochaStrechy: 0,
    dazdovaZahradaPlochaTerenu: 0,
    jazierkoPlocha: 0,
    jazierkoHlbka: 0,
    jazierkoPrepadRieseny: 0,
    jazierkoSmerPrepadu: '',
    nadzemneNadobyObjem: 0,
    podzemneNadobyObjem: 0,
    sposobVyuzitiaVody: '',
    kapacitaNadrzSebahodnotenie: 0,
    zelenaStrechaPlocha: 0,
    zelenaStrechaExtenzivnaPloca: 0,
    zelenaStrechaExtenzivnaSikma: 0,
    zelenaStrechaIntenzivna: 0,
    zelenaStrechaModrozelena: 0,
    zelenaStrechaStrkova: 0,
    zelenaStenaNaPozemku: 0,
    vsakovaciaPrehlbenaBezpecnostnyPrepad: 0,
    vsakovaciaPrehlbenaRegulovanyOdtok: 0,
    prekorenetelnyPriestorPreStromy: 0,
    plochaVhodnaPreFV: 0,
  };
}

export function createEmptyBudova(): Budova {
  return {
    id: crypto.randomUUID(),
    nazov: '',
    parcela: '',
    listVlastnictva: '',
    plochaPodorysu: 0,
    uzitkovaPlochaNUS: 0,
    vykurovanaPlocha: 0,
    vyuzitieDniVRoku: 0,
    vyuzitieMesiacovVRoku: 0,
    vyuzitieHodinDenne: 0,
    vyuzitieEnergiaPercent: 0,
    povodnovoRiziko: 0,
    budovaZaplavenaPoslednychRokov: 0,
    castPodTerenomBezOdcerpania: 0,
    technologickeZariadenieSuteren: 0,
    kanalizacneVpusteNadSuterenom: 0,
    potrubiaNeSpljajuNormy: 0,
    chybajuMriazkyNaVtokoch: 0,
    dazdovaKanalizaciaBezZariadenia: 0,
    pripojkaBezSpatnejKlapky: 0,
    elektrickeZariadeniaSuterenNizko: 0,
    uzaverPlynuSuteren: 0,
    strechaTyp: 1,
    strechaMaterial: '',
    strechaPopisZateplenia: '',
    strechaNosnaKonstrukcia: '',
    strechaZateplenie: 0,
    strechaRokObnovy: 0,
    strechaProblemy: 0,
    strechaOrientovanaPlochaNaJuh: 0,
    fasadaOrientovanaNaJuh: 0,
    plochaObvodovehoPlasta: 0,
    splaskovod: 1,
    zvodyDazdovejVody: 1,
    budovaOdvodVodyKanalizacia: 0,
    budovaOdvodVodyVodnyTok: 0,
    budovaOdvodVodyNaPozemok: 0,
    budovaOdvodVodyRetencnaNadrz: 0,
    budovaOdvodVodyNerieseny: 0,
    oddeleneRozvodyVody: 0,
    vyuzitieDazdovejVodyVObjekte: 0,
    obvodoveStenyMaterial: '',
    zateplenieFasady: 0,
    zateplenieFasadyMaterial: '',
    celkovaPlochaPresklenia: 0,
    termoizolacneOkna: 0,
    vekTermoizolacnychOkien: 0,
    osvetlenieLED: 0,
    objemVyvetranehoPrezduchu: 0,
    rekuperacia: 0,
    rekuperaciaCentralnaUcinnost: 0,
    rekuperaciaLokalnaDo75: 0,
    rekuperaciaLokalnaOd76do89: 0,
    rekuperaciaLokalnaOd90: 0,
    spotrebaRok: 0,
    kurenePlynom: 0,
    kureniePlynRokInstalacie: 0,
    kureniePlynVykon: 0,
    kureniePlynSpotreba: 0,
    kureniePlynNakladyRok: 0,
    kurenieElektrinou: 0,
    kurenieElektrinaRokInstalacie: 0,
    kurenieElektrinaVykon: 0,
    kurenieElektrinaSpotreba: 0,
    kurenieElektrinaNakladyRok: 0,
    tepelneCerpadlo: 0,
    tepelneCerpadloRokInstalacie: 0,
    tepelneCerpadloVykon: 0,
    tepelneCerpadloSpotreba: 0,
    tepelneCerpadloNakladyRok: 0,
    kureniePeletami: 0,
    kureniePeletyRokInstalacie: 0,
    kureniePeletyVykon: 0,
    kureniePeletySpotreba_kg: 0,
    kureniePeletyNakladyRok: 0,
    kurenieStiepkou: 0,
    kurenieStiepkaRokInstalacie: 0,
    kurenieStiepkaVykon: 0,
    kurenieStiepkaSpotreba_kg: 0,
    kurenieStiepkaNakladyRok: 0,
    kurenieUhlimDrevom: 0,
    kurenieUhlimDrevomRokInstalacie: 0,
    kurenieUhlimDrevomVykon: 0,
    kurenieUhlimDrevomSpotreba_kg: 0,
    kurenieUhlimDrevomNakladyRok: 0,
    kurenieCZT: 0,
    kurenieCZTSpotreba: 0,
    kurenieCZTCenaKWh: 0,
    vykurovacieTelesaDruh: '',
    termohlavice: 0,
    automatickaRegulacia: 0,
    rozdelenieDozOn: 0,
    kurenieHarmonogram: 0,
    hydraulickeVyregulovanieUK: 2,
    hydraulickeVyregulovanieTV: 2,
    izolaciaRozvodov: 2,
    spotrebaElektriny: 0,
    spotrebaElektrinyNakladyRok: 0,
    vyrobaElektriny: 0,
    fotovoltika: 0,
    fotovoltikaPlocha: 0,
    bateriovyUlozisko: 0,
    pocitacovaSiet: 1,
    celkovyStavBudovy: '',
    energetickyCertifikat: 0,
    energetickyCertifikatCislo: '',
    certifikatPotrebaVykurovanie: 0,
    certifikatPotrebaTeplaVoda: 0,
    certifikatPrimarnaEnergia: 0,
    energetickyAudit: 0,
    energetickyAuditRok: 0,
    vystavbaPred1980: 0,
    pd1Nazov: '', pd1Uroven: 0, pd1Rok: 0, pd1Forma: 1,
    pd2Nazov: '', pd2Uroven: 0, pd2Rok: 0, pd2Forma: 1,
    pd3Nazov: '', pd3Uroven: 0, pd3Rok: 0, pd3Forma: 1,
    zelenaStrechaPlocha: 0,
    zelenaStrechaBudovExtenzivnaPloca: 0,
    zelenaStrechaBudovExtenzivnaSikma: 0,
    zelenaStrechaBudovIntenzivna: 0,
    zelenaStrechaBudovModrozelena: 0,
    zelenaStrechaBudovStrkova: 0,
    zelenaStenaBudov: 0,
    solarnePanelyPlocha: 0,
  };
}

export function createEmptyInaStavba(): InaStavba {
  return {
    id: crypto.randomUUID(),
    nazov: '',
    parcela: '',
    listVlastnictva: '',
    typStavby: '',
    popisStavby: '',
    aktualneVyuzitie: '',
    celkovaVymeraParciel: 0,
    zastavanaPlocha: 0,
  };
}

export function createEmptyBGOpatrenie(): BGOpatrenie {
  return {
    id: crypto.randomUUID(),
    nazov: '',
    naParcele: '',
    inaBudovaMimoUSK: '',
    ochrannePasma: '',
    potencialZnecistenia: '',
    hladinaPodzemnejVody: '',
    vzdialenostVodnehoToku: 0,
    vplyvOchranaPredPovodniami: '',
    vplyvZranitelneSkupiny: '',
    prekazky: '',
  };
}

export function createEmptyAreal(): Areal {
  return {
    id: crypto.randomUUID(),
    nazov: '',
    adresa: '',
    krajina: 'Slovensko',
    obec: '',
    region: '',
    kraj: '',
    okres: '',
    organizaciaVZriadovatelskejPobnonosti: '',
    obhliadkuVykonal: '',
    datumObhliadky: '',
    pritomnePOSOBY: '',
    kapacitaZariadenia: '',
    aktualnaObsadenost: 0,
    pocetZamestnancov: 0,
    zaverBG: '',
    zaverOZE: '',
    pozemky: [createEmptyPozemok()],
    budovy: [createEmptyBudova()],
    ineStavby: [],
    bgOpatrenia: [],
    media: [],
    vahy: { mzi: 1, oze: 1, energia: 1 },
  };
}
