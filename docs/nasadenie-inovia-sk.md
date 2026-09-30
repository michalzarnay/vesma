# Nasadenie na https://vesma.inovia.sk/

Verejná adresa VESMA je **`https://vesma.inovia.sk`** — subdoména domény
`inovia.sk` nasmerovaná na Vercel jedným DNS záznamom. Aplikácia beží pod
cestou `/vesma/`, takže koreň sa naň presmeruje:

```
prehliadač → https://vesma.inovia.sk/        → 307 → /vesma/
             https://vesma.inovia.sk/vesma/  → Vercel (vetva `stabilna`)
```

Hlavný web `inovia.sk` beží ďalej na WordPresse na svojom hostingu a s VESMA
nemá nič spoločné — odkazuje na ňu len ako na bežný odkaz.

> **Cesta `/vesma/` je zvyšok po pôvodnom zámere s proxy** (pozri históriu
> nižšie). Na subdoméne už nie je na čo potrebná; jej odstránenie rieši
> issue #241, plánované až po prezentáciách v subregiónoch.

## Krok 1 — doména vo Verceli

1. Vercel → projekt `vesma` → Settings → Domains → **Add** → `vesma.inovia.sk`.
2. Vercel ukáže presnú hodnotu CNAME záznamu (spravidla `cname.vercel-dns.com`).
3. Settings → Git → **Production Branch = `stabilna`** (pozri `verziovanie.md`,
   sekcia „Dve nasadenia").

## Krok 2 — DNS záznam

V DNS zóne domény `inovia.sk` (spravuje registrátor alebo hosting, nie nutne
webmaster) pridať:

```
CNAME   vesma   →   cname.vercel-dns.com
```

Existujúce záznamy `inovia.sk` sa nemenia — pridáva sa len nová subdoména.
Certifikát vystaví Vercel sám, spravidla do pár minút po prepísaní DNS.

Ak sa v tej istej zóne nastavuje aj odosielanie e-mailov cez Resend
(prihlásenie do aplikácie), pošli webmastrovi obe požiadavky naraz — pozri
`prihlasenie-emailom.md`.

## Krok 3 — kontrola po nasadení

```bash
curl -I  https://vesma.inovia.sk/                         # 307 → /vesma/
curl -I  https://vesma.inovia.sk/vesma/                   # 200, text/html
curl -sI https://vesma.inovia.sk/vesma/favicon.svg        # 200, image/svg+xml
curl -s  "https://vesma.inovia.sk/vesma/api/pvgis?lat=49.2&lon=18.7"   # JSON so "solar"
curl -s  https://vesma.inovia.sk/vesma/api/prihlasenie    # {"aktivne":true|false}
```

V prehliadači potom: otvor `https://vesma.inovia.sk/vesma/`, prejdi wizardom po
Výsledky, skús export XLSX a odošli testovací podnet (tlačidlo spätnej väzby).
V konzole prehliadača nesmú byť 404 na `/vesma/assets/…`.

## Na čo si dať pozor

- **Jedna adresa všade.** `APP_URL` (adresa v prihlasovacom odkaze),
  `VITE_PRIRUCKA_URL`, QR kód, Príručka aj ukážka musia viesť na
  `vesma.inovia.sk`. Relácia prihlásenia je v `localStorage` domény, takže kto
  sa prihlási na inej adrese, na tej „svojej" zostane odhlásený.
- **Bez `<iframe>`.** Vloženie aplikácie do stránky cez iframe by rozbilo
  `localStorage` a ukladanie relácií v niektorých prehliadačoch. Z webu
  `inovia.sk` odkazuj bežným odkazom.
- **Preview nasadenia sú chránené prihlásením do Vercelu.** Testeri mimo tímu
  vidia len produkčnú adresu.

## História: prečo nie proxy pod `inovia.sk/vesma`

Pôvodný zámer bol zavesiť aplikáciu pod cestu `https://inovia.sk/vesma/` cez
reverse proxy na hostingu WordPressu. Kód je na to dodnes pripravený (`base:
'/vesma/'` vo `vite.config.ts`, `vercel.json`, `src/utils/apiUrl.ts`), ale
**hosting to neumožňuje**: je zdieľaný a pravidlá OpenResty/nginx sú na ňom
pevne nastavené pre všetky weby, takže vlastné `location` pravidlo sa doplniť
nedá (zistené 7. 9. 2026). Varianty s `.htaccess`, nginxom aj Cloudflare
Workerom tým padli.

Subdoména dosahuje to isté jedným DNS záznamom a bez zásahu do hostingu.
Ak by sa v budúcnosti riešila priama integrácia do webu inovia.sk, je to
rozhodnutie človeka (bod 3 zo „Štyroch vecí" v `CLAUDE.md`) — nie návrat
k proxy.
