import { useSettings, Style, Mode } from '../settings/SettingsContext'

export default function TopBar() {
  const { style, mode, setStyle, setMode } = useSettings()
  return (
    <header className="topbar">
      <h1>⚓ BATTLESHIP BINGO</h1>
      <div className="spacer" />

      <div>
        <span className="seg-label">Style</span>
        <div className="seg" role="group" aria-label="Card style">
          {(['sonar', 'recon'] as Style[]).map((s) => (
            <button key={s} aria-pressed={style === s} onClick={() => setStyle(s)}>
              {s === 'sonar' ? 'Sonar' : 'Recon'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="seg-label">Mode</span>
        <div className="seg" role="group" aria-label="Day or night">
          {(['day', 'night'] as Mode[]).map((m) => (
            <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m === 'day' ? 'Day' : 'Night'}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
