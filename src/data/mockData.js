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

// Trimmed to each avatar's own alpha bounds and re-canvased square, so the three
// heads occupy the same share of their files and therefore render the same size.
import mickPhoto from '../assets/team-mick.png'
import oomiePhoto from '../assets/team-oomie.png'
import joPhoto from '../assets/team-jo.png'

// The real credit split on Pawmely. Declared once because two places need the
// same three people: the profile header and the role page's card deck.
// `share` is the same number already written into `role` — kept separately so a
// bar can be drawn from it without parsing a label.
// Section 2 of the appraisal form — the courses, not the project. They live on
// their own page now (TrainingPage, reached from the menu) because the training
// belongs to the person, not to one piece of work. Every field (title, issuer, date, verify code) is read off the
// PDF Coursera issued; the PDFs are in src/assets and the images in public are
// rendered from them.
export const COURSES = [
  {
    name: 'Foundations of User Experience (UX) Design',
    issuer: 'Google · Coursera',
    date: '8 ธันวาคม 2568',
    verify: 'https://coursera.org/verify/AYGKXPGCQEPS',
    img: 'cert-ux-foundations.webp',
    objective: 'ปูพื้นฐานวิชาชีพ UX ให้ตรงกับมาตรฐานสากล — บทบาทของนักออกแบบ กระบวนการคิดที่เอาผู้ใช้เป็นศูนย์กลาง และการออกแบบให้เข้าถึงได้',
    gained: 'ลำดับการทำงานที่ชัดขึ้น ตั้งแต่เก็บความต้องการ วางโครง ไปจนถึงทดสอบ และเกณฑ์ความเข้าถึงได้ที่ใช้ตรวจงานตัวเองได้',
    applied: 'ใช้เป็นโครงการออกแบบของ Pawmely ทั้งโปรเจกต์ — เริ่มจากเข้าใจผู้ใช้และเก็บ Requirement ก่อน แล้วจึงวาง User Flow, Wireframe และ Design System ตามลำดับ ไม่ข้ามไปวาดหน้าจอสวยๆ ก่อนเข้าใจปัญหา',
  },
  {
    name: 'Introduction to AI',
    issuer: 'Google · Coursera',
    date: '24 สิงหาคม 2569',
    verify: 'https://coursera.org/verify/4G51T1GF32XA',
    img: 'cert-intro-ai.webp',
    objective: 'เข้าใจว่า AI ทำอะไรได้และทำอะไรไม่ได้ รวมถึงข้อจำกัดที่ต้องระวังเมื่อเอามาใช้กับงานจริง',
    gained: 'เส้นแบ่งว่างานส่วนไหนให้ AI ทำแล้วคุ้ม และส่วนไหนต้องตัดสินใจเอง',
    applied: 'ใช้ออกแบบ UX ของผู้ช่วย AI ในแอป Pawmely — กำหนดว่าหน้าจอควรสื่อขอบเขตของ AI อย่างไรให้ผู้ใช้ไม่คาดหวังเกินจริง คำถามระดับไหนตอบในแชตได้ และจุดไหนต้องออกแบบทางส่งต่อไปหาสัตวแพทย์ให้ชัด',
  },
  {
    name: 'AI Fundamentals',
    issuer: 'Google · Coursera',
    date: '24 สิงหาคม 2569',
    verify: 'https://coursera.org/verify/I9Q2270XXJVD',
    img: 'cert-ai-fundamentals.webp',
    objective: 'ลงลึกกว่าตัวแรก — วิธีสั่งงาน AI ให้ได้ผลลัพธ์ที่ใช้ได้ และวิธีตรวจสอบสิ่งที่มันสร้างออกมา',
    gained: 'วิธีเขียนบรีฟให้จบในรอบเดียว และนิสัยตรวจผลลัพธ์ก่อนเอาไปใช้ต่อเสมอ',
    applied: 'ใช้เร่งงานออกแบบใน Pawmely และ Herbal Market — เขียนบรีฟจากสเปกดีไซน์ทีละหน้าจอ ให้ผลลัพธ์ตรงกับ Design System ที่วางไว้ เก็บของที่ใช้ซ้ำเป็นคอมโพเนนต์ และไล่ตรวจหน้าจอที่ได้เทียบกับแบบก่อนส่งมอบทุกครั้ง',
  },
]

// The two people whose commits are in the Metaherb repository. The split is the
// contributor count GitHub reports, so it is a fact about the code rather than a
// claim about the work: oommiemie 49 commits (repo owner), Mick 10 merged pull
// requests. Nobody else on the team wrote to it.
const METAHERB_TEAM = [
  { name: 'Oommie', role: 'Repo owner · 49 commits', title: 'UX/UI Designer', share: 83, photo: oomiePhoto },
  { name: 'Mick', role: 'Herbal Market · 10 PR', title: 'UX/UI Designer', share: 17, you: true, photo: mickPhoto },
]

// The three people whose commits are in the MobileMetaherb repository, by the
// count `git log` reports on the clone: oommiemie 100, Mick 22, bms-uxui 14 —
// 136 in total. GitHub's own contributor list shows Mick as 1 because most of
// his commits are authored under an email that is not linked to that account,
// so the git log is the honest number.
const MOBILE_METAHERB_TEAM = [
  { name: 'Oommie', role: 'Repo owner · 100 commits', title: 'UX/UI Designer', share: 74, photo: oomiePhoto },
  { name: 'Mick', role: 'ผู้ซื้อ + คอนโซลร้านค้า · 22 commits', title: 'UX/UI Designer', share: 16, you: true, photo: mickPhoto },
  { name: 'Joe', role: 'ร่วมพัฒนา · 14 commits', title: 'UX/UI Designer', share: 10, photo: joPhoto },
]

const PAWMELY_TEAM = [
  { name: 'Mick', role: 'Main Designer & Director · 65%', title: 'UX/UI Designer', share: 65, you: true, photo: mickPhoto },
  // Everyone on this team holds the same title; what differs is the share of the
  // work, which `role` and `share` already carry.
  { name: 'Oommie', role: 'Support · 20%', title: 'UX/UI Designer', share: 20, photo: oomiePhoto },
  { name: 'Joe', role: 'Support · 15%', title: 'UX/UI Designer', share: 15, photo: joPhoto },
]

export const projects = [
  // ---------------------------------------------------------------------------
  {
    id: 'pawmely',
    tab: 'Pets',
    title: 'Pawmely',
    tagline: 'Everything one pet needs, kept in a single app the owner opens daily.',
    handle: '@pawmely.app',
    accent: '#B86A7C',
    cover: cover('#160910', '#B86A7C', 'Pawmely'),
    // Optional video: if `video` is set the card plays it instead of the image.
    video: null,
    avatar: `${import.meta.env.BASE_URL}pawmely-logo.png`,
    bio: 'Pets · Mobile app · React Native + Expo. Pawmely รวมทุกเรื่องของสัตว์เลี้ยงไว้ในแอปเดียว สมุดสุขภาพที่เก็บน้ำหนักและวัคซีนไว้เป็นกราฟให้เห็นแนวโน้ม การจองนัดกับคลินิกที่ไปนั่งอยู่ในปฏิทินพร้อมการเตือน ร้านค้าที่สั่งอาหารและของใช้ได้จากที่เดียวกับที่เก็บประวัติน้อง และตารางให้อาหารที่ทำหน้าที่จำแทนเจ้าของ ทั้งหมดวางบนโทนชมพูอบอุ่นเพื่อให้เรื่องสุขภาพไม่รู้สึกเหมือนอยู่ในห้องตรวจ และมีผู้ช่วย AI คอยตอบคำถามเล็ก ๆ ที่ยังไม่ถึงขั้นต้องพาไปหาหมอ',
    // Nothing here is a like count. Read as: App Store score, App Store reviews,
    // stores published to, and screens shipped. The 5.0 that used to sit in
    // `saves` was a Google Play score the Play listing does not publish.
    stats: { likes: '4.7', comments: 3, shares: 2, saves: '12' },
    techStack: ['React Native', 'Expo', 'Figma', 'GitHub', 'Xcode'],
    // Badges on the profile: what kind of product this is, and its domain.
    kind: 'Mobile app',
    category: 'Pets',
    // The live Expo web build, embedded by the in-page prototype viewer.
    prototypeUrl: 'https://bms-uxui.github.io/ehp-vetcare-plus/',
    // The repository the build comes from. Named for the internal project
    // (EHP VetCare Plus); the product ships as Pawmely.
    repoUrl: 'https://github.com/bms-uxui/ehp-vetcare-plus',
    // The real credit split on the project, not a placeholder cast.
    team: PAWMELY_TEAM,
    // Not a download count — the two things about release that are actually
    // known: both stores are live, and the ratings each one carries so far.
    // ONE cell, not one per store. The Google Play half used to print 5.0 from a
    // single review — a figure the Play listing does not publish at all, so
    // nobody following the link could confirm it. The App Store score is the one
    // that can be checked (4.66667 from 3 ratings on id6781926370), and the
    // release itself is stated in words rather than as a second fake number.
    downloads: {
      label: 'คะแนน App Store',
      value: '4.7',
      note: 'จาก 3 รีวิว · เผยแพร่แล้วทั้ง App Store และ Google Play',
    },
    tabs: [
      {
        id: 'overview',
        label: 'Project Overview',
        detail: 'feed',
        // Pawmely IS the piece of work under review, so the profile does not wrap
        // it in a "ผลงานที่ 1" card — the four questions the evaluation form asks
        // ABOUT the work are the topics you land on, and each one is answered with
        // the project's own facts rather than a form field to fill in.
        cards: [
          // Black, white and beige — the cards are the doors to pages painted
          // the same way, so they step down one warm-neutral ramp instead of
          // wearing two of the product's own hues.
          { id: 'role', label: 'บทบาทหน้าที่', color: '#21221f', art: 'report' },
          { id: 'outcome', label: 'ผลการดำเนินงาน', color: '#33312c', art: 'report' },
          { id: 'problems', label: 'ปัญหาที่พบ', color: '#46433c', art: 'report' },
          { id: 'learned', label: 'สิ่งที่ได้เรียนรู้', color: '#5a5750', art: 'report' },
        ],
        report: {
          title: 'รายงานสรุปผลงาน',
          // What the pages are ABOUT. It used to name the appraisal the report
          // was written for, which is the report's own title, not the subject of
          // any page in it.
          subtitle: 'Pawmely · Mobile app',
          period: '27 – 29 พฤษภาคม 2569',
          entries: [
            {
              label: 'บทบาทหน้าที่',
              // This page carries the team row and the figure row right under its
              // title, and those already say the role, the project and the dates.
              // The field strip repeated all three, so this page opens on its name
              // alone. Every other report page keeps the strip.
              headFields: false,
              // Black, white and beige — this page alone. The rose belongs to the
              // project and is still on its card in the topic grid; inside the
              // page it was the only colour on screen, four steps of one hue with
              // nothing to measure them against.
              color: '#21221f',
              stat: 'UX/UI',
              statLabel: 'Role',
              statNote: 'ดูแลตั้งแต่ความต้องการจนถึงส่งมอบ · Main Designer & Director · 65% ของงานทั้งหมด',
              // This page is drawn as a stack of cards rather than a scroll of
              // sections — see CoverStack.
              // No longer dealt as a deck of cards: this page is set like every
              // other page in the reel, and the team is a row of people on it
              // rather than a card each.
              // The deck after the cover: a divider card, then one card per
              // teammate. Same three people as the profile header.
              team: PAWMELY_TEAM,
              // Card 01 is the owner's own player card. Every figure on it is
              // counted from something already written on this page — no figure is
              // here because the layout had a slot for it. The provenance line
              // each one used to carry was dropped from the design; the sources
              // are kept here so a later edit cannot quietly break them:
              //   12 = the systems listed across the three timeline days
              //    5 = the `tools` list below, which must stay in step
              //    3 = the timeline itself, 27 – 29 พ.ค. 69
              self: {
                headline: 'UX/UI',
                figures: [
                  { value: '12', label: 'Feature' },
                  { value: '5', label: 'Tool' },
                  { value: '3', label: 'Day' },
                ],
                gaugeNote: 'ของงานทั้งหมด',
                cta: 'รายละเอียดงาน',
              },
              // In the order the work actually happened, so the numbering reads as
              // the process rather than as a list of duties.
              items: [
                {
                  title: 'เก็บ Requirement และสรุปกับ PM',
                  desc: 'ประชุมร่วมกับ PM เพื่อสรุปวัตถุประสงค์และเป้าหมาย App',
                },
                {
                  title: 'วางแผนการดำเนินงาน',
                  desc: 'แบ่งฟีเจอร์ให้แต่ละคนรับผิดชอบ พร้อมกำหนดวันส่ง',
                },
                {
                  title: 'ออกแบบ UX/UI',
                  desc: 'ออกแบบ Work Flow , UX/UI , Design System',
                },
                {
                  title: 'Vibe Coding (Prototype)',
                  desc: 'ต่อยอดแบบเป็นแอปกดเล่นได้จริงด้วย AI ก่อนพัฒนาจริง',
                },
              ],
              timeline: [
                {
                  name: 'Day 1',
                  period: '27 พ.ค. 69',
                  focus: 'บัญชีผู้ใช้และตัวน้อง',
                  items: ['ระบบบัญชีผู้ใช้', 'โปรไฟล์สัตว์เลี้ยง', 'ปรึกษาสัตวแพทย์ออนไลน์', 'ระบบ AI', 'จัดการค่าใช้จ่าย'],
                },
                {
                  name: 'Day 2',
                  period: '28 พ.ค. 69',
                  focus: 'สุขภาพ นัดหมาย และร้านค้า',
                  items: ['ระบบสุขภาพ', 'จองนัดเข้ารับบริการ', 'ร้านค้าออนไลน์', 'กราฟสุขภาพย้อนหลัง'],
                },
                {
                  name: 'Day 3',
                  period: '29 พ.ค. 69',
                  focus: 'แจ้งเตือนและทดสอบเครื่องจริง',
                  items: ['ระบบแจ้งเตือน', 'ติดตามสัตว์ที่ฝากเลี้ยง', 'ทดสอบ UI บนเครื่องจริง'],
                },
              ],
              tools: ['Figma', 'Claude', 'VS Code', 'Xcode', 'GitHub'],
            },
            {
              label: 'ผลการดำเนินงาน',
              // Opens on its name and its standfirst alone — see `headFields` on
              // the role page.
              headFields: false,
              // Ink, not the product's own rose: the sheet pages were painted in
              // Pawmely's palette, which left every page of the report one hue with
              // nothing to read it against. The palette is still on record — the
              // Color page prints it as swatches, which is where it belongs.
              color: '#21221f',
              stat: '3 วัน',
              statLabel: 'Duration',
              statNote: 'จากศูนย์ถึงส่งมอบ',
              lead: 'ออกแบบและทำหน้าจอครบทุกส่วน ทดสอบผ่านระบบ iOS และ Android แล้วส่งต่อให้ทีมพัฒนา ตอนนี้ Release ทั้ง Play Store , App Store',
              // The provenance line under each figure was dropped from the design.
              // Kept here so a later edit cannot quietly break what they mean:
              //   4.7 is from 3 reviews on the App Store, 5.0 from 1 on Google
              //   Play — the same counts the profile strip prints as its labels.
              // PROVENANCE — checked against the stores themselves:
              //   App Store  · id6781926370 · 4.66667 from 3 ratings -> 4.7 / 3
              //   Google Play · com.pawmely.app · listed, but Play publishes NO
              //   star rating for it yet, so the 5.0 that used to stand here
              //   could not be verified by anyone following the link. Dropped
              //   rather than kept: an unverifiable figure costs more than the
              //   space it fills.
              metrics: [
                { value: 'Live', label: 'App Store' },
                { value: 'Live', label: 'Google Play' },
                { value: '4.7', label: 'คะแนน App Store' },
                { value: '3', label: 'รีวิว App Store' },
              ],
              // What came OUT of the three days, in the order it was produced.
              items: [
                {
                  title: 'Design UX/UI , Vibe Coding',
                  desc: 'ครบทุกส่วน บัญชีผู้ใช้ สุขภาพ นัดหมาย ร้านค้า และ AI',
                },
                {
                  title: 'Test UX/UI',
                  desc: 'ทดสอบการใช้งานจริงบนเครื่องก่อนส่งมอบ ทั้ง iOS และ Android',
                },
                {
                  title: 'Handoff',
                  desc: 'ส่งต่อไฟล์และโค้ดผ่าน GitHub ให้ทีมพัฒนาต่อ',
                },
                {
                  title: 'Feedback',
                  desc: 'รับความเห็นจากทีมและ PM มาปรับก่อนขึ้นสโตร์',
                },
              ],
            },
            {
              label: 'ปัญหาที่พบ',
              color: '#21221f',
              // Opens on its name alone — see `headFields` on the role page.
              headFields: false,
              stat: '5 กลุ่ม',
              statLabel: 'Issues',
              statNote: 'ฟีเจอร์ที่ต้องแย่งที่กันในแท็บบาร์เดียว',
              // The standfirst the page states once, above the columns.
              lead: 'อุปสรรคที่เจอระหว่างทาง และวิธีที่มันบังคับให้งานต้องปรับตัวตาม',
              // Set like the reference's field strip: a rule over each column,
              // the constraint's name as its caption, the line under it as its
              // value. See `strip` in FeedSheet.
              strip: true,
              // The heading names the CONSTRAINT; the line under it says what that
              // constraint did to the work.
              items: [
                {
                  title: 'Timeline',
                  desc: 'มีเวลา 3 วัน ทุกหน้าจอต้องถูกตั้งแต่รอบแรก',
                  fix: 'ตัดขอบเขตเป็นก้อนรายวัน วาง Design System ให้เสร็จก่อนวันแรกจบ หน้าที่เหลือจึงประกอบจากของเดิมแทนการออกแบบใหม่ทุกหน้า',
                },
                {
                  title: 'Objective & Goal',
                  desc: 'ขอบเขตไม่ชัด ต้องเพิ่มลดสเปคทีหลัง',
                  fix: 'สรุปขอบเขตกับ PM เป็นลายลักษณ์ก่อนลงมือ และแยกฟีเจอร์เป็นสองกอง — ที่ต้องมีในรอบนี้ กับที่ยกไปรอบหน้า',
                },
                {
                  title: 'User Persona',
                  desc: 'ไม่มีกลุ่มเป้าหมายที่ชัดเจน',
                  fix: 'ตั้งกลุ่มเป้าหมายจากสิ่งที่รู้แน่ — เจ้าของสัตว์เลี้ยงที่ไม่ใช่สายสุขภาพ — แล้วใช้เป็นเกณฑ์ตัดสินทุกครั้งที่ต้องเลือกระหว่างศัพท์แพทย์กับคำที่คนทั่วไปใช้',
                },
                {
                  title: 'Tool',
                  desc: 'Token สำหรับ Vibe Coding บางครั้งไม่พอ',
                  fix: 'เขียนบรีฟให้จบในรอบเดียวและทำทีละหน้าจอ เก็บส่วนที่ใช้ซ้ำเป็นคอมโพเนนต์ตั้งแต่ต้น จึงไม่ต้องสั่งสร้างของเดิมซ้ำ',
                },
              ],
            },
            {
              label: 'สิ่งที่ได้เรียนรู้',
              // Opens on its name and standfirst alone, like every other report
              // page — see `headFields` on the role page.
              headFields: false,
              color: '#21221f',
              stat: '4 เรื่อง',
              statLabel: 'Takeaways',
              statNote: 'ทักษะที่ติดตัวออกมาจากงานนี้',
              lead: 'สี่อย่างที่ใช้ต่อได้ในงานหลังจากนี้ — จังหวะการทำงาน วิธีมองผู้ใช้ ขอบเขตงาน และการตรวจงานก่อนส่ง',
              items: [
                {
                  title: 'ส่งงานทั้งผลิตภัณฑ์ในจังหวะสปรินต์',
                  desc: 'สามวันบังคับให้ตัดสินใจเร็วและตัดของที่ไม่คุ้มที่จะมีทิ้ง แต่ยังส่งของที่ครบได้ จังหวะนี้กลายเป็นเกียร์ที่หยิบมาใช้ได้เมื่อจำเป็น',
                },
                {
                  title: 'ออกแบบให้ผู้ใช้ที่มาด้วยความรู้สึก',
                  desc: 'เจ้าของที่กำลังเป็นห่วงต้องการรูปทรงที่นุ่มกว่า ข้อมูลที่แน่นน้อยกว่า และสีที่นิ่งกว่าคนที่เปิดแอปมาทำงาน เปลี่ยนวิธีที่ผมชั่งน้ำหนักภาพบนหน้าจอไปเลย',
                },
                {
                  title: 'สร้างอัตลักษณ์จากศูนย์',
                  desc: 'จานสี โลโก้ และมาสคอต เริ่มที่โปรเจกต์นี้ ทำให้ขยับจากคนตกแต่งหน้าจอ ไปเป็นคนตัดสินว่าผลิตภัณฑ์ทั้งตัวควรหน้าตาแบบไหน',
                },
                {
                  title: 'เพิ่มการทดสอบบนเครื่องจริงเข้ากระบวนการ',
                  desc: 'ตรวจ UI บนอุปกรณ์จริงก่อนส่งมอบทุกครั้ง แทนที่จะเชื่อหน้าจอออกแบบอย่างเดียว',
                },
              ],
            },
          ],
        },
        blocks: [
          { type: 'heading', text: 'A companion app, not a clinic tool' },
          {
            type: 'paragraph',
            text: 'Pawmely keeps a pet’s health book, vet bookings, shopping and feeding schedule in one place, with an AI assistant for the small worries in between.',
          },
          {
            type: 'stats',
            items: [
              { label: 'Platform', value: 'iOS + Android' },
              { label: 'Built with', value: 'React Native' },
              { label: 'Build time', value: '3 days' },
              { label: 'Stores', value: 'Live' },
            ],
          },
          { type: 'tags', items: ['Pets', 'React Native', 'Care'] },
        ],
      },
      {
        id: 'design-system',
        label: 'Design System',
        cardColor: '#B86A7C',
        detail: 'feed', // opens as a home-style vertical feed (see FeedSheet)
        detailStart: 'Color', // section focused first when the sheet opens
        // Three topics, each backed by the system the app actually ships.
        cards: [
          {
            id: 'component',
            label: 'Component',
            color: '#21221f',
            // The card's illustration IS the component list: draggable objects,
            // each a small mock of the real component it names.
            pills: ['Button', 'Input Fields', 'Card', 'Tab Bar', 'Product Tile', 'Status Badge'],
          },
          { id: 'typography', label: 'Typography', color: '#33312c', art: 'typeface' },
          { id: 'color', label: 'Color', color: '#46433c' },
          { id: 'grid', label: 'Grid & Layout', color: '#5a5750', art: 'inspect' },
          { id: 'lowfi', label: 'Low-fi', color: '#46433c', art: 'wire' },
          { id: 'hifi', label: 'Hi-fi', color: '#5a5750', art: 'shot' },
        ],
        // The same four screens as the wireframes above, in the same order, built.
        // Not a different set: the pair of pages is there to show one screen at two
        // stages, and a Hi-fi page showing screens the Low-fi page never blocked out
        // compares nothing.
        //
        // PROVENANCE: captured off the running prototype
        // (prototypeUrl above) at 390×844 on a 3x screen, then written out at 2x —
        // see scripts/capture-hifi.mjs, which drives the consent gate, the login and
        // each tab's coach-mark tour to reach them. Straight screenshots of the real
        // build, not crops of a mockup.
        hifi: {
          container: { screen: 390, height: 844 },
          note: 'Hi-fi คือหน้าจอจริงที่ลงสี ฟอนต์ และคอมโพเนนต์ครบตามดีไซน์ซิสเต็ม พร้อมส่งต่อให้ทีมพัฒนา — ชุดนี้จับจากแอปที่กดเล่นได้ หน้าเดียวกับ Low-fi ทุกหน้า',
          screens: [
            {
              name: 'Home',
              note: 'สรุปของน้องทุกตัวในหน้าเดียว',
              src: `${import.meta.env.BASE_URL}hifi-home-390.webp`,
            },
            {
              name: 'Pet profile',
              note: 'ตัวน้อง อายุ และกราฟน้ำหนัก',
              src: `${import.meta.env.BASE_URL}hifi-pet-390.webp`,
            },
            {
              name: 'Health',
              note: 'บันทึกน้ำหนักและวัคซีนย้อนหลัง',
              src: `${import.meta.env.BASE_URL}hifi-health-390.webp`,
            },
            {
              name: 'Shop',
              note: 'สินค้าและของใช้ประจำ',
              src: `${import.meta.env.BASE_URL}hifi-shop-390.webp`,
            },
          ],
        },
        // The component library the app is assembled from — the real set, with
        // what each one is for. `kind` picks the live preview drawn in the panel.
        component: {
          count: 10,
          tone: '#21221f',
          platform: 'React Native',
          source: 'ของจริง กดเล่นได้ทุกตัว',
          note: 'ทุกจอประกอบจากชุดเดียวกัน — ปุ่มพิลล์สีโรสนำทางหลัก การ์ดและไทล์ถือเนื้อหา แถบแท็บกระจกลอยคุมการเดินทาง',
          items: [
            { name: 'Button', kind: 'button', role: 'Action', use: 'พิลล์สีโรสเต็มความกว้างสำหรับทางหลัก แบบขอบสำหรับทางรอง และปุ่มไอคอนวงกลมสำหรับทางลัด' },
            { name: 'Input Fields', kind: 'input', role: 'Form', use: 'ช่องกรอกทรงโค้งเต็มบนพื้นโทนอุ่น วงโฟกัสเป็นสีแบรนด์' },
            { name: 'Card', kind: 'card', role: 'Surface', use: 'การ์ดโปรไฟล์น้อง — รูปหัวการ์ดพร้อมชื่อและอายุ ตามด้วยพิลล์กรองและกราฟน้ำหนัก' },
            { name: 'Tab Bar', kind: 'tabbar', role: 'Navigation', use: 'แถบกระจกลอย ไอคอนสี่แท็บคร่อมปุ่มอุ้งเท้าที่ยกขึ้นกลาง แตะแล้วแท็บขยายเป็นพิลล์พร้อมชื่อ' },
            { name: 'Toggle / CheckBox / Radio', kind: 'toggle', role: 'Form', use: 'ชุดควบคุมทรงมนขนาดพอดีนิ้ว ทุกสถานะเปิดลงสีแบรนด์เดียวกัน' },
            { name: 'Step Progress', kind: 'steps', role: 'Feedback', use: 'พิลล์จุดไอคอนบอกขั้นตอนการจอง ผ่านขั้นไหนเส้นและจุดถัดไปไล่เป็นสีโรส' },
            { name: 'Skeleton', kind: 'skeleton', role: 'Feedback', use: 'ตัวแทนระหว่างโหลดที่มีทรงเท่าเนื้อหาจริง กวาดด้วยชิมเมอร์ชุดเดียวทั้งจอ' },
            { name: 'Product Tile', kind: 'tile', role: 'Commerce', use: 'ไทล์สินค้าในร้าน ภาพจัตุรัส ชื่อแบรนด์เหนือชื่อสินค้า ราคาเป็นสีแดงเมื่อลด สีเขียวเมื่อไม่ลด' },
            { name: 'Mini Call Overlay', kind: 'call', role: 'Overlay', use: 'ย่อสายวิดีโอกับสัตวแพทย์เป็นพิลล์ลอย เห็นหน้าคุณหมอและเวลาที่คุยไป สายไม่หลุดตอนกดดูหน้าอื่น' },
            { name: 'Status Badge', kind: 'badge', role: 'Status', use: 'สถานะของน้องอ่านได้ในแวบเดียว ใช้สีจากชุด Semantic' },
          ],
        },
        // The face the app ships. Same family as the site's own Thai text, which
        // is why the specimen can be set in it: sizes and weights are the real
        // six-step scale; line-height is not part of the published spec, so the
        // table prints "—" rather than a number nobody set.
        typography: {
          tone: '#21221f',
          latin: 'IBM Plex Sans Thai Looped',
          thai: 'IBM Plex Sans Thai Looped',
          classification: 'Sans-serif · Looped Thai',
          note: 'ตัวไทยมีหัว อ่านง่ายในขนาดเล็ก และครอบคลุมทั้งไทยและละตินในตระกูลเดียว จึงคุมเสียงของแอปได้ด้วยฟอนต์ชุดเดียว',
          weights: [
            { name: 'Regular', value: 400 },
            { name: 'Medium', value: 500 },
            { name: 'SemiBold', value: 600 },
            { name: 'Bold', value: 700 },
          ],
          // Measured off the real TTF: x-height and cap-height as a fraction of
          // the em. A high x-height is why the 10px tab label still holds up.
          metrics: { xHeight: 0.52, capHeight: 0.7 },
          scale: [
            { role: 'Screen title', token: 'screenTitle/20', px: 20, weight: 700, usage: 'หัวข้อหน้าจอ' },
            { role: 'Card title', token: 'cardTitle/16', px: 16, weight: 600, usage: 'หัวข้อการ์ด' },
            { role: 'Body', token: 'body/14', px: 14, weight: 400, usage: 'เนื้อความ' },
            { role: 'Caption', token: 'caption/12', px: 12, weight: 400, usage: 'คำบรรยาย' },
            { role: 'Badge', token: 'badge/11', px: 11, weight: 500, usage: 'ป้ายสถานะ' },
            { role: 'Tab label', token: 'tabLabel/10', px: 10, weight: 500, usage: 'ป้ายแท็บ' },
          ],
        },
        // The shipped palette: a dusty-rose ramp leading, a cool ocean ramp and a
        // cream ground behind it, then status colours and neutrals.
        color: {
          brand: {
            name: 'Dusty Rose',
            hex: '#B86A7C',
            token: 'Rose 500',
            harmony: 'Rose ramp · ocean counterweight · warm neutrals',
            note: 'ชมพูอมเทาเป็นสีแบรนด์เดี่ยว เลือกเพราะอบอุ่นและมองทุกวันได้ไม่ล้า สีเย็นโทนโอเชียนมีไว้ถ่วงไม่ให้ทั้งจอหวานเกิน ส่วนสีบอกสถานะถูกลดความจัดลงให้เข้ากับโทนรวม',
          },
          groups: [
            {
              name: 'Rose',
              on: '#FFFFFF',
              swatches: [
                { name: 'Rose 700', hex: '#7F4151', token: 'Rose 700', usage: 'ตัวหนังสือบนพื้นชมพู' },
                { name: 'Rose 600', hex: '#9F5266', token: 'Rose 600', usage: 'สถานะกด · เน้นเข้ม' },
                { name: 'Rose 500', hex: '#B86A7C', token: 'Rose 500', usage: 'สีแบรนด์ · ปุ่มหลัก' },
                { name: 'Rose 400', hex: '#CC8796', token: 'Rose 400', usage: 'ไอคอน · เส้นเน้น' },
                { name: 'Rose 300', hex: '#DDA8B2', token: 'Rose 300', usage: 'พื้นอ่อน · ไฮไลต์' },
                { name: 'Rose 100', hex: '#F5E4E7', token: 'Rose 100', usage: 'พื้นการ์ดโทนชมพู' },
              ],
            },
            {
              name: 'Ocean & Cream',
              on: '#1A1A1F',
              swatches: [
                { name: 'Ocean 600', hex: '#1B5A77', token: 'Ocean 600', usage: 'ข้อมูลเข้ม' },
                { name: 'Ocean 500', hex: '#2C6E8C', token: 'Ocean 500', usage: 'สีรองโทนเย็น' },
                { name: 'Ocean 300', hex: '#7FB1C9', token: 'Ocean 300', usage: 'ไอคอนข้อมูล' },
                { name: 'Ocean 100', hex: '#D8EAF2', token: 'Ocean 100', usage: 'พื้นแจ้งข้อมูล' },
                { name: 'Cream 100', hex: '#FDF6EF', token: 'Cream 100', usage: 'พื้นหน้าจอ' },
                { name: 'Cream 50', hex: '#FFFDFB', token: 'Cream 50', usage: 'พื้นการ์ด' },
              ],
            },
            {
              name: 'Semantic',
              on: '#FFFFFF',
              swatches: [
                { name: 'Success', hex: '#4FB36C', token: 'Success', usage: 'ทำรายการสำเร็จ' },
                { name: 'Warning', hex: '#E8A87C', token: 'Warning', usage: 'ใกล้ถึงกำหนด' },
                { name: 'Error', hex: '#C25450', token: 'Error', usage: 'ผิดพลาด · เลยกำหนด' },
                { name: 'Info', hex: '#6E8FAE', token: 'Info', usage: 'ข้อมูลเพิ่มเติม' },
                { name: 'Mint', hex: '#6CC28A', token: 'Mint', usage: 'สถานะสุขภาพดี' },
                { name: 'Honey', hex: '#E8A87C', token: 'Honey', usage: 'ป้ายเน้นอบอุ่น' },
              ],
            },
            {
              name: 'Neutral',
              on: '#FFFFFF',
              swatches: [
                { name: 'Neutral 800', hex: '#1A1A1F', token: 'Neutral 800', usage: 'เนื้อหาหลัก' },
                { name: 'Neutral 600', hex: '#4A4A50', token: 'Neutral 600', usage: 'คำอธิบาย' },
                { name: 'Neutral 500', hex: '#6E6E74', token: 'Neutral 500', usage: 'ป้ายกำกับ' },
                { name: 'Neutral 400', hex: '#9A9AA0', token: 'Neutral 400', usage: 'ข้อความจาง' },
                { name: 'Neutral 200', hex: '#E6E6E8', token: 'Neutral 200', usage: 'เส้นคั่น · กรอบ' },
                { name: 'Neutral 0', hex: '#FFFFFF', token: 'Neutral 0', usage: 'พื้นขาว' },
              ],
            },
          ],
        },
        // Everything under the type and the colour: the spacing rhythm, the grid
        // it lands on, the one breakpoint, how motion is split, and the details
        // that fork per platform.
        // Grid & Layout, documented the way a design system normally documents
        // it: base unit, spacing scale, margins, content width, radius,
        // component heights, breakpoint. The numbers were read off the running
        // app's own layout (element rects + computed border-radius); the
        // breakpoint pair is the system's published rule.
        // Four example screens as they were blocked out before any visual pass —
        // not every screen in the app, which would be a catalogue rather than an
        // example. The geometry is the system's own: a 390 screen, 358 of content
        // inside a 16 margin, and every height a step on the 8px ladder, so the
        // wireframes are drawn to the same rules the built screens are.
        wireframe: {
          container: { screen: 390, content: 358, margin: 16 },
          note: 'Low-fi Wireframe คือโครงหน้าจอขาวดำ วางบล็อกและลำดับเนื้อหาให้ครบก่อนตัดสินใจเรื่องสีและงานภาพ ใช้ตกลงโครงสร้างกับทีมให้จบก่อนลงรายละเอียด',
          // Mid-fi, in the voice of the reference frame (EHP VetCare 399:464):
          // grey blocks for pictures, a grey triangle for any icon, REAL text for
          // labels — all of it monochrome. Every string here is read off the four
          // hi-fi captures (public/hifi-*-390.webp), so the wireframe and the
          // built screen say the same things in the same order.
          screens: [
            {
              name: 'Home',
              note: 'สรุปของน้องทุกตัวในหน้าเดียว',
              // Band positions MEASURED off hifi-home-390.webp (390-space):
              // logo 10–98 · date 124 · headline 150–215 · CTA 264–296 ·
              // dots 304 · pets card 329–439 · booking 458–572 · tiles 592–722 ·
              // heading 741 · tab bar 774. h + mt below reproduce those starts
              // on the page's own 16 margin and 8 gap.
              blocks: [
                { kind: 'nav', h: 88 },
                {
                  kind: 'hero',
                  h: 172,
                  mt: 12,
                  date: '12 พ.ค. 2569',
                  title: 'น้องมะลิ มีนัดบริการฉีดวัคซีนรวม',
                  sub: 'Pawmely สาขาสุขุมวิท',
                  button: 'ดูรายละเอียด',
                },
                { kind: 'people', h: 112, mt: 24, items: ['ข้าวปั้น', 'มะลิ', 'ต้นข้าว', 'เพิ่ม'] },
                {
                  kind: 'entry',
                  h: 100,
                  mt: 8,
                  title: 'ข้าวปั้น',
                  lines: ['15 ส.ค. – 20 ส.ค. · 5 คืน', 'Pawmely Pet Boarding สุขุมวิท'],
                  badge: 'กำลังฝากเลี้ยง',
                },
                {
                  kind: 'duo',
                  h: 128,
                  mt: 16,
                  items: [
                    { title: 'ค่าใช้จ่ายเดือนนี้', sub: 'คงเหลือ', big: '฿8,000', foot: 'จาก ฿8,000' },
                    { title: 'เวลาให้อาหาร', sub: 'มื้อเช้า', big: 'ข้าวปั้น', foot: 'ตอน 07:00 น.' },
                  ],
                },
                { kind: 'heading', h: 16, mt: 32, label: 'บริการสัตวแพทย์' },
                { kind: 'tabbarfab', h: 58, label: 'หน้าแรก' },
              ],
            },
            {
              name: 'Pet profile',
              note: 'ตัวน้อง อายุ และกราฟน้ำหนัก',
              blocks: [
                { kind: 'photo', h: 240, name: 'น้องข้าวปั้น', sub: '4 ปี 0 เดือน 5 วัน' },
                { kind: 'segs', h: 32, items: ['ข้อมูลทั่วไป', 'ประวัติสุขภาพ', 'ประวัติวัคซีน', 'เวลาให้อาหาร'], active: 0 },
                {
                  kind: 'fields',
                  h: 240,
                  rows: [
                    ['วันเกิด', '12 ส.ค. 2565'],
                    ['สายพันธุ์', 'ชิบะ อินุ'],
                    ['น้ำหนัก', '9.4 กก.'],
                    ['สี', 'ส้มขาว'],
                    ['เพศ', 'ผู้'],
                    ['ไมโครชิป', '900164000123456'],
                  ],
                },
                {
                  kind: 'entry',
                  h: 120,
                  title: 'ประวัติการทำหมัน',
                  lines: ['ทำหมันแล้ว · เมื่อ 2 พ.ย. 2566', 'PUKPUI Rabbit&Exotic Pet Clinic'],
                },
                { kind: 'actionrow', h: 56, mt: 'auto', label: 'โรคประจำตัว ภูมิแพ้ผิวหนัง', button: 'คุยกับหมอเหมียว' },
              ],
            },
            {
              name: 'Health',
              note: 'บันทึกน้ำหนักและวัคซีนย้อนหลัง',
              blocks: [
                { kind: 'photo', h: 240, name: 'น้องข้าวปั้น', sub: '4 ปี 0 เดือน 5 วัน' },
                { kind: 'segs', h: 32, items: ['ข้อมูลทั่วไป', 'ประวัติสุขภาพ', 'ประวัติวัคซีน', 'เวลาให้อาหาร'], active: 1 },
                {
                  kind: 'chart4',
                  h: 288,
                  title: 'แนวโน้มน้ำหนัก',
                  range: 'ช่วง 8.3 – 9.4 กก.',
                  big: '9.4 กก.',
                  date: '8 มี.ค. 2569',
                  delta: '+0.3 กก.',
                  bars: [
                    { v: '8.3', x: '15 มิ.ย.', f: 0.55 },
                    { v: '8.7', x: '20 ก.ย.', f: 0.7 },
                    { v: '9.1', x: '4 ธ.ค.', f: 0.85 },
                    { v: '9.4', x: '8 มี.ค.', f: 1 },
                  ],
                },
                {
                  kind: 'entry',
                  h: 96,
                  title: 'โรคประจำตัว / ภูมิแพ้',
                  lines: ['ภูมิแพ้ผิวหนัง · ตั้งแต่ 10 พ.ค. 2567'],
                },
                { kind: 'actionrow', h: 56, mt: 'auto', label: 'ประวัติการเข้ารับบริการ', button: 'คุยกับหมอเหมียว' },
              ],
            },
            {
              name: 'Shop',
              note: 'สินค้าและของใช้ประจำ',
              blocks: [
                {
                  kind: 'shoptitle',
                  h: 96,
                  title: 'ร้านค้า',
                  subs: ['อาหาร ของเล่น และของ', 'จำเป็นสำหรับเพื่อนขนปุย'],
                },
                { kind: 'search', h: 48, placeholder: 'ค้นหาสินค้า' },
                { kind: 'segs', h: 32, items: ['ทั้งหมด', 'อาหาร', 'Grooming'], active: 0 },
                { kind: 'heading', h: 24, label: 'โปรโมชั่น' },
                {
                  kind: 'products',
                  h: 344,
                  items: [
                    { name: 'Complete Nutrition', price: '฿650' },
                    { name: 'PLAY BALL', price: '฿120' },
                    // The two bottom-row prices sit behind the tab bar in the
                    // capture and cannot be read, so these two carry none.
                    { name: 'ขนมเลียแมว' },
                    { name: 'CAT SHAMPOO' },
                  ],
                },
                { kind: 'tabbarfab', h: 64, label: 'ร้านค้า', active: 3 },
              ],
            },
          ],
        },
        grid: {
          base: 8,
          tone: '#21221f',
          note: 'ระยะทั้งแอปเดินบนฐาน 8px ชุดเดียว ขอบจอเลือกได้สามค่า และมุมโค้งมีแค่สามค่า',
          container: { screen: 390, content: 358, margin: 16 },
          spacing: [
            { token: 'space/0.5', value: 4 },
            { token: 'space/1', value: 8 },
            { token: 'space/1.5', value: 12 },
            { token: 'space/2', value: 16 },
            { token: 'space/3', value: 24 },
            { token: 'space/4', value: 32 },
            { token: 'space/6', value: 48 },
          ],
          margins: [
            { value: 16, use: 'หน้าที่เป็นฟอร์ม — ให้ช่องกรอกกว้างที่สุด' },
            { value: 20, use: 'หน้าที่เป็นเนื้อความยาว — บรรทัดไม่ชิดขอบ' },
            { value: 24, use: 'หน้าที่มีของน้อย — ปล่อยให้หายใจ' },
          ],
          radius: [
            { name: 'md', value: 16 },
            { name: 'lg', value: 20 },
            { name: 'full', value: 999 },
          ],
          sizes: [
            { name: 'ปุ่มหลัก · ช่องกรอก', value: 56 },
            { name: 'ปุ่มรอง (โซเชียล)', value: 40 },
            { name: 'แถบขั้นตอนสมัคร', value: 42 },
          ],
          breakpoint: 700,
          layouts: [
            { name: 'Phone', range: '< 700pt', note: 'คอลัมน์เดียว เนื้อหายืดเต็มความกว้างระหว่างขอบ' },
            { name: 'Tablet', range: '≥ 700pt', note: 'กริดเพิ่มคอลัมน์ และเนื้อหาจัดกึ่งกลางในคอลัมน์กว้าง 880pt แทนการยืดเต็มขอบ' },
          ],
        },
        blocks: [
          { type: 'heading', text: 'Component' },
          {
            type: 'paragraph',
            text: 'Ten components carry every screen — pill buttons, rounded fields, the pet card, the floating glass tab bar, and the status set on top of them.',
          },
          { type: 'heading', text: 'Typography' },
          {
            type: 'paragraph',
            text: 'One looped-Thai family carries Thai and Latin together, on a six-step scale sized for a phone held at arm’s length.',
          },
          { type: 'heading', text: 'Color' },
          {
            type: 'paragraph',
            text: 'A dusty-rose ramp leads, a cool ocean ramp counterweights it, and the status colours are softened to match the warmth.',
          },
          { type: 'heading', text: 'Grid & Layout' },
          {
            type: 'paragraph',
            text: 'An 8px base with a 16px screen edge: alignment comes from the system, so no screen is pixel-nudged into place.',
          },
          { type: 'tags', items: ['8pt grid', '390 × 844', 'iOS + Android'] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'metaherb',
    tab: 'Herbal',
    title: 'Metaherb',
    // The section of Metaherb this portfolio is about: the B2B raw-material
    // market, not the consumer storefront around it. Everything on this entry is
    // read off the repo, the merged pull requests and the live build — see the
    // provenance notes on each figure.
    tagline: 'Herbal Market — ตลาดวัตถุดิบสมุนไพรแบบ B2B ตั้งแต่หาของจนออกใบขอซื้อ',
    handle: '@metaherb',
    accent: '#1f7a4d',
    cover: `${import.meta.env.BASE_URL}mh-market-390.webp`,
    video: null,
    // The product's own mark, pulled from the live build's assets — the avatar
    // was a full-page screenshot squeezed into a circle.
    avatar: `${import.meta.env.BASE_URL}metaherb-logo.png`,
    bio: 'Herbal · Web app · React + TypeScript. ส่วน Herbal Market ของ Metaherb คือตลาดซื้อขายวัตถุดิบสมุนไพรระหว่างธุรกิจ ผู้ซื้อค้นวัตถุดิบจากเกรด ราคาต่อกิโลกรัม ยอดสั่งขั้นต่ำ (MOQ) และสต็อกที่ซัพพลายเออร์เหลือ แล้วเดินต่อได้สามทาง — ขอตัวอย่าง ขอใบเสนอราคา หรือออกใบขอซื้อ (PR) ที่ระบบแปลงเป็น PO ให้เมื่อผู้อนุมัติเซ็น ผมรับผิดชอบส่วนนี้ในฐานะทีมร่วม ส่งงานเข้า repo ของเจ้าของโปรเจกต์เป็น pull request',
    // Not a like count: the two numbers that can be checked by anyone opening
    // the repo. See `stats` on Pawmely for the same rule.
    stats: { likes: '10', comments: 52, shares: 6, saves: '22' },
    techStack: ['React', 'TypeScript', 'Tailwind', 'Vite', 'GitHub'],
    kind: 'Web app',
    category: 'Herbal',
    // Both links are the project's own, and both are public.
    repoUrl: 'https://github.com/oommiemie/Metaherb',
    // The build runs in a browser, so every viewer of it — the home screen and
    // the Hi-fi page — shows it on the laptop rather than a phone.
    device: 'mac',
    prototypeUrl: 'https://oommiemie.github.io/Metaherb/market',
    team: METAHERB_TEAM,
    // Not a store release — this one ships as a public web build, so the fact
    // worth printing is what got merged and where it can be opened.
    downloads: {
      label: 'งานที่ส่ง',
      value: '10 · 6',
      note: 'Pull request ที่ merge แล้ว · หน้าจอ Herbal Market',
      items: [
        { label: 'merge ครบ', title: 'Pull request', value: '10' },
        { label: 'ส่งมอบ', title: 'หน้าจอ', value: '6' },
      ],
    },
    tabs: [
      {
        id: 'overview',
        label: 'Project Overview',
        detail: 'feed',
        cards: [
          { id: 'role', label: 'บทบาทหน้าที่', color: '#21221f', art: 'report' },
          { id: 'outcome', label: 'ผลการดำเนินงาน', color: '#33312c', art: 'report' },
          { id: 'problems', label: 'ปัญหาที่พบ', color: '#46433c', art: 'report' },
          { id: 'learned', label: 'สิ่งที่ได้เรียนรู้', color: '#5a5750', art: 'report' },
        ],
        report: {
          title: 'รายงานสรุปผลงาน',
          subtitle: 'Metaherb · Herbal Market',
          // First and last merged pull request under this account — the dates are
          // GitHub's, not a memory.
          period: '12 พฤษภาคม – 12 มิถุนายน 2569',
          entries: [
            {
              label: 'บทบาทหน้าที่',
              headFields: false,
              color: '#21221f',
              stat: 'UX/UI',
              statLabel: 'Role',
              statNote: 'ออกแบบและลงมือทำส่วน Herbal Market · ส่งงานเป็น pull request เข้า repo ของทีม',
              // PROVENANCE — every figure is countable from the GitHub API:
              //   10 = pull requests opened by nattapongteero-png, all merged
              //    6 = Herbal Market page components touched (Page, Detail,
              //        Sample, Purchase, Quote, PR)
              //   52 = unique files across those pull requests
              team: METAHERB_TEAM,
              self: {
                headline: 'UX/UI',
                figures: [
                  { value: '10', label: 'Pull request' },
                  { value: '6', label: 'Screen' },
                  { value: '52', label: 'File' },
                ],
                gaugeNote: 'ที่ merge เข้า main แล้วทั้งหมด',
                cta: 'รายละเอียดงาน',
              },
              items: [
                {
                  title: 'ออกแบบ Flow การจัดซื้อแบบ B2B',
                  desc: 'ค้นวัตถุดิบ ขอตัวอย่าง ขอใบเสนอราคา แล้วออกใบขอซื้อที่แปลงเป็น PO',
                },
                {
                  title: 'ทำหน้า Herbal Market',
                  desc: 'หน้ารายการ รายละเอียด ขอตัวอย่าง สั่งซื้อ ใบเสนอราคา และใบ PR',
                },
                {
                  title: 'จัดระบบข้อมูลสินค้า',
                  desc: 'ชื่อเกรดภาษาไทย ป้ายพรีเมียม ราคาต่อกิโลกรัม MOQ และสต็อกคงเหลือ',
                },
                {
                  title: 'ส่งงานผ่าน Pull Request',
                  desc: 'แยกสาขาของตัวเอง เปิด PR ให้เจ้าของ repo รีวิวก่อน merge ทุกครั้ง',
                },
              ],
              // Read off the merged pull requests, newest first.
              timeline: [
                {
                  name: 'PR #5–#6',
                  period: '8 มิ.ย. 69',
                  items: ['ชื่อเกรดภาษาไทย', 'ป้ายพรีเมียม', 'Flow ใบขอซื้อ (PR)', 'ปรับตะกร้าแบบ B2B'],
                },
                {
                  name: 'PR #7–#9',
                  period: '10 มิ.ย. 69',
                  items: ['แถบข้างของตลาด', 'คำสั่งซื้อแบบ PO', 'Flow ซัพพลายเออร์', 'แก้ยอดรวมในตะกร้า'],
                },
                {
                  name: 'PR #10–#11',
                  period: '12 มิ.ย. 69',
                  items: ['เอกสาร B2B ครบวง Quote/PR/PO', 'รหัสสินค้าแบบ ERP', 'การ์ด CTA ซัพพลายเออร์'],
                },
              ],
              tools: ['Figma', 'Claude', 'VS Code', 'GitHub'],
            },
            {
              label: 'ผลการดำเนินงาน',
              headFields: false,
              color: '#21221f',
              stat: '10 PR',
              statLabel: 'Merged',
              statNote: 'เข้า main ครบทุกใบ',
              lead: 'ส่วน Herbal Market ขึ้นใช้งานบนบิลด์จริงแล้ว เปิดดูได้ทุกหน้า และโค้ดถูก merge เข้า main ของทีมครบทุก pull request',
              // PROVENANCE: 10/10 merged — GitHub pulls API, state=all.
              // 22 = listings the live market page reports ("พบ 22 รายการ").
              metrics: [
                { value: '10', label: 'PR ที่ merge แล้ว' },
                { value: '6', label: 'หน้าจอที่ส่งมอบ' },
                { value: '22', label: 'รายการในตลาด' },
                { value: 'Live', label: 'บิลด์สาธารณะ' },
              ],
              items: [
                {
                  title: 'Herbal Market',
                  desc: 'หน้ารายการวัตถุดิบ กรองตามหมวดและเกรด เรียงตามยอดนิยม',
                },
                {
                  title: 'Quote / PR / PO',
                  desc: 'เอกสารจัดซื้อครบวง จากใบเสนอราคาถึงใบสั่งซื้อในหน้าเดียวกัน',
                },
                {
                  title: 'Supplier',
                  desc: 'หน้าโปรไฟล์ซัพพลายเออร์ การสมัคร และการ์ดเชิญชวนบนหน้าตลาด',
                },
                {
                  title: 'Handoff',
                  desc: 'ทุกงานเข้า main ผ่านการรีวิวของเจ้าของ repo ไม่มี PR ค้าง',
                },
              ],
            },
            {
              label: 'ปัญหาที่พบ',
              color: '#21221f',
              headFields: false,
              stat: '4 เรื่อง',
              statLabel: 'Issues',
              statNote: 'อุปสรรคที่เจอตอนทำส่วน Herbal Market',
              lead: 'อุปสรรคที่เจอระหว่างทาง และวิธีที่ใช้แก้จริงในงานนี้',
              strip: true,
              items: [
                {
                  title: 'ศัพท์จัดซื้อ',
                  desc: 'PR / PO / MOQ เป็นคำที่ผู้ใช้ทั่วไปไม่รู้จัก',
                  fix: 'เขียนคำไทยกำกับทุกจุด และอธิบายขั้นถัดไปไว้ใต้หัวข้อของแต่ละฟอร์ม',
                },
                {
                  title: 'งานร่วม Repo',
                  desc: 'ไม่ได้เป็นเจ้าของ repo แก้ตรงเข้า main ไม่ได้',
                  fix: 'แยกสาขาของตัวเองแล้วเปิด PR ทุกครั้ง ให้เจ้าของรีวิวก่อน merge',
                },
                {
                  title: 'ยอดรวมตะกร้า',
                  desc: 'ราคาต่อกิโลกรัมกับ MOQ ทำให้ยอดรวมคำนวณผิด',
                  fix: 'แก้สูตรให้คูณจากน้ำหนักจริง และแยกส่วนลดเหรียญออกจากยอดสินค้า',
                },
                {
                  title: 'ข้อมูลตัวอย่าง',
                  desc: 'ข้อมูลสินค้าน้อยเกินกว่าจะเห็นว่าหน้าจริงแน่นแค่ไหน',
                  fix: 'เพิ่มชุดข้อมูลตัวอย่างให้ครบเกรดและช่วงราคา ก่อนตัดสินใจเรื่องเลย์เอาต์',
                },
              ],
            },
            {
              label: 'สิ่งที่ได้เรียนรู้',
              headFields: false,
              color: '#21221f',
              stat: '4 เรื่อง',
              statLabel: 'Takeaways',
              statNote: 'ทักษะที่ติดตัวออกมาจากงานนี้',
              lead: 'สี่อย่างที่ใช้ต่อได้ในงานหลังจากนี้ — งานร่วมทีม ภาษาของผู้ใช้ธุรกิจ การอ่านโค้ดคนอื่น และการส่งงานเป็นชิ้นเล็ก',
              items: [
                {
                  title: 'ทำงานบน Repo ของคนอื่นให้ไม่ชนกัน',
                  desc: 'แยกสาขา เปิด PR ทีละเรื่อง และเขียนหัวข้อ PR ให้คนรีวิวรู้ทันทีว่าแตะอะไร ทำให้ 10 ใบผ่านเข้า main ได้โดยไม่ต้องรื้อ',
                },
                {
                  title: 'ออกแบบให้ผู้ใช้ที่เป็นฝ่ายจัดซื้อ',
                  desc: 'คนกลุ่มนี้ไม่ได้มาเลือกของสวย แต่มาหาเกรด ราคา และ MOQ ที่ตรงสเปค ลำดับข้อมูลบนการ์ดจึงต้องเรียงตามลำดับที่เขาตัดสินใจ',
                },
                {
                  title: 'อ่านโค้ดของคนอื่นก่อนเขียนของตัวเอง',
                  desc: 'ต่อของใหม่บนโครงที่ทีมวางไว้ ใช้คอมโพเนนต์เดิมแทนการสร้างซ้ำ งานจึงกลืนกับส่วนที่เพื่อนทำไว้',
                },
                {
                  title: 'ส่งงานเป็นชิ้นเล็ก',
                  desc: 'PR ละเรื่องเดียวทำให้รีวิวเร็วและย้อนกลับง่ายกว่าการส่งก้อนใหญ่ครั้งเดียว',
                },
              ],
            },
          ],
        },
        blocks: [
          { type: 'heading', text: 'ตลาดวัตถุดิบ ไม่ใช่หน้าร้าน' },
          {
            type: 'paragraph',
            text: 'Herbal Market ให้ผู้ซื้อธุรกิจค้นวัตถุดิบสมุนไพรจากเกรด ราคาต่อกิโลกรัม ยอดสั่งขั้นต่ำ และสต็อกที่เหลือ แล้วเดินต่อไปขอตัวอย่าง ขอใบเสนอราคา หรือออกใบขอซื้อได้ในที่เดียว',
          },
          {
            type: 'stats',
            items: [
              { label: 'Platform', value: 'Web' },
              { label: 'Built with', value: 'React + TS' },
              { label: 'Pull requests', value: '10 merged' },
              { label: 'Build', value: 'Live' },
            ],
          },
          { type: 'tags', items: ['B2B', 'Procurement', 'React'] },
        ],
      },
      {
        id: 'design-system',
        label: 'Design System',
        detail: 'feed',
        detailStart: 'Color',
        cardColor: '#319754',
        // Metaherb's system is DOCUMENTED, not authored here: every value on the
        // three pages below was sampled from the running build (see scripts/) —
        // computed styles across every visible element on /market, counted by how
        // often each value occurs. Nothing is a guess, and nothing is rounded to
        // make it look tidier than the app is.
        cards: [
          // The SAME art names Pawmely's cards use — the illustrations are drawn
          // by TopicCard off these keys, and a name it does not know renders
          // nothing at all. Colour carries no `art` on purpose: the swatch deck
          // is keyed off the card's id, exactly as it is on Pawmely.
          { id: 'typography', label: 'Typography', color: '#21221f', art: 'typeface' },
          { id: 'color', label: 'Color', color: '#319754' },
          { id: 'grid', label: 'Grid & Layout', color: '#33312c', art: 'inspect' },
          { id: 'hifi', label: 'Hi-fi', color: '#1f7a4d', art: 'shot' },
        ],
        typography: {
          tone: '#319754',
          latin: 'IBM Plex Sans Thai Looped',
          thai: 'IBM Plex Sans Thai Looped',
          classification: 'Sans-serif · Looped Thai',
          note: 'ทั้งบิลด์เดินด้วยตระกูลเดียว — วัดจากทุก element ที่มองเห็นบนหน้า /market พบ IBM Plex Sans Thai Looped 211 จุด ไม่มีตระกูลอื่นปน',
          weights: [
            { name: 'Regular', value: 400 },
            { name: 'Medium', value: 500 },
            { name: 'SemiBold', value: 600 },
            { name: 'Bold', value: 700 },
          ],
          metrics: { xHeight: 0.52, capHeight: 0.7 },
          // PROVENANCE: font-size counted across the live page —
          // 10px x80 · 12px x27 · 13px x24 · 14px x20 · 18px x20 · 11px x20 · 20px x3
          scale: [
            { role: 'Screen title', token: 'title/20', px: 20, weight: 700, usage: 'หัวข้อหน้าจอ' },
            { role: 'Section title', token: 'section/18', px: 18, weight: 600, usage: 'หัวข้อกลุ่มสินค้า' },
            { role: 'Price', token: 'price/14', px: 14, weight: 700, usage: 'ราคาต่อกิโลกรัม' },
            { role: 'Body', token: 'body/13', px: 13, weight: 400, usage: 'ชื่อวัตถุดิบ · เนื้อความ' },
            { role: 'Caption', token: 'caption/12', px: 12, weight: 400, usage: 'ชื่อร้าน · คำบรรยาย' },
            { role: 'Meta', token: 'meta/10', px: 10, weight: 400, usage: 'MOQ · สต็อก · ป้ายเล็ก' },
          ],
        },
        color: {
          brand: {
            name: 'Herbal Green',
            hex: '#319754',
            token: 'Green 500',
            harmony: 'Green ramp · neutral ground · status accents',
            note: 'เขียวสมุนไพรเป็นสีแบรนด์เดี่ยว วัดจากบิลด์จริงพบใช้เป็นพื้น 21 จุดและเป็นตัวหนังสือ 22 จุด ที่เหลือเป็นขาว–เทาเกือบทั้งหมด สีอื่นโผล่เฉพาะป้ายสถานะ',
          },
          groups: [
            {
              name: 'Green',
              on: '#FFFFFF',
              swatches: [
                { name: 'Green 500', hex: '#319754', token: 'Green 500', usage: 'สีแบรนด์ · แถบหัว · ปุ่มหลัก' },
                { name: 'Green 400', hex: '#46C474', token: 'Green 400', usage: 'จุดสถานะ · ไอคอนยืนยัน' },
                { name: 'Green 50', hex: '#EAF3EE', token: 'Green 50', usage: 'พื้นอ่อนใต้หัวข้อ' },
              ],
            },
            {
              name: 'Neutral',
              on: '#101828',
              swatches: [
                { name: 'Ink', hex: '#101828', token: 'Ink', usage: 'ตัวหนังสือหลัก' },
                { name: 'Paper', hex: '#FFFFFF', token: 'Paper', usage: 'พื้นการ์ด' },
                { name: 'Surface', hex: '#FAFAFA', token: 'Surface', usage: 'พื้นหน้าจอ' },
              ],
            },
            {
              name: 'Status',
              on: '#FFFFFF',
              swatches: [
                { name: 'Info', hex: '#2563EB', token: 'Blue 600', usage: 'ป้ายแจ้งข้อมูล' },
                { name: 'Warn', hex: '#C2410C', token: 'Orange 700', usage: 'เตือนเลยกำหนด' },
                { name: 'Sale', hex: '#ED1C24', token: 'Red 500', usage: 'ป้ายส่วนลด' },
                { name: 'Promo', hex: '#F7931D', token: 'Amber 500', usage: 'ป้ายโปรโมชั่น' },
              ],
            },
          ],
        },
        grid: {
          // 4, not 8: the gaps counted on the live page are 4 · 6 · 8 · 10 · 12 ·
          // 16 · 20, so this build steps in fours and has not been rounded onto an
          // 8px ladder. Recorded as it is rather than as it ought to be.
          base: 4,
          tone: '#319754',
          note: 'ระยะบนบิลด์จริงเดินบนฐาน 4px และยังไม่ได้รวบให้เหลือไม่กี่ค่า — ค่าที่พบบ่อยสุดคือ 6, 8 และ 4 ตามลำดับ',
          container: { screen: 390, content: 358, margin: 16 },
          // PROVENANCE: gap counted across every flex/grid box on /market.
          spacing: [
            { token: 'gap/4', value: 4 },
            { token: 'gap/6', value: 6 },
            { token: 'gap/8', value: 8 },
            { token: 'gap/10', value: 10 },
            { token: 'gap/12', value: 12 },
            { token: 'gap/16', value: 16 },
            { token: 'gap/20', value: 20 },
          ],
          margins: [
            { value: 16, use: 'ขอบหน้าหลัก — พบมากที่สุดบนกล่องเต็มความกว้าง' },
            { value: 12, use: 'ในการ์ดสินค้า' },
            { value: 8, use: 'ในป้ายและชิปเล็ก' },
          ],
          // PROVENANCE: border-radius counted — pill x86 · 10 x37 · 16 x22 · 8 x6 · 20 x3
          radius: [
            { name: 'sm', value: 8 },
            { name: 'md', value: 10 },
            { name: 'lg', value: 16 },
            { name: 'full', value: 999 },
          ],
        },
        // PROVENANCE: captured off the live build at 390 wide on a 2x screen —
        // see scripts/, the same way Pawmely's captures are made. The routes are
        // the app's own (routes.tsx), not guessed: /market, /market/:id,
        // /market/:id/quote, /market/:id/pr, /cart.
        hifi: {
          container: { screen: 390, height: 844 },
          note: 'Hi-fi คือหน้าจอจริงที่ลงสีและคอมโพเนนต์ครบตามดีไซน์ซิสเต็ม — ชุดนี้จับจากบิลด์สาธารณะของ Metaherb เฉพาะส่วน Herbal Market ที่รับผิดชอบ',
          screens: [
            {
              name: 'ตลาดวัตถุดิบ',
              src: `${import.meta.env.BASE_URL}mh-market-390.webp`,
              note: 'รายการวัตถุดิบ กรองตามหมวดและเกรด',
            },
            {
              name: 'ใบเสนอราคา',
              src: `${import.meta.env.BASE_URL}mh-quote-390.webp`,
              note: 'ขอราคาจากซัพพลายเออร์ตามจำนวนที่ต้องการ',
            },
            {
              name: 'ใบขอซื้อ (PR)',
              src: `${import.meta.env.BASE_URL}mh-pr-390.webp`,
              note: 'ยื่นขออนุมัติ ระบบแปลงเป็น PO ให้เมื่ออนุมัติ',
            },
            {
              name: 'ตะกร้า',
              src: `${import.meta.env.BASE_URL}mh-cart-390.webp`,
              note: 'รวมยอดจากน้ำหนักจริงและ MOQ ของแต่ละรายการ',
            },
          ],
        },
        blocks: [],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // PROVENANCE: everything below is read off the repository and the public
  // build, not remembered. Commit counts and dates come from `git log` on the
  // clone; the design system is the guideline file in the repo (guidelines/
  // Guidelines.md) cross-checked against computed styles sampled from the live
  // build; the Hi-fi captures are made by scripts/capture-mobilemetaherb.mjs.
  {
    id: 'mobile-metaherb',
    tab: 'Herbal',
    title: 'Metaherb Mobile',
    tagline: 'The METAHERB storefront as a phone app — shopping on one side, an owner console on the other.',
    handle: '@metaherb.app',
    accent: '#319754',
    cover: `${import.meta.env.BASE_URL}mm-home-430.webp`,
    video: null,
    avatar: `${import.meta.env.BASE_URL}metaherb-logo.png`,
    bio: 'Herbal · Mobile app · React Native + Expo + NativeWind. พอร์ตร้านค้า METAHERB จากเว็บมาเป็นแอปมือถือ ฝั่งผู้ซื้อมีหน้าแรก รายละเอียดสินค้า ตะกร้า และการชำระเงิน ฝั่งผู้ขายมีคอนโซลร้านค้าที่ดูออเดอร์ จัดการสินค้า ตั้ง Flash Sale และออกเอกสาร B2B (RFQ / PR / PO) ได้ในแอปเดียว ทั้งหมดวางบนดีไซน์ซิสเต็มที่เขียนเป็นเอกสารไว้ในรีโปก่อนลงมือทำ',
    // Not likes. Read as: commits by me, screens I added, shared components I
    // extracted, pull requests merged.
    stats: { likes: '22', comments: 14, shares: 2, saves: '10' },
    techStack: ['React Native', 'Expo', 'TypeScript', 'Figma', 'GitHub'],
    kind: 'Mobile app',
    category: 'Herbal',
    // The Expo web export, published from the repo's gh-pages branch.
    // NOTE: the /Main/Home path returns GitHub's 404 page — this is the path
    // that actually serves the build.
    prototypeUrl: 'https://nattapongteero-png.github.io/MobileMetaherb/',
    repoUrl: 'https://github.com/nattapongteero-png/MobileMetaherb',
    team: MOBILE_METAHERB_TEAM,
    // The two numbers about the delivery that can be checked in the repo.
    downloads: {
      label: 'หน้าจอที่ส่ง',
      value: '14',
      note: 'จาก 149 หน้าจอทั้งแอป · คอมโพเนนต์กลาง 10 จาก 44 ตัว',
    },
    tabs: [
      {
        id: 'overview',
        label: 'Project Overview',
        detail: 'feed',
        cards: [
          { id: 'role', label: 'บทบาทหน้าที่', color: '#21221f', art: 'report' },
          { id: 'outcome', label: 'ผลการดำเนินงาน', color: '#33312c', art: 'report' },
          { id: 'problems', label: 'ปัญหาที่พบ', color: '#46433c', art: 'report' },
          { id: 'learned', label: 'สิ่งที่ได้เรียนรู้', color: '#5a5750', art: 'report' },
        ],
        report: {
          title: 'รายงานสรุปผลงาน',
          subtitle: 'Metaherb Mobile · React Native app',
          period: '26 พฤษภาคม – 16 กรกฎาคม 2569',
          entries: [
            {
              label: 'บทบาทหน้าที่',
              headFields: false,
              color: '#21221f',
              stat: 'UX/UI',
              statLabel: 'Role',
              statNote: 'ออกแบบและลงมือเขียนหน้าจอเอง · 22 จาก 136 commit ในรีโป',
              lead: 'ทำสองฝั่งของแอป — ฝั่งผู้ซื้อตั้งแต่หน้าแรกจนจ่ายเงิน และคอนโซลฝั่งร้านค้าทั้งชุด พร้อมเขียนดีไซน์ซิสเต็มของโปรเจกต์ไว้เป็นเอกสารกลางให้ทีมใช้ร่วมกัน',
              items: [
                {
                  title: 'พอร์ตดีไซน์จากเว็บมาเป็นแอป',
                  desc: 'อ่านสเปกจากเว็บ METAHERB แล้วแปลงเป็นหน้าจอ React Native ให้หน้าตาตรงกัน แต่ปรับระยะให้เข้ากริด 8 จุดของฝั่งมือถือ',
                },
                {
                  title: 'สร้างคอนโซลร้านค้า',
                  desc: 'แดชบอร์ดออเดอร์ จัดการสินค้า Flash Sale โปรโมชั่น และเอกสาร B2B (ใบเสนอราคา / PR / PO) รวมเป็นโหมดผู้ขายในแอปเดียวกัน',
                },
                {
                  title: 'เขียนดีไซน์ซิสเต็มเป็นเอกสาร',
                  desc: 'guidelines/Guidelines.md — พาเลตต์ สเกลตัวอักษร กริด 8 จุด สเกลมุมโค้ง เกณฑ์ contrast WCAG AA และกฎเวลาแอนิเมชัน 100/300/500 มิลลิวินาที ให้ทุกคนอ้างอิงชุดเดียวกัน',
                },
                {
                  title: 'แยกคอมโพเนนต์กลาง',
                  desc: 'ปุ่มไอคอน การ์ดสินค้า บอตทอมชีต หัวเพจ ป้ายตัวเลข วีลพิกเกอร์ ฯลฯ 10 ตัว ตามกฎ rule of three ที่เขียนไว้ในไกด์ไลน์เอง',
                },
              ],
            },
            {
              label: 'ผลการดำเนินงาน',
              color: '#33312c',
              stat: '14',
              statLabel: 'Screens',
              statNote: 'หน้าจอที่เพิ่มเข้าไปในแอป จากทั้งหมด 149 หน้า',
              lead: 'แอปกดเล่นได้จริงบนเว็บผ่าน Expo web export และรันบนเครื่องจริงทั้ง iOS และ Android จากโค้ดชุดเดียว',
              metrics: [
                { label: 'Commit', value: '22', note: 'ช่วง 26 พ.ค. – 16 ก.ค. 69' },
                { label: 'หน้าจอ', value: '14', note: 'เพิ่มใหม่ในรีโป' },
                { label: 'คอมโพเนนต์', value: '10', note: 'แยกเป็นของกลาง' },
                { label: 'Pull request', value: '2', note: 'merge เข้า main แล้ว' },
              ],
              items: [
                {
                  title: 'ฝั่งผู้ซื้อครบเส้นทาง',
                  desc: 'เข้าสู่ระบบ หน้าแรก รายละเอียดสินค้า ตะกร้า และหน้าชำระเงิน เดินได้ต่อเนื่องจนจบรายการ',
                },
                {
                  title: 'คอนโซลผู้ขาย',
                  desc: 'แดชบอร์ดสรุปออเดอร์ 6 สถานะ สถานะใบเสนอราคา จัดการสินค้าและตัวกรองขั้นสูง พร้อมหน้าเอกสารร้านค้า',
                },
                {
                  title: 'Flash Sale ทั้งชุด',
                  desc: 'เข้าร่วมรอบ เพิ่มสินค้า แก้ไข ดูรายละเอียดรอบ แยกรอบของร้านกับรอบของแอป กรองตามเดือนด้วยวีลพิกเกอร์',
                },
                {
                  title: 'ออกเว็บให้กดเล่นได้',
                  desc: 'ตั้งค่า expo export ฝั่งเว็บและครอบเฟรม 430px ให้ดูเหมือนมือถือ เผยแพร่ผ่าน GitHub Pages เปิดลิงก์ได้เลยไม่ต้องติดตั้ง',
                },
              ],
            },
            {
              label: 'ปัญหาที่พบ',
              color: '#46433c',
              strip: true,
              stat: '4',
              statLabel: 'Issues',
              statNote: 'ปัญหาที่เจอตอนทำจริงและวิธีที่แก้',
              lead: 'ส่วนใหญ่เป็นเรื่องความต่างระหว่างแพลตฟอร์ม — สิ่งที่ทำงานบน iOS ไม่ได้แปลว่าทำงานบน Android',
              items: [
                {
                  title: 'Liquid Glass มีเฉพาะ iOS 26 ขึ้นไป',
                  desc: 'แถบลอยแบบกระจกใช้ได้จริงแค่ iOS 26+ กับเว็บ ส่วน Android และ iOS รุ่นเก่าไม่มี ถ้าปลอมความโปร่งใสเนื้อหาด้านหลังจะทะลุขึ้นมาอ่านไม่ออก',
                  fix: 'เช็กเวอร์ชันตอนรันแล้วสลับเป็นพิลล์ทึบสีขาวชุดเดียวกันเมื่อไม่มีของจริง — หน้าตาไม่เหมือนเป๊ะแต่ยังอ่านได้ทุกเครื่อง',
                },
                {
                  title: 'เงาการ์ดบน Android ซ้อนสองชั้น',
                  desc: 'การ์ดใส่ทั้ง boxShadow และ elevation ทำให้ Android วาดเงาสองที และ boxShadow ยังเพี้ยนเมื่อการ์ดถูก transform ในคารูเซล',
                  fix: 'แยกตามแพลตฟอร์ม — iOS ใช้ boxShadow สองชั้นตามสเปก Android ใช้ elevation อย่างเดียวบนพื้นทึบ เพราะ Android วาดเงาจากรูปทรงของ view เอง',
                },
                {
                  title: 'สระและวรรณยุกต์ไทยดันความสูงบรรทัด',
                  desc: 'ข้อความไทยใน pill และ badge เยื้องออกจากกลางเพราะ Android เผื่อที่ให้ตัวบนตัวล่างเสมอ',
                  fix: 'ตั้ง lineHeight ราว 1.2 เท่าของขนาดตัวอักษรทุกที่ และปิด includeFontPadding บน Android',
                },
                {
                  title: 'กริดสินค้า 2 คอลัมน์แตกบางเครื่อง',
                  desc: 'ความกว้างการ์ดที่คำนวณได้เป็นทศนิยม ทำให้ flex-wrap ดันการ์ดใบที่สองตกบรรทัด',
                  fix: 'ปัดลงเป็นจำนวนเต็มเสมอ แล้วเขียนสูตรนี้ไว้ในคู่มือโปรเจกต์ให้ทุกกริดใช้ตัวเดียวกัน',
                },
              ],
            },
            {
              label: 'สิ่งที่ได้เรียนรู้',
              color: '#5a5750',
              stat: '4',
              statLabel: 'Takeaways',
              statNote: 'สิ่งที่เปลี่ยนวิธีทำงานหลังจบโปรเจกต์นี้',
              lead: 'บทเรียนหลักคือดีไซน์ซิสเต็มต้องเขียนออกมาเป็นข้อความ ไม่ใช่เก็บไว้ในหัวหรือในไฟล์ Figma อย่างเดียว',
              items: [
                {
                  title: 'เขียนกฎก่อนวาดจอ',
                  desc: 'ทำเอกสารไกด์ไลน์ให้จบก่อน แล้วอ้างอิงตอนรีวิวงาน ทำให้เถียงกันด้วยเหตุผลแทนรสนิยม',
                },
                {
                  title: 'โทเคนกับคอมโพเนนต์ใช้เกณฑ์คนละแบบ',
                  desc: 'ค่าพื้นฐาน (สี ระยะ มุมโค้ง) ทำเป็นโทเคนได้ทันทีตั้งแต่ใช้ที่เดียว แต่คอมโพเนนต์ต้องรอให้ใช้ซ้ำครบสามที่ก่อนค่อยแยก ไม่งั้นได้ abstraction ที่ผิด',
                },
                {
                  title: 'ออกแบบเผื่อแพลตฟอร์มที่ไม่มีของ',
                  desc: 'ทุกลูกเล่นที่พึ่งของเฉพาะ iOS ต้องมีทางถอยที่ยังใช้งานได้บน Android ตั้งแต่ตอนออกแบบ ไม่ใช่ไปแก้ตอนเจอบั๊ก',
                },
                {
                  title: 'ปรับสเปกจากเว็บให้เข้ากริด',
                  desc: 'ก็อประยะจากเว็บมาตรง ๆ ได้ค่าอย่าง 10 หรือ 14 ปนมาด้วย เลยตั้งกฎว่าให้คงหน้าตาไว้แต่ปัดระยะเข้ากริด 4/8 เสมอ',
                },
              ],
            },
          ],
        },
        blocks: [
          { type: 'heading', text: 'One app, two sides' },
          {
            type: 'paragraph',
            text: 'METAHERB as a phone app: a shopping flow for buyers, and an owner console for the shops that sell on it.',
          },
        ],
      },
      {
        id: 'design-system',
        label: 'Design System',
        cardColor: '#319754',
        detail: 'feed',
        detailStart: 'Color',
        // PROVENANCE: the tokens below are the ones written into the repo —
        // guidelines/Guidelines.md and src/theme/tokens.ts — cross-checked
        // against computed styles sampled from the running build. Where the
        // build disagrees with the guideline, the guideline is quoted and the
        // drift is stated rather than hidden.
        cards: [
          { id: 'component', label: 'Component', color: '#21221f' },
          { id: 'typography', label: 'Typography', color: '#33312c', art: 'typeface' },
          { id: 'color', label: 'Color', color: '#319754' },
          { id: 'grid', label: 'Grid & Layout', color: '#5a5750', art: 'inspect' },
          { id: 'hifi', label: 'Hi-fi', color: '#267a43', art: 'shot' },
        ],
        component: {
          count: 10,
          tone: '#319754',
          platform: 'React Native',
          source: 'แยกจากหน้าจอจริงในรีโป',
          note: 'สิบตัวนี้คือคอมโพเนนต์ที่แยกออกมาเป็นของกลางเอง จากทั้งหมด 44 ตัวในโปรเจกต์ — เกณฑ์คือใช้ซ้ำครบสามที่และพฤติกรรมเหมือนกันจริง ตามกฎ rule of three ในไกด์ไลน์',
          items: [
            { name: 'ProductCard', kind: 'tile', role: 'Commerce', use: 'การ์ดสินค้าในกริดสองคอลัมน์ สูง 259 ปกติ และ 290 เมื่อมีแถบ Flash Sale ราคาลดเป็นแดง ราคาปกติเป็นเขียว' },
            { name: 'BottomSheet', kind: 'card', role: 'Surface', use: 'ชีตจากขอบล่างสำหรับตัวเลือกและฟอร์มย่อย มุมบน 15 ปัดเฉพาะสองมุม' },
            { name: 'PageHeader', kind: 'card', role: 'Navigation', use: 'หัวเพจสีแบรนด์พร้อมปุ่มย้อนกลับทรงกลม ใช้ซ้ำทุกหน้าย่อย' },
            { name: 'IconButton', kind: 'button', role: 'Action', use: 'ปุ่มไอคอนวงกลม ขยายพื้นที่กดด้วย hitSlop ให้ถึง 44pt โดยไม่ทำให้ตัวปุ่มบวม' },
            { name: 'CountBadge', kind: 'badge', role: 'Status', use: 'ป้ายตัวเลขบนไอคอนตะกร้าและกระดิ่ง พื้นแดง #ee4d2d ตัวอักษร 10' },
            { name: 'WheelPicker', kind: 'toggle', role: 'Form', use: 'วงล้อเลือกเดือนและปีในตัวกรอง Flash Sale แทน dropdown ที่กดยากบนมือถือ' },
            { name: 'StickyFilterList', kind: 'steps', role: 'Navigation', use: 'แถบค้นหาและตัวกรองที่ค้างบนสุดขณะเลื่อนรายการยาว' },
            { name: 'EmptyState', kind: 'skeleton', role: 'Feedback', use: 'สถานะว่างที่สอนด้วยตัวอย่าง ไม่ใช่ข้อความยาว ตามหลัก Paradox of the Active User' },
            { name: 'Skeleton', kind: 'skeleton', role: 'Feedback', use: 'โครงร่างระหว่างโหลดที่มีทรงเท่าเนื้อหาจริง กันหน้ากระโดดตอนข้อมูลมา' },
            { name: 'FlashSaleHero', kind: 'card', role: 'Commerce', use: 'หัวโซน Flash Sale พร้อมนาฬิกานับถอยหลัง ตัวเลขขาวบนกล่องแดง #bc1b06' },
          ],
        },
        typography: {
          tone: '#319754',
          latin: 'System (San Francisco / Roboto)',
          thai: 'IBM Plex Sans Thai Looped',
          classification: 'System sans · Looped Thai สำหรับหัวเรื่อง',
          note: 'ตัวหลักใช้ฟอนต์ระบบเพื่อให้ตัวไทยเรนเดอร์ตามเครื่องผู้ใช้และไม่ต้องแบกไฟล์ฟอนต์ ส่วน IBM Plex Sans Thai Looped ที่เป็นฟอนต์แบรนด์จากฝั่งเว็บโหลดเฉพาะน้ำหนัก Medium กับ Bold ไว้ใช้กับหัวเรื่อง — วัดจากบิลด์จริง ข้อความ 831 จุดเป็นฟอนต์ระบบ และ 6 จุดเป็น IBM Plex',
          weights: [
            { name: 'Regular', value: 400 },
            { name: 'Medium', value: 500 },
            { name: 'SemiBold', value: 600 },
            { name: 'Bold', value: 700 },
          ],
          scale: [
            { role: 'Section heading', token: 'heading/20', px: 20, weight: 500, usage: 'หัวข้อโซน' },
            { role: 'Screen title', token: 'title/18', px: 18, weight: 700, usage: 'ชื่อหน้าจอ' },
            { role: 'Body', token: 'body/14', px: 14, weight: 400, usage: 'เนื้อความ · ชื่อการ์ด' },
            { role: 'Sub', token: 'sub/13', px: 13, weight: 400, usage: 'บรรทัดรอง' },
            { role: 'Caption', token: 'caption/12', px: 12, weight: 400, usage: 'คำบรรยาย' },
            { role: 'Meta', token: 'meta/11', px: 11, weight: 400, usage: 'เรตติ้ง · ยอดขาย · ป้าย' },
            { role: 'Micro', token: 'micro/10', px: 10, weight: 700, usage: 'ตัวเลขนับถอยหลัง · ป้ายเล็ก' },
          ],
        },
        color: {
          brand: {
            name: 'METAHERB Green',
            hex: '#319754',
            token: 'BRAND_GREEN',
            harmony: 'เขียวแบรนด์ · แดงเร่งด่วนสงวนไว้เฉพาะส่วนลด · เทากลาง',
            note: 'เขียวคือสีเดียวที่ใช้กับปุ่มหลักและสถานะทำงาน ส่วนแดงถูกสงวนไว้สำหรับ Flash Sale และราคาลดเท่านั้น — ถ้าเอาไปใช้ที่อื่นความหมายเร่งด่วนจะหายไป เป็นกฎที่เขียนห้ามไว้ในไกด์ไลน์ตรง ๆ',
          },
          groups: [
            {
              name: 'Brand',
              on: '#FFFFFF',
              swatches: [
                { name: 'Brand Green', hex: '#319754', token: 'BRAND_GREEN', usage: 'ปุ่มหลัก · แท็บที่เลือก · หัวเพจ' },
                { name: 'Green Dark', hex: '#267A43', token: 'BRAND_GREEN_DARK', usage: 'สถานะกด' },
                { name: 'Price Green', hex: '#226A3B', token: 'PRICE_GREEN', usage: 'ราคาที่ไม่ลด' },
                { name: 'Green Tint', hex: '#E6F5EC', token: 'BRAND_GREEN_TINT', usage: 'พื้นอ่อน · ชิปวงกลม' },
              ],
            },
            {
              name: 'Urgency (Flash Sale เท่านั้น)',
              on: '#FFFFFF',
              swatches: [
                { name: 'Price Red', hex: '#E62E05', token: 'PRICE_RED', usage: 'ราคาหลังลด' },
                { name: 'Countdown', hex: '#BC1B06', token: 'countdown', usage: 'กล่องตัวเลขนับถอยหลัง' },
                { name: 'Badge Red', hex: '#EE4D2D', token: 'BADGE_RED', usage: 'ป้ายจำนวน · ป้ายส่วนลด' },
                { name: 'Star', hex: '#F59E0B', token: 'STAR_YELLOW', usage: 'ดาวเรตติ้ง (คู่กับรูปดาวเสมอ)' },
              ],
            },
            {
              name: 'Neutral',
              on: '#0A0A0A',
              swatches: [
                { name: 'Text Primary', hex: '#0A0A0A', token: 'TEXT_PRIMARY', usage: 'ตัวหนังสือหลัก' },
                { name: 'Text Secondary', hex: '#525252', token: 'TEXT_SECONDARY', usage: 'บรรทัดรอง' },
                { name: 'Text Muted', hex: '#737373', token: 'TEXT_MUTED', usage: 'คำบรรยาย · placeholder' },
                { name: 'Surface', hex: '#F5F5F5', token: 'SURFACE_GRAY', usage: 'พื้นรอง' },
                { name: 'Border', hex: '#E5E7EB', token: 'BORDER_GRAY', usage: 'เส้นขอบ' },
                { name: 'Page', hex: '#FAFAFA', token: 'page', usage: 'พื้นหน้าจอ' },
              ],
            },
          ],
        },
        grid: {
          base: 8,
          tone: '#319754',
          note: 'ระยะและขนาดทุกค่าเป็นพหุคูณของ 4 ตั้งต้นที่ 8 และใช้ 4 เฉพาะรายละเอียดเล็ก — เขียนเป็นกฎไว้ในไกด์ไลน์ของโปรเจกต์ ตรวจกับบิลด์จริงแล้วยังมีค่า 3/5/6 หลงเหลือจากตอนพอร์ตจากเว็บ ซึ่งเป็นส่วนที่ยังไล่เก็บไม่หมด',
          container: { screen: 430, content: 398, margin: 16 },
          spacing: [
            { token: 'xs', value: 4 },
            { token: 'sm', value: 8 },
            { token: 'gap', value: 12 },
            { token: 'md', value: 16 },
            { token: 'lg', value: 24 },
            { token: 'lg+', value: 32 },
            { token: 'xl', value: 48 },
          ],
          margins: [
            { value: 16, use: 'ขอบจอมาตรฐาน · พื้นที่ในการ์ด' },
            { value: 12, use: 'ช่องไฟระหว่างการ์ดในกริดสองคอลัมน์' },
            { value: 24, use: 'ระยะห่างระหว่างโซน' },
          ],
          radius: [
            { name: 'sm', value: 4 },
            { name: 'lg', value: 8 },
            { name: 'xl', value: 12 },
            { name: '2xl', value: 16 },
            { name: 'pill', value: 999 },
          ],
          sizes: [
            { name: 'ปุ่มหลัก', value: 48 },
            { name: 'พื้นที่กดขั้นต่ำ (iOS)', value: 44 },
            { name: 'การ์ดสินค้าปกติ', value: 259 },
            { name: 'การ์ดสินค้า Flash Sale', value: 290 },
          ],
          breakpoint: 700,
          layouts: [
            { name: 'Phone', range: '< 700pt', note: 'กริดสินค้าสองคอลัมน์ ความกว้างการ์ดคำนวณแล้วปัดลงเป็นจำนวนเต็มเสมอ' },
            { name: 'Tablet', range: '≥ 700pt', note: 'กริดขยายเป็นสี่คอลัมน์ และเนื้อหาแบบคอลัมน์เดียวถูกจำกัดความกว้างที่ 680pt ให้อ่านสบาย' },
          ],
        },
        hifi: {
          container: { screen: 430, height: 932 },
          note: 'Hi-fi คือหน้าจอจริงที่ลงสี ฟอนต์ และคอมโพเนนต์ครบตามดีไซน์ซิสเต็ม — ชุดนี้จับจากบิลด์เว็บสาธารณะของแอป ที่ความกว้าง 430 ซึ่งเป็นแคนวาสที่ออกแบบไว้',
          screens: [
            {
              name: 'หน้าแรก',
              src: `${import.meta.env.BASE_URL}mm-home-430.webp`,
              note: 'แบนเนอร์ หมวดหมู่ และโซนสินค้าแนะนำแบบเลื่อนทีละหน้า',
            },
            {
              name: 'รายละเอียดสินค้า',
              src: `${import.meta.env.BASE_URL}mm-detail-430.webp`,
              note: 'ตัวเลือกสินค้า จำนวน และแถบซื้อที่ค้างอยู่ล่างจอ',
            },
            {
              name: 'ตะกร้า',
              src: `${import.meta.env.BASE_URL}mm-cart-430.webp`,
              note: 'เลือกรายการ สรุปยอด และทางแยกไปออกใบ PR หรือขอใบเสนอราคา',
            },
            {
              name: 'คอนโซลร้านค้า',
              src: `${import.meta.env.BASE_URL}mm-shop-430.webp`,
              note: 'แดชบอร์ดออเดอร์หกสถานะ สถานะใบเสนอราคา และทางลัดจัดการร้าน',
            },
          ],
        },
        blocks: [],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // PLACEHOLDERS. Two more projects belong in this portfolio; only their NAMES
  // have been given so far, so only their names are here. Every other field is
  // deliberately empty rather than filled with something plausible — a portfolio
  // is a record of work that was actually done, and an invented tagline, tech
  // stack or metric on one of these would be indistinguishable from the real
  // ones above.
  //
  // To finish either: fill `tagline`, `bio`, `accent`, `avatar`, `cover`,
  // `techStack`, `prototypeUrl`, `repoUrl` and its `tabs` the way the three
  // projects above are filled. Until then they appear as titles in the section
  // list and nothing else claims to be true about them.
  // ---------------------------------------------------------------------------
  {
    id: 'metaherb-cafe',
    tab: '',
    title: 'Metaherb Cafe',
    tagline: '',
    handle: '',
    accent: null,
    cover: null,
    video: null,
    avatar: null,
    bio: '',
    stats: null,
    techStack: [],
    kind: '',
    category: '',
    prototypeUrl: null,
    repoUrl: null,
    tabs: [],
  },
  {
    id: 'myatlas',
    tab: '',
    title: 'MyAtlas',
    tagline: '',
    handle: '',
    accent: null,
    cover: null,
    video: null,
    avatar: null,
    bio: '',
    stats: null,
    techStack: [],
    kind: '',
    category: '',
    prototypeUrl: null,
    repoUrl: null,
    tabs: [],
  },
]

export default projects
