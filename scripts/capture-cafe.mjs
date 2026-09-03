import pp from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const b = await pp.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 120000 })
const p = await b.newPage()
const w = (ms) => new Promise(r => setTimeout(r, ms))
await p.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 })
await p.goto('https://nattapongteero-png.github.io/MobileMetaherb/', { waitUntil: 'networkidle2', timeout: 60000 }); await w(9000)
const info = await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => !e.children.length && /^META Caffe$/.test((e.textContent||'').trim()))
  if (!el) return null
  const r = el.getBoundingClientRect()
  const hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2)
  // walk up from the TEXT element to a pressable ancestor and fire events on it
  let a = el
  while (a && a !== document.body && !(a.getAttribute && (a.getAttribute('role') === 'button' || a.tabIndex >= 0))) a = a.parentElement
  const target = (a && a !== document.body) ? a : el.parentElement
  const rr = target.getBoundingClientRect()
  const cx = rr.x + rr.width/2, cy = rr.y + Math.min(rr.height/2, 30)
  for (const type of ['pointerdown','mousedown','pointerup','mouseup','click']) {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window }))
  }
  return { role: target.getAttribute('role'), cls: (target.className||'').toString().slice(0,40), hitTag: hit && hit.tagName }
})
console.log(info)
await w(4000)
console.log('after:', JSON.stringify(await p.evaluate(() => document.body.innerText.slice(0, 150))))
await p.evaluate(() => { window.scrollTo(0, 0); for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 40) e.scrollTop = 0 })
await w(1500)
const png = await p.screenshot()
const data = await p.evaluate((b64) => new Promise((res) => {
  const img = new Image()
  img.onload = () => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); res(c.toDataURL('image/webp', 0.86)) }
  img.src = 'data:image/png;base64,' + b64
}), png.toString('base64'))
writeFileSync('public/mc-cafe-430.webp', Buffer.from(data.split(',')[1], 'base64'))
await b.close()
