import { LEARNING_DOMAINS, type LearningDomain } from './terminology'

export type LessonStepKind = 'worked' | 'guided' | 'fading' | 'independent' | 'troubleshooting'

export interface LessonStep {
  stepId: string
  kind: LessonStepKind
  title: string
  instruction: string
  expectedAction: string
  hint: string
  reveal: string
}

export type LessonPrerequisite = string | {
  lessonId?: string
  domain?: LearningDomain
  minimumScore?: number
  minimumEvidence?: number
}

export interface SafetyGate {
  gateId: string
  label: string
  boundary: string
  requiredAcknowledgement: boolean
}

export interface LessonArtifact {
  artifactId: string
  label: string
  format: 'json'
  fields: string[]
  safeForExport: boolean
}

export interface RubricCriterion {
  criterionId: string
  label: string
  description: string
}

export interface LessonDefinition {
  lessonId: string
  title: string
  domain: LearningDomain
  objective: string
  whyThisLesson: string
  prerequisites: LessonPrerequisite[]
  safetyGate?: SafetyGate
  safetyBoundary: string
  workedExample: LessonStep
  guidedAction: LessonStep
  fading: LessonStep
  independentTask: LessonStep
  troubleshootingVariant: LessonStep
  terms: string[]
  hints: string[]
  artifact: LessonArtifact
  rubric: RubricCriterion[]
  estimatedMinutes: number
  reviewIntervalDays: number
}

export type LessonAttemptStatus = 'in-progress' | 'completed' | 'needs-review'

export interface LessonAttempt {
  attemptId: string
  lessonId: string
  startedAt: number
  completedAt?: number
  currentStepIndex: number
  hintsUsed: number
  revealed: boolean
  status: LessonAttemptStatus
  capturedEvidenceId?: string
  artifact?: Record<string, string | number | boolean>
}

const step = (lessonId: string, kind: LessonStepKind, title: string, instruction: string, expectedAction: string, hint: string, reveal: string): LessonStep => ({
  stepId: `${lessonId}-${kind}`,
  kind,
  title,
  instruction,
  expectedAction,
  hint,
  reveal,
})

const lesson = (definition: Omit<LessonDefinition, 'safetyBoundary' | 'estimatedMinutes' | 'reviewIntervalDays'> & Partial<Pick<LessonDefinition, 'safetyBoundary' | 'estimatedMinutes' | 'reviewIntervalDays'>>): LessonDefinition => ({
  safetyBoundary: definition.safetyBoundary ?? 'Offline simulation only. This lesson does not authorize live machine operation.',
  estimatedMinutes: definition.estimatedMinutes ?? 12,
  reviewIntervalDays: definition.reviewIntervalDays ?? 7,
  ...definition,
})

const baseArtifact = (artifactId: string, label: string, fields: string[]): LessonArtifact => ({ artifactId, label, format: 'json', fields, safeForExport: true })

export const LESSON_LIBRARY: readonly LessonDefinition[] = [
  lesson({
    lessonId: 'plc-scan-cycle',
    title: 'Read a PLC scan cycle',
    domain: 'plc',
    objective: 'Trace inputs, logic execution, and outputs across one deterministic PLC scan.',
    whyThisLesson: 'A scan-cycle mental model makes timing symptoms easier to separate from logic symptoms.',
    prerequisites: [],
    workedExample: step('plc-scan-cycle', 'worked', 'Worked example', 'Follow a simulated input through one scan.', 'Name the input, logic, and output phases.', 'Look for the three phases in order.', 'Read inputs → execute logic → write outputs.'),
    guidedAction: step('plc-scan-cycle', 'guided', 'Guided action', 'Inspect a two-cycle fixture and mark when the output changes.', 'Record the first cycle where the output is true.', 'Compare the input snapshot with the output update.', 'The output changes after the logic phase of the input cycle.'),
    fading: step('plc-scan-cycle', 'fading', 'Fading support', 'Explain a one-cycle delay without the phase labels.', 'Describe the delay in your own words.', 'A PLC does not continuously evaluate the rung.', 'The input is sampled before the logic runs; the output updates after it.'),
    independentTask: step('plc-scan-cycle', 'independent', 'Independent task', 'Choose the likely cause of a missed short pulse in the simulator.', 'Select the scan-time or input-capture explanation.', 'Compare pulse width with scan time.', 'A pulse shorter than the sampling opportunity can be missed.'),
    troubleshootingVariant: step('plc-scan-cycle', 'troubleshooting', 'Troubleshooting variant', 'A trace shows stable inputs but a late output. Explain the observation.', 'Write one bounded hypothesis and one check.', 'Separate logic execution time from communication delay.', 'Check scan timing and output update order before changing logic.'),
    terms: ['plc-scan-cycle', 'interlock'],
    hints: ['Use the phase order as a checklist.', 'Keep the hypothesis tied to the trace.'],
    artifact: baseArtifact('plc-scan-note', 'PLC scan note', ['inputPhase', 'logicPhase', 'outputPhase', 'hypothesis']),
    rubric: [{ criterionId: 'phase-order', label: 'Phase order', description: 'Correctly orders input, logic, and output phases.' }],
  }),
  lesson({
    lessonId: 'robotics-coordinate-frame',
    title: 'Name a robot coordinate frame',
    domain: 'robotics',
    objective: 'Relate a robot target pose to a named reference frame and units.',
    whyThisLesson: 'Explicit frames prevent a plausible-looking target from being sent to the wrong reference.',
    prerequisites: [],
    workedExample: step('robotics-coordinate-frame', 'worked', 'Worked example', 'Compare a tool pose expressed in base and fixture frames.', 'Identify the frame before comparing coordinates.', 'Read the frame label first.', 'The same physical point has different numbers in different frames.'),
    guidedAction: step('robotics-coordinate-frame', 'guided', 'Guided action', 'Annotate a simulated pose with frame, units, and orientation convention.', 'Complete all three labels.', 'A pose needs more than X, Y, and Z.', 'Record frame, length units, and orientation representation.'),
    fading: step('robotics-coordinate-frame', 'fading', 'Fading support', 'Choose the missing metadata from a target description.', 'Select the frame that makes the target unambiguous.', 'Ask “relative to what?”', 'The reference frame is the missing metadata.'),
    independentTask: step('robotics-coordinate-frame', 'independent', 'Independent task', 'Create a safe simulated target for a fixture approach.', 'Export the target with its frame label.', 'Do not include live device commands.', 'A frame-labelled target is a useful educational artifact.'),
    troubleshootingVariant: step('robotics-coordinate-frame', 'troubleshooting', 'Troubleshooting variant', 'Two targets differ by a constant offset. Form a frame hypothesis.', 'State one measurement that would discriminate it.', 'Look for a transform or fixture offset.', 'Compare the transform metadata before adjusting a point.'),
    terms: ['pose'],
    hints: ['Frame names are part of the data.', 'Treat units and orientation as evidence.'],
    artifact: baseArtifact('robot-pose-note', 'Robot pose note', ['frame', 'units', 'orientation', 'check']),
    rubric: [{ criterionId: 'frame-explicit', label: 'Frame explicit', description: 'Names the reference frame and units.' }],
  }),
  lesson({
    lessonId: 'motion-reference',
    title: 'Establish a motion reference',
    domain: 'motion',
    objective: 'Explain why a simulated motion target needs a known reference and bounded assumptions.',
    whyThisLesson: 'Reference state is the boundary between a useful calculation and an unsafe assumption.',
    prerequisites: [{ lessonId: 'robotics-coordinate-frame', minimumScore: 0.7 }],
    workedExample: step('motion-reference', 'worked', 'Worked example', 'Follow a simulated homing result into a coordinate readout.', 'Identify the reference event and resulting offset.', 'Look for the captured reference value.', 'Homing establishes a reference; it does not authorize movement.'),
    guidedAction: step('motion-reference', 'guided', 'Guided action', 'Compare two simulated axis references.', 'Select the one with complete provenance.', 'Check source, units, and time.', 'A reference with provenance is more useful than an unexplained number.'),
    fading: step('motion-reference', 'fading', 'Fading support', 'State what remains unknown after a simulated homing result.', 'Name one safety or validation boundary.', 'Simulation is not commissioning.', 'Guarding, limits, and authorization remain outside this lesson.'),
    independentTask: step('motion-reference', 'independent', 'Independent task', 'Write a motion readiness checklist for a simulator.', 'Keep it read-only and educational.', 'Do not add a live command.', 'A checklist can record preconditions without moving hardware.'),
    troubleshootingVariant: step('motion-reference', 'troubleshooting', 'Troubleshooting variant', 'A target is offset after restart. Identify a reference check.', 'Choose a check before recalculating a target.', 'Ask whether the reference persisted.', 'Verify reference state and provenance before changing coordinates.'),
    terms: ['homing', 'pose'],
    hints: ['Reference state is evidence, not authorization.', 'Name assumptions explicitly.'],
    artifact: baseArtifact('motion-reference-note', 'Motion reference note', ['referenceId', 'units', 'assumptions', 'boundary']),
    rubric: [{ criterionId: 'boundary-stated', label: 'Boundary stated', description: 'Separates a simulated result from live authorization.' }],
  }),
  lesson({
    lessonId: 'serial-frame',
    title: 'Decode a serial frame',
    domain: 'serial-communication',
    objective: 'Relate serial framing, payload bytes, and CRC validation to a deterministic trace.',
    whyThisLesson: 'Wire-level evidence helps isolate framing errors from device or application errors.',
    prerequisites: [],
    workedExample: step('serial-frame', 'worked', 'Worked example', 'Read a simulated request and label address, function, payload, and CRC.', 'Match each byte range to a field.', 'Start with the protocol layout.', 'The CRC validates the defined frame bytes; it does not explain the application meaning.'),
    guidedAction: step('serial-frame', 'guided', 'Guided action', 'Toggle one byte in a frame and observe validation.', 'Record what changes and what stays unknown.', 'Only the checksum relationship is being tested.', 'A CRC failure indicates an integrity problem, not necessarily the root cause.'),
    fading: step('serial-frame', 'fading', 'Fading support', 'Explain why baud rate changes wire time but not payload meaning.', 'Write one sentence connecting baud and timing.', 'Separate transport timing from protocol fields.', 'Baud changes transmission duration; the frame schema gives bytes meaning.'),
    independentTask: step('serial-frame', 'independent', 'Independent task', 'Annotate a simulated serial frame and export the safe note.', 'Include assumptions and validation status.', 'Use the glossary when a term is unfamiliar.', 'A bounded annotation is useful without sending a command.'),
    troubleshootingVariant: step('serial-frame', 'troubleshooting', 'Troubleshooting variant', 'A receiver reports a CRC error. Choose the next read-only check.', 'Select a check that preserves the original bytes.', 'Inspect the exact bytes and framing settings.', 'Compare captured bytes, framing, and CRC convention before changing data.'),
    terms: ['crc', 'baud-rate'],
    hints: ['Annotate before interpreting.', 'Preserve the raw simulated bytes.'],
    artifact: baseArtifact('serial-frame-note', 'Serial frame note', ['frame', 'fields', 'crcStatus', 'assumptions']),
    rubric: [{ criterionId: 'field-boundary', label: 'Field boundaries', description: 'Labels the frame without inventing a device response.' }],
  }),
  lesson({
    lessonId: 'tcp-round-trip',
    title: 'Separate a TCP round trip',
    domain: 'tcp-udp',
    objective: 'Separate connection setup, application exchange, and timing evidence in a simulated trace.',
    whyThisLesson: 'Separating network phases prevents a connection delay from being mistaken for device processing time.',
    prerequisites: [],
    workedExample: step('tcp-round-trip', 'worked', 'Worked example', 'Split a simulated TCP trace into handshake and application timing.', 'Mark the first application byte.', 'The handshake happens before the useful payload.', 'Connection setup and application round-trip time are different measurements.'),
    guidedAction: step('tcp-round-trip', 'guided', 'Guided action', 'Compare TCP and UDP fixture events.', 'Record which reliability behavior belongs to the transport.', 'Use the protocol glossary.', 'TCP provides connection-oriented delivery; UDP leaves delivery behavior to the application.'),
    fading: step('tcp-round-trip', 'fading', 'Fading support', 'Choose the next read-only observation after a timeout.', 'Select trace timing before changing a timeout.', 'Check whether any response bytes arrived.', 'Trace phase and response evidence should precede parameter changes.'),
    independentTask: step('tcp-round-trip', 'independent', 'Independent task', 'Export a phase-labelled round-trip note.', 'Include source and mode metadata.', 'Use simulated mode explicitly.', 'A phase-labelled trace note is safe to export.'),
    troubleshootingVariant: step('tcp-round-trip', 'troubleshooting', 'Troubleshooting variant', 'A request is fast after the first one but slow on the first call.', 'Write the likely phase difference.', 'Compare connection reuse.', 'The first call may include connection setup.'),
    terms: ['tcp-handshake'],
    hints: ['Find the first application byte.', 'Keep timing phases separate.'],
    artifact: baseArtifact('tcp-phase-note', 'TCP phase note', ['connectionMs', 'applicationMs', 'mode', 'observation']),
    rubric: [{ criterionId: 'phase-separation', label: 'Phase separation', description: 'Separates setup from application exchange.' }],
  }),
  lesson({
    lessonId: 'vision-calibration',
    title: 'Read a vision calibration residual',
    domain: 'vision',
    objective: 'Connect calibration references, a transform, and residual error without overstating accuracy.',
    whyThisLesson: 'Residuals show where a calibration fits and where a domain review is still needed.',
    prerequisites: [],
    workedExample: step('vision-calibration', 'worked', 'Worked example', 'Inspect a simulated point mapping and its residual.', 'Identify input, output, and residual units.', 'A residual is a difference, not a guarantee.', 'Record the transform and the residual in the same reference units.'),
    guidedAction: step('vision-calibration', 'guided', 'Guided action', 'Remove one calibration point and compare the residual summary.', 'Describe the evidence change.', 'Keep the fixture deterministic.', 'A changed point set changes the model evidence.'),
    fading: step('vision-calibration', 'fading', 'Fading support', 'Explain why a low average residual is not a commissioning approval.', 'Name one validation condition.', 'Think about range and reference quality.', 'Validation range and application conditions still matter.'),
    independentTask: step('vision-calibration', 'independent', 'Independent task', 'Export a calibration evidence card.', 'Include points, model version, and residual summary.', 'Do not include private camera credentials.', 'A calibration card can be reviewed offline.'),
    troubleshootingVariant: step('vision-calibration', 'troubleshooting', 'Troubleshooting variant', 'One corner of the field has a high residual.', 'Choose a bounded follow-up measurement.', 'Check spatial distribution, not only the average.', 'Inspect point quality and model range before accepting the transform.'),
    terms: ['calibration'],
    hints: ['Units and reference points are part of the result.', 'Average error can hide local error.'],
    artifact: baseArtifact('vision-calibration-note', 'Vision calibration note', ['modelVersion', 'pointCount', 'residual', 'validationRange']),
    rubric: [{ criterionId: 'residual-context', label: 'Residual context', description: 'Reports residual with units and validation conditions.' }],
  }),
  lesson({
    lessonId: 'recipe-revision',
    title: 'Trace a recipe revision',
    domain: 'recipes',
    objective: 'Explain why an approved recipe revision must be identifiable and immutable.',
    whyThisLesson: 'Lineage lets a team compare outcomes without guessing which parameters were used.',
    prerequisites: [],
    workedExample: step('recipe-revision', 'worked', 'Worked example', 'Compare two simulated recipe revisions and their hashes.', 'Identify the changed parameter and parent revision.', 'Start with provenance.', 'A new content hash identifies a changed revision.'),
    guidedAction: step('recipe-revision', 'guided', 'Guided action', 'Classify a parameter change as process or safety-sensitive.', 'Choose the review boundary.', 'Use the recipe glossary.', 'Safety-sensitive changes require the appropriate review, not silent mutation.'),
    fading: step('recipe-revision', 'fading', 'Fading support', 'State what should be attached to a run.', 'List revision and calibration references.', 'Think about reproducibility.', 'A run should point to the exact approved revision and relevant references.'),
    independentTask: step('recipe-revision', 'independent', 'Independent task', 'Create a safe recipe lineage note.', 'Include parent, hash, status, and review note.', 'Keep it an educational record.', 'A lineage note is safe to export and diff.'),
    troubleshootingVariant: step('recipe-revision', 'troubleshooting', 'Troubleshooting variant', 'An outcome cannot be reproduced. Choose the first lineage check.', 'Select revision identity before changing parameters.', 'Look for hash and effective status.', 'Confirm the exact revision before comparing settings.'),
    terms: ['recipe-revision'],
    hints: ['Identity comes before interpretation.', 'Approved does not mean universally safe.'],
    artifact: baseArtifact('recipe-lineage-note', 'Recipe lineage note', ['revisionId', 'parentId', 'contentHash', 'status']),
    rubric: [{ criterionId: 'lineage-complete', label: 'Lineage complete', description: 'Captures identity, parent, and status.' }],
  }),
  lesson({
    lessonId: 'safety-boundary',
    title: 'State a safe diagnostic boundary',
    domain: 'safety',
    objective: 'Distinguish educational simulation evidence from safety-rated authorization.',
    whyThisLesson: 'Clear boundaries keep useful diagnostics from being mistaken for a safe-to-run decision.',
    prerequisites: [],
    safetyGate: { gateId: 'safety-boundary', label: 'I understand the simulation boundary', requiredAcknowledgement: true, boundary: 'Simulation evidence never replaces guarding, E-stop, LOTO, risk assessment, or qualified review.' },
    workedExample: step('safety-boundary', 'worked', 'Worked example', 'Classify statements about a simulated interlock.', 'Separate observation, assumption, and authorization.', 'Authorization is the strongest claim.', 'A simulated interlock observation is not a safety authorization.'),
    guidedAction: step('safety-boundary', 'guided', 'Guided action', 'Rewrite an unsafe claim as an evidence claim.', 'Use “the fixture shows…” language.', 'Name the mode and authority.', 'State what was observed without claiming safe-to-run.'),
    fading: step('safety-boundary', 'fading', 'Fading support', 'Choose the missing safety boundary from a diagnostic card.', 'Select the boundary that prevents overclaiming.', 'Look for hardware and qualified-review limits.', 'Software cannot replace safety-rated controls or qualified review.'),
    independentTask: step('safety-boundary', 'independent', 'Independent task', 'Export a safety boundary card for an offline lesson.', 'Include mode, authority, and non-claims.', 'Keep the language specific.', 'A boundary card is an educational artifact, not a permit.'),
    troubleshootingVariant: step('safety-boundary', 'troubleshooting', 'Troubleshooting variant', 'A user asks whether the machine is safe to run.', 'Choose the appropriate response boundary.', 'This tool is offline and read-only.', 'Refer to approved safety procedures and qualified review.'),
    terms: ['interlock'],
    hints: ['State mode and authority.', 'Avoid certification language.'],
    artifact: baseArtifact('safety-boundary-note', 'Safety boundary note', ['mode', 'authority', 'observation', 'nonClaims']),
    rubric: [{ criterionId: 'no-authorization-claim', label: 'No authorization claim', description: 'Does not present simulation as safe-to-run approval.' }],
  }),
  lesson({
    lessonId: 'ot-least-privilege',
    title: 'Apply least privilege in OT diagnostics',
    domain: 'ot-cybersecurity',
    objective: 'Match diagnostic tasks with the minimum access needed and record the boundary.',
    whyThisLesson: 'Least privilege limits the blast radius of an account or workflow mistake.',
    prerequisites: [],
    safetyGate: { gateId: 'cyber-read-only', label: 'I will keep this exercise read-only', requiredAcknowledgement: true, boundary: 'The exercise uses fictional identities and never creates or changes credentials.' },
    workedExample: step('ot-least-privilege', 'worked', 'Worked example', 'Compare read-only historian access with recipe approval access.', 'Assign the smallest role for each task.', 'Ask what the task actually changes.', 'A read-only observation does not need command or approval rights.'),
    guidedAction: step('ot-least-privilege', 'guided', 'Guided action', 'Remove permissions that are not needed for a trace review.', 'Leave only read and export rights.', 'Separate viewing from changing.', 'Trace review can remain read-only.'),
    fading: step('ot-least-privilege', 'fading', 'Fading support', 'Choose the audit evidence for a role change.', 'Select identity, scope, and time.', 'Permissions need context.', 'Record who, what, scope, and duration.'),
    independentTask: step('ot-least-privilege', 'independent', 'Independent task', 'Export a fictional role review note.', 'Do not include secrets or real identities.', 'Use placeholders only.', 'The safe artifact contains role reasoning, not credentials.'),
    troubleshootingVariant: step('ot-least-privilege', 'troubleshooting', 'Troubleshooting variant', 'A diagnostic account can edit a recipe unexpectedly.', 'Choose a read-only containment step.', 'Reduce access before investigating detail.', 'Remove unneeded write access and preserve audit evidence.'),
    terms: ['least-privilege'],
    hints: ['Permissions should follow the task.', 'Never put secrets in the artifact.'],
    artifact: baseArtifact('ot-role-note', 'OT role review note', ['task', 'role', 'scope', 'expiry']),
    rubric: [{ criterionId: 'minimum-access', label: 'Minimum access', description: 'Chooses access based on the task rather than convenience.' }],
  }),
]

export const initialLessons = LESSON_LIBRARY

export function createLessonAttempt(lessonDefinition: LessonDefinition, startedAt = 0): LessonAttempt {
  return {
    attemptId: `${lessonDefinition.lessonId}-${startedAt}`,
    lessonId: lessonDefinition.lessonId,
    startedAt,
    currentStepIndex: 0,
    hintsUsed: 0,
    revealed: false,
    status: 'in-progress',
  }
}

export function getLessonSteps(lessonDefinition: LessonDefinition): LessonStep[] {
  return [lessonDefinition.workedExample, lessonDefinition.guidedAction, lessonDefinition.fading, lessonDefinition.independentTask, lessonDefinition.troubleshootingVariant]
}
