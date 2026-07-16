// -----------------------------------------------------------------------------
// SideActions.jsx
// The right-side column: a circular profile avatar on top, then the rounded
// action buttons (like + share) from the Figma design.
// Mobile: 40px shapes. Desktop: 80px shapes.
// -----------------------------------------------------------------------------

import { useState } from 'react'
import { Heart, Share2 } from 'lucide-react'
import { usePortfolio } from '../context/PortfolioContext'

const DEFAULT_ICONS = [Heart, Share2]

export default function SideActions({ projectId, avatar, initial = 'N', icons = DEFAULT_ICONS }) {
  const { liked, toggleLike } = usePortfolio()
  const isLiked = projectId ? liked.has(projectId) : false
  const [imgOk, setImgOk] = useState(true)
  const showImg = avatar && imgOk

  return (
    <div className="flex flex-col items-center gap-2.5 md:gap-4">
      {/* Profile avatar */}
      <button
        className="grid size-10 place-items-center overflow-hidden rounded-full bg-neutral-800 text-sm font-semibold text-white transition hover:opacity-90 active:scale-90 md:size-20 md:text-2xl"
        aria-label="profile"
      >
        {showImg ? (
          <img
            src={avatar}
            alt=""
            draggable={false}
            onError={() => setImgOk(false)}
            className="size-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {icons.map((Icon, i) => {
        const isLike = i === 0 && projectId
        return (
          <button
            key={i}
            onClick={isLike ? () => toggleLike(projectId) : undefined}
            className="grid size-10 place-items-center rounded-xl bg-[#eaeaea] text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800 active:scale-90 md:size-20 md:rounded-3xl"
            aria-label={Icon.displayName || `action-${i}`}
          >
            <Icon
              className={`size-4 md:size-7 ${isLike && isLiked ? 'fill-brand-pink text-brand-pink' : ''}`}
            />
          </button>
        )
      })}
    </div>
  )
}
