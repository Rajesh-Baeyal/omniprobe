import type { SeededRandom } from './contracts'

function hashSeed(seed: string | number): number {
  const text = String(seed)
  let hash = 2166136261

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function createSeededRandom(seed: string | number): SeededRandom {
  let state = hashSeed(seed)

  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    nextInt: (maxExclusive) => {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error('maxExclusive must be a positive integer')
      }
      return Math.floor(next() * maxExclusive)
    },
    pick: <T>(values: readonly T[]): T => {
      if (values.length === 0) {
        throw new Error('values must not be empty')
      }
      return values[Math.floor(next() * values.length)]
    },
  }
}
