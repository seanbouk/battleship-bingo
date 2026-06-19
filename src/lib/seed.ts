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

/**
 * Codes seed the card generator directly, so they must be normalised. Codes get
 * read aloud, so fold the easily-confused characters the way Crockford base32
 * does (O→0, I/L→1) and drop spaces/hyphens. Generated codes never contain
 * O/I/L/U, so this only ever repairs mishearings — it can't corrupt a good code.
 */
export function normalizeCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V')
}
