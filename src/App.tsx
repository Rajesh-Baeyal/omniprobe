import { useState, type ComponentType } from 'react'
import {
  Activity,
  AlertTriangle,
  Aperture,
  ArrowRight,
  BookOpen,
  Box,
  Cable,
  CirclePause,
  CirclePlay,
  Cpu,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Radio,
  RefreshCw,
  ScrollText,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { createModuleRegistry } from './core/workbench/moduleRegistry'
import { getTermInContext, listTerms } from './core/learning/terminology'
import { CalculatorLabPanel } from './modules/calculator-lab/CalculatorLabPanel'
import { CommissioningDoctorPanel } from './modules/commissioning-doctor/CommissioningDoctorPanel'
import { FrameStudioPanel } from './modules/frame-studio/FrameStudioPanel'
import { LearningStudioPanel } from './modules/learning-studio/LearningStudioPanel'
import { LogicScopePanel } from './modules/logic-scope/LogicScopePanel'
import { RecipeManagerPanel } from './modules/recipe-manager/RecipeManagerPanel'
import { RegisterMatrixPanel } from './modules/register-matrix/RegisterMatrixPanel'
import { VirtualBusPanel } from './modules/virtual-bus/VirtualBusPanel'
import { industrialPresets } from './presets/industrialPresets'
import { useWorkspaceStore, workspaceStore } from './state/workspaceStore'

type ViewId = 'command' | 'frame' | 'matrix' | 'bus' | 'scope' | 'doctor' | 'learning' | 'calculators' | 'recipes' | 'traces' | 'terminology' | 'safety'
type Icon = ComponentType<LucideProps>

interface NavItem { id: ViewId; label: string; short: string; icon: Icon; module: string }
interface NavGroup { label: string; icon: Icon; items: NavItem[] }

const groups: NavGroup[] = [
  {
    label: 'Operate', icon: Settings2, items: [
      { id: 'command', label: 'Command Center', short: 'CC', icon: LayoutDashboard, module: 'protocol-inspector' },
      { id: 'frame', label: 'Frame Studio', short: 'FS', icon: Cable, module: 'protocol-inspector' },
      { id: 'matrix', label: 'Register Matrix', short: 'RM', icon: Box, module: 'protocol-inspector' },
      { id: 'bus', label: 'Virtual Bus', short: 'VB', icon: Radio, module: 'serial-modbus' },
      { id: 'scope', label: 'Logic Scope', short: 'LS', icon: Waves, module: 'protocol-inspector' },
      { id: 'doctor', label: 'Commissioning Doctor', short: 'CD', icon: ShieldAlert, module: 'ot-safety-cyber' },
    ],
  },
  {
    label: 'Learn', icon: GraduationCap, items: [
      { id: 'learning', label: 'Learning Studio', short: 'LEARN', icon: GraduationCap, module: 'learning-studio' },
      { id: 'calculators', label: 'Calculator Lab', short: 'CALC', icon: Gauge, module: 'calculator-lab' },
      { id: 'terminology', label: 'Terminology', short: 'TERMS', icon: BookOpen, module: 'terminology' },
    ],
  },
  {
    label: 'Govern', icon: ScrollText, items: [
      { id: 'recipes', label: 'Recipe Manager', short: 'RECIPE', icon: ScrollText, module: 'recipe-manager' },
      { id: 'traces', label: 'Trace Replay', short: 'TRACE', icon: RefreshCw, module: 'trace-replay' },
      { id: 'safety', label: 'Safety & Cyber', short: 'SAFE', icon: ShieldAlert, module: 'ot-safety-cyber' },
    ],
  },
]

const allItems = groups.flatMap((group) => group.items)
const registry = createModuleRegistry()
const format = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : '—'

function App() {
  const workspace = useWorkspaceStore()
  const [view, setView] = useState<ViewId>('command')
  const [presetId, setPresetId] = useState(workspace.activePreset.id)
  const [railOpen, setRailOpen] = useState(false)
  const activePreset = industrialPresets.find((preset) => preset.id === presetId) ?? workspace.activePreset
  const latest = workspace.telemetry.at(-1)
  const current = allItems.find((item) => item.id === view) ?? allItems[0]
  const saturation = latest?.busUtilizationPct ?? activePreset.expectedUtilizationPct
  const criticalCount = saturation > 65 ? 1 : 0

  const selectPreset = (id: string) => {
    const preset = industrialPresets.find((candidate) => candidate.id === id)
    if (!preset) return
    setPresetId(id)
    workspaceStore.setPreset(preset)
  }

  const navigate = (nextView: ViewId) => {
    setView(nextView)
    setRailOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    return <CommandCenter activePreset={activePreset} workspace={workspace} saturation={saturation} onNavigate={navigate} />
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to workspace</a>
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="icon-button mobile-menu-button" aria-label={railOpen ? 'Close workspace navigation' : 'Open workspace navigation'} aria-expanded={railOpen} onClick={() => setRailOpen((open) => !open)}>
            {railOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="brand-lockup">
            <div className="brand-mark"><Aperture size={19} strokeWidth={1.6} /></div>
            <div><div className="brand-name">OMNIPROBE</div><div className="brand-subtitle">Industrial diagnostics / learning workbench</div></div>
          </div>
          <div className="topbar-target">
            <span className="topbar-label">Target</span>
            <select aria-label="Active industrial preset" value={presetId} onChange={(event) => selectPreset(event.target.value)}>
              {industrialPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.shortName} · {preset.protocol}</option>)}
            </select>
          </div>
          <div className="topbar-actions">
            <span className="connection-state"><span className="status-dot status-dot-live" /> Simulator online</span>
            <button type="button" className="run-control" onClick={() => workspaceStore.toggleRunning()} aria-label={workspace.isRunning ? 'Pause simulator' : 'Resume simulator'}>
              {workspace.isRunning ? <CirclePause size={15} /> : <CirclePlay size={15} />}
              <span>{workspace.isRunning ? 'Pause' : 'Run'}</span>
            </button>
          </div>
        </div>
        <div className="mobile-view-picker">
          <label htmlFor="mobile-view">Workspace view</label>
          <select id="mobile-view" value={view} onChange={(event) => navigate(event.target.value as ViewId)}>
            {allItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className={`workspace-rail ${railOpen ? 'workspace-rail-open' : ''}`} aria-label="Workspace navigation">
          <div className="rail-caption">Workspace</div>
          {groups.map((group) => (
            <div className="rail-group" key={group.label}>
              <div className="rail-group-label"><group.icon size={13} strokeWidth={1.7} />{group.label}</div>
              <nav aria-label={`${group.label} tools`}>
                {group.items.map((item) => {
                  const ItemIcon = item.icon
                  return <button key={item.id} type="button" className={`rail-item ${view === item.id ? 'rail-item-active' : ''}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? 'page' : undefined}>
                    <ItemIcon size={16} strokeWidth={1.7} /><span>{item.label}</span><kbd>{item.short}</kbd>
                  </button>
                })}
              </nav>
            </div>
          ))}
          <div className="rail-footer"><div className="rail-footer-line"><span className="status-dot status-dot-live" />Local / deterministic</div><div className="rail-footer-meta">workbench.v1 · read only</div></div>
        </aside>

        {railOpen && <button type="button" className="rail-scrim" aria-label="Close navigation" onClick={() => setRailOpen(false)} />}

        <main id="main-content" className="main-stage">
          <div className="capability-bar">
            <span className="capability-pill capability-pill-primary"><span className="status-dot status-dot-live" />Simulated</span>
            <span className="capability-pill"><ShieldAlert size={12} />Read only</span>
            <span className="capability-detail">Source: deterministic fixture</span>
            <span className="capability-detail">Contract: workbench.v1</span>
            <span className="capability-module">{registry.get(current.module)?.moduleId ?? current.module}</span>
          </div>

          <div className="page-heading">
            <div><div className="breadcrumb"><span>OmniProbe</span><ArrowRight size={13} /><span>{current.label}</span></div><h1>{view === 'command' ? 'The machine story, before the machine.' : current.label}</h1><p>{view === 'command' ? 'A calm control surface for protocol evidence, guided practice, and repeatable engineering decisions.' : activePreset.description}</p></div>
            <div className="heading-meta"><span className="heading-meta-label">Active target</span><strong>{activePreset.shortName}</strong><span>{workspace.sequence.toString().padStart(5, '0')} samples</span></div>
          </div>

          <section className="telemetry-strip" aria-label="Live telemetry summary">
            <TelemetryItem icon={Gauge} label="Bus load" value={`${format(saturation)}%`} detail={saturation > 65 ? 'Review required' : 'Within envelope'} tone={saturation > 65 ? 'danger' : 'cyan'} />
            <TelemetryItem icon={Activity} label="Chamber pressure" value={format(latest?.pressure_mTorr ?? 18.4, 2)} unit="mTorr" detail="Vacuum sensor / A1" tone="cyan" />
            <TelemetryItem icon={SlidersHorizontal} label="Stage error" value={format(latest?.stageError_nm ?? 7.2)} unit="nm" detail="Following error" tone="amber" />
            <TelemetryItem icon={Zap} label="RF power" value={format(latest?.rfPower_W ?? 1250, 0)} unit="W" detail="Generator / A3" tone="lime" />
            <TelemetryItem icon={AlertTriangle} label="Events" value={String(workspace.frameLog.length).padStart(2, '0')} unit={criticalCount ? 'ATTN' : 'LIVE'} detail={`Sequence ${workspace.sequence}`} tone={criticalCount ? 'danger' : 'lime'} />
          </section>

          <div className="view-content">{renderView()}</div>

          <footer className="app-footer"><span>OmniProbe / local deterministic workbench</span><span><Cpu size={13} /> No hardware I/O in this mode</span></footer>
        </main>
      </div>
    </div>
  )
}

function CommandCenter({ activePreset, workspace, saturation, onNavigate }: { activePreset: typeof industrialPresets[number]; workspace: ReturnType<typeof useWorkspaceStore>; saturation: number; onNavigate: (view: ViewId) => void }) {
  return <div className="command-center">
    <section className="command-hero">
      <div className="command-hero-copy"><div className="section-kicker"><span className="kicker-rule" />Control surface / 01</div><h2>See the signal.<br /><em>Make the next move.</em></h2><p>Start with evidence, not assumptions. Inspect a frame, reproduce a fault, or learn the terminology behind the measurement.</p><div className="command-actions"><button type="button" className="primary-action" onClick={() => onNavigate('frame')}>Inspect a frame <ArrowRight size={16} /></button><button type="button" className="secondary-action" onClick={() => onNavigate('learning')}><GraduationCap size={16} />Start learning</button></div></div>
      <div className="command-hero-readout"><div className="readout-header"><span>Fixture / {activePreset.shortName}</span><span className="readout-live"><span className="status-dot status-dot-live" />LIVE</span></div><div className="readout-number">{saturation.toFixed(1)}<small>%</small></div><div className="readout-label">bus utilization</div><div className="readout-meter"><span style={{ width: `${Math.min(100, saturation)}%` }} /></div><div className="readout-foot"><span>{activePreset.simulation.baudRate.toLocaleString()} baud</span><span>{workspace.frameLog.length} frames</span></div><div className="readout-wave" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div></div>
    </section>
    <div className="command-grid"><section className="command-panel command-panel-scope"><div className="panel-heading"><div><div className="section-kicker">Observe / waveform</div><h3>Logic Scope</h3></div><button type="button" className="text-action" onClick={() => onNavigate('scope')}>Open scope <ArrowRight size={14} /></button></div><LogicScopePanel /></section><section className="command-panel command-panel-frame"><div className="panel-heading"><div><div className="section-kicker">Inspect / packet</div><h3>Frame Studio</h3></div><button type="button" className="text-action" onClick={() => onNavigate('frame')}>Open studio <ArrowRight size={14} /></button></div><FrameStudioPanel initialBaudRate={activePreset.simulation.baudRate} /></section></div>
    <section className="command-panel command-panel-bus"><div className="panel-heading"><div><div className="section-kicker">Reproduce / fault injection</div><h3>Virtual Bus</h3></div><button type="button" className="text-action" onClick={() => onNavigate('bus')}>Open simulator <ArrowRight size={14} /></button></div><VirtualBusPanel config={activePreset.simulation} defaultInterlockWord={activePreset.defaultInterlockWord} /></section>
    <section className="next-actions"><div><div className="section-kicker">Continue from here</div><h3>Three useful next steps</h3></div><div className="next-actions-grid"><NextAction icon={Search} title="Find the fault" text="Run the Commissioning Doctor against the active fixture." onClick={() => onNavigate('doctor')} /><NextAction icon={Gauge} title="Calculate the margin" text="Check timing, motion, dispensing, or vision assumptions." onClick={() => onNavigate('calculators')} /><NextAction icon={ScrollText} title="Record the context" text="Capture a revision, calibration reference, and evidence trail." onClick={() => onNavigate('recipes')} /></div></section>
  </div>
}

function NextAction({ icon: Icon, title, text, onClick }: { icon: Icon; title: string; text: string; onClick: () => void }) { return <button type="button" className="next-action" onClick={onClick}><span className="next-action-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{text}</small></span><ArrowRight size={15} className="next-action-arrow" /></button> }

function TelemetryItem({ icon: Icon, label, value, unit, detail, tone }: { icon: Icon; label: string; value: string; unit?: string; detail: string; tone: 'cyan' | 'lime' | 'amber' | 'danger' }) { return <div className={`telemetry-item telemetry-${tone}`}><div className="telemetry-top"><span>{label}</span><Icon size={15} strokeWidth={1.6} /></div><div className="telemetry-value">{value}<small>{unit}</small></div><div className="telemetry-detail">{detail}</div></div> }

function TraceReplayPanel({ frameCount, sequence }: { frameCount: number; sequence: number }) { return <section className="surface-panel feature-panel" aria-label="Trace replay"><FeatureHeader kicker="Trace replay / deterministic evidence" title="Inspect, pause, branch" text="One trace can hold raw bytes, decoded fields, semantic state, timing, faults, recipe context, and learner evidence." badge="SIMULATED / READ ONLY" /><div className="feature-metrics"><InfoMetric label="Captured fixture events" value={String(frameCount)} /><InfoMetric label="Current sequence" value={String(sequence).padStart(5, '0')} /><InfoMetric label="Controls" value="PAUSE · STEP · SEEK · BRANCH" /></div><div className="feature-columns"><InfoBlock title="Trace contract"><ul><li>Canonical content hash and schema version</li><li>Virtual time, seed, fault profile, and source identity</li><li>Recipe revision and calibration lineage</li><li>Credential and key-material redaction before export</li></ul></InfoBlock><InfoBlock title="Next safe action"><p>Open Frame Studio or Virtual Bus, create a deterministic fault trace, then compare the original and changed-variable branches.</p></InfoBlock></div></section> }

function TerminologyPanel() { const [query, setQuery] = useState(''); const terms = listTerms().filter((term) => `${term.label} ${term.definition} ${term.aliases.join(' ')}`.toLowerCase().includes(query.toLowerCase())); return <section className="surface-panel feature-panel" aria-label="Terminology"><FeatureHeader kicker="Terminology / in context" title="Learn the words where decisions happen" text="A practical glossary connected to domains, examples, aliases, and safety notes." badge="REVIEWED FIXTURES" /><label className="field-label" htmlFor="term-search">Search terms</label><div className="search-field"><Search size={16} /><input id="term-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="PLC, CRC, pose, calibration..." /></div><div className="term-grid">{terms.map((term) => { const contextual = getTermInContext(term.termId, term.domain); return <article key={term.termId} className="term-card"><div className="term-card-top"><h3>{term.label}</h3><span>{term.domain}</span></div><p>{contextual?.contextualDefinition ?? term.definition}</p><small>{term.plainLanguage}</small>{term.safetyNote && <div className="term-boundary">Boundary: {term.safetyNote}</div>}<div className="term-example">Example: {term.examples[0]}</div></article> })}</div></section> }

function SafetyPanel() { return <section className="surface-panel feature-panel" aria-label="Safety and cybersecurity boundaries"><FeatureHeader kicker="Safety & cyber / defensive learning" title="Useful diagnostics with honest limits" text="OmniProbe teaches and simulates reasoning. It never replaces risk assessment, LOTO, safety validation, cybersecurity authorization, or qualified review." badge="NO LIVE ACTUATION" tone="danger" /><div className="safety-columns"><SafetyCard title="Allowed in offline mode" items={['Synthetic faults and traces', 'Read-only protocol inspection', 'Least-privilege and zone/conduit exercises', 'Recipe lineage and evidence review', 'Safety-boundary terminology and scenarios']} tone="lime" /><SafetyCard title="Blocked by design" items={['Physical output energization', 'Robot or axis motion', 'E-stop or guard testing', 'Production network scanning', 'Credential guessing, fuzzing, flooding, or exploit execution']} tone="danger" /></div><p className="safety-disclaimer">This document records observations from an OmniProbe educational simulation. It is not a machine-specific risk assessment, lockout/tagout procedure, safety validation, SIL/PL determination, cybersecurity authorization, conformity assessment, commissioning certificate, or approval to operate, service, modify, or connect to equipment.</p></section> }

function FeatureHeader({ kicker, title, text, badge, tone = 'cyan' }: { kicker: string; title: string; text: string; badge: string; tone?: 'cyan' | 'danger' }) { return <div className="feature-header"><div><div className={`section-kicker ${tone === 'danger' ? 'section-kicker-danger' : ''}`}><span className="kicker-rule" />{kicker}</div><h2>{title}</h2><p>{text}</p></div><span className={`mode-badge mode-badge-${tone}`}>{badge}</span></div> }
function InfoMetric({ label, value }: { label: string; value: string }) { return <div className="info-metric"><span>{label}</span><strong>{value}</strong></div> }
function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) { return <div className="info-block"><div className="section-kicker">{title}</div>{children}</div> }
function SafetyCard({ title, items, tone }: { title: string; items: string[]; tone: 'lime' | 'danger' }) { return <div className={`safety-card safety-card-${tone}`}><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div> }

export default App
