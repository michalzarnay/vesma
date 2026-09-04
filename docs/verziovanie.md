# Číslo verzie v hlavičke (VESMA Test N)

## Pravidlo

```
verzia = číslo zapísané vo `version.json` v koreni repozitára
```

Súbor vyzerá takto:

```json
{
  "verzia": 191
}
```

`scripts/generate-version.mjs` ho len prečíta a zapíše `src/version.ts`.
**Nepočíta nič a git vôbec nepotrebuje.**

Číslo prináša **sama vetva**: pred otvorením PR spusti

```bash
npm run verzia
```

Nastaví `version.json` na (verzia na `main`) + 1 a ty ho commitneš spolu so
zmenou. Workflow `.github/workflows/verzia.yml` pri každom PR overí, že to
sedí. Zlúčením PR sa `main` posunie o +1.

Z toho vyplýva:

- **Jeden zlúčený PR = presne +1.** Nezáleží, či mal PR jeden commit alebo
  dvadsať a či sa zlúčil squashom alebo merge commitom.
- **Číslo nezávisí od toho, kto build spustil.** Vercel produkcia, Vercel
  preview, GitHub Actions aj lokálny `npm run dev` čítajú ten istý súbor.
  Build z vetvy ukáže verziu `main`, z ktorej vetva vychádza.
- **Číslo nikdy neklesne.** Počíta sa z `main`, nie prírastkom k tomu, čo je
  vo vetve. Že dve zostavy nedostanú to isté číslo, tým ale zaručené **nie je**
  — pozri „Súbežné PR-y" nižšie.
- **Číslo sa nedá prepísať ručne.** `src/version.ts` je v `.gitignore`
  a generuje sa pred každým `dev`, `build`, `preview` aj `test` behom.
  Do `version.json` píš len cez `npm run verzia`.

## Keď kontrola verzie pri PR zlyhá

```
[verzia] version.json má 191, ale na main je 191 — očakáva sa 192.
```

Znamená to, že sa medzitým zlúčil iný PR. Spusti `npm run verzia`, commitni
`version.json` a je to. Nie je to chyba, len poradie.

Druhá hláška hovorí, že vetva verziu nezvýšila vôbec:

```
[verzia] version.json má 191 — rovnako ako main. Táto zmena verziu nezvýšila.
```

Rieši sa rovnako. Kontrola je zámerne prísna — pripustiť zhodu s `main` by
znamenalo prepustiť práve ten PR, ktorý na verziu zabudol.

## Súbežné PR-y

Kontrola pri PR beží pri otvorení a pri každom pushi do vetvy, **nie pri
zlúčení**. Dva PR-y otvorené naraz teda obidva uvidia to isté `main`, obidva si
nastavia rovnaké číslo a obidvom kontrola prejde. Keď sa zlúčia oba, druhý
merge to číslo ticho použije znova.

Stalo sa to pri verzii **196**, ktorú nesú tri zlúčené PR-y (#230, #229, #228)
— „podnet k zostave 196" tak ukazuje na tri rôzne stavy aplikácie (#231).

Na to sú dve poistky:

1. **`po-zluceni`** v `verzia.yml` — po pushi do `main` overí, že sa číslo
   posunulo o jedna, a inak zlyhá. Nezastaví to, len hneď pomenuje.
2. **„Require branches to be up to date before merging"** v ochrane `main`.
   Toto tomu zabráni: druhý PR musí pred zlúčením dobehnúť `main`, čím sa
   kontrola pri PR spustí znova a vypýta si ďalšie číslo. Je to nastavenie
   repozitára, nie kód — zapína ho človek s právami správcu.

Spätne sa čísla neprečíslovávajú. Zostavy, ktoré už boli nasadené, si svoje
číslo nechajú; ide o to, aby sa to nedialo ďalej.

## Keď build spadne na verzii

Skript zámerne **skončí chybou** namiesto tichého fallbacku — zlé číslo vo
verzii nie je vidieť, spadnutý build áno. Príčinou je chýbajúci alebo
poškodený `version.json`.

Núdzový východ (napr. build z tarballu bez repozitára): premenná prostredia
`VESMA_VERSION=<číslo>`. Na Verceli sa dá nastaviť v Project Settings →
Environment Variables. Je to dočasná náplasť, nie riešenie.

## Čo sa dialo predtým

### Prvá logika: všetky commity od kotvy

`BASE_VERSION(23) + git rev-list --count BASE..HEAD` malo tri chyby naraz:

1. Počítalo **všetky** commity, nielen hlavnú líniu. PR zlúčený merge commitom
   pridal toľko čísel, koľko mal commitov. (V praxi: 135 započítaných commitov
   oproti 70 skutočným merge-om.)
2. Počítalo od `HEAD`, nie od `main`. Build z vetvy dal iné číslo než build
   z `main`.
3. Pri plytkom klone výpočet zlyhal a skript **ticho** vypísal `BASE_VERSION`,
   teda 23. Odtiaľ skoky typu 145 → 23.

Naviac bol `src/version.ts` verzovaný v gite, takže sa doň dalo ručne (aj
agentom) zapísať ľubovoľné číslo.

### Druhá logika: kotva a jej posúvanie

Opravou bolo `BASE_VERSION + git rev-list --count --first-parent BASE_COMMIT..merge-base(HEAD, main)`.
Číslovanie sedelo, ale výpočet potreboval históriu `main` až po kotviaci commit —
a **Vercel klonuje plytko, pričom fetch v jeho build kontajneri neprejde**.
Keď sa kotva dostala mimo hĺbky klonu, build spadol na preview aj na produkcii.

Kotvu bolo preto treba občas ručne posunúť. Stálo to šesť PR-ov — #164, #189,
#191, #192, #199 a časť #208 — a dve spadnuté nasadenia (2. 9. 2026). Pribudla
aj kontrola `check-version-anchor.mjs`, ktorá mala posun ohlásiť skôr, než
zhodí build; tá sama prvýkrát nezafungovala, lebo súbor workflowu nemal príponu
`.yml` (#192).

História kotiev, kým existovali:

| Kotva | Základná verzia | Dôvod |
|---|---|---|
| `cd36452` | 160 | Zavedenie počítania po prvej rodičovskej línii. |
| `8959835` | 170 | Posun kvôli plytkému klonu na Verceli (2. 9. 2026). |
| `062dfcf` | 179 | Druhý posun z rovnakého dôvodu (2. 9. 2026). |
| `fb10457` | 186 | Tretí posun (3. 9. 2026), preventívny. |

### Prečo súbor namiesto výpočtu

Kotva bola časovaná nálož: fungovala, kým sa nevzdialila, a potom zhodila
nasadenie uprostred inej práce. Číslo zapísané v súbore žiadnu históriu
nepotrebuje, takže s kotvou zaniká celá tá trieda pádov — aj kontrola, ktorá
ju strážila.

Cena je jeden commit navyše na `main` po každom merge a krátky okamih, keď je
na produkcii ešte staré číslo. Oboje je vidieť a nič nerozbíja.
