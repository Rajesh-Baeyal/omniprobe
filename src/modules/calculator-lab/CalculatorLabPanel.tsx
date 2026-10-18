import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  evaluateCalculator,
  listCalculatorModels,
  type CalculatorCategory,
  type CalculatorId,
  type CalculatorInput,
  type CalculatorModel,
  type CalculatorResult,
} from '../../core/calculators/industrialCalculators'

const models = listCalculatorModels()
const categories = Array.from(new Set(models.map((model) => model.category))) as CalculatorCategory[]
const categoryLabels: Record<CalculatorCategory, string> = {
  motion: 'Motion',
  controls: 'Controls',
  communications: 'Communications',
  process: 'Process',
  vision: 'Vision',
  quality: 'Quality',
}

const formatValue = (value: number | boolean | string): string => {
  if (typeof value === 'boolean') return value ? 'YES' : 'NO'
  if (typeof value === 'string') return value
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: 5 })
}

const formatRange = (model: CalculatorModel, key: string): string => {
  const range = model.validationRange[key]
  if (!range) return 'model-defined'
  const min = range.min === undefined ? '−∞' : range.min.toString()
  const max = range.max === undefined ? '∞' : range.max.toString()
  return `${min} … ${max} ${range.unit}`
}

const initialValues = (model: CalculatorModel): Record<string, string> => Object.fromEntries(
  model.inputDefinitions.map((definition) => [definition.key, String(definition.exampleValue)]),
)

const statusClass: Record<CalculatorResult['status'], string> = {
  valid: 'border-lime/40 bg-lime/10 text-lime',
  'valid-with-assumptions': 'border-cyan/40 bg-cyan/10 text-cyan',
  'out-of-range': 'border-amber/50 bg-amber/10 text-amber',
  'insufficient-inputs': 'border-amber/50 bg-amber/10 text-amber',
  'domain-review-required': 'border-danger/50 bg-danger/10 text-danger',
}

export interface CalculatorLabPanelProps {
  initialCalculatorId?: CalculatorId
}

export function CalculatorLabPanel({ initialCalculatorId }: CalculatorLabPanelProps) {
  const initialModel = models.find((model) => model.id === initialCalculatorId) ?? models[0]
  const [category, setCategory] = useState<CalculatorCategory>(initialModel.category)
  const [calculatorId, setCalculatorId] = useState<CalculatorId>(initialModel.id)
  const visibleModels = useMemo(() => models.filter((model) => model.category === category), [category])
  const selectedModel = visibleModels.find((model) => model.id === calculatorId) ?? visibleModels[0]
  const [rawInputs, setRawInputs] = useState<Record<string, string>>(() => initialValues(selectedModel))

  useEffect(() => {
    if (selectedModel.id !== calculatorId) setCalculatorId(selectedModel.id)
  }, [calculatorId, selectedModel])

  useEffect(() => {
    setRawInputs(initialValues(selectedModel))
  }, [selectedModel.id])

  const parsedInputs = useMemo<CalculatorInput>(() => Object.entries(rawInputs).reduce<Record<string, number>>((inputs, [key, rawValue]) => {
    if (rawValue.trim() !== '') inputs[key] = Number(rawValue)
    return inputs
  }, {}), [rawInputs])

  const result = useMemo(() => evaluateCalculator(selectedModel.id, parsedInputs), [parsedInputs, selectedModel.id])

  const chooseCategory = (nextCategory: CalculatorCategory) => {
    const nextModel = models.find((model) => model.category === nextCategory)
    if (!nextModel) return
    setCategory(nextCategory)
    setCalculatorId(nextModel.id)
  }

  const chooseModel = (event: ChangeEvent<HTMLSelectElement>) => setCalculatorId(event.target.value as CalculatorId)

  return (
    <section className="instrument-panel panel-grid min-w-0 overflow-hidden rounded-sm" aria-labelledby="calculator-lab-title">
      <div className="border-b border-line bg-panel/80 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow text-cyan">CALCULATOR LAB / DETERMINISTIC MODELS</p>
            <h2 id="calculator-lab-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-100">Industrial estimation workbench</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Pure, unit-aware model cards for learning and early design exploration. Results are reproducible and read-only.</p>
          </div>
          <div className="border border-amber/40 bg-amber/5 px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[.14em] text-amber">
            Educational estimate
            <span className="mt-1 block text-[9px] text-slate-500">Not for commissioning or safety decisions</span>
          </div>
        </div>
      </div>

      <div className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex flex-wrap gap-2" aria-label="Calculator categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => chooseCategory(item)}
              className={`min-h-9 rounded-sm border px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] transition focus:outline-none focus:ring-2 focus:ring-cyan/70 ${category === item ? 'border-cyan/60 bg-cyan/10 text-cyan' : 'border-line bg-ink/30 text-slate-500 hover:border-cyan/40 hover:text-slate-200'}`}
              aria-pressed={category === item}
            >
              {categoryLabels[item]}
            </button>
          ))}
        </div>
        <label className="mt-4 grid max-w-xl gap-2">
          <span className="eyebrow">Model card</span>
          <select
            aria-label="Calculator model"
            value={selectedModel.id}
            onChange={chooseModel}
            className="border border-line bg-ink px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan/60 focus:ring-2 focus:ring-cyan/30"
          >
            {visibleModels.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.id}</option>)}
          </select>
        </label>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{selectedModel.shortDescription}</p>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
        <div className="border-b border-line px-5 py-5 xl:border-b-0 xl:border-r sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Inputs</p>
              <p className="mt-1 text-xs text-slate-500">Change values to recalculate locally.</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-600">18 model cards</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedModel.inputDefinitions.map((definition) => (
              <label key={definition.key} className="grid gap-1.5">
                <span className="flex items-baseline justify-between gap-2 text-xs font-semibold text-slate-300">
                  <span>{definition.label}</span>
                  <span className="font-mono text-[10px] font-normal text-cyan">{definition.unit}</span>
                </span>
                <input
                  aria-label={definition.label}
                  type="number"
                  inputMode="decimal"
                  value={rawInputs[definition.key] ?? ''}
                  onChange={(event) => setRawInputs((current) => ({ ...current, [definition.key]: event.target.value }))}
                  min={definition.min}
                  max={definition.max}
                  step={definition.step ?? 'any'}
                  className="w-full border border-line bg-ink/70 px-3 py-2 font-mono text-sm tabular-nums text-slate-100 outline-none transition focus:border-cyan/60 focus:ring-2 focus:ring-cyan/30"
                />
                <span className="text-[10px] leading-4 text-slate-600">{definition.description} · range {formatRange(selectedModel, definition.key)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="min-w-0 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Result</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-100">{selectedModel.name}</h3>
            </div>
            <span className={`rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[.12em] ${statusClass[result.status]}`}>{result.status.replaceAll('-', ' ')}</span>
          </div>

          {result.errors.length > 0 && <div className="mt-4 border border-danger/40 bg-danger/5 px-3 py-3 text-xs leading-5 text-danger" role="alert">{result.errors.join(' ')}</div>}

          <div className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2">
            {Object.entries(result.outputs).map(([key, item]) => {
              const definition = selectedModel.outputDefinitions.find((candidate) => candidate.key === key)
              return (
                <div key={key} className="bg-panel px-3 py-3">
                  <p className="eyebrow">{definition?.label ?? key}</p>
                  <p className="mt-1 font-mono text-xl tabular-nums text-slate-100">{formatValue(item.value)} <span className="text-xs text-cyan">{item.unit}</span></p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-600">{definition?.description}</p>
                </div>
              )
            })}
            {Object.keys(result.outputs).length === 0 && <div className="bg-panel px-3 py-5 text-sm text-slate-500 sm:col-span-2">Enter the required inputs to produce a result.</div>}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-line bg-ink/30 px-3 py-3 sm:col-span-2">
              <p className="eyebrow">Formula</p>
              <p className="mt-2 font-mono text-xs leading-5 text-cyan">{selectedModel.formula}</p>
            </div>
            <div className="border border-line bg-ink/30 px-3 py-3 sm:col-span-2">
              <p className="eyebrow">Assumptions</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
                {result.assumptions.map((assumption) => <li key={assumption}>· {assumption}</li>)}
              </ul>
              {result.warnings.length > 0 && <p className="mt-3 text-xs leading-5 text-amber">{result.warnings.join(' ')}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 border-t border-line lg:grid-cols-[1fr_1fr]">
        <div className="border-b border-line px-5 py-4 lg:border-b-0 lg:border-r sm:px-6">
          <p className="eyebrow">Worked example</p>
          <p className="mt-2 text-sm font-semibold text-slate-200">{selectedModel.workedExample.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Expected: {selectedModel.workedExample.expected}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(selectedModel.workedExample.inputs).map(([key, value]) => <span key={key} className="rounded-sm border border-line px-2 py-1 font-mono text-[10px] text-slate-400">{key}={value === undefined ? '—' : typeof value === 'number' ? value : value.value}</span>)}
          </div>
        </div>
        <div className="px-5 py-4 sm:px-6">
          <p className="eyebrow">Provenance</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <span className="text-slate-500">Mode <strong className="ml-1 font-mono text-cyan">{result.provenance.executionMode}</strong></span>
            <span className="text-slate-500">Authority <strong className="ml-1 font-mono text-lime">{result.provenance.authority}</strong></span>
            <span className="text-slate-500">Safety <strong className="ml-1 font-mono text-amber">{result.safetyClass}</strong></span>
            <span className="text-slate-500">Version <strong className="ml-1 font-mono text-slate-300">{result.modelVersion}</strong></span>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-slate-600">{result.provenance.source} · {result.provenance.sourceRefs.join(' · ')}</p>
        </div>
      </div>
    </section>
  )
}

export default CalculatorLabPanel
