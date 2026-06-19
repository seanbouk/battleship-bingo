import { Card, PlacedShip } from '../engine/card'
import { Style, Mode } from '../settings/SettingsContext'
import { getPalette, printPalette, Palette } from './palette'
import { SHIP_SPRITES } from './shipSprites'

export interface RenderOptions {
  style: Style
  mode: Mode
  /** grid cell size in px (controls overall resolution); default 40 */
  cell?: number
  /** render for print: white background, darkened night colours */
  print?: boolean
}

const PAD = 16
const COORD = 18
const HEADER = 46
const LEGEND = 76
const INSET = 5

const LETTERS = 'ABCDEFGHIJKLMNOP'

function bbox(ship: PlacedShip) {
  const rs = ship.cells.map((c) => c.r)
  const cs = ship.cells.map((c) => c.c)
  return {
    minR: Math.min(...rs),
    maxR: Math.max(...rs),
    minC: Math.min(...cs),
    maxC: Math.max(...cs),
  }
}

function sonarHull(ship: PlacedShip, x0: number, y0: number, cell: number, color: string, pal: Palette): string {
  const b = bbox(ship)
  const x = x0 + b.minC * cell + INSET
  const y = y0 + b.minR * cell + INSET
  const w = (b.maxC - b.minC + 1) * cell - 2 * INSET
  const h = (b.maxR - b.minR + 1) * cell - 2 * INSET
  const rx = Math.min(w, h) * 0.34
  let s = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${pal.hullFill}" stroke="${color}" stroke-width="2.2"/>`
  // segment separators between cells
  if (ship.orientation === 'h') {
    for (let i = 1; i < ship.cells.length; i++) {
      const sx = x0 + (b.minC + i) * cell
      s += `<line x1="${sx.toFixed(1)}" y1="${(y + 4).toFixed(1)}" x2="${sx.toFixed(1)}" y2="${(y + h - 4).toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.4"/>`
    }
  } else {
    for (let i = 1; i < ship.cells.length; i++) {
      const sy = y0 + (b.minR + i) * cell
      s += `<line x1="${(x + 4).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(x + w - 4).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.4"/>`
    }
  }
  return s
}

// Recon: the top-down warship sprite, stretched to fill its footprint. Sprites
// are drawn bow-up, so vertical ships use them as-is and horizontal ships rotate
// 90deg. preserveAspectRatio="none" lets a ship fill its cells (mild pixel-art
// stretch is fine); image-rendering keeps the pixels crisp on screen.
function reconShip(ship: PlacedShip, x0: number, y0: number, cell: number): string {
  const sprite = SHIP_SPRITES[ship.type.id]
  if (!sprite) return ''
  const b = bbox(ship)
  const horiz = ship.orientation === 'h'
  const cx = x0 + ((b.minC + b.maxC + 1) / 2) * cell
  const cy = y0 + ((b.minR + b.maxR + 1) / 2) * cell
  // Uniform (true-proportion) scale to fill the footprint length; only cap the
  // beam so a wide hull (carrier) doesn't spill past its single-cell width.
  const len = ship.type.length * cell * 0.92
  const beam = Math.min(len * (sprite.w / sprite.h), cell * 0.95)
  const ix = (-beam / 2).toFixed(1)
  const iy = (-len / 2).toFixed(1)
  const transform = horiz
    ? `translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(90)`
    : `translate(${cx.toFixed(1)},${cy.toFixed(1)})`
  return (
    `<g transform="${transform}">` +
    // No image-rendering:pixelated — the 5x sprite is downscaled on the card, so a
    // smooth (anti-aliased) downscale looks far better than nearest-neighbour.
    `<image href="${sprite.uri}" x="${ix}" y="${iy}" width="${beam.toFixed(1)}" height="${len.toFixed(1)}" ` +
    `preserveAspectRatio="none"/></g>`
  )
}

export interface CellGeom {
  shipId: string
  r: number
  c: number
  n: number
  cx: number
  cy: number
  rr: number
}

export interface CardLayout {
  W: number
  H: number
  cell: number
  cells: CellGeom[]
}

// Pixel geometry for a card at a given cell size, matching cardToSvg exactly.
// The player overlay renders a second SVG with this same viewBox, so its
// clickable hotspots and daubs line up with the rendered card at any scale.
export function cardLayout(card: Card, cellSize = 40): CardLayout {
  const cell = cellSize
  const board = card.grid * cell
  const x0 = PAD + COORD
  const y0 = PAD + HEADER + COORD
  const W = PAD * 2 + COORD + board
  const H = PAD * 2 + HEADER + COORD + board + LEGEND
  const cells: CellGeom[] = []
  for (const ship of card.ships) {
    for (const c of ship.cells) {
      cells.push({
        shipId: ship.type.id,
        r: c.r,
        c: c.c,
        n: c.n,
        cx: x0 + (c.c + 0.5) * cell,
        cy: y0 + (c.r + 0.5) * cell,
        rr: cell * 0.42,
      })
    }
  }
  return { W, H, cell, cells }
}

export function cardToSvg(card: Card, opts: RenderOptions): string {
  const cell = opts.cell ?? 40
  const pal = opts.print ? printPalette(opts.style, opts.mode) : getPalette(opts.style, opts.mode)
  const board = card.grid * cell
  const x0 = PAD + COORD
  const y0 = PAD + HEADER + COORD
  const W = PAD * 2 + COORD + board
  const H = PAD * 2 + HEADER + COORD + board + LEGEND

  const parts: string[] = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace">`,
  )
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="${pal.bg}"/>`)

  // ---- header ----
  parts.push(
    `<text x="${PAD}" y="${PAD + 22}" fill="${pal.title}" font-size="20" font-weight="700" letter-spacing="1">BATTLESHIP BINGO</text>`,
  )
  parts.push(
    `<text x="${PAD}" y="${PAD + 39}" fill="${pal.subtitle}" font-size="10.5" letter-spacing="0.5">first ship · each type · all clear</text>`,
  )
  // code as a boxed, monospace ID chip — clearly a different thing from the title
  const cFont = 15
  const chipW = card.code.length * (cFont * 0.62 + 1.5) + 18
  const chipH = 24
  const chipX = W - PAD - chipW
  const chipY = PAD + 3
  parts.push(
    `<rect x="${chipX.toFixed(1)}" y="${chipY}" width="${chipW.toFixed(1)}" height="${chipH}" rx="6" fill="none" stroke="${pal.gridLineStrong}" stroke-width="1.5"/>`,
  )
  parts.push(
    `<text x="${(chipX + chipW / 2 + 1).toFixed(1)}" y="${(chipY + chipH / 2 + cFont * 0.35).toFixed(1)}" text-anchor="middle" fill="${pal.subtitle}" font-size="${cFont}" font-weight="600" letter-spacing="2">${card.code}</text>`,
  )

  // ---- board background + grid ----
  parts.push(
    `<rect x="${x0}" y="${y0}" width="${board}" height="${board}" fill="${pal.water}" stroke="${pal.gridLineStrong}" stroke-width="2"/>`,
  )
  for (let i = 1; i < card.grid; i++) {
    const p = i * cell
    parts.push(
      `<line x1="${x0 + p}" y1="${y0}" x2="${x0 + p}" y2="${y0 + board}" stroke="${pal.gridLine}" stroke-width="1"/>`,
    )
    parts.push(
      `<line x1="${x0}" y1="${y0 + p}" x2="${x0 + board}" y2="${y0 + p}" stroke="${pal.gridLine}" stroke-width="1"/>`,
    )
  }
  // ---- coordinate labels (flavour only; numbers live on the ships) ----
  for (let c = 0; c < card.grid; c++) {
    parts.push(
      `<text x="${x0 + (c + 0.5) * cell}" y="${y0 - 6}" text-anchor="middle" fill="${pal.coordText}" font-size="11">${LETTERS[c]}</text>`,
    )
  }
  for (let r = 0; r < card.grid; r++) {
    parts.push(
      `<text x="${x0 - 7}" y="${y0 + (r + 0.5) * cell + 4}" text-anchor="middle" fill="${pal.coordText}" font-size="11">${r + 1}</text>`,
    )
  }

  // ---- ships ----
  for (const ship of card.ships) {
    if (opts.style === 'sonar') {
      const color = pal.ship[ship.type.id] ?? pal.hullStroke
      parts.push(sonarHull(ship, x0, y0, cell, color, pal))
    } else {
      parts.push(reconShip(ship, x0, y0, cell))
    }
  }
  // ---- numbers (drawn last so they sit on top of hulls) ----
  // Numbers carry the ship colour in both styles. Recon adds a plate behind them
  // for legibility over the pixel hull; the plate flips to suit dark vs light
  // numbers (bright night numbers -> dark plate; dark day/print numbers -> light).
  const darkNumbers = opts.print || opts.mode === 'day'
  const plate = darkNumbers ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.5)'
  for (const ship of card.ships) {
    const color = pal.ship[ship.type.id] ?? pal.hullStroke
    for (const c of ship.cells) {
      const cx = x0 + (c.c + 0.5) * cell
      const cy = y0 + (c.r + 0.5) * cell
      if (opts.style === 'recon') {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(cell * 0.27).toFixed(1)}" fill="${plate}"/>`,
        )
      }
      parts.push(
        `<text x="${cx.toFixed(1)}" y="${(cy + cell * 0.15).toFixed(1)}" text-anchor="middle" fill="${color}" font-size="${(cell * 0.42).toFixed(1)}" font-weight="700">${c.n}</text>`,
      )
    }
  }

  // ---- legend (key), laid out over two rows: 3 + 2 ----
  // Deliberately low-contrast: it's a reference, not part of the play surface,
  // so the whole group is dimmed and uses muted text to keep cards readable at a glance.
  const perRow = 3
  const slotW = board / perRow
  const rowGap = 32
  const legendY = y0 + board + 22
  // Keep it muted on the night screen (where it was over-loud), but give it real
  // contrast in day mode and on the printed card so the key is actually readable.
  const legendOpacity = opts.mode === 'night' && !opts.print ? 0.7 : 0.9
  parts.push(`<g opacity="${legendOpacity}">`)
  card.ships.forEach((ship, i) => {
    const color = pal.ship[ship.type.id] ?? pal.hullStroke
    const col = i % perRow
    const row = Math.floor(i / perRow)
    const bx = x0 + col * slotW
    const by = legendY + row * rowGap
    parts.push(
      `<rect x="${bx.toFixed(1)}" y="${(by - 8).toFixed(1)}" width="10" height="7" rx="2" fill="${color}"/>`,
    )
    parts.push(
      `<text x="${(bx + 16).toFixed(1)}" y="${by.toFixed(1)}" fill="${pal.coordText}" font-size="9.5" font-weight="500">${ship.type.short}</text>`,
    )
    // length pips drawn as rects (not a glyph) so they survive PDF core fonts
    for (let p = 0; p < ship.type.length; p++) {
      parts.push(
        `<rect x="${(bx + 16 + p * 6.5).toFixed(1)}" y="${(by + 5).toFixed(1)}" width="4.5" height="4.5" rx="1" fill="${color}"/>`,
      )
    }
  })
  parts.push('</g>')

  parts.push('</svg>')
  return parts.join('')
}
