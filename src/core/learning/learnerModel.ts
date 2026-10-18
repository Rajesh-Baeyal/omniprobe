import { LEARNING_DOMAINS, type LearningDomain } from './terminology'

export type ConfidenceAnchor = 'not-sure' | 'new' | 'familiar' | 'can-explain' | 'can-apply'
export type EvidenceOutcome = 'attempted' | 'guided' | 'demonstrated' | 'needs-support' | 'failed'

export const CONFIDENCE_ANCHORS: readonly { value: ConfidenceAnchor; score: number; label: string; description: string }[] = [
  { value: 'not-sure', score: 0, label: 'Not sure', description: 'I do not know this yet.' },
  { value: 'new', score: 1, label: 'New', description: 'I recognize the idea but need examples.' },
  { value: 'familiar', score: 2, label: 'Familiar', description: 'I can follow an example and explain the main idea.' },
  { value: 'can-explain', score: 3, label: 'Can explain', description: 'I can explain the idea and spot common errors.' },
  { value: 'can-apply', score: 4, label: 'Can apply', description: 'I can use it in a new, bounded scenario.' },
]

export interface DiagnosticProbeResult {
  probeId: string
  domain: LearningDomain
  response: ConfidenceAnchor | 'not-sure' | string
  notes?: string
}

export interface CapabilityEvidence {
  evidenceId: string
  lessonId: string
  domain: LearningDomain
  outcome: EvidenceOutcome
  score?: number
  capturedAt: number
  nextReviewAt?: number
  hintsUsed?: number
  artifactId?: string
  notes?: string
}

export interface LearnerProfile {
  learnerId: string
  role: string
  goals: string[]
  domains: LearningDomain[]
  notSureDomains: LearningDomain[]
  confidenceByDomain: Record<LearningDomain, number>
  confidenceAnchors: Partial<Record<LearningDomain, ConfidenceAnchor>>
  diagnosticProbes: DiagnosticProbeResult[]
  evidence: CapabilityEvidence[]
  evidenceByDomain: Record<LearningDomain, CapabilityEvidence[]>
  masteryByDomain: Record<LearningDomain, number>
  acknowledgedSafetyGates: string[]
  createdAt: number
  profileVersion: string
}

export interface DiagnosticProfileInput {
  learnerId?: string
  role?: string
  goals?: string[]
  domains?: readonly LearningDomain[]
  domainInterests?: readonly LearningDomain[]
  notSureDomains?: readonly LearningDomain[]
  confidenceByDomain?: Partial<Record<LearningDomain, ConfidenceAnchor | number>>
  confidenceAnchors?: Partial<Record<LearningDomain, ConfidenceAnchor | number>>
  diagnosticProbes?: readonly DiagnosticProbeResult[]
  probes?: readonly DiagnosticProbeResult[]
  createdAt?: number
}

export type EvidenceInput = Omit<CapabilityEvidence, 'evidenceId'> & { evidenceId?: string }

const confidenceScore = (value: ConfidenceAnchor | number | undefined): number => {
  if (typeof value === 'number') return Math.max(0, Math.min(4, value))
  return CONFIDENCE_ANCHORS.find((anchor) => anchor.value === value)?.score ?? 0
}

const confidenceAnchor = (value: ConfidenceAnchor | number | undefined): ConfidenceAnchor => {
  if (typeof value === 'string' && CONFIDENCE_ANCHORS.some((anchor) => anchor.value === value)) return value
  const score = confidenceScore(value)
  return CONFIDENCE_ANCHORS.reduce((closest, anchor) => Math.abs(anchor.score - score) < Math.abs(closest.score - score) ? anchor : closest).value
}

const scoreForOutcome = (outcome: EvidenceOutcome): number => ({
  attempted: 0.35,
  guided: 0.6,
  demonstrated: 1,
  'needs-support': 0.25,
  failed: 0,
}[outcome])

const emptyByDomain = (): Record<LearningDomain, CapabilityEvidence[]> => Object.fromEntries(
  LEARNING_DOMAINS.map((domain) => [domain, []]),
) as unknown as Record<LearningDomain, CapabilityEvidence[]>

const aggregateEvidence = (evidence: readonly CapabilityEvidence[]) => {
  const evidenceByDomain = emptyByDomain()
  evidence.forEach((item) => {
    evidenceByDomain[item.domain]?.push({ ...item })
  })
  const masteryByDomain = Object.fromEntries(LEARNING_DOMAINS.map((domain) => {
    const items = evidenceByDomain[domain]
    return [domain, items.length === 0 ? 0 : items.reduce((sum, item) => sum + (item.score ?? scoreForOutcome(item.outcome)), 0) / items.length]
  })) as Record<LearningDomain, number>
  return { evidenceByDomain, masteryByDomain }
}

export function buildDiagnosticProfile(input: DiagnosticProfileInput = {}): LearnerProfile {
  const domains = [...(input.domains ?? input.domainInterests ?? LEARNING_DOMAINS)]
  const confidenceInputs = input.confidenceByDomain ?? input.confidenceAnchors ?? {}
  const notSureDomains = [...(input.notSureDomains ?? [])].filter((domain) => domains.includes(domain))
  const confidenceByDomain = Object.fromEntries(LEARNING_DOMAINS.map((domain) => [domain, confidenceScore(confidenceInputs[domain])])) as Record<LearningDomain, number>
  const confidenceAnchors = Object.fromEntries(domains.map((domain) => [domain, confidenceAnchor(confidenceInputs[domain] ?? (notSureDomains.includes(domain) ? 'not-sure' : undefined))])) as Partial<Record<LearningDomain, ConfidenceAnchor>>
  const effectiveNotSureDomains = LEARNING_DOMAINS.filter((domain) => notSureDomains.includes(domain) || confidenceAnchors[domain] === 'not-sure')
  const diagnosticProbes = [...(input.diagnosticProbes ?? input.probes ?? [])].map((probe) => ({ ...probe }))
  const { evidenceByDomain, masteryByDomain } = aggregateEvidence([])

  return {
    learnerId: input.learnerId ?? 'local-learner',
    role: input.role?.trim() || 'industrial learner',
    goals: [...(input.goals ?? [])].filter(Boolean),
    domains: [...new Set(domains)],
    notSureDomains: effectiveNotSureDomains,
    confidenceByDomain,
    confidenceAnchors,
    diagnosticProbes,
    evidence: [],
    evidenceByDomain,
    masteryByDomain,
    acknowledgedSafetyGates: [],
    createdAt: input.createdAt ?? 0,
    profileVersion: 'learning-profile.v1',
  }
}

export function recordEvidence(profile: LearnerProfile, input: EvidenceInput): LearnerProfile {
  const evidence: CapabilityEvidence = {
    ...input,
    evidenceId: input.evidenceId ?? `${input.lessonId}-${profile.evidence.length + 1}`,
    score: input.score === undefined ? scoreForOutcome(input.outcome) : Math.max(0, Math.min(1, input.score)),
    capturedAt: Number.isFinite(input.capturedAt) ? input.capturedAt : 0,
  }
  const nextEvidence = [...profile.evidence.filter((item) => item.evidenceId !== evidence.evidenceId), evidence]
  const aggregates = aggregateEvidence(nextEvidence)
  return {
    ...profile,
    evidence: nextEvidence.map((item) => ({ ...item })),
    evidenceByDomain: aggregates.evidenceByDomain,
    masteryByDomain: aggregates.masteryByDomain,
    domains: [...profile.domains],
    goals: [...profile.goals],
    notSureDomains: [...profile.notSureDomains],
    confidenceByDomain: { ...profile.confidenceByDomain },
    confidenceAnchors: { ...profile.confidenceAnchors },
    diagnosticProbes: profile.diagnosticProbes.map((probe) => ({ ...probe })),
    acknowledgedSafetyGates: [...profile.acknowledgedSafetyGates],
  }
}

export function acknowledgeSafetyGate(profile: LearnerProfile, gateId: string): LearnerProfile {
  if (!gateId.trim() || profile.acknowledgedSafetyGates.includes(gateId)) return profile
  return { ...profile, acknowledgedSafetyGates: [...profile.acknowledgedSafetyGates, gateId] }
}

export function getEvidenceScore(evidence: CapabilityEvidence): number {
  return evidence.score ?? scoreForOutcome(evidence.outcome)
}
