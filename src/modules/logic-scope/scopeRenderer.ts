export type TriggerEdge = 'rising' | 'falling'

export interface AnalogWaveformSample {
  time: number
  value: number
}

export interface DigitalWaveformSample {
  time: number
  value: 0 | 1
}

export interface WaveformChannel<TSample> {
  id: string
  label: string
  color: string
  samples: TSample[]
}

export interface WaveformSet {
  analog: WaveformChannel<AnalogWaveformSample>[]
  digital: WaveformChannel<DigitalWaveformSample>[]
  duration: number
  sampleRate: number
}

export interface TriggerMatch {
  index: number
  time: number
  previousValue: number
  value: number
}

export interface CursorPosition {
  index: number
  time: number
}

export interface CursorDelta {
  start: CursorPosition
  end: CursorPosition
  deltaSamples: number
  deltaTime: number
  deltaTimeMs: number
}

export interface GenerateWaveformOptions {
  sampleRate?: number
  duration?: number
  seed?: number
  analogChannels?: number
  digitalChannels?: number
}

export interface GenerateChannelOptions {
  sampleRate?: number
  duration?: number
  seed?: number
  channelIndex?: number
}

const DEFAULT_SAMPLE_RATE = 2_000
const DEFAULT_DURATION = 0.24
const DEFAULT_SEED = 17

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizeSeed = (seed: number) => {
  const normalized = Math.floor(Math.abs(seed)) % 2_147_483_646
  return normalized === 0 ? 1 : normalized
}

const createRandom = (seed: number) => {
  let state = normalizeSeed(seed)
  return () => {
    state = (state * 16_807) % 2_147_483_647
    return (state - 1) / 2_147_483_646
  }
}

const sampleCountFor = (sampleRate: number, duration: number) => Math.max(2, Math.round(sampleRate * duration) + 1)

const resolveChannelOptions = (options: GenerateChannelOptions = {}) => {
  const sampleRate = Math.max(1, Math.round(options.sampleRate ?? DEFAULT_SAMPLE_RATE))
  const duration = Math.max(1 / sampleRate, options.duration ?? DEFAULT_DURATION)
  const sampleCount = sampleCountFor(sampleRate, duration)
  const channelIndex = Math.max(0, Math.floor(options.channelIndex ?? 0))
  return { sampleRate, duration, sampleCount, channelIndex, seed: options.seed ?? DEFAULT_SEED }
}

/** Generate one repeatable normalized analog channel. */
export const generateAnalogSamples = (options: GenerateChannelOptions = {}): AnalogWaveformSample[] => {
  const { sampleRate, duration, sampleCount, channelIndex, seed } = resolveChannelOptions(options)
  const random = createRandom(seed + channelIndex * 101)
  return Array.from({ length: sampleCount }, (_, index) => {
    const time = index / sampleRate
    const phase = time * (channelIndex + 1) * Math.PI * 2 * 11
    const carrier = Math.sin(phase) * (0.5 - channelIndex * 0.055)
    const harmonic = Math.sin(phase * 0.37 + channelIndex) * 0.15
    const modulation = Math.sin(time * Math.PI * 2 * 3.5 + channelIndex * 0.8) * 0.16
    const noise = (random() - 0.5) * 0.045
    return { time, value: clamp(0.5 + carrier + harmonic + modulation + noise, 0.04, 0.96) }
  })
}

/** Generate one repeatable digital channel with deterministic duty-cycle variation. */
export const generateDigitalSamples = (options: GenerateChannelOptions = {}): DigitalWaveformSample[] => {
  const { sampleRate, sampleCount, channelIndex, seed } = resolveChannelOptions(options)
  return Array.from({ length: sampleCount }, (_, index) => {
    const time = index / sampleRate
    const frequency = 7 + channelIndex * 3
    const phase = channelIndex * 0.41 + (seed % 13) * 0.025
    const pulse = Math.sin(time * Math.PI * 2 * frequency + phase)
    const dutyWave = Math.sin(time * Math.PI * 2 * (frequency * 0.29) + channelIndex)
    const value = pulse > (channelIndex % 2 === 0 ? -0.1 : 0.25) || dutyWave > 0.82 ? 1 : 0
    return { time, value: value as 0 | 1 }
  })
}

/** Generate repeatable mixed analog/digital data for the scope preview. */
export const generateWaveformSamples = (options: GenerateWaveformOptions = {}): WaveformSet => {
  const sampleRate = Math.max(1, Math.round(options.sampleRate ?? DEFAULT_SAMPLE_RATE))
  const duration = Math.max(1 / sampleRate, options.duration ?? DEFAULT_DURATION)
  const sampleCount = sampleCountFor(sampleRate, duration)
  const actualDuration = (sampleCount - 1) / sampleRate
  const seed = options.seed ?? DEFAULT_SEED
  const analogCount = Math.max(0, Math.floor(options.analogChannels ?? 3))
  const digitalCount = Math.max(0, Math.floor(options.digitalChannels ?? 4))
  const analogColors = ['#61e7ff', '#ffcc66', '#b8f36b', '#f38cff']
  const digitalColors = ['#ff6b73', '#c8a6ff', '#55d6be', '#ff9d5c']

  const analog = Array.from({ length: analogCount }, (_, channelIndex) => ({
    id: `analog-${channelIndex + 1}`,
    label: `A${channelIndex + 1}`,
    color: analogColors[channelIndex % analogColors.length],
    samples: generateAnalogSamples({ sampleRate, duration, seed, channelIndex }),
  }))

  const digital = Array.from({ length: digitalCount }, (_, channelIndex) => ({
    id: `digital-${channelIndex + 1}`,
    label: `D${channelIndex + 1}`,
    color: digitalColors[channelIndex % digitalColors.length],
    samples: generateDigitalSamples({ sampleRate, duration, seed, channelIndex }),
  }))

  return { analog, digital, duration: actualDuration, sampleRate }
}

/** Find the first sample crossing the requested threshold in the requested direction. */
export const detectTrigger = <TSample extends { time: number; value: number }>(
  samples: readonly TSample[],
  threshold: number,
  edge: TriggerEdge,
  startIndex = 1,
): TriggerMatch | undefined => {
  const firstIndex = Math.max(1, Math.floor(startIndex))
  for (let index = firstIndex; index < samples.length; index += 1) {
    const previous = samples[index - 1]
    const current = samples[index]
    const isRising = previous.value < threshold && current.value >= threshold
    const isFalling = previous.value > threshold && current.value <= threshold
    if ((edge === 'rising' && isRising) || (edge === 'falling' && isFalling)) {
      return {
        index,
        time: current.time,
        previousValue: previous.value,
        value: current.value,
      }
    }
  }
  return undefined
}

/** Return the nearest sample index for a time value, constrained to the data range. */
export const timeToSampleIndex = (time: number, sampleRate: number, sampleCount: number) => {
  if (sampleCount <= 0) return 0
  return clamp(Math.round(time * sampleRate), 0, sampleCount - 1)
}

/** Convert a cursor index to a stable time position. */
export const sampleIndexToCursor = (index: number, sampleRate: number, sampleCount: number): CursorPosition => {
  const safeIndex = timeToSampleIndex(index / Math.max(1, sampleRate), sampleRate, sampleCount)
  return { index: safeIndex, time: safeIndex / Math.max(1, sampleRate) }
}

/** Calculate the signed and absolute cursor separation in samples and time. */
export const calculateCursorDelta = (
  firstIndex: number,
  secondIndex: number,
  sampleRate: number,
  sampleCount: number,
): CursorDelta => {
  const start = sampleIndexToCursor(firstIndex, sampleRate, sampleCount)
  const end = sampleIndexToCursor(secondIndex, sampleRate, sampleCount)
  const deltaSamples = end.index - start.index
  const deltaTime = end.time - start.time
  return { start, end, deltaSamples, deltaTime, deltaTimeMs: deltaTime * 1_000 }
}

export const formatDeltaTime = (deltaTimeMs: number) => {
  const absolute = Math.abs(deltaTimeMs)
  const sign = deltaTimeMs < 0 ? '−' : '+'
  if (absolute >= 1_000) return `${sign}${(absolute / 1_000).toFixed(3)} s`
  if (absolute >= 1) return `${sign}${absolute.toFixed(2)} ms`
  return `${sign}${(absolute * 1_000).toFixed(1)} µs`
}

export interface ScopeCanvasLayout {
  width: number
  height: number
  plotLeft: number
  plotRight: number
  plotTop: number
  plotBottom: number
  analogTop: number
  analogHeight: number
  digitalTop: number
  digitalHeight: number
}

const getLayout = (width: number, height: number, analogCount: number, digitalCount: number): ScopeCanvasLayout => {
  const plotLeft = Math.max(62, Math.min(82, width * 0.105))
  const plotRight = Math.max(plotLeft + 120, width - 18)
  const plotTop = 28
  const plotBottom = Math.max(plotTop + 120, height - 30)
  const plotHeight = plotBottom - plotTop
  const analogHeight = plotHeight * (analogCount > 0 && digitalCount > 0 ? 0.61 : 0.9)
  const digitalTop = analogCount > 0 && digitalCount > 0 ? plotTop + analogHeight + 20 : plotTop
  const digitalHeight = analogCount > 0 && digitalCount > 0 ? plotBottom - digitalTop : plotHeight
  return { width, height, plotLeft, plotRight, plotTop, plotBottom, analogTop: plotTop, analogHeight, digitalTop, digitalHeight }
}

const drawText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left') => {
  context.fillStyle = color
  context.textAlign = align
  context.textBaseline = 'middle'
  context.fillText(text, x, y)
}

const drawGrid = (context: CanvasRenderingContext2D, layout: ScopeCanvasLayout, duration: number) => {
  const { plotLeft, plotRight, plotTop, plotBottom } = layout
  context.strokeStyle = 'rgba(111, 185, 204, 0.12)'
  context.lineWidth = 1
  context.beginPath()
  for (let column = 0; column <= 10; column += 1) {
    const x = plotLeft + ((plotRight - plotLeft) * column) / 10
    context.moveTo(x + 0.5, plotTop)
    context.lineTo(x + 0.5, plotBottom)
  }
  for (let row = 0; row <= 8; row += 1) {
    const y = plotTop + ((plotBottom - plotTop) * row) / 8
    context.moveTo(plotLeft, y + 0.5)
    context.lineTo(plotRight, y + 0.5)
  }
  context.stroke()

  context.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
  for (let column = 0; column <= 10; column += 1) {
    const x = plotLeft + ((plotRight - plotLeft) * column) / 10
    drawText(context, `${((duration * column) / 10 * 1_000).toFixed(0)} ms`, x, plotBottom + 15, '#6d8791', 'center')
  }
}

const drawAnalogChannels = (context: CanvasRenderingContext2D, channels: WaveformChannel<AnalogWaveformSample>[], layout: ScopeCanvasLayout, duration: number) => {
  if (channels.length === 0) return
  const rowHeight = layout.analogHeight / channels.length
  const plotWidth = layout.plotRight - layout.plotLeft
  context.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
  channels.forEach((channel, channelIndex) => {
    const rowTop = layout.analogTop + rowHeight * channelIndex
    const center = rowTop + rowHeight / 2
    const amplitude = rowHeight * 0.38
    context.strokeStyle = 'rgba(111, 185, 204, 0.18)'
    context.beginPath()
    context.moveTo(layout.plotLeft, center)
    context.lineTo(layout.plotRight, center)
    context.stroke()
    drawText(context, channel.label, layout.plotLeft - 14, center, channel.color, 'right')

    context.strokeStyle = channel.color
    context.lineWidth = 1.4
    context.beginPath()
    channel.samples.forEach((sample, index) => {
      const x = layout.plotLeft + (sample.time / duration) * plotWidth
      const y = center + (0.5 - sample.value) * amplitude * 2
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
    context.stroke()
  })
}

const drawDigitalChannels = (context: CanvasRenderingContext2D, channels: WaveformChannel<DigitalWaveformSample>[], layout: ScopeCanvasLayout, duration: number) => {
  if (channels.length === 0) return
  const rowHeight = layout.digitalHeight / channels.length
  const plotWidth = layout.plotRight - layout.plotLeft
  context.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
  channels.forEach((channel, channelIndex) => {
    const rowTop = layout.digitalTop + rowHeight * channelIndex
    const low = rowTop + rowHeight * 0.7
    const high = rowTop + rowHeight * 0.22
    drawText(context, channel.label, layout.plotLeft - 14, (low + high) / 2, channel.color, 'right')
    context.strokeStyle = channel.color
    context.lineWidth = 1.6
    context.beginPath()
    channel.samples.forEach((sample, index) => {
      const x = layout.plotLeft + (sample.time / duration) * plotWidth
      const y = sample.value === 1 ? high : low
      if (index === 0) context.moveTo(x, y)
      else {
        const previous = channel.samples[index - 1]
        const previousY = previous.value === 1 ? high : low
        context.lineTo(x, previousY)
        context.lineTo(x, y)
      }
    })
    context.stroke()
  })
}

export interface RenderScopeOptions {
  canvas: HTMLCanvasElement
  waveforms: WaveformSet
  cursorIndices: readonly [number, number]
  trigger?: TriggerMatch
  triggerThreshold?: number
}

/** Render the current scope frame. The caller controls the animation cadence. */
export const renderScopeFrame = ({ canvas, waveforms, cursorIndices, trigger, triggerThreshold = 0.5 }: RenderScopeOptions) => {
  const context = canvas.getContext('2d')
  if (!context) return
  const pixelRatio = window.devicePixelRatio || 1
  const width = canvas.clientWidth || canvas.width / pixelRatio
  const height = canvas.clientHeight || canvas.height / pixelRatio
  if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
    canvas.width = Math.floor(width * pixelRatio)
    canvas.height = Math.floor(height * pixelRatio)
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#08141c'
  context.fillRect(0, 0, width, height)

  const layout = getLayout(width, height, waveforms.analog.length, waveforms.digital.length)
  drawGrid(context, layout, waveforms.duration)
  drawAnalogChannels(context, waveforms.analog, layout, waveforms.duration)
  drawDigitalChannels(context, waveforms.digital, layout, waveforms.duration)

  const plotWidth = layout.plotRight - layout.plotLeft
  const drawMarker = (index: number, color: string, label: string) => {
    const safeIndex = clamp(Math.round(index), 0, Math.max(0, Math.round(waveforms.duration * waveforms.sampleRate)))
    const x = layout.plotLeft + (safeIndex / Math.max(1, waveforms.duration * waveforms.sampleRate)) * plotWidth
    context.strokeStyle = color
    context.lineWidth = 1
    context.setLineDash([4, 4])
    context.beginPath()
    context.moveTo(x + 0.5, layout.plotTop)
    context.lineTo(x + 0.5, layout.plotBottom)
    context.stroke()
    context.setLineDash([])
    context.fillStyle = color
    context.beginPath()
    context.moveTo(x - 6, layout.plotTop - 1)
    context.lineTo(x + 6, layout.plotTop - 1)
    context.lineTo(x, layout.plotTop + 8)
    context.closePath()
    context.fill()
    context.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
    drawText(context, label, x, layout.plotTop - 14, color, 'center')
  }

  drawMarker(cursorIndices[0], '#f8f1dd', 'T1')
  drawMarker(cursorIndices[1], '#f8f1dd', 'T2')

  if (trigger) {
    const x = layout.plotLeft + (trigger.time / waveforms.duration) * plotWidth
    context.strokeStyle = '#ff6b73'
    context.lineWidth = 1
    context.setLineDash([2, 5])
    context.beginPath()
    context.moveTo(x, layout.analogTop)
    context.lineTo(x, layout.analogTop + layout.analogHeight)
    context.stroke()
    context.setLineDash([])
    context.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
    drawText(context, `TRIG ${(triggerThreshold * 100).toFixed(0)}%`, x + 6, layout.analogTop + 10, '#ff6b73')
  }
}
