import type { ByteSegmentAnnotation, ProtocolType } from '../../types/omniprobe'

export type SerialParity = 'none' | 'even' | 'odd'

export interface WireTimeOptions {
  bitsPerByte?: number
  dataBits?: number
  parity?: SerialParity
  stopBits?: 1 | 1.5 | 2
  turnaroundBits?: number
  silentCharacterTimes?: number
}

export interface ModbusTcpMbap {
  transactionId: number
  protocolId: number
  length: number
  unitId?: number
  pdu: number[]
  expectedFrameLength: number
  trailingBytes: number[]
  valid: boolean
  errors: string[]
}

const BYTE_MASK = 0xff
const CRC_POLYNOMIAL = 0xa001

const assertByte = (value: number, index: number): number => {
  if (!Number.isInteger(value) || value < 0 || value > BYTE_MASK) {
    throw new RangeError(`Byte ${index} must be an integer from 0 to 255.`)
  }
  return value
}

export const normalizeBytes = (bytes: readonly number[]): number[] => bytes.map(assertByte)

/** Parse whitespace, comma, colon, semicolon, or hyphen separated hexadecimal bytes. */
export const parseHexBytes = (input: string): number[] => {
  const trimmed = input.trim()
  if (!trimmed) return []

  const tokens = trimmed.replace(/[,:;\-]/g, ' ').split(/\s+/)
  const values: number[] = []

  tokens.forEach((rawToken) => {
    const token = rawToken.replace(/^0x/i, '')
    if (!token || token.length % 2 !== 0 || !/^[\da-f]+$/i.test(token)) {
      throw new Error(`Invalid hexadecimal byte token “${rawToken}”.`)
    }
    for (let index = 0; index < token.length; index += 2) {
      values.push(Number.parseInt(token.slice(index, index + 2), 16))
    }
  })

  return values
}

export const buildHexBytes = (bytes: readonly number[]): string => normalizeBytes(bytes)
  .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
  .join(' ')

export const formatHexBytes = buildHexBytes
export const parseHex = parseHexBytes
export const buildHex = buildHexBytes

/** CRC-16/MODBUS, reflected polynomial 0xA001, initial value 0xFFFF. */
export const crc16Modbus = (bytes: readonly number[]): number => {
  let crc = 0xffff
  normalizeBytes(bytes).forEach((byte) => {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) === 1 ? (crc >>> 1) ^ CRC_POLYNOMIAL : crc >>> 1
    }
  })
  return crc & 0xffff
}

export const calculateCrc16Modbus = crc16Modbus

/** Append the MODBUS wire representation: low CRC byte first, then high byte. */
export const appendCrc16Modbus = (bytes: readonly number[]): number[] => {
  const frame = normalizeBytes(bytes)
  const crc = crc16Modbus(frame)
  return [...frame, crc & BYTE_MASK, (crc >>> 8) & BYTE_MASK]
}

export const verifyCrc16Modbus = (frame: readonly number[]): boolean => {
  const bytes = normalizeBytes(frame)
  if (bytes.length < 3) return false
  const expected = crc16Modbus(bytes.slice(0, -2))
  return bytes.at(-2) === (expected & BYTE_MASK) && bytes.at(-1) === ((expected >>> 8) & BYTE_MASK)
}

/** Flip the least-significant bit of the low CRC byte without mutating the input. */
export const corruptCrc16Modbus = (frame: readonly number[], mask = 0x01): number[] => {
  const bytes = normalizeBytes(frame)
  if (bytes.length < 2) throw new RangeError('A frame must contain two CRC bytes.')
  assertByte(mask, 0)
  const corrupted = [...bytes]
  corrupted[corrupted.length - 2] ^= mask
  return corrupted
}

export const corruptCrc = corruptCrc16Modbus

const addAnnotation = (
  annotations: ByteSegmentAnnotation[],
  start: number,
  end: number,
  label: string,
  color: string,
  description: string,
  byteCount: number,
) => {
  const boundedStart = Math.max(0, Math.min(start, byteCount))
  const boundedEnd = Math.max(boundedStart, Math.min(end, byteCount))
  if (boundedStart < boundedEnd) annotations.push({ start: boundedStart, end: boundedEnd, label, color, description })
}

/** Generate exclusive-end byte ranges for the protocol frame ribbon. */
export const generateByteSegmentAnnotations = (
  protocol: ProtocolType,
  bytes: readonly number[],
): ByteSegmentAnnotation[] => {
  const byteCount = bytes.length
  const annotations: ByteSegmentAnnotation[] = []

  if (protocol === 'MODBUS_RTU') {
    addAnnotation(annotations, 0, 1, 'ADDR', '#61e7ff', 'Modbus slave address', byteCount)
    addAnnotation(annotations, 1, 2, 'FUNC', '#b8f36b', 'Modbus function code', byteCount)
    if (byteCount >= 4) {
      addAnnotation(annotations, 2, byteCount - 2, 'DATA', '#ffcc66', 'Function data and payload', byteCount)
      addAnnotation(annotations, byteCount - 2, byteCount, 'CRC', '#ff6b73', 'CRC-16/MODBUS, low byte first', byteCount)
    } else {
      addAnnotation(annotations, 2, byteCount, 'DATA', '#ffcc66', 'Function data and payload', byteCount)
    }
    return annotations
  }

  if (protocol === 'MODBUS_TCP') {
    addAnnotation(annotations, 0, 2, 'TID', '#61e7ff', 'Transaction identifier', byteCount)
    addAnnotation(annotations, 2, 4, 'PID', '#7dd3fc', 'Protocol identifier', byteCount)
    addAnnotation(annotations, 4, 6, 'LEN', '#b8f36b', 'MBAP length field', byteCount)
    addAnnotation(annotations, 6, 7, 'UNIT', '#ffcc66', 'Unit identifier', byteCount)
    addAnnotation(annotations, 7, 8, 'FUNC', '#c4b5fd', 'Modbus function code', byteCount)
    addAnnotation(annotations, 8, byteCount, 'PDU', '#f9a8d4', 'Protocol data unit', byteCount)
    return annotations
  }

  const label = protocol === 'SECS_HSMS' ? 'HSMS' : 'MQTT'
  addAnnotation(annotations, 0, byteCount, label, '#61e7ff', 'Protocol frame bytes', byteCount)
  return annotations
}

export const createByteSegmentAnnotations = generateByteSegmentAnnotations
export const generateByteAnnotations = (
  bytes: readonly number[],
  protocol: ProtocolType,
): ByteSegmentAnnotation[] => generateByteSegmentAnnotations(protocol, bytes)

export const decodeModbusTcpMbap = (frame: readonly number[]): ModbusTcpMbap => {
  const bytes = normalizeBytes(frame)
  const transactionId = bytes.length >= 2 ? (bytes[0] << 8) | bytes[1] : 0
  const protocolId = bytes.length >= 4 ? (bytes[2] << 8) | bytes[3] : 0
  const length = bytes.length >= 6 ? (bytes[4] << 8) | bytes[5] : 0
  const expectedFrameLength = 6 + length
  const errors: string[] = []

  if (bytes.length < 7) errors.push('MBAP header requires at least 7 bytes.')
  if (bytes.length >= 4 && protocolId !== 0) errors.push('Protocol identifier is not zero.')
  if (bytes.length >= 6 && length < 1) errors.push('MBAP length must include at least the unit identifier.')
  if (bytes.length >= 6 && bytes.length < expectedFrameLength) errors.push(`Frame is truncated; expected ${expectedFrameLength} bytes.`)
  if (bytes.length >= 6 && bytes.length > expectedFrameLength) errors.push(`Frame has ${bytes.length - expectedFrameLength} trailing bytes.`)

  const unitId = bytes.length >= 7 ? bytes[6] : undefined
  const pduLength = Math.max(0, length - 1)
  const pdu = bytes.slice(7, 7 + pduLength)
  return {
    transactionId,
    protocolId,
    length,
    unitId,
    pdu,
    expectedFrameLength,
    trailingBytes: bytes.slice(Math.max(0, expectedFrameLength)),
    valid: errors.length === 0,
    errors,
  }
}

export const decodeMbap = decodeModbusTcpMbap

/**
 * Calculate serial wire time without rounding. Modbus RTU defaults to 11 bits
 * per byte (8 data bits, parity, one stop bit), matching the bus simulator.
 */
export const calculateWireTimeMs = (
  byteCountOrFrame: number | readonly number[],
  baudRate: number,
  options: WireTimeOptions | number = {},
): number => {
  const byteCount = typeof byteCountOrFrame === 'number' ? byteCountOrFrame : byteCountOrFrame.length
  if (!Number.isInteger(byteCount) || byteCount < 0) throw new RangeError('Byte count must be a non-negative integer.')
  if (!Number.isFinite(baudRate) || baudRate <= 0) throw new RangeError('Baud rate must be greater than zero.')

  const framing = typeof options === 'number' ? { bitsPerByte: options } : options
  const dataBits = framing.dataBits ?? 8
  const parity = framing.parity ?? 'even'
  const stopBits = framing.stopBits ?? 1
  const turnaroundBits = framing.turnaroundBits ?? 0
  const silentCharacterTimes = framing.silentCharacterTimes ?? 0
  if (!Number.isFinite(dataBits) || dataBits <= 0 || !Number.isFinite(stopBits) || stopBits <= 0) {
    throw new RangeError('Serial data and stop bits must be greater than zero.')
  }
  if (!Number.isFinite(turnaroundBits) || turnaroundBits < 0 || !Number.isFinite(silentCharacterTimes) || silentCharacterTimes < 0) {
    throw new RangeError('Turnaround and silent interval values must be non-negative.')
  }
  const parityBits = parity === 'none' ? 0 : 1
  const bitsPerCharacter = framing.bitsPerByte ?? (1 + dataBits + parityBits + stopBits)
  if (!Number.isFinite(bitsPerCharacter) || bitsPerCharacter <= 0) {
    throw new RangeError('Bits per byte must be greater than zero.')
  }
  const totalBits = byteCount * bitsPerCharacter + turnaroundBits + silentCharacterTimes * bitsPerCharacter
  return (totalBits / baudRate) * 1000
}

export const calculateRs485WireTimeMs = calculateWireTimeMs
