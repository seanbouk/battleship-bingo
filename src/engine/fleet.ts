// The fleet. Two length-3 ships (Submarine, Destroyer) are intentionally kept
// distinct so the "first of each type" prize is unambiguous; the renderer gives
// them different silhouettes/labels.

export interface ShipType {
  id: string
  name: string
  /** short label for tight legends (e.g. "Carrier" not "Aircraft Carrier") */
  short: string
  /** very short label / abbreviation */
  abbr: string
  length: number
}

export const FLEET: ShipType[] = [
  { id: 'frigate', name: 'Frigate', short: 'Frigate', abbr: 'FR', length: 2 },
  { id: 'submarine', name: 'Submarine', short: 'Submarine', abbr: 'SUB', length: 3 },
  { id: 'destroyer', name: 'Destroyer', short: 'Destroyer', abbr: 'DD', length: 3 },
  { id: 'battleship', name: 'Battleship', short: 'Battleship', abbr: 'BB', length: 4 },
  { id: 'carrier', name: 'Aircraft Carrier', short: 'Carrier', abbr: 'CV', length: 5 },
]

export const TOTAL_CELLS = FLEET.reduce((sum, s) => sum + s.length, 0) // 17

// Chosen for us (not user-facing): a 7x7 grid comfortably fits the no-touch
// fleet, and a 1-75 pool gives a lively group-game pace.
export const DEFAULT_GRID = 7
export const DEFAULT_POOL = 75
