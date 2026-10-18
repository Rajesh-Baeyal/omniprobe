import {
  diffRecipes,
  reviseRecipe,
  rollbackTarget,
  transitionRecipe,
  type RecipeDiff,
  type RecipeRevision,
  type RecipeRevisionChanges,
  type RecipeStatus,
  type RecipeTransitionOptions,
} from './recipeModel'

export interface RecipeStore {
  save(revision: RecipeRevision): RecipeRevision
  add(revision: RecipeRevision): RecipeRevision
  put(revision: RecipeRevision): RecipeRevision
  get(revisionId: string): RecipeRevision | undefined
  get(recipeId: string, revisionId: string): RecipeRevision | undefined
  list(recipeId?: string): RecipeRevision[]
  history(recipeId: string): RecipeRevision[]
  effective(recipeId: string): RecipeRevision | undefined
  getEffective(recipeId: string): RecipeRevision | undefined
  revise(revisionId: string, changes: RecipeRevisionChanges): RecipeRevision
  transition(revisionId: string, status: RecipeStatus, options?: RecipeTransitionOptions): RecipeRevision
  diff(beforeRevisionId: string, afterRevisionId: string): RecipeDiff
  rollbackTarget(recipeId: string, currentRevisionId?: string): RecipeRevision | undefined
}

function assertRevision(revision: RecipeRevision): void {
  if (!revision || typeof revision !== 'object') throw new Error('recipe revision is required')
  if (typeof revision.recipeId !== 'string' || revision.recipeId.trim() === '') throw new Error('recipe revision requires recipeId')
  if (typeof revision.revisionId !== 'string' || revision.revisionId.trim() === '') throw new Error('recipe revision requires revisionId')
}

export function createRecipeStore(initialRevisions: readonly RecipeRevision[] = []): RecipeStore {
  const revisions = new Map<string, RecipeRevision>()
  initialRevisions.forEach((revision) => {
    if (revisions.has(revision.revisionId)) throw new Error(`recipe revision already stored: ${revision.revisionId}`)
    assertRevision(revision)
    revisions.set(revision.revisionId, revision)
  })

  const byId = (revisionId: string): RecipeRevision => {
    const revision = revisions.get(revisionId)
    if (!revision) throw new Error(`unknown recipe revision: ${revisionId}`)
    return revision
  }

  const list = (recipeId?: string): RecipeRevision[] => Array.from(revisions.values())
    .filter((revision) => recipeId === undefined || revision.recipeId === recipeId)
    .sort((left, right) => left.createdAt - right.createdAt || left.revisionId.localeCompare(right.revisionId))

  const save = (revision: RecipeRevision): RecipeRevision => {
    assertRevision(revision)
    if (revisions.has(revision.revisionId)) throw new Error(`recipe revision already stored: ${revision.revisionId}`)
    revisions.set(revision.revisionId, revision)
    return revision
  }

  const replace = (revision: RecipeRevision): RecipeRevision => {
    assertRevision(revision)
    revisions.set(revision.revisionId, revision)
    return revision
  }

  const get = (firstId: string, secondId?: string): RecipeRevision | undefined => {
    if (secondId !== undefined) {
      const revision = revisions.get(secondId)
      return revision?.recipeId === firstId ? revision : undefined
    }
    return revisions.get(firstId)
  }

  const effective = (recipeId: string): RecipeRevision | undefined => list(recipeId).filter((revision) => revision.status === 'effective').at(-1)

  return {
    save,
    add: save,
    put: save,
    get,
    list,
    history: (recipeId) => list(recipeId),
    effective,
    getEffective: effective,
    revise: (revisionId, changes) => {
      const revision = save(reviseRecipe(byId(revisionId), changes))
      return revision
    },
    transition: (revisionId, status, options) => replace(transitionRecipe(byId(revisionId), status, options)),
    diff: (beforeRevisionId, afterRevisionId) => diffRecipes(byId(beforeRevisionId), byId(afterRevisionId)),
    rollbackTarget: (recipeId, currentRevisionId) => rollbackTarget(list(recipeId), currentRevisionId),
  }
}

export default createRecipeStore
