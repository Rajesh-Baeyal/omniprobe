import { useMemo, useState, type ChangeEvent } from 'react'
import {
  createDraftRecipe,
  diffRecipes,
  reviseRecipe,
  rollbackTarget,
  transitionRecipe,
  validateRecipeForRun,
  type RecipeParameter,
  type RecipeRevision,
  type RecipeStatus,
} from '../../core/recipes/recipeModel'

export interface RecipeManagerPanelProps {
  initialRevision?: RecipeRevision
  revisions?: readonly RecipeRevision[]
  compareTo?: RecipeRevision
  onRevisionChange?: (revision: RecipeRevision) => void
  className?: string
}

const defaultRevision = createDraftRecipe({
  recipeId: 'offline-demo',
  name: 'Offline demo recipe',
  product: 'DEMO-01',
  machine: 'Virtual cell',
  station: 'Simulation',
  parameters: [
    { key: 'temperature', label: 'Temperature', kind: 'numeric', value: 180, unit: '°C', safetyCritical: true },
    { key: 'dwellTime', label: 'Dwell time', kind: 'numeric', value: 2.5, unit: 's' },
    { key: 'mode', label: 'Mode', kind: 'enum', value: 'standard', allowedValues: ['standard', 'reduced'] },
  ],
  calibrationIds: ['fixture-calibration'],
  calibrationReferences: [{ calibrationId: 'fixture-calibration', status: 'valid' }],
  provenance: { createdBy: 'offline-demo', sourceRefs: ['fixture:recipe-manager'] },
}, { revisionId: 'offline-demo-r1' })

const statusTone: Record<RecipeStatus, string> = {
  draft: 'border-slate-500/50 bg-slate-500/10 text-slate-300',
  reviewed: 'border-cyan/50 bg-cyan/10 text-cyan',
  approved: 'border-lime/50 bg-lime/10 text-lime',
  effective: 'border-lime/60 bg-lime/15 text-lime',
  retired: 'border-amber/50 bg-amber/10 text-amber',
}

const nextStatus: Partial<Record<RecipeStatus, RecipeStatus>> = {
  draft: 'reviewed',
  reviewed: 'approved',
  approved: 'effective',
  effective: 'retired',
}

const formatValue = (value: RecipeParameter['value']): string => value === undefined || value === null ? '—' : String(value)

export function RecipeManagerPanel({
  initialRevision,
  revisions = [],
  compareTo,
  onRevisionChange,
  className = '',
}: RecipeManagerPanelProps) {
  const [revision, setRevision] = useState<RecipeRevision>(initialRevision ?? defaultRevision)
  const [actionError, setActionError] = useState<string | null>(null)
  const validation = useMemo(() => validateRecipeForRun(revision), [revision])
  const parent = compareTo ?? revisions.find((candidate) => candidate.revisionId === revision.parentRevisionId)
  const diff = parent ? diffRecipes(parent, revision) : undefined
  const target = rollbackTarget(revisions.length > 0 ? revisions : [revision], revision.revisionId)
  const transition = nextStatus[revision.status]

  const applyRevision = (next: RecipeRevision) => {
    setRevision(next)
    setActionError(null)
    onRevisionChange?.(next)
  }

  const updateParameter = (parameter: RecipeParameter, event: ChangeEvent<HTMLInputElement>) => {
    if (revision.status !== 'draft' || parameter.safetyCritical) return
    const value = parameter.kind === 'numeric' ? Number(event.target.value) : event.target.value
    applyRevision(reviseRecipe(revision, {
      parameters: revision.parameters.map((candidate) => candidate.key === parameter.key ? { ...candidate, value } : candidate),
    }))
  }

  const advanceStatus = () => {
    if (!transition) return
    try {
      applyRevision(transitionRecipe(revision, transition, { actor: 'recipe-manager', at: revision.updatedAt + 1 }))
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The transition could not be applied.')
    }
  }

  return (
    <section className={`instrument-panel panel-grid min-w-0 overflow-hidden rounded-sm ${className}`} aria-labelledby="recipe-manager-title">
      <header className="border-b border-line px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-cyan">RECIPE MANAGER / IMMUTABLE LINEAGE</p>
            <h2 id="recipe-manager-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-100">Recipe Manager</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Versioned process settings with deterministic hashes, explicit review gates, and calibration evidence attached to every revision.</p>
          </div>
          <div className="border border-cyan/40 bg-cyan/5 px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[.14em] text-cyan">
            SIMULATED · READ ONLY
            <span className="mt-1 block text-[9px] text-slate-500">No live write or machine authorization</span>
          </div>
        </div>
      </header>

      <div className="grid gap-0 border-b border-line lg:grid-cols-[1.2fr_.8fr]">
        <div className="border-b border-line px-5 py-4 lg:border-b-0 lg:border-r sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <ContextValue label="Product" value={revision.product} />
            <ContextValue label="Machine" value={revision.machine} />
            <ContextValue label="Station" value={revision.station} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[.12em] ${statusTone[revision.status]}`}>{revision.status}</span>
            <span className="font-mono text-[10px] text-slate-500">{revision.revisionId}</span>
            <span className="font-mono text-[10px] text-slate-600">hash {revision.contentHash}</span>
          </div>
        </div>
        <div className="px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Governance</p>
            {transition && <button type="button" onClick={advanceStatus} className="border border-cyan/50 bg-cyan/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-cyan hover:bg-cyan/10">Move to {transition}</button>}
          </div>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div><dt className="text-slate-600">Parent revision</dt><dd className="mt-1 font-mono text-slate-300">{revision.parentRevisionId ?? '—'}</dd></div>
            <div><dt className="text-slate-600">Rollback target</dt><dd className="mt-1 font-mono text-slate-300">{target?.revisionId ?? 'none'}</dd></div>
            <div><dt className="text-slate-600">Created by</dt><dd className="mt-1 text-slate-300">{revision.provenance.createdBy ?? '—'}</dd></div>
            <div><dt className="text-slate-600">Source</dt><dd className="mt-1 truncate text-slate-300">{revision.provenance.sourceRefs.join(' · ') || '—'}</dd></div>
          </dl>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1.2fr_.8fr]">
        <div className="border-b border-line px-5 py-5 xl:border-b-0 xl:border-r sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="eyebrow">Parameters</p><p className="mt-1 text-xs text-slate-500">Draft values can be explored locally; approved lineage remains immutable.</p></div>
            {revision.status !== 'draft' && <span className="font-mono text-[10px] uppercase tracking-[.12em] text-amber">Locked snapshot</span>}
          </div>
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="border-b border-line bg-ink/40 font-mono text-[10px] uppercase tracking-[.12em] text-slate-600"><tr><th className="px-3 py-2">Parameter</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">State</th></tr></thead>
              <tbody>
                {revision.parameters.map((parameter) => {
                  const locked = revision.status !== 'draft' || parameter.safetyCritical
                  return <tr key={parameter.key} className="border-b border-line/70 last:border-b-0">
                    <td className="px-3 py-2.5"><div className="font-medium text-slate-200">{parameter.label}</div><div className="font-mono text-[10px] text-slate-600">{parameter.key}</div></td>
                    <td className="px-3 py-2.5"><input aria-label={parameter.label} type={parameter.kind === 'numeric' ? 'number' : 'text'} value={formatValue(parameter.value)} readOnly={locked} onChange={(event) => updateParameter(parameter, event)} className={`w-full border border-line bg-ink/60 px-2 py-1.5 font-mono text-xs text-slate-100 outline-none focus:border-cyan/60 ${locked ? 'cursor-not-allowed opacity-70' : ''}`} /><span className="mt-1 block font-mono text-[10px] text-cyan">{parameter.unit ?? parameter.kind}</span></td>
                    <td className="px-3 py-2.5 text-slate-500">{parameter.required === false ? 'optional' : 'required'}</td>
                    <td className="px-3 py-2.5">{parameter.safetyCritical ? <span className="font-mono text-[10px] uppercase tracking-[.1em] text-amber">safety field</span> : <span className="text-slate-600">process</span>}</td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 border-l-2 border-amber/50 bg-amber/5 px-3 py-2 text-xs leading-5 text-slate-400">Safety-sensitive parameters are locked outside the draft state. Review and approval do not arm machine writes.</p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className="eyebrow">Validation & calibration lineage</p>
          <div className={`mt-3 border px-3 py-3 text-xs ${validation.valid ? 'border-lime/40 bg-lime/5 text-lime' : 'border-amber/40 bg-amber/5 text-amber'}`}>
            {validation.valid ? 'Ready for the next review gate.' : validation.errors.join(' ')}
          </div>
          <div className="mt-4 grid gap-2">
            {revision.calibrationReferences.map((reference) => <div key={reference.calibrationId} className="flex items-center justify-between gap-3 border border-line bg-ink/30 px-3 py-2 text-xs"><span className="font-mono text-slate-300">{reference.calibrationId}</span><span className={validation.staleCalibrations.includes(reference.calibrationId) ? 'text-amber' : 'text-lime'}>{validation.staleCalibrations.includes(reference.calibrationId) ? 'STALE' : (reference.status ?? 'linked').toUpperCase()}</span></div>)}
            {revision.calibrationReferences.length === 0 && <p className="text-xs text-slate-600">No calibration references attached.</p>}
          </div>
          <div className="mt-5 border border-line bg-ink/30 px-3 py-3">
            <p className="eyebrow">Diff view</p>
            {diff ? <div className="mt-2 grid gap-2 text-xs"><div className="flex justify-between gap-3 text-slate-400"><span>Numeric changes</span><strong className="font-mono text-cyan">{diff.numericChanges.length}</strong></div><div className="flex justify-between gap-3 text-slate-400"><span>Semantic changes</span><strong className="font-mono text-amber">{diff.semanticChanges.length}</strong></div>{diff.entries.map((entry) => <div key={entry.key} className="border-l-2 border-cyan/40 pl-2 text-slate-400"><span className="font-mono text-slate-300">{entry.key}</span> · {entry.category}</div>)}</div> : <p className="mt-2 text-xs text-slate-600">Select a parent revision to inspect changes.</p>}
          </div>
          {actionError && <p className="mt-3 border border-danger/40 bg-danger/5 px-3 py-2 text-xs leading-5 text-danger" role="alert">{actionError}</p>}
        </div>
      </div>
    </section>
  )
}

function ContextValue({ label, value }: { label: string; value: string }) {
  return <div><p className="eyebrow">{label}</p><p className="mt-1 truncate text-sm font-medium text-slate-200">{value}</p></div>
}

export default RecipeManagerPanel
