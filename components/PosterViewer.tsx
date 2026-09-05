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
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

  const poster = posters[idx]
  const src = poster ? posterBestSrc(poster.image) : null

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= posters.length) return
    setIdx(nextIndex)
    onNavigate(nextIndex)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goTo(idx + 1)
      }
      if (e.key === 'ArrowLeft') {
        goTo(idx - 1)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [idx, open, posters.length])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="h-[100dvh] w-[100dvw] max-w-none rounded-none border-0 bg-neutral-950 p-0 text-white shadow-none [&>button]:right-4 [&>button]:top-4 [&>button]:h-10 [&>button]:w-10 [&>button]:border [&>button]:border-white/15 [&>button]:bg-white/10 [&>button]:text-white">
        {poster && src && (
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b border-white/10 px-5 py-4 text-left">
              <DialogTitle className="font-heading text-xl font-semibold tracking-wide text-white">
                {poster.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs uppercase tracking-[0.28em] text-shell-yellow/80">
                {stationTitle} · Poster {poster.id}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-1 items-center justify-center px-4 py-5 sm:px-6">
              <div className="relative flex h-full w-full items-center justify-center">
                <picture className="flex h-full w-full items-center justify-center">
                  <source type="image/webp" srcSet={src.webp} />
                  <img
                    src={src.jpg}
                    alt={poster.title}
                    className="max-h-[calc(100dvh-11rem)] w-auto max-w-full select-none object-contain"
                    draggable={false}
                  />
                </picture>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4">
              <p className="text-sm text-white/55">Use arrow keys to move through the station.</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
                  disabled={idx <= 0}
                  onClick={() => goTo(idx - 1)}
                  aria-label="Previous poster"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
                  disabled={idx >= posters.length - 1}
                  onClick={() => goTo(idx + 1)}
                  aria-label="Next poster"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
