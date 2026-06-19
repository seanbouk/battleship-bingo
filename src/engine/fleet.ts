// The fleet. Two length-3 ships (Submarine, Destroyer) are intentionally kept
// distinct so the "first of each type" prize is unambiguous; the renderer gives
// them different silhouettes/labels.

export interface ShipType {
  id: string
  name: string
  /** short label for tight UI / coordinate-free legends */
  abbr: string
  length: number
}

export const FLEET: ShipType[] = [
  { id: 'frigate', name: 'Frigate', abbr: 'FR', length: 2 },
  { id: 'submarine', name: 'Submarine', abbr: 'SUB', length: 3 },
  { id: 'destroyer', name: 'Destroyer', abbr: 'DD', length: 3 },
  { id: 'battleship', name: 'Battleship', abbr: 'BB', length: 4 },
  { id: 'carrier', name: 'Aircraft Carrier', abbr: 'CV', length: 5 },
]

export const TOTAL_CELLS = FLEET.reduce((sum, s) => sum + s.length, 0) // 17

export const DEFAULT_GRID = 8
export const DEFAULT_POOL = 75
