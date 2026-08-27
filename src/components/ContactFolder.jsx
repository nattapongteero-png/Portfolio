// -----------------------------------------------------------------------------
// ContactFolder.jsx
// The Contact screen's folder. Closed it is a folder; opened, its papers are the
// places you can actually reach me. The white paper carries Instagram, and it
// only shows the handle on hover — the folder reads as a set of labels at a
// glance, and the address is the thing you look closer for.
// -----------------------------------------------------------------------------

import { useState } from 'react'
import Folder from './Folder'
import PillNav from './PillNav'
import { contact } from '../data/site'

// The paper is a fixed 90% × 60% of a 100 × 80 folder, so at size 2 it is about
// 180 × 96 — enough for the pill, and small enough that the papers still have
// somewhere to fly to when the folder opens.
const FOLDER_SIZE = 2

function InstagramPaper() {
  const [hover, setHover] = useState(false)
  return (
    <div
      className="grid h-full w-full place-items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // The paper is drawn inside a scaled folder, so everything in it is scaled
      // too. Undoing the scale on the contents keeps the type at its real size
      // instead of a blown-up 16px.
      style={{ transform: `scale(${1 / FOLDER_SIZE})`, width: `${FOLDER_SIZE * 100}%`, height: `${FOLDER_SIZE * 100}%` }}
    >
      {hover ? (
        <PillNav
          items={[{ label: contact.instagram.handle, href: contact.instagram.url, target: '_blank' }]}
          baseColor="#111111"
          pillColor="#ffffff"
          pillTextColor="#111111"
          hoveredPillTextColor="#ffffff"
          initialLoadAnimation={false}
        />
      ) : (
        <span className="text-[15px] font-semibold tracking-tight text-[#21221f]">Instagram</span>
      )}
    </div>
  )
}

export default function ContactFolder({ color = '#111111' }) {
  return (
    // The folder scales from its own centre and its papers fly upward when it
    // opens, so it is given a box tall enough to hold both and parked at the
    // bottom of it — otherwise the open state is drawn off the top of the page.
    <div className="flex h-[200px] w-[240px] items-end">
    <Folder
      size={FOLDER_SIZE}
      color={color}
      // Only the white paper — the third — carries anything so far. The other two
      // stay blank rather than being filled with placeholder links.
      items={[null, null, <InstagramPaper key="ig" />]}
    />
    </div>
  )
}
