// -----------------------------------------------------------------------------
// BackButton.jsx
// The one way out, shared. Three pages had drawn the same black disc with their
// own copy of the same class string — project profile, detail reel, and the
// contact page nearly got a fourth. The rect is measured, and every page on this
// site parks it there so it never moves when the page does. On desktop it opens
// the heading's row at x32 — the same x the feed's section title starts at — and
// is centred on the 72px heading beside it (title top 25 + 36 − half the 48px
// button = 37).
// -----------------------------------------------------------------------------

import { ArrowLeft } from 'lucide-react'

export default function BackButton({ onClick, label = 'back', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      // Fixed, not absolute: these overlays are their own scrollers, and an
      // absolute button scrolled away with the page while the title above it
      // stayed stuck.
      className={`fixed left-4 top-5 z-30 grid size-10 place-items-center rounded-full bg-[#21221f] text-white transition hover:bg-[#3a3a35] active:scale-90 md:left-8 md:top-[37px] md:size-12 ${className}`}
    >
      <ArrowLeft className="size-5 md:size-6" />
    </button>
  )
}
