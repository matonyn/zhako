'use client'

import { Station } from '@/data/posters'
import PosterCard from './PosterCard'

export default function PosterGrid({
  station,
  onOpen,
}: {
  station: Station
  onOpen: (index: number) => void
}) {
  return (
    <section
      aria-labelledby={`station-${station.station}`}
      className="grid grid-cols-1 gap-6 sm:grid-cols-2"
    >
      {station.posters.map((p, i) => (
        <PosterCard
          key={p.id}
          poster={p}
          index={i}
          station={station.title}
          onOpen={() => onOpen(i)}
        />
      ))}
    </section>
  )
}
