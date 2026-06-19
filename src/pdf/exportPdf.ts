import { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import { Pack } from '../engine/pack'
import { cardToSvg, RenderOptions } from '../render/cardSvg'

export interface PdfLayout {
  cols?: number
  rows?: number
}

// Renders every card in the pack to a multi-page A4 PDF using the SAME SVG
// builder the screen uses, so a downloaded sheet looks exactly like the preview
// in the current site-wide style/mode.
export async function exportPackPdf(
  pack: Pack,
  render: RenderOptions,
  layout: PdfLayout = {},
): Promise<void> {
  const cols = layout.cols ?? 2
  const rows = layout.rows ?? 2
  const perPage = cols * rows

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 8
  const gap = 6
  const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols
  const cellH = (pageH - margin * 2 - gap * (rows - 1)) / rows

  // svg2pdf measures text via the live DOM, so the SVG must be attached while
  // it is converted. Park it offscreen.
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-100000px'
  host.style.top = '0'
  host.setAttribute('aria-hidden', 'true')
  document.body.appendChild(host)

  try {
    for (let i = 0; i < pack.cards.length; i++) {
      if (i > 0 && i % perPage === 0) doc.addPage()
      const slot = i % perPage
      const col = slot % cols
      const row = Math.floor(slot / cols)

      const svgStr = cardToSvg(pack.cards[i], render)
      const parsed = new DOMParser().parseFromString(svgStr, 'image/svg+xml')
      const el = document.importNode(parsed.documentElement, true) as unknown as SVGSVGElement
      host.appendChild(el)

      const vbW = el.viewBox.baseVal.width || Number(el.getAttribute('width'))
      const vbH = el.viewBox.baseVal.height || Number(el.getAttribute('height'))
      const scale = Math.min(cellW / vbW, cellH / vbH)
      const w = vbW * scale
      const h = vbH * scale
      const x = margin + col * (cellW + gap) + (cellW - w) / 2
      const y = margin + row * (cellH + gap) + (cellH - h) / 2

      await svg2pdf(el, doc, { x, y, width: w, height: h })
      host.removeChild(el)
    }

    doc.save(`battleship-bingo-${pack.packSeed}.pdf`)
  } finally {
    document.body.removeChild(host)
  }
}
