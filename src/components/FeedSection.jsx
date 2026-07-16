// -----------------------------------------------------------------------------
// FeedSection.jsx
// One full-viewport, snap-aligned section: a centered illustration with the
// action buttons pinned to the bottom-right corner. The title, description,
// hashtags and menu now live in <NavMenu />, a single top-left overlay that
// tracks whichever section is focused.
// -----------------------------------------------------------------------------

import { motion } from 'framer-motion'
import SideActions from './SideActions'
import OfficeScene from './OfficeScene'

export default function FeedSection({ domId, index, image, projectId, avatar, initial, scene, offset = 0 }) {
  // Subtle bottom fade while the section is scrolling away from focus — signals
  // "you're leaving this one". Zero at rest (offset 0), grows a little as it
  // slides. Bottom edge dips to ~80% opacity at most.
  const s = Math.min(Math.abs(offset), 1) * 0.2
  const fadeMask = `linear-gradient(to bottom, #000 62%, rgba(0,0,0,${1 - s}) 100%)`

  return (
    <section
      id={domId}
      data-section-index={index}
      className="relative h-dvh w-full shrink-0 snap-start snap-always overflow-hidden bg-[#fafafa]"
    >
      {/* Interactive 3D scene (e.g. MyAtlas) or the centered illustration */}
      {scene === 'office' ? (
        <div className="absolute inset-0">
          <OfficeScene />
        </div>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
        >
          <motion.img
            key={image + domId}
            src={image}
            alt=""
            draggable={false}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-[68%] max-w-[280px] object-contain md:w-[600px] md:max-w-none"
          />
        </div>
      )}

      {/* Action buttons — bottom-right corner (fade along with the bottom) */}
      <div
        className="safe-bottom absolute bottom-6 right-4 z-20 md:bottom-10 md:right-12"
        style={{ opacity: 1 - s }}
      >
        <SideActions projectId={projectId} avatar={avatar} initial={initial} />
      </div>
    </section>
  )
}
