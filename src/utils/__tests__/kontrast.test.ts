import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { getScoreLevel } from '../../types/scoring'

/**
 * Kontrast a veľkosť písma na úrovni zdieľaných tokenov (podnety č. 97, 88, 89).
 * Hodnoty tokenov sa čítajú priamo z `src/index.css`, takže test spadne, keď niekto
 * token zosvetlí alebo zmenší pod hranicu WCAG AA (4,5 : 1 pre bežný text).
 */

const INDEX_CSS = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8')

function token(nazov: string): string {
  const m = INDEX_CSS.match(new RegExp(`--${nazov}:\\s*([^;]+);`))
  if (!m) throw new Error(`Token --${nazov} chýba v src/index.css`)
  return m[1].trim()
}

type Rgb = [number, number, number]

function hex(h: string): Rgb {
  const x = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)) as Rgb
}

function luminancia([r, g, b]: Rgb): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** Kontrastný pomer podľa WCAG 2.x. */
function kontrast(a: Rgb, b: Rgb): number {
  const x = luminancia(a)
  const y = luminancia(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Priesvitná farba (napr. bg-[#52A8DE]/10) položená na bielu. */
function naBielej(farba: Rgb, alfa: number): Rgb {
  return farba.map((v) => Math.round(v * alfa + 255 * (1 - alfa))) as Rgb

}

const BIELA: Rgb = [255, 255, 255]
// Tailwind v4 – odtiene, ktoré sa v UI používajú ako pozadie.
const GRAY_50 = hex('#f9fafb')
const GRAY_100 = hex('#f3f4f6')

const GRAY_400 = hex(token('color-gray-400'))
const GRAY_500 = hex(token('color-gray-500'))
const GRAY_600 = hex('#4a5565') // nemení sa, je v predvolenej palete Tailwindu
const BRAND_STRONG = hex(token('color-brand-strong'))
const BRAND_INK = hex(token('color-brand-ink'))
const BRAND = hex('#52A8DE') // dekoratívna značková modrá (okraje, fokus)

const AA = 4.5

describe('kontrast farieb zo zdieľaných tokenov (WCAG AA 4,5 : 1)', () => {
  it('sivý text (gray-400) je čitateľný na bielej a gray-50', () => {
    expect(kontrast(GRAY_400, BIELA)).toBeGreaterThanOrEqual(AA)
    expect(kontrast(GRAY_400, GRAY_50)).toBeGreaterThanOrEqual(AA)
  })

  it('sivý text (gray-500, gray-600) je čitateľný aj na gray-100', () => {
    for (const farba of [GRAY_500, GRAY_600]) {
      expect(kontrast(farba, BIELA)).toBeGreaterThanOrEqual(AA)
      expect(kontrast(farba, GRAY_50)).toBeGreaterThanOrEqual(AA)
      expect(kontrast(farba, GRAY_100)).toBeGreaterThanOrEqual(AA)
    }
  })

  it('placeholder používa token gray-400', () => {
    expect(INDEX_CSS).toMatch(/::placeholder\s*{[^}]*var\(--color-gray-400\)/)
    expect(INDEX_CSS).toMatch(/::placeholder\s*{[^}]*opacity:\s*1/)
  })

  it('značková modrá pre text (brand-strong) je čitateľná na bielej, gray-50 aj na vlastnom svetlom podklade', () => {
    expect(kontrast(BRAND_STRONG, BIELA)).toBeGreaterThanOrEqual(AA)
    expect(kontrast(BRAND_STRONG, GRAY_50)).toBeGreaterThanOrEqual(AA)
    expect(kontrast(BRAND_STRONG, naBielej(BRAND, 0.1))).toBeGreaterThanOrEqual(AA)
  })

  it('text značkovou modrou (brand-ink) má vo svetlom režime tú istú hodnotu ako brand-strong', () => {
    expect(BRAND_INK).toEqual(BRAND_STRONG)
  })

  it('plocha kariet (surface) je vo svetlom režime biela – svetlý vzhľad sa nemení', () => {
    expect(hex(token('color-surface'))).toEqual(BIELA)
  })

  it('biely text na tlačidle s brand-strong pozadím je čitateľný', () => {
    expect(kontrast(BIELA, BRAND_STRONG)).toBeGreaterThanOrEqual(AA)
  })

  it('pôvodná značková modrá AA nespĺňa – preto sa nesmie použiť pre text (regresný strážca)', () => {
    expect(kontrast(BRAND, BIELA)).toBeLessThan(AA)
  })

  it('farby upozornení (text na jemnom farebnom podklade)', () => {
    const pary: Array<[string, string]> = [
      ['#c10007', '#fef2f2'], // red-700 na red-50
      ['#973c00', '#fffbeb'], // amber-800 na amber-50
      ['#bb4d00', '#fffbeb'], // amber-700 na amber-50
      ['#1447e6', '#eff6ff'], // blue-700 na blue-50
      ['#008236', '#f0fdf4'], // green-700 na green-50
    ]
    for (const [text, pozadie] of pary) {
      expect(kontrast(hex(text), hex(pozadie)), `${text} na ${pozadie}`).toBeGreaterThanOrEqual(AA)
    }
  })
})

describe('ikony a netextové prvky nesúce význam (WCAG 1.4.11, 3 : 1)', () => {
  const NETEXT = 3

  it('sivé ikony (gray-400, gray-500) majú aspoň 3 : 1 na bielej, gray-50 aj gray-100', () => {
    for (const farba of [GRAY_400, GRAY_500]) {
      for (const podklad of [BIELA, GRAY_50, GRAY_100]) {
        expect(kontrast(farba, podklad)).toBeGreaterThanOrEqual(NETEXT)
      }
    }
  })

  it('v komponentoch sa ikona/text nefarbí svetlejšie než gray-400 (gray-100/200/300), okrem deaktivovaných', () => {
    const najdene: string[] = []
    const prejdi = (dir: string) => {
      for (const meno of readdirSync(dir)) {
        const cesta = join(dir, meno)
        if (statSync(cesta).isDirectory()) prejdi(cesta)
        else if (cesta.endsWith('.tsx')) {
          // Deaktivované prvky sú podľa WCAG vyňaté (nenavštívený krok: `bg-gray-100 text-gray-300`).
          const zdroj = readFileSync(cesta, 'utf8').replaceAll('bg-gray-100 text-gray-300 cursor-default', '')
          if (/(?:text|stroke|fill)-(?:gray|slate)-(?:100|200|300)\b/.test(zdroj)) najdene.push(cesta)
        }
      }
    }
    prejdi(join(process.cwd(), 'src/components'))
    expect(najdene).toEqual([])
  })

  it('hlavička nepoužíva pôvodnú značkovú modrú #52A8DE pre text (2,6 : 1)', () => {
    const hlavicka = readFileSync(join(process.cwd(), 'src/components/layout/Header.tsx'), 'utf8')
    expect(hlavicka).not.toMatch(/text-\[#52A8DE\]/)
  })
})

describe('veľkosť písma zo zdieľaných tokenov', () => {
  const rem = (nazov: string) => parseFloat(token(nazov))

  it('najmenšia trieda text-xs nie je pod 14 px', () => {
    expect(rem('text-xs') * 16).toBeGreaterThanOrEqual(14)
  })

  it('text-sm (popisky, hodnoty, tlačidlá) je aspoň 16 px', () => {
    expect(rem('text-sm') * 16).toBeGreaterThanOrEqual(16)
  })

  it('základ stránky je aspoň 16 px', () => {
    const m = INDEX_CSS.match(/body\s*{[^}]*font-size:\s*([\d.]+)rem/)
    expect(m).not.toBeNull()
    expect(parseFloat(m![1]) * 16).toBeGreaterThanOrEqual(16)
  })

  it('v komponentoch nie je pevné písmo pod 14 px (text-[10px] … text-[13px])', () => {
    const najdene: string[] = []
    const prejdi = (dir: string) => {
      for (const meno of readdirSync(dir)) {
        const cesta = join(dir, meno)
        if (statSync(cesta).isDirectory()) prejdi(cesta)
        else if (cesta.endsWith('.tsx')) {
          if (/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]/.test(readFileSync(cesta, 'utf8'))) najdene.push(cesta)
        }
      }
    }
    prejdi(join(process.cwd(), 'src/components'))
    expect(najdene).toEqual([])
  })
})

/**
 * Tmavý režim (docs/tmavy-rezim.md). Hodnoty sa čítajú z bloku
 * `:root[data-theme='dark']` v src/index.css; platia tie isté hranice WCAG
 * ako pre svetlý režim.
 */
describe('tmavý režim – kontrast tokenov', () => {
  const blok = INDEX_CSS.match(/:root\[data-theme='dark'\]\s*{([^}]*)}/)
  if (!blok) throw new Error("Blok :root[data-theme='dark'] chýba v src/index.css")
  const TMAVY = blok[1]
  const tmavy = (nazov: string): Rgb => {
    const m = TMAVY.match(new RegExp(`--${nazov}:\\s*([^;]+);`))
    if (!m) throw new Error(`Token --${nazov} chýba v tmavom režime`)
    return hex(m[1].trim())
  }
  /** Priesvitná farba položená na podklad. */
  const na = (farba: Rgb, alfa: number, podklad: Rgb): Rgb =>
    farba.map((v, i) => Math.round(v * alfa + podklad[i] * (1 - alfa))) as Rgb

  const POVRCH = tmavy('color-surface')
  const STRANKA = tmavy('color-gray-50')
  const G100 = tmavy('color-gray-100')

  it('sivý text (gray-400 až gray-900) je čitateľný na karte, stránke aj gray-100', () => {
    for (const odtien of [400, 500, 600, 700, 800, 900]) {
      const farba = tmavy(`color-gray-${odtien}`)
      for (const podklad of [POVRCH, STRANKA, G100]) {
        expect(kontrast(farba, podklad), `gray-${odtien}`).toBeGreaterThanOrEqual(AA)
      }
    }
  })

  it('farebný text (500–900) je čitateľný na vlastnom podklade 50 a 100 aj na karte', () => {
    for (const odtien of ['red', 'orange', 'amber', 'green', 'sky', 'blue', 'violet', 'purple']) {
      for (const cislo of [500, 600, 700, 800, 900]) {
        const text = tmavy(`color-${odtien}-${cislo}`)
        for (const podklad of [tmavy(`color-${odtien}-50`), tmavy(`color-${odtien}-100`), POVRCH, STRANKA]) {
          expect(kontrast(text, podklad), `${odtien}-${cislo}`).toBeGreaterThanOrEqual(AA)
        }
      }
    }
  })

  it('značková modrá pre text (brand-ink) je čitateľná na karte, stránke aj na modrom podklade', () => {
    const brandInk = tmavy('color-brand-ink')
    for (const podklad of [POVRCH, STRANKA, G100, na(BRAND, 0.1, POVRCH), na(BRAND, 0.2, POVRCH)]) {
      expect(kontrast(brandInk, podklad)).toBeGreaterThanOrEqual(AA)
    }
  })

  it('plné plochy s bielym textom sa v tmavom režime nemenia (brand-strong, pevna-*)', () => {
    expect(TMAVY).not.toMatch(/--color-brand-strong:/)
    expect(TMAVY).not.toMatch(/--color-pevna-/)
    expect(TMAVY).not.toMatch(/--color-white:/)
    for (const nazov of ['brand-strong', 'pevna-red-600', 'pevna-red-700', 'pevna-orange-700', 'pevna-gray-500', 'pevna-purple-600', 'pevna-purple-700']) {
      expect(kontrast(BIELA, hex(token(`color-${nazov}`))), nazov).toBeGreaterThanOrEqual(AA)
    }
  })

  it('sivé ikony a okraj značkovej modrej majú aspoň 3 : 1', () => {
    for (const podklad of [POVRCH, STRANKA, G100]) {
      expect(kontrast(tmavy('color-gray-400'), podklad)).toBeGreaterThanOrEqual(3)
      expect(kontrast(BRAND, podklad)).toBeGreaterThanOrEqual(3)
    }
  })

  it('farby úrovní skóre sú čitateľné na karte aj stránke', () => {
    for (const uroven of ['cervena', 'oranzova', 'zlta', 'zelena', 'tmavaZelena']) {
      for (const podklad of [POVRCH, STRANKA]) {
        expect(kontrast(tmavy(`skore-${uroven}`), podklad), uroven).toBeGreaterThanOrEqual(AA)
      }
    }
  })

  it('svetlé farby úrovní skóre v CSS sa zhodujú s getScoreLevel() (PDF export)', () => {
    for (const [skore, uroven] of [[10, 'cervena'], [40, 'oranzova'], [60, 'zlta'], [80, 'zelena'], [95, 'tmavaZelena']] as const) {
      const info = getScoreLevel(skore)
      expect(info.level).toBe(uroven)
      expect(token(`skore-${uroven}`).toLowerCase()).toBe(info.color.toLowerCase())
    }
  })

  it('v komponentoch nie je plná biela plocha (bg-white) – patrí sa bg-surface', () => {
    const najdene: string[] = []
    const prejdi = (dir: string) => {
      for (const meno of readdirSync(dir)) {
        const cesta = join(dir, meno)
        if (statSync(cesta).isDirectory()) prejdi(cesta)
        // bg-white/10, /20 ostáva: priesvitné prekrytie na tmavej fotke či modrej hlavičke.
        else if (/\.tsx?$/.test(cesta) && /\bbg-white(?![/\w-])/.test(readFileSync(cesta, 'utf8'))) najdene.push(cesta)
      }
    }
    prejdi(join(process.cwd(), 'src/components'))
    expect(najdene).toEqual([])
  })

  it('v komponentoch sa na text nepoužíva brand-strong (v tmavom režime je tmavý) – patrí sa text-brand-ink', () => {
    const najdene: string[] = []
    const prejdi = (dir: string) => {
      for (const meno of readdirSync(dir)) {
        const cesta = join(dir, meno)
        if (statSync(cesta).isDirectory()) prejdi(cesta)
        else if (/\.tsx?$/.test(cesta) && /text-brand-strong/.test(readFileSync(cesta, 'utf8'))) najdene.push(cesta)
      }
    }
    prejdi(join(process.cwd(), 'src/components'))
    expect(najdene).toEqual([])
  })
})
