// Plnohodnotný CSV export areálu.
//
// CSV bolo pôvodne len zhrnutie — názov areálu, skóre, počty pozemkov a budov
// a odporúčania. Kto si stiahol CSV namiesto XLSX, prišiel o všetko ostatné.
// Teraz nesie to isté, čo zošit: rovnaké sekcie v rovnakom poradí, lebo obe
// čítajú z `harkyExportu()`.
//
// Formát je ten, čo doteraz — bodkočiarka ako oddeľovač, úvodzovky okolo
// každej bunky a BOM na začiatku — aby ho slovenský Excel otvoril správne
// aj po dvojkliku.

import { Areal } from '../types/areal';
import { ScoreResult } from '../types/scoring';
import { Odporucanie } from '../types/catalog';
import { harkyExportu } from './xlsxExport';

/** Značka poradia bajtov — bez nej Excel prečíta diakritiku ako mojibake. */
const BOM = '﻿';
const ODDELOVAC = ';';

/**
 * Bunka do CSV. Úvodzovka vnútri textu sa zdvojuje, inak by predčasne ukončila
 * bunku — popis stavby aj dôvod odporúčania sú voľný text od používateľa.
 * Zalomenie riadku vnútri úvodzoviek je platné, netreba ho odstraňovať.
 */
function bunka(hodnota: string | number): string {
  return `"${String(hodnota).replace(/"/g, '""')}"`;
}

/**
 * Zloží CSV zo všetkých sekcií exportu. Každú uvádza riadok s jej názvom
 * (`### Pozemky`), aby sa v jednom súbore dali od seba odlíšiť — CSV nemá hárky.
 */
export function csvExportu(
  areal: Areal,
  score: ScoreResult,
  recommendations: Odporucanie[],
): string {
  const riadky: string[] = [];

  for (const harok of harkyExportu(areal, score, recommendations)) {
    riadky.push(bunka(`### ${harok.nazov}`));
    for (const r of harok.riadky) {
      riadky.push(r.map(bunka).join(ODDELOVAC));
    }
    riadky.push('');
  }

  return BOM + riadky.join('\n');
}
