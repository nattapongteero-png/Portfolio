// -----------------------------------------------------------------------------
// ProjectDetail.jsx
// Full-screen project profile, opened from the feed avatar. Layout follows the
// approved wireframe:
//   • big left-aligned project title
//   • square-rounded logo on the left + bio text on the right
//   • link buttons row
//   • a 2-column bento grid of cream cards — one card per content section
//     (Overview / Research / UI / Dev), each rendering its typed blocks.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clapperboard,
  Globe,
  HeartPulse,
  Image as ImageIcon,
  Layers,
  PawPrint,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { usePortfolio } from '../context/PortfolioContext'
import { requestReveal, useReveal } from '../lib/reveal'
import FeedSheet, { WireSheet } from './FeedSheet'
import BackButton from './BackButton'
import PageTitle from './PageTitle'
import PhysicsPills from './PhysicsPills'
import PhoneFrames from './PhoneFrames'

// Cover-card palette. Each section gets a bold cover colour + a set of vivid
// pill colours, cycled by index — playful, and rose-adjacent for Pawmely.
const CARD_H = 'h-[480px]'
const CARD_SHAPE = 'rounded-[28px]'
const CARD_BG = ['#c9d14e', '#1d8b6b', '#e08a3c', '#5b6ee0']

// Profile badges: what the product IS (platform) and the domain it serves.
// The domain each category names, drawn instead of dotted — the badge reads the
// same way the platform badge does, icon first. A category with no icon simply
// prints its name.
const CATEGORY_ICON = {
  Pets: PawPrint,
  Health: HeartPulse,
  Commerce: Layers,
  Finance: Wallet,
  Entertainment: Clapperboard,
}

// Platform icon inferred from the kind label, so adding a project needs no map.
function platformIcon(kind = '') {
  if (/mobile|app store|ios|android/i.test(kind)) return Smartphone
  if (/web|saas|dashboard|site/i.test(kind)) return Globe
  return Layers
}

// Every badge on this row is the same white chip with a hairline ring — the
// category used to be tinted per domain and led by a coloured dot, which made
// one tag in a row of tags look like a different kind of thing.
function Badge({ icon: Icon, label }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full bg-white pl-3 pr-4 text-xs font-semibold leading-none tracking-tight text-[#2f2f2c] shadow-sm ring-1 ring-[#dedad2] md:h-9 md:text-[13px]">
      {Icon && <Icon className="size-4" strokeWidth={2.3} />}
      {label}
    </span>
  )
}
const PILL_BG = ['#d1502a', '#e070c0', '#5b4fe0', '#2f3fc4', '#1d8b6b', '#e08a3c']

// The draggable topic pills a tab shows on its cover: its block headings, plus
// any explicit tag items. Capped so the pile stays readable.
function pillsForTab(tab) {
  const headings = tab.blocks.filter((b) => b.type === 'heading').map((b) => b.text)
  const tagItems = tab.blocks.filter((b) => b.type === 'tags').flatMap((b) => b.items)
  return [...new Set([...headings, ...tagItems])].slice(0, 5)
}

// A pile of pills that behave like objects in a jar: gravity pulls them to the
// floor, walls/floor bounce, and no two pills may overlap. Drag one up and it
// falls back down; shove it into a neighbour and the neighbour gets pushed.
// A tiny fixed-step AABB solver, one instance per card, transforms written
// straight to the DOM so the sim never re-renders React. Sleeps when everything
// settles; a pointer-down wakes it.
const TOP_INSET = 104 // px kept clear at the top so pills never cover the title
const G_SWING = 2600 // gravity used for the pendulum torque while a pill is held

// Each draggable object in the Component card is a little mock of the REAL widget
// it names — a frosted card, a metric tile, an activity ring, the tab bar — so
// the pile reads as the component set at a glance instead of six identical pills.
// Every shape has a different silhouette and size, which the physics measures
// off the DOM, so they pack together like a box of mismatched parts. Any name the
// map doesn't know (other cards reuse PillJar for plain tag lists) falls back to
// the original coloured, labelled pill.
function PillShape({ label, i }) {
  const ROSE = '#B86A7C'
  const ROSE_SOFT = '#DDA8B2'
  switch (label) {
    case 'Button':
      return (
        <div className="grid h-11 w-32 place-items-center rounded-full shadow-md" style={{ backgroundColor: ROSE }}>
          <span className="h-2 w-14 rounded-full bg-white/85" />
        </div>
      )
    case 'Input Fields':
      return (
        <div className="flex h-12 w-36 items-center rounded-full bg-white px-4 shadow-md ring-2" style={{ '--tw-ring-color': ROSE }}>
          <span className="h-2 w-16 rounded-full bg-black/15" />
        </div>
      )
    case 'Card':
      return (
        <div className="h-20 w-28 overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
          <span className="flex h-8 items-center gap-2 px-3" style={{ backgroundColor: `${ROSE_SOFT}66` }}>
            <span className="size-5 rounded-full" style={{ backgroundColor: ROSE }} />
            <span className="h-2 w-10 rounded-full bg-black/20" />
          </span>
          <span className="flex items-end gap-1 px-3 pt-3">
            {[8, 14, 11, 18, 15].map((h, k) => (
              <span key={k} className="flex-1 rounded-t-sm" style={{ height: h, backgroundColor: `${ROSE}99` }} />
            ))}
          </span>
        </div>
      )
    case 'Tab Bar':
      return (
        <div className="relative flex h-14 w-36 items-end">
          <span className="flex h-11 w-36 items-center justify-between rounded-full bg-white px-4 shadow-md ring-1 ring-black/5">
            <span className="flex items-center gap-2">
              <span className="h-5 w-9 rounded-full" style={{ backgroundColor: ROSE }} />
              <span className="size-2.5 rounded-full bg-black/20" />
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-black/20" />
              <span className="size-2.5 rounded-full bg-black/20" />
            </span>
          </span>
          <span
            className="absolute bottom-6 left-1/2 size-10 -translate-x-1/2 rounded-full shadow-lg ring-4 ring-white"
            style={{ backgroundColor: ROSE }}
          />
        </div>
      )
    case 'Product Tile':
      return (
        <div className="flex h-24 w-20 flex-col gap-2 rounded-2xl bg-white p-2 shadow-md ring-1 ring-black/5">
          <span className="h-10 w-full rounded-xl" style={{ backgroundColor: `${ROSE_SOFT}80` }} />
          <span className="h-2 w-12 rounded-full bg-black/15" />
          <span className="h-2 w-8 rounded-full" style={{ backgroundColor: '#C25450' }} />
        </div>
      )
    case 'Status Badge':
      return (
        <div className="flex h-8 items-center gap-2 rounded-full bg-white px-3 shadow-md ring-1 ring-black/5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: '#4FB36C' }} />
          <span className="h-2 w-10 rounded-full bg-black/15" />
        </div>
      )
    default:
      return (
        <span
          className="block whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-white shadow-md md:text-base"
          style={{ backgroundColor: PILL_BG[i % PILL_BG.length] }}
        >
          {label}
        </span>
      )
  }
}

function PillJar({ pills, dragging }) {
  return (
    // The same engine the contact page's channel pills fall with. It replaces a
    // hand-rolled solver that lived here: that one stepped once per animation
    // frame, so on a 120Hz screen it ran at twice the speed it was tuned for, and
    // any frame the browser dropped changed the physics rather than just the
    // picture — which is what the stutter was.
    <PhysicsPills
      className="absolute inset-0 flex flex-wrap content-start items-start justify-center gap-2 p-4"
      itemClassName="cursor-grab touch-none select-none active:cursor-grabbing"
      gravity={1.1}
      restitution={0.25}
      // The CARD is draggable too. While it is being dragged the pills let the
      // gesture through instead of grabbing it.
      canDrag={() => !dragging?.current}
    >
      {pills.map((label, i) => (
        <PillShape key={label} label={label} i={i} />
      ))}
    </PhysicsPills>
  )
}


// The lo-fi phone mock that was drawn for the Wireframe cover. Lifted out so the
// Low-fi TOPIC card can wear the same illustration instead of a second drawing of
// the same idea — the cover card and the topic card are two doors to one page.
// Colours are the illustration's own: this is the one piece of art on these cards
// that is not the product's palette, because it is a wireframe and a wireframe in
// brand colours is a mockup.
// Just the SCREEN of that illustration — the capsule rows on the cream ground —
// so the topic card can hang it inside the real 3D device, whose body replaces
// the drawn bezel/notch/buttons.
function LofiScreenArt() {
  const CREAM = '#f7f8e3'
  return (
    <div className="h-full w-full overflow-hidden p-4 pt-14" style={{ backgroundColor: CREAM }}>
      <div className="-ml-16 -mr-10 flex items-center gap-4">
        <div className="h-[76px] flex-1 rounded-full bg-[#f3c9b0]" />
        <div className="grid size-[76px] shrink-0 place-items-center rounded-full bg-[#bfe0fb]">
          <ImageIcon className="size-10 text-white" strokeWidth={2} />
        </div>
        <div className="h-[76px] flex-1 rounded-full bg-[#c6cbf6]" />
      </div>
      <div className="-ml-16 -mr-10 mt-4 flex items-center gap-4">
        <div className="grid h-[76px] flex-[2] place-items-center rounded-full bg-[#f6d29e]">
          <span className="text-2xl font-extrabold" style={{ color: CREAM }}>Lorem Ipsum</span>
        </div>
        <div className="h-[76px] flex-1 rounded-full bg-[#f2e9a0]" />
      </div>
      <div className="-mx-10 mt-4 flex items-center gap-4">
        <div className="size-[76px] shrink-0 rounded-full bg-[#d9c9f5]" />
        <div className="h-[76px] flex-1 rounded-full bg-[#f3c9b0]" />
      </div>
    </div>
  )
}

function LofiPhoneArt({ className = '', style }) {
  const CREAM = '#f7f8e3'
  return (
    <div
      className={`overflow-hidden rounded-[44px] border-[9px] border-black p-4 ${className}`}
      style={{ backgroundColor: CREAM, ...style }}
    >
      {/* Side buttons on the left rail */}
      <div className="absolute -left-[8px] top-14 h-8 w-[8px] rounded-l-md bg-black" />
      <div className="absolute -left-[8px] top-28 h-14 w-[8px] rounded-l-md bg-black" />
      <div className="absolute -left-[8px] top-48 h-14 w-[8px] rounded-l-md bg-black" />

      {/* Dynamic Island with camera dot */}
      <div className="mx-auto mb-7 flex h-9 w-32 items-center justify-end rounded-full bg-black pr-3">
        <div className="size-4 rounded-full bg-neutral-700" />
      </div>

      {/* The rows bleed off BOTH screen edges (negative margins wider than the
          screen); the phone's overflow-hidden clips them, so the end capsules are
          cut at the left/right screen edge exactly like the reference. */}
      <div className="-ml-16 -mr-10 flex items-center gap-4">
        <div className="h-[76px] flex-1 rounded-full bg-[#f3c9b0]" />
        <div className="grid size-[76px] shrink-0 place-items-center rounded-full bg-[#bfe0fb]">
          <ImageIcon className="size-10 text-white" strokeWidth={2} />
        </div>
        <div className="h-[76px] flex-1 rounded-full bg-[#c6cbf6]" />
      </div>
      <div className="-ml-16 -mr-10 mt-4 flex items-center gap-4">
        <div className="grid h-[76px] flex-[2] place-items-center rounded-full bg-[#f6d29e]">
          <span className="text-2xl font-extrabold" style={{ color: CREAM }}>Lorem Ipsum</span>
        </div>
        <div className="h-[76px] flex-1 rounded-full bg-[#f2e9a0]" />
      </div>
      <div className="-mx-10 mt-4 flex items-center gap-4">
        <div className="size-[76px] shrink-0 rounded-full bg-[#d9c9f5]" />
        <div className="h-[76px] flex-1 rounded-full bg-[#f3c9b0]" />
      </div>
    </div>
  )
}

// Bespoke Lo-Fi Wireframe cover: cream card, the title split across two colour
// pills, and a lo-fi phone mock (placeholder blocks) bleeding off the bottom.
function LofiCover({ tab, onOpen }) {
  const CREAM = '#f7f8e3'
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className={`relative block ${CARD_H} w-full cursor-pointer overflow-hidden ${CARD_SHAPE} bg-[#f5f6dc] transition active:scale-[0.99]`}
      aria-label={tab.label}
    >
      {/* Title pills (font matches the other cards: text-3xl / md:text-4xl).
          Green bleeds off the LEFT edge but its TEXT sits 40px in from the left;
          it stretches full width with a 40px gap before the blue pill (which
          bleeds right). Pink bleeds off the RIGHT edge with its TEXT 40px in from
          the right. Overflow = pill padding beyond the 40px text inset. */}
      <div className="absolute left-0 right-0 top-7 z-10">
        <div className="flex items-center">
          <span
            className="flex-1 whitespace-nowrap rounded-full bg-[#c9d14e] py-3 pr-9 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
            style={{ color: CREAM, textShadow: '0 3px 4px rgba(0,0,0,0.16)', marginLeft: '-32px', paddingLeft: '56px' }}
          >
            Hi-Fi
          </span>
          <span
            className="h-14 w-28 shrink-0 rounded-full bg-[#2f3fc4]"
            style={{ marginLeft: '24px', marginRight: '-48px' }}
          />
        </div>
        {/* Pink: left edge 24px in, 24px below the green pill; a wide bar that
            bleeds off the RIGHT with its text 24px in from the card's right. */}
        <div className="-mr-8 mt-6 pl-6">
          <span
            className="block w-full whitespace-nowrap rounded-full bg-[#e070c0] py-3 pl-9 text-right text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
            style={{ color: CREAM, textShadow: '0 3px 4px rgba(0,0,0,0.16)', paddingRight: '56px' }}
          >
            Wireframe
          </span>
        </div>
      </div>

      {/* Lo-fi phone mock: smaller now, LEFT-aligned (side buttons, rounded
          top-left corner and notch visible), sitting lower for more breathing
          room below the pink pill, and bleeding off the RIGHT edge + BOTTOM. */}
      <LofiPhoneArt className="absolute left-[24%] top-[196px] h-[372px] w-[88%]" />
    </div>
  )
}

// Bespoke Project Overview cover: bold purple card, big two-line title anchored
// bottom-left (with "view" picked out in lime), and a cluster of rounded shapes
// on the right — a centre stack (magenta capsule, orange capsule, blue circle)
// plus two circles that bleed off the right edge (lime + pink).
function OverviewCover({ tab, onOpen }) {
  const LAV = '#cbc9f2' // light-lavender title
  const LIME = '#c9d14e'
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className={`relative block ${CARD_H} w-full cursor-pointer overflow-hidden ${CARD_SHAPE} bg-[#5b4fe0] transition active:scale-[0.99]`}
      aria-label={tab.label}
    >
      {/* Right-edge circles: their CENTRE sits exactly on the card's right edge
          (half bleeds off), lime near the top, pink below it. */}
      <div className="absolute right-[-47px] top-[24px] size-[96px] rounded-full" style={{ backgroundColor: LIME }} />
      <div className="absolute right-[-44px] top-[156px] size-[88px] rounded-full" style={{ backgroundColor: '#e070c0' }} />
      {/* Centre stack: magenta capsule (bleeds off top) · orange capsule · blue
          circle — all sharing one vertical centre line, kept 24px clear of the
          edge circles (lime's inner edge is 47px in, +24px gap = 71px). */}
      <div className="absolute right-[72px] top-[-34px] h-[116px] w-[76px] rounded-full" style={{ backgroundColor: '#e070c0' }} />
      <div className="absolute right-[72px] top-[88px] h-[152px] w-[76px] rounded-full" style={{ backgroundColor: '#d1502a' }} />
      <div className="absolute right-[64px] top-[248px] size-[88px] rounded-full" style={{ backgroundColor: '#2f3fc4' }} />

      {/* Two-line title, bottom-left */}
      <h3
        className="pointer-events-none absolute bottom-9 left-7 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
        style={{ color: LAV }}
      >
        Project
        <br />
        Over<span style={{ color: LIME }}>view</span>
      </h3>
    </div>
  )
}

// One cover card: big title, a jar of physics pills, and a click on the card
// body (not a pill) opens the section sheet.
function CoverCard({ tab, index, onOpen }) {
  if (tab.cover === 'lofi') return <LofiCover tab={tab} onOpen={onOpen} />
  if (tab.cover === 'overview') return <OverviewCover tab={tab} onOpen={onOpen} />
  const pills = pillsForTab(tab)
  const dragging = useRef(false)
  return (
    <div
      role="button"
      tabIndex={0}
      // Suppress the open when the click is the tail of a pill drag.
      onClick={() => !dragging.current && onOpen()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className={`relative isolate block ${CARD_H} w-full cursor-pointer overflow-hidden ${CARD_SHAPE} p-6 text-left transition active:scale-[0.99] md:p-7`}
      // Stable colour: use the tab's own colour if set, so adding/reordering
      // bespoke cards never shifts a plain card's palette index.
      style={{ backgroundColor: tab.cardColor ?? CARD_BG[index % CARD_BG.length] }}
    >
      <h3
        className="pointer-events-none relative z-10 max-w-[80%] text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl"
        // nudged down 10px so it sits on the same line as the Lo-Fi card's title,
        // whose text is lowered by its pill padding.
        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.12)', marginTop: '10px' }}
      >
        {tab.label}
      </h3>
      <PillJar pills={pills} dragging={dragging} />
    </div>
  )
}

// The Grid & Layout card wears the same treatment as its panel: the four-column
// glyph in the bottom-right corner, with the inspector measuring THAT rather
// than the title — so the card and the page it opens read as one idea. Both
// numbers are read back off the live layout, not drawn.
function CornerArt({ cardRef, children, dark }) {
  const barsRef = useRef(null)
  const [box, setBox] = useState(null)
  useLayoutEffect(() => {
    const measure = () => {
      const c = cardRef.current
      const bars = barsRef.current
      if (!c || !bars) return
      const cb = c.getBoundingClientRect()
      const a = bars.getBoundingClientRect()
      // The 3rd bar sits inside the flex row wrapped by barsRef; the vertical
      // guide drops at its centre rather than the whole glyph's.
      const bar3 = bars.firstElementChild?.children?.[2]
      const b3 = bar3 ? bar3.getBoundingClientRect() : a
      const next = {
        x: a.left - cb.left,
        y: a.top - cb.top,
        w: a.width,
        h: a.height,
        cx: b3.left + b3.width / 2 - cb.left,
      }
      setBox((cur) =>
        cur && Object.keys(next).every((k) => Math.abs(cur[k] - next[k]) < 0.5) ? cur : next
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (cardRef.current) ro.observe(cardRef.current)
    if (barsRef.current) ro.observe(barsRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // On the lime card a lime chip would vanish, so the accent flips to ink.
  const accent = dark ? '#2b3208' : '#c9d14e'
  const chip =
    'absolute inline-flex h-4 items-center rounded-[3px] px-2 font-mono text-[9px] font-medium leading-4'
  return (
    <>
      {/* On hover the glyph grows from its pinned bottom-right corner; the
          ResizeObserver re-measures it every frame, so the inspect guides below
          track the bars as they expand. */}
      <div
        ref={barsRef}
        className="pointer-events-none absolute -bottom-[10%] -right-[7%] h-[52%] w-[46%] transition-all duration-500 ease-out group-hover:h-[60%] group-hover:w-[54%]"
      >
        {children}
      </div>
      {box && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {/* Down from the card's top edge, at the glyph's centre. */}
          <span
            className="absolute border-l border-dashed"
            style={{ left: box.cx, top: 0, height: box.y, borderColor: accent }}
          >
            <span
              className={chip}
              style={{ right: 8, top: box.y / 2 - 8, backgroundColor: accent, color: dark ? '#f2f4d8' : '#2b3208' }}
            >
              {Math.round(box.y)}
            </span>
          </span>
          {/* In from the card's left edge to the glyph. */}
          <span
            className="absolute border-t border-dashed"
            style={{ left: 0, top: box.y + box.h / 2, width: box.x, borderColor: accent }}
          >
            <span
              className={chip}
              style={{ left: box.x / 2 - 12, top: 8, backgroundColor: accent, color: dark ? '#f2f4d8' : '#2b3208' }}
            >
              {Math.round(box.x)}
            </span>
          </span>
        </div>
      )}
    </>
  )
}

// The right-hand column of the profile header: three facts that the bio cannot
// carry — who built it, how many people run it, and what this portfolio's owner
// actually did. Kept to one card so it reads as a single sidebar rather than
// three loose widgets.
function Initials({ name, you }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
  return (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold leading-none ring-2 ring-white ${
        you ? 'bg-[#1d8b6b] text-white' : 'bg-[#e8e5df] text-[#4e4e4e]'
      }`}
      title={name}
    >
      {initials}
    </span>
  )
}

// The two facts the profile leads with — who built it and how it was received.
// They used to be a pair of portrait cards squeezed into the right third of the
// header, which capped the bio's width and left both facts reading as stubs.
// Now they are one strip the full width of the page, under the bio: one surface,
// a hairline between the halves, and each half laid out along its own line
// instead of stacked into a narrow column.
// Written out rather than interpolated: Tailwind only ships the classes it can
// see in the source.
const FACT_COLS = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }

// The face the design system documents — the Typography card sets its "Aa" in
// it rather than in the site's own font.
const FACE = '"IBM Plex Sans Thai Looped", system-ui, sans-serif'

// Five stars filled to the score itself, not rounded to the nearest whole one:
// a 4.7 draws four stars and seven tenths of a fifth. Two identical rows sit on
// top of each other and the filled one is clipped to score/5 of the width, so the
// partial star is cut at exactly the right place rather than approximated by a
// half-star glyph. Nothing draws unless the value really is a score out of five.
function Stars({ value, tone = '#21221f' }) {
  const uid = useId()
  if (!Number.isFinite(value) || value < 0 || value > 5) return null
  const EMPTY = '#cfccc5'
  // One row of five stars, each filled by its own gradient that switches from
  // the score colour to grey at exactly the fraction that star earned. Drawing a
  // coloured row on top of a grey one instead left the grey peeking out around
  // every star, which is what read as a shadow.
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} จาก 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i))
        const id = `${uid}-star-${i}`
        return (
          <svg key={i} viewBox="0 0 20 20" className="size-3.5" aria-hidden="true">
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
                <stop offset={fill} stopColor={tone} />
                <stop offset={fill} stopColor={EMPTY} />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
              fill={`url(#${id})`}
            />
          </svg>
        )
      })}
    </span>
  )
}

function ProfileFacts({ project }) {
  const { team, downloads } = project
  if (!team && !downloads) return null
  const you = team?.find((m) => m.you)
  // A release figure is one cell, unless the project reports it per store — then
  // each store gets its own, because they are separate numbers off separate
  // review counts and averaging them into one would invent a figure.
  const facts = downloads?.items ?? (downloads ? [downloads] : [])
  return (
    // Two cards, not one strip. The team was sharing a row with the store
    // ratings, which capped it at the height of a line of type — and three
    // standing figures need more room than that. It gets the full width and its
    // own height; the figures sit underneath in a row of their own.
    // Three cards in one row: the team, then a card per store.
    <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
      {team && (
        // The avatars are round heads on a square canvas now, not standing
        // figures, so the card no longer clips three sides to let a head out of
        // the top: everything sits inside it. Discs of one size, tucked into
        // each other, at the end of the row the type starts.
        <div className="flex items-center justify-between gap-4 rounded-[32px] bg-white p-6 ring-1 ring-[#dedad2] md:h-[84px]">
          <div className="min-w-0">
            {/* The label names the ROLE the team is made of — the same slot the
                rating cells use for their review count. It came off the page
                owner's own credit, so a project crewed by other disciplines is
                labelled by theirs rather than by a caption fixed here. */}
            <div className="font-mono text-[10px] uppercase leading-4 tracking-wider text-[#9c988e]">
              {you?.title ?? you?.role ?? 'เพื่อนร่วมทีม'}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold leading-none tracking-tight text-[#21221f]">
                {team.length} คน
              </span>
            </div>
          </div>
          {/* Left to right in the order the credit list is in, each disc lapped
              by the one before it. The owner of the page is lifted to the front
              of the pile; only the stacking order sets him apart. */}
          <div className="pointer-events-none flex shrink-0 items-center">
            {team.map((m, i) =>
              m.photo ? (
                <img
                  key={m.name}
                  src={m.photo}
                  alt={m.name}
                  draggable={false}
                  className="-ml-3 size-12 shrink-0 select-none rounded-full bg-[#f2f0eb] object-contain ring-2 ring-white first:ml-0"
                  style={{ zIndex: m.you ? team.length + 1 : team.length - i }}
                />
              ) : (
                <Initials key={m.name} name={m.name} you={m.you} />
              )
            )}
          </div>
        </div>
      )}

      {facts.map((f, k) => (
        <div
          // Two stores share the label "Review", so the key is the store.
          key={f.title ?? f.label ?? k}
          className="flex items-center justify-between gap-4 rounded-[32px] bg-white p-6 ring-1 ring-[#dedad2] md:h-[84px]"
        >
          <div className="min-w-0">
            {/* The label travels with the figure: this slot holds a download
                count on one project and a store rating on another, and a fixed
                caption mislabelled whichever one it did not mean. */}
            <div className="font-mono text-[10px] uppercase leading-4 tracking-wider text-[#9c988e]">
              {f.label ?? 'ยอดดาวน์โหลด'}
            </div>
            {/* Same shape as the team card: the name in the heavy weight, its
                qualifier trailing after a dot. A project that only carries a
                note falls back to printing it. */}
            <div className="mt-1 flex items-baseline gap-2">
              {f.title ? (
                <>
                  <span className="text-xl font-bold leading-none tracking-tight text-[#21221f]">
                    {f.title}
                  </span>
                  {f.meta && (
                    <span className="truncate text-[12px] leading-4 text-[#4e4e4e]">· {f.meta}</span>
                  )}
                </>
              ) : (
                <span className="truncate text-[12px] leading-4 text-[#4e4e4e]">{f.note}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Stars value={Number(f.value)} tone={project.accent} />
            <div className="text-xl font-bold leading-none tracking-tight text-[#21221f]">
              {f.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TopicCard({ card, tab, palette, onOpen }) {
  const dragging = useRef(false)
  const cardRef = useRef(null)
  const hasPills = Array.isArray(card.pills) && card.pills.length > 0
  // The art in the corner is drawn in the PROJECT's own colours, read off the
  // palette it ships rather than picked here. Neutral ink is the fallback for a
  // project that has no palette recorded, so a card never comes out blank.
  const brand = palette?.brand?.hex ?? '#21221f'
  const ramp = palette?.groups?.[0]?.swatches?.map((sw) => sw.hex) ?? []
  // One colour per role group — the deck on the Color card fans through the
  // palette's actual families instead of a stock rainbow.
  const families = (palette?.groups ?? [])
    .map((g) => g.swatches?.[Math.min(1, (g.swatches?.length ?? 1) - 1)]?.hex)
    .filter(Boolean)
  const tint = (a) => `${brand}${a}`
  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      // Suppress the open when the click is the tail of a pill drag.
      onClick={() => !dragging.current && onOpen()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      // White card, hairline and a soft lift instead of a painted block: the
      // colour a card carried was its only difference from its neighbour, and the
      // art in its corner already does that job.
      className={`group relative isolate flex ${CARD_H} w-full cursor-pointer flex-col overflow-hidden ${CARD_SHAPE} border border-[#e7e4dd] bg-white p-6 text-left shadow-[0_6px_20px_rgba(33,34,31,0.06)] transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(33,34,31,0.10)] active:scale-[0.99] md:p-7`}
      aria-label={card.label}
    >
      <h4 className="relative z-10 w-fit text-2xl font-extrabold leading-tight tracking-tight text-[#21221f] md:text-3xl">
        {card.label}
      </h4>
      {/* A card either carries its own component pills — draggable, exactly like
          the cover cards — or a quiet corner mark, so none reads as a flat
          swatch. */}
      {hasPills ? (
        <PillJar pills={card.pills} dragging={dragging} />
      ) : card.art === 'inspect' ? (
        <CornerArt cardRef={cardRef}>
          <div className="flex h-full w-full gap-[7%]">
            {Array.from({ length: 4 }).map((_, i) => (
              // Stepped down the project's own lead ramp rather than four bars
              // of one grey — the ramp is what the grid is measured in.
              <div
                key={i}
                className="h-full flex-1 rounded-t-md"
                style={{ backgroundColor: ramp[ramp.length - 1 - i] ?? tint('1f') }}
              />
            ))}
          </div>
        </CornerArt>
      ) : card.art === 'wire' || card.art === 'shot' ? (
        // The two ends of one process, so they wear ONE illustration rig: the
        // same 3D device (the GLB the home screen parks) in the same box on both
        // cards, with only the screen swapped — capsule wireframe on Low-fi, the
        // built Home capture on Hi-fi. Same size by construction, not by keeping
        // two hand-tuned boxes in step.
        <div className="pointer-events-none absolute -bottom-44 -right-9 w-[66%] origin-bottom-right transition-transform duration-500 ease-out group-hover:scale-[1.06]">
          <PhoneFrames
            items={[{ key: card.art }]}
            renderScreen={() =>
              card.art === 'wire' ? (
                // The REAL Low-fi — the Home wireframe from tab.wireframe, the
                // same record the specimen page draws, scaled down as one sheet.
                <WireSheet sc={tab.wireframe?.screens?.[0]} />
              ) : (
                // The tab's OWN first Hi-fi screen, not a filename typed in
                // here: hardcoded, this card showed Pawmely's home on every
                // project that had a Hi-fi card.
                <img
                  src={tab.hifi?.screens?.[0]?.src}
                  alt=""
                  className="h-full w-full object-cover object-top"
                />
              )
            }
          />
        </div>
      ) : card.art === 'typeface' ? (
        // The "Aa" set in the face the system documents. On hover it scales up
        // from its corner — the same ~1.15× growth the Grid and Colour cards use,
        // so all three cards answer a hover the same way.
        <span
          // The glyph answers a hover on two counts, the way the other cards'
          // marks do: it grows AND it comes forward. Carried on `opacity` rather
          // than by swapping the colour, because the colour is an inline style
          // that a hover variant cannot reach — the ink is set at its hover
          // strength and held at half until then.
          className="pointer-events-none absolute right-6 select-none font-bold leading-none opacity-50 transition duration-500 ease-out group-hover:scale-[1.15] group-hover:opacity-100"
          style={{
            // Set as rgba rather than an opacity modifier: Tailwind's `/12`
            // shorthand does not apply to an arbitrary hex here, so the glyph
            // came out solid black over the white card.
            color: tint('5c'),
            bottom: 'calc(32px - 0.21em)',
            fontSize: 'min(26vh, 10vw)',
            fontFamily: FACE,
            transformOrigin: 'bottom right',
          }}
        >
          Aa
        </span>
      ) : card.art === 'report' ? (
        // The same ruled page the panel behind this card carries in its own
        // corner. A card is the door to a panel, so the two should wear the same
        // mark — four identical white circles told you nothing about which door
        // you were opening.
        <div
          className="pointer-events-none absolute -bottom-6 -right-6 flex h-[46%] w-[70%] flex-col gap-3 rounded-[22px] p-6 shadow-[0_10px_30px_rgba(33,34,31,0.08)] transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          style={{ backgroundColor: tint('14'), boxShadow: `inset 0 0 0 1px ${tint('2b')}` }}
        >
          <span className="h-3 w-1/2 rounded-full" style={{ backgroundColor: brand }} />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-2 w-full rounded-full" style={{ backgroundColor: tint('4d') }} />
          ))}
        </div>
      ) : card.id === 'color' ? (
        // A Pantone-style swatch deck: a white-bordered cover standing vertical
        // by default, the palette fanning open from behind it on hover. The
        // pivot sits inset from the corner so the upright cover never clips, and
        // the cover is oversized on purpose — it bleeds off the card edges.
        <div className="pointer-events-none absolute -bottom-2 right-20">
          {(families.length ? families : [brand]).map((c, i) => (
            <span
              key={c}
              className="absolute rounded-[8px] bg-white p-1 shadow-md ring-1 ring-black/5 transition-transform duration-500 ease-out [transform:rotate(0deg)] group-hover:[transform:rotate(var(--r))_scaleY(1.15)]"
              style={{
                width: 132,
                // Same height as the cover (280) — the colour blades are the ones
                // that grow; the tail runs 64px off the bottom edge, pivot held at
                // 216px from the top so the fan doesn't move.
                height: 280,
                bottom: -64,
                left: -66,
                transformOrigin: '50% 216px',
                // Closed, the swatches hide behind the cover; on hover they fan
                // out on an even 21° spacing, the first upright and just peeking
                // past the cover and the last swung off the left edge.
                '--r': `${-21 * i}deg`,
              }}
            >
              <span className="block h-full w-full rounded-[4px]" style={{ backgroundColor: c }} />
            </span>
          ))}
          {/* The cover: white paper card, upright when closed; on hover it tips
              right and bleeds past the card's right edge as the palette fans
              left, so the open deck overflows on both sides. */}
          <span
            className="absolute flex flex-col items-center justify-end gap-2 overflow-hidden rounded-[8px] p-3 shadow-lg ring-1 ring-black/15 transition-transform duration-500 ease-out [transform:rotate(0deg)] group-hover:[transform:rotate(22deg)_scaleY(1.15)]"
            // A physical guide cover, not a blank white swatch: a soft grey paper
            // gradient with a faint top sheen so it reads as the deck's cover.
            // Same height as every swatch (280); the label + bar sit on the shared
            // pivot line via the bottom padding, tail runs off the card edge.
            style={{
              width: 140,
              height: 280,
              bottom: -64,
              left: -70,
              paddingBottom: 64,
              transformOrigin: '50% 216px',
              backgroundImage: 'linear-gradient(160deg,#fbfbfa 0%,#ececea 46%,#dcdbd7 100%)',
            }}
          >
            {/* Sheen: a soft diagonal highlight across the top of the cover. */}
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: 'linear-gradient(150deg,rgba(255,255,255,0.65),rgba(255,255,255,0) 60%)' }}
            />
            <span className="relative font-mono text-[9px] font-bold tracking-[0.15em] text-[#3a3a37]">
              PALETTE
            </span>
            <span
              className="relative h-2 w-14 rounded-full ring-1 ring-black/5"
              style={{ background: 'linear-gradient(90deg,#FF2D55,#EAB308,#34C759,#5AC8FA,#AF52DE)' }}
            />
          </span>
        </div>
      ) : (
        <span
          className="pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full"
          style={{ backgroundColor: tint('1a') }}
        />
      )}
    </div>
  )
}

// The section sheet: full blocks for one tab, slid in over the cards when a card
// is opened. Its own back button returns to the card grid.
function SectionSheet({ tab, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
      className="no-scrollbar fixed inset-0 z-[50] overflow-y-auto bg-[#fafafa]"
    >
      {/* Same header geometry as the Pawmely profile: title on the same rect,
          back button in the left gutter, identical font sizes. */}
      {/* Outside the sticky header on purpose. That header carries a
          `backdrop-blur`, and a backdrop-filter establishes a containing block —
          so a `fixed` button inside it resolved against the header, not the
          viewport, and the centred page-shell carried it to x196 at 1920 while
          the same button everywhere else stayed at x36. Out here it is absolute
          against the full-screen overlay, which IS the viewport. */}
      {/* Shared — see BackButton. It is a direct child of the overlay,
          because nothing between it and the viewport may carry a transform or a
          backdrop-filter, either of which would contain a fixed element. */}
      <BackButton onClick={onClose} />

      <div className="page-shell w-full px-4 pb-24 md:pl-[120px] md:pr-12">
        <div className="sticky top-0 z-20 -mx-4 bg-[#fafafa]/90 px-4 pb-4 pt-[76px] backdrop-blur md:-ml-[120px] md:-mr-12 md:pb-6 md:pl-[120px] md:pr-12 md:pt-[25px]">
          <PageTitle>{tab.label}</PageTitle>
        </div>
        <div className="mt-8 max-w-3xl">
          {tab.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function Block({ block }) {
  switch (block.type) {
    case 'heading':
      return <h4 className="mt-4 text-sm font-bold text-[#33332f] first:mt-0 md:text-base">{block.text}</h4>
    case 'paragraph':
      return <p className="mt-2 text-sm leading-relaxed text-[#4e4e4e]">{block.text}</p>
    case 'list':
      return (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#4e4e4e]">
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      )
    case 'stats':
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {block.items.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white px-3 py-3 text-center">
              <div className="font-bold text-[#21221f]">{s.value}</div>
              <div className="mt-1 text-[11px] text-[#4e4e4e]">{s.label}</div>
            </div>
          ))}
        </div>
      )
    case 'images':
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {block.items.map((im) => (
            <figure key={im.caption}>
              <img src={im.src} alt={im.caption} className="aspect-square w-full rounded-2xl object-cover" />
              <figcaption className="mt-1 text-center text-[11px] text-[#4e4e4e]">{im.caption}</figcaption>
            </figure>
          ))}
        </div>
      )
    case 'quote':
      return (
        <blockquote className="mt-3 rounded-2xl bg-white px-4 py-3">
          <p className="text-sm italic text-[#4e4e4e]">“{block.text}”</p>
          {block.author && <footer className="mt-2 text-xs text-[#4e4e4e]">— {block.author}</footer>}
        </blockquote>
      )
    case 'code':
      return (
        <pre className="no-scrollbar mt-3 overflow-x-auto rounded-2xl bg-neutral-900 p-3 text-xs leading-relaxed text-neutral-100">
          <code>{block.code}</code>
        </pre>
      )
    case 'tags':
      return (
        <div className="mt-3 flex flex-wrap gap-2">
          {block.items.map((t) => (
            <span key={t} className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#4e4e4e]">
              #{t}
            </span>
          ))}
        </div>
      )
    default:
      return null
  }
}

export default function ProjectDetail() {
  const { activeProject: p, closeDetail: dropDetail } = usePortfolio()
  // Ask the feed to grow out of the press, then step aside. The layer that is
  // about to be seen is the one that animates.
  const closeDetail = useCallback(() => {
    requestReveal('feed')
    dropDetail()
  }, [dropDetail])
  // The logo disc matches the height of the copy beside it. It cannot be done
  // in CSS: a square whose height comes from the row would also widen the row,
  // which feeds back into the copy's height — so measure the copy and size the
  // disc from that.
  const copyRef = useRef(null)
  const [discSize, setDiscSize] = useState(128)
  useLayoutEffect(() => {
    const el = copyRef.current
    if (!el) return
    const fit = () => {
      setDiscSize(Math.max(112, Math.min(220, el.offsetHeight)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [p?.id])
  // Which section card is opened into its full sheet (null = the card grid).
  const [openTabId, setOpenTabId] = useState(null)

  // Esc closes the section sheet first, then the whole overlay.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpenTabId((cur) => {
        if (cur) return null
        closeDetail()
        return cur
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeDetail])

  if (!p) return null

  // The reel is every topic in the project, in the order the sections lay them
  // out — so scrolling back from any card reaches the project's first topic and
  // section boundaries are invisible once you are inside.
  // Where the press that opened this landed. Read once, on mount — after that the
  // pointer has moved on and the circle must not follow it.
  // This layer grows out of the press that opened it, and it plays that growth
  // itself. Closing is NOT its business: the feed underneath is the arriving
  // layer then, and it plays its own growth — see `closeDetail` below.
  const { style: revealStyle, revealing } = useReveal('detail', { start: true })

  // The palette this project actually ships, taken from whichever tab records
  // it. The topic cards read their corner art off this.
  const palette = p.tabs?.find((t) => t.color)?.color

  // The home hero's own block — tagline, bio, live build — travels with every
  // panel: the Hi-fi page ends in that same block, playable in place, and it is
  // fed from the same fields, so the two can never disagree.
  const promo = p.prototypeUrl
    ? {
        proto: p.prototypeUrl,
        tagline: p.tagline,
        bio: p.bio,
        // Which device the live build plays on, and the viewport it is laid out
        // at — the same pair the home screen uses. A web app is shown on the
        // laptop at a desktop viewport; anything else stays on the phone.
        device: p.device ?? 'phone',
        viewport: p.device === 'mac' ? { w: 1440, h: 900 } : null,
      }
    : null
  const panels = p.tabs.flatMap((t) =>
    t.cards
      ? t.cards.map((c) => ({ title: c.label, tab: t, promo }))
      : [{ title: t.label, tab: t, promo }]
  )

  // Project tags shown under the bio — the SAME four the feed section shows,
  // so the profile never introduces tags the home page didn't.
  const tags = (p.techStack ?? []).slice(0, 4)

  return (
    <>
    {/* The ground the growing circle is seen against, and a SIBLING of the layer
        rather than a child: inside it would sit behind the layer's own white
        background and never be seen. z-[39] is under this overlay (z-40) and over
        the feed, so the circle has an edge whatever page is behind it. */}
    {revealing && (
      <div className="pointer-events-none fixed inset-0 z-[39] bg-[#e7e4dd]" aria-hidden />
    )}
    <motion.div
      // No enter/exit animation of its own: the growth is the clip below, and on
      // the way out this layer simply stops being there while the feed grows.
      // Anything fading here would be the old page performing its own departure.
      initial={false}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      className="no-scrollbar fixed inset-0 z-[40] overflow-y-auto bg-[#fafafa]"
      style={revealStyle}
    >
      {/* Outside the sticky header on purpose. That header carries a
          `backdrop-blur`, and a backdrop-filter establishes a containing block —
          so a `fixed` button inside it resolved against the header, not the
          viewport, and the centred page-shell carried it to x196 at 1920 while
          the same button everywhere else stayed at x36. Out here it is absolute
          against the full-screen overlay, which IS the viewport. */}
      {/* Shared — see BackButton. It is a direct child of the overlay,
          because nothing between it and the viewport may carry a transform or a
          backdrop-filter, either of which would contain a fixed element. */}
      <BackButton onClick={closeDetail} />

      <div className="page-shell w-full px-4 pb-24 md:pl-[120px] md:pr-12">
        {/* Title row — sticky while scrolling. The title lands on the EXACT rect
            the feed's focused nav title occupies (measured: left 120, top 100 at
            md), so entering the profile keeps the title visually in place. The
            back button sits in the left gutter, vertically centred on the title
            (title centre 136 − half of the 48px button = top 112). */}
        <div className="sticky top-0 z-20 -mx-4 bg-[#fafafa]/90 px-4 pb-4 pt-[76px] backdrop-blur md:-ml-[120px] md:-mr-12 md:pb-6 md:pl-[120px] md:pr-12 md:pt-[25px]">
          {/* Shared — see PageTitle. This page used to carry its own copy of
              the same class string, which is how it kept the old offset after
              the shared one moved. */}
          <PageTitle>{p.title}</PageTitle>
        </div>

        {/* Logo + copy. The logo stretches to the height of the copy beside it,
            and every chip — product kind, category, tech tags — shares one row
            under the bio rather than being split across the two columns. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.7, delay: 0.1 }}
          className="mt-8 flex flex-col gap-6 md:mt-10 lg:flex-row lg:items-start lg:gap-8"
        >
          {/* Same treatment as the feed avatar: white circle, thin ring, logo
              inset. `self-stretch` + `aspect-square` makes its height match the
              column beside it, with the width following from the ratio. */}
          <div
            className={`grid size-24 shrink-0 place-items-center overflow-hidden rounded-full ${
              p.avatar ? 'bg-white ring-1 ring-[#dedad2]' : 'bg-neutral-800'
            }`}
            style={
              typeof window !== 'undefined' && window.innerWidth >= 768
                ? { width: discSize, height: discSize }
                : undefined
            }
          >
            {p.avatar ? (
              <img src={p.avatar} alt="" className="size-full object-contain p-5 md:p-8" />
            ) : (
              <span className="text-3xl font-bold text-white">{p.title?.[0]}</span>
            )}
          </div>

          <div ref={copyRef} className="min-w-0 flex-1">
            {/* Full bio, never clamped — the feed teases it, the profile shows it. */}
            <p className="text-sm leading-relaxed text-[#4e4e4e] md:text-base">{p.bio}</p>
            {(p.kind || p.category || tags.length > 0) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {p.kind && <Badge icon={platformIcon(p.kind)} label={p.kind} />}
                {p.category && (
                  <Badge icon={CATEGORY_ICON[p.category]} label={p.category} />
                )}
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex h-8 items-center rounded-full bg-white px-4 text-xs font-medium leading-none text-[#4e4e4e] shadow-sm ring-1 ring-[#dedad2] md:h-9 md:text-[13px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

        </motion.div>

        {/* The project's recorded palette, wherever in its tabs it lives — the
            topic cards draw their corner art from it. */}
        <ProfileFacts project={p} />

        {/* Sections are back as headings, but the reel behind them is NOT
            sectioned: every card — whichever section it sits in — opens the
            same project-wide reel at its own topic, so you can scroll from the
            last card of one section into the first of the next. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.78, delay: 0.2 }}
          className="mt-10 flex flex-col gap-12"
        >
          {p.tabs.map((tabItem, ti) => (
            <section key={tabItem.id}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tabItem.cards ? (
                  tabItem.cards.map((card) => (
                    <TopicCard
                      key={card.id}
                      card={card}
                      tab={tabItem}
                      palette={palette}
                      onOpen={() => setOpenTabId({ start: card.label })}
                    />
                  ))
                ) : (
                  <CoverCard
                    tab={tabItem}
                    index={ti}
                    onOpen={() => setOpenTabId({ start: tabItem.label })}
                  />
                )}
              </div>
            </section>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {openTabId && (
          <FeedSheet
            key="reel"
            title={p.title}
            panels={panels}
            startAt={openTabId.start}
            onClose={() => setOpenTabId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
    </>
  )
}
