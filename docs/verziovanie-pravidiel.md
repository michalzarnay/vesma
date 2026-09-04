# Verzia pravidiel hodnotenia a upozornenie pri otvorení relácie

## Prečo to existuje

Relácia si ukladá **odpovede**, nie výsledok. Skóre areálu, poradie v porovnaní
areálov aj odporúčania sa počítajú nanovo pri každom otvorení. Keď sa medzitým
zmenia pravidlá alebo parametre hodnotenia, používateľ uvidí iné čísla než
naposledy — bez toho, aby čokoľvek zmenil. Pri nástroji pre samosprávy je to
podstatné: podľa tých čísel sa rozhoduje o poradí investícií.

Preto si relácia pamätá, podľa akej verzie pravidiel bola naposledy vyhodnotená,
a po otvorení staršej relácie sa zobrazí dialógové okno s upozornením.

## Ako to funguje

| Čo | Kde |
|---|---|
| Aktuálne číslo verzie | `AKTUALNA_VERZIA_PRAVIDIEL` v `src/types/areal.ts` |
| Zoznam zmien podľa verzie | `ZMENY_PRAVIDIEL` v `src/utils/pravidlaVersion.ts` |
| Verzia uložená v relácii | pole `pravidlaVersion` v `Areal` |
| Dialógové okno | `src/components/wizard/ZmenaPravidielDialog.tsx` |

- **Nový areál** dostane aktuálnu verziu, takže neupozorňuje na nič.
- **Uloženie relácie** (`useSessionManager`) ju označí aktuálnou verziou — čo
  používateľ pri ukladaní videl, počítali už súčasné pravidlá.
- **Relácia bez poľa `pravidlaVersion`** pochádza spred zavedenia sledovania a
  načíta sa ako **verzia 0**. Ktoré pravidlá vtedy platili, nevieme, preto
  dostane len všeobecnú vetu bez zoznamu zmien.
- **Potvrdenie dialógu** zapíše aktuálnu verziu do otvoreného areálu, takže sa
  upozornenie neopakuje po každom obnovení stránky. Príznak neuložených zmien to
  neovplyvňuje — `pravidlaVersion` je metaúdaj, nie odpoveď používateľa
  (`serializeForCompare` ho vynecháva).

## Keď meníš pravidlá hodnotenia

Platí to pre všetko, čo pri **nezmenených odpovediach** zmení výsledok:

- skóre areálu (`src/hooks/useScoring.ts`, `src/utils/mziKlimasken.ts`),
- váhy porovnania areálov (`src/data/comparisonWeights.ts`),
- odporúčania (`src/hooks/useRecommendations.ts`),
- referenčné hodnoty a konštanty v `src/data/`, ktoré do výpočtu vstupujú.

Postup:

1. zvýš `AKTUALNA_VERZIA_PRAVIDIEL` v `src/types/areal.ts` o 1,
2. do `ZMENY_PRAVIDIEL` pridaj záznam s číslom **novej** verzie:

```ts
export const ZMENY_PRAVIDIEL: Record<number, ZmenaPravidiel[]> = {
  2: [
    {
      oblast: 'Skóre areálu',
      popis: 'Sezónne nevykurované stavby sa energeticky nehodnotia.',
    },
  ],
};
```

`popis` je jedna veta pre používateľa — čo sa zmenilo, nie názov funkcie ani
číslo issue. Zobrazí sa mu presne takto.

Oprava preklepu v texte, prepočet jednotky bez vplyvu na poradie ani zmena
vzhľadu verziu zvyšovať nemusia. Keď si nie si istý, zvýš ju — falošné
upozornenie stojí používateľa jedno kliknutie, tiché prečíslovanie areálov ho
stojí dôveru vo výsledok.

## Čo to nie je

Toto číslovanie **nesúvisí** s číslom zostavy v hlavičke (`version.json`, pozri
`docs/verziovanie.md`) ani s verziou schémy relácie (`schemaVersion`, doplnenie
nových otázok do starších relácií). Sú to tri nezávislé počítadlá:

| Číslo | Odpovedá na otázku |
|---|---|
| `version.json` | Ktorú zostavu má tester pred sebou? |
| `schemaVersion` | Ktoré nové otázky treba v relácii doplniť? |
| `pravidlaVersion` | Podľa akých pravidiel bola relácia vyhodnotená? |
