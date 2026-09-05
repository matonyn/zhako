process.env.GALLERY_SECRET = 'test-secret-at-least-32-chars-long!!'
const {
  mintQrToken,
  verifyQrToken,
  mintSessionValue,
  verifySessionValue,
  SESSION_MAX_AGE_SEC,
} = await import('../lib/galleryAuth.ts')

const now = Math.floor(Date.now() / 1000)
const token = mintQrToken(now + 86400)
const bad = verifyQrToken(token + 'x')
const good = verifyQrToken(token)
const expired = verifyQrToken(mintQrToken(now - 10))
const session = mintSessionValue(now)
const sessionOk = verifySessionValue(session, undefined, now)
const sessionOld = verifySessionValue(
  mintSessionValue(now - SESSION_MAX_AGE_SEC - 5),
  undefined,
  now
)

if (!good.ok) throw new Error('good token failed')
if (bad.ok) throw new Error('tampered should fail')
if (expired.ok) throw new Error('expired should fail')
if (!sessionOk) throw new Error('session should pass')
if (sessionOld) throw new Error('old session should fail')
console.log('PASS galleryAuth')
