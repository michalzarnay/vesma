// Export Výsledkov do PDF — vo formáte a dizajne karty Výsledky.
//
// PDF nesie všetko, čo karta: hlavičku, legendu skratiek, ukazovatele skóre
// (celkové aj po oblastiach, váhy), radar, rozpis komponentov s vysvetleniami,
// energetické ukazovatele, zadané entity, médiá a všetky odporúčané opatrenia
// s detailom. Obsah sa skladá z rovnakých dát ako karta (`vysledkyPrehlad.ts`),
// aby sa PDF a karta nerozišli.
//
// Písmo: štandardné fonty jsPDF nemajú slovenskú diakritiku, preto sa do PDF
// vkladá DejaVu Sans (`public/fonts`, zúžené na latinku a bežné symboly —
// rozsahy sú v `ROZSAHY_PISMA`). Znak mimo rozsahu by sa vykreslil ako prázdny
// štvorček; test hlási každý text, ktorý by taký znak obsahoval.

import type { jsPDF, GState } from 'jspdf';
import { Areal } from '../types/areal';
import { ScoreResult, getScoreLevel } from '../types/scoring';
import { Odporucanie } from '../types/catalog';
import { UPOZORNENIE_ROZSAH_HODNOTENIA } from '../data/constants';
import { computeArealEnPI } from './energyIndicators';
import {
  NAZOV_OBLASTI_DLHY, SKRATKY, VYSVETLENIE_OZE_BEZ_BUDOV, fmtNum, kartyDetailuSkore, skupinyPrehladu,
  textVah, vysvetlenieEnergetikaNehodnotena, zakladVysledkov,
} from './vysledkyPrehlad';

/** Rozsahy Unicode, ktoré obsahuje vložené písmo (musia sedieť s `public/fonts`). */
export const ROZSAHY_PISMA: Array<[number, number]> = [
  [0x20, 0x7e], [0xa0, 0x17f], [0x2000, 0x206f], [0x20ac, 0x20ac],
  [0x2190, 0x21ff], [0x2200, 0x22ff], [0x25a0, 0x25ff], [0x2713, 0x2714],
];

export function jeVPisme(znak: string): boolean {
  const kod = znak.codePointAt(0) ?? 0;
  return kod === 0x0a || ROZSAHY_PISMA.some(([od, do_]) => kod >= od && kod <= do_);
}

/** Zdroje, ktoré PDF potrebuje: písmo s diakritikou a voliteľne logo. */
export interface ZdrojePdf {
  pismoNormal: string; // base64 TTF
  pismoBold: string;   // base64 TTF
  logoDataUrl?: string;
}

// --- Rozloženie strany (mm) ---
const SIRKA = 210;
const VYSKA = 297;
const OKRAJ = 15;
const SIRKA_OBSAHU = SIRKA - 2 * OKRAJ;
const SPODOK = VYSKA - 20; // pod touto čiarou je päta strany
const PAD = 4;
const IW = SIRKA_OBSAHU - 2 * PAD; // šírka obsahu v bloku

// --- Farby karty (Tailwind) ---
const AKCENT = '#52A8DE';
const G800 = '#1F2937';
const G700 = '#374151';
const G600 = '#4B5563';
const G500 = '#6B7280';
const G400 = '#9CA3AF';
const G200 = '#E5E7EB';
const G100 = '#F3F4F6';
const G50 = '#F9FAFB';

const FONT = 'DejaVu';
const PT = 0.3528; // mm na bod

type Typ = 'normal' | 'bold';

/** Prvok rozloženia: výška je známa vopred, aby sa blok vedel zalomiť na novú stranu. */
interface Prvok {
  h: number;
  kresli: (x: number, y: number) => void;
}

interface Ctx {
  doc: jsPDF;
  GState: typeof GState;
  y: number;
}

const vyskaRiadku = (size: number) => size * PT * 1.4;

function nastav(doc: jsPDF, size: number, typ: Typ = 'normal', farba = G700) {
  doc.setFont(FONT, typ);
  doc.setFontSize(size);
  doc.setTextColor(farba);
}

/** Zalomí text na šírku; `prvaSirka` je šírka prvého riadku (za nadpisom na tom istom riadku). */
function zalom(doc: jsPDF, text: string, sirka: number, prvaSirka = sirka): string[] {
  const riadky: string[] = [];
  for (const odsek of text.split('\n')) {
    let aktualny = '';
    let limit = riadky.length === 0 ? prvaSirka : sirka;
    for (const slovo of odsek.split(' ')) {
      const skus = aktualny ? `${aktualny} ${slovo}` : slovo;
      if (aktualny && doc.getTextWidth(skus) > limit) {
        riadky.push(aktualny);
        aktualny = slovo;
        limit = sirka;
      } else {
        aktualny = skus;
      }
    }
    riadky.push(aktualny);
  }
  return riadky;
}

// --- Prvky ---

function txt(
  doc: jsPDF, text: string, w: number,
  o: { size?: number; typ?: Typ; farba?: string; zarovnanie?: 'left' | 'center' | 'right' } = {},
): Prvok {
  const { size = 9, typ = 'normal', farba = G700, zarovnanie = 'left' } = o;
  nastav(doc, size, typ, farba);
  const riadky = zalom(doc, text, w);
  const lh = vyskaRiadku(size);
  return {
    h: riadky.length * lh,
    kresli: (x, y) => {
      nastav(doc, size, typ, farba);
      const px = zarovnanie === 'center' ? x + w / 2 : zarovnanie === 'right' ? x + w : x;
      riadky.forEach((r, i) => doc.text(r, px, y + i * lh, { baseline: 'top', align: zarovnanie }));
    },
  };
}

/** Riadok „názov vľavo, hodnota vpravo" — hodnota sa nezalamuje. */
function dvaStlpce(
  doc: jsPDF, vlavo: string, vpravo: string, w: number,
  o: { size?: number; farbaVlavo?: string; farbaVpravo?: string; typVpravo?: Typ } = {},
): Prvok {
  const { size = 8.5, farbaVlavo = G600, farbaVpravo = G800, typVpravo = 'bold' } = o;
  nastav(doc, size, typVpravo);
  const sirkaVpravo = doc.getTextWidth(vpravo);
  const l = txt(doc, vlavo, Math.max(20, w - sirkaVpravo - 3), { size, farba: farbaVlavo });
  return {
    h: l.h,
    kresli: (x, y) => {
      l.kresli(x, y);
      nastav(doc, size, typVpravo, farbaVpravo);
      doc.text(vpravo, x + w, y, { baseline: 'top', align: 'right' });
    },
  };
}

function pruh(doc: jsPDF, podiel: number, farba: string, w: number): Prvok {
  const h = 1.6;
  const pas = (x: number, y: number, sirka: number, f: string) => {
    doc.setFillColor(f);
    doc.roundedRect(x, y, sirka, h, h / 2, h / 2, 'F');
  };
  return {
    h: h + 0.8,
    kresli: (x, y) => {
      pas(x, y, w, G200);
      if (podiel > 0) pas(x, y, Math.max(h, w * podiel), farba);
    },
  };
}

function zvisle(prvky: Prvok[], medzeraMedzi = 1.5): { h: number; kresli: (x: number, y: number) => void } {
  const h = prvky.reduce((s, p) => s + p.h, 0) + Math.max(0, prvky.length - 1) * medzeraMedzi;
  return {
    h,
    kresli: (x, y) => {
      let yy = y;
      for (const p of prvky) {
        p.kresli(x, yy);
        yy += p.h + medzeraMedzi;
      }
    },
  };
}

// --- Strany a bloky ---

function nova(ctx: Ctx) {
  ctx.doc.addPage();
  ctx.y = OKRAJ;
}

function zabezpec(ctx: Ctx, h: number) {
  if (ctx.y + h > SPODOK) nova(ctx);
}

/**
 * Blok s pozadím a okrajom (karta). Ak sa nezmestí na zvyšok strany, začne na
 * novej; ak je vyšší než celá strana, pretečie bez pozadia po prvkoch.
 */
function blok(
  ctx: Ctx, prvky: Prvok[],
  o: { fill?: string; border?: string; medzeraMedzi?: number } = {},
) {
  const { fill, border, medzeraMedzi = 1.5 } = o;
  const obsah = zvisle(prvky, medzeraMedzi);
  const celkom = obsah.h + 2 * PAD;
  if (celkom <= SPODOK - OKRAJ) {
    zabezpec(ctx, celkom);
    const d = ctx.doc;
    if (fill) d.setFillColor(fill);
    if (border) { d.setDrawColor(border); d.setLineWidth(0.25); }
    if (fill || border) d.roundedRect(OKRAJ, ctx.y, SIRKA_OBSAHU, celkom, 3, 3, fill && border ? 'FD' : fill ? 'F' : 'S');
    obsah.kresli(OKRAJ + PAD, ctx.y + PAD);
    ctx.y += celkom + 4;
    return;
  }
  for (const p of prvky) {
    zabezpec(ctx, p.h);
    p.kresli(OKRAJ + PAD, ctx.y);
    ctx.y += p.h + medzeraMedzi;
  }
  ctx.y += 4;
}

function nadpisSekcie(ctx: Ctx, text: string, dalsi = 0) {
  const p = txt(ctx.doc, text, SIRKA_OBSAHU, { size: 11, typ: 'bold', farba: G800 });
  // Nadpis nesmie zostať sám na konci strany.
  zabezpec(ctx, p.h + 3 + dalsi);
  p.kresli(OKRAJ, ctx.y);
  ctx.y += p.h + 3;
}

// --- Grafika ---

/** Polkruhový ukazovateľ skóre ako `ScoreGauge` na karte; vráti výšku. */
function ukazovatel(
  ctx: Ctx, cx: number, y: number, skore: number, nadpis: string,
  velkost: { r: number; lw: number; cislo: number; nadpis: number; sirka: number },
): number {
  const d = ctx.doc;
  const { color, label } = getScoreLevel(skore);
  const { r, lw } = velkost;
  const cy = y + r + lw / 2;
  const oblukDo = (podiel: number, farba: string) => {
    d.setDrawColor(farba);
    d.setLineWidth(lw);
    d.setLineCap('round');
    const kroky = Math.max(2, Math.round(60 * podiel));
    let px = cx - r;
    let py = cy;
    for (let i = 1; i <= kroky; i++) {
      const uhol = Math.PI + Math.PI * podiel * (i / kroky);
      const nx = cx + r * Math.cos(uhol);
      const ny = cy + r * Math.sin(uhol);
      d.line(px, py, nx, ny);
      px = nx;
      py = ny;
    }
  };
  oblukDo(1, G200);
  if (skore > 0) oblukDo(Math.min(1, skore / 100), color);
  d.setLineCap('butt');

  nastav(d, velkost.cislo, 'bold', color);
  d.text(String(Math.round(skore)), cx, cy - r * 0.3, { align: 'center', baseline: 'middle' });
  nastav(d, 7, 'normal', G500);
  d.text('zo 100', cx, cy + 1.5, { align: 'center', baseline: 'top' });

  const nad = txt(d, nadpis, velkost.sirka, { size: velkost.nadpis, typ: 'bold', farba: G800, zarovnanie: 'center' });
  nad.kresli(cx - velkost.sirka / 2, cy + 7);
  const uroven = txt(d, label, velkost.sirka, { size: 8, farba: color, zarovnanie: 'center' });
  uroven.kresli(cx - velkost.sirka / 2, cy + 7 + nad.h + 0.5);
  return cy + 7 + nad.h + 0.5 + uroven.h - y;
}

/** Rámček „nehodnotí sa" namiesto ukazovateľa — ako `OblastNehodnotena` na karte. */
function nehodnotena(ctx: Ctx, x: number, y: number, w: number, nazov: string, vysvetlenie: string): number {
  const d = ctx.doc;
  const prvky = [
    txt(d, nazov, w - 2 * 3, { size: 9, typ: 'bold', farba: G700, zarovnanie: 'center' }),
    txt(d, 'nehodnotí sa', w - 2 * 3, { size: 9, farba: G500, zarovnanie: 'center' }),
    txt(d, vysvetlenie, w - 2 * 3, { size: 7, farba: G500, zarovnanie: 'center' }),
  ];
  const obsah = zvisle(prvky, 1.2);
  const h = obsah.h + 6;
  d.setFillColor(G50);
  d.setDrawColor(G200);
  d.setLineWidth(0.25);
  d.roundedRect(x, y, w, h, 3, 3, 'FD');
  obsah.kresli(x + 3, y + 3);
  return h;
}

/** Radar „Porovnanie oblastí" — mriežka, osi a vyplnený mnohouholník ako na karte. */
function radar(ctx: Ctx, body: Array<{ subject: string; value: number }>) {
  const d = ctx.doc;
  const vyska = 82;
  zabezpec(ctx, vyska);
  d.setFillColor(G50);
  d.roundedRect(OKRAJ, ctx.y, SIRKA_OBSAHU, vyska, 3, 3, 'F');
  nastav(d, 10, 'bold', G700);
  d.text('Porovnanie oblastí', OKRAJ + SIRKA_OBSAHU / 2, ctx.y + 5, { align: 'center', baseline: 'top' });

  const cx = OKRAJ + SIRKA_OBSAHU / 2;
  const cy = ctx.y + 46;
  const R = 26;
  const n = body.length;
  const bod = (i: number, podiel: number): [number, number] => {
    const uhol = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + R * podiel * Math.cos(uhol), cy + R * podiel * Math.sin(uhol)];
  };
  const mnohouholnik = (podiely: number[], styl: 'S' | 'F') => {
    const [x0, y0] = bod(0, podiely[0]);
    const vektory: number[][] = [];
    let px = x0;
    let py = y0;
    for (let i = 1; i < n; i++) {
      const [nx, ny] = bod(i, podiely[i]);
      vektory.push([nx - px, ny - py]);
      px = nx;
      py = ny;
    }
    d.lines(vektory, x0, y0, [1, 1], styl, true);
  };

  d.setDrawColor('#CCCCCC');
  d.setLineWidth(0.2);
  for (let k = 1; k <= 5; k++) mnohouholnik(body.map(() => k / 5), 'S');
  for (let i = 0; i < n; i++) {
    const [x, y] = bod(i, 1);
    d.line(cx, cy, x, y);
  }
  const podiely = body.map((b) => Math.max(0, Math.min(1, b.value / 100)));
  d.setFillColor(AKCENT);
  d.setGState(new ctx.GState({ opacity: 0.3 }));
  mnohouholnik(podiely, 'F');
  d.setGState(new ctx.GState({ opacity: 1 }));
  d.setDrawColor(AKCENT);
  d.setLineWidth(0.6);
  mnohouholnik(podiely, 'S');

  nastav(d, 9, 'normal', G700);
  body.forEach((b, i) => {
    const uhol = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const lx = cx + (R + 5) * Math.cos(uhol);
    const ly = cy + (R + 5) * Math.sin(uhol);
    const zarovnanie = Math.abs(Math.cos(uhol)) < 0.3 ? 'center' : Math.cos(uhol) > 0 ? 'left' : 'right';
    d.text(`${b.subject} (${Math.round(b.value)})`, lx, ly, { align: zarovnanie, baseline: 'middle' });
  });
  ctx.y += vyska + 4;
}

// --- Sekcie ---

function hlavicka(ctx: Ctx, areal: Areal, zdroje: ZdrojePdf) {
  const d = ctx.doc;
  const y = ctx.y;
  // Ikona ako na karte: svetlomodrý štvorec s troma stĺpcami grafu.
  d.setFillColor('#EAF4FB');
  d.roundedRect(OKRAJ, y, 11, 11, 3, 3, 'F');
  d.setFillColor(AKCENT);
  d.rect(OKRAJ + 2.6, y + 5.5, 1.6, 3.2, 'F');
  d.rect(OKRAJ + 5.2, y + 2.8, 1.6, 5.9, 'F');
  d.rect(OKRAJ + 7.8, y + 4.2, 1.6, 4.5, 'F');

  nastav(d, 15, 'bold', G800);
  d.text('Výsledky hodnotenia', OKRAJ + 14, y - 0.5, { baseline: 'top' });
  nastav(d, 8, 'normal', G500);
  d.text(`${areal.nazov ? `${areal.nazov} – ` : ''}Celkové skóre a odporúčané opatrenia`, OKRAJ + 14, y + 7, { baseline: 'top' });

  if (zdroje.logoDataUrl) {
    try {
      const p = d.getImageProperties(zdroje.logoDataUrl);
      const w = 30;
      const h = (w * p.height) / p.width;
      d.addImage(zdroje.logoDataUrl, p.fileType, SIRKA - OKRAJ - w, y + 5.5 - h / 2, w, h);
    } catch { /* logo je ozdoba — bez neho sa PDF vytvorí tiež */ }
  }
  ctx.y = y + 15;
  d.setDrawColor(G100);
  d.setLineWidth(0.3);
  d.line(OKRAJ, ctx.y, SIRKA - OKRAJ, ctx.y);
  ctx.y += 4;

  const meta = [
    areal.nazov && `Areál: ${areal.nazov}`,
    (areal.adresa || areal.obec) && `Adresa: ${[areal.adresa, areal.obec].filter(Boolean).join(', ')}`,
    `Dátum: ${new Date().toLocaleDateString('sk')}`,
  ].filter((m): m is string => Boolean(m));
  for (const m of meta) {
    const p = txt(d, m, SIRKA_OBSAHU, { size: 9, farba: G600 });
    p.kresli(OKRAJ, ctx.y);
    ctx.y += p.h + 0.8;
  }
  ctx.y += 3;
}

function legenda(ctx: Ctx) {
  const d = ctx.doc;
  const sirkaStlpca = IW / 3;
  const polozky = SKRATKY.map((s) => ({ s, text: `– ${s.popis}` }));
  const riadky = Math.ceil(polozky.length / 3);
  const lh = vyskaRiadku(7.5);
  const prvky: Prvok[] = [
    txt(d, 'Vysvetlenie skratiek', IW, { size: 9, typ: 'bold', farba: G700 }),
    {
      h: riadky * lh,
      kresli: (x, y) => {
        polozky.forEach(({ s, text }, i) => {
          const px = x + (i % 3) * sirkaStlpca;
          const py = y + Math.floor(i / 3) * lh;
          nastav(d, 7.5, 'bold', G600);
          d.text(s.skratka, px, py, { baseline: 'top' });
          const sk = d.getTextWidth(`${s.skratka} `);
          nastav(d, 7.5, 'normal', G600);
          d.text(text, px + sk, py, { baseline: 'top', maxWidth: sirkaStlpca - sk - 2 });
        });
      },
    },
  ];
  blok(ctx, prvky, { border: G200 });
}

function ukazovatele(ctx: Ctx, areal: Areal, score: ScoreResult) {
  const zaklad = zakladVysledkov(areal, score);
  const d = ctx.doc;

  // Celkové skóre (vážené)
  const textVahy = textVah(areal.vahy, zaklad);
  const vahy = textVahy ? txt(d, textVahy, 100, { size: 8, farba: G400, zarovnanie: 'center' }) : null;
  const lg = { r: 28, lw: 5, cislo: 30, nadpis: 11, sirka: 100 };
  zabezpec(ctx, 70);
  const hLg = ukazovatel(ctx, SIRKA / 2, ctx.y, zaklad.vazeneSkore, 'Celkové skóre (vážené)', lg);
  let vyska = hLg;
  if (vahy) {
    vahy.kresli(SIRKA / 2 - 50, ctx.y + hLg + 1);
    vyska += vahy.h + 1;
  }
  ctx.y += vyska + 7;

  // Skóre po oblastiach
  const md = { r: 16, lw: 3.5, cislo: 20, nadpis: 9, sirka: 54 };
  const bunky: Array<(x: number, y: number) => number> = [];
  if (zaklad.ukazVodu) {
    bunky.push((cx, y) => ukazovatel(ctx, cx, y, score.mzi.celkove, NAZOV_OBLASTI_DLHY.mzi, md));
  }
  if (zaklad.ukazEnergiu) {
    bunky.push(zaklad.hodnotiOZE
      ? (cx, y) => ukazovatel(ctx, cx, y, score.oze.celkove, NAZOV_OBLASTI_DLHY.oze, md)
      : (cx, y) => nehodnotena(ctx, cx - 28, y, 56, NAZOV_OBLASTI_DLHY.oze, VYSVETLENIE_OZE_BEZ_BUDOV));
    bunky.push(zaklad.hodnotiEnergetiku
      ? (cx, y) => ukazovatel(ctx, cx, y, score.energia.celkove, NAZOV_OBLASTI_DLHY.energia, md)
      : (cx, y) => nehodnotena(ctx, cx - 28, y, 56, NAZOV_OBLASTI_DLHY.energia, vysvetlenieEnergetikaNehodnotena(score.energia)));
  }
  if (bunky.length > 0) {
    // Výšku riadku poznáme až po kreslení; rezervujeme najvyššiu možnú a posunieme podľa skutočnej.
    zabezpec(ctx, 70);
    let najvyssia = 0;
    bunky.forEach((kresli, i) => {
      const cx = OKRAJ + (SIRKA_OBSAHU * (i + 0.5)) / bunky.length;
      najvyssia = Math.max(najvyssia, kresli(cx, ctx.y));
    });
    ctx.y += najvyssia + 6;
  }
}

function rozpisSkore(ctx: Ctx, areal: Areal, score: ScoreResult) {
  const d = ctx.doc;
  for (const karta of kartyDetailuSkore(areal, score)) {
    const prvky: Prvok[] = [txt(d, karta.title, IW, { size: 10, typ: 'bold', farba: G700 })];
    for (const item of karta.items) {
      const podiel = item.score === null ? 0 : item.score / item.max;
      const vpravo = item.score === null
        ? (item.dovodNehodnotenia ? 'nehodnotí sa' : 'bez údajov')
        : `${item.hodnota ? `${item.hodnota}   ` : ''}${item.score}/${item.max}`;
      const polozka: Prvok[] = [
        dvaStlpce(d, item.label, vpravo, IW, {
          farbaVpravo: item.score === null ? G400 : G800,
          typVpravo: item.score === null ? 'normal' : 'bold',
        }),
        pruh(d, podiel, getScoreLevel(podiel * 100).color, IW),
      ];
      if (item.score === null && (item.dovodNehodnotenia || item.coChyba)) {
        polozka.push(txt(d, (item.dovodNehodnotenia || item.coChyba)!, IW, { size: 7.5, farba: G500 }));
      }
      if (item.vysvetlenie) polozka.push(txt(d, item.vysvetlenie.sumar, IW, { size: 7.5, farba: G500 }));
      prvky.push(zvisle(polozka, 1));
    }
    if (karta.poznamka) prvky.push(txt(d, karta.poznamka, IW, { size: 7, farba: G400 }));
    blok(ctx, prvky, { fill: G50, medzeraMedzi: 3 });
  }
}

function energetickeUkazovatele(ctx: Ctx, areal: Areal) {
  const d = ctx.doc;
  const enpi = computeArealEnPI(areal);
  const budovy = enpi.budovy.filter(({ enpi: e }) => e.spotrebaVykurovanie > 0 || e.spotrebaElektrina > 0);
  if (budovy.length === 0) return;

  nadpisSekcie(ctx, `Energetické ukazovatele – nameraná spotreba${enpi.roky.length > 0 ? ` (rok ${enpi.roky.join(', ')})` : ''}`, 30);

  const sirky = [34, 23, 23, 23, 23, 23, 23];
  const hlavicky: Array<[string, string]> = [
    ['Budova', ''],
    ['Vykurovanie', 'kWh/rok'],
    ['Merná spotreba', 'kWh/(m²·rok)'],
    ['Na hodinu prev.', 'kWh/h'],
    ['Elektrina', 'kWh/rok'],
    ['Merná spotreba', 'kWh/(m²·rok)'],
    ['Na hodinu prev.', 'kWh/h'],
  ];
  type Riadok = { bunky: string[]; tucne: boolean };
  const riadky: Riadok[] = [
    ...budovy.map(({ budova, enpi: e }, i) => ({
      tucne: false,
      bunky: [
        budova.nazov || `Budova ${i + 1}`,
        fmtNum(e.spotrebaVykurovanie > 0 ? e.spotrebaVykurovanie : undefined),
        fmtNum(e.mernaSpotrebaVykurovanie),
        fmtNum(e.vykurovanieNaHodinu, 1),
        fmtNum(e.spotrebaElektrina > 0 ? e.spotrebaElektrina : undefined),
        fmtNum(e.mernaSpotrebaElektrina),
        fmtNum(e.elektrinaNaHodinu, 1),
      ],
    })),
    {
      tucne: true,
      bunky: [
        'Areál spolu',
        fmtNum(enpi.spotrebaVykurovanie > 0 ? enpi.spotrebaVykurovanie : undefined),
        fmtNum(enpi.mernaSpotrebaVykurovanie),
        '–',
        fmtNum(enpi.spotrebaElektrina > 0 ? enpi.spotrebaElektrina : undefined),
        fmtNum(enpi.mernaSpotrebaElektrina),
        '–',
      ],
    },
  ];

  const lh = vyskaRiadku(7.5);
  nastav(d, 7.5);
  const nazvyZalomene = riadky.map((r) => zalom(d, r.bunky[0], sirky[0] - 2));
  const hHlavicka = 2 * vyskaRiadku(6.5) + 1.5;
  const tabulka: Prvok = {
    h: hHlavicka + riadky.reduce((s, _, i) => s + nazvyZalomene[i].length * lh + 2, 0),
    kresli: (x, y) => {
      let px = x;
      hlavicky.forEach(([nadpis, jednotka], i) => {
        const vpravo = i > 0;
        const tx = vpravo ? px + sirky[i] : px;
        nastav(d, 6.5, 'bold', G500);
        d.text(nadpis, tx, y, { baseline: 'top', align: vpravo ? 'right' : 'left' });
        nastav(d, 6.5, 'normal', G500);
        if (jednotka) d.text(jednotka, tx, y + vyskaRiadku(6.5), { baseline: 'top', align: 'right' });
        px += sirky[i];
      });
      d.setDrawColor(G200);
      d.setLineWidth(0.25);
      d.line(x, y + hHlavicka - 0.8, x + IW, y + hHlavicka - 0.8);
      let yy = y + hHlavicka;
      riadky.forEach((r, ri) => {
        const typ: Typ = r.tucne ? 'bold' : 'normal';
        let cx = x;
        r.bunky.forEach((b, i) => {
          nastav(d, 7.5, i === 0 ? 'bold' : typ, r.tucne ? G800 : G700);
          if (i === 0) {
            nazvyZalomene[ri].forEach((riadok, k) => d.text(riadok, cx, yy + 1 + k * lh, { baseline: 'top' }));
          } else {
            d.text(b, cx + sirky[i], yy + 1, { baseline: 'top', align: 'right' });
          }
          cx += sirky[i];
        });
        yy += nazvyZalomene[ri].length * lh + 2;
        if (!r.tucne && ri < riadky.length - 2) {
          d.setDrawColor(G100);
          d.line(x, yy - 0.2, x + IW, yy - 0.2);
        }
      });
    },
  };
  const prvky: Prvok[] = [tabulka];
  if (enpi.pocetOsob > 0) {
    prvky.push(txt(d,
      `Na osobu (${fmtNum(enpi.pocetOsob)} osôb – zamestnanci a klienti/žiaci podľa kapacity a obsadenosti): `
      + `vykurovanie ${fmtNum(enpi.vykurovanieNaOsobu)} kWh/os·rok, elektrina ${fmtNum(enpi.elektrinaNaOsobu)} kWh/os·rok.`,
      IW, { size: 8, farba: G700 }));
  }
  prvky.push(txt(d,
    'Merná spotreba na vykurovanie je vztiahnutá na vykurovanú plochu, merná spotreba elektriny na úžitkovú plochu. '
    + 'Ide o nameranú spotrebu z faktúr, bez klimatickej normalizácie – nezamieňať s vypočítanou potrebou energie '
    + 'z energetického certifikátu.',
    IW, { size: 7, farba: G400 }));
  blok(ctx, prvky, { fill: G50, medzeraMedzi: 3 });
}

function zadaneEntity(ctx: Ctx, areal: Areal) {
  const d = ctx.doc;
  const skupiny = skupinyPrehladu(areal).filter((s) => s.polozky.length > 0);
  if (skupiny.length === 0) return;

  nadpisSekcie(ctx, 'Zadané v dotazníku', 20);
  for (const skupina of skupiny) {
    nastav(d, 9, 'bold', G700);
    const nadpisTxt = `${skupina.nadpis} (${skupina.polozky.length})`;
    const sirkaNadpisu = d.getTextWidth(nadpisTxt);
    const nadpis: Prvok = {
      h: vyskaRiadku(9),
      kresli: (x, y) => {
        nastav(d, 9, 'bold', G700);
        d.text(nadpisTxt, x, y, { baseline: 'top' });
        nastav(d, 7.5, 'normal', G400);
        d.text(`krok ${skupina.krok}`, x + sirkaNadpisu + 2, y + 0.4, { baseline: 'top' });
      },
    };
    const polozky: Prvok[] = skupina.polozky.map((p) => {
      nastav(d, 8, 'bold');
      const sirkaNazvu = d.getTextWidth(p.nazov);
      nastav(d, 8, 'normal');
      const lh = vyskaRiadku(8);
      // Názov tučne a za ním popis; popis pokračuje od konca názvu a zalamuje sa na celú šírku.
      const riadky = p.popis ? zalom(d, `— ${p.popis}`, IW, Math.max(20, IW - sirkaNazvu - 1.5)) : [];
      return {
        h: Math.max(1, riadky.length) * lh,
        kresli: (x, y) => {
          nastav(d, 8, 'bold', G700);
          d.text(p.nazov, x, y, { baseline: 'top' });
          nastav(d, 8, 'normal', G500);
          riadky.forEach((r, i) => d.text(r, i === 0 ? x + sirkaNazvu + 1.5 : x, y + i * lh, { baseline: 'top' }));
        },
      };
    });
    const prvky = [nadpis, ...polozky];
    if (skupina.mimoSkore) prvky.push(txt(d, skupina.mimoSkore, IW, { size: 7, farba: G400 }));
    blok(ctx, prvky, { fill: G50, medzeraMedzi: 1.5 });
  }
}

function media(ctx: Ctx, areal: Areal) {
  const d = ctx.doc;
  if (areal.media.length === 0) return;
  nadpisSekcie(ctx, `Priložené médiá (${areal.media.length})`, 12);

  // „Pilulky" s názvami — zalamujú sa do riadkov.
  nastav(d, 8);
  let x = OKRAJ;
  let y = ctx.y;
  const vyskaPilulky = 5.6;
  for (const m of areal.media) {
    const text = `${m.typ === 'foto' ? 'Foto' : 'Video'} · ${m.nazov}`;
    nastav(d, 8, 'normal', G600);
    const w = Math.min(SIRKA_OBSAHU, d.getTextWidth(text) + 6);
    if (x + w > SIRKA - OKRAJ) { x = OKRAJ; y += vyskaPilulky + 1.5; }
    if (y + vyskaPilulky > SPODOK) { nova(ctx); x = OKRAJ; y = ctx.y; }
    d.setFillColor(G100);
    d.roundedRect(x, y, w, vyskaPilulky, vyskaPilulky / 2, vyskaPilulky / 2, 'F');
    nastav(d, 8, 'normal', G600);
    d.text(text, x + 3, y + vyskaPilulky / 2, { baseline: 'middle', maxWidth: SIRKA_OBSAHU - 6 });
    x += w + 2;
  }
  ctx.y = y + vyskaPilulky + 4;

  // Náhľady fotografií — tri vedľa seba, so zachovaným pomerom strán.
  const fotky = areal.media.filter((m) => m.typ === 'foto' && m.dataUrl);
  const stlpce = 3;
  const bunkaW = (SIRKA_OBSAHU - (stlpce - 1) * 4) / stlpce;
  const bunkaH = 42;
  for (let i = 0; i < fotky.length; i += stlpce) {
    const riadok = fotky.slice(i, i + stlpce);
    const popisy = riadok.map((m) => txt(d, [m.nazov, m.popis].filter(Boolean).join(' – '), bunkaW, { size: 7, farba: G500 }));
    const h = bunkaH + 1.5 + Math.max(...popisy.map((p) => p.h));
    zabezpec(ctx, h);
    riadok.forEach((m, k) => {
      const bx = OKRAJ + k * (bunkaW + 4);
      try {
        const p = d.getImageProperties(m.dataUrl);
        const mierka = Math.min(bunkaW / p.width, bunkaH / p.height);
        const w = p.width * mierka;
        const hh = p.height * mierka;
        d.setFillColor(G50);
        d.roundedRect(bx, ctx.y, bunkaW, bunkaH, 2, 2, 'F');
        d.addImage(m.dataUrl, p.fileType, bx + (bunkaW - w) / 2, ctx.y + (bunkaH - hh) / 2, w, hh, undefined, 'FAST');
      } catch { /* neplatný obrázok sa vynechá, zostane aspoň popis */ }
      popisy[k].kresli(bx, ctx.y + bunkaH + 1.5);
    });
    ctx.y += h + 3;
  }
  ctx.y += 2;
}

const FARBY_PRIORITY: Record<string, [string, string]> = {
  'vysoká': ['#FEE2E2', '#B91C1C'],
  'stredná': ['#FEF3C7', '#B45309'],
  'nízka': ['#DBEAFE', '#1D4ED8'],
};
const FARBY_KATEGORIE: Record<string, [string, string]> = {
  MZI: ['#E5F2E9', '#2D7D46'],
  OZE: ['#E4F2FD', '#1976D2'],
  ENERGETIKA: ['#FEF3C7', '#B45309'],
};

function odporucania(ctx: Ctx, recommendations: Odporucanie[]) {
  const d = ctx.doc;
  nadpisSekcie(ctx, `Odporúčané opatrenia (${recommendations.length})`, 30);
  if (recommendations.length === 0) {
    const p = txt(d, 'Zadajte viac údajov o areáli, aby sme mohli vygenerovať odporúčania.', SIRKA_OBSAHU, { size: 9, farba: G500, zarovnanie: 'center' });
    p.kresli(OKRAJ, ctx.y);
    ctx.y += p.h + 4;
    return;
  }

  recommendations.forEach((rec, i) => {
    const o = rec.opatrenie;
    const prvky: Prvok[] = [];

    // Názov a pilulky priority a kategórie.
    const nazov = txt(d, `${i + 1}. ${o.nazov}`, IW, { size: 10, typ: 'bold', farba: G800 });
    const pilulky: Array<[string, [string, string]]> = [
      [rec.priorita, FARBY_PRIORITY[rec.priorita] ?? [G100, G600]],
      [o.kategoria, FARBY_KATEGORIE[o.kategoria] ?? [G100, G600]],
    ];
    prvky.push(nazov, {
      h: 5,
      kresli: (x, y) => {
        let px = x;
        for (const [text, [bg, fg]] of pilulky) {
          nastav(d, 7, 'bold', fg);
          const w = d.getTextWidth(text) + 5;
          d.setFillColor(bg);
          d.roundedRect(px, y, w, 4.4, 2.2, 2.2, 'F');
          d.text(text, px + 2.5, y + 2.2, { baseline: 'middle' });
          px += w + 2;
        }
      },
    });
    prvky.push(txt(d, rec.dovod, IW, { size: 8.5, farba: G500 }));
    prvky.push(txt(d, o.popis, IW, { size: 9, farba: G700 }));
    if (rec.potencial) prvky.push(txt(d, rec.potencial, IW, { size: 9, typ: 'bold', farba: AKCENT }));

    // Štyri údaje vedľa seba: cena, návratnosť, náročnosť, dotácie.
    const stlpceInfo: Array<[string, string]> = [
      ['Orientačná cena', o.orientacnaCena],
      ['Návratnosť', o.navratnost],
      ['Náročnosť', o.narocnostRealizacie],
      ['Dotácie', o.dotacie],
    ];
    // Dotácie bývajú dlhý text, preto dostane najširší stĺpec.
    const podiely = [0.27, 0.19, 0.17, 0.37];
    const bunky = stlpceInfo.map(([popis, hodnota], k) => zvisle([
      txt(d, popis, IW * podiely[k] - 3, { size: 7.5, farba: G500 }),
      txt(d, hodnota, IW * podiely[k] - 3, { size: 8.5, typ: 'bold', farba: G700 }),
    ], 0.3));
    prvky.push({
      h: Math.max(...bunky.map((b) => b.h)),
      kresli: (x, y) => {
        let px = x;
        bunky.forEach((b, k) => { b.kresli(px, y); px += IW * podiely[k]; });
      },
    });

    // Zoznamy držia pokope — medzi odrážkami len malá medzera.
    if (o.benefity.length > 0) {
      const riadky: Prvok[] = [txt(d, 'Benefity:', IW, { size: 7.5, farba: G500 })];
      for (const b of o.benefity) {
        const t = txt(d, b, IW - 5, { size: 8, farba: G600 });
        riadky.push({
          h: t.h,
          kresli: (x, y) => {
            nastav(d, 8, 'bold', AKCENT);
            d.text('•', x + 0.5, y, { baseline: 'top' });
            t.kresli(x + 5, y);
          },
        });
      }
      prvky.push(zvisle(riadky, 0.6));
    }
    if (o.krokyRealizacie.length > 0) {
      const riadky: Prvok[] = [txt(d, 'Kroky realizácie:', IW, { size: 7.5, farba: G500 })];
      o.krokyRealizacie.forEach((k, ki) => {
        const t = txt(d, k, IW - 6, { size: 8, farba: G600 });
        riadky.push({
          h: t.h,
          kresli: (x, y) => {
            nastav(d, 8, 'normal', G600);
            d.text(`${ki + 1}.`, x + 0.5, y, { baseline: 'top' });
            t.kresli(x + 6, y);
          },
        });
      });
      prvky.push(zvisle(riadky, 0.6));
    }
    blok(ctx, prvky, { fill: '#FFFFFF', border: G200, medzeraMedzi: 2 });
  });
}

function zaver(ctx: Ctx) {
  const d = ctx.doc;
  for (const text of ['Toto hodnotenie je orientačné. Pre presný návrh kontaktujte odborníka.', UPOZORNENIE_ROZSAH_HODNOTENIA]) {
    const p = txt(d, text, SIRKA_OBSAHU, { size: 8, farba: G400, zarovnanie: 'center' });
    zabezpec(ctx, p.h);
    p.kresli(OKRAJ, ctx.y);
    ctx.y += p.h + 2;
  }
}

function paty(doc: jsPDF, areal: Areal) {
  const pocet = doc.getNumberOfPages();
  for (let i = 1; i <= pocet; i++) {
    doc.setPage(i);
    doc.setDrawColor(G200);
    doc.setLineWidth(0.25);
    doc.line(OKRAJ, VYSKA - 14, SIRKA - OKRAJ, VYSKA - 14);
    nastav(doc, 7.5, 'normal', G400);
    doc.text(`VESMA – Výsledky hodnotenia${areal.nazov ? ` · ${areal.nazov}` : ''}`, OKRAJ, VYSKA - 11, { baseline: 'top', maxWidth: 140 });
    doc.text(`Strana ${i} z ${pocet}`, SIRKA - OKRAJ, VYSKA - 11, { baseline: 'top', align: 'right' });
  }
}

/** Vloží písmo a zloží celý obsah do `doc`. Samostatne, aby sa dal export testovať. */
export function zlozPdf(
  doc: jsPDF,
  GStateTrieda: typeof GState,
  areal: Areal,
  score: ScoreResult,
  recommendations: Odporucanie[],
  zdroje: ZdrojePdf,
): void {
  doc.addFileToVFS('DejaVuSans.ttf', zdroje.pismoNormal);
  doc.addFont('DejaVuSans.ttf', FONT, 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', zdroje.pismoBold);
  doc.addFont('DejaVuSans-Bold.ttf', FONT, 'bold');
  doc.setProperties({ title: `Výsledky hodnotenia${areal.nazov ? ` – ${areal.nazov}` : ''}`, creator: 'VESMA' });

  const ctx: Ctx = { doc, GState: GStateTrieda, y: OKRAJ };
  hlavicka(ctx, areal, zdroje);
  legenda(ctx);
  ukazovatele(ctx, areal, score);
  const zaklad = zakladVysledkov(areal, score);
  if (zaklad.radar.length > 1) radar(ctx, zaklad.radar);
  rozpisSkore(ctx, areal, score);
  if (zaklad.ukazEnergiu) energetickeUkazovatele(ctx, areal);
  zadaneEntity(ctx, areal);
  media(ctx, areal);
  odporucania(ctx, recommendations);
  zaver(ctx);
  paty(doc, areal);
}

/** Zloží PDF z výsledkov. Zdroje (písmo, logo) dodáva volajúci. */
export async function vytvorPdf(
  areal: Areal,
  score: ScoreResult,
  recommendations: Odporucanie[],
  zdroje: ZdrojePdf,
): Promise<jsPDF> {
  const { default: JsPDF, GState } = await import('jspdf');
  const doc = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
  zlozPdf(doc, GState, areal, score, recommendations, zdroje);
  return doc;
}

// --- Načítanie zdrojov v prehliadači ---

let pismaCache: Promise<[string, string]> | null = null;

function naBase64(buf: ArrayBuffer): string {
  const bajty = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bajty.length; i += 0x8000) s += String.fromCharCode(...bajty.subarray(i, i + 0x8000));
  return btoa(s);
}

async function nacitaj(cesta: string): Promise<Response> {
  const odpoved = await fetch(`${import.meta.env.BASE_URL}${cesta}`);
  if (!odpoved.ok) throw new Error(`súbor ${cesta} sa nepodarilo načítať (${odpoved.status})`);
  return odpoved;
}

async function nacitajPisma(): Promise<[string, string]> {
  pismaCache ??= Promise.all(['fonts/DejaVuSans.ttf', 'fonts/DejaVuSans-Bold.ttf'].map(
    async (c) => naBase64(await (await nacitaj(c)).arrayBuffer()),
  )).then(([a, b]) => [a, b] as [string, string]);
  try {
    return await pismaCache;
  } catch (e) {
    pismaCache = null; // pri ďalšom pokuse skúsiť znova
    throw new Error(`písmo s diakritikou sa nepodarilo načítať — ${e instanceof Error ? e.message : e}`);
  }
}

async function nacitajLogo(): Promise<string | undefined> {
  try {
    const blob = await (await nacitaj('INOVIA_Logo_Final_RGB.jpg')).blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined; // logo je ozdoba
  }
}

/** Vytvorí PDF Výsledkov a stiahne ho. */
export async function exportVysledkovDoPdf(
  areal: Areal,
  score: ScoreResult,
  recommendations: Odporucanie[],
  nazovSuboru: string,
): Promise<void> {
  const [[pismoNormal, pismoBold], logoDataUrl] = await Promise.all([nacitajPisma(), nacitajLogo()]);
  const doc = await vytvorPdf(areal, score, recommendations, { pismoNormal, pismoBold, logoDataUrl });
  doc.save(nazovSuboru);
}
