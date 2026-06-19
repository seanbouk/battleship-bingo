import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import PlayableCard from '../components/PlayableCard'
import Qr from '../components/Qr'
import { generateCard } from '../engine/card'
import { evaluateCard } from '../engine/win'
import { hrefFor, go } from '../lib/route'
import { randomCardCode } from '../lib/seed'

function loadDaubs(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key)
    return new Set<number>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

// Mounted with key={code}, so state resets cleanly when the card changes.
export default function PlayerView({ code }: { code: string }) {
  const card = generateCard(code)
  const storeKey = `bb.daub.${code}`
  const [marked, setMarked] = useState<Set<number>>(() => loadDaubs(storeKey))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    localStorage.setItem(storeKey, JSON.stringify([...marked]))
  }, [storeKey, marked])

  const status = evaluateCard(card, marked)

  function toggle(n: number) {
    setMarked((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  function share() {
    navigator.clipboard?.writeText(hrefFor('card', code)).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )
  }

  return (
    <>
      <TopBar />
      <main className="player">
        <div className="player-grid">
          <div className="player-card-col">
            <PlayableCard card={card} marked={marked} status={status} onToggle={toggle} />
            <p className="hint center">Tap a square when its number is called. Tap again to undo.</p>
          </div>

          <aside className="player-side">
            <div className="code-block">
              <span className="code-label">Your card</span>
              <span className="code-big">{card.code}</span>
              <span className="code-hint">Shout this code to claim a win</span>
            </div>

            {status.allClear ? (
              <div className="win-banner all-clear">🎉 ALL CLEAR! 🎉</div>
            ) : status.firstShip ? (
              <div className="win-banner">
                {status.sunkCount} of {status.totalShips} ships sunk
              </div>
            ) : (
              <div className="win-banner muted">No ships sunk yet</div>
            )}

            <ul className="ship-status">
              {status.ships.map((s) => (
                <li key={s.ship.type.id} className={s.sunk ? 'sunk' : ''}>
                  <span className="ship-name">{s.ship.type.name}</span>
                  <span className="ship-hits">
                    {s.sunk ? 'SUNK' : `${s.hits}/${s.ship.cells.length}`}
                  </span>
                </li>
              ))}
            </ul>

            <div className="player-actions">
              <button className="ghost" onClick={() => setMarked(new Set())}>
                Clear marks
              </button>
              <button className="ghost" onClick={() => go('card', randomCardCode())}>
                New card
              </button>
            </div>

            <div className="share-block">
              <Qr text={hrefFor('card', code)} />
              <button className="ghost" onClick={share}>
                {copied ? 'Link copied!' : 'Copy link to this card'}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
