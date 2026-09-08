# Rozsah mapovania — voda, energia alebo oboje

Mapér si na kroku 1 (Úvod) vyberie, čo v areáli mapuje: **Voda**, **Energia**
alebo **Voda aj energia**. Časti dotazníka a hodnotenia mimo vybraného rozsahu
sa skryjú. Výber sa dá kedykoľvek zmeniť; zadané údaje sa nestrácajú, len sa
nezobrazujú.

Dôvod: z rozhovorov so samosprávami (september 2026) vyplynulo, že energetická
časť pre ne nie je atraktívna — kalkulačiek a zákonných povinností v energetike
je veľa. Vodná časť je to, čo VESMA prináša navyše. Energetiku z aplikácie
nevyhadzujeme; validácia ukáže, či ju niekto používa (rozsah sa ukladá s
areálom a je v exporte, takže sa dá vyhodnotiť).

## Čo sa skrýva

| Miesto | Len voda | Len energia |
| --- | --- | --- |
| Úvod | potenciál slnečného svitu | množstvo zrážok, nemožnosť nádrže |
| Pozemky | plocha pre FV | odvod vody, povrchy, stromy, zrealizovaná infraštruktúra |
| Budovy | plochy strechy a fasády pre solár, Úspory energie, Vykurovanie, Elektrická energia, energetický certifikát a audit, solárne kolektory | Ohrozenie záplavami, Voda a splašky, zelená strecha a zelená stena |
| Iné stavby, Opatrenia pre MZI | — | krok ostáva v lište, zobrazí len poznámku, že sa týka vody |
| Výsledky | ukazovatele OZE a Energetická efektívnosť, ich rozpis, energetické ukazovatele (EnPI), energetické odporúčania, váhy | ukazovateľ MZI a jeho rozpis, vodné odporúčania, váhy |
| Porovnanie areálov | stĺpec Energia | stĺpce Sucho, Horúčavy, Voda |

Čísla krokov sa nemenia, aby Príručka sedela.

## Čo sa nemení

- **Export XLSX a CSV** ostáva úplný — stĺpce aj hárky sú rovnaké, polia mimo
  rozsahu sú prázdne a skóre mimo rozsahu je „nehodnotené". Kontrakt pre xMatik
  a Klimasken (G-label sekvencie) sa nerozbíja. V Súhrne pribudol riadok
  „Rozsah mapovania".
- **Skóre pri „oboje"** je totožné s doterajším. Preto sa nezvyšuje
  `AKTUALNA_VERZIA_PRAVIDIEL`: relácie spred zavedenia rozsahu sa načítajú ako
  „oboje" a ich čísla sa nezmenia.
- **Chatbot** odpovedá na otázky k obom oblastiam bez ohľadu na rozsah.

## Ako je to v kóde

- Pole `rozsahMapovania` na areáli (`src/types/areal.ts`), predvolene `oboje`;
  migrácia starších relácií v `migrateAreal`.
- Jediné predikáty `mapujeVodu()` a `mapujeEnergiu()` v
  `src/utils/rozsahMapovania.ts`. Nikde inde sa hodnota neporovnáva priamo.
- Skóre: `mimoRozsahu` na `MZIScore`, `OZEScore` a `EnergiaScore`;
  `hodnoteneOblasti()` oblasť mimo rozsahu vynechá, takže celkové skóre pri
  „len voda" je čisto MZI.
- Odporúčania: `jeVRozsahu(kategoria, areal)` v `useRecommendations.ts`.
- Formuláre dostávajú rozsah cez `RozsahContext` (`src/hooks/useRozsah.ts`).
- Testy: `src/utils/__tests__/rozsahMapovania.test.ts`,
  `e2e/rozsah-mapovania.spec.ts`.

## Pre Príručku

Do kapitoly o kroku 1 pribudne odsek: „Pod názvom areálu vyberte, čo chcete
mapovať — vodu, energiu alebo oboje. Časti dotazníka mimo výberu sa skryjú;
výber môžete kedykoľvek zmeniť." Ostatné kapitoly platia bez zmeny.
