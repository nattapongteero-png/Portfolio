// Hi-fi captures for the MyAtlas design pages: home, health, medicine, family —
// off the live Flutter web build (mock login), 390×844 @2x.
import pp from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const b = await pp.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 180000 })
const p = await b.newPage()
const w = (ms) => new Promise(r => setTimeout(r, ms))
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
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
await p.goto('https://oommiemie.github.io/myatlas_app/', { waitUntil: 'networkidle2', timeout: 90000 }); await w(16000)
await p.mouse.click(195, 643); await w(6000)     // HealthID mock login
await p.mouse.click(300, 236); await w(2500)     // ข้าม on the referral dialog
await p.mouse.click(195, 800); await w(2500)     // ข้ามเลย on the confirm dialog
await webp('public/ma-hifi-home-390.webp')
await p.mouse.click(127, 795); await w(3500)     // สุขภาพ
await webp('public/ma-hifi-health-390.webp')
await p.mouse.click(195, 795); await w(3500)     // ทานยา
await webp('public/ma-hifi-med-390.webp')
await p.mouse.click(264, 795); await w(3500)     // ครอบครัว
await webp('public/ma-hifi-family-390.webp')
await b.close()
