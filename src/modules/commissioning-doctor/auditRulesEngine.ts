import type {
  DiagnosticFinding,
  IndustrialPreset,
  RegisterDefinition,
  Severity,
  TelemetrySample,
} from '../../types/omniprobe'

export interface CommissioningAuditInput {
  preset: IndustrialPreset
  telemetry?: readonly TelemetrySample[]
}

export interface CommissioningAudit {
  preset: IndustrialPreset
  findings: DiagnosticFinding[]
}

export interface RemediationChange {
  field: string
  before: string
  after: string
  reason: string
}

export interface AutoRemediationResult {
  preset: IndustrialPreset
  config: IndustrialPreset['simulation']
  findings: DiagnosticFinding[]
  changes: RemediationChange[]
}

const BUS_SATURATION_LIMIT_PCT = 65
const TIMEOUT_MARGIN = 1.2
const CRC_WARNING_LIMIT_PCT = 0.5
const CRC_CRITICAL_LIMIT_PCT = 2
const CHATTER_TRANSITION_LIMIT = 3
const CHATTER_RATIO_LIMIT = 0.2
const POLLING_MARGIN = 1.1
const ANALOG_NOISE_WARNING_LIMIT = 0.25
const ANALOG_NOISE_CRITICAL_LIMIT = 0.5
const STANDARD_BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600, 1000000]

const pass = (id: string, title: string, details: string, recommendation = 'No action required.'): DiagnosticFinding => ({
  id,
  severity: 'PASS',
  title,
  details,
  recommendation,
  autoRemediable: false,
})

const finding = (
  id: string,
  severity: Exclude<Severity, 'PASS'>,
  title: string,
  details: string,
  recommendation: string,
  autoRemediable = false,
): DiagnosticFinding => ({ id, severity, title, details, recommendation, autoRemediable })

const average = (values: readonly number[]): number => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length

const maxOr = (values: readonly number[], fallback: number): number => values.length === 0 ? fallback : Math.max(...values)

const is32BitRegister = (register: RegisterDefinition): boolean => register.width === 2

const wireTimeMs = (preset: IndustrialPreset, baudRate = preset.simulation.baudRate): number => {
  const bytes = preset.simulation.requestBytes + preset.simulation.responseBytes
  return baudRate > 0 ? (bytes * 11 * 1000) / baudRate : Number.POSITIVE_INFINITY
}

const estimatedBusUtilizationPct = (preset: IndustrialPreset, baudRate = preset.simulation.baudRate): number => {
  const pollingPeriodMs = preset.simulation.pollingPeriodMs
  return pollingPeriodMs > 0 ? (wireTimeMs(preset, baudRate) / pollingPeriodMs) * 100 : Number.POSITIVE_INFINITY
}

const telemetryValues = (input: CommissioningAuditInput): readonly TelemetrySample[] => input.telemetry ?? []

const actualBusUtilizationPct = (input: CommissioningAuditInput): number => {
  const observed = telemetryValues(input).map((sample) => sample.busUtilizationPct).filter(Number.isFinite)
  return maxOr(observed, estimatedBusUtilizationPct(input.preset))
}

const formatPct = (value: number): string => `${value.toFixed(1)}%`

const formatMs = (value: number): string => `${value.toFixed(2)} ms`

export const checkBusSaturation = (input: CommissioningAuditInput): DiagnosticFinding => {
  const utilization = actualBusUtilizationPct(input)
  if (utilization <= BUS_SATURATION_LIMIT_PCT) {
    return pass('BUS_SATURATION', 'Bus saturation', `Peak bus utilization is ${formatPct(utilization)}.`)
  }

  const severity = utilization >= 85 ? 'CRITICAL' : 'WARNING'
  return finding(
    'BUS_SATURATION',
    severity,
    'Bus saturation above 65%',
    `Peak bus utilization is ${formatPct(utilization)}; the commissioning limit is ${BUS_SATURATION_LIMIT_PCT}%.`,
    'Increase the baud rate or reduce the polling payload and cadence.',
    true,
  )
}

export const checkRegisterAddressOverlaps = (input: CommissioningAuditInput): DiagnosticFinding => {
  const overlaps: string[] = []
  const registers = input.preset.registers

  for (let index = 0; index < registers.length; index += 1) {
    const left = registers[index]
    const leftEnd = left.address + left.width - 1
    for (let nextIndex = index + 1; nextIndex < registers.length; nextIndex += 1) {
      const right = registers[nextIndex]
      const rightEnd = right.address + right.width - 1
      if (left.address <= rightEnd && right.address <= leftEnd) {
        overlaps.push(`${left.name} ↔ ${right.name}`)
      }
    }
  }

  if (overlaps.length === 0) {
    return pass('REGISTER_OVERLAP', 'Register address overlaps', 'All register ranges are disjoint.')
  }

  return finding(
    'REGISTER_OVERLAP',
    'CRITICAL',
    'Register address overlaps',
    `${overlaps.length} overlapping range${overlaps.length === 1 ? '' : 's'}: ${overlaps.join(', ')}.`,
    'Assign each register a unique contiguous range before enabling the device.',
    true,
  )
}

export const check32BitAlignment = (input: CommissioningAuditInput): DiagnosticFinding => {
  const unaligned = input.preset.registers
    .filter(is32BitRegister)
    .filter((register) => register.address % 2 === 0)

  if (unaligned.length === 0) {
    return pass('REGISTER_ALIGNMENT', '32-bit register alignment', 'All 32-bit registers start on an odd register address.')
  }

  return finding(
    'REGISTER_ALIGNMENT',
    'WARNING',
    '32-bit register alignment',
    `${unaligned.map((register) => `${register.name} @ ${register.address}`).join(', ')} use even start addresses.`,
    'Move each 32-bit register to an odd start address and preserve its two-register width.',
    true,
  )
}

export const checkTimeoutMargin = (input: CommissioningAuditInput): DiagnosticFinding => {
  const requiredTimeoutMs = wireTimeMs(input.preset) * TIMEOUT_MARGIN
  const configuredTimeoutMs = input.preset.simulation.timeoutMs

  if (configuredTimeoutMs >= requiredTimeoutMs) {
    return pass('TIMEOUT_MARGIN', 'Timeout margin', `Configured timeout is ${formatMs(configuredTimeoutMs)}; required minimum is ${formatMs(requiredTimeoutMs)}.`)
  }

  const severity = configuredTimeoutMs < wireTimeMs(input.preset) ? 'CRITICAL' : 'WARNING'
  return finding(
    'TIMEOUT_MARGIN',
    severity,
    'Timeout margin is too narrow',
    `Configured timeout is ${formatMs(configuredTimeoutMs)} but the wire-time budget requires at least ${formatMs(requiredTimeoutMs)}.`,
    'Increase the response timeout or reduce the request and response payload.',
  )
}

export const checkCrcErrorRate = (input: CommissioningAuditInput): DiagnosticFinding => {
  const rates = telemetryValues(input).map((sample) => sample.crcErrorRatePct).filter(Number.isFinite)
  const crcErrorRate = average(rates)

  if (crcErrorRate <= CRC_WARNING_LIMIT_PCT) {
    return pass('CRC_ERROR_RATE', 'CRC error rate', `Average CRC error rate is ${formatPct(crcErrorRate)}.`)
  }

  const severity = crcErrorRate >= CRC_CRITICAL_LIMIT_PCT ? 'CRITICAL' : 'WARNING'
  return finding(
    'CRC_ERROR_RATE',
    severity,
    'CRC error rate is elevated',
    `Average CRC error rate is ${formatPct(crcErrorRate)} across ${rates.length} telemetry sample${rates.length === 1 ? '' : 's'}.`,
    'Inspect shielding, termination, grounding, and serial line noise before increasing retries.',
  )
}

export const checkInterlockChatter = (input: CommissioningAuditInput): DiagnosticFinding => {
  const words = telemetryValues(input).map((sample) => sample.interlockWord)
  let transitions = 0
  for (let index = 1; index < words.length; index += 1) {
    if (words[index] !== words[index - 1]) transitions += 1
  }
  const transitionRatio = words.length > 1 ? transitions / (words.length - 1) : 0

  if (transitions < CHATTER_TRANSITION_LIMIT || transitionRatio <= CHATTER_RATIO_LIMIT) {
    return pass('INTERLOCK_CHATTER', 'Interlock chatter', `${transitions} interlock transition${transitions === 1 ? '' : 's'} observed.`)
  }

  return finding(
    'INTERLOCK_CHATTER',
    'CRITICAL',
    'Interlock chatter detected',
    `${transitions} interlock transitions occurred in ${words.length} samples (${formatPct(transitionRatio * 100)} of intervals).`,
    'Stop commissioning and inspect the interlock circuit, sensor wiring, and debounce behavior.',
  )
}

export const checkPollingCadence = (input: CommissioningAuditInput): DiagnosticFinding => {
  const requiredPollingPeriodMs = wireTimeMs(input.preset) * POLLING_MARGIN
  const configuredPollingPeriodMs = input.preset.simulation.pollingPeriodMs

  if (configuredPollingPeriodMs >= requiredPollingPeriodMs) {
    return pass('POLLING_CADENCE', 'Polling cadence', `Polling period is ${formatMs(configuredPollingPeriodMs)}; minimum is ${formatMs(requiredPollingPeriodMs)}.`)
  }

  return finding(
    'POLLING_CADENCE',
    'WARNING',
    'Polling cadence is below wire-time margin',
    `Polling period is ${formatMs(configuredPollingPeriodMs)} but the payload needs at least ${formatMs(requiredPollingPeriodMs)}.`,
    'Slow the polling cadence or reduce the number of bytes exchanged per cycle.',
  )
}

export const checkBaudRate = (input: CommissioningAuditInput): DiagnosticFinding => {
  const { baudRate } = input.preset.simulation
  if (input.preset.protocol !== 'MODBUS_RTU') {
    return pass('BAUD_RATE', 'Baud rate', 'Baud rate is not used by this protocol.')
  }

  if (STANDARD_BAUD_RATES.includes(baudRate)) {
    return pass('BAUD_RATE', 'Baud rate', `${baudRate.toLocaleString()} baud is supported.`)
  }

  return finding(
    'BAUD_RATE',
    'WARNING',
    'Unsupported baud rate',
    `${baudRate.toLocaleString()} baud is not in the supported commissioning profile.`,
    `Select one of the supported rates: ${STANDARD_BAUD_RATES.join(', ')}.`,
    true,
  )
}

export const checkRegisterAddressRange = (input: CommissioningAuditInput): DiagnosticFinding => {
  const invalid = input.preset.registers.filter((register) => register.address < 1 || register.address + register.width - 1 > 65535)
  if (invalid.length === 0) {
    return pass('REGISTER_RANGE', 'Register address range', 'All register ranges fit within the 16-bit address space.')
  }

  return finding(
    'REGISTER_RANGE',
    'CRITICAL',
    'Register address out of range',
    `${invalid.map((register) => `${register.name} @ ${register.address}`).join(', ')} exceed the 1–65535 register range.`,
    'Move the register into the device address space before commissioning.',
  )
}

export const checkSlaveId = (input: CommissioningAuditInput): DiagnosticFinding => {
  const { slaveId } = input.preset.simulation
  const valid = input.preset.protocol === 'MODBUS_RTU' ? slaveId >= 1 && slaveId <= 247 : slaveId >= 0 && slaveId <= 255

  if (valid) {
    return pass('SLAVE_ID', 'Slave ID', `Slave ID ${slaveId} is valid for ${input.preset.protocol}.`)
  }

  return finding(
    'SLAVE_ID',
    'CRITICAL',
    'Invalid slave ID',
    `Slave ID ${slaveId} is outside the valid range for ${input.preset.protocol}.`,
    input.preset.protocol === 'MODBUS_RTU' ? 'Use a unique Modbus RTU slave ID from 1 through 247.' : 'Use a protocol-valid unit identifier from 0 through 255.',
  )
}

export const checkAnalogNoise = (input: CommissioningAuditInput): DiagnosticFinding => {
  const noise = maxOr(telemetryValues(input).map((sample) => sample.analogNoise).filter(Number.isFinite), 0)
  if (noise <= ANALOG_NOISE_WARNING_LIMIT) {
    return pass('ANALOG_NOISE', 'Analog noise', `Peak analog noise is ${noise.toFixed(3)}.`)
  }

  const severity = noise >= ANALOG_NOISE_CRITICAL_LIMIT ? 'CRITICAL' : 'WARNING'
  return finding(
    'ANALOG_NOISE',
    severity,
    'Analog noise is elevated',
    `Peak analog noise is ${noise.toFixed(3)}; the warning limit is ${ANALOG_NOISE_WARNING_LIMIT.toFixed(2)}.`,
    'Inspect sensor cabling, shielding, grounding, and nearby switching loads.',
  )
}

export const checkFaultInjection = (input: CommissioningAuditInput): DiagnosticFinding => {
  const faults = input.preset.simulation.faultTypes
  if (faults.length === 0) {
    return pass('FAULT_INJECTION', 'Fault injection state', 'No simulated faults are enabled.')
  }

  return finding(
    'FAULT_INJECTION',
    'INFO',
    'Fault injection is active',
    `The preset enables ${faults.join(', ')} for simulation.`,
    'Disable simulated faults before accepting a production commissioning baseline.',
  )
}

export const COMMISSIONING_CHECKS = [
  checkBusSaturation,
  checkRegisterAddressOverlaps,
  check32BitAlignment,
  checkTimeoutMargin,
  checkCrcErrorRate,
  checkInterlockChatter,
  checkPollingCadence,
  checkBaudRate,
  checkRegisterAddressRange,
  checkSlaveId,
  checkAnalogNoise,
  checkFaultInjection,
] as const

export const runCommissioningAudit = (input: CommissioningAuditInput): CommissioningAudit => ({
  preset: input.preset,
  findings: COMMISSIONING_CHECKS.map((check) => check(input)),
})

const clonePreset = (preset: IndustrialPreset): IndustrialPreset => ({
  ...preset,
  tags: [...preset.tags],
  simulation: { ...preset.simulation, faultTypes: [...preset.simulation.faultTypes] },
  registers: preset.registers.map((register) => ({
    ...register,
    bitDefinitions: register.bitDefinitions?.map((bit) => ({ ...bit })),
  })),
})

const nextBaudRate = (preset: IndustrialPreset): number => {
  const current = preset.simulation.baudRate
  const target = STANDARD_BAUD_RATES.find((baudRate) => baudRate > current && estimatedBusUtilizationPct(preset, baudRate) <= BUS_SATURATION_LIMIT_PCT)
  return target ?? STANDARD_BAUD_RATES[STANDARD_BAUD_RATES.length - 1]
}

const remediatedRegisters = (registers: readonly RegisterDefinition[]): { registers: RegisterDefinition[]; changes: RemediationChange[] } => {
  if (registers.length === 0) return { registers: [], changes: [] }

  let nextAddress = Math.min(...registers.map((register) => register.address))
  const changes: RemediationChange[] = []
  const repaired = registers.map((register) => {
    let address = Math.max(register.address, nextAddress)
    if (is32BitRegister(register) && address % 2 === 0) address += 1

    const endAddress = address + register.width - 1
    nextAddress = endAddress + 1
    if (address !== register.address) {
      changes.push({
        field: `registers.${register.name}.address`,
        before: String(register.address),
        after: String(address),
        reason: is32BitRegister(register) ? 'Aligned 32-bit register and removed range overlap.' : 'Removed register range overlap.',
      })
    }
    return { ...register, address }
  })

  return { registers: repaired, changes }
}

export const autoRemediateCommissioningAudit = (input: CommissioningAuditInput): AutoRemediationResult => {
  const preset = clonePreset(input.preset)
  const beforeAudit = runCommissioningAudit(input)
  const changes: RemediationChange[] = []

  if (beforeAudit.findings.some((item) => (item.id === 'BUS_SATURATION' || item.id === 'BAUD_RATE') && item.severity !== 'PASS')) {
    const baudRate = nextBaudRate(preset)
    if (baudRate !== preset.simulation.baudRate) {
      changes.push({
        field: 'simulation.baudRate',
        before: String(preset.simulation.baudRate),
        after: String(baudRate),
        reason: `Reduced estimated bus utilization toward the ${BUS_SATURATION_LIMIT_PCT}% limit.`,
      })
      preset.simulation = { ...preset.simulation, baudRate }
    }
  }

  if (beforeAudit.findings.some((item) => item.id === 'REGISTER_ALIGNMENT' && item.severity !== 'PASS') || beforeAudit.findings.some((item) => item.id === 'REGISTER_OVERLAP' && item.severity !== 'PASS')) {
    const repaired = remediatedRegisters(preset.registers)
    preset.registers = repaired.registers
    changes.push(...repaired.changes)
  }

  const remediatedInput = { ...input, preset }
  return {
    preset,
    config: preset.simulation,
    findings: runCommissioningAudit(remediatedInput).findings,
    changes,
  }
}

export const exportAuditReportMarkdown = (
  input: CommissioningAuditInput,
  findings = runCommissioningAudit(input).findings,
): string => {
  const counts = findings.reduce<Record<Severity, number>>((result, item) => {
    result[item.severity] += 1
    return result
  }, { INFO: 0, WARNING: 0, CRITICAL: 0, PASS: 0 })

  const lines = [
    '# Commissioning Doctor Report',
    '',
    `**Preset:** ${input.preset.name} (${input.preset.id})`,
    `**Protocol:** ${input.preset.protocol}`,
    '',
    '## Summary',
    '',
    `- **Critical:** ${counts.CRITICAL}`,
    `- **Warning:** ${counts.WARNING}`,
    `- **Info:** ${counts.INFO}`,
    `- **Pass:** ${counts.PASS}`,
    '',
    '## Findings',
    '',
  ]

  findings.forEach((item) => {
    lines.push(`### ${item.severity} · ${item.title}`)
    lines.push('')
    lines.push(`- **Details:** ${item.details}`)
    lines.push(`- **Recommendation:** ${item.recommendation}`)
    lines.push(`- **Auto-remediable:** ${item.autoRemediable ? 'Yes' : 'No'}`)
    lines.push('')
  })

  return lines.join('\n')
}

// Short aliases keep the individual rule API easy to discover for consumers.
export const checkRegisterOverlaps = checkRegisterAddressOverlaps
export const checkRegisterAlignment = check32BitAlignment
export const runAudit = runCommissioningAudit
export const autoRemediate = autoRemediateCommissioningAudit
