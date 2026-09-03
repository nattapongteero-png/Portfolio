// Hi-fi captures for the Metaherb Cafe design pages: cafe home, item detail,
// cart, payment sheet — off the public build, 430×932 @2x, straight screenshots.
import pp from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const b = await pp.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 120000 })
const p = await b.newPage()
const w = (ms) => new Promise(r => setTimeout(r, ms))
await p.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 })
const webp = async (out) => {
  const png = await p.screenshot()
  const data = await p.evaluate((b64) => new Promise((res) => {
    const img = new Image()
    img.onload = () => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); res(c.toDataURL('image/webp', 0.86)) }
    img.src = 'data:image/png;base64,' + b64
  }), png.toString('base64'))
  writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'))
  console.log(out)
}
const press = async (re, delay = 2500, last = false) => {
  const ok = await p.evaluate((src, lastOne) => {
    const rx = new RegExp(src)
    const all = [...document.querySelectorAll('*')].filter(e => !e.children.length && rx.test((e.textContent || '').trim()))
    const el = lastOne ? all.pop() : all[0]
    if (!el) return false
    let a = el
    while (a && a !== document.body && !(a.getAttribute && (a.getAttribute('role') === 'button' || a.tabIndex >= 0))) a = a.parentElement
    const target = (a && a !== document.body) ? a : el.parentElement
    const r = target.getBoundingClientRect()
    for (const type of ['pointerdown','mousedown','pointerup','mouseup','click'])
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: r.x + r.width/2, clientY: r.y + Math.min(r.height/2, 30), view: window }))
    return true
  }, re, last)
  if (!ok) console.log('MISS', re)
  await w(delay)
  return ok
}
const top = async () => { await p.evaluate(() => { window.scrollTo(0,0); for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 40) e.scrollTop = 0 }); await w(1200) }

await p.goto('https://nattapongteero-png.github.io/MobileMetaherb/?screen=Cafe', { waitUntil: 'networkidle2', timeout: 90000 }); await w(10000)
await top(); await webp('public/cafe-home-430.webp')
await press('^Iced Americano$', 3000)
await top(); await webp('public/cafe-item-430.webp')
// add to cart from the detail page, then open the cart
await press('เพิ่มลงตะกร้า|ใส่ตะกร้า|เพิ่มใส่ตะกร้า', 2500)
console.log('body:', JSON.stringify(await p.evaluate(() => document.body.innerText.slice(0,80))))
await press('ตะกร้า|ดูตะกร้า', 3000, true)
await top(); await webp('public/cafe-cart-430.webp')
await press('เลือกวิธีชำระเงิน|ชำระเงิน|ไปชำระเงิน', 3000)
await top(); await webp('public/cafe-pay-430.webp')
console.log('final:', JSON.stringify(await p.evaluate(() => document.body.innerText.slice(0,80))))
await b.close()
