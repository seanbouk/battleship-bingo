import { useState } from 'react'

export default function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(text).then(
      () => {
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      },
      () => {},
    )
  }
  return (
    <button className="ghost" onPointerDown={copy}>
      {done ? '✅ Copied!' : `📋 ${label}`}
    </button>
  )
}
