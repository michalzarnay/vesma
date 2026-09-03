# Hodnotenie MZI podľa metodiky KLIMASKEN

Skóre modro-zelenej infraštruktúry (MZI) vo VESMA sa počíta podľa metodiky
nástroja [KLIMASKEN](https://www.klimasken.sk) (CI2, o. p. s.; projekt
LIFE17 CCA/SK/000126 – LIFE DELIVER). Implementácia je v
`src/utils/mziKlimasken.ts`, typy v `src/types/scoring.ts`.

Klimasken hodnotí mestá aj jednotlivé budovy niekoľkými desiatkami indikátorov
a výsledok zobrazuje ako „klimatický štítok" — hodnoty indikátorov zaraďuje do
päťstupňovej škály **A–E** (A = tmavozelená, najlepší stav; E = červená,
najhorší). Pre MZI sú relevantné tri metodické listy pre budovy.

## Použité indikátory

| Indikátor | Názov | Jednotka | Váha vo VESMA |
|---|---|---|---|
| **B-GOV2** | Zadržiavanie zrážkovej vody v okolí budovy | koeficient MZI (0–1) | 45 b |
| **B-GOV3** | Zachytávanie zrážkovej vody na budove | koeficient MZI (0–1) | 25 b |
| **B-AD10** | Kapacita budovy na akumuláciu dažďovej vody | % | 15 b |
| — | Odtok zo spevnených plôch (doplnok VESMA) | % odtokovej plochy | 15 b |

Komponent, pre ktorý v dotazníku nie sú údaje, sa do skóre **nezapočíta** —
výsledok sa normalizuje len cez dostupné komponenty. Areál tak nie je
penalizovaný za neodpovedanú otázku.

### B-GOV2 — priepustnosť a zeleň areálu

Vážený koeficient MZI: `Σ(k · S) / Σ(S)`, kde `k` je funkčný koeficient MZI
daného typu povrchu a `S` jeho výmera. Prvky, ktoré ležia nad základným
povrchom (stromy, objekty hospodárenia s dažďovou vodou, prekoreniteľný
priestor), sa podľa príkladu v metodickom liste pripočítavajú do čitateľa aj
menovateľa ako samostatné plochy.

| Kód | Popis | k | Pole v dotazníku VESMA |
|---|---|---|---|
| A | nepriepustné spevnené plochy | 0 | `spevnenaPlochaCelkom` |
| B | dlažba so škárou < 15 mm, mlatová plocha | 0,2 | `polopriepustnaMlatovyPovrch` |
| C | priepustný kryt, nespevnená plocha bez rastlinného krytu | 0,4 | priepustný asfalt/betón, vodopriepustná dlažba, živica + kremičitý štrk, Stered, `priepustnaPlochaObrabanaPoda` |
| G | súvislý rastlinný kryt na silno zhutnenom podklade | 0,4 | `polopriepustnaPlnevegetacneTvarnice` |
| H | zatrávnená plocha s intenzívnou údržbou | 0,7 | `priepustnaPlochaByliny` |
| J | mohutné stromy v zapojenom poraste | 1,0 | `priepustnaPlochaStromy` (zdravé vzrastlé) |
| K | vzrastovo menšie a mladé stromy | 0,4 | podiel `stromyPodielMladych` + `stromyPodielNezdravych` |
| L | plochy kríkov výšky nad 1 m | 0,4 | `priepustnaPlochaKry` |
| P | podzemný prekoreniteľný priestor pre stromy | 0,6 | `prekorenetelnyPriestorPreStromy` |
| R | objekty HDV regulujúce odtok | 0,8 | `vsakovaciaPrehlbenaRegulovanyOdtok` |
| S | plošné objekty HDV umožňujúce vsak | 1,0 | `dazdovaZahradaPlocha`, `jazierkoPlocha`, `vsakovaciaPrehlbenaBezpecnostnyPrepad` |

Škála: **E** ≤ 0,2 · **D** > 0,2–0,3 · **C** > 0,3–0,6 · **B** > 0,6–0,8 · **A** > 0,8

### B-GOV3 — zeleň a retencia na budovách

| Kód | Popis | k | Pole v dotazníku VESMA |
|---|---|---|---|
| XX | povrch strechy a fasády bez úprav | 0 | zvyšok `plochaPodorysu` |
| D | zelená stena, popínavé rastliny | 0,6 | `zelenaStenaBudov`, `zelenaStenaNaPozemku` |
| E1 | extenzívna strešná záhrada — plochá strecha (substrát do 200 mm) | 0,6 | `zelenaStrechaBudovExtenzivnaPloca` |
| E2 | extenzívna strešná záhrada — sklon od 35° | 0,3 | `zelenaStrechaBudovExtenzivnaSikma` |
| F | intenzívna strešná záhrada (substrát nad 200 mm) | 0,8 | `zelenaStrechaBudovIntenzivna` |
| Y | modrá, resp. modrozelená strecha (100 % zadržanie) | 1,0 | `zelenaStrechaBudovModrozelena` |
| Z | strecha so štrkovým zásypom | 0,4 | `zelenaStrechaBudovStrkova` |

Škála: **E** = 0 · **D** > 0–0,1 · **C** > 0,1–0,3 · **B** > 0,3–0,5 · **A** > 0,5

### B-AD10 — akumulácia zrážkovej vody

Podiel skutočného objemu nádrží `Va` na potrebnom objeme `Vn`:

```
Q  = j · P · fs · ff / 1000      množstvo zachytenej zrážkovej vody (m³/rok)
Vv = n · Sd · R · z / 1000       potrebný objem podľa spotreby (m³)
Vp = z · Q / 365                 potrebný objem podľa množstva vody (m³)
Vn = min(Vv; Vp)
X  = Va / Vn · 100 %
```

`j` = úhrn zrážok (`areal.mnozstvoZrazok`), `P` = plocha striech,
`fs` = koeficient odtoku strechy, `ff` = 0,9, `n` = počet osôb
(`areal.pocetZamestnancov`), `Sd` = 140 l/os./deň, `R` = 0,5, `z` = 20.
`Va` je súčet `nadzemneNadobyObjem` + `podzemneNadobyObjem`.

Ak je známy len jeden z objemov `Vv`/`Vp`, použije sa ten; ak ani jeden,
komponent sa nezapočíta.

Škála: **E** ≤ 1 % · **D** ≤ 20 % · **C** ≤ 50 % · **B** ≤ 75 % · **A** > 75 %

### Odtok zo spevnených plôch (doplnok VESMA)

Nejde o indikátor Klimaskenu. Vyjadruje podiel **odtokovej plochy** (vážený
výmerou), z ktorej zrážková voda smeruje do **vsaku alebo retenčnej nádrže**
namiesto kanalizácie, vodného toku či neriešeného odtoku.

**Odtoková plocha = spevnená + polopriepustná plocha pozemkov + pôdorys striech.**
Priepustná plocha sa do komponentu nezapočítava, a to zámerne: z priepustného
povrchu zrážka vsiakne tam, kde spadne, takže „neriešený" odvod na ňom nie je
nedostatok, ale práve žiaduci stav. Záhrada s celou plochou v tráve tak nedostane
nula bodov za to, že odvod vody nemá technicky riešený — komponent sa jej vôbec
nepočíta (`null`) a skóre sa normalizuje cez ostatné. Kvalita priepustného
povrchu sa prejaví v koeficiente MZI indikátora B-GOV2, kde patrí.

## Vysvetlenie bodov

Pri každom komponente sa vo výsledkoch zobrazí **veta**, ktorá povie, z čoho body
vznikli, a tlačidlom **„Zobraziť výpočet"** sa otvorí **tabuľka** v tvare
metodických listov Klimaskenu — povrch, kód, výmera, koeficient, príspevok,
a pod ňou výpočet výsledného koeficientu a zaradenie do pásma.

Vetu aj tabuľku možno skopírovať malým tlačidlom. Tabuľka sa kopíruje **ako text
oddelený tabulátormi**, takže Word aj Excel z nej spravia skutočnú tabuľku
(Word: Vložiť → Previesť text na tabuľku). Čísla sú v slovenskom formáte
s desatinnou čiarkou, aby ich Excel prevzal ako čísla, nie ako text.

To isté je v XLSX exporte na hárku **„Výpočet MZI"**.

Implementácia: `src/utils/mziVysvetlenie.ts` (skladá vetu a tabuľku),
`src/components/wizard/VypocetDialog.tsx` (modálne okno),
`src/components/ui/CopyButton.tsx` (kopírovanie). Rozpis plôch
a medzivýsledky poskytujú `plochyOkolia()`, `plochyBudov()`,
`detailAkumulacie()` a `detailOdtoku()` v `src/utils/mziKlimasken.ts`.

Rovnaké vysvetlenie pre OZE a energetiku rieši druhá etapa issue #213 —
tam si vyžaduje prepis bodovej logiky, ktorá dnes prirážky nikde nezaznamenáva.

## Zámerné odchýlky od metodiky

Sú vynútené rozsahom dotazníka VESMA. Nejde o chyby — sú zdokumentované aj
v komentári na začiatku `src/utils/mziKlimasken.ts`.

1. **Rozsah okolia.** B-GOV2 ohraničuje okolie kolmicou 20 m od stien budovy.
   VESMA nemá geometriu areálu, preto sa počíta z celej plochy zadaných pozemkov.
2. **Menovateľ pri budovách.** B-GOV3 dáva do menovateľa plochu striech aj fasád.
   VESMA neeviduje celkovú plochu fasád, preto menovateľ tvorí pôdorysná plocha
   striech a nahlásená plocha zelených stien. Koeficient je tým mierne
   optimistickejší.
3. **Koeficient odtoku strechy.** B-AD10 ho odvodzuje z materiálu krytiny; VESMA
   má materiál len ako voľný text, preto sa používa typická hodnota `fs = 0,8`.
4. **Povrchy mimo zoznamu metodiky.** Polovegetačné tvárnice a „iný povrch" sú
   zaradené medzi kódy B a C hodnotou 0,3. Rovnakou hodnotou sa hodnotí
   nešpecifikovaný zvyšok polopriepustnej plochy.
5. **Jazierko** metodika nepozná; hodnotí sa ako plošný objekt HDV (k = 1,0).
6. **Zelená strecha bez rozpisu na typy** sa odhadne z tvaru strechy — plochá
   ako E1, šikmá a strmá ako E2.
7. **Nádrž, ktorú nie je možné inštalovať.** Metodika B-AD10 hovorí, že „ak
   inštalácia nádrže nie je možná alebo je vylúčená… budova je v tomto
   indikátore označená v najhoršej kategórii“. VESMA komponent namiesto toho
   **vynecháva** (`areal.nadrzNieJeMozna`). Dôvod: Klimasken je štítok, ktorý
   popisuje stav objektu, kým hodnotenie areálu vo VESMA k stavu **navrhuje aj
   opatrenia** — komponent, na ktorý sa nedá reagovať, by skóre len skresľoval
   a nástroj by navyše odporúčal nerealizovateľné opatrenie. Vo výsledkoch sa
   preto nezobrazí „bez údajov“, ale „nehodnotí sa“ spolu so zadaným dôvodom,
   takže informácia sa nestratí (issue #215).

## Zmena oproti pôvodnému hodnoteniu

Pôvodné MZI skóre tvorili štyri heuristické zložky po 25 bodoch (podiel
priepustných plôch, existujúce opatrenia, stav zelene, potenciál zlepšenia)
s bodovými prirážkami typu „dažďová záhrada → +5 b". Nové skóre je odvodené
z funkčných koeficientov Klimaskenu, takže je porovnateľné s klimatickými
štítkami miest a budov v SR a ČR.

Dôsledky, na ktoré treba myslieť pri porovnaní starších a nových hodnotení:

- **Skóre nie je spätne porovnateľné** so skóre spočítaným pred touto zmenou.
- Zložka „potenciál zlepšenia" zanikla — potenciál sa už v skóre nemieša so
  stavom. Absolútny potenciál zostáva v `ScoreResult.mziPotencial` a v
  porovnaní areálov (`src/data/comparisonWeights.ts`), ktoré táto zmena
  nemení.
- **Pravidelne obrábaná pôda** sa už nehodnotí ako trávnik, ale ako kód C
  (0,4 vs. 0,7) — pozri nižšie.

## Pravidelne obrábaná pôda (issue #196)

Pôda, ktorá sa aspoň dvakrát do roka orie, ryje alebo kyprí a ostáva nezakrytá
(zeleninové hriadky, záhony, poľnohospodárske polia), je samostatný typ
prírodného povrchu s koeficientom **0,4** (kód C). Oproti trávniku (kód H, 0,7):

- po zoraní sa pri prívalovej zrážke zaškrupinatie a voda odteká namiesto
  vsakovania (navyše s eróziou),
- bez súvislého koreňového systému horšie drží vlahu,
- mimo vegetačnej sezóny nie je čo evapotranspirovať, holý povrch sa prehrieva.

**Mulčované záhony sem nepatria** — mulč pôdu chráni pred škrupinatením aj
výparom, preto sa uvádzajú ako byliny.

Pole `priepustnaPlochaObrabanaPoda` vzniklo premenovaním pôvodného
`priepustnaPlochaHolaPoda` (skrytého z formulára v issue #128, kde išlo
o *dočasne* holé miesto v trávniku). Staré hodnoty prenáša `migratePozemok`
v `src/hooks/useArealState.ts`.

V porovnaní areálov (`src/data/comparisonWeights.ts`) sa obrábaná pôda
**nezapočítava** do parametra „na lúku, prípadne namiesto krov sa vysadia mladé
stromy“ — na hriadky ani na pole sa stromy spravidla nesadia.

Nadväzujúce odporúčania (mulčovanie, krycie plodiny, obmedzenie orby) rieši
issue #200.

## Zdroje

- [Indikátory KLIMASKENu](https://www.klimasken.sk/sk/indikatory-klimaskenu) —
  zoznam indikátorov a metodické listy na stiahnutie
- [Metodický list B-GOV2](https://www.klimasken.sk/sk/download/metodicky_list-B-GOV2.pdf)
- [Metodický list B-GOV3](https://www.klimasken.sk/sk/download/metodicky_list-B-GOV3.pdf)
- [Metodický list B-AD10](https://www.klimasken.sk/sk/download/metodicky_list-B-AD10.pdf)
- [Informácie o KLIMASKENe](https://www.klimasken.sk/sk/informace-o-klimaskenu) —
  päťstupňová škála A–E a klimatický štítok

Index modrozelenej infraštruktúry, z ktorého B-GOV2 a B-GOV3 vychádzajú,
pochádza od J. Vitka (JV PROJEKT VH s.r.o.); Klimasken ho modifikoval pre
hodnotenie budov.
