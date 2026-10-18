# Turn OmniProbe Into a Safe Workbench

OmniProbe should grow from a Modbus-focused diagnostic simulator into a **free, browser-first industrial automation, robotics, vision, calculator, recipe, and adaptive-learning workbench** whose complete baseline experience works offline. The product must expose one honest capability model: deterministic simulators and calculators run in the browser; Web Serial, browser camera, and MQTT-over-WebSocket are permissioned browser adapters; raw TCP/UDP, CAN, OPC UA `opc.tcp`, SECS/HSMS, vendor camera SDKs, and unrestricted device access require an optional local bridge. The current repository already proves the value of deterministic Modbus framing, register decoding, a fault-injectable virtual bus, waveform inspection, and commissioning-oriented reports, but it lacks the shared event, transport, recipe, trace, terminology, and learner contracts needed to scale safely. The target is therefore a layered product rather than a collection of protocol screens: a pure domain core, deterministic simulators and replay, edge adapters, a module registry, and a capability-aware learning shell. Research supports teaching protocol stacks, retrieval, spacing, worked examples, explanatory feedback, and transfer; it does not support treating a short quiz or simulator result as certification ([National Academies, *How People Learn II*](https://www.nationalacademies.org/read/24783/chapter/1); [IES What Works Clearinghouse](https://ies.ed.gov/ncee/wwc/PracticeGuide/1); [AERA/APA/NCME testing standards](https://www.testingstandards.net/uploads/7/6/6/4/76643089/standards_2014edition.pdf)). OmniProbe must remain educational evidence about a synthetic or explicitly identified read-only source, never a safety function, commissioning authority, cybersecurity authorization, or substitute for qualified engineering review.

## The existing simulator needs shared boundaries before it adds domains

**Current repository evidence.** OmniProbe currently presents itself as a deterministic industrial and edge protocol diagnostic suite with frame inspection, 32-bit register decoding, a virtual fault-injectable bus, waveform analysis, and commissioning audits ([`README.md`](../README.md)). The implemented type model is centered on `MODBUS_RTU`, `MODBUS_TCP`, `SECS_HSMS`, and `SPARKPLUG_EDGE`, while the concrete codec and simulator implementations are primarily Modbus RTU/TCP and serial wire-time behavior ([`src/types/omniprobe.ts`](../src/types/omniprobe.ts); [`src/modules/frame-studio/protocolCodecs.ts`](../src/modules/frame-studio/protocolCodecs.ts); [`src/modules/virtual-bus/busSimulatorEngine.ts`](../src/modules/virtual-bus/busSimulatorEngine.ts)). That is a strong deterministic foundation, but the current surface does not yet provide a unified representation for TCP/UDP streams, CAN arbitration, OPC UA address spaces, MQTT/Sparkplug lifecycle, SECS-II item trees, PLC execution, robot and vision state, recipes, or learning evidence.

**Product recommendation.** Treat the expansion as a contract-and-boundary project. Every new module must consume the same normalized events, session modes, trace records, source metadata, and result statuses. Every result must state whether it is `SIMULATED`, `REPLAY`, `BROWSER LIVE`, or `BRIDGE LIVE`, and separately whether the session is `READ ONLY` or `WRITE ARMED`. Never collapse those fields into a green “connected” indicator: a replay can look complete while having no device side effect, and a live read can be connected while still having no authority to write.

| Current gap | Why it matters | Required product response |
|---|---|---|
| Modbus-centered types and screens | New protocols would otherwise create incompatible event shapes, duplicated inspectors, and domain-specific assumptions | Introduce a protocol-neutral event, frame, state-transition, and trace schema before adding broad adapters |
| No explicit browser-versus-native capability contract | Static hosting cannot run a PLC socket server, MQTT broker, OPC UA server, device driver, or native camera SDK ([Vite static deployment](https://vite.dev/guide/static-deploy); [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)) | Keep pure simulation/replay complete offline; add browser APIs and a narrow local bridge at the edge |
| No domain model for recipes and calibration lineage | A result cannot be reproduced if the exact parameter revision, unit, calibration, and software version are unknown | Make recipe revisions immutable, hashed, diffable, and attached to every run |
| No adaptive learner model | A single global beginner/intermediate label hides different readiness across PLC, robotics, vision, serial, networking, motion, safety, and cybersecurity | Track capability evidence by domain, context, recency, confidence, transfer, and safety dependency |
| Safety and cybersecurity are not a universal execution boundary | A diagnostic-looking write can change physical energy, motion, interlocks, or process state; OT security also has performance, reliability, and safety constraints ([NIST SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final)) | Default to synthetic, read-only, and least-privilege behavior; block actuation, live discovery, exploit behavior, and safety approval claims |
| Reports risk blending simulated findings with commissioning decisions | A simulator observation is not physical isolation, validation, compliance, or authorization; OSHA distinguishes control-circuit devices from energy-isolating devices ([OSHA 1910.147](https://www.osha.gov/laws-regs/regulations/standardnumber/1910.147)) | Export a two-layer educational record with explicit evidence limits and an empty external field-disposition section |

**Scope language.** This specification uses `MUST` for release-blocking behavior, `SHOULD` for the default design that can be changed with evidence, and `MAY` for optional later capability. “Sourced fact” identifies a statement grounded in a URL from the research notes. “Product recommendation” identifies a design decision inferred from those facts and therefore subject to implementation review, user testing, and qualified domain review.

## One core makes every protocol inspectable and every connection honest

**Sourced fact.** The researched protocols expose different layers and semantics. Modbus maps an application protocol onto serial or TCP/IP links ([Modbus Organization specifications](https://www.modbus.org/specs.php)); TCP is a reliable, ordered byte stream while UDP is a datagram protocol without delivery or ordering guarantees ([RFC 9293](https://www.rfc-editor.org/rfc/rfc9293); [RFC 768](https://www.rfc-editor.org/rfc/rfc768)); CANopen adds an Object Dictionary and network-management services above CAN ([CANopenNode](https://github.com/CANopenNode/CANopenNode)); OPC UA combines an information model, services, encodings, profiles, subscriptions, events, security, and PubSub ([OPC UA Part 1](https://reference.opcfoundation.org/specs/OPC-10000-1/full)); MQTT provides publish/subscribe, QoS, retained messages, sessions, and Last Will behavior ([OASIS MQTT 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html)); Sparkplug B adds stateful industrial lifecycle and metric semantics ([Eclipse Sparkplug](https://github.com/eclipse-sparkplug/sparkplug)); and SECS/HSMS uses session control plus SECS-II item trees and stream/function exchanges ([secs4net](https://github.com/mkjeff/secs4net)). The shared learning need is to show one exchange as raw bytes or frames, decoded fields, semantic objects, state transitions, and a timeline rather than hiding all behavior behind a protocol-specific result.

**Product recommendation: target architecture.** Use a static Vite/React shell around a pure TypeScript domain core. The core owns codecs, validation, unit-safe calculators, state machines, deterministic simulation, trace/replay, lesson evaluation, terminology, and provenance. It must not import `window`, `navigator`, `Date`, `Math.random()`, browser storage, Web Serial, Web Bluetooth, camera APIs, MQTT clients, WebSocket handles, or bridge transport code. A Dedicated Worker owns high-rate simulation, replay, waveform generation, packet inspection, and bulk calculation when needed; WebAssembly remains an optimization or reuse boundary only after profiling justifies it ([MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API); [MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides)).

```text
Static Vite/React application
  ├─ Learning shell: onboarding, lesson runner, evidence, glossary, accessibility
  ├─ Module registry: domains, capabilities, schemas, sources, lesson providers
  ├─ Pure domain core
  │    ├─ codecs and frame/state inspectors
  │    ├─ calculators and unit/dimension validation
  │    ├─ deterministic simulators and fault models
  │    ├─ trace store, virtual clock, replay and branch comparison
  │    ├─ recipes, calibration lineage, run records
  │    └─ learner evidence and adaptive route selection
  ├─ Worker/Wasm boundary: typed messages, serializable results, explicit errors
  ├─ Browser Live adapters: Web Serial, camera, WebSocket, MQTT-over-WSS, optional BLE GATT
  └─ Bridge Live adapter: versioned loopback WebSocket capability broker
       ├─ raw TCP/UDP and industrial sockets
       ├─ CAN/CAN-FD and SocketCAN/vendor drivers
       ├─ OPC UA opc.tcp and certificate stores
       ├─ HSMS TCP and vendor equipment adapters
       ├─ Modbus TCP/RTU drivers and native camera SDKs
       └─ native MQTT brokers and other OS devices
```

**Capability matrix.** The base product MUST remain complete with network access disabled and no permissions granted. “Browser capability” means the browser owns a user-permissioned device or endpoint and the adapter still has to be feature-detected and tested against a browser matrix. “Bridge” means a separately installed local process; it is not a transparent arbitrary socket tunnel.

| Domain | Browser-safe offline/simulator | Browser Live | Native bridge or hardware |
|---|---|---|---|
| Serial, RS-232, RS-485, Modbus RTU/ASCII/TCP | UART settings, byte timing, parity/stop-bit model, RTU silent intervals, ASCII, CRC/LRC, Modbus function codes 01/02/03/04/05/06/15/16, register maps, exceptions, MBAP, retries, malformed frames, deterministic replay | Web Serial port selection, permission state, read/write streams, disconnect handling, raw capture where supported ([Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)) | Unrestricted port/driver control, RS-485 transceiver/termination diagnostics, arbitrary industrial TCP/RTU, lab rigs |
| TCP/UDP | TCP connection state and stream chunking, length/delimiter/timeout framing, UDP loss/reorder/duplication/truncation/checksum scenarios | WebSocket/WSS only when a gateway intentionally exposes it; the UI MUST say it is not raw TCP/UDP ([MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)) | Raw TCP/UDP sockets, multicast/broadcast, packet capture, local subnet access, native discovery |
| CAN/CAN-FD, CANopen, J1939 | Frame objects, IDs, DLC, arbitration model, bus-load estimate, error/bus-off model, CANopen NMT/heartbeat/PDO/SDO/EMCY/SYNC, J1939 PGN/SA/SPN/FMI and multi-frame scenarios | No general browser CAN-bus API is assumed; use replay | CAN adapters, SocketCAN/vendor drivers, bit timing, electrical and bus-error data; read-only bridge first |
| OPC UA | NodeIds, namespaces, Objects/Variables/Methods, Browse/Read/Write/Call model, DataValue status/timestamp, subscriptions, NodeSet import, test certificates | Endpoint-specific HTTPS/WebSocket/JSON path only when deliberately exposed | `opc.tcp`, discovery, native certificate store, full client/server and production subscriptions |
| MQTT 5 and Sparkplug B | Packet codec, in-memory broker, topic filters, QoS/session/retain/will/property model, Sparkplug birth/death/data/state lifecycle with pinned schema | MQTT.js over `ws`/`wss`, with broker authentication, TLS, ACLs, bounded queues, and no credentials saved in projects ([MQTT.js browser](https://github.com/mqttjs/MQTT.js#browser)) | Native broker access, enterprise persistence, certificate stores, state stores, device identity, broker-specific limits |
| SECS/HSMS/GEM | HSMS control state, SECS-II item trees, SxFy correlation, system bytes, timers, errors, GEM events/alarms/reports/remote-command scenarios, trace replay | No generic browser HSMS assumption | HSMS TCP, equipment timing, vendor capability tables, remote commands; read-only default |
| PLC and robotics | IEC 61131-3 learning subset, deterministic scan, ST/LD/FBD, timers/counters/edges, I/O image, robot cell state, handshake, 2-link FK/IK, path and timing models | Camera media input and optional browser-hosted visual overlays; no PLC runtime download | Vendor PLC runtime, robot controller, native camera control, drives, actual motion |
| Vision and calibration | Fixture images, synthetic camera, FOV, pixel scale, exposure blur, thresholding, affine calibration, residuals, holdout points, deterministic fault injection | `getUserMedia()` camera frames after explicit permission and secure-context checks ([MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)) | Industrial GigE/USB camera triggers, exposure/control SDK, vendor formats, lighting and fixture interfaces |

**Module registry contract.** Each domain is a versioned module, not a hard-coded navigation branch. The registry MUST reject duplicate IDs, unsupported schema versions, missing source metadata, and capabilities that are not backed by an adapter. A concrete TypeScript shape is:

```ts
type ExecutionMode = 'SIMULATED' | 'REPLAY' | 'BROWSER_LIVE' | 'BRIDGE_LIVE'
type Authority = 'READ_ONLY' | 'WRITE_ARMED'

interface WorkbenchModuleManifest {
  moduleId: string
  version: string
  domains: string[]
  supportedModes: ExecutionMode[]
  transports: string[]
  capabilities: Array<{
    id: string
    access: 'read' | 'subscribe' | 'command'
    safetyClass: 'educational' | 'read-only' | 'qualified-review'
    maxRateHz?: number
  }>
  schemaVersions: string[]
  calculatorIds: string[]
  lessonIds: string[]
  terminologyRefs: string[]
  sourceRefs: string[]
  adapterIds: string[]
}
```

Initial registry entries MUST cover `protocol-inspector`, `serial-modbus`, `tcp-udp`, `can-network`, `opcua-simulator`, `mqtt-sparkplug`, `secs-hsms`, `plc-sandbox`, `robotics-motion`, `vision-calibration`, `calculator-lab`, `recipe-manager`, `trace-replay`, `learning-studio`, `terminology`, and `ot-safety-cyber`. A module can expose several lessons and calculators, but all of them must declare their safety boundary, source references, supported modes, and test fixtures.

**Session and transport contract.** The UI consumes one session shape regardless of source:

```ts
interface WorkbenchSession {
  id: string
  executionMode: ExecutionMode
  transport: 'simulator' | 'fixture' | 'serial' | 'camera' | 'websocket' |
    'mqtt-websocket' | 'bluetooth-gatt' | 'bridge'
  authority: Authority
  source: { id: string; label: string; fixtureHash?: string; deviceId?: string }
  capabilities: string[]
  contractVersion: string
  clock: { kind: 'virtual' | 'browser' | 'bridge'; nowMs: number; speed: number }
  limits: { maxMessageBytes: number; maxRateHz: number; queuePolicy: 'drop-oldest' | 'coalesce' | 'stop' }
}

interface TransportAdapter {
  open(request: OpenRequest): Promise<WorkbenchSession>
  read(request: ReadRequest): Promise<NormalizedResult>
  subscribe(request: SubscribeRequest, onEvent: (event: NormalizedEvent) => void): Unsubscribe
  command(request: CommandRequest): Promise<NormalizedResult>
  close(sessionId: string): Promise<void>
}
```

The bridge MUST implement a versioned WebSocket subprotocol such as `omniprobe.bridge.v1`, bind to loopback by default, reject unexpected origins, cap message size and subscription rate, expire idle sessions, and require one-time user-visible pairing or approval. It MUST expose named capabilities such as `modbus.readHoldingRegisters`, `camera.snapshot`, `opcua.browse`, or `trace.read`, not `sendBytes` or `connectToHost`. Credentials remain in OS-protected bridge configuration and never enter the static bundle or saved projects. Every command returns a structured result or stable error such as `CAPABILITY_DENIED`, `DEVICE_OFFLINE`, `TIMEOUT`, `INVALID_ARGUMENT`, `STALE_SEQUENCE`, or `WRITE_NOT_ARMED`; every write attempt is audited. This is a product contract inferred from browser permission limits, WebSocket behavior, MQTT security guidance, and static hosting constraints ([MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API); [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS); [OASIS MQTT security](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html)).

## Domain models make calculators, recipes, and traces reproducible

**Normalized event model.** All simulators, replays, browser adapters, and bridges MUST emit the same causal event shape so the inspector never needs a separate “live” renderer. Raw bytes are optional but preserved when available; decoded fields and semantic objects are typed; quality and provenance are explicit.

```ts
interface NormalizedEvent {
  eventId: string
  sequence: number
  virtualTimeMs: number
  source: { sessionId: string; assetId: string; moduleId: string }
  kind: 'frame' | 'value' | 'state' | 'alarm' | 'image' | 'motion' | 'log' | 'command'
  direction?: 'TX' | 'RX' | 'INTERNAL'
  protocol?: string
  raw?: { encoding: 'hex' | 'base64' | 'bytes'; data: string }
  decoded?: Record<string, unknown>
  semantic?: Record<string, unknown>
  quality: 'good' | 'stale' | 'uncertain' | 'invalid' | 'simulated'
  causality?: { parentEventIds: string[]; phase?: string }
  provenance: { modelVersion: string; fixtureHash?: string; seed?: string; sourceRefs: string[] }
}
```

**Trace and replay model.** A trace is a content-addressed, schema-versioned record containing session metadata, source and capability labels, recipe revision, calibration IDs, model versions, event sequence, virtual timestamps, input actions, fault profile, seed, expected output, actual output, and evidence links. Store canonical JSON for inspectability and permit a binary envelope later for large image or packet data. Replay MUST operate on a virtual clock with `pause`, `step`, `seek`, `speed`, and `branch`; two runs with the same fixture, model version, seed, inputs, and fault profile MUST produce the same normalized events. A “change one variable” view compares two traces by causal event, value, state transition, and derived result. The replay record must preserve whether a trace was synthetic, captured, or live and must never imply that a recorded log proves a physical action.

| Trace field | Required behavior |
|---|---|
| `traceId`, schema version, content hash | Stable identity; hash changes when any canonical content changes |
| `executionMode`, transport, authority | Persist the exact capability context next to results |
| `clock`, event sequence, timestamps | Use virtual time for simulator/replay; retain source timestamps for captured/live records |
| raw and decoded data | Permit byte/frame, field/table, semantic tree, and timeline views from one record |
| seed and fault profile | Reproduce noise, jitter, loss, drift, malformed frames, and state faults |
| recipe/calibration/software references | Make a calculator, vision result, or simulated run reproducible |
| learner actions and evidence | Record hypotheses, tests, hints, explanations, and artifacts separately from final answers |
| privacy and secret handling | Reject or redact credentials, tokens, private keys, and unapproved plant identifiers before export |

**Calculator model.** Every calculator is a pure model card with `purpose`, `terms`, `inputs`, `formula`, `outputs`, `assumptions`, `validationRanges`, `workedExample`, `measuredComparison`, `safetyClass`, `reviewerStatus`, `modelVersion`, and `sourceRefs`. Inputs retain the entered value, unit, provenance (`entered`, `measured`, `vendor-data`, or `assumed`), and normalized SI value. The evaluator rejects non-finite values, unknown dimensions, divide-by-zero, impossible geometry, negative absolute pressure, negative mass, and negative time. It returns `valid`, `valid-with-assumptions`, `out-of-range`, `insufficient-inputs`, or `domain-review-required`, never an unexplained number.

The initial calculator catalog MUST include unit and dimensional analysis; 2D transforms and frame chains; 2-link FK/IK and reach; motion profiles and path guidance; conveyor arrival and trigger compensation; cycle time and OEE; PLC scan/event timing; serial wire time; TCP/UDP packet timing; CAN bus load/arbitration; pneumatic force and flow estimates; dispensing volume, mass, and dose timing; pump and hydraulic power; thermal and electrical first-pass estimates; camera FOV, pixel scale, exposure blur, and lighting; affine calibration and residuals; tolerance/error budgets; and recipe lineage. The formulas and limits should be derived from the researched model cards, including `V = Qt`, the trapezoidal/triangular motion model, affine residuals, OEE decomposition, serial bits-per-character, and first-order CAN load; each result must state what it omits. The research explicitly distinguishes deterministic educational arithmetic from commissioning estimates, domain-reviewed engineering models, and safety-critical decisions, with only the first two appropriate for ordinary browser calculation ([NIST SI Units](https://www.nist.gov/pml/owm/metric-si/si-units); [Stanford CS223A](https://see.stanford.edu/Course/CS223A); [OpenCV calibration](https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html); [BIPM GUM publications](https://www.bipm.org/en/committees/jc/jcgm/publications)).

**Path guidance.** The motion screen MUST show named coordinate frames, the frame tree, target reachability, joint solutions where the model supports them, joint-limit and singularity warnings, sampled path, clearance to modeled obstacles, timing estimate, residuals, and unmodeled assumptions. It can recommend diagnostic next steps such as “verify the tool frame,” “measure conveyor speed,” “capture a scan trace,” or “repeat calibration on holdout points.” It MUST NOT claim that a path is safe to execute, certify a robot, calculate an E-stop distance as a final answer, or bypass a safety-rated controller. A geometric reach result is not collision, load, cable-routing, controller, or safety feasibility; non-routine robot activities deserve explicit training scenarios because OSHA reports many robot incidents during programming, maintenance, testing, setup, and adjustment ([OSHA Robotics](https://www.osha.gov/robotics)).

**Recipe model.** Recipes are controlled context, not mutable bags of numbers. The canonical record MUST contain the product, station, machine, fixture, material lot, parameter names, values, units, bounds, provenance, calibration IDs, software/firmware versions, author, timestamps, reason for change, parent revision, approval history, effective interval, rollback target, and content hash. Revisions move through `draft → reviewed → approved → effective → retired`; each transition is explicit and audited. Approval creates a new immutable revision, never mutates the approved record. The semantic diff MUST distinguish a setpoint change, a limit change, a unit change, a calibration change, and a software change before showing the numerical diff. Runs attach the exact recipe revision and calibration IDs so a learner can recreate the result. Recipe governance concepts align with ISA-88’s public scope around terminology, data structures, physical and functional models, and recipe relationships, but the application must obtain and review the applicable licensed standard and site quality rules before making formal claims ([ISA-88](https://www.isa.org/isa88)). Safety-rated parameters remain outside ordinary operator-editable recipe fields.

```ts
interface RecipeRevision {
  recipeId: string
  revision: string
  parentRevision?: string
  status: 'draft' | 'reviewed' | 'approved' | 'effective' | 'retired'
  productId: string
  machineId: string
  stationId: string
  fixtureId?: string
  materialLot?: string
  parameters: Array<{
    name: string
    value: number | string | boolean
    unit?: string
    min?: number
    max?: number
    provenance: 'entered' | 'measured' | 'vendor-data' | 'assumed'
  }>
  calibrationIds: string[]
  softwareVersions: Record<string, string>
  createdBy: string
  createdAt: string
  reason: string
  approval?: { reviewer: string; reviewedAt: string; decision: 'approved' | 'rejected' }
  contentHash: string
}
```

## Adaptive learning must measure capability without granting authority

**Diagnostic onboarding.** The first-run flow is a low-stakes orientation check, not a placement exam or credential. It asks short groups of questions and offers `not sure` and `prefer not to say`. The groups cover the learner’s 4–8 week goal and role; systems touched such as PLC, HMI/SCADA, robot, drive, camera, barcode reader, serial device, Ethernet switch, safety controller, and firewall; standards, languages, protocols, vendors, and plant conventions; simulation/training/production experience; time, bandwidth, screen, language, and assistive-technology constraints; recent concrete tasks and artifacts; confidence anchored to “explain,” “do with a guide,” “do independently,” or “diagnose a variant”; confusing terms; preferred challenge level; and one or two short performance probes. The probes predict PLC outputs across scans, identify a serial frame fault, distinguish addressing from routing or application state, choose the first vision intervention, identify a robot safe-recovery condition, or select a minimal OT segmentation change. The result says “what we will try next” and “what evidence we still need,” never “your level is X.”

**Learner model.** Store capability evidence independently for PLC, robotics, serial, networking, vision, motion, safety, and industrial cybersecurity, plus cross-cutting reasoning, schematic reading, logging, change documentation, and explanation. Each capability record contains `conceptualRecall`, `proceduralExecution`, `diagnosticReasoning`, `transfer`, `safetyJudgment`, `documentation`, `confidence`, `recency`, `context`, `evidenceRefs`, attempt count, hints, time, and error type. Use “mastered for this context” before “mastered generally”; generalization requires changed I/O, framing, lighting, topology, cell state, or fault. This multidimensional design follows the research emphasis on knowledge, reasoning, motivation, context, assessment, feedback, technology, and workplace transfer ([National Academies, *How People Learn II*](https://www.nationalacademies.org/read/24783/chapter/1)).

**Adaptive route.** Author the curriculum as `domain → capability → skill atom → term → practice task → scenario → artifact`. Candidate lessons have prerequisite edges, safety dependencies, evidence requirements, and context tags. The initial recommendation heuristic is:

```text
priority =
  0.30 prerequisite readiness
+ 0.20 demonstrated gap
+ 0.15 learner goal relevance
+ 0.15 transfer value to current project
+ 0.10 review due / forgetting risk
+ 0.10 confidence calibration need
```

These weights are a product hypothesis, not a validated educational score; the system MUST log the chosen lesson and alternatives and later evaluate completion, delayed retention, transfer, and artifact quality. Apply a safety override before motion or robot-cell scenarios, repair the smallest missing prerequisite, show one prerequisite route and one safe goal-directed route, and allow the learner to postpone a prerequisite only after explaining what will be harder. A capability gate requires a retrieval explanation, a supported construction/configuration task, an independent task, a changed-context troubleshooting task, the applicable safety decision, and an inspectable artifact; one multiple-choice answer cannot mark mastery. Retrieval, spacing, interleaving, worked examples, and actionable feedback are supported by the cited learning guidance, while the exact order and weights need pilot validation ([MIT retrieval practice](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/retrieval-practice-testing-effect); [MIT spaced/interleaved practice](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/spaced-and-interleaved-practice); [EEF feedback guidance](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback)).

**Lesson contract.** Every lesson declares identity, version, author, reviewer, source/provenance, time, language, audience, one observable objective, domain/capabilities, job context, prerequisites, allowed simulator manipulation, reset and stop conditions, safety boundary, evidence rubric, term moments, learning sequence, hints, instrumentation, mastery gate, and artifact schema. The default interactive loop is orient → retrieve → inspect → worked example → guided action → fade support → independent practice → troubleshooting variant → self-explanation → exit ticket → artifact → spaced review. The simulator must provide pause, step, slow motion, replay, reset, branch, readable timelines, textual equivalents for diagrams and traces, scenario seeds, progressive fault naming, and event causality. A PLC lesson can end in an annotated state diagram and test trace; a robotics lesson in a cell map, frame rationale, handshake table, recovery checklist, and simulated run; a serial lesson in an annotated frame and timeout rationale; a vision lesson in a calibration record and residuals; and a cybersecurity lesson in an asset inventory, zone/conduit map, selected control, operational trade-off, and recovery plan.

**Terminology model.** The glossary is a reviewed term service, not a separate memorization page. A term record contains a canonical concept ID, English label, plain-language and technical definitions, aliases and vendor terms, translations, pronunciation, preserved code literal, symbols, units, contrast term, positive example, non-example, visible signal/state/action, retrieval schedule, safety or cybersecurity implication, source URL, reviewer, version, and effective date. Introduce a term at the moment it names a visible object or decision, contrast it with its nearest confusion, require the learner to use it in an action or explanation, then retrieve it later in a fault and artifact. Initial vocabulary must cover PLC/RTU/DCS/SCADA/HMI, sensor/actuator, hazard/risk/consequence, safe state, interlock/guard/E-stop, LOTO, functional safety, SIL/PL, zone/conduit, authentication/authorization/accounting, least privilege, TLS/certificate/CA/trust chain, event/log/audit trail, finding/vulnerability/hazard/incident, verification/validation/commissioning, serial/baud/parity/CRC, TCP/UDP framing, CANopen Object Dictionary/NMT/PDO/SDO/EMCY, OPC UA NodeId/DataValue/subscription, MQTT QoS/retain/will, Sparkplug birth/death/data, and HSMS/SECS-II stream/function. The safety/security definitions must link to the relevant official sources, including NIST, ISO, IEC, OSHA, ISA, IETF, OASIS, OPC Foundation, and Eclipse resources.

**Safety and cybersecurity boundary.** The product MUST display `SIMULATION`, `SYNTHETIC ASSET`, or `READ-ONLY EDUCATIONAL MODE` at the point of action. Its fixed report disclaimer is:

> This document records observations from an OmniProbe educational simulation. It is not a machine-specific risk assessment, lockout/tagout procedure, safety validation, SIL/PL determination, cybersecurity authorization, conformity assessment, commissioning certificate, or approval to operate, service, modify, or connect to equipment. Field conclusions require the responsible owner and qualified reviewers using applicable laws, site procedures, equipment documentation, and current standards.

The simulator may model stale/noisy/stuck sensors, missing or reordered telemetry, watchdogs, scan overruns, guard or E-stop requests, interlock mismatches, configuration drift, authentication failures, expired lab certificates, missing audit events, clock skew, backup mismatch, bounded queue growth, and synthetic network policy failures. It MUST label these as modeled faults. It MUST never energize a physical output, move an axis or robot, force an I/O point, bypass an interlock, download a controller program, modify a safety PLC, test a real E-stop, scan a production network, fuzz a vendor protocol, guess credentials, flood a target, execute an exploit, or present a simulator result as safe, compliant, certified, validated, SIL/PL achieved, LOTO trained, or work-authorized. The safety boundary follows ISO 12100’s risk-assessment and risk-reduction framing, OSHA’s machine guarding and hazardous-energy requirements, IEC 61508’s application-specific functional-safety concepts, and NIST/ISA guidance on OT safety and cybersecurity ([ISO 12100](https://www.iso.org/standard/51528.html); [IEC 61508-4](https://webstore.iec.ch/en/publication/5518); [IEC 61508-5](https://webstore.iec.ch/en/publication/5519); [OSHA 1910.212](https://www.osha.gov/laws-regs/regulations/standardnumber/1910.212); [ISA/IEC 62443](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards)).

**Accessibility and localization.** Make WCAG 2.2 AA the web baseline and add cognitive/task accommodations: keyboard operation, visible focus, non-drag alternatives, text equivalents for ladder, network, camera, waveform, and robot views, captions/transcripts, pause/step/replay, reduced motion, persistent state labels and units, undo/reset, adjustable text/density/contrast/language/unit system, and stable instruction/simulator/evidence/glossary regions. Do not use color alone for safe/fault/true/false or energized/de-energized states. Localize technical terms, aliases, units, decimal separators, symbols, right-to-left layouts, and safety wording with language and automation-SME review; preserve protocol bytes, code keywords, device identifiers, and vendor model numbers as literals. These requirements are grounded in WCAG 2.2, W3C cognitive-accessibility guidance, and CAST UDL, adapted as product recommendations for traces and industrial diagrams ([WCAG 2.2](https://www.w3.org/TR/WCAG22/); [W3C COGA](https://www.w3.org/TR/coga-usable/); [CAST UDL Guidelines](https://udlguidelines.cast.org/)).

## Ship the offline core in testable increments, then add connectivity

**Free deployment model.** The default public build is a static Vite bundle deployed with GitHub Actions to GitHub Pages. Vite documents the `dist` deployment path and repository-specific `base`; GitHub Pages provides static files but no server-side runtime, and GitHub Free requires a public repository for this use case ([Vite static deployment](https://vite.dev/guide/static-deploy); [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)). The free deployment must ship the UI, deterministic fixtures, Worker bundles, and optional WebAssembly assets without secrets. The project must stay within the documented GitHub Pages limits of a recommended 1 GB repository, 1 GB published site, 10-minute deployment, and soft 100 GB/month bandwidth and 10 builds/hour limits ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)). Cloudflare Pages and Netlify remain optional static-host alternatives, but they require acceptance of their account and plan constraints ([Cloudflare Pages](https://developers.cloudflare.com/pages/); [Netlify deployment](https://docs.netlify.com/start/overview/)).

The base experience MUST run without a backend, broker, cloud account, device permission, or live endpoint. HTTPS is required for deployed Web Serial, camera, Bluetooth, and secure browser transport; localhost is a practical development origin, but browser and enterprise policy matrices still need testing ([MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts); [MDN Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)). Web Serial and camera access require feature detection, explicit user activation, and visible permission state; MQTT-over-WebSocket requires an intentionally configured `ws`/`wss` listener and broker authentication/authorization. Because WebSocket has no built-in backpressure, every live stream must bound queues, sample or coalesce events, expose drops, and stop safely on overload ([MDN WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API); [OASIS MQTT](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html)).

**Staged roadmap.** Each increment below is independently releasable and has an exit test; later increments cannot silently make earlier offline behavior dependent on live services.

| Increment | Scope | Independently testable exit evidence |
|---|---|---|
| 0. Contract foundation | Define schemas, execution labels, module registry, source metadata, virtual clock, seeded RNG, normalized events, structured errors, canonical hashing, redaction | Node and browser runners produce identical event hashes; registry rejects invalid manifests; a synthetic session and report visibly show `SIMULATED · NO DEVICE I/O` |
| 1. Inspector and replay | Generalize the existing Frame Studio and Virtual Bus into raw/decoded/semantic/timeline views; add canonical trace import/export, pause/step/seek/branch, fault profile, and deterministic comparison | Fixed traces replay identically; malformed/truncated frames are explained; a bug fixture reproduces offline; no secret-bearing fixture exports |
| 2. Serial and Modbus learning | Serial settings, framing, CRC/LRC, Modbus RTU/ASCII/TCP, register maps, exceptions, endianness, timeout/retry, guided diagnosis; Web Serial read-only adapter | Golden vectors cover 7E1/8N1/8E1/8N2 and Modbus; permission denied/disconnect works; guided read/write means simulated writes unless explicit adapter authority exists |
| 3. TCP/UDP and transport reasoning | TCP state/stream chunking, application framing, UDP loss/reorder/duplication, packet timing, WebSocket gateway contract, bridge spike | The UI distinguishes WebSocket messages from raw TCP; queue overload is bounded and visible; bridge capability manifest denies arbitrary destinations |
| 4. CAN family | CAN/CAN-FD frame viewer, arbitration/load model, replay; CANopen NMT/heartbeat/PDO/SDO/EMCY/SYNC; starter J1939 PGN/SA/SPN/FMI and multi-frame cases | Classic/CAN-FD and higher-layer fixtures pass; bus-off, heartbeat loss, address conflict, and invalid DLC scenarios replay; connected mode remains read-only |
| 5. MQTT/Sparkplug and OPC UA | In-memory MQTT 5 broker, topic filters, QoS, retain/will/session/property labs; pinned Sparkplug schema/lifecycle; offline OPC UA address space, NodeSet, DataValue, subscription, certificate vocabulary | OASIS/MQTT.js and Eclipse fixtures cross-check; Sparkplug birth/death/data/state sequence errors are visible; OPC UA profile subset is documented without conformance claims |
| 6. PLC, robotics, motion, vision, calculators | ST subset, LD/FBD graph, scan/timers/edges, robot handshakes, frames, FK/IK, path guidance, conveyor timing, dispensing, camera FOV/blur/affine calibration, error budgets | Each calculator returns unit/status/model version; PLC scans are deterministic; path screen shows assumptions and refuses safe-to-run language; vision holdout residuals are persisted |
| 7. Recipes, learning, safety/cyber | Immutable recipe/versioning, calibration lineage, onboarding, adaptive route, terminology service, artifacts, OT zones/conduits, least privilege, logging, backup/recovery, two-layer reports | A learner can complete a multi-domain capstone offline; a recipe diff and rollback are reproducible; unsafe actions are blocked; exported reports preserve source URLs and disclaimers |
| 8. Optional native bridge | Versioned loopback broker for raw TCP/UDP, CAN, OPC UA `opc.tcp`, HSMS, native cameras, and approved serial/Modbus adapters; named read operations, approval, audit, expiry | Bridge contract tests cover origin, pairing, capability denial, timeout, queue limits, disconnect, stale sequence, and write-not-armed; no production-target feature is enabled by default |

**Acceptance criteria.** The product is ready for a release increment only when the relevant row passes and these cross-cutting conditions remain true.

| Area | Release criterion |
|---|---|
| Capability honesty | Every screen shows execution mode, transport, source identity, contract/model version, permission state where relevant, and authority; `LIVE` never appears without a specific browser or bridge label |
| Offline completeness | With network disabled and all permissions denied, a user can run the simulator, calculators, lessons, glossary, traces, reports, and seeded fault scenarios for the released modules |
| Determinism | Same fixture, model version, recipe revision, calibration IDs, seed, and actions produce the same normalized event and report hashes in Node and browser test runners |
| Protocol inspection | Each released protocol provides raw/decoded/semantic/timeline views, length and bounds validation, structured errors, at least one happy-path vector, one malformed vector, one timing/state fault, and a replayable answer key |
| Calculator transparency | Every result has units, model version, assumptions, validation range, input provenance, sensitivity or residual information, status, worked example, and safety/domain-review classification |
| Recipe reproducibility | Approved revisions are immutable and hashed; semantic and numeric diffs are visible; missing required parameters and stale calibration references block approval; every run references the exact revision |
| Learning evidence | A lesson records attempts, hints, confidence, time, hypothesis/action sequence, explanation, transfer result, artifact, source metadata, and safety decision where applicable |
| Safety boundary | No UI, lesson, report, or calculator claims physical safety, compliance, certification, SIL/PL, LOTO completion, commissioning authorization, or safe-to-run motion; uncertain evidence renders `UNKNOWN`, `NOT VERIFIED`, or `REVIEW REQUIRED` |
| Accessibility | Every interactive lesson supports keyboard operation, visible focus, textual equivalents, non-color state cues, pause/step/replay, reduced motion, and preserved work; automated checks and human task tests cover the relevant views |
| Deployment | `npm run build` creates a static artifact without secrets; GitHub Pages deployment uses the configured repository base; the offline app does not require a backend or paid service |

**Unit-test strategy.** Test the domain core before UI snapshots. Golden vectors cover serial character framing, Modbus RTU CRC and TCP MBAP, TCP state and stream chunking, UDP checksum and delivery faults, classic/CAN-FD frame validation and arbitration, CANopen and J1939 decoders, MQTT 5 packet/property/QoS/session behavior, Sparkplug schema-backed lifecycle, OPC UA NodeId/DataValue/subscription models, HSMS/SECS-II length/control/item-tree/timer paths, and PLC scan/timer/edge semantics. Calculator vectors cover SI normalization, motion profile branches, transform order/inverse, FK/IK reach and residuals, conveyor latency, OEE bounds, serial wire time, TCP/UDP lower bounds, CAN load, dispensing, pneumatic first-pass models, pump/thermal estimates, camera blur/FOV, affine residuals, and worst-case/RSS error budgets.

Property and boundary tests MUST reject NaN/Infinity, negative or impossible inputs, invalid lengths, overflow, invalid enum values, collinear calibration points, non-finite units, duplicate or stale sequence numbers, and out-of-range parameters. Stateful simulators must be deterministic under injected clock and seeded randomness and must expose timeout causes. Adapter contract tests use fakes to generate partial chunks, permission denial, disconnect/reconnect, duplicates, out-of-order events, timeouts, authentication failures, queue growth, and capability-manifest violations; no unit suite depends on a real camera, broker, bridge, or user prompt. Browser smoke tests feature-detect `navigator.serial`, `navigator.mediaDevices`, `WebSocket`, optional Bluetooth, and Worker support, then test unavailable and denied states. Load tests feed more telemetry than the UI can render and verify bounded memory, documented drops/coalescing, and a visible quality state. Every production bug becomes a small hashed replay fixture.

**Non-goals.** OmniProbe will not become a vendor PLC compiler or runtime, an online program-download tool, a safety PLC editor, an E-stop or guard tester, a machine-guarding or LOTO control, a universal safe-state selector, a SIL/PL calculator, a robot controller, a collision or stopping-distance certifier, a drive or motor sizing authority, a pressure-vessel or thermal-runaway safety calculator, a product-release or quality-system approval tool, a full OPC UA or SEMI conformance suite, a universal CANopen/J1939 profile certifier, a live-network scanner, exploit/fuzzing platform, credential tester, packet-flooding tool, or production cybersecurity authorization system. It will not promise that an onboarding result proves job readiness or safety competence, and it will not retain or export permanent device credentials, private keys, or unapproved plant data. A future field-facing connector, if ever approved, remains a separately governed adapter with qualified site authorization, least privilege, explicit scope, and external engineering review.

## Conclusion

The expansion succeeds when OmniProbe becomes a transparent practice and evidence system rather than a larger collection of protocol widgets. Its durable differentiator is the same event viewed through bytes, decoded fields, semantic state, timing, fault signature, learner reasoning, recipe lineage, and evidence limits; its free deployment story works because that core is static, deterministic, and offline before any permissioned adapter is enabled. The right first milestone is not “support every protocol,” but “make a protocol, calculation, or lesson reproducible and honest about what it can prove.”

That boundary also makes future connectivity safer: a bridge can be added without teaching the browser to send arbitrary commands, and an instructor can review a learner’s trace without mistaking it for commissioning approval. Qualified engineers, responsible owners, safety reviewers, cybersecurity reviewers, and applicable standards remain the authorities for real equipment, real hazards, real credentials, and real authorization.
