import { useState } from 'react'
import { Card } from '../engine/card'
import { CardStatus } from '../engine/win'
import PlayableCard from './PlayableCard'
import Qr from './Qr'
import CopyButton from './CopyButton'
import { hrefFor } from '../lib/route'
import { PRIZES, qualifies, PrizeState } from '../engine/prizes'

interface Props {
  code: string
  name: string
  source: 'issued' | 'checked'
  isNew: boolean
  justSank?: string | null
  card: Card
  marked: Set<number>
  status: CardStatus
  prizes: Record<string, PrizeState>
  onAward: (prizeId: string) => void
  onRename: (name: string) => void
  onRemove: () => void
}

export default function TrackedCardRow({
  code,
  name,
  source,
  isNew,
  justSank,
  card,
  marked,
  status,
  prizes,
  onAward,
  onRename,
  onRemove,
}: Props) {
  const [modal, setModal] = useState<'card' | 'qr' | null>(null)
  const link = hrefFor('card', code)

  // Prizes this card genuinely qualifies for and hasn't already won. An open
  // prize gets a prominent Award button; an already-won one gets a quiet "tie"
  // button so a genuine simultaneous claim can still be added at the caller's
  // discretion.
  const awardable = PRIZES.filter(
    (p) =>
      prizes[p.id]?.enabled &&
      qualifies(p.id, status) &&
      !prizes[p.id].winners.some((w) => w.code === code),
  ).map((p) => ({ ...p, tie: prizes[p.id].winners.length > 0 }))

  return (
    <div className={`tracked ${isNew ? 'new' : ''} ${justSank ? 'sank' : ''}`}>
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

      {awardable.length > 0 && (
        <div className="award-row">
          {awardable.map((p) => (
            <button
              key={p.id}
              className={p.tie ? 'award-btn tie' : 'award-btn'}
              onPointerDown={() => onAward(p.id)}
            >
              {p.tie ? `＋ ${p.label} tie` : `🏆 ${p.label}`}
            </button>
          ))}
        </div>
      )}

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
