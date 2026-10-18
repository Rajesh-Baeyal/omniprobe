import { useEffect, useMemo, useState } from 'react'
import type { BusSimulationConfig, FaultType } from '../../types/omniprobe'
import {
  createBusSimulatorEngine,
  DEFAULT_BUS_CONFIG,
  VIRTUAL_BUS_FAULTS,
  type BusSimulatorSnapshot,
} from './busSimulatorEngine'

export interface VirtualBusPanelProps {
  config?: BusSimulationConfig
  defaultInterlockWord?: number
}

const FAULT_LABELS: Record<FaultType, string> = {
  CRC_BIT_FLIP: 'CRC bit flip',
  SLAVE_TIMEOUT: 'Slave timeout',
  EMI_SPIKE_ANALOG: 'EMI analog spike',
  ENDIAN_WORD_SWAP: 'Endian word swap',
  INTERLOCK_CHATTER: 'Interlock chatter',
}

const severityClasses = {
  PASS: 'border-lime/30 bg-lime/5 text-lime',
  WARNING: 'border-amber/30 bg-amber/5 text-amber',
  CRITICAL: 'border-danger/40 bg-danger/10 text-danger',
} as const

const formatNumber = (value: number, digits = 2): string => value.toFixed(digits)

const formatStatusTime = (timestamp: number): string => {
  if (!Number.isFinite(timestamp)) return '—'
  return new Date(timestamp).toLocaleTimeString([], { hour12: false })
}

const utilizationWidth = (value: number): number => Math.max(0, Math.min(100, value))

const StatusLine = ({
  status,
}: {
  status: NonNullable<BusSimulatorSnapshot['lastStatus']>
}) => (
  <li className={`border px-3 py-2 ${severityClasses[status.severity]}`}>
    <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[.12em]">
      <span>{status.kind}</span>
      <span className="text-slate-500">{formatStatusTime(status.timestamp)}</span>
    </div>
    <p className="mt-1 text-xs text-slate-200">{status.message}</p>
  </li>
)

export function VirtualBusPanel({
  config = DEFAULT_BUS_CONFIG,
  defaultInterlockWord,
}: VirtualBusPanelProps) {
  const engine = useMemo(
    () => createBusSimulatorEngine(config, { defaultInterlockWord }),
    [config, defaultInterlockWord],
  )
  const [snapshot, setSnapshot] = useState<BusSimulatorSnapshot>(engine.getSnapshot)

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => setSnapshot(engine.getSnapshot()))
    engine.start()
    return () => {
      engine.dispose()
      unsubscribe()
    }
  }, [engine])

  const activeFaults = new Set(snapshot.config.faultTypes)
  const gaugeWidth = utilizationWidth(snapshot.utilizationPct)

  return (
    <section className="instrument-panel panel-grid w-full max-w-3xl p-4 text-slate-100" aria-label="Virtual bus simulator">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="eyebrow">Virtual bus / deterministic poller</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-100">Bus simulation console</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Browser-safe polling with exact wire-time accounting and repeatable fault injection.
          </p>
        </div>
        <button
          type="button"
          onClick={() => engine.toggle()}
          className={`border px-4 py-2 font-mono text-xs uppercase tracking-[.16em] transition-colors focus:outline-none focus:ring-2 focus:ring-cyan ${
            snapshot.isRunning
              ? 'border-amber/50 bg-amber/10 text-amber hover:bg-amber/20'
              : 'border-lime/50 bg-lime/10 text-lime hover:bg-lime/20'
          }`}
          aria-pressed={snapshot.isRunning}
        >
          {snapshot.isRunning ? 'Pause bus' : 'Run bus'}
        </button>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1.3fr_.7fr]">
        <div className="border border-line bg-ink/40 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Bus utilization</p>
              <p className="mt-2 font-mono text-4xl tabular-nums text-cyan">
                {formatNumber(snapshot.utilizationPct)}<span className="text-lg text-slate-500">%</span>
              </p>
            </div>
            <div className="text-right font-mono text-xs text-slate-500">
              <p>{formatNumber(snapshot.wireTimeMs, 3)} ms wire time</p>
              <p>{config.requestBytes + config.responseBytes} bytes / poll</p>
            </div>
          </div>
          <div
            className="mt-5 h-3 overflow-hidden border border-line bg-panel"
            role="progressbar"
            aria-label="Bus utilization"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={gaugeWidth}
          >
            <div
              className={`h-full transition-[width] duration-300 ${snapshot.utilizationPct > 100 ? 'bg-danger' : 'bg-cyan'}`}
              style={{ width: `${gaugeWidth}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[.12em] text-slate-600">
            <span>0%</span>
            <span>{snapshot.utilizationPct > 100 ? 'saturated' : 'polling envelope'}</span>
            <span>100%</span>
          </div>
        </div>

        <div className="border border-line bg-ink/40 p-4">
          <p className="eyebrow">Current poll</p>
          <dl className="mt-3 space-y-3 font-mono text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Sequence</dt>
              <dd className="tabular-nums text-slate-100">{String(snapshot.sequence).padStart(5, '0')}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Frame</dt>
              <dd className="text-right text-slate-100">{snapshot.frame?.id ?? 'NO RESPONSE'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">CRC errors</dt>
              <dd className="tabular-nums text-slate-100">{formatNumber(snapshot.sample?.crcErrorRatePct ?? 0)}%</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Analog noise</dt>
              <dd className="tabular-nums text-slate-100">{formatNumber(snapshot.sample?.analogNoise ?? 0, 3)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 border border-line bg-ink/40 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow">Fault injection</p>
          <span className="font-mono text-[10px] text-slate-600">{activeFaults.size} enabled</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {VIRTUAL_BUS_FAULTS.map((fault) => {
            const enabled = activeFaults.has(fault)
            return (
              <button
                key={fault}
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => engine.setFaultEnabled(fault, !enabled)}
                className={`flex items-center justify-between gap-3 border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan ${
                  enabled
                    ? 'border-danger/50 bg-danger/10 text-danger'
                    : 'border-line bg-panel/60 text-slate-400 hover:border-cyan/40 hover:text-slate-200'
                }`}
              >
                <span className="font-mono text-xs">{FAULT_LABELS[fault]}</span>
                <span className="font-mono text-[10px] uppercase tracking-[.12em]">{enabled ? 'on' : 'off'}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[.9fr_1.1fr]">
        <div className="border border-line bg-ink/40 p-4">
          <p className="eyebrow">Last simulation status</p>
          {snapshot.lastStatus ? (
            <div className={`mt-3 border px-3 py-3 ${severityClasses[snapshot.lastStatus.severity]}`}>
              <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[.12em]">
                <span>{snapshot.lastStatus.severity}</span>
                <span>poll {snapshot.lastStatus.sequence}</span>
              </div>
              <p className="mt-2 text-sm text-slate-100">{snapshot.lastStatus.message}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Waiting for the first deterministic poll.</p>
          )}
        </div>

        <div className="border border-line bg-ink/40 p-4">
          <p className="eyebrow">Recent simulation status</p>
          {snapshot.recentStatuses.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {snapshot.recentStatuses.map((status) => (
                <StatusLine key={`${status.sequence}-${status.timestamp}`} status={status} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No polls recorded.</p>
          )}
        </div>
      </div>
    </section>
  )
}
