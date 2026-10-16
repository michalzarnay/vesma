import { describe, it, expect } from 'vitest';
import {
  KlimaChyba, klasifikujChybu, textChyby, dotazyNaPolohu, nacitajKlimatickeUdaje,
} from '../klimaUdaje';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const NOMINATIM = [{ lat: '49.08', lon: '19.30', address: { state: 'Žilinský kraj', county: 'okres Ružomberok' } }];
const ZRAZKY = { daily: { precipitation_sum: [1, 2, 3] } };
const SLNKO = { solar: 1100 };

/** Fixtúra: odpovede podľa hostiteľa; nominatim môže odpovedať rôzne podľa dotazu. */
function fetchFixtura(o: {
  nominatim?: (q: string) => Response;
  zrazky?: () => Response;
  slnko?: () => Response;
}) {
  const volania: string[] = [];
  const fn = async (url: string) => {
    volania.push(url);
    if (url.includes('nominatim')) {
      const q = decodeURIComponent(new URL(url).searchParams.get('q') ?? '');
      return (o.nominatim ?? (() => json(NOMINATIM)))(q);
    }
    if (url.includes('open-meteo')) return (o.zrazky ?? (() => json(ZRAZKY)))();
    return (o.slnko ?? (() => json(SLNKO)))();
  };
  return { fn, volania };
}
const beh = (f: ReturnType<typeof fetchFixtura>) =>
  nacitajKlimatickeUdaje(
    { adresa: 'Hlavná 5', obec: 'Ružomberok', krajina: 'Slovensko' },
    () => {},
    f.fn,
    (a, b) => `/api/pvgis?lat=${a}&lon=${b}`,
    2026,
  );

describe('dotazyNaPolohu', () => {
  it('celá adresa, potom záložný dotaz len s obcou', () => {
    expect(dotazyNaPolohu('Hlavná 5', 'Ružomberok', 'Slovensko', true))
      .toEqual(['Hlavná 5, Ružomberok, Slovensko', 'Ružomberok, Slovensko']);
  });
  it('záložný pokus sa nepridá, keď je vypnutý alebo by bol rovnaký', () => {
    expect(dotazyNaPolohu('Hlavná 5', 'Ružomberok', 'Slovensko', false)).toHaveLength(1);
    expect(dotazyNaPolohu('', 'Ružomberok', 'Slovensko', true)).toEqual(['Ružomberok, Slovensko']);
    expect(dotazyNaPolohu('Hlavná 5', '', 'Slovensko', true)).toHaveLength(1);
  });
  it('používa zadanú krajinu, nie natvrdo Slovensko', () => {
    expect(dotazyNaPolohu('Husova 1', 'Brno', 'Česká republika')[0]).toBe('Husova 1, Brno, Česká republika');
    expect(dotazyNaPolohu('Husova 1', 'Brno', '')[0]).toBe('Husova 1, Brno, Slovensko');
  });
});

describe('klasifikujChybu', () => {
  it('časový limit, sieť, ostatné', () => {
    expect(klasifikujChybu(new DOMException('x', 'AbortError')).druh).toBe('casovy_limit');
    expect(klasifikujChybu(new TypeError('Failed to fetch'), true).druh).toBe('siet');
    expect(klasifikujChybu(new Error('?'), false).druh).toBe('siet');
    expect(klasifikujChybu(new Error('?'), true).druh).toBe('ine');
  });
  it('zachová už klasifikovanú chybu', () => {
    const c = new KlimaChyba('adresa_nenajdena');
    expect(klasifikujChybu(c)).toBe(c);
  });
});

describe('textChyby', () => {
  it('každý druh má odlišný text a ponúka ručné doplnenie', () => {
    const druhy = ['adresa_nenajdena', 'sluzba_nedostupna', 'casovy_limit', 'siet', 'nekompletna_odpoved', 'ine'] as const;
    const texty = druhy.map((d) => textChyby(new KlimaChyba(d, 'zrazky')));
    expect(new Set(texty).size).toBe(druhy.length);
    texty.forEach((t) => expect(t).toContain('ručne'));
    expect(textChyby(new KlimaChyba('adresa_nenajdena'))).toContain('len obec');
  });
});

describe('nacitajKlimatickeUdaje', () => {
  it('úspech s celou adresou', async () => {
    const f = fetchFixtura({});
    const r = await beh(f);
    expect(r).toMatchObject({ zrazky: 1, solar: 1100, kraj: 'Žilinský kraj', polohaPodlaObce: false });
    expect(f.volania.filter((u) => u.includes('nominatim'))).toHaveLength(1);
  });
  it('adresa sa nenájde, záložný pokus s obcou uspeje', async () => {
    const f = fetchFixtura({ nominatim: (q) => (q.startsWith('Hlavná') ? json([]) : json(NOMINATIM)) });
    const r = await beh(f);
    expect(r.polohaPodlaObce).toBe(true);
    expect(f.volania.filter((u) => u.includes('nominatim'))).toHaveLength(2);
  });
  it('nenájde sa ani obec -> adresa_nenajdena', async () => {
    const f = fetchFixtura({ nominatim: () => json([]) });
    await expect(beh(f)).rejects.toMatchObject({ druh: 'adresa_nenajdena' });
  });
  it('služba odpovie chybou -> sluzba_nedostupna, nie "adresa nenájdená"', async () => {
    await expect(beh(fetchFixtura({ nominatim: () => json({}, 429) }))).rejects.toMatchObject({ druh: 'sluzba_nedostupna', sluzba: 'poloha' });
    await expect(beh(fetchFixtura({ zrazky: () => json({}, 500) }))).rejects.toMatchObject({ druh: 'sluzba_nedostupna', sluzba: 'zrazky' });
    await expect(beh(fetchFixtura({ slnko: () => json({ error: 'x' }) }))).rejects.toMatchObject({ druh: 'sluzba_nedostupna', sluzba: 'slnko' });
  });
  it('nekompletná odpoveď (prázdne zrážky, chýbajúce slnko) sa nezapíše ako 0', async () => {
    await expect(beh(fetchFixtura({ zrazky: () => json({ daily: { precipitation_sum: [] } }) }))).rejects.toMatchObject({ druh: 'nekompletna_odpoved', sluzba: 'zrazky' });
    await expect(beh(fetchFixtura({ slnko: () => json({}) }))).rejects.toMatchObject({ druh: 'nekompletna_odpoved', sluzba: 'slnko' });
    await expect(beh(fetchFixtura({ nominatim: () => new Response('<html>', { status: 200 }) }))).rejects.toMatchObject({ druh: 'nekompletna_odpoved' });
  });
  it('výpadok siete sa klasifikuje ako "siet"', async () => {
    const fn = async (): Promise<Response> => { throw new TypeError('Failed to fetch'); };
    const err = await nacitajKlimatickeUdaje({ adresa: 'a', obec: 'b', krajina: 'Slovensko' }, () => {}, fn).catch((e) => e);
    expect(klasifikujChybu(err, true).druh).toBe('siet');
  });
});
