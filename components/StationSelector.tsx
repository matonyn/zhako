'use client'

import { Station } from '@/data/posters'

export default function StationSelector({
  stations,
  onSelect,
  active,
}: {
  stations: Station[]
  onSelect: (s: number) => void
  active?: number
}) {
  return (
    <nav aria-label="Stations" className="space-y-2 rounded-2xl border border-neutral-200 bg-white/70 p-3 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      {stations.map((s) => (
        <button
          key={s.station}
          onClick={() => onSelect(s.station)}
          className={`w-full rounded-xl border px-3 py-3 text-left transition-colors focus-ring ${
            active === s.station
              ? 'border-neutral-900 bg-neutral-950 text-white'
              : 'border-transparent hover:border-neutral-200 hover:bg-white'
          }`}
        >
          <div className={`text-xs tracking-[0.28em] ${active === s.station ? 'text-white/55' : 'text-neutral-500'}`}>
            {String(s.station).padStart(2, '0')}
          </div>
          <div className={`mt-1 font-serif text-lg tracking-wide ${active === s.station ? 'text-white' : 'text-neutral-950'}`}>
            {s.title}
          </div>
          <div className={`mt-2 text-xs uppercase tracking-[0.22em] ${active === s.station ? 'text-white/55' : 'text-neutral-500'}`}>
            {s.posters.length} posters
          </div>
        </button>
      ))}
    </nav>
  )
}
