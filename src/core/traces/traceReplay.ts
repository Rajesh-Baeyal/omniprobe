import type { NormalizedEvent, VirtualClock } from '../workbench/contracts'
import { createVirtualClock } from '../workbench/virtualClock'
import { finalizeTrace, type TraceRecord } from './traceModel'

export type ReplaySeekTarget = { index: number } | { timeMs: number }

export interface ReplayControllerOptions {
  clock?: VirtualClock
  startPaused?: boolean
  speed?: number
}

export interface ReplayController {
  readonly trace: TraceRecord
  pause(): void
  play(): void
  resume(): void
  isPaused(): boolean
  step(count?: number): NormalizedEvent[]
  seek(target: number | ReplaySeekTarget): NormalizedEvent | undefined
  seekIndex(index: number): NormalizedEvent | undefined
  seekTime(timeMs: number): NormalizedEvent | undefined
  setSpeed(speed: number): number
  speed(): number
  position(): number
  currentIndex(): number
  currentEvent(): NormalizedEvent | undefined
  branch(traceId?: string): ReplayController
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`)
  }
}

function isVirtualClock(value: VirtualClock | ReplayControllerOptions | undefined): value is VirtualClock {
  return Boolean(value && typeof (value as VirtualClock).now === 'function' && typeof (value as VirtualClock).set === 'function')
}

export function createReplayController(
  trace: TraceRecord,
  optionsOrClock?: ReplayControllerOptions | VirtualClock,
): ReplayController {
  const options: ReplayControllerOptions = isVirtualClock(optionsOrClock)
    ? { clock: optionsOrClock }
    : optionsOrClock ?? {}
  const clock = options.clock ?? createVirtualClock()
  let paused = options.startPaused ?? true
  let speed = options.speed ?? 1
  let position = 0

  assertFinite(speed, 'speed')
  if (speed <= 0) {
    throw new Error('speed must be greater than zero')
  }

  const setPosition = (nextPosition: number): NormalizedEvent | undefined => {
    position = Math.max(0, Math.min(trace.events.length, nextPosition))
    const current = position > 0 ? trace.events[position - 1] : undefined
    if (current) {
      clock.set(current.virtualTimeMs)
    }
    return current
  }

  const seekIndex = (index: number): NormalizedEvent | undefined => {
    assertFinite(index, 'index')
    if (!Number.isInteger(index) || index < 0) {
      throw new Error('index must be a non-negative integer')
    }
    return setPosition(index + 1)
  }

  const seekTime = (timeMs: number): NormalizedEvent | undefined => {
    assertFinite(timeMs, 'timeMs')
    let nextPosition = 0
    trace.events.forEach((event, index) => {
      if (event.virtualTimeMs <= timeMs) {
        nextPosition = index + 1
      }
    })
    return setPosition(nextPosition)
  }

  const controller: ReplayController = {
    trace,
    pause: () => {
      paused = true
    },
    play: () => {
      paused = false
    },
    resume: () => {
      paused = false
    },
    isPaused: () => paused,
    step: (count = 1) => {
      assertPositiveInteger(count, 'count')
      const stepped: NormalizedEvent[] = []
      for (let index = 0; index < count && position < trace.events.length; index += 1) {
        const current = trace.events[position]
        position += 1
        stepped.push(current)
        clock.set(current.virtualTimeMs)
      }
      paused = true
      return stepped
    },
    seek: (target) => {
      if (typeof target === 'number') {
        return seekTime(target)
      }
      if ('index' in target) {
        return seekIndex(target.index)
      }
      return seekTime(target.timeMs)
    },
    seekIndex,
    seekTime,
    setSpeed: (nextSpeed) => {
      assertFinite(nextSpeed, 'speed')
      if (nextSpeed <= 0) {
        throw new Error('speed must be greater than zero')
      }
      speed = nextSpeed
      return speed
    },
    speed: () => speed,
    position: () => position,
    currentIndex: () => position - 1,
    currentEvent: () => (position > 0 ? trace.events[position - 1] : undefined),
    branch: (traceId) => {
      const branchTrace = finalizeTrace({
        ...trace,
        traceId: traceId?.trim() || `${trace.traceId}:branch:${position}`,
        contentHash: '',
        events: trace.events.slice(0, position),
        learnerActions: trace.learnerActions.filter((action) => {
          const current = trace.events[position - 1]
          return Boolean(current && action.virtualTimeMs <= current.virtualTimeMs)
        }),
        parentTraceId: trace.traceId,
        ...(trace.events[position - 1] ? { branchPointEventId: trace.events[position - 1].eventId } : {}),
      })
      return createReplayController(branchTrace, {
        clock: createVirtualClock(clock.now()),
        startPaused: true,
        speed,
      })
    },
  }

  return controller
}
