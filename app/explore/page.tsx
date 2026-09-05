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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(245,243,238,0.96),rgba(255,255,255,1)_54%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(16,16,16,0.04),rgba(16,16,16,0))]" />
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:py-12">
        <header className="border-b border-neutral-200 pb-8">
          <p className="text-[11px] uppercase tracking-[0.36em] text-neutral-500">
            Digital Poster Gallery
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-neutral-950 sm:text-5xl">
            SCA Poster Session 2026
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
            Scan the exhibition QR to unlock this archive on your device for one hour, then open
            each poster individually in a full-screen document viewer.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <StationSelector
              stations={stations}
              onSelect={(n) => {
                setActive(n)
                setViewerOpen(false)
              }}
              active={active}
            />
          </aside>
          <div className="min-w-0">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  Selected station
                </div>
                <h2
                  id={`station-${station.station}`}
                  className="mt-2 font-serif text-2xl text-neutral-950"
                >
                  {station.title}
                </h2>
              </div>
              <div className="text-right text-sm text-neutral-500">
                {station.posters.length} posters
              </div>
            </div>
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
    </div>
  )
}
