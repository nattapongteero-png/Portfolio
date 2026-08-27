// -----------------------------------------------------------------------------
// PhysicsPills.jsx
// Anything dropped into a box and left to settle — the contact page's channel
// pills, and the component card's tag pills. Built on matter-js, the engine React
// Bits' FallingText uses, because the hand-rolled solver this replaces stuttered:
// it stepped on every animation frame, so on a 120Hz screen it ran at twice the
// speed it was tuned for and every frame the browser dropped changed the physics
// rather than just the picture.
//
// Two rules keep it smooth, and FallingText's own example breaks the first:
//
//   1. ONE thing steps the world. matter's Runner does it, on its own fixed
//      clock. The animation frame only READS positions. FallingText calls
//      `Runner.run(...)` AND `Engine.update(...)` inside its rAF loop, which
//      advances the world twice per frame at two different timesteps — that is
//      exactly the judder it is trying to animate away.
//   2. Nothing is measured while it is moving. The bodies are built from one
//      layout pass taken before the first step, so a reflow can never fight the
//      simulation for where an element is.
// -----------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

export default function PhysicsPills({
  children,
  // The box's own classes, given in full rather than appended to a default: this
  // is used both as a block in the flow and as an `absolute inset-0` fill, and a
  // baked-in `relative` would have fought the second one.
  className = 'relative h-full w-full overflow-hidden',
  itemClassName = '',
  // Asked before a pill takes a drag. The component card lets you drag the CARD,
  // and a pill grabbing the pointer first would take that gesture away.
  canDrag = () => true,
  // How hard they fall. 1 is matter's earth; the pills read better a little
  // lighter, so they settle instead of slamming.
  gravity = 0.9,
  // How firmly a dragged pill follows the pointer.
  // Firm. At 0.28 the pill lagged so far behind the pointer that a 168px drag
  // moved it 24 — measured — and it read as broken rather than as heavy.
  dragStiffness = 0.9,
  restitution = 0.35,
  // Held off until the page around it has arrived, so the drop is something you
  // watch rather than something already over.
  delay = 0,
  // Let an item change size after it is in the world — a pill that opens on hover
  // has to, and a body frozen at the closed size would carry on colliding at the
  // closed size. With this on, nothing is pinned to a measured width and each
  // body is rescaled from the element's own resize.
  resize = false,
  // Where the drop STARTS. 'inplace' leaves every body exactly where the layout
  // put it — right for a small box like the component card, where the pills are
  // already inside the frame. 'above' lifts each body clear of the top edge first,
  // by its own height plus a different amount each, so they fall in from off-box
  // and land at different moments instead of appearing mid-screen already falling.
  entry = 'inplace',
  // Stand items back up ONCE THEY HAVE STOPPED. They tumble freely on the way
  // down — that fall is the whole point — but a long drop leaves one lying on its
  // side often enough to matter when the item carries a logo and a word. The
  // torque here only touches bodies that have already come to rest, so nothing
  // about the fall changes.
  level = false,
  // Take the floor away. What was dropped in then simply falls out of the bottom
  // of the box and is gone — the way OUT of a drop, rather than the pills being
  // switched off where they lie.
  openFloor = false,
}) {
  const boxRef = useRef(null)
  const worldRef = useRef(null)
  const floorRef = useRef(null)
  const itemRefs = useRef([])
  const [ready, setReady] = useState(delay === 0)

  useEffect(() => {
    if (delay === 0) return undefined
    const id = window.setTimeout(() => setReady(true), delay)
    return () => window.clearTimeout(id)
  }, [delay])

  useLayoutEffect(() => {
    if (!ready) return undefined
    const box = boxRef.current
    const items = itemRefs.current.filter(Boolean)
    if (!box || !items.length) return undefined

    const { Engine, World, Bodies, Body, Runner } = Matter
    const rect = box.getBoundingClientRect()
    const W = rect.width
    const H = rect.height
    if (W <= 0 || H <= 0) return undefined

    const engine = Engine.create()
    engine.gravity.y = gravity

    // The walls sit just outside the box, thick enough that nothing tunnels
    // through them at speed.
    const wall = { isStatic: true, restitution: 0.2 }
    const T = 200
    const floor = Bodies.rectangle(W / 2, H + T / 2, W * 3, T, wall)
    worldRef.current = engine.world
    floorRef.current = floor
    World.add(engine.world, [
      floor,
      Bodies.rectangle(-T / 2, H / 2, T, H * 3, wall),
      Bodies.rectangle(W + T / 2, H / 2, T, H * 3, wall),
    ])

    // One layout pass, before anything moves: each pill's own laid-out rect is
    // where its body starts, so the drop begins from exactly where the page had
    // already drawn it.
    const parts = items.map(el => {
      const r = el.getBoundingClientRect()
      // The body is chamfered to the SHAPE THE ELEMENT IS DRAWN WITH, read off its
      // own computed corner, not to a capsule every time. Once the pills stopped
      // all being capsules, a fixed half-height chamfer meant a square-cornered
      // pill collided as a lozenge — its corners passed through its neighbours.
      const cornerPx = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
      const corner = Math.min(cornerPx, Math.min(r.width, r.height) / 2)
      const body = Bodies.rectangle(
        r.left - rect.left + r.width / 2,
        r.top - rect.top + r.height / 2,
        r.width,
        r.height,
        {
          ...(corner > 0 ? { chamfer: { radius: corner } } : {}),
          restitution,
          friction: 0.35,
          frictionAir: 0.02,
        }
      )
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06)
      // Above the top edge, and a different amount each: laid out in one row they
      // all started at the same height and landed on the same frame, which is what
      // made the contact drop read as a single rigid block coming down rather than
      // as separate objects.
      if (entry === 'above') {
        const startY = r.top - rect.top + r.height / 2
        Body.translate(body, { x: 0, y: -(startY + r.height / 2 + 24 + Math.random() * 220) })
      }
      return { el, body, w: r.width, h: r.height }
    })
    World.add(engine.world, parts.map(p => p.body))

    // Now they are physics objects: taken out of the flow and placed by transform
    // only. Left in the flow, every position write would have cost a reflow.
    parts.forEach(({ el, w, h }) => {
      el.style.position = 'absolute'
      el.style.left = '0px'
      el.style.top = '0px'
      if (!resize) {
        el.style.width = `${w}px`
        el.style.height = `${h}px`
      }
      el.style.willChange = 'transform'
    })

    // An item that is allowed to change size keeps its body the same shape as
    // itself. The body is SCALED rather than rebuilt so it keeps its position,
    // velocity and everything else it is in the middle of doing.
    let observer = null
    if (resize && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const part = parts.find(p => p.el === entry.target)
          if (!part) return
          const r = entry.contentRect
          if (r.width <= 0 || r.height <= 0) return
          if (Math.abs(r.width - part.w) < 0.5 && Math.abs(r.height - part.h) < 0.5) return
          Body.scale(part.body, r.width / part.w, r.height / part.h)
          part.w = r.width
          part.h = r.height
        })
      })
      parts.forEach(({ el }) => observer.observe(el))
    }

    // Dragging is done here rather than with matter's MouseConstraint. The
    // constraint never took hold: measured, a 168px drag moved the pill 24px at
    // stiffness 0.28 and 0px at 0.9 — its mouse maps page coordinates through the
    // element it was created on, and this box lives inside a fixed, portalled
    // layer. Pointer events on the pill itself have no such assumption, and they
    // also give the one thing a link needs: the difference between a drag and a
    // click.
    const HELD = new Map()
    const DRAG_SLOP = 6

    function onDown(e) {
      if (!canDrag()) return
      const hit = parts.find(p => p.el === e.currentTarget)
      if (!hit) return
      // Deliberately NOT setPointerCapture. Capturing on the wrapper made every
      // later event target the wrapper, so the LINK inside it never saw the
      // pointerup — and a click needs its down and its up on the same element.
      // Measured: a plain tap on a pill opened nothing. The move and up are
      // followed on the window instead, which also keeps a drag alive when the
      // pointer leaves the pill.
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
      const r = box.getBoundingClientRect()
      HELD.set(e.pointerId, {
        hit,
        // Grabbed where it was actually taken hold of, so the pill does not jump
        // its own centre under the pointer.
        dx: hit.body.position.x - (e.clientX - r.left),
        dy: hit.body.position.y - (e.clientY - r.top),
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
      })
      Body.setStatic(hit.body, true)
      // An item that opens on hover must not open and close while it is being
      // held: the pointer leaves it the moment it is dragged, it collapses, the
      // body is rescaled under the pointer and the whole thing skates away —
      // measured, a straight 120px drag up also threw the pill 254px sideways and
      // it read as un-grabbable. Held items are pinned open.
      hit.el.classList.add('is-held')
    }

    function onMove(e) {
      const held = HELD.get(e.pointerId)
      if (!held) return
      const r = box.getBoundingClientRect()
      if (Math.hypot(e.clientX - held.x, e.clientY - held.y) > DRAG_SLOP) held.moved = true
      Body.setPosition(held.hit.body, {
        x: e.clientX - r.left + held.dx,
        y: e.clientY - r.top + held.dy,
      })
      held.vx = e.clientX - held.lastX
      held.vy = e.clientY - held.lastY
      held.lastX = e.clientX
      held.lastY = e.clientY
    }

    function onUp(e) {
      const held = HELD.get(e.pointerId)
      if (!held) return
      HELD.delete(e.pointerId)
      if (!HELD.size) {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      }
      held.hit.el.classList.remove('is-held')
      Body.setStatic(held.hit.body, false)
      // Thrown, not dropped: the last pointer step becomes the body's velocity,
      // so a flick sends it across the box.
      Body.setVelocity(held.hit.body, { x: (held.vx ?? 0) * 0.9, y: (held.vy ?? 0) * 0.9 })
      Body.setAngularVelocity(held.hit.body, ((held.vx ?? 0) / 200) * -1)
      if (!held.moved) return
      // It was a drag, so the click that follows it is not a request to open the
      // link. Swallowed once, and the listener taken off again if no click comes.
      const swallow = ev => {
        ev.preventDefault()
        ev.stopPropagation()
      }
      held.hit.el.addEventListener('click', swallow, { capture: true, once: true })
      window.setTimeout(() => held.hit.el.removeEventListener('click', swallow, { capture: true }), 300)
    }

    parts.forEach(({ el }) => el.addEventListener('pointerdown', onDown))

    if (level) {
      Matter.Events.on(engine, 'afterUpdate', () => {
        parts.forEach(({ body }) => {
          if (body.isStatic) return
          // Still travelling, still being thrown, or still spinning fast: left
          // alone. Only a settled body is turned, and gently — the first term
          // bleeds the spin off, the second pulls the angle back to level.
          if (body.speed > 0.8 || Math.abs(body.angularVelocity) > 0.06) return
          if (Math.abs(body.angle) < 0.01) return
          Body.setAngularVelocity(body, body.angularVelocity * 0.9 - body.angle * 0.03)
        })
      })
    }

    const runner = Runner.create()
    Runner.run(runner, engine)

    // Read-only. See the note at the top: the world is stepped by the runner and
    // nowhere else.
    let raf = 0
    const paint = () => {
      parts.forEach(({ el, body }) => {
        // Centred by the element's OWN box (-50%), not by the measured w/h.
        // While a pill animates its width the measurement is always a frame
        // stale — the observer fires after layout — and `x - w/2` computed from
        // the old width walked the pill sideways a few px every frame of the
        // slide. Percentages resolve against the box as it is THIS frame.
        el.style.transform = `translate(${body.position.x}px, ${body.position.y}px) translate(-50%, -50%) rotate(${body.angle}rad)`
      })
      raf = requestAnimationFrame(paint)
    }
    paint()

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
      parts.forEach(({ el }) => el.removeEventListener('pointerdown', onDown))
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      Runner.stop(runner)
      World.clear(engine.world, false)
      Engine.clear(engine)
      parts.forEach(({ el }) => {
        el.style.position = ''
        el.style.left = ''
        el.style.top = ''
        el.style.width = ''
        el.style.height = ''
        el.style.transform = ''
        el.style.willChange = ''
      })
    }
  }, [ready, gravity, dragStiffness, restitution, resize, entry, level])

  // Held separately from the world's own effect, so pulling the floor does not
  // rebuild the world underneath the pills that are standing on it.
  useEffect(() => {
    if (!openFloor || !worldRef.current || !floorRef.current) return
    Matter.World.remove(worldRef.current, floorRef.current)
    floorRef.current = null
  }, [openFloor, ready])

  return (
    // Laid out but not SHOWN until the world takes over. Held back by `delay`, the
    // pills stood in their flex layout for as long as the delay lasted and then
    // jumped to wherever the physics put them — which read as a flicker, or as the
    // page changing, rather than as one continuous fall. `visibility` rather than
    // display or opacity: they still have to be laid out, because the layout is
    // what every body is measured from.
    <div ref={boxRef} className={className} style={{ visibility: ready ? 'visible' : 'hidden' }}>
      {children.map((child, i) => (
        <div
          key={i}
          ref={el => {
            itemRefs.current[i] = el
          }}
          className={itemClassName}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
