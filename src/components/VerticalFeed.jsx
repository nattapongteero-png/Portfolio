// -----------------------------------------------------------------------------
// VerticalFeed.jsx
// The full-page vertical scroller. Every section is exactly one viewport tall
// and paging is native CSS scroll-snap (the same mechanism the detail feed
// uses), so the menu position is simply scrollTop in viewport units.
// The Pawmely device reveal is no longer scrubbed by scroll — it plays from a
// button inside that section (see FeedSection).
// -----------------------------------------------------------------------------

import { useCallback, useRef, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import FeedSection from './FeedSection'
import TrainingPage from './TrainingPage'
import NavMenu from './NavMenu'
import StaggeredMenu from './StaggeredMenu'
import useArcWipe from './ArcWipe'
import { pointerOrigin } from '../lib/pointerOrigin'
import { REVEAL_BEATS, REVEAL_MS, requestReveal, useReveal } from '../lib/reveal'
import GradualBlur from './GradualBlur'
import { usePortfolio } from '../context/PortfolioContext'
import { hero, contact, SHARED_IMAGE } from '../data/site'
import { flipContact } from '../lib/contactPage'

export default function VerticalFeed() {
  const { projects, goToProject } = usePortfolio()
  const rootRef = useRef(null)
  // The arc that plays when a section is picked from the list. See ArcWipe.
  const { overlay: arcOverlay, play: playWipe } = useArcWipe()
  // See `arriveKey` in FeedSection.
  const [arrival, setArrival] = useState(0)
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
      // Which device the project's front page shows it on: Pawmely is a phone
      // app, Metaherb is a web app, so it gets the laptop. A project may force
      // its own `scene` (MyAtlas stages the phone before its prototype link
      // exists — the model stands with the cover art, no play button yet).
      scene:
        p.scene ??
        (p.id === 'metaherb'
          ? 'desk' // a web app, shown on the laptop
          : p.prototypeUrl
            ? 'office' // a phone app, shown on the iPhone
            : undefined),
      prototypeUrl: p.prototypeUrl,
      // The canvas the app draws at, when it differs from the device default.
      appViewport: p.appViewport,
      // The still the device wears until the live build has booted — each
      // project's own, not one shared file.
      cover: p.cover,
      // The project's own colour, used to ink its title in the nav.
      accent: p.accent,
    })),
    {
      // Stripped to its title. Everything that used to sit here — the standfirst,
      // the link buttons, the folder, the illustration — has been taken off, so
      // the last screen is the name of the stage and the way back out of it.
      domId: 'sec-contact',
      bare: true,
      title: contact.name,
      lines: [],
      image: null,
      avatar: contact.avatar,
      initial: contact.name?.[0],
    },
  ]
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  const [activeIndex, setActiveIndex] = useState(0)
  // Fractional menu position (1.4 = 40% of the way from section 1 → 2).
  const [scrollPos, setScrollPos] = useState(0)

  // Which section owns a prototype, and whether it is currently open. Set as
  // soon as such a section mounts — not only while it is playing — because the
  // nav shows "Pawmely / Prototype" either way: open, the crumb has the focus;
  // closed, it sits back small and blurred. `close` is what tapping the parent
  // title calls to come back.
  // Keyed by SECTION INDEX, not a single slot: two projects own a prototype now
  // (Pawmely's phone app and Metaherb's site), every section that owns one
  // reports on mount, and with one slot the last to mount claimed the crumb —
  // so the nav could label Metaherb's prototype "Pawmely / Prototype".
  const [protos, setProtos] = useState({})
  // The training page — การพัฒนาตนเอง as its own screen, opened from the menu.
  // It is an overlay like the contact page, not a stage of the feed, so it lives
  // here as {origin} while open and null while not. The origin is the menu row
  // that was pressed, so the page's circle grows out of the press.
  const [training, setTraining] = useState(null)
  // Taking the training page away: the feed grows back out of the point the page
  // grew from, and the page itself is only dropped once the feed has covered the
  // screen. A no-op when nothing is open, so the menu rows can call it blind.
  const closeTraining = useCallback(() => {
    setTraining((t) => {
      if (t) requestReveal('feed', t.origin)
      return t
    })
    window.setTimeout(() => setTraining(null), REVEAL_MS)
  }, [])
  // The feed is staged rather than one continuous scroll. Each stage owns a
  // range of sections and the scroller is fenced to it: Home is one screen,
  // Project is every project section, Contact is one screen. You move between
  // stages through the menu or the back button — never by scrolling, which is
  // why the fence blocks the input rather than correcting the position after
  // the fact. Correcting after the fact is what made the edges judder: the
  // scroll had already started and was being dragged back every frame.
  const LAST = projects.length + 1
  const STAGES = {
    home: [0, 0],
    project: [1, projects.length],
    contact: [LAST, LAST],
  }
  // How long the wipe takes to cover the screen, and to uncover it again.
  // Declared up here because the nav measurement below stands down while it is
  // set — see the settle loop.
  // The feed plays this both for its own stage changes and when the profile above
  // it closes — the arriving layer is the one that animates, always.
  const { style: revealStyle, play: playReveal, revealing } = useReveal('feed')
  // The ground comes in on the SECOND beat, exactly as it does going the other
  // way. Painted from the first frame it covered the page being left — and on the
  // way back from contact, that page is the one with the card being pulled, so the
  // whole gesture disappeared behind it.
  const [ground, setGround] = useState(false)
  useEffect(() => {
    if (!revealing) {
      setGround(false)
      return undefined
    }
    const id = window.setTimeout(() => setGround(true), REVEAL_BEATS.secondAt)
    return () => window.clearTimeout(id)
  }, [revealing])
  // The prototype belonging to the section you are actually on.
  const proto = protos[activeIndex] ?? null
  const [stage, setStage] = useState('home')
  const stageRef = useRef('home')
  stageRef.current = stage
  const staged = stage !== 'home'

  // The hero has no entry in the menu, and neither has Contact while you are
  // inside the project stage: the stage's scroller is fenced to the projects, so
  // a Contact title previewed under the last one names a screen that scrolling
  // will never reach. It is reached from the menu, and its own stage still shows
  // its title.
  //
  // Given as a BLANK title rather than by dropping the entry: the wheel clamps a
  // controlled value to [0, n-1], so a shorter list would pin the wheel on the
  // wrong section's title. A blank keeps every index aligned with the feed and
  // leaves the wheel nothing to draw.
  const navSections = sections.map((s, i) =>
    i === 0 || (stage === 'project' && s.domId === 'sec-contact') ? { ...s, title: '' } : s
  )

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
      // Sized to the selected title, not to the menu box: the wheel's box runs
      // three rows tall so its neighbours have room to curl away, and using its
      // bottom edge made the blur band twice as deep as the heading it exists
      // to sit behind.
      const active = el.querySelector('.option-wheel__item--selected')
      const box = (active || el).getBoundingClientRect()
      const h = Math.round(box.bottom + NAV_GAP)
      setFadeHeight((cur) => (cur === h ? cur : h))
    }
    const settle = () => {
      measure()
      if (performance.now() < stop) raf = requestAnimationFrame(settle)
    }
    // This loop reads getBoundingClientRect every frame for most of a second,
    // which forces a layout on each one. Running it underneath the wipe put a
    // forced layout inside every frame of the animation, so it waits until the
    // wipe is over and measures once the page has settled.
    if (revealing) {
      measure()
    } else {
      stop = performance.now() + 900
      settle()
    }
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
  }, [activeIndex, revealing])

  // Re-read the scroll position whenever the prototype opens or closes. Taking
  // over the scroller fires a scroll event reading 0, which the listener below
  // dutifully stores; nothing fires on the way back, so the nav stayed parked on
  // the first section after closing. The DOM still holds the truth — this just
  // asks it again once the handover has settled.
  useEffect(() => {
    const wrapper = containerRef.current
    if (!wrapper) return
    const id = requestAnimationFrame(() =>
      setScrollPos(wrapper.scrollTop / (wrapper.clientHeight || 1))
    )
    return () => cancelAnimationFrame(id)
  }, [proto?.open])

  // The hero carries no section title. It is the page's own title card — the pass
  // on its lanyard and the greeting behind it ARE the section — so a heading
  // naming what you are already looking at only competes with them. Ramped off the
  // fractional scroll position rather than switched on activeIndex, so the title
  // arrives with the scroll instead of popping in at its midpoint.
  //
  // Forced on while a prototype is open: taking over the scroller makes scrollPos
  // read 0 for a beat, and the nav would blink out mid-handover.
  //
  // The menu exists from the second section onwards, and it switches at that
  // boundary rather than fading across it: crossing back into the hero, the title
  // is simply gone. The wheel's own easing still carries every OTHER change of
  // title — this is a hard cut at one edge, not a new transition.
  //
  // Written straight to the DOM from the scroll handler rather than through React
  // state: a snap lands instantly, so the browser paints the new scroll position
  // one frame before React commits the state that follows it, and that frame
  // showed the previous section's title over the hero.
  const navLayerRef = useRef(null)
  const bandRef = useRef(null)
  const applyNavReveal = useCallback((v) => {
    const on = v >= 1 ? '1' : '0'
    if (navLayerRef.current) {
      navLayerRef.current.style.opacity = on
      navLayerRef.current.style.pointerEvents = on === '0' ? 'none' : ''
    }
    if (bandRef.current) bandRef.current.style.opacity = on
  }, [])
  // Mount, and every time the prototype takes or hands back the scroller.
  useLayoutEffect(() => {
    const el = containerRef.current
    applyNavReveal(proto?.open ? 1 : (el?.scrollTop ?? 0) / (el?.clientHeight || 1))
  }, [applyNavReveal, proto?.open])

  // Changing stage: jump to the new one, then let it GROW out of the press. It
  // used to shrink the stage you were leaving before growing the one you were
  // going to whenever you went home — which read as the old page being taken
  // away rather than the new one arriving, and only on that one direction.
  // Every transition on this site is a growth now, in every direction.
  const goToStage = (name) => {
    const el = containerRef.current
    const origin = pointerOrigin()
    stageRef.current = name
    setStage(name)
    if (el) el.scrollTo({ top: STAGES[name][0] * el.clientHeight, behavior: 'auto' })
    playReveal(origin)
  }

  // Picking a section from the list is a PAGE change, not a scroll: the arc
  // sweeps up, the scroller is moved while the screen is covered, and the new
  // section is uncovered behind the same arc. Smooth-scrolling there instead
  // showed every section in between, which reads as travelling past three
  // projects to reach the fourth rather than going to it.
  const scrollToIndex = (idx) => {
    const el = containerRef.current
    if (!el) return
    const target = idx * el.clientHeight
    if (Math.abs(el.scrollTop - target) < 2) return
    playWipe(() => {
      el.scrollTo({ top: target, behavior: 'auto' })
      // Same frame the swap happens: the arriving page's copy restarts its
      // stagger while the arc is still covering it, so the first line is already
      // on its way up as it is uncovered.
      setArrival((n) => n + 1)
    })
  }

  useEffect(() => {
    const wrapper = containerRef.current
    if (!wrapper) return
    // Native CSS scroll-snap paging (same as the detail feed). Every section is
    // exactly one viewport tall, so the menu position is just scrollTop in
    // viewport units — no Lenis, no measured offsets, no custom settle timer.
    const range = () => {
      const H = wrapper.clientHeight || 1
      const [a, z] = STAGES[stageRef.current] ?? [0, 0]
      return [a * H, z * H]
    }
    const onScroll = () => {
      // A backstop only — a resize or a stray programmatic scroll can still land
      // outside the stage, and this puts it back without animating.
      const [min, max] = range()
      if (wrapper.scrollTop < min) wrapper.scrollTop = min
      else if (wrapper.scrollTop > max) wrapper.scrollTop = max

      const pos = wrapper.scrollTop / (wrapper.clientHeight || 1)
      // Same frame as the scroll itself — see applyNavReveal.
      applyNavReveal(pos)
      setScrollPos(pos)
      const idx = Math.round(pos)
      if (idx !== activeRef.current) {
        activeRef.current = idx
        setActiveIndex(idx)
        const pIdx = sectionsRef.current[idx]?.projectIndex
        if (pIdx != null) goToProject(pIdx)
      }
    }
    // The fence proper: a scroll that would leave the stage never starts, so
    // there is nothing to snap back and nothing to judder.
    //
    // Inside a stage the wheel scrolls freely — the project stage included:
    // one project snaps to the next, and the index row's ink follows the
    // position the scroll reports (see onScroll). Picking a name from that row
    // still plays the arc wipe, which is what keeps a jump of three projects
    // from showing the two in between.
    const blocked = (dir) => {
      const [min, max] = range()
      const t = wrapper.scrollTop
      return (dir < 0 && t <= min + 1) || (dir > 0 && t >= max - 1)
    }
    const onWheel = (e) => {
      if (blocked(e.deltaY)) e.preventDefault()
    }
    let touchY = 0
    const onTouchStart = (e) => {
      touchY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e) => {
      const y = e.touches[0]?.clientY ?? 0
      // Finger up = scrolling down the page.
      if (blocked(touchY - y)) e.preventDefault()
    }
    wrapper.addEventListener('scroll', onScroll, { passive: true })
    wrapper.addEventListener('wheel', onWheel, { passive: false })
    wrapper.addEventListener('touchstart', onTouchStart, { passive: true })
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      wrapper.removeEventListener('scroll', onScroll)
      wrapper.removeEventListener('wheel', onWheel)
      wrapper.removeEventListener('touchstart', onTouchStart)
      wrapper.removeEventListener('touchmove', onTouchMove)
    }
  }, [goToProject, applyNavReveal, LAST])


  return (
    <>
    {/* The plate the feed opens over. Everywhere else the beige base under the app
        shows through the growing circle by itself — but the contact page is
        portalled to the body and covers that base, so coming back from it the
        circle opened onto a white screen with no ground at all. This sits under
        the arriving feed and over the page it is replacing. */}
    {revealing && ground && (
      <div className="pointer-events-none fixed inset-0 z-[65] bg-[#e7e4dd]" aria-hidden />
    )}
    <div
      ref={rootRef}
      className="relative h-dvh w-full"
      // Clipping the root takes the overlays with it — the nav, the menu and the
      // back button are fixed, and a clip-path on an ancestor contains them too,
      // so the whole screen is revealed as one thing.
      // Every page is the same pale ground, so the growing circle needs an edge to
      // be seen by — drop-shadow follows the clipped SHAPE, so the rim travels
      // with it. White opening over white is invisible without this.
      style={
        revealStyle
          ? {
              ...revealStyle,
              filter:
                'drop-shadow(0 0 1px rgba(33,34,31,0.35)) drop-shadow(0 18px 44px rgba(33,34,31,0.20))',
              // Lifted ABOVE the page it is taking over from, for as long as it is
              // arriving. Without this the two directions of the contact trip could
              // never look the same: going there, the contact page sits on top and
              // grows over a home screen that keeps moving underneath; coming back,
              // the feed is UNDERNEATH, so nothing could be seen of it until the
              // contact page was thrown away first — the card's pull and the
              // transition had to take turns instead of happening together.
              zIndex: 70,
            }
          : undefined
      }
    >
      {/* No progress rail here any more. It answered "how far through the
          scroll are you", and inside the project stage there is no scroll left
          to be part-way through — the section list already says which page you
          are on and which are still to come. The reel keeps its own rail, where
          the panels really are scrolled. */}

      {/* Behind the nav, above the feed. A progressive BLUR rather than the
          white-to-clear wash this used to be: the wash only worked while every
          section was #fafafa, and over the dark Pawmely section it read as a
          white bar pasted across the top. Blur takes whatever colour is behind
          it, so one band now serves the pale sections and the dark one. */}
      <div
        ref={bandRef}
        className="pointer-events-none absolute inset-x-0 top-0 z-[15]"
        // Fades with the title it sits behind — left on, the band stays as a
        // haze across the top of a page that has no heading under it. Its opacity
        // is set imperatively; only the height comes from React.
        style={{ height: fadeHeight }}
      >
        <GradualBlur
          target="parent"
          position="top"
          height="100%"
          strength={2}
          divCount={5}
          curve="bezier"
          exponential
          opacity={1}
          zIndex={1}
        />
      </div>
      {/* The nav is positioned against a centred shell rather than the raw
          viewport, so on very wide screens the whole page stops drifting to the
          left edge — and because the profile uses the SAME shell, the title
          still lands on the identical rect when the overlay opens. */}
      {/* The nav hides on a phone while a prototype is open: the app takes the
          whole screen, and a section title floating over it names something you
          are no longer looking at. Desktop keeps it — there is room. */}
      <div
        className={`page-shell pointer-events-none absolute inset-0 z-[16] transition-opacity duration-300 md:opacity-100 ${
          proto?.open ? 'opacity-0' : 'opacity-100'
        }`}
      >
      {/* Its own layer, so the hero cut MULTIPLIES with the prototype rule above
          instead of fighting it for the same property. */}
      {arcOverlay}
      <div ref={navLayerRef}>
      <NavMenu
        // The hero's own title is not in here at all — it is the page's title
        // card, the pass and the greeting ARE the section, and a menu that never
        // holds that title cannot flash it on the way back to it.
        sections={navSections}
        // Inside the project stage nothing scrolls, so the nav is a plain list:
        // the rows hold still and the ink moves between them.
        list={stage === 'project'}
        // On the corner the home screen's name block owns — 32/32, measured off
        // .sm-logo — so turning the page swaps what the corner says without the
        // heading moving. The calc still subtracts the centred 1600 shell's own
        // offset, because this layer lives inside the shell while 32 is meant
        // from the viewport.
        // 25, not the block's own 32: the two corners align by INK, not by box.
        // The 4.5rem heading carries ~10px of leading above its caps where the
        // name block's 13px role line carries ~3 — measured first dark pixel
        // rows 42 vs 35 — so the heading's box starts 7px higher to put both
        // caps on the same row.
        positionClass="left-5 top-[calc(env(safe-area-inset-top,0px)+20px)] md:left-[calc(32px-max(0px,(100vw-1600px)/2))] md:top-[25px]"
        activeIndex={activeIndex}
        // Pinned to the section that owns the prototype while it is open. The
        // feed's scroll position briefly reads 0 as the prototype takes over the
        // scroller, and the nav followed it — so opening Pawmely's prototype
        // could label the crumb "NATTAPONG / Prototype".
        position={proto?.open ? proto.index : scrollPos}
        onNavigate={scrollToIndex}
        breadcrumb={proto ? 'Prototype' : null}
        breadcrumbIndex={proto?.index ?? null}
        breadcrumbFocused={!!proto?.open}
        onBreadcrumbBack={proto?.close}
        onBreadcrumbOpen={proto?.play}
      />
      </div>
      </div>

      {/* The right corner: who this is, and the way into the rest of the feed.
          The section wheel already owns the left corner, so this block and its
          toggle both sit right. It rides the same layer as the nav, so it fades
          out with it while a prototype is open. */}
      <div
        // The toggle stays on inside the stage: with the back button gone, the
        // menu IS the way out — Home and Contact are reached through it.
        // Above the training page (z-60) while that page is open, so the one
        // toggle on this site serves it too instead of it drawing a second one.
        className={`pointer-events-none fixed inset-0 transition-opacity duration-300 ${
          training ? 'z-[70]' : 'z-[17]'
        } ${proto?.open ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}
      >
        <StaggeredMenu
          position="right"
          // The name belongs to the first screen only. Past it the section wheel
          // names what you are looking at, and two titles in the same corner
          // read as one crowded label. It stays mounted and fades rather than
          // unmounting, so the toggle keeps its place on the right instead of
          // sliding across an empty row.
          logo={
            // Two things share this slot, because only one of them applies at a
            // time: the name on the home screen, and the way out once you are
            // inside the project stage.
            // An empty spacer, not null: the header row is space-between with
            // the toggle sitting on the logo block's baseline, so an empty left
            // slot both slid the toggle across to the left corner (x32) and let
            // it ride 13px higher than on the home screen (measured 52 vs 65).
            // The spacer holds the row's shape at the name block's own height.
            staged || training ? (
              <div aria-hidden style={{ height: 53 }} />
            ) : (
              <div
                className="pointer-events-none text-left leading-tight transition-opacity duration-300"
                aria-hidden={activeIndex !== 0}
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-black/50 md:text-[13px]">
                  {hero.role}
                </div>
                <div className="mt-1 text-[20px] font-bold tracking-tight text-black md:text-[26px]">
                  {hero.fullName}
                </div>
              </div>
            )
          }
          // Three rows, not one per section: the projects are one stage you
          // enter and then scroll through, so the menu names it once. Picking it
          // lands on the first project and the feed behaves as it always has.
          items={[
            {
              label: 'Home',
              ariaLabel: 'ไปที่หน้าแรก',
              // The row you are already on wears its colour without being
              // pointed at — it was reading as the one dead row in the list.
              active: stage === 'home',
              onSelect: () => {
                closeTraining()
                goToStage('home')
              },
            },
            {
              label: 'Project',
              ariaLabel: `ไปที่ผลงาน ${projects.length} ชิ้น`,
              active: stage === 'project',
              onSelect: () => {
                closeTraining()
                goToStage('project')
              },
            },
            {
              label: 'Training',
              ariaLabel: 'ไปที่หน้าการพัฒนาตนเอง',
              active: !!training,
              // Same overlay pattern as Contact below — a page grown out of the
              // pressed row, not a stage of the feed. The origin is read here,
              // synchronously with the press, because by the time the page
              // mounts the pointer fact is gone.
              onSelect: () => setTraining({ origin: pointerOrigin() }),
            },
            {
              label: 'Contact',
              ariaLabel: 'ไปที่หน้าติดต่อ',
              active: stage === 'contact',
              // Not a page any more: Contact IS the hero's own gesture. The
              // menu sends the feed home and asks the pass to turn over — the
              // card shows its contact face and the channels fall out of it,
              // exactly what flipping the card yourself does.
              onSelect: () => {
                closeTraining()
                goToStage('home')
                flipContact()
              },
            },
          ]}
          // The icon alone. "Menu" beside a plus said what the plus already says.
          showToggleLabel={false}
          displaySocials={false}
          // No numbering. Three rows do not need counting, and the numbers were
          // the only thing in the panel that was not a destination.
          displayItemNumbering={false}
          menuButtonColor="#111111"
          openMenuButtonColor="#111111"
          changeMenuColorOnOpen={false}
          // The layers that sweep in ahead of the panel are greyscale — the
          // colour in this menu belongs to the rows, and two coloured planes
          // crossing the screen swamped them.
          colors={['#4a4a4a', '#111111']}
          accentColor={projects[0]?.accent ?? '#B86A7C'}
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
              lanyard={s.domId === 'sec-hero'}
              bare={s.bare}
              info={s.scene ? { tagline: s.lines?.[0], bio: s.lines?.[1], prototypeUrl: s.prototypeUrl, title: s.title, cover: s.cover, appViewport: s.appViewport } : undefined}
              // Every section's copy, for the phone's bottom caption band. The
              // scene section renders its own (it also has a desktop column);
              // the rest had no copy on screen at all, which left Contact's
              // links floating with nothing to belong to.
              caption={s.scene || s.bare ? undefined : { tagline: s.lines?.[0], bio: s.lines?.[1] }}
              footer={s.footer}
              offset={scrollPos - i}
              arriveKey={arrival}
              onPrototypeFocus={(open, close, play) =>
                setProtos((m) => ({ ...m, [i]: { close, play, index: i, open } }))
              }
            />
          ))}
        </div>
      </div>

      {/* Portalled for the same reason the contact page is — a full-screen layer
          does not belong inside a scroller. Closing mirrors every other page on
          this site: the feed underneath is the layer that arrives, growing from
          the same point the training page grew from, and the page is only taken
          away once the feed has covered the screen. */}
      {training &&
        typeof document !== 'undefined' &&
        createPortal(
          <TrainingPage
            origin={training.origin}
            onClose={closeTraining}
          />,
          document.body
        )}
    </div>
    </>
  )
}
