# Portfolio — Nattapong

TikTok-style vertical portfolio. React + Vite + Tailwind + Framer Motion, with an
interactive 3D isometric office scene (React Three Fiber) on the MyAtlas project.

**Live:** https://nattapongteero-png.github.io/Portfolio/

## Stack
- React 18 + Vite 5
- Tailwind CSS
- Framer Motion (menu wheel + transitions)
- React Three Fiber + Drei + postprocessing (3D office scene)

## Develop
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run deploy   # build + publish dist/ to gh-pages branch
```

## Deploy (GitHub Pages)
- `vite.config.js` `base: '/Portfolio/'`
- `npm run deploy` publishes `dist/` to the `gh-pages` branch via the `gh-pages` package.
- In the repo: Settings → Pages → Source = `gh-pages` branch.

---

## Changelog

> ทุกครั้งที่อัปเดต/push ให้บันทึกรายละเอียดการแก้ไขไว้ที่นี่ (ใหม่สุดอยู่บน).

### 2026-09-03 (2) — แก้ชื่อฟอนต์ให้ตรงของจริง, กัน 3D model หายหลังเข้าหน้ารายละเอียด

**Typography ทุกโปรเจคตรวจใหม่จากของจริง** — เดิมเขียนตาม "ฟอนต์ที่เว็บ export เรนเดอร์ออกมา"
ซึ่งไม่ใช่ฟอนต์ที่ออกแบบไว้:
- **MyAtlas** ไม่ใช่ DM Sans — อ่านจากบันเดิลบิลด์จริง (`FontManifest.json` + ตารางฟอนต์ใน
  `main.dart.js`) ได้ **IBM Plex Sans Thai Looped** สำหรับตัวหนังสือ + **Nunito เฉพาะตัวเลข**
  (`NunitoNum.ttf` 17KB) และมีตัวเลือกสลับอีก 4 แบบในหน้าตั้งค่า (ซอร์สในเครื่องเก่ากว่าบิลด์ 4 เดือน)
- **Metaherb Mobile / Cafe** ไม่ใช่ฟอนต์ระบบ — ของจริงคือ IBM Plex Sans Thai Looped ตามไกด์ไลน์
  และ `App.tsx` ที่ patch ให้ทุก Text ใช้; เว็บ export เรนเดอร์เป็นฟอนต์ระบบเพราะ patch ไม่ทำงานบน
  react-native-web (ย้ายข้อเท็จจริงนี้ไปไว้ในหมายเหตุ)
- **Metaherb (เว็บ)** สเกลผิด 4 จาก 6 แถว วัดใหม่ทั้งหมด: หัวข้อ 20/500 (ไม่ใช่ 700), ราคา 18/700
  (ไม่ใช่ 14/700), ชื่อสินค้า 14/600, MOQ 13/600 และเพิ่มแถวคะแนนรีวิว 11/500
- **Metaherb Cafe** แยกบล็อก typography ของตัวเอง — วัดแล้วใช้สเกลคนละชุดกับ Mobile
  (ยืนด้วยน้ำหนัก 800 เป็นหลัก มีขนาด 9.5/15.5/19 ที่หน้าอื่นไม่มี)

**3D model หายหลังออกจากหน้ารายละเอียด** — เบราว์เซอร์จำกัดจำนวน WebGL context ต่อหน้า เดิมทุก
section เปิด canvas ค้างไว้ (6 context) เปิดหน้ารายละเอียดเพิ่มอีก 3 → Chrome ฆ่าตัวเก่าสุดทิ้งเงียบๆ
(จับ log "Context Lost" ได้ 3 ครั้ง ไม่มี restore) canvas ยังอยู่แต่วาดไม่ได้ แก้สามชั้น: section ไกล
ไม่เปิด canvas (เหลือ ±1 หน้า), ปลด canvas ของ stage ตอนหน้ารายละเอียดเปิด, และ `useGLRecover.js`
ที่ remount canvas + ยิงเฟรมรัวสั้น ๆ ถ้ายังโดนฆ่าอยู่ดี

### 2026-09-03 — 5 โปรเจคครบเท่ากัน, live component kit ต่อโปรเจค, scroll กลับมา

**Metaherb Cafe + MyAtlas เต็มรูปแบบ** — จากชื่อเปล่ากลายเป็นหน้าโปรเจคเท่าโปรเจคอื่นทุกหัวข้อ:
- **Metaherb Cafe**: ใช้บิลด์เดียวกับ Metaherb Mobile (คาเฟ่อยู่ในแอปนั้น) เปิด prototype ตรง
  หน้าคาเฟ่ผ่าน `?screen=Cafe`, cover + Hi-fi 4 จอจับจากบิลด์จริง (`scripts/capture-cafe*.mjs`)
- **MyAtlas**: โมเดลมือถือ + prototype จากบิลด์ Flutter จริง, โลโก้ MYATLASCARE จาก asset bundle
  ของแอป, Hi-fi 4 แท็บจับจากเว็บ live (`scripts/capture-myatlas*.mjs`)
- ทั้งคู่มี Design System ครบ 6 การ์ด (Component / Typography / Color / Grid / Low-fi / Hi-fi)
  เหมือนโปรเจคอื่น — Mobile กับ Cafe แชร์ระบบเดียวกันผ่าน `MM_SYSTEM` เพราะอยู่รีโปเดียวกัน

**Live component kit แยกต่อโปรเจค** — เดิมทุกโปรเจค mount `PawmelyKit` ชุดเดียวกันหมด ตอนนี้
แต่ละแอปมี kit ของตัวเอง rebuild เป็น React กดเล่นได้จริง จาก token/โค้ด/จอจริงของแอปนั้น:
`MetaherbKit.jsx` (7 ตัว) · `MMKit.jsx` (10 ตัว ใช้ร่วม Mobile+Cafe) · `MyAtlasKit.jsx` (7 ตัว)
พร้อมข้อมูล specimen แยกไฟล์ `metaherbDesign.js` / `mobileCafeWireframes.js` / `myatlasDesign.js`
— ทุกค่าวัดจากบิลด์จริงหรืออ่านจากซอร์ส อ้างที่มาไว้ในไฟล์

**เนื้อหาตาม portfolio ฉบับพิมพ์ (PDF)** — บทบาทหน้าที่ / ผลการดำเนินงาน / ปัญหาที่พบ /
สิ่งที่ได้เรียนรู้ ของทั้ง 5 โปรเจคเขียนใหม่ให้ตรงเอกสาร, bio ทุกโปรเจคเขียนใหม่แนวชูความสามารถ,
ตัดตารางแผนงาน (timeline) และการ์ดตัวเลขที่ไม่ตรงออก

**Interaction** — scroll เปลี่ยนโปรเจคได้เหมือนเดิม (ink แถวล่างเลื่อนตาม, รั้วกันหลุด stage ยังอยู่),
ปิด prototype อัตโนมัติเมื่อออกจากหน้า, ปุ่มย้อนกลับหน้ารายละเอียดตรงกับหน้าโปรไฟล์ (32/37),
iframe prototype ใช้ `appViewport` ต่อโปรเจค (430×932 สำหรับ Metaherb Mobile/Cafe) จอไม่โดนตัดขอบ

### 2026-08-27 — Project stage แบบ hirotos, arc-wipe transition, action row ในคอลัมน์เนื้อหา

**Project stage rework (อ้างอิง hirotos.com)** — หน้าโปรเจคเลิกเป็น scroll กลายเป็น "เพจ":
- ปุ่มย้อนกลับ/scrollbar/progress rail ออกหมด; navigation ผ่านแถวชื่อโปรเจคล่างซ้าย (label
  PROJECT สีอ่อน + เส้น hairline + ชื่อ; hover เข้มขึ้น + ลูกศร ↗) และเมนู + มุมขวาบน
- **ArcWipe curtain** (`ArcWipe.jsx` ใหม่): dim 300ms → ม่านขาวขอบโค้ง (ellipse RX 1.35vw,
  RY 1800) กวาดล่างขึ้นบนรอบเดียวด้วย exponential ease (τ=250ms วัดจาก reference จริงแบบ
  frame-by-frame), จอดม่านใต้จอทั้งเส้นโค้ง (รวม sag ~128px) ไม่ให้มุมโผล่ก่อนเลื่อน
- **Masthead**: ชื่อโปรเจคใหญ่มุมซ้ายบน อยู่ใต้ชั้น dim/ม่าน — มืดตามหน้า โดนม่านปิด แล้วลอย
  ขึ้นพร้อมเนื้อหา; `rise-in` ยืดเป็น 920ms / stagger 140ms + GPU layer กัน text สั่น
- โปรเจคครบ 5 ชื่อ (เพิ่ม Metaherb Cafe + MyAtlas เป็น placeholder ชื่ออย่างเดียว รอข้อมูลจริง)

**Action row ในคอลัมน์เนื้อหา (desktop)** — 3 ปุ่ม (avatar/หัวใจ/แชร์) ย้ายจากมุมขวาล่างขึ้น
บนสุดของคอลัมน์ขวา ขนาดเท่ากัน 56px ทั้งสามปุ่ม ลูกศร ↗ ของ avatar โผล่ตอน hover; ปุ่ม
"เล่น UI Prototype" อยู่ล่างสุด; คอลัมน์ยึดหัว (top-anchored) กด "เพิ่มเติม" แล้วไม่มี UI ขยับ;
ตอน prototype เปิด คอลัมน์ยกขึ้นเหนือ click-catcher — ปุ่มฝั่งขวากดได้ระหว่างเล่น prototype

**เมนู Contact = ท่าเดียวกับพลิกบัตร** — กด Contact ในเมนู: กลับหน้าแรก + บัตรพลิกไปหน้า
contact + pills (instagram/linkedin/email/phone) ร่วงลงมา ผ่าน event `flipContact()` ใน
`contactPage.js` (แทนการเปิดหน้า overlay แบบเดิม)

**อื่นๆ** — หน้า Training ใช้ปุ่ม + จริงตัวเดียวกับทั้งเว็บ (z-lift), ใบ cert 3 ใบ, สื่อ
Pawmely/Metaherb/MobileMetaherb ครบชุด, โมเดล MacBook Pro (`macbook_pro_m3_16.glb`),
ระบบสีทดลองถูกถอดกลับทั้งหมด (ทุก section พื้น `#fafafa`)

### 2026-07-22 — Design System pages, project reel, 8px spacing rule

**Design System detail pages (`FeedSheet.jsx`)** — three data-driven specimen panels. Every
number shown is read out of the MyAtlas source or measured off the running prototype; none of
it is illustrative.
- **Color** — `ColorSpecimen`. Brand card + tokens grouped by role (brand / surface / text /
  border / semantic / category). Contrast is computed live (WCAG 2.1 relative luminance)
  against the surface each token actually sits on, with AA / AA-large / fail badges. Palette
  taken from the app's `AppColors` + hex literals compiled into the build, confirmed by
  sampling pixels off the live prototype (`#1D8B6B` brand green).
- **Typography** — `TypeSpecimen`. Set in the real face (IBM Plex Sans Thai Looped, confirmed
  by watching the prototype's font requests — the deployed build does *not* use DM Sans).
  Shows the four shipped weights drawn at their own weight, x-height/cap measured off the TTF,
  and a `Ratio` column for the step multiplier.
- **Grid & Layout** — `GridSpecimen`. Three real captures of the prototype (Home / Health /
  Profile) with a layout-inspector overlay drawn in the screen's own 390×844 coordinate space.
  Gutters, card sizes, gaps and corner radii were all read back off those captures by pixel
  analysis (radii by circle-fitting the corner against the card's fill).

**Project detail restructure (`ProjectDetail.jsx`)**
- Sections with headings; a tab that declares `cards` breaks into one card per topic.
- Tapping any card opens ONE project-wide reel — scroll from any topic to the project's first
  or last without backing out. `FeedSheet` now takes `panels` + `startAt` instead of a tab.
- The sheet's page title is the focused topic (rendered by `NavMenu`), not the project name;
  the back button is measured onto that title rather than pinned to a fixed rect.
- Cards demonstrate what they document: Component carries the draggable `PillJar` of real
  widget names, Typography the "Aa" in the shipped face, Grid & Layout a measured inspect
  overlay on its own corner glyph.
- Header sidebar: team card (avatar stack capped at 3 + `+n`) and downloads card, height
  matched to the measured bio column. **Both hold placeholder figures — replace before ship.**

**Layout**
- `.page-shell` — one centred 1600px column every surface positions against (home nav, sheet
  header/nav, profile column), so the page stops hugging the left edge on wide screens and the
  profile title still lands on the feed title's rect.
- The fade band spans the viewport, not the shell, so panel content cannot scroll past it.
- Prototype iframe is locked to a 390×844 viewport and CSS-scaled to the model, so shrinking
  the mockup no longer reflows the app.
- Focused device 86% → 58% of viewport height; parked device smaller and moved right; side
  action buttons 80 → 56px and anchored to the shell.

**Spacing rule (project-wide)** — the ladder climbs in 8px with a ±4px half-step, in px not pt.
Snapped 53 off-grid values across five components (`gap-1.5`, `py-2.5`, `px-3.5`, `-[9px]`,
`-[71px]`, `-[210px]`, `-[250px]`, `-[94px]`, `-[90px]`, `-[150px]`, `py-[1px]`); a regex audit
over `src/**/*.jsx` now reports no spacing value that is not a multiple of 4.

### 2026-07-16 — Initial release
- **Vertical feed (TikTok-style):** full-page snap scroller, sections Home → projects → Contact.
- **Wheel-picker menu (NavMenu):** 3D cylindrical menu; labels + focused title/description rotate with scroll position (`position` prop); soft spring, no bounce/flicker.
  - Title + description only (subtitle removed); inline "…ดูเพิ่มเติม" toggle with JS truncation measured on a hidden twin (no overlay artifacts).
  - Top readability wash behind the title while scrolling; bottom-fade on the focused section content.
- **Drag:** vertical drag on the menu navigates sections.
- **Side actions:** circular profile avatar per section (hero/contact = personal, projects = project) + like & share (removed comment/save).
- **3D Office scene (MyAtlas project) — `OfficeScene.jsx`:**
  - Isometric orthographic camera; pan-only controls (drag = move up/down/left/right, no rotate/zoom) clamped to stay on-scene.
  - Dense open-plan layout (no dividing walls): desk pods, round breakout tables, bookshelves, lounge, QA phone-testing bench, server racks, dashboards, plants.
  - Realistic desk accessories: keyboards, mice, laptops, mugs, smiley-screen computers.
  - Materials: matte furniture, glass, brushed steel; SoftShadows + N8AO + Bloom + SMAA + Vignette.
  - MyAtlas mint-green theme; softened lighting to reduce glare.
  - Scene memoized so the feed's scroll updates don't re-render the 3D tree (fixes menu flicker).
- **Deploy:** GitHub Pages via `gh-pages` (`base: '/Portfolio/'`).
