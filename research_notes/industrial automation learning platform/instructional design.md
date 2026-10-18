# Instructional design for an industrial automation learning workbench

## Diagnostic assessment and adaptive progression

### Takeaway

The workbench should begin with a low-stakes orientation check that combines the learner’s goals and context with small, observable performance probes. It should maintain a per-capability evidence profile rather than assign one global “beginner/intermediate/advanced” label; the next lesson should be selected from a prerequisite graph using observed gaps, recency, transfer value, learner goals, and safety dependencies.

### Cited Findings

- The National Academies’ *How People Learn II* treats learning as dependent on knowledge, reasoning, motivation, context, culture, assessment, technology, and workplace transfer; its contents explicitly include expertise, self-regulation, feedback, digital technology, workforce training, training transfer, and autonomous workplace learning. This supports a learner model that is multidimensional and contextual rather than a single level score. — [National Academies, *How People Learn II*](https://www.nationalacademies.org/read/24783/chapter/1)
- The National Academies report includes a construct-map and diagnostic-item example and a section on connecting assessment to evidence about how people learn. This is a useful precedent for treating assessment as an evidence argument about a defined capability, not as a decontextualized label. — [National Academies, *How People Learn II*, contents](https://www.nationalacademies.org/read/24783/chapter/1)
- The *Standards for Educational and Psychological Testing* are the primary reference for validity, score interpretation, and test use. A product that has not established reliability, validity evidence, and appropriate use boundaries should not present a short onboarding quiz as a certified or psychometrically meaningful assessment. — [AERA, APA, and NCME, *Standards for Educational and Psychological Testing*](https://www.testingstandards.net/uploads/7/6/6/4/76643089/standards_2014edition.pdf)
- The What Works Clearinghouse guide recommends spacing learning over time, interleaving worked examples with problem solving, combining graphics and verbal descriptions, connecting abstract and concrete representations, using quizzes to re-expose learners to key content, and asking deep explanatory questions. — [IES What Works Clearinghouse, *Organizing Instruction and Study to Improve Student Learning*](https://ies.ed.gov/ncee/wwc/PracticeGuide/1)
- MIT Open Learning summarizes the testing effect: periodic retrieval increases recall, particularly when feedback is provided, and recommends frequent low-stakes quizzes. — [MIT Open Learning, “Retrieval practice (the ‘testing effect’)”](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/retrieval-practice-testing-effect)
- MIT Open Learning summarizes that spacing and interleaving improve retention and discrimination among problem types, even though they can make early practice feel slower. — [MIT Open Learning, “Spaced and interleaved practice”](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/spaced-and-interleaved-practice)
- The EEF feedback guidance states that feedback can support progress and address misunderstandings, but that not all feedback has positive effects; its emphasis is on actionable feedback principles rather than the delivery medium. — [Education Endowment Foundation, *Teacher Feedback to Improve Pupil Learning*](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback)
- The EEF metacognition guidance describes effective support as explicitly teaching learners to plan, monitor, and evaluate their learning, and reports that these strategies work better when embedded in a subject curriculum. — [Education Endowment Foundation, *Metacognition and Self-Regulated Learning*](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition)

### Inferences

- A useful onboarding result is an **orientation profile**, not a “skill level.” It should say, for example, “you appear ready to work with discrete I/O; you have limited evidence for scan-cycle reasoning; your goal is robot-cell troubleshooting,” and show confidence or uncertainty for each claim.
- Use the phrase **observed readiness** for performance-derived signals and **self-reported experience** for background information. Keep them visibly separate. A learner who has never used a PLC may still have strong state-machine reasoning; a learner with years of maintenance experience may be unfamiliar with a particular vendor’s notation.
- The app should infer readiness independently for PLC, robotics, serial communication, networking, vision, motion, safety, and industrial cybersecurity. It should also track cross-cutting capabilities such as reading schematics, reasoning about states, interpreting logs, documenting changes, and explaining a hypothesis.
- Treat safety readiness as a separate, hard dependency. A successful simulation run should demonstrate conceptual performance in the simulator, not authorize work on a real machine or prove that a learner is competent to bypass site procedures.

### Design recommendation: diagnostic onboarding questions

Ask the questions in short groups and allow “not sure” or “prefer not to say” answers. The questions should help the learner choose a useful path and help the system select probes; they should not imply clinical, employment, licensing, or safety certification.

1. **Goal and role**
   - What do you want to be able to do in the next 4–8 weeks: commission, program, troubleshoot, integrate, maintain, design, teach, or secure an automation system?
   - Which role is closest to your current work: operator, maintenance technician, controls technician, automation engineer, robot programmer, electrical engineer, system integrator, OT/network engineer, student, instructor, or other?
   - What kind of work product would be valuable to you: a working sequence, a fault-finding report, a network diagram, a robot-cell handoff, a vision calibration record, a safety risk worksheet, or a cybersecurity improvement plan?

2. **Context and equipment**
   - Which systems have you touched, if any: PLC, HMI/SCADA, robot, servo drive, VFD, camera, barcode reader, serial device, Ethernet switch, safety controller, or industrial firewall?
   - Which standards, programming languages, protocols, vendors, or plant conventions are familiar to you?
   - Have you worked only in simulation, on training hardware, in a production environment, or in more than one of these?
   - Do you have access to hardware outside the workbench, and what are the constraints on time, bandwidth, screen size, language, and assistive technology?

3. **Recency and evidence of practice**
   - When did you last perform a concrete task such as wiring a sensor, editing ladder logic, reading a packet or frame, homing an axis, teaching a robot point, calibrating a camera, or investigating a fault?
   - Which task did you complete without a step-by-step guide? Which task required help?
   - What did you produce: code, a wiring diagram, a parameter sheet, a commissioning checklist, a trend, a packet capture, or a handoff note?

4. **Self-calibration**
   - How confident are you that you could do each task today? Use a confidence scale with a concrete anchor: “I could explain it,” “I could do it with a guide,” “I could do it independently,” or “I could diagnose a variant.”
   - Which terms do you recognize but not yet use confidently: scan cycle, seal-in, debounce, baud rate, parity, CRC, subnet, VLAN, frame, calibration, coordinate frame, homing, interlock, safe state, zone/conduit, least privilege?
   - What would make practice feel appropriately challenging: more explanation, a worked example, a slower simulation, fewer simultaneous signals, a glossary hint, or a harder fault?

5. **Short performance probes**
   Use one or two probes per selected domain. Each probe should be answerable in a minute or two and should record the reasoning path, not only the final choice. Examples:
   - **PLC:** Given a simple ladder fragment and an input trace, predict the output after three scans and explain why.
   - **Robotics:** Given a cell diagram, identify the safe recovery condition before motion is enabled.
   - **Serial communication:** Identify which field in a frame would explain a rejected message and choose a useful next diagnostic step.
   - **Networking:** Read a small topology and select whether the fault is more likely addressing, link, routing, protocol, or application state.
   - **Vision:** Choose whether the first intervention should be lighting, exposure, thresholding, lens setup, calibration, or the reject rule.
   - **Motion:** Given a homing and limit-switch trace, decide whether the issue is a sensor, sequence, configuration, or mechanical condition.
   - **Safety:** Identify a hazard, the affected person, the initiating event, and the control that should be verified before continuing.
   - **Industrial cybersecurity:** Select the smallest useful asset inventory or segmentation change for a stated OT scenario and explain the operational trade-off.

6. **Trust and disclosure**
   - Present the result as “what we will try next” and “what evidence we still need,” not “your level is X.”
   - Show the learner which answers affected the route and let them correct context or choose a different goal.
   - Store timestamps, attempts, hints, confidence, and transfer performance separately from self-report.

### Design recommendation: choosing the next interactive lesson

Represent the curriculum as a directed graph:

`domain → capability → skill atoms → terms → practice tasks → scenarios → artifacts`

Each capability node should have prerequisite edges, evidence requirements, safety constraints, and links to several contexts. For example, “diagnose a conveyor that will not start” may require discrete I/O interpretation, PLC scan-cycle reasoning, state-machine reasoning, interlock logic, and safe recovery. It should not be hidden inside a generic “PLC level 2” label.

For every candidate lesson whose prerequisites are met, calculate an initial heuristic priority:

```text
priority =
  0.30 prerequisite readiness
  + 0.20 demonstrated gap
  + 0.15 learner goal relevance
  + 0.15 transfer value to the current project
  + 0.10 review due / forgetting risk
  + 0.10 confidence calibration need
```

These weights are a starting product heuristic, not a validated formula. Log the chosen lesson and the alternatives so the team can evaluate whether the route actually improves completion, delayed retention, transfer, and artifact quality.

Apply the following rules:

- **Safety override:** do not unlock higher-risk motion or robot-cell scenarios until the learner has completed the relevant conceptual safety gates. Keep the gate educational and explicit; do not represent it as real-world authorization.
- **Prerequisite repair:** if a learner fails a task because of a missing prerequisite, route to the smallest missing capability, then return to the original task. Avoid sending the learner back to an entire course.
- **Two-lane progression:** show one recommended prerequisite lesson and one goal-directed lesson when both are safe. This preserves agency without allowing the learner to unknowingly skip a dependency.
- **Evidence across contexts:** do not mark a capability mastered from one multiple-choice answer. Require a retrieval item, a constrained construction or configuration task, and a novel or troubleshooting variant. For safety-related capabilities, require a correct decision and an explanation of the hazard/control relationship.
- **Spacing and interleaving:** bring back old skills at the start of later lessons and mix similar fault types so the learner must discriminate among them. — [IES WWC](https://ies.ed.gov/ncee/wwc/PracticeGuide/1); [MIT Open Learning](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/spaced-and-interleaved-practice)
- **Review scheduling:** schedule a short retrieval prompt after the first session, then progressively delayed reviews such as the next day, several days later, and several weeks later. Do not make the exact interval a hidden promise of optimality; use performance and confidence to adjust it.
- **Learner override:** allow “show me another route,” but explain which prerequisite is being postponed and what will be harder without it.

### Proposed learner model

Track each capability with:

| Field | Purpose |
|---|---|
| `conceptual_recall` | Can the learner retrieve definitions, relationships, and constraints? |
| `procedural_execution` | Can the learner carry out the task in a supported environment? |
| `diagnostic_reasoning` | Can the learner form, test, and revise a hypothesis? |
| `transfer` | Can the learner apply the idea to a changed device, topology, signal, or fault? |
| `safety_judgment` | Can the learner identify hazards and choose an appropriate safe next step? |
| `documentation` | Can the learner leave a useful trace for another technician or engineer? |
| `confidence` | How sure is the learner, and how calibrated is that confidence? |
| `recency` | When and under what context was the evidence collected? |
| `evidence_refs` | Which attempts, traces, explanations, and artifacts support the inference? |

Use “mastered for this context” before “mastered generally.” Generalization should require variation: a new I/O map, a different serial framing error, another robot-cell state, a changed lighting condition, or a different network topology.

### Gaps

- The cited learning-science sources support retrieval, spacing, feedback, explanation, and context-sensitive learning, but they do not establish the proposed score weights or the exact prerequisite order for industrial automation. Those must be validated with user studies and subject-matter experts.
- The testing standards provide the correct caution about validity and use, but a product team would need a formal validation plan before making any claim about placement accuracy, certification, job readiness, or safety competence.
- I found no reliable source establishing one universal skill taxonomy that cleanly covers PLC, robotics, serial communication, networking, vision, motion, safety, and OT cybersecurity across vendors and countries. Use the graph as an extensible product model, not as an industry-wide canonical standard.

## Lesson, terminology, practice, simulation, and evidence loop

### Takeaway

A high-quality lesson should teach one observable capability through a repeated loop: orient to a real automation problem, retrieve relevant prior knowledge, inspect a worked example, perform a guided action, complete a faded version, solve an independent simulation task, troubleshoot a variant, explain the result, and leave an evidence artifact. Terms should appear at the moment they are needed to act, then return in retrieval and troubleshooting rather than being presented as a large glossary.

### Cited Findings

- The WWC guide recommends alternating already-worked solutions with learner problem solving, connecting abstract and concrete representations, combining graphical and verbal descriptions, and using deep explanatory questions. — [IES What Works Clearinghouse](https://ies.ed.gov/ncee/wwc/PracticeGuide/1)
- MIT Open Learning reports that retrieval supports long-term memory and is especially useful when paired with feedback; its examples include immediate checking of intermediate and final answers in engineering and physics problem sets. — [MIT Open Learning, retrieval practice](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/retrieval-practice-testing-effect)
- MIT Open Learning reports that spacing and interleaving can improve retention and discrimination among problem types, even when initial performance is slower. — [MIT Open Learning, spaced and interleaved practice](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/spaced-and-interleaved-practice)
- The EEF feedback guidance warns that feedback is not automatically beneficial and emphasizes feedback that helps learners progress and correct misunderstandings. — [EEF feedback guidance](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback)
- The EEF metacognition guidance recommends explicit support for planning, monitoring, and evaluating learning, with subject-embedded scaffolds. — [EEF metacognition guidance](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition)
- CAST’s UDL Guidelines organize design around multiple means of engagement, representation, and action/expression. They specifically include prior knowledge, vocabulary and symbols, transfer, graduated support for practice and performance, goals, planning, and monitoring progress. — [CAST UDL Guidelines 3.0](https://udlguidelines.cast.org/)
- The National Academies report identifies digital technology affordances such as active learning, models, self-regulated learning, producers/creators, and workplace learning; it also cautions that practical applications of learning science are not simple recipes and must be contextualized. — [National Academies, *How People Learn II*](https://www.nationalacademies.org/read/24783/chapter/1)

### Inferences

- The workbench should be **capability-first**, not topic-first. “Timers” is a topic; “design and verify a timeout that leaves the cell in a safe state” is an observable capability.
- The simulator should be treated as a measurement instrument as well as a practice space. It can capture sequence, timing, state transitions, signal traces, hypothesis changes, safety decisions, and documentation quality—not just whether the final output became true.
- Worked examples and fading are well matched to industrial procedures because they let the learner see both the action and the reason for the action before taking over. The exact fading schedule is a design hypothesis that should be tuned from error patterns and delayed transfer, not a fixed law.
- A term becomes durable when it is attached to a visible signal, state, action, or failure and then retrieved in a different context. The glossary should be a reference layer, not the primary teaching sequence.
- Portfolio artifacts are valuable because industrial work is collaborative and evidence-based: a useful artifact can show what was changed, what was observed, which hypothesis was tested, what risk was considered, and what remains unknown. This is a product recommendation based on workplace transfer and documentation needs, not a claim that every artifact is a valid credential.

### Design recommendation: lesson schema

Each lesson should be authored as a structured object with the following fields.

#### 1. Identity and intent

- `lesson_id`, version, author, reviewer, source/provenance, estimated time, language, and target audience.
- One sentence in the form: “Given **conditions**, the learner can **observable action** to **standard**.”
- Domain and capability IDs, plus the cross-domain skills it exercises.
- The job or plant context: for example, “conveyor infeed rejects a part after a photoeye fault.”

#### 2. Prerequisites and safety boundary

- Required capability nodes and an explanation of why each is needed.
- What the learner may safely manipulate in the simulator.
- Explicit stop conditions, reset behavior, and the difference between a simulated safe state and a real-world safety procedure.
- A link to the relevant safety or cybersecurity source used by the author.

#### 3. Evidence-centered objective and rubric

Define what the learner will produce or do, what evidence is observable, and what counts as adequate performance.

Example rubric for “diagnose a conveyor that will not start”:

| Dimension | Beginning | Meets target | Strong transfer |
|---|---|---|---|
| Signal reading | Names a likely signal | Reads the trace and identifies the blocking condition | Distinguishes sensor, logic, and sequence causes |
| Hypothesis | Guesses a component | States a testable hypothesis | Ranks alternatives and chooses the least risky test |
| Intervention | Changes values randomly | Makes one justified change in the sandbox | Preserves evidence, rollback, and safe state |
| Verification | Sees the conveyor run | Repeats the scenario and confirms the fix | Tests a changed scenario and explains limits |
| Communication | Gives a result | Leaves a concise handoff | Records observations, uncertainty, and next owner |

#### 4. Term moments

For each term, specify:

- canonical label and pronunciation;
- plain-language definition;
- technical definition or formula when needed;
- the visible object, signal, state, or action it names;
- a near-term contrast, such as `timeout` versus `watchdog`, `input` versus `event`, or `homing` versus `positioning`;
- one positive example and one non-example;
- vendor or standards aliases;
- locale-specific translation, abbreviation, unit, and symbol notes;
- when to retrieve it again;
- a safety or cybersecurity implication if relevant;
- source and review date.

#### 5. Learning sequence

Use this default sequence, adapting the amount of support to the learner model:

1. **Orient:** show the real problem, desired behavior, constraints, and why it matters.
2. **Retrieve:** ask one or two questions from prior lessons before explaining anything new.
3. **Notice:** let the learner inspect the process, signal trace, ladder fragment, packet, camera image, or robot-cell state.
4. **Worked example:** demonstrate a correct solution one decision or step at a time; state why each step is chosen.
5. **Guided action:** ask the learner to execute the next step with a visible hint if needed.
6. **Completion/fading:** remove selected labels, hints, prefilled rungs, expected traces, or fault names.
7. **Independent practice:** use a fresh instance with the same capability and different values.
8. **Troubleshooting variant:** inject one hidden fault and require observe → hypothesize → test → change → verify.
9. **Self-explanation:** ask “What evidence ruled out the closest alternative?” and “What would be unsafe to try on a live machine?”
10. **Exit ticket:** retrieve the core term, predict a changed case, and state what to review.
11. **Artifact:** export a small trace, annotated screenshot, logic fragment, topology, calibration record, fault report, or safety/cyber worksheet.
12. **Review:** schedule retrieval and place the capability back into later interleaved tasks.

#### 6. Feedback and hint policy

Feedback should identify the observable mismatch, explain the relevant principle, and give the smallest useful next action. For example:

> “The output is false because the permissive is missing during scan 4. Check the guard input and the state transition before changing the motor command. Do not force the output; first verify the simulated safe-state condition.”

Use progressive hints:

- Hint 1: point to the relevant signal, state, or region.
- Hint 2: name the relationship to inspect.
- Hint 3: show a partial trace or comparison.
- Hint 4: reveal the worked step and require a short explanation.

After an error, ask the learner to retry or explain before moving on. Give a hard stop for unsafe simulated actions, but make ordinary mistakes recoverable through reset, undo, and a new attempt. Feedback should be immediate for local errors and delayed enough for later retrieval when the goal is retention; the system should distinguish these purposes.

#### 7. Simulation instrumentation

The simulator should support:

- pause, step, slow motion, replay, reset, and branch from a prior state;
- signal/state timelines with readable labels and accessible textual equivalents;
- inspection of I/O, timers, counters, queues, messages, frames, network events, camera detections, coordinate frames, motion states, and safety interlocks;
- scenario seeds so the same task can be repeated with controlled variation;
- fault injection that is pedagogically named only after the learner has attempted diagnosis;
- event logs with timestamps and causality hints that can be revealed progressively;
- an explicit boundary between simulation controls and controls that would be dangerous or invalid on real equipment.

#### 8. Mastery and review

Use a mastery gate as an invitation to demonstrate durable performance, not as a single pass/fail quiz. A practical initial gate is:

- one retrieval answer with explanation;
- one supported construction or configuration task;
- one independent task;
- one changed-context or troubleshooting task;
- required safety decision where applicable;
- an artifact that another learner or reviewer can inspect.

The gate should record attempts, hints, time, confidence, error type, and transfer performance. It should permit targeted repair instead of replaying the whole lesson.

### Design recommendation: teaching terminology in context

Use a **term-in-action loop**:

1. Show the plant or simulation event before naming every part.
2. Introduce only the term needed for the next decision.
3. Attach the term to a visible representation: `I:0/3` changes state, a serial byte occupies a frame field, a camera coordinate maps to a part location, or a safety interlock blocks motion.
4. Ask the learner to use the term in an action or explanation.
5. Contrast it with the nearest confusable term.
6. Bring it back later as a retrieval item, a fault clue, and a documentation label.
7. Offer a reference card for lookup, but do not require memorization of vendor-specific syntax before the concept is understood.

Example: teach **interlock** when a conveyor refuses to start. The learner first observes that the start command is present but the transition is blocked. Then the app names an interlock as a condition that must be true before an action is permitted, links it to the guard and part-present signals, contrasts it with a command, and asks the learner to state which condition is missing. Later, the term returns in a robot handshake, a motion enable sequence, a safety scenario, and a troubleshooting report.

### Design recommendation: evidence and portfolio artifacts

Every scenario should end with an artifact proportional to the skill:

- **PLC:** annotated sequence/state diagram, ladder or structured-text fragment, I/O list, and test trace.
- **Robotics:** cell map, frames/points rationale, handshake table, recovery checklist, and simulated run record.
- **Serial communication:** frame specification, parameter table, capture with annotated bytes, parser decision, and retry/timeout rationale.
- **Networking:** topology, address plan, protocol path, diagnostic evidence, and change/rollback note.
- **Vision:** image sample, lighting/threshold decision, calibration points, coordinate mapping, tolerance, and reject evidence.
- **Motion:** homing sequence, limits/interlocks, parameter rationale, trajectory trace, and fault recovery record.
- **Safety:** hazard, initiating event, affected person, risk-reduction measure, verification evidence, and unresolved assumptions.
- **Industrial cybersecurity:** asset inventory, trust boundaries or zones, access path, control selected, operational constraint, and recovery/monitoring plan.

Artifacts should be exportable as a small human-readable report plus machine-readable evidence references. Label them as **practice evidence**, **simulation evidence**, or **reviewed evidence**. Do not call them licenses, certifications, or proof of competence without a separate, validated assessment and an appropriate authority.

### Sample lesson progression

Scenario: a novice-to-intermediate learner wants to build and troubleshoot a simulated conveyor pick-and-place cell with a PLC, robot, serial barcode reader, Ethernet network, camera, servo axis, safety circuit, and OT security boundary.

| Stage | Capability and lesson | Interactive practice | Evidence / gate |
|---|---|---|---|
| 0 | **Cell orientation and safety vocabulary** | Explore the simulated cell; identify people-facing hazards, safe state, input, output, permissive, interlock, fault, and reset. | Annotated cell map; must distinguish “reset” from “make the machine run.” |
| 1 | **Read discrete signals** | Toggle a photoeye and actuator; predict the I/O trace and explain normally open/closed behavior without relying on color alone. | Signal trace and short explanation. |
| 2 | **Reason about the PLC scan** | Inspect a worked ladder example; predict output state across scans; then complete missing contacts and a seal-in circuit. | Three-scan prediction plus working logic. |
| 3 | **Model a sequence as states** | Build idle → ready → running → blocked → fault → recovery; remove state labels in the faded version. | State diagram and transition trace. |
| 4 | **Design a timeout and safe recovery** | Add a timeout to a missing part-present event; compare timeout, retry, and fault behavior. | Test record showing normal, delayed, and missing-signal cases. Safety gate before motion. |
| 5 | **Exchange a serial message** | Configure a simulated reader; retrieve baud/parity/stop-bit terms; inspect a frame; diagnose checksum and timeout variants. | Frame annotation, parameter table, parser/timeout rationale. |
| 6 | **Diagnose the network path** | Read a topology; test link, addressing, routing, protocol, and application hypotheses in order. | Topology and evidence-backed fault report. |
| 7 | **Use vision as a measured input** | Adjust lighting/exposure/threshold in a controlled sequence; calibrate image coordinates to conveyor coordinates; inspect false accepts/rejects. | Calibration record, tolerance, and changed-lighting transfer test. |
| 8 | **Coordinate PLC, robot, and motion** | Implement a handshake: ready, request, busy, complete, fault, reset; home the axis and respect limits/interlocks. | Handshake table, homing trace, recovery checklist. |
| 9 | **Safety in non-routine conditions** | Scenario begins during setup or recovery; learner must identify the hazard, choose the safe condition, and explain why an apparently convenient action is prohibited. | Safety worksheet and explanation; no “pass” from motion success alone. |
| 10 | **Secure the OT cell** | Inventory assets; identify trust boundaries; choose least-privilege access, segmentation, backup/change control, and safe remote-access behavior. | OT security design note with operational trade-offs. |
| 11 | **Capstone troubleshooting** | Four hidden faults are drawn from PLC, serial, vision, motion, network, and robot handshaking. Learner must prioritize hypotheses, test safely, fix, verify a variant, and hand off. | Portfolio packet: traces, changes, rollback, unresolved risk, and reflection. |
| 12 | **Spaced review** | Revisit terms and diagnosis patterns in mixed scenarios after delays; ask for prediction before showing the trace. | Delayed retrieval, transfer result, and updated confidence calibration. |

### Gaps

- Evidence for retrieval, spacing, feedback, explanation, and worked examples is strong enough to guide the interaction loop, but the cited sources are mostly general education or learning-science guidance rather than industrial automation studies.
- The proposed artifact set is a design recommendation. It should be checked against the actual workflows and documentation conventions of target plants and vendors.
- The optimal amount of simulation realism is unresolved. More detail can increase authenticity but can also increase extraneous cognitive load; compare minimalist and high-fidelity versions in pilot studies using transfer and error recovery, not engagement alone.

## Accessibility, localization, cognitive load, safety, and industrial context

### Takeaway

Accessibility should be built into the simulator, lesson authoring schema, and assessment evidence—not added as a visual polish pass. Use WCAG 2.2 as the web baseline, W3C cognitive-accessibility guidance and CAST UDL as design complements, and localize technical language through reviewed term records. Because automation is safety- and reliability-critical, the curriculum should make non-routine conditions, safe-state reasoning, risk reduction, OT constraints, and shared cybersecurity responsibility visible throughout the progression.

### Cited Findings

- WCAG 2.2 defines four accessibility principles—perceivable, operable, understandable, and robust—and includes requirements relevant to this product such as text alternatives, captions, keyboard access, focus visibility, timing control, target size, readable language, consistent help, error identification, and status messages. — [W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*](https://www.w3.org/TR/WCAG22/)
- WCAG also states that conformance alone does not address every cognitive, language, and learning need and points authors to supplemental cognitive-accessibility guidance. — [W3C, WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- W3C’s cognitive and learning disabilities guidance recommends clear purpose and operation, familiar hierarchy, short and clear instructions, easy recovery from mistakes, focus support, processes that do not rely on memory, help and support, personalization, and testing with people with cognitive and learning disabilities. — [W3C, *Making Content Usable for People with Cognitive and Learning Disabilities*](https://www.w3.org/TR/coga-usable/)
- CAST’s UDL Guidelines recommend multiple means of engagement, representation, and action/expression, including vocabulary clarification, multiple ways to perceive information, prior-knowledge connections, transfer, graduated support, meaningful goals, planning, and progress monitoring. — [CAST UDL Guidelines 3.0](https://udlguidelines.cast.org/)
- OSHA states that industrial robots are used for hazardous and repetitive tasks and that many robot accidents occur during non-routine operations such as programming, maintenance, testing, setup, and adjustment, when a worker may be inside the robot’s working envelope. — [OSHA, Robotics Overview](https://www.osha.gov/robotics)
- ISO 12100 describes terminology, principles, and a methodology for machinery risk assessment and risk reduction, including identifying hazards, estimating and evaluating risk, eliminating hazards or reducing risk, and documenting and verifying the process. — [ISO 12100:2010](https://www.iso.org/standard/51528.html)
- NIST SP 800-82 Rev. 3 describes OT as systems that interact with or manage devices in the physical environment and emphasizes that OT security must address performance, reliability, and safety requirements as well as security threats and vulnerabilities. — [NIST SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final)
- ISA states that the ISA/IEC 62443 series defines requirements and processes for securing industrial automation and control systems, bridges operations and information technology, and treats people, processes, and technology across the lifecycle as important. Its overview describes shared responsibility among asset owners, product suppliers, integrators, and service suppliers. — [ISA, ISA/IEC 62443 Series](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards)
- NIST’s NICE Framework establishes a common language for cybersecurity work and the knowledge and skills needed to perform it, and identifies uses in career discovery, education, training, hands-on learning, apprenticeships, hiring, and workforce development. — [NIST NICE Framework Resource Center](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center)

### Inferences

- Accessibility and cognitive support are especially important in this domain because learners may be working with dense notation, timing, traces, alarms, diagrams, numeric parameters, and high-stakes concepts. The interface should reduce avoidable memory and navigation demands while preserving the complexity that is essential to the skill.
- Safety and cybersecurity should not be isolated “compliance chapters.” Put safe-state and change-control questions into PLC, motion, robot, network, and troubleshooting lessons; revisit them in spaced retrieval and capstones.
- The curriculum should teach cybersecurity as an OT systems problem, not only as generic IT hygiene. Learners need to reason about physical process impact, availability, safety, maintenance windows, remote access, asset ownership, and recovery.
- Localization must cover more than translated prose. Technical terms, abbreviations, symbols, units, decimal separators, date/time formats, directionality, keyboard input, vendor names, and safety wording all need locale-aware treatment.

### Design recommendation: accessibility baseline

Use WCAG 2.2 AA as the minimum product target, then add cognitive and task-specific accommodations. The following should be acceptance criteria for every interactive lesson:

- Every control has a programmatic name, keyboard operation, visible focus, logical reading order, and a non-drag alternative.
- Do not use color alone to identify energized/de-energized, true/false, safe/fault, or selected/unselected states. Combine color with text, pattern, icon, position, or a value that is available to assistive technology.
- Provide textual equivalents for ladder diagrams, network diagrams, camera overlays, waveforms, signal traces, robot paths, and status LEDs. A text view should expose the same causal information, not merely say “diagram.”
- Provide captions and transcripts for narration and video; provide audio description or an equivalent step-by-step text representation for essential visual actions.
- Allow pause, step, replay, slow motion, and no-time-limit practice. A timed assessment should have an untimed equivalent when speed is not the learning objective.
- Keep focus visible when panels open, traces update, faults appear, or the simulator changes state. Announce important status changes without stealing focus.
- Avoid flashing or rapid animation. Provide reduced-motion behavior and a static view of moving equipment.
- Use large, clearly labeled targets and provide keyboard or button alternatives for dragging wires, points, nodes, and robot paths.
- Preserve learner work across refreshes, timeouts, and navigation. Provide undo, reset-to-scenario, and “what changed?” views.
- Let learners choose text size, density, contrast, motion, audio, caption, language, unit system, and whether hints are shown automatically or on request.
- Keep one primary goal visible. Use stable regions for instructions, simulator, evidence, feedback, and glossary so the learner does not have to rediscover the interface each time.
- Use literal, concise instructions. Split multi-stage procedures into numbered steps and state the expected result after each step.
- Test with people who have a range of motor, visual, auditory, cognitive, language, and technical experiences. W3C specifically recommends involving people with cognitive and learning disabilities in research, design, and usability testing. — [W3C COGA guidance](https://www.w3.org/TR/coga-usable/)

### Design recommendation: localization and terminology architecture

Separate lesson semantics from interface strings and keep a reviewed term service with:

- canonical concept ID;
- English/source label and plain-language definition;
- translated labels and definitions;
- local abbreviations, synonyms, and vendor terms;
- pronunciation and speech-recognition variants;
- symbol and code literal, preserved exactly when syntax is not translated;
- unit and number-format behavior;
- safety-critical wording and prohibited ambiguous translations;
- screenshots or diagrams that have been reviewed for text embedded in images;
- source, reviewer, version, and effective date.

Localization rules:

1. Translate the explanation, not PLC instructions, protocol bytes, code keywords, device identifiers, or vendor model numbers unless the relevant convention explicitly requires it.
2. Show the canonical term with the local term on first use when cross-border work is likely: “interlock (互锁 / Verriegelung / enclavamiento)” as appropriate to the learner’s locale.
3. Keep units explicit and convert only when the conversion is unambiguous. Preserve the source value and show the converted value when safety or calibration depends on precision.
4. Do not encode meaning only in word order, color, or abbreviations; those vary across languages and can be inaccessible.
5. Have translations reviewed by both a language professional and an automation SME. For safety and cybersecurity content, review with the responsible safety/security owner.
6. Test expanded text, right-to-left layouts, mixed Latin and non-Latin strings, decimal separators, long compound nouns, and keyboard entry.
7. Preserve searchability across aliases: a learner should find “photoeye,” “photo eye,” “photoelectric sensor,” and the approved local term when those are valid synonyms.

### Design recommendation: cognitive-load controls

Use the simulator to manage, not erase, complexity:

- **Segment:** reveal one causal chain at a time: sensor → logic → state → actuator → feedback.
- **Pretrain just-in-time:** name only the components needed for the next task; put full reference material in the side panel.
- **Synchronize representations:** highlight the relevant rung, signal, event, and machine state together, while also providing a textual linear view.
- **Reduce split attention:** keep the instruction adjacent to the object it controls and preserve the learner’s current context when opening help.
- **Use stable visual mappings:** the same signal should not move between colors, icons, labels, and panel positions without explanation.
- **Fade support:** remove one scaffold at a time, then bring it back only for the missing subskill.
- **Use contrastive cases:** show two similar faults whose causes differ so the learner practices discrimination rather than memorizing a recipe.
- **Protect working memory:** provide persistent signal names, units, state labels, and breadcrumbs; do not require the learner to remember a value from a previous screen.
- **Separate learning complexity from UI complexity:** a realistic fault can be difficult; the control surface should remain predictable.
- **Make warnings actionable:** state the hazard, the condition, the required safe state, and the next verification. Avoid repeating generic warnings so often that the learner stops reading them.

### Design recommendation: safety and cybersecurity progression

Teach safety in three layers:

1. **Conceptual layer:** hazards, exposure, safe state, interlocks, guarding, emergency stop concepts, reset/restart behavior, and the distinction between control logic and safety-rated functions.
2. **Reasoning layer:** identify the hazard, initiating event, affected person, existing control, residual risk, and verification evidence. Use ISO 12100’s risk-assessment and risk-reduction vocabulary without reproducing proprietary or jurisdiction-specific requirements. — [ISO 12100](https://www.iso.org/standard/51528.html)
3. **Scenario layer:** programming, setup, maintenance, testing, and recovery cases in which the obvious shortcut is unsafe. OSHA’s observation about non-routine robot operations makes these scenarios especially important. — [OSHA Robotics](https://www.osha.gov/robotics)

Teach industrial cybersecurity in parallel with the system lifecycle:

1. identify assets and owners;
2. map data and control paths;
3. distinguish safety, availability, integrity, and confidentiality impacts;
4. define zones, conduits, roles, and access paths;
5. apply least privilege, segmentation, secure remote access, backups, change control, monitoring, and recovery;
6. test the control in a safe simulation and document operational trade-offs.

NIST SP 800-82 supports the OT-specific emphasis on physical-process impact, performance, reliability, and safety. ISA/IEC 62443 supports teaching shared responsibility across asset owners, suppliers, integrators, service providers, people, processes, technology, and lifecycle. — [NIST SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final); [ISA/IEC 62443 overview](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards)

Use the NICE Framework as a vocabulary bridge for cybersecurity capability and role mapping, while keeping the industrial content grounded in the OT scenario. — [NIST NICE Framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center)

### Gaps

- WCAG 2.2 is a web accessibility standard, not a complete specification for accessible industrial simulation, diagrams, timing traces, or safety training. The product needs task-specific accessibility tests with real learners.
- W3C COGA is supplemental working-group guidance rather than a WCAG conformance standard. It is highly useful for design and testing, but its recommendations should be treated as guidance and validated in the product context.
- ISO and ISA standards are authoritative but often paywalled; the cited public pages provide abstracts and overviews, not permission to reproduce complete requirements. The product should obtain the appropriate licensed standards and have SMEs review all safety and cybersecurity content.
- There is no evidence in the collected sources that a browser simulator can establish real-world safety competence, commissioning authorization, or cybersecurity readiness by itself. The product should make this boundary explicit and offer handoff evidence for instructor, employer, or authorized assessor review.
- The cited sources do not determine which localization should be prioritized first. Choose locales from target users and plant/customer evidence, then measure comprehension, term retrieval, task completion, and error recovery in each locale.
