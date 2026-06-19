// Deterministic, seedable PRNG so a card is a pure function of its code.
// xmur3 hashes a string seed to a 32-bit integer; mulberry32 turns that into a
// fast, decent-quality stream of floats in [0, 1). Same seed in -> same card out,
// on any machine, forever. This is what lets a card's short code double as the
// verification token in the interactive (Phase 2) caller.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Rng {
  /** float in [0, 1) */
  next(): number
  /** integer in [0, max) */
  int(max: number): number
  /** in-place Fisher-Yates shuffle */
  shuffle<T>(arr: T[]): T[]
  /** pick `n` distinct integers from [1, pool] */
  sample(pool: number, n: number): number[]
}

export function makeRng(seed: string): Rng {
  const next = mulberry32(xmur3(seed)())
  const int = (max: number) => Math.floor(next() * max)
  return {
    next,
    int,
    shuffle<T>(arr: T[]): T[] {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = int(i + 1)
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    },
    sample(pool: number, n: number): number[] {
      const all = Array.from({ length: pool }, (_, i) => i + 1)
      // partial Fisher-Yates: only need the first n
      for (let i = 0; i < n; i++) {
        const j = i + int(pool - i)
        ;[all[i], all[j]] = [all[j], all[i]]
      }
      return all.slice(0, n)
    },
  }
}

// --- Crockford base32 codes (no I, L, O, U -> no ambiguous chars when read aloud) ---
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function encodeCode(num: number, length = 6): string {
  let n = num >>> 0
  let out = ''
  for (let i = 0; i < length; i++) {
    out = ALPHABET[n % 32] + out
    n = Math.floor(n / 32)
  }
  return out
}

export function decodeCode(code: string): number {
  let n = 0
  for (const ch of code.toUpperCase()) {
    const idx = ALPHABET.indexOf(ch)
    if (idx >= 0) n = n * 32 + idx
  }
  return n >>> 0
}

/** A short, human-readable code derived from a pack seed and card index. */
export function cardCodeFor(packSeed: string, index: number): string {
  const h = mulberry32(xmur3(`${packSeed}#${index}`)())
  return encodeCode(Math.floor(h() * 0xffffffff))
}
