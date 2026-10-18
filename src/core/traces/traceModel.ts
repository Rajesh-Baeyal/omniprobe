import type {
  Authority,
  ExecutionMode,
  JsonObject,
  JsonValue,
  NormalizedEvent,
  WorkbenchSession,
} from '../workbench/contracts'
import { redactSensitiveFields } from './redaction'

export const TRACE_SCHEMA_VERSION = 'trace.v1'

export interface LearnerAction {
  actionId: string
  type: string
  virtualTimeMs: number
  data?: JsonObject
}

export interface TraceRecord {
  traceId: string
  schemaVersion: string
  contentHash: string
  session: WorkbenchSession
  executionMode: ExecutionMode
  authority: Authority
  seed: string
  faultProfile: JsonObject
  recipeRevisionId?: string
  calibrationIds: string[]
  modelVersions: string[]
  events: NormalizedEvent[]
  learnerActions: LearnerAction[]
  expectedOutput?: JsonValue
  actualOutput?: JsonValue
  evidenceLinks: string[]
  parentTraceId?: string
  branchPointEventId?: string
}

export interface CreateTraceInput {
  traceId?: string
  schemaVersion?: string
  session: WorkbenchSession
  executionMode?: ExecutionMode
  authority?: Authority
  seed: string | number
  faultProfile?: JsonObject
  recipeRevisionId?: string
  calibrationIds?: string[]
  modelVersions?: string[]
  events?: NormalizedEvent[]
  learnerActions?: LearnerAction[]
  expectedOutput?: JsonValue
  actualOutput?: JsonValue
  evidenceLinks?: string[]
  parentTraceId?: string
  branchPointEventId?: string
}

function assertNonEmptyString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`)
  }
}

function assertFiniteNumber(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be finite`)
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function canonicalizeJson(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('canonical JSON cannot contain non-finite numbers')
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => canonicalizeJson(entry))
  }

  if (typeof value === 'object') {
    const output: JsonObject = {}
    Object.keys(value as Record<string, unknown>).sort().forEach((key) => {
      const entry = (value as Record<string, unknown>)[key]
      if (entry === undefined) {
        throw new Error(`canonical JSON cannot contain undefined at ${key}`)
      }
      output[key] = canonicalizeJson(entry)
    })
    return output
  }

  throw new Error(`canonical JSON cannot contain ${typeof value}`)
}

export function stableStringify(value: unknown): string {
  const canonical = canonicalizeJson(value)
  return JSON.stringify(canonical)
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount))
}

export function sha256Hex(value: string): string {
  const bytes = new TextEncoder().encode(value)
  const bitLength = bytes.length * 8
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64
  const padded = new Uint8Array(paddedLength)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000) >>> 0)
  view.setUint32(paddedLength - 4, bitLength >>> 0)

  const hash = [
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ]

  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = new Array<number>(64)
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4)
    }
    for (let index = 16; index < 64; index += 1) {
      const first = words[index - 15]
      const second = words[index - 2]
      const smallSigma0 = rotateRight(first, 7) ^ rotateRight(first, 18) ^ (first >>> 3)
      const smallSigma1 = rotateRight(second, 17) ^ rotateRight(second, 19) ^ (second >>> 10)
      words[index] = (words[index - 16] + smallSigma0 + words[index - 7] + smallSigma1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = hash
    for (let index = 0; index < 64; index += 1) {
      const bigSigma1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
      const choice = (e & f) ^ (~e & g)
      const temp1 = (h + bigSigma1 + choice + SHA256_K[index] + words[index]) >>> 0
      const bigSigma0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
      const majority = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (bigSigma0 + majority) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    hash[0] = (hash[0] + a) >>> 0
    hash[1] = (hash[1] + b) >>> 0
    hash[2] = (hash[2] + c) >>> 0
    hash[3] = (hash[3] + d) >>> 0
    hash[4] = (hash[4] + e) >>> 0
    hash[5] = (hash[5] + f) >>> 0
    hash[6] = (hash[6] + g) >>> 0
    hash[7] = (hash[7] + h) >>> 0
  }

  return hash.map((word) => word.toString(16).padStart(8, '0')).join('')
}

export function hashCanonicalJson(value: unknown): string {
  return sha256Hex(stableStringify(value))
}

function tracePayload(trace: TraceRecord): Omit<TraceRecord, 'contentHash'> {
  const { contentHash: _contentHash, ...payload } = trace
  return payload
}

function traceHash(trace: TraceRecord): string {
  return hashCanonicalJson(tracePayload(trace))
}

function validateTrace(trace: TraceRecord): void {
  assertNonEmptyString(trace.traceId, 'traceId')
  assertNonEmptyString(trace.schemaVersion, 'schemaVersion')
  assertNonEmptyString(trace.seed, 'seed')
  if (trace.schemaVersion !== TRACE_SCHEMA_VERSION) {
    throw new Error(`unsupported trace schema: ${trace.schemaVersion}`)
  }
  if (!trace.session || trace.executionMode !== trace.session.executionMode || trace.authority !== trace.session.authority) {
    throw new Error('trace execution metadata must match its session')
  }
  if (!Array.isArray(trace.events) || !Array.isArray(trace.learnerActions) || !Array.isArray(trace.calibrationIds)) {
    throw new Error('trace collections must be arrays')
  }
  trace.events.forEach((entry, index) => {
    if (!entry || entry.source.sessionId !== trace.session.id) {
      throw new Error(`event ${index} has a mismatched session id`)
    }
    assertNonEmptyString(entry.eventId, `events[${index}].eventId`)
    if (!Number.isInteger(entry.sequence) || entry.sequence < 0) {
      throw new Error(`events[${index}].sequence must be a non-negative integer`)
    }
    assertFiniteNumber(entry.virtualTimeMs, `events[${index}].virtualTimeMs`)
    if (index > 0) {
      const previous = trace.events[index - 1]
      if (entry.sequence <= previous.sequence || entry.virtualTimeMs < previous.virtualTimeMs) {
        throw new Error('trace events must have increasing sequence and virtual time')
      }
    }
  })
  trace.learnerActions.forEach((action, index) => {
    assertNonEmptyString(action.actionId, `learnerActions[${index}].actionId`)
    assertNonEmptyString(action.type, `learnerActions[${index}].type`)
    assertFiniteNumber(action.virtualTimeMs, `learnerActions[${index}].virtualTimeMs`)
  })
}

function updateContentHash(trace: TraceRecord): TraceRecord {
  validateTrace(trace)
  trace.contentHash = traceHash(trace)
  return trace
}

export function createTrace(input: CreateTraceInput): TraceRecord {
  if (!input || !input.session) {
    throw new Error('session is required')
  }
  const executionMode = input.executionMode ?? input.session.executionMode
  const authority = input.authority ?? input.session.authority
  if (executionMode !== input.session.executionMode || authority !== input.session.authority) {
    throw new Error('trace execution metadata must match its session')
  }

  const trace: TraceRecord = {
    traceId: input.traceId?.trim() || '',
    schemaVersion: input.schemaVersion ?? TRACE_SCHEMA_VERSION,
    contentHash: '',
    session: cloneJson(input.session),
    executionMode,
    authority,
    seed: String(input.seed),
    faultProfile: cloneJson(input.faultProfile ?? {}),
    ...(input.recipeRevisionId ? { recipeRevisionId: input.recipeRevisionId } : {}),
    calibrationIds: [...(input.calibrationIds ?? [])],
    modelVersions: [...(input.modelVersions ?? [])],
    events: cloneJson(input.events ?? []),
    learnerActions: cloneJson(input.learnerActions ?? []),
    ...(input.expectedOutput !== undefined ? { expectedOutput: cloneJson(input.expectedOutput) } : {}),
    ...(input.actualOutput !== undefined ? { actualOutput: cloneJson(input.actualOutput) } : {}),
    evidenceLinks: [...(input.evidenceLinks ?? [])],
    ...(input.parentTraceId ? { parentTraceId: input.parentTraceId } : {}),
    ...(input.branchPointEventId ? { branchPointEventId: input.branchPointEventId } : {}),
  }

  if (!trace.traceId) {
    const { traceId: _traceId, contentHash: _contentHash, ...identity } = trace
    trace.traceId = `trace-${sha256Hex(stableStringify(identity)).slice(0, 16)}`
  }
  return updateContentHash(trace)
}

export function appendTraceEvent(trace: TraceRecord, event: NormalizedEvent): TraceRecord {
  if (event.source.sessionId !== trace.session.id) {
    throw new Error('event session id must match the trace session')
  }
  const lastEvent = trace.events[trace.events.length - 1]
  if (lastEvent && (event.sequence <= lastEvent.sequence || event.virtualTimeMs < lastEvent.virtualTimeMs)) {
    throw new Error('appended event must follow the existing trace sequence')
  }
  trace.events = [...trace.events, cloneJson(event)]
  return updateContentHash(trace)
}

export function finalizeTrace(trace: TraceRecord): TraceRecord {
  return updateContentHash(trace)
}

export function exportTraceJson(trace: TraceRecord): string {
  validateTrace(trace)
  const safeTrace = redactSensitiveFields(cloneJson(trace)) as TraceRecord
  safeTrace.contentHash = traceHash(safeTrace)
  return stableStringify(safeTrace)
}

export function importTraceJson(serialized: string): TraceRecord {
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    throw new Error('invalid trace JSON')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('trace JSON must contain an object')
  }

  const trace = parsed as TraceRecord
  validateTrace(trace)
  const expectedHash = traceHash(trace)
  if (trace.contentHash !== expectedHash) {
    throw new Error('trace content hash mismatch')
  }
  return trace
}
