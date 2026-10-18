import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { IndustrialPreset, InterlockBitDefinition } from '../../types/omniprobe'
import {
  ENDIAN_MODES,
  convertAcrossEndianModes,
  isInterlockBitSet,
  parseHexBytes,
  toggleInterlockBit,
} from './byteConverters'

export interface RegisterMatrixPanelProps {
  activePreset?: IndustrialPreset
  initialInput?: string
  className?: string
  onInputChange?: (input: string) => void
}

interface ParsedInput {
  bytes?: number[]
  error?: string
}

const panelStyle: CSSProperties = {
  display: 'grid',
  gap: '18px',
  padding: '20px',
  border: '1px solid #1e3543',
  borderRadius: '8px',
  background: '#0c1822',
  color: '#d7e7ee',
}

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: '7px',
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: '40px',
  padding: '8px 10px',
  border: '1px solid #1e3543',
  borderRadius: '4px',
  background: '#071018',
  color: '#d7e7ee',
  fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
  letterSpacing: '0.08em',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
  fontSize: '12px',
}

const cellStyle: CSSProperties = {
  padding: '10px 8px',
  borderTop: '1px solid #1e3543',
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

const byteText = (bytes: readonly number[]): string => bytes.map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ')

const numberText = (value: number): string => {
  if (Number.isNaN(value)) return 'NaN'
  if (!Number.isFinite(value)) return value > 0 ? '+∞' : '-∞'
  return value.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

const initialWordFor = (activePreset?: IndustrialPreset, bitRegister?: { defaultValue: number }): number => (
  (activePreset?.defaultInterlockWord ?? bitRegister?.defaultValue ?? 0) & 0xffff
)

const parseInput = (input: string): ParsedInput => {
  try {
    return { bytes: parseHexBytes(input) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid byte input.' }
  }
}

const bitDefinitionMap = (definitions: readonly InterlockBitDefinition[] | undefined): Map<number, InterlockBitDefinition> => (
  new Map((definitions ?? []).filter((definition) => definition.bit >= 0 && definition.bit <= 15).map((definition) => [definition.bit, definition]))
)

export function RegisterMatrixPanel({ activePreset, initialInput = '00 00 00 00', className, onInputChange }: RegisterMatrixPanelProps) {
  const [input, setInput] = useState(initialInput)
  const [interlockWord, setInterlockWord] = useState(0)

  const safetyRegister = useMemo(
    () => activePreset?.registers.find((register) => register.bitDefinitions && register.bitDefinitions.length > 0),
    [activePreset],
  )
  const bitDefinitions = useMemo(() => bitDefinitionMap(safetyRegister?.bitDefinitions), [safetyRegister])
  const parsed = useMemo(() => parseInput(input), [input])
  const rows = useMemo(() => parsed.bytes ? convertAcrossEndianModes(parsed.bytes) : [], [parsed.bytes])

  useEffect(() => {
    setInput(initialInput)
  }, [initialInput])

  useEffect(() => {
    setInterlockWord(initialWordFor(activePreset, safetyRegister))
  }, [activePreset?.id, activePreset?.defaultInterlockWord, safetyRegister?.name, safetyRegister?.defaultValue])

  const updateInput = (nextInput: string) => {
    setInput(nextInput)
    onInputChange?.(nextInput)
  }

  return (
    <section className={className} style={panelStyle} aria-label="Register matrix">
      <header style={{ display: 'grid', gap: '5px' }}>
        <span style={{ color: '#61e7ff', fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Register matrix
        </span>
        <h2 style={{ margin: 0, fontSize: '20px' }}>32-bit endian decoder</h2>
        <p style={{ margin: 0, color: '#8ca5b0', fontSize: '13px' }}>
          Decode two 16-bit registers as four common industrial byte orders.
        </p>
      </header>

      <label style={fieldStyle}>
        <span style={{ color: '#8ca5b0', fontSize: '12px' }}>HEX / REGISTER PAIR</span>
        <input
          aria-label="Hex or register pair input"
          inputMode="text"
          spellCheck={false}
          style={{ ...inputStyle, borderColor: parsed.error ? '#ff6b73' : '#1e3543' }}
          value={input}
          onChange={(event) => updateInput(event.target.value)}
          placeholder="3F 80 00 00 or 3F80 0000"
        />
        <span role={parsed.error ? 'alert' : undefined} style={{ minHeight: '16px', color: parsed.error ? '#ff6b73' : '#6f8791', fontSize: '12px' }}>
          {parsed.error ?? 'Enter four bytes or two 16-bit registers.'}
        </span>
      </label>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {['ENDIAN MODE', 'ORDERED BYTES', 'FLOAT32', 'INT32', 'UINT32', 'Q16.16'].map((heading) => (
                <th key={heading} style={{ ...cellStyle, borderTop: 0, color: '#8ca5b0', fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em' }}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ENDIAN_MODES.map((mode, index) => {
              const row = rows[index]
              return (
                <tr key={mode}>
                  <th scope="row" style={{ ...cellStyle, color: '#61e7ff', fontWeight: 500 }}>{mode}</th>
                  <td style={{ ...cellStyle, color: '#ffcc66' }}>{row ? byteText(row.bytes) : '—'}</td>
                  <td style={cellStyle}>{row ? numberText(row.float32) : '—'}</td>
                  <td style={cellStyle}>{row ? numberText(row.int32) : '—'}</td>
                  <td style={cellStyle}>{row ? numberText(row.uint32) : '—'}</td>
                  <td style={cellStyle}>{row ? numberText(row.q16_16) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {safetyRegister && (
        <section aria-label="Safety interlock bitmask" style={{ display: 'grid', gap: '12px', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ display: 'block', color: '#b8f36b', fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Safety bitmask</span>
              <strong style={{ display: 'block', marginTop: '4px', fontSize: '15px' }}>{safetyRegister.name}</strong>
            </div>
            <code style={{ color: '#b8f36b', fontSize: '16px' }}>0x{interlockWord.toString(16).padStart(4, '0').toUpperCase()}</code>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(54px, 1fr))', gap: '6px' }}>
            {Array.from({ length: 16 }, (_, bit) => {
              const definition = bitDefinitions.get(bit)
              const set = isInterlockBitSet(interlockWord, bit)
              return (
                <button
                  key={bit}
                  type="button"
                  aria-label={definition ? `Bit ${bit}: ${definition.name}` : `Reserved bit ${bit}`}
                  aria-pressed={set}
                  title={definition ? `${definition.name}: ${definition.description}` : `Reserved bit ${bit}`}
                  onClick={() => setInterlockWord((word) => toggleInterlockBit(word, bit))}
                  style={{ minHeight: '48px', padding: '5px', border: `1px solid ${set ? '#b8f36b' : '#1e3543'}`, borderRadius: '4px', background: set ? 'rgba(184, 243, 107, .12)' : '#071018', color: set ? '#b8f36b' : '#6f8791', textAlign: 'left' }}
                >
                  <span style={{ display: 'block', fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: '10px' }}>BIT {bit}</span>
                  <span style={{ display: 'block', overflow: 'hidden', marginTop: '4px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px' }}>{definition?.name ?? 'Reserved'}</span>
                </button>
              )
            })}
          </div>
          <p style={{ margin: 0, color: '#8ca5b0', fontSize: '12px' }}>
            Click a bit to toggle it. Defined bits: {bitDefinitions.size}; active bits: {interlockWord.toString(2).replace(/0/g, '').length}.
          </p>
        </section>
      )}
    </section>
  )
}

export default RegisterMatrixPanel
