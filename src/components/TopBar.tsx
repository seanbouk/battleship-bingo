import { ReactNode, useState } from 'react'
import { useSettings, Style, Mode } from '../settings/SettingsContext'
import { go, hrefFor, useRoute } from '../lib/route'
import Qr from './Qr'
import CopyButton from './CopyButton'

// Shared chrome for every view: a breadcrumb title (always links home), an
// optional middle slot (the generator's controls on home), a Play Link button,
// and the site-wide Sonar/Recon + Day/Night toggles which drive the cards.
export default function TopBar({ middle }: { middle?: ReactNode }) {
  const { style, mode, setStyle, setMode } = useSettings()
  const route = useRoute()
  const [showLink, setShowLink] = useState(false)
  const crumb =
    route.view === 'call' ? 'Caller' : route.view === 'card' || route.view === 'play' ? 'Play' : null
  const playLink = hrefFor('play')

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-wrap">
          <button className="brand" onPointerDown={() => go('home')} title="Home">
            <span className="brand-full">⚓ BATTLESHIP BINGO</span>
            <span className="brand-short">⚓ BINGO</span>
          </button>
          {crumb && <span className="crumb">›&nbsp;{crumb}</span>}
        </div>

        <div className="topbar-mid">{middle}</div>

        <div className="spacer" />

        {route.view !== 'home' && (
          <button className="ghost playlink" onPointerDown={() => setShowLink(true)}>
            🔗 Play Link
          </button>
        )}

        <div className="seg-group">
          {/* desktop: full radio groups */}
          <div className="seg" role="group" aria-label="Card style">
            {(['sonar', 'recon'] as Style[]).map((s) => (
              <button key={s} aria-pressed={style === s} onPointerDown={() => setStyle(s)}>
                {s === 'sonar' ? 'Sonar' : 'Recon'}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Day or night">
            {(['day', 'night'] as Mode[]).map((m) => (
              <button key={m} aria-pressed={mode === m} onPointerDown={() => setMode(m)}>
                {m === 'day' ? 'Day' : 'Night'}
              </button>
            ))}
          </div>

          {/* mobile: compact bistable toggles showing only the current value */}
          <button
            className="toggle"
            data-on={style === 'recon'}
            onPointerDown={() => setStyle(style === 'sonar' ? 'recon' : 'sonar')}
            aria-label={`Style: ${style === 'sonar' ? 'Sonar' : 'Recon'} (tap to switch)`}
          >
            <span className="toggle-label">{style === 'sonar' ? 'Sonar' : 'Recon'}</span>
            <span className="toggle-track"><span className="toggle-knob" /></span>
          </button>
          <button
            className="toggle"
            data-on={mode === 'night'}
            onPointerDown={() => setMode(mode === 'day' ? 'night' : 'day')}
            aria-label={`Mode: ${mode === 'day' ? 'Day' : 'Night'} (tap to switch)`}
          >
            <span className="toggle-label">{mode === 'day' ? 'Day' : 'Night'}</span>
            <span className="toggle-track"><span className="toggle-knob" /></span>
          </button>
        </div>
      </div>

      {showLink && (
        <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && setShowLink(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-label="Play link">
            <h2>Play link</h2>
            <p className="dialog-sub">
              Share this link or QR. Everyone who opens it is taken to a <strong>fresh, random card</strong> —
              a different one each time.
            </p>
            <div className="share-block">
              <Qr text={playLink} />
              <code className="link">{playLink}</code>
              <CopyButton text={playLink} />
            </div>
            <div className="dialog-actions">
              <button className="action" onPointerDown={() => setShowLink(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
