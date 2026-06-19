import { useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import CardPreview from './components/CardPreview'
import DownloadDialog from './components/DownloadDialog'
import { generatePack } from './engine/pack'
import { randomSeed } from './lib/seed'

const PREVIEW_COUNT = 6

export default function App() {
  const [seed, setSeed] = useState(() => randomSeed())
  const [dialogOpen, setDialogOpen] = useState(false)

  // A small sample of the pack for on-screen preview; the real (larger) pack is
  // generated from the same seed when the user downloads.
  const preview = useMemo(() => generatePack({ count: PREVIEW_COUNT, packSeed: seed }), [seed])

  return (
    <>
      <TopBar
        seed={seed}
        onSeed={setSeed}
        onRandomSeed={() => setSeed(randomSeed())}
        onDownload={() => setDialogOpen(true)}
      />
      <main>
        <div className="cards">
          {preview.cards.map((card) => (
            <CardPreview key={card.code} card={card} />
          ))}
        </div>
        <p className="hint" style={{ marginTop: 28 }}>
          A preview of pack <strong>{seed}</strong>. Choose how many cards and how many per sheet
          when you download. Win order: <strong>first ship</strong> → <strong>first of each type</strong>{' '}
          → <strong>all clear</strong>. Recon ship insignia by Cathelineau &amp; Delapouite via{' '}
          <a href="https://game-icons.net" target="_blank" rel="noreferrer">
            game-icons.net
          </a>{' '}
          (CC BY 3.0).
        </p>
      </main>
      {dialogOpen && <DownloadDialog seed={seed} onClose={() => setDialogOpen(false)} />}
    </>
  )
}
