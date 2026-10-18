import { describe, expect, it } from 'vitest'
import type { NormalizedEvent, WorkbenchSession } from '../core/workbench/contracts'
import { redactSensitiveFields } from '../core/traces/redaction'
import {
  appendTraceEvent,
  createTrace,
  exportTraceJson,
  finalizeTrace,
  importTraceJson,
} from '../core/traces/traceModel'
import { createReplayController } from '../core/traces/traceReplay'
import { createVirtualClock } from '../core/workbench/virtualClock'

const session: WorkbenchSession = {
  id: 'session-1',
  executionMode: 'SIMULATED',
  transport: 'fixture',
  authority: 'READ_ONLY',
  source: { id: 'fixture-1', label: 'Synthetic fixture', fixtureHash: 'fixture-hash' },
  capabilities: ['trace.read'],
  contractVersion: 'workbench.v1',
  clock: { kind: 'virtual', nowMs: 0, speed: 1 },
  limits: { maxMessageBytes: 1024, maxRateHz: 10, queuePolicy: 'stop' },
}

function event(eventId: string, sequence: number, virtualTimeMs: number): NormalizedEvent {
  return {
    eventId,
    sequence,
    virtualTimeMs,
    source: { sessionId: session.id, assetId: 'asset-1', moduleId: 'fixture' },
    kind: 'frame',
    direction: 'RX',
    protocol: 'fixture',
    raw: { encoding: 'hex', data: '010203' },
    decoded: { register: 7 },
    semantic: { state: 'ready' },
    quality: 'simulated',
    provenance: { modelVersion: 'fixture.v1', fixtureHash: 'fixture-hash', seed: 'seed-1', sourceRefs: ['spec:test'] },
  }
}

function makeTrace() {
  const trace = createTrace({
    traceId: 'trace-1',
    session,
    seed: 'seed-1',
    faultProfile: { dropEvery: 0, jitterMs: 0 },
    recipeRevisionId: 'recipe-r1',
    calibrationIds: ['calibration-1'],
    modelVersions: ['fixture.v1'],
    learnerActions: [{ actionId: 'action-1', type: 'hypothesis', virtualTimeMs: 0, data: { text: 'ready?' } }],
  })

  appendTraceEvent(trace, event('event-1', 1, 10))
  appendTraceEvent(trace, event('event-2', 2, 20))
  return finalizeTrace(trace)
}

describe('deterministic trace model', () => {
  it('hashes canonically, preserves lineage, and round-trips through JSON', () => {
    const first = makeTrace()
    const reordered = createTrace({
      traceId: 'trace-1',
      session,
      seed: 'seed-1',
      faultProfile: { jitterMs: 0, dropEvery: 0 },
      recipeRevisionId: 'recipe-r1',
      calibrationIds: ['calibration-1'],
      modelVersions: ['fixture.v1'],
      learnerActions: [{ actionId: 'action-1', type: 'hypothesis', virtualTimeMs: 0, data: { text: 'ready?' } }],
    })
    appendTraceEvent(reordered, event('event-1', 1, 10))
    appendTraceEvent(reordered, event('event-2', 2, 20))
    const second = finalizeTrace(reordered)

    expect(second.contentHash).toBe(first.contentHash)
    expect(first.executionMode).toBe('SIMULATED')
    expect(first.authority).toBe('READ_ONLY')
    expect(first.seed).toBe('seed-1')
    expect(first.recipeRevisionId).toBe('recipe-r1')
    expect(first.calibrationIds).toEqual(['calibration-1'])
    expect(first.events[0]).toMatchObject({ raw: { data: '010203' }, decoded: { register: 7 }, semantic: { state: 'ready' } })
    expect(first.learnerActions[0].type).toBe('hypothesis')

    const imported = importTraceJson(exportTraceJson(first))
    expect(imported).toEqual(first)
    expect(exportTraceJson(imported)).toBe(exportTraceJson(first))
  })

  it('redacts sensitive trace data before export', () => {
    const trace = createTrace({ traceId: 'secret-trace', session, seed: 'seed-1', faultProfile: {} })
    appendTraceEvent(trace, {
      ...event('secret-event', 1, 10),
      decoded: { apiToken: 'do-not-export', value: 42 },
    })

    const exported = exportTraceJson(finalizeTrace(trace))
    expect(exported).not.toContain('do-not-export')
    expect(importTraceJson(exported).events[0].decoded).toEqual({ apiToken: '[REDACTED]', value: 42 })
  })
})

describe('trace replay controller', () => {
  it('supports pause, step, seek, speed, and deterministic branching', () => {
    const trace = makeTrace()
    const clock = createVirtualClock()
    const replay = createReplayController(trace, { clock, startPaused: true })

    expect(replay.isPaused()).toBe(true)
    expect(replay.position()).toBe(0)
    expect(replay.step()).toEqual([trace.events[0]])
    expect(replay.position()).toBe(1)
    expect(replay.currentEvent()).toEqual(trace.events[0])
    expect(clock.now()).toBe(10)

    replay.setSpeed(2)
    expect(replay.speed()).toBe(2)
    replay.play()
    expect(replay.isPaused()).toBe(false)
    replay.pause()
    expect(replay.isPaused()).toBe(true)

    replay.seek({ timeMs: 15 })
    expect(replay.position()).toBe(1)
    expect(replay.currentEvent()?.eventId).toBe('event-1')
    expect(clock.now()).toBe(10)

    const branch = replay.branch()
    expect(branch.trace.parentTraceId).toBe(trace.traceId)
    expect(branch.trace.events).toEqual([trace.events[0]])
    branch.step()
    expect(branch.currentEvent()?.eventId).toBe('event-1')
  })
})

describe('sensitive field redaction', () => {
  it('redacts nested credential, token, authorization, and private-key-like values', () => {
    const redacted = redactSensitiveFields({
      apiToken: 'token-value',
      nested: { password: 'password-value', authorization: 'Bearer abc' },
      keyMaterial: '-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----',
      safe: 'visible',
      list: [{ clientSecret: 'secret-value' }],
    })

    expect(redacted).toEqual({
      apiToken: '[REDACTED]',
      nested: { password: '[REDACTED]', authorization: '[REDACTED]' },
      keyMaterial: '[REDACTED]',
      safe: 'visible',
      list: [{ clientSecret: '[REDACTED]' }],
    })
  })
})
