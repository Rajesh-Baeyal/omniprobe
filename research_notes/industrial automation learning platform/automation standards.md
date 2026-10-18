# Industrial automation standards landscape

Research scope: practical coverage for a unified diagnostic and learning workbench spanning serial/RS-232/RS-485/Modbus, TCP/UDP, CAN/CAN-FD/CANopen/J1939, OPC UA, MQTT/Sparkplug B, SECS/HSMS, IEC 61131-3 PLC concepts, and industrial cybersecurity. Evidence was collected from standards bodies, official specifications, browser standards, government guidance, and established open-source projects. Confidence is rated per finding: **High** means directly stated by a primary/official source; **Medium** means supported by a mature implementation or secondary technical source; **Inference** means a product recommendation derived from the cited evidence.

## Evidence and beginner terminology

### Cross-domain mental model

#### Takeaway

Teach every protocol as a stack: physical/link behavior, transport, application framing, data model, workflow/state machine, and diagnostics. The product should make the same captured exchange viewable as raw bytes/frames, decoded fields, semantic objects, and a timeline; this is an inference based on the different abstraction layers exposed by Modbus, TCP/UDP, CANopen, OPC UA, MQTT, and HSMS implementations.

#### Cited Findings

- Modbus is an application protocol whose messages are mapped onto serial links or TCP/IP; the official Modbus site is the authoritative starting point for application and serial-line specifications. — [Modbus Organization specifications](https://www.modbus.org/specs.php) **[Confidence: High]**
- TCP provides a reliable, in-order byte-stream service and is connection-oriented; applications must define their own message boundaries on top of that stream. — [RFC 9293, Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293) **[Confidence: High]**
- UDP is transaction/datagram-oriented and does not guarantee delivery or duplicate protection; applications needing ordered reliable streams should use TCP. — [RFC 768, User Datagram Protocol](https://www.rfc-editor.org/rfc/rfc768) **[Confidence: High]**
- CANopen organizes network-accessible variables in an Object Dictionary and adds NMT, heartbeat, PDO, SDO, EMCY, SYNC, time, and LSS services above CAN. — [CANopenNode protocol-stack documentation](https://github.com/CANopenNode/CANopenNode) **[Confidence: High]**
- OPC UA combines an information model, message model, communication model, and conformance model; its specification family covers address spaces, services, encodings/mappings, profiles, subscriptions/events, security, and PubSub. — [OPC UA Part 1: Overview and Concepts](https://reference.opcfoundation.org/specs/OPC-10000-1/full) and [OPC UA specification index](https://opcfoundation.org/developer-tools/specifications-unified-architecture) **[Confidence: High]**

#### Inferences

- The common learning sequence should be: bytes and timing -> frames and checksums -> transport state -> application messages -> device/data models -> operational workflow -> security and troubleshooting. This lets one “wire inspector” support all domains instead of creating unrelated protocol screens.
- A protocol lab should always show a **capability badge**: `offline simulator`, `browser adapter`, `native bridge`, or `hardware required`. This is especially important where an offline parser can look complete while it cannot reproduce bus arbitration, electrical faults, broker behavior, certificates, or equipment timing.

#### Gaps

- The exact normative electrical requirements for RS-232 and RS-485 are generally obtained from their paid TIA/EIA standards; the public sources gathered here are suitable for teaching the configuration/workflow boundary, not for claiming electrical conformance. Use the official Modbus serial documents plus a vendor physical-layer primer for implementation guidance.

### Serial, RS-232, RS-485, and Modbus

#### Takeaway

Start learners with UART-like serial configuration and then separate the physical link from Modbus framing. A deterministic TypeScript simulator can implement byte framing, Modbus RTU/ASCII/TCP encoding/decoding, CRC/LRC, register maps, exception responses, timing models, and fault injection; actual RS-232/RS-485 signaling and port I/O need Web Serial or a native adapter.

#### Cited Findings

- Web Serial is specifically designed to let a website read and write serial devices, including USB/Bluetooth devices that expose a serial port. It requires a secure context, user permission, and a user activation for `requestPort()`. — [WHATWG WebSerial living standard](https://serial.spec.whatwg.org/) and [MDN Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) **[Confidence: High]**
- Web Serial exposes `open()` options for baud rate, 7/8 data bits, 1/2 stop bits, parity, buffer size, and hardware flow control; byte chunks are arbitrary, so the application must decide message boundaries. — [WHATWG WebSerial: `open()` and readable stream](https://serial.spec.whatwg.org/#open-method) **[Confidence: High]**
- A mature JavaScript implementation, `modbus-serial`, supports Modbus RTU, ASCII, TCP, selected function codes, TCP server mode, and serial-port access through an optional `serialport` dependency; its README explicitly distinguishes TCP-only use from serial use. — [node-modbus-serial](https://github.com/yaacov/node-modbus-serial) **[Confidence: Medium]**
- The same implementation documents the beginner-relevant Modbus workflow: choose a unit ID, read/write coils or registers, set timeouts, and account for serial settings such as baud rate and parity. — [node-modbus-serial examples and API](https://github.com/yaacov/node-modbus-serial) **[Confidence: Medium]**
- Modbus terminology to teach: client/server (historically master/slave), unit ID, PDU, function code, data field, coils, discrete inputs, input registers, holding registers, exception response, RTU/ASCII/TCP, transaction identifier, and the common 0-based versus 1-based address-display trap. The function-code and transport families are grounded in the official Modbus specification index and the mature implementation. — [Modbus Organization specifications](https://www.modbus.org/specs.php); [node-modbus-serial supported functions](https://github.com/yaacov/node-modbus-serial) **[Confidence: High for protocol families; Medium for educational terminology]**
- RS-232/RS-485 should be taught as link/electrical choices, not as synonyms for Modbus. A vendor physical-layer primer is useful for the wiring concepts, while the Modbus Organization remains the authority for Modbus message behavior. — [TI, The RS-485 Design Guide](https://www.ti.com/lit/an/snla049b/snla049b.pdf); [Modbus Organization](https://www.modbus.org/specs.php) **[Confidence: Medium]**

#### Inferences

- **Offline-safe simulator:** serial settings model; byte/character timing; line-oriented ASCII; RTU silent-interval framing; CRC-16/Modbus and LRC; Modbus function codes 01/02/03/04/05/06/15/16; exception responses; a configurable register/coils map; endianness and word-order exercises; timeout/retry and malformed-frame injection; Modbus TCP MBAP header; deterministic replay.
- **Web Serial adapter:** connect, permission state, port selection, `open()`, read/write streams, disconnect handling, and raw byte capture. Do not imply that Web Serial gives RS-485 electrical diagnostics; it normally exposes a USB-to-serial device and the transceiver/wiring remains external.
- **Native bridge:** required for unrestricted serial-port enumeration, platform-specific driver controls, reliable RS-485 direction/termination diagnostics, virtual COM ports, and automated lab rigs. The browser should send a versioned, capability-limited command protocol to the bridge.
- **MVP learning workflow:** “configure port -> generate request -> inspect bytes -> decode response -> map fields to coils/registers -> inject CRC/address/timeout faults -> explain the likely physical versus application cause.”

#### Gaps

- The official Modbus site was reachable as a specifications index but its direct PDF links were not consistently fetchable in this research environment. Before conformance claims, pin the exact Modbus Application Protocol and Serial Line versions and verify vectors against the official PDFs.

### TCP and UDP

#### Takeaway

TCP/UDP should be a transport and framing lab, not a pretend browser socket implementation. Pure TypeScript can simulate connection state, byte streams, datagram loss/reordering/duplication, application framing, and packet timelines; real raw sockets require a native bridge, while browser access is normally through WebSocket or an application-specific HTTP/WebSocket gateway.

#### Cited Findings

- TCP’s core concepts include a byte stream, sequence numbers, acknowledgements, retransmission-based reliability, ports, and a connection state machine including LISTEN, SYN-SENT, SYN-RECEIVED, ESTABLISHED, and closing states. — [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293) **[Confidence: High]**
- UDP’s wire format has source/destination ports, length, checksum, and data; the protocol deliberately provides minimal mechanism and no delivery/order guarantee. — [RFC 768](https://www.rfc-editor.org/rfc/rfc768) **[Confidence: High]**
- Browser WebSocket is widely available and provides a client API to connect to a server, send/receive data, and observe open/message/error/close events, but it does not expose arbitrary TCP or UDP sockets. — [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) **[Confidence: High for the WebSocket API; bridge conclusion is an implementation inference]**

#### Inferences

- **Offline-safe simulator:** TCP three-way handshake and close state machine; sequence/ack/window exercises at a teaching level; byte-stream chunking that deliberately splits/coalesces application messages; length-prefix, delimiter, and timeout framing; UDP datagram loss, duplication, reorder, truncation, and checksum scenarios; port/listener/client concepts.
- **Browser-compatible path:** use WebSocket/WSS only when the remote gateway intentionally exposes a WebSocket endpoint. Teach the difference between TCP bytes and WebSocket messages so users do not mistake the gateway protocol for raw TCP.
- **Native bridge:** raw TCP client/server/listener, UDP bind/send/receive, multicast/broadcast, packet capture, and local industrial subnet discovery. Require explicit target and rate controls in the UI; default to read-only/loopback simulation for learning.

#### Gaps

- A browser cannot faithfully reproduce kernel socket behavior, packet capture, multicast, or industrial network timing. The simulator should label these as pedagogical models rather than conformance tests.

### CAN, CAN-FD, CANopen, and J1939

#### Takeaway

The first CAN workbench should focus on frame inspection and higher-layer decoding, with hardware access deferred to a native CAN/SocketCAN bridge. CANopen is an object-dictionary and state-management protocol; J1939 is a parameter-group and address-management ecosystem. CAN-FD needs separate arbitration/data-phase and longer-payload concepts, but the first offline release can model frames and timing without claiming bit-level bus conformance.

#### Cited Findings

- CANopenNode identifies CANopen as the standardized EN 50325-4 higher-layer protocol over CAN and documents Object Dictionary, NMT, heartbeat, PDO, SDO (expedited/segmented/block), EMCY, SYNC, time, and LSS functionality. — [CANopenNode README](https://github.com/CANopenNode/CANopenNode) **[Confidence: High]**
- CAN in Automation publishes technical documents for CAN physical-layer bit timing, CANopen, gateways, device profiles, CAN-FD mappings, and J1939-related mappings; its public higher-layer overview explains that J1939 was designed for in-vehicle networks such as trucks and buses and is maintained by SAE International. — [CiA technical documents](https://www.can-cia.org/cia-groups/technical-documents); [CiA standardized higher-layer protocols](https://can-cia.org/can-knowledge/standardized-higher-layer-protocols) **[Confidence: High]**
- `can-utils` is a mature SocketCAN userspace toolkit with capture, replay, generation, bus-load, CAN-FD testing, error simulation, J1939 address-claim/traffic tools, and ISO-TP utilities. — [Linux-CAN can-utils](https://github.com/linux-can/can-utils) **[Confidence: High]**
- CANopen beginner terms are Object Dictionary, index/sub-index, node ID, NMT state, heartbeat producer/consumer, PDO/TPDO/RPDO, SDO client/server, EMCY, SYNC, LSS, EDS/XDD, and COB-ID. — [CANopenNode README and linked CiA knowledge pages](https://github.com/CANopenNode/CANopenNode) **[Confidence: High]**
- J1939 beginner terms are 29-bit identifier, priority, PGN, source address, destination-specific versus broadcast PDU, NAME/address claim, SPN, FMI, diagnostic messages, and transport protocol for messages larger than one CAN frame. — [CiA higher-layer overview](https://can-cia.org/can-knowledge/standardized-higher-layer-protocols); [can-utils J1939 tooling](https://github.com/linux-can/can-utils) **[Confidence: Medium]**

#### Inferences

- **Offline-safe simulator:** classic CAN and CAN-FD frame objects; standard/extended IDs; DLC and payload-length validation; arbitration ordering; bus-load estimation; cyclic traffic; error/overload/bus-off as modeled events; CAN-FD nominal/data bitrate fields; CANopen NMT/heartbeat/PDO/SDO/EMCY/SYNC state machine; J1939 ID/PGN/SA decoder, address-claim examples, SPN/FMI catalog loading, and multi-frame transport simulation.
- **Native bridge required:** actual CAN/CAN-FD controller access, bus arbitration under load, error counters, bus-off recovery, bit timing, termination, transceiver faults, and SocketCAN/vendor adapter access. A bridge can translate SocketCAN frames into a browser-safe event stream and provide a replay interface based on ASC/log files.
- **MVP learning workflow:** “select bitrate -> send/receive frame -> explain arbitration ID -> decode a signal -> move upward into CANopen/J1939 -> inject heartbeat loss/address conflict/invalid DLC -> diagnose.”
- Do not make CANopen Safety, firmware download, LSS write operations, or arbitrary J1939 commands part of an early connected MVP; model them offline first and gate real writes behind an explicit hardware/bridge capability.

#### Gaps

- Public CiA pages expose overview and document catalogs, but many detailed specifications are controlled documents. Use CiA/SAE-owned documents and a licensed conformance suite when claiming CANopen/J1939 profile conformance.

### OPC UA

#### Takeaway

OPC UA is the richest information-model domain in this scope. The first useful product feature is an offline address-space and client-learning simulator, not a full browser-native OPC UA stack. Browser interaction can work when a server exposes a supported HTTP/WebSocket/JSON path; common `opc.tcp` and certificate-heavy connections should use a bridge.

#### Cited Findings

- OPC UA is platform-independent and service-oriented, with an AddressSpace model, security model, client/server services, multiple encodings and mappings, profiles, subscriptions/events, and a separate PubSub model. — [OPC UA Part 1](https://reference.opcfoundation.org/specs/OPC-10000-1/full) **[Confidence: High]**
- OPC UA mappings include TCP, HTTPS, WebSockets, XML/text, UA Binary, and JSON; the official specification family separates the conceptual services from transport/encoding mappings and profiles. — [OPC UA Part 1](https://reference.opcfoundation.org/specs/OPC-10000-1/full) and [OPC UA specification index](https://reference.opcfoundation.org/) **[Confidence: High]**
- `node-opcua` is a large TypeScript/Node.js implementation that describes itself as a full OPC UA stack for Node.js and the browser, with client/server/discovery, security policies, certificates, examples, and a supported-features matrix. — [node-opcua](https://github.com/node-opcua/node-opcua) **[Confidence: High for project capabilities; transport suitability remains deployment-specific]**
- `open62541` is a mature C implementation of OPC UA/IEC 62541 with client/server support, exchangeable platform plugins, examples, fuzzing/unit-test practices, and an OPC Foundation-certified example server release. — [open62541](https://github.com/open62541/open62541) **[Confidence: High]**

#### Inferences

- **Offline-safe simulator:** namespaces and namespace indexes; NodeIds; Objects/Variables/Methods; BrowseNames and references; typed values/status/timestamps; Read/Write/Call at a modeled service level; subscriptions/monitored items and data-change notifications; NodeSet2 import/export; endpoint/security-policy vocabulary; deterministic certificate/trust-store exercises using test certificates only.
- **Browser path:** a browser-facing adapter can use WebSocket/HTTPS/JSON only where the OPC UA endpoint supports it. `opc.tcp` binary, native certificate stores, local discovery, and arbitrary endpoint access should be marked `native bridge`.
- **Native bridge:** use `node-opcua` or `open62541` for real client/server connections, certificate validation, subscriptions at industrial timing, and security-policy coverage. Keep the bridge API high-level and auditable: enumerate endpoint, connect, browse, read, subscribe, write only if explicitly enabled.
- **MVP learning workflow:** “load NodeSet -> browse namespace/address space -> read a variable -> create monitored item -> inspect DataValue/status/timestamp -> compare endpoint/security modes -> diagnose certificate/trust or namespace errors.”

#### Gaps

- Full OPC UA conformance is too broad for a browser workbench. The product needs a declared profile subset and should not claim CTT conformance based only on offline encoding tests.

### MQTT and Sparkplug B

#### Takeaway

MQTT is a strong early browser-connected protocol because mature JavaScript clients support MQTT over WebSocket, while the protocol itself is a small client/server publish-subscribe transport. Sparkplug B should follow as a semantic/stateful overlay: birth/death lifecycle, metrics, aliases, templates/datasets, and protobuf payloads.

#### Cited Findings

- MQTT 5.0 is an OASIS Standard and defines a lightweight client/server publish-subscribe transport over TCP/IP or another ordered, lossless, bidirectional transport. It defines QoS 0/1/2, retained messages, abnormal-disconnect notification, and content-agnostic payloads. — [OASIS MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html) **[Confidence: High]**
- MQTT beginner terms are broker, client, topic name, topic filter, wildcard, CONNECT/CONNACK, PUBLISH, SUBSCRIBE/SUBACK, UNSUBSCRIBE, QoS, retain, Last Will, keep alive, session, packet identifier, and MQTT 5 properties. — [OASIS MQTT 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html) **[Confidence: High]**
- MQTT.js is a TypeScript/JavaScript client for Node.js and the browser; its documented URL schemes include `ws` and `wss`, and it exposes MQTT 5 properties, QoS, reconnect handling, topic wildcards, and packet send/receive events. — [MQTT.js](https://github.com/mqttjs/MQTT.js) **[Confidence: High]**
- Sparkplug is an Eclipse specification for MQTT-enabled devices/applications to exchange stateful industrial data; Sparkplug B adds templates, datasets, richer metric metadata, aliases, historical data, and file data. — [Eclipse Sparkplug repository](https://github.com/eclipse-sparkplug/sparkplug) **[Confidence: High]**
- Eclipse Tahu provides reference implementations and client libraries, including JavaScript, for Sparkplug device/application lifecycle behavior; its public README calls out birth and Last Will and Testament messages and links the Sparkplug specification/TCK repository. — [Eclipse Tahu](https://github.com/eclipse-tahu/tahu) **[Confidence: High]**

#### Inferences

- **Offline-safe MQTT simulator:** packet parser/encoder; CONNECT/CONNACK; PUBLISH/SUBSCRIBE/UNSUBSCRIBE; QoS 0 first, then QoS 1/2 handshake models; topic-filter matching; retained messages; Last Will; keep-alive timers; session expiry; MQTT 5 reason codes/properties; deterministic in-memory broker with fault injection.
- **Browser-connected path:** MQTT.js over `ws`/`wss` to a broker configured for MQTT over WebSocket. Clearly distinguish broker authentication, TLS, and authorization from the simulator’s in-memory behavior; do not put credentials in saved workbench projects.
- **Sparkplug B offline MVP:** topic namespace builder; protobuf payload decode/encode using a pinned schema; NBIRTH/NDEATH, DBIRTH/DDEATH, NDATA/DDATA, NCMD/DCMD, and STATE lifecycle scenarios; metrics, aliases, templates, datasets, sequence numbers, and stale-data visualization. Validate against Eclipse Tahu/TCK fixtures where licensing permits.
- **Sparkplug B connected path:** broker connection over WSS plus lifecycle/session behavior. Real enterprise deployment may need certificates, ACLs, state-store persistence, and broker-specific limits; expose these as environment capabilities.
- **MVP learning workflow:** “connect client -> subscribe wildcard -> publish QoS/retain/will -> drop connection -> observe lifecycle -> decode Sparkplug metric -> compare birth/data/death state -> inspect stale or alias-based data.”

#### Gaps

- The Sparkplug specification PDF and TCK are linked by Eclipse but were not fully extractable in this environment. Pin a permitted version and use the official TCK/schema artifacts rather than recreating protobuf details from prose.

### SECS/HSMS and GEM

#### Takeaway

SECS/HSMS is highly valuable for semiconductor equipment diagnostics but should be an offline simulator and trace viewer before connected support. Public SEMI material confirms the standards ecosystem and equipment-automation scope, while mature open-source implementations reveal the practical objects: HSMS session settings, SECS-II item trees, stream/function messages, primary/secondary replies, GEM events, and timeout/error handling.

#### Cited Findings

- SEMI says its standards program includes more than 1,000 industry-approved standards and identifies the E series as Equipment Automation Software & Hardware; SEMI standards are generally distributed through purchase/subscription. — [SEMI Standards](https://www.semi.org/en/standards) **[Confidence: High]**
- `secsgem` is a Python SECS/GEM implementation with HSMS settings, active/passive connection mode, host/device role, port configuration, stream/function handling, and communication logging; its README labels the project work in progress. — [secsgem](https://github.com/bparzella/secsgem) **[Confidence: High for documented API/examples; Medium for production maturity]**
- `secs4net` is a .NET SECS-II/HSMS-SS/GEM implementation. Its examples show structured SECS items, stream/function messages, primary/secondary exchange, T3 timeout and SxF0/S9Fx error handling, and an HSMS TCP configuration. — [secs4net](https://github.com/mkjeff/secs4net) **[Confidence: High]**

#### Inferences

- Beginner terms: host/equipment, HSMS active/passive, session/device ID, select/deselect/linktest, control versus data message, system bytes, stream/function (SxFy), W-bit/reply expected, primary/secondary, SECS-II item types (list, binary, ASCII, Boolean, signed/unsigned integers, floats), T3/T5/T6/T7/T8 timers, GEM collection event, report, alarm, remote command, and state model.
- **Offline-safe simulator:** HSMS framing and control-message state machine; deterministic TCP-like transport model; SECS-II item-tree encoder/decoder; stream/function catalog; primary/secondary correlation; system-byte allocation; timer expiration; SxF0/S9Fx and malformed-item errors; GEM event/alarm/report/remote-command scenarios; trace import/export.
- **Native bridge:** real HSMS TCP sockets, equipment role negotiation, production timer behavior, vendor-specific SECS/GEM capability tables, and any remote command that can change equipment state. A browser should use a controlled bridge with read-only default and an explicit equipment capability manifest.
- **MVP learning workflow:** “open HSMS session -> linktest/select -> decode an SxFy item tree -> correlate W-bit reply -> trigger collection event/alarm -> exercise timer/error path -> compare host and equipment responsibilities.”

#### Gaps

- Public sources did not provide the normative SEMI E37/E5/E30 text. Treat the cited open-source examples as implementation evidence, not a substitute for licensed SEMI standards or equipment-interface agreements.

### IEC 61131-3 PLC programming concepts

#### Takeaway

Implement a learning-oriented PLC execution model rather than a vendor PLC runtime. Start with Structured Text (ST), Ladder Diagram (LD), Function Block Diagram (FBD), variables, types, program organization units, scan cycles, timers/counters, edge detection, and I/O images. Treat Instruction List (IL) as legacy/edition-specific because the official IEC page for the 2013 edition lists it while also pointing to a newer 2025 edition.

#### Cited Findings

- IEC 61131-3:2013 specifies syntax and semantics for a unified suite of PLC languages: textual IL and ST plus graphical LD and FBD; it also added data types/conversions, references, namespaces, and object-oriented features for classes/function blocks. — [IEC 61131-3:2013 product page](https://webstore.iec.ch/en/publication/4552) **[Confidence: High]**
- The IEC page states that a newer IEC 61131-3:2025 publication exists and that the 2013 edition was withdrawn in 2025, so the product should version its educational language subset rather than claiming one timeless language definition. — [IEC 61131-3:2013 page and current-edition link](https://webstore.iec.ch/en/publication/4552) **[Confidence: High]**

#### Inferences

- Beginner terms: scan/task, input image, output image, POU, program, function, function block, instance, variable scope, elementary/derived types, ST expression, LD contact/coil, FBD block, timer TON/TOF/TP, counter CTU/CTD, rising/falling edge, retentive variable, state machine, and deterministic cycle time.
- **Offline-safe simulator:** parse a deliberately small ST subset; render/edit LD/FBD as an intermediate graph; execute a deterministic scan cycle; model inputs/outputs and retained variables; implement IEC-style Boolean/numeric types, timers, counters, edge detectors, and test traces; show every scan’s inputs, intermediate values, and outputs.
- **Not MVP:** full vendor compiler compatibility, safety PLC semantics, motion-control profiles, online program download, retentive memory on physical PLCs, or execution of arbitrary user code without a sandbox.
- **MVP learning workflow:** “declare variables -> write ST/LD/FBD -> step one scan -> observe I/O image -> add timer/edge/state -> inject stuck input or missed cycle -> explain output.”

#### Gaps

- The official standard is paid and edition-sensitive. A product should cite the edition and use openly documented educational examples; do not copy normative text or imply vendor certification.

### Industrial cybersecurity

#### Takeaway

Cybersecurity should be a cross-cutting diagnostic and learning layer, not a late checklist. Teach asset inventory, zones/conduits, trust boundaries, identity, least privilege, secure configuration, segmentation, logging, backup/recovery, patch/change management, protocol exposure, and safety/availability tradeoffs using safe offline scenarios.

#### Cited Findings

- NIST SP 800-82 Rev. 3 addresses OT security while accounting for performance, reliability, and safety requirements; it covers OT topologies, threats/vulnerabilities, and recommended countermeasures. — [NIST SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final) **[Confidence: High]**
- ISA/IEC 62443 is a consensus-based family for electronically secure IACS, covering lifecycle roles, asset-owner security programs, risk assessment, system security requirements/security levels, component requirements, and secure product development. — [ISA/IEC 62443 series](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards) **[Confidence: High]**
- ISA describes shared responsibility among asset owners, product suppliers, integrators, and service suppliers and emphasizes people, process, and technology across the IACS lifecycle. — [ISA/IEC 62443 getting-started guidance](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards) **[Confidence: High]**

#### Inferences

- Beginner terms: OT/IACS, asset, zone, conduit, trust boundary, attack surface, least privilege, defense in depth, security level, availability/integrity/confidentiality tradeoff, secure remote access, allowlisting, patch/change window, backup/restore, certificate/identity, anomaly, incident, and recovery.
- **Offline-safe simulator:** build a small plant graph; assign assets/protocols/zones; draw conduits; mark trust boundaries; run deterministic scenarios such as unauthenticated Modbus write, exposed MQTT broker, weak OPC UA policy, rogue serial bridge, CAN message injection, HSMS remote-command misuse, or compromised engineering workstation; score mitigations using explainable rules rather than real exploitation.
- **Bridge/hardware boundary:** passive capture, authenticated endpoint checks, certificate/trust validation, configuration audit, and lab-only traffic generation can be adapters. Do not make production scanning, exploit execution, safety-path manipulation, or uncontrolled write testing part of the default workbench.
- **MVP learning workflow:** “inventory -> map zone/conduit -> identify protocol trust assumptions -> choose controls -> validate with a harmless trace -> document residual risk -> rehearse restore.”

#### Gaps

- ISA/IEC 62443 normative documents are purchased/controlled; NIST SP 800-82 is the best openly accessible anchor for the first educational security content. Exact security-level assessment requires the applicable standard text and an operational risk context.

## Implementation boundary, MVP, and golden vectors

### Capability matrix

| Domain | Pure TypeScript offline | Browser capability | Native bridge or hardware | First useful MVP |
|---|---|---|---|---|
| Serial / RS-232 / RS-485 | Byte framing, baud/timing model, parity/stop-bit model, line protocols, CRC/LRC, record/replay, fault injection | Web Serial after HTTPS/user permission; USB-to-serial device access | RS-232/485 electrical interface, transceiver diagnostics, unrestricted port/driver controls, real line timing | Serial console + framing inspector + Modbus RTU/ASCII lab |
| Modbus | RTU/ASCII/TCP codec, function codes, register map, exceptions, timing and timeout model | Web Serial for RTU; WSS gateway for remote TCP/RTU | Raw COM, RS-485 direction, real TCP/UDP endpoints, device writes | Guided read/write lab with address/endianness traps and replay |
| TCP/UDP | State machine, stream/datagram model, app framing, loss/reorder/duplication simulation | WebSocket/WSS gateway only | Raw TCP/UDP, multicast/broadcast, capture, local subnet access | TCP framing and UDP fault-injection lab |
| CAN/CAN-FD | Frame codec, ID arbitration model, payload/DLC checks, bus-load model, CANopen/J1939 decoders | No general browser CAN bus API; consume bridge/replay stream | CAN/CAN-FD adapter, SocketCAN/vendor driver, electrical/bus-error data | CAN trace viewer + classic/CAN-FD + basic J1939/CANopen decode |
| CANopen/J1939 | NMT/heartbeat/PDO/SDO state model; PGN/SA/SPN/FMI and transport model | Replay/bridge UI | Real bus state, arbitration, address claim, writes/commands | Offline device-network lab with trace replay |
| OPC UA | Address space, NodeSet, NodeId, browse/read/write model, subscriptions, value/status/timestamp model | Only endpoint-supported HTTP/WebSocket/JSON path | `opc.tcp`, discovery, certificates, full client/server, production subscriptions | Offline address-space browser and modeled client lab |
| MQTT 5 | Packet codec, brokerless router, QoS/session/retain/will/property model | MQTT.js over WSS | Broker, TLS/auth/ACL, enterprise persistence | In-memory broker + WSS adapter + packet inspector |
| Sparkplug B | Topic/lifecycle state machine, protobuf metric model, birth/death/data scenarios | MQTT.js over WSS | Broker/state store, device identity, deployment ACLs | Tahu/schema-backed lifecycle simulator and trace viewer |
| SECS/HSMS/GEM | HSMS framing, SECS-II item tree, SxFy, timers, event/alarm/report model | A bridge can expose safe trace/session API; no generic browser HSMS | TCP HSMS connection, equipment timing, vendor capability, remote commands | Offline host/equipment simulator + trace decoder |
| IEC 61131-3 | ST subset, LD/FBD graph, scan cycle, timers/counters, I/O image, traces | Fully offline in browser | PLC vendor runtime/program download | Scan-cycle teaching sandbox |
| Cybersecurity | Plant graph, zones/conduits, threat/control scenarios, evidence checklist, trace annotation | UI and optional read-only WSS/bridge telemetry | Passive capture, certificate/config checks, controlled lab instrumentation | Cross-protocol threat-model and safe diagnostic labs |

Sources for the boundaries: [WHATWG WebSerial](https://serial.spec.whatwg.org/), [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), [MQTT.js](https://github.com/mqttjs/MQTT.js), [node-modbus-serial](https://github.com/yaacov/node-modbus-serial), [CANopenNode](https://github.com/CANopenNode/CANopenNode), [can-utils](https://github.com/linux-can/can-utils), [node-opcua](https://github.com/node-opcua/node-opcua), [open62541](https://github.com/open62541/open62541), [secsgem](https://github.com/bparzella/secsgem), [secs4net](https://github.com/mkjeff/secs4net) **[Confidence: High for API/capability facts; bridge classification is an inference]**.

### Exact MVP feature set

#### Takeaway

The MVP should be a deterministic protocol-learning core with three adapters, not an attempt to connect to every industrial technology immediately.

#### Cited Findings

- A browser can provide secure, permissioned serial access through Web Serial and reliable bidirectional application messaging through WebSocket. — [WHATWG WebSerial](https://serial.spec.whatwg.org/); [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) **[Confidence: High]**
- MQTT.js, node-opcua, node-modbus-serial, CANopenNode, can-utils, Eclipse Tahu, secsgem, and secs4net demonstrate mature implementation paths for the major protocol families, but their runtimes and licenses differ. — [MQTT.js](https://github.com/mqttjs/MQTT.js); [node-opcua](https://github.com/node-opcua/node-opcua); [node-modbus-serial](https://github.com/yaacov/node-modbus-serial); [CANopenNode](https://github.com/CANopenNode/CANopenNode); [can-utils](https://github.com/linux-can/can-utils); [Eclipse Tahu](https://github.com/eclipse-tahu/tahu); [secsgem](https://github.com/bparzella/secsgem); [secs4net](https://github.com/mkjeff/secs4net) **[Confidence: High]**

#### Inferences

1. **Deterministic engine:** virtual clock, seeded randomness, byte/bit utilities, endianness/bitfield helpers, CRC/LRC/checksum registry, length/delimiter/silence framing, packet/frame timeline, trace import/export, and fault-injection primitives.
2. **Unified inspector:** raw hex/ASCII, decoded field table, semantic tree, state-machine timeline, warnings, confidence/capability badges, and a “why this is invalid” explanation.
3. **Protocol labs:** Modbus RTU/TCP; TCP/UDP framing; classic CAN/CAN-FD; starter CANopen/J1939; MQTT 5 in-memory broker; Sparkplug B lifecycle; OPC UA modeled address space; HSMS/SECS-II offline exchange; IEC 61131-3 scan-cycle sandbox.
4. **Three explicit adapters:** Web Serial; MQTT over WSS; a versioned native bridge for raw TCP/UDP, CAN, OPC UA `opc.tcp`, and HSMS. The bridge exposes capabilities and refuses operations outside its manifest.
5. **Learning workflow:** each lab has vocabulary, a happy-path trace, one malformed trace, one timing/state fault, a guided diagnosis, and a replayable answer key.
6. **Safety and trust UI:** mark every action `simulation`, `read-only connected`, or `write-capable connected`; never save secrets in traces or project files; use environment variables/OS credential storage in adapters.
7. **Evidence panel:** each decoder and lesson links to the relevant standard/project source, edition/version, and license. This is especially important for paid IEC/SEMI/CiA/SAE material.

### Golden-vector and verification plan

#### Takeaway

Golden vectors should verify codecs and state machines independently from UI tests. Start with byte-exact vectors for Modbus, MQTT, HSMS/SECS-II, and CAN frames; add semantic/state vectors for CANopen, J1939, Sparkplug B, OPC UA, PLC scan behavior, and cybersecurity scenarios.

#### Cited Findings

- Modbus implementations expose discrete function-code families and both RTU/TCP transports; MQTT 5 defines packet types, QoS, properties, and reason codes; CANopenNode and can-utils expose higher-layer services and trace tooling; secs4net exposes SECS-II item trees and error/timer paths. — [node-modbus-serial](https://github.com/yaacov/node-modbus-serial); [OASIS MQTT 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html); [CANopenNode](https://github.com/CANopenNode/CANopenNode); [can-utils](https://github.com/linux-can/can-utils); [secs4net](https://github.com/mkjeff/secs4net) **[Confidence: High]**
- Sparkplug’s official repositories provide the specification/TCK path, and Eclipse Tahu provides reference implementations/lifecycle behavior. — [Sparkplug](https://github.com/eclipse-sparkplug/sparkplug); [Eclipse Tahu](https://github.com/eclipse-tahu/tahu) **[Confidence: High]**

#### Inferences

**Byte-exact vectors to commit as fixtures:**

- Serial character format: 7E1, 8N1, 8E1, and 8N2 framing models; parity pass/fail; stop-bit and break/error cases.
- Modbus RTU: request `01 03 00 00 00 0A` with CRC bytes in wire order; valid response with two registers; bad CRC; wrong unit ID; short frame; exception response; inter-frame silence boundary. Verify CRC against the pinned official Modbus revision before publishing expected bytes.
- Modbus TCP: MBAP transaction/protocol/length/unit fields around the same PDU; mismatched transaction ID; truncated MBAP; illegal length; exception response.
- TCP: SYN/SYN-ACK/ACK; FIN and RST; retransmission/duplicate segment; stream chunks splitting one application frame; length-prefix and delimiter framing. The expected state transitions should be compared with RFC 9293 terminology.
- UDP: checksum-valid and checksum-invalid datagrams; empty payload; duplicate/reordered/lost datagrams; source/destination port changes.
- CAN classic: standard and extended identifiers; 0/1/8-byte payloads; invalid DLC; arbitration ordering for two IDs; error-frame event. CAN-FD: nominal/data bitrate configuration, BRS/ESI flags, payload-length table, and a 64-byte payload fixture. Use controller/tool captures for bit-level validation.
- CANopen: NMT start/stop/reset; heartbeat producer/consumer timeout; expedited/segmented SDO read/write; PDO mapping; EMCY; SYNC; LSS node-ID/bitrate sequence. Compare with CANopenNode traces and licensed CiA documents.
- J1939: decode a 29-bit ID into priority/PGN/SA; PDU1 destination; PDU2 broadcast; address-claim conflict; SPN/FMI diagnostic item; BAM/TP multi-frame sequence; malformed sequence.
- MQTT 5: CONNECT/CONNACK success and refusal; PUBLISH QoS 0/1/2 handshake; SUBSCRIBE with `+` and `#`; retain; Last Will; keep-alive timeout; property length/UTF-8/reason-code errors; maximum-packet-size rejection. Cross-check with OASIS and MQTT.js packet events.
- Sparkplug B: NBIRTH/NDEATH/DBIRTH/DDEATH/NDATA/DDATA/NCMD/DCMD/STATE lifecycle; metric alias; template/dataset; sequence mismatch/stale state; malformed protobuf. Generate bytes from the pinned Eclipse schema/TCK rather than handwritten payloads.
- OPC UA: NodeId forms; namespace index; BrowseName/reference; scalar/array DataValue with status/timestamp; Read/Write/Call modeled services; subscription notification; UA Binary length/encoding boundary; certificate/trust-policy success and failure using test certificates. Cross-check selected vectors with node-opcua/open62541.
- HSMS/SECS-II: 4-byte length prefix; control message types; session/device ID; system bytes; W-bit correlation; SECS-II nested lists and numeric/string encodings; primary/secondary reply; T3 timeout; SxF0/S9Fx handling. Validate against licensed SEMI specifications and at least one open-source implementation.
- IEC 61131-3: ST operator precedence/types; LD/FBD Boolean equivalence; TON/TOF/TP timing; rising edge; counter saturation/reset; one-scan input/output image semantics; retained variable restart.

**Property/state-machine tests:**

- Every decoder must round-trip valid values, reject truncation/overflow/invalid enum values, preserve unknown extension fields where the standard permits, and never read beyond declared lengths.
- Every stateful simulator must be deterministic under a seeded clock/random source, expose timeout causes, and produce the same trace in browser and Node test runners.
- Every connected adapter must test permission denied, disconnect/reconnect, timeout, backpressure/queue growth, authentication failure, and capability-manifest enforcement.
- Every security lesson must test that “unsafe” actions are simulated by default and that evidence links/edition metadata remain attached to the scenario.

## 12-month sequencing, confidence, and research gaps

### Recommended first 12 months

#### Takeaway

Sequence from deterministic bytes and the most accessible browser adapter to increasingly stateful industrial ecosystems. Keep cybersecurity, licensing, evidence links, and replay infrastructure in every quarter rather than deferring them to the end.

#### Cited Findings

- Web Serial is permissioned and secure-context constrained; WebSocket is broadly available; MQTT.js supports browser WebSocket transports; these make serial and MQTT the most practical early connected paths. — [WHATWG WebSerial](https://serial.spec.whatwg.org/); [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket); [MQTT.js](https://github.com/mqttjs/MQTT.js) **[Confidence: High]**
- Modbus, CANopen, MQTT/Sparkplug, OPC UA, SECS/GEM, and IEC 61131-3 each have mature official or open-source reference material, but several normative standards are paid/controlled and some implementations are native-language stacks. — [Modbus Organization](https://www.modbus.org/specs.php); [CANopenNode](https://github.com/CANopenNode/CANopenNode); [Eclipse Tahu](https://github.com/eclipse-tahu/tahu); [OPC Foundation](https://opcfoundation.org/developer-tools/specifications-unified-architecture); [SEMI](https://www.semi.org/en/standards); [IEC 61131-3](https://webstore.iec.ch/en/publication/4552) **[Confidence: High]**
- NIST SP 800-82 and ISA/IEC 62443 both frame OT security around operational constraints, lifecycle, roles, risk, and countermeasures, supporting an integrated security learning track. — [NIST SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final); [ISA/IEC 62443](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards) **[Confidence: High]**

#### Inferences

| Months | Delivery focus | Exit evidence |
|---|---|---|
| 1–2 | Foundations: binary/hex, endianness, bitfields, checksums, framing, virtual clock, deterministic traces, raw/decoded/semantic inspector, lesson/schema format | Golden-test harness; replayable byte traces; Modbus CRC/LRC and generic framing fixtures; browser/Node deterministic parity |
| 3 | Serial + Modbus: RTU/ASCII/TCP codecs, register maps, exceptions, address/endianness lab, Web Serial adapter | Guided Modbus read/write simulation; permission/disconnect handling; first real USB-serial lab with read-only defaults |
| 4 | TCP/UDP: stream/datagram simulator, application framing, timeout/retry, loss/reorder/duplication, WebSocket gateway contract, native socket bridge spike | TCP/UDP state and framing vectors; a visible warning when a WebSocket gateway is not raw TCP |
| 5 | CAN/CAN-FD core: frame viewer, arbitration/bus-load model, log replay, CAN native bridge contract | Classic/CAN-FD fixtures; ASC/replay path; bridge capability manifest; no write operations by default |
| 6 | CANopen + J1939: Object Dictionary, NMT/heartbeat/PDO/SDO, PGN/SA/SPN/FMI, multi-frame transport | Offline network scenarios and trace decoder; compare selected traces with CANopenNode/can-utils |
| 7 | MQTT 5: in-memory broker, packet inspector, topic matching, retain/will, QoS/session/property labs, MQTT.js WSS adapter | OASIS/MQTT.js cross-checks; brokerless mode works offline; credentials never enter fixtures |
| 8 | Sparkplug B: pinned protobuf/schema, birth/death/data/state lifecycle, aliases/templates/datasets, Tahu/TCK fixture import | Lifecycle state dashboard; malformed/stale/sequence tests; versioned schema/TCK evidence |
| 9 | OPC UA offline: NodeSet/address-space browser, NodeId/reference model, Read/Write/Call/subscription simulator, certificate vocabulary; native bridge spike | Address-space learning course; selected node-opcua/open62541 round trips; no claim of full conformance |
| 10 | IEC 61131-3 sandbox: ST subset, LD/FBD graph, scan cycle, timers/counters/edges, I/O traces, fault injection | Deterministic scan trace; language subset documented with edition; no vendor download |
| 11 | SECS/HSMS/GEM: HSMS/SECS-II codec, item tree, SxFy catalog, timers, events/alarms/reports, trace replay, native bridge design | Offline host/equipment scenarios; licensed-standard review gate before connected writes; open-source interop checks |
| 12 | Cybersecurity and capstone: zones/conduits, asset/protocol threat scenarios, safe diagnostic controls, evidence/edition catalog, cross-protocol replay and export | End-to-end “device -> protocol -> data -> threat -> mitigation -> recovery” course; security review; documented capability matrix and roadmap for year 2 |

### Confidence and source-quality notes

#### Cited Findings

- Highest-confidence normative anchors in this research are OASIS MQTT, IETF RFC 768/9293, WHATWG WebSerial, OPC Foundation references, IEC’s product metadata page, NIST SP 800-82, and ISA’s public 62443 overview. — [OASIS MQTT](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html); [RFC 768](https://www.rfc-editor.org/rfc/rfc768); [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293); [WebSerial](https://serial.spec.whatwg.org/); [OPC UA](https://reference.opcfoundation.org/specs/OPC-10000-1/full); [IEC 61131-3](https://webstore.iec.ch/en/publication/4552); [NIST](https://csrc.nist.gov/pubs/sp/800/82/r3/final); [ISA/IEC 62443](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards) **[Confidence: High]**
- Mature open-source implementation evidence is strongest for MQTT.js, node-opcua, open62541, CANopenNode, can-utils, node-modbus-serial, Eclipse Tahu, and secs4net; `secsgem` is useful but self-identifies as work in progress. — [MQTT.js](https://github.com/mqttjs/MQTT.js); [node-opcua](https://github.com/node-opcua/node-opcua); [open62541](https://github.com/open62541/open62541); [CANopenNode](https://github.com/CANopenNode/CANopenNode); [can-utils](https://github.com/linux-can/can-utils); [node-modbus-serial](https://github.com/yaacov/node-modbus-serial); [Eclipse Tahu](https://github.com/eclipse-tahu/tahu); [secs4net](https://github.com/mkjeff/secs4net); [secsgem](https://github.com/bparzella/secsgem) **[Confidence: High]**
- Detailed conformance requirements for RS-232/RS-485, Modbus revisions, CANopen profiles, J1939/SAE documents, SEMI E37/E5/E30, OPC UA CTT profiles, IEC 61131-3 normative language, Sparkplug TCK licensing/versioning, and ISA/IEC 62443 assessments require the relevant controlled or licensed documents. **[Confidence: High]**

#### Inferences

- Store each source as metadata: organization, URL, standard/project name, edition/version, access date, license/access status, and claims supported. This prevents a lesson from silently mixing a 2013 IEC language model, a newer edition, and vendor-specific behavior.
- Put a protocol conformance score beside every implementation: `codec`, `simulator`, `trace decoder`, `browser transport`, `native transport`, `security`, and `certification`. This is more honest and more useful than a single “supported” checkbox.
- Treat connected writes as a separate product tier. Offline correctness and replay should be complete before a bridge can issue writes to Modbus, CAN, OPC UA, MQTT commands, or SECS/GEM remote commands.

#### Gaps

- Exa web search was rate-limited during the research pass, so discovery relied primarily on directly fetched official pages and project repositories. No claim below depends on a search snippet alone.
- Several official pages were accessible only as indexes or returned transient fetch errors; URLs are retained so a later verification pass can pin current editions and permitted fixture downloads.
- No product code was changed. These notes are recommendations and evidence for planning, not a conformance certification or legal interpretation of any standard/license.
