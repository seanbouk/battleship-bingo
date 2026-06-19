import { useMemo } from 'react'
import { Card } from '../engine/card'
import { CardStatus } from '../engine/win'
import { cardToSvg, cardLayout } from '../render/cardSvg'
import { useSettings } from '../settings/SettingsContext'

interface Props {
  card: Card
  /** numbers currently daubed/called */
  marked: Set<number>
  status: CardStatus
  onToggle?: (n: number) => void
  readOnly?: boolean
}

const CELL = 46

// The card art is the exact same SVG used everywhere (one source of truth); a
// second SVG with the same viewBox sits on top for daubs + click targets, so it
// stays aligned at any size.
export default function PlayableCard({ card, marked, status, onToggle, readOnly }: Props) {
  const { style, mode } = useSettings()
  const svg = useMemo(() => cardToSvg(card, { style, mode, cell: CELL }), [card, style, mode])
  const layout = useMemo(() => cardLayout(card, CELL), [card])
  const sunkTypes = new Set(status.sunkTypes)

  return (
    <div className={`play-card ${readOnly ? 'readonly' : ''}`}>
      <div className="play-art" dangerouslySetInnerHTML={{ __html: svg }} />
      <svg className="play-overlay" viewBox={`0 0 ${layout.W} ${layout.H}`} aria-hidden={readOnly}>
        {layout.cells.map((cell) => {
          const isMarked = marked.has(cell.n)
          const sunk = isMarked && sunkTypes.has(cell.shipId)
          return (
            <g
              key={`${cell.r},${cell.c}`}
              className={readOnly ? undefined : 'hot'}
              onPointerDown={readOnly ? undefined : () => onToggle?.(cell.n)}
            >
              {isMarked && (
                <circle
                  cx={cell.cx}
                  cy={cell.cy}
                  r={cell.rr}
                  className={sunk ? 'daub daub-sunk' : 'daub'}
                />
              )}
              {!readOnly && <circle cx={cell.cx} cy={cell.cy} r={cell.rr} fill="transparent" />}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
