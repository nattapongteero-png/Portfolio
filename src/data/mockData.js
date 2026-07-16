// -----------------------------------------------------------------------------
// mockData.js
// Central content source for the portfolio "feed".
//
// Each project is a self-contained object shaped for two views:
//   1. The Feed card  -> uses: title, tagline, cover, techStack, stats, accent
//   2. The Profile detail -> uses: avatar, handle, bio, links, and `tabs`
//
// `tabs` is an ordered array. Each tab has an `id`, a `label`, and `blocks`.
// A block is a small typed content node so the detail view can render mixed
// media (rich text, image grids, stat rows, code, quotes) without bespoke
// components per project. To add a project, copy one object and edit — the UI
// adapts automatically.
//
// Block types supported by <TabContent />:
//   { type: 'heading',   text }
//   { type: 'paragraph', text }
//   { type: 'list',      items: [] }
//   { type: 'stats',     items: [{ label, value }] }
//   { type: 'images',    items: [{ src, caption }] }
//   { type: 'quote',     text, author }
//   { type: 'code',      language, code }
//   { type: 'tags',      items: [] }
// -----------------------------------------------------------------------------

// Lightweight inline SVG placeholders (no external assets needed to run).
const cover = (from, to, label) =>
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${from}"/>
          <stop offset="1" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#g)"/>
      <text x="50%" y="50%" fill="rgba(255,255,255,0.14)" font-family="Inter,sans-serif"
        font-size="140" font-weight="800" text-anchor="middle">${label}</text>
    </svg>`
  )

const thumb = (color, label) =>
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
      <rect width="600" height="600" fill="${color}"/>
      <text x="50%" y="50%" fill="rgba(255,255,255,0.55)" font-family="Inter,sans-serif"
        font-size="44" font-weight="700" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`
  )

export const projects = [
  // ---------------------------------------------------------------------------
  {
    id: 'myatlas',
    tab: 'Health',
    title: 'MyAtlas',
    tagline: 'A calm medication companion that patients actually keep using.',
    handle: '@myatlas.health',
    accent: '#FE2C55',
    cover: cover('#2b1055', '#7597de', 'MyAtlas'),
    // Optional video: if `video` is set the card plays it instead of the image.
    video: null,
    avatar: thumb('#7597de', 'MA'),
    bio: 'Health · Mobile app · Flutter. MyAtlas เกิดจากคำถามง่าย ๆ ว่า ทำไมแอปเตือนกินยาส่วนใหญ่ถึงทำให้คนรู้สึกผิดมากกว่าได้รับกำลังใจ เราออกแบบให้การกินยาแต่ละวันเป็นพิธีกรรมเล็ก ๆ ที่อ่อนโยน ไม่ใช่การถูกจับผิด ตั้งแต่การเตือนที่นุ่มนวล ระบบเติมยาอัตโนมัติก่อนยาหมด 3 วัน ไปจนถึงคลังข้อมูลยาที่เขียนด้วยภาษาที่เข้าใจง่ายเหมือนเพื่อนอธิบายให้ฟัง ไม่ใช่ศัพท์เภสัชกรที่ชวนสับสน พร้อมโหมดสำหรับผู้ดูแลที่ให้ครอบครัวเห็นภาพรวมได้แบบสบายใจโดยไม่ก้าวก่าย',
    stats: { likes: '12.4k', comments: 328, shares: 891, saves: '2.1k' },
    techStack: ['Flutter', 'Dart', 'Riverpod', 'Figma', 'Supabase'],
    links: [{ label: 'Case study', url: '#' }, { label: 'Prototype', url: '#' }],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        blocks: [
          { type: 'heading', text: 'The problem' },
          {
            type: 'paragraph',
            text: 'Half of people on long-term medication stop taking it correctly within a year. Existing reminder apps feel clinical and nag the user. MyAtlas reframes adherence as a gentle daily ritual.',
          },
          {
            type: 'stats',
            items: [
              { label: 'Design sprint', value: '6 wks' },
              { label: 'Screens', value: '42' },
              { label: 'Test rounds', value: '3' },
              { label: 'Adherence lift', value: '+31%' },
            ],
          },
          { type: 'tags', items: ['Product design', 'iOS', 'Android', 'Design system'] },
        ],
      },
      {
        id: 'research',
        label: 'Research & UX',
        blocks: [
          { type: 'heading', text: 'Who we talked to' },
          {
            type: 'paragraph',
            text: 'We interviewed 14 patients aged 24–71 managing chronic conditions, plus 3 caregivers. The recurring theme: shame, not forgetfulness, drives drop-off.',
          },
          {
            type: 'list',
            items: [
              'Users want reassurance, not red alerts.',
              'Refill anxiety spikes 3 days before running out.',
              'Caregivers need a read-only "peace of mind" view.',
            ],
          },
          {
            type: 'quote',
            text: 'I don’t need another app yelling at me. I need one that tells me I’m doing fine.',
            author: 'Participant P07, 58',
          },
        ],
      },
      {
        id: 'ui',
        label: 'UI Design',
        blocks: [
          { type: 'heading', text: 'A softer visual language' },
          {
            type: 'paragraph',
            text: 'Rounded cards, a muted lavender palette, and a single accent for the daily "streak". Nothing red unless it truly matters.',
          },
          {
            type: 'images',
            items: [
              { src: thumb('#7597de', 'Home'), caption: 'Daily home' },
              { src: thumb('#5b6ee1', 'Library'), caption: 'Med library' },
              { src: thumb('#8a7fd4', 'Refill'), caption: 'Refill flow' },
              { src: thumb('#6a5acd', 'Streak'), caption: 'Streak view' },
            ],
          },
        ],
      },
      {
        id: 'dev',
        label: 'Code & Dev',
        blocks: [
          { type: 'heading', text: 'Built with Flutter + Riverpod' },
          {
            type: 'paragraph',
            text: 'A single theme source drives light/dark. The reminder engine schedules local notifications with timezone-aware offsets.',
          },
          {
            type: 'code',
            language: 'dart',
            code: `final reminderProvider =
    StateNotifierProvider<ReminderCtrl, List<Dose>>((ref) {
  final tz = ref.watch(timezoneProvider);
  return ReminderCtrl(tz)..scheduleToday();
});`,
          },
          { type: 'tags', items: ['Flutter', 'Riverpod', 'flutter_local_notifications'] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'metaherb',
    tab: 'Herbal',
    title: 'Metaherb',
    tagline: 'Turning traditional Thai herbal knowledge into a modern marketplace.',
    handle: '@metaherb',
    accent: '#25F4EE',
    cover: cover('#0f3d3e', '#0aa47c', 'Metaherb'),
    video: null,
    avatar: thumb('#0aa47c', 'MH'),
    bio: 'E-commerce · React Native + Web. A cross-platform storefront that respects heritage and moves product.',
    stats: { likes: '8.9k', comments: 210, shares: 540, saves: '1.4k' },
    techStack: ['React Native', 'Next.js', 'TypeScript', 'Node', 'Stripe'],
    links: [{ label: 'Live site', url: '#' }, { label: 'App store', url: '#' }],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        blocks: [
          { type: 'heading', text: 'Heritage meets commerce' },
          {
            type: 'paragraph',
            text: 'Metaherb sells traditional Thai herbal remedies to a younger, mobile-first audience while preserving the story behind each ingredient.',
          },
          {
            type: 'stats',
            items: [
              { label: 'Platforms', value: '3' },
              { label: 'SKUs', value: '180+' },
              { label: 'Checkout time', value: '-40%' },
              { label: 'Conversion', value: '+18%' },
            ],
          },
          { type: 'tags', items: ['E-commerce', 'Cross-platform', 'Branding'] },
        ],
      },
      {
        id: 'research',
        label: 'Research & UX',
        blocks: [
          { type: 'heading', text: 'Two audiences, one funnel' },
          {
            type: 'paragraph',
            text: 'Older buyers trust the tradition; younger buyers trust reviews and speed. We designed a flow that serves both without alienating either.',
          },
          {
            type: 'list',
            items: [
              'Ingredient stories reduce first-purchase hesitation.',
              'Guest checkout cut abandonment by a third.',
              'Bilingual TH/EN toggle is non-negotiable.',
            ],
          },
        ],
      },
      {
        id: 'ui',
        label: 'UI Design',
        blocks: [
          { type: 'heading', text: 'Earthy, premium, legible' },
          {
            type: 'images',
            items: [
              { src: thumb('#0aa47c', 'Shop'), caption: 'Storefront' },
              { src: thumb('#0f8a6a', 'Product'), caption: 'Product page' },
              { src: thumb('#127d63', 'Cart'), caption: 'Cart' },
            ],
          },
          {
            type: 'paragraph',
            text: 'A warm green system with generous whitespace signals both nature and trust.',
          },
        ],
      },
      {
        id: 'dev',
        label: 'Code & Dev',
        blocks: [
          { type: 'heading', text: 'Shared logic, native shells' },
          {
            type: 'paragraph',
            text: 'A shared TypeScript domain layer powers both the Next.js web app and the React Native app, keeping cart and pricing rules in one place.',
          },
          {
            type: 'code',
            language: 'typescript',
            code: `export function priceWithTax(cart: Cart, region: Region) {
  const subtotal = cart.items.reduce((n, i) => n + i.price * i.qty, 0);
  return subtotal * (1 + TAX_TABLE[region]);
}`,
          },
          { type: 'tags', items: ['Turborepo', 'Next.js', 'Expo', 'Stripe'] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'vetcare',
    tab: 'Pets',
    title: 'VetCare',
    tagline: 'Booking, records, and reminders for pet clinics — in one dashboard.',
    handle: '@vetcare.app',
    accent: '#8b5cf6',
    cover: cover('#3a0ca3', '#f72585', 'VetCare'),
    video: null,
    avatar: thumb('#8b5cf6', 'VC'),
    bio: 'SaaS · Web dashboard. Appointment scheduling and pet health records for small veterinary practices.',
    stats: { likes: '15.2k', comments: 402, shares: 1103, saves: '3.3k' },
    techStack: ['React', 'Tailwind', 'Node', 'PostgreSQL', 'Prisma'],
    links: [{ label: 'Demo', url: '#' }, { label: 'GitHub', url: '#' }],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        blocks: [
          { type: 'heading', text: 'Less admin, more animals' },
          {
            type: 'paragraph',
            text: 'Small clinics juggle paper calendars and phone tag. VetCare consolidates booking, patient records, and automated reminders into one calm dashboard.',
          },
          {
            type: 'stats',
            items: [
              { label: 'Clinics piloted', value: '7' },
              { label: 'No-shows', value: '-52%' },
              { label: 'Setup', value: '10 min' },
              { label: 'NPS', value: '68' },
            ],
          },
          { type: 'tags', items: ['SaaS', 'Dashboard', 'B2B'] },
        ],
      },
      {
        id: 'research',
        label: 'Research & UX',
        blocks: [
          { type: 'heading', text: 'Watching the front desk' },
          {
            type: 'paragraph',
            text: 'We shadowed reception staff during peak hours. The biggest pain wasn’t booking — it was context-switching between three tools.',
          },
          {
            type: 'quote',
            text: 'If I can’t do it in two clicks between phone calls, I won’t do it at all.',
            author: 'Clinic manager, pilot #3',
          },
        ],
      },
      {
        id: 'ui',
        label: 'UI Design',
        blocks: [
          { type: 'heading', text: 'Dense, but never noisy' },
          {
            type: 'images',
            items: [
              { src: thumb('#8b5cf6', 'Calendar'), caption: 'Day calendar' },
              { src: thumb('#a855f7', 'Record'), caption: 'Pet record' },
              { src: thumb('#7c3aed', 'Reminder'), caption: 'Reminders' },
              { src: thumb('#9333ea', 'Reports'), caption: 'Reports' },
            ],
          },
        ],
      },
      {
        id: 'dev',
        label: 'Code & Dev',
        blocks: [
          { type: 'heading', text: 'Type-safe from DB to UI' },
          {
            type: 'paragraph',
            text: 'Prisma models flow through a typed API layer to the React front end, so a schema change surfaces as a compile error, not a production bug.',
          },
          {
            type: 'code',
            language: 'typescript',
            code: `model Appointment {
  id        String   @id @default(cuid())
  petId     String
  startsAt  DateTime
  status    Status   @default(BOOKED)
  pet       Pet      @relation(fields: [petId], references: [id])
}`,
          },
          { type: 'tags', items: ['React', 'Prisma', 'PostgreSQL', 'tRPC'] },
        ],
      },
    ],
  },
]

export default projects
