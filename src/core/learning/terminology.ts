export const LEARNING_DOMAINS = [
  'plc',
  'robotics',
  'motion',
  'serial-communication',
  'tcp-udp',
  'vision',
  'recipes',
  'safety',
  'ot-cybersecurity',
] as const

export type LearningDomain = typeof LEARNING_DOMAINS[number]

export interface TermRecord {
  id: string
  termId: string
  label: string
  definition: string
  plainLanguage: string
  domain: LearningDomain
  domains: LearningDomain[]
  aliases: string[]
  contexts: Record<string, string>
  examples: string[]
  safetyNote?: string
}

export interface ContextualTerm extends TermRecord {
  requestedContext?: string
  contextualDefinition: string
}

const term = (record: Omit<TermRecord, 'id' | 'termId' | 'domains' | 'aliases'> & {
  id: string
  aliases?: string[]
  domains?: LearningDomain[]
}): TermRecord => ({
  ...record,
  termId: record.id,
  domains: record.domains ?? [record.domain],
  aliases: record.aliases ?? [],
})

export const TERM_LIBRARY: readonly TermRecord[] = [
  term({
    id: 'plc-scan-cycle',
    label: 'PLC scan cycle',
    definition: 'The repeating sequence in which a programmable controller reads inputs, executes logic, and updates outputs.',
    plainLanguage: 'A PLC takes a quick snapshot, thinks through the program, and then changes its outputs in a loop.',
    domain: 'plc',
    aliases: ['scan cycle', 'program scan'],
    contexts: {
      plc: 'In a PLC diagnostic, scan time helps explain why a fast input can be missed or why an output changes one cycle later.',
    },
    examples: ['Read inputs → execute logic → write outputs → diagnostics'],
  }),
  term({
    id: 'interlock',
    label: 'Interlock',
    definition: 'A condition that prevents an action until required safe or ready conditions are true.',
    plainLanguage: 'An interlock is a deliberate “not yet” rule that blocks an action until the prerequisites are met.',
    domain: 'safety',
    domains: ['plc', 'robotics', 'motion', 'safety'],
    aliases: ['permissive'],
    contexts: {
      plc: 'A PLC interlock is normally represented by conditions in logic and should be observable in the diagnostic state.',
      safety: 'An application interlock is not a replacement for a safety-rated circuit, guard, or emergency stop.',
    },
    examples: ['Guard closed AND pressure ready → permit cycle'],
    safetyNote: 'Software interlocks do not replace safety-rated hardware or a risk assessment.',
  }),
  term({
    id: 'crc',
    label: 'CRC',
    definition: 'A cyclic redundancy check used to detect accidental changes in a block of data.',
    plainLanguage: 'A CRC is a compact fingerprint of bytes that lets the receiver notice many transmission errors.',
    domain: 'serial-communication',
    aliases: ['cyclic redundancy check', 'crc16'],
    contexts: {
      'serial-communication': 'For a serial frame, the CRC is calculated over the defined bytes and compared with the received check value.',
      'tcp-udp': 'TCP already provides an integrity checksum, while an application protocol may still define its own CRC for a payload.',
    },
    examples: ['Modbus RTU appends a CRC16 to the frame'],
  }),
  term({
    id: 'baud-rate',
    label: 'Baud rate',
    definition: 'The number of symbols transmitted per second on a serial link.',
    plainLanguage: 'It describes how quickly symbols move on the wire; the frame format determines how many bits each symbol represents.',
    domain: 'serial-communication',
    aliases: ['baud'],
    contexts: {
      'serial-communication': 'Wire-time estimates combine baud rate with framing bits such as start, data, parity, and stop bits.',
    },
    examples: ['115200 baud with 8 data bits, even parity, and one stop bit'],
  }),
  term({
    id: 'tcp-handshake',
    label: 'TCP handshake',
    definition: 'The exchange that establishes a TCP connection before application data is sent.',
    plainLanguage: 'The endpoints first agree on a connection before they exchange the useful message.',
    domain: 'tcp-udp',
    aliases: ['three-way handshake'],
    contexts: {
      'tcp-udp': 'A timing investigation separates connection setup from application request, response, and retransmission time.',
    },
    examples: ['SYN → SYN/ACK → ACK'],
  }),
  term({
    id: 'pose',
    label: 'Pose',
    definition: 'A position and orientation of a body relative to a named coordinate frame.',
    plainLanguage: 'A pose says where something is and which way it is pointing.',
    domain: 'robotics',
    aliases: ['robot pose', 'transform'],
    contexts: {
      robotics: 'A robot pose is meaningful only with its reference frame and units made explicit.',
      motion: 'A motion target can be a pose, a joint state, or a path depending on the controller interface.',
    },
    examples: ['X, Y, Z position plus roll, pitch, yaw orientation'],
  }),
  term({
    id: 'homing',
    label: 'Homing',
    definition: 'A controlled procedure that establishes a machine axis or robot joint reference position.',
    plainLanguage: 'Homing gives the machine a known reference before relative movement is trusted.',
    domain: 'motion',
    aliases: ['referencing'],
    contexts: {
      motion: 'A homing result is evidence about a reference procedure, not permission to move an unverified machine.',
    },
    examples: ['Move toward a reference switch at a defined speed, then capture the offset'],
    safetyNote: 'The example is simulated; real homing requires approved procedures, guarding, and authorization.',
  }),
  term({
    id: 'calibration',
    label: 'Calibration',
    definition: 'A process that relates measurements to a reference so that future measurements can be interpreted.',
    plainLanguage: 'Calibration connects what a sensor sees with a known reference and records how good that connection is.',
    domain: 'vision',
    aliases: ['camera calibration'],
    contexts: {
      vision: 'Vision calibration should include the reference data, transform model, residuals, and validity conditions.',
    },
    examples: ['Map camera pixels to stage coordinates using known points'],
  }),
  term({
    id: 'recipe-revision',
    label: 'Recipe revision',
    definition: 'An immutable, identifiable set of process parameters for a product, machine, or station.',
    plainLanguage: 'A recipe revision is a named snapshot of settings, so a result can be traced back to exactly what was used.',
    domain: 'recipes',
    aliases: ['recipe version'],
    contexts: {
      recipes: 'A revision should carry provenance, an approval state, and a content hash before it is used for a run.',
    },
    examples: ['Product A / Station 2 / revision 7 / approved'],
  }),
  term({
    id: 'least-privilege',
    label: 'Least privilege',
    definition: 'A security principle that gives an identity only the access required for its current task.',
    plainLanguage: 'Each account gets the smallest set of permissions it needs, for the shortest useful time.',
    domain: 'ot-cybersecurity',
    aliases: ['minimum necessary access'],
    contexts: {
      'ot-cybersecurity': 'In an OT environment, least privilege limits who can change recipes, issue commands, or access diagnostics.',
    },
    examples: ['A read-only historian account cannot change controller logic'],
  }),
]

const normalized = (value: string) => value.trim().toLowerCase().replace(/[_\s/]+/g, '-')

const matchesContext = (termRecord: TermRecord, context: string) => {
  const key = normalized(context)
  return termRecord.domains.some((domain) => normalized(domain) === key)
    || normalized(termRecord.domain) === key
    || (key === 'serial' && termRecord.domains.includes('serial-communication'))
    || (key === 'networking' && termRecord.domains.includes('tcp-udp'))
    || (key === 'cyber' && termRecord.domains.includes('ot-cybersecurity'))
}

export function listTerms(terms: readonly TermRecord[] = TERM_LIBRARY): TermRecord[] {
  return terms.map((item) => ({ ...item, domains: [...item.domains], aliases: [...item.aliases], contexts: { ...item.contexts }, examples: [...item.examples] }))
}

export function getTermInContext(termId: string, context?: string, terms: readonly TermRecord[] = TERM_LIBRARY): ContextualTerm | undefined {
  const key = normalized(termId)
  const found = terms.find((item) => [item.id, item.termId, item.label, ...item.aliases].some((candidate) => normalized(candidate) === key))
  if (!found) return undefined

  const contextKey = context ? Object.keys(found.contexts).find((candidate) => normalized(candidate) === normalized(context)) : undefined
  const contextualDefinition = contextKey
    ? found.contexts[contextKey]
    : context && matchesContext(found, context)
      ? found.contexts[found.domain] ?? found.definition
      : found.definition

  return {
    ...found,
    domains: [...found.domains],
    aliases: [...found.aliases],
    contexts: { ...found.contexts },
    examples: [...found.examples],
    requestedContext: context,
    contextualDefinition,
  }
}
