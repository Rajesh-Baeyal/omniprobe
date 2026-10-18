# OmniProbe

OmniProbe is a deterministic industrial and edge protocol diagnostic suite for the Systems, Infrastructure & Cybersecurity track. It combines protocol frame inspection, 32-bit register decoding, a virtual fault-injectable bus, waveform analysis, and commissioning readiness audits in one browser workspace.

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

## Configuration

Copy `.env.example` to `.env` and adjust only the simulator defaults when needed:

```dotenv
VITE_DEFAULT_PRESET=semiconductor_loadlock
VITE_MAX_RING_BUFFER_SAMPLES=1000
VITE_SIM_TICK_HZ=50
```

These variables are build-time Vite values. They do not contain secrets and are not a substitute for a hardware transport configuration.
