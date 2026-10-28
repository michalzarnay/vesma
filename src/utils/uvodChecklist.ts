import type { RozsahMapovania } from '../types/areal';
import { mapujeEnergiu, mapujeVodu } from './rozsahMapovania';

export interface PolozkaChecklistu {
  id: string;
  text: string;
  /** Rozbaľovacie podrobnosti — ako údaj zistiť alebo zmapovať vopred. */
  podrobnosti?: string[];
  /** Podrobnosti sú rozbalené hneď od začiatku. */
  otvorene?: boolean;
}

/**
 * Čo si pripraviť pred vypĺňaním (podnety 90, 113). Zoznam vychádza len z toho,
 * čo formulár skutočne pýta — nepridávať položky, ktoré v krokoch 2–5 nie sú.
 * Rozsah mapovania určuje, ktoré položky sa týkajú (rovnaké predikáty ako formulár).
 *
 * Podrobnosti k povrchom pozemku vznikli z podnetu testera: najťažšie bolo
 * rozdeliť pozemok na plochy, keď si to nezmapoval vopred. Zaradenie povrchov
 * preberá definície z glossary.ts (nápovedy v kroku Pozemky) a z odpovedí
 * asistenta (odpovedeAsistenta.ts) — pri zmene zaradenia upraviť všetky tri.
 * Štrk: rozhoduje podklad — zemina/geotextília → spevnený (polopriepustný), betón → nepriepustný.
 */
export function checklistPripravy(rozsah: RozsahMapovania): PolozkaChecklistu[] {
  const vsetko: PolozkaChecklistu[] = [
    { id: 'identifikacia', text: 'Názov areálu, adresa a obec (povinný je len názov areálu)' },
    {
      id: 'parcely',
      text: 'Čísla parciel a listy vlastníctva (LV) – výmery parciel a nezastavaná plocha',
      podrobnosti: [
        'Čísla parciel, výmery a LV nájdete v katastri nehnuteľností (napr. katasterportal.sk). List vlastníctva môžete v kroku Pozemky aj nahrať.',
        'Plocha bez budov = výmera parcely mínus plocha, na ktorej stoja budovy.',
        'Parcely, na ktorých stojí budova, patria do kroku Budovy; do kroku Pozemky idú nezastavané parcely (dvor, záhrada, parkovisko).',
      ],
    },
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
      otvorene: true,
      text: 'Mapa povrchov pozemku – koľko m² je prírodného, spevneného a nepriepustného povrchu, kam odteká dažďová voda a prípadné nádrže',
      podrobnosti: [
        'Na výpise z katastrálnej mapy alebo leteckej snímke si nakreslite náčrt nezastavaného pozemku a rozdeľte ho na plochy. Formulár pýta tri skupiny povrchov v m²:',
        'Prírodný (vsakovací) povrch: trávnik, lúka, záhony – aj mulčované záhony patria sem (ako byliny).',
        'Spevnený (polopriepustný) povrch: štrk na zemine, geotextílii alebo inom vsakovacom podklade, zatrávňovacia dlažba, mlat, priepustný asfalt, dlažba s trávou alebo štrkom v škárach.',
        'Nepriepustný povrch: asfalt, betón, klasická dlažba, štrk nasypaný na betóne.',
        'Pri štrku rozhoduje, čo je pod ním – ak to neviete, pozrite sa na okraj chodníka alebo sa opýtajte správcu. Každú plochu zarátajte len raz, napr. dlaždicový chodník cez trávnik do jeho skupiny a trávnik okolo neho do prírodného. Plochu altánkov, prístreškov a búd nezarátajte, zadáva sa v kroku Iné stavby.',
        'Pri prírodnom povrchu formulár pýta aj podiel v %: trávnik a byliny, kry a stromy (plocha pod korunami pri pohľade zhora), pravidelne obrábaná pôda bez mulča. Pri spevnenom povrchu podiel podľa materiálu.',
        'Ďalej sa pýta: či je terén rovinatý alebo vo svahu, kam odteká dažďová voda (kanalizácia, vsakovanie, nádrž…), objem nádrží na dažďovú vodu a plochy dažďovej záhrady či jazierka, ak ich máte.',
        'Ak je pozemok členitý, rozdeľte ho na menšie časti (dvor, záhrada, parkovisko) a plochy sčítajte. Stačí odhad – plochy sa dajú odmerať aj v mapových aplikáciách.',
      ],
    });
  }
  vsetko.push({ id: 'fotky', text: 'Fotky a videá z areálu (nepovinné, priložia sa k výstupu)' });
  return vsetko;
}
