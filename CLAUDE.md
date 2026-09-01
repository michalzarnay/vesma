# CLAUDE.md — pravidlá pre automatické opravy VESMA

## Kontext
VESMA je online dotazníkový nástroj pre samosprávy (voda, energia, adaptácia).
Stack: React + Vite + TypeScript + Tailwind, nasadenie na Vercel. (Over a uprav podľa reality.)

## Zakázané oblasti — NIKDY neupravuj bez človeka
Ak sa oprava dotýka týchto oblastí, NEopravuj. Napíš do issue/PR komentár
s vysvetlením a počkaj na rozhodnutie:
- Metodická príručka a znalostná báza chatbota (riadi spoľahlivosť chatbota).
- Dátová schéma a dátový model.
- Exportný kontrakt na xMatik a Klimasken (G-label sekvencie).
- Čokoľvek, čo mení správanie, UX alebo rozsah funkcií (nielen opravuje chybu).

## Vždy dodržuj
- Pracuj na samostatnej vetve, otvor PR. NIKDY nepushuj priamo do `main`.
- Zmenu drž minimálnu a striktne v rozsahu daného issue. Žiadne zmeny „pri tom".
- Spusti existujúce testy. Ak chýba test pokrývajúci opravenú chybu, doplň ho.
- Commit správy a popis PR po slovensky. V popise PR uveď „Closes #<číslo>".

## Číslo verzie — nikdy neupravuj ručne
`src/version.ts` je generovaný súbor (v `.gitignore`) a **necommituje sa**.
Číslo počíta `scripts/generate-version.mjs` z histórie vetvy `main`
(pozri `docs/verziovanie.md`). Nikdy doň nezapisuj číslo ručne a nikdy ho
nepridávaj do gitu — verzia sa posunie sama tým, že sa PR zlúči do `main`.

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
Ak je „chyba" možno zámer, popis nejasný, alebo si nie si istý príčinou —
neopravuj. Zhrň pochybnosti do komentára v issue a počkaj na človeka.
