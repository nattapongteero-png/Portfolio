// -----------------------------------------------------------------------------
// reveal.js
// Every page change on this site is the SAME move: the page you are going to
// grows out of the thing you pressed. Nothing ever shrinks — a page that closes
// by collapsing into a button reads as the old page leaving, and what should be
// read is the new one arriving.
//
// That means the animation belongs to the ARRIVING layer, which is not the layer
// handling the press: closing the profile is played by the feed underneath it.
// This is the one line between them — the layer that is about to be seen listens,
// and the control that was pressed asks.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import { coverRadius, pointerOrigin } from './pointerOrigin'

const listeners = new Map()

// `channel` names the layer that should play, not the one that asked.
export function requestReveal(channel, origin = pointerOrigin()) {
  listeners.get(channel)?.forEach((fn) => fn(origin))
}

// Two beats, not one. A single ease from nothing to full screen reads as one long
// slide; split, the page LEAVES the press quickly and then takes its time filling
// the screen — the first beat says which control you pressed, the second gives the
// arriving page room to be looked at.
const BEATS = [
  // Off the press. The duration has to be the time it VISUALLY takes, not a
  // longer number with a curve that arrives early: measured per frame, an ease of
  // (.22,1,.36,1) over 460ms had stopped moving by 330 and the next beat was
  // still scheduled off 460 — so the pause the eye got was 240ms, not the 110 it
  // was set to. This curve travels for its whole duration.
  { to: 0.17, ms: 340, ease: 'cubic-bezier(.34,.86,.5,1)' },
  // Across the screen: long and even, decelerating into the edges.
  { to: 1, ms: 780, ease: 'cubic-bezier(.45,0,.25,1)' },
]
// The pause between them. Without it the two curves join into one and the split
// cannot be felt; longer and it reads as a stall.
const BEAT_GAP = 100

export const REVEAL_MS = BEATS.reduce((t, b) => t + b.ms, 0) + BEAT_GAP

// The beats, published so a gesture can be played ON them. The pass is pulled in
// two tugs and this transition opens in two beats; they are the same two beats,
// and anything that has to land with them reads these rather than keeping its own
// copy of the numbers.
export const REVEAL_BEATS = {
  first: BEATS[0].ms,
  gap: BEAT_GAP,
  second: BEATS[1].ms,
  secondAt: BEATS[0].ms + BEAT_GAP,
}

// The page grows out of a point, always a circle — the one move every page change
// on this site makes. `p` runs 0 → 1.
function clipFor(o, p) {
  return `circle(${coverRadius(o) * p}px at ${o.x}px ${o.y}px)`
}

export function useReveal(channel, { start = false, origin: seed = null } = {}) {
  const [clip, setClip] = useState(() => (start ? { o: seed ?? pointerOrigin(), p: 0 } : null))
  const steps = useRef([])

  const play = useCallback((origin = seed ?? pointerOrigin()) => {
    steps.current.forEach(window.clearTimeout)
    steps.current = []
    // Two frames before the first beat: the first paints the layer clipped to
    // nothing at the press, the second gives it somewhere to travel to. Set in one
    // pass the browser has no start value to animate from and the page just
    // appears.
    setClip({ o: origin, p: 0, ms: 0, ease: 'linear' })
    // ONE frame, not two. Two put ~60ms of stillness between the press and any
    // movement — measured: the page had already swapped and the circle sat at 0
    // for four frames — which is what made the press and the motion read as two
    // unrelated events.
    requestAnimationFrame(() => setClip({ o: origin, p: BEATS[0].to, ...BEATS[0] }))
    steps.current.push(
      window.setTimeout(
        () => setClip({ o: origin, p: BEATS[1].to, ...BEATS[1] }),
        BEATS[0].ms + BEAT_GAP
      )
    )
    // Dropped afterwards: a clip-path left on a layer keeps it a containing block
    // for anything fixed inside it.
    steps.current.push(window.setTimeout(() => setClip(null), REVEAL_MS + 90))
  }, [seed])

  // A layer that seeded its own clip is appearing right now, so it starts itself:
  // waiting for the component to call `play` in a mount effect cost another
  // round-trip before anything moved.
  //
  // The timers are cleared by THIS effect's cleanup rather than by a separate
  // unmount effect. Under StrictMode every effect runs twice, and a cleanup that
  // lived elsewhere killed the first run's timers while a `started` ref stopped
  // the second run from setting new ones — so the second beat never fired and the
  // reveal stopped dead at 17%.
  useEffect(() => {
    if (!start) return undefined
    play()
    return () => steps.current.forEach(window.clearTimeout)
  }, [start, play])

  useEffect(() => {
    if (!channel) return undefined
    const set = listeners.get(channel) ?? new Set()
    set.add(play)
    listeners.set(channel, set)
    return () => {
      set.delete(play)
    }
  }, [channel, play])

  const style = clip
    ? {
        clipPath: clipFor(clip.o, clip.p),
        transition: `clip-path ${clip.ms}ms ${clip.ease}`,
        willChange: 'clip-path',
      }
    : undefined

  return { style, play, revealing: clip != null }
}
