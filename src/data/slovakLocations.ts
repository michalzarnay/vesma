import obceSR from './obceSR.json';

// Slovak administrative regions (kraje), districts (okresy), and municipalities (obce)
//
// Okresy sú ručne udržiavaný zoznam (79 okresov podľa Registra adries).
// Obce a ich okres a kraj sú v `obceSR.json`, ktorý vyrába
// `scripts/vyrob-ciselnik-obci.mjs` z Registra adries (MV SR, CC0).

export const KRAJE: string[] = [
  'Bratislavský kraj',
  'Trnavský kraj',
  'Trenčiansky kraj',
  'Nitriansky kraj',
  'Žilinský kraj',
  'Banskobystrický kraj',
  'Prešovský kraj',
  'Košický kraj',
];

export const OKRESY_BY_KRAJ: Record<string, string[]> = {
  'Bratislavský kraj': [
    'Bratislava I',
    'Bratislava II',
    'Bratislava III',
    'Bratislava IV',
    'Bratislava V',
    'Malacky',
    'Pezinok',
    'Senec',
  ],
  'Trnavský kraj': [
    'Dunajská Streda',
    'Galanta',
    'Hlohovec',
    'Piešťany',
    'Senica',
    'Skalica',
    'Trnava',
  ],
  'Trenčiansky kraj': [
    'Bánovce nad Bebravou',
    'Ilava',
    'Myjava',
    'Nové Mesto nad Váhom',
    'Partizánske',
    'Považská Bystrica',
    'Prievidza',
    'Púchov',
    'Trenčín',
  ],
  'Nitriansky kraj': [
    'Komárno',
    'Levice',
    'Nitra',
    'Nové Zámky',
    'Šaľa',
    'Topoľčany',
    'Zlaté Moravce',
  ],
  'Žilinský kraj': [
    'Bytča',
    'Čadca',
    'Dolný Kubín',
    'Kysucké Nové Mesto',
    'Liptovský Mikuláš',
    'Martin',
    'Námestovo',
    'Ružomberok',
    'Turčianske Teplice',
    'Tvrdošín',
    'Žilina',
  ],
  'Banskobystrický kraj': [
    'Banská Bystrica',
    'Banská Štiavnica',
    'Brezno',
    'Detva',
    'Krupina',
    'Lučenec',
    'Poltár',
    'Revúca',
    'Rimavská Sobota',
    'Veľký Krtíš',
    'Žiar nad Hronom',
    'Žarnovica',
    'Zvolen',
  ],
  'Prešovský kraj': [
    'Bardejov',
    'Humenné',
    'Kežmarok',
    'Levoča',
    'Medzilaborce',
    'Poprad',
    'Prešov',
    'Sabinov',
    'Snina',
    'Stará Ľubovňa',
    'Stropkov',
    'Svidník',
    'Vranov nad Topľou',
  ],
  'Košický kraj': [
    'Gelnica',
    'Košice I',
    'Košice II',
    'Košice III',
    'Košice IV',
    'Košice-okolie',
    'Michalovce',
    'Rožňava',
    'Sobrance',
    'Spišská Nová Ves',
    'Trebišov',
  ],
};

/** Obec, okres a kraj z Registra adries (pozri scripts/vyrob-ciselnik-obci.mjs). */
export type ZaznamObce = readonly [obec: string, okres: string, kraj: string];

export const OBCE_ZAZNAMY: readonly ZaznamObce[] = obceSR.obce as unknown as ZaznamObce[];

// Názvy obcí bez opakovania (95 názvov sa v registri vyskytuje vo viac okresoch).
export const OBCE_SR: string[] = Array.from(new Set(OBCE_ZAZNAMY.map(([obec]) => obec))).sort((a, b) =>
  a.localeCompare(b, 'sk')
);
