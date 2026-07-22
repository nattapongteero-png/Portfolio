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
    avatar: `${import.meta.env.BASE_URL}myatlas-logo.png`,
    bio: 'Health · Mobile app · Flutter. MyAtlas เกิดจากคำถามง่าย ๆ ว่า ทำไมแอปเตือนกินยาส่วนใหญ่ถึงทำให้คนรู้สึกผิดมากกว่าได้รับกำลังใจ เราออกแบบให้การกินยาแต่ละวันเป็นพิธีกรรมเล็ก ๆ ที่อ่อนโยน ไม่ใช่การถูกจับผิด ตั้งแต่การเตือนที่นุ่มนวล ระบบเติมยาอัตโนมัติก่อนยาหมด 3 วัน ไปจนถึงคลังข้อมูลยาที่เขียนด้วยภาษาที่เข้าใจง่ายเหมือนเพื่อนอธิบายให้ฟัง ไม่ใช่ศัพท์เภสัชกรที่ชวนสับสน พร้อมโหมดสำหรับผู้ดูแลที่ให้ครอบครัวเห็นภาพรวมได้แบบสบายใจโดยไม่ก้าวก่าย',
    stats: { likes: '12.4k', comments: 328, shares: 891, saves: '2.1k' },
    techStack: ['Flutter', 'Dart', 'Riverpod', 'Figma', 'Supabase'],
    // Badges on the profile: what kind of product this is, and its domain.
    kind: 'Mobile app',
    category: 'Health',
    // Live build embedded by the in-page prototype viewer.
    prototypeUrl: 'https://oommiemie.github.io/myatlas_app/',
    // PLACEHOLDERS — these are the only numbers on the site that are not
    // measured from something real. Replace them with the true figures before
    // this ships; a download count is a factual claim about the product.
    team: [
      { name: 'Nattapong T.', role: 'UI/UX · Design System', you: true },
      { name: 'Pimchanok S.', role: 'Product Owner' },
      { name: 'Kittipong R.', role: 'Flutter Developer' },
      { name: 'Warisara P.', role: 'Flutter Developer' },
      { name: 'Thanakrit L.', role: 'QA' },
    ],
    downloads: { value: '12K+', note: 'ติดตั้งสะสม · iOS + Android' },
    tabs: [
      {
        id: 'overview',
        label: 'Project Overview',
        cover: 'overview', // bespoke cover card (see OverviewCover)
        blocks: [
          { type: 'heading', text: 'A calmer medication companion' },
          {
            type: 'paragraph',
            text: 'MyAtlas reframes taking medicine as a small, gentle daily ritual instead of a guilt trip — soft reminders, auto-refill before you run out, and a plain-language drug library.',
          },
          {
            type: 'stats',
            items: [
              { label: 'Platform', value: 'Mobile' },
              { label: 'Built with', value: 'Flutter' },
              { label: 'Refill lead', value: '3 days' },
              { label: 'Care mode', value: 'Yes' },
            ],
          },
          { type: 'tags', items: ['Health', 'Flutter', 'Care'] },
        ],
      },
      {
        id: 'design-system',
        label: 'Design System',
        cardColor: '#c9d14e', // original lime, kept stable regardless of order
        detail: 'feed', // opens as a home-style vertical feed (see FeedSheet)
        detailStart: 'Color', // section focused first when the sheet opens
        // The four topics inside this section. Each is its own card on the
        // profile, and each opens the SAME feed focused on its own panel — so
        // tapping any one of them still lets you scroll through all four, which
        // is the behaviour the rest of the site already has.
        cards: [
          {
            id: 'component',
            label: 'Component',
            color: '#5b6ee0',
            // The card's illustration IS the component list: draggable pills.
            pills: [
            'GlassCard',
            'MetricCard',
            'PrescriptionCard',
            'ActivityRing',
            'CustomTabBar',
            'LiquidGlassButton',
          ],
          },
          { id: 'typography', label: 'Typography', color: '#c9d14e', art: 'typeface' },
          { id: 'color', label: 'Color', color: '#1d8b6b' },
          { id: 'grid', label: 'Grid & Layout', color: '#2f3fc4', art: 'inspect' },
        ],
        // Full type spec — the Typography panel renders straight from this, so
        // the numbers on screen and the numbers in the system are one thing.
        // Straight from the app's own AppTypography (lib/core/theme) — an
        // Apple-HIG-shaped scale. Sizes/weights/line-heights are the real
        // values the build ships, not illustrative ones.
        typography: {
          latin: 'IBM Plex Sans Thai Looped',
          thai: 'IBM Plex Sans Thai Looped',
          classification: 'Sans-serif · Looped Thai · 100–700',
          note: 'ตัวไทยแบบมีหัว อ่านง่ายในขนาดเล็ก ครอบคลุมทั้งไทยและละตินในตระกูลเดียว ตัวเลขใช้ Nunito',
          // The four faces the prototype actually downloads — confirmed by
          // watching its network requests, not by reading a config file.
          weights: [
            { name: 'Regular', value: 400 },
            { name: 'Medium', value: 500 },
            { name: 'SemiBold', value: 600 },
            { name: 'Bold', value: 700 },
          ],
          // Measured off the real TTF: x-height and cap-height as a fraction of
          // the em. A high x-height is why the 11pt caption still holds up.
          metrics: { xHeight: 0.52, capHeight: 0.7 },
          scale: [
            { role: 'Large Title', token: 'largeTitle/34', px: 34, lh: 1.2, weight: 700, tracking: '0', usage: 'ชื่อหน้า', sample: 'MyAtlas' },
            { role: 'Title 1', token: 'title1/28', px: 28, lh: 1.21, weight: 700, tracking: '0', usage: 'หัวข้อหลัก', sample: 'ยาของคุณวันนี้' },
            { role: 'Title 2', token: 'title2/22', px: 22, lh: 1.27, weight: 700, tracking: '0', usage: 'หัวข้อรอง', sample: 'รายการยาวันนี้' },
            { role: 'Title 3', token: 'title3/20', px: 20, lh: 1.25, weight: 600, tracking: '0', usage: 'หัวข้อการ์ด', sample: 'ประวัติการกินยา' },
            { role: 'Headline', token: 'headline/17', px: 17, lh: 1.29, weight: 600, tracking: '0', usage: 'เน้นในเนื้อหา', sample: 'ถึงเวลากินยาแล้ว' },
            { role: 'Body', token: 'body/17', px: 17, lh: 1.29, weight: 400, tracking: '0', usage: 'เนื้อหาหลัก', sample: 'ข้อมูลสุขภาพของคุณ ทั้งหมดในที่เดียว' },
            { role: 'Callout', token: 'callout/16', px: 16, lh: 1.31, weight: 400, tracking: '0', usage: 'ข้อความเสริม', sample: 'แตะเพื่อดูรายละเอียด' },
            { role: 'Subheadline', token: 'subheadline/15', px: 15, lh: 1.33, weight: 400, tracking: '0', usage: 'คำอธิบายรอง', sample: 'ก่อนอาหาร เช้า–เย็น' },
            { role: 'Footnote', token: 'footnote/13', px: 13, lh: 1.38, weight: 400, tracking: '0', usage: 'หมายเหตุ', sample: 'อัปเดตล่าสุด 3 นาทีที่แล้ว' },
            { role: 'Caption 1', token: 'caption1/12', px: 12, lh: 1.33, weight: 400, tracking: '0', usage: 'ป้ายกำกับ', sample: 'ห้องน้ำ ชั้น 2' },
            { role: 'Caption 2', token: 'caption2/11', px: 11, lh: 1.36, weight: 400, tracking: '0', usage: 'ข้อความเล็กสุด', sample: 'เวอร์ชัน 1.0.0' },
          ],
        },
        // Full colour spec — the Color panel renders straight from this. Values
        // are the real ones: read out of the app's own AppColors (lib/core/theme)
        // and cross-checked against the hex literals actually compiled into the
        // build, then confirmed by sampling pixels off the live prototype.
        color: {
          brand: {
            name: 'Atlas Green',
            hex: '#1D8B6B',
            token: 'primary/600',
            harmony: 'Monochromatic green · semantic accents',
            note: 'เขียวเป็นสีแบรนด์เดี่ยว สื่อสุขภาพและความน่าเชื่อถือ สีอื่นทั้งหมดไม่ใช่สีตกแต่ง แต่เป็น status ที่มีความหมายบังคับ',
          },
          groups: [
            {
              name: 'Brand',
              on: '#FFFFFF',
              swatches: [
                { name: 'Primary', hex: '#1D8B6B', token: 'primary/600', usage: 'ปุ่มหลัก · แบรนด์' },
                { name: 'Primary Mid', hex: '#2CA989', token: 'primary/500', usage: 'gradient · hover' },
                { name: 'Primary Soft', hex: '#4AB99C', token: 'primary/400', usage: 'พื้นอ่อน · ไอคอน' },
              ],
            },
            {
              name: 'Surface',
              on: '#1A1A1A', // surfaces are judged by the text that sits ON them
              swatches: [
                { name: 'Background', hex: '#F4F8F5', token: 'bg/primary', usage: 'พื้นหน้าจอ' },
                { name: 'Surface', hex: '#FFFFFF', token: 'bg/surface', usage: 'การ์ด · sheet' },
                { name: 'Warm', hex: '#FAF7F1', token: 'bg/secondary', usage: 'พื้นรอง' },
              ],
            },
            {
              name: 'Text',
              on: '#FFFFFF',
              swatches: [
                { name: 'Primary', hex: '#1A1A1A', token: 'text/primary', usage: 'เนื้อหาหลัก' },
                { name: 'Secondary', hex: '#3E453F', token: 'text/secondary', usage: 'คำอธิบาย' },
                { name: 'Tertiary', hex: '#6D756E', token: 'text/tertiary', usage: 'ป้ายกำกับ' },
              ],
            },
            {
              name: 'Border',
              on: '#FFFFFF',
              swatches: [
                { name: 'Default', hex: '#E5E5E5', token: 'border/default', usage: 'เส้นคั่น · กรอบ' },
                { name: 'Subtle', hex: '#DEDEE0', token: 'border/subtle', usage: 'กรอบจาง' },
              ],
            },
            {
              name: 'Semantic',
              on: '#FFFFFF',
              swatches: [
                { name: 'Success', hex: '#4CA30D', token: 'success/600', usage: 'กินยาแล้ว' },
                { name: 'Warning', hex: '#EAB308', token: 'warning/500', usage: 'ใกล้ถึงเวลา' },
                { name: 'Danger', hex: '#EF4444', token: 'danger/500', usage: 'ลืมกินยา' },
                { name: 'Info', hex: '#0EA5E9', token: 'info/500', usage: 'ข้อมูลเพิ่มเติม' },
              ],
            },
            {
              name: 'Category',
              on: '#FFFFFF',
              swatches: [
                { name: 'Health', hex: '#FF2D55', token: 'category/health', usage: 'ชีพจร · สัญญาณชีพ' },
                { name: 'Nutrition', hex: '#34C759', token: 'category/nutrition', usage: 'แคลอรี · อาหาร' },
                { name: 'Mindfulness', hex: '#5AC8FA', token: 'category/mindfulness', usage: 'สมาธิ · ผ่อนคลาย' },
                { name: 'Sleep', hex: '#AF52DE', token: 'category/sleep', usage: 'การนอน' },
              ],
            },
          ],
        },
        // Full layout spec — the Grid & Layout panel renders straight from this.
        // Every number is read out of the Flutter source or measured off a real
        // capture of the running app.
        grid: {
          frame: { width: 390, margin: 16, columns: 4, gutter: 8, content: 358 },
          // Real screens from the prototype, captured at 390×844 after signing
          // in through HealthID, with every number below read back off those
          // exact captures by pixel analysis. The overlay therefore annotates
          // the shipped UI rather than a redrawing of it, and three screens are
          // shown because one screen cannot reveal whether a rule holds — the
          // Health tab runs a 20px gutter where Home and Profile run 16.
          screens: [
            {
              id: 'home',
              label: 'Home · 390 × 844',
              src: 'proto-home-390.png',
              gutter: 16,
              note: 'การ์ดทุกใบชิดเส้น 16 / 374 · กริด 2 คอลัมน์ 173 ช่องไฟ 12 · มุมการ์ด 20',
              marks: [
                { kind: 'v', at: 16 },
                { kind: 'v', at: 374 },
                { kind: 'box', x: 16, y: 16, w: 358, h: 94, label: '358 × 94' },
                { kind: 'box', x: 16, y: 126, w: 358, h: 207 },
                { kind: 'gapV', x: 24, y: 110, h: 16, label: '16' },
                { kind: 'box', x: 16, y: 377, w: 173, h: 211, label: '173' },
                { kind: 'box', x: 201, y: 377, w: 173, h: 101 },
                { kind: 'box', x: 201, y: 490, w: 173, h: 98 },
                { kind: 'gapH', x: 189, y: 430, w: 12, label: '12' },
                { kind: 'gapV', x: 290, y: 478, h: 12, label: '12' },
                // Fitted from the capture: the corner traced over ~39 rows
                // against the card's own fill, best-fit r = 20.0 (mse 0.75),
                // which lands exactly on the radius/lg token.
                { kind: 'radius', x: 16, y: 377, r: 20, label: 'r 20 · lg' },
                // Same fitting method on the family card: best-fit r = 28.0
                // (mse 1.05), which is the app's circular(28).
                { kind: 'radius', x: 201, y: 490, r: 28, label: 'r 28' },
              ],
            },
            {
              id: 'health',
              label: 'Health · 390 × 844',
              src: 'proto-health-390.png',
              gutter: 20,
              note: 'หน้านี้ใช้ gutter 20 ไม่ใช่ 16 · กริด 2 คอลัมน์ 169 ช่องไฟ 12',
              marks: [
                { kind: 'v', at: 20 },
                { kind: 'v', at: 370 },
                { kind: 'box', x: 20, y: 104, w: 350, h: 190, label: '350 × 190' },
                { kind: 'gapV', x: 100, y: 294, h: 12, label: '12' },
                { kind: 'box', x: 20, y: 306, w: 169, h: 229, label: '169' },
                { kind: 'box', x: 201, y: 306, w: 169, h: 229 },
                { kind: 'gapH', x: 189, y: 420, w: 12, label: '12' },
                // best-fit r = 23.5 (mse 0.11) -> radius/xl
                { kind: 'radius', x: 20, y: 306, r: 24, label: 'r 24 · xl' },
              ],
            },
            {
              id: 'profile',
              label: 'Profile · 390 × 844',
              src: 'proto-profile-390.png',
              gutter: 16,
              note: 'รายการซ้อนกัน สูง 80 เท่ากันทุกแถว ช่องไฟ 10 คงที่',
              marks: [
                { kind: 'v', at: 16 },
                { kind: 'v', at: 374 },
                { kind: 'box', x: 16, y: 372, w: 358, h: 81, label: '358 × 80' },
                { kind: 'box', x: 16, y: 463, w: 358, h: 80 },
                { kind: 'box', x: 16, y: 606, w: 358, h: 80 },
                { kind: 'gapV', x: 30, y: 453, h: 10, label: '10' },
                // best-fit r = 24.0 (mse 0.31) on every row -> radius/xl
                { kind: 'radius', x: 16, y: 372, r: 24, label: 'r 24 · xl' },
                { kind: 'radius', x: 16, y: 606, r: 24, label: 'r 24' },
              ],
            },
          ],
          base: 4,
          // 768 of 849 vertical spacing values in the app are multiples of 4.
          compliance: { onGrid: 768, total: 849 },
          note: 'ฐาน 4px ทุกระยะเป็นทวีคูณของ 4 · gutter จอ 16px คือค่าที่ใช้ถี่ที่สุด · การ์ดวางบนกริด 4 คอลัมน์ ช่องไฟ 8px',
          spacing: [
            { token: 'space/1', value: 4 },
            { token: 'space/1.5', value: 6 },
            { token: 'space/2', value: 8 },
            { token: 'space/2.5', value: 10 },
            { token: 'space/3', value: 12 },
            { token: 'space/4', value: 16 },
            { token: 'space/5', value: 20 },
            { token: 'space/6', value: 24 },
            { token: 'space/8', value: 32 },
          ],
          radius: [
            { name: 'sm', value: 12 },
            { name: 'md', value: 16 },
            { name: 'lg', value: 20 },
            { name: 'xl', value: 24 },
            { name: 'full', value: 999 },
          ],
        },
        blocks: [
          { type: 'heading', text: 'Component' },
          {
            type: 'paragraph',
            text: 'A reusable kit of buttons, cards, inputs and sheets, each with documented states and one source of truth in code and Figma.',
          },
          { type: 'heading', text: 'Typography' },
          {
            type: 'paragraph',
            text: 'A three-step type scale keeps hierarchy calm — one display size, one body, one caption — tuned for Thai and Latin together.',
          },
          { type: 'heading', text: 'Color' },
          {
            type: 'paragraph',
            text: 'One brand green carries the whole product; every other colour is a status with a fixed meaning, and each token is checked against the surface it actually sits on.',
          },
          { type: 'heading', text: 'Grid & Layout' },
          {
            type: 'paragraph',
            text: 'A 4px base with a 16px screen gutter and a 4-column card grid: alignment comes from the system, so no screen is ever pixel-nudged into place.',
          },
          { type: 'tags', items: [
            'GlassCard',
            'MetricCard',
            'PrescriptionCard',
            'ActivityRing',
            'CustomTabBar',
            'LiquidGlassButton',
          ] },
        ],
      },
      {
        id: 'lofi',
        label: 'Lo-Fi Wireframe',
        cover: 'lofi', // bespoke cover card (see LofiCover)
        blocks: [
          { type: 'heading', text: 'Structure before style' },
          {
            type: 'paragraph',
            text: 'Every screen started as a grey-box wireframe: blocks, placeholders and Lorem Ipsum only, so we argued about flow and hierarchy before anyone fell in love with a colour.',
          },
          { type: 'heading', text: 'What we tested' },
          {
            type: 'list',
            items: [
              'Home → dose detail → reminder flow',
              'Empty, loading and error states for every list',
              'One-thumb reach on a 6.7" screen',
            ],
          },
          { type: 'tags', items: ['Figma', 'Wireframe', 'Lorem Ipsum'] },
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
    kind: 'Mobile + Web',
    category: 'Commerce',
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
    kind: 'Web app',
    category: 'Pets',
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
