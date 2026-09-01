import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Dev-only plugin: simulates the /api/svp-flood Vercel function locally.
 * On production (Vercel) the real api/svp-flood.ts is used instead.
 */
function svpProxyPlugin(): Plugin {
  const SVP_MAPSERVER =
    'https://mpt.svp.sk/server/rest/services/inspire/INSPIRE_MPO/MapServer'
  const SVP_BASE = `${SVP_MAPSERVER}/identify`

  // Rovnaké zúženie dopytu ako v api/svp-flood.ts – identify sa pýta len vrstiev
  // s poľom inundationReturnPeriod, aby SVP stihlo odpovedať v limite.
  let vrstvyCache: Promise<string | null> | null = null

  const zistiVrstvy = async (signal: AbortSignal): Promise<string | null> => {
    const resp = await fetch(`${SVP_MAPSERVER}/layers?f=json`, {
      headers: { 'User-Agent': 'sma-nastroj-dev/1.0' },
      signal,
    })
    if (!resp.ok) return null
    const data = (await resp.json()) as {
      layers?: Array<{ id?: number; fields?: Array<{ name?: string }> | null }>
    }
    const ids = (data.layers ?? [])
      .filter(l =>
        (l.fields ?? []).some(f => f.name?.toLowerCase() === 'inundationreturnperiod'),
      )
      .map(l => l.id)
      .filter((id): id is number => typeof id === 'number')
    return ids.length > 0 ? ids.join(',') : null
  }

  const parameterLayers = async (signal: AbortSignal): Promise<string> => {
    if (!vrstvyCache) vrstvyCache = zistiVrstvy(signal).catch(() => null)
    const ids = await vrstvyCache
    if (ids === null) vrstvyCache = null
    return ids ? `all:${ids}` : 'all'
  }

  return {
    name: 'svp-dev-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/svp-flood',
        async (req: IncomingMessage, res: ServerResponse) => {
          const url = new URL(req.url ?? '', 'http://localhost')
          const lat = parseFloat(url.searchParams.get('lat') ?? '')
          const lon = parseFloat(url.searchParams.get('lon') ?? '')

          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }

          if (isNaN(lat) || isNaN(lon))
            return send(400, { error: 'Chýbajú parametre lat/lon.' })

          const delta = 0.005

          try {
            const controller = new AbortController()
            const t = setTimeout(() => controller.abort(), 8000)

            const layers = await parameterLayers(controller.signal)
            const svpUrl =
              `${SVP_BASE}?` +
              `geometry=${encodeURIComponent(JSON.stringify({ x: lon, y: lat }))}&` +
              `geometryType=esriGeometryPoint&sr=4326&layers=${layers}&tolerance=2&` +
              `mapExtent=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&` +
              `imageDisplay=100,100,96&returnGeometry=false&f=json`

            const resp = await fetch(svpUrl, {
              headers: { 'User-Agent': 'sma-nastroj-dev/1.0' },
              signal: controller.signal,
            })
            clearTimeout(t)

            if (!resp.ok) return send(502, { error: `SVP vrátil ${resp.status}` })

            const data = await resp.json() as {
              results?: Array<{ attributes?: { inundationReturnPeriod?: number } }>
            }
            const periods = (data.results ?? [])
              .map(r => r.attributes?.inundationReturnPeriod ?? 0)
              .filter(p => p > 0)
            const minPeriod = periods.length > 0 ? Math.min(...periods) : null

            let riziko = 0
            if (minPeriod !== null) {
              if (minPeriod <= 5) riziko = 5
              else if (minPeriod <= 10) riziko = 4
              else if (minPeriod <= 50) riziko = 3
              else if (minPeriod <= 100) riziko = 2
              else riziko = 1
            }
            send(200, { riziko, perioda: minPeriod, zona: minPeriod ? `Q${minPeriod}` : null })
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Neznáma chyba'
            send(502, { error: `SVP nedostupné: ${msg}` })
          }
        },
      )
    },
  }
}

function pvgisProxyPlugin(): Plugin {
  const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_2/MRcalc'

  return {
    name: 'pvgis-dev-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/pvgis',
        async (req: IncomingMessage, res: ServerResponse) => {
          const url = new URL(req.url ?? '', 'http://localhost')
          const lat = parseFloat(url.searchParams.get('lat') ?? '')
          const lon = parseFloat(url.searchParams.get('lon') ?? '')

          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }

          if (isNaN(lat) || isNaN(lon))
            return send(400, { error: 'Chýbajú parametre lat/lon.' })

          try {
            const controller = new AbortController()
            const t = setTimeout(() => controller.abort(), 10000)
            const resp = await fetch(
              `${PVGIS_BASE}?lat=${lat}&lon=${lon}&outputformat=json&raddatabase=PVGIS-SARAH2&horirrad=1`,
              { headers: { 'User-Agent': 'sma-nastroj-dev/1.0' }, signal: controller.signal },
            )
            clearTimeout(t)
            if (!resp.ok) return send(502, { error: `PVGIS vrátil ${resp.status}` })
            const data = await resp.json() as {
              status?: string; message?: string;
              outputs?: { monthly?: { fixed?: { H_h: number }[] } }
            }
            if (data.status === 'error') return send(502, { error: `PVGIS: ${data.message}` })
            const monthly = data.outputs?.monthly?.fixed ?? []
            const solar = Math.round(monthly.reduce((a: number, m: { H_h: number }) => a + (m.H_h ?? 0), 0))
            send(200, { solar })
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Neznáma chyba'
            send(502, { error: `PVGIS nedostupné: ${msg}` })
          }
        },
      )
    },
  }
}

/**
 * Dev-only plugin: simulates the /api/feedback Vercel function locally.
 * Bez neho vráti dev server na POST /api/feedback 404 a zber podnetov
 * ani nezodpovedaných otázok chatbota sa lokálne nedá odskúšať.
 *
 * Telo požiadavky sa rozlišuje rovnako ako v api/feedback.ts:
 *  - { question, ... }      -> action 'unanswered'
 *  - { nazovPodnetu, ... }  -> action 'feedback'
 *
 * Premenné SHEET_WEBAPP_URL a SHEET_WEBHOOK_SECRET sa načítajú z .env
 * v koreni projektu. Ak chýbajú, plugin vráti 503 s vysvetlením –
 * rovnako ako produkčná funkcia.
 */
function feedbackProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'feedback-dev-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/feedback',
        async (req: IncomingMessage, res: ServerResponse) => {
          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }

          if (req.method !== 'POST') return send(405, { error: 'Method not allowed' })

          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)

          let telo: {
            fieldLabel?: string
            nazovPodnetu?: string
            opisPodnetu?: string
            url?: string
            question?: string
            step?: number
            timestamp?: string
          }
          try {
            telo = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          } catch {
            return send(400, { error: 'Telo požiadavky nie je platný JSON.' })
          }

          const WEBAPP_URL = env.SHEET_WEBAPP_URL ?? ''
          const WEBHOOK_SECRET = env.SHEET_WEBHOOK_SECRET ?? ''

          let payload: Record<string, unknown>
          if (typeof telo.question === 'string' && telo.question.trim().length > 0) {
            payload = {
              secret: WEBHOOK_SECRET,
              action: 'unanswered',
              question: telo.question.trim(),
              step: telo.step ?? 0,
              timestamp: telo.timestamp ?? new Date().toISOString(),
            }
          } else if (typeof telo.nazovPodnetu === 'string' && telo.nazovPodnetu.trim().length > 0) {
            // Poradie kľúčov musí sedieť s api/feedback.ts – most zapisuje
            // hodnoty do hárku v poradí, v akom prídu.
            payload = {
              secret: WEBHOOK_SECRET,
              action: 'feedback',
              cislo: '', // A – dopĺňa sa v hárku ručne
              datum: new Date().toISOString(), // B – verzia
              url: telo.url ?? '', // C – zapísal(a)
              nazov: telo.nazovPodnetu.trim(), // D – názov
              prvok: telo.fieldLabel ?? '', // E – kde (stránka, karta)
              opis: telo.opisPodnetu?.trim() ?? '', // F – opis
            }
          } else {
            return send(400, { error: 'Chýba názov podnetu alebo otázka.' })
          }

          if (!WEBAPP_URL || !WEBHOOK_SECRET) {
            return send(503, {
              error:
                'Lokálne chýba konfigurácia VESMA mostu. Do .env v koreni projektu ' +
                'doplň SHEET_WEBAPP_URL a SHEET_WEBHOOK_SECRET a reštartuj dev server.',
            })
          }

          try {
            const controller = new AbortController()
            const t = setTimeout(() => controller.abort(), 10000)
            const resp = await fetch(WEBAPP_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal,
            })
            clearTimeout(t)
            if (!resp.ok) return send(502, { error: `VESMA most vrátil ${resp.status}` })
            send(200, { ok: true })
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Neznáma chyba'
            send(502, { error: `Nedá sa spojiť s VESMA mostom: ${msg}` })
          }
        },
      )
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    svpProxyPlugin(),
    pvgisProxyPlugin(),
    // '' = načítaj aj premenné bez prefixu VITE_ (sú len pre dev server, nie pre klienta).
    feedbackProxyPlugin(loadEnv(mode, process.cwd(), '')),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
  },
  server: {
    watch: {
      ignored: ['**/api/**'],
    },
  },
  optimizeDeps: {
    exclude: ['api'],
  },
}))
