# Nasadenie na https://inovia.sk/vesma/

VESMA naďalej beží na Verceli. Zmena je len v tom, že appka je nasadená
pod cestou `/vesma/` — takže sa dá cez reverse proxy „zavesiť" pod doménu
`inovia.sk`, ktorá beží na WordPresse na inom hostingu.

```
prehliadač → https://inovia.sk/vesma/…  →  (proxy na hostingu inovia.sk)
                                        →  https://<projekt>.vercel.app/vesma/…
```

## Čo je pripravené v kóde

| Súbor | Zmena |
| --- | --- |
| `vite.config.ts` | `base: '/vesma/'`, build ide do `dist/vesma` |
| `vercel.json` | `/vesma/api/*` → serverless funkcie, SPA fallback, `/` → `/vesma/` |
| `src/utils/apiUrl.ts` | volania API idú na `/vesma/api/…`, nie na `/api/…` |
| statické súbory | logo, favicon a PDF worker sa načítavajú cez `import.meta.env.BASE_URL` |

Dôsledok: appka je na Verceli dostupná na `https://<projekt>.vercel.app/vesma/`
a koreň `https://<projekt>.vercel.app/` sa naň presmeruje. Všetko, čo appka
potrebuje (HTML, JS, CSS, obrázky aj API), leží pod jedinou cestou `/vesma/` —
preto stačí preposielať jednu cestu a nič sa nerozsype.

## Krok 1 — over Vercel

Po zlúčení tohto PR skontroluj, že funguje priamo Vercel adresa:

```bash
curl -I https://<projekt>.vercel.app/vesma/          # 200, text/html
curl -I https://<projekt>.vercel.app/               # 307 → /vesma/
curl -s  "https://<projekt>.vercel.app/vesma/api/pvgis?lat=49.2&lon=18.7"   # JSON
```

Až keď toto platí, má zmysel nastavovať proxy na inovia.sk.

## Krok 2 — proxy na hostingu inovia.sk

Vyber variant podľa toho, čo hosting umožňuje. `<projekt>` nahraď skutočnou
Vercel doménou nasadenia.

### A) Apache / `.htaccess` (bežný WordPress hosting)

Blok patrí **nad** sekciu `# BEGIN WordPress`, inak požiadavku prevezme
WordPress a pošle ju na `index.php`.

```apache
<IfModule mod_proxy.c>
  SSLProxyEngine On
  # Host hlavička musí ísť na Vercel doménu, inak Vercel nevie, ktorý projekt obslúžiť.
  ProxyPreserveHost Off
  ProxyPass        /vesma  https://<projekt>.vercel.app/vesma
  ProxyPassReverse /vesma  https://<projekt>.vercel.app/vesma
</IfModule>
```

Vyžaduje zapnuté `mod_proxy`, `mod_proxy_http` a `mod_ssl`. Na lacnom shared
hostingu bývajú vypnuté — vtedy treba požiadať podporu hostingu o ich zapnutie,
alebo použiť variant C.

### B) nginx (VPS alebo hosting s vlastnou konfiguráciou)

```nginx
location /vesma/ {
    proxy_pass         https://<projekt>.vercel.app/vesma/;
    proxy_set_header   Host <projekt>.vercel.app;
    proxy_ssl_server_name on;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto https;
}
location = /vesma {
    return 301 /vesma/;
}
```

### C) Cloudflare Worker (ak doména ide cez Cloudflare)

Worker na route `inovia.sk/vesma*`:

```js
export default {
  async fetch(request) {
    const url = new URL(request.url)
    url.hostname = '<projekt>.vercel.app'
    return fetch(new Request(url, request))
  },
}
```

Cesta sa nemení (`/vesma/…` ostáva `/vesma/…`), mení sa len cieľový server.

## Na čo si dať pozor

- **Host hlavička.** Musí smerovať na Vercel doménu. Ak proxy pošle
  `Host: inovia.sk` a doména nie je pridaná vo Vercel projekte, Vercel vráti
  `DEPLOYMENT_NOT_FOUND`. Preto `ProxyPreserveHost Off`, resp. explicitný
  `proxy_set_header Host`.
- **Doménu inovia.sk netreba pridávať do Vercelu.** DNS ostáva na WordPress
  hostingu, Vercel je len „vnútorný" cieľ proxy.
- **Cestu neorezávaj.** Proxy musí `/vesma/…` posielať ako `/vesma/…`. Ak by sa
  prefix odstránil, appka síce nabehne, ale odkazy na `/vesma/assets/…` skončia
  na WordPresse a stránka zostane prázdna.
- **POST musí prejsť.** Zber podnetov a nezodpovedaných otázok chatbota ide cez
  `POST /vesma/api/feedback`. Redirect namiesto proxy by POST zahodil.
- **Bez `<iframe>`.** Vloženie cez iframe by rozbilo `localStorage` a ukladanie
  relácií v niektorých prehliadačoch.

## Krok 3 — kontrola po nasadení

```bash
curl -I  https://inovia.sk/vesma/                         # 200, text/html
curl -sI https://inovia.sk/vesma/favicon.svg              # 200, image/svg+xml
curl -s  "https://inovia.sk/vesma/api/pvgis?lat=49.2&lon=18.7"   # JSON so "solar"
```

V prehliadači potom: otvor `https://inovia.sk/vesma/`, prejdi wizardom po
Výsledky, skús export XLSX a odošli testovací podnet (tlačidlo spätnej väzby).
V konzole prehliadača nesmú byť 404 na `/vesma/assets/…`.
