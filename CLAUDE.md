# CLAUDE.md — pravidlá pre automatické opravy VESMA

## Kontext
VESMA je online dotazníkový nástroj pre samosprávy (voda, energia, adaptácia).
Stack: React + Vite + TypeScript + Tailwind, nasadenie na Vercel. (Over a uprav podľa reality.)

## Konaj, nepýtaj sa na povolenie
Čo je v rozsahu zadania, sprav a napíš, čo si spravil — nepýtaj sa, či smieš.
Platí to pre implementáciu, testy, dokumentáciu, založenie issue, otvorenie PR,
opravu popisu PR aj sledovanie CI. Zmena dátového modelu, nová otázka vo
formulári či úprava textov v UI samy o sebe dôvodom na opýtanie nie sú.

Otázka má zmysel len vtedy, keď by sa bez odpovede robila iná práca — nie ako
poistka pred zodpovednosťou.

## Štyri veci, ktoré rozhoduje človek
Tu sa zastav, napíš, čo navrhuješ a prečo, a počkaj:

1. **Čísla, ktoré by si si musel vymyslieť.** Referenčné hodnoty
   kWh/(m²·rok), emisné faktory, výhrevnosti palív, ceny a návratnosti
   opatrení. Na výstupe nie je vidieť, že sú vymyslené — a nástroj pre
   samosprávy tým začne klamať sebavedomo. Keď zdroj nie je, povedz to,
   nechaj hodnotu prázdnu a **zapíš ju do `docs/chybajuce-hodnoty.md`** —
   je to jediný zoznam toho, na čo sa čaká a od koho.
2. **Pravidlá hodnotenia.** Skóre areálu (`useScoring.ts`) a váhy porovnania
   (`comparisonWeights.ts`). Menia poradie areálov, teda to, kam pôjdu peniaze.
   Prepočet jednotky alebo oprava zjavnej chyby vo vzorci sem nepatrí — tie
   sprav a popíš v PR.
3. **Nezvratné a von smerujúce kroky.** Zlúčenie PR, mazanie vetiev, zásah
   priamo do `main`, čokoľvek smerom von z repozitára.
4. **Rozbitie existujúceho exportného kontraktu** na xMatik a Klimasken
   (G-label sekvencie) — teda zmena významu, poradia alebo odstránenie toho,
   čo už export obsahuje. **Pridanie nového stĺpca alebo hárku je voľné.**

## Vždy dodržuj
- Pracuj na samostatnej vetve, otvor PR. NIKDY nepushuj priamo do `main`.
- Zmenu drž v rozsahu daného zadania. Žiadne zmeny „pri tom" — čo objavíš
  popri tom, založ ako issue.
- Spusti existujúce testy. Ak chýba test pokrývajúci opravenú chybu, doplň ho.
- Commit správy a popis PR po slovensky. V popise PR uveď „Closes #<číslo>",
  ak zadanie vzniklo z issue.
- V PR napíš aj to, čo je otvorené alebo na potvrdenie — hodnoty, ktoré
  navrhuješ, a rozhodnutia, ktoré si spravil za niekoho.

## Oprav triedu, nie výskyt
Keď oprava mení podmienku alebo pravidlo — „areál bez budov sa nehodnotí",
„sezónna stavba sa nevykuruje", „toto pole je nepovinné" — nájdi **všetky
miesta, ktoré ten istý predikát používajú**, a oprav ich v jednom PR.
Test píš na úrovni toho predikátu, nie na úrovni obrazovky, kde sa chyba
náhodou ukázala.

Ako to vyzerá, keď sa to nedodrží: #203 (sezónna stavba sa energeticky
nehodnotí) → #206 (energetika ani pri areáli bez budov) → #208 (OZE ani pri
areáli bez budov). Tri PR-y za necelý deň, tri verzie navyše pre testerov
a tri kolá recenzie na jednu myšlienku.

Toto nie je výnimka z pravidla „drž sa rozsahu zadania". Dokončiť opravu
naprieč miestami, kde platí to isté pravidlo, je stále ten istý rozsah;
zmena „pri tom" je niečo iné.

Keď je oprava celej triedy priveľká na jeden PR, sprav najmenšiu zmysluplnú
časť a v popise PR **vymenuj zvyšné miesta**, aby sa nestratili.

## Číslo verzie — nikdy neupravuj ručne
`src/version.ts` je generovaný súbor (v `.gitignore`) a **necommituje sa**.
Číslo číta `scripts/generate-version.mjs` z `version.json` v koreni repozitára
(pozri `docs/verziovanie.md`). Do `version.json` nezapisuj — zvyšuje ho
workflow „Číslo verzie" po každom zlúčení do `main`. Verzia sa teda posunie
sama tým, že sa PR zlúči; ručný zásah ju len rozhodí.

## UI a interakčné chyby — zvýšená opatrnosť
Nevidíš vykreslenú stránku ani na ňu nevieš kliknúť — pri vizuálnych
a interakčných chybách usudzuješ len z kódu. Preto:
- „Regresiu" v UI neopravuj bez reprodukovateľného prípadu. Ak príčinu nevieš
  overiť z kódu, NErob špekulatívnu opravu — napíš, čo vidíš, a nechaj overenie
  na človeka.
- Pri hlásení „niečo nefunguje/nezobrazuje sa" najprv zváž, či nejde o stav
  bez dát (prázdny areál, čerstvá session), než začneš meniť kód.
- Zmeny vzhľadu nesmú meniť správanie navigácie ani interaktívnych prvkov.

## Keď je niečo nejednoznačné
Nejednoznačnosť sama osebe nie je dôvod zastaviť sa. Bežné rozhodnutie sprav
sám, napíš, z čoho si vychádzal, a pokračuj.

Zastav sa len vtedy, keď by si pri zlom odhade urobil škodu, ktorú nikto
nezbadá — najmä pri veciach zo štyroch bodov vyššie. Vtedy zhrň pochybnosti
do komentára v issue alebo PR a počkaj.

Ak nevieš rozhodnúť, či ide o chybu alebo o zámer, sprav najmenšiu zmenu,
ktorá dáva zmysel, a v PR napíš, čo si predpokladal.
