import { getEvidenceScore, type LearnerProfile } from './learnerModel'
import { type LessonDefinition, type LessonPrerequisite } from './lessonModel'

export interface RouteOptions {
  now?: number
}

const prerequisiteSatisfied = (profile: LearnerProfile, prerequisite: LessonPrerequisite): boolean => {
  const requirement = typeof prerequisite === 'string' ? { lessonId: prerequisite } : prerequisite
  if (requirement.domain && (profile.masteryByDomain[requirement.domain] ?? 0) < (requirement.minimumScore ?? 0.7)) return false
  if (!requirement.lessonId) return true
  const evidence = profile.evidence.filter((item) => item.lessonId === requirement.lessonId)
  if (evidence.length < (requirement.minimumEvidence ?? 1)) return false
  return Math.max(...evidence.map(getEvidenceScore)) >= (requirement.minimumScore ?? 0.7)
}

const safetyGateSatisfied = (profile: LearnerProfile, lesson: LessonDefinition): boolean => {
  const gate = lesson.safetyGate
  return !gate || !gate.requiredAcknowledgement || profile.acknowledgedSafetyGates.includes(gate.gateId)
}

const lessonEvidence = (profile: LearnerProfile, lessonId: string) => profile.evidence.filter((item) => item.lessonId === lessonId)

const lessonMastery = (profile: LearnerProfile, lessonId: string): number => {
  const evidence = lessonEvidence(profile, lessonId)
  return evidence.length === 0 ? 0 : evidence.reduce((sum, item) => sum + getEvidenceScore(item), 0) / evidence.length
}

const dueAt = (profile: LearnerProfile, lessonId: string): number | undefined => {
  const dueDates = lessonEvidence(profile, lessonId).map((item) => item.nextReviewAt).filter((value): value is number => value !== undefined)
  return dueDates.length === 0 ? undefined : Math.min(...dueDates)
}

/**
 * Product hypothesis for the first offline route: remove lessons whose
 * prerequisites or safety boundaries are not satisfied, then prefer due
 * spaced review, lower demonstrated mastery, and finally lesson id. This is
 * a deterministic teaching heuristic, not a validated assessment score.
 */
export function selectNextLesson(profile: LearnerProfile, lessons: readonly LessonDefinition[], options: RouteOptions = {}): LessonDefinition | undefined {
  const now = options.now ?? 0
  const eligible = lessons.filter((lesson) => lesson.prerequisites.every((prerequisite) => prerequisiteSatisfied(profile, prerequisite)) && safetyGateSatisfied(profile, lesson))
  return [...eligible].sort((left, right) => {
    const leftDue = dueAt(profile, left.lessonId)
    const rightDue = dueAt(profile, right.lessonId)
    const leftIsDue = leftDue !== undefined && leftDue <= now
    const rightIsDue = rightDue !== undefined && rightDue <= now
    if (leftIsDue !== rightIsDue) return leftIsDue ? -1 : 1
    if (leftIsDue && rightIsDue && leftDue !== rightDue) return (leftDue ?? 0) - (rightDue ?? 0)
    const masteryDifference = lessonMastery(profile, left.lessonId) - lessonMastery(profile, right.lessonId)
    if (masteryDifference !== 0) return masteryDifference
    return left.lessonId.localeCompare(right.lessonId)
  })[0]
}

export function explainLessonChoice(profile: LearnerProfile, lesson: LessonDefinition, now = 0): string {
  const due = dueAt(profile, lesson.lessonId)
  if (due !== undefined && due <= now) return 'This lesson is due for spaced review based on the evidence you recorded.'
  if (lessonMastery(profile, lesson.lessonId) === 0) return 'This is a new bounded practice opportunity for the selected domain.'
  return 'This lesson is selected because its current evidence shows room for another practice pass.'
}
