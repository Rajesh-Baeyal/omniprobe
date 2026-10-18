export type ProtocolType = 'MODBUS_RTU' | 'MODBUS_TCP' | 'SECS_HSMS' | 'SPARKPLUG_EDGE'

export type EndianMode = 'ABCD_BIG' | 'DCBA_LITTLE' | 'BADC_BYTE_SWAP' | 'CDAB_WORD_SWAP'

export type RegisterDataType = 'FLOAT32' | 'INT32' | 'UINT32' | 'Q16.16' | 'UINT16' | 'INT16'

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL' | 'PASS'

export type FaultType =
  | 'CRC_BIT_FLIP'
  | 'SLAVE_TIMEOUT'
  | 'EMI_SPIKE_ANALOG'
  | 'ENDIAN_WORD_SWAP'
  | 'INTERLOCK_CHATTER'

export interface ByteSegmentAnnotation {
  start: number
  end: number
  label: string
  color: string
  description?: string
}

export interface DecodedFrame {
  id: string
  timestamp: number
  direction: 'TX' | 'RX'
  protocol: ProtocolType
  rawBytes: number[]
  payload: number[]
  functionCode?: number
  slaveId?: number
  crcValid?: boolean
  annotations: ByteSegmentAnnotation[]
  summary: string
}

export interface InterlockBitDefinition {
  bit: number
  name: string
  description: string
  safeState: boolean
}

export interface RegisterDefinition {
  name: string
  address: number
  width: 1 | 2
  dataType: RegisterDataType
  unit: string
  description: string
  scale?: number
  defaultValue: number
  bitDefinitions?: InterlockBitDefinition[]
}

export interface EndianConversionResult {
  mode: EndianMode
  bytes: number[]
  float32: number
  int32: number
  uint32: number
  q16_16: number
}

export interface BusSimulationConfig {
  baudRate: number
  pollingPeriodMs: number
  slaveId: number
  registerCount: number
  requestBytes: number
  responseBytes: number
  timeoutMs: number
  faultTypes: FaultType[]
}

export interface TelemetrySample {
  timestamp: number
  sequence: number
  pressure_mTorr: number
  stageError_nm: number
  rfPower_W: number
  pumpRpm: number
  busUtilizationPct: number
  crcErrorRatePct: number
  interlockWord: number
  analogNoise: number
}

export interface DiagnosticFinding {
  id: string
  severity: Severity
  title: string
  details: string
  recommendation: string
  autoRemediable: boolean
  resolved?: boolean
}

export interface IndustrialPreset {
  id: string
  name: string
  shortName: string
  protocol: ProtocolType
  description: string
  tags: string[]
  simulation: BusSimulationConfig
  registers: RegisterDefinition[]
  defaultInterlockWord?: number
  expectedUtilizationPct: number
}
