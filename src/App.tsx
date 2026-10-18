import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Aperture,
  ArrowUpRight,
  Box,
  Cable,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Cpu,
  Gauge,
  Radio,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  Waves,
  Zap,
} from 'lucide-react'
import { createModuleRegistry } from './core/workbench/moduleRegistry'
import { CalculatorLabPanel } from './modules/calculator-lab/CalculatorLabPanel'
import { industrialPresets } from './presets/industrialPresets'
import { CommissioningDoctorPanel } from './modules/commissioning-doctor/CommissioningDoctorPanel'
import { FrameStudioPanel } from './modules/frame-studio/FrameStudioPanel'
import { LogicScopePanel } from './modules/logic-scope/LogicScopePanel'
import { RegisterMatrixPanel } from './modules/register-matrix/RegisterMatrixPanel'
import { RecipeManagerPanel } from './modules/recipe-manager/RecipeManagerPanel'
import { LearningStudioPanel } from './modules/learning-studio/LearningStudioPanel'
import { VirtualBusPanel } from './modules/virtual-bus/VirtualBusPanel'
import { getTermInContext, listTerms } from './core/learning/terminology'
import { useWorkspaceStore, workspaceStore } from './state/workspaceStore'

type ViewId = 'command' | 'frame' | 'matrix' | 'bus' | 'scope' | 'doctor' | 'learning' | 'calculators' | 'recipes' | 'traces' | 'terminology' | 'safety'

const navigation: { id: ViewId; label: string; short: string; icon: typeof Activity }[] = [
  { id: 'command', label: 'Command Center', short: 'CC', icon: TerminalSquare },
  { id: 'frame', label: 'Frame Studio', short: 'FS', icon: Cable },
  { id: 'matrix', label: 'Register Matrix', short: 'RM', icon: Box },
  { id: 'bus', label: 'Virtual Bus', short: 'VB', icon: Radio },
  { id: 'scope', label: 'Logic Scope', short: 'LS', icon: Waves },
  { id: 'doctor', label: 'Commissioning Doctor', short: 'CD', icon: ShieldCheck },
  { id: 'learning', label: 'Learning Studio', short: 'LEARN', icon: CheckCircle2 },
  { id: 'calculators', label: 'Calculator Lab', short: 'CALC', icon: Gauge },
  { id: 'recipes', label: 'Recipe Manager', short: 'RECIPE', icon: Box },
  { id: 'traces', label: 'Trace Replay', short: 'TRACE', icon: RefreshCw },
  { id: 'terminology', label: 'Terminology', short: 'TERMS', icon: Activity },
  { id: 'safety', label: 'Safety & Cyber', short: 'SAFE', icon: ShieldCheck },
]

const workbenchRegistry = createModuleRegistry()
const moduleForView: Record<ViewId, string> = {
  command: 'protocol-inspector', frame: 'protocol-inspector', matrix: 'protocol-inspector', bus: 'serial-modbus',
  scope: 'protocol-inspector', doctor: 'ot-safety-cyber', learning: 'learning-studio', calculators: 'calculator-lab',
  recipes: 'recipe-manager', traces: 'trace-replay', terminology: 'terminology', safety: 'ot-safety-cyber',
}

const format = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : '—'

function App() {
  const workspace = useWorkspaceStore()
  const [view, setView] = useState<ViewId>('command')
  const [presetId, setPresetId] = useState(workspace.activePreset.id)
  const activePreset = industrialPresets.find((preset) => preset.id === presetId) ?? workspace.activePreset
  const latest = workspace.telemetry.at(-1)
  const criticalCount = useMemo(() => {
    if (!latest) return 0
    return latest.busUtilizationPct > 65 ? 1 : 0
  }, [latest])

  const selectPreset = (id: string) => {
    const preset = industrialPresets.find((candidate) => candidate.id === id)
    if (!preset) return
    setPresetId(id)
    workspaceStore.setPreset(preset)
  }

  const renderView = () => {
    if (view === 'frame') return <FrameStudioPanel initialBaudRate={activePreset.simulation.baudRate} />
    if (view === 'matrix') return <RegisterMatrixPanel activePreset={activePreset} />
    if (view === 'bus') return <VirtualBusPanel config={activePreset.simulation} defaultInterlockWord={activePreset.defaultInterlockWord} />
    if (view === 'scope') return <LogicScopePanel />
    if (view === 'doctor') return <CommissioningDoctorPanel preset={activePreset} telemetry={workspace.telemetry} onPresetRemediated={(preset) => { workspaceStore.setPreset(preset); setPresetId(preset.id) }} />
    if (view === 'learning') return <LearningStudioPanel />
    if (view === 'calculators') return <CalculatorLabPanel />
    if (view === 'recipes') return <RecipeManagerPanel />
    if (view === 'traces') return <TraceReplayPanel frameCount={workspace.frameLog.length} sequence={workspace.sequence} />
    if (view === 'terminology') return <TerminologyPanel />
    if (view === 'safety') return <SafetyPanel />

    return (
      <div className="grid gap-4 xl:grid-cols-[1.45fr_.85fr]">
        <div className="min-w-0">
          <LogicScopePanel />
        </div>
        <div className="min-w-0">
          <FrameStudioPanel initialBaudRate={activePreset.simulation.baudRate} />
        </div>
        <div className="min-w-0 xl:col-span-2">
          <VirtualBusPanel config={activePreset.simulation} defaultInterlockWord={activePreset.defaultInterlockWord} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink text-slate-200">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3 pr-4 lg:border-r lg:border-line">
            <div className="grid h-9 w-9 place-items-center border border-cyan/50 bg-cyan/10 text-cyan shadow-[0_0_18px_rgba(97,231,255,.08)]"><Aperture size={20} /></div>
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[.2em] text-slate-100">OMNIPROBE</div>
              <div className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-500">Unified protocol diagnostics</div>
            </div>
          </div>
          <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
            <span className="eyebrow">ACTIVE TARGET</span>
            <select aria-label="Active industrial preset" value={presetId} onChange={(event) => selectPreset(event.target.value)} className="max-w-[330px] truncate border-0 bg-transparent py-1 font-mono text-xs text-cyan outline-none">
              {industrialPresets.map((preset) => <option key={preset.id} value={preset.id} className="bg-ink">{preset.shortName} · {preset.protocol}</option>)}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-4 font-mono text-[10px] uppercase tracking-[.12em]">
            <span className="hidden items-center gap-2 text-slate-500 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_7px_#b8f36b]" /> SIM ONLINE</span>
            <span className="hidden text-slate-500 lg:inline">50 Hz / DETERMINISTIC</span>
            <button type="button" onClick={() => workspaceStore.toggleRunning()} className="inline-flex items-center gap-2 border border-line px-2.5 py-1.5 text-slate-300 transition hover:border-cyan/60 hover:text-cyan" aria-label={workspace.isRunning ? 'Pause simulation' : 'Resume simulation'}>
              {workspace.isRunning ? <CirclePause size={13} /> : <CirclePlay size={13} />}{workspace.isRunning ? 'PAUSE' : 'RUN'}
            </button>
          </div>
        </div>
        <div className="border-t border-line bg-panel/50">
          <div className="mx-auto flex max-w-[1800px] items-center gap-1 overflow-x-auto px-4 lg:px-6">
            {navigation.map(({ id, label, short, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setView(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[.12em] transition ${view === id ? 'border-cyan bg-cyan/5 text-cyan' : 'border-transparent text-slate-500 hover:text-slate-200'}`}>
                <Icon size={13} /><span className="hidden sm:inline">{label}</span><span className="sm:hidden">{short}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-[#09151d]">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 font-mono text-[10px] uppercase tracking-[.12em] lg:px-6">
          <span className="text-lime">SIMULATED</span>
          <span className="text-slate-600">·</span>
          <span className="text-lime">READ ONLY</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">SOURCE: DETERMINISTIC FIXTURE</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">CONTRACT: workbench.v1</span>
          <span className="ml-auto text-slate-600">MODULE: {workbenchRegistry.get(moduleForView[view])?.moduleId ?? 'unknown'}</span>
        </div>
      </div>

      <main className="panel-grid mx-auto max-w-[1800px] px-4 py-5 lg:px-6 lg:py-7">
        <section className="mb-5 grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-5">
          <TelemetryItem icon={Gauge} label="BUS UTILIZATION" value={`${format(latest?.busUtilizationPct ?? activePreset.expectedUtilizationPct)}%`} tone={(latest?.busUtilizationPct ?? activePreset.expectedUtilizationPct) > 65 ? 'danger' : 'cyan'} detail={`${activePreset.simulation.baudRate.toLocaleString()} baud`} />
          <TelemetryItem icon={Activity} label="CHAMBER PRESSURE" value={`${format(latest?.pressure_mTorr ?? 18.4, 2)}`} unit="mTorr" tone="cyan" detail="VACUUM SENSOR / A1" />
          <TelemetryItem icon={SlidersHorizontal} label="STAGE ERROR" value={`${format(latest?.stageError_nm ?? 7.2, 1)}`} unit="nm" tone="amber" detail="FOLLOWING ERROR" />
          <TelemetryItem icon={Zap} label="RF FORWARD POWER" value={`${format(latest?.rfPower_W ?? 1250, 0)}`} unit="W" tone="lime" detail="GENERATOR / A3" />
          <TelemetryItem icon={AlertTriangle} label="EVENTS / SAMPLE" value={`${workspace.frameLog.length.toString().padStart(2, '0')}`} unit={criticalCount > 0 ? 'ATTN' : 'LIVE'} tone={criticalCount > 0 ? 'danger' : 'lime'} detail={`SEQ ${workspace.sequence.toString().padStart(5, '0')}`} />
        </section>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow flex items-center gap-2"><span className="text-cyan">SYS / 01</span><ChevronRight size={11} />{view === 'command' ? 'SPLIT-VIEW' : navigation.find((item) => item.id === view)?.label.toUpperCase()}</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">{view === 'command' ? 'Command Center' : navigation.find((item) => item.id === view)?.label}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{activePreset.name} <span className="px-1 text-line">/</span> {activePreset.description}</p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-slate-600"><span className="inline-flex items-center gap-1.5"><RefreshCw size={12} className={workspace.isRunning ? 'animate-spin' : ''} /> Ring buffer {workspace.telemetry.length} / 1000</span><ArrowUpRight size={13} /></div>
        </div>

        {renderView()}

        <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[.12em] text-slate-600">
          <span>OMNIPROBE / INDUSTRIAL & EDGE PROTOCOL DIAGNOSTIC SUITE</span>
          <span className="inline-flex items-center gap-2"><Cpu size={12} /> local deterministic simulation · no hardware required</span>
        </footer>
      </main>
    </div>
  )
}

function TraceReplayPanel({ frameCount, sequence }: { frameCount: number; sequence: number }) {
  return (
    <section className="instrument-panel panel-grid p-5 text-slate-100" aria-label="Trace replay">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div><p className="eyebrow text-cyan">TRACE REPLAY / DETERMINISTIC EVIDENCE</p><h2 className="mt-2 text-xl font-semibold">Inspect, pause, branch</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">The replay core stores raw, decoded, semantic, timeline, learner, recipe, and fault context without opening a device connection.</p></div>
        <span className="border border-lime/30 bg-lime/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-lime">SIMULATED · READ ONLY</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <InfoMetric label="Captured fixture events" value={String(frameCount)} />
        <InfoMetric label="Current sequence" value={String(sequence).padStart(5, '0')} />
        <InfoMetric label="Replay controls" value="PAUSE · STEP · SEEK · BRANCH" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="border border-line bg-ink/40 p-4"><p className="eyebrow">Trace contract</p><ul className="mt-3 space-y-2 text-sm text-slate-400"><li>• Canonical content hash and schema version</li><li>• Virtual time, seed, fault profile, and source identity</li><li>• Recipe revision and calibration lineage</li><li>• Credential/private-key redaction before export</li></ul></div>
        <div className="border border-line bg-ink/40 p-4"><p className="eyebrow">Next safe action</p><p className="mt-3 text-sm leading-6 text-slate-400">Open Frame Studio or Virtual Bus, create a deterministic fault trace, then use this view to compare the original and changed-variable branches.</p></div>
      </div>
    </section>
  )
}

function TerminologyPanel() {
  const [query, setQuery] = useState('')
  const terms = listTerms().filter((term) => `${term.label} ${term.definition} ${term.aliases.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <section className="instrument-panel panel-grid p-5 text-slate-100" aria-label="Terminology">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4"><div><p className="eyebrow text-cyan">TERMINOLOGY / IN CONTEXT</p><h2 className="mt-2 text-xl font-semibold">Learn the words where decisions happen</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Terms are connected to domains, examples, aliases, and safety notes instead of being a glossary dump.</p></div><span className="border border-cyan/30 bg-cyan/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-cyan">REVIEWED FIXTURES</span></div>
      <input aria-label="Search terminology" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search PLC, CRC, pose, calibration..." className="mt-5 w-full border border-line bg-ink/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan" />
      <div className="mt-4 grid gap-3 md:grid-cols-2">{terms.map((term) => { const contextual = getTermInContext(term.termId, term.domain); return <article key={term.termId} className="border border-line bg-ink/40 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-medium text-cyan">{term.label}</h3><span className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-600">{term.domain}</span></div><p className="mt-2 text-sm text-slate-300">{contextual?.contextualDefinition ?? term.definition}</p><p className="mt-2 text-xs leading-5 text-slate-500">{term.plainLanguage}</p>{term.safetyNote && <p className="mt-3 border-l-2 border-amber/50 pl-2 text-xs text-amber">Boundary: {term.safetyNote}</p>}<div className="mt-3 font-mono text-[10px] text-slate-600">Example: {term.examples[0]}</div></article> })}</div>
    </section>
  )
}

function SafetyPanel() {
  return (
    <section className="instrument-panel panel-grid p-5 text-slate-100" aria-label="Safety and cybersecurity boundaries">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4"><div><p className="eyebrow flex items-center gap-2 text-danger"><ShieldCheck size={13} /> SAFETY & CYBER / DEFENSIVE LEARNING</p><h2 className="mt-2 text-xl font-semibold">Useful diagnostics with honest limits</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">OmniProbe teaches and simulates reasoning. It never replaces a machine-specific risk assessment, LOTO procedure, safety validation, cybersecurity authorization, or qualified review.</p></div><span className="border border-danger/30 bg-danger/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-danger">NO LIVE ACTUATION</span></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2"><SafetyCard title="Allowed in offline mode" items={['Synthetic faults and traces', 'Read-only protocol inspection', 'Least-privilege and zone/conduit exercises', 'Recipe lineage and evidence review', 'Safety-boundary terminology and scenarios']} tone="lime" /><SafetyCard title="Blocked by design" items={['Physical output energization', 'Robot or axis motion', 'E-stop or guard testing', 'Production network scanning', 'Credential guessing, fuzzing, flooding, or exploit execution']} tone="danger" /></div>
      <p className="mt-5 border border-amber/30 bg-amber/5 px-4 py-3 text-xs leading-6 text-amber">This document records observations from an OmniProbe educational simulation. It is not a machine-specific risk assessment, lockout/tagout procedure, safety validation, SIL/PL determination, cybersecurity authorization, conformity assessment, commissioning certificate, or approval to operate, service, modify, or connect to equipment.</p>
    </section>
  )
}

function SafetyCard({ title, items, tone }: { title: string; items: string[]; tone: 'lime' | 'danger' }) {
  return <div className={`border p-4 ${tone === 'lime' ? 'border-lime/30 bg-lime/5' : 'border-danger/30 bg-danger/5'}`}><h3 className={`font-medium ${tone === 'lime' ? 'text-lime' : 'text-danger'}`}>{title}</h3><ul className="mt-3 space-y-2 text-sm text-slate-400">{items.map((item) => <li key={item}>• {item}</li>)}</ul></div>
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return <div className="border border-line bg-ink/40 p-4"><p className="eyebrow">{label}</p><p className="mt-2 font-mono text-sm text-cyan">{value}</p></div>
}

function TelemetryItem({ icon: Icon, label, value, unit, detail, tone }: { icon: typeof Activity; label: string; value: string; unit?: string; detail: string; tone: 'cyan' | 'lime' | 'amber' | 'danger' }) {
  const color = { cyan: 'text-cyan', lime: 'text-lime', amber: 'text-amber', danger: 'text-danger' }[tone]
  return <div className="bg-panel px-4 py-3"><div className="flex items-center justify-between"><span className="eyebrow">{label}</span><Icon size={13} className={color} /></div><div className="mt-1 font-mono text-xl tabular-nums text-slate-100">{value}<span className={`ml-1 text-xs ${color}`}>{unit}</span></div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-slate-600">{detail}</div></div>
}

export default App
