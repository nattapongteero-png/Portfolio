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
