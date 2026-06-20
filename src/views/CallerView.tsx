import { useEffect, useMemo, useRef, useState } from 'react'
import TopBar from '../components/TopBar'
import TrackedCardRow from '../components/TrackedCardRow'
import { generateCard } from '../engine/card'
import { evaluateCard } from '../engine/win'
import { cardCodeFor, makeRng } from '../engine/rng'
import { DEFAULT_POOL } from '../engine/fleet'
import { PRIZES, defaultPrizes, prizeAchievedAt, PrizeConfig, Winner } from '../engine/prizes'
import { randomSeed, normalizeCode } from '../lib/seed'

interface TrackedCard {
  code: string
  name: string
  source: 'issued' | 'checked'
}
interface Game {
  drawSeed: string
  drawCount: number
  packSeed: string
  issued: number
  cards: TrackedCard[]
  prizes: PrizeConfig
  startedAt: number
}
interface Archived {
  game: Game
  endedAt: number
}
interface AlertHit {
  x: number
  w: number
}

const GAME_KEY = 'bb.game'
const GAMES_KEY = 'bb.games'

function freshGame(): Game {
  return {
    drawSeed: randomSeed(),
    drawCount: 0,
    packSeed: randomSeed(),
    issued: 0,
    cards: [],
    prizes: defaultPrizes(),
    startedAt: Date.now(),
  }
}

function loadGame(): Game {
  try {
    const raw = localStorage.getItem(GAME_KEY)
    if (raw) {
      const g = JSON.parse(raw)
      if (typeof g.drawSeed === 'string' && typeof g.drawCount === 'number') {
        // merge prize defaults so every prize id exists even for older saves
        return { ...freshGame(), ...g, cards: g.cards ?? [], prizes: { ...defaultPrizes(), ...(g.prizes ?? {}) } }
      }
    }
  } catch {
    /* ignore */
  }
  return freshGame()
}

function loadGames(): Archived[] {
  try {
    const raw = localStorage.getItem(GAMES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function CallerView() {
  const [game, setGame] = useState<Game>(loadGame)
  const [games, setGames] = useState<Archived[]>(loadGames)
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const [verifyInput, setVerifyInput] = useState('')
  const [flash, setFlash] = useState<{ code: string; n: number } | null>(null)
  const [alerts, setAlerts] = useState<{ up: AlertHit | null; down: AlertHit | null }>({ up: null, down: null })
  const upTarget = useRef<HTMLElement | null>(null)
  const downTarget = useRef<HTMLElement | null>(null)

  useEffect(() => {
    localStorage.setItem(GAME_KEY, JSON.stringify(game))
  }, [game])
  useEffect(() => {
    localStorage.setItem(GAMES_KEY, JSON.stringify(games))
  }, [games])

  // Deterministic draw order seeded per game: undo then call always yields the
  // same number, since calling just walks a fixed shuffled sequence.
  const order = useMemo(
    () => makeRng(`draw|${game.drawSeed}`).shuffle(Array.from({ length: DEFAULT_POOL }, (_, i) => i + 1)),
    [game.drawSeed],
  )
  const called = order.slice(0, game.drawCount)
  const calledSet = useMemo(() => new Set(called), [game.drawSeed, game.drawCount])
  const last = called[called.length - 1]

  // position of each called number in the draw order (1-based), for ranking prizes
  const callPos = useMemo(() => {
    const m = new Map<number, number>()
    called.forEach((n, i) => m.set(n, i + 1))
    return m
  }, [game.drawSeed, game.drawCount])

  // Auto-standings: for each prize, the tracked card(s) that completed it earliest
  // (ties share). Computed from the fixed draw order, so it's exact — no manual
  // award needed. Only knows tracked cards (issued or checked-in), which is the
  // honest limit; a shouted code becomes tracked and joins the ranking.
  const standings = useMemo(() => {
    const out: Record<string, Winner[]> = {}
    for (const p of PRIZES) {
      let best = Infinity
      let winners: Winner[] = []
      for (const c of game.cards) {
        const at = prizeAchievedAt(p.id, generateCard(c.code), callPos)
        if (at === Infinity) continue
        if (at < best) {
          best = at
          winners = [{ code: c.code, name: c.name, atCall: at }]
        } else if (at === best) {
          winners.push({ code: c.code, name: c.name, atCall: at })
        }
      }
      out[p.id] = winners
    }
    return out
  }, [game.cards, callPos])

  function callNext() {
    setGame((g) => ({ ...g, drawCount: Math.min(DEFAULT_POOL, g.drawCount + 1) }))
  }
  function undo() {
    setGame((g) => ({ ...g, drawCount: Math.max(0, g.drawCount - 1) }))
  }
  // Only worth saving a game that actually got going.
  const worthSaving = (g: Game) => g.drawCount > 0 || g.cards.length > 0

  function newGame() {
    if (!confirm('Start a new game? The current game is saved under Previous games.')) return
    setGames((prev) => (worthSaving(game) ? [{ game, endedAt: Date.now() }, ...prev] : prev).slice(0, 20))
    setGame(freshGame())
    setLastAdded(null)
  }
  function restore(a: Archived) {
    setGames((prev) => {
      const rest = prev.filter((x) => x !== a)
      return (worthSaving(game) ? [{ game, endedAt: Date.now() }, ...rest] : rest).slice(0, 20)
    })
    setGame(a.game)
  }

  function addCard(rawCode: string, source: 'issued' | 'checked') {
    const code = normalizeCode(rawCode)
    if (code.length < 4) return
    setGame((g) =>
      g.cards.some((c) => c.code === code)
        ? g
        : { ...g, cards: [{ code, name: '', source }, ...g.cards] },
    )
    setLastAdded(code)
  }
  function issueCard() {
    addCard(cardCodeFor(game.packSeed, game.issued), 'issued')
    setGame((g) => ({ ...g, issued: g.issued + 1 }))
  }
  function checkCard() {
    addCard(verifyInput, 'checked')
    setVerifyInput('')
  }
  function removeCard(code: string) {
    setGame((g) => ({ ...g, cards: g.cards.filter((c) => c.code !== code) }))
  }
  function renameCard(code: string, name: string) {
    setGame((g) => ({ ...g, cards: g.cards.map((c) => (c.code === code ? { ...c, name } : c)) }))
  }

  // Clicking a prize-winner chip scrolls to that tracked card and flashes it.
  function revealCard(code: string) {
    setFlash((f) => ({ code, n: (f && f.code === code ? f.n : 0) + 1 }))
  }

  // --- prizes --- (winners are computed in `standings`; only in/out-of-play is stored)
  function togglePrize(prizeId: string) {
    setGame((g) => {
      const p = g.prizes[prizeId]
      if (!p) return g
      return { ...g, prizes: { ...g.prizes, [prizeId]: { enabled: !p.enabled } } }
    })
  }

  // FPS-style "you got hit from over there" cue: if a pulsing (just-sank) card is
  // off-screen, glow at the nearer screen edge (top and/or bottom) toward its
  // column. Both can show at once if cards above and below both just sank.
  useEffect(() => {
    function check() {
      const els = Array.from(document.querySelectorAll('.tracked.sank')) as HTMLElement[]
      const margin = 48
      let down: AlertHit | null = null
      let up: AlertHit | null = null
      let downBestTop = Infinity
      let upBestBottom = -Infinity
      downTarget.current = null
      upTarget.current = null
      for (const el of els) {
        const r = el.getBoundingClientRect()
        const hit = { x: r.left + r.width / 2, w: r.width * 1.15 }
        if (r.top > window.innerHeight - margin) {
          // fully below the fold — keep the nearest (smallest top)
          if (r.top < downBestTop) {
            downBestTop = r.top
            down = hit
            downTarget.current = el
          }
        } else if (r.bottom < margin) {
          // fully above the fold — keep the nearest (largest bottom)
          if (r.bottom > upBestBottom) {
            upBestBottom = r.bottom
            up = hit
            upTarget.current = el
          }
        }
      }
      setAlerts({ up, down })
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [game.drawCount, game.cards.length])

  return (
    <>
      <TopBar />
      <main className="caller">
        <section className="panel call-panel">
          <div className="call-now">
            <div className="call-big">{last ?? '—'}</div>
            <div className="call-meta">
              {game.drawCount} of {DEFAULT_POOL} called
              <div className="recent">
                {called.slice(-6, -1).reverse().map((n, i) => (
                  <span key={`${n}-${i}`}>{n}</span>
                ))}
              </div>
            </div>
            <div className="call-buttons">
              <button className="action big" onPointerDown={callNext} disabled={game.drawCount >= DEFAULT_POOL}>
                📣 Call number
              </button>
              <button className="ghost" onPointerDown={undo} disabled={!game.drawCount}>
                ↩️ Undo
              </button>
              <button className="ghost" onPointerDown={newGame}>
                🆕 New game
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

        <section className="panel">
          <h2 className="section-h">Prizes</h2>
          <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
            Leaders are computed from issued &amp; checked-in cards. A shouted code joins the
            ranking once you check it in below.
          </p>
          <div className="prize-list">
            {PRIZES.map((p) => {
              const enabled = game.prizes[p.id]?.enabled
              const winners = enabled ? standings[p.id] : []
              return (
                <div key={p.id} className={`prize ${enabled ? '' : 'off'} ${winners.length ? 'won' : ''}`}>
                  <button
                    className="prize-toggle"
                    onPointerDown={() => togglePrize(p.id)}
                    title={enabled ? 'In play — tap to remove' : 'Not in play — tap to add'}
                    aria-pressed={enabled}
                  >
                    {enabled ? '☑' : '☐'}
                  </button>
                  <span className="prize-label">{p.label}</span>
                  <span className="prize-winners">
                    {!enabled ? (
                      <span className="prize-state">not in play</span>
                    ) : winners.length === 0 ? (
                      <span className="prize-state">open</span>
                    ) : (
                      winners.map((w) => (
                        <button
                          className="winner-chip"
                          key={w.code}
                          title={`Go to card ${w.code}`}
                          onPointerDown={() => revealCard(w.code)}
                        >
                          🏆 {w.name || w.code} <small>@{w.atCall}</small>
                        </button>
                      ))
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <h2 className="section-h">Tracked cards</h2>
          <div className="track-controls">
            <button className="action" onPointerDown={issueCard}>
              🎟️ Issue a card
            </button>
            <div className="track-add">
              <input
                placeholder="enter a shouted code"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkCard()}
                spellCheck={false}
              />
              <button className="ghost" onPointerDown={checkCard}>
                ➕ Check
              </button>
            </div>
          </div>

          {game.cards.length === 0 ? (
            <p className="hint">Issue a card to hand out, or enter a code a player shouts to check their claim.</p>
          ) : (
            <div className="tracked-list">
              {game.cards.map((c) => {
                const card = generateCard(c.code)
                const marked = new Set(card.numbers.filter((n) => calledSet.has(n)))
                const status = evaluateCard(card, calledSet)
                // a ship that the most recent call just completed → highlight it
                const sankShip =
                  last != null
                    ? card.ships.find(
                        (s) => s.cells.some((x) => x.n === last) && s.cells.every((x) => calledSet.has(x.n)),
                      )
                    : undefined
                return (
                  <TrackedCardRow
                    key={c.code}
                    code={c.code}
                    name={c.name}
                    source={c.source}
                    isNew={c.code === lastAdded}
                    justSank={sankShip ? sankShip.type.short : null}
                    flashSignal={flash && flash.code === c.code ? flash.n : 0}
                    card={card}
                    marked={marked}
                    status={status}
                    onRename={(name) => renameCard(c.code, name)}
                    onRemove={() => removeCard(c.code)}
                  />
                )
              })}
            </div>
          )}
        </section>

        {games.length > 0 && (
          <section className="panel">
            <h2 className="section-h">Previous games</h2>
            <div className="games-list">
              {games.map((a, i) => (
                <div className="game-row" key={`${a.endedAt}-${i}`}>
                  <span>{new Date(a.endedAt).toLocaleString()}</span>
                  <span className="grow">
                    {a.game.drawCount} called · {a.game.cards.length} cards
                  </span>
                  <button className="ghost" onPointerDown={() => restore(a)}>
                    ♻️ Restore
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {alerts.up && (
        <div
          className="edge-alert up"
          style={{ left: alerts.up.x, width: alerts.up.w }}
          onPointerDown={() => upTarget.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        />
      )}
      {alerts.down && (
        <div
          className="edge-alert down"
          style={{ left: alerts.down.x, width: alerts.down.w }}
          onPointerDown={() => downTarget.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        />
      )}
    </>
  )
}
