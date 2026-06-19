import { useState } from 'react'
import { Card } from '../engine/card'
import { CardStatus } from '../engine/win'
import PlayableCard from './PlayableCard'
import Qr from './Qr'
import { hrefFor } from '../lib/route'

interface Props {
  code: string
  name: string
  source: 'issued' | 'checked'
  isNew: boolean
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
  card,
  marked,
  status,
  onRename,
  onRemove,
}: Props) {
  const [showCard, setShowCard] = useState(isNew)
  const [showQr, setShowQr] = useState(false)

  return (
    <div className={`tracked ${isNew ? 'new' : ''}`}>
      <div className="tracked-head">
        <span className="tracked-code">{code}</span>
        <span className="tracked-tag">{source}</span>
        {isNew && <span className="tracked-new-tag">just added</span>}
        <span className="grow" />
        {status.allClear ? (
          <span className="badge win">ALL CLEAR ✓</span>
        ) : status.firstShip ? (
          <span className="badge win">
            {status.sunkCount}/{status.totalShips} sunk
          </span>
        ) : (
          <span className="badge">none yet</span>
        )}
        <div className="tracked-toggles">
          <button className="icon-btn sm" title="View card" onClick={() => setShowCard((v) => !v)}>
            👁
          </button>
          <button className="icon-btn sm" title="Show QR / link" onClick={() => setShowQr((v) => !v)}>
            🔗
          </button>
          <button className="icon-btn sm" title="Remove" onClick={onRemove}>
            ✖️
          </button>
        </div>
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

      {(showCard || showQr) && (
        <div className="tracked-expand">
          {showCard ? (
            <PlayableCard card={card} marked={marked} status={status} readOnly />
          ) : (
            <span />
          )}
          {showQr && (
            <div className="tracked-qr">
              <Qr text={hrefFor('card', code)} />
              <code className="link">{hrefFor('card', code)}</code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
