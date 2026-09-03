// Captures MyAtlas's landing screen off the live Flutter web build into
// public/ma-home-390.webp. Run: node scripts/capture-myatlas.mjs
import pp from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const b = await pp.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 120000 })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await p.goto('https://oommiemie.github.io/myatlas_app/', { waitUntil: 'networkidle2', timeout: 90000 })
await new Promise(r => setTimeout(r, 15000))
const png = await p.screenshot()
const data = await p.evaluate((b64) => new Promise((res) => {
  const img = new Image()
  img.onload = () => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); res(c.toDataURL('image/webp', 0.86)) }
  img.src = 'data:image/png;base64,' + b64
}), png.toString('base64'))
writeFileSync('public/ma-home-390.webp', Buffer.from(data.split(',')[1], 'base64'))
await b.close()
