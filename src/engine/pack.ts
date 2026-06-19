import { Card, generateCard, cardFingerprint } from './card'
import { cardCodeFor } from './rng'
import { DEFAULT_GRID, DEFAULT_POOL } from './fleet'

export interface PackOptions {
  count: number
  packSeed: string
  grid?: number
  pool?: number
}

export interface Pack {
  packSeed: string
  grid: number
  pool: number
  cards: Card[]
}

// Generates `count` cards that meet the bingo "minimum bar":
//  - distinct numbers within every card (guaranteed by sampling without replacement)
//  - every card in the pack is distinct (deduped by playable fingerprint)
//  - fully reproducible from (packSeed, grid, pool)
export function generatePack(opts: PackOptions): Pack {
  const grid = opts.grid ?? DEFAULT_GRID
  const pool = opts.pool ?? DEFAULT_POOL
  const cards: Card[] = []
  const seen = new Set<string>()

  let index = 0
  let guard = 0
  while (cards.length < opts.count && guard < opts.count * 50 + 100) {
    guard++
    const code = cardCodeFor(opts.packSeed, index++)
    const card = generateCard(code, { grid, pool })
    const fp = cardFingerprint(card)
    if (seen.has(fp)) continue // astronomically rare, but be correct
    seen.add(fp)
    cards.push(card)
  }

  return { packSeed: opts.packSeed, grid, pool, cards }
}

export interface BalanceStats {
  pool: number
  cards: number
  /** how many cards each number appears on, indexed 1..pool */
  frequency: number[]
  min: number
  max: number
  mean: number
}

/** Distribution check — confirms no number is starved or over-represented. */
export function balanceStats(pack: Pack): BalanceStats {
  const freq = new Array<number>(pack.pool + 1).fill(0)
  for (const card of pack.cards) for (const n of card.numbers) freq[n]++
  const counts = freq.slice(1)
  const mean = counts.reduce((a, b) => a + b, 0) / pack.pool
  return {
    pool: pack.pool,
    cards: pack.cards.length,
    frequency: freq,
    min: Math.min(...counts),
    max: Math.max(...counts),
    mean,
  }
}
