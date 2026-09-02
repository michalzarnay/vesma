# Číslo verzie v hlavičke (VESMA Test N)

## Pravidlo

```
verzia = 179 + počet merge-ov do `main` od commitu 062dfcf
```

Technicky: `BASE_VERSION + git rev-list --count --first-parent BASE_COMMIT..merge-base(HEAD, main)`.
Počíta to `scripts/generate-version.mjs`, ktorý zapíše `src/version.ts`.

Z toho vyplýva:

- **Jeden zlúčený PR = presne +1.** Nezáleží, či mal PR jeden commit alebo dvadsať
  a či sa zlúčil squashom alebo merge commitom — `--first-parent` ide len po
  hlavnej línii `main`.
- **Číslo nezávisí od toho, kto build spustil.** Vercel produkcia, Vercel preview,
  GitHub Actions aj lokálny `npm run dev` počítajú z tej istej histórie `main`.
- **Číslo nikdy neklesne.** Build z rozrobenej vetvy ukáže verziu `main`, z ktorej
  vetva vychádza; keď sa vetva zlúči, `main` sa posunie o +1.
- **Číslo sa nedá prepísať.** `src/version.ts` je v `.gitignore` a generuje sa
  pred každým `dev`, `build`, `preview` aj `test` behom.

## Čo sa dialo predtým

Pôvodná logika bola `BASE_VERSION(23) + git rev-list --count BASE..HEAD` a mala
tri chyby naraz:

1. Počítala **všetky** commity, nielen hlavnú líniu. PR zlúčený merge commitom
   pridal toľko čísel, koľko mal commitov. (V praxi: 135 započítaných commitov
   oproti 70 skutočným merge-om.)
2. Počítala od `HEAD`, nie od `main`. Build z vetvy dal iné číslo než build z `main`.
3. Pri plytkom (shallow) klone výpočet zlyhal a skript **ticho** vypísal
   `BASE_VERSION`, teda 23. Odtiaľ skoky typu 145 → 23.

Naviac bol `src/version.ts` verzovaný v gite, takže sa doň dalo ručne (aj
agentom) zapísať ľubovoľné číslo — a pri `npm run dev` sa práve tá zapísaná
hodnota aj zobrazovala, lebo generátor sa spúšťal len pri `build`.

## Keď build spadne na výpočte verzie

Skript zámerne **skončí chybou** namiesto tichého fallbacku — zlé číslo vo verzii
nie je vidieť, spadnutý build áno. Typická príčina je plytký klon bez prístupu
k histórii.

- V GitHub Actions: `actions/checkout@v4` s `fetch-depth: 0`.
- Núdzový východ (napr. build z tarballu bez gitu): premenná prostredia
  `VESMA_VERSION=<číslo>`. Na Verceli sa dá nastaviť v Project Settings →
  Environment Variables. Je to dočasná náplasť, nie riešenie.

## Kotva sa musí občas posunúť

**Vercel klonuje plytko a fetch v jeho build kontajneri neprejde.** Keď sa kotva
dostane mimo hĺbky klonu, skript ju nenájde, dotiahnuť ju nedokáže a build
spadne — na preview aj na produkcii.

Presne to sa stalo 2. 9. 2026: pôvodná kotva `cd36452` sa dostala 10 merge-ov za
`main` a nasadenia začali padať s hláškou „Kotviaci commit … nie je v histórii
(plytký klon?)". Predchádzajúce nasadenia prešli len preto, že kotva bola ešte
v okne — je to teda časovaná nálož, nie náhodná chyba.

### Ako kotvu posunúť

1. Zisti aktuálnu verziu `main`: `node scripts/generate-version.mjs`
2. V `scripts/generate-version.mjs` nastav `BASE_COMMIT` na HEAD vetvy `main`
   a `BASE_VERSION` na číslo z kroku 1.
3. Aktualizuj vzorec na začiatku tohto dokumentu a doplň riadok do histórie
   kotiev v komentári skriptu.

Verzia potom vyjde rovnaká ako predtým, takže postupnosť nikde neklesne ani
neskočí.

### História kotiev

| Kotva | Základná verzia | Dôvod |
|---|---|---|
| `cd36452` | 160 | Zavedenie tohto pravidla. Najvyššie číslo, aké mohla vypísať stará logika, bolo 23 + 135 = 158, takže 160 zaručilo, že postupnosť pri prechode neklesla. |
| `8959835` | 170 | Posun kvôli plytkému klonu na Verceli (2. 9. 2026). Verzia `main` bola v tom čase 170, takže sa nezmenila. |
| `062dfcf` | 179 | Druhý posun z rovnakého dôvodu (2. 9. 2026), po deviatich merge-och. Kontrola kotvy vtedy nebežala — pozri nižšie. |

### Automatické upozornenie na CI

Posúvanie kotvy je náplasť a bude sa opakovať. Aby to neprekvapilo uprostred
inej práce, `scripts/check-version-anchor.mjs` beží v CI (workflow
`.github/workflows/kontrola-kotvy-verzie.yml`) pri každom PR aj push do
`main` a **zlyhá**, keď je kotva viac než `PRAH_MERGEOV` (6) merge-ov za
`main` — teda skôr, než sa dostane mimo hĺbky plytkého klonu na Verceli
(pád nastal pri 10 merge-och). Keď tento krok zlyhá, kotvu posuň podľa
postupu vyššie.

**Pozor na príponu súboru.** Pri prvom zavedení mal workflow názov
`kontrolaKotvyVerzie` bez prípony `.yml`. GitHub Actions načítava z
`.github/workflows/` len súbory s príponou `.yml` alebo `.yaml`, takže sa
kontrola nikdy nespustila a kotva sa druhýkrát dostala mimo okna bez
varovania. Ak sa upozornenie neozve ani po prekročení prahu, over najprv,
či workflow v záložke Actions vôbec existuje.
