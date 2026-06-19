import { Card, PlacedShip } from './card'

export interface ShipStatus {
  ship: PlacedShip
  hits: number
  sunk: boolean
}

export interface CardStatus {
  ships: ShipStatus[]
  /** ids of fully-sunk ship types */
  sunkTypes: string[]
  sunkCount: number
  totalShips: number
  /** at least one ship fully sunk */
  firstShip: boolean
  /** every ship sunk */
  allClear: boolean
}

// A ship is sunk when every number on it is in the active set. The active set is
// the player's daubed numbers (player view) or the caller's called numbers
// (verification) — same logic either way.
export function evaluateCard(card: Card, active: Set<number>): CardStatus {
  const ships: ShipStatus[] = card.ships.map((ship) => {
    const hits = ship.cells.filter((c) => active.has(c.n)).length
    return { ship, hits, sunk: hits === ship.cells.length }
  })
  const sunk = ships.filter((s) => s.sunk)
  return {
    ships,
    sunkTypes: sunk.map((s) => s.ship.type.id),
    sunkCount: sunk.length,
    totalShips: ships.length,
    firstShip: sunk.length >= 1,
    allClear: sunk.length === ships.length,
  }
}
