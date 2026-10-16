// Vyrobí číselník obec → okres → kraj z CSV Registra adries (MV SR).
//
//   node scripts/vyrob-ciselnik-obci.mjs <subor.csv> [<dalsi.csv> ...] [--vystup <cesta.json>]
//
// Vstup: súbory „Adresy podľa krajov (csv)“ z data.slovensko.sk (dataset
// b27f57f1-7e76-45e0-8968-631f9176b2e9, licencia CC0). Môžu to byť súbory po
// krajoch, alebo jeden súbor všetkých krajov. Oddeľovač `;`, UTF-8, hlavička
// IDENTIFIKATOR;KRAJ;OKRES;OBEC;CAST_OBCE;ULICA;...
//
// Výstup:
//  - src/data/obceSR.json: trojice [obec, okres, kraj] (okolo 2 900 riadkov);
//  - src/data/ulice/<kraj>.json: ulice podľa obce a okresu, jeden súbor na kraj
//    (okolo 28 000 dvojíc obec + ulica spolu). Aplikácia ich sťahuje až po výbere obce.
//  - public/data/adresy/<kraj>/<okres>__<obec>.json: čísla domov podľa ulice, jeden
//    súbor na obec (2 927 súborov, spolu okolo 6,7 MB). Aplikácia si stiahne súbor
//    jednej obce po výbere ulice, z vlastného servera, takže zadaný text nikam neodchádza.
// Z registra sa kopírujú len názvy ulíc a čísla domov (súpisné/orientačné), nie PSČ,
// súradnice ani identifikátory adries.
//
// Skript nič nesťahuje: súbory dostane ako parametre (odkazy na ne a postup sú
// v docs/chybajuce-hodnoty.md, sekcia Register adries). Dataset sa mení
// štvrťročne, číselník treba po vydaní obnoviť týmto skriptom.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const KOREN = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PREDVOLENY_VYSTUP = join(KOREN, 'src', 'data', 'obceSR.json');
export const PREDVOLENY_ADRESAR_ULIC = join(KOREN, 'src', 'data', 'ulice');
export const PREDVOLENY_ADRESAR_ADRIES = join(KOREN, 'public', 'data', 'adresy');

/** Názvy okresov, ktoré sa v registri píšu inak ako v `src/data/slovakLocations.ts`. */
export const ALIASY_OKRESOV = {
  'Košice - okolie': 'Košice-okolie',
};

/** Kraj v registri je bez slova „kraj“ (Banskobystrický), v aplikácii s ním. */
export function nazovKraja(kraj) {
  return kraj.endsWith(' kraj') ? kraj : `${kraj} kraj`;
}

export function nazovOkresu(okres) {
  return ALIASY_OKRESOV[okres] ?? okres;
}

/** Názov v súbore: bez diakritiky, malými písmenami, ostatné znaky ako pomlčka. */
export function slugNazvu(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Názov súboru s adresami obce: `okres__obec.json` (napr. `ruzomberok__ruzomberok.json`). */
export function nazovSuboruObce(okres, obec) {
  return `${slugNazvu(okres)}__${slugNazvu(obec)}.json`;
}

/** Číslo domu v tvare „súpisné/orientačné“, alebo jediné číslo, ak je len jedno. */
export function cisloDomu(supisne, orientacne) {
  const su = (supisne ?? '').trim();
  const o = (orientacne ?? '').trim();
  return su && o ? `${su}/${o}` : su || o;
}

/**
 * Zapíše čísla domov úsporne: čisto číselné čísla v radoch (`1-5,7,9-12`), ostatné
 * (`150/2`, `2A`) za nimi po jednom. V súbore sa nikdy nevyskytuje `,` ani `-` v čísle
 * domu (v registri sú len číslice a písmená), takže zápis je jednoznačný.
 */
export function kodujCisla(cisla) {
  const cele = [];
  const ostatne = [];
  for (const c of new Set(cisla)) {
    if (c === '') continue;
    if (/^\d+$/.test(c)) cele.push(Number(c));
    else ostatne.push(c);
  }
  cele.sort((a, b) => a - b);
  ostatne.sort((a, b) => a.localeCompare(b, 'sk', { numeric: true }));
  const casti = [];
  for (let i = 0; i < cele.length; i += 1) {
    let j = i;
    while (j + 1 < cele.length && cele[j + 1] === cele[j] + 1) j += 1;
    casti.push(i === j ? String(cele[i]) : `${cele[i]}-${cele[j]}`);
    i = j;
  }
  return [...casti, ...ostatne].join(',');
}

/** Názov súboru kraja: „Žilinský kraj“ → „zilinsky“. */
export function slugKraja(kraj) {
  return kraj
    .replace(/ kraj$/, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Rozdelí riadok CSV podľa `;` (hodnoty môžu byť v úvodzovkách). */
export function rozdelRiadok(riadok) {
  const polia = [];
  let aktualne = '';
  let vUvodzovkach = false;
  for (let i = 0; i < riadok.length; i += 1) {
    const znak = riadok[i];
    if (vUvodzovkach) {
      if (znak === '"' && riadok[i + 1] === '"') { aktualne += '"'; i += 1; }
      else if (znak === '"') vUvodzovkach = false;
      else aktualne += znak;
    } else if (znak === '"') {
      vUvodzovkach = true;
    } else if (znak === ';') {
      polia.push(aktualne);
      aktualne = '';
    } else {
      aktualne += znak;
    }
  }
  polia.push(aktualne);
  return polia;
}

/**
 * Z textu CSV vyberie jedinečné trojice [obec, okres, kraj].
 * Riadky bez obce, okresu alebo kraja sa preskočia a spočítajú.
 * Ak je zadaná mapa `ulice`, zbiera sa do nej aj zoznam ulíc: kraj → obec → okres → Set ulíc.
 * Ak je zadaná mapa `adresy`, zbierajú sa do nej aj čísla domov:
 * „kraj\0okres\0obec“ → ulica (prázdna = obec bez ulice) → Set čísel domov.
 * @returns {{ trojice: Map<string, [string, string, string]>, preskocene: number, riadkov: number }}
 */
export function spracujCsv(text, trojice = new Map(), ulice = null, adresy = null) {
  const riadky = text.replace(/^﻿/, '').split(/\r?\n/);
  const hlavicka = rozdelRiadok(riadky[0] ?? '').map((h) => h.trim().toUpperCase());
  const iKraj = hlavicka.indexOf('KRAJ');
  const iOkres = hlavicka.indexOf('OKRES');
  const iObec = hlavicka.indexOf('OBEC');
  const iUlica = hlavicka.indexOf('ULICA');
  const iSupisne = hlavicka.indexOf('SUPISNE_CISLO');
  const iOrient = hlavicka.indexOf('ORIENTACNE_CISLO_CELE');
  if (iKraj < 0 || iOkres < 0 || iObec < 0) {
    throw new Error(`V hlavičke chýba stĺpec KRAJ, OKRES alebo OBEC: ${riadky[0] ?? ''}`);
  }

  let preskocene = 0;
  let riadkov = 0;
  for (let i = 1; i < riadky.length; i += 1) {
    if (riadky[i] === '') continue;
    riadkov += 1;
    const polia = rozdelRiadok(riadky[i]);
    const kraj = (polia[iKraj] ?? '').trim();
    const okres = (polia[iOkres] ?? '').trim();
    const obec = (polia[iObec] ?? '').trim();
    if (!kraj || !okres || !obec) { preskocene += 1; continue; }
    const trojica = [obec, nazovOkresu(okres), nazovKraja(kraj)];
    trojice.set(trojica.join('\u0000'), trojica);

    const ulica = iUlica >= 0 ? (polia[iUlica] ?? '').trim() : '';
    if (adresy) {
      const cislo = cisloDomu(iSupisne >= 0 ? polia[iSupisne] : '', iOrient >= 0 ? polia[iOrient] : '');
      if (cislo) {
        const kluc = `${trojica[2]}\u0000${trojica[1]}\u0000${obec}`;
        const poUliciach = adresy.get(kluc) ?? new Map();
        const set = poUliciach.get(ulica) ?? new Set();
        set.add(cislo);
        poUliciach.set(ulica, set);
        adresy.set(kluc, poUliciach);
      }
    }
    if (ulice && ulica) {
      const [, okresNorm, krajNorm] = trojica;
      const poObciach = ulice.get(krajNorm) ?? new Map();
      const poOkresoch = poObciach.get(obec) ?? new Map();
      const set = poOkresoch.get(okresNorm) ?? new Set();
      set.add(ulica);
      poOkresoch.set(okresNorm, set);
      poObciach.set(obec, poOkresoch);
      ulice.set(krajNorm, poObciach);
    }
  }
  return { trojice, preskocene, riadkov };
}

/** Zoradí trojice podľa slovenskej abecedy: obec, potom okres. */
export function zoradTrojice(trojice) {
  const poradie = (a, b) => a.localeCompare(b, 'sk');
  return [...trojice.values()].sort((a, b) => poradie(a[0], b[0]) || poradie(a[1], b[1]));
}

/**
 * Zo zbieraných ulíc urobí objekty pripravené na zápis: kraj → { obec: { okres: [ulice] } }.
 * Obce a ulice sú zoradené podľa slovenskej abecedy, obce bez ulíc v zozname nie sú.
 */
export function zostavUlice(ulice) {
  const poradie = (a, b) => a.localeCompare(b, 'sk');
  const vystup = {};
  for (const kraj of [...ulice.keys()].sort(poradie)) {
    const obce = {};
    for (const obec of [...ulice.get(kraj).keys()].sort(poradie)) {
      const okresy = {};
      for (const okres of [...ulice.get(kraj).get(obec).keys()].sort(poradie)) {
        okresy[okres] = [...ulice.get(kraj).get(obec).get(okres)].sort(poradie);
      }
      obce[obec] = okresy;
    }
    vystup[kraj] = obce;
  }
  return vystup;
}

/**
 * Zo zbieraných čísel domov urobí súbory po obciach. Cesta súboru je `<kraj>/<okres>__<obec>.json`;
 * ak by dve obce dostali rovnakú cestu, skončí chybou (inak by si prepísali dáta).
 * @returns {{ cesta: string, obsah: Record<string, string> }[]}
 */
export function zostavAdresy(adresy) {
  const poradie = (a, b) => a.localeCompare(b, 'sk');
  const vystup = [];
  const pouzite = new Set();
  for (const kluc of [...adresy.keys()].sort(poradie)) {
    const [kraj, okres, obec] = kluc.split('\u0000');
    const cesta = `${slugKraja(kraj)}/${nazovSuboruObce(okres, obec)}`;
    if (pouzite.has(cesta)) throw new Error(`Dve obce majú rovnaký názov súboru: ${cesta} (${obec}, ${okres})`);
    pouzite.add(cesta);
    const obsah = {};
    const poUliciach = adresy.get(kluc);
    for (const ulica of [...poUliciach.keys()].sort(poradie)) {
      obsah[ulica] = kodujCisla(poUliciach.get(ulica));
    }
    vystup.push({ cesta, obsah });
  }
  return vystup;
}

/** Mesiac a rok vydania z názvu súboru (napr. „Adresy BBkraj UTF8_08_2026.csv“ → „08/2026“). */
export function vydanieZNazvu(nazov) {
  const m = nazov.match(/_(\d{2})_(\d{4})(?:\.[a-z]+)?$/i);
  return m ? `${m[1]}/${m[2]}` : null;
}

export function zostavVystup(trojice, subory) {
  return {
    zdroj: 'Register adries, Ministerstvo vnútra SR; dataset Adresy podľa krajov (csv), b27f57f1-7e76-45e0-8968-631f9176b2e9',
    licencia: 'CC0 1.0',
    subory,
    obce: zoradTrojice(trojice),
  };
}

function hlavny(argv) {
  const subory = [];
  let vystup = PREDVOLENY_VYSTUP;
  let adresarUlic = PREDVOLENY_ADRESAR_ULIC;
  let adresarAdries = PREDVOLENY_ADRESAR_ADRIES;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--vystup') { vystup = argv[i + 1]; i += 1; }
    else if (argv[i] === '--ulice') { adresarUlic = argv[i + 1]; i += 1; }
    else if (argv[i] === '--adresy') { adresarAdries = argv[i + 1]; i += 1; }
    else subory.push(argv[i]);
  }
  if (subory.length === 0) {
    console.error('Použitie: node scripts/vyrob-ciselnik-obci.mjs <subor.csv> [...] [--vystup <cesta.json>] [--ulice <adresar>] [--adresy <adresar>]');
    process.exit(1);
  }

  const trojice = new Map();
  const ulice = new Map();
  const adresy = new Map();
  const popisy = [];
  for (const cesta of subory) {
    const { preskocene, riadkov } = spracujCsv(readFileSync(cesta, 'utf8'), trojice, ulice, adresy);
    const nazov = basename(cesta);
    const vydanie = vydanieZNazvu(nazov);
    popisy.push(vydanie ? `${nazov} (${vydanie})` : nazov);
    console.log(`${nazov}: ${riadkov} riadkov, preskočených ${preskocene}`);
  }

  const dalsi = zostavVystup(trojice, popisy);
  writeFileSync(vystup, `${JSON.stringify(dalsi)}\n`);
  console.log(`Zapísaných ${dalsi.obce.length} trojíc obec + okres + kraj do ${vystup}`);

  mkdirSync(adresarUlic, { recursive: true });
  const poKrajoch = zostavUlice(ulice);
  let dvojic = 0;
  for (const [kraj, obce] of Object.entries(poKrajoch)) {
    dvojic += Object.values(obce).reduce((n, okresy) => n + Object.keys(okresy).length, 0);
    writeFileSync(join(adresarUlic, `${slugKraja(kraj)}.json`), `${JSON.stringify(obce)}\n`);
  }
  console.log(`Zapísané ulice: ${dvojic} dvojíc obec + okres do ${Object.keys(poKrajoch).length} súborov v ${adresarUlic}`);

  // Adresár s adresami sa pred zápisom vyčistí (aby nezostali súbory zaniknutých obcí),
  // ale len ak sa volá `adresy`: cudzí adresár zadaný omylom sa nikdy nemaže.
  if (basename(adresarAdries) === 'adresy') rmSync(adresarAdries, { recursive: true, force: true });
  let velkost = 0;
  const vystupneSubory = zostavAdresy(adresy);
  for (const { cesta, obsah } of vystupneSubory) {
    const cielova = join(adresarAdries, cesta);
    mkdirSync(dirname(cielova), { recursive: true });
    const text = `${JSON.stringify(obsah)}\n`;
    writeFileSync(cielova, text);
    velkost += Buffer.byteLength(text);
  }
  console.log(`Zapísané adresy: ${vystupneSubory.length} súborov (${(velkost / 1e6).toFixed(1)} MB) v ${adresarAdries}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  hlavny(process.argv.slice(2));
}
