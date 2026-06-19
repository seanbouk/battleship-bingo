import { Card, PlacedShip } from '../engine/card'
import { Style, Mode } from '../settings/SettingsContext'
import { getPalette, Palette } from './palette'
import { SHIP_ART } from './shipArt'

export interface RenderOptions {
  style: Style
  mode: Mode
  /** grid cell size in px (controls overall resolution); default 40 */
  cell?: number
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

// Recon: a solid colored hull (capsule with a pointed bow) that fills the
// footprint, with the game-icons ship plan as a darker deck insignia centred on
// it. The hull conveys length; the insignia conveys type.
function reconHull(ship: PlacedShip, x0: number, y0: number, cell: number, color: string): string {
  const b = bbox(ship)
  const left = x0 + b.minC * cell + INSET
  const right = x0 + (b.maxC + 1) * cell - INSET
  const top = y0 + b.minR * cell + INSET
  const bot = y0 + (b.maxR + 1) * cell - INSET
  const horiz = ship.orientation === 'h'
  const rr = cell * 0.24
  const bow = cell * 0.55

  let hull: string
  if (horiz) {
    const midY = (top + bot) / 2
    hull =
      `M${(left + rr).toFixed(1)},${top.toFixed(1)} L${(right - bow).toFixed(1)},${top.toFixed(1)} ` +
      `L${right.toFixed(1)},${midY.toFixed(1)} L${(right - bow).toFixed(1)},${bot.toFixed(1)} ` +
      `L${(left + rr).toFixed(1)},${bot.toFixed(1)} Q${left.toFixed(1)},${bot.toFixed(1)} ${left.toFixed(1)},${(bot - rr).toFixed(1)} ` +
      `L${left.toFixed(1)},${(top + rr).toFixed(1)} Q${left.toFixed(1)},${top.toFixed(1)} ${(left + rr).toFixed(1)},${top.toFixed(1)} Z`
  } else {
    const midX = (left + right) / 2
    hull =
      `M${left.toFixed(1)},${(bot - rr).toFixed(1)} Q${left.toFixed(1)},${bot.toFixed(1)} ${(left + rr).toFixed(1)},${bot.toFixed(1)} ` +
      `L${(right - rr).toFixed(1)},${bot.toFixed(1)} Q${right.toFixed(1)},${bot.toFixed(1)} ${right.toFixed(1)},${(bot - rr).toFixed(1)} ` +
      `L${right.toFixed(1)},${(top + bow).toFixed(1)} L${midX.toFixed(1)},${top.toFixed(1)} L${left.toFixed(1)},${(top + bow).toFixed(1)} Z`
  }

  let out = `<path d="${hull}" fill="${color}" stroke="rgba(0,0,0,0.45)" stroke-width="1.4" stroke-linejoin="round"/>`

  const art = SHIP_ART[ship.type.id]
  if (art) {
    const cx = (left + right) / 2
    const cy = (top + bot) / 2
    // rotate so the icon's bow-stern axis runs along the footprint's long axis
    const deg = art.axis === 'h' ? (horiz ? 0 : 90) : horiz ? 90 : 0
    const rotated = deg === 90
    const onW = rotated ? art.bbox[3] - art.bbox[1] : art.bbox[2] - art.bbox[0]
    const onH = rotated ? art.bbox[2] - art.bbox[0] : art.bbox[3] - art.bbox[1]
    const box = cell * 0.86
    const sc = Math.min(box / onW, box / onH)
    const bcx = (art.bbox[0] + art.bbox[2]) / 2
    const bcy = (art.bbox[1] + art.bbox[3]) / 2
    out +=
      `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${deg}) scale(${sc.toFixed(4)}) ` +
      `translate(${(-bcx).toFixed(1)},${(-bcy).toFixed(1)})" fill="rgba(0,0,0,0.34)"><path d="${art.d}"/></g>`
  }
  return out
}

export function cardToSvg(card: Card, opts: RenderOptions): string {
  const cell = opts.cell ?? 40
  const pal = getPalette(opts.style, opts.mode)
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
    const color = pal.ship[ship.type.id] ?? pal.hullStroke
    parts.push(opts.style === 'sonar' ? sonarHull(ship, x0, y0, cell, color, pal) : reconHull(ship, x0, y0, cell, color))
  }
  // ---- numbers (drawn last so they sit on top of hulls/insignia) ----
  // Sonar: clean colored numerals. Recon: white numerals on a dark disc so they
  // stay legible over the illustrated hull and deck insignia.
  for (const ship of card.ships) {
    const color = pal.ship[ship.type.id] ?? pal.hullStroke
    for (const c of ship.cells) {
      const cx = x0 + (c.c + 0.5) * cell
      const cy = y0 + (c.r + 0.5) * cell
      if (opts.style === 'recon') {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(cell * 0.3).toFixed(1)}" fill="rgba(0,0,0,0.5)"/>`,
        )
      }
      const numColor = opts.style === 'sonar' ? color : '#ffffff'
      parts.push(
        `<text x="${cx.toFixed(1)}" y="${(cy + cell * 0.15).toFixed(1)}" text-anchor="middle" fill="${numColor}" font-size="${(cell * 0.42).toFixed(1)}" font-weight="700">${c.n}</text>`,
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
  parts.push('<g opacity="0.62">')
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
