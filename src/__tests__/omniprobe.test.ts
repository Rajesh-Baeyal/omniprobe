import { describe, expect, it } from 'vitest'
import { appendCrc16Modbus, calculateWireTimeMs, crc16Modbus, verifyCrc16Modbus } from '../modules/frame-studio/protocolCodecs'
import { convertBytePair, findRegisterOverlaps } from '../modules/register-matrix/byteConverters'
import { calculateBusUtilizationPct } from '../modules/virtual-bus/busSimulatorEngine'
import type { BusSimulationConfig, RegisterDefinition } from '../types/omniprobe'

describe('OmniProbe protocol contracts', () => {
  it('calculates the canonical MODBUS CRC-16 vector', () => {
    expect(crc16Modbus([0x01, 0x03, 0x00, 0x00, 0x00, 0x0a]).toString(16)).toBe('cdc5')
    const frame = appendCrc16Modbus([0x01, 0x03, 0x00, 0x00, 0x00, 0x0a])
    expect(frame.slice(-2)).toEqual([0xc5, 0xcd])
    expect(verifyCrc16Modbus(frame)).toBe(true)
    expect(verifyCrc16Modbus([...frame.slice(0, -1), 0x00])).toBe(false)
  })

  it('decodes all four industrial endian conventions', () => {
    const bytes = [0x3f, 0x80, 0x00, 0x00]
    expect(convertBytePair(bytes, 'ABCD_BIG').float32).toBe(1)
    expect(convertBytePair(bytes, 'DCBA_LITTLE').bytes).toEqual([0x00, 0x00, 0x80, 0x3f])
    expect(convertBytePair(bytes, 'BADC_BYTE_SWAP').bytes).toEqual([0x80, 0x3f, 0x00, 0x00])
    expect(convertBytePair(bytes, 'CDAB_WORD_SWAP').bytes).toEqual([0x00, 0x00, 0x3f, 0x80])
    expect(convertBytePair([0x00, 0x01, 0x00, 0x00], 'ABCD_BIG').q16_16).toBe(1)
  })

  it('calculates exact wire time and saturation without clamping', () => {
    expect(calculateWireTimeMs(33, 115200)).toBeCloseTo(3.1510416667, 10)
    const config: BusSimulationConfig = { baudRate: 9600, pollingPeriodMs: 20, slaveId: 3, registerCount: 16, requestBytes: 8, responseBytes: 41, timeoutMs: 24, faultTypes: [] }
    expect(calculateBusUtilizationPct(config)).toBeCloseTo(280.7291667, 6)
  })

  it('finds inclusive register overlaps across 32-bit ranges', () => {
    const registers: RegisterDefinition[] = [
      { name: 'A', address: 40001, width: 2, dataType: 'FLOAT32', unit: '', description: '', defaultValue: 0 },
      { name: 'B', address: 40002, width: 2, dataType: 'FLOAT32', unit: '', description: '', defaultValue: 0 },
      { name: 'C', address: 40005, width: 1, dataType: 'UINT16', unit: '', description: '', defaultValue: 0 },
    ]
    expect(findRegisterOverlaps(registers)).toHaveLength(1)
    expect(findRegisterOverlaps(registers)[0]).toMatchObject({ startAddress: 40002, endAddress: 40002 })
  })
})
