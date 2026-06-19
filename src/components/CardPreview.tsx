import { useMemo } from 'react'
import { Card } from '../engine/card'
import { cardToSvg } from '../render/cardSvg'
import { useSettings } from '../settings/SettingsContext'

export default function CardPreview({ card }: { card: Card }) {
  const { style, mode } = useSettings()
  const svg = useMemo(() => cardToSvg(card, { style, mode, cell: 38 }), [card, style, mode])
  return <div className="card-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
}
