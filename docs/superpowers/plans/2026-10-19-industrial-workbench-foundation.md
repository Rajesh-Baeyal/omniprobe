# Industrial Automation Workbench Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first offline-first foundation for a unified industrial automation diagnostic, calculator, recipe, terminology, and adaptive-learning workbench while preserving the existing Modbus tools.

**Architecture:** Introduce pure TypeScript contracts for execution modes, normalized events, sessions, module manifests, traces, calculators, recipes, terminology, and learner evidence. Add deterministic calculator and learning data services, then expose them through a Learning Studio / Calculator Lab / Recipe Manager UI without adding unsafe live device writes. Existing protocol panels remain available through the module registry and Command Center.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tailwind CSS, lucide-react, browser-safe pure functions, local deterministic fixtures.

**Spec:** `reports/industrial automation learning platform.md`

## Global Constraints

- The base experience must work offline with no backend, broker, cloud account, device permission, or live endpoint.
- Every result must identify `SIMULATED`, `REPLAY`, `BROWSER LIVE`, or `BRIDGE LIVE` and separately identify `READ ONLY` or `WRITE ARMED`.
- Calculators are educational estimates unless explicitly marked otherwise; never claim safety, certification, commissioning authorization, SIL/PL, LOTO completion, or safe-to-run motion.
- Approved recipe revisions are immutable, hashed, diffable, and attached to every run.
- Same fixture, seed, recipe revision, calibration IDs, model version, and actions must produce deterministic results.
- Credentials, tokens, private keys, and machine-specific absolute paths must never enter tracked files, fixtures, reports, or examples.
- Keep the single test command as `npm test` and keep `npm run build` passing.
- Make an incremental conventional commit after each independently verified task group.

---

### Task 1: Add the shared workbench contracts and registry

**Files:**
- Create: `src/core/workbench/contracts.ts`
- Create: `src/core/workbench/moduleRegistry.ts`
- Create: `src/core/workbench/virtualClock.ts`
- Create: `src/core/workbench/deterministicRandom.ts`
- Test: `src/__tests__/workbenchFoundation.test.ts`

**Interfaces:**
- Produces `ExecutionMode`, `Authority`, `WorkbenchSession`, `NormalizedEvent`, `StructuredError`, `WorkbenchModuleManifest`, `VirtualClock`, and `SeededRandom`.
- Produces `createModuleRegistry()`, `registerModule()`, `getModule()`, and `listModules()`.
- Produces existing-module manifests for protocol inspector, serial Modbus, TCP/UDP, CAN, OPC UA simulator, MQTT/Sparkplug, SECS/HSMS, PLC sandbox, robotics motion, vision calibration, calculator lab, recipe manager, trace replay, learning studio, terminology, and OT safety/cyber.

- [ ] **Step 1: Write failing contract tests**

```ts
it('rejects duplicate module ids and missing source metadata', () => {
  const registry = createModuleRegistry()
  expect(() => registry.register({ ...manifest, moduleId: 'x', sourceRefs: [] })).toThrow()
  registry.register({ ...manifest, moduleId: 'x', sourceRefs: ['spec:test'] })
  expect(() => registry.register({ ...manifest, moduleId: 'x', sourceRefs: ['spec:test'] })).toThrow()
})

it('produces repeatable virtual time and seeded values', () => {
  const clock = createVirtualClock(100)
  clock.advance(25)
  expect(clock.now()).toBe(125)
  expect(createSeededRandom('demo').next()).toBe(createSeededRandom('demo').next())
})
```

- [ ] **Step 2: Run `npm test -- --run src/__tests__/workbenchFoundation.test.ts` and verify the new imports fail.**
- [ ] **Step 3: Implement strict serializable contracts and registry validation.** Registry registration must reject duplicate IDs, empty `sourceRefs`, empty schema versions, unsupported execution modes, and command capabilities without a safety class.
- [ ] **Step 4: Run the focused test and then `npm test`.**
- [ ] **Step 5: Commit:** `git add src/core src/__tests__/workbenchFoundation.test.ts && git commit -m "feat: add workbench contracts and module registry"`

### Task 2: Add deterministic trace and replay

**Files:**
- Create: `src/core/traces/traceModel.ts`
- Create: `src/core/traces/traceReplay.ts`
- Create: `src/core/traces/redaction.ts`
- Test: `src/__tests__/traceReplay.test.ts`

**Interfaces:**
- Consumes `NormalizedEvent`, `WorkbenchSession`, and `VirtualClock` from Task 1.
- Produces `createTrace()`, `appendTraceEvent()`, `finalizeTrace()`, `exportTraceJson()`, `importTraceJson()`, `createReplayController()`, and `redactSensitiveFields()`.

- [ ] **Step 1: Write failing tests for canonical trace hashing, pause/step/seek, branch, and credential redaction.**
- [ ] **Step 2: Run the focused test and verify failure.**
- [ ] **Step 3: Implement canonical JSON normalization, stable SHA-256-compatible browser-safe hashing fallback, virtual replay controls, and redaction of keys matching credential/token/private-key patterns.** The trace must preserve execution mode, authority, seed, fault profile, recipe/calibration references, raw/decoded/semantic data, and learner actions.
- [ ] **Step 4: Run focused tests and `npm test`.**
- [ ] **Step 5: Commit:** `git add src/core/traces src/__tests__/traceReplay.test.ts && git commit -m "feat: add deterministic trace replay"`

### Task 3: Add calculator model and industrial calculator catalog

**Files:**
- Create: `src/core/calculators/calculatorModel.ts`
- Create: `src/core/calculators/unitSystem.ts`
- Create: `src/core/calculators/industrialCalculators.ts`
- Create: `src/modules/calculator-lab/CalculatorLabPanel.tsx`
- Test: `src/__tests__/industrialCalculators.test.ts`

**Interfaces:**
- Produces `CalculatorModel`, `CalculatorInput`, `CalculatorResult`, `evaluateCalculator()`, `convertUnit()`, and `listCalculatorModels()`.
- Calculator IDs must include: `coordinate_transform_2d`, `robot_2link_fk_ik`, `motion_profile`, `path_guidance`, `conveyor_trigger`, `cycle_time_oee`, `plc_scan_timing`, `serial_wire_time`, `tcp_udp_timing`, `can_bus_load`, `dispensing_dose`, `pneumatic_force`, `pump_power`, `thermal_first_pass`, `camera_fov`, `exposure_blur`, `affine_calibration`, and `tolerance_budget`.

- [ ] **Step 1: Write tests for SI conversion, status classification, serial timing, dispensing `V = Q × t`, 2D transform, OEE bounds, 2-link reachability, camera blur, affine residual, and invalid-input rejection.**
- [ ] **Step 2: Run focused tests and verify missing calculator contracts fail.**
- [ ] **Step 3: Implement the model-card catalog. Every result includes units, assumptions, provenance, model version, validation range, safety class, and status: `valid`, `valid-with-assumptions`, `out-of-range`, `insufficient-inputs`, or `domain-review-required`.
- [ ] **Step 4: Implement Calculator Lab with category cards, inputs, worked examples, output status, formula explanation, assumption disclosure, and “educational estimate” labeling.**
- [ ] **Step 5: Run focused tests, `npm test`, and `npm run build`.**
- [ ] **Step 6: Commit:** `git add src/core/calculators src/modules/calculator-lab src/__tests__/industrialCalculators.test.ts && git commit -m "feat: add industrial calculator lab"`

### Task 4: Add recipe and calibration lineage

**Files:**
- Create: `src/core/recipes/recipeModel.ts`
- Create: `src/core/recipes/recipeStore.ts`
- Create: `src/modules/recipe-manager/RecipeManagerPanel.tsx`
- Test: `src/__tests__/recipes.test.ts`

**Interfaces:**
- Produces `RecipeRevision`, `RecipeParameter`, `RecipeStatus`, `createDraftRecipe()`, `reviseRecipe()`, `diffRecipes()`, `transitionRecipe()`, `rollbackTarget()`, and `validateRecipeForRun()`.

- [ ] **Step 1: Write tests for immutable revisions, semantic diff categories, approval transitions, content hash changes, missing parameter rejection, and stale calibration rejection.**
- [ ] **Step 2: Run focused tests and verify failure.**
- [ ] **Step 3: Implement immutable JSON records with deterministic canonical hashes and explicit `draft → reviewed → approved → effective → retired` transitions.** Approved records must not be mutated.
- [ ] **Step 4: Implement Recipe Manager with product/machine/station context, parameter table, provenance, parent revision, diff view, approval status, rollback target, and safety-field lockout.
- [ ] **Step 5: Run tests and build.**
- [ ] **Step 6: Commit:** `git add src/core/recipes src/modules/recipe-manager src/__tests__/recipes.test.ts && git commit -m "feat: add immutable recipe lineage"`

### Task 5: Add terminology, onboarding, learner evidence, and lesson runner

**Files:**
- Create: `src/core/learning/terminology.ts`
- Create: `src/core/learning/learnerModel.ts`
- Create: `src/core/learning/lessonModel.ts`
- Create: `src/core/learning/adaptiveRoute.ts`
- Create: `src/modules/learning-studio/LearningStudioPanel.tsx`
- Test: `src/__tests__/learningStudio.test.ts`

**Interfaces:**
- Produces `TermRecord`, `LearnerProfile`, `CapabilityEvidence`, `LessonDefinition`, `LessonAttempt`, `selectNextLesson()`, `recordEvidence()`, `buildDiagnosticProfile()`, and `getTermInContext()`.
- Initial lesson domains: PLC, robotics, motion, serial communication, TCP/UDP, vision, recipes, safety, and OT cybersecurity.

- [ ] **Step 1: Write tests for onboarding profile creation, contextual term lookup, prerequisite filtering, safety gates, evidence aggregation, spaced-review priority, and deterministic lesson selection.**
- [ ] **Step 2: Run focused tests and verify failure.**
- [ ] **Step 3: Implement low-stakes onboarding with `not sure`, role/goal/domain questions, confidence anchors, and two diagnostic probes.** Do not expose a single “level” as a credential.
- [ ] **Step 4: Implement lesson schema with objective, prerequisites, worked example, guided action, fading, independent task, troubleshooting variant, terms, hints, artifact, rubric, and safety boundary. Use the research heuristic as a documented product hypothesis, not a validated score.
- [ ] **Step 5: Implement Learning Studio with onboarding, “why this lesson,” interactive step state, hint/reveal controls, glossary term moments, evidence capture, progress by domain, and safe artifact export.
- [ ] **Step 6: Run tests and build.**
- [ ] **Step 7: Commit:** `git add src/core/learning src/modules/learning-studio src/__tests__/learningStudio.test.ts && git commit -m "feat: add adaptive learning studio"`

### Task 6: Integrate the foundation into the application shell

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Modify: `src/types/omniprobe.ts`
- Modify: `README.md`
- Modify: `.github/workflows/pages.yml`
- Test: `src/__tests__/omniprobe.test.ts`

**Interfaces:**
- Consumes the registry, Calculator Lab, Recipe Manager, Learning Studio, and trace contracts from Tasks 1–5.
- Adds navigation IDs `learning`, `calculators`, `recipes`, `traces`, `terminology`, and `safety` while retaining existing views.

- [ ] **Step 1: Add integration assertions for all new registry entries and the fixed safety disclaimer.**
- [ ] **Step 2: Implement module-registry-driven navigation and a persistent capability banner showing mode, authority, source, model version, and safety status.**
- [ ] **Step 3: Add the new panels to the app and ensure the Command Center links to “learn this,” “calculate,” “replay,” and “inspect recipe” actions.
- [ ] **Step 4: Add README sections describing offline mode, learning flow, calculator limitations, recipe governance, and future bridge/live modes.**
- [ ] **Step 5: Run `npm test`, `npm run build`, and the GitHub Pages workflow validation if available.**
- [ ] **Step 6: Commit:** `git add src/App.tsx src/index.css src/types/omniprobe.ts README.md .github/workflows/pages.yml src/__tests__/omniprobe.test.ts && git commit -m "feat: integrate industrial workbench foundation"`

### Task 7: Verify the milestone and prepare the next protocol increment

**Files:**
- Modify: `README.md`
- Modify: `demo/README.md`
- Test: `src/__tests__/*.test.ts`

- [ ] **Step 1: Run `npm ci`, `npm test`, and `npm run build` from a clean dependency install.**
- [ ] **Step 2: Verify the app still renders existing Modbus panels and the new learning/calculator/recipe routes in offline mode.
- [ ] **Step 3: Verify no absolute paths or secrets exist in tracked files.
- [ ] **Step 4: Document this milestone as Increment 0 + Calculator/Recipe/Learning shell; explicitly mark Serial Live, TCP/UDP raw sockets, CAN, OPC UA live, SECS/HSMS live, and industrial camera bridges as later work.
- [ ] **Step 5: Commit:** `git add README.md demo/README.md src/__tests__ && git commit -m "test: verify industrial workbench foundation"`

## Self-review coverage

- Shared contracts, module registry, execution modes, sessions, virtual clock, and deterministic seeds are Task 1.
- Trace/replay and redaction are Task 2.
- Path guidance, motion, dispensing, PLC timing, networking, CAN timing, vision, calibration, thermal, power, and tolerance calculators are Task 3.
- Recipe creation, versioning, approvals, diffs, rollback, and calibration lineage are Task 4.
- Diagnostic onboarding, adaptive learning, terminology, PLC/robotics/serial/network/vision/safety/cyber lessons are Task 5.
- UI integration, capability honesty, accessibility hooks, docs, and deployment are Task 6.
- Rebuildability and regression verification are Task 7.
- Deliberately deferred: native bridge and unrestricted live hardware connectivity, which require separate safety/security-reviewed work after the offline foundation is stable.
