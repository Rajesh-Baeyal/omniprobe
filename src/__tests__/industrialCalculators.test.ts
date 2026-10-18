import { describe, expect, it } from 'vitest'
import {
  CALCULATOR_IDS,
  evaluateCalculator,
  listCalculatorModels,
} from '../core/calculators/industrialCalculators'
import { convertUnit } from '../core/calculators/unitSystem'

describe('industrial calculator catalog', () => {
  it('lists every planned calculator model', () => {
    expect(listCalculatorModels().map((model) => model.id)).toEqual(CALCULATOR_IDS)
    expect(CALCULATOR_IDS).toHaveLength(18)
  })

  it('converts compatible engineering units deterministically', () => {
    expect(convertUnit(1, 'm', 'mm')).toBe(1000)
    expect(convertUnit(1, 'bar', 'Pa')).toBe(100000)
    expect(convertUnit(1, 'L/min', 'm3/s')).toBeCloseTo(1 / 60000, 12)
    expect(() => convertUnit(1, 'm', 's')).toThrow('incompatible')
  })

  it('returns a complete educational result envelope', () => {
    const result = evaluateCalculator('dispensing_dose', {
      flowRateMlPerS: 2,
      durationS: 3,
    })

    expect(result.status).toBe('valid')
    expect(result.outputs.volumeMl).toEqual({ value: 6, unit: 'mL' })
    expect(result.assumptions.length).toBeGreaterThan(0)
    expect(result.provenance.executionMode).toBe('SIMULATED')
    expect(result.provenance.authority).toBe('READ_ONLY')
    expect(result.modelVersion).toMatch(/^industrial-calculator\//)
    expect(result.validationRange.flowRateMlPerS).toBeDefined()
    expect(result.safetyClass).toBe('educational')
  })

  it('calculates asynchronous serial wire time from framing bits', () => {
    const result = evaluateCalculator('serial_wire_time', {
      byteCount: 10,
      baudRate: 9600,
      dataBits: 8,
      parityBits: 0,
      stopBits: 1,
      turnaroundMs: 0,
    })

    expect(result.outputs.wireTimeMs.value).toBeCloseTo(10.4166667, 6)
    expect(result.outputs.totalBits.value).toBe(100)
    expect(result.outputs.wireTimeMs.unit).toBe('ms')
  })

  it('computes a rotated and translated 2D coordinate', () => {
    const result = evaluateCalculator('coordinate_transform_2d', {
      x: 10,
      y: 0,
      translationX: 5,
      translationY: 2,
      rotationDeg: 90,
      scale: 1,
    })

    expect(result.outputs.transformedX.value).toBeCloseTo(5, 10)
    expect(result.outputs.transformedY.value).toBeCloseTo(12, 10)
  })

  it('keeps normal OEE components within percentage bounds', () => {
    const result = evaluateCalculator('cycle_time_oee', {
      idealCycleTimeS: 1,
      plannedTimeMin: 60,
      downtimeMin: 6,
      totalCount: 3000,
      goodCount: 2940,
    })

    expect(result.status).toBe('valid')
    expect(result.outputs.availabilityPct.value).toBeCloseTo(90, 10)
    expect(result.outputs.qualityPct.value).toBeCloseTo(98, 10)
    expect(result.outputs.oeePct.value).toBeGreaterThan(0)
    expect(result.outputs.oeePct.value).toBeLessThanOrEqual(100)
  })

  it('classifies an unreachable two-link target without producing unsafe motion advice', () => {
    const result = evaluateCalculator('robot_2link_fk_ik', {
      link1: 100,
      link2: 75,
      theta1Deg: 0,
      theta2Deg: 0,
      targetX: 200,
      targetY: 0,
    })

    expect(result.status).toBe('out-of-range')
    expect(result.outputs.reachable.value).toBe(false)
    expect(result.safetyClass).toBe('educational')
    expect(result.warnings.join(' ')).toMatch(/reach|motion/i)
  })

  it('calculates camera exposure blur and affine calibration residual', () => {
    const blur = evaluateCalculator('exposure_blur', {
      objectSpeedMmPerS: 1000,
      exposureMs: 0.5,
      pixelPitchUm: 5,
    })
    const calibration = evaluateCalculator('affine_calibration', {
      pixelX: 2,
      pixelY: 3,
      a11: 1,
      a12: 0,
      a21: 0,
      a22: 1,
      offsetX: 10,
      offsetY: 20,
      observedX: 12,
      observedY: 23,
    })

    expect(blur.outputs.blurMm).toEqual({ value: 0.5, unit: 'mm' })
    expect(blur.outputs.blurPixels.value).toBe(100)
    expect(calibration.outputs.residualMm.value).toBeCloseTo(0, 10)
  })

  it('rejects missing and physically invalid inputs with explicit statuses', () => {
    expect(evaluateCalculator('dispensing_dose', { durationS: 1 }).status).toBe('insufficient-inputs')

    const invalid = evaluateCalculator('dispensing_dose', {
      flowRateMlPerS: -1,
      durationS: 1,
    })

    expect(invalid.status).toBe('out-of-range')
    expect(invalid.errors.join(' ')).toMatch(/flow/i)
  })

  it('returns identical results for identical inputs', () => {
    const inputs = { payloadBytes: 256, linkRateMbps: 100, roundTripMs: 2, processingMs: 0.5 }
    expect(evaluateCalculator('tcp_udp_timing', inputs)).toEqual(evaluateCalculator('tcp_udp_timing', inputs))
  })
})
