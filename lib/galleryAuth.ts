import { createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE_NAME = 'gallery_ok'
export const SESSION_MAX_AGE_SEC = 3600

export function getGallerySecret(): string {
  const secret = process.env.GALLERY_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('GALLERY_SECRET is required (min 16 chars)')
  }
  return secret
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
  return b.toString('base64url')
}

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** QR token: base64url(JSON({exp})) + '.' + hmac */
export function mintQrToken(expUnix: number, secret = getGallerySecret()): string {
  const payload = b64url(JSON.stringify({ exp: expUnix }))
  return `${payload}.${sign(payload, secret)}`
}

export function verifyQrToken(
  token: string,
  secret = getGallerySecret(),
  nowUnix = Math.floor(Date.now() / 1000)
): { ok: true; exp: number } | { ok: false; reason: string } {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return { ok: false, reason: 'malformed' }
  if (!safeEqual(sign(payload, secret), sig)) return { ok: false, reason: 'bad_sig' }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number
    }
    if (typeof data.exp !== 'number') return { ok: false, reason: 'bad_payload' }
    if (nowUnix > data.exp) return { ok: false, reason: 'expired' }
    return { ok: true, exp: data.exp }
  } catch {
    return { ok: false, reason: 'bad_payload' }
  }
}

/** Session cookie value: base64url(JSON({iat})) + '.' + hmac */
export function mintSessionValue(
  nowUnix = Math.floor(Date.now() / 1000),
  secret = getGallerySecret()
): string {
  const payload = b64url(JSON.stringify({ iat: nowUnix }))
  return `${payload}.${sign(payload, secret)}`
}

export function verifySessionValue(
  value: string,
  secret = getGallerySecret(),
  nowUnix = Math.floor(Date.now() / 1000)
): boolean {
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return false
  if (!safeEqual(sign(payload, secret), sig)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      iat?: number
    }
    if (typeof data.iat !== 'number') return false
    if (nowUnix - data.iat > SESSION_MAX_AGE_SEC) return false
    if (data.iat > nowUnix + 60) return false
    return true
  } catch {
    return false
  }
}
