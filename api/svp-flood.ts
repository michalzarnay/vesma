/**
 * Vercel serverless proxy for SVP flood hazard zones.
 * Frontend cannot call mpt.svp.sk directly (no CORS headers).
 *
 * GET /api/svp-flood?lat=48.15&lon=17.6
 * Response: { riziko: 0-5, perioda: number|null, zona: string|null }
 *
 * POZOR – funkcia musí bežať v európskom regióne (Vercel → Settings →
 * Functions → Function Region = Frankfurt / fra1). Z default regiónu
 * `iad1` (Washington) SVP spojenie zahadzuje, fetch visí a skončí na
 * časovom limite s hláškou „This operation was aborted". Nastavenie
 * regiónu žije len vo Vercel dashboarde, v repozitári po ňom niet stopy –
 * ak tlačidlo „zistiť zo SVP" prestane fungovať, over najprv región.
 */

const SVP_MAPSERVER =
  'https://mpt.svp.sk/server/rest/services/inspire/INSPIRE_MPO/MapServer';
const SVP_BASE = `${SVP_MAPSERVER}/identify`;

/** Jediné pole, ktoré z odpovede čítame. Vrstvy bez neho do rizika neprispejú. */
const POLE_PERIODY = 'inundationreturnperiod';

/**
 * Identify s `layers=all` prehľadáva všetky vrstvy služby INSPIRE_MPO.
 * Dopyt preto zúžime na vrstvy, ktoré majú pole inundationReturnPeriod —
 * ostatné do výsledku aj tak nevstupujú, takže riziko sa nemení a SVP
 * zbytočne nezaťažujeme. Zoznam vrstiev sa zisťuje raz a drží sa v pamäti
 * inštancie funkcie.
 */
let vrstvyCache: Promise<string | null> | null = null;

type MetadataVrstiev = {
  layers?: Array<{ id?: number; fields?: Array<{ name?: string }> | null }>;
};

async function zistiVrstvy(signal: AbortSignal): Promise<string | null> {
  const resp = await fetch(`${SVP_MAPSERVER}/layers?f=json`, {
    headers: { 'User-Agent': 'sma-nastroj/1.0' },
    signal,
  });
  if (!resp.ok) return null;

  const data = (await resp.json()) as MetadataVrstiev;
  const ids = (data.layers ?? [])
    .filter((l) => (l.fields ?? []).some((f) => f.name?.toLowerCase() === POLE_PERIODY))
    .map((l) => l.id)
    .filter((id): id is number => typeof id === 'number');

  return ids.length > 0 ? ids.join(',') : null;
}

/** Vráti `all:<id,…>`, alebo `all`, ak sa zoznam vrstiev nepodarí zistiť. */
async function parameterLayers(signal: AbortSignal): Promise<string> {
  if (!vrstvyCache) vrstvyCache = zistiVrstvy(signal).catch(() => null);
  const ids = await vrstvyCache;
  if (ids === null) vrstvyCache = null; // neúspech nekešujeme, skúsime nabudúce
  return ids ? `all:${ids}` : 'all';
}

export default async function handler(
  req: { query: Record<string, string> },
  res: {
    status: (c: number) => { json: (d: unknown) => void };
    json: (d: unknown) => void;
  },
) {
  const lat = parseFloat(req.query.lat ?? '');
  const lon = parseFloat(req.query.lon ?? '');

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Chýbajú parametre lat/lon.' });
  }

  const delta = 0.005;

  try {
    // Jeden časový rozpočet na zistenie vrstiev aj na samotný identify.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const layers = await parameterLayers(controller.signal);
    const svpUrl =
      `${SVP_BASE}?` +
      `geometry=${encodeURIComponent(JSON.stringify({ x: lon, y: lat }))}&` +
      `geometryType=esriGeometryPoint&` +
      `sr=4326&` +
      `layers=${layers}&` +
      `tolerance=2&` +
      `mapExtent=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&` +
      `imageDisplay=100,100,96&` +
      `returnGeometry=false&` +
      `f=json`;

    const resp = await fetch(svpUrl, {
      headers: { 'User-Agent': 'sma-nastroj/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      return res.status(502).json({ error: `SVP server vrátil ${resp.status}` });
    }

    const data = await resp.json() as {
      results?: Array<{ attributes?: { inundationReturnPeriod?: number } }>;
    };

    const periods: number[] = (data.results ?? [])
      .map((r) => r.attributes?.inundationReturnPeriod ?? 0)
      .filter((p) => p > 0);

    const minPeriod = periods.length > 0 ? Math.min(...periods) : null;

    let riziko = 0;
    if (minPeriod !== null) {
      if (minPeriod <= 5) riziko = 5;
      else if (minPeriod <= 10) riziko = 4;
      else if (minPeriod <= 50) riziko = 3;
      else if (minPeriod <= 100) riziko = 2;
      else riziko = 1;
    }

    return res.json({ riziko, perioda: minPeriod, zona: minPeriod ? `Q${minPeriod}` : null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Neznáma chyba';
    return res.status(502).json({ error: `Nepodarilo sa spojiť so SVP: ${msg}` });
  }
}
