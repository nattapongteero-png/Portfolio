// -----------------------------------------------------------------------------
// contactPage.js
// One way in to the contact page, for the two things that ask for it: turning the
// pass over, and picking Contact in the menu. Both are far apart in the tree — the
// card lives inside the hero section, the menu lives above the whole feed — and
// the page itself is portalled out of both, so they meet here rather than by
// threading state through everything in between.
//
// The origin travels with the request: the curtain has to start where the gesture
// did, which for the card is the point its strap hangs from and for the menu is
// the row that was pressed.
// -----------------------------------------------------------------------------

const listeners = new Set()

export function openContact(origin = null) {
  listeners.forEach(fn => fn(origin))
}

export function onOpenContact(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// The other way to answer "Contact": not a page, but the hero's own gesture —
// the pass turns over and the channels fall out of it. The menu asks for THIS
// now: it sends the feed home and then asks the card to turn, so picking
// Contact plays exactly what turning the card yourself plays.
const flipListeners = new Set()

export function flipContact() {
  flipListeners.forEach(fn => fn())
}

export function onFlipContact(fn) {
  flipListeners.add(fn)
  return () => flipListeners.delete(fn)
}
