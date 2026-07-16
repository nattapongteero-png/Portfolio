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
