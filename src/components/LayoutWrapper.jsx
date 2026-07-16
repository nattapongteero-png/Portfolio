// -----------------------------------------------------------------------------
// LayoutWrapper.jsx
// One responsive full-viewport shell. The Figma mobile and web layouts are the
// same structure at different breakpoints, so a single <VerticalFeed /> covers
// both — it renders the compact mobile design below md and the spacious web
// design at md and up. `wheelSnap` gives desktops one-section-per-scroll.
// -----------------------------------------------------------------------------

import VerticalFeed from './VerticalFeed'

export default function LayoutWrapper() {
  // Let desktop use the same native snap-scroll as mobile so the wheel/fade
  // track scroll continuously instead of jumping one section per wheel tick.
  return (
    <div className="h-dvh w-full bg-[#fafafa]">
      <VerticalFeed wheelSnap={false} />
    </div>
  )
}
