import { ReactNode } from 'react'
import { useSettings, Style, Mode } from '../settings/SettingsContext'
import { go } from '../lib/route'

// Shared chrome for every view: the title (always links home), an optional
// middle slot (e.g. the generator's controls on home), and the site-wide
// Sonar/Recon + Day/Night toggles which drive the cards everywhere.
export default function TopBar({ middle }: { middle?: ReactNode }) {
  const { style, mode, setStyle, setMode } = useSettings()
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => go('home')} title="Home">
          ⚓ BATTLESHIP BINGO
        </button>

        <div className="topbar-mid">{middle}</div>

        <div className="spacer" />

        <div className="seg-group">
          <div className="seg" role="group" aria-label="Card style">
            {(['sonar', 'recon'] as Style[]).map((s) => (
              <button key={s} aria-pressed={style === s} onClick={() => setStyle(s)}>
                {s === 'sonar' ? 'Sonar' : 'Recon'}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Day or night">
            {(['day', 'night'] as Mode[]).map((m) => (
              <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {m === 'day' ? 'Day' : 'Night'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
