// -----------------------------------------------------------------------------
// ContactBubbles.jsx
// The contact page. It is not a page in the feed — it is what the pass turns into:
// flip the card to its back, which is the contact face, and the site takes that
// as the instruction to go to contact. The card's own back is small and hangs in a
// 3D scene; this is the same information at the size of the screen.
//
// The channels are pills that fall into the page and can be shoved around —
// React Bits' FallingText feel run through PhysicsPills, wearing BubbleMenu's own
// pill styling. Everything that makes it belong to this site lives here: the
// arrival transition, the ground it arrives over, the site's own ink instead of
// the demo's colours, and the page furniture the rest of the site already uses.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'
import ContactPills from './ContactPills'
import Lanyard from './Lanyard'
import BackButton from './BackButton'
import PageTitle from './PageTitle'
import { REVEAL_BEATS, useReveal } from '../lib/reveal'

export default function ContactBubbles({ badge, origin = null, onClose }) {
  // The same circle every page on this site arrives with — but grown from the
  // point the pass hangs by, so it opens out of the gesture that pulled it.
  const { style: revealStyle, revealing } = useReveal('contact', { start: true, origin })
  const rootRef = useRef(null)

  // The pass turns over ON the transition's second beat — the same beat the second
  // tug lands on. Turned the instant this page mounts, the card had finished
  // flipping behind a circle that had not opened far enough to show it, and the
  // page arrived with the move already over.
  const [turned, setTurned] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setTurned(true), REVEAL_BEATS.secondAt)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <>
      {/* The ground comes in on the SECOND beat, not the first. Every other page
          opens over this beige plate so a pale page opening on a pale page can be
          seen at all — but from the first frame it also hid the thing the gesture
          is about: measured, the home screen was gone before the card had moved.
          So the first beat is played over the home screen, with the pass visibly
          pulled, and the plate arrives with the second tug. */}
      {revealing && turned && (
        <div className="pointer-events-none fixed inset-0 z-[59] bg-[#e7e4dd]" aria-hidden />
      )}
      <div
        ref={rootRef}
        className="contact-page fixed inset-0 z-[60] bg-[#fafafa]"
        style={revealStyle}
        role="dialog"
        aria-label="Contact"
      >
        {/* The project page's header, not one written again here: the same back
            disc at the same 36 / 60, and the same left-aligned bold title beside
            it, offset so the two read as one line at any width. */}
        {/* Both are lifted over the card's own layer. The pass fills the screen
            at z-[70] and a canvas takes every press that lands on it — measured:
            the back button could not be clicked at all. */}
        <BackButton onClick={() => onClose?.()} className="!z-[110]" />

        {/* The title is set smaller here than on a project page, so the same top
            padding put it 12px higher than the back button beside it. Measured on
            the project page: button middle 84, title middle 90 — the pair sits
            with the title a touch low, and this padding reproduces exactly that. */}
        <div className="page-shell pointer-events-none absolute inset-x-0 top-0 z-[110] w-full px-4 pt-[76px] md:pl-[120px] md:pr-12 md:pt-[60px]">
          <PageTitle className="sm:!text-4xl md:!text-5xl">Contact</PageTitle>
        </div>

        {/* The pass itself, carried through. The card was turned over on the home
            screen and it arrives here still turned — the page is a continuation of
            that gesture, not a new screen that happens to list the same handles.
            `flipTo` holds it on its back for as long as the page is open.

            Its box is the home screen's box, to the pixel — same top inset, same
            edges. The camera has a vertical fov, so the card's size is set by the
            height of the box it is drawn in: a box that stops short of the bottom
            to clear the pills gave a visibly smaller pass hanging in a different
            place, and the page stopped reading as a continuation of the flip. */}
        <div className="absolute inset-x-0 bottom-0 top-[104px] z-[70] md:top-0">
          <Lanyard
            position={[0, 0, 18]}
            gravity={[0, -40, 0]}
            frontImage={badge?.front?.url}
            backImage={badge?.back?.url}
            backLinks={badge?.back?.links}
            imageFit="cover"
            flipTo={turned}
            // Turning it back over is the way out, and it leaves the same way it
            // arrived — except that on this side the transition CANNOT overlap the
            // first tug: the page that arrives is the feed underneath, and it can
            // only be seen once this one is gone. So the pull leads and the page
            // change goes with the second tug.
            onFlip={flipped => {
              // Immediately, like the other direction: the feed above it starts
              // opening on the first tug and this page is only removed once that
              // has finished, so both trips are the same move.
              if (!flipped) onClose?.()
            }}
          />
        </div>

        {/* The channels, as pills that DROP into the page and can be shoved
            about — React Bits' FallingText feel, with pills instead of words.
            They wear the same pill the menu wore — white, fully rounded, one soft
            shadow — so what changed is how they arrive, not what they are.

            Width is not fixed any more: each pill is as wide as its own label
            wants to be, which is what lets them stack and lean on each other
            instead of sitting in three equal columns. */}
        <div className="pointer-events-none absolute inset-0 z-[80]">
          <ContactPills delay={520} />
        </div>
      </div>
    </>
  )
}
