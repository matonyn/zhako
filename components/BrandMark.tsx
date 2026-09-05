export default function BrandMark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md bg-shell-red px-2.5 py-1 ${className}`}
      aria-label="Shell"
    >
      <span className="font-heading text-sm font-extrabold tracking-wide text-shell-yellow">
        SHELL
      </span>
    </div>
  )
}
