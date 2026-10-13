# Plán bezpečnostného auditu VESMA

Stav: **návrh plánu** (nič z neho ešte nebolo vykonané).
Cieľ: <https://vesma.inovia.sk/vesma/> a tento repozitár.

Plán vznikol zlúčením dvoch podkladov:

- návrh zostavený z reálnej štruktúry repozitára (`api/`, `vercel.json`,
  `.github/workflows/`, závislosti),
- všeobecná šablóna black-box auditu (proces, rozsah, riziková škála,
  šablóna nálezu, kritériá ukončenia).

Z šablóny sa preberá **proces**, z repozitára **obsah**. Časti šablóny, ktoré
na VESMA nesedia, sú vymenované v časti „Čo sa nekontroluje".

## 1. Čo je VESMA z pohľadu bezpečnosti

Overené z repozitára:

- React + Vite + TypeScript, statický front-end na Verceli (`vercel.json`).
- Žiadna databáza, žiadne účty ani role, žiadne cookies.
- Dáta areálov žijú v prehliadači (`localStorage`, IndexedDB).
- Server tvorí 5 Vercel funkcií v `api/`: `prihlasenie`, `overenie`,
  `feedback`, `pvgis`, `svp-flood`.
- Prihlásenie e-mailovým odkazom: HMAC-SHA256 token (`odkaz` 24 h,
  `relacia` 1 rok), e-mail cez Resend. Kód tokenov je skopírovaný v troch
  súboroch (`prihlasenie.ts`, `overenie.ts`, `feedback.ts`).
- Podnety a nezodpovedané otázky chatbota idú cez `api/feedback.ts` do
  Google Sheetu (Apps Script Web App, tajomstvo `SHEET_WEBHOOK_SECRET`).
- Nahrávanie PDF a XLSX sa spracúva **v prehliadači** (`pdfjs-dist`, `xlsx`).
- CI obsahuje workflowy s Claude agentom (`claude.yml`, `auto-fix.yml`,
  `batch-autofix.yml`, `claude-code-review.yml`) s tajomstvom
  `CLAUDE_CODE_OAUTH_TOKEN`.

## 2. Rozsah a podmienky (potvrdzuje človek)

Pred akýmkoľvek testom proti nasadenej aplikácii treba zapísať:

- [ ] súhlas vlastníka (INOVIA) a zoznam domén v rozsahu,
- [ ] povolené časy, kontaktná osoba, podmienky prerušenia testu,
- [ ] zakázané testy (záťaž, DoS, hromadné odosielanie e-mailov, zápisy do
      produkčného Google Sheetu),
- [ ] limit požiadaviek pre automatické nástroje.

Pravidlá práce:

- Aktívne testy bežia na **lokálnej kópii alebo preview nasadení** so
  syntetickými údajmi, nie na produkcii.
- Kroky smerujúce von z repozitára (skenovanie živej domény, odosielanie
  testovacích e-mailov cez Resend, zápis do Sheetu) spúšťa alebo výslovne
  schvaľuje človek (pozri `CLAUDE.md`, bod 3).
- Skutočné tajomstvá sa nikdy nevypisujú do reportov ani issue. Pri úniku
  sa tajomstvo rotuje.

## 3. Rizikové triedy testov

Označenia opisujú riziko testu pre prevádzku, **nie** závažnosť nálezu.

| Trieda | Čo | Kde sa smie |
|---|---|---|
| P1 | Pasívne kontroly: hlavičky, TLS, verejné súbory, závislosti, statická analýza, čítanie kódu | Aj na produkcii (s limitom požiadaviek) |
| P2 | Funkčné testy prihlásenia s vlastným e-mailom | Preview alebo lokálne; produkcia len so súhlasom |
| P3 | Aktívne testy vstupov a API (XSS, nevalidné vstupy, formula injection, fuzz tokenov) | Len lokálne alebo preview, syntetické dáta |
| P4 | Záťažové a deštruktívne testy | Mimo rozsahu tohto auditu |

## 4. Oblasti auditu

Poradie zodpovedá odhadovanému riziku. Každá položka je kontrola, nie
potvrdený nález.

### A. Prihlasovanie a tokeny — `api/prihlasenie.ts`, `overenie.ts`, `feedback.ts` (P1, P2, P3)

- [ ] Podvrhnutie podpisu: manipulácia tela, bodky, dĺžky, prázdne podpisy.
- [ ] Oddelenie polí `typ|email|exp`: správanie, keď e-mail obsahuje `|`
      alebo iné špeciálne znaky (aj mimo bežnej validácie `jePlatnyEmail`).
- [ ] Typ tokenu: či `feedback.ts` a `overenie.ts` prijmú iba očakávaný typ
      (`odkaz` vs. `relacia`).
- [ ] Opakované použitie odkazu (platí 24 h, nie je jednorazový) a životnosť
      relačného tokenu (1 rok) bez možnosti odvolania.
- [ ] Token v URL (`?token=`): únik cez históriu, logy, hlavičku Referer.
- [ ] Rate limiting `POST /api/prihlasenie` (zneužitie na spam z domény,
      vyčerpanie kvóty Resendu).
- [ ] Injekcia do HTML e-mailu a otvorené presmerovanie cez `APP_URL`.
- [ ] Správanie bez konfigurácie (chýba premenná = brána vypnutá): overiť,
      že produkcia má všetky 4 premenné nastavené.
- [ ] `feedback.ts`: kedy sa berie e-mail z tela požiadavky ako neoverený
      a či sa dá zneužiť na vydávanie sa za iného.
- [ ] Zhoda troch kópií token kódu (existujúci test) a či sa kópie dajú
      udržať bez driftu.

### B. API funkcie a proxy — `api/*` (P1, P3)

- [ ] Validácia `lat` a `lon` v `pvgis.ts`, `svp-flood.ts` (NaN, rozsah,
      iné typy). Cieľová URL je pevná, mení sa len dosadzovaný parameter.
- [ ] SSRF: nič z požiadavky netvorí hostiteľa ani cestu odchádzajúceho volania.
- [ ] `feedback.ts`, `overenie.ts`: limity dĺžky a počtu polí, typ obsahu,
      povolené HTTP metódy.
- [ ] **Formula injection** do Google Sheetu: hodnoty začínajúce `=`, `+`,
      `-`, `@` sa musia neutralizovať.
- [ ] `SHEET_WEBHOOK_SECRET` a ďalšie tajomstvá neuniknú do odpovede, chýb
      ani logov.
- [ ] CORS, chybové odpovede (únik interných detailov), timeouty upstreamu.
- [ ] Zneužitie ako otvoreného proxy / amplifikácia požiadaviek.

### C. CI a Claude workflowy — `.github/workflows/` (P1)

- [ ] Kto môže spustiť agenta (komentár `@claude`, issue, label): obmedzenie
      na dôveryhodných používateľov.
- [ ] Prompt injection cez text issue, komentárov a obsah PR.
- [ ] `permissions:` podľa princípu najmenších práv v každom workflowe.
- [ ] Použitie `pull_request_target` a spúšťanie kódu z cudzích forkov.
- [ ] Pripnutie akcií na SHA namiesto tagov.
- [ ] Ako sa tajomstvá (`CLAUDE_CODE_OAUTH_TOKEN`, `SHEET_*`) dostávajú do
      krokov a logov.
- [ ] Nastavenia repozitára (z kódu neviditeľné, kontroluje človek): ochrana
      `main`, povinná recenzia, „Require branches to be up to date", kto
      smie spúšťať workflowy.

### D. Front-end — `src/` (P1, P3)

- [ ] XSS: prejsť všetky výskyty `dangerouslySetInnerHTML`, `innerHTML`,
      `eval`, `window.open`, dynamických `href`; osobitne `ChatPanel.tsx`
      (obsah z LLM / od používateľa).
- [ ] Marker `VESMA-SECURITY-TEST-<>&"'` v textových poliach a jeho
      zobrazenie v UI, tabuľkách a exportoch (PDF, XLSX).
- [ ] Formula injection aj v **exportoch** do XLSX/CSV.
- [ ] Import uloženej relácie (`ulozeneRelacie.ts`, `useLocalStorage.ts`):
      neplatný alebo škodlivý JSON, prototype pollution, kľúče `__proto__`.
- [ ] Ukladanie relačného tokenu v `localStorage`: dopad pri XSS.
- [ ] Nahrávanie súborov: limit veľkosti a typu, správanie pri poškodených
      alebo veľmi veľkých PDF/XLSX (pád stránky, DoS v prehliadači).
- [ ] Premenné `VITE_*`: nič tajné sa nevkladá do klientskeho balíka.

### E. Závislosti a tajomstvá (P1)

- [ ] `npm audit` a `npm audit --omit=dev`, vyhodnotenie nálezov v kontexte.
- [ ] **`xlsx@0.18.5`**: známe zraniteľnosti (prototype pollution, ReDoS),
      balík nie je na npm udržiavaný. Rozhodnutie: náhrada alebo prijatie
      rizika (rozhoduje človek, ide o zmenu závislosti).
- [ ] `jspdf`, `pdfjs-dist`: aktuálne verzie a známe CVE.
- [ ] Gitleaks nad **celou históriou** gitu.
- [ ] `.claude/settings.local.json` je commitnutý: skontrolovať obsah
      (povolenia, cesty, tajomstvá).
- [ ] `.env` je v `.gitignore`, skontrolovať, že sa nikdy nedostal do histórie.
- [ ] Semgrep (`--config auto`) a Trivy / OSV nad repozitárom.

### F. Nasadenie a hlavičky (P1)

`vercel.json` nenastavuje žiadne bezpečnostné hlavičky. Vercel niektoré
pridáva sám, preto sa musia overiť na živej URL.

- [ ] `Strict-Transport-Security`, `Content-Security-Policy`,
      `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
      `X-Frame-Options` / `frame-ancestors`, `Permissions-Policy`.
- [ ] `Cache-Control` odpovedí z `api/` (nesmú sa cachovať odpovede s
      osobnými údajmi).
- [ ] Presmerovania (žiadne na neočakávané domény ani HTTP).
- [ ] TLS: certifikát, reťazec, `testssl.sh --fast`.
- [ ] Verejne dostupné súbory (`public/`, source mapy v produkcii).
- [ ] OWASP ZAP Baseline proti preview nasadeniu (nie je to penetračný test,
      nálezy sa potvrdzujú ručne).

### G. Osobné údaje a súkromie

- [ ] Inventár: e-maily (Resend, Google Sheet), text podnetov a otázok
      chatbota, údaje o areáloch v prehliadači.
- [ ] Čo sa posiela tretím stranám (Resend, Google, služby PVGIS a SVP,
      poskytovateľ LLM pre chat) a či sa tam môžu dostať osobné údaje.
- [ ] Čo sa loguje na Verceli (tokeny, e-maily, telá požiadaviek).
- [ ] Retencia a mazanie záznamov v Sheete, kto má do Sheetu prístup.
- [ ] Právny základ, účel a informačná povinnosť. Technické testy súlad s
      GDPR nepreukážu, toto posudzuje človek (právnik / zodpovedná osoba).

## 5. Čo sa nekontroluje (nesedí na architektúru VESMA)

- Správa databázy, SQL injection, obnova zo zálohy (databáza neexistuje).
  Obdobou je formula injection do Sheetu, ktorá je v oblastiach B a D.
- Horizontálna a vertikálna autorizácia medzi účtami A/B a administrátorom
  (na serveri nie sú používateľské dáta ani role). Zostáva len bod o
  neoverenom e-maile v `feedback.ts` (oblasť A).
- CSRF a atribúty cookies (autentifikácia nejde cez cookies). Relevantnejšie
  je riziko krádeže tokenu cez XSS.
- Kontrola OS servera (`systemctl`, `ss`, `apt`): Vercel je serverless.
- Záťažové a deštruktívne testy (trieda P4).

Ak sa architektúra zmení (databáza, účty, role, cookies), plán sa doplní.

## 6. Nástroje

| Nástroj | Na čo | Trieda |
|---|---|---|
| `npm audit` | známe CVE v závislostiach | P1 |
| Gitleaks (`dir` aj `git`) | tajomstvá v súboroch a histórii | P1 |
| Semgrep | statická analýza bezpečnostných vzorov | P1 |
| Trivy / OSV-Scanner | závislosti a konfigurácie | P1 |
| `curl`, `openssl`, `testssl.sh` | hlavičky a TLS | P1 |
| OWASP ZAP Baseline | pasívna analýza nasadenia | P1 |
| Vitest (`api/__tests__`) | opakovateľné testy hraničných vstupov | P3 |
| Playwright (`e2e/`) | XSS marker a správanie UI | P3 |

Výsledky automatických nástrojov sú **kandidáti na nález**, nie nálezy.
Každý sa potvrdzuje v kontexte.

## 7. Postup

1. **Rozsah a súhlas** (človek): vyplniť časť 2.
2. **Pasívne kontroly a automatika** (oblasti E, F): `npm audit`, Gitleaks,
   Semgrep, Trivy, hlavičky, TLS, ZAP Baseline.
3. **Ručná revízia kódu** (oblasti A, B, C, D): čítanie `api/*`, workflowov
   a front-endu; pri každej tokenovej alebo vstupnej slabine napísať
   vitest test na úrovni funkcie (nie obrazovky).
4. **Nálezy**: každý ako GitHub issue podľa šablóny v časti 8.
5. **Opravy** po triedach, nie po výskytoch (pozri `CLAUDE.md`, „Oprav
   triedu, nie výskyt"): napr. všetky vstupy do API v jednom PR, všetky
   zápisy do Sheetu a exportov v jednom PR. Každý PR má test a nový
   `version.json` (`npm run verzia`).
6. **Opakovaný test** opráv a uzavretie podľa časti 9.

Zmeny, ktoré menia správanie prihlásenia pre existujúcich používateľov
(jednorazový odkaz, kratšia životnosť relácie, odvolanie tokenov), alebo
výmena závislosti (`xlsx`) sa najprv navrhnú v issue a čakajú na rozhodnutie
človeka.

## 8. Šablóna nálezu

Každý nález je issue s týmito poľami:

- **ID:** `VESMA-SEC-001`, `002`, …
- **Názov a závažnosť** (kritická / vysoká / stredná / nízka / informatívna),
  podľa dopadu na dôvernosť, integritu a dostupnosť, potrebných oprávnení
  a dosiahnuteľnosti; podľa potreby CVSS.
- **Dôkaz:** súbor a riadok, požiadavka a odpoveď, alebo výstup nástroja
  (bez tajomstiev).
- **Dopad.**
- **Odporúčaná oprava.**
- **Výsledok opakovaného testu.**

## 9. Kritériá ukončenia

Audit možno uzavrieť, keď:

- [ ] všetky oblasti A až G sú prejdené a každá položka je odškrtnutá alebo
      má poznámku, prečo nie,
- [ ] kritické a vysoké nálezy sú opravené alebo majú zapísané rozhodnutie
      o prijatí rizika,
- [ ] závislosti s nálezmi sú vyhodnotené (oprava alebo zdôvodnenie),
- [ ] nastavenia repozitára a Vercelu sú zdokumentované,
- [ ] osobné údaje neunikajú cez API, logy, exporty ani verejné súbory,
- [ ] opravy prešli opakovaným testom a existujúce testy (`npm test`,
      `npm run test:unit`) prechádzajú.

## 10. Orientačný harmonogram

Závisí od rozsahu a dostupnosti preview prostredia.

- **Deň 1:** rozsah a súhlas, automatika, hlavičky a TLS (oblasti E, F).
- **Deň 2:** `api/*` a tokeny (oblasti A, B), testy hraničných vstupov.
- **Deň 3:** workflowy a front-end (oblasti C, D), súkromie (oblasť G).
- **Deň 4:** zhrnutie nálezov, prioritizácia, začiatok opráv, finálny report.

## 11. Otvorené a na potvrdenie

- Rozsah a súhlas (časť 2) potvrdzuje INOVIA.
- Smie sa skenovať živá doména, alebo len preview nasadenie?
- Nastavenia GitHubu a Vercelu (ochrana `main`, prístupy, premenné
  prostredia) z kódu nevidno, kontroluje ich človek.
- Rozhodnutie o `xlsx` (náhrada vs. prijatie rizika).
- Právne posúdenie osobných údajov (oblasť G).
