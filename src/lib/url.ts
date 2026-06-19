// Every shareable link/QR is built HERE, from wherever the app is actually
// running — never from a hardcoded or build-time URL. This is what guarantees
// links keep working if the GitHub Pages path changes, a custom domain is added,
// or the app is opened from localhost during testing.

/** The base href the app is currently served from, e.g. "https://x.github.io/battleship-bingo/". */
export function appBaseUrl(): string {
  const { origin, pathname } = window.location
  // Strip any file (e.g. index.html) or query/hash; keep the directory.
  const dir = pathname.replace(/[^/]*$/, '')
  return origin + dir
}

/** A link that opens a specific card by its code (Phase 2 will consume ?card=). */
export function cardLink(code: string): string {
  const base = appBaseUrl()
  return `${base}?card=${encodeURIComponent(code)}`
}
