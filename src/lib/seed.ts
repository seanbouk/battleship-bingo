import { encodeCode } from '../engine/rng'

// A short, friendly pack seed. App runtime (browser), so Math.random is fine.
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// A self-serve card code in the same Crockford-base32 alphabet the packs use,
// so it reads cleanly and is unambiguous when shouted across a room.
export function randomCardCode(): string {
  return encodeCode(Math.floor(Math.random() * 0xffffffff))
}

/** Codes seed the card generator directly, so they must be normalised (upper). */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}
