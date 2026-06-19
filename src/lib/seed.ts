// A short, friendly pack seed. App runtime (browser), so Math.random is fine.
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
