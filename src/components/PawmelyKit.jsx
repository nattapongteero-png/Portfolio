// -----------------------------------------------------------------------------
// PawmelyKit.jsx
// The Pawmely component set, rebuilt as working React so the Component panel can
// hand you the real thing instead of a picture of it: every piece here is
// stateful and pressable — fields take focus and text, tabs switch, the stepper
// advances, the call timer runs, the skeleton loads.
//
// Everything is built out of the project's own tokens (rose ramp, the 16/20/pill
// radii, the 56/40 heights, the press-scale rule), so pressing one of these is
// the same gesture the app answers with.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'

// --- Tokens ------------------------------------------------------------------
const ROSE = '#B86A7C'
const ROSE_600 = '#9F5266'
const ROSE_300 = '#DDA8B2'
const ROSE_100 = '#F5E4E7'
const OCEAN = '#2C6E8C'
const INK = '#1A1A1F'
const MUTED = '#6E6E74'
const LINE = '#E6E6E8'
const SUCCESS = '#4FB36C'
const WARNING = '#E8A87C'
const ERROR = '#C25450'

// Press feedback, straight from the system: the smaller the target, the deeper
// it sinks, so the response stays equally visible at every size.
function Press({ scale = 0.97, className = '', style, onClick, children, ariaLabel }) {
  const [down, setDown] = useState(false)
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onClick={onClick}
      className={`select-none outline-none ${className}`}
      style={{
        transform: `scale(${down ? scale : 1})`,
        transition: 'transform 140ms ease-out',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// --- 01 Button ---------------------------------------------------------------
function ButtonKit() {
  const [count, setCount] = useState(0)
  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-3">
      <Press
        scale={0.98}
        onClick={() => setCount((c) => c + 1)}
        className="grid w-full place-items-center rounded-full text-[15px] font-bold text-white"
        style={{ height: 56, backgroundColor: ROSE_600 }}
      >
        {count ? `กดแล้ว ${count} ครั้ง` : 'เข้าสู่ระบบ'}
      </Press>
      <div className="flex w-full items-center gap-2">
        <Press
          scale={0.97}
          onClick={() => setCount(0)}
          className="grid flex-1 place-items-center rounded-full border-2 text-[13px] font-bold"
          style={{ height: 40, borderColor: ROSE, color: ROSE_600 }}
        >
          ล้างค่า
        </Press>
        <Press
          scale={0.92}
          ariaLabel="icon"
          className="grid place-items-center rounded-full"
          style={{ width: 40, height: 40, backgroundColor: ROSE_100, color: ROSE_600 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </Press>
      </div>
    </div>
  )
}

// --- 02 Input Fields ---------------------------------------------------------
function InputKit() {
  const [value, setValue] = useState('')
  const [pw, setPw] = useState('meow1234')
  const [show, setShow] = useState(false)
  const [focus, setFocus] = useState(null)
  const field = (name) => ({
    onFocus: () => setFocus(name),
    onBlur: () => setFocus(null),
    className: 'h-full w-full bg-transparent text-[14px] outline-none',
    style: { color: INK },
  })
  const shell = (name) => ({
    className: 'flex items-center rounded-full px-4',
    style: {
      height: 56,
      backgroundColor: '#F8F8F8',
      boxShadow: focus === name ? `0 0 0 2px ${ROSE}` : `inset 0 0 0 1px ${LINE}`,
      transition: 'box-shadow 220ms ease-out',
    },
  })
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3">
      <div {...shell('email')}>
        <input
          {...field('email')}
          value={value}
          placeholder="you@example.com"
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div {...shell('pw')}>
        <input {...field('pw')} type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} />
        <Press scale={0.92} ariaLabel="show password" onClick={() => setShow((s) => !s)} style={{ color: MUTED }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            {!show && <path d="M4 20 20 4" strokeLinecap="round" />}
          </svg>
        </Press>
      </div>
    </div>
  )
}

// --- 03 Card -----------------------------------------------------------------
const WEIGHTS = [
  { label: '15 มิ.ย.', kg: 8.3 },
  { label: '20 ก.ย.', kg: 8.7 },
  { label: '4 ธ.ค.', kg: 9.1 },
  { label: '8 มี.ค.', kg: 9.4 },
]
function CardKit() {
  const [tab, setTab] = useState(1)
  const [pick, setPick] = useState(3)
  const tabs = ['ข้อมูลทั่วไป', 'ประวัติสุขภาพ', 'ประวัติฉีดวัคซีน']
  const max = Math.max(...WEIGHTS.map((w) => w.kg))
  return (
    <div className="w-full max-w-[280px] overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-black/[0.06]">
      <div className="flex items-center gap-3 px-4 py-2" style={{ backgroundColor: `${ROSE_300}40` }}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full text-[15px]" style={{ backgroundColor: ROSE_100 }}>
          🐕
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-bold" style={{ color: INK }}>
            น้องข้าวปั้น
          </span>
          <span className="block text-[11px]" style={{ color: MUTED }}>
            3 ปี 11 เดือน 10 วัน
          </span>
        </span>
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pt-2.5">
        {tabs.map((t, i) => (
          <Press
            key={t}
            scale={0.95}
            onClick={() => setTab(i)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{
              backgroundColor: tab === i ? ROSE_600 : ROSE_100,
              color: tab === i ? '#fff' : ROSE_600,
            }}
          >
            {t}
          </Press>
        ))}
      </div>
      <div className="px-4 pb-3 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[20px] font-bold leading-none" style={{ color: INK }}>
            {WEIGHTS[pick].kg} กก.
          </span>
          <span className="text-[11px]" style={{ color: MUTED }}>
            {WEIGHTS[pick].label}
          </span>
        </div>
        <div className="mt-2 flex h-10 items-end gap-2">
          {WEIGHTS.map((w, i) => (
            <Press
              key={w.label}
              scale={0.95}
              onClick={() => setPick(i)}
              className="flex-1 rounded-t-md"
              style={{
                height: `${(w.kg / max) * 100}%`,
                backgroundColor: pick === i ? ROSE_600 : '#E9E7E4',
                transition: 'background-color 220ms ease-out',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// --- 04 Tab Bar --------------------------------------------------------------
const TABS = [
  { id: 'home', label: 'หน้าแรก', d: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z' },
  { id: 'health', label: 'สุขภาพ', d: 'M12 20s-7-4.6-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.4-7 9-7 9Z' },
  { id: 'shop', label: 'ร้านค้า', d: 'M5 8h14l-1 12H6ZM9 8a3 3 0 0 1 6 0' },
  { id: 'me', label: 'ฉัน', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0' },
]
function TabBarKit() {
  const [active, setActive] = useState('home')
  const Icon = ({ d, on }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={on ? '#fff' : MUTED} strokeWidth="1.8">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return (
    <div className="relative w-full max-w-[280px] pb-3 pt-6">
      {/* The row is a fixed width, so the tab that expands has to take its space
          from the others rather than from the bar: every tab is min-w-0 and the
          open one is capped, which is why nothing spills past the pill any more. */}
      <div className="flex h-14 items-center overflow-hidden rounded-full bg-white/85 px-2 shadow-md ring-1 ring-black/[0.06] backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center justify-evenly gap-1 overflow-hidden">
          {TABS.slice(0, 2).map((t) => (
            <Tab key={t.id} t={t} active={active} setActive={setActive} Icon={Icon} />
          ))}
        </div>
        {/* The gap the raised paw button sits in. */}
        <span className="w-14 shrink-0" />
        <div className="flex min-w-0 flex-1 items-center justify-evenly gap-1 overflow-hidden">
          {TABS.slice(2).map((t) => (
            <Tab key={t.id} t={t} active={active} setActive={setActive} Icon={Icon} />
          ))}
        </div>
      </div>
      {/* The raised paw button that splits the row. It is POSITIONED by this
          wrapper rather than by its own class: Press writes an inline
          `transform` for the press-scale, which would overwrite a Tailwind
          `-translate-x-1/2` and leave the button sitting off-centre — which is
          exactly what was covering the tab beside it. */}
      <span className="absolute left-1/2 top-1 -translate-x-1/2">
        <Press
          scale={0.92}
          ariaLabel="paw"
          className="grid size-14 place-items-center rounded-full text-[20px] shadow-lg ring-4 ring-white"
          style={{ backgroundColor: ROSE_600 }}
        >
          🐾
        </Press>
      </span>
    </div>
  )
}
function Tab({ t, active, setActive, Icon }) {
  const on = active === t.id
  return (
    <Press
      scale={0.95}
      onClick={() => setActive(t.id)}
      className="flex h-9 min-w-0 items-center gap-1.5 overflow-hidden rounded-full px-2"
      style={{
        backgroundColor: on ? ROSE_600 : 'transparent',
        flex: on ? '0 1 auto' : '0 0 34px',
        maxWidth: on ? 62 : 34,
        transition: 'max-width 260ms cubic-bezier(.2,.9,.3,1), background-color 220ms ease-out',
      }}
    >
      <Icon d={t.d} on={on} />
      {on && <span className="truncate text-[11px] font-bold text-white">{t.label}</span>}
    </Press>
  )
}

// --- 05 Toggle / CheckBox / Radio --------------------------------------------
function ControlsKit() {
  const [on, setOn] = useState(true)
  const [check, setCheck] = useState(true)
  const [radio, setRadio] = useState('dog')
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px]" style={{ color: INK }}>
          แจ้งเตือนให้อาหาร
        </span>
        <Press
          scale={0.95}
          ariaLabel="toggle"
          onClick={() => setOn((v) => !v)}
          className="flex items-center rounded-full p-0.5"
          style={{
            width: 48,
            height: 28,
            backgroundColor: on ? ROSE_600 : '#D8D6D2',
            transition: 'background-color 220ms ease-out',
          }}
        >
          <span
            className="size-6 rounded-full bg-white shadow"
            style={{ transform: `translateX(${on ? 20 : 0}px)`, transition: 'transform 220ms cubic-bezier(.2,.9,.3,1)' }}
          />
        </Press>
      </div>
      <Press
        scale={0.97}
        onClick={() => setCheck((v) => !v)}
        className="flex items-center gap-2.5"
      >
        <span
          className="grid size-6 shrink-0 place-items-center rounded-[8px]"
          style={{
            backgroundColor: check ? ROSE_600 : 'transparent',
            boxShadow: check ? 'none' : `inset 0 0 0 2px ${LINE}`,
            transition: 'background-color 220ms ease-out',
          }}
        >
          {check && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="text-[13px]" style={{ color: INK }}>
          ยอมรับนโยบายความเป็นส่วนตัว
        </span>
      </Press>
      <div className="flex gap-4">
        {[
          ['dog', 'สุนัข'],
          ['cat', 'แมว'],
        ].map(([id, label]) => (
          <Press key={id} scale={0.97} onClick={() => setRadio(id)} className="flex items-center gap-2">
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full"
              style={{ boxShadow: `inset 0 0 0 2px ${radio === id ? ROSE_600 : LINE}` }}
            >
              {radio === id && <span className="size-3 rounded-full" style={{ backgroundColor: ROSE_600 }} />}
            </span>
            <span className="text-[13px]" style={{ color: INK }}>
              {label}
            </span>
          </Press>
        ))}
      </div>
    </div>
  )
}

// --- 06 Step Progress --------------------------------------------------------
const STEPS = ['อีเมล', 'รหัส OTP', 'ตั้งรหัสผ่าน', 'โปรไฟล์']
function StepsKit() {
  const [step, setStep] = useState(1)
  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-3">
      <div className="flex w-full items-center rounded-full bg-white px-3 py-2 ring-1 ring-black/[0.06]">
        {STEPS.map((s, i) => (
          <span key={s} className="flex flex-1 items-center last:flex-none">
            <Press
              scale={0.9}
              ariaLabel={s}
              onClick={() => setStep(i)}
              className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
              style={{
                backgroundColor: i <= step ? ROSE_600 : '#EFEDEA',
                color: i <= step ? '#fff' : MUTED,
                transition: 'background-color 220ms ease-out',
              }}
            >
              {i + 1}
            </Press>
            {i < STEPS.length - 1 && (
              <span
                className="h-[2px] flex-1"
                style={{ backgroundColor: i < step ? ROSE_600 : '#EFEDEA', transition: 'background-color 220ms ease-out' }}
              />
            )}
          </span>
        ))}
      </div>
      <span className="text-[12px] font-semibold" style={{ color: ROSE_600 }}>
        ขั้นที่ {step + 1} · {STEPS[step]}
      </span>
    </div>
  )
}

// --- 07 Skeleton -------------------------------------------------------------
function SkeletonKit() {
  // No loaded state and no button to reach it: a skeleton is the loading frame,
  // so the specimen stays in the state it documents, shimmering.
  const bar = (w) => (
    <span
      className="block h-3 rounded-full"
      style={{
        width: w,
        background: 'linear-gradient(90deg,#EDEBE8 25%,#F7F5F3 37%,#EDEBE8 63%)',
        backgroundSize: '400% 100%',
        animation: 'paw-shimmer 1100ms ease-in-out infinite',
      }}
    />
  )
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3">
      <style>{`@keyframes paw-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}`}</style>
      {[0, 1].map((row) => (
        <div key={row} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-3 ring-1 ring-black/[0.06]">
          <span className="size-10 shrink-0 rounded-full" style={{ backgroundColor: '#EDEBE8' }} />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            {bar(row ? '70%' : '60%')}
            {bar(row ? '90%' : '85%')}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- 08 Product Tile ---------------------------------------------------------
function TileKit() {
  const [liked, setLiked] = useState(false)
  const [qty, setQty] = useState(0)
  return (
    <div className="w-[142px] overflow-hidden rounded-[16px] bg-white ring-1 ring-black/[0.06]">
      <div className="relative grid h-[68px] place-items-center text-[26px]" style={{ backgroundColor: `${ROSE_300}33` }}>
        🦴
        <Press
          scale={0.92}
          ariaLabel="like"
          onClick={() => setLiked((v) => !v)}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? ERROR : 'none'} stroke={liked ? ERROR : MUTED} strokeWidth="2">
            <path d="M12 20s-7-4.6-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.4-7 9-7 9Z" />
          </svg>
        </Press>
      </div>
      <div className="p-2.5">
        <span className="block text-[10px] font-semibold" style={{ color: MUTED }}>
          PUKPUI
        </span>
        <span className="mt-0.5 block truncate text-[12px] font-bold" style={{ color: INK }}>
          ขนมสุนัขรสไก่
        </span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold" style={{ color: ERROR }}>
            ฿129
          </span>
          <span className="text-[10px] line-through" style={{ color: MUTED }}>
            ฿159
          </span>
        </div>
        <Press
          scale={0.97}
          onClick={() => setQty((q) => q + 1)}
          className="mt-2 grid w-full place-items-center rounded-full text-[11px] font-bold text-white"
          style={{ height: 28, backgroundColor: ROSE_600 }}
        >
          {qty ? `ในตะกร้า ${qty}` : 'ใส่ตะกร้า'}
        </Press>
      </div>
    </div>
  )
}

// --- 09 Mini Call Overlay ----------------------------------------------------
function CallKit() {
  const [running, setRunning] = useState(true)
  const [sec, setSec] = useState(134)
  const [muted, setMuted] = useState(false)
  const tick = useRef(null)
  useEffect(() => {
    if (!running) return undefined
    tick.current = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(tick.current)
  }, [running])
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-3">
      <div className="flex h-14 items-center gap-3 rounded-full bg-white px-3 shadow-md ring-1 ring-black/[0.06]">
        <span className="grid size-10 shrink-0 place-items-center rounded-full text-[18px]" style={{ backgroundColor: `${OCEAN}26` }}>
          🩺
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-bold" style={{ color: INK }}>
            สพ.ญ. ปรียา
          </span>
          <span className="block font-mono text-[11px]" style={{ color: running ? OCEAN : MUTED }}>
            {mm}:{ss}
          </span>
        </span>
        <Press
          scale={0.92}
          ariaLabel="mute"
          onClick={() => setMuted((v) => !v)}
          className="grid size-9 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: muted ? `${ERROR}1f` : '#F1EFEC', color: muted ? ERROR : MUTED }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
            {muted && <path d="M4 20 20 4" strokeLinecap="round" />}
          </svg>
        </Press>
        <Press
          scale={0.92}
          ariaLabel="end call"
          onClick={() => setRunning((v) => !v)}
          className="grid size-9 shrink-0 place-items-center rounded-full text-white"
          style={{ backgroundColor: running ? ERROR : SUCCESS }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
          </svg>
        </Press>
      </div>
      <span className="text-[11px]" style={{ color: MUTED }}>
        {running ? 'กำลังคุยอยู่ — แตะปุ่มแดงเพื่อวางสาย' : 'วางสายแล้ว — แตะปุ่มเขียวเพื่อโทรใหม่'}
      </span>
    </div>
  )
}

// --- 10 Status Badge ---------------------------------------------------------
const STATES = [
  { label: 'สุขภาพดี', color: SUCCESS },
  { label: 'ใกล้ถึงนัด', color: WARNING },
  { label: 'เลยกำหนดวัคซีน', color: ERROR },
  { label: 'รอผลตรวจ', color: OCEAN },
]
function BadgeKit() {
  // The set, all of it, at once: a badge component is a VOCABULARY, and one
  // badge you have to click through hides the very thing worth showing.
  return (
    <div className="flex w-full max-w-[280px] flex-wrap items-center justify-center gap-2">
      {STATES.map((st) => (
        <span
          key={st.label}
          className="flex items-center gap-2 rounded-full px-3 py-2"
          style={{ backgroundColor: `${st.color}24` }}
        >
          <span className="size-2.5 rounded-full" style={{ backgroundColor: st.color }} />
          <span className="text-[12px] font-bold" style={{ color: st.color }}>
            {st.label}
          </span>
        </span>
      ))}
    </div>
  )
}

// The panel looks each component up by the same `kind` its data carries.
export const PAWMELY_KIT = {
  button: ButtonKit,
  input: InputKit,
  card: CardKit,
  tabbar: TabBarKit,
  toggle: ControlsKit,
  steps: StepsKit,
  skeleton: SkeletonKit,
  tile: TileKit,
  call: CallKit,
  badge: BadgeKit,
}

export default PAWMELY_KIT
