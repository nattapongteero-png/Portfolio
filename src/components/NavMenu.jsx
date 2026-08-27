// -----------------------------------------------------------------------------
// NavMenu.jsx
// The top-left navigation: every section title laid out on React Bits'
// OptionWheel, curling away above and below the one you're on. It replaces the
// old three-item sliding window — the wheel shows the whole feed at once, and
// the distance-based blur/fade does the work the window used to do by simply
// not rendering the far items.
//
// The wheel runs in CONTROLLED mode: `position` (the feed's fractional scroll)
// is its input. That matters twice over — the wheel then tracks the scroll
// continuously instead of stepping between discrete states, and the component's
// own non-passive wheel listener (which preventDefaults) is never attached, so
// the nav cannot swallow the page's scrolling wherever the two overlap.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import OptionWheel from './OptionWheel'
import TrueFocus from './TrueFocus'

// Label size in rem. ONE size for every row, the way the reference's nav is
// set: the page you are on is told apart by its ink, not by being three times
// the size of the others. The page's own name is printed on the page itself now
// (see the copy column in FeedSection), so this corner is a nav and only a nav.
const FONT_REM = { base: 0.9375, md: 1 }
const FONT_REM_COMPACT = { base: 0.875, md: 0.9375 }
const SPACING = 1.55 // row height as a multiple of the font size
// How far a title one step out from the middle shrinks — see `itemScale` below.
const ITEM_SCALE = { base: 0.34, compact: 0.24 }
const NEIGHBOUR_SCALE = 1 - ITEM_SCALE.base

export default function NavMenu({
  sections,
  activeIndex,
  position = activeIndex,
  onNavigate,
  compact = false,
  // On a phone the title sits the same 20 from the top as it does from the left,
  // so the corner reads as one even margin — plus the status bar / notch, or it
  // would sit behind the system clock. 20, not 16: at 16 the titles read as
  // stuck to the edge rather than set in from it. Desktop keeps its own 120/48.
  positionClass =
    'left-5 top-[calc(env(safe-area-inset-top,0px)+20px)] md:left-[120px] md:top-12',
  // Flips the titles to light ink for sections that run on a dark background.
  dark = false,
  // The focused title's ink. Sections hand over their project's own accent, so
  // the heading is coloured by the thing you are looking at instead of being
  // the same near-black on every page. Falls back to the site's ink.
  accent = null,
  // When set, this section's title reads "Pawmely / Prototype". The crumb is
  // permanent for a section that HAS a prototype — closing it does not delete
  // the word, it just hands the focus back to the section name and lets
  // "Prototype" fall back to the small, blurred treatment every unfocused title
  // gets. A word that vanishes reads as something being destroyed; a word that
  // steps back reads as somewhere you can still go.
  breadcrumb = null,
  // Which option carries the crumb. Without it the crumb would follow whatever
  // is focused and label the wrong section.
  breadcrumbIndex = null,
  // Whether the crumb currently HAS the focus (the prototype is open).
  breadcrumbFocused = false,
  // Called when the (now muted) section title is tapped while a breadcrumb is
  // showing — the standard "go up a level" affordance.
  onBreadcrumbBack = null,
  // Called when the crumb itself is clicked while it is NOT focused — the way
  // in, mirroring onBreadcrumbBack as the way out.
  onBreadcrumbOpen = null,
  // Renders the sections as a STATIC list instead of the wheel: the rows never
  // move, and changing page moves only the ink from one row to another — the
  // reference site's own nav. The wheel is still what the scrolling stages use,
  // where the rows have to track a continuous scroll position.
  list = false,
}) {
  // The wheel lays itself out in JS from a pixel row height, so the breakpoint
  // has to be read rather than expressed in CSS.
  const [isMd, setIsMd] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => setIsMd(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const sizes = compact ? FONT_REM_COMPACT : FONT_REM
  const fontSize = isMd ? sizes.md : sizes.base
  const rowPx = fontSize * 16 * SPACING

  // The crumb takes the focus a beat after it is opened, so the handover is
  // SEEN — the section name shrinking back as "Prototype" grows. Arriving
  // already focused would read as the label simply changing.
  const [crumbFocus, setCrumbFocus] = useState(0)
  useEffect(() => {
    if (!breadcrumbFocused) {
      setCrumbFocus(0)
      return
    }
    const id = setTimeout(() => setCrumbFocus(2), 220)
    return () => clearTimeout(id)
  }, [breadcrumbFocused])

  const items = sections.map((s) => s.title)
  const focusIndex = Math.max(0, Math.min(sections.length - 1, Math.round(position)))
  const focused = sections[focusIndex]

  if (list) {
    // The reference layout: the CURRENT project's name set large in the top-left
    // corner — the page's own masthead — and the whole set of projects listed
    // along the bottom-left as small labelled columns, each opened by a hairline,
    // the way the reference prints BASE / FOCUS / INDEX. Nothing moves when the
    // page changes; the big name swaps and the ink moves along the bottom row.
    const rows = sections
      .map((s, i) => ({ ...s, i }))
      .filter((s) => s.title)
    const focusedRow = rows.find((r) => r.i === focusIndex) ?? rows[0]
    return (
      <>
        {/* The masthead. Keyed on the name so a page change remounts it and the
            rise-in replays. It sits UNDER the wipe's dim (z-13) and curtain
            (z-14), unlike the rest of the nav: the big name is the PAGE's own
            heading, so it dims with the page, disappears under the curtain, and
            rises back in with the content — at z-16 it floated on top of the
            curtain and swapped in plain sight. */}
        <div
          key={focusedRow?.title}
          className={`nav-menu rise-in pointer-events-none absolute z-[12] max-w-[82%] md:max-w-[720px] ${positionClass}`}
        >
          <h2
            className="pointer-events-auto text-3xl font-bold leading-none tracking-tight md:text-6xl"
            style={{ color: dark ? '#ffffff' : '#21221f' }}
          >
            {breadcrumbFocused && onBreadcrumbBack ? (
              <button type="button" onClick={onBreadcrumbBack} className="text-left">
                {focusedRow?.title}
              </button>
            ) : (
              focusedRow?.title
            )}
          </h2>
        </div>
        {/* The index along the bottom — every project, the one you are on in
            full ink. Hidden on a phone: the caption band lives down there. */}
        <div className="pointer-events-none fixed bottom-10 left-8 z-[16] hidden gap-10 md:flex">
          {rows.map((s) => {
            const on = s.i === focusIndex
            const ink = dark ? '#ffffff' : '#21221f'
            const faint = dark ? 'rgba(255,255,255,0.4)' : 'rgba(33,34,31,0.4)'
            return (
              <button
                key={s.domId ?? s.title}
                type="button"
                onClick={() => {
                  if (on && breadcrumbFocused && onBreadcrumbBack) onBreadcrumbBack()
                  else if (!on) onNavigate(s.i)
                }}
                // The reference's own column anatomy: a pale category word, a
                // hairline, the value under it. Hover does not underline — the
                // name inks up to full and the leaving-arrow steps in after it,
                // the same ↗ every outward link on this site carries.
                className="group pointer-events-auto min-w-[132px] text-left"
              >
                <span className="block text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: faint }}>
                  Project
                </span>
                <span
                  className="mt-2 block border-t pt-2.5"
                  style={{ borderColor: dark ? 'rgba(255,255,255,0.25)' : 'rgba(33,34,31,0.2)' }}
                >
                  <span
                    // Colour through vars + classes, not an inline `color`: an
                    // inline style outranks any hover class, which is why the
                    // first cut of this never darkened.
                    className="text-[13px] font-semibold leading-tight transition-colors duration-300 text-[color:var(--idx-c)] group-hover:text-[color:var(--idx-ink)]"
                    style={{ '--idx-c': on ? ink : faint, '--idx-ink': ink }}
                  >
                    {s.title}
                    <svg
                      className="ml-1 inline-block size-[11px] -translate-y-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      viewBox="0 0 24 24"
                      aria-hidden
                      focusable="false"
                    >
                      <path
                        d="M8 16 L16 8 M9.5 8 H16 V14.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <>
    <div
      className={`nav-menu pointer-events-none absolute z-[16] flex max-w-[82%] flex-col md:max-w-[620px] ${positionClass}`}
      // The wheel centres its options on the middle of this box, so the box has
      // to be offset such that the SELECTED option's TOP EDGE lands exactly on
      // `positionClass`'s top — the same place the old h2 started.
      //
      // Anchoring on the top edge rather than the box is what keeps the title
      // in the same spot across pages. The row height scales with the font
      // size, so anchoring the box (or its centre) put the home title and the
      // smaller detail-page title on different baselines, and moving between
      // them made the heading jump.
      // On a phone the whole BLOCK has to clear the top edge, not just the
      // focused row: the previous section's title curls up above it and was the
      // thing actually touching the edge. Shifting down by one row puts that
      // peeking title on the margin instead, and the focused title lands a row
      // below it. Desktop keeps the focused title itself on the margin, which
      // is what every page's heading is aligned to.
      style={{
        // Room for the heading plus the whole list under it — five sections at
        // the tighter row height no longer fit in the old three rows.
        height: rowPx * 7,
        // Anchors the FOCUSED title's top edge on the margin — the baseline
        // every page's heading shares. Nothing is drawn above it on a phone, so
        // this is the top of the block there too.
        marginTop: (fontSize * 16) / 2 - (rowPx * 7) / 2,
      }}
    >
      <OptionWheel
        items={items}
        value={position}
        // While the prototype is open you are inside this section, so only this
        // section's own title answers the pointer.
        locked={breadcrumbFocused}
        onChange={(idx) => {
          // Tapping the title you are already on, while a breadcrumb is
          // showing, is the way back up a level.
          if (idx === focusIndex && breadcrumbFocused && onBreadcrumbBack) onBreadcrumbBack()
          else onNavigate(idx)
        }}
        side="left"
        inset={0}
        fontSize={fontSize}
        spacing={SPACING}
        // No lead gap: every row is the same size now, so the even pitch is
        // already even to the eye.
        leadGap={0}
        // Flat. The wheel's curl and tilt were doing the work of saying "these
        // are further away"; the list reads that from grey alone now, and a
        // stack of straight left-aligned lines is what the reference is.
        curve={0}
        tilt={0}
        // While the prototype has the focus, the sections either side of it are
        // two steps removed — you are inside Pawmely, not next to Metaherb — so
        // they push further back than they do during ordinary scrolling.
        // No blur on the unfocused rows — they are a plain grey list, not
        // something being pushed out of focus. Only the prototype's takeover
        // still blurs, because there the other sections really are a level away.
        blur={breadcrumbFocused ? (compact ? 1.2 : 2) * 2.4 : 0}
        fade={breadcrumbFocused ? 0.8 : 0.42}
        // A floor, so the third and fourth rows stay as legible as the first
        // one under it instead of ramping away to nothing — the reference lists
        // every remaining page at one weight.
        minOpacity={breadcrumbFocused ? 0 : 0.45}
        // Still applies to a neighbour on its way in — see `visible` below.
        // No shrinking at all. Every row is one size and one line; the rows you
        // are not on step back in colour only.
        itemScale={0}
        minScale={1}
        // Asymmetric on purpose: the section you are ON, plus every page still
        // to COME listed under it — and nothing above, because the titles you
        // have already passed are not where you are going. The wheel's cull is a
        // ramp (`visible + 1 - distance`), so the previous title still recedes
        // rather than blinking off as you leave it.
        visibleBefore={0}
        visibleAfter={4}
        smoothing={160}
        // The SAME ink the focused title uses, not a grey of its own: the
        // wheel's own fade (0.58 one step out) is what sets a coming title back,
        // exactly as it sets the "Prototype" crumb back beside a focused one —
        // so the two unfocused words on screen read as one treatment. A separate
        // warm grey on top of that fade made the coming title a different colour
        // from the crumb sitting directly above it.
        textColor={dark ? 'rgba(255,255,255,0.45)' : '#21221f'}
        activeColor={accent ?? (dark ? '#ffffff' : '#21221f')}
        className="option-wheel--display"
        renderItem={(label, idx) =>
          // The breadcrumb rides on the selected option itself, so it stays one
          // line of the wheel rather than a second element floating beside it.
          // Opening the prototype is a change of focus, not just a change of
          // label, so the crumb says so: the frame travels off the section name
          // and onto the word Prototype, and the name blurs back behind it.
          breadcrumb && idx === (breadcrumbIndex ?? focusIndex) ? (
            <TrueFocus
              sentence={`${label} / ${breadcrumb}`}
              activeIndex={crumbFocus}
              staticIndices={[1]}
              // No brackets. The words carry the focus themselves — sharp and
              // full size against small and blurred — using exactly the same
              // numbers the wheel gives its own neighbouring titles, so the
              // crumb reads as one more step of the same system.
              frame={false}
              blurAmount={0}
              // One size here too — the crumb is set back by ink, like every
              // other unfocused word in this corner.
              inactiveScale={1}
              inactiveOpacity={1 - 0.42}
              animationDuration={0.55}
              hoverReveal
              onWordClick={(w) => {
                if (w === 0) onBreadcrumbBack?.()
                else if (w === 2 && !breadcrumbFocused) onBreadcrumbOpen?.()
              }}
            />
          ) : (
            label
          )
        }
      />
      {/* Desktop keeps the section's own footer under its title. */}
      {isMd && focused?.footer && <div className="pointer-events-auto">{focused.footer}</div>}
    </div>
    </>
  )
}
