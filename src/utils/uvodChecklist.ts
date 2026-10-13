import type { RozsahMapovania } from '../types/areal';
import { mapujeEnergiu, mapujeVodu } from './rozsahMapovania';

export interface PolozkaChecklistu {
  id: string;
  text: string;
}

/**
 * Čo si pripraviť pred vypĺňaním (podnety 90, 113). Zoznam vychádza len z toho,
 * čo formulár skutočne pýta — nepridávať položky, ktoré v krokoch 2–5 nie sú.
 * Rozsah mapovania určuje, ktoré položky sa týkajú (rovnaké predikáty ako formulár).
 */
export function checklistPripravy(rozsah: RozsahMapovania): PolozkaChecklistu[] {
  const vsetko: PolozkaChecklistu[] = [
    { id: 'identifikacia', text: 'Názov areálu, adresa a obec (povinný je len názov areálu)' },
    { id: 'parcely', text: 'Čísla parciel a listy vlastníctva (LV) – výmery parciel a nezastavaná plocha' },
    { id: 'budovy', text: 'Budovy: zastavaná a úžitková plocha, rok výstavby alebo obnovy, strecha' },
  ];
  if (mapujeEnergiu(rozsah)) {
    vsetko.push({
      id: 'energie',
      text: 'Ročné spotreby a náklady na energie (faktúry za elektrinu, teplo a palivá), prípadne energetický certifikát alebo audit',
    });
  }
  if (mapujeVodu(rozsah)) {
    vsetko.push({
      id: 'voda',
      text: 'Povrchy pozemku (priepustné, spevnené, nepriepustné), odvod dažďovej vody a prípadné nádrže',
    });
  }
  vsetko.push({ id: 'fotky', text: 'Fotky a videá z areálu (nepovinné, priložia sa k výstupu)' });
  return vsetko;
}
