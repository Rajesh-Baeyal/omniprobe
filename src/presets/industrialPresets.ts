import type { IndustrialPreset, InterlockBitDefinition, RegisterDefinition } from '../types/omniprobe'

const safetyBits: InterlockBitDefinition[] = [
  { bit: 0, name: 'Slit_Valve_Closed', description: 'Load-lock slit valve is physically closed.', safeState: true },
  { bit: 1, name: 'Wafer_Present_Opto', description: 'Optical wafer-present sensor is asserted.', safeState: true },
  { bit: 2, name: 'Foreline_Pressure_OK', description: 'Foreline pressure remains inside the operating envelope.', safeState: true },
  { bit: 3, name: 'E_Stop_Clear', description: 'Safety circuit reports a cleared emergency stop.', safeState: true },
  { bit: 4, name: 'Stage_Homed', description: 'Wafer stage has completed its homing sequence.', safeState: true },
]

const semiconductorRegisters: RegisterDefinition[] = [
  { name: 'Chamber_Pressure_mTorr', address: 40001, width: 2, dataType: 'FLOAT32', unit: 'mTorr', description: 'Load-lock absolute pressure', defaultValue: 18.4 },
  { name: 'Wafer_Stage_X_Error_nm', address: 40003, width: 2, dataType: 'FLOAT32', unit: 'nm', description: 'Stage following error', defaultValue: 7.2 },
  { name: 'RF_Forward_Power_W', address: 40005, width: 2, dataType: 'FLOAT32', unit: 'W', description: 'Forward RF power', defaultValue: 1250 },
  { name: 'Turbo_Pump_RPM', address: 40007, width: 2, dataType: 'UINT32', unit: 'RPM', description: 'Turbo pump speed', defaultValue: 42000 },
  { name: 'Safety_Interlock_Word', address: 40009, width: 1, dataType: 'UINT16', unit: 'bits', description: 'Safety chain bitmask', defaultValue: 0b1_1111, bitDefinitions: safetyBits },
]

const gantryRegisters: RegisterDefinition[] = [
  { name: 'Axis_1_Servo_Following_Error', address: 41001, width: 2, dataType: 'FLOAT32', unit: 'mm', description: 'X-axis servo tracking error', defaultValue: 0.012 },
  { name: 'Axis_2_Torque_Percent', address: 41003, width: 1, dataType: 'INT16', unit: '%', description: 'Y-axis motor torque', defaultValue: 42 },
  { name: 'Axis_3_Velocity', address: 41004, width: 2, dataType: 'FLOAT32', unit: 'mm/s', description: 'Z-axis commanded velocity', defaultValue: 820 },
  { name: 'Axis_4_Torque_Percent', address: 41006, width: 1, dataType: 'INT16', unit: '%', description: 'R-axis motor torque', defaultValue: 36 },
  { name: 'Limit_Switch_Bitmask', address: 41007, width: 1, dataType: 'UINT16', unit: 'bits', description: 'Hard-limit and home switches', defaultValue: 0b0011_0011, bitDefinitions: [
    { bit: 0, name: 'X_Home', description: 'X home switch', safeState: false },
    { bit: 1, name: 'X_Limit', description: 'X positive limit', safeState: false },
    { bit: 4, name: 'Z_Home', description: 'Z home switch', safeState: false },
    { bit: 5, name: 'Z_Limit', description: 'Z positive limit', safeState: false },
  ] },
]

const powerThermalRegisters: RegisterDefinition[] = [
  { name: 'Bus_Voltage_V', address: 40001, width: 2, dataType: 'FLOAT32', unit: 'V', description: 'DC bus voltage (intentional overlap)', defaultValue: 48 },
  { name: 'Heatsink_Temperature_C', address: 40002, width: 2, dataType: 'FLOAT32', unit: '°C', description: 'Heatsink temperature (intentional overlap)', defaultValue: 64 },
  { name: 'Inverter_Current_A', address: 40004, width: 2, dataType: 'FLOAT32', unit: 'A', description: 'Aggregate inverter current', defaultValue: 18.5 },
  { name: 'Cabinet_Humidity_pct', address: 40006, width: 1, dataType: 'UINT16', unit: '%RH', description: 'Cabinet humidity', defaultValue: 31 },
  { name: 'Thermal_Alarm_Word', address: 40007, width: 1, dataType: 'UINT16', unit: 'bits', description: 'Thermal alarm status', defaultValue: 0 },
]

export const industrialPresets: IndustrialPreset[] = [
  {
    id: 'semiconductor_loadlock',
    name: 'Semiconductor Vacuum Load-Lock & Wafer Stage',
    shortName: 'VACUUM LOAD-LOCK',
    protocol: 'MODBUS_RTU',
    description: 'A deterministic semiconductor process-cell preset for packet inspection, safety interlock validation, and high-speed analog telemetry.',
    tags: ['VACUUM', 'WAFER STAGE', 'SAFETY'],
    simulation: { baudRate: 115200, pollingPeriodMs: 20, slaveId: 7, registerCount: 10, requestBytes: 8, responseBytes: 25, timeoutMs: 12, faultTypes: [] },
    registers: semiconductorRegisters,
    defaultInterlockWord: 0b1_1111,
    expectedUtilizationPct: 31,
  },
  {
    id: 'robotic_gantry',
    name: '4-Axis Robotic Pick-and-Place Gantry',
    shortName: '4-AXIS GANTRY',
    protocol: 'MODBUS_TCP',
    description: 'Servo motion and limit-switch diagnostics for a four-axis transfer gantry operating at deterministic cycle time.',
    tags: ['MOTION', 'SERVO', 'LIMITS'],
    simulation: { baudRate: 1000000, pollingPeriodMs: 10, slaveId: 12, registerCount: 8, requestBytes: 12, responseBytes: 31, timeoutMs: 8, faultTypes: [] },
    registers: gantryRegisters,
    defaultInterlockWord: 0,
    expectedUtilizationPct: 18,
  },
  {
    id: 'subfab_power_thermal',
    name: 'Sub-Fab Power & Thermal Array',
    shortName: 'SUB-FAB ARRAY',
    protocol: 'MODBUS_RTU',
    description: 'A deliberately misconfigured commissioning target. The doctor should flag saturation, overlapping 32-bit registers, and unsafe alignment on first load.',
    tags: ['POWER', 'THERMAL', 'COMMISSIONING'],
    simulation: { baudRate: 9600, pollingPeriodMs: 20, slaveId: 3, registerCount: 16, requestBytes: 8, responseBytes: 41, timeoutMs: 24, faultTypes: ['EMI_SPIKE_ANALOG'] },
    registers: powerThermalRegisters,
    defaultInterlockWord: 0,
    expectedUtilizationPct: 88,
  },
]

export const presetById = Object.fromEntries(industrialPresets.map((preset) => [preset.id, preset])) as Record<string, IndustrialPreset>
