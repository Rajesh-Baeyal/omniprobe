import { describe, expect, it } from 'vitest'
import type { WorkbenchModuleManifest } from '../core/workbench/contracts'
import { createModuleRegistry, getModule, listModules, registerModule } from '../core/workbench/moduleRegistry'
import { createSeededRandom } from '../core/workbench/deterministicRandom'
import { createVirtualClock } from '../core/workbench/virtualClock'

const manifest: WorkbenchModuleManifest = {
  moduleId: 'test-module',
  version: '1.0.0',
  domains: ['testing'],
  supportedModes: ['SIMULATED'],
  transports: ['fixture'],
  capabilities: [{ id: 'fixture.read', adapterId: 'fixture-adapter', access: 'read', safetyClass: 'educational' }],
  schemaVersions: ['workbench.v1'],
  calculatorIds: [],
  lessonIds: [],
  terminologyRefs: [],
  sourceRefs: ['spec:test'],
  adapterIds: ['fixture-adapter'],
}

describe('workbench foundation', () => {
  it('rejects duplicate module ids and missing source metadata', () => {
    const registry = createModuleRegistry([])

    expect(() => registerModule(registry, { ...manifest, sourceRefs: [] })).toThrow()
    registerModule(registry, manifest)
    expect(() => registry.register({ ...manifest })).toThrow()
    expect(getModule(registry, manifest.moduleId)).toEqual(manifest)
    expect(listModules(registry)).toEqual([manifest])
  })

  it('rejects invalid schema, execution mode, adapter, and command metadata', () => {
    const registry = createModuleRegistry([])

    expect(() => registry.register({ ...manifest, schemaVersions: [] })).toThrow()
    expect(() => registry.register({ ...manifest, schemaVersions: ['workbench.v2'] })).toThrow()
    expect(() => registry.register({ ...manifest, schemaVersions: ['workbench.v1', 'workbench.v2'] })).toThrow()
    expect(() => registry.register({ ...manifest, supportedModes: ['UNKNOWN' as never] })).toThrow()
    expect(() => registry.register({ ...manifest, adapterIds: [] })).toThrow()
    expect(() => registry.register({
      ...manifest,
      capabilities: [{ id: 'fixture.command', adapterId: 'fixture-adapter', access: 'command' } as never],
    })).toThrow()
  })

  it('validates every manifest string-array field and capability object', () => {
    const stringArrayFields: Array<keyof Pick<
      WorkbenchModuleManifest,
      'domains' | 'supportedModes' | 'transports' | 'schemaVersions' | 'calculatorIds' | 'lessonIds' | 'terminologyRefs' | 'sourceRefs' | 'adapterIds'
    >> = [
      'domains',
      'supportedModes',
      'transports',
      'schemaVersions',
      'calculatorIds',
      'lessonIds',
      'terminologyRefs',
      'sourceRefs',
      'adapterIds',
    ]

    stringArrayFields.forEach((field) => {
      expect(() => createModuleRegistry([]).register({ ...manifest, moduleId: `${field}-whitespace`, [field]: ['  '] } as WorkbenchModuleManifest)).toThrow()
      expect(() => createModuleRegistry([]).register({ ...manifest, moduleId: `${field}-number`, [field]: [42] } as never)).toThrow()
    })

    expect(() => createModuleRegistry([]).register({ ...manifest, capabilities: [null as never] })).toThrow()
    expect(() => createModuleRegistry([]).register({ ...manifest, capabilities: [{} as never] })).toThrow()
  })

  it('requires each capability adapter to be declared by the manifest', () => {
    const registry = createModuleRegistry([])

    expect(() => registry.register({
      ...manifest,
      capabilities: [{ ...manifest.capabilities[0], adapterId: 'missing-adapter' }],
    })).toThrow()
    expect(() => registry.register({
      ...manifest,
      capabilities: [{ id: 'fixture.read', access: 'read', safetyClass: 'educational' } as never],
    })).toThrow()

    expect(() => registry.register({
      ...manifest,
      capabilities: [{ ...manifest.capabilities[0], adapterId: 'fixture-adapter' }],
    })).not.toThrow()
  })

  it('rejects unsafe command capabilities in live modes', () => {
    const registry = createModuleRegistry([])
    const liveModes = ['BROWSER_LIVE', 'BRIDGE_LIVE'] as const

    liveModes.forEach((mode) => {
      const unsafeLiveManifest: WorkbenchModuleManifest = {
        ...manifest,
        moduleId: `unsafe-${mode}`,
        supportedModes: [mode],
        capabilities: [{
          id: 'fixture.command',
          adapterId: 'fixture-adapter',
          access: 'command',
          safetyClass: 'educational',
        }],
      }

      expect(() => registry.register(unsafeLiveManifest)).toThrow()
      expect(() => registry.register({
        ...unsafeLiveManifest,
        moduleId: `reviewed-${mode}`,
        capabilities: [{ ...unsafeLiveManifest.capabilities[0], safetyClass: 'qualified-review' }],
      })).not.toThrow()
    })
  })

  it('keeps default manifests offline', () => {
    const registry = createModuleRegistry()

    expect(listModules(registry).every((moduleManifest) => moduleManifest.supportedModes.every(
      (mode) => mode === 'SIMULATED' || mode === 'REPLAY',
    ))).toBe(true)
  })

  it('defensively clones and freezes registered manifests and snapshots', () => {
    const registry = createModuleRegistry([])
    const input = {
      ...manifest,
      domains: [...manifest.domains],
      capabilities: manifest.capabilities.map((capability) => ({ ...capability })),
    }

    registry.register(input)
    input.domains[0] = 'mutated'
    input.capabilities[0].id = 'mutated.capability'

    const snapshot = getModule(registry, manifest.moduleId)
    expect(snapshot).toEqual(manifest)
    expect(snapshot).not.toBe(input)
    expect(snapshot && Object.isFrozen(snapshot)).toBe(true)
    expect(snapshot && Object.isFrozen(snapshot.domains)).toBe(true)
    expect(snapshot && Object.isFrozen(snapshot.capabilities)).toBe(true)
    expect(snapshot && Object.isFrozen(snapshot.capabilities[0])).toBe(true)
    if (!snapshot) {
      throw new Error('expected a registered manifest snapshot')
    }
    expect(() => snapshot.domains.push('mutated')).toThrow()
    expect(() => { snapshot.capabilities[0].id = 'mutated.capability' }).toThrow()

    const listed = listModules(registry)
    expect(listed[0]).not.toBe(snapshot)
    expect(listed[0].capabilities).not.toBe(snapshot?.capabilities)
    expect(Object.isFrozen(listed[0])).toBe(true)
    expect(getModule(registry, manifest.moduleId)).toEqual(manifest)
  })

  it('provides all initial workbench module manifests', () => {
    const registry = createModuleRegistry()
    const moduleIds = listModules(registry).map((module) => module.moduleId)

    expect(moduleIds).toEqual([
      'protocol-inspector',
      'serial-modbus',
      'tcp-udp',
      'can-network',
      'opcua-simulator',
      'mqtt-sparkplug',
      'secs-hsms',
      'plc-sandbox',
      'robotics-motion',
      'vision-calibration',
      'calculator-lab',
      'recipe-manager',
      'trace-replay',
      'learning-studio',
      'terminology',
      'ot-safety-cyber',
    ])
  })

  it('produces repeatable virtual time and seeded values', () => {
    const clock = createVirtualClock(100)
    clock.advance(25)

    expect(clock.now()).toBe(125)
    expect(createSeededRandom('demo').next()).toBe(createSeededRandom('demo').next())
    expect(createSeededRandom('demo').next()).not.toBe(createSeededRandom('other').next())
  })

  it('rejects virtual-clock overflow without changing the current time', () => {
    const clock = createVirtualClock(Number.MAX_VALUE)

    expect(() => clock.advance(Number.MAX_VALUE)).toThrow('overflow')
    expect(clock.now()).toBe(Number.MAX_VALUE)
    expect(() => clock.set(Infinity)).toThrow()
  })

  it('supports bounded seeded-random helpers and rejects invalid bounds', () => {
    const random = createSeededRandom('helpers')
    const values = Array.from({ length: 20 }, () => random.next())

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true)
    expect(random.nextInt(1)).toBe(0)
    expect(random.nextInt(10)).toBeGreaterThanOrEqual(0)
    expect(random.nextInt(10)).toBeLessThan(10)
    expect(['a', 'b']).toContain(random.pick(['a', 'b']))
    expect(createSeededRandom('pick').pick(['a', 'b'])).toBe(createSeededRandom('pick').pick(['a', 'b']))

    expect(() => random.nextInt(0)).toThrow()
    expect(() => random.nextInt(-1)).toThrow()
    expect(() => random.nextInt(1.5)).toThrow()
    expect(() => random.nextInt(Infinity)).toThrow()
    expect(() => random.pick([])).toThrow()
  })
})
