// -----------------------------------------------------------------------------
// FeedSheet.jsx
// A home-style vertical feed used for a section's detail (e.g. Design System).
// Each heading in the tab becomes one full-viewport panel you scroll through;
// a top-left nav (project title + a sliding 3-item window of headings) tracks
// the scroll exactly like the home page — but with NO right-side action column.
// The sheet is one continuous reel over EVERY topic in a project, opened
// focused on whichever one the tapped card names.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import StageProgress from './StageProgress'
import PageHead from './PageHead'
import { requestReveal, useReveal } from '../lib/reveal'
import { ArrowLeft } from 'lucide-react'
import { PAWMELY_KIT } from './PawmelyKit'
import { METAHERB_KIT } from './MetaherbKit'
import { MM_KIT } from './MMKit'
import { MYATLAS_KIT } from './MyAtlasKit'

// Every project's component page mounts ITS OWN live kit — each one rebuilt
// from that app's real tokens and screens, the way PawmelyKit was. Pawmely's
// kit is keyed by preview `kind`; the newer kits key by the item's exact name,
// because their sets reuse kinds (two inputs, three cards) that would collide.
const KITS = {
  pawmely: PAWMELY_KIT,
  metaherb: METAHERB_KIT,
  mm: MM_KIT,
  myatlas: MYATLAS_KIT,
}
import PhoneFrames from './PhoneFrames'
import MacFrame from './MacFrame'
import ClampText from './ClampText'
import figmaLogo from '../assets/figma-1024px.webp'
import claudeLogo from '../assets/claude-1024px.webp'
import vscodeLogo from '../assets/visual-studio-code-1024px.webp'
import xcodeLogo from '../assets/xcode-1024px.webp'
import githubLogo from '../assets/github-1024px.webp'

// The tools, as their own marks. Keyed by the exact string in mockData so the
// data stays the list of tools and this stays the list of files — a tool with no
// file here is still printed, by name, rather than silently dropped.
const TOOL_LOGO = {
  Figma: figmaLogo,
  Claude: claudeLogo,
  'VS Code': vscodeLogo,
  Xcode: xcodeLogo,
  GitHub: githubLogo,
}


// A lo-fi "feed" illustration matching the reference: a row of grey columns,
// each with two small white label bars near the top and a tall white pill that
// bleeds off the bottom.
const BAR_SHADES = ['#eaeaea', '#e4e4e4', '#ececec', '#e6e6e6', '#efefef', '#e2e2e2']
function FeedBars({ top }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex w-full" style={{ top }}>
      {BAR_SHADES.map((shade, i) => (
        <div key={i} className="relative flex-1" style={{ backgroundColor: shade }}>
          <div className="absolute left-4 top-8 flex flex-col gap-3">
            <div className="h-4 w-16 rounded-full bg-white md:w-20" />
            <div className="ml-1 h-4 w-9 rounded-full bg-white md:w-12" />
          </div>
          <div className="absolute bottom-0 left-1/2 h-[52%] w-9 -translate-x-1/2 rounded-t-full rounded-b-[36px] bg-white md:w-12" />
        </div>
      ))}
    </div>
  )
}

// --- The Project Overview panels --------------------------------------------
// One panel per question the promotion form asks about this project — role,
// outcome, problems, learnings — but answered with the project's OWN material
// rather than a blank field: the credit split, the three-day plan, the store
// results, the issues still open. Everything is optional, so a question shows
// only the blocks it actually has.
//
// The shape follows the specimen panels so the whole reel reads as one page: a
// coloured column on the left states which question this is and the single
// number that answers it fastest; the white column holds the evidence.

// A small titled block in the evidence column. The rule + label is the only
// chrome, so four different kinds of content can sit under one another without
// the page turning into a stack of competing cards.
// A block of the page. It used to print a small uppercase label with a hairline
// running off it; every page carried three or four of them and they said less
// than the content under them did. The block keeps only its spacing — `label` is
// still accepted so the call sites read as what they are.
// Ink at the reference's alphas, resolved to OPAQUE hex. Tailwind emits no rule
// for an opacity modifier on an arbitrary hex — verified: not one of
// `.text-\[#21221f\]\/42`, `/62`, `/76` … reached the built stylesheet — so every
// one of those classes was rendering as inherited full-strength ink and the
// whole hierarchy was invisible. Same tones, computed against white, as colours
// the build can actually produce.
const INK_42 = '#a2a2a1'
const INK_46 = '#999998'
const INK_48 = '#959594'
const INK_62 = '#757674'
const INK_72 = '#5f605e'
const INK_76 = '#565755'

// Every caption on the reference (hirotos.com/about, measured) is the same
// voice: 12px, caps, +0.045em, ink at ~46%, weight 400 — set apart from its
// value by INK ALONE, never by weight. Sub's label finally renders (it used to
// be accepted and dropped), in exactly that voice. Each section also RISES IN
// on the reference's own curve — 0.26s cubic-bezier(.2,.8,.2,1), a small 14px
// lift — as it scrolls into view.
function Sub({ label, children, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
      className={`mt-7 first:mt-0 ${className}`}
    >
      {label && (
        <>
          <div className="text-[12px] font-normal uppercase leading-none tracking-[0.045em] text-[#999998]">
            {label}
          </div>
          {/* The rule travels with the label: sections drew their own (or forgot
              to — Results had none while every neighbour had one). */}
          <div className="mb-7 mt-4 border-t border-[#e7e4dd]" />
        </>
      )}
      {children}
    </motion.section>
  )
}

// The detail half of the owner's card: a full-bleed dark block whose sections
// are shut until one is picked, and only one is ever open — picking another
// closes the one before it. Printing all three at once made the card a scroll
// with no shape to it; folded, the card ends on a short list of what there is.
// How far each panel rides up onto the one above it.
const OVERLAP = 20

function DetailAccordion({ entry, lead }) {
  const [open, setOpen] = useState(null)
  const sections = [
    // The lead panel is a card in the pile like any other — same header, same
    // fold. It only differs in its surface, which is white, so it carries the
    // ink colour the dark panels take by default.
    lead && {
      key: 'overview',
      label: lead.label,
      count: lead.count,
      surface: '#ffffff',
      ink: '#21221f',
      muted: '#8a857a',
      body: lead.body,
    },
    entry.items?.length && {
      key: 'duties',
      label: 'หน้าที่',
      count: `${entry.items.length} ข้อ`,
      body: (
        <ul className="space-y-3">
          {entry.items.map((d, k) => (
            <li key={d.title}>
              {/* No leading index: the count is already stated in the header
                  above ("N ข้อ"), and a number in front of every line made a
                  short list read as a procedure with an order it does not have. */}
              <span className="text-[14px] font-bold">{d.title}</span>
              <p className="mt-1 text-[12px] leading-5 text-white/70">{d.desc}</p>
            </li>
          ))}
        </ul>
      ),
    },
    entry.timeline?.length && {
      key: 'plan',
      label: 'แผนงาน',
      count: `${entry.timeline.length} วัน`,
      body: (
        <div className="space-y-4">
          {entry.timeline.map((d) => (
            <div key={d.name}>
              {/* Date as the heading — see the note in the panel. */}
              <div className="text-[13px] font-bold">{d.period ?? d.name}</div>
              <ul className="mt-1 space-y-1">
                {d.items.map((it) => (
                  <li key={it} className="text-[12px] leading-5 text-white/70">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    },
    entry.tools?.length && {
      key: 'tools',
      label: 'เครื่องมือ',
      count: `${entry.tools.length} ตัว`,
      body: (
        <div className="flex flex-wrap gap-2">
          {entry.tools.map((t) => (
            <span
              key={t}
              className="inline-flex h-8 items-center rounded-full bg-white/10 px-4 text-[12px] font-bold leading-none ring-1 ring-white/15"
            >
              {t}
            </span>
          ))}
        </div>
      ),
    },
  ].filter(Boolean)
  if (!sections.length) return null
  return (
    // Each section is its own panel rather than a row inside one long block —
    // the same way the reference card sets OVERVIEW and PERFOMANCE down as two
    // separate rounded surfaces.
    <>
      {sections.map((s, i) => {
        const isOpen = open === s.key
        const ink = s.ink ?? '#ffffff'
        const muted = s.muted ?? 'rgba(255,255,255,0.5)'
        return (
          <div
            key={s.key}
            // The panels are a pile, not a list: each one rides up onto the one
            // before it and the LOWEST sits on top, so the stack reads from the
            // bottom of the card upward. The bodies carry extra padding at the
            // foot so the panel below never covers the last line.
            // Top corners only: the foot of the pile sits on the card's bottom
            // edge, and a rounded bottom there left two notches of card colour
            // under it.
            className="relative overflow-hidden rounded-t-[24px]"
            style={{
              backgroundColor: s.surface ?? '#1b1b22',
              marginTop: i === 0 ? 0 : -OVERLAP,
              zIndex: i + 1,
              boxShadow: i === 0 ? undefined : '0 -10px 24px rgba(0,0,0,0.30)',
            }}
          >
            <button
              type="button"
              // The card underneath closes on any click, so the header has to
              // keep its own click to itself — otherwise opening a section shut
              // the whole card and the section went with it.
              onClick={(e) => {
                e.stopPropagation()
                setOpen((o) => (o === s.key ? null : s.key))
              }}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-6 pt-4 text-left"
              style={{
                color: ink,
                // A closed panel's foot is under the next panel, so it carries
                // the overlap as dead padding — otherwise the title sat in the
                // covered band and read as clipped.
                paddingBottom: !isOpen && i < sections.length - 1 ? 16 + OVERLAP : 16,
              }}
            >
              <span className="text-[15px] font-bold">{s.label}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-[11px] tabular-nums" style={{ color: muted }}>
                  {s.count}
                </span>
                <svg
                  viewBox="0 0 16 16"
                  className="size-4"
                  style={{
                    color: muted,
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 300ms ease-out',
                  }}
                >
                  <path
                    d="M4 6.5 8 10.5 12 6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            {/* 0fr to 1fr rather than a guessed max-height: the row opens to the
                height its own content needs, whatever that turns out to be. */}
            <div
              className="grid"
              style={{
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows 380ms cubic-bezier(.16,1,.3,1)',
              }}
            >
              <div className="overflow-hidden">
                <div className="px-6" style={{ color: ink, paddingBottom: 24 + OVERLAP }}>
                  {s.body}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

// The role page as a stack of cards: the cover first, then one card per block
// of the page behind it, running left to right until the row fills the panel.
// The LEFTMOST card sits on top and each one behind it is offset just enough to
// show its own edge, so the row reads as a stack rather than a list.
function CoverStack({ entry, tone, open, setOpen }) {
  // Black, white and beige. Opaque all the way down: a stack drawn in alphas of
  // one colour let the card behind bleed through and read as glass, so these are
  // real steps of the site's own paper — each card a shade lighter than the one
  // over it, which is what gives the pile its depth now that no hue does.
  const PAPER = ['#dedad2', '#e7e3db', '#efece5', '#f7f5f0']
  // Ink on paper. The divider is the one card printed the other way round — it is
  // a title page, not a person, and the black is what separates the half of the
  // deck that is me from the half that is everyone else.
  const INK = '#21221f'
  const MUTED = '#6b675f'
  const FAINT = '#8a857a'
  // Everyone on the project except the person whose page this is — the deck
  // after the divider is one card per teammate, so its length is the team's.
  const mates = (entry.team || []).filter((m) => !m.you)
  // Card 01 is the owner's own card, so it reads the same team record the rest
  // of the deck is built from rather than carrying a second copy of the name.
  const me = (entry.team || []).find((m) => m.you)
  const self = entry.self
  // Card 01 keeps its top half empty on purpose: a picture goes there, and the
  // text that used to fill it said the same things the panels below say.
  const cards = [
    {
      key: 'cover',
      title: entry.label,
      bare: true,
      body: null,
      more: (
        // The foot of the card is one pile: mt-auto drops it to the bottom edge
        // and the negative margins cancel the face's padding, so every panel in
        // it runs the full width of the card.
        <div className="relative -mb-6 -ml-12 -mr-6 mt-auto pt-8 md:-mb-7 md:-ml-14 md:-mr-7">
          {/* The overview sheet is the top card of that pile rather than a panel
              of its own above it. Its three figures are counts, each captioned
              with what it was counted from; the bars under them are the credit
              split, the only numbers on this page that share a unit and can
              honestly be compared against each other, with the owner's own share
              drawn again as the ring. */}
          <DetailAccordion
            entry={entry}
            lead={
              self && me && {
                label: 'Overview',
                count: me.title,
                body: (
                  <>
              <div className="grid grid-cols-3 gap-3">
                {self.figures.map((f) => (
                  <div key={f.label}>
                    <div className="text-[24px] font-bold leading-none tabular-nums" style={{ color: tone }}>
                      {f.value}
                    </div>
                    <div className="mt-2 text-[12px] font-bold leading-tight">{f.label}</div>
                    {f.note && <div className="mt-1 text-[10px] leading-4 text-[#8a857a]">{f.note}</div>}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-5 border-t border-[#ececec] pt-5">
                <div className="min-w-0 flex-1 space-y-2">
                  {entry.team.map((m) => (
                    <div key={m.name}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[11px] text-[#6b675f]">
                          {m.name}
                          {m.you && ' · คุณ'}
                        </span>
                        <span className="font-mono text-[12px] font-bold tabular-nums">{m.share}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#efedea]">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${m.share}%`,
                            backgroundColor: m.you ? tone : `${tone}59`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative grid size-[86px] shrink-0 place-items-center">
                  <svg viewBox="0 0 36 36" className="absolute size-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#efedea" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={tone}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(me.share / 100) * 97.4} 97.4`}
                    />
                  </svg>
                  <div className="w-[52px] text-center">
                    <div className="text-[17px] font-bold leading-none tabular-nums">{me.share}%</div>
                    <div className="mt-1 text-[8px] leading-[1.3] text-[#8a857a]">{self.gaugeNote}</div>
                  </div>
                </div>
              </div>
                  </>
                ),
              }
            }
          />
        </div>
      ),
    },
    // The divider. It is a title page for the half of the deck that follows, so
    // it never opens — there is nothing inside it to read. It still takes hover
    // and focus, so it behaves like a card rather than a dead panel.
    mates.length > 0 && {
      key: 'team-divider',
      title: 'เพื่อนร่วมทีม',
      locked: true,
      cover: true,
      body: null,
    },
    // One card per teammate.
    ...mates.map((m) => ({
      key: `mate-${m.name}`,
      title: m.name,
      body: (
        <>
          <div className="text-[clamp(26px,2.4vw,40px)] font-bold leading-[1.08] tabular-nums">
            {m.share}%
          </div>
          <p className="mt-2 text-[13px] leading-6" style={{ color: MUTED }}>
            {m.title}
          </p>
          {/* The bar is the same number again, against the whole project — the
              only figure this page actually records per person. */}
          <div
            className="mt-3 h-1.5 w-full max-w-[240px] overflow-hidden rounded-full"
            style={{ backgroundColor: 'rgba(33,34,31,0.12)' }}
          >
            <span
              className="block h-full rounded-full"
              style={{ width: `${m.share}%`, backgroundColor: INK }}
            />
          </div>
          <p className="mt-6 text-[12px] leading-5" style={{ color: FAINT }}>
            สัดส่วนงานมาจากเครดิตของโปรเจกต์ ส่วนรายละเอียดงานรายคนยังไม่ได้บันทึกไว้ในเอกสารต้นทาง
          </p>
        </>
      ),
    })),
  ].filter(Boolean)
  const n = cards.length
  // One card is always the open one. The deck has no all-shut state: shutting the
  // last card left the column showing four spines and nothing to read, so the
  // pointer picks a card the way an accordion does rather than toggling one.
  // null still means "nobody has touched this yet" — the parent reads that to
  // decide whether the deck sits over the cover column — and it reads as card 01,
  // which is what the deck was already dealt showing.
  const active = open ?? 0
  const cardRefs = useRef([])
  // Hover opens, but not instantly: sweeping the pointer across the column to
  // reach the card at the far end would otherwise deal the whole deck twice on
  // the way. 80ms is under the threshold where a deliberate hover feels delayed
  // and over the one a passing pointer spends on a card.
  const INTENT_MS = 80
  const intent = useRef(null)
  useEffect(() => () => clearTimeout(intent.current), [])
  const reduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  // The divider is a title page with nothing inside it, so it is skipped rather
  // than opened — hovering or arrowing onto it leaves the open card open.
  const openable = (i) => cards[i] && !cards[i].locked
  const pick = (i, delay) => {
    clearTimeout(intent.current)
    if (!openable(i)) return
    if (!delay) return setOpen(i)
    intent.current = setTimeout(() => setOpen(i), INTENT_MS)
  }
  // Arrow keys walk the deck the way they walk any list, stepping over the
  // divider, and carry focus with them so the next arrow starts from the card
  // you can see rather than the one you left behind.
  const step = (from, dir) => {
    for (let k = 1; k <= n; k++) {
      const i = (from + dir * k + n * k) % n
      if (openable(i)) {
        pick(i, false)
        cardRefs.current[i]?.focus()
        return
      }
    }
  }
  // The deck is dealt to fill the column exactly: every card is the same width,
  // each one starts STRIP px after the last, and the final card's right edge
  // lands on the right edge of the panel. Widening the cards therefore means
  // narrowing the strips, and the two are solved together rather than picked by
  // hand. The cover card on the left keeps its own width — it is not part of
  // this deal.
  const STRIP = 180
  // No cover column any more, so the deck is dealt from the panel's own left
  // edge — the 28px it used to be pulled under that column is gone from both the
  // width and the deal.
  const CARD_W = `calc(100% - ${(n - 1) * STRIP}px)`
  const restLeft = (i) => `${i * STRIP}px`
  // Picking a card draws it OUT of the pile, to the right, and shrinks the cards
  // lying on top of it down to the strip they were already showing. Nothing
  // steps back to the left and nothing jumps the z-order — the deck keeps its
  // one order, leftmost on top, and a card becomes readable because the cards
  // over it get out of its way, not because it is lifted over them.
  //
  // The two moves are one number: a card on top of the open one is cut to
  // STRIP + DRAW wide, which lands its right edge exactly on the open card's new
  // left edge, so the deck closes up behind the card being drawn out instead of
  // opening a gap.
  const DRAW = 40

  return (
    <div
      className="relative h-full w-full"
      // Leaving the deck entirely puts it back the way it was dealt. The leave
      // is taken on the column, not on each card, so moving from one card to the
      // next never passes through a shut state.
      onMouseLeave={() => {
        clearTimeout(intent.current)
        setOpen(null)
      }}
    >
      <style>{`
        @keyframes paw-card-face { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
      {cards.map((c, i) => {
        const isOpen = active === i
        // Only the middle cards draw out. The two on the ends are pinned to the
        // panel edges: nothing lies over card 01 to be drawn out from, and
        // sliding it right just tore it off the left edge of the screen; the last
        // card has no room to its right at all. Both are uncovered by the cards
        // over them shrinking back, which is the whole move on this deck.
        const slide = active > 0 && active < n - 1 ? DRAW : 0
        const covering = i < active
        // Every card is dealt where it always was. Only two things change: the
        // open card slides out to the right, and the cards lying over it are cut
        // back to the strip they were already showing. Cards to the right of the
        // open one are untouched — they are underneath it, and their own strips
        // sit clear of it.
        const leftAt = `calc(${restLeft(i)} + ${isOpen ? slide : 0}px)`
        // Cut to exactly the strip, plus however far the open card moved, so the
        // card on top of it ends flush against its new left edge.
        const widthAt = covering ? `${STRIP + slide}px` : CARD_W
        return (
        <div
          key={c.key}
          ref={(el) => (cardRefs.current[i] = el)}
          role="button"
          tabIndex={0}
          aria-label={c.title}
          aria-expanded={c.locked ? undefined : isOpen}
          onMouseEnter={() => pick(i, true)}
          // Only the pending hover is cancelled here. Shutting the deck is the
          // column's job — doing it per card would shut it in the gap between one
          // card and the next.
          onMouseLeave={() => clearTimeout(intent.current)}
          // Touch has no hover, so the tap is the whole gesture. It opens and
          // never closes, for the same reason hover does not.
          onClick={() => pick(i, false)}
          onFocus={() => pick(i, false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              pick(i, false)
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault()
              step(i, 1)
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault()
              step(i, -1)
            }
          }}
          className={`absolute inset-y-0 overflow-hidden rounded-[26px] ${
            c.locked ? 'cursor-default' : 'cursor-pointer'
          }`}
          style={{
            // The two cards on the ends meet the panel edge, so they square off
            // against it: the first drops its left corners, the last its right.
            // A rounded corner there left a wedge of page showing through the
            // deck at the edge of the screen.
            borderTopLeftRadius: i === 0 ? 0 : undefined,
            borderBottomLeftRadius: i === 0 ? 0 : undefined,
            borderTopRightRadius: i === n - 1 ? 0 : undefined,
            borderBottomRightRadius: i === n - 1 ? 0 : undefined,
            backgroundColor: c.cover ? INK : PAPER[i % PAPER.length],
            color: c.cover ? '#ffffff' : INK,
            // One order, leftmost on top, and it never changes. The open card is
            // not lifted over the pile — the pile is cut back off it.
            zIndex: n - i,
            left: leftAt,
            width: widthAt,
            // Nothing tilts, lifts or scales: the deck stays pinned to the top
            // and bottom edges, and the whole gesture is horizontal — the picked
            // card slides out to the right while the cards over it shrink back,
            // which is what makes it read as one card being drawn from a hand.
            willChange: 'left, width',
            transition: reduced
              ? 'none'
              : 'left 520ms cubic-bezier(.16,1,.3,1), width 520ms cubic-bezier(.16,1,.3,1), box-shadow 520ms ease-out',
            boxShadow: isOpen
              ? '-6px 0 44px rgba(0,0,0,0.28)'
              : '10px 0 30px rgba(0,0,0,0.16)',
          }}
        >
          {/* A card in the pile shows only the edge that is not covered, so it
              wears its name down that edge. Reading it is what opening is for —
              printing the body under a card that overlaps it produced strips of
              half-sentences. */}
          {/* Content only on the card you are actually reading: the first card
              keeps its face while the deck is closed, but once it steps back for
              an opened card its face is half under the cover and reads as
              chopped-off sentences, so it wears its spine like the rest. */}
          {c.cover ? (
            // The divider never opens, so it never wears a spine either: it is a
            // title page, printed to fit the strip it is dealt.
            // Every card in the pile shows the same STRIP along its right edge,
            // whatever else the deck is doing: a card cut back for an open one is
            // cut to that strip exactly, so the band never moves and the text can
            // simply ride the right edge.
            <div
              className="absolute inset-y-0 right-0 flex flex-col items-end justify-between p-5 pt-24 md:pt-16"
              style={{ width: STRIP }}
            >
              {/* Set down the edge like every other card in the pile — the
                  divider is a title page, but it is still a card in a stack, and
                  a horizontal title was the only one reading crosswise. */}
              <div
                className="flex items-center gap-3"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                <span className="text-[17px] font-bold">{c.title}</span>
                <span className="font-mono text-[12px] tabular-nums text-white/75">
                  {mates.length} คน
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                ต่อไป
              </span>
            </div>
          ) : !isOpen ? (
            // The spine rides the card's right edge, which is the only part of it
            // that is ever uncovered — a shut card shows exactly STRIP of itself
            // whether the deck is at rest or cut back for an open card.
            <div
              className="absolute inset-y-0 right-0 flex flex-col items-end justify-between p-5 pt-24 md:pt-16"
              style={{ width: STRIP }}
            >
              <span
                className="text-[17px] font-bold"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                {c.title}
              </span>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
                style={{ color: FAINT }}
              >
                open
              </span>
            </div>
          ) : (
            <div
              // A column, so anything marked mt-auto inside the face falls to
              // the card's bottom edge instead of stopping under the text.
              className="no-scrollbar flex h-full flex-col overflow-y-auto p-6 pl-12 pt-24 md:p-7 md:pl-14 md:pt-16"
              style={{ animation: isOpen ? 'paw-card-face 300ms 100ms both ease-out' : undefined }}
            >
              {/* A bare card prints no heading and no body: the top of it is
                  being kept clear for a picture, and the pile at its foot
                  already carries everything the text used to say. */}
              {!c.bare && (
                <>
                  <h3 className="text-[18px] font-bold leading-tight md:text-[20px]">{c.title}</h3>
                  <div className="mt-4">{c.body}</div>
                </>
              )}
              {isOpen && c.more}
            </div>
          )}
        </div>
        )
      })}
    </div>
  )
}

// The head every detail page opens on: the page's name at size in the MEDIUM
// weight, then a row of labelled fields under their own rules. No standfirst and
// no rule under the title — the paragraph restated what the blocks below it say
// and the rule was drawn whether or not anything followed it. One component, so the eight pages of this reel open identically
// instead of each inventing its own masthead. No eyebrow above the title — the
// step number was printed on every page and named nothing the title did not.


function ReportSpecimen({ top, data, title }) {
  const [stackOpen, setStackOpen] = useState(null)
  const entry = data?.entries?.find((e) => e.label === title)
  if (!entry) return <FeedBars top={top} />
  const tone = entry.color
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
    >
      {/* The cover column is gone from every page in this reel. On the text
          pages the head is set inline; on the stack page the deck was being
          dealt into 70% of the screen against a column that repeated the card
          it was covering. The deck now gets the whole width. */}
      {/* 02 — the evidence. */}
      {entry.stack ? (
        // This page IS the stack, so it gets the whole area: no chips, no
        // standfirst, no section rule above it.
        <div className="relative z-[1] min-w-0 flex-1 bg-white">
          <CoverStack entry={entry} tone={tone} open={stackOpen} setOpen={setStackOpen} />
        </div>
      ) : (
      // A text page is a piece of writing, so it is set as one: a centred column
      // that opens on the page's own name, states its case once at size, and
      // then breaks into labelled fields under hairlines. No cover column, no
      // chips, no filled cards — the rule and the label do all the framing.
      <div className="no-scrollbar relative grid min-w-0 flex-1 [align-content:safe_center] overflow-y-auto bg-white px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <PageHead
          title={entry.label}
          lead={entry.lead}
          // A page can opt out of the strip — see `headFields` in the data.
          fields={
            entry.headFields === false
              ? []
              : [
                  entry.stat && { label: entry.statLabel ?? 'Headline', value: entry.stat },
                  { label: 'Subject', value: data.subtitle },
                  { label: 'Dates', value: entry.dates || data.period },
                ]
          }
        />

        <div className="mx-auto w-full max-w-[720px]">
          {/* A page with no field strip opens straight onto its first block, so
              it does not carry the gap that strip used to need. */}
          <div className={`space-y-9 ${entry.headFields === false && !entry.strip ? 'mt-8' : 'mt-14'}`}>
            {/* The team. One column each, no disc behind the face — and the head
                is sized to sit INSIDE its column: drawn larger than the column it
                ran up over the rule and into the block above, which reads as a
                mistake rather than as a treatment. The three files are trimmed to
                the same fill, so one height renders three equal heads. */}
            {entry.team?.length > 0 && (
              <Sub>
                {/* Ruled top AND bottom — the one block on the page that is a
                    band rather than a column, so it is closed on both sides. */}
                {/* Open at the TOP on a page whose strip was dropped: with no
                    fields between the title and this band, the top rule and the
                    space above it were closing off nothing. Closed at the bottom
                    as before, so the band still ends against the next block. */}
                <div className="grid grid-cols-3 gap-x-6">
                  {entry.team.map((m) => (
                    <div key={m.name} className="text-center">
                      {m.photo ? (
                        <img
                          src={m.photo}
                          alt={m.name}
                          draggable={false}
                          className="mx-auto h-[176px] w-auto select-none object-contain"
                        />
                      ) : (
                        <div className="grid h-[176px] place-items-center text-[48px] font-medium text-[#c9c6c0]">
                          {m.name.slice(0, 1)}
                        </div>
                      )}
                      <div className="mt-5 text-[15px] font-medium leading-tight text-[#21221f]">
                        {m.name}
                        {m.you && <span className="text-[#a2a2a1]"> · คุณ</span>}
                      </div>
                      <div className="mt-1 text-[12px] font-normal leading-4 text-[#757674]">
                        {m.title ?? m.role}
                      </div>
                    </div>
                  ))}
                </div>
              </Sub>
            )}

            {/* The page's own figures, when it keeps a set apart from the store
                metrics — same three-step column as everything else. */}
            {/* The page's own figures, one card each: rounded, hairline, and
                sitting directly under the team they belong to. Set as cards
                rather than as bare columns so they read as three separate counts
                instead of one strip of numbers. */}
            {entry.self?.figures?.length > 0 && (
              <Sub>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {entry.self.figures.map((f) => (
                    <div
                      key={f.label}
                      className="rounded-[20px] border border-[#e7e4dd] bg-white px-5 py-6 text-center"
                    >
                      <div className="text-[26px] font-medium leading-none tracking-tight text-[#21221f]">
                        {f.value}
                      </div>
                      <div className="mt-2 text-[13px] font-normal leading-tight text-[#999998]">
                        {f.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Sub>
            )}

            {/* Numbers first when there are any: a released app is judged on the
                store rows before anything else on the page. */}
            {entry.metrics?.length > 0 && (
              <Sub label="Results">
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
                  {entry.metrics.map((m) => (
                    <div key={m.label}>
                      <div className="text-[26px] font-medium leading-none tracking-tight text-[#21221f]">
                        {m.value}
                      </div>
                      <div className="mt-2 text-[13px] font-normal leading-tight text-[#999998]">
                        {m.label}
                      </div>
                      {m.note && (
                        <div className="mt-1 text-[11px] font-normal leading-4 text-[#999998]">
                          {m.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Sub>
            )}

            {/* `strip` pages set their items the way the reference sets NAME /
                ROLE / CONTACT: a hairline over each column, the item's name as a
                caption in caps at 46% ink, and its line as the value in full ink
                underneath. No section label above them — the columns ARE the
                structure. */}
            {/* The courses. One block per certificate: the certificate itself,
                then the four things the appraisal form asks of it — what it was
                for, what came out of it, where it was used, and the code anyone
                can check it with. The image is the real document, rendered from
                the PDF Coursera issued; the verify link is the one printed on
                it, so the block cannot claim a course the issuer would not
                confirm. */}
            {/* The evidence row. The appraisal this report answers to asks for
                supporting documents, and a link someone can open IS the
                document — the store listing, the running build, the commits.
                Set as captions rather than buttons: they are references, not
                the point of the page. */}
            {entry.links?.length > 0 && (
              <Sub label="หลักฐาน">
                <ul className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
                  {entry.links.map((l) => (
                    <li key={l.url} className="border-t border-[#e7e4dd] pt-3">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] font-normal leading-[1.5] text-[#21221f] underline decoration-[#c9c6c0] underline-offset-4 transition hover:text-[#5a5750]"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Sub>
            )}

            {entry.certs?.length > 0 && (
              <Sub label="หลักสูตรที่อบรม">
                <div className="space-y-12">
                  {entry.certs.map((c) => (
                    <div key={c.name}>
                      <img
                        src={`${import.meta.env.BASE_URL}${c.img}`}
                        alt={`ใบรับรอง ${c.name}`}
                        loading="lazy"
                        className="w-full rounded-[12px] border border-[#e7e4dd]"
                      />
                      <h3 className="mt-6 text-[17px] font-medium leading-snug text-[#21221f]">
                        {c.name}
                      </h3>
                      <div className="mt-2 text-[13px] font-normal leading-[1.6] text-[#757674]">
                        {c.issuer} · จบหลักสูตร {c.date}
                      </div>
                      <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-3">
                        {[
                          ['วัตถุประสงค์การเรียนรู้', c.objective],
                          ['สิ่งที่ได้จากการอบรม', c.gained],
                          ['การนำไปใช้กับการทำงานจริง', c.applied],
                        ].map(([label, value]) => (
                          <div key={label} className="border-t border-[#e7e4dd] pt-3">
                            <dt className="text-[12px] font-normal uppercase leading-none tracking-[0.045em] text-[#999998]">
                              {label}
                            </dt>
                            <dd className="mt-2.5 text-[14px] font-normal leading-[1.6] text-[#21221f]">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <a
                        href={c.verify}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-block text-[13px] font-normal text-[#757674] underline decoration-[#c9c6c0] underline-offset-4 transition hover:text-[#21221f]"
                      >
                        ตรวจสอบใบรับรองที่ Coursera
                      </a>
                    </div>
                  ))}
                </div>
              </Sub>
            )}

            {entry.items?.length > 0 && entry.strip ? (
              <Sub>
                <div className="grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
                  {entry.items.map((it) => (
                    <div key={it.title} className="border-t border-[#e7e4dd] pt-3">
                      <div className="text-[12px] font-normal uppercase leading-none tracking-[0.045em] text-[#999998]">
                        {it.title}
                      </div>
                      <p className="mt-2.5 text-[14px] font-normal leading-[1.6] text-[#21221f]">
                        {it.desc}
                      </p>
                      {/* What was DONE about it. A problem stated without its
                          answer is only half the page — and half the mark on the
                          rubric this report is written against, which asks for
                          the problem and a workable fix together. Set quieter
                          than the problem and led by a caption, so the pair reads
                          as one thought rather than two sentences. */}
                      {it.fix && (
                        <p className="mt-3 text-[14px] font-normal leading-[1.6] text-[#757674]">
                          <span className="uppercase tracking-[0.045em] text-[12px] text-[#999998]">
                            แนวทางแก้{' '}
                          </span>
                          {it.fix}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Sub>
            ) : entry.items?.length > 0 ? (
              <Sub label="รายละเอียด">
                <div className="grid grid-cols-1 gap-x-6 gap-y-7 lg:grid-cols-2">
                  {entry.items.map((it) => (
                    <div key={it.title}>
                      {/* Unnumbered — see the note on the card list above. */}
                      <h3 className="text-[15px] font-medium leading-tight text-[#21221f]">
                        {it.title}
                      </h3>
                      <p className="mt-2 text-[15px] font-normal leading-[1.65] text-[#757674]">
                        {it.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </Sub>
            ) : null}

            {/* Three days, three columns — the plan is the answer here, so it is
                laid out as the calendar it was. */}
            {entry.timeline?.length > 0 && (
              <Sub label="แผนงาน">
                <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-3">
                  {entry.timeline.map((d) => (
                    <div key={d.name}>
                      {/* The DATE is the heading. "Day 1" beside "27 พ.ค. 69"
                          said the same thing twice, and the one that carries the
                          information is the date. Kept in the same weight the
                          name had, so the row reads unchanged. */}
                      <span className="text-[13px] font-medium text-[#21221f]">
                        {d.period ?? d.name}
                      </span>
                      {/* No summary line and no bullet dots: the summary said in
                          a phrase what the list below says item by item, and the
                          dots were a second mark on a list that is already one
                          item per line. */}
                      <ul className="mt-3 space-y-1.5">
                        {d.items.map((it) => (
                          <li key={it} className="text-[12px] leading-5 text-[#5f605e]">
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Sub>
            )}

            {/* Open issues are drawn as unticked boxes on purpose: they are the
                one list on the page that is not finished work. */}
            {entry.open?.length > 0 && (
              <Sub label="ยังค้างอยู่">
                <ul className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
                  {entry.open.map((it) => (
                    <li
                      key={it}
                      className="flex items-start gap-3 text-[13px] leading-relaxed text-[#5f605e]"
                    >
                      <span className="mt-0.5 size-4 shrink-0 rounded-[5px] border border-[#d6d2c9]" />
                      {it}
                    </li>
                  ))}
                </ul>
              </Sub>
            )}

            {/* The marks themselves, not their names: a tool is recognised by its
                logo faster than it is read, and the row stays one line instead of
                a sentence of slashes. `title` carries the name for a pointer, and
                `alt` carries it for anything that cannot see the file. */}
            {entry.tools?.length > 0 && (
              <Sub label="เครื่องมือ">
                <div className="flex flex-wrap items-center gap-4">
                  {entry.tools.map((t) =>
                    TOOL_LOGO[t] ? (
                      <img
                        key={t}
                        src={TOOL_LOGO[t]}
                        alt={t}
                        title={t}
                        // Contained, never cropped — these are logos, and each file
                        // has its own margin baked in.
                        className="size-6 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      // No file for this one. Printed as a word at the same height
                      // rather than left out, so the list stays the truth.
                      <span key={t} className="text-[13px] leading-6 text-[#565755]">
                        {t}
                      </span>
                    )
                  )}
                </div>
              </Sub>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

// --- Colour maths -----------------------------------------------------------
// Contrast is the one property of a palette you cannot eyeball, so the panel
// computes it rather than asserting it. WCAG 2.1 relative luminance.
function relLum(hex) {
  const h = hex.replace('#', '')
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const [r, g, b] = ch.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
// Which ink stays legible on a given fill — used for the label printed inside
// each swatch, so no tile ever labels itself illegibly.
const inkOn = (hex) => (contrast(hex, '#FFFFFF') >= 3 ? '#FFFFFF' : '#1A1A1A')

// A live mini-mockup of a component, drawn from its `kind`. Same silhouettes the
// Component card piles up as draggable objects, shrunk to a list preview so each
// row SHOWS the component instead of only naming it.
const ROSE = '#9F5266'
const ROSE_SOFT = '#CC8796'
const OCEAN = '#2C6E8C'
// Tinted with the OWNING project's tone: the silhouettes are shared shapes,
// but a Metaherb specimen drawn in Pawmely rose read as Pawmely's component.
function CompPreview({ kind, tone }) {
  const ROSE = tone ?? '#9F5266'
  const ROSE_SOFT = tone ? `${tone}B3` : '#CC8796'
  switch (kind) {
    case 'button':
      return (
        <div className="flex h-14 w-24 flex-col items-center justify-center gap-1.5">
          <span className="grid h-6 w-20 place-items-center rounded-full" style={{ backgroundColor: ROSE }}>
            <span className="h-1.5 w-9 rounded-full bg-white/85" />
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="grid h-5 w-12 place-items-center rounded-full border"
              style={{ borderColor: ROSE }}
            >
              <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: `${ROSE}99` }} />
            </span>
            <span className="size-5 rounded-full" style={{ backgroundColor: `${ROSE}26` }} />
          </span>
        </div>
      )
    case 'input':
      return (
        <div className="flex h-14 w-24 flex-col justify-center gap-2">
          <span className="flex h-6 items-center rounded-full bg-white px-3 ring-1 ring-black/[0.08]">
            <span className="h-1.5 w-10 rounded-full bg-black/15" />
          </span>
          {/* The focused state: same field, brand ring. */}
          <span
            className="flex h-6 items-center rounded-full bg-white px-3 ring-2"
            style={{ '--tw-ring-color': ROSE }}
          >
            <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: ROSE }} />
          </span>
        </div>
      )
    case 'card':
      return (
        <div className="h-14 w-24 overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.08]">
          <span className="flex h-6 items-center gap-1.5 px-2" style={{ backgroundColor: `${ROSE_SOFT}59` }}>
            <span className="size-4 rounded-full" style={{ backgroundColor: ROSE }} />
            <span className="h-1.5 w-8 rounded-full bg-black/20" />
          </span>
          <span className="flex items-end gap-[3px] px-2 pt-2">
            {[6, 10, 8, 13, 11].map((h, i) => (
              <span key={i} className="flex-1 rounded-t-sm" style={{ height: h, backgroundColor: `${ROSE}80` }} />
            ))}
          </span>
        </div>
      )
    case 'tabbar':
      return (
        <div className="relative flex h-14 w-24 items-end justify-center">
          <span className="flex h-9 w-24 items-center justify-between rounded-full bg-white px-2 shadow-sm ring-1 ring-black/[0.08]">
            <span className="flex gap-1.5">
              <span className="h-4 w-7 rounded-full" style={{ backgroundColor: ROSE }} />
              <span className="size-2 self-center rounded-full bg-black/20" />
            </span>
            <span className="flex gap-1.5">
              <span className="size-2 self-center rounded-full bg-black/20" />
              <span className="size-2 self-center rounded-full bg-black/20" />
            </span>
          </span>
          {/* The raised paw button that splits the row. */}
          <span
            className="absolute bottom-5 left-1/2 size-8 -translate-x-1/2 rounded-full ring-4 ring-white"
            style={{ backgroundColor: ROSE }}
          />
        </div>
      )
    case 'toggle':
      return (
        <div className="flex h-14 w-24 flex-col items-center justify-center gap-2">
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-9 items-center rounded-full px-0.5" style={{ backgroundColor: ROSE }}>
              <span className="ml-auto size-4 rounded-full bg-white" />
            </span>
            <span
              className="grid size-5 place-items-center rounded-[6px]"
              style={{ backgroundColor: ROSE }}
            >
              <span className="h-2 w-2.5 rotate-[-45deg] border-b-2 border-l-2 border-white" />
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded-full border-2" style={{ borderColor: ROSE }}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: ROSE }} />
            </span>
            <span className="size-5 rounded-full border-2 border-black/15" />
          </span>
        </div>
      )
    case 'steps':
      return (
        <div className="flex h-14 w-24 items-center">
          <span className="flex h-8 w-24 items-center justify-between rounded-full bg-white px-2 ring-1 ring-black/[0.08]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="flex flex-1 items-center">
                <span
                  className="size-4 shrink-0 rounded-full"
                  style={{ backgroundColor: i < 2 ? ROSE : '#e6e6e8' }}
                />
                {i < 3 && (
                  <span
                    className="h-[2px] flex-1"
                    style={{ backgroundColor: i < 1 ? ROSE : '#e6e6e8' }}
                  />
                )}
              </span>
            ))}
          </span>
        </div>
      )
    case 'skeleton':
      return (
        <div className="flex h-14 w-24 flex-col justify-center gap-2 rounded-xl bg-white p-2 ring-1 ring-black/[0.08]">
          <span className="flex items-center gap-2">
            <span className="size-6 rounded-full bg-black/[0.13]" />
            <span className="h-2 flex-1 rounded-full bg-black/[0.13]" />
          </span>
          <span className="h-2 w-full rounded-full bg-black/[0.11]" />
          <span className="h-2 w-2/3 rounded-full bg-black/[0.11]" />
        </div>
      )
    case 'tile':
      return (
        <div className="flex h-14 w-20 flex-col gap-1 rounded-xl bg-white p-1.5 ring-1 ring-black/[0.08]">
          <span className="h-6 w-full rounded-md" style={{ backgroundColor: `${ROSE_SOFT}66` }} />
          <span className="h-1.5 w-8 rounded-full bg-black/15" />
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: '#C25450' }} />
            <span className="h-1.5 w-4 rounded-full bg-black/10" />
          </span>
        </div>
      )
    case 'call':
      return (
        <div className="flex h-14 w-24 items-center justify-center">
          <span className="flex h-9 items-center gap-2 rounded-full bg-white px-2 shadow-sm ring-1 ring-black/[0.08]">
            <span className="size-6 rounded-full" style={{ backgroundColor: `${OCEAN}59` }} />
            <span className="font-mono text-[10px] font-semibold" style={{ color: OCEAN }}>
              02:14
            </span>
            <span className="size-5 rounded-full" style={{ backgroundColor: '#C25450' }} />
          </span>
        </div>
      )
    case 'badge':
      return (
        <div className="flex h-14 w-24 flex-col items-center justify-center gap-1.5">
          {[
            ['#4FB36C', 44],
            ['#E8A87C', 56],
            ['#C25450', 36],
          ].map(([c, w]) => (
            <span
              key={c}
              className="flex h-4 items-center gap-1 rounded-full px-1.5"
              style={{ width: w, backgroundColor: `${c}26` }}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="h-1 flex-1 rounded-full" style={{ backgroundColor: `${c}80` }} />
            </span>
          ))}
        </div>
      )
    default:
      return null
  }
}

// The Component panel. Ten near-identical rows of pale rose on white read as one
// grey mass — you could not tell where one component ended and the next began,
// and the mocks disappeared into the page they sat on. So each component now
// gets its own card, bounded by a single hairline. The card carries no fill of
// its own: the specimens are already the coloured thing on the page, and a
// tinted well behind them competed with the components it was meant to frame.
// Name and role sit in one baseline row and are told apart by ink alone.
function ComponentSpecimen({ top, data }) {
  if (!data) return <FeedBars top={top} />
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
    >
      <div className="no-scrollbar relative grid min-w-0 flex-1 [align-content:safe_center] overflow-y-auto bg-white px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <PageHead
          title="Component"
          fields={[
            { label: 'Count', value: `${data.count} components` },
            { label: 'Platform', value: data.platform },
            data.source && { label: 'Source', value: data.source },
          ]}
        />

        <div className="mx-auto mt-16 w-full max-w-[1080px]">
          {/* auto-rows-fr + h-full: one card's longer description used to make
              its whole row taller than the next, and a component set that draws
              its own specimens should not look like it changes size. */}
          <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2">
            {data.items.map((it) => {
              // Name first (the newer kits), kind as the fallback (Pawmely's).
              const kit = KITS[data.kit]
              const Live = kit ? (kit[it.name] ?? kit[it.kind]) : null
              return (
              <div
                key={it.name}
                className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#e7e4dd] bg-white"
              >
                {/* The role reads as a corner mark on the card, out of the
                    specimen's way — the mocks are centred, so the top-left
                    corner is empty in every one of them. */}
                <span className="pointer-events-none absolute left-5 top-4 z-10 text-[11px] font-normal uppercase leading-none tracking-[0.045em] text-[#999998]">
                  {it.role}
                </span>
                {/* The component ITSELF, mounted and live — not a picture of
                    it. Every one of these takes focus, switches, counts or
                    animates exactly as it does in the app, so the page can be
                    pressed instead of read.
                    It sits on the card's own white, not a filled well: the
                    specimens carry the brand colour themselves, and a second
                    tinted surface under them put more weight on the page than
                    the components. One hairline is enough of an edge. */}
                <div className="grid h-[212px] shrink-0 place-items-center px-5 py-4">
                  {Live ? (
                    <Live />
                  ) : (
                    // Scaled up from the card-jar size so the specimen fills
                    // the same stage the live kit does.
                    <div style={{ transform: 'scale(1.8)' }}>
                      <CompPreview kind={it.kind} tone={data.tone} />
                    </div>
                  )}
                </div>
                {/* Name and description differ by INK, not by weight — the same
                    rule the report pages are set by. */}
                <div className="flex flex-1 flex-col border-t border-[#f0eee9] px-5 py-4">
                  <h3 className="text-[15px] font-medium leading-tight text-[#21221f]">
                    {it.name}
                  </h3>
                  <p className="mt-2 text-[13px] font-normal leading-[1.6] text-[#757674]">{it.use}</p>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// The Color panel. Same two questions the Typography panel answers, asked of
// colour: *which* colour is the brand (01, unmissable, the panel is painted in
// it), and *what do I look at first* (02, tokens grouped by role — brand,
// surface, text, border, semantic, category — in that order). Every swatch
// carries its token name, its measured usage count in the app, and its computed
// contrast against the background it actually sits on, because a palette page
// that only shows squares tells you nothing you could not get from a screenshot.
function ColorSpecimen({ top, data }) {
  if (!data) return <FeedBars top={top} />

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
    >
      <div className="no-scrollbar relative z-[1] grid min-w-0 flex-1 [align-content:safe_center] overflow-y-auto bg-white px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <PageHead
          title="Palette Color"
          fields={[
            data.brand && { label: 'Brand', value: `${data.brand.name} · ${data.brand.hex}` },
            data.brand && { label: 'Token', value: data.brand.token },
            { label: 'Groups', value: `${data.groups.length} roles` },
          ]}
        >
          {/* The deck's spectrum, built from the palette's OWN lead ramp — a
              hardcoded rainbow described some other project's colours. */}
          <span
            className="mx-auto mt-6 block h-2 w-20 rounded-full"
            style={{
              background: `linear-gradient(90deg,${(data.groups[0]?.swatches ?? [])
                .map((sw) => sw.hex)
                .join(',')})`,
            }}
          />
        </PageHead>

        <div className="mx-auto mt-16 w-full max-w-[1080px]">
        {/* The palette, laid out like a colour-inspiration sheet: each role
            group is a titled palette of named swatches. */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 pb-6">
          {data.groups.map((g) => (
            <div key={g.name} className="flex min-h-0 flex-1 flex-col gap-1">
              {/* The role the swatches share, set as a plain caption — it wore a
                  filled pill, which is the one piece of chrome no other label on
                  any of these pages uses. */}
              <span className="w-fit font-mono text-[10px] uppercase tracking-[0.16em] text-[#a2a2a1]">
                {g.name}
              </span>
              {/* Swatches in a group STACK, each overlapping the one to its left
                  like a fanned deck; the name and hex sit ON the colour itself in
                  an ink chosen for contrast, so every card carries its own label. */}
              <div className="flex min-h-0 flex-1 -space-x-6">
                {g.swatches.map((s) => (
                  <div
                    key={s.token}
                    className="relative flex min-w-0 flex-1 flex-col justify-end rounded-xl p-3 ring-1 ring-black/10 shadow-[-4px_0_12px_rgba(0,0,0,0.14)]"
                    style={{ backgroundColor: s.hex }}
                  >
                    <span
                      className="truncate text-[11px] font-bold leading-tight"
                      style={{ color: inkOn(s.hex) }}
                    >
                      {s.name}
                    </span>
                    <span
                      className="truncate font-mono text-[9px] leading-tight"
                      style={{ color: inkOn(s.hex), opacity: 0.82 }}
                    >
                      {s.hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  )
}

// The Typography panel. Two complaints drove this shape: you could not tell
// which typeface the system uses, and nothing told you where to look first.
// So it reads in a fixed order — 01 the typeface, at a size you cannot miss;
// 02 the scale, every step rendered at its real size with the full spec beside
// it (size, line-height, weight, tracking, what it is for), because those are
// exactly the properties a UI type system has to pin down. Data comes from
// tab.typography, so the numbers on screen ARE the numbers in the system.
// The face the app actually ships (loaded in index.html). The specimen is set
// in it so the panel demonstrates the typeface instead of describing it.
const FACE = '"IBM Plex Sans Thai Looped", system-ui, sans-serif'

function SpecCell({ value, dim, lgOnly }) {
  return (
    <span
      className={`w-14 shrink-0 text-right font-mono text-[11px] tabular-nums ${
        lgOnly ? 'hidden lg:block' : ''
      } ${dim ? 'text-[#9c988e]' : 'text-[#21221f]'}`}
    >
      {value}
    </span>
  )
}

// One specimen word held constant down the whole scale, so the eye reads size
// changing and nothing else — a per-row phrase made every step look different.
const SCALE_SAMPLE = 'สุขภาพดี'

function TypeSpecimen({ top, data }) {
  const [active, setActive] = useState(null)
  if (!data) return <FeedBars top={top} />
  // The card wears the project's own colour, and its ink is CHOSEN off that
  // fill rather than written down — the previous fixed pair (lime card, olive
  // ink) went unreadable the moment the palette changed.
  const tone = data.tone ?? '#21221f'
  // The column is the white card you opened, so the type on it is ink.
  const ink = '#21221f'
  // This panel documents the scale, so it is also BOUND by it: every piece of
  // text here resolves its size/weight/line-height/tracking from the very same
  // tokens shown in the table. Nothing on the page is a one-off value.
  // `hero` only widens the responsive range; the weight, line-height and
  // tracking always come from the token, so the left block is as bound by the
  // scale as the rows are.
  const styleFor = (role, hero = false) => {
    const t = data.scale.find((x) => x.role === role)
    if (!t) return {}
    const grow = hero ? 0.09 : 0.05
    const cap = hero ? 1.9 : 1.35
    return {
      fontSize: `clamp(${t.px}px, ${(t.px * grow).toFixed(2)}vw, ${Math.round(t.px * cap)}px)`,
      fontWeight: t.weight,
      // Line-height and tracking are optional: a scale that does not publish
      // them falls back to the browser default rather than to a made-up number.
      lineHeight: t.lh ?? undefined,
      letterSpacing: t.tracking ?? undefined,
    }
  }
  // Tracking is 0 across the whole scale, so a column for it would carry no
  // information — the ones that vary get the space instead. `Ratio` is the step
  // multiplier: a type scale is a set of RELATIONSHIPS, and this is the column
  // that shows where the scale jumps (1.27× into Title 2) and where it barely
  // moves (Headline and Body share 17 and separate on weight alone).
  const cols = [
    { key: 'px', head: 'Size', fmt: (r) => `${r.px}` },
    {
      key: 'ratio',
      head: 'Ratio',
      lgOnly: true,
      fmt: (r, i) => (i === 0 ? '—' : (data.scale[i - 1].px / r.px).toFixed(2) + '×'),
    },
    { key: 'lh', head: 'Line', fmt: (r) => (r.lh == null ? '—' : `${r.lh}`) },
    { key: 'weight', head: 'Weight', fmt: (r) => `${r.weight}` },
  ]
  return (
    <div
      // `isolate` keeps the two panels' stacking local to this row.
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
      onMouseLeave={() => setActive(null)}
    >
      <div className="no-scrollbar relative z-[1] grid min-w-0 flex-1 [align-content:safe_center] overflow-y-auto bg-white px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <PageHead
          title={data.latin}
          fields={[
            data.metrics && {
              label: 'Metrics',
              value: `x-height ${data.metrics.xHeight} em · cap ${data.metrics.capHeight} em`,
            },
            data.weights && {
              label: 'Weights',
              value: data.weights.map((w) => `${w.name} ${w.value}`).join(' / '),
            },
            { label: 'Steps', value: `${data.scale?.length ?? 0} sizes` },
          ]}
        >
          {/* Set IN the face, not merely naming it — the letterforms answer
              "what font is this" before the name does. */}
          <div
            className="mt-6 select-none leading-none"
            style={{ fontFamily: FACE, fontSize: 'clamp(56px,9vw,132px)', color: ink }}
          >
            Aa
          </div>
        </PageHead>

        <div className="mx-auto mt-16 w-full max-w-[1080px]">
        <div className="mb-1 flex items-center gap-3 border-b border-[#ececec] pb-2">
          <span className="flex-1" />
          <span className="hidden w-20 shrink-0 text-right font-mono text-[10px] uppercase tracking-wider text-[#c4beb3] lg:block">
            Usage
          </span>
          {cols.map((c) => (
            <span
              key={c.key}
              className={`w-14 shrink-0 text-right font-mono text-[10px] uppercase tracking-wider text-[#c4beb3] ${
                c.lgOnly ? 'hidden lg:block' : ''
              }`}
            >
              {c.head}
            </span>
          ))}
        </div>

        {/* The eleven steps scroll inside their own band rather than clipping,
            so a short viewport loses none of the scale. */}
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
        {data.scale.map((r, i) => {
          const on = i === active
          return (
            <div
              key={r.token}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-3 border-b border-[#f2f2f2] py-2 transition-colors duration-200 last:border-b-0 ${
                on ? 'bg-[#fafafa]' : ''
              }`}
            >
              {/* Token sits on the sample's baseline rather than on its own
                  line — eleven steps do not fit otherwise. */}
              <span className="flex min-w-0 flex-1 items-baseline gap-3">
                {/* `truncate` clips vertically as well as horizontally, and the
                    token line-heights are tight enough to cut Thai tone marks
                    off the top. The em padding gives the glyphs room inside the
                    clip box without touching the specced line-height. */}
                <span
                  className="truncate py-[0.22em] text-[#21221f]"
                  style={{ ...styleFor(r.role), fontFamily: FACE }}
                >
                  {SCALE_SAMPLE}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-[#9c988e]">{r.token}</span>
              </span>
              <span className="hidden w-20 shrink-0 text-right text-[11px] text-[#4e4e4e] lg:block">{r.usage}</span>
              {cols.map((c) => (
                <SpecCell key={c.key} value={c.fmt(r, i)} dim={!on} lgOnly={c.lgOnly} />
              ))}
            </div>
          )
        })}
        </div>
        </div>

      </div>
    </div>
  )
}

// A layout-inspector dimension chip: the small blue badge that pins a number to
// the edge it measures. Positioned by the caller, either with utility classes or
// with a raw `style` when the position comes from a live measurement.
function Dim({ className = '', style, tone = 'blue', children }) {
  return (
    <span
      className={`pointer-events-none absolute z-20 inline-flex h-4 items-center whitespace-nowrap rounded-[3px] px-2 font-mono text-[9px] font-medium leading-none text-white ${
        tone === 'blue'
          ? 'bg-[#3b82f6]'
          : tone === 'lime'
            ? 'bg-[#c9d14e] text-[#2b3208]'
            : 'bg-[#21221f]'
      } ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}

// The Grid & Layout panel — a plain spec sheet, the way a design system
// normally documents layout: base unit, spacing scale, margins, content width,
// radius, component heights, breakpoints. No annotated screenshots; each block
// states its numbers and draws them at true size where a drawing helps.
// Every value is read off the running app, except the breakpoint pair, which is
// the system's own published rule.
function SpecCard({ title, note, children }) {
  return (
    // Same card as the Component page: white, one hairline, no fill. The
    // diagrams inside are already the tinted thing on the page.
    <div className="rounded-[20px] border border-[#e7e4dd] bg-white p-5">
      <h3 className="text-[15px] font-medium leading-tight text-[#21221f]">{title}</h3>
      {note && <p className="mt-2 text-[13px] font-normal leading-[1.6] text-[#757674]">{note}</p>}
      <div className="mt-5">{children}</div>
    </div>
  )
}

// The low-fi panel. Every screen is drawn from `data.screens` at the system's own
// geometry — a 390 frame with a 16 margin — and every block height is a value on
// the 8px ladder, so these are the built screens' proportions rather than boxes
// arranged by eye. One grey, one radius, no type: a wireframe that starts styling
// itself has stopped being a wireframe.
const WIRE = '#e4e1da'
const WIRE_SOFT = '#efece6'

// The grey triangle Figma's own wireframe kit stands in for any icon.
function IconPh({ size = 8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden className="shrink-0">
      <path d="M1 0l6 4-6 4z" fill="#b9b9b7" />
    </svg>
  )
}

export function WireBlock({ kind, h, w, ...rest }) {
  // Placeholder grey (pictures, discs, buttons) — darker than the soft card wash.
  const ph = { backgroundColor: '#ececec' }
  const box = 'rounded-[6px]'
  const fill = { backgroundColor: WIRE }
  const soft = { backgroundColor: WIRE_SOFT }
  if (kind === 'row2') {
    return (
      <div className="flex gap-2" style={{ height: h }}>
        <div className={`flex-1 ${box}`} style={fill} />
        <div className={`flex-1 ${box}`} style={fill} />
      </div>
    )
  }
  if (kind === 'tiles') {
    return (
      <div className="grid grid-cols-2 gap-2" style={{ height: h }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={box} style={soft} />
        ))}
      </div>
    )
  }
  if (kind === 'list') {
    return (
      <div className="flex flex-col gap-2" style={{ height: h }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 rounded-[6px]" style={soft} />
        ))}
      </div>
    )
  }
  if (kind === 'chips') {
    return (
      <div className="flex items-center gap-2" style={{ height: h, marginTop: rest.mt }}>
        {['28%', '22%', '18%'].map((cw) => (
          <div key={cw} className="h-full rounded-full" style={{ ...soft, width: cw }} />
        ))}
      </div>
    )
  }
  if (kind === 'avatar') {
    return (
      <div className="flex items-center justify-center" style={{ height: h }}>
        <div className="rounded-full" style={{ ...fill, width: h, height: h }} />
      </div>
    )
  }
  if (kind === 'chart') {
    return (
      <div className="flex items-end gap-1.5 rounded-[6px] p-3" style={{ height: h, marginTop: rest.mt, ...soft }}>
        {[0.45, 0.7, 0.55, 0.9, 0.65, 0.8, 0.5].map((f, i) => (
          <div key={i} className="flex-1 rounded-[3px]" style={{ ...fill, height: `${f * 100}%` }} />
        ))}
      </div>
    )
  }
  if (kind === 'button') {
    return <div className="rounded-full" style={{ ...fill, height: h }} />
  }
  // --- kinds drawn from the BUILT screens, in the mid-fi voice of the
  // reference frame (EHP VetCare · Detail Doctor Review, Figma 399:464, pulled
  // over the Dev-Mode MCP): grey blocks for pictures, a grey triangle for any
  // icon, REAL text for labels — and nothing but greys; the reference's one
  // accent (its active tab) is turned to ink here as asked. ---
  if (kind === 'heading') {
    return (
      <div className="flex items-end" style={{ height: h, marginTop: rest.mt }}>
        <span className="text-[14px] font-bold text-[#21221f]">{rest.label}</span>
      </div>
    )
  }
  if (kind === 'duo') {
    return (
      <div className="grid grid-cols-2 gap-3" style={{ height: h, marginTop: rest.mt }}>
        {(rest.items ?? []).map((t) => (
          <div key={t.title} className="flex flex-col justify-between rounded-[14px] border border-[#e7e4dd] bg-white p-3">
            <span className="text-[10px] font-semibold text-[#21221f]">{t.title}</span>
            {t.sub && <span className="text-[9px] text-[#8a8a88]">{t.sub}</span>}
            <span className="text-[14px] font-extrabold text-[#21221f]">{t.big}</span>
            {t.foot && <span className="text-[9px] text-[#8a8a88]">{t.foot}</span>}
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'nav') {
    // the lock-up as built: icon disc over the wordmark, bell top-right
    return (
      <div className="flex items-center justify-between" style={{ height: h, marginTop: rest.mt }}>
        <div className="flex flex-col items-start gap-1">
          <div className="grid size-9 place-items-center rounded-full" style={ph}><IconPh /></div>
          <span className="text-[15px] font-extrabold text-[#21221f]">pawmely</span>
        </div>
        <div className="grid size-9 place-items-center rounded-full" style={soft}><IconPh /></div>
      </div>
    )
  }
  if (kind === 'hero') {
    // unboxed: on the built screen this sits straight on the page — the card the
    // earlier wireframe drew around it does not exist there
    return (
      <div className="flex gap-3" style={{ height: h, marginTop: rest.mt }}>
        <div className="flex min-w-0 flex-1 flex-col items-start justify-between">
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] text-[#21221f]" style={soft}>
            <IconPh /> {rest.date}
          </span>
          <span className="max-w-[185px] text-[18px] font-bold leading-[23px] text-[#21221f]">{rest.title}</span>
          <span className="text-[13px] text-[#8a8a88]">{rest.sub}</span>
          {/* CTA row: the carousel dots sit ON this row in the built screen,
              to the right of the button, not in a band of their own */}
          <span className="flex w-full items-center">
            <span className="flex items-center gap-1.5 rounded-full bg-[#21221f] px-4 py-2 text-[13px] font-medium text-white">
              {rest.button}
            </span>
            <span className="mx-auto flex items-center gap-1.5 pl-6">
              <span className="size-1.5 rounded-full" style={ph} />
              <span className="h-1.5 w-4 rounded-full bg-[#21221f]" />
              <span className="size-1.5 rounded-full" style={ph} />
            </span>
          </span>
        </div>
        <div className="my-auto grid aspect-square w-[34%] shrink-0 place-items-center rounded-full" style={ph}>
          <IconPh size={14} />
        </div>
      </div>
    )
  }
  if (kind === 'dots') {
    // the hero carousel's indicator: small · wide · small
    return (
      <div className="flex items-center justify-center gap-1.5" style={{ height: h, marginTop: rest.mt }}>
        <span className="size-1.5 rounded-full" style={ph} />
        <span className="h-1.5 w-4 rounded-full bg-[#21221f]" />
        <span className="size-1.5 rounded-full" style={ph} />
      </div>
    )
  }
  if (kind === 'people') {
    return (
      <div className="grid grid-cols-4 items-center gap-3 rounded-[14px] border border-[#e7e4dd] bg-white px-4 py-3" style={{ height: h, marginTop: rest.mt }}>
        {(rest.items ?? []).map((name) => (
          <div key={name} className="flex h-full flex-col items-center justify-center gap-1">
            <div className="aspect-square w-[64%] rounded-full" style={ph} />
            <span className="text-[12px] text-[#21221f]">{name}</span>
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'entry') {
    return (
      <div className="relative flex items-center gap-3 rounded-[14px] border border-[#e7e4dd] bg-white p-4" style={{ height: h, marginTop: rest.mt }}>
        <div className="aspect-square h-[52%] shrink-0 rounded-full" style={ph} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[16px] font-bold text-[#21221f]">{rest.title}</span>
          {(rest.lines ?? []).map((l) => (
            <span key={l} className="flex items-center gap-1.5 text-[12px] text-[#8a8a88]"><IconPh /> {l}</span>
          ))}
        </div>
        {rest.badge && (
          <span className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] text-[#21221f]" style={ph}>
            {rest.badge}
          </span>
        )}
      </div>
    )
  }
  if (kind === 'photo') {
    return (
      <div className="flex flex-col justify-end gap-0.5 rounded-[14px] p-4" style={{ height: h, marginTop: rest.mt, ...ph }}>
        <span className="text-[19px] font-extrabold text-[#21221f]">{rest.name}</span>
        <span className="text-[12px] text-[#5c5c5a]">{rest.sub}</span>
      </div>
    )
  }
  if (kind === 'segs') {
    const active = rest.active ?? 0
    return (
      <div className="flex items-center gap-2" style={{ height: h, marginTop: rest.mt }}>
        {(rest.items ?? []).map((t, i) => (
          <span
            key={t}
            className={`grid h-full flex-1 place-items-center whitespace-nowrap rounded-full px-1 text-[11px] ${
              i === active ? 'bg-[#21221f] font-semibold text-white' : 'text-[#21221f]'
            }`}
            style={i === active ? undefined : soft}
          >
            {t}
          </span>
        ))}
      </div>
    )
  }
  if (kind === 'fields') {
    return (
      <div className="flex flex-col justify-between rounded-[14px] border border-[#e7e4dd] bg-white p-4" style={{ height: h, marginTop: rest.mt }}>
        {(rest.rows ?? []).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-[12px] text-[#8a8a88]">{k}</span>
            <span className="text-[12px] font-semibold text-[#21221f]">{v}</span>
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'actionrow') {
    return (
      <div className="flex items-center justify-between gap-3" style={{ height: h, marginTop: rest.mt }}>
        <span className="min-w-0 truncate text-[13px] font-bold text-[#21221f]">{rest.label}</span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-medium text-[#21221f]" style={ph}>
          <IconPh /> {rest.button}
        </span>
      </div>
    )
  }
  if (kind === 'chart4') {
    return (
      <div className="flex flex-col gap-1 rounded-[14px] border border-[#e7e4dd] bg-white p-4" style={{ height: h, marginTop: rest.mt }}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#8a8a88]">{rest.title}</span>
          <span className="text-[12px] text-[#8a8a88]">{rest.range}</span>
        </div>
        <span className="text-[19px] font-extrabold text-[#21221f]">{rest.big}</span>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#8a8a88]">{rest.date}</span>
          <span className="text-[11px] font-semibold text-[#21221f]">{rest.delta}</span>
        </div>
        <div className="flex flex-1 items-end gap-3 pt-1">
          {(rest.bars ?? []).map((b, i, arr) => (
            <div key={b.x} className="flex h-full flex-1 flex-col justify-end gap-0.5">
              <span className="text-center text-[11px] font-semibold text-[#21221f]">{b.v}</span>
              <div
                className="w-full rounded-[4px]"
                style={{ height: `${b.f * 62}%`, backgroundColor: i === arr.length - 1 ? '#21221f' : '#ececec' }}
              />
              <span className="text-center text-[10px] text-[#8a8a88]">{b.x}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (kind === 'search') {
    return (
      <div className="flex items-center gap-2" style={{ height: h, marginTop: rest.mt }}>
        <span className="flex h-full flex-1 items-center gap-2 rounded-full px-4 text-[13px] text-[#8a8a88]" style={soft}>
          <IconPh /> {rest.placeholder}
        </span>
        <div className="grid aspect-square h-full place-items-center rounded-full" style={soft}><IconPh /></div>
        <div className="grid aspect-square h-full place-items-center rounded-full" style={soft}><IconPh /></div>
      </div>
    )
  }
  if (kind === 'shoptitle') {
    return (
      <div className="flex items-start justify-between gap-3" style={{ height: h, marginTop: rest.mt }}>
        <div className="flex h-full min-w-0 flex-1 flex-col justify-center gap-0.5">
          <span className="text-[22px] font-extrabold leading-none text-[#21221f]">{rest.title}</span>
          {(rest.subs ?? []).map((l) => (
            <span key={l} className="text-[12px] leading-tight text-[#8a8a88]">{l}</span>
          ))}
        </div>
        <div className="grid aspect-square h-[80%] shrink-0 place-items-center rounded-[12px]" style={ph}>
          <IconPh size={14} />
        </div>
      </div>
    )
  }
  if (kind === 'products') {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-3" style={{ height: h, marginTop: rest.mt }}>
        {(rest.items ?? []).map((it) => (
          <div key={it.name} className="flex flex-col gap-1 rounded-[12px] border border-[#e7e4dd] bg-white p-2">
            <div className="grid w-full flex-1 place-items-center rounded-[8px]" style={ph}>
              <IconPh size={14} />
            </div>
            <span className="truncate text-[11px] font-semibold text-[#21221f]">{it.name}</span>
            {it.price && <span className="text-[12px] font-bold text-[#21221f]">{it.price}</span>}
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'tabbarfab') {
    const active = rest.active ?? 0
    return (
      <div className="relative mt-auto flex items-center justify-between rounded-[14px] px-4" style={{ height: h, marginTop: rest.mt, ...soft }}>
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center gap-1 text-[11px] text-[#21221f]">
            <IconPh />
            {i === active && rest.label ? <span className="font-semibold">{rest.label}</span> : null}
          </span>
        ))}
        <div className="absolute left-1/2 top-0 grid aspect-square h-[115%] -translate-x-1/2 -translate-y-[35%] place-items-center rounded-full border-4 border-white" style={ph}>
          <IconPh />
        </div>
        {[2, 3].map((i) => (
          <span key={i} className="flex items-center gap-1 text-[11px] text-[#21221f]">
            <IconPh />
            {i === active && rest.label ? <span className="font-semibold">{rest.label}</span> : null}
          </span>
        ))}
      </div>
    )
  }
  if (kind === 'tabbar') {
    return (
      <div className="mt-auto flex items-center justify-between rounded-[6px] px-4" style={{ height: h, marginTop: rest.mt, ...soft }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="size-5 rounded-full" style={fill} />
        ))}
      </div>
    )
  }
  return <div className={box} style={{ ...(kind === 'text' ? fill : soft), height: h, width: w ?? '100%' }} />
}

// One wireframe screen, authored at the real 390 × 844 and scaled as a single
// sheet to whatever box it is shown in — the specimen grid cell or the topic
// card's 3D device. Scaling the sheet is what keeps every position identical to
// the authored one: blocks laid out at cell size were silently COMPRESSED by
// flex the moment their fixed heights overflowed the box, and every band crept
// up. `shrink-0` on the children makes any future overflow visible instead.
export function WireSheet({ sc }) {
  const boxRef = useRef(null)
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      if (w > 0) setScale(w / 390)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={boxRef} className="h-full w-full overflow-hidden bg-white">
      {scale > 0 && sc && (
        <div
          className="flex flex-col gap-2 bg-white p-4 pb-[6px] [&>*]:shrink-0"
          style={{ width: 390, height: 844, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {sc.blocks.map((bk, i) => (
            <WireBlock key={i} {...bk} />
          ))}
        </div>
      )}
    </div>
  )
}

function WireSpecimen({ top, data }) {
  if (!data) return <FeedBars top={top} />
  const { screen = 390, margin = 16 } = data.container ?? {}
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
    >
      <div className="no-scrollbar relative grid min-w-0 flex-1 [align-content:safe_center] overflow-y-auto bg-white px-5 pb-24 pt-28 md:px-8 md:pt-28">
        <PageHead
          title="Low-fi"
          lead={data.note}
          fields={[
            { label: 'Screens', value: `${data.screens.length} ตัวอย่าง` },
            { label: 'Frame', value: `${screen} · margin ${margin}` },
            { label: 'Base', value: '8px' },
          ]}
        />

        <div className="mx-auto mt-16 w-full max-w-[1080px]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {data.screens.map((sc) => (
              <div key={sc.name}>
                {/* The frame is the phone at its real ratio, and the blocks inside
                    sit on the same 16px margin the built screens keep. */}
                <div
                  className="mx-auto w-full overflow-hidden rounded-[18px] border border-[#e7e4dd] bg-white"
                  style={{ aspectRatio: `${screen} / 844` }}
                >
                  <WireSheet sc={sc} />
                </div>
                <div className="mt-3 text-[13px] font-medium leading-tight text-[#21221f]">
                  {sc.name}
                </div>
                {sc.note && (
                  <div className="mt-1 text-[11px] font-normal leading-4 text-[#999998]">
                    {sc.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// The Hi-fi page. Deliberately the SAME page as Low-fi — same head, same frame at
// the same ratio, same caption under it — with the wireframe blocks swapped for the
// screen that was built from them. Set differently, the pair would stop reading as
// two stages of one screen.
function ShotSpecimen({ top, data, promo }) {
  if (!data) return <FeedBars top={top} />
  const { screen = 390, height = 844 } = data.container ?? {}
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
    >
      <div className="no-scrollbar relative grid min-w-0 flex-1 [align-content:safe_center] overflow-y-auto bg-white px-5 pb-24 pt-28 md:px-8 md:pt-28">
        <PageHead
          title="Hi-fi"
          lead={data.note}
          fields={[
            { label: 'Screens', value: `${data.screens.length} ตัวอย่าง` },
            { label: 'Frame', value: `${screen} × ${height}` },
            { label: 'Source', value: 'จับจากตัวจริง' },
          ]}
        />

        <div className="mx-auto mt-16 w-full max-w-[1080px]">
          {/* The Low-fi grid, unchanged: two up on a phone, four across from lg,
              same gaps, same column. The two pages have to line up screen for
              screen, so they are laid out by the same rule. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {data.screens.map((sc) => (
              <div key={sc.name}>
                <div
                  className="mx-auto w-full overflow-hidden rounded-[18px] border border-[#e7e4dd] bg-white"
                  style={{ aspectRatio: `${screen} / ${height}` }}
                >
                  {/* Anchored to the TOP, not centred: these are screens, and the
                      part of a screen that has to be visible is the part that is
                      above the fold. */}
                  <img
                    src={sc.src}
                    alt={sc.name}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="mt-3 text-[13px] font-medium leading-tight text-[#21221f]">
                  {sc.name}
                </div>
                {sc.note && (
                  <div className="mt-1 text-[11px] font-normal leading-4 text-[#999998]">
                    {sc.note}
                  </div>
                )}
                {sc.source && (
                  <div className="mt-1 text-[11px] font-normal leading-4 text-[#b9b5ab]">
                    {sc.source}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* The build itself, live from the moment the page is reached — no
              cover, no play button, no text block. The captures above are
              stills of it; this one scrolls and taps like the phone in your
              hand, in the same device the home screen parks. */}
          {promo?.proto &&
            (promo.device === 'mac' ? (
              // A web build plays on the laptop, at the desktop viewport it was
              // laid out for — the same device and the same viewport the home
              // screen parks it in.
              <div className="mt-20">
                <MacFrame className="mx-auto w-full max-w-[700px]">
                  <PrototypeFrame
                    src={promo.proto}
                    frameW={promo.viewport?.w ?? 1440}
                    frameH={promo.viewport?.h ?? 900}
                  />
                </MacFrame>
              </div>
            ) : (
              <div className="mt-20">
                <div className="mx-auto w-full max-w-[340px]">
                  <PhoneFrames
                    items={[{ key: 'live' }]}
                    renderScreen={() => (
                      <PrototypeFrame src={promo.proto} frameW={screen} frameH={height} />
                    )}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// The app at its own authored size, scaled to whatever width the frame gives
// it — the same trick the home viewer uses: the iframe keeps its 390×844
// layout and only the TRANSFORM changes, so the app never re-runs its layout.
function PrototypeFrame({ src, frameW, frameH }) {
  const boxRef = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / frameW))
    ro.observe(el)
    return () => ro.disconnect()
  }, [frameW])
  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden">
      <iframe
        src={src}
        title="UI Prototype"
        className="block border-0"
        style={{ width: frameW, height: frameH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      />
    </div>
  )
}

function GridSpecimen({ top, data }) {
  if (!data) return <FeedBars top={top} />
  const tone = data.tone ?? '#21221f'
  const c = data.container
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
    >
      <div className="no-scrollbar relative grid min-w-0 flex-1 [align-content:safe_center] overflow-y-auto bg-white px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <PageHead
          title={`${data.base}px base`}
          fields={[
            { label: 'Container', value: `${c.content} / ${c.screen}` },
            { label: 'Margins', value: data.margins.map((m) => m.value).join(' / ') },
            { label: 'Spec', value: 'spacing · margin · radius · breakpoint' },
          ]}
        />

        <div className="mx-auto mt-16 w-full max-w-[1080px]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Spacing — drawn at true width, so the ladder is legible before a
                digit is read, with the token name each step answers to. */}
            <SpecCard
              title="Spacing scale"
              note={`ฐาน ${data.base}px · ${data.spacing.length} ขั้น ครอบคลุมทุกช่องไฟในแอป`}
            >
              <div className="space-y-2">
                {data.spacing.map((s) => (
                  <div key={s.token} className="flex items-center gap-3">
                    <span
                      className="h-4 shrink-0 rounded-[3px]"
                      style={{ width: s.value, backgroundColor: `${tone}33` }}
                    />
                    <span className="w-8 shrink-0 font-mono text-[11px] tabular-nums text-[#21221f]">
                      {s.value}
                    </span>
                    <span className="font-mono text-[11px] text-[#9c988e]">{s.token}</span>
                  </div>
                ))}
              </div>
            </SpecCard>

            {/* Margins — the three values and what each is for. */}
            <SpecCard title="Screen margin" note="ขอบซ้าย–ขวาของหน้าจอ เลือกตามน้ำหนักเนื้อหา">
              <div className="space-y-3">
                {data.margins.map((m) => (
                  <div key={m.value} className="flex items-center gap-3">
                    <span
                      className="grid h-8 w-12 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-medium"
                      style={{ backgroundColor: `${tone}14`, color: tone }}
                    >
                      {m.value}
                    </span>
                    <span className="text-[12px] leading-5 text-[#757674]">{m.use}</span>
                  </div>
                ))}
              </div>
            </SpecCard>

            {/* Content width — one bar showing margin, column, margin. */}
            <SpecCard
              title="Content width"
              note={`จอ ${c.screen} · คอลัมน์เนื้อหา ${c.content} เมื่อขอบเป็น ${c.margin}`}
            >
              <div className="flex h-12 w-full overflow-hidden rounded-lg ring-1 ring-[#e2ded4]">
                <span style={{ flex: c.margin, backgroundColor: `${tone}59` }} />
                <span
                  className="grid place-items-center font-mono text-[11px] font-semibold"
                  style={{ flex: c.content, backgroundColor: `${tone}14`, color: tone }}
                >
                  {c.content}
                </span>
                <span style={{ flex: c.margin, backgroundColor: `${tone}59` }} />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-[#9c988e]">
                <span>{c.margin}</span>
                <span>{c.margin}</span>
              </div>
            </SpecCard>

            {/* Radius — each value drawn as the corner it describes. */}
            <SpecCard title="Corner radius" note="พื้นผิวทั้งแอปโค้งได้สามค่านี้เท่านั้น">
              <div className="flex items-end gap-5">
                {data.radius.map((r) => (
                  <div key={r.name} className="flex flex-col items-center gap-1">
                    <span
                      className="size-12 border-b-0 border-l-0 border-r-2 border-t-2"
                      style={{ borderTopRightRadius: Math.min(r.value, 24), borderColor: `${tone}80` }}
                    />
                    <span className="font-mono text-[11px] tabular-nums text-[#21221f]">
                      {r.value === 999 ? 'pill' : r.value}
                    </span>
                    <span className="text-[10px] text-[#8a857a]">{r.name}</span>
                  </div>
                ))}
              </div>
            </SpecCard>

            {/* Component heights — the sizes every screen reuses. */}
            {data.sizes?.length > 0 && (
            <SpecCard title="Component height" note="ความสูงมาตรฐานที่ทุกหน้าหยิบไปใช้ซ้ำ">
              <div className="space-y-2">
                {data.sizes.map((z) => (
                  <div key={z.name} className="flex items-center gap-3">
                    <span
                      className="shrink-0 rounded-md"
                      style={{ width: 56, height: z.value / 2, backgroundColor: `${tone}33` }}
                    />
                    <span className="w-8 shrink-0 font-mono text-[11px] tabular-nums text-[#21221f]">
                      {z.value}
                    </span>
                    <span className="text-[12px] text-[#757674]">{z.name}</span>
                  </div>
                ))}
              </div>
            </SpecCard>
            )}

            {/* Breakpoints — one line each, no drawing needed. */}
            {data.layouts?.length > 0 && (
            <SpecCard title="Breakpoint" note={`จุดตัดเดียวที่ ${data.breakpoint}pt`}>
              <div className="space-y-3">
                {data.layouts.map((l) => (
                  <div key={l.name}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-medium text-[#21221f]">{l.name}</span>
                      <span className="font-mono text-[11px]" style={{ color: tone }}>
                        {l.range}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-[#757674]">{l.note}</p>
                  </div>
                ))}
              </div>
            </SpecCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// The feed spans the WHOLE project, not one section: `panels` is every topic
// across every tab, in order, and `startAt` says which one to land on. Entering
// from the Color card and scrolling back to the very first topic is the point —
// the sheet is one continuous reel, exactly like the home feed.
export default function FeedSheet({ title, panels, onClose, startAt }) {
  const startIndex = Math.max(
    0,
    panels.findIndex((p) => p.title.toLowerCase() === String(startAt ?? '').toLowerCase())
  )

  // This layer grows out of the press that opened it. Closing is the profile's
  // turn to grow, not this layer's turn to shrink — see `close` below.
  const { style: revealStyle, revealing } = useReveal('reel', { start: true })

  const close = useCallback(() => {
    requestReveal('detail')
    onClose?.()
  }, [onClose])
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const [pos, setPos] = useState(startIndex) // fractional scroll position (panel units)

  // Open already scrolled to the requested panel, then track the scroll.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = startIndex * el.clientHeight
    setPos(startIndex)
    const onScroll = () => setPos(el.scrollTop / (el.clientHeight || 1))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [startIndex])

  // Focused heading with hysteresis, so it flips cleanly mid-scroll.
  const [focus, setFocus] = useState(startIndex)
  useEffect(() => {
    setFocus((cur) => {
      if (pos > cur + 0.6) return Math.min(panels.length - 1, cur + 1)
      if (pos < cur - 0.6) return Math.max(0, cur - 1)
      return cur
    })
  }, [pos, panels.length])

  const scrollToPanel = (i) =>
    scrollRef.current?.scrollTo({ top: i * scrollRef.current.clientHeight, behavior: 'smooth' })

  // The panels run edge to edge now. There is no nav block above them to
  // measure around any more — the sheet's heading is printed inside each panel
  // — so the content simply starts at the top of the screen.
  const contentTop = 0

  // Titles only — each panel's content speaks for itself, so the menu stays a
  // pure index rather than repeating a description under the active heading.

  return (
    <>
    {/* Sibling, not child: inside the layer this sits behind the layer's own white
        background. z-[49] is under the reel (z-50) and over the profile. */}
    {revealing && (
      <div className="pointer-events-none fixed inset-0 z-[49] bg-[#e7e4dd]" aria-hidden />
    )}
    <motion.div
      // No enter/exit of its own: the growth is the clip below, and on the way out
      // the profile underneath grows instead of this shrinking away.
      initial={false}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      ref={rootRef}
      className="fixed inset-0 z-[50] bg-[#fafafa]"
      style={revealStyle}
    >
      {/* Scrollable feed: one snap panel per heading. */}
      <div ref={scrollRef} className="no-scrollbar h-dvh w-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {panels.map((p) => (
          <section key={p.title} className="relative h-dvh w-full snap-start overflow-hidden">
            {p.title.toLowerCase() === 'component' ? (
              <ComponentSpecimen top={contentTop} data={p.tab?.component} />
            ) : p.title.toLowerCase() === 'color' ? (
              <ColorSpecimen top={contentTop} data={p.tab?.color} />
            ) : p.title.toLowerCase() === 'typography' ? (
              <TypeSpecimen top={contentTop} data={p.tab?.typography} />
            ) : p.title.toLowerCase().startsWith('low') ? (
              <WireSpecimen top={contentTop} data={p.tab?.wireframe} />
            ) : p.title.toLowerCase().startsWith('hi-') ? (
              <ShotSpecimen top={contentTop} data={p.tab?.hifi} promo={p.promo} />
            ) : p.title.toLowerCase().startsWith('grid') ? (
              <GridSpecimen top={contentTop} data={p.tab?.grid} />
            ) : p.tab?.report ? (
              <ReportSpecimen top={contentTop} data={p.tab.report} title={p.title} />
            ) : (
              <FeedBars top={contentTop} />
            )}
          </section>
        ))}
      </div>

      {/* Overlay: back button + project title, then the sliding heading window
          and the active heading's description. No right-side actions. */}
      {/* Solid-to-transparent band so the panel content never shows through the
          nav text while scrolling. It spans the VIEWPORT, not the centred shell:
          inside the shell it stopped at 1600px and the content scrolled past
          uncovered on either side of it. */}

      {/* The way out lives INSIDE the coloured panel, above its title — the
          card is the page heading now, so the button belongs on it. Positioned
          against the sheet rather than the centred page-shell, because the
          panel starts at the sheet's own left edge; the shell's max-width would
          push the button off the card on wide screens. Every panel carries a
          matching `pt-24` so the title always clears it. */}
      {/* Measured to land on the SAME rect as the shared BackButton on the
          project profile — 32 / 37 at md (left-8, centred on the 72px heading).
          It sat at 36 / 60 from an older measurement, which made it the one
          control on the site that moved when the page did. */}
      <div className="pointer-events-none absolute left-4 top-5 z-20 md:left-8 md:top-[37px]">
        <button
          onClick={close}
          aria-label="back"
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-[#21221f] text-white transition hover:bg-[#3a3a35] active:scale-90 md:size-12"
        >
          <ArrowLeft className="size-5 md:size-6" />
        </button>
      </div>

      {/* How far through the reel you are, on the same rail the project stage
          uses — the two levels of the site answer the same question the same way.
          It replaced a list of page names: the names are printed at full size
          inside each panel already, so the corner only has to say how much is
          left. */}
      <StageProgress value={(pos + 1) / Math.max(panels.length, 1)} />

      {/* No nav menu here any more. Every panel already prints its own name at
          full size inside the card — "01 · LIBRARY / Component" — so a heading
          floating above it said the same thing twice, and the pale band it
          needed cost the panels the top of the screen. The panels now start at
          the very top and run the full height. */}
    </motion.div>
    </>
  )
}
