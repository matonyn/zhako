'use client'

import { useState } from 'react'
import stations from '@/data/posters'
import StationSelector from '@/components/StationSelector'
import PosterGrid from '@/components/PosterGrid'
import PosterViewer from '@/components/PosterViewer'
import BrandMark from '@/components/BrandMark'

export default function ExplorePage() {
  const [active, setActive] = useState(1)
  const station = stations.find((s) => s.station === active) ?? stations[0]
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <header className="hero-shell px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <BrandMark />
          <p className="hero-kicker mt-8 text-xs font-semibold uppercase tracking-[0.36em]">
            Welcome to
          </p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
            SCA Poster Session 2026
          </h1>
          <div className="hero-underline mt-5 h-1 w-16 rounded-full" />
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold uppercase tracking-[0.22em] text-white">
            <span>Shape</span>
            <span className="text-shell-yellow">•</span>
            <span>Connect</span>
            <span className="text-shell-yellow">•</span>
            <span>Accelerate</span>
          </div>
          <a
            href="/agenda/sca-poster-session-agenda.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-shell-yellow px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-shell-navy transition-colors hover:bg-white focus-ring"
          >
            View Agenda
          </a>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
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
                  className="mt-2 font-heading text-2xl font-bold text-neutral-950"
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
