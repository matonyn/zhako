# Digital Poster Gallery — QR Session Gate + Dialog Viewer

**Date:** 2026-09-05  
**Status:** Approved approach A — awaiting spec review before implementation  
**Product:** Unlisted exhibition gallery (`digital-poster-gallery`)

## Goal

Visitors scan a physical QR at the exhibition, unlock the gallery for **1 hour** on that device, browse stations, and open posters **one at a time** in a high-quality full-screen dialog. Bare shared links to `/explore` must not work. Remove the “Explore the posters” button.

## Non-goals

- True DRM or preventing all URL forwarding of a still-valid QR token
- User accounts, passwords, or analytics
- Regenerating poster image assets
- Public SEO / indexing (gallery remains `noindex`)

## Access model (Approach A)

### Flow

1. Printed QR encodes: `{ORIGIN}/enter?t={signedToken}`
2. `GET /enter` validates the HMAC-signed token.
3. On success: set httpOnly cookie `gallery_ok` (Max-Age = **3600**), redirect to `/explore`.
4. On failure / missing cookie: show a calm lock screen — “Scan the exhibition QR to view the archive.” No poster content.
5. Middleware (or equivalent Next.js gate) protects `/explore` (and any poster API if added). Root `/` redirects into the same gate rules (authorized → `/explore`, else lock screen).

### Token

- Payload (compact): `{ exp: number }` unix expiry for the **printed QR validity window** (configurable; default long enough for the show, e.g. exhibition end date, not the 1h session).
- Signature: HMAC-SHA256 with `GALLERY_SECRET` (server env).
- Format: base64url(payload) + `.` + base64url(sig) (or single opaque signed string).
- Reusable: same printed QR can unlock many devices until `exp`. Each unlock still only grants a **1 hour** cookie on that browser.

### Cookie

| Attribute   | Value                          |
|------------|---------------------------------|
| Name       | `gallery_ok`                    |
| Value      | signed session marker (HMAC + issued-at) |
| HttpOnly   | true                            |
| Secure     | true in production              |
| SameSite   | `Lax`                           |
| Path       | `/`                             |
| Max-Age    | `3600` (1 hour)                 |

Sharing `/explore` without the cookie → lock screen.  
Sharing `/enter?t=...` while the QR token is still unexpired → works (accepted limitation of A).

### Lock screen

- Minimal copy, no poster thumbnails or titles leaked.
- No CTA that reveals a shareable deep link.
- Optional subtle brand line matching gallery typography.

### Ops

- Env: `GALLERY_SECRET` (required), `NEXT_PUBLIC_GALLERY_URL` (public origin for QR generation).
- Script: `npm run mint:qr-token` (or similar) prints the unlock URL / suggests QR payload for print tooling.
- README updated: how to mint token, print QR, set env on deploy.

## Gallery UX

### Browse

- Station selector + poster grid (existing information architecture kept).
- **Remove** the “Explore the posters” button and empty header CTA block.
- Header: brand/title + one short supporting line only.
- Grid shows thumbnails + titles; click opens viewer — **never auto-open**.

### Viewer (shadcn Dialog)

- Full-screen / near-full-screen Dialog focused on **one** poster.
- Image: best available quality (`-3000.webp` preferred, fall back to `.jpg`).
- Controls: Close, Previous, Next (also Escape / arrow keys).
- Caption: station name, poster title, id — secondary to the image.
- Opening a poster does not navigate the URL (client dialog state), so sharing the page URL does not deep-link a specific poster (extra anti-share nicety).

### Visual direction

- Install **shadcn/ui** (Dialog, Button; Sheet only if needed later).
- Quiet archive aesthetic: expressive serif for titles, restrained sans for UI chrome.
- Avoid purple gradients, cream+terracotta cliché, heavy card stacks, glow, emoji.
- Dialog: dark dimmed overlay, image as the dominant surface; chrome minimal.
- Light motion: dialog enter/exit; optional soft station-switch fade — not noise.

## Technical plan (implementation outline)

1. Add shadcn (`components.json`, `lib/utils.ts`, Dialog, Button) compatible with current Next 16 + Tailwind 3.
2. `lib/galleryAuth.ts` — sign/verify QR tokens + session cookies (Node `crypto`).
3. `app/enter/route.ts` or `app/enter/page.tsx` — redeem token → set cookie → redirect.
4. `middleware.ts` — require valid `gallery_ok` for `/explore`; allow `/enter`, static assets, lock/denied UI.
5. Lock UI at `/` or dedicated unauthorized response for `/explore`.
6. Replace `PosterViewer` overlay with shadcn Dialog; wire prev/next; use max-res image helpers.
7. Clean explore page (remove explore button).
8. Mint script + README + `.env.example`.

## Security notes (honest limits)

- This is **access friction**, not cryptography against a determined attacker who obtains a live QR URL or scrapes cookies from an unlocked device.
- Do not commit `GALLERY_SECRET`.
- Rotate secret invalidates old QRs (must reprint) and existing cookies.

## Success criteria

- [ ] Visiting `/explore` without cookie shows lock screen, no posters.
- [ ] Valid QR URL sets 1h cookie and opens gallery.
- [ ] After 1 hour, gallery locks until re-scan.
- [ ] No “Explore the posters” button.
- [ ] Posters open only on click, one at a time, in Dialog at best quality.
- [ ] Mint script produces a printable unlock URL.

## Out of scope follow-ups

- One-time redeem tokens (Approach B)
- Password overlay
- Per-station QR codes
