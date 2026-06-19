import { useMemo, useState } from 'react'
import { generatePack, balanceStats } from '../engine/pack'
import { TOTAL_CELLS, DEFAULT_GRID, DEFAULT_POOL } from '../engine/fleet'
import { useSettings } from '../settings/SettingsContext'
import CardPreview from './CardPreview'

const PREVIEW_LIMIT = 12

function randomSeed(): string {
  // App runtime (browser) — Math.random/Date.now are fine here.
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function Generator() {
  const { style, mode } = useSettings()
  const [count, setCount] = useState(12)
  const [pool, setPool] = useState(DEFAULT_POOL)
  const [grid, setGrid] = useState(DEFAULT_GRID)
  const [seed, setSeed] = useState(() => randomSeed())
  const [exporting, setExporting] = useState(false)

  const pack = useMemo(
    () => generatePack({ count: clampCount(count), packSeed: seed, pool: clampPool(pool), grid: clampGrid(grid) }),
    [count, pool, grid, seed],
  )
  const stats = useMemo(() => balanceStats(pack), [pack])

  async function onDownload() {
    setExporting(true)
    try {
      // Lazy-loaded so jsPDF/svg2pdf stay out of the initial bundle.
      const { exportPackPdf } = await import('../pdf/exportPdf')
      await exportPackPdf(pack, { style, mode })
    } catch (err) {
      console.error(err)
      alert('PDF export failed — see console for details.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="controls">
        <div className="field">
          <label htmlFor="count">Number of cards</label>
          <input id="count" type="number" min={1} max={500} value={count} onChange={(e) => setCount(+e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pool">Number pool (1–N)</label>
          <input id="pool" type="number" min={TOTAL_CELLS} max={99} value={pool} onChange={(e) => setPool(+e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="grid">Grid size</label>
          <input id="grid" type="number" min={6} max={12} value={grid} onChange={(e) => setGrid(+e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="seed">Pack seed</label>
          <div className="row">
            <input id="seed" type="text" value={seed} onChange={(e) => setSeed(e.target.value.toUpperCase())} />
            <button className="ghost" title="Randomise seed" onClick={() => setSeed(randomSeed())}>
              🎲
            </button>
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="action" onClick={onDownload} disabled={exporting}>
          {exporting ? 'Building PDF…' : `Download PDF (${pack.cards.length} card${pack.cards.length === 1 ? '' : 's'})`}
        </button>
        <span className="stat">
          {TOTAL_CELLS} numbers/card · pool 1–{pack.pool} · each number on {stats.min}–{stats.max} cards (avg{' '}
          {stats.mean.toFixed(1)})
        </span>
      </div>

      {pack.cards.length > PREVIEW_LIMIT && (
        <p className="hint">
          Showing the first {PREVIEW_LIMIT} of {pack.cards.length} cards. The PDF contains all of them.
        </p>
      )}

      <div className="cards">
        {pack.cards.slice(0, PREVIEW_LIMIT).map((card) => (
          <CardPreview key={card.code} card={card} />
        ))}
      </div>
    </>
  )
}

function clampCount(n: number) {
  return Math.max(1, Math.min(500, Math.floor(n) || 1))
}
function clampPool(n: number) {
  return Math.max(TOTAL_CELLS, Math.min(99, Math.floor(n) || DEFAULT_POOL))
}
function clampGrid(n: number) {
  return Math.max(6, Math.min(12, Math.floor(n) || DEFAULT_GRID))
}
