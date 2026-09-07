# Prihlásenie e-mailom a zber e-mailov používateľov

Pre validáciu po prezentáciách v subregiónoch potrebujeme overené e-maily
všetkých, ktorí VESMU používajú. Aplikácia je preto za jednoduchou bránou:
používateľ zadá e-mail, dostane **prihlasovací odkaz** a kliknutím naň sa
appka odomkne (na rok, v tom istom prehliadači). Heslo nie je. Podnety
a nezodpovedané otázky chatbota potom nesú overený e-mail.

## Ako to funguje

```
e-mail → POST /api/prihlasenie → Resend pošle odkaz APP_URL/?token=<odkaz>
klik   → POST /api/overenie    → token relácie do localStorage (vesma_pouzivatel)
                                 + zápis do hárku „Registrácie" cez VESMA most
podnet → POST /api/feedback { …, relacia } → server z tokenu prečíta e-mail (stĺpce H, I)
```

- Tokeny sú podpísané HMAC-SHA256, server si nič nepamätá — bez databázy.
  Kód tokenov je skopírovaný v `api/prihlasenie.ts`, `api/overenie.ts`
  a `api/feedback.ts`: Vercel funkcie bežia ako ESM a relatívny import bez
  prípony pri behu zlyhá (HTTP 500 na produkcii 7. 9. 2026). Test
  `api/__tests__/prihlasenie.test.ts` stráži, že kópie sú zhodné.
- Odkaz platí 24 h, relácia 365 dní. Odhlásenie je tlačidlo s e-mailom v hlavičke.
- **Keď prihlásenie nie je nakonfigurované** (`GET /api/prihlasenie` vráti
  `aktivne: false`), brána sa neukáže a appka beží ako doteraz. Podnet vtedy
  pýta e-mail ako povinné pole a v hárku je označený ako neoverený.
  Lokálny dev server a e2e testy bežia v tomto režime.

## Nastavenie (robí človek, raz)

1. **Resend** (https://resend.com): založiť účet, pridať doménu `inovia.sk`
   (alebo subdoménu, napr. `vesma.inovia.sk`) a do DNS pridať záznamy, ktoré
   Resend ukáže (SPF, DKIM, prípadne DMARC). Bez overenej domény Resend posiela
   len na e-mail majiteľa účtu. Vygenerovať API kľúč.
2. **Vercel → Settings → Environment Variables** (Production aj Preview):

   | Premenná | Hodnota |
   | --- | --- |
   | `RESEND_API_KEY` | kľúč z Resendu |
   | `EMAIL_ODOSIELATEL` | `VESMA <vesma@inovia.sk>` — adresa na overenej doméne |
   | `OVERENIE_SECRET` | dlhý náhodný reťazec, napr. `openssl rand -base64 48` |
   | `APP_URL` | verejná adresa bez lomky na konci: `https://vesma.inovia.sk/vesma` (na preview adresa preview nasadenia s `/vesma`) |

   Kým tieto štyri nie sú nastavené, brána je vypnutá.
3. **Google Apps Script (VESMA most)**: pribudol typ záznamu `registracia`
   a podnety aj otázky nesú dva stĺpce navyše. Do funkcie, ktorá podľa
   `action` vyberá hárok, doplniť:

   ```js
   } else if (data.action === 'registracia') {
     sheet = ss.getSheetByName('Registrácie') || ss.insertSheet('Registrácie');
     // stĺpce: A e-mail | B dátum | C odkiaľ (URL)
   }
   ```

   V hárku podnetov doplniť hlavičky **H „E-mail"** a **I „E-mail overený"**,
   v hárku nezodpovedaných otázok stĺpce **D „E-mail"** a **E „E-mail overený"**.
   Most zapisuje hodnoty v poradí, v akom prídu, takže samotný zápis funguje
   aj bez hlavičiek — tie sú pre čitateľa.
4. **Overiť**: otvoriť produkčnú adresu, zadať vlastný e-mail, kliknúť na odkaz,
   poslať skúšobný podnet a skontrolovať riadok v hárku „Registrácie" aj
   stĺpce H a I pri podnete.

## Obmedzenia, o ktorých vieme

- Bez limitu počtu odoslaných odkazov na adresu — pri zneužití by sa minul
  denný limit Resendu (100 e-mailov zadarmo). Ak sa to stane, limit doplníme.
- Odkaz treba otvoriť v tom istom prehliadači, v ktorom sa bude mapovať
  (relácia je v localStorage). Odkaz otvorený v telefóne neodomkne počítač.
- Keď `GET /api/prihlasenie` zlyhá (výpadok funkcie), appka sa otvorí bez brány.
  Zámerne: výpadok prihlásenia nemá zamknúť mapovanie.

## Pre Príručku

Odsek na začiatok: „Pri prvom otvorení VESMA zadajte svoj e-mail. Príde vám
odkaz, ktorým sa prihlásite — bez hesla. Otvorte ho v tom istom prehliadači,
v ktorom budete mapovať. Prihlásenie platí rok." Pri podnetoch: „Podnet nesie
váš e-mail, aby sme sa mohli spýtať na detail."
