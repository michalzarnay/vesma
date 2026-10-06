/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { jsPDF, GState } from 'jspdf';
import {
  Areal, createEmptyAreal, createEmptyBGOpatrenie, createEmptyBudova, createEmptyInaStavba, createEmptyPozemok,
} from '../../types/areal';
import { computeScore } from '../../hooks/useScoring';
import { computeRecommendations } from '../../hooks/useRecommendations';
import { jeVPisme, zlozPdf, ZdrojePdf } from '../pdfExport';
import { kartyDetailuSkore, skupinyPrehladu, zakladVysledkov } from '../vysledkyPrehlad';
import { Odporucanie } from '../../types/catalog';
import { UPOZORNENIE_ROZSAH_HODNOTENIA } from '../../data/constants';

const nacitajPismo = (nazov: string) => readFileSync(`public/fonts/${nazov}`).toString('base64');
const zdroje: ZdrojePdf = {
  pismoNormal: nacitajPismo('DejaVuSans.ttf'),
  pismoBold: nacitajPismo('DejaVuSans-Bold.ttf'),
};

// Jednopixelový PNG — stačí na to, aby sa náhľad fotografie vložil.
const PNG_1X1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

function plnyAreal() {
  const areal = createEmptyAreal();
  areal.nazov = 'ZŠ Lipová – Žilina';
  areal.adresa = 'Školská 12';
  areal.obec = 'Žilina';
  const p = createEmptyPozemok();
  p.parcela = '2307/1';
  p.aktualneVyuzitie = 'školský dvor';
  p.celkovaVymera = 1200;
  p.plochaBezBudov = 900;
  areal.pozemky = [p];
  const b = createEmptyBudova();
  b.nazov = 'Hlavná budova';
  b.uzitkovaPlochaNUS = 800;
  b.kurenePlynom = 1;
  b.kureniePlynSpotreba = 90000;
  b.spotrebaElektriny = 30000;
  b.spotrebaRok = 2024;
  areal.budovy = [b];
  const s = createEmptyInaStavba();
  s.nazov = 'Altánok';
  s.zastavanaPlocha = 40;
  areal.ineStavby = [s];
  const o = createEmptyBGOpatrenie();
  o.nazov = 'Dažďová záhrada';
  areal.bgOpatrenia = [o];
  areal.media = [{
    id: 'm1', nazov: 'Školský dvor', typ: 'foto', dataUrl: PNG_1X1, velkost: 100, popis: 'Pohľad od vstupu', datumNahratia: '',
  }, {
    id: 'm2', nazov: 'Prehliadka dronom', typ: 'video', dataUrl: '', velkost: 100, popis: '', datumNahratia: '',
  }];
  return areal;
}

/** Zloží PDF a zachytí všetky texty, ktoré sa do neho vykreslili. */
function zlozAZachyt(areal: Areal, recs: Odporucanie[]) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const texty: string[] = [];
  const povodny = doc.text.bind(doc) as (...a: unknown[]) => jsPDF;
  (doc as { text: unknown }).text = (...args: unknown[]) => {
    const t = args[0];
    texty.push(...(Array.isArray(t) ? (t as string[]) : [String(t)]));
    return povodny(...args);
  };
  zlozPdf(doc, GState, areal, computeScore(areal), recs, zdroje);
  return { doc, vsetko: texty.join('\n') };
}

describe('zlozPdf', () => {
  it('nesie obsah karty Výsledky — rozpis skóre, entity, médiá aj všetky odporúčania', () => {
    const areal = plnyAreal();
    const score = computeScore(areal);
    const recs = computeRecommendations(areal);
    const { vsetko } = zlozAZachyt(areal, recs);

    expect(vsetko).toContain('Výsledky hodnotenia');
    expect(vsetko).toContain('Vysvetlenie skratiek');
    expect(vsetko).toContain('Celkové skóre (vážené)');
    for (const karta of kartyDetailuSkore(areal, score)) {
      for (const item of karta.items) {
        expect(vsetko, `chýba komponent ${item.label}`).toContain(item.label);
        if (item.vysvetlenie) expect(vsetko).toContain(item.vysvetlenie.sumar.slice(0, 20));
      }
    }
    for (const skupina of skupinyPrehladu(areal).filter((s) => s.polozky.length > 0)) {
      expect(vsetko).toContain(skupina.nadpis);
      for (const polozka of skupina.polozky) expect(vsetko).toContain(polozka.nazov);
    }
    expect(vsetko).toContain('Prehliadka dronom');
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(vsetko).toContain(rec.opatrenie.nazov);
      expect(vsetko).toContain(rec.dovod.slice(0, 20));
      for (const krok of rec.opatrenie.krokyRealizacie) expect(vsetko).toContain(krok.slice(0, 20));
      for (const benefit of rec.opatrenie.benefity) expect(vsetko).toContain(benefit.slice(0, 20));
    }
    expect(vsetko).toContain(UPOZORNENIE_ROZSAH_HODNOTENIA.slice(0, 30));
  });

  it('texty majú diakritiku a každý znak je vo vloženom písme', () => {
    const areal = plnyAreal();
    const { vsetko } = zlozAZachyt(areal, computeRecommendations(areal));

    expect(vsetko).toContain('Odporúčané opatrenia');
    expect(vsetko).toContain('ZŠ Lipová – Žilina');
    const chybajuce = [...new Set([...vsetko].filter((z) => !jeVPisme(z)))];
    expect(chybajuce, `znaky mimo písma: ${chybajuce.join(' ')}`).toEqual([]);
  });

  it('areál bez budov: nehodnotené oblasti sa vysvetlia a neprejdú do rozpisu', () => {
    const areal = createEmptyAreal();
    areal.nazov = 'Park';
    areal.budovy = [];
    const score = computeScore(areal);
    const { vsetko } = zlozAZachyt(areal, []);

    expect(zakladVysledkov(areal, score).hodnotiOZE).toBe(false);
    expect(vsetko).toContain('nehodnotí sa');
    expect(vsetko).toContain('Areál nemá zadanú žiadnu budovu');
    expect(vsetko).not.toContain('Vhodnosť strechy');
    expect(vsetko).toContain('Zadajte viac údajov o areáli');
  });

  it('dlhý obsah sa zalomí na ďalšie strany a každá má pätu s číslovaním', () => {
    const areal = plnyAreal();
    const { doc } = zlozAZachyt(areal, computeRecommendations(areal));
    const pocet = doc.getNumberOfPages();

    expect(pocet).toBeGreaterThan(1);
    if (process.env.VESMA_PDF_DUMP) writeFileSync(process.env.VESMA_PDF_DUMP, Buffer.from(doc.output('arraybuffer')));
  });
});
