import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LearningStudioPanel } from '../modules/learning-studio/LearningStudioPanel'
import { getTermInContext } from '../core/learning/terminology'
import { buildDiagnosticProfile, recordEvidence } from '../core/learning/learnerModel'
import { LESSON_LIBRARY, type LessonDefinition } from '../core/learning/lessonModel'
import { selectNextLesson } from '../core/learning/adaptiveRoute'

const profileInput = {
  learnerId: 'operator-01',
  role: 'controls technician',
  goals: ['troubleshoot faults'],
  domains: ['plc', 'serial-communication'] as const,
  notSureDomains: ['plc'] as const,
  confidenceByDomain: { plc: 'not-sure', 'serial-communication': 'familiar' } as const,
  diagnosticProbes: [
    { probeId: 'plc-scan', domain: 'plc' as const, response: 'not-sure' as const },
    { probeId: 'serial-frame', domain: 'serial-communication' as const, response: 'can-explain' as const },
  ],
}

describe('learning studio foundations', () => {
  it('builds a low-stakes profile with confidence anchors and per-domain evidence', () => {
    const profile = buildDiagnosticProfile(profileInput)

    expect(profile.role).toBe('controls technician')
    expect(profile.goals).toEqual(['troubleshoot faults'])
    expect(profile.notSureDomains).toEqual(['plc'])
    expect(profile.confidenceByDomain.plc).toBe(0)
    expect(profile.confidenceByDomain['serial-communication']).toBe(2)
    expect(profile.evidenceByDomain.plc).toEqual([])
    expect(profile.diagnosticProbes).toHaveLength(2)
  })

  it('returns terminology in the requested industrial context', () => {
    const term = getTermInContext('crc', 'serial-communication')

    expect(term).toBeDefined()
    expect(term?.label).toBe('CRC')
    expect(term?.contextualDefinition).toMatch(/frame|serial/i)
  })

  it('filters lessons until prerequisites and safety gates are satisfied', () => {
    const profile = buildDiagnosticProfile(profileInput)
    const gatedLessons: LessonDefinition[] = [
      LESSON_LIBRARY.find((lesson) => lesson.lessonId === 'plc-scan-cycle')!,
      {
        ...LESSON_LIBRARY.find((lesson) => lesson.lessonId === 'serial-frame')!,
        lessonId: 'serial-frame-gated',
        prerequisites: [{ lessonId: 'plc-scan-cycle', minimumScore: 0.7 }],
        safetyGate: { gateId: 'bench-isolation', label: 'Bench isolation confirmed', requiredAcknowledgement: true, boundary: 'Use simulated frames only.' },
      },
    ]

    expect(selectNextLesson(profile, gatedLessons, { now: 100 })).toMatchObject({ lessonId: 'plc-scan-cycle' })

    const demonstrated = recordEvidence(profile, {
      evidenceId: 'ev-plc-1',
      lessonId: 'plc-scan-cycle',
      domain: 'plc',
      outcome: 'demonstrated',
      score: 0.9,
      capturedAt: 100,
    })

    expect(selectNextLesson(demonstrated, gatedLessons, { now: 100 })).toMatchObject({ lessonId: 'plc-scan-cycle' })
    const acknowledged = { ...demonstrated, acknowledgedSafetyGates: ['bench-isolation'] }
    expect(selectNextLesson(acknowledged, gatedLessons, { now: 100 })).toMatchObject({ lessonId: 'serial-frame-gated' })
  })

  it('aggregates evidence by domain and preserves immutable profile history', () => {
    const profile = buildDiagnosticProfile(profileInput)
    const updated = recordEvidence(profile, {
      evidenceId: 'ev-serial-1',
      lessonId: 'serial-frame',
      domain: 'serial-communication',
      outcome: 'guided',
      score: 0.6,
      capturedAt: 200,
      nextReviewAt: 500,
    })

    expect(profile.evidence).toEqual([])
    expect(updated.evidenceByDomain['serial-communication']).toHaveLength(1)
    expect(updated.masteryByDomain['serial-communication']).toBe(0.6)
    expect(updated.evidence[0]).toMatchObject({ lessonId: 'serial-frame', outcome: 'guided' })
  })

  it('prioritizes due spaced review and uses stable ordering for ties', () => {
    const profile = buildDiagnosticProfile(profileInput)
    const reviewed = recordEvidence(profile, {
      evidenceId: 'ev-serial-1',
      lessonId: 'serial-frame',
      domain: 'serial-communication',
      outcome: 'demonstrated',
      score: 1,
      capturedAt: 100,
      nextReviewAt: 50,
    })
    const candidates = LESSON_LIBRARY.filter((lesson) => ['serial-frame', 'tcp-round-trip'].includes(lesson.lessonId))

    expect(selectNextLesson(reviewed, candidates, { now: 100 })?.lessonId).toBe('serial-frame')
    expect(selectNextLesson(profile, candidates, { now: 100 })?.lessonId).toBe('serial-frame')
  })

  it('renders onboarding and lesson-runner affordances without a backend', () => {
    const onboarding = renderToStaticMarkup(createElement(LearningStudioPanel, { lessons: LESSON_LIBRARY }))
    const profile = buildDiagnosticProfile(profileInput)
    const lessonRunner = renderToStaticMarkup(createElement(LearningStudioPanel, { initialProfile: profile, lessons: LESSON_LIBRARY }))

    expect(onboarding).toMatch(/Learning Studio/)
    expect(onboarding).toMatch(/not sure/i)
    expect(onboarding).toMatch(/confidence anchors/i)
    expect(onboarding).toMatch(/diagnostic probe/i)
    expect(lessonRunner).toMatch(/Why this lesson/i)
    expect(lessonRunner).toMatch(/Reveal worked example/i)
    expect(lessonRunner).toMatch(/Glossary/i)
    expect(lessonRunner).toMatch(/Progress by domain/i)
    expect(lessonRunner).toMatch(/SIMULATED|educational estimate/i)
  })
})
