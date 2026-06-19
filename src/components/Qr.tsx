import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Renders a QR as inline SVG (crisp at any size, no canvas, no network).
export default function Qr({ text, className }: { text: string; className?: string }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
      .then((s) => live && setSvg(s))
      .catch(() => live && setSvg(''))
    return () => {
      live = false
    }
  }, [text])
  return <div className={`qr ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: svg }} />
}
