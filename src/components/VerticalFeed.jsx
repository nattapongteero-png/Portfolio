// -----------------------------------------------------------------------------
// VerticalFeed.jsx
// The full-page vertical scroller. Every section is exactly one viewport tall
// and paging is native CSS scroll-snap (the same mechanism the detail feed
// uses), so the menu position is simply scrollTop in viewport units.
// The MyAtlas device reveal is no longer scrubbed by scroll — it plays from a
// button inside that section (see FeedSection).
// -----------------------------------------------------------------------------

import { useRef, useEffect, useLayoutEffect, useState } from 'react'
import FeedSection from './FeedSection'
import NavMenu from './NavMenu'
import { usePortfolio } from '../context/PortfolioContext'
import { hero, contact, SHARED_IMAGE } from '../data/site'

export default function VerticalFeed() {
  const { projects, goToProject } = usePortfolio()
  const rootRef = useRef(null)
  const containerRef = useRef(null)
  const activeRef = useRef(0)

  // One source of truth for the menu + feed.
  const sections = [
    {
      domId: 'sec-hero',
      title: hero.name,
      lines: [hero.title, hero.subtitle],
      image: hero.image,
      avatar: hero.avatar,
      initial: hero.name?.[0],
    },
    ...projects.map((p, i) => ({
      domId: `sec-project-${i}`,
      title: p.title,
      lines: [p.tagline, p.bio],
      image: SHARED_IMAGE,
      projectId: p.id,
      projectIndex: i,
      avatar: p.avatar,
      initial: p.title?.[0],
      scene: p.id === 'myatlas' ? 'office' : undefined,
      prototypeUrl: p.prototypeUrl,
    })),
    {
      domId: 'sec-contact',
      title: contact.name,
      lines: [contact.title, contact.subtitle],
      image: contact.image,
      avatar: contact.avatar,
      initial: contact.name?.[0],
      footer: (
        <div className="mt-5 flex flex-wrap gap-2">
          {contact.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
            >
              {link.label}
            </a>
          ))}
        </div>
      ),
    },
  ]
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  const [activeIndex, setActiveIndex] = useState(0)
  // Fractional menu position (1.4 = 40% of the way from section 1 → 2).
  const [scrollPos, setScrollPos] = useState(0)
  // Set while a section has its prototype focused — the menu then reads as
  // "MyAtlas / Prototype", and its `close` is what tapping the parent crumb
  // calls to come back.
  const [proto, setProto] = useState(null)

  // Same treatment as the detail sheet: a solid-to-transparent band behind the
  // nav, sized to where the nav actually ends, so section content never reads
  // through the titles. Scoped to this feed's own nav — a detail sheet mounted
  // on top has one of its own.
  const NAV_GAP = 0
  const [fadeHeight, setFadeHeight] = useState(0)
  useLayoutEffect(() => {
    let raf = 0
    let stop = 0
    const measure = () => {
      const el = rootRef.current?.querySelector('.nav-menu')
      if (!el) return
      const h = Math.round(el.getBoundingClientRect().bottom + NAV_GAP)
      setFadeHeight((cur) => (cur === h ? cur : h))
    }
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
  }, [activeIndex])

  const scrollToIndex = (idx) => {
    const el = containerRef.current
    if (el) el.scrollTo({ top: idx * el.clientHeight, behavior: 'smooth' })
  }

  useEffect(() => {
    const wrapper = containerRef.current
    if (!wrapper) return
    // Native CSS scroll-snap paging (same as the detail feed). Every section is
    // exactly one viewport tall, so the menu position is just scrollTop in
    // viewport units — no Lenis, no measured offsets, no custom settle timer.
    const onScroll = () => {
      const pos = wrapper.scrollTop / (wrapper.clientHeight || 1)
      setScrollPos(pos)
      const idx = Math.round(pos)
      if (idx !== activeRef.current) {
        activeRef.current = idx
        setActiveIndex(idx)
        const pIdx = sectionsRef.current[idx]?.projectIndex
        if (pIdx != null) goToProject(pIdx)
      }
    }
    wrapper.addEventListener('scroll', onScroll, { passive: true })
    return () => wrapper.removeEventListener('scroll', onScroll)
  }, [goToProject])


  return (
    <div ref={rootRef} className="relative h-dvh w-full">
      {/* Behind the nav, above the feed. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[15]"
        style={{
          height: fadeHeight,
          // Same footprint as before — the softness comes from a longer ramp
          // INSIDE it (solid only to 42%), not from spilling further down over
          // the content.
          background: 'linear-gradient(to bottom, #fafafa 0, #fafafa 42%, rgba(250,250,250,0.86) 62%, rgba(250,250,250,0.5) 80%, rgba(250,250,250,0) 100%)',
        }}
      />
      {/* The nav is positioned against a centred shell rather than the raw
          viewport, so on very wide screens the whole page stops drifting to the
          left edge — and because the profile uses the SAME shell, the title
          still lands on the identical rect when the overlay opens. */}
      <div className="page-shell pointer-events-none absolute inset-0 z-[16]">
      <NavMenu
        sections={sections}
        activeIndex={activeIndex}
        position={scrollPos}
        onNavigate={scrollToIndex}
        breadcrumb={proto ? 'Prototype' : null}
        onBreadcrumbBack={proto?.close}
      />
      </div>

      <div
        ref={containerRef}
        className="no-scrollbar isolate h-dvh w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
      >
        <div>
          {sections.map((s, i) => (
            <FeedSection
              key={s.domId}
              domId={s.domId}
              index={i}
              image={s.image}
              projectId={s.projectId}
              projectIndex={s.projectIndex}
              avatar={s.avatar}
              initial={s.initial}
              scene={s.scene}
              info={s.scene ? { tagline: s.lines?.[0], bio: s.lines?.[1], prototypeUrl: s.prototypeUrl, title: s.title } : undefined}
              offset={scrollPos - i}
              onPrototypeFocus={(open, close) => setProto(open ? { close } : null)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
