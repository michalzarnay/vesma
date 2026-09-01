/**
 * PDF text extraction and parsing for Slovak cadastral/building documents.
 * Uses pdfjs-dist (text-only; scanned PDFs not supported).
 */
import * as pdfjsLib from 'pdfjs-dist';

// Point the worker to the bundled worker file served from /public.
// BASE_URL = základná cesta nasadenia ('/vesma/'), bez nej by worker
// za proxy na https://inovia.sk/vesma/ skončil na neexistujúcej adrese.
pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocumentType =
  | 'lv'                    // List vlastníctva (kataster)
  | 'energetickyCertifikat' // Energetický certifikát budovy
  | 'projektovaDokumentacia'// Projektová dokumentácia
  | 'auditSprava'           // Správa z energetického auditu
  | 'neznamy';              // Unknown

export interface ParsedLV {
  parcely: Array<{ cislo: string; vymeraMsq: number; druh: string }>;
  cisloLV?: string;
  obec?: string;
  katastralneUzemie?: string;
  okres?: string;
}

export interface ParsedEnergetickyCertifikat {
  energetickaTrieda?: string;       // A0, A1, B, C ...
  celkovaPlochaMsq?: number;        // m²
  potrebaEnergieKurenie?: number;   // kWh/(m²·a)
  potrebaEnergieVoda?: number;
  primarnaEnergia?: number;
  typVykurovania?: string;
}

export interface ParsedProjektovaDokumentacia {
  nazovStavby?: string;
  rokVystavby?: number;
  uzitkovaPlocha?: number;
  zastavanahPlocha?: number;
  pocetNadzemPodlazi?: number;
  pocetPodzemnychPodlazi?: number;
  typStrechy?: string;               // rovná / šikmá
  obvodoveStenyMaterial?: string;
}

export interface ParsedAuditSprava {
  celkovaSpotreba?: number;
  spotrebaElektrina?: number;
  spotrebaPlyn?: number;
  poznamky?: string;
}

export interface ParsedDocument {
  typ: DocumentType;
  rawText: string;
  lv?: ParsedLV;
  certifikat?: ParsedEnergetickyCertifikat;
  projekt?: ParsedProjektovaDokumentacia;
  audit?: ParsedAuditSprava;
}

// ── Text extraction ────────────────────────────────────────────────────────────

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(pageText);
  }
  return pages.join('\n');
}

// ── Classification ─────────────────────────────────────────────────────────────

export function classifyDocument(text: string): DocumentType {
  const t = text.toLowerCase();
  if (t.includes('list vlastníctva') || t.includes('výpis z listu vlastníctva') || t.includes('katastrálne územie') && t.includes('parcely registra')) return 'lv';
  if (t.includes('energetický certifikát') || t.includes('trieda energetickej hospodárnosti') || t.includes('energetická trieda')) return 'energetickyCertifikat';
  if (t.includes('energetický audit') || t.includes('správa z auditu') || t.includes('auditná správa')) return 'auditSprava';
  if (t.includes('projektová dokumentácia') || t.includes('technická správa') || t.includes('stavebné povolenie') || t.includes('stupeň dokumentácie')) return 'projektovaDokumentacia';
  return 'neznamy';
}

// ── LV parser ─────────────────────────────────────────────────────────────────

export function parseLV(text: string): ParsedLV {
  const result: ParsedLV = { parcely: [] };

  // Číslo LV
  const lvMatch = text.match(/[Ll]ist\s+vlastníctva\s+č(?:íslo)?\.?\s*(\d+)/);
  if (lvMatch) result.cisloLV = lvMatch[1];

  // Obec / katasterálne územie / okres
  const obecMatch = text.match(/Obec[:\s]+([^\n,]+)/i);
  if (obecMatch) result.obec = obecMatch[1].trim();

  const ktMatch = text.match(/Katastrálne územie[:\s]+([^\n,]+)/i);
  if (ktMatch) result.katastralneUzemie = ktMatch[1].trim();

  const okresMatch = text.match(/Okres[:\s]+([^\n,]+)/i);
  if (okresMatch) result.okres = okresMatch[1].trim();

  // Parcely – rôzne formáty výpisu z kataster.sk
  // Pattern: číslo parcely (napr. "1234/1" alebo "1234") followed by výmera (číslo) and druh pozemku
  const parcelaRegex = /(\d+(?:\/\d+)?)\s+([\d\s]+)\s+(Zastavané plochy|Ostatné plochy|Záhrada|Orná pôda|Lesný pozemok|Vodná plocha|Trvalý trávny porast|Ostatná plocha)/gi;
  let m: RegExpExecArray | null;
  while ((m = parcelaRegex.exec(text)) !== null) {
    const vymeraStr = m[2].replace(/\s/g, '');
    const vymera = parseInt(vymeraStr, 10);
    if (!isNaN(vymera) && vymera > 0) {
      result.parcely.push({
        cislo: m[1].trim(),
        vymeraMsq: vymera,
        druh: m[3].trim(),
      });
    }
  }

  // Fallback: hľadaj stĺpce s číslom parcely a výmerou
  if (result.parcely.length === 0) {
    const fallbackRegex = /(?:Parcelné číslo|Číslo parcely)[^\n]*\n([\s\S]*?)(?:\n\n|\nVlastníci|\nČasť)/i;
    const block = text.match(fallbackRegex);
    if (block) {
      const rows = block[1].split('\n');
      for (const row of rows) {
        const cols = row.trim().split(/\s{2,}/);
        if (cols.length >= 2 && /^\d+(?:\/\d+)?$/.test(cols[0])) {
          const vymera = parseInt(cols[1].replace(/\s/g, ''), 10);
          if (!isNaN(vymera)) {
            result.parcely.push({ cislo: cols[0], vymeraMsq: vymera, druh: cols[2] ?? '' });
          }
        }
      }
    }
  }

  return result;
}

// ── Energetický certifikát parser ─────────────────────────────────────────────

export function parseEnergetickyCertifikat(text: string): ParsedEnergetickyCertifikat {
  const result: ParsedEnergetickyCertifikat = {};

  // Energetická trieda (A0, A1, A2, B, C, D, E, F, G)
  const triedaMatch = text.match(/[Tt]rieda\s+energetickej\s+hospodárnosti[:\s]+([A-G][0-9]?)/);
  if (triedaMatch) result.energetickaTrieda = triedaMatch[1];

  // Celková podlahová plocha
  const plochaMatch = text.match(/[Cc]elková\s+(?:podlahová\s+)?plocha[:\s]+([\d\s,.]+)\s*m/);
  if (plochaMatch) result.celkovaPlochaMsq = parseFloat(plochaMatch[1].replace(/\s/g, '').replace(',', '.'));

  // Potreba tepla na vykurovanie
  const kurMatch = text.match(/[Pp]otreba\s+(?:tepla\s+na\s+)?vykurovanie[:\s]+([\d\s,.]+)\s*kWh/);
  if (kurMatch) result.potrebaEnergieKurenie = parseFloat(kurMatch[1].replace(/\s/g, '').replace(',', '.'));

  // Potreba tepla na prípravu teplej vody
  const tvMatch = text.match(/[Pp]otreba\s+(?:tepla\s+na\s+)?(?:prípravu\s+)?teplej\s+vody[:\s]+([\d\s,.]+)\s*kWh/);
  if (tvMatch) result.potrebaEnergieVoda = parseFloat(tvMatch[1].replace(/\s/g, '').replace(',', '.'));

  // Primárna energia
  const primMatch = text.match(/[Pp]rimárna\s+energia[:\s]+([\d\s,.]+)\s*kWh/);
  if (primMatch) result.primarnaEnergia = parseFloat(primMatch[1].replace(/\s/g, '').replace(',', '.'));

  // Typ vykurovania
  const vykMatch = text.match(/[Tt]yp\s+(?:zdroja\s+)?vykurovania[:\s]+([^\n,;]+)/);
  if (vykMatch) result.typVykurovania = vykMatch[1].trim();

  return result;
}

// ── Projektová dokumentácia parser ────────────────────────────────────────────

export function parseProjektovaDokumentacia(text: string): ParsedProjektovaDokumentacia {
  const result: ParsedProjektovaDokumentacia = {};

  const nazovMatch = text.match(/[Nn]ázov\s+stavby[:\s]+([^\n]+)/);
  if (nazovMatch) result.nazovStavby = nazovMatch[1].trim();

  const rokMatch = text.match(/[Rr]ok\s+(?:výstavby|kolaudácie|dokončenia)[:\s]+((?:19|20)\d{2})/);
  if (rokMatch) result.rokVystavby = parseInt(rokMatch[1], 10);

  const upMatch = text.match(/[Uu]žitková\s+plocha[:\s]+([\d\s,.]+)\s*m/);
  if (upMatch) result.uzitkovaPlocha = parseFloat(upMatch[1].replace(/\s/g, '').replace(',', '.'));

  const zpMatch = text.match(/[Zz]astavané\s+(?:plocha|územie)[:\s]+([\d\s,.]+)\s*m/);
  if (zpMatch) result.zastavanahPlocha = parseFloat(zpMatch[1].replace(/\s/g, '').replace(',', '.'));

  const npMatch = text.match(/(?:počet\s+)?nadzemn\w+\s+podlaž[íi][:\s]+(\d+)/i);
  if (npMatch) result.pocetNadzemPodlazi = parseInt(npMatch[1], 10);

  const ppMatch = text.match(/(?:počet\s+)?podzem\w+\s+podlaž[íi][:\s]+(\d+)/i);
  if (ppMatch) result.pocetPodzemnychPodlazi = parseInt(ppMatch[1], 10);

  const strechaMatch = text.match(/[Tt]yp\s+strechy[:\s]+([^\n,;]+)/);
  if (strechaMatch) result.typStrechy = strechaMatch[1].trim();
  else if (/plochá\s+strecha/i.test(text)) result.typStrechy = 'plochá';
  else if (/šikmá\s+strecha/i.test(text)) result.typStrechy = 'šikmá';

  const matMatch = text.match(/[Oo]bvodové\s+steny[:\s]+([^\n,;]+)/);
  if (matMatch) result.obvodoveStenyMaterial = matMatch[1].trim();

  return result;
}

// ── Audit parser ───────────────────────────────────────────────────────────────

export function parseAuditSprava(text: string): ParsedAuditSprava {
  const result: ParsedAuditSprava = {};

  const celkMatch = text.match(/[Cc]elková\s+spotreba\s+energie[:\s]+([\d\s,.]+)\s*kWh/);
  if (celkMatch) result.celkovaSpotreba = parseFloat(celkMatch[1].replace(/\s/g, '').replace(',', '.'));

  const elMatch = text.match(/[Ss]potreba\s+elektrin\w[:\s]+([\d\s,.]+)\s*kWh/);
  if (elMatch) result.spotrebaElektrina = parseFloat(elMatch[1].replace(/\s/g, '').replace(',', '.'));

  const plynMatch = text.match(/[Ss]potreba\s+(?:zemného\s+)?plynu[:\s]+([\d\s,.]+)\s*(?:kWh|m³|MWh)/);
  if (plynMatch) result.spotrebaPlyn = parseFloat(plynMatch[1].replace(/\s/g, '').replace(',', '.'));

  return result;
}

// ── Main entry point ───────────────────────────────────────────────────────────

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const rawText = await extractTextFromPdf(file);
  const typ = classifyDocument(rawText);

  const result: ParsedDocument = { typ, rawText };

  if (typ === 'lv') result.lv = parseLV(rawText);
  if (typ === 'energetickyCertifikat') result.certifikat = parseEnergetickyCertifikat(rawText);
  if (typ === 'projektovaDokumentacia') result.projekt = parseProjektovaDokumentacia(rawText);
  if (typ === 'auditSprava') result.audit = parseAuditSprava(rawText);

  return result;
}
