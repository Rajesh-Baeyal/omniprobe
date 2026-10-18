const REDACTED_VALUE = '[REDACTED]'

const sensitiveKeyPatterns = [
  'password',
  'passwd',
  'passphrase',
  'secret',
  'credential',
  'token',
  'apikey',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'authheader',
  'bearer',
  'privatekey',
  'keymaterial',
]

function normalizedKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizedKey(key)
  return sensitiveKeyPatterns.some((pattern) => normalized.includes(pattern))
}

function isSensitiveValue(value: string): boolean {
  return /-----BEGIN(?: [A-Z0-9]+)? PRIVATE KEY-----/i.test(value)
    || /^Bearer\s+\S+/i.test(value.trim())
    || /^[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/.test(value)
}

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    return isSensitiveValue(value) ? REDACTED_VALUE : value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry))
  }

  if (value !== null && typeof value === 'object') {
    const output: Record<string, unknown> = {}
    Object.entries(value).forEach(([key, entry]) => {
      output[key] = isSensitiveKey(key) ? REDACTED_VALUE : redact(entry)
    })
    return output
  }

  return value
}

export function redactSensitiveFields<T>(value: T): T {
  return redact(value) as T
}

export { REDACTED_VALUE }
