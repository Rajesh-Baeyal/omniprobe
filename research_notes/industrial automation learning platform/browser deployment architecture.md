# Browser-first Industrial Automation Workbench: Deployment Architecture Research

## 1. Browser capabilities and free deployment constraints

### Takeaway

A Vite/React workbench can be a fully static, browser-first application: simulation, replay, protocol parsing, calculators, Web Workers, WebAssembly modules, and compatible camera/serial/BLE features can run from a static HTTPS host with no application backend. GitHub Pages is the best default for a public, no-paid-service demo because Vite documents a GitHub Actions deployment path, GitHub documents free Actions for public repositories, and Pages does not provide server-side application runtimes. Native industrial protocols, vendor SDKs, arbitrary TCP/UDP, and unsupported device APIs should be treated as optional adapter capabilities supplied by a local bridge.

### Cited Findings

- Vite builds the application into `dist`, says that directory can be deployed to a preferred static platform, and documents GitHub Pages deployment through GitHub Actions with a repository-specific `base` path. [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy)
- GitHub Pages can publish static files and can use a custom GitHub Actions workflow for a non-Jekyll build; GitHub Pages does not support server-side languages such as PHP, Ruby, or Python. [GitHub: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- On GitHub Free, a repository used for Pages must be public, and GitHub states that GitHub Actions is free for public repositories. This supports a zero-paid-backend deployment, but still requires a GitHub account/repository and public source or a separately built public artifact. [GitHub: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- GitHub Pages has a recommended source-repository limit of 1 GB, a 1 GB published-site limit, a 10-minute deployment timeout, and soft limits of 100 GB/month bandwidth and 10 builds/hour. [GitHub: GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- Web Serial provides website access to serial devices, including USB and Bluetooth devices that expose a serial port, but MDN marks it Limited availability and requires a secure context. MDN also documents a `serial` Permissions Policy directive and Dedicated Worker exposure. [MDN: Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- `Serial.requestPort()` presents a user device-selection dialog, must be called through transient user activation, and can fail when the `serial` Permissions Policy blocks access or the user denies the prompt. [MDN: Serial.requestPort()](https://developer.mozilla.org/en-US/docs/Web/API/Serial/requestPort)
- Web Bluetooth targets Bluetooth Low Energy peripherals through GATT, is marked Limited availability and Experimental by MDN, requires a secure context, is not exposed in Web Workers, and requires explicit user permission through `Bluetooth.requestDevice()`. [MDN: Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) [MDN: Bluetooth.requestDevice()](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice)
- The WebSocket API provides a two-way interactive session between the browser and a server and is available in Web Workers. MDN describes the stable `WebSocket` interface as broadly supported but warns that it does not provide backpressure; an industrial telemetry client therefore needs bounded queues, rate limits, and drop/coalesce policy at the application layer. [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- MQTT is specified as a client/server publish-subscribe transport whose network connection is an ordered, lossless, bidirectional byte stream; the OASIS specification includes a section for WebSocket as a network transport. [OASIS: MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html)
- MQTT.js is a JavaScript MQTT client for Node.js and the browser, and its documented URL protocols include `ws` and `wss`; it also documents WebSocket-only hooks for reconnect-time URL transformation and custom WebSocket creation. [MQTT.js](https://github.com/mqttjs/MQTT.js#browser)
- WebRTC `RTCDataChannel` supports arbitrary bidirectional data and encrypts data with DTLS. A peer connection still needs signaling: MDN describes manual negotiation as requiring an out-of-band web server or another signaling mechanism. [MDN: Using WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)
- `getUserMedia()` is widely available, requires a secure context, always requires user permission for camera/microphone input, and can be limited by the `camera` and `microphone` Permissions Policy directives. [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- Web Workers run script work off the main UI thread, communicate using messages, cannot directly manipulate the DOM, and can make network requests. [MDN: Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- WebAssembly can be loaded and run in the browser and is useful for compiling existing C/C++ or Rust modules for web use. [MDN: WebAssembly guides](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides)
- A secure context is normally delivered over HTTPS or from a loopback address such as `http://localhost`; workers inherit secure-context status from their owner context. [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts)
- A secure page should not depend on insecure network resources. MDN classifies `fetch()` and other active requests as blockable mixed content, while noting that loopback resources such as `http://127.0.0.1/` and `http://localhost/` are treated as secure local origins. [MDN: Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content)
- CORS is an HTTP-header mechanism by which a server authorizes browser scripts from other origins; cross-origin requests can trigger an `OPTIONS` preflight, and the server must return compatible allow-origin, method, and header responses. [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- Permissions Policy can restrict sensitive features such as camera, microphone, serial, and Bluetooth at the document or embedded-frame boundary. A policy block can prevent the normal user permission prompt from appearing. [MDN: Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)
- Cloudflare Pages documents static deployment by Git integration or direct upload, says Pages is available on all plans, and documents a 500-deploys-per-month limit on the Free plan. [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- Netlify documents both Git-based deployment and drag-and-drop publishing of a built folder, but the documented drag-and-drop flow requires being logged in to a Netlify account to manage the site. [Netlify: Choose your path](https://docs.netlify.com/start/overview/)

### Inferences

- **GitHub Pages capability matrix:** A public GitHub Pages site can host the complete static shell, deterministic fixtures, worker bundles, WebAssembly binaries, and client-side UI at no paid backend cost. It cannot host a PLC socket server, MQTT broker, OPC UA server, device driver, native camera SDK, or bridge process because Pages is static and has no server-side runtime. This is an architectural consequence of the Vite static build and GitHub's Pages limitations. [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy) [GitHub: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- **Browser-direct capability:** Web Serial is suitable for supported USB/serial devices and serial-emulating Bluetooth devices; Web Bluetooth is suitable for BLE GATT devices; `getUserMedia()` is suitable for cameras exposed as browser media inputs. Each requires feature detection, a user action, and an explicit permission status in the UI. [MDN: Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) [MDN: Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- **Bridge-required capability:** For a PLC or instrument that exposes only Modbus TCP/RTU, OPC UA TCP, raw TCP/UDP, vendor USB APIs, vendor camera SDKs, or operating-system device drivers, plan a bridge unless the device or a gateway independently exposes a browser-compatible HTTPS/WSS endpoint. The reviewed browser WebSocket API is explicitly a browser-to-server channel, so it is a good bridge boundary rather than a raw industrial socket API. [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- **MQTT choice:** Direct browser MQTT is viable only when the broker exposes a WebSocket listener, normally `wss://` from an HTTPS deployment, and has an authentication/authorization model safe for browser clients. Otherwise, terminate MQTT in the local bridge and expose the narrow workbench contract over loopback WebSocket. [OASIS: MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html) [MQTT.js](https://github.com/mqttjs/MQTT.js#browser)
- **WebRTC choice:** WebRTC is technically secure and peer-to-peer, but it adds signaling, session negotiation, message-size and buffering considerations, and no obvious benefit for a single browser talking to a local native bridge. Defer it unless the product specifically needs browser-to-browser or browser-to-remote-edge peer transport. [MDN: Using WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)
- **Realistic no-credential deployment options:** The strongest no-paid-service options are local static serving for development, GitHub Pages for a public repository, and Cloudflare Pages for a user who accepts creating a free hosting account. Netlify is similarly static-friendly but its documented management path requires login. None of these hosts supplies industrial connectivity by itself. [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy) [GitHub: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) [Cloudflare Pages](https://developers.cloudflare.com/pages/) [Netlify: Choose your path](https://docs.netlify.com/start/overview/)

### Gaps

- Web Serial and Web Bluetooth browser support varies and both are marked Limited availability by MDN; a production browser matrix should be pinned to the target Chromium/Edge/Firefox/Safari versions and enterprise policies. [MDN: Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) [MDN: Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- No specific PLC, protocol profile, camera model, browser fleet, telemetry rate, or safety classification was provided, so the bridge requirement is a capability-planning recommendation rather than a validated device compatibility result.
- Free-plan limits and account requirements can change. The cited sources verify the current documented deployment paths, not a long-term pricing guarantee for every static host.

## 2. Local bridge, security model, and capability UX

### Takeaway

Make the bridge an optional, local, least-privilege adapter process. The browser should never send arbitrary bytes to arbitrary destinations or receive long-lived device credentials. Instead, the bridge should advertise a versioned allowlist of named capabilities, expose normalized reads/events, require explicit approval before writes, and bind only to loopback. The UI should show the execution mode, transport, device identity, permission state, and write authority separately so that a simulated or replayed result can never look like a live machine result.

### Cited Findings

- WebSocket has an explicit browser-to-server handshake and supports subprotocol negotiation through `Sec-WebSocket-Protocol`, which gives a local bridge a natural versioned transport boundary. [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- CORS is enforced for cross-origin HTTP requests by response headers and may involve preflight requests. A bridge that exposes HTTP or REST endpoints to a hosted static app must make its origin policy explicit; a bridge that uses only WebSocket still needs its own server-side origin and authorization checks. [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- Loopback addresses are treated as potentially trustworthy/secure contexts by the secure-context and mixed-content guidance, but the browser still applies normal origin, permission, and enterprise policy rules. [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts) [MDN: Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content)
- Browser device APIs require user-visible permission flows: Serial requires a transiently activated `requestPort()` call, Bluetooth requires an explicit device request, and camera access requires `getUserMedia()` permission. [MDN: Serial.requestPort()](https://developer.mozilla.org/en-US/docs/Web/API/Serial/requestPort) [MDN: Bluetooth.requestDevice()](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice) [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- The MQTT specification says implementations should offer authentication, authorization, and secure communication options, and strongly advises using those capabilities for critical infrastructure or sensitive information. [OASIS: MQTT Version 5.0, Security](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html)

### Proposed bridge contract

This is a proposed application contract, not an existing industry standard. Use JSON control messages over a versioned WebSocket subprotocol such as `omniprobe.bridge.v1`; use bounded binary frames only when a named diagnostic capability explicitly needs raw bytes.

1. **Handshake and capability discovery**

   ```json
   {
     "v": 1,
     "type": "hello",
     "requestId": "req-001",
     "client": { "appVersion": "0.1.0", "origin": "https://example.github.io" },
     "requestedCapabilities": ["telemetry.read"],
     "nonce": "ephemeral-client-nonce"
   }
   ```

   The bridge responds with its identity, contract version, supported capabilities, device descriptors, limits, and whether a user approval step is required:

   ```json
   {
     "v": 1,
     "type": "hello.result",
     "requestId": "req-001",
     "bridge": { "id": "local-01", "version": "1.0.0", "contract": "1" },
     "capabilities": [
       {
         "id": "telemetry.read",
         "access": "read",
         "transport": "modbus-tcp",
         "targets": ["line-a.plc"],
         "maxRateHz": 20
       }
     ],
     "session": { "id": "session-01", "expiresAt": "2026-10-19T12:00:00Z" },
     "requiresUserApproval": true
   }
   ```

2. **Named operations rather than arbitrary transport access**

   Use `read`, `subscribe`, `command`, and `disconnect` messages, each with a `requestId`, `capability`, `target`, bounded arguments, deadline, and optional idempotency key. Prefer `modbus.readHoldingRegisters` or `camera.snapshot` over a generic `sendBytes` or `connectToHost` operation. If raw frames are needed for a learning diagnostic, expose them as a separately granted, read-only capability with maximum byte length and rate limits.

3. **Normalized event and result shape**

   ```json
   {
     "v": 1,
     "type": "event",
     "eventId": "evt-1042",
     "sequence": 1042,
     "source": "line-a.plc",
     "timestamp": "2026-10-19T11:59:58.123Z",
     "quality": "good",
     "values": { "temperature_c": 22.5, "interlock_ok": true },
     "raw": { "encoding": "hex", "data": "01030200e1" }
   }
   ```

   Every command should produce an explicit `result` or structured `error` with a stable code such as `CAPABILITY_DENIED`, `DEVICE_OFFLINE`, `TIMEOUT`, `INVALID_ARGUMENT`, or `WRITE_NOT_ARMED`. Keep bridge timestamps and sequence numbers for diagnostics, but keep deterministic replay driven by fixture timestamps rather than wall-clock time.

4. **Connection and lifecycle rules**

   - Bind to `127.0.0.1`/`::1` only by default; do not listen on all network interfaces for the first version.
   - Reject unexpected origins, require the negotiated subprotocol, cap message size and subscription rate, expire idle sessions, and close on protocol version mismatch.
   - Generate a one-time pairing code or approval prompt per session. Use it to issue an ephemeral session token; never embed a device password, broker password, or permanent bridge token in the static bundle.
   - Keep device credentials and native-driver configuration inside the bridge's OS-protected configuration. Return capability metadata, not credentials.
   - Default every capability to read-only. Require a separate user action to arm writes, show the target and operation, and fail closed on disconnect, timeout, stale sequence, or expired session.
   - Record a local audit event for each write request, including user-visible target, operation, arguments, result, and failure reason.

### Capability labels and UX state model

Use three orthogonal fields in the UI and logs:

| Field | Values | Meaning |
|---|---|---|
| `executionMode` | `SIMULATED`, `REPLAY`, `LIVE` | Where the displayed values come from. |
| `transport` | `simulator`, `fixture`, `serial`, `bluetooth-gatt`, `camera`, `websocket`, `mqtt-websocket`, `bridge` | How data moves, if it moves. |
| `authority` | `READ ONLY`, `WRITE ARMED` | Whether the session can issue physical commands. |

The four prominent user-facing labels should be:

- **SIMULATED** — deterministic synthetic device model; no browser permission, network, camera, serial, Bluetooth, MQTT, or bridge access. Commands may change the simulated model, but never a physical target. Badge copy: `SIMULATED · NO DEVICE I/O`.
- **REPLAY** — fixture or captured log playback; no device writes and no physical side effects. Show fixture name/hash, source timestamp, current virtual time, playback speed, and whether the fixture contains raw frames. Badge copy: `REPLAY · NO DEVICE I/O`.
- **BROWSER LIVE** — the browser itself owns the selected device/media/network capability, such as Web Serial, Web Bluetooth, camera input, WebSocket, or MQTT over WebSocket. Show browser, device/endpoint, permission state, last-seen time, and the exact granted capability. Badge copy: `BROWSER LIVE · USER-PERMITTED`.
- **BRIDGE LIVE** — a named local bridge owns the native/industrial adapter. Show bridge ID/version, loopback endpoint, adapter, device target, connection age, negotiated contract version, and write authority. Badge copy: `BRIDGE LIVE · LOCAL ADAPTER`.

Never use `LIVE` alone. A green connection indicator must not imply that writes are armed; show `LIVE / READ ONLY` until the user performs the deliberate arm action. A failed permission prompt should produce `UNAVAILABLE · PERMISSION REQUIRED`, not silently fall back to a live-looking simulator.

### Inferences

- The bridge should be a **capability broker**, not a transparent tunnel. This follows from the browser's permission-gated APIs, the static host's inability to run server-side drivers, and MQTT's requirement for authentication/authorization in sensitive environments. [GitHub: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) [MDN: Serial.requestPort()](https://developer.mozilla.org/en-US/docs/Web/API/Serial/requestPort) [OASIS: MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html)
- Origin allowlisting is useful but should not be the only local authorization control: a public static page can be loaded by anyone, so bridge access should also require a user-visible pairing/approval step and a short-lived session. This is a security recommendation derived from the public-hosting model and loopback trust model. [GitHub: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts)
- A hosted HTTPS page should use `wss://` for a remote WebSocket or MQTT broker. For a local bridge, loopback `http://localhost`/`ws://localhost` can be a practical development path because loopback is treated as trustworthy, but browser, mixed-content, private-network, and enterprise policies must be tested; provide a native-served UI or locally trusted `wss://` fallback if required. [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts) [MDN: Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content)
- If the bridge exposes HTTP endpoints, configure CORS to an explicit allowlist and handle preflight. If it exposes only WebSocket, validate the WebSocket handshake origin and enforce the application-level pairing/session policy. [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

### Gaps

- The contract is intentionally product-specific; it needs review against the actual device drivers, safety process, and whether commands are merely educational or can move/energize machinery.
- Browser-specific behavior for hosted HTTPS pages connecting to loopback endpoints should be tested in the target browser/OS matrix. The cited secure-context documents establish the underlying trust model but do not guarantee every enterprise network policy or browser version.
- A production pairing/authentication scheme may need an organization-wide identity or certificate policy. This note recommends an ephemeral local session and does not select a long-term credential store.

## 3. Deterministic offline architecture and recommendation

### Takeaway

Keep the protocol core independent of every transport and browser permission. The same pure parser, encoder, calculator, simulator, and replay engine should run in unit tests, a Web Worker, the browser UI, and eventually the bridge. Treat real I/O as an adapter at the edge. This gives a useful workbench on GitHub Pages with zero backend dependency and makes live connectivity an explicitly selected, testable capability rather than a hidden runtime assumption.

### Cited Findings

- Web Workers are separate execution contexts that communicate through messages and can make network requests; they cannot directly manipulate the DOM. This supports placing high-rate simulation, replay clocks, parsing, and waveform transforms behind a message-based worker boundary. [MDN: Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- Web Serial is exposed to Dedicated Workers, while Web Bluetooth is not exposed in Web Workers. Browser adapter placement therefore cannot assume that every transport can be moved to the same worker. [MDN: Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) [MDN: Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- The stable WebSocket API does not provide backpressure, so a live telemetry adapter must impose its own queue bounds, sampling/coalescing policy, and overload behavior. [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- WebAssembly supports loading and running compiled modules in the browser and can reuse modules written in C/C++ or Rust. [MDN: WebAssembly guides](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides)
- MQTT defines QoS levels with different delivery semantics, including at-most-once, at-least-once, and exactly-once, so an MQTT adapter must preserve delivery metadata instead of presenting every message as an indistinguishable measurement. [OASIS: MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html)

### Recommended deterministic layering

1. **Pure domain core**

   - Protocol codecs: bytes-to-structured-frame and structured-frame-to-bytes.
   - Validation: length, bounds, CRC/checksum, register addressing, endian mode, scaling, units, and error codes.
   - Calculators: integer/fixed-point inputs where practical, explicit rounding mode, explicit saturation/overflow behavior, and a structured result containing value, unit, warnings, and intermediate diagnostics.
   - State models: immutable input plus explicit state transition; no direct access to `Date`, `Math.random()`, `navigator`, `window`, storage, Web Serial, Web Bluetooth, camera, MQTT, or WebSocket.

2. **Deterministic simulation and replay**

   - Inject a clock (`nowMs`) and a seeded pseudo-random source into simulation; never read wall-clock time or an ambient random source inside a calculation.
   - Store replay fixtures with canonical JSON or binary records, schema version, source metadata, event sequence, timestamps, and a content hash. Replay should operate on virtual time and expose pause, step, seek, and speed controls.
   - Reuse the same normalized event shape for simulator, replay, browser-live adapters, and bridge-live events. The UI should not need a separate rendering path that could accidentally hide the mode.

3. **Transport adapters**

   - `SerialAdapter`: browser Web Serial where available; otherwise bridge serial/USB. Keep port selection and permission prompts outside the pure codec.
   - `BluetoothGattAdapter`: browser Web Bluetooth for BLE GATT only; otherwise bridge BLE/native driver. Keep GATT service/characteristic discovery outside the domain core.
   - `WebSocketAdapter`/`MqttWebSocketAdapter`: browser-side WSS endpoint only when the remote server/broker is explicitly provisioned for browser clients; otherwise bridge-side MQTT/industrial protocol and local bridge WebSocket.
   - `CameraAdapter`: browser `getUserMedia()` for ordinary browser media inputs; bridge for vendor SDK, industrial GigE/USB camera control, trigger, exposure, or capture formats that are not browser media inputs.
   - `BridgeAdapter`: the only browser-facing adapter for native drivers and direct industrial networks. It consumes the versioned contract above and translates results into normalized domain events.

4. **Worker and optional WebAssembly boundary**

   - Put heavy replay, waveform generation, packet inspection, and bulk register calculations in a Dedicated Worker so the React UI remains responsive.
   - Use WebAssembly only after profiling demonstrates a meaningful hot path or when an existing, well-tested C/C++/Rust implementation is worth reusing. Ordinary CRC, register decoding, scaling, and commissioning rules should remain in the simplest pure language implementation that meets the workload.
   - Keep the Worker/Wasm interface typed and versioned; return serializable data and explicit errors rather than DOM objects or transport handles.

### Offline test strategy

- **Golden vectors:** fixed input/output pairs for every frame codec, CRC, byte order, register scale, unit conversion, and calculator edge case. Test both decode and encode, including malformed and truncated input.
- **Boundary and property tests:** zero/max values, signed boundaries, NaN/Infinity rejection policy, overflow/saturation, invalid lengths, duplicate sequence numbers, out-of-order replay, and bounded message sizes.
- **Adapter contract tests:** fake transports should emit deterministic chunks, timeouts, disconnects, duplicates, and partial frames. The codec must not know whether a chunk came from Serial, WebSocket, MQTT, or a bridge.
- **Replay regression:** every bug found in live or simulated operation should become a small fixture with a stable hash and expected normalized events. This gives offline reproduction without a device or service.
- **Browser integration smoke tests:** feature-detect `navigator.serial`, `navigator.bluetooth`, `navigator.mediaDevices`, `WebSocket`, and `crossOriginIsolated` as applicable; test permission-denied and API-absent paths without requiring hardware. Do not make the unit suite depend on user prompts, a broker, a camera, or a bridge.
- **Load/overload tests:** feed more telemetry than the UI can render and verify the documented queue policy. Because the WebSocket API has no backpressure, the expected behavior must be bounded memory, explicit drops/coalescing, and a visible quality indicator rather than unbounded buffering. [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

### Deployment recommendation

1. **Default public build:** GitHub Pages + GitHub Actions for the static Vite bundle, deterministic fixtures, worker files, and optional WebAssembly assets. Keep the repository public if using GitHub Free, keep all configuration non-secret, and set the Vite `base` for the repository path. [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy) [GitHub: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
2. **No-service development:** local Vite development/preview or another local static server. This requires no hosting account and is the easiest environment for testing camera/serial/bridge behavior on the same machine. Vite documents `vite preview` as a local build preview, not a production server. [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy)
3. **Alternative static host:** Cloudflare Pages is realistic when a free hosting account is acceptable; it supports Git/direct upload and documents availability on all plans. Netlify is realistic for manual or Git deployment when an account is acceptable. [Cloudflare Pages](https://developers.cloudflare.com/pages/) [Netlify: Choose your path](https://docs.netlify.com/start/overview/)
4. **Optional live layers:** add Browser Live through feature-detected browser APIs; add Bridge Live through a separately installed local process; add remote WSS/MQTT only as a configured integration with explicit endpoint/authentication/ACL documentation. The base learning experience must remain fully functional with network access disabled.

### Overall recommendation

Adopt a **static-first, edge-adapter architecture**:

```text
Static Vite/React UI
        |
        +-- Pure protocol/calculator core
        |       |
        |       +-- Simulator + virtual clock
        |       +-- Replay fixtures + virtual clock
        |       +-- Worker/Wasm execution (optional)
        |
        +-- Browser Live adapters
        |       +-- Web Serial
        |       +-- Web Bluetooth LE GATT
        |       +-- Camera getUserMedia
        |       +-- WebSocket/MQTT over WSS
        |
        +-- Bridge Live adapter (optional local WebSocket)
                +-- Serial/USB/native SDK
                +-- Modbus RTU/TCP, OPC UA, vendor TCP/UDP
                +-- MQTT broker/native camera drivers
```

The first release should make `SIMULATED` and `REPLAY` complete, polished, and offline-testable; expose `BROWSER LIVE` behind feature detection and explicit permission actions; and add `BRIDGE LIVE` only through the narrow contract rather than transport tunneling. WebRTC should remain a later option for a real peer-to-peer requirement, not a default local-connectivity layer. This sequencing preserves a zero-backend-cost GitHub Pages deployment while leaving a clear path to serious industrial adapters.

### Inferences

- Determinism is easiest when browser/device APIs are dependency-injected at the boundary and every core function receives all inputs explicitly. The Worker message model and the separation between browser adapters and server/bridge transports support this design. [MDN: Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) [MDN: Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- WebAssembly should be an optimization or reuse boundary, not the architectural foundation. The browser can run Wasm, but the core requirements here are deterministic protocol behavior and inspectable learning examples; a pure implementation is simpler to test and explain until measurement justifies Wasm. [MDN: WebAssembly guides](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides)
- A capability matrix should be persisted with each run/report: mode, transport, source/device, browser permission or bridge session, contract version, fixture/firmware metadata, and write authority. This prevents a replay or simulation result from being misinterpreted as a live commissioning result.

### Gaps

- The exact numeric determinism policy needs domain decisions: fixed-point scale per quantity, rounding ties, overflow behavior, timestamp precision, and whether cross-language bridge parity is required.
- The target live protocol set is not specified. Modbus RTU/TCP, OPC UA, MQTT, vendor APIs, camera control, and safety I/O have different addressing, timing, authentication, and failure semantics; each should get an adapter-specific acceptance matrix.
- No performance baseline was supplied. Worker/Wasm adoption, telemetry sampling, waveform frame rate, and replay storage format should follow measured workload results rather than assumptions.
