// -----------------------------------------------------------------------------
// PageTitle.jsx
// The heading a PAGE wears — the project profile, the reel, contact, training.
// Left-aligned, bold, and sharing its row with the back button in front of it:
// the button opens the row at 32 — the same viewport x the feed's own section
// title starts at — and the title follows 24 after it. The pair reads as one
// line, and the line begins where the feed's heading begins.
//
// The offset is the whole point. Left inside the centred 1600 shell the title
// sat at x280 at 1920 and x120 at 1440 — two different places. Pulling it back
// out by the shell's own overhang holds it at 104 on every screen.
// -----------------------------------------------------------------------------

export default function PageTitle({ children, className = '' }) {
  return (
    <h1
      className={`truncate pb-3 text-3xl font-bold leading-none tracking-tight text-[#21221f] sm:text-5xl md:ml-[calc(-16px-max(0px,(100vw-1600px)/2))] md:text-7xl ${className}`}
    >
      {children}
    </h1>
  )
}
