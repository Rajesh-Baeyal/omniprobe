export type ExecutionMode = 'SIMULATED' | 'REPLAY' | 'BROWSER_LIVE' | 'BRIDGE_LIVE'

export type Authority = 'READ_ONLY' | 'WRITE_ARMED'

export type Transport =
  | 'simulator'
  | 'fixture'
  | 'serial'
  | 'camera'
  | 'websocket'
  | 'mqtt-websocket'
  | 'bluetooth-gatt'
  | 'bridge'

export type CapabilityAccess = 'read' | 'subscribe' | 'command'

export type SafetyClass = 'educational' | 'read-only' | 'qualified-review'

export type QueuePolicy = 'drop-oldest' | 'coalesce' | 'stop'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export interface JsonObject {
  [key: string]: JsonValue
}

export interface ModuleCapability {
  id: string
  adapterId: string
  access: CapabilityAccess
  safetyClass: SafetyClass
  maxRateHz?: number
}

export interface WorkbenchModuleManifest {
  moduleId: string
  version: string
  domains: string[]
  supportedModes: ExecutionMode[]
  transports: string[]
  capabilities: ModuleCapability[]
  schemaVersions: string[]
  calculatorIds: string[]
  lessonIds: string[]
  terminologyRefs: string[]
  sourceRefs: string[]
  adapterIds: string[]
}

export interface WorkbenchSession {
  id: string
  executionMode: ExecutionMode
  transport: Transport
  authority: Authority
  source: {
    id: string
    label: string
    fixtureHash?: string
    deviceId?: string
  }
  capabilities: string[]
  contractVersion: string
  clock: {
    kind: 'virtual' | 'browser' | 'bridge'
    nowMs: number
    speed: number
  }
  limits: {
    maxMessageBytes: number
    maxRateHz: number
    queuePolicy: QueuePolicy
  }
}

export type NormalizedEventKind = 'frame' | 'value' | 'state' | 'alarm' | 'image' | 'motion' | 'log' | 'command'

export interface NormalizedEvent {
  eventId: string
  sequence: number
  virtualTimeMs: number
  source: {
    sessionId: string
    assetId: string
    moduleId: string
  }
  kind: NormalizedEventKind
  direction?: 'TX' | 'RX' | 'INTERNAL'
  protocol?: string
  raw?: {
    encoding: 'hex' | 'base64' | 'bytes'
    data: string
  }
  decoded?: JsonObject
  semantic?: JsonObject
  quality: 'good' | 'stale' | 'uncertain' | 'invalid' | 'simulated'
  causality?: {
    parentEventIds: string[]
    phase?: string
  }
  provenance: {
    modelVersion: string
    fixtureHash?: string
    seed?: string
    sourceRefs: string[]
  }
}

export interface StructuredError {
  code: string
  message: string
  details?: JsonObject
  retryable?: boolean
}

export interface VirtualClock {
  now(): number
  advance(deltaMs: number): number
  set(nowMs: number): number
}

export interface SeededRandom {
  next(): number
  nextInt(maxExclusive: number): number
  pick<T>(values: readonly T[]): T
}
