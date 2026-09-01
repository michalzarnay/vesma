# Číslo verzie v hlavičke (VESMA Test N)

## Pravidlo

```
verzia = 160 + počet merge-ov do `main` od commitu cd36452
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

## Prečo 160

Nová kotva je na commite `cd36452` (HEAD `main` v čase zavedenia pravidla).
Najvyššie číslo, aké mohla vypísať stará logika, bolo 23 + 135 = 158, takže
`BASE_VERSION = 160` zaručuje, že postupnosť ani pri prechode na nové pravidlo
neklesla.
