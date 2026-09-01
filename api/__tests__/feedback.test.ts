import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Regresný test k chybe z merge commitu 5036de4: súbor api/feedback.ts
 * obsahoval dva zlepené handlery, takže endpoint sa vôbec nedal skompilovať
 * a nefungovali ani podnety, ani zber nezodpovedaných otázok.
 */

const WEBAPP_URL = 'https://script.google.com/macros/s/test/exec';
const SECRET = 'tajomstvo';

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

/** Handler číta env premenné pri importe, preto ho načítavame až po ich nastavení. */
async function nacitajHandler() {
  process.env.SHEET_WEBAPP_URL = WEBAPP_URL;
  process.env.SHEET_WEBHOOK_SECRET = SECRET;
  vi.resetModules();
  const modul = await import('../feedback');
  return modul.default;
}

function poslanyPayload(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
  return { url, payload: JSON.parse(init.body) };
}

describe('POST /api/feedback', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('podnet z formulára pošle na most s action "feedback"', async () => {
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler(
      {
        method: 'POST',
        body: {
          fieldLabel: 'Plocha strechy',
          nazovPodnetu: '  Nejasná jednotka  ',
          opisPodnetu: '  Nie je jasné či m2 alebo ha  ',
          url: 'https://vesma.sk/krok/3',
        },
      },
      res,
    );

    expect(odpoved.status).toBe(200);
    const { url, payload } = poslanyPayload(fetchMock);
    expect(url).toBe(WEBAPP_URL);
    expect(payload).toMatchObject({
      secret: SECRET,
      action: 'feedback',
      prvok: 'Plocha strechy',
      nazov: 'Nejasná jednotka',
      opis: 'Nie je jasné či m2 alebo ha',
      url: 'https://vesma.sk/krok/3',
    });
  });

  it('podnet má kľúče v poradí, ktoré zodpovedá stĺpcom hárku', async () => {
    const handler = await nacitajHandler();
    const { res } = mockRes();

    await handler(
      {
        method: 'POST',
        body: {
          fieldLabel: 'Materiál povrchu strechy',
          nazovPodnetu: 'a čo lepenka?',
          opisPodnetu: 'nedoplniť?',
          url: 'https://sma-nastroj.vercel.app/',
          menoTestera: 'Ján Novák',
        },
      },
      res,
    );

    // Most zapisuje hodnoty do hárku v poradí, v akom prídu v payloade,
    // a kľúče `secret` + `action` preskočí. Poradie preto určuje stĺpce:
    //   A číslo | B verzia | C zapísal(a) | D názov | E kde | F opis | G meno testera
    const { payload } = poslanyPayload(fetchMock);
    expect(Object.keys(payload)).toEqual([
      'secret',
      'action',
      'cislo',
      'datum',
      'url',
      'nazov',
      'prvok',
      'opis',
      'menoTestera',
    ]);

    // Hodnoty v poradí stĺpcov A–G (bez secret/action).
    const stlpce = Object.keys(payload)
      .filter((k) => k !== 'secret' && k !== 'action')
      .map((k) => payload[k]);
    expect(stlpce[0]).toBe(''); // A číslo – dopĺňa sa ručne
    expect(stlpce[1]).toMatch(/^\d{4}-\d{2}-\d{2}T/); // B verzia – časová pečiatka
    expect(stlpce[2]).toBe('https://sma-nastroj.vercel.app/'); // C zapísal(a)
    expect(stlpce[3]).toBe('a čo lepenka?'); // D názov
    expect(stlpce[4]).toBe('Materiál povrchu strechy'); // E kde
    expect(stlpce[5]).toBe('nedoplniť?'); // F opis
    expect(stlpce[6]).toBe('Ján Novák'); // G meno testera
  });

  it('meno testera je nepovinné a bez neho sa pošle prázdne', async () => {
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler(
      { method: 'POST', body: { nazovPodnetu: 'Test bez mena testera' } },
      res,
    );

    expect(odpoved.status).toBe(200);
    const { payload } = poslanyPayload(fetchMock);
    expect(payload.menoTestera).toBe('');
  });

  it('nezodpovedaná otázka sa pošle s action "unanswered"', async () => {
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler(
      {
        method: 'POST',
        body: { question: '  Aký je vek kotla?  ', step: 4, timestamp: '2026-08-26T10:00:00.000Z' },
      },
      res,
    );

    expect(odpoved.status).toBe(200);
    const { payload } = poslanyPayload(fetchMock);
    expect(payload).toMatchObject({
      secret: SECRET,
      action: 'unanswered',
      question: 'Aký je vek kotla?',
      step: 4,
      timestamp: '2026-08-26T10:00:00.000Z',
    });
  });

  it('prázdne telo vráti 400 a nič neposiela', async () => {
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler({ method: 'POST', body: {} }, res);

    expect(odpoved.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('iná metóda než POST vráti 405', async () => {
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler({ method: 'GET', body: {} }, res);

    expect(odpoved.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('chýbajúca konfigurácia mosta vráti 503 a nič neposiela', async () => {
    process.env.SHEET_WEBAPP_URL = '';
    process.env.SHEET_WEBHOOK_SECRET = '';
    vi.resetModules();
    const handler = (await import('../feedback')).default;
    const { res, odpoved } = mockRes();

    await handler({ method: 'POST', body: { nazovPodnetu: 'Test' } }, res);

    expect(odpoved.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('chyba mosta sa premietne do 502', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const handler = await nacitajHandler();
    const { res, odpoved } = mockRes();

    await handler({ method: 'POST', body: { nazovPodnetu: 'Test' } }, res);

    expect(odpoved.status).toBe(502);
  });
});
