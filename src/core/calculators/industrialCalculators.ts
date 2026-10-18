import {
  CALCULATOR_IDS,
  evaluateCalculator,
  listCalculatorModels,
  registerCalculatorModels,
  type CalculatorCategory,
  type CalculatorEvaluation,
  type CalculatorId,
  type CalculatorInputDefinition,
  type CalculatorModel,
  type CalculatorOutputDefinition,
} from './calculatorModel'
import { type Unit } from './unitSystem'

export { CALCULATOR_IDS, evaluateCalculator, listCalculatorModels }
export type {
  CalculatorCategory,
  CalculatorEvaluation,
  CalculatorId,
  CalculatorInput,
  CalculatorInputDefinition,
  CalculatorModel,
  CalculatorResult,
  CalculatorStatus,
} from './calculatorModel'

const MODEL_VERSION = 'industrial-calculator/1.0.0'
const SOURCE_REFS = ['plan:2026-10-19-industrial-workbench-foundation', 'catalog:industrial-calculators'] as const

const input = (
  key: string,
  label: string,
  unit: Unit,
  exampleValue: number,
  description: string,
  options: Pick<CalculatorInputDefinition, 'required' | 'min' | 'max' | 'step'> = {},
): CalculatorInputDefinition => ({ key, label, unit, exampleValue, description, ...options })

const output = (key: string, label: string, unit: Unit, description: string): CalculatorOutputDefinition => ({ key, label, unit, description })

const quantity = (value: number | boolean | string, unit: Unit) => ({ value, unit })

const makeModel = (spec: Omit<CalculatorModel, 'modelVersion' | 'provenance' | 'safetyClass' | 'validationRange'>): CalculatorModel => ({
  ...spec,
  modelVersion: MODEL_VERSION,
  provenance: {
    source: 'OmniProbe deterministic industrial calculator catalog',
    sourceRefs: SOURCE_REFS,
    executionMode: 'SIMULATED',
    authority: 'READ_ONLY',
    deterministic: true,
  },
  safetyClass: 'educational',
  validationRange: Object.fromEntries(spec.inputDefinitions.map((definition) => [definition.key, {
    unit: definition.unit,
    min: definition.min,
    max: definition.max,
    description: definition.description,
  }])),
})

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))
const radians = (degrees: number): number => degrees * Math.PI / 180
const degrees = (radiansValue: number): number => radiansValue * 180 / Math.PI

const coordinateTransform = makeModel({
  id: 'coordinate_transform_2d',
  name: '2D Coordinate Transform',
  shortDescription: 'Rotate, scale, and translate a point in a planar frame.',
  category: 'motion',
  formula: 'x′ = s(cosθ·x − sinθ·y) + tx; y′ = s(sinθ·x + cosθ·y) + ty',
  assumptions: ['Right-handed planar coordinates are used.', 'Positive rotation is counter-clockwise.', 'Translation and point coordinates share the same length unit.'],
  inputDefinitions: [
    input('x', 'Point X', 'mm', 10, 'Input point X coordinate.', { min: -100000, max: 100000 }),
    input('y', 'Point Y', 'mm', 5, 'Input point Y coordinate.', { min: -100000, max: 100000 }),
    input('translationX', 'Translation X', 'mm', 5, 'Frame translation along X.', { min: -100000, max: 100000 }),
    input('translationY', 'Translation Y', 'mm', 2, 'Frame translation along Y.', { min: -100000, max: 100000 }),
    input('rotationDeg', 'Rotation', 'deg', 30, 'Planar frame rotation.', { min: -360, max: 360, step: 1 }),
    input('scale', 'Scale', '1', 1, 'Uniform scale factor.', { min: 0.000001, max: 100, step: 0.01 }),
  ],
  outputDefinitions: [
    output('transformedX', 'Transformed X', 'mm', 'Transformed point X coordinate.'),
    output('transformedY', 'Transformed Y', 'mm', 'Transformed point Y coordinate.'),
  ],
  workedExample: {
    title: 'Rotate a probe point into a station frame',
    inputs: { x: 10, y: 0, translationX: 5, translationY: 2, rotationDeg: 90, scale: 1 },
    expected: '(5 mm, 12 mm)',
  },
  evaluate: (values): CalculatorEvaluation => {
    const c = Math.cos(radians(values.rotationDeg))
    const s = Math.sin(radians(values.rotationDeg))
    return {
      outputs: {
        transformedX: quantity(values.scale * (c * values.x - s * values.y) + values.translationX, 'mm'),
        transformedY: quantity(values.scale * (s * values.x + c * values.y) + values.translationY, 'mm'),
      },
    }
  },
})

const robotTwoLink = makeModel({
  id: 'robot_2link_fk_ik',
  name: '2-Link Robot FK / IK',
  shortDescription: 'Compare forward pose with an elbow-up inverse-kinematic target.',
  category: 'motion',
  formula: 'FK: x = l₁cosθ₁ + l₂cos(θ₁+θ₂); IK: cosθ₂ = (x²+y²−l₁²−l₂²)/(2l₁l₂)',
  assumptions: ['Planar revolute joints are modeled as ideal point joints.', 'Inverse kinematics returns the elbow-up branch.', 'Reachability is geometric only; no collision, singularity, load, or safety check is performed.'],
  inputDefinitions: [
    input('link1', 'Link 1', 'mm', 100, 'First link length.', { min: 0.001, max: 10000 }),
    input('link2', 'Link 2', 'mm', 75, 'Second link length.', { min: 0.001, max: 10000 }),
    input('theta1Deg', 'Joint 1', 'deg', 20, 'Commanded first joint angle.', { min: -360, max: 360 }),
    input('theta2Deg', 'Joint 2', 'deg', 30, 'Commanded second joint angle.', { min: -360, max: 360 }),
    input('targetX', 'Target X', 'mm', 120, 'Inverse-kinematic target X.', { min: -20000, max: 20000 }),
    input('targetY', 'Target Y', 'mm', 60, 'Inverse-kinematic target Y.', { min: -20000, max: 20000 }),
  ],
  outputDefinitions: [
    output('fkX', 'FK X', 'mm', 'Forward-kinematic end-effector X.'),
    output('fkY', 'FK Y', 'mm', 'Forward-kinematic end-effector Y.'),
    output('ikTheta1Deg', 'IK Joint 1', 'deg', 'Elbow-up inverse-kinematic joint 1.'),
    output('ikTheta2Deg', 'IK Joint 2', 'deg', 'Elbow-up inverse-kinematic joint 2.'),
    output('reachable', 'Reachable', 'boolean', 'Whether the target lies inside the annular workspace.'),
  ],
  workedExample: {
    title: 'Check a pick point before motion planning',
    inputs: { link1: 100, link2: 75, theta1Deg: 0, theta2Deg: 0, targetX: 100, targetY: 75 },
    expected: 'Reachability and geometry only; target is suitable for IK evaluation.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const theta1 = radians(values.theta1Deg)
    const theta2 = radians(values.theta2Deg)
    const fkX = values.link1 * Math.cos(theta1) + values.link2 * Math.cos(theta1 + theta2)
    const fkY = values.link1 * Math.sin(theta1) + values.link2 * Math.sin(theta1 + theta2)
    const radius = Math.hypot(values.targetX, values.targetY)
    const reachable = radius <= values.link1 + values.link2 + 1e-9 && radius >= Math.abs(values.link1 - values.link2) - 1e-9
    const cosTheta2 = reachable
      ? clamp((radius ** 2 - values.link1 ** 2 - values.link2 ** 2) / (2 * values.link1 * values.link2), -1, 1)
      : 1
    const ikTheta2 = Math.acos(cosTheta2)
    const ikTheta1 = Math.atan2(values.targetY, values.targetX) - Math.atan2(values.link2 * Math.sin(ikTheta2), values.link1 + values.link2 * Math.cos(ikTheta2))

    return {
      outputs: {
        fkX: quantity(fkX, 'mm'),
        fkY: quantity(fkY, 'mm'),
        ikTheta1Deg: quantity(degrees(ikTheta1), 'deg'),
        ikTheta2Deg: quantity(degrees(ikTheta2), 'deg'),
        reachable: quantity(reachable, 'boolean'),
      },
      status: reachable ? 'valid' : 'out-of-range',
      warnings: reachable ? [] : ['Target is outside the two-link geometric reach envelope; no motion command is implied.'],
    }
  },
})

const motionProfile = makeModel({
  id: 'motion_profile',
  name: 'Trapezoidal Motion Profile',
  shortDescription: 'Estimate acceleration, cruise, and total travel time.',
  category: 'motion',
  formula: 'vpeak = min(vmax, √(d·a)); ttotal = 2(vpeak/a) + max(0, (d − vpeak²/a)/vpeak)',
  assumptions: ['Acceleration and deceleration are symmetric.', 'Jerk limits, servo following error, and load dynamics are excluded.', 'The profile starts and ends at zero speed.'],
  inputDefinitions: [
    input('distance', 'Travel distance', 'm', 1, 'One-way travel distance.', { min: 0.000001, max: 100000 }),
    input('maxVelocity', 'Maximum velocity', 'm/s', 0.5, 'Velocity limit.', { min: 0.000001, max: 1000 }),
    input('acceleration', 'Acceleration', 'm/s', 1, 'Acceleration magnitude.', { min: 0.000001, max: 10000 }),
  ],
  outputDefinitions: [
    output('peakVelocity', 'Peak velocity', 'm/s', 'Velocity reached by the profile.'),
    output('accelerationTime', 'Acceleration time', 's', 'Time spent accelerating.'),
    output('cruiseTime', 'Cruise time', 's', 'Constant velocity time.'),
    output('totalTime', 'Total time', 's', 'Estimated travel time.'),
  ],
  workedExample: {
    title: 'Estimate a 1 m stage move',
    inputs: { distance: 1, maxVelocity: 0.5, acceleration: 1 },
    expected: '4.00 s including acceleration, cruise, and deceleration.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const peakVelocity = Math.min(values.maxVelocity, Math.sqrt(values.distance * values.acceleration))
    const accelerationTime = peakVelocity / values.acceleration
    const cruiseTime = Math.max(0, (values.distance - (peakVelocity ** 2 / values.acceleration)) / peakVelocity)
    return {
      outputs: {
        peakVelocity: quantity(peakVelocity, 'm/s'),
        accelerationTime: quantity(accelerationTime, 's'),
        cruiseTime: quantity(cruiseTime, 's'),
        totalTime: quantity(2 * accelerationTime + cruiseTime, 's'),
      },
    }
  },
})

const pathGuidance = makeModel({
  id: 'path_guidance',
  name: 'Path Guidance Correction',
  shortDescription: 'Blend lateral and heading error into a bounded correction.',
  category: 'motion',
  formula: 'correction = clamp(kₗ·lateralError + kₕ·headingError, −limit, +limit)',
  assumptions: ['The correction is a teaching signal, not a controller command.', 'Gains are dimensionless display parameters.', 'The heading error is expressed in degrees.'],
  inputDefinitions: [
    input('lateralErrorMm', 'Lateral error', 'mm', 2, 'Signed cross-track error.', { min: -10000, max: 10000 }),
    input('headingErrorDeg', 'Heading error', 'deg', 5, 'Signed heading error.', { min: -360, max: 360 }),
    input('lateralGain', 'Lateral gain', '1', 1, 'Weight applied to lateral error.', { min: 0, max: 100 }),
    input('headingGain', 'Heading gain', '1', 0.2, 'Weight applied to heading error.', { min: 0, max: 100 }),
    input('maxCorrectionMm', 'Correction limit', 'mm', 10, 'Absolute output limit.', { min: 0.000001, max: 10000 }),
  ],
  outputDefinitions: [
    output('rawCorrectionMm', 'Raw correction', 'mm', 'Unbounded blended correction.'),
    output('boundedCorrectionMm', 'Bounded correction', 'mm', 'Clamped educational correction.'),
  ],
  workedExample: {
    title: 'Blend camera path errors',
    inputs: { lateralErrorMm: 2, headingErrorDeg: 5, lateralGain: 1, headingGain: 0.2, maxCorrectionMm: 10 },
    expected: '3 mm raw and bounded correction.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const rawCorrectionMm = values.lateralErrorMm * values.lateralGain + values.headingErrorDeg * values.headingGain
    return {
      outputs: {
        rawCorrectionMm: quantity(rawCorrectionMm, 'mm'),
        boundedCorrectionMm: quantity(clamp(rawCorrectionMm, -values.maxCorrectionMm, values.maxCorrectionMm), 'mm'),
      },
    }
  },
})

const conveyorTrigger = makeModel({
  id: 'conveyor_trigger',
  name: 'Conveyor Trigger Delay',
  shortDescription: 'Estimate arrival and trigger timing from sensor offset and latency.',
  category: 'motion',
  formula: 'delay = max(0, (distance + offset)/speed) + latency + debounce',
  assumptions: ['Conveyor speed is constant.', 'The offset is positive in the travel direction.', 'No acceleration, slip, or sensor filtering dynamics are included.'],
  inputDefinitions: [
    input('sensorDistanceMm', 'Sensor distance', 'mm', 500, 'Distance from sensor to trigger point.', { min: 0, max: 100000 }),
    input('conveyorSpeedMmPerS', 'Conveyor speed', 'mm/s', 250, 'Constant conveyor speed.', { min: 0.000001, max: 100000 }),
    input('triggerOffsetMm', 'Trigger offset', 'mm', 0, 'Additional signed offset.', { min: -100000, max: 100000 }),
    input('latencyMs', 'System latency', 'ms', 5, 'Command and processing latency.', { min: 0, max: 10000 }),
    input('debounceMs', 'Debounce', 'ms', 2, 'Debounce time added to the estimate.', { min: 0, max: 10000 }),
  ],
  outputDefinitions: [
    output('travelTimeMs', 'Travel time', 'ms', 'Time from sensor to offset position.'),
    output('triggerDelayMs', 'Trigger delay', 'ms', 'Travel plus latency estimate.'),
    output('triggerPositionMm', 'Trigger position', 'mm', 'Effective position relative to the sensor.'),
  ],
  workedExample: {
    title: 'Fire a camera at a downstream station',
    inputs: { sensorDistanceMm: 500, conveyorSpeedMmPerS: 250, triggerOffsetMm: 0, latencyMs: 5, debounceMs: 2 },
    expected: '2007 ms from detection to trigger including latency.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const triggerPositionMm = values.sensorDistanceMm + values.triggerOffsetMm
    const travelTimeMs = Math.max(0, triggerPositionMm) / values.conveyorSpeedMmPerS * 1000
    return {
      outputs: {
        travelTimeMs: quantity(travelTimeMs, 'ms'),
        triggerDelayMs: quantity(travelTimeMs + values.latencyMs + values.debounceMs, 'ms'),
        triggerPositionMm: quantity(triggerPositionMm, 'mm'),
      },
      warnings: triggerPositionMm < 0 ? ['Effective trigger position is before the sensor; travel time was clamped to zero.'] : [],
    }
  },
})

const cycleTimeOee = makeModel({
  id: 'cycle_time_oee',
  name: 'Cycle Time / OEE',
  shortDescription: 'Estimate availability, performance, quality, and overall equipment effectiveness.',
  category: 'quality',
  formula: 'OEE = availability × performance × quality; performance = ideal cycle × total count / run time',
  assumptions: ['Counts are complete for the selected planned period.', 'Downtime is planned-period downtime.', 'OEE is a diagnostic estimate and does not establish production conformance.'],
  inputDefinitions: [
    input('idealCycleTimeS', 'Ideal cycle time', 's', 1, 'Ideal seconds per unit.', { min: 0.000001, max: 100000 }),
    input('plannedTimeMin', 'Planned time', 'min', 60, 'Planned production period.', { min: 0.000001, max: 100000 }),
    input('downtimeMin', 'Downtime', 'min', 6, 'Downtime in the planned period.', { min: 0, max: 100000 }),
    input('totalCount', 'Total count', 'count', 3000, 'All produced units.', { min: 0, max: 100000000 }),
    input('goodCount', 'Good count', 'count', 2940, 'Units accepted as good.', { min: 0, max: 100000000 }),
  ],
  outputDefinitions: [
    output('availabilityPct', 'Availability', '%', 'Run time divided by planned time.'),
    output('performancePct', 'Performance', '%', 'Ideal output rate divided by run time.'),
    output('qualityPct', 'Quality', '%', 'Good count divided by total count.'),
    output('oeePct', 'OEE', '%', 'Product of availability, performance, and quality.'),
  ],
  workedExample: {
    title: 'Evaluate a one-hour production window',
    inputs: { idealCycleTimeS: 1, plannedTimeMin: 60, downtimeMin: 6, totalCount: 3000, goodCount: 2940 },
    expected: 'Availability 90%; quality 98%; OEE approximately 81.7%.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const runTimeS = (values.plannedTimeMin - values.downtimeMin) * 60
    const invalid = values.downtimeMin > values.plannedTimeMin || values.goodCount > values.totalCount || runTimeS <= 0
    const availability = clamp((values.plannedTimeMin - values.downtimeMin) / values.plannedTimeMin, 0, 1)
    const performance = runTimeS > 0 ? clamp(values.idealCycleTimeS * values.totalCount / runTimeS, 0, 1) : 0
    const quality = values.totalCount > 0 ? clamp(values.goodCount / values.totalCount, 0, 1) : 0
    return {
      outputs: {
        availabilityPct: quantity(availability * 100, '%'),
        performancePct: quantity(performance * 100, '%'),
        qualityPct: quantity(quality * 100, '%'),
        oeePct: quantity(availability * performance * quality * 100, '%'),
      },
      status: invalid ? 'out-of-range' : 'valid',
      warnings: invalid ? ['Counts or downtime exceed the selected production window.'] : [],
    }
  },
})

const plcScanTiming = makeModel({
  id: 'plc_scan_timing',
  name: 'PLC Scan Timing',
  shortDescription: 'Add program, I/O, communications, and jitter time against a watchdog.',
  category: 'controls',
  formula: 'scan = program + I/O update + communications; worst case = scan + jitter',
  assumptions: ['The listed times are additive.', 'Jitter is represented by a single worst-case allowance.', 'The watchdog margin is a timing estimate, not a PLC safety validation.'],
  inputDefinitions: [
    input('programTimeUs', 'Program time', 'us', 800, 'PLC user program execution time.', { min: 0, max: 10000000 }),
    input('ioUpdateUs', 'I/O update time', 'us', 200, 'I/O image update time.', { min: 0, max: 10000000 }),
    input('commsTimeUs', 'Communications time', 'us', 100, 'Communications service time.', { min: 0, max: 10000000 }),
    input('scanJitterUs', 'Scan jitter', 'us', 50, 'Timing allowance for jitter.', { min: 0, max: 10000000 }),
    input('watchdogMs', 'Watchdog', 'ms', 2, 'Configured watchdog period.', { min: 0.000001, max: 100000 }),
  ],
  outputDefinitions: [
    output('nominalScanMs', 'Nominal scan', 'ms', 'Sum of nominal scan contributors.'),
    output('worstCaseScanMs', 'Worst-case scan', 'ms', 'Nominal scan plus jitter.'),
    output('watchdogMarginMs', 'Watchdog margin', 'ms', 'Watchdog period minus worst-case scan.'),
  ],
  workedExample: {
    title: 'Check scan headroom',
    inputs: { programTimeUs: 800, ioUpdateUs: 200, commsTimeUs: 100, scanJitterUs: 50, watchdogMs: 2 },
    expected: '1.10 ms worst-case scan and 0.90 ms margin.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const nominalScanMs = (values.programTimeUs + values.ioUpdateUs + values.commsTimeUs) / 1000
    const worstCaseScanMs = nominalScanMs + values.scanJitterUs / 1000
    const watchdogMarginMs = values.watchdogMs - worstCaseScanMs
    return {
      outputs: {
        nominalScanMs: quantity(nominalScanMs, 'ms'),
        worstCaseScanMs: quantity(worstCaseScanMs, 'ms'),
        watchdogMarginMs: quantity(watchdogMarginMs, 'ms'),
      },
      status: watchdogMarginMs < 0 ? 'out-of-range' : 'valid',
      warnings: watchdogMarginMs < 0 ? ['Worst-case scan exceeds the supplied watchdog period.'] : [],
    }
  },
})

const serialWireTime = makeModel({
  id: 'serial_wire_time',
  name: 'Serial Wire Time',
  shortDescription: 'Estimate asynchronous serial transmission time from framing bits.',
  category: 'communications',
  formula: 'time = bytes × (start + data + parity + stop) / baud',
  assumptions: ['One start bit is used per character.', 'No protocol inter-frame gap is included except the supplied turnaround.', 'Baud rate equals bits per second for the selected framing.'],
  inputDefinitions: [
    input('byteCount', 'Byte count', 'bytes', 10, 'Bytes on the wire.', { min: 0, max: 100000000 }),
    input('baudRate', 'Baud rate', 'baud', 9600, 'Serial symbol rate.', { min: 1, max: 100000000 }),
    input('dataBits', 'Data bits', 'count', 8, 'Data bits per character.', { min: 5, max: 9, step: 1 }),
    input('parityBits', 'Parity bits', 'count', 0, 'Parity bits per character.', { min: 0, max: 1, step: 1 }),
    input('stopBits', 'Stop bits', 'count', 1, 'Stop bits per character.', { min: 1, max: 2, step: 1 }),
    input('turnaroundMs', 'Turnaround', 'ms', 0, 'Additional half-duplex turnaround.', { min: 0, max: 100000 }),
  ],
  outputDefinitions: [
    output('totalBits', 'Total bits', 'bit', 'Framing bits transmitted.'),
    output('wireTimeMs', 'Wire time', 'ms', 'Transmission time before turnaround.'),
    output('totalTimeMs', 'Total time', 'ms', 'Wire time plus turnaround.'),
  ],
  workedExample: {
    title: 'Estimate a 10-byte 8N1 request',
    inputs: { byteCount: 10, baudRate: 9600, dataBits: 8, parityBits: 0, stopBits: 1, turnaroundMs: 0 },
    expected: '100 bits and 10.417 ms of wire time.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const bitsPerCharacter = 1 + values.dataBits + values.parityBits + values.stopBits
    const totalBits = values.byteCount * bitsPerCharacter
    const wireTimeMs = totalBits / values.baudRate * 1000
    return {
      outputs: {
        totalBits: quantity(totalBits, 'bit'),
        wireTimeMs: quantity(wireTimeMs, 'ms'),
        totalTimeMs: quantity(wireTimeMs + values.turnaroundMs, 'ms'),
      },
    }
  },
})

const tcpUdpTiming = makeModel({
  id: 'tcp_udp_timing',
  name: 'TCP / UDP Timing',
  shortDescription: 'Compare serialization, processing, and handshake timing.',
  category: 'communications',
  formula: 'serialization = payload bits / link rate; TCP = serialization + RTT + processing + handshake',
  assumptions: ['Link rate is the usable payload rate.', 'RTT and processing values are supplied estimates.', 'TCP and UDP reliability, loss, congestion, and queueing are not modeled.'],
  inputDefinitions: [
    input('payloadBytes', 'Payload', 'bytes', 256, 'Payload bytes per message.', { min: 0, max: 100000000 }),
    input('linkRateMbps', 'Link rate', 'Mbps', 100, 'Nominal link rate.', { min: 0.000001, max: 1000000 }),
    input('roundTripMs', 'Round trip', 'ms', 2, 'Network round-trip estimate.', { min: 0, max: 100000 }),
    input('processingMs', 'Processing', 'ms', 0.5, 'Endpoint processing estimate.', { min: 0, max: 100000 }),
    input('handshakeMs', 'Handshake', 'ms', 1, 'Optional TCP connection/setup estimate.', { required: false, min: 0, max: 100000 }),
  ],
  outputDefinitions: [
    output('serializationMs', 'Serialization', 'ms', 'Time to put the payload on the link.'),
    output('tcpTotalMs', 'TCP estimate', 'ms', 'Serialization, RTT, processing, and handshake.'),
    output('udpTotalMs', 'UDP estimate', 'ms', 'Serialization and processing without handshake.'),
  ],
  workedExample: {
    title: 'Compare a 256-byte diagnostic message',
    inputs: { payloadBytes: 256, linkRateMbps: 100, roundTripMs: 2, processingMs: 0.5, handshakeMs: 1 },
    expected: 'Serialization is approximately 0.0205 ms at 100 Mbps.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const serializationMs = values.payloadBytes * 8 / (values.linkRateMbps * 1000)
    const handshakeMs = values.handshakeMs ?? 0
    return {
      outputs: {
        serializationMs: quantity(serializationMs, 'ms'),
        tcpTotalMs: quantity(serializationMs + values.roundTripMs + values.processingMs + handshakeMs, 'ms'),
        udpTotalMs: quantity(serializationMs + values.processingMs, 'ms'),
      },
      assumptions: values.handshakeMs === undefined ? ['TCP handshake input omitted; handshake contribution assumed to be 0 ms.'] : [],
    }
  },
})

const canBusLoad = makeModel({
  id: 'can_bus_load',
  name: 'CAN Bus Load',
  shortDescription: 'Estimate bus utilization from frame rate, frame bits, and stuffing.',
  category: 'communications',
  formula: 'load = frame bits × stuffing factor × frames/s ÷ bitrate',
  assumptions: ['Frame bits include arbitration, control, data, CRC, ACK, and EOF as supplied.', 'Stuffing factor is an average multiplier.', 'No error frames or retransmissions are included.'],
  inputDefinitions: [
    input('frameBits', 'Frame bits', 'bit', 128, 'Average bits per frame before stuffing.', { min: 1, max: 2048 }),
    input('framesPerSecond', 'Frames per second', 'Hz', 100, 'Average frame rate.', { min: 0, max: 100000 }),
    input('bitrate', 'Bitrate', 'baud', 500000, 'CAN bus bitrate.', { min: 1, max: 10000000 }),
    input('stuffingFactor', 'Stuffing factor', '1', 1.1, 'Average bit stuffing multiplier.', { min: 1, max: 2, step: 0.01 }),
  ],
  outputDefinitions: [
    output('bitsPerSecond', 'Bus bits/s', 'bit/s', 'Estimated occupied bits per second.'),
    output('busLoadPct', 'Bus load', '%', 'Occupied bus percentage.'),
    output('headroomPct', 'Headroom', '%', 'Remaining estimated bus capacity.'),
  ],
  workedExample: {
    title: 'Estimate a 500 kbit/s CAN segment',
    inputs: { frameBits: 128, framesPerSecond: 100, bitrate: 500000, stuffingFactor: 1.1 },
    expected: 'Approximately 2.82% estimated load.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const bitsPerSecond = values.frameBits * values.stuffingFactor * values.framesPerSecond
    const busLoadPct = bitsPerSecond / values.bitrate * 100
    return {
      outputs: {
        bitsPerSecond: quantity(bitsPerSecond, 'bit/s'),
        busLoadPct: quantity(busLoadPct, '%'),
        headroomPct: quantity(100 - busLoadPct, '%'),
      },
      status: busLoadPct > 100 ? 'out-of-range' : 'valid',
      warnings: busLoadPct > 100 ? ['Estimated bus demand exceeds the configured bitrate.'] : [],
    }
  },
})

const dispensingDose = makeModel({
  id: 'dispensing_dose',
  name: 'Dispensing Dose',
  shortDescription: 'Estimate dispensed volume from flow rate and time.',
  category: 'process',
  formula: 'V = Q × t',
  assumptions: ['Flow rate is constant over the shot.', 'No nozzle start/stop transient or compressibility correction is included.', 'This is an educational estimate, not a validated dosing recipe.'],
  inputDefinitions: [
    input('flowRateMlPerS', 'Flow rate', 'mL/s', 2, 'Average fluid flow rate.', { min: 0, max: 100000 }),
    input('durationS', 'Duration', 's', 3, 'Valve-open or dispense duration.', { min: 0, max: 100000 }),
  ],
  outputDefinitions: [output('volumeMl', 'Dispensed volume', 'mL', 'Estimated volume.')],
  workedExample: {
    title: 'Estimate a three-second shot',
    inputs: { flowRateMlPerS: 2, durationS: 3 },
    expected: '6 mL estimated volume.',
  },
  evaluate: (values): CalculatorEvaluation => ({ outputs: { volumeMl: quantity(values.flowRateMlPerS * values.durationS, 'mL') } }),
})

const pneumaticForce = makeModel({
  id: 'pneumatic_force',
  name: 'Pneumatic Force',
  shortDescription: 'Estimate piston force from pressure, area, and efficiency.',
  category: 'process',
  formula: 'F = P × πd²/4 × η',
  assumptions: ['Pressure is gauge pressure at the piston.', 'The piston is circular and has no rod-side area subtraction.', 'Seal friction, valve dynamics, and load safety factors are represented only by the supplied efficiency.'],
  inputDefinitions: [
    input('pressureBar', 'Pressure', 'bar', 6, 'Gauge pressure.', { min: 0, max: 1000 }),
    input('pistonDiameterMm', 'Piston diameter', 'mm', 32, 'Piston bore diameter.', { min: 0.001, max: 10000 }),
    input('efficiency', 'Efficiency', 'ratio', 0.85, 'Dimensionless force efficiency.', { min: 0, max: 1, step: 0.01 }),
  ],
  outputDefinitions: [output('forceN', 'Estimated force', 'N', 'Pressure-area force estimate.')],
  workedExample: {
    title: 'Estimate a 32 mm pneumatic bore',
    inputs: { pressureBar: 6, pistonDiameterMm: 32, efficiency: 0.85 },
    expected: 'Approximately 546 N extension force.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const diameterM = values.pistonDiameterMm / 1000
    return { outputs: { forceN: quantity(values.pressureBar * 100000 * Math.PI * diameterM ** 2 / 4 * values.efficiency, 'N') } }
  },
})

const pumpPower = makeModel({
  id: 'pump_power',
  name: 'Pump Power',
  shortDescription: 'Estimate hydraulic and input power from flow, pressure, and efficiency.',
  category: 'process',
  formula: 'Phydraulic = ΔP × Q; Pinput = Phydraulic / η',
  assumptions: ['Pressure is differential pressure.', 'Flow is steady and converted from L/min to m³/s.', 'Efficiency covers pump and drive losses as a single factor.'],
  inputDefinitions: [
    input('flowLPerMin', 'Flow rate', 'L/min', 20, 'Pump flow rate.', { min: 0, max: 100000 }),
    input('pressureBar', 'Pressure rise', 'bar', 5, 'Differential pressure.', { min: 0, max: 1000 }),
    input('efficiency', 'Efficiency', 'ratio', 0.7, 'Hydraulic-to-input efficiency.', { min: 0.000001, max: 1, step: 0.01 }),
  ],
  outputDefinitions: [
    output('hydraulicPowerW', 'Hydraulic power', 'W', 'Pressure-flow hydraulic power.'),
    output('inputPowerW', 'Input power', 'W', 'Estimated required input power.'),
  ],
  workedExample: {
    title: 'Estimate a 20 L/min pump',
    inputs: { flowLPerMin: 20, pressureBar: 5, efficiency: 0.7 },
    expected: 'Approximately 166.7 W input power.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const hydraulicPowerW = values.pressureBar * 100000 * values.flowLPerMin / 60000
    return { outputs: { hydraulicPowerW: quantity(hydraulicPowerW, 'W'), inputPowerW: quantity(hydraulicPowerW / values.efficiency, 'W') } }
  },
})

const thermalFirstPass = makeModel({
  id: 'thermal_first_pass',
  name: 'Thermal First Pass',
  shortDescription: 'Estimate first-order heating time with linearized heat loss.',
  category: 'process',
  formula: 'T∞ = P/h; t = −C/h · ln(1 − ΔT/T∞)',
  assumptions: ['Thermal mass and heat loss coefficient are constant.', 'Ambient temperature is the zero reference for the requested temperature rise.', 'Radiation, phase change, contact resistance, and controller behavior are excluded.'],
  inputDefinitions: [
    input('heaterPowerW', 'Heater power', 'W', 500, 'Net applied heater power.', { min: 0.000001, max: 100000000 }),
    input('thermalMassJPerK', 'Thermal mass', 'J/K', 1000, 'Effective thermal capacitance.', { min: 0.000001, max: 100000000 }),
    input('heatLossWPerK', 'Heat loss coefficient', 'W/K', 5, 'Linearized heat loss coefficient.', { min: 0, max: 1000000 }),
    input('targetDeltaK', 'Temperature rise', 'K', 50, 'Requested temperature rise.', { min: 0.000001, max: 1000000 }),
  ],
  outputDefinitions: [
    output('steadyDeltaK', 'Steady-state rise', 'K', 'First-order steady-state temperature rise.'),
    output('timeToTargetS', 'Time to target', 's', 'First-order time estimate.'),
    output('initialRiseRateKPerS', 'Initial rise rate', 'K/s', 'Initial heater-only rise rate.'),
  ],
  workedExample: {
    title: 'Estimate a 50 K warm-up',
    inputs: { heaterPowerW: 500, thermalMassJPerK: 1000, heatLossWPerK: 5, targetDeltaK: 50 },
    expected: 'Approximately 138.6 s first-order warm-up time.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const steadyDeltaK = values.heatLossWPerK > 0 ? values.heaterPowerW / values.heatLossWPerK : Number.POSITIVE_INFINITY
    const ratio = steadyDeltaK > 0 ? values.targetDeltaK / steadyDeltaK : 1
    const valid = ratio < 1
    const timeToTargetS = valid && values.heatLossWPerK > 0
      ? -values.thermalMassJPerK / values.heatLossWPerK * Math.log(1 - ratio)
      : 0
    return {
      outputs: {
        steadyDeltaK: quantity(steadyDeltaK, 'K'),
        timeToTargetS: quantity(timeToTargetS, 's'),
        initialRiseRateKPerS: quantity(values.heaterPowerW / values.thermalMassJPerK, 'K/s'),
      },
      status: valid ? 'valid' : 'domain-review-required',
      warnings: valid ? [] : ['Requested target is at or above the modeled steady-state rise; review the thermal model.'],
    }
  },
})

const cameraFov = makeModel({
  id: 'camera_fov',
  name: 'Camera Field of View',
  shortDescription: 'Estimate object-plane field of view from sensor, focal length, and distance.',
  category: 'vision',
  formula: 'FOVx = sensor width × working distance / focal length',
  assumptions: ['Thin-lens small-angle approximation is used.', 'Working distance is measured from the effective optical center.', 'Lens distortion and perspective depth variation are excluded.'],
  inputDefinitions: [
    input('sensorWidthMm', 'Sensor width', 'mm', 6.4, 'Active sensor width.', { min: 0.000001, max: 1000 }),
    input('sensorHeightMm', 'Sensor height', 'mm', 4.8, 'Active sensor height.', { min: 0.000001, max: 1000 }),
    input('focalLengthMm', 'Focal length', 'mm', 8, 'Effective focal length.', { min: 0.000001, max: 1000 }),
    input('workingDistanceMm', 'Working distance', 'mm', 500, 'Object-plane distance.', { min: 0.000001, max: 1000000 }),
  ],
  outputDefinitions: [
    output('horizontalFovMm', 'Horizontal FOV', 'mm', 'Horizontal object-plane field of view.'),
    output('verticalFovMm', 'Vertical FOV', 'mm', 'Vertical object-plane field of view.'),
    output('diagonalFovMm', 'Diagonal FOV', 'mm', 'Diagonal object-plane field of view.'),
  ],
  workedExample: {
    title: 'Estimate a camera inspection window',
    inputs: { sensorWidthMm: 6.4, sensorHeightMm: 4.8, focalLengthMm: 8, workingDistanceMm: 500 },
    expected: '400 mm × 300 mm approximate field of view.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const horizontalFovMm = values.sensorWidthMm * values.workingDistanceMm / values.focalLengthMm
    const verticalFovMm = values.sensorHeightMm * values.workingDistanceMm / values.focalLengthMm
    return {
      outputs: {
        horizontalFovMm: quantity(horizontalFovMm, 'mm'),
        verticalFovMm: quantity(verticalFovMm, 'mm'),
        diagonalFovMm: quantity(Math.hypot(horizontalFovMm, verticalFovMm), 'mm'),
      },
    }
  },
})

const exposureBlur = makeModel({
  id: 'exposure_blur',
  name: 'Exposure Motion Blur',
  shortDescription: 'Convert motion during exposure into object and pixel blur.',
  category: 'vision',
  formula: 'blur distance = object speed × exposure; blur pixels = blur distance / pixel pitch',
  assumptions: ['Motion is linear during the exposure.', 'Pixel pitch is constant across the sensor.', 'Optical, readout, and image-processing blur are excluded.'],
  inputDefinitions: [
    input('objectSpeedMmPerS', 'Object speed', 'mm/s', 1000, 'Image-plane object speed.', { min: 0, max: 1000000 }),
    input('exposureMs', 'Exposure', 'ms', 0.5, 'Exposure duration.', { min: 0, max: 10000 }),
    input('pixelPitchUm', 'Pixel pitch', 'um', 5, 'Pixel pitch.', { min: 0.000001, max: 1000 }),
  ],
  outputDefinitions: [
    output('blurMm', 'Blur distance', 'mm', 'Distance traveled during exposure.'),
    output('blurPixels', 'Blur pixels', 'px', 'Distance blur in pixels.'),
  ],
  workedExample: {
    title: 'Check a moving inspection exposure',
    inputs: { objectSpeedMmPerS: 1000, exposureMs: 0.5, pixelPitchUm: 5 },
    expected: '0.5 mm or 100 pixels of first-order blur.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const blurMm = values.objectSpeedMmPerS * values.exposureMs / 1000
    return { outputs: { blurMm: quantity(blurMm, 'mm'), blurPixels: quantity(blurMm / (values.pixelPitchUm / 1000), 'px') } }
  },
})

const affineCalibration = makeModel({
  id: 'affine_calibration',
  name: 'Affine Calibration',
  shortDescription: 'Apply a 2D affine map and optionally calculate calibration residual.',
  category: 'vision',
  formula: 'X = a₁₁x + a₁₂y + bx; Y = a₂₁x + a₂₂y + by; residual = ‖predicted − observed‖',
  assumptions: ['The affine coefficients were obtained from a separate calibration fit.', 'One point is evaluated at a time.', 'Residual is meaningful only when observed machine coordinates are supplied.'],
  inputDefinitions: [
    input('pixelX', 'Pixel X', 'px', 2, 'Image point X.', { min: -1000000, max: 1000000 }),
    input('pixelY', 'Pixel Y', 'px', 3, 'Image point Y.', { min: -1000000, max: 1000000 }),
    input('a11', 'A11', '1', 1, 'Affine X-from-pixel-X coefficient.', { min: -100000, max: 100000 }),
    input('a12', 'A12', '1', 0, 'Affine X-from-pixel-Y coefficient.', { min: -100000, max: 100000 }),
    input('a21', 'A21', '1', 0, 'Affine Y-from-pixel-X coefficient.', { min: -100000, max: 100000 }),
    input('a22', 'A22', '1', 1, 'Affine Y-from-pixel-Y coefficient.', { min: -100000, max: 100000 }),
    input('offsetX', 'Offset X', 'mm', 10, 'Machine-frame X offset.', { min: -1000000, max: 1000000 }),
    input('offsetY', 'Offset Y', 'mm', 20, 'Machine-frame Y offset.', { min: -1000000, max: 1000000 }),
    input('observedX', 'Observed X', 'mm', 12, 'Optional measured machine X.', { required: false, min: -1000000, max: 1000000 }),
    input('observedY', 'Observed Y', 'mm', 23, 'Optional measured machine Y.', { required: false, min: -1000000, max: 1000000 }),
  ],
  outputDefinitions: [
    output('machineX', 'Machine X', 'mm', 'Affine-mapped machine X.'),
    output('machineY', 'Machine Y', 'mm', 'Affine-mapped machine Y.'),
    output('residualMm', 'Residual', 'mm', 'Optional Euclidean residual.'),
  ],
  workedExample: {
    title: 'Map a pixel point into the machine frame',
    inputs: { pixelX: 2, pixelY: 3, a11: 1, a12: 0, a21: 0, a22: 1, offsetX: 10, offsetY: 20, observedX: 12, observedY: 23 },
    expected: 'Machine point (12 mm, 23 mm) with 0 mm residual.',
  },
  evaluate: (values): CalculatorEvaluation => {
    const machineX = values.a11 * values.pixelX + values.a12 * values.pixelY + values.offsetX
    const machineY = values.a21 * values.pixelX + values.a22 * values.pixelY + values.offsetY
    const hasObservation = values.observedX !== undefined && values.observedY !== undefined
    const residualMm = hasObservation ? Math.hypot(machineX - values.observedX, machineY - values.observedY) : 0
    return {
      outputs: { machineX: quantity(machineX, 'mm'), machineY: quantity(machineY, 'mm'), residualMm: quantity(residualMm, 'mm') },
      status: hasObservation ? 'valid' : 'valid-with-assumptions',
      assumptions: hasObservation ? [] : ['Observed machine coordinates omitted; residual is reported as 0 only as a placeholder.'],
    }
  },
})

const toleranceBudget = makeModel({
  id: 'tolerance_budget',
  name: 'Tolerance Budget',
  shortDescription: 'Compare worst-case and root-sum-square tolerance accumulation.',
  category: 'quality',
  formula: 'worst case = Σ|ti|; RSS = √Σti²',
  assumptions: ['Tolerance inputs are independent magnitude contributions.', 'RSS is a statistical estimate, not a guaranteed envelope.', 'Nominal dimensions and distribution shape are not modeled.'],
  inputDefinitions: [
    input('tolerance1Mm', 'Tolerance 1', 'mm', 0.1, 'First tolerance contribution.', { min: 0, max: 100000 }),
    input('tolerance2Mm', 'Tolerance 2', 'mm', 0.05, 'Second tolerance contribution.', { min: 0, max: 100000 }),
    input('tolerance3Mm', 'Tolerance 3', 'mm', 0.02, 'Third tolerance contribution.', { min: 0, max: 100000 }),
  ],
  outputDefinitions: [
    output('worstCaseMm', 'Worst case', 'mm', 'Sum of absolute tolerance contributions.'),
    output('rssMm', 'RSS estimate', 'mm', 'Root-sum-square estimate.'),
  ],
  workedExample: {
    title: 'Budget three alignment contributors',
    inputs: { tolerance1Mm: 0.1, tolerance2Mm: 0.05, tolerance3Mm: 0.02 },
    expected: '0.17 mm worst case and approximately 0.113 mm RSS.',
  },
  evaluate: (values): CalculatorEvaluation => ({
    outputs: {
      worstCaseMm: quantity(values.tolerance1Mm + values.tolerance2Mm + values.tolerance3Mm, 'mm'),
      rssMm: quantity(Math.hypot(values.tolerance1Mm, values.tolerance2Mm, values.tolerance3Mm), 'mm'),
    },
  }),
})

export const INDUSTRIAL_CALCULATORS: readonly CalculatorModel[] = [
  coordinateTransform,
  robotTwoLink,
  motionProfile,
  pathGuidance,
  conveyorTrigger,
  cycleTimeOee,
  plcScanTiming,
  serialWireTime,
  tcpUdpTiming,
  canBusLoad,
  dispensingDose,
  pneumaticForce,
  pumpPower,
  thermalFirstPass,
  cameraFov,
  exposureBlur,
  affineCalibration,
  toleranceBudget,
]

registerCalculatorModels(INDUSTRIAL_CALCULATORS)
