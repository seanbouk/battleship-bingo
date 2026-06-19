import { useEffect } from 'react'
import { useRoute, go } from './lib/route'
import { randomCardCode } from './lib/seed'
import HomeView from './views/HomeView'
import PlayerView from './views/PlayerView'
import CallerView from './views/CallerView'

export default function App() {
  const route = useRoute()

  // "Play" with no specific card = grab a fresh one, then settle on its ?card URL
  // so it's bookmarkable/shareable.
  useEffect(() => {
    if (route.view === 'play') go('card', randomCardCode(), true)
  }, [route.view])

  switch (route.view) {
    case 'call':
      return <CallerView />
    case 'card':
      return <PlayerView key={route.card} code={route.card!} />
    case 'play':
      return null // redirecting to a fresh card
    default:
      return <HomeView />
  }
}
