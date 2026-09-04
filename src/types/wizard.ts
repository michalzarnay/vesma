export interface WizardStep {
  id: number;
  nazov: string;
  popis: string;
  icon: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, nazov: 'Úvod', popis: 'Identifikácia areálu', icon: 'building-2' },
  { id: 2, nazov: 'Pozemky', popis: 'Plochy, voda, zeleň, stromy', icon: 'trees' },
  { id: 3, nazov: 'Budovy', popis: 'Strecha, voda, energia, vykurovanie', icon: 'home' },
  { id: 4, nazov: 'Iné stavby', popis: 'Altánky, prístrešky, búdy bez základov', icon: 'tent' },
  { id: 5, nazov: 'B&G opatrenia', popis: 'Zamýšľané opatrenia', icon: 'leaf' },
  { id: 6, nazov: 'Výsledky', popis: 'Skóre a odporúčania', icon: 'bar-chart-3' },
];
