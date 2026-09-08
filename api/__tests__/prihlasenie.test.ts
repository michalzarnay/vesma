import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { overToken, vytvorToken, PLATNOST_MS, jePlatnyEmail, telo as textEmailu } from '../prihlasenie';

/**
 * Prihlásenie e-mailom: podpísané tokeny, odoslanie odkazu, výmena odkazu za
 * reláciu a overený e-mail pri podnetoch.
 */

const SECRET = 'velmi-tajne';

type Odpoved = { status?: number; telo?: unknown };
function mockRes() {
  const odpoved: Odpoved = {};
  return {
    odpoved,
    res: {
      status: (c: number) => ({ json: (d: unknown) => { odpoved.status = c; odpoved.telo = d; } }),
      json: (d: unknown) => { odpoved.status = 200; odpoved.telo = d; },
    },
  };
}

function nastavEnv(aktivne: boolean) {
  process.env.OVERENIE_SECRET = SECRET;
  process.env.RESEND_API_KEY = aktivne ? 're_test' : '';
  process.env.EMAIL_ODOSIELATEL = aktivne ? 'VESMA <vesma@example.org>' : '';
  process.env.APP_URL = aktivne ? 'https://example.org/vesma/' : '';
  process.env.SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/test/exec';
  process.env.SHEET_WEBHOOK_SECRET = 'most';
  vi.resetModules();
}

describe('kópie tokenov vo funkciách', () => {
  it('prihlasenie.ts, overenie.ts a feedback.ts nesú zhodný kód tokenov a mostu', () => {
    // Vercel funkcie bežia ako ESM a relatívny import bez prípony pri behu
    // zlyhá (HTTP 500 na produkcii 7. 9. 2026). Preto každá funkcia nesie
    // vlastnú kópiu — a tento test stráži, aby sa kópie nerozišli.
    const vysek = (subor: string, od: string, po: string) => {
      const text = readFileSync(new URL(`../${subor}`, import.meta.url), 'utf8');
      const i = text.indexOf(od);
      const j = text.indexOf(po, i);
      expect(i, `${subor}: chýba „${od}"`).toBeGreaterThan(-1);
      expect(j, `${subor}: chýba „${po}"`).toBeGreaterThan(i);
      return text.slice(i, j);
    };
    const T = ['export type TypTokenu', '// ─── koniec kópie tokenov'] as const;
    const M = ['async function posliNaMost', '// ─── koniec kópie mostu'] as const;
    expect(vysek('overenie.ts', ...T)).toBe(vysek('prihlasenie.ts', ...T));
    expect(vysek('feedback.ts', ...T)).toBe(vysek('prihlasenie.ts', ...T));
    expect(vysek('feedback.ts', ...M)).toBe(vysek('overenie.ts', ...M));
    for (const f of ['prihlasenie.ts', 'overenie.ts', 'feedback.ts']) {
      const text = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
      expect(text, `${f}: relatívny import by na Verceli spadol`).not.toMatch(/from '\.\.?\//);
    }
  });
});

describe('tokeny', () => {
  it('podpísaný token sa overí a nesie e-mail, typ aj platnosť', () => {
    const t = vytvorToken('odkaz', '  Jan.Novak@Example.org ', SECRET, 1_000);
    expect(overToken(t, SECRET, 2_000)).toEqual({ typ: 'odkaz', email: 'jan.novak@example.org', exp: 1_000 + PLATNOST_MS.odkaz });
  });
  it('cudzí podpis, iné tajomstvo alebo uplynutá platnosť neprejdú', () => {
    const t = vytvorToken('relacia', 'a@b.sk', SECRET, 0);
    expect(overToken(t, 'ine', 1)).toBeNull();
    expect(overToken(t + 'x', SECRET, 1)).toBeNull();
    expect(overToken('nezmysel', SECRET, 1)).toBeNull();
    expect(overToken(t, SECRET, PLATNOST_MS.relacia + 1)).toBeNull();
  });
  it('základná kontrola tvaru e-mailu', () => {
    expect(jePlatnyEmail('starosta@obec.sk')).toBe(true);
    expect(jePlatnyEmail('bez-zavinaca')).toBe(false);
    expect(jePlatnyEmail('a@b')).toBe(false);
  });
});

describe('/api/prihlasenie', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('GET hlási, či je prihlásenie nakonfigurované', async () => {
    nastavEnv(false);
    let handler = (await import('../prihlasenie')).default;
    let m = mockRes();
    await handler({ method: 'GET' }, m.res);
    expect(m.odpoved.telo).toEqual({ aktivne: false });

    nastavEnv(true);
    handler = (await import('../prihlasenie')).default;
    m = mockRes();
    await handler({ method: 'GET' }, m.res);
    expect(m.odpoved.telo).toEqual({ aktivne: true });
  });

  it('POST pošle cez Resend odkaz s tokenom typu odkaz na adresu aplikácie', async () => {
    nastavEnv(true);
    const handler = (await import('../prihlasenie')).default;
    const { res, odpoved } = mockRes();
    await handler({ method: 'POST', body: { email: 'Starosta@Obec.sk' } }, res);
    expect(odpoved.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string; headers: Record<string, string> }];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    const sprava = JSON.parse(init.body);
    expect(sprava.to).toEqual(['starosta@obec.sk']);
    expect(sprava.from).toBe('VESMA <vesma@example.org>');
    const odkaz = String(sprava.text.match(/https?:\S+/)?.[0]);
    expect(odkaz.startsWith('https://example.org/vesma/?token=')).toBe(true);
    const token = decodeURIComponent(odkaz.split('token=')[1]);
    expect(overToken(token, SECRET)?.typ).toBe('odkaz');
    expect(overToken(token, SECRET)?.email).toBe('starosta@obec.sk');
  });

  it('e-mail radí, ako odkaz použiť v inom okne — inak sa otvorí vždy v predvolenom prehliadači', () => {
    // Odkaz v e-maile otvorí operačný systém v predvolenom okne, nie v tom,
    // kde chce človek mapovať (napr. súkromné/inkognito). Token je bezstavový,
    // takže vložený do adresného riadka funguje aj opakovane — a e-mail to musí
    // povedať, inak sa tam tester nedostane.
    const { text, html } = textEmailu('https://example.org/vesma/?token=abc');
    for (const obsah of [text, html]) {
      expect(obsah).toContain('skopírujte');
      expect(obsah).toContain('adresného riadka');
      expect(obsah).toContain('opakovane');
    }
  });

  it('POST odmietne neplatný e-mail a nenakonfigurované prostredie', async () => {
    nastavEnv(true);
    let handler = (await import('../prihlasenie')).default;
    let m = mockRes();
    await handler({ method: 'POST', body: { email: 'nie-je-email' } }, m.res);
    expect(m.odpoved.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();

    nastavEnv(false);
    handler = (await import('../prihlasenie')).default;
    m = mockRes();
    await handler({ method: 'POST', body: { email: 'a@b.sk' } }, m.res);
    expect(m.odpoved.status).toBe(503);
  });
});

describe('/api/overenie', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    nastavEnv(true);
  });

  it('vymení platný odkaz za token relácie a zapíše registráciu do hárku', async () => {
    const handler = (await import('../overenie')).default;
    const { res, odpoved } = mockRes();
    const odkaz = vytvorToken('odkaz', 'starosta@obec.sk', SECRET);
    await handler({ method: 'POST', body: { token: odkaz, url: 'https://example.org/vesma/' } }, res);

    expect(odpoved.status).toBe(200);
    const telo = odpoved.telo as { ok: boolean; email: string; relacia: string };
    expect(telo.email).toBe('starosta@obec.sk');
    expect(overToken(telo.relacia, SECRET)?.typ).toBe('relacia');

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    const payload = JSON.parse(init.body);
    expect(Object.keys(payload)).toEqual(['secret', 'action', 'email', 'datum', 'url']);
    expect(payload.action).toBe('registracia');
    expect(payload.email).toBe('starosta@obec.sk');
  });

  it('token relácie ani cudzí token sa nedajú použiť ako odkaz', async () => {
    const handler = (await import('../overenie')).default;
    const { res, odpoved } = mockRes();
    await handler({ method: 'POST', body: { token: vytvorToken('relacia', 'a@b.sk', SECRET) } }, res);
    expect(odpoved.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prihlásenie prejde, aj keď zápis do hárku zlyhá', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const handler = (await import('../overenie')).default;
    const { res, odpoved } = mockRes();
    await handler({ method: 'POST', body: { token: vytvorToken('odkaz', 'a@b.sk', SECRET) } }, res);
    expect(odpoved.status).toBe(200);
  });
});

describe('/api/feedback s prihlásením', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    nastavEnv(true);
  });

  it('e-mail sa berie z tokenu relácie, nie z tela, a je označený ako overený', async () => {
    const handler = (await import('../feedback')).default;
    const { res } = mockRes();
    await handler({
      method: 'POST',
      body: { nazovPodnetu: 'Test', email: 'podvrhnuty@x.sk', relacia: vytvorToken('relacia', 'pravy@obec.sk', SECRET) },
    }, res);
    const payload = JSON.parse((fetchMock.mock.calls[0] as [string, { body: string }])[1].body);
    expect(payload.email).toBe('pravy@obec.sk');
    expect(payload.emailOvereny).toBe('áno');
  });

  it('bez tokenu ide e-mail z tela ako neoverený — aj pri nezodpovedanej otázke', async () => {
    const handler = (await import('../feedback')).default;
    const { res } = mockRes();
    await handler({ method: 'POST', body: { question: 'Čo je MZI?', step: 2, email: 'Niekto@Obec.sk' } }, res);
    const payload = JSON.parse((fetchMock.mock.calls[0] as [string, { body: string }])[1].body);
    expect(Object.keys(payload)).toEqual(['secret', 'action', 'question', 'step', 'timestamp', 'email', 'emailOvereny']);
    expect(payload.email).toBe('niekto@obec.sk');
    expect(payload.emailOvereny).toBe('nie');
  });
});
