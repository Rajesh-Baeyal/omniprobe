import { useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'
import type { ByteSegmentAnnotation, ProtocolType } from '../../types/omniprobe'
import {
  appendCrc16Modbus,
  buildHexBytes,
  calculateWireTimeMs,
  corruptCrc16Modbus,
  decodeModbusTcpMbap,
  generateByteSegmentAnnotations,
  parseHexBytes,
  verifyCrc16Modbus,
} from './protocolCodecs'

export interface FrameStudioPanelProps {
  initialProtocol?: ProtocolType
  initialBytes?: readonly number[]
  initialBaudRate?: number
}

const defaultRtuFrame = appendCrc16Modbus([0x07, 0x03, 0x00, 0x00, 0x00, 0x0a])
const defaultTcpFrame = [0x12, 0x34, 0x00, 0x00, 0x00, 0x06, 0x07, 0x03, 0x00, 0x00, 0x00, 0x01]
const protocolOptions: ProtocolType[] = ['MODBUS_RTU', 'MODBUS_TCP', 'SECS_HSMS', 'SPARKPLUG_EDGE']

const colors = {
  panel: '#0c1822',
  line: '#1e3543',
  text: '#d7e7ee',
  muted: '#77909d',
  cyan: '#61e7ff',
  lime: '#b8f36b',
  amber: '#ffcc66',
  danger: '#ff6b73',
}

const compactLabel: CSSProperties = {
  color: colors.muted,
  fontSize: 10,
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
}

const formatDuration = (milliseconds: number) => milliseconds < 1
  ? `${(milliseconds * 1000).toFixed(2)} µs`
  : `${milliseconds.toFixed(3)} ms`

const annotationForByte = (annotations: ByteSegmentAnnotation[], index: number) => annotations.find((annotation) => (
  index >= annotation.start && index < annotation.end
))

export function FrameStudioPanel({
  initialProtocol = 'MODBUS_RTU',
  initialBytes,
  initialBaudRate = 115200,
}: FrameStudioPanelProps) {
  const [protocol, setProtocol] = useState<ProtocolType>(initialProtocol)
  const [hexInput, setHexInput] = useState(() => buildHexBytes(initialBytes ?? (initialProtocol === 'MODBUS_TCP' ? defaultTcpFrame : defaultRtuFrame)))
  const [corruptCrc, setCorruptCrc] = useState(false)
  const [baudRate, setBaudRate] = useState(String(initialBaudRate))

  const parsed = useMemo(() => {
    try {
      return { bytes: parseHexBytes(hexInput), error: '' }
    } catch (error) {
      return { bytes: [], error: error instanceof Error ? error.message : 'Invalid hexadecimal input.' }
    }
  }, [hexInput])

  const effectiveBytes = useMemo(() => {
    if (protocol !== 'MODBUS_RTU' || !corruptCrc || parsed.bytes.length < 4) return parsed.bytes
    return corruptCrc16Modbus(parsed.bytes)
  }, [corruptCrc, parsed.bytes, protocol])

  const mbap = useMemo(() => protocol === 'MODBUS_TCP' ? decodeModbusTcpMbap(effectiveBytes) : undefined, [effectiveBytes, protocol])
  const annotations = useMemo(() => generateByteSegmentAnnotations(protocol, effectiveBytes), [effectiveBytes, protocol])
  const crcValid = protocol === 'MODBUS_RTU' && parsed.bytes.length >= 4 ? verifyCrc16Modbus(effectiveBytes) : undefined
  const parsedBaudRate = Number(baudRate)
  const wireTime = Number.isFinite(parsedBaudRate) && parsedBaudRate > 0
    ? calculateWireTimeMs(effectiveBytes, parsedBaudRate)
    : undefined

  return (
    <section style={{ background: colors.panel, border: `1px solid ${colors.line}`, color: colors.text, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', maxWidth: 760, padding: 16 }}>
      <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={compactLabel}>FRAME STUDIO / CODEC DIAGNOSTICS</div>
          <h2 style={{ fontSize: 18, letterSpacing: '-0.02em', margin: '5px 0 0' }}>Wire frame inspector</h2>
        </div>
        <div style={{ color: colors.cyan, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, paddingTop: 2 }}>
          {effectiveBytes.length} BYTES
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'minmax(0, 1fr) 150px' }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={compactLabel}>Editable hex frame</span>
          <input
            aria-label="Editable hexadecimal frame"
            value={hexInput}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setHexInput(event.target.value)}
            spellCheck={false}
            style={{ background: '#071018', border: `1px solid ${parsed.error ? colors.danger : colors.line}`, color: colors.text, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 13, minWidth: 0, outline: 'none', padding: '10px 11px', width: '100%' }}
          />
          <span style={{ color: parsed.error ? colors.danger : colors.muted, fontSize: 11 }}>{parsed.error || 'Bytes accept spaces, commas, colons, or 0x prefixes.'}</span>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={compactLabel}>Protocol</span>
          <select
            aria-label="Frame protocol"
            value={protocol}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setProtocol(event.target.value as ProtocolType)}
            style={{ background: '#071018', border: `1px solid ${colors.line}`, color: colors.text, fontSize: 12, padding: '10px 8px' }}
          >
            {protocolOptions.map((option) => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}
          </select>
        </label>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 14, margin: '14px 0' }}>
        {protocol === 'MODBUS_RTU' ? (
          <label style={{ alignItems: 'center', display: 'inline-flex', fontSize: 12, gap: 7 }}>
            <input
              type="checkbox"
              checked={corruptCrc}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCorruptCrc(event.target.checked)}
              disabled={parsed.bytes.length < 4 || Boolean(parsed.error)}
            />
            Corrupt CRC on wire
          </label>
        ) : <span style={{ color: colors.muted, fontSize: 12 }}>CRC not used by Modbus TCP / selected protocol</span>}

        <div style={{ alignItems: 'center', display: 'inline-flex', gap: 7 }}>
          <span style={compactLabel}>CRC</span>
          <strong style={{ color: crcValid === true ? colors.lime : crcValid === false ? colors.danger : colors.muted, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12 }}>
            {protocol !== 'MODBUS_RTU' ? 'N/A' : parsed.error ? 'PARSE ERROR' : parsed.bytes.length < 4 ? 'INCOMPLETE' : crcValid ? 'VALID' : 'INVALID'}
          </strong>
        </div>

        <label style={{ alignItems: 'center', display: 'inline-flex', gap: 7, marginLeft: 'auto' }}>
          <span style={compactLabel}>Baud</span>
          <input
            aria-label="Baud rate"
            inputMode="numeric"
            min="1"
            onChange={(event: ChangeEvent<HTMLInputElement>) => setBaudRate(event.target.value)}
            type="number"
            value={baudRate}
            style={{ background: '#071018', border: `1px solid ${colors.line}`, color: colors.text, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, padding: '5px 7px', width: 92 }}
          />
        </label>
      </div>

      {protocol === 'MODBUS_TCP' && mbap && (
        <div style={{ border: `1px solid ${colors.line}`, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 14, padding: 10 }}>
          <div><div style={compactLabel}>Transaction</div><div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', marginTop: 4 }}>0x{mbap.transactionId.toString(16).padStart(4, '0').toUpperCase()}</div></div>
          <div><div style={compactLabel}>Protocol</div><div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', marginTop: 4 }}>0x{mbap.protocolId.toString(16).padStart(4, '0').toUpperCase()}</div></div>
          <div><div style={compactLabel}>Length</div><div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', marginTop: 4 }}>{mbap.length} B</div></div>
          <div><div style={compactLabel}>Unit</div><div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', marginTop: 4 }}>{mbap.unitId ?? '—'}</div></div>
          <div style={{ color: mbap.valid ? colors.lime : colors.danger, fontSize: 11, gridColumn: '1 / -1' }}>{mbap.valid ? `MBAP OK · PDU ${mbap.pdu.length} bytes` : mbap.errors.join(' ')}</div>
        </div>
      )}

      <div style={{ border: `1px solid ${colors.line}`, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ background: '#09141d', borderBottom: `1px solid ${colors.line}`, color: colors.muted, fontSize: 10, letterSpacing: '0.14em', padding: '7px 9px', textTransform: 'uppercase' }}>Annotation ribbon · effective wire bytes</div>
        <div style={{ display: 'flex', minHeight: 64, overflowX: 'auto', padding: '14px 9px 9px' }}>
          {effectiveBytes.length === 0 ? <span style={{ color: colors.muted, fontSize: 12 }}>No complete bytes to annotate.</span> : effectiveBytes.map((byte, index) => {
            const annotation = annotationForByte(annotations, index)
            return (
              <div key={`${index}-${byte}`} style={{ borderLeft: `1px solid ${colors.line}`, flex: '0 0 50px', padding: '0 7px', position: 'relative', textAlign: 'center' }}>
                <div style={{ color: annotation?.color ?? colors.muted, fontSize: 9, height: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{annotation?.label ?? '—'}</div>
                <div style={{ background: `${annotation?.color ?? colors.line}22`, border: `1px solid ${annotation?.color ?? colors.line}`, color: colors.text, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, marginTop: 5, padding: '5px 2px' }}>{byte.toString(16).padStart(2, '0').toUpperCase()}</div>
                <div style={{ color: colors.muted, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 9, marginTop: 4 }}>{index.toString().padStart(2, '0')}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '0 9px 9px' }}>
          {annotations.map((annotation) => <div key={`${annotation.start}-${annotation.end}-${annotation.label}`} style={{ background: `${annotation.color}22`, borderLeft: `3px solid ${annotation.color}`, color: annotation.color, flex: `${annotation.end - annotation.start} 1 0`, fontSize: 10, minWidth: 42, overflow: 'hidden', padding: '5px 6px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{annotation.label} · {annotation.end - annotation.start}B</div>)}
        </div>
      </div>

      <div style={{ alignItems: 'baseline', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div><div style={compactLabel}>RS-485 wire time · 8E1</div><div style={{ color: colors.cyan, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 20, marginTop: 4 }}>{wireTime === undefined ? '—' : formatDuration(wireTime)}</div></div>
        <div style={{ color: colors.muted, fontSize: 11, textAlign: 'right' }}>{effectiveBytes.length} bytes × 11 bits ÷ {parsedBaudRate > 0 ? parsedBaudRate.toLocaleString() : '—'} baud</div>
      </div>
    </section>
  )
}

export default FrameStudioPanel
