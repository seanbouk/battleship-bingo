import { FLEET } from './fleet'
import { Card } from './card'

// The prizes a game can award, in claim order. "First Blood" is kept distinct
// from the per-type prizes even though it coincides with whichever type sank
// first — it's the fun early grab. "All Clear" is the full-house finale.
export interface PrizeDef {
  id: string
  label: string
}

export const PRIZES: PrizeDef[] = [
  { id: 'first-blood', label: 'First Blood' },
  ...FLEET.map((s) => ({ id: `type:${s.id}`, label: `First ${s.short}` })),
  { id: 'all-clear', label: 'All Clear' },
]

export type PrizeConfig = Record<string, { enabled: boolean }>

export function defaultPrizes(): PrizeConfig {
  return Object.fromEntries(PRIZES.map((p) => [p.id, { enabled: true }]))
}

export interface Winner {
  code: string
  name: string
  /** the call count (1-based) at which this card completed the prize */
  atCall: number
}

// The call count by which all of `numbers` had been called (the position of the
// last of them in the draw order), or Infinity if any is still uncalled.
function completionCall(numbers: number[], callPos: Map<number, number>): number {
  let max = 0
  for (const n of numbers) {
    const p = callPos.get(n)
    if (p === undefined) return Infinity
    if (p > max) max = p
  }
  return max
}

// At which call did this card achieve the prize? Infinity = not yet. Because the
// draw order is fixed per game, this is exact — so prizes can rank "who got there
// first" automatically rather than waiting for a manual award.
export function prizeAchievedAt(prizeId: string, card: Card, callPos: Map<number, number>): number {
  if (prizeId === 'all-clear') return completionCall(card.numbers, callPos)
  if (prizeId === 'first-blood') {
    // the call at which the card's *first* ship is fully sunk
    return Math.min(...card.ships.map((s) => completionCall(s.cells.map((c) => c.n), callPos)))
  }
  if (prizeId.startsWith('type:')) {
    const ship = card.ships.find((s) => s.type.id === prizeId.slice(5))
    return ship ? completionCall(ship.cells.map((c) => c.n), callPos) : Infinity
  }
  return Infinity
}
