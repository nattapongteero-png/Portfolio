// ---------------------------------------------------------------------------
// capture-mobilemetaherb.mjs
// The Hi-fi screens for the Metaherb Mobile report, captured off the public
// Expo web export at the 430 x 932 canvas the app is designed against, and
// written straight into public/ as WebP.
//
// The owner console is behind Account's shop-mode TOGGLE (hit on the row's
// right edge, since it has no text of its own), which then reveals the
// dashboard entry. Run: node scripts/capture-mobilemetaherb.mjs
// ---------------------------------------------------------------------------
import pp from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const B = 'https://nattapongteero-png.github.io/MobileMetaherb/'
const b = await pp.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 120000 })
const p = await b.newPage()
await p.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 })
const w = (ms) => new Promise(r => setTimeout(r, ms))
const tap = async (re, { last = false, delay = 2000 } = {}) => {
  const box = await p.evaluate((src, lastOne) => {
    const rx = new RegExp(src)
    const all = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && rx.test(e.textContent || ''))
    const el = lastOne ? all.pop() : all[0]
    if (!el) return null
    el.scrollIntoView({ block: 'center' })
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }
  }, re, last)
  if (!box) { console.log('MISS', re); return false }
  await p.mouse.click(box.x, box.y); await w(delay); return true
}
const webp = async (png, out) => {
  const data = await p.evaluate((b64) => new Promise((res) => {
    const img = new Image()
    img.onload = () => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); res(c.toDataURL('image/webp', 0.86)) }
    img.src = 'data:image/png;base64,' + b64
  }), png.toString('base64'))
  writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'))
  console.log(out)
}
const shot = async (file) => {
  await p.evaluate(() => { window.scrollTo(0, 0); for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 40) e.scrollTop = 0 })
  await w(1200)
  await webp(await p.screenshot(), `public/${file}`)
}
await p.goto(B, { waitUntil: 'networkidle2', timeout: 60000 }); await w(8000)
await shot('mm-home-430.webp')
await tap('เมต้าเฮิร์บ สมุนไพรหอม')
await shot('mm-detail-430.webp')

// Cart: the basket already carries items in the build's own state, and it is
// reached from the header's cart button (an icon, so it is hit by position).
await p.goto(B, { waitUntil: 'networkidle2', timeout: 60000 }); await w(8000)
await p.mouse.click(390, 30); await w(2600)
console.log('cart title', await p.title())
await shot('mm-cart-430.webp')

// The owner console — the dashboard half of the app. It is behind the
// account's shop-mode switch (a toggle, so it is hit on the row's right edge),
// which then reveals the "แดชบอร์ดร้านค้า" entry.
await p.goto(B, { waitUntil: 'networkidle2', timeout: 60000 }); await w(8000)
await tap('^ฉัน$')
await p.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 40) e.scrollTop = e.scrollHeight })
await w(1200)
const row = await p.evaluate(() => {
  const e = [...document.querySelectorAll('*')].find(x => x.children.length === 0 && /^โหมดทดสอบร้านค้า$/.test(x.textContent || ''))
  const r = e.getBoundingClientRect()
  return { y: Math.round(r.y + r.height / 2) }
})
await p.mouse.click(376, row.y); await w(2500)
await p.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 40) e.scrollTop = e.scrollHeight })
await w(1000)
await tap('^แดชบอร์ดร้านค้า$', { delay: 3500 })
console.log('shop title', await p.title())
await shot('mm-shop-430.webp')

await b.close()
