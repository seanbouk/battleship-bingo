import { Card, PlacedShip } from '../engine/card'
import { Style, Mode } from '../settings/SettingsContext'
import { getPalette, Palette } from './palette'

export interface RenderOptions {
  style: Style
  mode: Mode
  /** grid cell size in px (controls overall resolution); default 40 */
  cell?: number
}

const PAD = 16
const COORD = 18
const HEADER = 46
const LEGEND = 52
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

function reconHull(ship: PlacedShip, x0: number, y0: number, cell: number, color: string): string {
  const b = bbox(ship)
  const left = x0 + b.minC * cell + INSET
  const right = x0 + (b.maxC + 1) * cell - INSET
  const top = y0 + b.minR * cell + INSET
  const bot = y0 + (b.maxR + 1) * cell - INSET
  const bow = cell * 0.5
  let pts: string
  if (ship.orientation === 'h') {
    const midY = (top + bot) / 2
    pts = `${left},${top} ${right - bow},${top} ${right},${midY} ${right - bow},${bot} ${left},${bot}`
  } else {
    const midX = (left + right) / 2
    pts = `${left},${bot} ${left},${top + bow} ${midX},${top} ${right},${top + bow} ${right},${bot}`
  }
  const fmt = pts
    .split(' ')
    .map((p) => p.split(',').map((v) => Number(v).toFixed(1)).join(','))
    .join(' ')
  // hull body + a lighter deck line for a touch of detail
  return (
    `<polygon points="${fmt}" fill="${color}" stroke="rgba(0,0,0,0.45)" stroke-width="1.5" stroke-linejoin="round"/>` +
    (ship.orientation === 'h'
      ? `<line x1="${(left + 4).toFixed(1)}" y1="${((top + bot) / 2).toFixed(1)}" x2="${(right - bow).toFixed(1)}" y2="${((top + bot) / 2).toFixed(1)}" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>`
      : `<line x1="${((left + right) / 2).toFixed(1)}" y1="${(bot - 4).toFixed(1)}" x2="${((left + right) / 2).toFixed(1)}" y2="${(top + bow).toFixed(1)}" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>`)
  )
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
  parts.push(
    `<text x="${W - PAD}" y="${PAD + 30}" text-anchor="end" fill="${pal.title}" font-size="20" font-weight="700" letter-spacing="2">${card.code}</text>`,
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
  // ---- numbers (drawn last so they sit on top of hulls) ----
  for (const ship of card.ships) {
    const color = pal.ship[ship.type.id] ?? pal.hullStroke
    const numColor = opts.style === 'sonar' ? color : pal.numberText
    for (const c of ship.cells) {
      const cx = x0 + (c.c + 0.5) * cell
      const cy = y0 + (c.r + 0.5) * cell
      parts.push(
        `<text x="${cx.toFixed(1)}" y="${(cy + cell * 0.15).toFixed(1)}" text-anchor="middle" fill="${numColor}" font-size="${(cell * 0.42).toFixed(1)}" font-weight="700">${c.n}</text>`,
      )
    }
  }

  // ---- legend ----
  const legendY = y0 + board + 20
  const slot = board / card.ships.length
  card.ships.forEach((ship, i) => {
    const color = pal.ship[ship.type.id] ?? pal.hullStroke
    const cx = x0 + i * slot
    parts.push(`<rect x="${cx.toFixed(1)}" y="${(legendY - 9).toFixed(1)}" width="14" height="10" rx="3" fill="${opts.style === 'sonar' ? pal.hullFill : color}" stroke="${color}" stroke-width="1.5"/>`)
    parts.push(
      `<text x="${(cx + 19).toFixed(1)}" y="${legendY}" fill="${pal.subtitle}" font-size="10.5" font-weight="600">${ship.type.name}</text>`,
    )
    // length pips drawn as rects (not a glyph) so they survive PDF core fonts
    for (let p = 0; p < ship.type.length; p++) {
      parts.push(
        `<rect x="${(cx + 19 + p * 7).toFixed(1)}" y="${(legendY + 5).toFixed(1)}" width="5" height="5" rx="1" fill="${color}"/>`,
      )
    }
  })

  parts.push('</svg>')
  return parts.join('')
}
