import pp from 'puppeteer-core'
const b=await pp.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox']})
const p=await b.newPage()
const failed=[]
p.on('requestfailed',r=>failed.push(r.url().split('/').pop()))
p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url().split('/').pop())})
await p.setViewport({width:390,height:844,deviceScaleFactor:3,isMobile:true,hasTouch:true})
await p.goto('https://bms-uxui.github.io/ehp-vetcare-plus/',{waitUntil:'networkidle2',timeout:60000})
const w=ms=>new Promise(r=>setTimeout(r,ms)); await w(5000)
const hit=async(src,{last=true,delay=1400}={})=>{
  const box=await p.evaluate(([s,last])=>{
    const rx=new RegExp(s)
    const all=[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&rx.test(e.innerText||''))
    const el=last?all.pop():all[0]
    if(!el) return null
    el.scrollIntoView({block:'center'})
    const r=el.getBoundingClientRect()
    return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}
  },[src,last])
  if(!box) return false
  await p.mouse.click(box.x,box.y); await w(delay); return true
}
// Every tab has its OWN 6-step coach-mark tour, not just the home screen, and an
// undismissed tour both dims the screen and swallows the next tap. So it is cleared
// before every action rather than once after login.
const clear=async()=>{
  for(let i=0;i<12;i++){
    if(!(await p.evaluate(()=>/\d \/ \d/.test(document.body.innerText)))) return
    if(!(await hit('^ถัดไป$',{delay:650}))) if(!(await hit('^เข้าใจแล้ว$|^เริ่มใช้งาน$|^ปิด$|^ตกลง$',{delay:650}))) return
  }
}
const shot=async(n)=>{
  await clear()
  await p.evaluate(()=>{window.scrollTo(0,0);for(const e of document.querySelectorAll('*')) if(e.scrollHeight>e.clientHeight+40) e.scrollTop=0})
  // Long enough for the photos to decode: shot too early, the pet's portrait and
  // the back button came out as empty grey circles.
  await w(4200)
  const dim=await p.evaluate(()=>/\d \/ 6/.test(document.body.innerText))
  await p.screenshot({path:`cap-${n}.png`})
  console.log(' ',n, dim?'!! COACH OVERLAY STILL UP':'clean')
}
await p.evaluate(()=>{for(const e of [...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+50)) e.scrollTop=e.scrollHeight}); await w(800)
await hit('ข้าพเจ้าได้อ่านและยอมรับ'); await hit('ยอมรับและดำเนินการต่อ',{delay:3000})
await hit('^เข้าสู่ระบบ$',{delay:4500})
for(let i=0;i<10;i++){ if(!(await p.evaluate(()=>/\d \/ 6/.test(document.body.innerText)))) break
  if(!(await hit('^ถัดไป$',{delay:700}))) await hit('^เข้าใจแล้ว$|^เริ่มใช้งาน$|^ปิด$',{delay:700}) }
await shot('home')
// Shop BEFORE the pet's page, not after: the tab bar is not drawn on a pet page,
// and its own back control could not be found — so the shop is taken while the tab
// bar is still on screen instead of navigating back to it.
await clear(); await hit('^ร้านค้า$',{delay:2600}); await shot('shop')
await clear(); await hit('^หน้าแรก$',{delay:2200})
await clear(); await hit('^ข้าวปั้น$',{last:false,delay:2500}); await shot('pet')
await clear(); await hit('^ประวัติสุขภาพ$',{delay:2000}); await shot('health')
console.log('shop screen text:', (await p.evaluate(()=>document.body.innerText)).replace(/\n/g,' | ').slice(0,140))
console.log('failed requests:',[...new Set(failed)].slice(0,12))
await b.close()
