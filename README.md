# digital-poster-gallery

Mobile-first digital poster gallery for an exhibition. Next.js + TypeScript + Tailwind + shadcn Dialog. Access is gated by a printed QR code.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy env and set a secret:

```bash
cp .env.example .env.local
# edit GALLERY_SECRET (min 16 chars) and NEXT_PUBLIC_GALLERY_URL
```

3. Run the development server:

```bash
npm run dev
```

4. Mint a QR unlock URL:

```bash
GALLERY_SECRET='your-secret-here' NEXT_PUBLIC_GALLERY_URL='http://localhost:3000' npm run mint:qr-token
```

Encode that printed URL in your exhibition QR. Scanning it unlocks `/explore` for **1 hour** on that device (httpOnly cookie). Visiting `/explore` or `/` without scanning shows a lock screen.

**Note:** Sharing the bare `/explore` link does not work. Sharing a still-valid QR unlock URL (`/enter?t=…`) will work until that QR token expires — that is an accepted limitation of the session-after-QR model.

## Access model

| Path | Behavior |
|------|----------|
| `/enter?t=…` | Validates signed QR token, sets `gallery_ok` cookie (1h), redirects to `/explore` |
| `/explore` | Gallery — requires valid session cookie |
| `/locked` | “Scan the exhibition QR to view the archive.” |
| `/` | Redirects to `/explore` if unlocked, otherwise to `/locked` |

## Replace posters

Poster assets live in `public/posters/station-01/` … `station-05/`. Edit titles in `data/posters.ts`. Image paths must match filenames on disk (spaces and unicode included).

PPTX conversion:

```bash
npm run convert:posters
```

Requires LibreOffice (`soffice`) + `sharp`. Produces JPG + responsive WebP sizes.

## Unlisted / no-index

`robots.txt` and meta tags keep the gallery out of search. Unlisted is not the same as encrypted access — use the QR gate above.

## Deploy

Set `GALLERY_SECRET` and `NEXT_PUBLIC_GALLERY_URL` on the host. Mint a production QR URL with the same secret before printing signage. Rotating the secret invalidates old QRs and sessions.
