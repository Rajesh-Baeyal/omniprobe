import type {
  BusSimulationConfig,
  DecodedFrame,
  FaultType,
  TelemetrySample,
} from '../../types/omniprobe'
import {
  appendCrc16Modbus,
  calculateWireTimeMs as calculateProtocolWireTimeMs,
  corruptCrc16Modbus,
  generateByteSegmentAnnotations,
} from '../frame-studio/protocolCodecs'

export const VIRTUAL_BUS_FAULTS: readonly FaultType[] = [
  'CRC_BIT_FLIP',
  'SLAVE_TIMEOUT',
  'EMI_SPIKE_ANALOG',
  'ENDIAN_WORD_SWAP',
  'INTERLOCK_CHATTER',
]

export const DEFAULT_BUS_CONFIG: BusSimulationConfig = {
  baudRate: 115200,
  pollingPeriodMs: 20,
  slaveId: 7,
  registerCount: 10,
  requestBytes: 8,
  responseBytes: 25,
  timeoutMs: 12,
  faultTypes: [],
}

const BITS_PER_SERIAL_BYTE = 11
const DEFAULT_INTERLOCK_WORD = 0b1_1111
const DEFAULT_RECENT_STATUS_LIMIT = 8

export interface SimulationStatus {
  sequence: number
  timestamp: number
  severity: 'PASS' | 'WARNING' | 'CRITICAL'
  kind: 'POLL' | 'TIMEOUT' | 'FAULT'
  message: string
  faults: FaultType[]
  frameId?: string
}

export interface SimulationTick {
  sequence: number
  timestamp: number
  wireTimeMs: number
  utilizationPct: number
  sample: TelemetrySample
  frame?: DecodedFrame
  status: SimulationStatus
}

export interface BusSimulatorSnapshot {
  config: BusSimulationConfig
  isRunning: boolean
  sequence: number
  wireTimeMs: number
  utilizationPct: number
  sample?: TelemetrySample
  frame?: DecodedFrame
  lastStatus?: SimulationStatus
  recentStatuses: SimulationStatus[]
}

export interface PollingScheduler {
  setInterval(callback: () => void, delayMs: number): ReturnType<typeof globalThis.setInterval>
  clearInterval(handle: ReturnType<typeof globalThis.setInterval>): void
}

export interface BusSimulatorOptions {
  clock?: () => number
  scheduler?: PollingScheduler
  defaultInterlockWord?: number
  recentStatusLimit?: number
  initialRunning?: boolean
}

export interface BusSimulatorEngine {
  getSnapshot(): BusSimulatorSnapshot
  subscribe(listener: () => void): () => void
  start(): void
  pause(): void
  toggle(): void
  step(timestamp?: number): SimulationTick
  setFaultEnabled(fault: FaultType, enabled: boolean): void
  dispose(): void
}

const includesFault = (config: BusSimulationConfig, fault: FaultType): boolean =>
  config.faultTypes.includes(fault)

const copyConfig = (config: BusSimulationConfig): BusSimulationConfig => ({
  ...config,
  faultTypes: [...new Set(config.faultTypes)],
})

const clampByte = (value: number): number => Math.max(0, Math.min(0xff, Math.trunc(value)))

const round = (value: number, decimals = 3): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Returns serial wire time for a frame, including the 11 bits used by Modbus RTU bytes. */
export const calculateWireTimeMs = (
  byteCount: number,
  baudRate: number,
  bitsPerByte = BITS_PER_SERIAL_BYTE,
): number => calculateProtocolWireTimeMs(byteCount, baudRate, bitsPerByte)

/** Returns the uncapped percentage so saturation above 100% remains observable. */
export const calculateBusUtilizationPct = (config: BusSimulationConfig): number => {
  if (config.pollingPeriodMs <= 0) return 0
  const wireTimeMs = calculateWireTimeMs(
    config.requestBytes + config.responseBytes,
    config.baudRate,
  )
  return (wireTimeMs / config.pollingPeriodMs) * 100
}

const isValidSequence = (sequence: number): number => Math.max(0, Math.trunc(sequence))

const createPayload = (config: BusSimulationConfig, sequence: number): number[] => {
  const payloadLength = Math.max(0, Math.trunc(config.responseBytes) - 4)
  const payload = Array.from({ length: payloadLength }, (_, index) =>
    clampByte((sequence * 29) + (index * 17) + config.slaveId),
  )

  if (!includesFault(config, 'ENDIAN_WORD_SWAP')) return payload

  const swapped: number[] = []
  for (let index = 0; index < payload.length; index += 4) {
    const word = payload.slice(index, index + 4)
    swapped.push(...word.slice(2), ...word.slice(0, 2))
  }
  return swapped
}

export const generateDeterministicFrame = (
  config: BusSimulationConfig,
  sequence: number,
  timestamp = isValidSequence(sequence) * config.pollingPeriodMs,
): DecodedFrame => {
  const safeSequence = isValidSequence(sequence)
  const payload = createPayload(config, safeSequence)
  const body = [clampByte(config.slaveId), 0x03, ...payload]
  const validFrame = appendCrc16Modbus(body)
  const crcBitFlip = includesFault(config, 'CRC_BIT_FLIP')
  const rawBytes = crcBitFlip ? corruptCrc16Modbus(validFrame) : validFrame

  const faultSummary = [
    crcBitFlip ? 'CRC FAULT' : '',
    includesFault(config, 'ENDIAN_WORD_SWAP') ? 'WORD SWAP' : '',
  ].filter(Boolean)

  return {
    id: `VB-${String(safeSequence).padStart(5, '0')}`,
    timestamp,
    direction: 'RX',
    protocol: 'MODBUS_RTU',
    rawBytes,
    payload,
    functionCode: 0x03,
    slaveId: config.slaveId,
    crcValid: !crcBitFlip,
    annotations: generateByteSegmentAnnotations('MODBUS_RTU', rawBytes),
    summary: `Response · ${config.registerCount} registers · ${
      faultSummary.length > 0 ? faultSummary.join(' · ') : 'CRC OK'
    }`,
  }
}

export const generateDeterministicSample = (
  config: BusSimulationConfig,
  sequence: number,
  timestamp = isValidSequence(sequence) * config.pollingPeriodMs,
  defaultInterlockWord = DEFAULT_INTERLOCK_WORD,
): TelemetrySample => {
  const safeSequence = isValidSequence(sequence)
  const phase = safeSequence / 8
  const emiSpike = includesFault(config, 'EMI_SPIKE_ANALOG')
  const interlockChatter = includesFault(config, 'INTERLOCK_CHATTER')
  const timeout = includesFault(config, 'SLAVE_TIMEOUT')

  return {
    timestamp,
    sequence: safeSequence,
    pressure_mTorr: round(18.4 + Math.sin(phase) * 0.85),
    stageError_nm: round(7.2 + Math.sin(phase * 1.7) * 2.1),
    rfPower_W: round(1250 + Math.sin(phase * 0.6) * 34, 2),
    pumpRpm: round(42000 + Math.sin(phase * 0.4) * 210, 2),
    busUtilizationPct: round(calculateBusUtilizationPct(config), 2),
    crcErrorRatePct: includesFault(config, 'CRC_BIT_FLIP') && !timeout ? 100 : 0,
    interlockWord: interlockChatter
      ? defaultInterlockWord ^ (safeSequence % 2 === 0 ? 0 : 1)
      : defaultInterlockWord,
    analogNoise: round(
      emiSpike
        ? 0.72 + Math.abs(Math.sin(phase * 2.7)) * 0.34
        : 0.04 + Math.abs(Math.sin(phase * 2.7)) * 0.04,
      3,
    ),
  }
}

export const generateSimulationTick = (
  config: BusSimulationConfig,
  sequence: number,
  timestamp = isValidSequence(sequence) * config.pollingPeriodMs,
  defaultInterlockWord = DEFAULT_INTERLOCK_WORD,
): SimulationTick => {
  const safeSequence = isValidSequence(sequence)
  const timeout = includesFault(config, 'SLAVE_TIMEOUT')
  const frame = timeout ? undefined : generateDeterministicFrame(config, safeSequence, timestamp)
  const sample = generateDeterministicSample(
    config,
    safeSequence,
    timestamp,
    defaultInterlockWord,
  )
  const faults = [...config.faultTypes]
  const wireTimeMs = calculateWireTimeMs(
    config.requestBytes + config.responseBytes,
    config.baudRate,
  )
  const utilizationPct = calculateBusUtilizationPct(config)
  const status: SimulationStatus = timeout
    ? {
        sequence: safeSequence,
        timestamp,
        severity: 'CRITICAL',
        kind: 'TIMEOUT',
        message: `Slave ${config.slaveId} timeout after ${config.timeoutMs} ms`,
        faults,
      }
    : faults.length > 0
      ? {
          sequence: safeSequence,
          timestamp,
          severity: 'WARNING',
          kind: 'FAULT',
          message: `${faults.join(' · ')} injected`,
          faults,
          frameId: frame?.id,
        }
      : {
          sequence: safeSequence,
          timestamp,
          severity: 'PASS',
          kind: 'POLL',
          message: `Poll ${String(safeSequence).padStart(5, '0')} complete · CRC OK`,
          faults: [],
          frameId: frame?.id,
        }

  return {
    sequence: safeSequence,
    timestamp,
    wireTimeMs,
    utilizationPct,
    sample,
    frame,
    status,
  }
}

const defaultScheduler: PollingScheduler = {
  setInterval: (callback, delayMs) => globalThis.setInterval(callback, delayMs),
  clearInterval: (handle) => globalThis.clearInterval(handle),
}

export const createBusSimulatorEngine = (
  initialConfig: BusSimulationConfig = DEFAULT_BUS_CONFIG,
  options: BusSimulatorOptions = {},
): BusSimulatorEngine => {
  const clock = options.clock ?? (() => Date.now())
  const scheduler = options.scheduler ?? defaultScheduler
  const recentStatusLimit = Math.max(1, Math.trunc(options.recentStatusLimit ?? DEFAULT_RECENT_STATUS_LIMIT))
  const defaultInterlockWord = options.defaultInterlockWord ?? DEFAULT_INTERLOCK_WORD
  let config = copyConfig(initialConfig)
  let isRunning = options.initialRunning ?? false
  let sequence = 0
  let latestTick: SimulationTick | undefined
  let recentStatuses: SimulationStatus[] = []
  let timer: ReturnType<typeof globalThis.setInterval> | undefined
  const listeners = new Set<() => void>()

  const emit = () => listeners.forEach((listener) => listener())

  const clearTimer = () => {
    if (timer === undefined) return
    scheduler.clearInterval(timer)
    timer = undefined
  }

  const poll = () => {
    if (isRunning) engine.step()
  }

  const engine: BusSimulatorEngine = {
    getSnapshot: () => ({
      config: copyConfig(config),
      isRunning,
      sequence,
      wireTimeMs: latestTick?.wireTimeMs ?? calculateWireTimeMs(
        config.requestBytes + config.responseBytes,
        config.baudRate,
      ),
      utilizationPct: latestTick?.utilizationPct ?? calculateBusUtilizationPct(config),
      sample: latestTick?.sample,
      frame: latestTick?.frame,
      lastStatus: latestTick?.status,
      recentStatuses: [...recentStatuses],
    }),

    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    start: () => {
      if (isRunning && timer !== undefined) return
      isRunning = true
      if (timer === undefined) {
        timer = scheduler.setInterval(poll, Math.max(1, config.pollingPeriodMs))
      }
      emit()
    },

    pause: () => {
      isRunning = false
      clearTimer()
      emit()
    },

    toggle: () => {
      if (isRunning) engine.pause()
      else engine.start()
    },

    step: (timestamp = clock()) => {
      sequence += 1
      latestTick = generateSimulationTick(config, sequence, timestamp, defaultInterlockWord)
      recentStatuses = [latestTick.status, ...recentStatuses].slice(0, recentStatusLimit)
      emit()
      return latestTick
    },

    setFaultEnabled: (fault, enabled) => {
      const nextFaults = new Set(config.faultTypes)
      if (enabled) nextFaults.add(fault)
      else nextFaults.delete(fault)
      config = { ...config, faultTypes: [...nextFaults] }
      emit()
    },

    dispose: () => {
      isRunning = false
      clearTimer()
      listeners.clear()
    },
  }

  if (isRunning) engine.start()
  return engine
}
