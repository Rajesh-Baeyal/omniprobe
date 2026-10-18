# Industrial automation learning platform safety cybersecurity boundaries

**Prepared:** 2026-10-19  
**Product context:** OmniProbe, an educational diagnostic workbench  
**Research scope:** Public, defensive guidance for functional safety, machine safety, hazardous-energy control, OT/ICS cybersecurity, and educational simulation. This note does not reproduce paid standards, provide exploit instructions, or constitute legal, safety, cybersecurity, or conformity-assessment advice.

## What safety and risk boundaries must OmniProbe enforce?

### Takeaway

OmniProbe should be a simulation and learning system, never a safety function, a machine-guarding control, a lockout/tagout control, a safety-integrity calculator, or a commissioning approval authority. Its default assumption must be that a model result is educational evidence about a synthetic scenario; it must not be presented as proof that a real machine, process, safety circuit, or workplace is safe.

### Cited Findings

- NIST describes OT as systems and devices that monitor or directly change the physical environment, and says OT security must address unique performance, reliability, and safety requirements. Its guidance covers OT topologies, threats, vulnerabilities, and recommended countermeasures. [NIST SP 800-82 Rev. 3 — Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final)
- NIST’s glossary defines safety as freedom from conditions that can cause death, injury, occupational illness, equipment or property loss, or environmental damage; it also describes safety as an expectation that a system does not, under defined conditions, lead to danger to people, property, or the environment. [NIST CSRC glossary — safety](https://csrc.nist.gov/glossary/term/safety)
- ISO 12100 specifies machinery-safety terminology, principles, and a risk-assessment/risk-reduction methodology. The abstract describes hazard identification, risk estimation and evaluation, hazard elimination or risk reduction, and documentation and verification of the process. [ISO 12100:2010 — Safety of machinery](https://www.iso.org/standard/51528.html)
- IEC 61508-4 is the definitions and abbreviations part of the functional-safety series and states that the definitions apply across Parts 1–7. [IEC 61508-4:2010](https://webstore.iec.ch/en/publication/5518)
- IEC 61508-5 explains that risk is related to safety integrity and gives example methods for determining safety integrity levels. It also states that the selected method depends on the application and circumstances, and that the annex examples illustrate principles rather than provide a definitive account. [IEC 61508-5:2010](https://webstore.iec.ch/en/publication/5519)
- OSHA’s hazardous-energy rule applies when unexpected energization, startup, or release of stored energy could cause injury, and requires an employer energy-control program to isolate the machine and render it inoperative before covered servicing or maintenance. [OSHA 29 CFR 1910.147 — control of hazardous energy](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147)
- OSHA defines an energy-isolating device as a mechanical device that physically prevents energy transmission or release; it explicitly says push buttons, selector switches, and other control-circuit devices are not energy-isolating devices. The rule also requires hazardous stored or residual energy to be relieved, disconnected, restrained, or otherwise rendered safe, followed by verification of isolation before work starts. [OSHA 1910.147 definitions and application of control](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147)
- OSHA’s machine-guarding rule requires guarding against hazards such as points of operation, ingoing nip points, rotating parts, flying chips, and sparks; it states that an exposed point of operation must be guarded. [OSHA 29 CFR 1910.212 — general requirements for all machines](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212)

### Recommended OmniProbe guardrails

These are product recommendations inferred from the cited boundaries:

1. **Make simulation-only the default and the identity of every exercise.** The shell, navigation, report header, and result cards should visibly say `SIMULATION`, `SYNTHETIC ASSET`, or `READ-ONLY EDUCATIONAL MODE`. Do not use a green “safe,” “approved,” “certified,” or “compliant” result for a real-world interpretation.
2. **Put an always-visible safety disclaimer at the point of action.** A concise version should say: “OmniProbe models diagnostic concepts. It is not a safety device, E-stop, guard, interlock, lockout/tagout control, risk assessment, safety validation, certification tool, or authorization to operate or service machinery. Never connect it to live equipment without site authorization and qualified review.” Repeat the relevant warning before safety scenarios and before any connector configuration.
3. **Never equate a UI state with physical isolation.** “E-stop requested,” “guard open,” “output disabled,” “controller stopped,” or “LOTO step recorded” may be simulator states, but none should imply that a physical hazard is de-energized. A simulator must not claim that a virtual checkbox replaces physical isolation, dissipation of stored energy, or verification.
4. **Teach that safe state is process-specific.** “Off” is not a universal safe-state assumption. Depending on the hazard and process, a qualified design may require a controlled stop, holding position, braking, pressure relief, blocking, cooling, containment, or another defined response. OmniProbe can compare modeled responses, but it must not select or approve the safe state for a real asset.
5. **Treat uncertainty as uncertainty.** Loss of communication, a stale sensor, a missing feedback channel, or a failed diagnostic should produce `UNKNOWN`, `NOT VERIFIED`, or `REVIEW REQUIRED`, not an automatic claim that the equipment is safe. This follows from the need for application-specific risk assessment and the difference between a control indication and physical energy isolation.
6. **Keep safety-related actuation out of the general workbench.** Any feature that can energize an output, move an axis, change a drive mode, force an I/O point, bypass an interlock, download a controller program, modify a safety PLC, or test a physical E-stop belongs outside the educational core and requires a separate, qualified engineering process. For OmniProbe’s learning product, these should be explicitly out of scope.
7. **Use role-appropriate language.** A learner may complete a “safe-state reasoning exercise” or “simulated LOTO sequence review.” The learner must not receive a “LOTO trained,” “machine safety validated,” “SIL achieved,” “PL achieved,” or “work authorization” status from OmniProbe.
8. **Require qualified review for any field-facing use.** A machine-specific risk assessment, safety-function design, SIL/PL determination, guard validation, safety-device test, LOTO procedure, energy-control program, commissioning decision, or change to a production control system must be reviewed by the responsible employer, machine builder, controls/safety engineer, or other competent person under the applicable jurisdiction and site rules.

### Safe educational fault models

The following faults are appropriate for a deterministic, non-actuating simulator when the exercise clearly distinguishes “modeled fault” from “field condition”:

- Sensor stuck-at, out-of-range, noisy, missing, stale, implausible, or inconsistent with a redundant channel.
- Loss, delay, duplication, or reordering of synthetic telemetry inside a closed simulation; a model should show the diagnostic consequence without sending traffic to a device.
- Watchdog timeout, controller heartbeat loss, scan-cycle overrun as an abstract state, and loss of an HMI indication.
- Guard-open request, E-stop request, overspeed threshold crossing, process-limit violation, or interlock mismatch as a state-machine input. The learner evaluates the expected modeled transition; OmniProbe does not test the real circuit.
- Configuration drift, wrong scaling, bad unit conversion, stale setpoint, mismatched asset identity, invalid topology relationship, or inconsistent engineering metadata.
- Authentication failure, expired or mismatched lab certificate, missing audit event, clock skew, insufficient role, backup mismatch, failed restore, or an unacknowledged simulated alarm.
- Availability degradation such as a synthetic service outage, bounded queue growth, or a simulated network path failure, provided the exercise cannot flood or disrupt any real endpoint.

### Out of scope or qualified-review-only boundary

The following must be blocked, unavailable, or clearly delegated to qualified review:

- Physical motion, motor/valve/robot actuation, output forcing, program download, firmware update, real safety-PLC modification, guard bypass, interlock defeat, E-stop testing, or any command that changes the energy state of field equipment.
- Real lockout/tagout or energy-control instructions presented as a substitute for an employer’s machine-specific procedure, physical isolation, stored-energy control, or verification. OSHA requires documented procedures and specific steps for shutdown, isolation, lock/tag placement, stored energy, and verification; a software record cannot perform those physical actions. [OSHA 1910.147](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147)
- A universal “safe state” algorithm, automatic SIL/PL calculation, safety-function validation, conformity assessment, or claim that a simulated diagnostic establishes compliance with IEC 61508, ISO 12100, ISO 13849, IEC 62061, IEC 60204-1, or another machinery/safety standard.
- Live production discovery, active scanning, intrusive protocol testing, fuzzing, packet flooding, credential guessing, exploit execution, malware simulation against non-synthetic targets, or guidance that could be copied into a real facility without authorization.

### Inferences

- The principal safety boundary is **physical energy and physical consequence**, not whether a command is labeled “diagnostic.” A low-level read/write interface can still change the hazard state, so the product should classify capabilities by possible physical effect rather than by software feature name.
- A safe educational model should be “fail-closed” from the learner’s point of view: when the model lacks evidence, it should stop the exercise, show the missing evidence, and request review rather than infer a safe condition.
- A useful beginner lesson is that **LOTO is a physical energy-control procedure** and **authentication is a digital identity control**. They may both have “lock” language in informal conversation, but one cannot substitute for the other.

### Gaps

- The applicable legal and regulatory requirements depend on jurisdiction, sector, employer policy, machine type, and the specific work activity. OSHA 1910.147 is a U.S. federal rule and should not be presented as a universal global procedure.
- A real safe state, required stopping time, required performance level, SIL target, guard arrangement, and validation method cannot be determined from a generic workbench. They require the machine’s hazards, intended use, foreseeable misuse, energy sources, operating modes, design documentation, and qualified assessment.
- The full IEC, ISO, and ISA/IEC standards are not reproduced here; the public pages cited provide official abstracts or series descriptions. Product requirements should be checked against the currently applicable editions and licensed standards.

## What cybersecurity labs and fault simulations are safe?

### Takeaway

OmniProbe can teach defensive reasoning through an offline, synthetic OT environment: asset inventory, zones and conduits, least privilege, secure defaults, authentication, lab-only TLS and certificates, logging, change control, backups, detection, and incident-response tabletop exercises. It should not teach or automate actions against real industrial networks, real credentials, real vendor devices, or real physical processes.

### Cited Findings

- CISA describes ICS and OT as systems and devices that interact with the physical environment and provides practical tools and guidance for asset owners, operators, integrators, and suppliers. [CISA — Industrial Control Systems](https://www.cisa.gov/topics/industrial-control-systems)
- NIST SP 800-82 says OT security guidance must account for OT performance, reliability, and safety requirements while addressing threats, vulnerabilities, system topologies, and countermeasures. [NIST SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final)
- ISA says the ISA/IEC 62443 family defines requirements and processes for implementing and maintaining electronically secure industrial automation and control systems. ISA describes a holistic approach that bridges operations and IT and connects process safety with cybersecurity. [ISA/IEC 62443 series](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards)
- ISA describes 62443 as a lifecycle and shared-responsibility family involving asset owners, product suppliers, integrators, and service suppliers. It includes common terminology and models, asset-owner security needs, product-development lifecycle requirements, component/system requirements, and risk-assessment processes. [ISA/IEC 62443 series](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards)
- CISA’s Cross-Sector Cybersecurity Performance Goals are a voluntary baseline of high-impact protections for critical infrastructure, a benchmark for measuring maturity, and a combination of practices for IT and OT owners. The page identifies least privilege and incident communication as goals added or emphasized in CPG 2.0. [CISA — Cross-Sector Cybersecurity Performance Goals](https://www.cisa.gov/cross-sector-cybersecurity-performance-goals)
- NIST CSF 2.0 is presented as a way for organizations to understand and improve management of cybersecurity risk; its resource center includes the Govern function and mappings to other references. [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- NIST defines least privilege as restricting users or processes to the minimum access privileges, authorizations, and resources needed for assigned functions. [NIST CSRC glossary — least privilege](https://csrc.nist.gov/glossary/term/least_privilege)
- NIST SP 800-207 says zero trust assumes no implicit trust based only on network location or ownership and treats authentication and authorization as discrete functions performed before a session to an enterprise resource is established. [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- NIST SP 800-63B-4 defines technical requirements for authentication and authenticator assurance levels. It is a digital-identity guideline, not a machine-safety standard, so OmniProbe should teach it as an identity concept rather than imply that it authorizes physical control. [NIST SP 800-63B-4](https://csrc.nist.gov/pubs/sp/800/63/b/4/final)
- CISA’s Secure-by-Design guidance says products should be secure by design and secure by default, and highlights capabilities such as MFA, logging, and SSO being available without an extra charge. The guidance also places responsibility for customer security outcomes on technology providers. [CISA — Secure by Design](https://www.cisa.gov/securebydesign)
- NIST SP 800-52 Rev. 2 provides guidance on selecting and configuring TLS, including certificates and TLS extensions; its abstract requires TLS 1.2 support with FIPS-based cipher suites for federal TLS servers and clients and describes TLS 1.3 support requirements for the federal context. The publication is under review, so the exact policy profile must be versioned rather than hard-coded as universal OT policy. [NIST SP 800-52 Rev. 2](https://csrc.nist.gov/pubs/sp/800/52/r2/final)
- NIST SP 800-92 describes log-management infrastructure and processes at a high level and expressly frames the publication as guidance rather than a step-by-step implementation manual. [NIST SP 800-92 — Guide to Computer Security Log Management](https://csrc.nist.gov/pubs/sp/800/92/final)

### Recommended offline lab design

The safest educational architecture is a closed, synthetic environment with no route to a plant, a corporate network, or the public internet:

| Lab area | Teach or simulate | Guardrail |
|---|---|---|
| Asset inventory | Classify synthetic sensors, actuators, PLCs, HMIs, historians, engineering workstations, safety-related functions, and support services | Use invented identities, addresses, firmware labels, and credentials; do not import a plant inventory by default |
| Zones and conduits | Draw trust boundaries, identify allowed flows, compare an open flat model with a segmented model, and reason about availability and safety impact | Use diagrams and policy evaluation; do not configure a live firewall, route, VLAN, or remote-access gateway |
| Least privilege | Model operator, maintenance, engineer, instructor, and observer roles; compare read-only, acknowledge, configuration, and control permissions | No real credential capture, password spraying, or permission changes outside the simulator |
| Secure defaults | Find anonymous access, shared accounts, unnecessary services, broad permissions, unsafe logging defaults, and unreviewed remote access in a synthetic configuration | Provide remediation as a model diff or checklist, not a live deployment script |
| Authentication and authorization | Simulate successful and failed login, step-up authentication, session expiration, role mismatch, and separation of authentication from authorization | Use disposable lab accounts and deterministic test data; no external identity provider or production account |
| TLS and certificates | Create a lab CA, inspect certificate subject/SAN, validity, trust chain, rotation, expired certificate, hostname mismatch, and protocol-policy mismatch | All keys and certificates are generated inside the lab; label them non-production and prevent export to live connectors |
| Logging and audit | Generate synthetic login, configuration, alarm, certificate, backup, and policy events; build a timeline; detect missing, duplicated, delayed, or clock-skewed events | Keep logs synthetic, redact secrets, and teach that a log is evidence of an event—not proof that a physical action occurred |
| Change control and recovery | Compare approved and unapproved configuration versions, review a change record, validate a synthetic backup, and recover a simulated asset | Never touch a real controller backup or make a production restore decision |
| Defensive traffic analysis | Inspect pre-generated synthetic flows or a sanitized, non-sensitive teaching trace for allowed/denied paths, rate anomalies, and asset identity | No live discovery, packet injection, exploit payloads, flooding, or traffic generation toward a real endpoint |
| Incident tabletop | Practice triage, notification, containment choices, recovery, evidence preservation, and lessons learned | Keep scenarios abstract and defensive; do not disclose or execute attack playbooks |

### Safe simulator faults

Safe faults are faults in the **model**, not actions against a target. Examples include:

- A synthetic sensor becomes stale, implausible, noisy, stuck, out of range, or inconsistent with a redundant reading.
- A synthetic controller heartbeat disappears, a watchdog expires, a simulated scan cycle overruns, or a communication path becomes unavailable.
- A simulated network policy denies an expected flow, permits an overly broad flow, or places an asset in the wrong zone.
- A lab certificate expires, has a hostname mismatch, chains to an untrusted lab CA, or is not rotated according to the exercise policy.
- A user attempts an action outside their role; an account is disabled after a bounded number of simulated failures; a session expires; or an authorization check rejects an otherwise authenticated user.
- An audit event is missing, duplicated, delayed, unsigned, or timestamped with a known clock offset.
- A synthetic configuration has an unsafe default, shared account, unnecessary service, outdated protocol policy, unreviewed change, or failed recovery point.
- A modeled interlock or guard transition is inconsistent with the expected state machine, while the simulator only reports the modeled consequence and never controls a real safety circuit.

### Explicitly prohibited cybersecurity labs

OmniProbe should not include live-target attack surfaces or instructions for:

- Scanning, fingerprinting, enumerating, or probing an industrial network not created and isolated for the exercise.
- Exploiting PLC, HMI, SCADA, engineering-workstation, safety-controller, or protocol vulnerabilities; fuzzing vendor protocols; crafting malicious control messages; or forcing process values.
- Password guessing, credential spraying, token theft, phishing, persistence, malware, ransomware, denial-of-service, packet flooding, or destructive recovery tests.
- Bypassing authentication, authorization, interlocks, safety logic, network controls, or vendor security features.
- Downloading real controller programs, firmware, keys, certificates, configuration files, packet captures, or site diagrams into an educational lab unless they have been sanitized and explicitly authorized for a closed exercise.

### Inferences

- “Offline” should be an enforced system property, not a learner promise. The lab should start without network egress, use synthetic assets, and expose only simulator APIs. If a future connector is added, it should be a separate, disabled-by-default capability with explicit authorization and qualified review.
- The best defensive lesson is consequence-oriented: learners should see how an inventory gap, excessive privilege, missing log, certificate error, or segmentation decision affects safety, availability, integrity, and recovery. They do not need exploit mechanics to understand the control objective.
- Secure defaults should apply to the product itself: no universal admin password, no anonymous control endpoint, no hidden network route, no implicit trust from being on localhost, no export of live-looking credentials, and no default permission to change simulated process state. This applies CISA’s secure-by-design principle to the educational product.
- Network segmentation is a boundary-control concept, not a promise that a subnet is trusted. Teach zones and conduits together with per-session authentication, authorization, allowlisted flows, monitoring, and recovery; this aligns the ISA/IEC 62443 shared-responsibility model with NIST’s no-implicit-trust principle.

### Gaps

- The cited guidance does not define a single universally correct OT network architecture. Segmentation, remote access, protocol protection, and availability controls depend on the process, legacy devices, safety constraints, maintenance model, and threat model.
- Authentication, TLS, and logging profiles that are suitable for an educational server are not automatically suitable for a PLC, safety controller, or time-critical process. Compatibility and safety impacts require vendor documentation and qualified OT engineering review.
- A CISA CPG or NIST CSF mapping can organize learning and assessment language, but it is not a certification or proof of compliance. OmniProbe should describe mappings as “educational reference” or “candidate control mapping.”

## How should commissioning reports and beginner terminology distinguish education from approval?

### Takeaway

Every report should separate what OmniProbe observed in a synthetic model from what a qualified person may conclude about a field system. The safest report vocabulary is “simulated finding,” “observed behavior,” “evidence from this model,” and “review required”; the report must not silently convert those into “safe,” “compliant,” “validated,” “certified,” or “approved.”

### Cited Findings

- ISO 12100’s abstract explicitly includes documenting and verifying the risk-assessment and risk-reduction process. That supports a report structure that records scope, assumptions, evidence, and verification status rather than only a result label. [ISO 12100:2010](https://www.iso.org/standard/51528.html)
- OSHA 1910.147 requires machine-specific energy-control procedures to describe scope, purpose, authorization, shutdown/isolation steps, lock/tag placement and removal, and verification; it also requires training, periodic inspection, and certification of relevant activities. [OSHA 1910.147](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147)
- ISA describes 62443 as a shared-responsibility lifecycle involving asset owners, suppliers, integrators, and service suppliers, with risk assessment and stakeholder-specific requirements. A workbench report therefore cannot represent the approval of all responsible parties. [ISA/IEC 62443 series](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards)
- CISA describes its CPGs as voluntary baseline practices and a benchmark for measuring and improving maturity. That supports using the language “mapped learning objective” or “assessment prompt,” not “certified control.” [CISA CPGs](https://www.cisa.gov/cross-sector-cybersecurity-performance-goals)
- NIST SP 800-92 treats log management as an organizational process and infrastructure topic rather than a one-click implementation. A report should preserve the event source, timestamp assumptions, and evidence limitations rather than claim that a generated timeline is complete. [NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final)

### Required commissioning-report distinction

Use a two-layer report:

**Layer A — OmniProbe educational record**

- `Exercise status`: Simulation-only / synthetic assets / no field connection.
- `Learning objective`: for example, identify stale telemetry, reason about a zone boundary, or distinguish authentication from authorization.
- `Observed simulated finding`: a neutral description of what the model did.
- `Evidence`: scenario ID, model version, synthetic asset ID, dataset or trace ID, timestamp, inputs, expected behavior, actual modeled behavior, and reproducibility steps within the sandbox.
- `Confidence and limits`: what was covered, what was not modeled, assumptions, and whether the result depends on a particular simulator implementation.
- `Control or standard reference`: educational mapping to ISO 12100 concepts, IEC 61508 vocabulary, ISA/IEC 62443 concepts, NIST CSF/800-82 concepts, CISA CPGs, or OSHA topics. Label it as a reference, not a conformity conclusion.
- `Learner action`: explanation, remediation hypothesis, or follow-up question; never an instruction to change a live control system.

**Layer B — Field/commissioning disposition, completed outside OmniProbe**

- `System of record`: actual machine, process, site, jurisdiction, equipment revision, and responsible owner.
- `Authorization`: who authorized the test, under which site procedure, work permit, maintenance window, and energy-control process.
- `Qualified review`: responsible safety/controls/OT cybersecurity reviewers and their roles.
- `Field evidence`: machine-specific drawings, hazard analysis, guard/interlock tests, energy-isolation verification, configuration baselines, approved network diagrams, and authorized logs.
- `Decision`: accepted, rejected, deferred, or requires corrective action—made by the responsible authority, not by OmniProbe.
- `Approval boundary`: explicit statement that OmniProbe’s educational record is neither a safety approval nor a cybersecurity authorization.

Suggested fixed disclaimer for every exported report:

> This document records observations from an OmniProbe educational simulation. It is not a machine-specific risk assessment, lockout/tagout procedure, safety validation, SIL/PL determination, cybersecurity authorization, conformity assessment, commissioning certificate, or approval to operate, service, modify, or connect to equipment. Field conclusions require the responsible owner and qualified reviewers using applicable laws, site procedures, equipment documentation, and current standards.

### Beginner terminology to teach

| Term | Beginner-safe definition and boundary |
|---|---|
| **OT / operational technology** | Technology that monitors or changes a physical environment. Teach that its timing, reliability, availability, and safety consequences differ from ordinary office IT. [NIST SP 800-82](https://csrc.nist.gov/pubs/sp/800/82/r3/final) |
| **ICS / industrial control system** | A family of control systems used to monitor or control industrial processes. It is an example of OT, not a synonym for every OT environment. [CISA ICS page](https://www.cisa.gov/topics/industrial-control-systems) |
| **IACS** | Industrial automation and control systems; the term used in the ISA/IEC 62443 family. Teach it as a system and lifecycle responsibility spanning people, processes, products, integration, and operation. [ISA/IEC 62443](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards) |
| **PLC, RTU, DCS, SCADA, HMI** | Controller, remote terminal unit, distributed control system, supervisory control and data acquisition, and human-machine interface. Teach their roles and data paths without implying that a screen or controller state proves physical safety. [NIST SP 800-82](https://csrc.nist.gov/pubs/sp/800/82/r3/final) |
| **Sensor / actuator** | A sensor measures a process; an actuator changes it. A diagnostic value is an observation, not proof that a sensor is calibrated or that an actuator is physically de-energized. This is a product boundary inferred from OT’s physical interaction. [NIST SP 800-82](https://csrc.nist.gov/pubs/sp/800/82/r3/final) |
| **Hazard / risk / consequence** | A hazard is a potential source of harm; risk concerns the possibility and severity of harm under conditions; consequence is what happens if the event occurs. Teach learners not to treat a software alarm as a complete risk assessment. [ISO 12100](https://www.iso.org/standard/51528.html) |
| **Safety / cybersecurity** | Safety concerns preventing harm from hazardous conditions; cybersecurity protects systems, assets, and operations from threats and failures. They overlap in OT but neither automatically proves the other. [NIST safety glossary](https://csrc.nist.gov/glossary/term/safety), [NIST SP 800-82](https://csrc.nist.gov/pubs/sp/800/82/r3/final) |
| **Safe state** | The defined condition that prevents or limits harm for a particular process and hazard. It is not always equivalent to “power off,” and OmniProbe must not choose it for a real machine. [ISO 12100](https://www.iso.org/standard/51528.html), [IEC 61508-5](https://webstore.iec.ch/en/publication/5519) |
| **Interlock / guard / E-stop** | A guard physically separates people from hazards; an interlock detects or controls a condition associated with access or operation; an E-stop is an emergency-stop function. Model them as distinct concepts and do not claim a simulator tests their real performance. [OSHA 1910.212](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212), [OSHA 1910.147](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147) |
| **LOTO / hazardous-energy control** | A physical procedure to isolate, lock/tag, dissipate or restrain stored energy, and verify isolation before covered servicing. A software login, checkbox, or stop command is not an energy-isolating device. [OSHA 1910.147](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147) |
| **Functional safety** | The part of overall safety that depends on a system or safety-related function responding correctly to inputs and failures. IEC 61508 provides a basic functional-safety framework and vocabulary; an educational exercise is not a SIL assessment. [IEC 61508-4](https://webstore.iec.ch/en/publication/5518), [IEC 61508-5](https://webstore.iec.ch/en/publication/5519) |
| **SIL / PL** | Safety integrity level and performance level are engineering concepts tied to specific safety functions and standards. Teach the terms and the need for application-specific assessment; do not calculate or award them in the general workbench. [IEC 61508-5](https://webstore.iec.ch/en/publication/5519), [ISO 12100](https://www.iso.org/standard/51528.html) |
| **Zone / conduit** | A zone groups assets with a related security or operational need; a conduit is a controlled communication path between zones. Teach them as risk and flow-modeling concepts, not as permission to trust everything inside one network. [ISA/IEC 62443](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards), [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) |
| **Authentication / authorization / accounting** | Authentication establishes who or what is interacting; authorization determines what it may do; accounting/audit records relevant activity. NIST treats authentication and authorization as distinct, and least privilege limits authorization to what is necessary. [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final), [NIST least privilege glossary](https://csrc.nist.gov/glossary/term/least_privilege) |
| **Least privilege** | Give each user or process only the minimum resources and permissions needed for the assigned task. This should be a default design principle in both the simulator and its lab accounts. [NIST least privilege glossary](https://csrc.nist.gov/glossary/term/least_privilege) |
| **Secure default / deny by default** | The product starts with protective settings, rejects unapproved actions, and requires an explicit, reviewable change to relax a control. CISA describes secure-by-design products as secure by default and highlights MFA and logging as capabilities that should be available. [CISA Secure by Design](https://www.cisa.gov/securebydesign) |
| **TLS / certificate / CA / trust chain** | TLS protects a connection; a certificate binds an identity to a public key for a trust decision; a CA issues or signs certificates; a trust chain connects the certificate to a trusted authority. Teach certificate validation and rotation in a lab-only PKI. [NIST SP 800-52 Rev. 2](https://csrc.nist.gov/pubs/sp/800/52/r2/final) |
| **Event / log / audit trail** | An event is something that happened in the model or system; a log records event data; an audit trail is an organized record used for review. A generated log is evidence of recorded activity, not proof that a physical action happened. [NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final) |
| **Finding / vulnerability / hazard / incident** | A finding is an observed condition; a vulnerability is a weakness that may be exploitable; a hazard is a potential source of harm; an incident is an event requiring response. Keep the terms separate in reports so a simulated finding is not automatically called a field vulnerability or safety hazard. [NIST SP 800-82](https://csrc.nist.gov/pubs/sp/800/82/r3/final), [ISO 12100](https://www.iso.org/standard/51528.html) |
| **Verification / validation / commissioning** | Verification asks whether an output meets specified requirements; validation asks whether the resulting system is fit for its intended use; commissioning is an authorized field process of bringing equipment into service. OmniProbe can teach the distinction but cannot perform the field approval. [ISO 12100](https://www.iso.org/standard/51528.html), [OSHA 1910.147](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147) |

### Inferences

- Report status values should describe evidence, not grant authority: `Observed in simulation`, `Model assumption`, `Not modeled`, `Not verified`, `Requires qualified review`, and `No field conclusion` are safer than `Pass` and `Fail` for safety or production cybersecurity.
- The only “pass” that OmniProbe should issue for a safety exercise is a learning-objective result such as “learner identified that a UI stop command is not physical energy isolation.” It should not issue a pass for the machine, process, safety function, or network.
- A commissioning report should have a hard visual split between the educational record and any field disposition. The field disposition should be empty, external, or clearly marked “completed outside OmniProbe by responsible authority.”
- Beginner content should teach safety, security, and reliability as coupled but distinct concerns. A cyber control can change availability or timing; a safety control can constrain architecture; neither should be optimized in isolation from the physical process.

### Gaps

- This note does not define the exact warning text, retention period, privacy policy, or accessibility requirements for a deployed educational product. Those should be reviewed against the deployment jurisdiction, learner population, institutional policy, and any collected telemetry.
- No public summary can replace the site’s machine-specific commissioning procedure, energy-control program, equipment manuals, approved network architecture, or emergency plan.
- The terminology is intentionally beginner-oriented. Advanced users need the current licensed editions of the relevant standards, sector-specific requirements, vendor safety manuals, and qualified instruction before using the concepts in field work.

### Source index

- [NIST SP 800-82 Rev. 3 — Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final)
- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)
- [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [NIST SP 800-63B-4 — Authentication and Authenticator Management](https://csrc.nist.gov/pubs/sp/800/63/b/4/final)
- [NIST SP 800-52 Rev. 2 — TLS](https://csrc.nist.gov/pubs/sp/800/52/r2/final)
- [NIST SP 800-92 — Log Management](https://csrc.nist.gov/pubs/sp/800/92/final)
- [NIST glossary — least privilege](https://csrc.nist.gov/glossary/term/least_privilege)
- [NIST glossary — safety](https://csrc.nist.gov/glossary/term/safety)
- [CISA — Industrial Control Systems](https://www.cisa.gov/topics/industrial-control-systems)
- [CISA — Cross-Sector Cybersecurity Performance Goals](https://www.cisa.gov/cross-sector-cybersecurity-performance-goals)
- [CISA — Secure by Design](https://www.cisa.gov/securebydesign)
- [ISA/IEC 62443 series](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards)
- [ISO 12100:2010 — Safety of machinery](https://www.iso.org/standard/51528.html)
- [IEC 61508-4:2010 — Definitions and abbreviations](https://webstore.iec.ch/en/publication/5518)
- [IEC 61508-5:2010 — Methods for determining safety integrity levels](https://webstore.iec.ch/en/publication/5519)
- [OSHA 29 CFR 1910.147 — Control of hazardous energy](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147)
- [OSHA 29 CFR 1910.212 — Machine guarding](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212)
