import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Info, RefreshCw, ShieldCheck, WandSparkles } from 'lucide-react'
import type { DiagnosticFinding, IndustrialPreset, Severity, TelemetrySample } from '../../types/omniprobe'
import {
  autoRemediateCommissioningAudit,
  exportAuditReportMarkdown,
  runCommissioningAudit,
  type AutoRemediationResult,
} from './auditRulesEngine'

export interface CommissioningDoctorPanelProps {
  preset: IndustrialPreset
  telemetry?: readonly TelemetrySample[]
  onPresetRemediated?: (preset: IndustrialPreset) => void
  className?: string
}

const severityOrder: Severity[] = ['CRITICAL', 'WARNING', 'INFO', 'PASS']

const severityStyles: Record<Severity, { icon: typeof AlertTriangle; text: string; border: string; badge: string }> = {
  CRITICAL: { icon: AlertTriangle, text: 'text-danger', border: 'border-danger/40', badge: 'bg-danger/10 text-danger' },
  WARNING: { icon: AlertTriangle, text: 'text-amber', border: 'border-amber/40', badge: 'bg-amber/10 text-amber' },
  INFO: { icon: Info, text: 'text-cyan', border: 'border-cyan/30', badge: 'bg-cyan/10 text-cyan' },
  PASS: { icon: CheckCircle2, text: 'text-lime', border: 'border-lime/25', badge: 'bg-lime/10 text-lime' },
}

const countFindings = (findings: readonly DiagnosticFinding[], severity: Severity): number => findings.filter((finding) => finding.severity === severity).length

const safeFileName = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'commissioning-report'

export function CommissioningDoctorPanel({ preset, telemetry, onPresetRemediated, className = '' }: CommissioningDoctorPanelProps) {
  const [remediatedPreset, setRemediatedPreset] = useState<IndustrialPreset | null>(null)
  const [lastRemediation, setLastRemediation] = useState<AutoRemediationResult | null>(null)
  const workingPreset = remediatedPreset ?? preset
  const input = useMemo(() => ({ preset: workingPreset, telemetry }), [workingPreset, telemetry])
  const audit = useMemo(() => runCommissioningAudit(input), [input])
  const remediableCount = audit.findings.filter((finding) => finding.autoRemediable && finding.severity !== 'PASS').length

  useEffect(() => {
    setRemediatedPreset(null)
    setLastRemediation(null)
  }, [preset])

  const handleAutoRemediate = () => {
    const result = autoRemediateCommissioningAudit(input)
    setRemediatedPreset(result.preset)
    setLastRemediation(result)
    onPresetRemediated?.(result.preset)
  }

  const handleExport = () => {
    const markdown = exportAuditReportMarkdown(input, audit.findings)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeFileName(workingPreset.shortName || workingPreset.id)}-commissioning-report.md`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className={`instrument-panel panel-grid min-w-0 overflow-hidden rounded-sm ${className}`} aria-labelledby="commissioning-doctor-title">
      <div className="border-b border-line bg-panel/80 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-2 flex items-center gap-2"><ShieldCheck size={13} aria-hidden="true" /> Commissioning Doctor</p>
            <h2 id="commissioning-doctor-title" className="text-xl font-semibold tracking-tight text-slate-100">Protocol readiness audit</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Twelve deterministic checks across bus timing, register maps, signal quality, and safety behavior.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAutoRemediate}
              disabled={remediableCount === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-lime/50 bg-lime/10 px-3 py-2 text-xs font-semibold text-lime transition hover:bg-lime/20 focus:outline-none focus:ring-2 focus:ring-lime/70 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-slate-600"
            >
              <WandSparkles size={15} aria-hidden="true" />
              Auto-Remediate Issues
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-line bg-ink/40 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan/60 hover:text-cyan focus:outline-none focus:ring-2 focus:ring-cyan/70"
            >
              <Download size={15} aria-hidden="true" />
              Export Markdown Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
        {severityOrder.map((severity) => {
          const style = severityStyles[severity]
          return (
            <div key={severity} className="border-r border-line px-4 py-4 last:border-r-0">
              <p className="eyebrow">{severity.toLowerCase()}</p>
              <p className={`mt-1 font-mono text-2xl tabular-nums ${style.text}`}>{countFindings(audit.findings, severity)}</p>
            </div>
          )
        })}
      </div>

      {lastRemediation && (
        <div className="border-b border-line bg-lime/5 px-5 py-4 sm:px-6" role="status">
          <div className="flex items-start gap-3">
            <RefreshCw className="mt-0.5 shrink-0 text-lime" size={16} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-lime">Remediation preset prepared</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{lastRemediation.changes.length} configuration change{lastRemediation.changes.length === 1 ? '' : 's'} applied to a returned preset copy. The source preset was not mutated.</p>
              {lastRemediation.changes.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-slate-300">
                  {lastRemediation.changes.map((change) => <li key={change.field}><span className="font-mono text-lime">{change.field}</span> {change.before} → {change.after}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-line/70">
        {audit.findings.map((item) => <FindingRow key={item.id} finding={item} />)}
      </div>

      {(!telemetry || telemetry.length === 0) && (
        <p className="border-t border-line px-5 py-3 text-xs text-slate-500 sm:px-6">No telemetry samples supplied; signal checks use deterministic preset values and pass defaults where measurements are unavailable.</p>
      )}
    </section>
  )
}

function FindingRow({ finding }: { finding: DiagnosticFinding }) {
  const style = severityStyles[finding.severity]
  const Icon = style.icon

  return (
    <article className={`border-l-2 ${style.border} px-5 py-4 sm:px-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 shrink-0 ${style.text}`} size={17} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">{finding.title}</h3>
            <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${style.badge}`}>{finding.severity}</span>
            {finding.autoRemediable && finding.severity !== 'PASS' && <span className="rounded-sm border border-lime/25 px-1.5 py-0.5 font-mono text-[10px] text-lime">AUTO</span>}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-400">{finding.details}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500"><span className="text-slate-400">Recommendation:</span> {finding.recommendation}</p>
        </div>
      </div>
    </article>
  )
}

export default CommissioningDoctorPanel
