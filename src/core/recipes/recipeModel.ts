export type RecipeStatus = 'draft' | 'reviewed' | 'approved' | 'effective' | 'retired'
export type RecipeParameterKind = 'numeric' | 'text' | 'boolean' | 'enum'
export type RecipeScalar = string | number | boolean | null

export interface RecipeParameter {
  readonly key: string
  readonly label: string
  readonly kind: RecipeParameterKind
  readonly value?: RecipeScalar
  readonly unit?: string
  readonly description?: string
  readonly required?: boolean
  readonly safetyCritical?: boolean
  readonly allowedValues?: readonly string[]
  readonly min?: number
  readonly max?: number
}

export type RecipeParameterInput = Omit<RecipeParameter, 'key' | 'label' | 'kind'> & {
  readonly key: string
  readonly label?: string
  readonly kind?: RecipeParameterKind
}

export type RecipeParameterCollection = readonly RecipeParameterInput[] | Readonly<Record<string, RecipeScalar | Omit<RecipeParameterInput, 'key'>>>

export type CalibrationStatus = 'valid' | 'current' | 'stale' | 'invalid'

export interface CalibrationReference {
  readonly calibrationId: string
  readonly status?: CalibrationStatus
  readonly validUntil?: number
  readonly expiresAt?: number
  readonly modelVersion?: string
  readonly calibrationHash?: string
  readonly sourceRef?: string
}

export interface CalibrationReferenceInput extends Omit<CalibrationReference, 'calibrationId'> {
  readonly calibrationId?: string
  readonly id?: string
}

export interface RecipeProvenance {
  readonly createdBy?: string
  readonly sourceRefs: readonly string[]
  readonly reason?: string
}

export interface RecipeContext {
  readonly product: string
  readonly machine: string
  readonly station: string
}

export interface CreateDraftRecipeInput extends Partial<RecipeContext> {
  readonly recipeId: string
  readonly name: string
  readonly productId?: string
  readonly machineId?: string
  readonly stationId?: string
  readonly parameters: RecipeParameterCollection
  readonly requiredParameterKeys?: readonly string[]
  readonly calibrationIds?: readonly string[]
  readonly requiredCalibrationIds?: readonly string[]
  readonly calibrationReferences?: readonly CalibrationReferenceInput[]
  readonly provenance?: Partial<RecipeProvenance>
}

export interface RecipeTransition {
  readonly status: RecipeStatus
  readonly at: number
  readonly actor?: string
  readonly note?: string
}

export interface RecipeRevision extends RecipeContext {
  readonly schemaVersion: 'recipe.v1'
  readonly recipeId: string
  readonly revisionId: string
  readonly parentRevisionId?: string
  readonly productId: string
  readonly machineId: string
  readonly stationId: string
  readonly name: string
  readonly parameters: readonly RecipeParameter[]
  readonly requiredParameterKeys: readonly string[]
  readonly calibrationIds: readonly string[]
  readonly requiredCalibrationIds: readonly string[]
  readonly calibrationReferences: readonly CalibrationReference[]
  readonly provenance: RecipeProvenance
  readonly status: RecipeStatus
  readonly contentHash: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly transitionHistory: readonly RecipeTransition[]
}

export interface RecipeRevisionOptions {
  readonly revisionId?: string
  readonly parentRevisionId?: string
  readonly createdAt?: number
}

export interface RecipeRevisionChanges {
  readonly revisionId?: string
  readonly name?: string
  readonly product?: string
  readonly productId?: string
  readonly machine?: string
  readonly machineId?: string
  readonly station?: string
  readonly stationId?: string
  readonly parameters?: RecipeParameterCollection
  readonly requiredParameterKeys?: readonly string[]
  readonly calibrationIds?: readonly string[]
  readonly requiredCalibrationIds?: readonly string[]
  readonly calibrationReferences?: readonly CalibrationReferenceInput[]
  readonly provenance?: Partial<RecipeProvenance>
  readonly createdAt?: number
}

export interface RecipeTransitionOptions {
  readonly actor?: string
  readonly at?: number
  readonly note?: string
}

export interface RecipeValidationIssue {
  readonly code: 'missing-parameter' | 'invalid-parameter' | 'missing-calibration' | 'stale-calibration'
  readonly message: string
  readonly key?: string
  readonly calibrationId?: string
}

export interface RecipeRunValidation {
  readonly valid: boolean
  readonly issues: readonly RecipeValidationIssue[]
  readonly errors: readonly string[]
  readonly missingParameters: readonly string[]
  readonly missingCalibrations: readonly string[]
  readonly staleCalibrations: readonly string[]
}

export interface RecipeRunValidationOptions {
  readonly now?: number
  readonly requiredParameterKeys?: readonly string[]
  readonly calibrationReferences?: readonly CalibrationReferenceInput[]
  readonly calibrations?: readonly CalibrationReferenceInput[] | Readonly<Record<string, CalibrationReferenceInput>>
}

export type RecipeDiffCategory = 'numeric' | 'semantic'

export interface RecipeDiffEntry {
  readonly key: string
  readonly category: RecipeDiffCategory
  readonly before?: unknown
  readonly after?: unknown
  readonly delta?: number
  readonly unit?: string
  readonly safetyCritical?: boolean
}

export interface RecipeDiff {
  readonly changed: boolean
  readonly entries: readonly RecipeDiffEntry[]
  readonly numericChanges: readonly RecipeDiffEntry[]
  readonly semanticChanges: readonly RecipeDiffEntry[]
  readonly numeric: readonly RecipeDiffEntry[]
  readonly semantic: readonly RecipeDiffEntry[]
}

const recipeStatuses: readonly RecipeStatus[] = ['draft', 'reviewed', 'approved', 'effective', 'retired']
const allowedTransitions: Readonly<Record<RecipeStatus, readonly RecipeStatus[]>> = {
  draft: ['reviewed'],
  reviewed: ['approved'],
  approved: ['effective'],
  effective: ['retired'],
  retired: [],
}

function assertNonEmpty(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} must be a non-empty string`)
  return value.trim()
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)])) as T
  }
  return value
}

function freezeDeep<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value as Record<string, unknown>).forEach((child) => freezeDeep(child))
  Object.freeze(value)
  return value
}

function inferParameterKind(value: RecipeScalar | undefined): RecipeParameterKind {
  if (typeof value === 'number') return 'numeric'
  if (typeof value === 'boolean') return 'boolean'
  return 'text'
}

function normalizeParameter(input: RecipeParameterInput | RecipeScalar | Omit<RecipeParameterInput, 'key'>, keyFromRecord?: string): RecipeParameter {
  if (input === null || typeof input !== 'object') {
    const key = assertNonEmpty(keyFromRecord, 'parameter key')
    return { key, label: key, kind: inferParameterKind(input), value: input, required: true }
  }

  const source = input as Partial<RecipeParameterInput> & { id?: string }
  const key = assertNonEmpty(source.key ?? source.id ?? keyFromRecord, 'parameter key')
  const value = source.value as RecipeScalar | undefined
  return {
    ...source,
    key,
    label: assertNonEmpty(source.label ?? key, `parameter ${key}.label`),
    kind: source.kind ?? inferParameterKind(value),
    required: source.required ?? true,
    ...(source.allowedValues ? { allowedValues: [...source.allowedValues] } : {}),
  }
}

function normalizeParameters(parameters: RecipeParameterCollection): RecipeParameter[] {
  const normalized = Array.isArray(parameters)
    ? parameters.map((parameter) => normalizeParameter(parameter))
    : Object.entries(parameters).map(([key, parameter]) => normalizeParameter(parameter, key))

  const keys = new Set<string>()
  normalized.forEach((parameter) => {
    if (keys.has(parameter.key)) throw new Error(`duplicate recipe parameter: ${parameter.key}`)
    keys.add(parameter.key)
  })
  return normalized.sort((left, right) => compareStrings(left.key, right.key))
}

function normalizeCalibration(input: CalibrationReferenceInput): CalibrationReference {
  const calibrationId = assertNonEmpty(input.calibrationId ?? input.id, 'calibrationId')
  const { id: _id, ...reference } = input
  return {
    ...reference,
    calibrationId,
  }
}

function normalizeCalibrationReferences(references: readonly CalibrationReferenceInput[] | undefined): CalibrationReference[] {
  const normalized = (references ?? []).map(normalizeCalibration)
  const ids = new Set<string>()
  normalized.forEach((reference) => {
    if (ids.has(reference.calibrationId)) throw new Error(`duplicate calibration reference: ${reference.calibrationId}`)
    ids.add(reference.calibrationId)
  })
  return normalized.sort((left, right) => compareStrings(left.calibrationId, right.calibrationId))
}

function normalizeIds(ids: readonly string[] | undefined, field: string): string[] {
  const normalized = Array.from(new Set((ids ?? []).map((id) => assertNonEmpty(id, field))))
  return normalized.sort(compareStrings)
}

function normalizeProvenance(provenance: Partial<RecipeProvenance> | undefined): RecipeProvenance {
  return {
    ...(provenance?.createdBy ? { createdBy: provenance.createdBy } : {}),
    sourceRefs: normalizeIds(provenance?.sourceRefs, 'sourceRefs'),
    ...(provenance?.reason ? { reason: provenance.reason } : {}),
  }
}

function canonicalValue(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('canonical JSON cannot contain non-finite numbers')
    return Object.is(value, -0) ? '0' : JSON.stringify(value)
  }
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => canonicalValue(item)).join(',')}]`
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => compareStrings(left, right))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalValue(item)}`).join(',')}}`
  }
  throw new Error(`canonical JSON cannot contain ${typeof value}`)
}

export function canonicalizeRecipe(value: unknown): string {
  return canonicalValue(value)
}

export function hashCanonicalRecipe(value: unknown): string {
  const input = canonicalValue(value)
  let hash = 14695981039346656037n
  for (const character of input) {
    hash ^= BigInt(character.codePointAt(0) ?? 0)
    hash = BigInt.asUintN(64, hash * 1099511628211n)
  }
  return `recipe-${hash.toString(16).padStart(16, '0')}`
}

function contentPayload(revision: Pick<RecipeRevision, 'recipeId' | 'name' | 'product' | 'machine' | 'station' | 'parameters' | 'requiredParameterKeys' | 'calibrationIds' | 'requiredCalibrationIds' | 'calibrationReferences'>): unknown {
  return {
    recipeId: revision.recipeId,
    name: revision.name,
    product: revision.product,
    machine: revision.machine,
    station: revision.station,
    parameters: [...revision.parameters].sort((left, right) => compareStrings(left.key, right.key)),
    requiredParameterKeys: [...revision.requiredParameterKeys].sort(),
    calibrationIds: [...revision.calibrationIds].sort(),
    requiredCalibrationIds: [...revision.requiredCalibrationIds].sort(),
    calibrationReferences: [...revision.calibrationReferences].sort((left, right) => compareStrings(left.calibrationId, right.calibrationId)),
  }
}

export function recipeContentHash(revision: Pick<RecipeRevision, 'recipeId' | 'name' | 'product' | 'machine' | 'station' | 'parameters' | 'requiredParameterKeys' | 'calibrationIds' | 'requiredCalibrationIds' | 'calibrationReferences'>): string {
  return hashCanonicalRecipe(contentPayload(revision))
}

function makeRevision(input: CreateDraftRecipeInput, options: RecipeRevisionOptions = {}): RecipeRevision {
  const recipeId = assertNonEmpty(input.recipeId, 'recipeId')
  const name = assertNonEmpty(input.name, 'name')
  const product = assertNonEmpty(input.product ?? input.productId, 'product')
  const machine = assertNonEmpty(input.machine ?? input.machineId, 'machine')
  const station = assertNonEmpty(input.station ?? input.stationId, 'station')
  const parameters = normalizeParameters(input.parameters)
  const requiredParameterKeys = normalizeIds(
    input.requiredParameterKeys ?? parameters.filter((parameter) => parameter.required !== false).map((parameter) => parameter.key),
    'requiredParameterKeys',
  )
  const calibrationReferences = normalizeCalibrationReferences(input.calibrationReferences)
  const calibrationIds = normalizeIds([
    ...(input.calibrationIds ?? []),
    ...calibrationReferences.map((reference) => reference.calibrationId),
  ], 'calibrationIds')
  const requiredCalibrationIds = normalizeIds(input.requiredCalibrationIds ?? calibrationIds, 'requiredCalibrationIds')
  const revision = {
    schemaVersion: 'recipe.v1',
    recipeId,
    revisionId: assertNonEmpty(options.revisionId ?? `${recipeId}-draft`, 'revisionId'),
    ...(options.parentRevisionId ? { parentRevisionId: options.parentRevisionId } : {}),
    name,
    product,
    machine,
    station,
    productId: product,
    machineId: machine,
    stationId: station,
    parameters,
    requiredParameterKeys,
    calibrationIds,
    requiredCalibrationIds,
    calibrationReferences,
    provenance: normalizeProvenance(input.provenance),
    status: 'draft' as const,
    contentHash: '',
    createdAt: options.createdAt ?? 0,
    updatedAt: options.createdAt ?? 0,
    transitionHistory: [{ status: 'draft', at: options.createdAt ?? 0 }],
  }
  revision.contentHash = recipeContentHash(revision)
  return freezeDeep(revision as RecipeRevision)
}

export function createDraftRecipe(input: CreateDraftRecipeInput, options: RecipeRevisionOptions = {}): RecipeRevision {
  return makeRevision(input, options)
}

function changesToInput(base: RecipeRevision, changes: RecipeRevisionChanges): CreateDraftRecipeInput {
  return {
    recipeId: base.recipeId,
    name: changes.name ?? base.name,
    product: changes.product ?? changes.productId ?? base.product,
    machine: changes.machine ?? changes.machineId ?? base.machine,
    station: changes.station ?? changes.stationId ?? base.station,
    parameters: changes.parameters ?? base.parameters,
    requiredParameterKeys: changes.requiredParameterKeys ?? base.requiredParameterKeys,
    calibrationIds: changes.calibrationIds ?? base.calibrationIds,
    requiredCalibrationIds: changes.requiredCalibrationIds ?? base.requiredCalibrationIds,
    calibrationReferences: changes.calibrationReferences ?? base.calibrationReferences,
    provenance: { ...base.provenance, ...changes.provenance },
  }
}

export function reviseRecipe(base: RecipeRevision, changes: RecipeRevisionChanges): RecipeRevision {
  if (!recipeStatuses.includes(base.status)) throw new Error(`unknown recipe status: ${base.status}`)
  return createDraftRecipe(changesToInput(base, changes), {
    revisionId: changes.revisionId ?? `${base.revisionId}-next`,
    parentRevisionId: base.revisionId,
    createdAt: changes.createdAt ?? base.updatedAt,
  })
}

function parameterMap(revision: RecipeRevision): Map<string, RecipeParameter> {
  return new Map(revision.parameters.map((parameter) => [parameter.key, parameter]))
}

function parameterWithoutValue(parameter: RecipeParameter): unknown {
  const { value: _value, ...metadata } = parameter
  return metadata
}

export function diffRecipes(before: RecipeRevision, after: RecipeRevision): RecipeDiff {
  const entries: RecipeDiffEntry[] = []
  const beforeParameters = parameterMap(before)
  const afterParameters = parameterMap(after)
  const keys = Array.from(new Set([...beforeParameters.keys(), ...afterParameters.keys()])).sort(compareStrings)

  keys.forEach((key) => {
    const left = beforeParameters.get(key)
    const right = afterParameters.get(key)
    if (!left || !right) {
      entries.push({ key, category: 'semantic', before: left?.value, after: right?.value, safetyCritical: right?.safetyCritical ?? left?.safetyCritical })
      return
    }
    const valuesAreNumbers = typeof left.value === 'number' && typeof right.value === 'number'
    const onlyValueChanged = canonicalValue(parameterWithoutValue(left)) === canonicalValue(parameterWithoutValue(right))
    if (valuesAreNumbers && onlyValueChanged && left.value !== right.value) {
      entries.push({ key, category: 'numeric', before: left.value, after: right.value, delta: right.value - left.value, unit: right.unit ?? left.unit, safetyCritical: right.safetyCritical ?? left.safetyCritical })
      return
    }
    if (canonicalValue(left) !== canonicalValue(right)) {
      entries.push({ key, category: 'semantic', before: left.value, after: right.value, unit: right.unit ?? left.unit, safetyCritical: right.safetyCritical ?? left.safetyCritical })
    }
  })

  const contexts: Array<keyof Pick<RecipeContext, 'product' | 'machine' | 'station'>> = ['product', 'machine', 'station']
  contexts.forEach((key) => {
    if (before[key] !== after[key]) entries.push({ key: `context.${key}`, category: 'semantic', before: before[key], after: after[key] })
  })
  if (before.name !== after.name) entries.push({ key: 'name', category: 'semantic', before: before.name, after: after.name })
  if (canonicalValue(before.requiredParameterKeys) !== canonicalValue(after.requiredParameterKeys)) {
    entries.push({ key: 'requiredParameterKeys', category: 'semantic', before: before.requiredParameterKeys, after: after.requiredParameterKeys })
  }
  if (canonicalValue(before.calibrationIds) !== canonicalValue(after.calibrationIds)) {
    entries.push({ key: 'calibrationIds', category: 'semantic', before: before.calibrationIds, after: after.calibrationIds })
  }
  if (canonicalValue(before.requiredCalibrationIds) !== canonicalValue(after.requiredCalibrationIds)) {
    entries.push({ key: 'requiredCalibrationIds', category: 'semantic', before: before.requiredCalibrationIds, after: after.requiredCalibrationIds })
  }
  if (canonicalValue(before.calibrationReferences) !== canonicalValue(after.calibrationReferences)) {
    entries.push({ key: 'calibrationReferences', category: 'semantic', before: before.calibrationReferences, after: after.calibrationReferences })
  }

  const numericChanges = entries.filter((entry) => entry.category === 'numeric')
  const semanticChanges = entries.filter((entry) => entry.category === 'semantic')
  return {
    changed: entries.length > 0,
    entries,
    numericChanges,
    semanticChanges,
    numeric: numericChanges,
    semantic: semanticChanges,
  }
}

function calibrationMap(values: readonly CalibrationReferenceInput[] | Readonly<Record<string, CalibrationReferenceInput>> | undefined): Map<string, CalibrationReference> {
  if (!values) return new Map()
  const entries = Array.isArray(values) ? values.map((reference) => normalizeCalibration(reference)).map((reference) => [reference.calibrationId, reference] as const) : Object.entries(values).map(([key, reference]) => {
    const normalized = normalizeCalibration({ ...reference, calibrationId: reference.calibrationId ?? key })
    return [normalized.calibrationId, normalized] as const
  })
  return new Map(entries)
}

export function validateRecipeForRun(recipe: RecipeRevision, options: RecipeRunValidationOptions = {}): RecipeRunValidation {
  const issues: RecipeValidationIssue[] = []
  const missingParameters: string[] = []
  const missingCalibrations: string[] = []
  const staleCalibrations: string[] = []
  const requiredParameterKeys = new Set(options.requiredParameterKeys ?? recipe.requiredParameterKeys)
  const parameters = parameterMap(recipe)

  requiredParameterKeys.forEach((key) => {
    const parameter = parameters.get(key)
    const value = parameter?.value
    if (!parameter || value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      missingParameters.push(key)
      issues.push({ code: 'missing-parameter', key, message: `Missing required recipe parameter: ${key}.` })
    }
  })

  recipe.parameters.forEach((parameter) => {
    if (parameter.value !== undefined && parameter.kind === 'numeric' && (typeof parameter.value !== 'number' || !Number.isFinite(parameter.value))) {
      issues.push({ code: 'invalid-parameter', key: parameter.key, message: `${parameter.key} must be a finite number.` })
    }
    if (typeof parameter.value === 'number' && ((parameter.min !== undefined && parameter.value < parameter.min) || (parameter.max !== undefined && parameter.value > parameter.max))) {
      issues.push({ code: 'invalid-parameter', key: parameter.key, message: `${parameter.key} is outside its allowed range.` })
    }
    if (parameter.kind === 'enum' && parameter.value !== undefined && parameter.allowedValues && !parameter.allowedValues.includes(String(parameter.value))) {
      issues.push({ code: 'invalid-parameter', key: parameter.key, message: `${parameter.key} is not an allowed value.` })
    }
  })

  const references = new Map(recipe.calibrationReferences.map((reference) => [reference.calibrationId, reference]))
  calibrationMap(options.calibrationReferences).forEach((reference, id) => references.set(id, reference))
  calibrationMap(options.calibrations).forEach((reference, id) => references.set(id, reference))
  const now = options.now ?? 0
  recipe.requiredCalibrationIds.forEach((calibrationId) => {
    const reference = references.get(calibrationId)
    if (!reference) {
      missingCalibrations.push(calibrationId)
      issues.push({ code: 'missing-calibration', calibrationId, message: `Missing required calibration reference: ${calibrationId}.` })
      return
    }
    const stale = reference.status === 'stale' || reference.status === 'invalid'
      || (reference.validUntil !== undefined && reference.validUntil <= now)
      || (reference.expiresAt !== undefined && reference.expiresAt <= now)
    if (stale) {
      staleCalibrations.push(calibrationId)
      issues.push({ code: 'stale-calibration', calibrationId, message: `Calibration ${calibrationId} is stale for this run.` })
    }
  })

  return {
    valid: issues.length === 0,
    issues,
    errors: issues.map((issue) => issue.message),
    missingParameters,
    missingCalibrations,
    staleCalibrations,
  }
}

export function transitionRecipe(recipe: RecipeRevision, nextStatus: RecipeStatus, options: RecipeTransitionOptions = {}): RecipeRevision {
  if (!recipeStatuses.includes(nextStatus)) throw new Error(`unknown recipe status: ${nextStatus}`)
  if (!allowedTransitions[recipe.status].includes(nextStatus)) {
    throw new Error(`recipe ${recipe.revisionId} cannot transition from ${recipe.status} to ${nextStatus}; expected ${allowedTransitions[recipe.status][0] ?? 'no further status'}`)
  }
  const at = options.at ?? recipe.updatedAt
  if (!Number.isFinite(at)) throw new Error('transition time must be finite')
  if (nextStatus === 'effective') {
    const validation = validateRecipeForRun(recipe, { now: at })
    if (!validation.valid) throw new Error(`recipe cannot become effective: ${validation.errors.join(' ')}`)
  }
  const transitioned: RecipeRevision = {
    ...cloneValue(recipe),
    status: nextStatus,
    updatedAt: at,
    transitionHistory: [
      ...recipe.transitionHistory,
      { status: nextStatus, at, ...(options.actor ? { actor: options.actor } : {}), ...(options.note ? { note: options.note } : {}) },
    ],
  }
  return freezeDeep(transitioned)
}

export function rollbackTarget(revisions: readonly RecipeRevision[], currentRevisionId?: string): RecipeRevision | undefined
export function rollbackTarget(current: RecipeRevision, revisions: readonly RecipeRevision[]): RecipeRevision | undefined
export function rollbackTarget(first: readonly RecipeRevision[] | RecipeRevision, second?: string | readonly RecipeRevision[]): RecipeRevision | undefined {
  let revisions: readonly RecipeRevision[]
  let currentRevisionId: string | undefined
  if (Array.isArray(first)) {
    revisions = first
    currentRevisionId = typeof second === 'string' ? second : undefined
  } else {
    revisions = Array.isArray(second) ? second : []
    currentRevisionId = (first as RecipeRevision).revisionId
  }
  if (!revisions || revisions.length === 0) return undefined
  const current = currentRevisionId ? revisions.find((revision) => revision.revisionId === currentRevisionId) : undefined
  const candidates = revisions.filter((revision) => revision.status === 'effective' && revision.revisionId !== currentRevisionId && (!current || revision.recipeId === current.recipeId))
  return candidates.at(-1)
}
