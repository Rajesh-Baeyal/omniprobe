import { useMemo, useState, type FormEvent } from 'react'
import {
  acknowledgeSafetyGate,
  buildDiagnosticProfile,
  CONFIDENCE_ANCHORS,
  recordEvidence,
  type ConfidenceAnchor,
  type EvidenceOutcome,
  type LearnerProfile,
} from '../../core/learning/learnerModel'
import { explainLessonChoice, selectNextLesson } from '../../core/learning/adaptiveRoute'
import { getLessonSteps, LESSON_LIBRARY, type LessonDefinition } from '../../core/learning/lessonModel'
import { LEARNING_DOMAINS, type LearningDomain } from '../../core/learning/terminology'

export interface LearningStudioPanelProps {
  initialProfile?: LearnerProfile
  lessons?: readonly LessonDefinition[]
  onProfileChange?: (profile: LearnerProfile) => void
  onEvidenceCaptured?: (profile: LearnerProfile) => void
  className?: string
}

const domainLabels: Record<LearningDomain, string> = {
  plc: 'PLC',
  robotics: 'Robotics',
  motion: 'Motion',
  'serial-communication': 'Serial communication',
  'tcp-udp': 'TCP / UDP',
  vision: 'Vision',
  recipes: 'Recipes',
  safety: 'Safety',
  'ot-cybersecurity': 'OT cybersecurity',
}

const probePrompts: Record<LearningDomain, string> = {
  plc: 'Can you describe what happens during one PLC scan?',
  robotics: 'Can you name the frame for a robot target?',
  motion: 'Can you explain why a motion reference is needed?',
  'serial-communication': 'Can you identify the integrity check in a serial frame?',
  'tcp-udp': 'Can you separate a TCP handshake from application timing?',
  vision: 'Can you explain what a calibration residual means?',
  recipes: 'Can you identify the exact recipe revision used by a run?',
  safety: 'Can you separate an observation from a safety authorization?',
  'ot-cybersecurity': 'Can you choose read-only access for a trace review?',
}

const stepIndexByKind = { worked: 0, guided: 1, fading: 2, independent: 3, troubleshooting: 4 } as const

export function LearningStudioPanel({
  initialProfile,
  lessons = LESSON_LIBRARY,
  onProfileChange,
  onEvidenceCaptured,
  className = '',
}: LearningStudioPanelProps) {
  const [profile, setProfile] = useState<LearnerProfile | null>(initialProfile ?? null)
  const [role, setRole] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<LearningDomain[]>(['plc', 'serial-communication'])
  const [notSureDomains, setNotSureDomains] = useState<LearningDomain[]>(['plc'])
  const [confidence, setConfidence] = useState<ConfidenceAnchor>('not-sure')
  const [probeResponses, setProbeResponses] = useState<Record<string, ConfidenceAnchor>>({})
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [lastCaptured, setLastCaptured] = useState<EvidenceOutcome | null>(null)

  const selectedLesson = useMemo(() => profile ? selectNextLesson(profile, lessons, { now: 0 }) : undefined, [lessons, profile])
  const lessonSteps = selectedLesson ? getLessonSteps(selectedLesson) : []
  const currentStep = lessonSteps[currentStepIndex] ?? lessonSteps[0]

  const updateProfile = (next: LearnerProfile) => {
    setProfile(next)
    onProfileChange?.(next)
  }

  const toggleDomain = (domain: LearningDomain) => {
    setSelectedDomains((current) => current.includes(domain) ? current.filter((item) => item !== domain) : [...current, domain])
  }

  const toggleNotSure = (domain: LearningDomain) => {
    setNotSureDomains((current) => current.includes(domain) ? current.filter((item) => item !== domain) : [...current, domain])
  }

  const startOnboarding = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const probes = selectedDomains.slice(0, 2).map((domain, index) => ({
      probeId: `onboarding-${index + 1}`,
      domain,
      response: probeResponses[domain] ?? 'not-sure',
    }))
    const next = buildDiagnosticProfile({
      role,
      goals: goal.trim() ? [goal.trim()] : [],
      domains: selectedDomains.length > 0 ? selectedDomains : ['plc'],
      notSureDomains,
      confidenceByDomain: Object.fromEntries(selectedDomains.map((domain) => [domain, notSureDomains.includes(domain) ? 'not-sure' : confidence])),
      diagnosticProbes: probes,
    })
    updateProfile(next)
  }

  const captureEvidence = (outcome: EvidenceOutcome) => {
    if (!profile || !selectedLesson) return
    const next = recordEvidence(profile, {
      lessonId: selectedLesson.lessonId,
      domain: selectedLesson.domain,
      outcome,
      capturedAt: 0,
      nextReviewAt: outcome === 'demonstrated' ? selectedLesson.reviewIntervalDays : 0,
      hintsUsed: showHint ? 1 : 0,
      artifactId: selectedLesson.artifact.artifactId,
    })
    setLastCaptured(outcome)
    setCurrentStepIndex(0)
    setShowHint(false)
    setShowReveal(false)
    updateProfile(next)
    onEvidenceCaptured?.(next)
  }

  const acknowledgeGate = () => {
    if (!profile || !selectedLesson?.safetyGate) return
    updateProfile(acknowledgeSafetyGate(profile, selectedLesson.safetyGate.gateId))
  }

  const exportArtifact = () => {
    if (!selectedLesson || typeof document === 'undefined') return
    const payload = JSON.stringify({
      artifactId: selectedLesson.artifact.artifactId,
      label: selectedLesson.artifact.label,
      mode: 'SIMULATED',
      authority: 'READ_ONLY',
      lessonId: selectedLesson.lessonId,
      fields: selectedLesson.artifact.fields,
    }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${selectedLesson.artifact.artifactId}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className={`instrument-panel panel-grid min-w-0 overflow-hidden rounded-sm p-4 text-slate-100 ${className}`} aria-label="Learning Studio">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="eyebrow text-cyan">LEARNING STUDIO / OFFLINE DIAGNOSTIC</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Build useful evidence, one bounded step at a time</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">No credential is assigned. The route is a product hypothesis that adapts to your evidence and keeps the work simulated and read-only.</p>
        </div>
        <div className="border border-lime/30 bg-lime/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[.13em] text-lime">SIMULATED · READ ONLY</div>
      </header>

      {!profile ? (
        <form className="mt-5 grid gap-5" onSubmit={startOnboarding}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              <span className="eyebrow">Your role</span>
              <input aria-label="Your role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. controls technician" className="border border-line bg-ink/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan" />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              <span className="eyebrow">Your goal</span>
              <input aria-label="Your goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. troubleshoot frame timing" className="border border-line bg-ink/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan" />
            </label>
          </div>

          <fieldset className="border border-line p-3">
            <legend className="eyebrow px-1">Choose domains to explore</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {LEARNING_DOMAINS.map((domain) => (
                <label key={domain} className="flex items-center gap-2 border border-line/70 px-2 py-2 text-xs text-slate-300">
                  <input type="checkbox" checked={selectedDomains.includes(domain)} onChange={() => toggleDomain(domain)} />
                  {domainLabels[domain]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border border-line p-3">
            <legend className="eyebrow px-1">Confidence anchors</legend>
            <div className="grid gap-2 sm:grid-cols-5">
              {CONFIDENCE_ANCHORS.map((anchor) => (
                <label key={anchor.value} className={`border px-2 py-2 text-xs ${confidence === anchor.value ? 'border-cyan bg-cyan/10 text-cyan' : 'border-line text-slate-400'}`}>
                  <input className="sr-only" type="radio" name="confidence" value={anchor.value} checked={confidence === anchor.value} onChange={() => setConfidence(anchor.value)} />
                  <span className="block font-medium">{anchor.label}</span>
                  <span className="mt-1 block text-[10px] text-slate-500">{anchor.description}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Choosing <strong className="font-medium text-slate-300">not sure</strong> is a valid starting point, not a penalty.</p>
          </fieldset>

          <div className="grid gap-3 border border-line p-3">
            <div>
              <div className="eyebrow">Low-stakes diagnostic probes</div>
              <p className="mt-1 text-xs text-slate-500">Answer up to two prompts. Your responses guide the first lesson; they are not a pass/fail exam.</p>
            </div>
            {selectedDomains.slice(0, 2).map((domain, index) => (
              <div key={domain} className="grid gap-2 border-l-2 border-cyan/40 pl-3">
                <span className="text-sm text-slate-300">Probe {index + 1}: {probePrompts[domain]}</span>
                <select aria-label={`Diagnostic probe ${index + 1}`} value={probeResponses[domain] ?? 'not-sure'} onChange={(event) => setProbeResponses((current) => ({ ...current, [domain]: event.target.value as ConfidenceAnchor }))} className="max-w-sm border border-line bg-ink px-2 py-2 text-xs text-slate-200">
                  {CONFIDENCE_ANCHORS.map((anchor) => <option key={anchor.value} value={anchor.value}>{anchor.label}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={notSureDomains.includes(domain)} onChange={() => toggleNotSure(domain)} /> Mark this domain “not sure”</label>
              </div>
            ))}
          </div>

          <button type="submit" className="justify-self-start border border-cyan bg-cyan/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[.14em] text-cyan transition hover:bg-cyan/20">Start low-stakes diagnostic</button>
        </form>
      ) : (
        <div className="mt-5 grid gap-5">
          <section aria-labelledby="progress-title">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 id="progress-title" className="eyebrow text-slate-300">Progress by domain</h3>
              <span className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-600">Evidence, not credential</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {profile.domains.map((domain) => {
                const value = Math.round((profile.masteryByDomain[domain] ?? 0) * 100)
                return <div key={domain} className="border border-line bg-ink/40 p-2"><div className="flex justify-between gap-2 text-xs text-slate-400"><span>{domainLabels[domain]}</span><span className="font-mono text-cyan">{value}%</span></div><div className="mt-2 h-1 bg-line"><div className="h-1 bg-cyan" style={{ width: `${value}%` }} /></div></div>
              })}
            </div>
          </section>

          {selectedLesson ? (
            <section aria-labelledby="lesson-title" className="grid gap-4 border border-line bg-panel/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="eyebrow text-cyan">NEXT BOUNDED PRACTICE · {domainLabels[selectedLesson.domain]}</div>
                  <h3 id="lesson-title" className="mt-1 text-lg font-medium">{selectedLesson.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{selectedLesson.objective}</p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-600">{selectedLesson.estimatedMinutes} min · hypothesis route</span>
              </div>

              <div className="border-l-2 border-amber/60 bg-amber/5 px-3 py-2 text-xs text-slate-400"><strong className="font-medium text-amber">Why this lesson:</strong> {explainLessonChoice(profile, selectedLesson)}</div>
              <div className="border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-slate-400"><strong className="font-medium text-danger">Safety boundary:</strong> {selectedLesson.safetyBoundary}</div>

              {selectedLesson.safetyGate && !profile.acknowledgedSafetyGates.includes(selectedLesson.safetyGate.gateId) && (
                <div className="grid gap-2 border border-amber/40 bg-amber/5 p-3 text-xs text-slate-300">
                  <strong className="text-amber">Safety gate: {selectedLesson.safetyGate.label}</strong>
                  <span>{selectedLesson.safetyGate.boundary}</span>
                  <button type="button" onClick={acknowledgeGate} className="justify-self-start border border-amber/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-amber">Acknowledge educational boundary</button>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="border border-line p-3">
                  <div className="mb-2 flex items-center justify-between gap-3"><span className="eyebrow">Step {currentStepIndex + 1} / {lessonSteps.length} · {currentStep?.kind}</span><span className="font-mono text-[10px] text-slate-600">{currentStep?.title}</span></div>
                  <p className="text-sm text-slate-300">{currentStep?.instruction}</p>
                  <p className="mt-2 text-xs text-slate-500"><span className="text-slate-400">Your action:</span> {currentStep?.expectedAction}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setShowHint((value) => !value)} className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-slate-300">{showHint ? 'Hide hint' : 'Show hint'}</button>
                    <button type="button" onClick={() => setShowReveal((value) => !value)} className="border border-cyan/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-cyan">{showReveal ? 'Hide reveal' : 'Reveal worked example'}</button>
                    {currentStepIndex < lessonSteps.length - 1 && <button type="button" onClick={() => { setCurrentStepIndex((value) => value + 1); setShowHint(false); setShowReveal(false) }} className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-slate-300">Continue step</button>}
                  </div>
                  {showHint && <p className="mt-3 border-l-2 border-lime/50 pl-2 text-xs text-lime">Hint: {currentStep?.hint}</p>}
                  {showReveal && <p className="mt-3 border-l-2 border-cyan/50 pl-2 text-xs text-cyan">Reveal: {currentStep?.reveal}</p>}
                </div>
                <div className="flex min-w-[180px] flex-col gap-2 border border-line p-3">
                  <span className="eyebrow">Evidence capture</span>
                  <span className="text-xs text-slate-500">Record what happened without claiming live authorization.</span>
                  <button type="button" onClick={() => captureEvidence('demonstrated')} className="mt-auto border border-lime/50 bg-lime/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[.1em] text-lime">I can do this</button>
                  <button type="button" onClick={() => captureEvidence('needs-support')} className="border border-amber/50 px-3 py-2 font-mono text-[10px] uppercase tracking-[.1em] text-amber">Need more practice</button>
                  {lastCaptured && <span className="text-[10px] text-slate-500">Saved: {lastCaptured.replace('-', ' ')}</span>}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="border border-line p-3">
                  <div className="eyebrow">Glossary moments</div>
                  <div className="mt-2 grid gap-2">
                    {selectedLesson.terms.map((termId) => <details key={termId} className="border border-line/70 px-2 py-2 text-xs"><summary className="cursor-pointer text-cyan">Glossary · {termId}</summary><p className="mt-2 text-slate-400">Use this term in the {domainLabels[selectedLesson.domain]} context while you work.</p></details>)}
                  </div>
                </div>
                <div className="border border-line p-3">
                  <div className="eyebrow">Safe artifact</div>
                  <p className="mt-2 text-xs text-slate-500">{selectedLesson.artifact.label} · JSON · no credentials, commands, or machine paths.</p>
                  <button type="button" onClick={exportArtifact} className="mt-3 border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-slate-300">Export safe artifact</button>
                </div>
              </div>
            </section>
          ) : <div className="border border-line p-4 text-sm text-slate-500">No eligible lesson is available yet. Complete the prerequisite or acknowledge its educational safety boundary to continue.</div>}
        </div>
      )}
    </section>
  )
}

export default LearningStudioPanel
