export const metadata = {
  title: 'Archive locked',
  robots: { index: false, follow: false, nocache: true },
}

export default function LockedPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,243,238,0.96),rgba(255,255,255,1)_56%)] px-6">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center text-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.36em] text-neutral-500">Digital Poster Gallery</p>
          <p className="mt-4 font-serif text-3xl leading-tight text-neutral-950">Scan the exhibition QR</p>
          <p className="mt-4 text-sm leading-6 text-neutral-600">
            This archive opens only after the gallery QR is scanned on-site.
          </p>
        </div>
      </div>
    </div>
  )
}
