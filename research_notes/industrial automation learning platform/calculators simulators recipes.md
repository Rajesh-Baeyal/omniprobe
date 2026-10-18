# Industrial automation learning platform: calculators, simulators, recipes, and path guidance

Research date: 2026-10-19

Scope: a proposal for deterministic, browser-safe calculators and simulators that help a commissioning engineer reason about industrial automation, robotics, motion, dispensing, pneumatics, thermal/power, and machine vision. The formulas below are educational engineering models. They are not a substitute for a machine builder's calculations, a risk assessment, a qualified engineer, a validated instrument, or a safety-rated controller. Any result that could affect motion, pressure, heat, electrical energy, guarding, or product release must be labeled **educational estimate only** and blocked from direct actuation.

## Which calculations and tools are genuinely useful during commissioning?

### Takeaway

The highest-value tools are the ones that turn a commissioning observation into a bounded, testable question: “When will the part arrive?”, “Can this pose be reached?”, “How much of the cycle is communication?”, “What dose should I expect?”, “How many millimeters does one pixel represent?”, and “Which recipe revision produced this result?” A browser implementation should make the units, coordinate frames, timing assumptions, measured values, and uncertainty visible instead of returning a single unexplained number.

Stanford’s open robotics material explicitly groups spatial descriptions, homogeneous transforms, forward kinematics, Jacobians, trajectory generation, and control as foundational topics; OMPL shows the complementary role of state spaces, sampling-based planners, collision checking, and benchmarking. These are good boundaries for an educational path-guidance and robotics module. [Stanford CS223A](https://see.stanford.edu/Course/CS223A) [OMPL](https://ompl.kavrakilab.org/)

### Commissioning priority map

| Priority | Tool family | Why it earns a place in OmniProbe | Main commissioning question | Output that should be shown |
|---|---|---|---|---|
| 1 | Units, dimensions, and limit checks | Unit mistakes are common and can propagate silently through motion, pressure, power, and vision calculations. NIST describes the SI base and derived units and stresses consistent SI writing for technical communication. [NIST SI Units](https://www.nist.gov/pml/owm/metric-si/si-units) | “Did I enter mm or m, gauge or absolute pressure, rpm or rad/s?” | Normalized SI value, dimensional check, conversion trace, warning for ambiguous units |
| 1 | Coordinate-frame and 2D affine tools | A frame or sign error can look like a bad calibration or a bad robot. Stanford teaches spatial descriptions and homogeneous transforms; the USF machine-vision text describes affine mappings and pixel/world coordinate systems. [Stanford CS223A](https://see.stanford.edu/Course/CS223A) [USF Machine Vision, Chapter 12](https://cse.usf.edu/~r1k/MachineVisionBook/MachineVision.files/MachineVision_Chapter12.pdf) | “What does this point mean in this frame?” | Frame graph, transform matrix, inverse, determinant/orthogonality checks, residuals |
| 1 | Motion profile and path-time estimator | It lets a technician compare a commanded move with the measured cycle and identify whether distance, velocity, acceleration, settling, or controller overhead dominates. Stanford’s trajectory material covers linear interpolation and polynomial trajectory planning. [Stanford CS223A](https://see.stanford.edu/Course/CS223A) | “Can the required move fit inside the takt time?” | Trapezoidal/triangular profile, peak speed, acceleration time, estimated duration, jerk disclaimer |
| 1 | Conveyor timing and tracking | It turns encoder speed, trigger position, sensor delay, and scan jitter into an arrival window and a pick/fire position. It should expose timing margin rather than hide it. | “Where will the part be when the output fires?” | Nominal position/time, earliest/latest window, latency budget, missed-trigger risk |
| 1 | PLC and network timing | Rockwell’s DH-485 application note treats node count, gaps, baud timing, and program scan time as contributors to worst-case throughput. Beckhoff’s serial documentation similarly relates effective transfer rate to PLC cycle time and bits per byte. [Rockwell DH-485 timing application note](https://literature.rockwellautomation.com/idc/groups/literature/documents/ap/1747-ap001_-en-p.pdf) [Beckhoff TF6340 Serial Communication](https://download.beckhoff.com/download/document/automation/twincat3/TF6340_TC3_Serial_Communication_EN.pdf) | “Is the timeout caused by wire time, scan time, arbitration, or application logic?” | Timeline, wire time, scan-phase range, timeout margin, queue/backlog estimate |
| 1 | Dose, pressure, flow, pump, and thermal estimates | These models support first-pass commissioning and experiment planning, while measured calibration remains the authority for real fluid behavior. | “What volume or heat should this setting produce?” | Ideal value, calibrated value if available, sensitivity to pressure/temperature/viscosity, domain-review flag |
| 1 | Camera FOV, pixel scale, exposure blur, and calibration | The OSTI machine-vision specification material gives FOV and pixel-resolution relationships; EMVA 1288 defines a disciplined framework for camera performance measurements; OpenCV documents camera calibration. [OSTI camera specification presentation](https://www.osti.gov/servlets/purl/2203388) [EMVA 1288](https://www.emva.org/wp-content/uploads/EMVA1288Linear_4.0Release.pdf) [OpenCV calibration](https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html) | “Can this camera resolve and freeze the feature?” | FOV, mm/pixel, minimum feature size, exposure blur, calibration residual, saturation warning |
| 1 | Tolerance and error-budget worksheet | BIPM’s GUM is the primary metrology reference for measurement models and uncertainty expression. [BIPM JCGM publications](https://www.bipm.org/en/committees/jc/jcgm/publications) | “Does the measurement capability support the tolerance?” | Worst-case bound, RSS estimate, repeatability, bias, confidence/coverage note |
| 1 | Immutable recipe/version manager | ISA88 describes batch-control terminology, data structures, physical/functional models, and recipe-management relationships. It is a useful conceptual source even for discrete machines that use product recipes. [ISA88: Batch Control](https://www.isa.org/isa88) | “Which exact settings, calibration, and software revision made this unit?” | Version, hash, effective time, diff, approval state, calibration references, rollback |
| 2 | Simple robot reach and FK/IK | A small 2-link model teaches reachability, elbow branches, singularity, and frame conventions without pretending to model a production robot. [Stanford CS223A](https://see.stanford.edu/Course/CS223A) | “Is this target geometrically reachable before I touch a real robot?” | Reach annulus, joint solutions, FK verification, joint-limit warning |
| 2 | CAN bus-load worksheet | Beckhoff recommends checking CANopen loading and explains that cyclic and event-driven traffic have different reserve requirements. [Beckhoff PDO parameterization](https://infosys.beckhoff.com/content/1033/cx2500_m510_b510/2306699915.html) | “Is the nominal load acceptable, and what happens during a burst?” | Per-message utilization, total nominal/worst-case load, arbitration delay, reserve |
| 2 | TCP/UDP packet-timing explainer | TCP is a reliable, in-order byte stream with retransmission and sequence numbers; UDP is a datagram protocol with different delivery semantics. [IETF RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html) [IETF RFC 768](https://www.rfc-editor.org/rfc/rfc768) | “What does a packet-time estimate include, and what does it not include?” | Serialization time, protocol overhead, RTT/jitter/loss scenario, explicit end-to-end disclaimer |
| 2 | Fault-injection simulators | A deterministic simulator can reproduce timing, frame, calibration, and recipe faults without connecting to equipment. OSHA notes that robot incidents often occur during non-routine programming, maintenance, testing, setup, or adjustment, so training should make those states visible. [OSHA Robotics](https://www.osha.gov/robotics) | “Can I recognize the failure signature before commissioning?” | Seeded replay, event timeline, expected vs observed, root-cause hints |

### Proposed calculator catalog

Each calculator should be a small “model card” with the same visible sections: **purpose**, **terminology**, **required inputs**, **formula/model**, **outputs**, **assumptions**, **validation ranges**, **worked example**, **measured-value comparison**, and **safety/domain-review status**. The following catalog is the minimum useful set.

#### 1. Unit and dimensional-analysis calculator

* Inputs: quantity, source unit, target unit, optional density, pressure basis (gauge or absolute), temperature scale, angle convention, and display precision.
* Outputs: converted value, conversion chain, dimensional signature such as `m/s`, and warnings for mixed dimensions.
* Useful commissioning exercise: enter a conveyor speed as `600 mm/s`, a camera working distance as `300 mm`, and a dose as `0.05 mL`; compare the normalized SI values with an intentionally incorrect `600 m/s`, `0.3 m`, and `50 mL` entry.
* Validation: reject non-finite numbers and unknown units; require an explicit choice between °C and K when a thermodynamic equation is used; require gauge/absolute selection for gas-law or pressure-ratio models. NIST provides the SI base/derived-unit foundation for this normalization. [NIST SI Units](https://www.nist.gov/pml/owm/metric-si/si-units)

#### 2. Motion/path-planning basics

* Inputs: start/end pose, path type (joint-space or Cartesian), maximum velocity, acceleration, optional jerk, waypoint list, obstacle polygons/boxes, clearance, and controller sample time.
* Outputs: path length, estimated motion time, sampled trajectory, velocity/acceleration plots, closest obstacle distance, and a list of assumptions.
* Safe browser behavior: render a path and a controller-agnostic estimate; never produce a controller download, enable command, safety bypass, or “safe to run” verdict. OMPL’s documentation is a useful distinction: planners need state spaces and planning algorithms, while collision checking and visualization are additional system components. [OMPL](https://ompl.kavrakilab.org/)
* Teaching point: distinguish **configuration**, **path**, **trajectory**, **velocity**, **acceleration**, **jerk**, **look-ahead**, **settling**, **workspace**, and **configuration space**. Stanford’s trajectory-planning lectures provide a citable educational progression from linear interpolation to polynomial trajectories. [Stanford CS223A](https://see.stanford.edu/Course/CS223A)

#### 3. Coordinate-transform and frame-chain tool

* Inputs: named frames, translation vectors, rotation angle/axis or matrix/quaternion, point/vector type, and transform order.
* Outputs: forward and inverse homogeneous transforms, transformed points, frame graph, and convention checks.
* Teaching point: show that a point and a direction vector transform differently; show the active/passive and row/column convention explicitly; display degrees/radians and handedness.
* Commissioning use: check camera-to-fixture, fixture-to-robot, tool-center-point, and conveyor-frame mappings before investigating the robot program.

#### 4. Simple reach, forward-kinematics, and inverse-kinematics tool

* Inputs: two link lengths, joint angles or target `(x,y)`, joint limits, elbow branch, and optional tool offset.
* Outputs: FK pose, IK branches, reach annulus, joint-limit status, singularity warning, and FK residual after IK.
* Teaching point: explain that multiple IK solutions can exist and that a geometric solution is not a collision, load, cable-routing, or controller feasibility proof. Stanford’s course materials cover DH parameters, forward kinematics, Jacobians, singularities, and trajectory planning. [Stanford CS223A](https://see.stanford.edu/Course/CS223A)

#### 5. Conveyor timing and tracking tool

* Inputs: trigger position, target position, belt speed or encoder scale/counts, product length/spacing, sensor delay, output delay, PLC task period, scan jitter, and optional acceleration.
* Outputs: nominal arrival time/position, earliest/latest arrival, fire window, encoder counts to target, and timing margin.
* Teaching point: separate **physical travel time** from **sensor latency**, **PLC phase**, **communication delay**, **actuator delay**, and **settling time**. The learner should be able to disable each term and see its contribution.

#### 6. Cycle-time and OEE tool

* Inputs: planned production time, run time, stop time, ideal cycle time, total count, good count, scrap/rework count, and optional reason codes.
* Outputs: availability, performance, quality, OEE, loss waterfall, and sensitivity to downtime/speed/quality.
* Teaching point: OEE is a diagnostic decomposition, not a universal machine capability number. Define the plant’s planned-time, microstop, ideal-cycle, good-count, and rework policies in the recipe/configuration.

#### 7. PLC scan and event-capture tool

* Inputs: task period, input update time, program execution time, communication service time, output update time, asynchronous task period, and input pulse width.
* Outputs: best/nominal/worst event latency, chance of missing a cyclically sampled pulse under a simple phase model, and a timeline showing where the signal is observed.
* Teaching point: **scan time**, **task period**, **I/O update**, **event task**, **latch**, and **timestamp** are not interchangeable. Rockwell’s network-throughput note makes scan time an explicit part of a worst-case communication calculation. [Rockwell DH-485 timing application note](https://literature.rockwellautomation.com/idc/groups/literature/documents/ap/1747-ap001_-en-p.pdf)

#### 8. Serial wire-time calculator

* Inputs: payload bytes, framing bytes, start bits, data bits, parity bits, stop bits, baud rate, request/response sizes, turnaround, and PLC/service period.
* Outputs: bits per character, transmit time, response time, transaction time, and timeout margin.
* Teaching point: **baud** is not automatically equal to useful payload bytes per second. Beckhoff documents `LB = start + data + parity + stop` and shows that effective transfer rate can also be constrained by PLC-cycle and terminal-buffer behavior. [Beckhoff TF6340 Serial Communication](https://download.beckhoff.com/download/document/automation/twincat3/TF6340_TC3_Serial_Communication_EN.pdf)

#### 9. TCP/UDP packet-timing simulator

* Inputs: payload bytes, IP version, transport, link rate, RTT, jitter, loss, retransmission timeout, connection reuse, and application timeout.
* Outputs: one-way serialization estimate, handshake/RTT scenario, retransmission timeline, packet/byte counters, and explicit “not included” items such as switch queues and OS scheduling.
* Teaching point: TCP is a reliable in-order byte stream and has sequence/acknowledgment/retransmission behavior; UDP is a datagram transport with different reliability semantics. [IETF RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html) [IETF RFC 768](https://www.rfc-editor.org/rfc/rfc768)

#### 10. CAN bus-load and arbitration simulator

* Inputs: CAN/CAN-FD mode, nominal/data bit rate, identifier type, DLC, message period, priority/identifier, burst messages, and error/retry assumptions.
* Outputs: per-message utilization, total nominal and burst load, arbitration delay by priority, and a queue timeline.
* Teaching point: distinguish bus occupancy from application reaction time. Beckhoff notes that cyclic synchronous traffic has predictable loading, while event-driven traffic needs worst-case analysis; it gives 70–80% as a possible range for cyclic operation and 30–40% base loading as a rule of thumb for event-driven reserve, while emphasizing that application analysis is still required. [Beckhoff PDO parameterization](https://infosys.beckhoff.com/content/1033/cx2500_m510_b510/2306699915.html)

#### 11. Pneumatic force, pressure, and flow estimator

* Inputs: cylinder bore, rod diameter, gauge pressure, back pressure, stroke, cycle frequency, valve/orifice data, hose length, and vendor flow coefficient if available.
* Outputs: ideal cap-side/rod-side force, estimated travel time, air-volume estimate, and a warning that actual compressed-air flow needs component data and testing.
* Teaching point: **gauge vs absolute pressure**, **force vs available force**, **free-air delivery**, **actual volume**, **flow coefficient**, **pressure drop**, **meter-in/meter-out**, and **compressibility**.

#### 12. Dispensing volume and dose-timing tool

* Inputs: target volume or mass, measured/calibrated flow, density, pressure, valve-open delay, dispense duration, shutoff tail, and number of shots.
* Outputs: ideal dose time, shot volume, mass, total material, estimated tail contribution, and calibration residual.
* Teaching point: the first formula is `V = Q t`; it is a planning relationship, not a promise that a pressure-driven or viscous process will remain at constant `Q`.

#### 13. Pump, hydraulic-power, and thermal-load estimator

* Inputs: pressure rise, flow, density, efficiency, voltage/current, heat capacity, mass, temperature rise, heat-loss estimate, and time.
* Outputs: hydraulic power, input power, stored heat, heating/cooling power, estimated energy, and thermal margin.
* Teaching point: **hydraulic power**, **shaft/input power**, **efficiency**, **heat capacity**, **thermal resistance**, **time constant**, and **steady state** should be shown as different concepts.

#### 14. Camera FOV, pixel-resolution, exposure, and lighting worksheet

* Inputs: sensor width/height, pixel dimensions, focal length, working distance, object speed, allowed blur in pixels, exposure time, gain, aperture, and lighting geometry.
* Outputs: FOV, millimeters/pixel, minimum feature sampling, motion blur, exposure limit, and a measurement plan.
* Teaching point: sensor resolution is not the same as measurement accuracy; lighting, focus, lens distortion, contrast, calibration, and repeatability matter. The OSTI material explicitly presents FOV and pixel-resolution equations, while EMVA 1288 provides a framework for camera sensitivity/noise measurements. [OSTI camera specification presentation](https://www.osti.gov/servlets/purl/2203388) [EMVA 1288](https://www.emva.org/wp-content/uploads/EMVA1288Linear_4.0Release.pdf)

#### 15. Calibration and 2D affine-transform tool

* Inputs: at least three non-collinear reference point pairs for a 2D affine fit, optional holdout points, units, and lens-distortion model choice.
* Outputs: six affine coefficients, inverse mapping, residual vector/RMS, maximum residual, condition warning, and a suggestion to use a distortion-aware camera model when residuals are spatially structured.
* Teaching point: an affine transform models linear terms plus translation; it can represent translation, rotation, scaling, shear, and nonuniform scale, but not general lens distortion. The USF text describes this distinction and OpenCV documents calibration models and reprojection error. [USF Machine Vision, Chapter 12](https://cse.usf.edu/~r1k/MachineVisionBook/MachineVision.files/MachineVision_Chapter12.pdf) [OpenCV calibration](https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html)

#### 16. Tolerance and error-budget tool

* Inputs: measurement model, nominal values, sensitivity coefficients, specification limits, calibration uncertainty, repeatability, resolution, bias, and correlations.
* Outputs: worst-case bound, RSS estimate for independent components, sensitivity ranking, and a traceable uncertainty budget.
* Teaching point: **accuracy**, **precision**, **repeatability**, **reproducibility**, **bias**, **resolution**, **tolerance**, and **uncertainty** are different terms. Use BIPM GUM as the metrology anchor. [BIPM JCGM publications](https://www.bipm.org/en/committees/jc/jcgm/publications)

#### 17. Recipe/version-management tool

* Inputs: product, station, machine, fixture, material lot, parameters with units and bounds, calibration IDs, software/firmware versions, operator, reason for change, and approval policy.
* Outputs: immutable revision, human-readable diff, machine-readable canonical form, content hash, effective interval, approval/audit history, and rollback candidate.
* Teaching point: a recipe is a controlled set of parameters and context, not just a bag of numbers. ISA88’s stated scope includes terminology, data structures, physical/functional models, and relationships among recipe management, scheduling, sequential control, regulatory control, and safety interlocks. [ISA88: Batch Control](https://www.isa.org/isa88)

## Which formulas can be implemented safely, and which require domain review?

### Takeaway

Deterministic arithmetic, unit conversion, geometry, timing budgets, and visualization are safe to implement as educational estimates when inputs are bounded and assumptions are explicit. Models involving real-world safety, compressed gases, pressure vessels, thermal runaway, electrical fault energy, robot collision avoidance, machine guarding, or product-quality release require domain review and measured validation. OSHA specifically warns that robot incidents commonly occur during non-routine operation such as programming, maintenance, testing, setup, and adjustment; the platform should therefore treat those states as training scenarios rather than as evidence of safe operation. [OSHA Robotics](https://www.osha.gov/robotics)

### Common implementation contract

Every model should use this contract:

1. Normalize inputs to SI internally, retain the user-entered values for audit, and show the conversion trace. NIST lists the SI base units and how derived units such as area, volume, velocity, and acceleration are formed. [NIST SI Units](https://www.nist.gov/pml/owm/metric-si/si-units)
2. Reject non-finite values, divide-by-zero cases, impossible geometry, negative absolute pressure, negative mass, negative time, and unknown unit dimensions.
3. Distinguish a **hard physical/domain constraint** from a **teaching range**. A teaching range is not a component rating.
4. Return a result status: `valid`, `valid-with-assumptions`, `out-of-range`, `insufficient-inputs`, or `domain-review-required`.
5. Show both nominal and sensitivity results. A single rounded number hides whether the answer changes materially with one uncertain input.
6. Keep calculators pure and deterministic. A simulator may use a fixed random seed, but the seed and all injected faults must be part of the run record.
7. Never infer that a computed result authorizes a motion, pressure, heater, electrical, or safety action. The UI must say “educational estimate only” where relevant.

### Formula cards

#### A. Unit-safe motion profile

For a one-dimensional move of distance `d` with a symmetric acceleration limit `a` and velocity limit `v_max`, a simple trapezoidal/triangular model is:

```text
d_accel = v_max² / (2a)
t_accel = v_max / a

if d >= 2 d_accel:
    t_total = 2 t_accel + (d - 2 d_accel) / v_max
    v_peak = v_max
else:
    v_peak = sqrt(a d)
    t_total = 2 sqrt(d / a)
```

Inputs: `d [m]`, `a [m/s²]`, `v_max [m/s]`. Outputs: `v_peak [m/s]`, acceleration time [s], cruise time [s], total time [s]. Assumptions: point mass, constant acceleration, no jerk, no load-dependent servo behavior, no corner blending, no settling. This is suitable for a planning lesson and a first cycle-time estimate; it is not a drive-sizing or safety-stopping calculation. Stanford’s course includes trajectory generation and polynomial/linear planning topics, which support teaching the distinction between a geometric path and a time-parameterized trajectory. [Stanford CS223A](https://see.stanford.edu/Course/CS223A)

Worked example: `d=1.0 m`, `a=2.0 m/s²`, `v_max=1.0 m/s`. `d_accel=0.25 m`, so the move is trapezoidal; `t_accel=0.5 s`, cruise distance is `0.5 m`, cruise time is `0.5 s`, and `t_total=1.5 s`. Validation: `d>0`, `a>0`, `v_max>0`; warn if jerk, motor torque, payload, braking, or controller limits are not supplied.

#### B. 2D homogeneous transforms

For a 2D point represented as `[x, y, 1]ᵀ`:

```text
T_A_to_B = [ cosθ  -sinθ  tx ]
            [ sinθ   cosθ  ty ]
            [   0      0    1 ]

p_B = T_A_to_B p_A
```

Inputs: angle [rad or °, explicitly selected], translation `[tx,ty] [m]`, point `[x,y] [m]`. Outputs: transformed point, inverse transform, determinant and orthogonality checks. The rotation block should satisfy `RᵀR≈I` and `det(R)≈1`; validate these numerically rather than assuming the user’s matrix is a rotation. Stanford’s material includes rotation matrices, translations, homogeneous transforms, and compound transformations. [Stanford CS223A](https://see.stanford.edu/Course/CS223A)

Worked example: `θ=90°`, `t=(10,5) mm`, `p_A=(1,2) mm`. The rotated point is `(-2,1) mm`; adding translation gives `p_B=(8,6) mm`. Validation: show the transform order and frame names; reject an unnamed or ambiguous transform chain.

#### C. Simple two-link FK/IK and reach

For link lengths `l1`, `l2` and joint angles `θ1`, `θ2`:

```text
x = l1 cos(θ1) + l2 cos(θ1+θ2)
y = l1 sin(θ1) + l2 sin(θ1+θ2)

c2 = (x²+y²-l1²-l2²)/(2 l1 l2)
θ2 = ± acos(c2)
θ1 = atan2(y,x) - atan2(l2 sin(θ2), l1+l2 cos(θ2))
```

The geometric reach condition is `|l1-l2| ≤ sqrt(x²+y²) ≤ l1+l2`. Inputs: lengths [m], angles [rad], target [m], joint limits [rad]. Outputs: one or two IK branches, FK residual [m], reach/singularity/joint-limit status. Assumptions: planar rigid links, ideal joints, no thickness, no collision, no payload, no cable/hosing, no motor limits. Stanford covers forward kinematics, DH parameters, Jacobians, and singularities. [Stanford CS223A](https://see.stanford.edu/Course/CS223A)

Worked example: `l1=0.4 m`, `l2=0.3 m`, target `(0.5,0) m`. `c2=0`, so `θ2=±90°`. For the positive branch, `θ1=-atan2(0.3,0.4)≈-36.87°`; FK should return the target within rounding. Validation: clamp `c2` only for tiny floating-point excursions; report a true out-of-reach target instead of silently clamping it.

Safety/domain-review flag: a reach result is not a safe robot motion. Collision, speed/force limiting, singularity handling, workspace fencing, safe positions, and risk reduction belong to the robot application and safety process. OSHA’s robotics material should be linked directly from any path-guidance screen. [OSHA Robotics](https://www.osha.gov/robotics)

#### D. Conveyor arrival and trigger compensation

For constant belt speed:

```text
t_travel = (x_target - x_trigger) / v
x_delay = v (t_sensor + t_PLC + t_network + t_output)
x_fire = x_target - x_delay
```

For a rotary encoder:

```text
v = π D (rpm / 60)
counts_to_target = distance × counts_per_meter
```

Inputs: distance [m], speed [m/s], delays [s], encoder scale [counts/m]. Outputs: nominal position/time and a window using delay bounds. Assumptions: constant speed, no belt slip, no acceleration, no product movement relative to belt, and independent additive latency terms. Validation: require `x_target>x_trigger`; warn when acceleration or slip is material.

Worked example: `0.75 m` between sensor and pick at `0.5 m/s` gives `1.5 s` travel. If measured sensor/output delay is `20 ms` total, compensation distance is `0.010 m`, so the nominal fire position is `10 mm` upstream. The exercise should then add ±1 PLC scan and show the resulting window rather than presenting `10 mm` as an exact answer.

Domain-review flag: a real pick/place or dispense trigger may be safety- or quality-critical. Require an observed encoder/sensor trace and controller-specific validation.

#### E. Cycle time and OEE

Use the conventional decomposition:

```text
Availability = Run Time / Planned Production Time
Performance  = Ideal Cycle Time × Total Count / Run Time
Quality      = Good Count / Total Count
OEE          = Availability × Performance × Quality
```

Inputs: planned time [s], run time [s], ideal cycle [s/part], total count [parts], good count [parts]. Outputs: fractions and percentages, loss waterfall. Validation: `0≤good≤total`, `run≤planned`, all denominators positive. The formulas are deterministic, but site definitions for planned stops, microstops, speed loss, rework, and ideal cycle need agreement; put those definitions in the recipe/configuration.

Worked example: planned `8 h=28,800 s`, downtime `30 min`, run `27,000 s`, `4,500` total, `4,410` good, ideal cycle `5 s`. Availability `=0.9375`; performance `=5×4500/27000≈0.8333`; quality `=4410/4500=0.98`; OEE `≈0.765`, or `76.5%`. The tool should explain that a higher OEE does not by itself prove safe or capable production.

#### F. PLC scan/event timing

A first-order cyclic model is:

```text
T_scan ≈ T_input_update + T_program + T_communications
          + T_output_update + T_system_overhead
```

For a signal sampled once per cycle, a simple phase-bound estimate is an observation latency in `[0, T_scan]` before the next scan, plus the configured output and device delays. A pulse shorter than the sampling interval can be missed unless a hardware latch, event task, or timestamped input is used. This is a teaching model, not a vendor guarantee; Rockwell’s DH-485 note demonstrates why program scan time participates in network response timing. [Rockwell DH-485 timing application note](https://literature.rockwellautomation.com/idc/groups/literature/documents/ap/1747-ap001_-en-p.pdf)

Inputs: task period [s], execution-time distribution [s], I/O update [s], pulse width [s]. Outputs: nominal/worst latency, missed-pulse warning, and an event timeline. Validation: do not call a pulse “captured” without a controller/input-module specification or measured trace.

#### G. Serial wire time

For an asynchronous serial character:

```text
bits_per_character = start_bits + data_bits + parity_bits + stop_bits
t_wire = characters × bits_per_character / baud
t_transaction ≈ t_request_wire + turnaround + t_response_wire
                 + PLC/service delays
```

Inputs: bytes/characters, framing, baud [bit/s], request/response sizes, turnaround [s]. Outputs: bit count, wire time, effective payload rate, timeout margin. Worked example: `20` characters at `9600 baud`, `8N1` gives `10 bits/character`, `200 bits`, and `20.83 ms` of one-way wire time before device and PLC delays. Beckhoff documents the bits-per-byte relationship and shows that its terminal modes add cycle/buffer constraints; therefore a browser calculator must offer both the ideal wire model and a controller/terminal model. [Beckhoff TF6340 Serial Communication](https://download.beckhoff.com/download/document/automation/twincat3/TF6340_TC3_Serial_Communication_EN.pdf)

Validation: reject baud `≤0`; make parity/stop bits explicit; add protocol framing, CRC, inter-character timeout, and device processing only when specified.

#### H. TCP/UDP packet timing

For a lower-bound serialization estimate:

```text
t_serialization = 8 × (payload + IP_header + transport_header) / link_rate
```

For a reused TCP connection, an application-level estimate may include serialization, queueing, one or more RTTs, receiver processing, and retransmission scenarios. A new TCP connection adds connection-establishment behavior. TCP provides reliable in-order byte-stream behavior with sequence numbers, acknowledgments, checksums, and retransmission; RFC 9293 is the primary protocol source. [IETF RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html) UDP is specified separately as a datagram protocol. [IETF RFC 768](https://www.rfc-editor.org/rfc/rfc768)

Worked example: a `100-byte` payload with `20-byte IPv4` and `20-byte TCP` headers over `100 Mbit/s` has a serialization lower bound of `140×8/100,000,000=11.2 µs`; this is not end-to-end latency. The tool must label Ethernet framing, switch queues, OS scheduling, application parsing, and TCP congestion/retransmission as omitted unless modeled.

Validation: payload must fit the selected application/transport limits; show a scenario distribution rather than one “TCP latency” number when RTT, loss, or queues are present.

#### I. CAN bus load and arbitration

For a first-order periodic-load model:

```text
U_total = Σ (frame_bits_i × message_rate_i) / bus_bit_rate
```

`frame_bits` must be selected from the actual CAN/CAN-FD frame format and should include a configurable bit-stuffing and inter-frame allowance. Inputs: frame format, DLC, identifier, bit rates, period, and burst count. Outputs: utilization, per-message contribution, arbitration delay order, and burst queue.

Worked teaching example: if a simplified model uses `133 bits/frame`, `100 frames/s`, and `500 kbit/s`, the contribution is `13,300/500,000=2.66%`; the UI must label `133` as an assumption and offer an exact frame calculator. Beckhoff emphasizes that cyclic and event-driven traffic have different loading behavior, and that a nominal load number does not remove the need for worst-case analysis. [Beckhoff PDO parameterization](https://infosys.beckhoff.com/content/1033/cx2500_m510_b510/2306699915.html)

Validation: require an explicit bus type and frame format; warn at configurable teaching thresholds but do not present 70%, 80%, or any other threshold as a universal acceptance rule. Beckhoff’s own discussion treats the appropriate reserve as application-dependent. [Beckhoff PDO parameterization](https://infosys.beckhoff.com/content/1033/cx2500_m510_b510/2306699915.html)

#### J. Pneumatic force and flow

For a first-order cylinder force estimate:

```text
A_bore = π D² / 4
A_rod  = π (D² - d_rod²) / 4
F_cap  ≈ p_gauge A_bore - friction - back_pressure_force
F_rod  ≈ p_gauge A_rod  - friction - back_pressure_force
```

Inputs: gauge pressure [Pa], bore/rod [m], friction estimate [N], back pressure [Pa], stroke [m], and vendor flow data. Outputs: ideal/derated force [N], piston volume [m³], and a travel-time estimate only when a component flow curve is supplied. Worked example: `D=32 mm`, `p=0.6 MPa`, ignoring losses gives `A≈8.04×10⁻⁴ m²` and `F≈482 N`; this must be shown as ideal force, not rated payload.

For liquid flow, `Q=A v` and `V=Q t` are direct kinematic relationships. For compressed air, flow depends on pressure ratio, temperature, restriction geometry, choking, and component rating; do not substitute an incompressible liquid model without a domain-review banner. The tool should ask for a manufacturer flow coefficient/curve before producing a component-specific answer.

Domain-review flag: pressure, stored energy, cylinder force, hose failure, and unexpected motion can be safety-critical. OSHA’s robot hazard material is a minimum safety link; machine-specific pneumatic risk assessment remains outside OmniProbe. [OSHA Robotics](https://www.osha.gov/robotics)

#### K. Dispensing volume and dose timing

The simplest volume model is:

```text
V = Q t
t = V / Q
m = ρ V
V_piston = A_piston × stroke
```

Inputs: target volume [m³ or mL], measured/calibrated flow [m³/s or mL/s], density [kg/m³], piston area [m²], stroke [m], valve delay/tail [s]. Outputs: ideal dose time [s], volume [mL], mass [g], and total material per batch.

Worked example: target `50 µL = 0.05 mL`, calibrated flow `0.25 mL/s` gives `t=0.20 s` before valve delay and tail. If a measured shutoff tail is `5 µL`, show the corrected command volume as `45 µL` only as a calibration experiment; do not make it a universal correction.

Assumptions: stable material temperature, no bubbles, constant flow during the shot, stable valve/pump response, and a valid calibration. Validate by weighing or volumetric measurement across a designed sample set. Any pressure-to-flow or viscosity relationship should be marked **domain review required** and fitted to measured data rather than asserted from a generic formula.

#### L. Pump and hydraulic power

For a liquid pump first-pass estimate:

```text
P_hydraulic = Δp × Q
P_input ≈ P_hydraulic / η
H = Δp / (ρ g)
```

Inputs: pressure rise [Pa], flow [m³/s], efficiency `η`, fluid density [kg/m³], gravitational acceleration [m/s²]. Outputs: hydraulic power [W], estimated input power [W], head [m], and sensitivity to efficiency. Worked example: `Δp=200 kPa`, `Q=1.0×10⁻⁵ m³/s` gives `P_hydraulic=2 W`; with `η=0.5`, idealized input estimate is `4 W`.

Assumptions: steady flow, known pressure difference, no transient, and efficiency supplied by a pump curve. Validate against the pump curve, suction conditions, temperature, and motor/drive data. Do not use the result as a cavitation, pressure-vessel, motor-protection, or safety calculation.

#### M. Thermal energy and electrical power

For sensible heating/cooling:

```text
E = m c_p ΔT
P_load ≈ E / t
P_input ≈ P_load / η
```

For common electrical estimates:

```text
DC:             P = V I
single-phase AC: P ≈ V I PF
balanced 3-phase: P ≈ √3 V_line I PF
```

Inputs: mass [kg], heat capacity [J/(kg·K)], temperature change [K], time [s], efficiency, voltage/current, and power factor. Outputs: stored energy [J], load/input power [W], and a heat-loss sensitivity. Worked example: heating `2 kg` of water by `20 K` in `600 s`, using `c_p≈4180 J/(kg·K)`, requires `167,200 J` and `279 W` ideal load; at `80%` efficiency, input estimate is `349 W`.

Heat transfer through conduction, convection, radiation, phase change, insulation, and control dynamics is not captured by this simple model. Require material data and domain review for heaters, thermal chambers, batteries, power supplies, exposed surfaces, or fire/overtemperature hazards. NIST’s SI reference is the unit anchor; the UI should link the relevant heat-transfer educational reference selected by the domain reviewer rather than presenting a generic coefficient as universal. [NIST SI Units](https://www.nist.gov/pml/owm/metric-si/si-units)

#### N. Camera FOV, pixel scale, exposure blur, and lighting

For the thin-lens/far-field approximation used in a first worksheet:

```text
FOV_x ≈ sensor_width × working_distance / focal_length
FOV_y ≈ sensor_height × working_distance / focal_length
pixel_scale_x = FOV_x / pixels_x
pixel_scale_y = FOV_y / pixels_y
blur_pixels = object_speed × exposure_time / pixel_scale
```

Inputs: sensor dimensions [mm], focal length [mm], working distance [mm], pixels, speed [mm/s], exposure [s]. Outputs: FOV [mm], mm/pixel, and blur [pixels]. The OSTI material gives the same FOV and pixel-resolution relationships and an example using an `8.45 mm × 7.07 mm` sensor, `50 mm` lens, and `300 mm` object distance; it reports approximately `50.7 mm × 42.42 mm` FOV. [OSTI camera specification presentation](https://www.osti.gov/servlets/purl/2203388)

Worked example: with `50.7 mm` horizontal FOV and `2448` horizontal pixels, scale is about `0.0207 mm/pixel`. At `500 mm/s`, allowing `0.5 pixel` blur gives an exposure limit around `20.7 µs`. The result ignores readout/shutter behavior, lens distortion, focus, vibration, illumination, gain, and sensor noise.

EMVA 1288 is appropriate for teaching that camera sensitivity, noise, linearity, dark signal, temperature, gain, offset, and calibration conditions must be specified; the standard describes controlled measurement conditions rather than a single universal “good exposure.” [EMVA 1288](https://www.emva.org/wp-content/uploads/EMVA1288Linear_4.0Release.pdf)

#### O. 2D affine calibration and residuals

Use:

```text
X = a x + b y + c
Y = d x + e y + f
```

Inputs: pixel points `(x,y)`, reference points `(X,Y)`, units, and optional holdout points. Outputs: coefficients, inverse, residual per point, RMS residual, maximum residual, and spatial residual plot. Three non-collinear point pairs are the minimum for six affine coefficients; more points permit a least-squares fit and validation split. The USF machine-vision text defines affine transformation as a linear transformation plus translation and distinguishes it from nonlinear warping; OpenCV documents camera-calibration and reprojection-error tools. [USF Machine Vision, Chapter 12](https://cse.usf.edu/~r1k/MachineVisionBook/MachineVision.files/MachineVision_Chapter12.pdf) [OpenCV calibration](https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html)

Worked example: a calibrated plate with scale `0.1 mm/pixel` and no skew maps `(120,80)` pixels to `(12,8) mm`. The application should not stop there: move the reference target, measure holdout residuals, and show whether the residual pattern indicates lens distortion, perspective, fixture tilt, or a bad point.

Validation: reject collinear point sets; warn on ill-conditioned fits; require a residual threshold set by the measurement requirement, not by a generic default. If the work plane is not planar or lens distortion is material, an affine fit is insufficient.

#### P. Tolerance and error budgets

For an output `y=f(x₁,...,xₙ)` with small independent standard uncertainties:

```text
u_c²(y) ≈ Σ (∂f/∂x_i)² u²(x_i)
```

For independent linear contributions, the common RSS form is `u_c≈sqrt(Σu_i²)`; a conservative bound for bounded independent errors is the sum of absolute bounds. Correlations require covariance terms; nonlinearity or non-Gaussian distributions may require a Monte Carlo method. BIPM JCGM publications provide the GUM and its Monte Carlo supplement, so the calculator should cite those methods and record which method was used. [BIPM JCGM publications](https://www.bipm.org/en/committees/jc/jcgm/publications)

Worked example: three independent `±0.05 mm` one-sigma contributors give an RSS estimate `sqrt(3×0.05²)=0.0866 mm`; a simple worst-case bound is `±0.15 mm`. The UI must not label `0.0866 mm` as a guaranteed limit or silently treat a specification tolerance as a standard deviation.

#### Q. Recipe revision and reproducibility model

Use a canonical record such as:

```text
RecipeRevision = {
  product_id, revision, parent_revision, status,
  parameters: [{name, value, unit, min, max, source}],
  machine_id, station_id, fixture_id, material_lot,
  calibration_ids, software_versions, created_by, created_at,
  reason, approval, content_hash
}
```

Recommended deterministic rules:

* Store every quantity with a unit and a declared semantic name; never infer a unit from a number.
* Canonicalize ordering and numeric formatting before hashing.
* Make revisions immutable after approval; corrections create a new revision.
* Record calibration IDs and the recipe revision in every simulator run and commissioning report.
* Make “effective from” and rollback behavior explicit; do not silently apply a newer recipe to an in-progress batch.
* Show a semantic diff that distinguishes a setpoint change, a limit change, a unit change, a calibration change, and a software change.
* Keep safety interlocks and safety-rated parameters outside ordinary operator-editable recipe fields unless the safety system and authorization model explicitly support them.

ISA88 is the relevant conceptual anchor for terminology, data structures, physical/functional models, and recipe-management relationships. Its standards are not a license to copy proprietary text into the application; use the public scope page and obtain the applicable standard for formal implementation review. [ISA88: Batch Control](https://www.isa.org/isa88)

### Formula safety classification

| Class | Suitable browser behavior | Examples | Required warning |
|---|---|---|---|
| A: deterministic educational arithmetic | Calculate, plot, export, and unit-check | Unit conversions, 2D transforms, FK/IK, ideal wire time, OEE decomposition | “Model assumptions shown; verify against equipment and site definitions.” |
| B: commissioning estimate | Calculate with measured-input comparison and sensitivity | Conveyor timing, scan latency, dose timing, FOV, affine residual, CAN load | “Estimate only; validate with trace, calibration, or vendor data.” |
| C: domain-reviewed engineering model | Permit only with named reviewer, model version, and component data | Pneumatic flow, pump curve, heat transfer, motor power, robot trajectory | “Domain review required; not a rating, signoff, or safe-to-run decision.” |
| D: safety-critical or regulated decision | Do not present as an automatic decision; link to procedures and require external signoff | E-stop/stopping distance, guard distance, pressure-vessel safety, thermal runaway, electrical fault energy, collision/safe-speed certification, product release | “Educational information only. Use the validated safety/quality process.” |

### Gaps and formulas needing domain review

* Exact compressed-air consumption requires component-specific flow data, pressure ratio, temperature, regulator behavior, piping, and duty cycle. The simple cylinder-force model is useful for vocabulary and a first estimate but not for sizing or safety.
* Exact pump performance requires the pump curve, fluid properties, suction conditions, system curve, transient behavior, and efficiency map. `Δp×Q` is only hydraulic power.
* Exact thermal behavior requires geometry, materials, convection/radiation, phase changes, controls, heat loss, sensor placement, and fault conditions. `mc_pΔT` is a stored-energy estimate.
* Exact robot path time and safety require the controller’s trajectory generator, payload/inertia, limits, singularity handling, blending, collision model, safe-motion functions, and measured validation.
* Exact TCP/UDP end-to-end time requires the actual network, OS, stack, queues, application behavior, and fault policy; RFC protocol semantics do not determine plant latency.
* Exact CAN frame occupancy depends on CAN/CAN-FD format, bit stuffing, data phase, inter-frame spacing, error frames, arbitration, and implementation. Nominal load is not a worst-case response guarantee.
* Exact camera measurement capability requires lens distortion, focus, illumination, sensor noise, calibration, fixture repeatability, temperature, and the measurement algorithm; pixel scale is not accuracy.
* Exact OEE requires plant-approved definitions for planned time, ideal cycle, microstops, rework, and count reconciliation.
* Exact recipe governance depends on the machine’s authorization, audit, validation, electronic-record, and quality-system requirements.

## How should each calculator teach terminology and show worked examples?

### Takeaway

The platform should behave like a transparent lab notebook: define the term immediately, show the equation with units, calculate one worked example, perturb one input, compare the estimate with a measurement, and save the exact model/version/inputs. The learning loop should end with a fault injection or a commissioning observation, not with a multiple-choice answer alone.

### Common browser-safe interaction pattern

Every tool should present the following sequence:

1. **Question:** “What commissioning question does this answer?”
2. **Terms:** a compact glossary with a link to the source used for the definition. For example, distinguish `path` from `trajectory`, `baud` from useful throughput, `FOV` from measurement accuracy, and `recipe revision` from a mutable parameter screen.
3. **Inputs:** grouped by geometry, timing, device, measurement, and configuration; every field has a unit, range, example value, and provenance label (`entered`, `measured`, `vendor data`, `assumed`).
4. **Formula:** render the symbolic formula before the result. Let the learner expand each term and see the unit algebra.
5. **Worked example:** show one complete numerical substitution with intermediate values and rounding only at the final display.
6. **Sensitivity:** use a slider or one-at-a-time perturbation to show which inputs dominate.
7. **Validation:** compare estimate vs measured trace or calibration sample; show residuals and pass/fail criteria chosen by the user.
8. **Fault injection:** inject one known error, predict the signature, then reveal the diagnosis after the learner commits an answer.
9. **Provenance:** save tool version, formula version, source URLs, unit conversions, inputs, seed, faults, and outputs.
10. **Safety boundary:** show the educational-only banner whenever a result concerns motion, force, pressure, heat, electrical energy, guarding, or quality release.

### Deterministic simulator design

* Use a fixed-step or explicitly event-scheduled simulation clock; display the clock resolution and event ordering.
* Use deterministic pseudo-randomness only for noise, jitter, loss, and drift; save the seed and fault profile.
* Separate physical state, controller state, I/O state, network state, and historian state so the learner can see causality.
* Render an event timeline with input edge, scan, network transmit, receive, logic decision, output update, and physical response.
* Keep browser sandboxes disconnected from real hardware by default. Do not expose serial, TCP, motion, PLC, camera, or actuator permissions from a lesson page.
* Provide replay and “change one variable” comparison. Two runs with the same seed and inputs must have identical outputs.
* Make all hidden approximations visible: time step, quantization, saturation, queue size, latency distribution, tolerance distribution, and rounding.

These are design inferences from the cited protocol, metrology, robotics, and safety sources: reliable learning requires the model boundary and the observed boundary to be visible. The recommendation is not a claim that a simulator is equivalent to the real controller or a safety validation.

### Fault injections that produce valuable learning

| Simulator | Useful parameters | High-value fault injections | Expected learning signature |
|---|---|---|---|
| Motion/path | path type, max velocity, acceleration, jerk, sample time, waypoint spacing, obstacle clearance, encoder scale | wrong sign, wrong frame, velocity saturation, acceleration clamp, backlash, encoder scale error, obstacle inserted, stale target | path is geometrically plausible but time/pose residual grows; singularity or clearance warning appears |
| Robot FK/IK | link lengths, joint limits, elbow branch, tool offset | unreachable target, `acos` domain error, branch switch, joint-limit violation, frame inversion | no solution, two distinct solutions, or FK residual exposes the wrong convention |
| Conveyor | belt speed, acceleration, trigger spacing, sensor delay, PLC period, output delay | missed edge, belt slip, speed step, scan jitter, delayed output, double trigger | fire position drifts, arrival window widens, or part association is lost |
| PLC scan | task period, execution distribution, input/output update, pulse width | pulse shorter than scan, overload, asynchronous task collision, stale input image | intermittent missed event; trace shows signal existed physically but not in the sampled image |
| Serial | baud, framing, payload, CRC, timeout, inter-byte gap | baud mismatch, parity error, truncated frame, delimiter in payload, delayed response, wrong endianness | framing errors, timeout, checksum failure, or a valid-looking but incorrect value |
| TCP/UDP | link rate, RTT, jitter, loss, reorder, duplication, connection reuse | packet loss, delayed ACK, retransmission, reconnect, UDP reorder/duplication, partial application message | TCP completion time tail grows; UDP application must sequence/deduplicate or lose state |
| CAN | bit rate, frame format, identifier priority, periods, queue depth | burst traffic, low-priority starvation, error frame, bus-off, node silence | load and arbitration delay rise; low-priority messages miss their intended deadline |
| Pneumatics | pressure, bore, rod, friction, valve response, hose volume, leakage | pressure droop, leak, blocked fitting, exhaust restriction, valve delay, sticky cylinder | force/arrival time changes; measured curve no longer matches ideal estimate |
| Dispensing | flow calibration, temperature, viscosity, valve delay, tail, bubbles | pressure decay, clogged tip, air bubble, tail increase, wrong density, recipe dose change | dose mean shifts, variation increases, tail creates systematic overfill |
| Pump/thermal/power | pressure, flow, efficiency, heat loss, ambient, sensor lag, current limit | blocked outlet, efficiency drop, heater overshoot, fan failure, sensor bias, power brownout | power/temperature trajectory separates from the ideal energy model |
| Vision | FOV, focus, exposure, gain, light intensity, object speed, calibration points | glare, shadow, blur, saturation, lens distortion, calibration point moved, illumination drift | threshold/edge moves, residual becomes spatially structured, or feature is undersampled |
| Tolerances | nominal, bounds, correlation, bias, repeatability, sample count | correlated errors, drift, outlier, underestimated bias, wrong unit | RSS understates the observed error; sensitivity ranking identifies the contributor |
| Recipes | revision graph, bounds, calibration IDs, approvals, hash | stale revision, unit changed, missing parameter, unauthorized edit, rollback, wrong fixture | deterministic diff identifies the cause; run record remains reproducible |

### Suggested educational exercises

1. **Unit trap:** convert `600 mm/s` to `m/s`, then intentionally enter `600 m/s`; require the dimensional/range warning.
2. **Frame chain:** transform a camera pixel-derived point through camera, fixture, and robot frames; reverse one transform and diagnose the residual.
3. **Affine calibration:** fit three points, test three holdout points, then move one calibration point and inspect the residual field.
4. **Two-link reach:** solve both elbow branches, apply joint limits, and verify each branch with FK.
5. **Motion timing:** compare triangular and trapezoidal profiles for three distances; add a settling time and explain why the estimate changes.
6. **Conveyor trigger:** calculate an arrival time, add one PLC scan of jitter, and choose a trigger compensation that covers the measured window.
7. **Cycle/OEE:** hold counts constant and vary only downtime, speed, or scrap; explain which OEE factor changed.
8. **PLC pulse capture:** inject a `3 ms` input pulse into a `10 ms` cyclic scan, then enable a hardware latch and compare the event trace.
9. **Serial timeout:** calculate a request/response transaction at `9600` and `115200 baud`; add a device processing delay and determine a timeout with margin.
10. **TCP vs UDP:** send the same logical message through loss/reorder scenarios; implement sequence numbers and compare application state.
11. **CAN arbitration:** create a high-priority periodic message and a low-priority burst; observe bus load and low-priority delay.
12. **Pneumatic ideal vs measured:** calculate ideal cylinder force, then add friction and back pressure; compare with a measured force trace.
13. **Dose calibration:** estimate a `50 µL` dose, collect ten virtual shots with a small flow drift and tail, and report mean, standard deviation, bias, and correction candidate.
14. **Pump/thermal budget:** calculate hydraulic power and heater power, then inject efficiency and heat-loss changes; identify which measurement would discriminate the causes.
15. **Camera blur:** calculate the exposure limit for a moving part, exceed it by 5×, and compare a sharpness/edge-location proxy.
16. **Calibration model choice:** fit an affine mapping to points with lens distortion; inspect the spatial residual and explain why a higher-order/camera model is needed.
17. **Error budget:** compare worst-case and RSS estimates; add a correlated fixture error and explain why the independent RSS result is no longer sufficient.
18. **Recipe lineage:** create revisions `A`, `B`, and `C`, change one setpoint and one unit, approve `B`, roll back to `A`, and prove that a run record references the correct calibration and formula version.
19. **Commissioning report:** export a deterministic run with inputs, measured trace, faults, residuals, warnings, and source links; have a reviewer reproduce it from the saved record.

### Path-guidance product behavior

The path-guidance screen should show a coordinate-frame tree, reachable/invalid target status, sampled path, clearance visualization, estimated timing, and the unmodeled assumptions. It may recommend diagnostic next steps such as “verify tool frame,” “measure conveyor speed,” “capture scan trace,” or “repeat calibration on holdout points.” It must not claim that a path is safe to execute, certify a robot, calculate an E-stop distance as a final answer, or bypass a safety-rated controller. OSHA’s observation that many robot accidents occur in non-routine modes is a strong reason to put setup, teach, maintenance, and test simulations into the curriculum. [OSHA Robotics](https://www.osha.gov/robotics)

### Recipe-management learning behavior

Teach recipe management with a small state machine: `draft → reviewed → approved → effective → retired`, with explicit transition records. Show the semantic diff first, then the numerical diff, then the simulated result. A lesson should make a unit change visible (`0.5 bar` versus `50 kPa`), mark stale calibration references, prevent approval when a required parameter is missing, and permit rollback only to an immutable prior revision. ISA88’s public scope supports teaching common terminology, data structure, physical/functional models, and recipe-management relationships; a production implementation should be reviewed against the applicable licensed standard and the site’s quality/authorization rules. [ISA88: Batch Control](https://www.isa.org/isa88)

### Acceptance checklist for the future implementation

* Every displayed result has a unit and a model/version identifier.
* Every formula card shows inputs, outputs, assumptions, validation ranges, and one worked example.
* Every domain-review formula has a visible reviewer/status field and cannot be presented as a rating or signoff.
* Every simulator run is deterministic from saved inputs, model version, and seed.
* Every fault injection has a named cause, parameter delta, expected signature, and replayable record.
* Every calibration and recipe result includes provenance, residuals/diffs, and the exact data used.
* Every motion, pressure, thermal, electrical, and robot lesson has an educational-only safety banner and a link to the relevant safety boundary.
* The browser experience uses no hardware permissions and cannot issue real machine commands.
