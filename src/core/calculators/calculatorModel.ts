import type { Authority, ExecutionMode, SafetyClass } from '../workbench/contracts'
import { convertUnit, type Unit, type UnitValue } from './unitSystem'

export const CALCULATOR_IDS = [
  'coordinate_transform_2d',
  'robot_2link_fk_ik',
  'motion_profile',
  'path_guidance',
  'conveyor_trigger',
  'cycle_time_oee',
  'plc_scan_timing',
  'serial_wire_time',
  'tcp_udp_timing',
  'can_bus_load',
  'dispensing_dose',
  'pneumatic_force',
  'pump_power',
  'thermal_first_pass',
  'camera_fov',
  'exposure_blur',
  'affine_calibration',
  'tolerance_budget',
] as const

export type CalculatorId = typeof CALCULATOR_IDS[number]
export type CalculatorStatus = 'valid' | 'valid-with-assumptions' | 'out-of-range' | 'insufficient-inputs' | 'domain-review-required'
export type CalculatorCategory = 'motion' | 'controls' | 'communications' | 'process' | 'vision' | 'quality'

export type CalculatorInputValue = number | UnitValue
export interface CalculatorInput {
  readonly [key: string]: CalculatorInputValue | undefined
}

export type CalculatorOutputValue = number | boolean | string
export interface CalculatorQuantity {
  readonly value: CalculatorOutputValue
  readonly unit: Unit
}

export interface CalculatorInputDefinition {
  readonly key: string
  readonly label: string
  readonly unit: Unit
  readonly description: string
  readonly required?: boolean
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly exampleValue: number
}

export interface CalculatorOutputDefinition {
  readonly key: string
  readonly label: string
  readonly unit: Unit
  readonly description: string
}

export interface ValidationRange {
  readonly unit: Unit
  readonly min?: number
  readonly max?: number
  readonly description: string
}

export interface CalculatorProvenance {
  readonly source: string
  readonly sourceRefs: readonly string[]
  readonly executionMode: ExecutionMode
  readonly authority: Authority
  readonly deterministic: true
}

export interface CalculatorWorkedExample {
  readonly title: string
  readonly inputs: CalculatorInput
  readonly expected: string
}

export interface NormalizedCalculatorInput {
  readonly [key: string]: number
}

export interface CalculatorEvaluation {
  readonly outputs: Record<string, CalculatorQuantity>
  readonly status?: CalculatorStatus
  readonly warnings?: readonly string[]
  readonly assumptions?: readonly string[]
  readonly errors?: readonly string[]
}

export interface CalculatorModel {
  readonly id: CalculatorId
  readonly name: string
  readonly shortDescription: string
  readonly category: CalculatorCategory
  readonly formula: string
  readonly assumptions: readonly string[]
  readonly provenance: CalculatorProvenance
  readonly modelVersion: string
  readonly safetyClass: SafetyClass
  readonly inputDefinitions: readonly CalculatorInputDefinition[]
  readonly outputDefinitions: readonly CalculatorOutputDefinition[]
  readonly validationRange: Readonly<Record<string, ValidationRange>>
  readonly workedExample: CalculatorWorkedExample
  readonly evaluate: (inputs: NormalizedCalculatorInput) => CalculatorEvaluation
}

export interface CalculatorResult {
  readonly calculatorId: CalculatorId
  readonly modelName: string
  readonly status: CalculatorStatus
  readonly inputs: CalculatorInput
  readonly outputs: Record<string, CalculatorQuantity>
  readonly primaryOutput?: CalculatorQuantity
  readonly formula: string
  readonly assumptions: readonly string[]
  readonly warnings: readonly string[]
  readonly errors: readonly string[]
  readonly provenance: CalculatorProvenance
  readonly modelVersion: string
  readonly validationRange: Readonly<Record<string, ValidationRange>>
  readonly safetyClass: SafetyClass
}

export interface CalculatorEvaluateOptions {
  readonly provenance?: Partial<CalculatorProvenance>
}

const calculatorCatalog = new Map<CalculatorId, CalculatorModel>()

export function registerCalculatorModels(models: readonly CalculatorModel[]): void {
  models.forEach((model) => {
    if (calculatorCatalog.has(model.id)) throw new Error(`Calculator model already registered: ${model.id}`)
    calculatorCatalog.set(model.id, model)
  })
}

export function listCalculatorModels(): CalculatorModel[] {
  return Array.from(calculatorCatalog.values())
}

const resultMetadata = (model: CalculatorModel, inputs: CalculatorInput, options?: CalculatorEvaluateOptions) => ({
  calculatorId: model.id,
  modelName: model.name,
  formula: model.formula,
  assumptions: [...model.assumptions],
  warnings: [] as string[],
  errors: [] as string[],
  provenance: {
    ...model.provenance,
    ...options?.provenance,
    sourceRefs: [...(options?.provenance?.sourceRefs ?? model.provenance.sourceRefs)],
    deterministic: true as const,
  },
  modelVersion: model.modelVersion,
  validationRange: model.validationRange,
  safetyClass: model.safetyClass,
  inputs,
})

const inputValue = (value: CalculatorInputValue, definition: CalculatorInputDefinition): { value?: number; assumption?: string; error?: string } => {
  const numericValue = typeof value === 'number' ? value : value.value
  if (!Number.isFinite(numericValue)) return { error: `${definition.label} must be a finite number.` }

  if (typeof value === 'number' || value.unit === definition.unit) return { value: numericValue }

  try {
    return {
      value: convertUnit(value.value, value.unit, definition.unit),
      assumption: `${definition.label} converted from ${value.unit} to ${definition.unit}.`,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : `${definition.label} has incompatible units.` }
  }
}

export function evaluateCalculator(id: CalculatorId, inputs: CalculatorInput, options?: CalculatorEvaluateOptions): CalculatorResult {
  const model = calculatorCatalog.get(id)
  if (!model) throw new Error(`Unknown calculator model: ${id}`)

  const metadata = resultMetadata(model, inputs, options)
  const normalized: Record<string, number> = {}
  let missingInput = false

  model.inputDefinitions.forEach((definition) => {
    const rawValue = inputs[definition.key]
    if (rawValue === undefined) {
      if (definition.required !== false) {
        missingInput = true
        metadata.errors.push(`Missing required input: ${definition.label}.`)
      }
      return
    }

    const parsed = inputValue(rawValue, definition)
    if (parsed.error) {
      metadata.errors.push(parsed.error)
      return
    }
    if (parsed.value === undefined) return
    normalized[definition.key] = parsed.value
    if (parsed.assumption) metadata.assumptions.push(parsed.assumption)

    if (definition.min !== undefined && parsed.value < definition.min) metadata.errors.push(`${definition.label} must be at least ${definition.min} ${definition.unit}.`)
    if (definition.max !== undefined && parsed.value > definition.max) metadata.errors.push(`${definition.label} must be at most ${definition.max} ${definition.unit}.`)
  })

  if (metadata.errors.length > 0) {
    return {
      ...metadata,
      status: missingInput ? 'insufficient-inputs' : 'out-of-range',
      outputs: {},
    }
  }

  const evaluation = model.evaluate(normalized)
  const outputs = evaluation.outputs
  const status = evaluation.status ?? (metadata.assumptions.length > model.assumptions.length ? 'valid-with-assumptions' : 'valid')
  metadata.assumptions.push(...(evaluation.assumptions ?? []))
  metadata.warnings.push(...(evaluation.warnings ?? []))
  metadata.errors.push(...(evaluation.errors ?? []))

  return {
    ...metadata,
    status: metadata.errors.length > 0 ? 'domain-review-required' : status,
    outputs,
    primaryOutput: Object.values(outputs)[0],
  }
}
