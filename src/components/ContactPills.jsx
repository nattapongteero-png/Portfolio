// -----------------------------------------------------------------------------
// ContactPills.jsx
// The four channels, as pills that DROP into whatever box they are given and can
// be shoved around afterwards — React Bits' FallingText feel run through
// PhysicsPills, wearing BubbleMenu's own pill styling.
//
// Lifted out of ContactBubbles because there are two places the same drop is
// asked for now: the contact page (reached from the menu), and the home screen
// itself, where turning the pass over drops them in place instead of changing
// page. One list of channels, one pill, one set of physics numbers.
// -----------------------------------------------------------------------------

import { useLayoutEffect, useRef, useState } from 'react'
import { Phone } from 'lucide-react'
import PhysicsPills from './PhysicsPills'
import { contact } from '../data/site'
// The real marks, in their own colours — the same files the pass prints on its
// front. Phone is the one channel with no mark to print, so it takes a handset
// glyph from the icon set the site already uses.
import instagramLogo from '../assets/instagram-1024px.webp'
import linkedinLogo from '../assets/linkedin-1024px.webp'
import gmailLogo from '../assets/gmail-2026-1024px.webp'
import './ContactBubbles.css'

// The channels, in the order the card lists them. `label` is what the pill says —
// short, because a pill is set at 4rem and a long label would be a smear.
// `brand` picks the pill's colour: each one wears its own service's colour rather
// than the one white pill the menu used, so the list is readable as a set of
// channels at a glance instead of four identical lozenges.
export const ITEMS = [
  {
    brand: 'instagram',
    logo: instagramLogo,
    label: 'instagram',
    // What the hover shows instead of the service's name: the ACCOUNT on it —
    // the thing you actually reach by pressing.
    account: contact.igHandle,
    href: contact.igUrl,
    ariaLabel: `Instagram · ${contact.igHandle}`,
  },
  {
    brand: 'linkedin',
    logo: linkedinLogo,
    label: 'linkedin',
    // No profile URL on record — see site.js. Without one this renders as a pill
    // you can still shove around, but not as a link: a link to '#' would jump the
    // page to its own top and read as broken. No URL also means no account to
    // show on hover, so this pill keeps its name.
    href: contact.linkedinUrl || null,
    ariaLabel: 'LinkedIn',
  },
  {
    brand: 'email',
    logo: gmailLogo,
    label: 'email',
    account: contact.subtitle,
    href: `mailto:${contact.subtitle}`,
    ariaLabel: `Email · ${contact.subtitle}`,
  },
  {
    brand: 'phone',
    label: 'phone',
    account: contact.phoneDisplay,
    href: `tel:${contact.phone}`,
    ariaLabel: `Phone · ${contact.phoneDisplay}`,
  },
]

// The same arrow the pass wears at the end of its contact rows — this row leaves
// the site. It is in the pill from the first layout pass and only FADES in on
// hover, never appears: the physics bodies are measured once, before anything
// moves, so a mark that changed the pill's width on hover would leave the pill
// drawn wider than the body it is being positioned by.
function LeaveMark() {
  return (
    <svg className="contact-pill__mark" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M8 16 L16 8 M9.5 8 H16 V14.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// The label swap, driven by MEASURED widths instead of grid fr-tracks. The
// fr-track version was never smooth: the browser re-resolves the track against
// max-content every frame, the physics body re-scales a frame behind it, and
// the two labels sheared and blinked. Here both labels are laid out once,
// absolutely, their widths read off the DOM, and the wrapper tweens between the
// two known numbers — one width animation, one crossfade, nothing measured
// mid-flight.
function SwapLabel({ name, account, hovered }) {
  const nameRef = useRef(null)
  const accountRef = useRef(null)
  const [w, setW] = useState(null)
  useLayoutEffect(() => {
    const measure = () =>
      setW({ name: nameRef.current?.offsetWidth ?? 0, account: accountRef.current?.offsetWidth ?? 0 })
    measure()
    // Widths shift once the webfont lands.
    document.fonts?.ready.then(measure)
  }, [name, account])
  return (
    <span
      className="contact-pill__swap"
      style={w ? { width: hovered ? w.account : w.name } : undefined}
    >
      <span ref={nameRef} className={`contact-pill__face ${hovered ? 'is-off' : ''}`}>
        {name}
      </span>
      <span ref={accountRef} className={`contact-pill__face contact-pill__face--account ${hovered ? '' : 'is-off'}`}>
        {account}
        <LeaveMark />
      </span>
    </span>
  )
}

export default function ContactPills({ delay = 0, leaving = false }) {
  // Which pill the pointer is on. React state rather than CSS :hover because
  // the width the swap animates to is a measured number, not a stylesheet one.
  const [hovered, setHovered] = useState(null)
  return (
    <PhysicsPills
      // Held until whatever brought them on has finished — a drop you do not see
      // happen is just a layout. The caller knows how long that is.
      delay={delay}
      // They come in from above the box rather than appearing inside it, and
      // stand up once they have stopped — a pill that comes to rest on its side
      // reads as broken, since it carries a logo and a word.
      entry="above"
      level
      // On the way out the floor is pulled and they drop off the bottom of the
      // screen — the same fall that brought them in, run the other way.
      openFloor={leaving}
      // The same numbers the component card's tag pills fall with — that drop
      // reads as objects landing, and holding these level (which is what they
      // used to do) made them read as one rigid block coming down. They tumble
      // and lean now, logos included.
      gravity={1.1}
      restitution={0.25}
      // The pills open on hover, so their bodies have to open with them.
      resize
      // The box spans the whole screen so the fall starts at the top of it — so it
      // must not take presses on its own, or it would swallow every tap meant for
      // the pass hanging behind it. Only the pills themselves are pressable.
      className="pointer-events-none relative h-full w-full overflow-hidden flex flex-wrap items-start justify-center gap-x-6 gap-y-4 px-6 pt-6"
      itemClassName="pointer-events-auto touch-none select-none cursor-grab active:cursor-grabbing"
    >
      {ITEMS.map(item => {
        const Tag = item.href ? 'a' : 'span'
        return (
          <Tag
            key={item.label}
            {...(item.href ? { href: item.href, 'aria-label': item.ariaLabel } : {})}
            onPointerEnter={() => setHovered(item.brand)}
            onPointerLeave={() => setHovered(h => (h === item.brand ? null : h))}
            className={`contact-pill contact-pill--${item.brand}`}
          >
            {/* The mark rides in a white disc. The pill is the brand's own colour,
                and a full-colour logo laid straight on it is unreadable —
                Instagram's gradient mark on Instagram's gradient pill disappears
                entirely. */}
            <span className="contact-pill__chip" aria-hidden>
              {item.logo ? <img src={item.logo} alt="" /> : <Phone strokeWidth={2.2} />}
            </span>
            {/* The name at rest, the ACCOUNT under the pointer — hovering a
                channel answers "reach me WHERE exactly". Pills that carry no
                account (LinkedIn, until a URL exists) keep their name. */}
            {item.account ? (
              <SwapLabel
                name={item.label}
                account={item.account}
                hovered={hovered === item.brand}
              />
            ) : (
              <>
                {item.label}
                {/* No account to swap to (LinkedIn, until a URL exists): the
                    arrow keeps its own sliding track. */}
                <span className="contact-pill__arrow">
                  <span>
                    <LeaveMark />
                  </span>
                </span>
              </>
            )}
          </Tag>
        )
      })}
    </PhysicsPills>
  )
}
