import { useEffect, useRef, useState } from 'react'
import { Card } from '../engine/card'
import { CardStatus } from '../engine/win'
import PlayableCard from './PlayableCard'
import Qr from './Qr'
import CopyButton from './CopyButton'
import { hrefFor } from '../lib/route'

interface Props {
  code: string
  name: string
  source: 'issued' | 'checked'
  isNew: boolean
  justSank?: string | null
  /** bump this number to scroll-to + flash this row (from a prize chip click) */
  flashSignal?: number
  card: Card
  marked: Set<number>
  status: CardStatus
  onRename: (name: string) => void
  onRemove: () => void
}

export default function TrackedCardRow({
  code,
  name,
  source,
  isNew,
  justSank,
  flashSignal,
  card,
  marked,
  status,
  onRename,
  onRemove,
}: Props) {
  const [modal, setModal] = useState<'card' | 'qr' | null>(null)
  const link = hrefFor('card', code)
  const rootRef = useRef<HTMLDivElement>(null)

  // Scroll to and flash this row when its signal bumps. Uses the Web Animations
  // API (not a CSS class) so it always restarts and survives React re-renders.
  useEffect(() => {
    if (!flashSignal) return
    const el = rootRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#39ff9e'
    el.animate(
      [
        { boxShadow: `0 0 0 3px ${accent}, 0 0 18px ${accent}` },
        { boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
      ],
      { duration: 1200, easing: 'ease-out' },
    )
  }, [flashSignal])

  return (
    <div ref={rootRef} className={`tracked ${isNew ? 'new' : ''} ${justSank ? 'sank' : ''}`}>
      <div className="tracked-head">
        <span className="tracked-code">{code}</span>
        <span className="tracked-tag">{source}</span>
        <span className="grow" />
        {justSank ? (
          <span className="badge win">💥 {justSank}</span>
        ) : status.allClear ? (
          <span className="badge win">ALL CLEAR ✓</span>
        ) : status.firstShip ? (
          <span className="badge win">
            {status.sunkCount}/{status.totalShips} sunk
          </span>
        ) : (
          <span className="badge">none yet</span>
        )}
      </div>

      <input
        className="tracked-name"
        placeholder="name (optional)"
        value={name}
        onChange={(e) => onRename(e.target.value)}
      />

      <ul className="ship-status compact">
        {status.ships.map((s) => (
          <li key={s.ship.type.id} className={s.sunk ? 'sunk' : ''}>
            {s.ship.type.short} {s.sunk ? '✓' : `${s.hits}/${s.ship.cells.length}`}
          </li>
        ))}
      </ul>

      <div className="tracked-toggles">
        <button className="icon-btn sm" title="View card" onPointerDown={() => setModal('card')}>
          👁 View
        </button>
        <button className="icon-btn sm" title="Show QR / link" onPointerDown={() => setModal('qr')}>
          🔗 Link
        </button>
        <button className="icon-btn sm" title="Remove" onPointerDown={onRemove}>
          ✖️
        </button>
      </div>

      {modal && (
        <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className={`dialog ${modal === 'card' ? 'wide' : ''}`} role="dialog" aria-modal="true">
            <h2>
              Card {code} {name && <span className="dialog-sub">· {name}</span>}
            </h2>
            {modal === 'card' ? (
              <PlayableCard card={card} marked={marked} status={status} readOnly />
            ) : (
              <div className="share-block">
                <Qr text={link} />
                <code className="link">{link}</code>
                <CopyButton text={link} />
              </div>
            )}
            <div className="dialog-actions">
              <button className="action" onPointerDown={() => setModal(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
