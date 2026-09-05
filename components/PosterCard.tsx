'use client'

import { Poster } from '@/data/posters'
import { posterJpg, posterWebpSrcSet } from '@/lib/posterUrl'

export default function PosterCard({
  poster,
  index,
  station,
  onOpen,
}: {
  poster: Poster
  index: number
  station: string
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="group relative w-full overflow-hidden border border-neutral-200 bg-white/80 text-left transition-shadow duration-300 hover:border-shell-yellow hover:shadow-[0_10px_30px_-24px_rgba(0,0,0,0.5)] focus-ring"
      aria-label={`Open ${poster.title}`}
    >
      <div className="relative aspect-[3/4] w-full bg-[linear-gradient(180deg,rgba(250,250,248,1),rgba(241,241,238,1))]">
        <picture>
          <source
            type="image/webp"
            srcSet={posterWebpSrcSet(poster.image, [1200, 2000, 3000])}
          />
          <img
            src={posterJpg(poster.image)}
            alt={poster.title}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/85 via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex items-start justify-between gap-3 px-4 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">{station}</div>
          <div className="mt-2 font-heading text-lg font-semibold leading-snug text-neutral-950">{poster.title}</div>
          <div className="mt-1 text-xs text-neutral-500">Poster {poster.id}</div>
        </div>
        <div className="mt-1 rounded-full border border-shell-yellow bg-shell-yellow/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-shell-red-dark opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Open
        </div>
      </div>
    </button>
  )
}
