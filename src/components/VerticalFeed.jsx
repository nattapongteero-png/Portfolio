// -----------------------------------------------------------------------------
// VerticalFeed.jsx
// The full-page vertical snap scroller. Builds one ordered list of sections
//   Home → Health → Herbal → Pets → Contact
// and feeds it to <NavMenu /> (the windowed top-left menu) and the scroller.
// An IntersectionObserver tracks the focused section so the menu shows the
// right window + description and the active project stays in sync.
// -----------------------------------------------------------------------------

import { useRef, useEffect, useState } from 'react'
import FeedSection from './FeedSection'
import NavMenu from './NavMenu'
import { usePortfolio } from '../context/PortfolioContext'
import { hero, contact, SHARED_IMAGE } from '../data/site'

export default function VerticalFeed({ wheelSnap = false }) {
  const { projects, goToProject } = usePortfolio()
  const containerRef = useRef(null)
  const cooldownRef = useRef(false)

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
      tags: p.techStack.slice(0, 4),
      avatar: p.avatar,
      initial: p.title?.[0],
      scene: p.id === 'myatlas' ? 'office' : undefined,
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

  const [activeIndex, setActiveIndex] = useState(0)
  // Fractional scroll position (e.g. 1.4 = 40% of the way from section 1 → 2).
  // Drives the live "TikTok" wheel motion of the menu while you scroll.
  const [scrollPos, setScrollPos] = useState(0)

  const scrollToIndex = (idx) => {
    document.getElementById(sections[idx]?.domId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Track continuous scroll progress (rAF-throttled).
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const h = root.clientHeight || 1
        setScrollPos(root.scrollTop / h)
      })
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      root.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Track the focused section; keep the active project in sync for likes.
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.dataset.sectionIndex)
            if (Number.isNaN(idx)) return
            setActiveIndex(idx)
            const pIdx = sections[idx]?.projectIndex
            if (pIdx != null) goToProject(pIdx)
          }
        })
      },
      { root, threshold: [0.6] }
    )
    root.querySelectorAll('[data-section-index]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [goToProject, projects.length])

  // Desktop wheel-snap: one gesture → one section.
  useEffect(() => {
    const root = containerRef.current
    if (!root || !wheelSnap) return
    const onWheel = (e) => {
      e.preventDefault()
      if (cooldownRef.current || Math.abs(e.deltaY) < 8) return
      cooldownRef.current = true
      root.scrollBy({ top: e.deltaY > 0 ? root.clientHeight : -root.clientHeight, behavior: 'smooth' })
      setTimeout(() => (cooldownRef.current = false), 600)
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [wheelSnap])

  return (
    <div className="relative h-dvh w-full">
      <NavMenu sections={sections} activeIndex={activeIndex} position={scrollPos} onNavigate={scrollToIndex} />

      <div
        ref={containerRef}
        className="no-scrollbar h-dvh w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain scroll-smooth"
      >
        {sections.map((s, i) => (
          <FeedSection
            key={s.domId}
            domId={s.domId}
            index={i}
            image={s.image}
            projectId={s.projectId}
            avatar={s.avatar}
            initial={s.initial}
            scene={s.scene}
            offset={scrollPos - i}
          />
        ))}
      </div>
    </div>
  )
}
