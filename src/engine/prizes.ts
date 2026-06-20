import { FLEET } from './fleet'
import { CardStatus } from './win'

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

/** Does a card's current status satisfy this prize? (Verified against the called set upstream.) */
export function qualifies(prizeId: string, status: CardStatus): boolean {
  if (prizeId === 'first-blood') return status.firstShip
  if (prizeId === 'all-clear') return status.allClear
  if (prizeId.startsWith('type:')) return status.sunkTypes.includes(prizeId.slice(5))
  return false
}

export interface Winner {
  code: string
  name: string
  /** the call count at the moment it was awarded */
  atCall: number
}

export interface PrizeState {
  enabled: boolean
  winners: Winner[]
}

export function defaultPrizes(): Record<string, PrizeState> {
  return Object.fromEntries(PRIZES.map((p) => [p.id, { enabled: true, winners: [] }]))
}
