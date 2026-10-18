# OmniProbe

OmniProbe is a deterministic industrial and edge protocol diagnostic suite for the Systems, Infrastructure & Cybersecurity track. It combines protocol frame inspection, 32-bit register decoding, a virtual fault-injectable bus, waveform analysis, commissioning readiness audits, industrial calculators, recipe lineage, and adaptive learning in one browser workspace.

## Requirements

- Node.js `20.18.0` (the project also declares `>=20.0.0` in `package.json`)
- npm 10+
- Docker (optional)

## Setup

```bash
git clone <repository-url>
cd Omniprobe
nvm use
npm ci
cp .env.example .env
```

The `.env.example` values are safe deterministic simulator defaults. No credentials or hardware connection secrets are required.

## Run

Start the Vite development server:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

Build and serve the production bundle locally:

```bash
npm run build
npm run preview
```

The production preview listens on `http://localhost:4173`.

## Free live demo

This repository includes a GitHub Pages workflow. After pushing `main`, enable **Settings → Pages → Source → GitHub Actions** if GitHub asks for a Pages source. The free static demo URL is:

```text
https://rajesh-baeyal.github.io/omniprobe/
```

GitHub Pages runs the same deterministic tests and production build in Ubuntu Actions before deploying `dist/`.

## Docker

The production image uses a multi-stage `node:20.18.0-alpine` build. From the repository root:

```bash
docker build -t omniprobe .
docker run --rm -p 4173:4173 omniprobe
```

Then open `http://localhost:4173`. The container runs `vite preview --host 0.0.0.0 --port 4173`.

## Test

Run the single non-interactive deterministic test command:

```bash
npm test
```

The test suite covers MODBUS CRC-16, all four register endian modes, RS-485 wire-time and saturation math, and inclusive register overlap detection.

## Demo video

The repository includes a lightweight product-tour video at `demo/omniprobe-demo.mp4` and its shot list at `demo/README.md`. It is generated locally from deterministic title cards so it can be rebuilt without credentials or paid services.

## Diagnostic modules

- **Command Center:** split-view entry point with live telemetry, waveform scope, packet stream, and chaos controls.
- **Frame Studio:** editable RTU/TCP frames, MBAP decoding, CRC verification/corruption, byte annotations, and RS-485 timing.
- **Register Matrix:** `ArrayBuffer`/`DataView` decoding to `FLOAT32`, `INT32`, `UINT32`, and `Q16.16` with safety bitmask toggles.
- **Virtual Bus:** deterministic polling with CRC, timeout, EMI, endian, and interlock fault injection.
- **Logic Scope:** 60 FPS canvas analog/digital waveform renderer, edge triggers, and dual delta-t cursors.
- **Commissioning Doctor:** twelve deterministic readiness rules, auto-remediation, and Markdown report export.
- **Learning Studio:** low-stakes onboarding, domain-specific terminology, adaptive lessons, safety gates, hints, evidence capture, and safe artifacts across PLC, robotics, motion, serial, networking, vision, recipes, safety, and OT cybersecurity.
- **Calculator Lab:** unit-aware educational estimates for coordinate transforms, robot reach, motion profiles, path guidance, conveyor timing, PLC scan timing, serial/TCP/UDP/CAN timing, dispensing, pneumatics, pump/thermal/power estimates, vision calibration, and tolerance budgets.
- **Recipe Manager:** immutable simulated recipe revisions, deterministic content hashes, semantic/numeric diffs, calibration references, review gates, and rollback lineage.
- **Trace Replay:** canonical trace records with virtual-time pause/step/seek/branch controls and export-time secret redaction.
- **Terminology:** contextual industrial vocabulary with plain-language definitions, aliases, examples, and safety notes.
- **Safety & Cyber:** defensive offline exercises for evidence boundaries, least privilege, audit trails, and OT concepts; no live actuation or exploit tooling.

## Capability and safety model

Every workbench surface shows its execution mode and authority:

```text
SIMULATED · READ ONLY · SOURCE: DETERMINISTIC FIXTURE · CONTRACT: workbench.v1
```

The current public GitHub Pages experience is offline-first. It does not require a backend, broker, device permission, or paid service. Browser-live adapters such as Web Serial, browser cameras, and MQTT over WebSocket are future permissioned adapters. Raw TCP/UDP, CAN, OPC UA `opc.tcp`, SECS/HSMS, and industrial camera SDKs require a separately governed native bridge and are intentionally not enabled by default.

Calculator outputs are educational estimates with units, assumptions, model versions, validation status, and provenance. They are not machine-specific engineering approvals, safety calculations, commissioning certificates, or permission to run equipment.

## Learning flow

Learning Studio asks about role, goal, domains, confidence, and “not sure” areas. It then selects a deterministic bounded practice lesson from prerequisite and safety-gated fixtures. Lessons move from worked example to guided action, fading support, independent practice, troubleshooting variation, terminology moments, evidence capture, and spaced review. The result is evidence for this learning context, not a credential or job-readiness verdict.

## Recipes and reproducibility

Recipes are controlled context rather than mutable bags of numbers. Each simulated revision carries product, machine, station, parameters, provenance, calibration references, parent revision, status, transition history, and content hash. Approved revisions remain immutable; runs can reference the exact revision and calibration lineage used by a fixture.

## Configuration

Copy `.env.example` to `.env` and adjust only the simulator defaults when needed:

```dotenv
VITE_DEFAULT_PRESET=semiconductor_loadlock
VITE_MAX_RING_BUFFER_SAMPLES=1000
VITE_SIM_TICK_HZ=50
```

These variables are build-time Vite values. They do not contain secrets and are not a substitute for a hardware transport configuration.
