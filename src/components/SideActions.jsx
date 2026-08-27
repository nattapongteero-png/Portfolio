// -----------------------------------------------------------------------------
// SideActions.jsx
// The right-side column: a circular profile avatar on top, then the round action
// buttons (like + share).
//
// The avatar is the entry point to the project profile, so it has to *look*
// pressable: it carries a corner badge and lifts on hover rather than sitting
// there as a plain logo. The action buttons are white cards with a hairline ring instead of
// flat grey fills, which read as finished UI rather than wireframe placeholders.
// Mobile: 40px shapes. Desktop: 80px shapes.
// -----------------------------------------------------------------------------

import { useState } from 'react'
import { ArrowUpRight, Heart, Share2 } from 'lucide-react'
import { usePortfolio } from '../context/PortfolioContext'

const DEFAULT_ICONS = [Heart, Share2]

export default function SideActions({ projectId, projectIndex, avatar, initial = 'N', icons = DEFAULT_ICONS, horizontal = false }) {
  const { liked, toggleLike, openDetail } = usePortfolio()
  const isLiked = projectId ? liked.has(projectId) : false
  const [imgOk, setImgOk] = useState(true)
  const showImg = avatar && imgOk
  const canOpen = projectIndex != null

  return (
    // `horizontal` lays the same buttons out as a row instead of a rail — used
    // when they sit inside the copy column rather than pinned to the corner.
    <div className={`flex items-center gap-4 md:gap-3 ${horizontal ? 'flex-row' : 'flex-col'}`}>
      {/* Profile — the way into the project. */}
      <div className="flex flex-col items-center">
        <button
          onClick={canOpen ? () => openDetail(projectIndex) : undefined}
          // Same disc as the action buttons beside it — the row reads as one
          // set, not a big profile with two small satellites.
          className={`group relative grid size-10 place-items-center rounded-full text-sm font-semibold shadow-sm ring-1 transition duration-200 md:size-14 md:text-lg ${
            showImg ? 'bg-white ring-[#dedad2]' : 'bg-neutral-800 text-white ring-neutral-700'
          } ${canOpen ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:ring-[#cdc7bc] active:scale-95' : ''}`}
          aria-label={canOpen ? 'ดูโปรไฟล์โปรเจกต์' : 'profile'}
        >
          {showImg ? (
            <img
              src={avatar}
              alt=""
              draggable={false}
              onError={() => setImgOk(false)}
              // No `rounded-full` here: clipping the LOGO to a circle shaves
              // its left and right extremes. The button is already round; the
              // padding keeps the artwork inside the circle on its own — kept
              // thin, so the mark fills the disc instead of floating in it.
              className="size-full object-contain p-1.5 md:p-2"
            />
          ) : (
            initial
          )}
          {/* Badge — the clearest "this opens something" signal at a glance. */}
          {canOpen && (
            <span
              // In the horizontal row the badge waits for the pointer — the
              // resting row is three equal discs, and the arrow surfaces on
              // hover as the "this opens something" cue. The vertical phone
              // rail keeps it always on: there is no hover on a thumb.
              className={`absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-neutral-900 text-white ring-2 ring-[#fafafa] transition group-hover:bg-black md:-bottom-1 md:-right-1 md:size-6 ${
                horizontal ? 'opacity-0 transition-opacity duration-200 group-hover:opacity-100' : ''
              }`}
            >
              <ArrowUpRight className="size-3 md:size-3.5" strokeWidth={2.6} />
            </span>
          )}
        </button>
      </div>

      {icons.map((Icon, i) => {
        const isLike = i === 0 && projectId
        const active = isLike && isLiked
        return (
          <button
            key={i}
            onClick={isLike ? () => toggleLike(projectId) : undefined}
            className={`grid size-10 place-items-center rounded-full bg-white shadow-sm ring-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 md:size-14 ${
              active ? 'ring-brand-pink/40' : 'ring-[#dedad2] hover:ring-[#cdc7bc]'
            }`}
            aria-label={Icon.displayName || `action-${i}`}
          >
            <Icon
              className={`size-4 transition-colors md:size-5 ${
                active ? 'fill-brand-pink text-brand-pink' : 'text-[#4e4e4e]'
              }`}
              strokeWidth={2}
            />
          </button>
        )
      })}
    </div>
  )
}
