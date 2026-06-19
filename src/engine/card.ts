import { FLEET, TOTAL_CELLS, DEFAULT_GRID, DEFAULT_POOL, ShipType } from './fleet'
import { makeRng, Rng } from './rng'

export interface Cell {
  r: number
  c: number
  /** the bingo number printed on this ship cell */
  n: number
}

export interface PlacedShip {
  type: ShipType
  orientation: 'h' | 'v'
  cells: Cell[]
}

export interface Card {
  /** identity tuple — a card is fully determined by (code, grid, pool) */
  code: string
  grid: number
  pool: number
  ships: PlacedShip[]
  /** sorted list of every number on the card, for fast lookup / fingerprinting */
  numbers: number[]
}

export interface CardOptions {
  grid?: number
  pool?: number
}

// No-touch placement (ships may not be orthogonally OR diagonally adjacent) —
// the classic Battleship rule. It also keeps printed cards legible.
function canPlace(
  occupied: Set<string>,
  cells: { r: number; c: number }[],
  grid: number,
): boolean {
  for (const { r, c } of cells) {
    if (r < 0 || c < 0 || r >= grid || c >= grid) return false
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (occupied.has(`${r + dr},${c + dc}`)) return false
      }
    }
  }
  return true
}

function placeFleet(rng: Rng, grid: number): { type: ShipType; orientation: 'h' | 'v'; cells: { r: number; c: number }[] }[] {
  // Try a few times from scratch; placement on an 8x8 with no-touch almost
  // always succeeds on the first attempt.
  for (let attempt = 0; attempt < 200; attempt++) {
    const occupied = new Set<string>()
    const placed: { type: ShipType; orientation: 'h' | 'v'; cells: { r: number; c: number }[] }[] = []
    let ok = true

    // Place longest first — easier to fit big ships while the board is empty.
    const order = [...FLEET].sort((a, b) => b.length - a.length)
    for (const type of order) {
      let positioned = false
      for (let tries = 0; tries < 100; tries++) {
        const orientation: 'h' | 'v' = rng.int(2) === 0 ? 'h' : 'v'
        const cells: { r: number; c: number }[] = []
        if (orientation === 'h') {
          const r = rng.int(grid)
          const c = rng.int(grid - type.length + 1)
          for (let i = 0; i < type.length; i++) cells.push({ r, c: c + i })
        } else {
          const r = rng.int(grid - type.length + 1)
          const c = rng.int(grid)
          for (let i = 0; i < type.length; i++) cells.push({ r: r + i, c })
        }
        if (canPlace(occupied, cells, grid)) {
          cells.forEach((cell) => occupied.add(`${cell.r},${cell.c}`))
          placed.push({ type, orientation, cells })
          positioned = true
          break
        }
      }
      if (!positioned) {
        ok = false
        break
      }
    }
    if (ok) return placed
  }
  throw new Error('Could not place fleet — grid too small for the no-touch rule')
}

export function generateCard(code: string, opts: CardOptions = {}): Card {
  const grid = opts.grid ?? DEFAULT_GRID
  const pool = opts.pool ?? DEFAULT_POOL
  if (pool < TOTAL_CELLS) {
    throw new Error(`Number pool (${pool}) must be >= ${TOTAL_CELLS} cells`)
  }

  // The card's identity tuple seeds the RNG, so grid/pool changes yield a
  // genuinely different (but still reproducible) card for the same code.
  const rng = makeRng(`${code}|${grid}|${pool}`)

  const placed = placeFleet(rng, grid)
  const picks = rng.sample(pool, TOTAL_CELLS)

  // Restore canonical fleet order (frigate -> carrier) before handing numbers out,
  // so the legend and "first of each type" logic read consistently.
  placed.sort((a, b) => a.type.length - b.type.length)

  let k = 0
  const ships: PlacedShip[] = placed.map((p) => ({
    type: p.type,
    orientation: p.orientation,
    cells: p.cells.map((cell) => ({ ...cell, n: picks[k++] })),
  }))

  const numbers = ships.flatMap((s) => s.cells.map((c) => c.n)).sort((a, b) => a - b)
  return { code, grid, pool, ships, numbers }
}

/** Stable fingerprint of a card's *playable content* (numbers per ship type). */
export function cardFingerprint(card: Card): string {
  return card.ships
    .map((s) => `${s.type.id}:${s.cells.map((c) => c.n).sort((a, b) => a - b).join('.')}`)
    .sort()
    .join('|')
}
