import { describe, it, expect } from 'vitest';
import { glossary } from '../glossary';

describe('glossary', () => {
  it('pole pre solárny ohrev vody je pomenované "solárne kolektory", nie "solárne panely" (nezamieňať s fotovoltikou)', () => {
    expect(glossary.solarnePanelyDef.term).toBe('Solárne kolektory');
  });

  it('typy povrchu na pozemku majú aktualizované názvy (issue #71)', () => {
    expect(glossary.priepustnaPlochaDef.term).toBe('Prírodný (vsakovací) povrch');
    expect(glossary.polopriepustnaPlochaDef.term).toBe('Spevnený (polopriepustný) povrch');
    expect(glossary.spevnenaPlochaDef.term).toBe('Nepriepustný povrch');
  });

  it('vyspádovanie má názov "Spevnená plocha vo svahu s sklonom" a nezmenené vysvetlenie (issue #109)', () => {
    expect(glossary.vyspadovanyPozemokDef.term).toBe('Spevnená plocha vo svahu s sklonom');
    expect(glossary.vyspadovanyPozemokDef.definition).toBe(
      'Pozemok, ktorý nie je rovný – má svah alebo sklon. Voda po ňom steká smerom nadol.'
    );
  });

  it('kúrenie elektrinou vysvetľuje, že bivalentné dokurovanie pri tepelnom čerpadle sa nepočíta ako kúrenie elektrinou (issue #113)', () => {
    expect(glossary.kurenieElektrinouDef.definition).toContain('tepelné čerpadlo');
    expect(glossary.kurenieElektrinouDef.definition).toContain('NEPOVAŽUJE');
  });

  it('deliaca čiara budova/iná stavba sú základy v zemi — chatka patrí medzi budovy', () => {
    const { definition, example } = glossary.kamPatriStavbaDef;
    expect(definition).toContain('základ');
    // Chatka je uvedená na strane budov, altánok na strane iných stavieb.
    const budovy = example!.split('Medzi Iné stavby')[0];
    const ineStavby = example!.split('Medzi Iné stavby')[1];
    expect(budovy).toContain('chatka');
    expect(ineStavby).toContain('ltánok');
    expect(budovy).not.toContain('ltánok');
  });

  it('chodník, parkovisko ani oplotenie nie sú iné stavby', () => {
    const { definition, example } = glossary.kamPatriStavbaDef;
    // Patria medzi povrchy pozemku, nie medzi stavby — inak by sa tá istá
    // plocha zadala dvakrát a hodnotila ako nepriepustná bez ohľadu na povrch.
    expect(definition).toContain('Pozemky');
    const ineStavby = example!.split('Medzi Iné stavby')[1].split('Do Pozemkov')[0];
    expect(ineStavby).not.toContain('hodník');
    expect(ineStavby).not.toContain('arkovisko');
    expect(ineStavby).not.toContain('plotenie');
  });

  it('sezónna nevykurovaná stavba neuvádza altánok — ten patrí medzi iné stavby', () => {
    expect(glossary.sezonnaNevykurovanaDef.definition).toContain('chatka');
    expect(glossary.sezonnaNevykurovanaDef.definition).not.toContain('ltánok');
  });

  it('trieda energetickej hospodárnosti má vysvetlivku so škálou A0–G (issue #117)', () => {
    expect(glossary.energetickaTriedaDef.term).toBe('Trieda energetickej hospodárnosti');
    expect(glossary.energetickaTriedaDef.definition).toContain('A0');
    expect(glossary.energetickaTriedaDef.definition).toContain('G');
  });
});
