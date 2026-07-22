// -----------------------------------------------------------------------------
// FeedSheet.jsx
// A home-style vertical feed used for a section's detail (e.g. Design System).
// Each heading in the tab becomes one full-viewport panel you scroll through;
// a top-left nav (project title + a sliding 3-item window of headings) tracks
// the scroll exactly like the home page — but with NO right-side action column.
// The sheet is one continuous reel over EVERY topic in a project, opened
// focused on whichever one the tapped card names.
// -----------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import NavMenu from './NavMenu'

// The three (or fewer) heading indices to show around the focused one.
function windowAround(active, n) {
  if (n <= 3) return Array.from({ length: n }, (_, i) => i)
  if (active <= 0) return [0, 1, 2]
  if (active >= n - 1) return [n - 3, n - 2, n - 1]
  return [active - 1, active, active + 1]
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

// The Color panel. Same two questions the Typography panel answers, asked of
// colour: *which* colour is the brand (01, unmissable, the panel is painted in
// it), and *what do I look at first* (02, tokens grouped by role — brand,
// surface, text, border, semantic, category — in that order). Every swatch
// carries its token name, its measured usage count in the app, and its computed
// contrast against the background it actually sits on, because a palette page
// that only shows squares tells you nothing you could not get from a screenshot.
function ColorSpecimen({ top, data }) {
  const [hover, setHover] = useState(null)
  if (!data) return <FeedBars top={top} />

  const b = data.brand
  const sel = hover ?? { ...b, usage: b.harmony, on: '#FFFFFF' }
  const ratio = contrast(sel.hex, sel.on)
  const passBody = ratio >= 4.5
  const passLarge = ratio >= 3

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
      onMouseLeave={() => setHover(null)}
    >
      {/* 01 — the brand colour. The card IS the swatch: at this size you cannot
          leave the panel unsure which colour the product is. */}
      <div
        className="relative z-[2] hidden w-[30%] shrink-0 flex-col justify-between overflow-hidden rounded-tr-[28px] p-7 shadow-[5px_0_16px_rgba(0,0,0,0.07)] md:flex"
        style={{ backgroundColor: b.hex }}
      >
        <div className="relative z-10 text-white">
          <div className="font-mono text-[11px] tracking-[0.18em] text-white/70">01 · BRAND</div>
          <div className="mt-3 text-[clamp(30px,3vw,58px)] font-bold leading-[1.05] tracking-tight">
            {b.name}
          </div>
          <div className="mt-3 font-mono text-[clamp(15px,1.2vw,20px)] font-semibold text-white/90">
            {b.hex} · {b.token}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-[11px] font-medium text-white/90">
            {b.harmony}
          </div>
        </div>
        {/* The archetypal colour chip, blown up — the visual rhyme of the
            typography card's "Aa". */}
        <span className="pointer-events-none absolute -bottom-[14%] -right-[12%] size-[min(46vh,30vw)] rounded-full bg-white/10" />
      </div>

      {/* 02 — the tokens, grouped by the role they play. */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col bg-white px-5 pt-7 md:-ml-7 md:px-8 md:pl-14">
        {/* Readout: one line that always describes whatever you are pointing at,
            so the tiles stay clean and the detail never has to be crammed in. */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#ececec] pb-3">
          <span className="font-mono text-[11px] tracking-[0.18em] text-[#9c988e]">02 · TOKENS</span>
          <span className="size-4 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: sel.hex }} />
          <span className="font-mono text-[11px] font-semibold text-[#21221f]">{sel.hex}</span>
          <span className="font-mono text-[11px] text-[#9c988e]">{sel.token}</span>
          <span className="text-[11px] text-[#4e4e4e]">{sel.usage}</span>
          {/* Contrast, computed live against the surface this token really sits
              on — the part a swatch grid alone cannot tell you. */}
          <span className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[11px] tabular-nums text-[#21221f]">
              {ratio.toFixed(2)}:1
            </span>
            <span
              className={`rounded-full px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${
                passBody
                  ? 'bg-[#e8f3e4] text-[#3d7d19]'
                  : passLarge
                    ? 'bg-[#fdf3d9] text-[#8a6a11]'
                    : 'bg-[#fdeaea] text-[#b23636]'
              }`}
            >
              {passBody ? 'AA' : passLarge ? 'AA large' : 'fail'}
            </span>
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 pb-6">
          {data.groups.map((g) => (
            <div key={g.name} className="flex min-h-0 flex-1 items-stretch gap-3">
              <span className="w-[68px] shrink-0 self-center font-mono text-[10px] uppercase tracking-wider text-[#c4beb3]">
                {g.name}
              </span>
              <div className="flex min-w-0 flex-1 gap-2">
                {g.swatches.map((s) => {
                  const on = hover?.token === s.token
                  return (
                    <div
                      key={s.token}
                      onMouseEnter={() => setHover({ ...s, on: g.on })}
                      className="relative flex min-w-0 cursor-pointer flex-col justify-end overflow-hidden rounded-lg p-2 ring-1 ring-inset ring-black/10 transition-all duration-300 ease-out"
                      style={{
                        backgroundColor: s.hex,
                        // The open tile takes room from its neighbours rather
                        // than growing the row — the grid never reflows.
                        flex: `${on ? 1.9 : 1} 1 0`,
                        boxShadow: on ? '0 8px 22px rgba(0,0,0,0.18)' : 'none',
                      }}
                    >
                      <span
                        className="truncate text-[11px] font-semibold leading-tight"
                        style={{ color: inkOn(s.hex) }}
                      >
                        {s.name}
                      </span>
                      <span
                        className="truncate font-mono text-[9px] leading-tight transition-opacity duration-300"
                        style={{ color: inkOn(s.hex), opacity: on ? 0.95 : 0.65 }}
                      >
                        {s.hex}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
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

function TypeSpecimen({ top, data }) {
  const [active, setActive] = useState(null)
  if (!data) return <FeedBars top={top} />
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
      lineHeight: t.lh,
      letterSpacing: t.tracking,
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
    { key: 'lh', head: 'Line', fmt: (r) => `${r.lh}` },
    { key: 'weight', head: 'Weight', fmt: (r) => `${r.weight}` },
  ]
  return (
    <div
      // `isolate` keeps the two panels' stacking local to this row.
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
      onMouseLeave={() => setActive(null)}
    >
      {/* 01 — the typeface. Biggest thing on the panel, on purpose. */}
      <div
        // Front card of the pair: it overlaps the spec sheet and casts a light
        // edge onto it — just enough to read as stacked without greying the
        // first column of the table it falls across.
        className="relative z-[2] hidden w-[30%] shrink-0 flex-col justify-between overflow-hidden rounded-tr-[28px] bg-[#c9d14e] p-7 shadow-[5px_0_16px_rgba(0,0,0,0.07)] md:flex"
      >
        <div className="relative z-10">
          {/* Step label, not content — so it keeps its own small eyebrow size
              rather than being sized off the scale like the text below it. */}
          <div className="font-mono text-[11px] tracking-[0.18em] text-[#3f4a12]/70">
            01 · TYPEFACE
          </div>
          {/* Set IN the face, not merely naming it — "I still don't even know
              what font this uses" is answered by the letterforms themselves. */}
          <div className="mt-3 text-[#2c340c]" style={{ ...styleFor('Large Title', true), fontFamily: FACE }}>
            {data.latin}
          </div>
          <div className="mt-3 font-semibold text-[#3f4a12]" style={styleFor('Subheadline')}>
            {data.classification}
          </div>
          {/* The weights that actually ship — each label drawn at its own
              weight, so the row is the evidence and not a claim about it. */}
          {data.weights && (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {data.weights.map((w) => (
                <span
                  key={w.value}
                  className="text-[#2c340c]"
                  style={{ fontFamily: FACE, fontWeight: w.value, fontSize: 'clamp(12px,0.95vw,16px)' }}
                >
                  {w.name}
                  <span className="ml-1 font-mono text-[10px] font-normal text-[#3f4a12]/60">{w.value}</span>
                </span>
              ))}
            </div>
          )}
          {/* Vertical proportions measured off the real TTF. A 0.52 x-height is
              the reason the 11pt caption survives at all. */}
          {data.metrics && (
            <div className="mt-3 font-mono text-[10px] text-[#3f4a12]/70">
              x-height {data.metrics.xHeight} em · cap {data.metrics.capHeight} em
            </div>
          )}
        </div>
        {/* Sits ON the bottom-right corner rather than hanging off it: the
            negative offsets cancel the font's own descent space so the
            letterforms meet the card edges instead of being clipped. */}
        <span
          className="pointer-events-none absolute -bottom-[0.16em] -right-[0.06em] select-none font-bold leading-none text-white/70"
          style={{ fontSize: 'min(22vh, 15vw)', fontFamily: FACE }}
        >
          Aa
        </span>
      </div>

      {/* 02 — the scale, with the whole spec on the same line as the sample. */}
      <div
        // Behind card: square corners, same height as the front one — the
        // overlap is read from the horizontal tuck and the cast shadow.
        className="relative z-[1] flex min-w-0 flex-1 flex-col bg-white px-5 pt-7 md:-ml-7 md:px-8 md:pl-14"
      >
        <div className="mb-1 flex items-center gap-3 border-b border-[#ececec] pb-2">
          <span className="flex-1 font-mono text-[11px] tracking-[0.18em] text-[#9c988e]">02 · SCALE</span>
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
                  {r.sample}
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

// The Grid & Layout panel. Figma's layout guidance is principle-level —
// alignment, proximity, consistent spacing, whitespace — so the panel answers it
// with evidence: 01 states the system in one line, and 02 is the whole spec
// rendered as a layout INSPECTOR. Every object on the right is drawn at its true
// size on a guide-ruled canvas with dimension chips pinned to it, which is how a
// designer actually reads a grid — not as a table of round numbers.
function GridSpecimen({ top, data }) {
  const [hover, setHover] = useState(null)
  // The overlay is drawn in the screen's OWN coordinate space (390×844) and then
  // scaled to whatever room the slot has, so a mark written as "x: 32" always
  // lands on the 32pt gutter no matter how large the panel is rendered.
  const screenRef = useRef(null)
  // The left card carries one inspect annotation, and it is on the corner grid
  // glyph rather than the heading: annotating a heading forces the reader to
  // look past leader lines to read the words. The glyph is already a grid, so
  // measuring IT is both legible and on-topic.
  const infoRef = useRef(null)
  const barsRef = useRef(null)
  const [glyph, setGlyph] = useState(null)
  useLayoutEffect(() => {
    const measure = () => {
      const c = infoRef.current
      const bars = barsRef.current
      if (!c || !bars || bars.children.length < 2) return
      const cb = c.getBoundingClientRect()
      const a = bars.children[0].getBoundingClientRect()
      const b2 = bars.children[1].getBoundingClientRect()
      const next = {
        x: a.left - cb.left,
        y: a.top - cb.top,
        w: a.width,
        gap: b2.left - a.right,
        gapX: a.right - cb.left,
      }
      // Compare every field: an earlier version only checked x and w, so a `y`
      // sampled mid-entrance stuck around after the sheet had settled.
      setGlyph((cur) =>
        cur && Object.keys(next).every((key) => Math.abs(cur[key] - next[key]) < 0.5) ? cur : next
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (infoRef.current) ro.observe(infoRef.current)
    if (barsRef.current) ro.observe(barsRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [data])
  const [k, setK] = useState(0.35)
  useLayoutEffect(() => {
    const measure = () => {
      const el = screenRef.current
      if (!el) return
      const b = el.getBoundingClientRect()
      // Three captures share the slot, with a 12px gap between each.
      const cols = data.screens?.length || 1
      const cell = (b.width - 12 * (cols - 1)) / cols
      const avail = b.height - 6 // just enough for the label chip's overhang
      const next = Math.max(0.1, Math.min(cell / 390, avail / 844))
      setK((cur) => (Math.abs(cur - next) < 0.002 ? cur : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (screenRef.current) ro.observe(screenRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [data])
  if (!data) return <FeedBars top={top} />

  const f = data.frame
  const pct = Math.round((data.compliance.onGrid / data.compliance.total) * 100)
  const maxSpace = Math.max(...data.spacing.map((s) => s.value))

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 isolate flex w-full items-stretch"
      style={{ top }}
      onMouseLeave={() => setHover(null)}
    >
      {/* 01 — the same shape as the Color and Typography cards: one statement of
          what the system IS, at a size you cannot miss, and nothing else. */}
      <div
        ref={infoRef}
        className="relative z-[2] hidden w-[30%] shrink-0 flex-col justify-between overflow-hidden rounded-tr-[28px] bg-[#2f3fc4] p-7 shadow-[5px_0_16px_rgba(0,0,0,0.07)] md:flex"
      >
        {/* Inspect overlay on the corner grid glyph — measured the same way as
            before, from the card's LEFT and TOP edges, but pointed at the glyph
            so no leader line crosses the heading and makes it hard to read. */}
        {glyph && (
          <div className="pointer-events-none absolute inset-0 z-20">
            {/* Distance from the top edge, dropped at the glyph's centre. */}
            <span
              className="absolute border-l border-dashed border-[#c9d14e]"
              style={{ left: glyph.x + glyph.w / 2, top: 0, height: glyph.y }}
            >
              <Dim tone="lime" style={{ left: 8, top: glyph.y / 2 - 8 }}>
                {Math.round(glyph.y)}
              </Dim>
            </span>
            {/* Distance from the left edge. */}
            <span
              className="absolute border-t border-dashed border-[#c9d14e]"
              style={{ left: 0, top: glyph.y + 40, width: glyph.x }}
            >
              <Dim tone="lime" style={{ left: glyph.x / 2 - 14, top: 8 }}>
                {Math.round(glyph.x)}
              </Dim>
            </span>
          </div>
        )}
        <div className="relative z-10">
          <div className="font-mono text-[11px] leading-4 tracking-[0.18em] text-white/55">01 · SYSTEM</div>
          <div className="mt-3 text-[clamp(30px,3vw,58px)] font-bold leading-[1.05] tracking-tight text-white">
            {data.base}px base
          </div>
          <div className="mt-3 font-mono text-[clamp(15px,1.2vw,20px)] font-semibold text-white/85">
            {f.columns} col · margin {f.margin} · gutter {f.gutter}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-[11px] font-medium text-white">
            {pct}% on-grid · {data.compliance.onGrid}/{data.compliance.total}
          </div>
        </div>
        {/* The corner glyph, in the same slot as the typography card's "Aa" and
            the colour card's chip: here, the grid itself. */}
        <div
          ref={barsRef}
          className="pointer-events-none absolute -bottom-[10%] -right-[7%] flex h-[min(32vh,21vw)] w-[min(26vh,17vw)] gap-[7%]"
        >
          {Array.from({ length: f.columns }).map((_, i) => (
            <div key={i} className="h-full flex-1 rounded-t-md bg-white/[0.13]" />
          ))}
        </div>
      </div>

      {/* 02 — the inspector. A guide-ruled canvas holding the real objects:
          the screen frame, every spacing step at true width, every radius as an
          actual corner. Chips print the numbers; the guides tie them to edges. */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col overflow-hidden bg-white px-5 pt-7 md:-ml-7 md:px-8 md:pl-14">
        <div className="relative z-10 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#ececec] pb-3">
          <span className="font-mono text-[11px] tracking-[0.18em] text-[#9c988e]">02 · INSPECT</span>
          {hover ? (
            <>
              <span className="font-mono text-[11px] font-semibold text-[#21221f]">{hover.label}</span>
              <span className="font-mono text-[11px] text-[#9c988e]">{hover.token}</span>
            </>
          ) : null}
        </div>

        <div className="relative min-h-0 flex-1 pb-6">
          <div className="relative flex h-full gap-5 lg:gap-6">
            {/* The real screens, inspected. Rather than redrawing the layout as
                an abstract diagram, these are captures of the shipped prototype
                at 390×844 with the overlay laid straight over them — every guide
                lands on an actual UI edge, and every number was read back off
                that exact capture by pixel analysis, so the annotation cannot
                drift from the thing it annotates.

                All three sit side by side rather than behind a tab: the point of
                showing more than one is the COMPARISON — Health runs a 20px
                gutter where Home and Profile run 16 — and a comparison you have
                to click through is not a comparison. */}
            <div ref={screenRef} className="relative hidden min-w-0 flex-1 flex-col lg:flex">
              <span className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#c4beb3]">
                Screens
              </span>
              <div className="flex min-h-0 flex-1 gap-3">
                {data.screens.map((sc) => (
                  <div key={sc.id} className="flex min-w-0 flex-1 flex-col items-center">
                    {/* Height is the scaled capture's own height, so the gutter
                        caption sits under the image instead of being pushed to
                        the bottom of a taller flex cell. */}
                    <div className="relative" style={{ width: 390 * k, height: 844 * k }}>
                      <div className="absolute inset-0">
                        {/* Right-hand side: the left corner already carries the
                            first box label. */}
                        <Dim className="-top-3 right-0">{sc.id}</Dim>
                        <img
                          src={`${import.meta.env.BASE_URL}${sc.src}`}
                          alt=""
                          draggable={false}
                          className="absolute inset-0 size-full rounded-[3px] object-cover ring-1 ring-[#d8d4ca]"
                        />

                        {/* Guides on the gutter the screen actually holds —
                            every card lands on the same two lines, which is the
                            alignment claim made visible instead of asserted. */}
                        {sc.marks.filter((m) => m.kind === 'v').map((m) => (
                          <span
                            key={`v${m.at}`}
                            className="absolute inset-y-0 border-l border-dashed border-[#3b82f6]/80"
                            style={{ left: m.at * k }}
                          />
                        ))}
                        {sc.marks.filter((m) => m.kind === 'box').map((m) => (
                          <span
                            key={`b${m.x}-${m.y}`}
                            className="absolute ring-1 ring-[#3b82f6]"
                            style={{ left: m.x * k, top: m.y * k, width: m.w * k, height: m.h * k }}
                          >
                            {m.label && <Dim style={{ left: 0, top: -13 }}>{m.label}</Dim>}
                          </span>
                        ))}
                        {/* Gaps: a spacing token doing its job between two real
                            components, measured inside the gap itself. */}
                        {sc.marks.filter((m) => m.kind === 'gapV').map((m) => (
                          <span
                            key={`gv${m.y}`}
                            className="absolute border-l-2 border-[#3b82f6]"
                            style={{ left: m.x * k, top: m.y * k, height: m.h * k }}
                          >
                            <Dim style={{ left: 4, top: -3 }}>{m.label}</Dim>
                          </span>
                        ))}
                        {sc.marks.filter((m) => m.kind === 'gapH').map((m) => (
                          <span
                            key={`gh${m.x}`}
                            className="absolute border-t-2 border-[#3b82f6]"
                            style={{ left: m.x * k, top: m.y * k, width: m.w * k }}
                          >
                            <Dim style={{ left: -6, top: 4 }}>{m.label}</Dim>
                          </span>
                        ))}
                        {/* Radius: the arc is drawn ON the corner it describes,
                            the only way a radius value means anything. */}
                        {sc.marks.filter((m) => m.kind === 'radius').map((m) => (
                          <span
                            key={`r${m.x}-${m.y}`}
                            className="absolute border-b-0 border-l-2 border-r-0 border-t-2 border-[#3b82f6]"
                            style={{
                              left: m.x * k,
                              top: m.y * k,
                              width: m.r * k * 1.6,
                              height: m.r * k * 1.6,
                              borderTopLeftRadius: m.r * k,
                            }}
                          >
                            <Dim style={{ left: m.r * k * 1.6 + 3, top: -2 }}>{m.label}</Dim>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacing and radius share one narrow column: the captures are the
                thing worth the width, and stacking these two lets them run the
                full height of the panel. */}
            <div className="flex w-[208px] shrink-0 flex-col gap-4 xl:w-[240px]">
            {/* Spacing — each step is a block of its TRUE width sitting on a
                shared left guide, with the chip riding its right edge. The scale
                is legible as a staircase before a single digit is read. */}
            <div className="no-scrollbar relative flex min-h-0 flex-1 flex-col overflow-y-auto">
              <span className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#c4beb3]">Spacing</span>
              <div className="relative flex min-h-0 flex-1 flex-col justify-between">
                {data.spacing.map((s) => {
                  const on = hover?.token === s.token
                  return (
                    <div
                      key={s.token}
                      onMouseEnter={() => setHover({ ...s, label: `${s.value}px` })}
                      className="group relative flex items-center gap-2"
                    >
                      {/* The measured object. */}
                      <span
                        className="relative h-4 shrink-0 transition-colors duration-200"
                        style={{ width: s.value, backgroundColor: on ? '#3b82f6' : '#c9d14e' }}
                      />
                      {/* Its right edge, extended — the guide that makes the
                          step comparable to the one above it. */}
                      <span
                        className="pointer-events-none absolute top-0 h-4 border-l border-dashed transition-colors duration-200"
                        style={{ left: s.value, borderColor: on ? '#3b82f6' : '#e2ded4' }}
                      />
                      <Dim
                        className="relative"
                        style={{ position: 'static' }}
                      >
                        {s.value}
                      </Dim>
                      <span className={`font-mono text-[10px] transition-colors ${on ? 'text-[#21221f]' : 'text-[#9c988e]'}`}>
                        {s.token}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Radius — drawn as an actual corner, because the number means
                nothing without one. */}
            <div className="hidden shrink-0 flex-col xl:flex">
              <span className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#c4beb3]">Radius</span>
              <div className="flex min-h-0 flex-1 flex-col justify-between">
                {data.radius.map((r) => {
                  const token = `radius/${r.name}`
                  const on = hover?.token === token
                  return (
                    <div
                      key={r.name}
                      onMouseEnter={() => setHover({ token, label: r.value === 999 ? 'pill' : `${r.value}px` })}
                      className="relative flex items-center gap-3"
                    >
                      <span
                        className="size-8 shrink-0 border-b-0 border-l-0 border-r-2 border-t-2 transition-colors duration-200"
                        style={{
                          borderTopRightRadius: Math.min(r.value, 28),
                          borderColor: on ? '#3b82f6' : '#c9d14e',
                        }}
                      />
                      <Dim style={{ position: 'static' }}>{r.value === 999 ? 'pill' : r.value}</Dim>
                      <span className={`min-w-0 flex-1 truncate font-mono text-[10px] ${on ? 'text-[#21221f]' : 'text-[#9c988e]'}`}>
                        {r.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            </div>
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

  // The nav block's height changes with its content, so the fade behind it and
  // the top of the content band are both derived from where it actually ends
  // rather than from a fixed vh guess.
  const NAV_GAP = 32
  const [contentTop, setContentTop] = useState(0)
  // The back button used to sit on a fixed rect because the page title was a
  // fixed <h1>. The title is now the menu's active row, which moves with the
  // window (there is no row above it at the first panel), so the button is
  // centred on wherever that row actually is.
  const [btnTop, setBtnTop] = useState(112)
  useLayoutEffect(() => {
    let raf = 0
    let stop = 0
    // Scoped to THIS sheet: the home feed's own nav is still mounted behind it,
    // and a bare document query grabs that one instead.
    const measure = () => {
      const el = rootRef.current?.querySelector('.nav-menu')
      if (!el) return
      const bottom = Math.round(el.getBoundingClientRect().bottom + NAV_GAP)
      setContentTop((cur) => (cur === bottom ? cur : bottom))
      const active = el.querySelector('h2')
      const rootBox = rootRef.current?.getBoundingClientRect()
      if (active && rootBox) {
        const b = active.getBoundingClientRect()
        const top = Math.round(b.top - rootBox.top + b.height / 2 - 24)
        setBtnTop((cur) => (Math.abs(cur - top) < 1 ? cur : top))
      }
    }
    // The menu animates its items in, so a single measurement lands while it is
    // still half-built and the band ends up too high — overlapping the nav.
    // Keep sampling for the length of that entrance, then rely on the observer.
    const settle = () => {
      measure()
      if (performance.now() < stop) raf = requestAnimationFrame(settle)
    }
    stop = performance.now() + 900
    settle()

    const el = rootRef.current?.querySelector('.nav-menu')
    const ro = el ? new ResizeObserver(measure) : null
    if (el && ro) ro.observe(el)
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [focus])

  // Titles only — each panel's content speaks for itself, so the menu stays a
  // pure index rather than repeating a description under the active heading.
  const navSections = panels.map((p) => ({ domId: p.title, title: p.title }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
      ref={rootRef}
      className="fixed inset-0 z-[50] bg-[#fafafa]"
    >
      {/* Scrollable feed: one snap panel per heading. */}
      <div ref={scrollRef} className="no-scrollbar h-dvh w-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {panels.map((p) => (
          <section key={p.title} className="relative h-dvh w-full snap-start overflow-hidden">
            {p.title.toLowerCase() === 'color' ? (
              <ColorSpecimen top={contentTop} data={p.tab?.color} />
            ) : p.title.toLowerCase() === 'typography' ? (
              <TypeSpecimen top={contentTop} data={p.tab?.typography} />
            ) : p.title.toLowerCase().startsWith('grid') ? (
              <GridSpecimen top={contentTop} data={p.tab?.grid} />
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
      <div
        // Sized to the nav, so the fade always ends right where the content
        // band starts — no fixed vh guess that drifts as the nav changes.
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: contentTop,
          // Softness from a longer ramp inside the same band, not from
          // extending it down over the content.
          background: 'linear-gradient(to bottom, #fafafa 0, #fafafa 42%, rgba(250,250,250,0.86) 62%, rgba(250,250,250,0.5) 80%, rgba(250,250,250,0) 100%)',
        }}
      />

      <div className="page-shell pointer-events-none absolute inset-0 z-10">
        {/* Just the back button. The page title is no longer the project name:
            the focused topic IS the title, and the menu below already renders it
            at full size — a separate <h1> would only repeat it. */}
        <div className="absolute inset-x-0 top-0 px-4 pt-6 md:pl-[120px] md:pr-12 md:pt-[100px]">
          <button
            onClick={onClose}
            aria-label="back"
            style={typeof window !== 'undefined' && window.innerWidth >= 768 ? { top: btnTop } : undefined}
            className="pointer-events-auto mb-3 grid size-10 place-items-center rounded-full bg-white shadow-sm transition hover:bg-neutral-100 active:scale-90 md:absolute md:left-[36px] md:mb-0 md:size-12"
          >
            <ArrowLeft className="size-5 text-[#33332f] md:size-6" />
          </button>
        </div>

      </div>

      {/* The SAME menu component the home feed uses — same sliding 3-item
          window, same drift/spring animation — just at the compact scale that
          fits under this page's own title. */}
      <div className="page-shell pointer-events-none absolute inset-0 z-[16]">
      <NavMenu
        sections={navSections}
        activeIndex={focus}
        position={pos}
        onNavigate={scrollToPanel}
        positionClass="left-4 top-[72px] md:left-[120px] md:top-[100px]"
      />
      </div>
    </motion.div>
  )
}
