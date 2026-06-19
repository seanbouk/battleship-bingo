import { useEffect, useRef, useState } from 'react'
import TopBar from '../components/TopBar'
import PlayableCard from '../components/PlayableCard'
import Qr from '../components/Qr'
import { generateCard } from '../engine/card'
import { evaluateCard } from '../engine/win'
import { hrefFor, go } from '../lib/route'
import { randomCardCode, normalizeCode } from '../lib/seed'

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
  const [codeInput, setCodeInput] = useState(code)

  const status = evaluateCard(card, marked)

  // Persist daubs and mirror them into history.state so Back can restore them.
  useEffect(() => {
    localStorage.setItem(storeKey, JSON.stringify([...marked]))
    window.history.replaceState({ ...(window.history.state || {}), daubs: [...marked] }, '')
  }, [storeKey, marked])

  // Back/forward restores a daub snapshot (e.g. after Clear marks).
  useEffect(() => {
    const onPop = () => {
      const st = window.history.state
      if (st && Array.isArray(st.daubs)) setMarked(new Set<number>(st.daubs))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // "You sank my ___" toast on each newly-sunk ship.
  const prevSunk = useRef(new Set(status.sunkTypes))
  const toastSeq = useRef(0)
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null)
  const sunkKey = status.sunkTypes.join(',')
  useEffect(() => {
    const now = new Set(status.sunkTypes)
    for (const id of now) {
      if (!prevSunk.current.has(id)) {
        const ship = card.ships.find((s) => s.type.id === id)
        if (ship) {
          toastSeq.current += 1
          setToast({ key: toastSeq.current, text: `You sank my ${ship.type.name}!` })
        }
      }
    }
    prevSunk.current = now
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sunkKey])

  function toggle(n: number) {
    setMarked((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  function clearMarks() {
    if (marked.size === 0) return
    // leave the current history entry holding the pre-clear daubs, then push an
    // empty entry — pressing Back pops to the full set and restores it.
    window.history.replaceState({ ...(window.history.state || {}), daubs: [...marked] }, '')
    window.history.pushState({ daubs: [] }, '')
    setMarked(new Set())
  }

  function commitCode() {
    const c = normalizeCode(codeInput)
    if (c.length >= 4 && c !== card.code) go('card', c)
    else setCodeInput(card.code)
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
      {toast && (
        <div key={toast.key} className="sink-toast" onAnimationEnd={() => setToast(null)}>
          {toast.text}
        </div>
      )}
      <main className="player">
        <div className="player-grid">
          <div className="player-card-col">
            <PlayableCard card={card} marked={marked} status={status} onToggle={toggle} />
            <p className="hint center">👆 Tap a square when its number is called. Tap again to undo.</p>
          </div>

          <aside className="player-side">
            <div className="code-block">
              <span className="code-label">Your card</span>
              <input
                className="code-edit"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                onBlur={commitCode}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                spellCheck={false}
                aria-label="Card code (edit to switch cards)"
              />
              <span className="code-hint">📣 Shout this code to claim a win</span>
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
              <button className="ghost" onClick={clearMarks}>
                🧹 Clear marks
              </button>
              <button className="ghost" onClick={() => go('card', randomCardCode())}>
                🎲 Random card
              </button>
            </div>

            <div className="share-block">
              <Qr text={hrefFor('card', code)} />
              <button className="ghost" onClick={share}>
                {copied ? '✅ Link copied!' : '🔗 Copy link to this card'}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
