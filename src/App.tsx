import TopBar from './components/TopBar'
import Generator from './components/Generator'

export default function App() {
  return (
    <>
      <TopBar />
      <main>
        <Generator />
        <p className="hint" style={{ marginTop: 32 }}>
          Ship icons will use{' '}
          <a href="https://game-icons.net" target="_blank" rel="noreferrer">
            game-icons.net
          </a>{' '}
          (CC BY 3.0) in the illustrated Recon style. Win order: <strong>first ship</strong> →{' '}
          <strong>first of each type</strong> → <strong>all clear</strong>.
        </p>
      </main>
    </>
  )
}
