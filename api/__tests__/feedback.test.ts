import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** Načíta handler s nastavenými premennými prostredia (číta ich pri importe). */
async function loadHandler(env: { url?: string; secret?: string } = {}) {
  vi.resetModules();
  process.env.SHEET_WEBAPP_URL = env.url ?? 'https://most.example/exec';
  process.env.SHEET_WEBHOOK_SECRET = env.secret ?? 'tajne';
  return (await import('../feedback.ts')).default;
}

function mockRes() {
  const out = { code: 200, body: undefined as unknown };
  return {
    res: {
      status: (c: number) => {
        out.code = c;
        return { json: (d: unknown) => { out.body = d; } };
      },
      json: (d: unknown) => { out.body = d; },
    },
    out,
  };
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('odošle podnet k prvku ako action "feedback"', async () => {
    const handler = await loadHandler();
    const { res, out } = mockRes();

    await handler(
      {
        method: 'POST',
        body: {
          fieldLabel: 'Celková výmera parcely',
          nazovPodnetu: 'čo ak je na parcele búda?',
          opisPodnetu: 'bude to stále pozemok?',
          url: 'https://vesma.example/krok/2',
        },
      },
      res,
    );

    expect(out.code).toBe(200);
    expect(out.body).toEqual({ ok: true });

    const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const payload = JSON.parse((init as { body: string }).body);
    expect(payload.action).toBe('feedback');
    expect(payload.prvok).toBe('Celková výmera parcely');
    expect(payload.nazov).toBe('čo ak je na parcele búda?');
    expect(payload.opis).toBe('bude to stále pozemok?');
  });

  it('odošle nezodpovedanú otázku chatbota ako action "unanswered"', async () => {
    const handler = await loadHandler();
    const { res, out } = mockRes();

    await handler(
      { method: 'POST', body: { question: 'Ako sa počíta odtok?', step: 3, timestamp: '2026-01-01T00:00:00.000Z' } },
      res,
    );

    expect(out.code).toBe(200);
    const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const payload = JSON.parse((init as { body: string }).body);
    expect(payload.action).toBe('unanswered');
    expect(payload.question).toBe('Ako sa počíta odtok?');
    expect(payload.step).toBe(3);
  });

  it('odmietne iné metódy než POST', async () => {
    const handler = await loadHandler();
    const { res, out } = mockRes();
    await handler({ method: 'GET', body: {} }, res);
    expect(out.code).toBe(405);
  });

  it('odmietne prázdny podnet', async () => {
    const handler = await loadHandler();
    const { res, out } = mockRes();
    await handler({ method: 'POST', body: { fieldLabel: 'Niečo', nazovPodnetu: '   ' } }, res);
    expect(out.code).toBe(400);
  });

  it('vráti 503, keď chýba konfigurácia mostu', async () => {
    const handler = await loadHandler({ url: '', secret: '' });
    const { res, out } = mockRes();
    await handler({ method: 'POST', body: { nazovPodnetu: 'test' } }, res);
    expect(out.code).toBe(503);
  });

  it('vráti 502, keď most odpovie chybou', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    const handler = await loadHandler();
    const { res, out } = mockRes();
    await handler({ method: 'POST', body: { nazovPodnetu: 'test' } }, res);
    expect(out.code).toBe(502);
  });
});
