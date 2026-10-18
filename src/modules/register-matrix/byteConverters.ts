import type { EndianConversionResult, EndianMode, RegisterDefinition } from '../../types/omniprobe'

export const ENDIAN_MODES = [
  'ABCD_BIG',
  'DCBA_LITTLE',
  'BADC_BYTE_SWAP',
  'CDAB_WORD_SWAP',
] as const satisfies readonly EndianMode[]

export type FourBytes = readonly [number, number, number, number]
export type RegisterPair = readonly [number, number]

export interface RegisterOverlap {
  first: RegisterDefinition
  second: RegisterDefinition
  startAddress: number
  endAddress: number
}

const byteOrder: Record<EndianMode, readonly [number, number, number, number]> = {
  ABCD_BIG: [0, 1, 2, 3],
  DCBA_LITTLE: [3, 2, 1, 0],
  BADC_BYTE_SWAP: [1, 0, 3, 2],
  CDAB_WORD_SWAP: [2, 3, 0, 1],
}

const asByte = (value: number, index: number): number => {
  if (!Number.isInteger(value) || value < 0 || value > 0xff) {
    throw new RangeError(`Byte ${index + 1} must be an integer between 0 and 255.`)
  }
  return value
}

const asFourBytes = (bytes: readonly number[]): FourBytes => {
  if (bytes.length !== 4) {
    throw new RangeError('A 2-register value must contain exactly four bytes.')
  }
  return [asByte(bytes[0], 0), asByte(bytes[1], 1), asByte(bytes[2], 2), asByte(bytes[3], 3)]
}

const asRegister = (value: number, index: number): number => {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
    throw new RangeError(`Register ${index + 1} must be an integer between 0 and 65535.`)
  }
  return value
}

const asBit = (bit: number): number => {
  if (!Number.isInteger(bit) || bit < 0 || bit > 15) {
    throw new RangeError('Interlock bits must be integers from 0 through 15.')
  }
  return bit
}

const asWord = (word: number): number => {
  if (!Number.isInteger(word) || word < 0 || word > 0xffff) {
    throw new RangeError('An interlock word must be an integer between 0 and 65535.')
  }
  return word
}

/** Parse four hexadecimal bytes or two four-digit hexadecimal registers. */
export const parseHexBytes = (input: string): number[] => {
  const tokens = input
    .trim()
    .replace(/0x/gi, '')
    .split(/[\s,:;|/_-]+/)
    .filter(Boolean)

  if (!tokens.every((token) => /^[0-9a-fA-F]+$/.test(token))) {
    throw new Error('Hex input may contain only hexadecimal digits.')
  }

  if (tokens.length === 1 && tokens[0].length === 8) {
    return [0, 2, 4, 6].map((offset) => Number.parseInt(tokens[0].slice(offset, offset + 2), 16))
  }

  if (tokens.length === 2 && tokens.every((token) => token.length === 4)) {
    return tokens.flatMap((token) => [Number.parseInt(token.slice(0, 2), 16), Number.parseInt(token.slice(2), 16)])
  }

  if (tokens.length === 4 && tokens.every((token) => token.length === 2)) {
    return tokens.map((token) => Number.parseInt(token, 16))
  }

  throw new Error('Enter four bytes (for example, "3F 80 00 00") or two 16-bit registers ("3F80 0000").')
}

/** Convert two 16-bit register values to their ABCD byte representation. */
export const registerPairToBytes = (registers: readonly number[]): number[] => {
  if (registers.length !== 2) {
    throw new RangeError('A register pair must contain exactly two 16-bit registers.')
  }
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)
  view.setUint16(0, asRegister(registers[0], 0), false)
  view.setUint16(2, asRegister(registers[1], 1), false)
  return Array.from(new Uint8Array(buffer))
}

/** Reorder four bytes according to a 32-bit register endian convention. */
export const reorderBytes = (bytes: readonly number[], mode: EndianMode): number[] => {
  const normalized = asFourBytes(bytes)
  const order = byteOrder[mode]
  if (!order) throw new Error(`Unsupported endian mode: ${String(mode)}`)
  return order.map((index) => normalized[index])
}

/** Decode one reordered 2-register value using the platform-independent DataView API. */
export const convertBytePair = (bytes: readonly number[], mode: EndianMode): EndianConversionResult => {
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)
  const orderedBytes = reorderBytes(bytes, mode)
  new Uint8Array(buffer).set(orderedBytes)

  const int32 = view.getInt32(0, false)
  return {
    mode,
    bytes: orderedBytes,
    float32: view.getFloat32(0, false),
    int32,
    uint32: view.getUint32(0, false),
    q16_16: int32 / 0x1_0000,
  }
}

/** Convert a pair of 16-bit registers under one endian convention. */
export const convertRegisterPair = (registers: readonly number[], mode: EndianMode): EndianConversionResult => (
  convertBytePair(registerPairToBytes(registers), mode)
)

/** Decode the same four input bytes under all supported endian conventions. */
export const convertAcrossEndianModes = (bytes: readonly number[]): EndianConversionResult[] => (
  ENDIAN_MODES.map((mode) => convertBytePair(bytes, mode))
)

/** Decode the same two registers under all supported endian conventions. */
export const convertRegisterPairAcrossEndianModes = (registers: readonly number[]): EndianConversionResult[] => (
  convertAcrossEndianModes(registerPairToBytes(registers))
)

/** Find inclusive address ranges shared by any two register definitions. */
export const findRegisterOverlaps = (registers: readonly RegisterDefinition[]): RegisterOverlap[] => {
  const overlaps: RegisterOverlap[] = []
  for (let firstIndex = 0; firstIndex < registers.length; firstIndex += 1) {
    const first = registers[firstIndex]
    const firstEnd = first.address + first.width - 1
    for (let secondIndex = firstIndex + 1; secondIndex < registers.length; secondIndex += 1) {
      const second = registers[secondIndex]
      const secondEnd = second.address + second.width - 1
      const startAddress = Math.max(first.address, second.address)
      const endAddress = Math.min(firstEnd, secondEnd)
      if (startAddress <= endAddress) overlaps.push({ first, second, startAddress, endAddress })
    }
  }
  return overlaps
}

export const detectRegisterOverlaps = findRegisterOverlaps

export const hasRegisterOverlaps = (registers: readonly RegisterDefinition[]): boolean => (
  findRegisterOverlaps(registers).length > 0
)

/** Toggle, set, or clear one bit in a 16-bit interlock word. */
export const toggleInterlockBit = (word: number, bit: number, enabled?: boolean): number => {
  const mask = 1 << asBit(bit)
  const current = asWord(word)
  if (enabled === undefined) return (current ^ mask) & 0xffff
  return (enabled ? current | mask : current & ~mask) & 0xffff
}

export const isInterlockBitSet = (word: number, bit: number): boolean => (
  (asWord(word) & (1 << asBit(bit))) !== 0
)
