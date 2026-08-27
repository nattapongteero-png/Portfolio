// -----------------------------------------------------------------------------
// capture-metaherb.mjs
// The Hi-fi screens for the Metaherb / Herbal Market report, captured off the
// PUBLIC build at the same 390 x 844 / 2x the Pawmely captures use, and written
// straight into public/ as WebP.
//
// Two things this has to get right, both learned the hard way:
//   • The build pins a transient order reminder over the top of every page. It is
//     REMOVED from the DOM rather than clicked shut — its close control is an
//     unlabelled button, and a "click the unlabelled button in the fixed layer"
//     pass opened the AI assistant instead and put its chat screen into the file
//     named market.
//   • The cart is captured with something actually in it: an empty cart is an
//     empty state, not the screen the report is describing.
//
// Run: node scripts/capture-metaherb.mjs
// -----------------------------------------------------------------------------

import { writeFileSync } from 'node:fs'
import pp from 'puppeteer-core'

const B = 'https://oommiemie.github.io/Metaherb'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// A real item id off /market — the quote and PR routes are /market/:id/... and a
// made-up id renders "ไม่พบวัตถุดิบรายการนี้".
const ITEM = 'm-saffron'

const b = await pp.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 120000 })
const p = await b.newPage()
p.on('dialog', (d) => d.dismiss())
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
const w = (ms) => new Promise((r) => setTimeout(r, ms))

// Anything the app floats over the page that is not part of the screen being
// documented: the order reminder, and the assistant's hover tooltip.
const NOISE = ['ยังไม่ได้ยืนยันคำสั่งซื้อ', 'เมต้าสามารถ']
const strip = () =>
  p.evaluate((noise) => {
    for (const text of noise) {
      // Every tag, not just div: the assistant's tooltip is a span, and a
      // div-only sweep left it sitting across the bottom of the quote page.
      const hit = [...document.querySelectorAll('*')]
        .filter((el) => el.textContent.includes(text) && el.textContent.length < 400)
        .pop()
      if (hit) (hit.closest('[class*=fixed]') ?? hit).remove()
    }
    // The assistant also floats a nudge bubble beside its orb, with rotating
    // copy ("วันนี้สนใจอะไรเป็นพิเศษไหมคะ", …) — so it is caught by SHAPE, not by
    // text: a fixed layer carrying words, low and right. The orb itself has no
    // text and survives; the cart's own buttons are static, not fixed, so they
    // are never touched.
    for (const el of document.querySelectorAll('*')) {
      if (getComputedStyle(el).position !== 'fixed') continue
      const t = el.textContent.trim()
      if (!t || t.length > 120) continue
      const r = el.getBoundingClientRect()
      if (r.bottom > innerHeight - 200 && r.right > innerWidth / 2) el.remove()
    }
    window.scrollTo(0, 0)
  }, NOISE)

// The assistant's tooltip animates in on its own timer, so one pass before the
// wait is not enough — it was back on screen by the time the shutter fired.
const clean = async () => {
  await w(5000)
  await strip()
  await w(900)
}

// PNG → WebP through the browser's own encoder: sips on this machine cannot
// write WebP, and the site ships every screenshot as one.
const webp = async (png, out) => {
  const data = await p.evaluate(
    (b64) =>
      new Promise((res) => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = img.naturalWidth
          c.height = img.naturalHeight
          c.getContext('2d').drawImage(img, 0, 0)
          res(c.toDataURL('image/webp', 0.86))
        }
        img.src = 'data:image/png;base64,' + b64
      }),
    png.toString('base64')
  )
  writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'))
  console.log(out)
}

const shot = async (path, file) => {
  await p.goto(B + path, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await clean()
  await strip()
  const png = await p.screenshot()
  await webp(png, `public/${file}`)
}

await shot('/market', 'mh-market-390.webp')
await shot(`/market/${ITEM}/quote`, 'mh-quote-390.webp')
await shot(`/market/${ITEM}/pr`, 'mh-pr-390.webp')

await p.goto(`${B}/market/${ITEM}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
await clean()
await p.evaluate(() => {
  ;[...document.querySelectorAll('button')].find((e) => e.textContent.trim() === 'เพิ่มไปยังรถเข็น')?.click()
})
await w(2000)
await shot('/cart', 'mh-cart-390.webp')

await b.close()
