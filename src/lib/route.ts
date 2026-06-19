import { useEffect, useState } from 'react'
import { appBaseUrl } from './url'
import { normalizeCode } from './seed'

export type View = 'home' | 'play' | 'call' | 'card'

export interface Route {
  view: View
  card?: string
}

function parse(): Route {
  const p = new URLSearchParams(window.location.search)
  const card = p.get('card')
  if (card) return { view: 'card', card: normalizeCode(card) }
  const v = p.get('v')
  if (v === 'play') return { view: 'play' }
  if (v === 'call') return { view: 'call' }
  return { view: 'home' }
}

// Build the query string for a route (no leading host) — used for both internal
// navigation and, via hrefFor, shareable absolute links.
function queryFor(view: View, card?: string): string {
  if (view === 'card' && card) return `?card=${encodeURIComponent(card)}`
  if (view === 'play') return '?v=play'
  if (view === 'call') return '?v=call'
  return ''
}

const NAV_EVENT = 'bb:navigate'

/** Internal navigation: updates the URL relative to wherever we're hosted. */
export function go(view: View, card?: string, replace = false): void {
  const url = `${window.location.pathname}${queryFor(view, card)}`
  if (replace) window.history.replaceState({}, '', url)
  else window.history.pushState({}, '', url)
  window.dispatchEvent(new Event(NAV_EVENT))
}

/** Absolute, shareable URL for a route — always derived from the live location. */
export function hrefFor(view: View, card?: string): string {
  return appBaseUrl() + queryFor(view, card)
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse())
  useEffect(() => {
    const update = () => setRoute(parse())
    window.addEventListener('popstate', update)
    window.addEventListener(NAV_EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAV_EVENT, update)
    }
  }, [])
  return route
}
