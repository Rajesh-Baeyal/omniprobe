import { useSyncExternalStore } from 'react'
import { industrialPresets } from '../presets/industrialPresets'
import type { DecodedFrame, IndustrialPreset, TelemetrySample } from '../types/omniprobe'
import { calculateWireTimeMs } from '../modules/frame-studio/protocolCodecs'

const maxSamples = Number(import.meta.env.VITE_MAX_RING_BUFFER_SAMPLES ?? 1000)
const tickHz = Number(import.meta.env.VITE_SIM_TICK_HZ ?? 50)

export interface WorkspaceState {
  activePreset: IndustrialPreset
  isRunning: boolean
  sequence: number
  frameLog: DecodedFrame[]
  telemetry: TelemetrySample[]
}

type Listener = () => void

const now = () => Date.now()
const initialPreset = industrialPresets.find((preset) => preset.id === (import.meta.env.VITE_DEFAULT_PRESET ?? 'semiconductor_loadlock')) ?? industrialPresets[0]

let state: WorkspaceState = {
  activePreset: initialPreset,
  isRunning: true,
  sequence: 0,
  frameLog: [],
  telemetry: [],
}
const listeners = new Set<Listener>()
let timer: ReturnType<typeof setInterval> | undefined

const emit = () => listeners.forEach((listener) => listener())

const createSample = (preset: IndustrialPreset, sequence: number): TelemetrySample => {
  const phase = sequence / 8
  const pressure = 18.4 + Math.sin(phase) * 0.85
  const stageError = 7.2 + Math.sin(phase * 1.7) * 2.1
  const analogNoise = Math.abs(Math.sin(phase * 2.7)) * (preset.simulation.faultTypes.includes('EMI_SPIKE_ANALOG') ? 0.42 : 0.08)
  const wireMs = calculateWireTimeMs(preset.simulation.requestBytes + preset.simulation.responseBytes, preset.simulation.baudRate)
  const utilization = Math.min(99.9, (wireMs / preset.simulation.pollingPeriodMs) * 100)
  return {
    timestamp: now(), sequence, pressure_mTorr: pressure, stageError_nm: stageError,
    rfPower_W: 1250 + Math.sin(phase * 0.6) * 34, pumpRpm: 42000 + Math.sin(phase * 0.4) * 210,
    busUtilizationPct: Math.max(utilization, preset.expectedUtilizationPct), crcErrorRatePct: 0,
    interlockWord: preset.defaultInterlockWord ?? 0, analogNoise,
  }
}

const createFrame = (preset: IndustrialPreset, sequence: number): DecodedFrame => ({
  id: `SIM-${String(sequence).padStart(5, '0')}`,
  timestamp: now(), direction: sequence % 2 === 0 ? 'TX' : 'RX', protocol: preset.protocol,
  rawBytes: sequence % 2 === 0 ? [preset.simulation.slaveId, 3, 0x9c, 0x41, 0, 10, 0x85, 0xe4] : [preset.simulation.slaveId, 3, 20, 0, 0x00, 0x1f, 0x42, 0x7a],
  payload: sequence % 2 === 0 ? [0x9c, 0x41, 0, 10] : [20, 0, 0x00, 0x1f], functionCode: 3, slaveId: preset.simulation.slaveId,
  crcValid: true, annotations: [{ start: 0, end: 1, label: 'ADDR', color: '#61e7ff' }, { start: 1, end: 2, label: 'FUNC', color: '#b8f36b' }, { start: 2, end: 6, label: 'DATA', color: '#ffcc66' }, { start: 6, end: 8, label: 'CRC', color: '#ff6b73' }],
  summary: sequence % 2 === 0 ? 'Read Holding Registers · 40001–40010' : 'Response · 10 registers · CRC OK',
})

const tick = () => {
  if (!state.isRunning) return
  const sequence = state.sequence + 1
  const sample = createSample(state.activePreset, sequence)
  state = {
    ...state, sequence,
    telemetry: [...state.telemetry, sample].slice(-maxSamples),
    frameLog: [createFrame(state.activePreset, sequence), ...state.frameLog].slice(0, 100),
  }
  emit()
}

const ensureTimer = () => {
  if (!timer && typeof window !== 'undefined') timer = setInterval(tick, 1000 / tickHz)
}

export const workspaceStore = {
  getSnapshot: () => state,
  subscribe: (listener: Listener) => { listeners.add(listener); ensureTimer(); return () => listeners.delete(listener) },
  setPreset: (preset: IndustrialPreset) => { state = { ...state, activePreset: preset, sequence: 0, frameLog: [], telemetry: [] }; emit() },
  setRunning: (isRunning: boolean) => { state = { ...state, isRunning }; emit() },
  toggleRunning: () => { state = { ...state, isRunning: !state.isRunning }; emit() },
  clearLogs: () => { state = { ...state, frameLog: [], telemetry: [] }; emit() },
  pushTelemetry: (sample: TelemetrySample) => { state = { ...state, telemetry: [...state.telemetry, sample].slice(-maxSamples) }; emit() },
}

export const useWorkspaceStore = () => useSyncExternalStore(workspaceStore.subscribe, workspaceStore.getSnapshot, workspaceStore.getSnapshot)
