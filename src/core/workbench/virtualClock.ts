import type { VirtualClock } from './contracts'

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`)
  }
}

export function createVirtualClock(startMs = 0): VirtualClock {
  assertFinite(startMs, 'startMs')
  let currentMs = startMs

  return {
    now: () => currentMs,
    advance: (deltaMs) => {
      assertFinite(deltaMs, 'deltaMs')
      if (deltaMs < 0) {
        throw new Error('deltaMs must be non-negative')
      }
      const nextMs = currentMs + deltaMs
      if (!Number.isFinite(nextMs)) {
        throw new Error('virtual clock overflow')
      }
      currentMs = nextMs
      return currentMs
    },
    set: (nowMs) => {
      assertFinite(nowMs, 'nowMs')
      currentMs = nowMs
      return currentMs
    },
  }
}
