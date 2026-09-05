import BrandMark from '@/components/BrandMark'

export const metadata = {
  title: 'Archive locked',
  robots: { index: false, follow: false, nocache: true },
}

export default function LockedPage() {
  return (
    <div className="hero-shell relative flex min-h-screen items-center overflow-hidden px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <BrandMark />
        <p className="hero-kicker mt-8 text-xs font-semibold uppercase tracking-[0.36em]">
          Welcome to
        </p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
          SCA Poster Session 2026
        </h1>
        <div className="hero-underline mt-5 h-1 w-16 rounded-full" />
        <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold uppercase tracking-[0.22em] text-white">
          <span>Shape</span>
          <span className="text-shell-yellow">•</span>
          <span>Connect</span>
          <span className="text-shell-yellow">•</span>
          <span>Accelerate</span>
        </div>
      </div>
    </div>
  )
}
