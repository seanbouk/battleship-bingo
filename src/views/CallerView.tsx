import { useEffect, useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import PlayableCard from '../components/PlayableCard'
import Qr from '../components/Qr'
import { generateCard } from '../engine/card'
import { evaluateCard } from '../engine/win'
import { cardCodeFor } from '../engine/rng'
import { DEFAULT_POOL } from '../engine/fleet'
import { hrefFor } from '../lib/route'
import { randomSeed, normalizeCode } from '../lib/seed'

interface Game {
  called: number[]
  packSeed: string
  issued: number
}

const KEY = 'bb.game'

function loadGame(): Game {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const g = JSON.parse(raw)
      if (Array.isArray(g.called) && typeof g.packSeed === 'string') {
        return { called: g.called, packSeed: g.packSeed, issued: g.issued ?? 0 }
      }
    }
  } catch {
    /* ignore */
  }
  return { called: [], packSeed: randomSeed(), issued: 0 }
}

export default function CallerView() {
  const [game, setGame] = useState<Game>(loadGame)
  const [verify, setVerify] = useState('')

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(game))
  }, [game])

  const calledSet = useMemo(() => new Set(game.called), [game.called])
  const last = game.called[game.called.length - 1]

  function callNext() {
    const remaining: number[] = []
    for (let n = 1; n <= DEFAULT_POOL; n++) if (!calledSet.has(n)) remaining.push(n)
    if (remaining.length === 0) return
    const n = remaining[Math.floor(Math.random() * remaining.length)]
    setGame((g) => ({ ...g, called: [...g.called, n] }))
  }
  function undo() {
    setGame((g) => ({ ...g, called: g.called.slice(0, -1) }))
  }
  function newGame() {
    if (!confirm('Start a new game? This clears the called numbers.')) return
    setGame({ called: [], packSeed: randomSeed(), issued: 0 })
  }
  function issueCard() {
    setGame((g) => ({ ...g, issued: g.issued + 1 }))
  }

  const lastIssuedCode = game.issued > 0 ? cardCodeFor(game.packSeed, game.issued - 1) : null

  // verification
  const verifyCode = normalizeCode(verify)
  const verifyCard = verifyCode.length >= 4 ? generateCard(verifyCode) : null
  const verifyStatus = verifyCard ? evaluateCard(verifyCard, calledSet) : null
  const verifyMarked = verifyCard
    ? new Set(verifyCard.numbers.filter((n) => calledSet.has(n)))
    : new Set<number>()

  return (
    <>
      <TopBar />
      <main className="caller">
        {/* --- caller board --- */}
        <section className="panel call-panel">
          <div className="call-now">
            <div className="call-big">{last ?? '—'}</div>
            <div className="call-meta">
              {game.called.length} of {DEFAULT_POOL} called
              <div className="recent">
                {game.called.slice(-6, -1).reverse().map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>
            <div className="call-buttons">
              <button className="action big" onClick={callNext} disabled={game.called.length >= DEFAULT_POOL}>
                Call number
              </button>
              <button className="ghost" onClick={undo} disabled={!game.called.length}>
                Undo
              </button>
              <button className="ghost" onClick={newGame}>
                New game
              </button>
            </div>
          </div>
          <div className="called-board">
            {Array.from({ length: DEFAULT_POOL }, (_, i) => i + 1).map((n) => (
              <span key={n} className={calledSet.has(n) ? (n === last ? 'on latest' : 'on') : ''}>
                {n}
              </span>
            ))}
          </div>
        </section>

        <div className="caller-cols">
          {/* --- hand out cards --- */}
          <section className="panel">
            <h2 className="section-h">Hand out cards</h2>
            <div className="handout">
              <div className="handout-half">
                <h3>Open table</h3>
                <p className="hint">Anyone scans and gets a random card.</p>
                <Qr text={hrefFor('play')} />
                <code className="link">{hrefFor('play')}</code>
              </div>
              <div className="handout-half">
                <h3>Issue a card</h3>
                <p className="hint">One specific card — e.g. after taking the entry fee.</p>
                {lastIssuedCode ? (
                  <>
                    <Qr text={hrefFor('card', lastIssuedCode)} />
                    <div className="issued-code">
                      {lastIssuedCode} <span>· card #{game.issued}</span>
                    </div>
                  </>
                ) : (
                  <p className="hint">No cards issued yet.</p>
                )}
                <button className="action" onClick={issueCard}>
                  Issue {lastIssuedCode ? 'next' : 'a'} card
                </button>
              </div>
            </div>
          </section>

          {/* --- verify a claim --- */}
          <section className="panel">
            <h2 className="section-h">Check a claim</h2>
            <p className="hint">Type the code the player shouts to see their card against the numbers called so far.</p>
            <input
              className="verify-input"
              placeholder="card code"
              value={verify}
              onChange={(e) => setVerify(e.target.value)}
              spellCheck={false}
            />
            {verifyCard && verifyStatus && (
              <div className="verify-result">
                <PlayableCard card={verifyCard} marked={verifyMarked} status={verifyStatus} readOnly />
                <div className="verify-summary">
                  {verifyStatus.allClear ? (
                    <span className="badge win">ALL CLEAR ✓</span>
                  ) : verifyStatus.firstShip ? (
                    <span className="badge win">
                      {verifyStatus.sunkCount}/{verifyStatus.totalShips} sunk
                    </span>
                  ) : (
                    <span className="badge">nothing sunk yet</span>
                  )}
                  <ul className="ship-status compact">
                    {verifyStatus.ships.map((s) => (
                      <li key={s.ship.type.id} className={s.sunk ? 'sunk' : ''}>
                        {s.ship.type.short} {s.sunk ? '✓' : `${s.hits}/${s.ship.cells.length}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
