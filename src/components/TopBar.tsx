import { useSettings, Style, Mode } from '../settings/SettingsContext'

interface Props {
  seed: string
  onSeed: (s: string) => void
  onRandomSeed: () => void
  onDownload: () => void
}

export default function TopBar({ seed, onSeed, onRandomSeed, onDownload }: Props) {
  const { style, mode, setStyle, setMode } = useSettings()
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <h1>⚓ BATTLESHIP BINGO</h1>

        {/* middle group — sits in the content column, left of the toggles */}
        <div className="topbar-mid">
          <div className="seed-field">
            <span className="seed-tag">Pack</span>
            <input
              aria-label="Pack seed"
              value={seed}
              onChange={(e) => onSeed(e.target.value.toUpperCase())}
              spellCheck={false}
            />
            <button className="icon-btn" title="New random pack" onClick={onRandomSeed}>
              🎲
            </button>
          </div>
          <button className="action" onClick={onDownload}>
            Download PDF
          </button>
        </div>

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
