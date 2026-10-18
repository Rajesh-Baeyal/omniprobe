import type {
  CapabilityAccess,
  ExecutionMode,
  ModuleCapability,
  SafetyClass,
  WorkbenchModuleManifest,
} from './contracts'

const executionModes = new Set<ExecutionMode>(['SIMULATED', 'REPLAY', 'BROWSER_LIVE', 'BRIDGE_LIVE'])
const capabilityAccess = new Set<CapabilityAccess>(['read', 'subscribe', 'command'])
const safetyClasses = new Set<SafetyClass>(['educational', 'read-only', 'qualified-review'])
const liveExecutionModes = new Set<ExecutionMode>(['BROWSER_LIVE', 'BRIDGE_LIVE'])
const supportedSchemaVersion = 'workbench.v1'

export interface ModuleRegistry {
  register(manifest: WorkbenchModuleManifest): void
  get(moduleId: string): WorkbenchModuleManifest | undefined
  list(): WorkbenchModuleManifest[]
}

function requireNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`)
  }
}

function requireStringArray(value: unknown, field: string, allowEmpty = false): asserts value is string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`${field} must contain${allowEmpty ? '' : ' at least'} non-empty strings`)
  }
}

function validateManifest(manifest: WorkbenchModuleManifest): void {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('module manifest is required')
  }

  requireNonEmptyString(manifest.moduleId, 'moduleId')
  requireNonEmptyString(manifest.version, 'version')
  requireStringArray(manifest.domains, 'domains')
  requireStringArray(manifest.supportedModes, 'supportedModes')
  requireStringArray(manifest.transports, 'transports')
  requireStringArray(manifest.schemaVersions, 'schemaVersions')
  requireStringArray(manifest.calculatorIds, 'calculatorIds', true)
  requireStringArray(manifest.lessonIds, 'lessonIds', true)
  requireStringArray(manifest.terminologyRefs, 'terminologyRefs', true)
  requireStringArray(manifest.sourceRefs, 'sourceRefs')
  requireStringArray(manifest.adapterIds, 'adapterIds', true)

  if (manifest.supportedModes.some((mode) => !executionModes.has(mode))) {
    throw new Error('supportedModes contains an unsupported execution mode')
  }

  if (manifest.schemaVersions.some((schemaVersion) => schemaVersion !== supportedSchemaVersion)) {
    throw new Error(`schemaVersions only supports ${supportedSchemaVersion}`)
  }

  if (!Array.isArray(manifest.capabilities)) {
    throw new Error('capabilities must be an array')
  }

  if (manifest.capabilities.length > 0 && manifest.adapterIds.length === 0) {
    throw new Error('capabilities require at least one adapter')
  }

  manifest.capabilities.forEach((capability: ModuleCapability, index) => {
    if (!capability || typeof capability !== 'object') {
      throw new Error(`capabilities[${index}] must be an object`)
    }
    requireNonEmptyString(capability.id, 'capability.id')
    requireNonEmptyString(capability.adapterId, `capability ${capability.id}.adapterId`)
    if (!manifest.adapterIds.includes(capability.adapterId)) {
      throw new Error(`capability ${capability.id} references an unknown adapter`)
    }
    if (!capabilityAccess.has(capability.access)) {
      throw new Error(`unsupported capability access: ${String(capability.access)}`)
    }
    if (!safetyClasses.has(capability.safetyClass)) {
      throw new Error(`capability ${capability.id} requires a valid safety class`)
    }
    if (capability.maxRateHz !== undefined && (!Number.isFinite(capability.maxRateHz) || capability.maxRateHz <= 0)) {
      throw new Error(`capability ${capability.id} has an invalid maxRateHz`)
    }
    if (manifest.supportedModes.some((mode) => liveExecutionModes.has(mode)) && capability.access === 'command' && capability.safetyClass !== 'qualified-review') {
      throw new Error(`command capability ${capability.id} requires qualified review in live modes`)
    }
  })
}

function cloneManifest(manifest: WorkbenchModuleManifest): WorkbenchModuleManifest {
  return {
    ...manifest,
    domains: [...manifest.domains],
    supportedModes: [...manifest.supportedModes],
    transports: [...manifest.transports],
    capabilities: manifest.capabilities.map((capability) => ({ ...capability })),
    schemaVersions: [...manifest.schemaVersions],
    calculatorIds: [...manifest.calculatorIds],
    lessonIds: [...manifest.lessonIds],
    terminologyRefs: [...manifest.terminologyRefs],
    sourceRefs: [...manifest.sourceRefs],
    adapterIds: [...manifest.adapterIds],
  }
}

function freezeManifest(manifest: WorkbenchModuleManifest): WorkbenchModuleManifest {
  Object.freeze(manifest.domains)
  Object.freeze(manifest.supportedModes)
  Object.freeze(manifest.transports)
  manifest.capabilities.forEach((capability) => Object.freeze(capability))
  Object.freeze(manifest.capabilities)
  Object.freeze(manifest.schemaVersions)
  Object.freeze(manifest.calculatorIds)
  Object.freeze(manifest.lessonIds)
  Object.freeze(manifest.terminologyRefs)
  Object.freeze(manifest.sourceRefs)
  Object.freeze(manifest.adapterIds)
  Object.freeze(manifest)
  return manifest
}

function snapshotManifest(manifest: WorkbenchModuleManifest): WorkbenchModuleManifest {
  return freezeManifest(cloneManifest(manifest))
}

function manifest(moduleId: string, domain: string): WorkbenchModuleManifest {
  return {
    moduleId,
    version: '1.0.0',
    domains: [domain],
    supportedModes: ['SIMULATED', 'REPLAY'],
    transports: ['fixture'],
    capabilities: [{ id: `${moduleId}.read`, adapterId: `${moduleId}.fixture`, access: 'read', safetyClass: 'educational' }],
    schemaVersions: ['workbench.v1'],
    calculatorIds: [],
    lessonIds: [],
    terminologyRefs: [],
    sourceRefs: [`spec:industrial-automation-workbench#${moduleId}`],
    adapterIds: [`${moduleId}.fixture`],
  }
}

export const INITIAL_MODULE_MANIFESTS: WorkbenchModuleManifest[] = [
  manifest('protocol-inspector', 'protocols'),
  manifest('serial-modbus', 'serial-communication'),
  manifest('tcp-udp', 'networking'),
  manifest('can-network', 'can'),
  manifest('opcua-simulator', 'opcua'),
  manifest('mqtt-sparkplug', 'messaging'),
  manifest('secs-hsms', 'semiconductor'),
  manifest('plc-sandbox', 'plc'),
  manifest('robotics-motion', 'robotics'),
  manifest('vision-calibration', 'vision'),
  manifest('calculator-lab', 'calculators'),
  manifest('recipe-manager', 'recipes'),
  manifest('trace-replay', 'traces'),
  manifest('learning-studio', 'learning'),
  manifest('terminology', 'terminology'),
  manifest('ot-safety-cyber', 'safety-and-cybersecurity'),
]

export const DEFAULT_MODULE_MANIFESTS = INITIAL_MODULE_MANIFESTS

export function createModuleRegistry(initialManifests: WorkbenchModuleManifest[] = INITIAL_MODULE_MANIFESTS): ModuleRegistry {
  const modules = new Map<string, WorkbenchModuleManifest>()

  const registry: ModuleRegistry = {
    register: (moduleManifest) => {
      validateManifest(moduleManifest)
      if (modules.has(moduleManifest.moduleId)) {
        throw new Error(`module id already registered: ${moduleManifest.moduleId}`)
      }
      modules.set(moduleManifest.moduleId, snapshotManifest(moduleManifest))
    },
    get: (moduleId) => {
      const moduleManifest = modules.get(moduleId)
      return moduleManifest ? snapshotManifest(moduleManifest) : undefined
    },
    list: () => Array.from(modules.values(), snapshotManifest),
  }

  initialManifests.forEach((moduleManifest) => registry.register(moduleManifest))
  return registry
}

export function registerModule(registry: ModuleRegistry, manifestToRegister: WorkbenchModuleManifest): void {
  registry.register(manifestToRegister)
}

export function getModule(registry: ModuleRegistry, moduleId: string): WorkbenchModuleManifest | undefined {
  return registry.get(moduleId)
}

export function listModules(registry: ModuleRegistry): WorkbenchModuleManifest[] {
  return registry.list()
}
