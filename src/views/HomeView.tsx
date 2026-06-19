import { useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import CardPreview from '../components/CardPreview'
import DownloadDialog from '../components/DownloadDialog'
import { generatePack } from '../engine/pack'
import { randomSeed } from '../lib/seed'
import { go } from '../lib/route'

const PREVIEW_COUNT = 6

export default function HomeView() {
  const [seed, setSeed] = useState(() => randomSeed())
  const [dialogOpen, setDialogOpen] = useState(false)
  const preview = useMemo(() => generatePack({ count: PREVIEW_COUNT, packSeed: seed }), [seed])

  const middle = (
    <>
      <div className="seed-field">
        <span className="seed-tag">Pack</span>
        <input
          aria-label="Pack seed"
          value={seed}
          onChange={(e) => setSeed(e.target.value.toUpperCase())}
          spellCheck={false}
        />
        <button className="icon-btn" title="New random pack" onPointerDown={() => setSeed(randomSeed())}>
          🎲
        </button>
      </div>
      <button className="action" onPointerDown={() => setDialogOpen(true)}>
        Download PDF
      </button>
    </>
  )

  return (
    <>
      <TopBar middle={middle} />
      <main>
        <div className="roles">
          <button className="role-card" onPointerDown={() => go('call')}>
            <span className="role-emoji">📣</span>
            <span className="role-title">Run a game</span>
            <span className="role-sub">Call numbers, hand out cards, check claims</span>
          </button>
          <button className="role-card" onPointerDown={() => go('play')}>
            <span className="role-emoji">🎯</span>
            <span className="role-title">Play</span>
            <span className="role-sub">Grab a card and daub as numbers are called</span>
          </button>
        </div>

        <h2 className="section-h">Printable cards</h2>
        <div className="cards">
          {preview.cards.map((card) => (
            <CardPreview key={card.code} card={card} />
          ))}
        </div>
        <p className="hint" style={{ marginTop: 24 }}>
          A preview of pack <strong>{seed}</strong>. Choose how many cards and how many per sheet
          when you download. Win order: <strong>first ship</strong> → <strong>first of each type</strong>{' '}
          → <strong>all clear</strong>. Recon ship sprites:{' '}
          <a href="https://opengameart.org/content/sea-warfare-set-ships-and-more" target="_blank" rel="noreferrer">
            “Sea Warfare Set” by Lowder2
          </a>{' '}
          (CC0).
        </p>
      </main>
      {dialogOpen && <DownloadDialog seed={seed} onClose={() => setDialogOpen(false)} />}
    </>
  )
}
