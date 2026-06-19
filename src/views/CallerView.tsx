import { useEffect, useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import TrackedCardRow from '../components/TrackedCardRow'
import Qr from '../components/Qr'
import CopyButton from '../components/CopyButton'
import { generateCard } from '../engine/card'
import { evaluateCard } from '../engine/win'
import { cardCodeFor, makeRng } from '../engine/rng'
import { DEFAULT_POOL } from '../engine/fleet'
import { hrefFor } from '../lib/route'
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
  startedAt: number
}
interface Archived {
  game: Game
  endedAt: number
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
    startedAt: Date.now(),
  }
}

function loadGame(): Game {
  try {
    const raw = localStorage.getItem(GAME_KEY)
    if (raw) {
      const g = JSON.parse(raw)
      if (typeof g.drawSeed === 'string' && typeof g.drawCount === 'number') {
        return { ...freshGame(), ...g, cards: g.cards ?? [] }
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
  const [showOpenTable, setShowOpenTable] = useState(false)

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
          <h2 className="section-h">Tracked cards</h2>
          <div className="track-controls">
            <button className="action" onPointerDown={issueCard}>
              🎟️ Issue a card
            </button>
            <button className="ghost" onPointerDown={() => setShowOpenTable(true)}>
              🔗 Get link
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

      {showOpenTable && (
        <div
          className="overlay"
          onPointerDown={(e) => e.target === e.currentTarget && setShowOpenTable(false)}
        >
          <div className="dialog" role="dialog" aria-modal="true" aria-label="Player link">
            <h2>Player link</h2>
            <p className="dialog-sub">Anyone who opens this gets a random card to play.</p>
            <div className="share-block">
              <Qr text={hrefFor('play')} />
              <code className="link">{hrefFor('play')}</code>
              <CopyButton text={hrefFor('play')} label="Copy player link" />
            </div>
            <div className="dialog-actions">
              <button className="action" onPointerDown={() => setShowOpenTable(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
