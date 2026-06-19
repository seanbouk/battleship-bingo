import { useEffect, useState } from 'react'
import { generatePack } from '../engine/pack'
import { useSettings } from '../settings/SettingsContext'

interface Props {
  seed: string
  onClose: () => void
}

// per-sheet count -> page grid (A4 portrait)
const SHEET_LAYOUTS: Record<number, { cols: number; rows: number }> = {
  1: { cols: 1, rows: 1 },
  2: { cols: 1, rows: 2 },
  4: { cols: 2, rows: 2 },
  6: { cols: 2, rows: 3 },
  9: { cols: 3, rows: 3 },
}

const COUNT_PRESETS = [6, 12, 24, 36, 48, 96]

export default function DownloadDialog({ seed, onClose }: Props) {
  const { style, mode } = useSettings()
  const [count, setCount] = useState(24)
  const [perSheet, setPerSheet] = useState(4)
  const [busy, setBusy] = useState(false)

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const safeCount = Math.max(1, Math.min(1000, Math.floor(count) || 1))
  const pages = Math.ceil(safeCount / perSheet)

  async function onGenerate() {
    setBusy(true)
    try {
      const pack = generatePack({ count: safeCount, packSeed: seed })
      const { exportPackPdf } = await import('../pdf/exportPdf')
      await exportPackPdf(pack, { style, mode }, SHEET_LAYOUTS[perSheet])
      onClose()
    } catch (err) {
      console.error(err)
      alert('PDF export failed — see console for details.')
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Download cards">
        <h2>Download cards</h2>
        <p className="dialog-sub">
          Pack <strong>{seed}</strong> — printable PDF
        </p>

        <div className="field">
          <label htmlFor="count">Number of cards</label>
          <input
            id="count"
            list="count-presets"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(+e.target.value)}
          />
          <datalist id="count-presets">
            {COUNT_PRESETS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <div className="field">
          <label htmlFor="perSheet">Cards per sheet</label>
          <select id="perSheet" value={perSheet} onChange={(e) => setPerSheet(+e.target.value)}>
            <option value={1}>1 (full page)</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={6}>6</option>
            <option value={9}>9 (smallest)</option>
          </select>
        </div>

        <p className="dialog-note">
          {safeCount} card{safeCount === 1 ? '' : 's'} → {pages} page{pages === 1 ? '' : 's'}
        </p>

        <div className="dialog-actions">
          <button className="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="action" onClick={onGenerate} disabled={busy}>
            {busy ? 'Building PDF…' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
