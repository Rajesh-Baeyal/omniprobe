import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  createDraftRecipe,
  diffRecipes,
  reviseRecipe,
  rollbackTarget,
  transitionRecipe,
  validateRecipeForRun,
  type RecipeParameter,
  type RecipeRevision,
} from '../core/recipes/recipeModel'
import { createRecipeStore } from '../core/recipes/recipeStore'
import { RecipeManagerPanel } from '../modules/recipe-manager/RecipeManagerPanel'

const recipeInput = {
  recipeId: 'resin-cure',
  name: 'Resin cure / Cell A',
  product: 'R-17',
  machine: 'Cell A',
  station: 'Dispense',
  parameters: [
    { key: 'temperature', label: 'Temperature', kind: 'numeric' as const, value: 180, unit: '°C', safetyCritical: true },
    { key: 'speed', label: 'Dispense speed', kind: 'numeric' as const, value: 10, unit: 'mm/s' },
    { key: 'mode', label: 'Mode', kind: 'enum' as const, value: 'slow', allowedValues: ['slow', 'fast'] },
  ],
  calibrationIds: ['camera-cell-a'],
  calibrationReferences: [{ calibrationId: 'camera-cell-a', status: 'valid' as const, validUntil: 2_000 }],
  provenance: { createdBy: 'operator-a', sourceRefs: ['fixture:recipe'] },
}

function effectiveRevision(): RecipeRevision {
  const draft = createDraftRecipe(recipeInput, { revisionId: 'resin-cure-r1', createdAt: 100 })
  const reviewed = transitionRecipe(draft, 'reviewed', { actor: 'reviewer', at: 110 })
  const approved = transitionRecipe(reviewed, 'approved', { actor: 'approver', at: 120 })
  return transitionRecipe(approved, 'effective', { actor: 'operator', at: 130 })
}

describe('immutable recipe lineage', () => {
  it('creates frozen revisions with canonical content hashes', () => {
    const first = createDraftRecipe(recipeInput, { revisionId: 'resin-cure-r1' })
    const reordered = createDraftRecipe({
      ...recipeInput,
      parameters: [...recipeInput.parameters].reverse(),
      calibrationReferences: [...recipeInput.calibrationReferences].reverse(),
    }, { revisionId: 'same-content' })

    expect(first.contentHash).toBe(reordered.contentHash)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.parameters)).toBe(true)
    expect(Object.isFrozen(first.parameters[0])).toBe(true)
    expect(() => (first.parameters as unknown as RecipeParameter[]).push(first.parameters[0])).toThrow()

    const revised = reviseRecipe(first, {
      revisionId: 'resin-cure-r2',
      parameters: first.parameters.map((parameter) => parameter.key === 'temperature' ? { ...parameter, value: 181 } : parameter),
    })

    expect(first.parameters.find((parameter) => parameter.key === 'temperature')?.value).toBe(180)
    expect(revised.parentRevisionId).toBe(first.revisionId)
    expect(revised.contentHash).not.toBe(first.contentHash)
    expect(revised.status).toBe('draft')
  })

  it('separates numeric changes from semantic changes', () => {
    const before = createDraftRecipe(recipeInput, { revisionId: 'resin-cure-r1' })
    const after = reviseRecipe(before, {
      revisionId: 'resin-cure-r2',
      parameters: before.parameters.map((parameter) => {
        if (parameter.key === 'speed') return { ...parameter, value: 11 }
        if (parameter.key === 'mode') return { ...parameter, value: 'fast' }
        return parameter
      }),
    })

    const diff = diffRecipes(before, after)

    expect(diff.changed).toBe(true)
    expect(diff.numericChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'speed', delta: 1 }),
    ]))
    expect(diff.semanticChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'mode', before: 'slow', after: 'fast' }),
    ]))
  })

  it('enforces the draft to retired approval lifecycle without mutating snapshots', () => {
    const draft = createDraftRecipe(recipeInput, { revisionId: 'resin-cure-r1' })
    const reviewed = transitionRecipe(draft, 'reviewed', { actor: 'reviewer', at: 110 })
    const approved = transitionRecipe(reviewed, 'approved', { actor: 'approver', at: 120 })
    const effective = transitionRecipe(approved, 'effective', { actor: 'operator', at: 130 })
    const retired = transitionRecipe(effective, 'retired', { actor: 'operator', at: 140 })

    expect([draft.status, reviewed.status, approved.status, effective.status, retired.status]).toEqual(['draft', 'reviewed', 'approved', 'effective', 'retired'])
    expect(approved.status).toBe('approved')
    expect(approved.contentHash).toBe(effective.contentHash)
    expect(retired.transitionHistory.map((entry) => entry.status)).toEqual(['draft', 'reviewed', 'approved', 'effective', 'retired'])
    expect(() => transitionRecipe(draft, 'approved')).toThrow(/reviewed/i)
    expect(() => transitionRecipe(approved, 'retired')).toThrow(/effective/i)
  })

  it('rejects missing required parameters and stale calibration lineage', () => {
    const missing = createDraftRecipe({
      ...recipeInput,
      parameters: recipeInput.parameters.map((parameter) => parameter.key === 'speed' ? { ...parameter, value: undefined } : parameter),
    })
    const missingResult = validateRecipeForRun(missing, { now: 100 })
    expect(missingResult.valid).toBe(false)
    expect(missingResult.missingParameters).toContain('speed')

    const stale = createDraftRecipe({
      ...recipeInput,
      calibrationReferences: [{ calibrationId: 'camera-cell-a', status: 'valid' as const, validUntil: 99 }],
    })
    const staleResult = validateRecipeForRun(stale, { now: 100 })
    expect(staleResult.valid).toBe(false)
    expect(staleResult.staleCalibrations).toContain('camera-cell-a')
    expect(() => transitionRecipe(transitionRecipe(stale, 'reviewed'), 'approved')).not.toThrow()
    expect(() => transitionRecipe(transitionRecipe(transitionRecipe(stale, 'reviewed'), 'approved'), 'effective', { at: 100 })).toThrow(/calibration/i)
  })

  it('selects the previous effective revision as a rollback target', () => {
    const first = effectiveRevision()
    const secondDraft = reviseRecipe(first, {
      revisionId: 'resin-cure-r2',
      parameters: first.parameters.map((parameter) => parameter.key === 'speed' ? { ...parameter, value: 12 } : parameter),
    })
    const second = transitionRecipe(
      transitionRecipe(transitionRecipe(secondDraft, 'reviewed', { actor: 'reviewer' }), 'approved', { actor: 'approver' }),
      'effective',
      { actor: 'operator', at: 200 },
    )

    expect(rollbackTarget([first, second], second.revisionId)).toEqual(first)
    expect(rollbackTarget([first], first.revisionId)).toBeUndefined()
  })
})

describe('recipe store and manager', () => {
  it('keeps revision history and exposes effective and rollback lookups', () => {
    const store = createRecipeStore()
    const first = effectiveRevision()
    store.save(first)
    const secondDraft = store.revise(first.revisionId, {
      revisionId: 'resin-cure-r2',
      parameters: first.parameters.map((parameter) => parameter.key === 'mode' ? { ...parameter, value: 'fast' } : parameter),
    })
    const secondReviewed = store.transition(secondDraft.revisionId, 'reviewed', { actor: 'reviewer' })
    const secondApproved = store.transition(secondReviewed.revisionId, 'approved', { actor: 'approver' })
    const secondEffective = store.transition(secondApproved.revisionId, 'effective', { actor: 'operator', at: 300 })

    expect(store.getEffective(first.recipeId)).toEqual(secondEffective)
    expect(store.history(first.recipeId).map((revision) => revision.revisionId)).toEqual(['resin-cure-r1', 'resin-cure-r2'])
    expect(store.rollbackTarget(first.recipeId, secondEffective.revisionId)).toEqual(first)
  })

  it('renders the compact lineage and safety lockout surface', () => {
    const markup = renderToStaticMarkup(createElement(RecipeManagerPanel, { initialRevision: effectiveRevision() }))

    expect(markup).toMatch(/Recipe Manager/)
    expect(markup).toMatch(/R-17/)
    expect(markup).toMatch(/Parameters/)
    expect(markup).toMatch(/effective/i)
    expect(markup).toMatch(/Parent revision/)
    expect(markup).toMatch(/Rollback target/)
    expect(markup).toMatch(/Safety-sensitive parameters are locked/i)
    expect(markup).toMatch(/SIMULATED|READ ONLY/i)
  })
})
