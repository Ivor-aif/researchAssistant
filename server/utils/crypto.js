import crypto from 'crypto'

function getKey() {
  const raw = process.env.CONFIG_ENC_KEY || ''
  let key
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex')
  } else if (/^[A-Za-z0-9+/=]+$/.test(raw)) {
    try { key = Buffer.from(raw, 'base64') } catch {}
  }
  if (!key || key.length !== 32) {
    throw new Error('Invalid CONFIG_ENC_KEY: must be 32 bytes (hex or base64)')
  }
  return key
}

export function encrypt(value) {
  if (value == null) return null
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64')
}

export function decrypt(payload) {
  if (!payload) return null
  const buf = Buffer.from(payload, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const key = getKey()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  return plaintext
}
