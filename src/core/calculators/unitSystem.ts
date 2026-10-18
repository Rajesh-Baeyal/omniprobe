export type Unit =
  | '1'
  | 'unitless'
  | 'ratio'
  | '%'
  | 'boolean'
  | 'text'
  | 'count'
  | 'deg'
  | 'rad'
  | 'm'
  | 'mm'
  | 'um'
  | 'px'
  | 's'
  | 'ms'
  | 'us'
  | 'm/s'
  | 'mm/s'
  | 'mm/min'
  | 'm3/s'
  | 'L/min'
  | 'mL/s'
  | 'mL'
  | 'Pa'
  | 'kPa'
  | 'bar'
  | 'N'
  | 'W'
  | 'kW'
  | 'J'
  | 'K'
  | 'Hz'
  | 'baud'
  | 'bit'
  | 'byte'
  | 'bits'
  | 'bytes'
  | 'Mbps'
  | 'g'
  | 'kg'
  | (string & {})

type UnitFamily = 'dimensionless' | 'angle' | 'length' | 'time' | 'speed' | 'flow' | 'volume' | 'pressure' | 'force' | 'power' | 'energy' | 'temperature' | 'frequency' | 'baud' | 'data' | 'mass' | 'pixel'

interface UnitDefinition {
  family: UnitFamily
  factor: number
}

export interface UnitValue {
  value: number
  unit: Unit
}

const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  '1': { family: 'dimensionless', factor: 1 },
  unitless: { family: 'dimensionless', factor: 1 },
  ratio: { family: 'dimensionless', factor: 1 },
  '%': { family: 'dimensionless', factor: 0.01 },
  count: { family: 'dimensionless', factor: 1 },
  deg: { family: 'angle', factor: Math.PI / 180 },
  rad: { family: 'angle', factor: 1 },
  m: { family: 'length', factor: 1 },
  mm: { family: 'length', factor: 0.001 },
  um: { family: 'length', factor: 0.000001 },
  px: { family: 'pixel', factor: 1 },
  s: { family: 'time', factor: 1 },
  ms: { family: 'time', factor: 0.001 },
  us: { family: 'time', factor: 0.000001 },
  'm/s': { family: 'speed', factor: 1 },
  'mm/s': { family: 'speed', factor: 0.001 },
  'mm/min': { family: 'speed', factor: 0.001 / 60 },
  'm3/s': { family: 'flow', factor: 1 },
  'L/min': { family: 'flow', factor: 0.001 / 60 },
  'mL/s': { family: 'flow', factor: 0.000001 },
  mL: { family: 'volume', factor: 0.000001 },
  Pa: { family: 'pressure', factor: 1 },
  kPa: { family: 'pressure', factor: 1000 },
  bar: { family: 'pressure', factor: 100000 },
  N: { family: 'force', factor: 1 },
  W: { family: 'power', factor: 1 },
  kW: { family: 'power', factor: 1000 },
  J: { family: 'energy', factor: 1 },
  K: { family: 'temperature', factor: 1 },
  Hz: { family: 'frequency', factor: 1 },
  baud: { family: 'baud', factor: 1 },
  bit: { family: 'data', factor: 1 },
  bits: { family: 'data', factor: 1 },
  byte: { family: 'data', factor: 8 },
  bytes: { family: 'data', factor: 8 },
  Mbps: { family: 'data', factor: 1_000_000 },
  g: { family: 'mass', factor: 0.001 },
  kg: { family: 'mass', factor: 1 },
}

const definitionFor = (unit: Unit): UnitDefinition => {
  const definition = UNIT_DEFINITIONS[unit]
  if (!definition) throw new Error(`Unknown unit: ${unit}`)
  return definition
}

export function convertUnit(value: number, from: Unit, to: Unit): number
export function convertUnit(value: UnitValue, to: Unit): UnitValue
export function convertUnit(value: number | UnitValue, fromOrTo: Unit, maybeTo?: Unit): number | UnitValue {
  const from = typeof value === 'number' ? fromOrTo : value.unit
  const to = typeof value === 'number' ? maybeTo : fromOrTo
  if (!to) throw new Error('A target unit is required.')
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Unit values must be finite.')
  if (typeof value !== 'number' && !Number.isFinite(value.value)) throw new Error('Unit values must be finite.')

  const fromDefinition = definitionFor(from)
  const toDefinition = definitionFor(to)
  if (fromDefinition.family !== toDefinition.family) {
    throw new Error(`Cannot convert incompatible units: ${from} to ${to}`)
  }

  const numericValue = typeof value === 'number' ? value : value.value
  const converted = numericValue * fromDefinition.factor / toDefinition.factor
  return typeof value === 'number' ? converted : { value: converted, unit: to }
}

export const isKnownUnit = (unit: string): unit is Unit => Boolean(UNIT_DEFINITIONS[unit])

export const unitFamily = (unit: Unit): UnitFamily => definitionFor(unit).family
