# QR Session Gate + Dialog Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the gallery behind a QR-redeemed 1-hour cookie, and open posters one-at-a-time in a high-quality shadcn Dialog (no Explore button).

**Architecture:** HMAC-signed QR tokens redeemed at `/enter` set an httpOnly `gallery_ok` cookie (Max-Age 3600). Next.js 16 `proxy.ts` (middleware replacement) blocks `/explore` without a valid cookie and rewrites unauthorized users to a lock page. Browse UI stays station + grid; `PosterViewer` becomes a controlled shadcn Dialog showing `-3000.webp` / `.jpg`.

**Tech Stack:** Next.js 16.3.4 App Router, React 18, Tailwind 3, shadcn/ui (Dialog + Button), Node `crypto`, Framer Motion (existing, optional for soft fades).

## Global Constraints

- Session cookie duration: **3600 seconds (1 hour)** — exact
- Cookie name: **`gallery_ok`** — httpOnly, SameSite=Lax, Secure in production
- Lock copy: **“Scan the exhibition QR to view the archive.”**
- No “Explore the posters” button
- Posters never auto-open; Dialog only on click; best quality (`-3000.webp` preferred)
- Next.js 16: use **`proxy.ts`** (not deprecated `middleware.ts`)
- Do not commit secrets; provide `.env.example` only
- Gallery remains `noindex`

## File map

| File | Responsibility |
|------|----------------|
| `lib/galleryAuth.ts` | Sign/verify QR tokens + session cookies |
| `lib/posterUrl.ts` | Add `posterBestSrc` / keep encode helpers |
| `lib/utils.ts` | shadcn `cn()` helper |
| `components.json` | shadcn config |
| `components/ui/dialog.tsx` | shadcn Dialog |
| `components/ui/button.tsx` | shadcn Button |
| `proxy.ts` | Gate `/` and `/explore` on cookie |
| `app/enter/route.ts` | Redeem `?t=` → set cookie → redirect |
| `app/locked/page.tsx` | Lock screen (no poster content) |
| `app/page.tsx` | Authorized → explore; else locked (or rely on proxy rewrite) |
| `app/explore/page.tsx` | Gallery UI without Explore CTA |
| `components/PosterViewer.tsx` | shadcn Dialog viewer |
| `components/PosterCard.tsx` | Thumbnail + open trigger |
| `scripts/mint-qr-token.mjs` | Print unlock URL |
| `.env.example` | `GALLERY_SECRET`, `NEXT_PUBLIC_GALLERY_URL` |
| `README.md` | QR mint + env docs |
| `tsconfig.json` | Add `@/*` paths for shadcn |

---

### Task 1: Path alias + gallery auth library

**Files:**
- Modify: `tsconfig.json`
- Create: `lib/galleryAuth.ts`
- Create: `scripts/verify-gallery-auth.mjs` (throwaway Node test runner — delete after Task 1 or keep as smoke script)
- Create: `.env.example`

**Interfaces:**
- Consumes: `process.env.GALLERY_SECRET`
- Produces:
  - `SESSION_COOKIE_NAME = 'gallery_ok'`
  - `SESSION_MAX_AGE_SEC = 3600`
  - `mintQrToken(expUnix: number, secret?: string): string`
  - `verifyQrToken(token: string, secret?: string): { ok: true; exp: number } | { ok: false; reason: string }`
  - `mintSessionValue(nowUnix?: number, secret?: string): string`
  - `verifySessionValue(value: string, secret?: string, nowUnix?: number): boolean`
  - `getGallerySecret(): string` (throws if missing)

- [ ] **Step 1: Add `@/*` paths to tsconfig**

In `tsconfig.json` `compilerOptions`, add:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./*"]
}
```

- [ ] **Step 2: Write `.env.example`**

```bash
GALLERY_SECRET=replace-with-long-random-string
NEXT_PUBLIC_GALLERY_URL=http://localhost:3000
```

- [ ] **Step 3: Write failing auth smoke script**

Create `scripts/verify-gallery-auth.mjs`:

```js
import { createHmac, timingSafeEqual } from 'node:crypto'

// Temporary inline expectation — will import compiled logic after implementation.
// For now assert helpers file can be loaded via dynamic import of ts is unavailable;
// After galleryAuth exists, replace body with:
process.env.GALLERY_SECRET = 'test-secret-at-least-32-chars-long!!'
const { mintQrToken, verifyQrToken, mintSessionValue, verifySessionValue, SESSION_MAX_AGE_SEC } =
  await import('../lib/galleryAuth.ts').catch(() => ({ mintQrToken: undefined }))

if (typeof mintQrToken !== 'function') {
  console.error('FAIL: mintQrToken missing')
  process.exit(1)
}
```

Run: `node --experimental-strip-types scripts/verify-gallery-auth.mjs`  
Expected: FAIL (module missing or export missing)

- [ ] **Step 4: Implement `lib/galleryAuth.ts`**

```ts
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
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number }
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
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { iat?: number }
    if (typeof data.iat !== 'number') return false
    if (nowUnix - data.iat > SESSION_MAX_AGE_SEC) return false
    if (data.iat > nowUnix + 60) return false
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 5: Replace smoke script with full assertions**

```js
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
const sessionOld = verifySessionValue(mintSessionValue(now - SESSION_MAX_AGE_SEC - 5), undefined, now)

if (!good.ok) throw new Error('good token failed')
if (bad.ok) throw new Error('tampered should fail')
if (expired.ok) throw new Error('expired should fail')
if (!sessionOk) throw new Error('session should pass')
if (sessionOld) throw new Error('old session should fail')
console.log('PASS galleryAuth')
```

Run: `node --experimental-strip-types scripts/verify-gallery-auth.mjs`  
Expected: `PASS galleryAuth`

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json lib/galleryAuth.ts scripts/verify-gallery-auth.mjs .env.example
git commit -m "feat: add HMAC gallery QR and session auth helpers"
```

---

### Task 2: Enter route + lock page + proxy gate

**Files:**
- Create: `app/enter/route.ts`
- Create: `app/locked/page.tsx`
- Create: `proxy.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `verifyQrToken`, `mintSessionValue`, `verifySessionValue`, `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_SEC` from `@/lib/galleryAuth`
- Produces: `/enter?t=` sets cookie; unauthorized `/explore` and `/` → `/locked`

- [ ] **Step 1: Create lock page**

`app/locked/page.tsx`:

```tsx
export const metadata = {
  title: 'Archive locked',
  robots: { index: false, follow: false, nocache: true },
}

export default function LockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-serif text-2xl tracking-wide">A Shared Archive</p>
        <p className="mt-4 text-gray-600">
          Scan the exhibition QR to view the archive.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create enter route**

`app/enter/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
  mintSessionValue,
  verifyQrToken,
} from '@/lib/galleryAuth'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')
  if (!token) {
    return NextResponse.redirect(new URL('/locked', request.url))
  }

  let verified
  try {
    verified = verifyQrToken(token)
  } catch {
    return NextResponse.redirect(new URL('/locked', request.url))
  }

  if (!verified.ok) {
    return NextResponse.redirect(new URL('/locked', request.url))
  }

  const res = NextResponse.redirect(new URL('/explore', request.url))
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: mintSessionValue(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })
  return res
}
```

- [ ] **Step 3: Create `proxy.ts` at project root**

```ts
import { NextRequest, NextResponse } from 'next/server'
import {
  SESSION_COOKIE_NAME,
  verifySessionValue,
} from '@/lib/galleryAuth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/enter' || pathname === '/locked') {
    return NextResponse.next()
  }

  if (pathname === '/' || pathname.startsWith('/explore')) {
    const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value
    let ok = false
    try {
      ok = Boolean(raw && verifySessionValue(raw))
    } catch {
      ok = false
    }

    if (!ok) {
      const url = request.nextUrl.clone()
      url.pathname = '/locked'
      url.search = ''
      return NextResponse.redirect(url)
    }

    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/explore'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/explore/:path*', '/enter', '/locked'],
}
```

- [ ] **Step 4: Simplify `app/page.tsx`**

Proxy already redirects `/` → `/explore` when authorized and `/locked` when not. Keep a thin fallback:

```tsx
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/explore')
}
```

- [ ] **Step 5: Manual verify with env + curl**

```bash
# terminal A
export GALLERY_SECRET='test-secret-at-least-32-chars-long!!'
npm run dev

# terminal B
node --experimental-strip-types -e "
process.env.GALLERY_SECRET='test-secret-at-least-32-chars-long!!'
const { mintQrToken } = await import('./lib/galleryAuth.ts')
const exp = Math.floor(Date.now()/1000) + 86400*30
console.log('http://localhost:3000/enter?t=' + mintQrToken(exp))
"

curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/explore
# Expected: 307/308 to http://localhost:3000/locked

curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -c /tmp/g.txt 'http://localhost:3000/enter?t=TOKEN'
# Expected: redirect to /explore with Set-Cookie

curl -s -o /dev/null -w '%{http_code}\n' -b /tmp/g.txt http://localhost:3000/explore
# Expected: 200
```

- [ ] **Step 6: Commit**

```bash
git add app/enter/route.ts app/locked/page.tsx proxy.ts app/page.tsx
git commit -m "feat: gate gallery behind QR entry and session cookie"
```

---

### Task 3: Install shadcn Dialog + Button

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/dialog.tsx`
- Modify: `app/globals.css` (CSS variables if CLI adds them)
- Modify: `package.json` (deps: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-slot`)

**Interfaces:**
- Produces: `@/components/ui/dialog`, `@/components/ui/button`, `@/lib/utils` `cn()`

- [ ] **Step 1: Init shadcn non-interactively**

```bash
npx shadcn@latest init -y -d
npx shadcn@latest add dialog button -y
```

If CLI fails on Next 16 / Tailwind 3, manually add:

`lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install:

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-dialog @radix-ui/react-slot
```

Copy current shadcn Dialog + Button source into `components/ui/` (standard shadcn New York style is fine). Ensure `components.json` points style to `new-york`, rsc true, tsx true, aliases `@/components`, `@/lib/utils`, `@/components/ui`.

- [ ] **Step 2: Verify imports compile**

Create temporary `app/shadcn-check/page.tsx` (delete in Step 3):

```tsx
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export default function Page() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>ok</DialogContent>
    </Dialog>
  )
}
```

Visit `/shadcn-check` with a valid session cookie (or temporarily allow in proxy) — Expected: button renders, dialog opens.

- [ ] **Step 3: Delete `app/shadcn-check` and commit**

```bash
rm -rf app/shadcn-check
git add components.json lib/utils.ts components/ui package.json package-lock.json app/globals.css tailwind.config.js
git commit -m "chore: add shadcn dialog and button"
```

---

### Task 4: Best-quality poster URLs + Dialog viewer

**Files:**
- Modify: `lib/posterUrl.ts`
- Modify: `components/PosterViewer.tsx`
- Modify: `components/PosterCard.tsx` (only if needed for trigger semantics)

**Interfaces:**
- Consumes: `Poster` from `@/data/posters`; Dialog/Button from ui
- Produces: `posterBestSrc(imagePath: string): { webp?: string; jpg: string }`
- `PosterViewer` props unchanged: `{ posters, stationTitle, index, open, onClose, onNavigate }`

- [ ] **Step 1: Extend `lib/posterUrl.ts`**

Add:

```ts
export function posterBestSrc(imagePath: string): { webp: string; jpg: string } {
  const base = encodePosterPath(imagePath)
  return {
    webp: `${base}-3000.webp`,
    jpg: `${base}.jpg`,
  }
}
```

- [ ] **Step 2: Rewrite `PosterViewer` with shadcn Dialog**

Replace framer full-screen overlay with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Poster } from '@/data/posters'
import { posterBestSrc } from '@/lib/posterUrl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  posters: Poster[]
  stationTitle: string
  index: number
  open: boolean
  onClose: () => void
  onNavigate: (idx: number) => void
}

export default function PosterViewer({
  posters,
  stationTitle,
  index,
  open,
  onClose,
  onNavigate,
}: Props) {
  const [idx, setIdx] = useState(index)
  useEffect(() => setIdx(index), [index])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && idx < posters.length - 1) {
        const next = idx + 1
        setIdx(next)
        onNavigate(next)
      }
      if (e.key === 'ArrowLeft' && idx > 0) {
        const prev = idx - 1
        setIdx(prev)
        onNavigate(prev)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [idx, onNavigate, open, posters.length])

  const poster = posters[idx]
  const src = poster ? posterBestSrc(poster.image) : null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-[min(96vw,1100px)] border-0 bg-neutral-950 p-0 text-white sm:rounded-lg overflow-hidden">
        {poster && src && (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{poster.title}</DialogTitle>
              <DialogDescription>{stationTitle}</DialogDescription>
            </DialogHeader>
            <div className="relative flex min-h-[70vh] items-center justify-center bg-black px-4 py-10">
              <picture>
                <source type="image/webp" srcSet={src.webp} />
                <img
                  src={src.jpg}
                  alt={poster.title}
                  className="max-h-[78vh] w-auto max-w-full object-contain"
                  draggable={false}
                />
              </picture>
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  disabled={idx <= 0}
                  onClick={() => {
                    const prev = idx - 1
                    setIdx(prev)
                    onNavigate(prev)
                  }}
                  aria-label="Previous poster"
                >
                  ‹
                </Button>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  disabled={idx >= posters.length - 1}
                  onClick={() => {
                    const next = idx + 1
                    setIdx(next)
                    onNavigate(next)
                  }}
                  aria-label="Next poster"
                >
                  ›
                </Button>
              </div>
            </div>
            <figcaption className="border-t border-white/10 px-4 py-3 text-center">
              <div className="text-xs text-white/60">{stationTitle}</div>
              <div className="mt-1 font-serif text-lg">{poster.title}</div>
              <div className="text-xs text-white/50">Poster {poster.id}</div>
            </figcaption>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

Note: Escape/close handled by Dialog. Do **not** change the URL when opening.

- [ ] **Step 3: Manual check**

With session cookie, open `/explore`, click a poster → Dialog shows large image; arrows cycle within station; close returns to grid without auto-reopen.

- [ ] **Step 4: Commit**

```bash
git add lib/posterUrl.ts components/PosterViewer.tsx
git commit -m "feat: open posters in shadcn dialog at full resolution"
```

---

### Task 5: Explore page cleanup + visual polish

**Files:**
- Modify: `app/explore/page.tsx`
- Modify: `app/layout.tsx` / `app/globals.css` / `components/StationSelector.tsx` / `components/PosterCard.tsx` / `components/PosterGrid.tsx` as needed for quieter archive look

**Interfaces:**
- Consumes: existing station data + PosterViewer props

- [ ] **Step 1: Remove Explore button and scroll ref**

`app/explore/page.tsx` should look like:

```tsx
'use client'

import { useState } from 'react'
import stations from '@/data/posters'
import StationSelector from '@/components/StationSelector'
import PosterGrid from '@/components/PosterGrid'
import PosterViewer from '@/components/PosterViewer'

export default function ExplorePage() {
  const [active, setActive] = useState(1)
  const station = stations.find((s) => s.station === active) ?? stations[0]
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-10">
        <h1 className="font-serif text-4xl tracking-tight">A Shared Archive</h1>
        <p className="mt-3 max-w-xl text-neutral-600">
          A curated digital extension of the exhibition — 20 posters across five stations.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <StationSelector
            stations={stations}
            onSelect={(n) => {
              setActive(n)
              setViewerOpen(false)
            }}
            active={active}
          />
        </aside>
        <div className="lg:col-span-8">
          <h2 id={`station-${station.station}`} className="sr-only">
            {station.title}
          </h2>
          <PosterGrid
            station={station}
            onOpen={(index) => {
              setViewerIndex(index)
              setViewerOpen(true)
            }}
          />
        </div>
      </div>

      <PosterViewer
        posters={station.posters}
        stationTitle={station.title}
        index={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onNavigate={(i) => setViewerIndex(i)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Quiet down station/card chrome**

- Prefer hairline borders / no heavy shadows
- Serif for station titles; small muted labels
- Thumbnail `object-contain` on neutral ground (keep)
- Avoid purple, glow, pill clusters

- [ ] **Step 3: Confirm no Explore button in HTML**

```bash
curl -s -b /tmp/g.txt http://localhost:3000/explore | grep -c 'Explore the posters'
# Expected: 0
```

- [ ] **Step 4: Commit**

```bash
git add app/explore/page.tsx components/StationSelector.tsx components/PosterCard.tsx components/PosterGrid.tsx app/globals.css app/layout.tsx
git commit -m "refactor: remove explore CTA and refine archive layout"
```

---

### Task 6: Mint script + README

**Files:**
- Create: `scripts/mint-qr-token.mjs`
- Modify: `package.json` (script `mint:qr-token`)
- Modify: `README.md`

**Interfaces:**
- Consumes: `GALLERY_SECRET`, `NEXT_PUBLIC_GALLERY_URL` (or `--origin`, `--days`)
- Produces: printed unlock URL on stdout

- [ ] **Step 1: Add mint script**

`scripts/mint-qr-token.mjs`:

```js
#!/usr/bin/env node
import { createHmac } from 'node:crypto'

function requireSecret() {
  const secret = process.env.GALLERY_SECRET
  if (!secret || secret.length < 16) {
    console.error('Set GALLERY_SECRET (min 16 chars)')
    process.exit(1)
  }
  return secret
}

function b64url(s) {
  return Buffer.from(s).toString('base64url')
}

function mintQrToken(expUnix, secret) {
  const payload = b64url(JSON.stringify({ exp: expUnix }))
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

const days = Number(process.env.QR_DAYS || process.argv.find((a) => a.startsWith('--days='))?.split('=')[1] || 90)
const origin = (process.env.NEXT_PUBLIC_GALLERY_URL || 'http://localhost:3000').replace(/\/$/, '')
const secret = requireSecret()
const exp = Math.floor(Date.now() / 1000) + Math.floor(days * 86400)
const token = mintQrToken(exp, secret)
const url = `${origin}/enter?t=${token}`
console.log(url)
console.log(`# QR token expires in ${days} day(s) at unix ${exp}`)
console.log('# Encode this URL in your printed QR. Session after scan lasts 1 hour.')
```

Add to `package.json` scripts:

```json
"mint:qr-token": "node scripts/mint-qr-token.mjs"
```

- [ ] **Step 2: Update README Quick start**

Document:

1. Copy `.env.example` → `.env.local`, set `GALLERY_SECRET` and `NEXT_PUBLIC_GALLERY_URL`
2. `npm run dev`
3. `GALLERY_SECRET=... npm run mint:qr-token` → put URL in QR generator
4. Scan QR → gallery for 1 hour; `/explore` alone shows lock screen
5. Note: approach A limitation — sharing a live QR URL still works until QR token expiry

- [ ] **Step 3: Run mint script**

```bash
GALLERY_SECRET='test-secret-at-least-32-chars-long!!' NEXT_PUBLIC_GALLERY_URL='http://localhost:3000' npm run mint:qr-token
```

Expected: prints `http://localhost:3000/enter?t=...`

- [ ] **Step 4: Commit**

```bash
git add scripts/mint-qr-token.mjs package.json README.md
git commit -m "docs: add QR token mint script and access instructions"
```

---

### Task 7: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Cold `/explore` locked**

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/explore
```

Expected: redirect to `/locked`

- [ ] **Step 2: Redeem QR → explore 200**

Use mint URL with cookie jar; Expected: `/explore` returns 200 and HTML contains `A Shared Archive` and a poster title (e.g. `Caravan`), and does **not** contain `Explore the posters`.

- [ ] **Step 3: Locked page has no poster assets listed**

```bash
curl -s http://localhost:3000/locked | grep -c '/posters/'
# Expected: 0
```

- [ ] **Step 4: Spec success criteria checklist**

Mark all success criteria in the design spec as done in the PR description / final message:

- Visiting `/explore` without cookie → lock
- Valid QR → 1h cookie → gallery
- No Explore button
- Dialog one-at-a-time best quality
- Mint script works

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| QR → `/enter?t=` → cookie 1h → `/explore` | 2 |
| HMAC token + session cookie attrs | 1, 2 |
| Lock screen copy, no poster leak | 2, 7 |
| `proxy` gate (not middleware) | 2 |
| Remove Explore button | 5 |
| shadcn Dialog best quality one-by-one | 3, 4 |
| Mint script + env + README | 1, 6 |
| Honest share limitation documented | 6 |

## Placeholder scan

None intentional — all steps include concrete code/commands.

## Type consistency

- Cookie name `gallery_ok` / `SESSION_COOKIE_NAME` consistent across Tasks 1–2
- `PosterViewer` prop names unchanged for Task 5
- `posterBestSrc` used by Task 4 only for dialog; cards keep `posterWebpSrcSet` / `posterJpg`
