import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  calculateCursorDelta,
  detectTrigger,
  formatDeltaTime,
  generateWaveformSamples,
  renderScopeFrame,
  timeToSampleIndex,
  type TriggerEdge,
} from './scopeRenderer'

const SAMPLE_RATE = 2_000
const WAVEFORM_DURATION = 0.24

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const toPercent = (value: number) => `${Math.round(value * 100)}%`

export function LogicScopePanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | undefined>(undefined)
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined)
  const dragRef = useRef<'first' | 'second' | undefined>(undefined)
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 })
  const [cursorIndices, setCursorIndices] = useState<[number, number]>([110, 335])
  const [triggerEdge, setTriggerEdge] = useState<TriggerEdge>('rising')
  const [triggerChannel, setTriggerChannel] = useState(0)
  const [triggerLevel, setTriggerLevel] = useState(0.5)
  const [isPaused, setIsPaused] = useState(false)

  const waveforms = useMemo(() => generateWaveformSamples({
    sampleRate: SAMPLE_RATE,
    duration: WAVEFORM_DURATION,
    seed: 29,
    analogChannels: 3,
    digitalChannels: 4,
  }), [])

  const trigger = useMemo(() => {
    const channel = waveforms.analog[triggerChannel]
    return channel ? detectTrigger(channel.samples, triggerLevel, triggerEdge) : undefined
  }, [triggerChannel, triggerEdge, triggerLevel, waveforms])

  const cursorDelta = useMemo(
    () => calculateCursorDelta(cursorIndices[0], cursorIndices[1], waveforms.sampleRate, waveforms.analog[0]?.samples.length ?? 0),
    [cursorIndices, waveforms],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || plotSize.width <= 0 || plotSize.height <= 0) return
    renderScopeFrame({ canvas, waveforms, cursorIndices, trigger, triggerThreshold: triggerLevel })
  }, [cursorIndices, plotSize, trigger, triggerLevel, waveforms])

  useEffect(() => {
    const element = plotRef.current
    if (!element) return undefined
    const updateSize = () => {
      const bounds = element.getBoundingClientRect()
      setPlotSize({ width: Math.max(0, Math.floor(bounds.width)), height: Math.max(0, Math.floor(bounds.height)) })
    }
    updateSize()
    resizeObserverRef.current = new ResizeObserver(updateSize)
    resizeObserverRef.current.observe(element)
    return () => resizeObserverRef.current?.disconnect()
  }, [])

  useEffect(() => {
    let mounted = true
    const animate = () => {
      if (!mounted) return
      if (!isPaused) draw()
      frameRef.current = window.requestAnimationFrame(animate)
    }
    frameRef.current = window.requestAnimationFrame(animate)
    return () => {
      mounted = false
      if (frameRef.current !== undefined) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = undefined
    }
  }, [draw, isPaused])

  useEffect(() => {
    const maxIndex = Math.max(1, waveforms.analog[0]?.samples.length ?? 1) - 1
    setCursorIndices(([first, second]) => [clamp(first, 0, maxIndex), clamp(second, 0, maxIndex)])
  }, [waveforms])

  const updateCursor = (cursor: 'first' | 'second', value: number) => {
    const maxIndex = Math.max(1, waveforms.analog[0]?.samples.length ?? 1) - 1
    setCursorIndices((current) => {
      const next = [...current] as [number, number]
      next[cursor === 'first' ? 0 : 1] = clamp(Math.round(value), 0, maxIndex)
      return next
    })
  }

  const updateCursorFromPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !dragRef.current) return
    const bounds = canvas.getBoundingClientRect()
    const plotLeft = Math.max(62, Math.min(82, bounds.width * 0.105))
    const plotRight = Math.max(plotLeft + 120, bounds.width - 18)
    const normalized = clamp((event.clientX - bounds.left - plotLeft) / (plotRight - plotLeft), 0, 1)
    updateCursor(dragRef.current, normalized * Math.max(0, (waveforms.analog[0]?.samples.length ?? 1) - 1))
  }

  const beginCursorDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    const plotLeft = Math.max(62, Math.min(82, bounds.width * 0.105))
    const plotRight = Math.max(plotLeft + 120, bounds.width - 18)
    const pointerIndex = timeToSampleIndex(
      clamp((event.clientX - bounds.left - plotLeft) / (plotRight - plotLeft), 0, 1) * waveforms.duration,
      waveforms.sampleRate,
      waveforms.analog[0]?.samples.length ?? 0,
    )
    const firstDistance = Math.abs(pointerIndex - cursorIndices[0])
    const secondDistance = Math.abs(pointerIndex - cursorIndices[1])
    dragRef.current = firstDistance <= secondDistance ? 'first' : 'second'
    canvas.setPointerCapture(event.pointerId)
    updateCursor(dragRef.current, pointerIndex)
  }

  const endCursorDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId)
    dragRef.current = undefined
  }

  const triggerName = trigger ? `at ${(trigger.time * 1_000).toFixed(2)} ms` : 'not found'

  return (
    <section className="instrument-panel overflow-hidden rounded-sm bg-[#09151d]" aria-label="Logic scope">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1d3942] px-4 py-3">
        <div>
          <div className="eyebrow">Time domain instrument</div>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="font-mono text-sm font-semibold tracking-[.12em] text-slate-100">LOGIC SCOPE</h2>
            <span className="rounded-sm border border-[#28505c] px-2 py-1 font-mono text-[10px] text-[#7fabb5]">LIVE · 60 FPS</span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#7fabb5]">
          <span className={`h-2 w-2 rounded-full ${isPaused ? 'bg-[#ffcc66]' : 'bg-[#b8f36b] shadow-[0_0_8px_#b8f36b]'}`} />
          {isPaused ? 'HOLD' : 'ACQUISITION ACTIVE'}
          <button
            type="button"
            className="ml-2 border border-[#28505c] px-2 py-1 text-[#d7e7ee] transition hover:border-[#61e7ff] hover:text-[#61e7ff]"
            onClick={() => setIsPaused((paused) => !paused)}
          >
            {isPaused ? 'RESUME' : 'HOLD'}
          </button>
        </div>
      </div>

      <div ref={plotRef} className="relative h-[360px] min-h-[260px] w-full bg-[#08141c]">
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none"
          onPointerDown={beginCursorDrag}
          onPointerMove={updateCursorFromPointer}
          onPointerUp={endCursorDrag}
          onPointerCancel={endCursorDrag}
          aria-label="Multi-channel analog and digital waveform plot"
        />
        <div className="pointer-events-none absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-[.16em] text-[#55727d]">Analog / digital channels · click near T1/T2 to drag</div>
      </div>

      <div className="grid gap-px border-t border-[#1d3942] bg-[#1d3942] md:grid-cols-[1.1fr_1fr_1fr]">
        <div className="bg-[#0b1a23] p-4">
          <div className="eyebrow">Edge trigger</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="col-span-1 font-mono text-[10px] text-[#7fabb5]">
              SOURCE
              <select
                value={triggerChannel}
                onChange={(event) => setTriggerChannel(Number(event.target.value))}
                className="mt-1 w-full border border-[#28505c] bg-[#08141c] px-2 py-2 text-xs text-slate-100 outline-none focus:border-[#61e7ff]"
              >
                {waveforms.analog.map((channel, index) => <option key={channel.id} value={index}>{channel.label}</option>)}
              </select>
            </label>
            <label className="col-span-1 font-mono text-[10px] text-[#7fabb5]">
              EDGE
              <select
                value={triggerEdge}
                onChange={(event) => setTriggerEdge(event.target.value as TriggerEdge)}
                className="mt-1 w-full border border-[#28505c] bg-[#08141c] px-2 py-2 text-xs text-slate-100 outline-none focus:border-[#61e7ff]"
              >
                <option value="rising">RISING ↑</option>
                <option value="falling">FALLING ↓</option>
              </select>
            </label>
            <label className="col-span-1 font-mono text-[10px] text-[#7fabb5]">
              LEVEL
              <input
                className="mt-1 h-[34px] w-full accent-[#61e7ff]"
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={triggerLevel}
                onChange={(event) => setTriggerLevel(Number(event.target.value))}
                aria-label="Trigger threshold"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-[#7fabb5]">
            <span>THRESHOLD <strong className="text-[#ffcc66]">{toPercent(triggerLevel)}</strong></span>
            <span className={trigger ? 'text-[#b8f36b]' : 'text-[#ff6b73]'}>{triggerName}</span>
          </div>
        </div>

        <div className="bg-[#0b1a23] p-4">
          <div className="eyebrow">Dual-cursor measurement</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="font-mono text-[10px] text-[#7fabb5]">
              T1 · {(cursorDelta.start.time * 1_000).toFixed(2)} ms
              <input
                className="mt-2 h-5 w-full accent-[#f8f1dd]"
                type="range"
                min="0"
                max={Math.max(1, (waveforms.analog[0]?.samples.length ?? 1) - 1)}
                value={cursorIndices[0]}
                onChange={(event) => updateCursor('first', Number(event.target.value))}
                aria-label="First cursor position"
              />
            </label>
            <label className="font-mono text-[10px] text-[#7fabb5]">
              T2 · {(cursorDelta.end.time * 1_000).toFixed(2)} ms
              <input
                className="mt-2 h-5 w-full accent-[#f8f1dd]"
                type="range"
                min="0"
                max={Math.max(1, (waveforms.analog[0]?.samples.length ?? 1) - 1)}
                value={cursorIndices[1]}
                onChange={(event) => updateCursor('second', Number(event.target.value))}
                aria-label="Second cursor position"
              />
            </label>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-[#1d3942] pt-3">
            <span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#7fabb5]">ΔT</span>
            <strong className="font-mono text-xl tabular-nums text-[#f8f1dd]">{formatDeltaTime(cursorDelta.deltaTimeMs)}</strong>
          </div>
        </div>

        <div className="bg-[#0b1a23] p-4">
          <div className="eyebrow">Acquisition summary</div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[10px]">
            <div><dt className="text-[#55727d]">SAMPLE RATE</dt><dd className="mt-1 text-slate-100">{SAMPLE_RATE.toLocaleString()} Sa/s</dd></div>
            <div><dt className="text-[#55727d]">WINDOW</dt><dd className="mt-1 text-slate-100">{(WAVEFORM_DURATION * 1_000).toFixed(0)} ms</dd></div>
            <div><dt className="text-[#55727d]">ANALOG</dt><dd className="mt-1 text-[#61e7ff]">{waveforms.analog.length} channels</dd></div>
            <div><dt className="text-[#55727d]">DIGITAL</dt><dd className="mt-1 text-[#ff6b73]">{waveforms.digital.length} channels</dd></div>
          </dl>
        </div>
      </div>
    </section>
  )
}

export default LogicScopePanel
