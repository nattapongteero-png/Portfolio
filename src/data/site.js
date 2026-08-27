// -----------------------------------------------------------------------------
// site.js
// Content for the non-project sections in the Figma design: the hero
// ("NATTAPONG") and the Contact screen, plus the top navigation labels.
// The shared isometric illustration is the asset exported from the Figma file.
// -----------------------------------------------------------------------------

// BASE_URL-aware so assets resolve under GitHub Pages' /Portfolio/ base too.
export const SHARED_IMAGE = `${import.meta.env.BASE_URL}room.png`

export const nav = [
  { id: 'hero', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

// Personal avatar shown on the hero + contact screens. Drop a real photo at
// /public/me.jpg (or change this path); until then it falls back to the initial.
export const AVATAR = `${import.meta.env.BASE_URL}me.jpg`

export const hero = {
  id: 'hero',
  name: 'NATTAPONG',
  // The corner block on the feed: the role over the full name. `name` stays the
  // one-word display title the hero section itself is built on.
  role: 'UX/UI Designer',
  fullName: 'Nattapong Teeropast',
  // What people actually call him — the second line on the pass, under the full
  // name. Same name the Pawmely team list uses for the same person.
  nickname: 'Mick',
  // The colour this section answers to in the menu. The hero page is black on
  // white, so its ink is its colour.
  accent: '#111111',
  title: 'UX/UI Designer & Frontend Developer',
  subtitle: 'Crafting calm, human-centered products across mobile and web.',
  image: SHARED_IMAGE,
  avatar: AVATAR,
}

export const contact = {
  id: 'contact',
  accent: '#1d8b6b',
  name: 'Contact',
  title: 'Let’s build something together.',
  subtitle: 'nattapong.teero@gmail.com',
  image: SHARED_IMAGE,
  avatar: AVATAR,
  // The one social account this site actually names.
  // ntpmick, not mtpmick — the handle here disagreed with `igHandle` and `igUrl`
  // below, which are the ones the contact pills use. This one pointed at an
  // account that is not this one.
  instagram: { handle: 'ig : ntpmick', url: 'https://instagram.com/ntpmick' },
  // Printed on the pass on the home screen. Kept here so the badge reads the
  // same record as the rest of the site rather than carrying its own copy.
  igHandle: 'ntpmick',
  // On the back of the pass, and therefore PUBLIC once the site is deployed —
  // this is the one field here that cannot be taken back once it is out.
  phone: '0946707447',
  phoneDisplay: '094-670-7447',
  // LinkedIn. NO REAL URL YET — the profile address has never been given, so the
  // contact page renders its pill as plain text rather than as a link that goes
  // nowhere. Put the profile URL here and it becomes a link with no other change.
  linkedinUrl: '',
  // Where the badge's IG arrow goes. The account's own share link, kept whole:
  // trimming the query is a guess about what Instagram needs it for.
  igUrl: 'https://www.instagram.com/ntpmick?igsh=emhxY2hocmlncmw5&igsi=emhxY2hocmlncmw5&utm_source=qr',
  links: [
    { label: 'Email', url: 'mailto:nattapong.teero@gmail.com' },
    { label: 'LinkedIn', url: '#' },
    { label: 'GitHub', url: '#' },
    { label: 'Dribbble', url: '#' },
  ],
}
