// -----------------------------------------------------------------------------
// site.js
// Content for the non-project sections in the Figma design: the hero
// ("NATTAPONG") and the Contact screen, plus the top navigation labels.
// The shared isometric illustration is the asset exported from the Figma file.
// -----------------------------------------------------------------------------

export const SHARED_IMAGE = '/room.png'

export const nav = [
  { id: 'hero', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

// Personal avatar shown on the hero + contact screens. Drop a real photo at
// /public/me.jpg (or change this path); until then it falls back to the initial.
export const AVATAR = '/me.jpg'

export const hero = {
  id: 'hero',
  name: 'NATTAPONG',
  title: 'UX/UI Designer & Frontend Developer',
  subtitle: 'Crafting calm, human-centered products across mobile and web.',
  image: SHARED_IMAGE,
  avatar: AVATAR,
}

export const contact = {
  id: 'contact',
  name: 'Contact',
  title: 'Let’s build something together.',
  subtitle: 'nattapong.teero@gmail.com',
  image: SHARED_IMAGE,
  avatar: AVATAR,
  links: [
    { label: 'Email', url: 'mailto:nattapong.teero@gmail.com' },
    { label: 'LinkedIn', url: '#' },
    { label: 'GitHub', url: '#' },
    { label: 'Dribbble', url: '#' },
  ],
}
