import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Regresný test k chybe „Nepodarilo sa spojiť so SVP: This operation was aborted":
 * identify s `layers=all` prehľadával všetky vrstvy služby INSPIRE_MPO a odpoveď
 * neprišla do 8 s. Dopyt sa preto zužuje na vrstvy s poľom inundationReturnPeriod.
 */

type Odpoved = { status?: number; telo?: unknown };

/** Minimálna náhrada Vercel `res` objektu. */
function mockRes() {
  const odpoved: Odpoved = {};
  return {
    odpoved,
    res: {
      status: (c: number) => ({
        json: (d: unknown) => {
          odpoved.status = c;
          odpoved.telo = d;
        },
      }),
      json: (d: unknown) => {
        odpoved.status = 200;
        odpoved.telo = d;
      },
    },
  };
}

/** Handler drží zoznam vrstiev v module, preto ho pre každý test načítame nanovo. */
async function nacitajHandler() {
  vi.resetModules();
  const modul = await import('../svp-flood');
  return modul.default;
}

const METADATA_VRSTIEV = {
  layers: [
    { id: 0, name: 'Vodný tok', fields: [{ name: 'objectid' }] },
    { id: 3, name: 'Zaplavované územie Q50', fields: [{ name: 'inundationReturnPeriod' }] },
    { id: 4, name: 'Zaplavované územie Q100', fields: [{ name: 'inundationReturnPeriod' }] },
    { id: 9, name: 'Mapa rizika', fields: null },
  ],
};

const odpovedJson = (data: unknown) => ({ ok: true, status: 200, json: async () => data });

/** URL posledného identify dopytu. */
function identifyUrl(fetchMock: ReturnType<typeof vi.fn>) {
  const volania = fetchMock.mock.calls
    .map((c) => c[0] as string)
    .filter((u) => u.includes('/identify?'));
  return volania[volania.length - 1] ?? '';
}

describe('GET /api/svp-flood', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/layers?')) return odpovedJson(METADATA_VRSTIEV);
      return odpovedJson({
        results: [{ attributes: { inundationReturnPeriod: 50 } }],
      });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('identify sa pýta len vrstiev s poľom inundationReturnPeriod', async () => {
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler({ query: { lat: '48.15', lon: '17.6' } }, res);

    expect(identifyUrl(fetchMock)).toContain('layers=all:3,4&');
    expect(odpoved.status).toBe(200);
    expect(odpoved.telo).toEqual({ riziko: 3, perioda: 50, zona: 'Q50' });
  });

  it('zoznam vrstiev sa načíta raz a ďalšie dopyty ho už len použijú', async () => {
    const handler = await nacitajHandler();

    await handler({ query: { lat: '48.15', lon: '17.6' } }, mockRes().res);
    await handler({ query: { lat: '49.22', lon: '18.74' } }, mockRes().res);

    const metadata = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/layers?'));
    expect(metadata).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('keď sa zoznam vrstiev nedá zistiť, dopyt sa vráti k layers=all', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/layers?')) throw new Error('SVP metadáta nedostupné');
      return odpovedJson({ results: [] });
    });
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler({ query: { lat: '48.15', lon: '17.6' } }, res);

    expect(identifyUrl(fetchMock)).toContain('layers=all&');
    expect(odpoved.status).toBe(200);
    expect(odpoved.telo).toEqual({ riziko: 0, perioda: null, zona: null });
  });

  it('neúspešné zistenie vrstiev sa nekešuje, ďalší dopyt ho skúsi znova', async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new Error('SVP metadáta nedostupné');
    });
    const handler = await nacitajHandler();

    await handler({ query: { lat: '48.15', lon: '17.6' } }, mockRes().res);
    await handler({ query: { lat: '48.15', lon: '17.6' } }, mockRes().res);

    const metadata = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/layers?'));
    expect(metadata).toHaveLength(2);
    expect(identifyUrl(fetchMock)).toContain('layers=all:3,4&');
  });

  it('chýbajúce súradnice vrátia 400 a nič sa nesťahuje', async () => {
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler({ query: {} }, res);

    expect(odpoved.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('výpadok SVP sa premietne do 502', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/layers?')) return odpovedJson(METADATA_VRSTIEV);
      throw new Error('This operation was aborted');
    });
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler({ query: { lat: '48.15', lon: '17.6' } }, res);

    expect(odpoved.status).toBe(502);
    expect(odpoved.telo).toEqual({
      error: 'Nepodarilo sa spojiť so SVP: This operation was aborted',
    });
  });
});
