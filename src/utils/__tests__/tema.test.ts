import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  KLUC_TEMY,
  PREDVOLENA_VOLBA,
  TEMA_BEZ_PREFERENCIE,
  VOLBY_TEMY,
  vyriesTemu,
  type SystemovaPreferencia,
  type VolbaTemy,
} from '../tema'

const VOLBY: VolbaTemy[] = ['svetly', 'tmavy', 'auto']
const SYSTEM: SystemovaPreferencia[] = ['light', 'dark', null]

describe('vyriesTemu – voľba vzhľadu', () => {
  it('Svetlý a Tmavý platia bez ohľadu na systém', () => {
    for (const s of SYSTEM) {
      expect(vyriesTemu('svetly', s)).toBe('light')
      expect(vyriesTemu('tmavy', s)).toBe('dark')
    }
  })

  it('Auto sa riadi systémom/prehliadačom', () => {
    expect(vyriesTemu('auto', 'light')).toBe('light')
    expect(vyriesTemu('auto', 'dark')).toBe('dark')
  })

  it('Auto bez systémovej preferencie zvolí tmavý režim', () => {
    expect(TEMA_BEZ_PREFERENCIE).toBe('dark')
    expect(vyriesTemu('auto', null)).toBe('dark')
  })

  it('predvolená voľba je Auto a menu ponúka práve tri možnosti', () => {
    expect(PREDVOLENA_VOLBA).toBe('auto')
    expect(VOLBY_TEMY.map((v) => v.nazov)).toEqual(['Svetlý', 'Tmavý', 'Auto'])
  })
})

/**
 * Skript v index.html nastaví režim pred načítaním aplikácie (bez zablikania).
 * Spustí sa tu v podvrhnutom prostredí a jeho výsledok sa porovná s vyriesTemu
 * pre všetky kombinácie – aby sa dve kópie tej istej logiky nerozišli.
 */
describe('skript v index.html sa zhoduje s vyriesTemu', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
  const skript = html.match(/<script id="vesma-tema">([\s\S]*?)<\/script>/)?.[1]

  afterEach(() => vi.unstubAllGlobals())

  function spusti(ulozena: string | null, system: SystemovaPreferencia, bezMatchMedia = false) {
    const atributy: Record<string, string> = {}
    vi.stubGlobal('localStorage', { getItem: (k: string) => (k === KLUC_TEMY ? ulozena : null) })
    vi.stubGlobal('document', { documentElement: { setAttribute: (k: string, v: string) => (atributy[k] = v) } })
    vi.stubGlobal('window', bezMatchMedia ? {} : {
      matchMedia: (q: string) => ({ matches: q === `(prefers-color-scheme: ${system})` }),
    })
    new Function(skript!)()
    return atributy['data-theme']
  }

  it('skript existuje a používa rovnaký kľúč úložiska', () => {
    expect(skript).toBeDefined()
    expect(skript).toContain(`'${KLUC_TEMY}'`)
  })

  it('všetky kombinácie uloženej voľby a systému', () => {
    for (const ulozena of [...VOLBY, null, 'nezmysel']) {
      for (const system of SYSTEM) {
        const volba = VOLBY.includes(ulozena as VolbaTemy) ? (ulozena as VolbaTemy) : PREDVOLENA_VOLBA
        expect(spusti(ulozena, system), `${ulozena} / ${system}`).toBe(vyriesTemu(volba, system))
      }
    }
  })

  it('prehliadač bez matchMedia dostane pri Auto tmavý režim', () => {
    expect(spusti(null, null, true)).toBe('dark')
    expect(spusti('svetly', null, true)).toBe('light')
  })
})
