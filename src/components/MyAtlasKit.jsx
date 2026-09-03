// -----------------------------------------------------------------------------
// MyAtlasKit.jsx
// The MyAtlas component set, rebuilt as working React the same way PawmelyKit
// does it for Pawmely: every specimen is stateful and pressable — the glass
// button counts presses, the tab bar's indicator slides, the activity rings
// animate to their targets, the mini call overlay's timer runs.
//
// Every value is read off the Flutter source (myatlas_app/lib) or the four
// ma-hifi captures: brand green #1D8B6B/#4AB99C, Apple-Health metric colours,
// GlassCard radius 22 at white/75%, LiquidGlassButton size 40, the five-tab
// Thai bar from main_shell.dart, the #2CA989 call pill from mini_call_overlay.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'

// --- Tokens (lib/core/theme/app_colors.dart) ---------------------------------
const GREEN = '#1D8B6B' // brandPrimary
const GREEN_400 = '#4AB99C' // primary400 — ring gradients
const CALL_GREEN = '#2CA989' // mini call pill fill
const BG = '#F4F8F5' // bgPrimary
const INK = '#1A1A1A' // textPrimary
const MUTED = '#6D756E' // textTertiary
const HEALTH = '#FF2D55' // Apple-Health red — heart / move
const ACTIVITY = '#FF9500' // activity orange
const MIND = '#5AC8FA' // mindfulness blue
const NUTRITION = '#34C759' // nutrition green
const DANGER = '#C62828' // the พบการล้ม badge red off the family capture

// Press feedback, the PressEffect/AnimatedScale rule from the Flutter source:
// scale 0.97 over ~160ms easeOut, deeper for small circular targets.
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
        transition: 'transform 160ms ease-out',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// A slice of the app's sky-blue home backdrop, so the glass pieces have
// something real to blur — glass over flat grey proves nothing.
function Backdrop({ children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] ${className}`}
      style={{ background: 'linear-gradient(160deg,#BFE0F5 0%,#DDEEF8 45%,#F4F8F5 100%)' }}
    >
      <span className="absolute -left-4 top-3 size-16 rounded-full" style={{ backgroundColor: '#ffffffaa' }} />
      <span className="absolute right-2 top-10 size-24 rounded-full" style={{ backgroundColor: `${GREEN_400}55` }} />
      <span className="absolute bottom-2 left-12 size-12 rounded-full" style={{ backgroundColor: `${ACTIVITY}44` }} />
      <div className="relative">{children}</div>
    </div>
  )
}

// --- 01 LiquidGlassButton (lib/core/widgets/liquid_glass_button.dart) --------
// Multi-layer glass: backdrop blur + saturation, translucent tint, top-left
// specular highlight, gradient rim. Plain glass beside the tinted variant.
function LiquidGlassButtonKit() {
  const [count, setCount] = useState(0)
  const glass = (tinted) => ({
    width: 40,
    height: 40,
    backdropFilter: 'blur(24px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
    background: tinted
      ? `linear-gradient(180deg,${GREEN}eb,${GREEN})`
      : 'linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,.55))',
    boxShadow: tinted
      ? `0 8px 18px ${GREEN}59, inset 0 0 0 1px rgba(255,255,255,.45)`
      : '0 6px 24px rgba(0,0,0,.12), inset 0 0 0 1px rgba(255,255,255,.7)',
  })
  const spec = (
    <span
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{ background: 'radial-gradient(120% 120% at 25% 0%, rgba(255,255,255,.5), transparent 55%)' }}
    />
  )
  return (
    <Backdrop className="w-full max-w-[240px] p-5">
      <div className="flex items-center justify-center gap-4">
        <Press scale={0.9} ariaLabel="glass" onClick={() => setCount((c) => c + 1)} className="relative grid place-items-center rounded-full" style={glass(false)}>
          {spec}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Press>
        <Press scale={0.9} ariaLabel="tinted glass" onClick={() => setCount((c) => c + 1)} className="relative grid place-items-center rounded-full" style={glass(true)}>
          {spec}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </Press>
      </div>
      <p className="mt-3 text-center text-[11px] font-semibold" style={{ color: INK }}>
        {count ? `กดแล้ว ${count} ครั้ง` : 'กระจกเหลว · ขนาด 40'}
      </p>
    </Backdrop>
  )
}

// --- 02 GlassCard (lib/features/health/widgets/glass_card.dart) --------------
// Radius 22, white at 75% over a 20px backdrop blur, 0.5 border — the surface
// under nearly every health card. The toggle drops to the dark variant (65%).
function GlassCardKit() {
  const [dark, setDark] = useState(false)
  return (
    <Backdrop className="w-full max-w-[240px] p-4">
      <div
        className="rounded-[22px] p-4"
        style={{
          backgroundColor: dark ? 'rgba(28,28,30,.65)' : 'rgba(255,255,255,.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `inset 0 0 0 0.5px ${dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.1)'}`,
          transition: 'background-color 220ms ease-out',
        }}
      >
        <span className="block text-[13px] font-bold" style={{ color: dark ? '#fff' : INK }}>
          สรุปสุขภาพ
        </span>
        <span className="mt-0.5 block text-[11px]" style={{ color: dark ? '#ffffff99' : MUTED }}>
          มุมโค้ง 22 · พื้นขาวโปร่ง {dark ? '65%' : '75%'} · เบลอ 20
        </span>
        <Press
          scale={0.95}
          onClick={() => setDark((v) => !v)}
          className="mt-3 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: GREEN }}
        >
          {dark ? 'ธีมสว่าง' : 'ธีมมืด'}
        </Press>
      </div>
    </Backdrop>
  )
}

// --- 03 MetricCard (lib/features/health/widgets/metric_card.dart) ------------
// Icon disc in the metric's colour, label, big value + unit, week mini-chart —
// the ก้าวเดิน card off the health capture, Saturday's bar red like the real one.
const STEP_BARS = [0.55, 0.5, 0.45, 0.7, 0.65, 0.8, 0.6]
const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
function MetricCardKit() {
  const [steps, setSteps] = useState(7927)
  return (
    <Press
      scale={0.97}
      onClick={() => setSteps((s) => s + 128)}
      className="w-full max-w-[200px] rounded-[22px] bg-white/90 p-4 text-left shadow-sm ring-1 ring-black/[0.06]"
    >
      <span className="flex items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: HEALTH }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
            <circle cx="13" cy="4" r="2" />
            <path d="M13.5 8 10 10l-1.5 5 2 .5L12 11l2.5 2 1 6 2-.3-1-6.7-2.5-2 .8-2.5c1 1 2.2 1.5 3.7 1.5v-2c-1.2 0-2.2-.5-2.9-1.4L14.5 4.4A2 2 0 0 0 12.9 4l-4.4 1 .5 4.5 2-.2-.3-2.8Z" />
          </svg>
        </span>
        <span className="text-[12px] font-semibold" style={{ color: INK }}>ก้าวเดิน</span>
        <svg className="ml-auto" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5">
          <path d="m9 5 7 7-7 7" strokeLinecap="round" />
        </svg>
      </span>
      <span className="mt-2 flex items-baseline gap-1">
        <span className="text-[26px] font-bold leading-none" style={{ color: INK }}>{steps.toLocaleString()}</span>
        <span className="text-[11px]" style={{ color: MUTED }}>ก้าว</span>
      </span>
      <span className="mt-2.5 flex h-11 items-end gap-1.5">
        {STEP_BARS.map((f, i) => (
          <span key={DAYS[i]} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span
              className="w-[7px] rounded-full"
              style={{
                height: `${f * 32}px`,
                background: i === 6 ? HEALTH : `linear-gradient(180deg,${MIND},#8ED4F8)`,
              }}
            />
            <span className="text-[8px]" style={{ color: MUTED }}>{DAYS[i]}</span>
          </span>
        ))}
      </span>
    </Press>
  )
}

// --- 04 ActivityRing (lib/features/health/widgets/activity_ring.dart) --------
// CustomPainter ring: stroke 10 on 72, track at 18% alpha, round caps, drawn
// from 12 o'clock. Three nested — move/exercise/stand like the กิจกรรม card.
function Ring({ r, stroke, color, grad, target, delay }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setP(target), delay)
    return () => clearTimeout(t)
  }, [target, delay])
  const C = 2 * Math.PI * r
  const id = `ma-ring-${color.slice(1)}`
  return (
    <>
      {grad && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={grad[0]} />
            <stop offset="100%" stopColor={grad[1]} />
          </linearGradient>
        </defs>
      )}
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeOpacity="0.18" strokeWidth={stroke} />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={grad ? `url(#${id})` : color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - Math.min(p, 1))}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.9,.3,1)' }}
      />
    </>
  )
}
function ActivityRingKit() {
  const [round, setRound] = useState(0)
  const bump = (v) => Math.min(v + round * 0.12, 1)
  return (
    <div className="flex w-full max-w-[240px] items-center justify-center gap-4">
      <Press scale={0.97} ariaLabel="rings" onClick={() => setRound((r) => (r + 1) % 4)}>
        <svg width="112" height="112" viewBox="0 0 120 120">
          <Ring r={50} stroke={10} color={HEALTH} grad={[HEALTH, '#FF6482']} target={bump(0.72)} delay={80} />
          <Ring r={37} stroke={10} color={NUTRITION} grad={[GREEN_400, NUTRITION]} target={bump(0.55)} delay={220} />
          <Ring r={24} stroke={10} color={MIND} target={bump(0.35)} delay={360} />
        </svg>
      </Press>
      <div className="flex flex-col gap-1.5 text-[10px] font-bold">
        <span style={{ color: HEALTH }}>เคลื่อนไหว<span className="block font-normal" style={{ color: INK }}>420 แคล</span></span>
        <span style={{ color: NUTRITION }}>ออกกำลัง<span className="block font-normal" style={{ color: INK }}>22 นาที</span></span>
        <span style={{ color: MIND }}>ยืน<span className="block font-normal" style={{ color: INK }}>0.7 ชั่วโมง</span></span>
      </div>
    </div>
  )
}

// --- 05 CustomTabBar (custom_tab_bar.dart + shell/main_shell.dart) -----------
// The glass pill with five equal slots: a #EDEDED indicator slides on a spring
// behind the tabs, the selected tab turns brand green — labels from main_shell.
const MA_TABS = [
  { label: 'หน้าหลัก', d: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z' },
  { label: 'สุขภาพ', d: 'M12 20s-7-4.6-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.4-7 9-7 9Z' },
  { label: 'ทานยา', d: 'M7 12h10M5.5 9.5a4.5 4.5 0 0 1 9 0v5a4.5 4.5 0 0 1-9 0Z' },
  { label: 'ครอบครัว', d: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a2.5 2.5 0 1 0 0-5M3 20a6 6 0 0 1 12 0m1-5a5 5 0 0 1 5 5' },
  { label: 'ฉัน', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0' },
]
function CustomTabBarKit() {
  const [active, setActive] = useState(0)
  return (
    <Backdrop className="w-full max-w-[260px] px-3 py-5">
      <div
        className="relative flex rounded-full p-1 shadow-md"
        style={{
          backgroundColor: 'rgba(255,255,255,.55)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '0 4px 12px rgba(0,0,0,.06), 0 16px 40px rgba(0,0,0,.10), inset 0 0 0 0.5px rgba(255,255,255,.95)',
        }}
      >
        <span
          className="absolute bottom-1 top-1 rounded-full"
          style={{
            left: `calc(${(active * 100) / MA_TABS.length}% + 4px)`,
            width: `calc(${100 / MA_TABS.length}% - 4px)`,
            backgroundColor: '#EDEDED',
            transition: 'left 460ms cubic-bezier(.34,1.36,.64,1)',
          }}
        />
        {MA_TABS.map((t, i) => (
          <Press
            key={t.label}
            scale={0.92}
            onClick={() => setActive(i)}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={i === active ? GREEN : MUTED} strokeWidth="1.8">
              <path d={t.d} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              className="w-full truncate text-center text-[8px]"
              style={{ color: i === active ? GREEN : MUTED, fontWeight: i === active ? 600 : 500 }}
            >
              {t.label}
            </span>
          </Press>
        ))}
      </div>
    </Backdrop>
  )
}

// --- 06 MiniCallOverlay (lib/features/family/mini_call_overlay.dart) ---------
// The top-pinned #2CA989 pill: avatar 32, name 12/600, ticking mm:ss at 10 on
// white/85, phone glyph, chevron. Tap pauses/resumes the way the pause state
// held by the real overlay does.
function MiniCallOverlayKit() {
  const [running, setRunning] = useState(true)
  const [sec, setSec] = useState(154)
  const tick = useRef(null)
  useEffect(() => {
    if (!running) return undefined
    tick.current = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(tick.current)
  }, [running])
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return (
    <div className="flex w-full max-w-[248px] flex-col items-center gap-2.5">
      <Press
        scale={0.97}
        onClick={() => setRunning((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-full p-2 text-left"
        style={{ backgroundColor: CALL_GREEN, boxShadow: '0 6px 16px rgba(0,0,0,.2)' }}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full text-[15px]" style={{ backgroundColor: '#ffffff33' }}>
          👵
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold text-white">สมศรี วงศ์สุวรรณ</span>
          <span className="block font-mono text-[10px] text-white/85">
            {mm}:{ss}{running ? '' : ' · พักสาย'}
          </span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
          <path d="M6.6 3.2a1.7 1.7 0 0 1 2.1.5l1.6 2.3a1.7 1.7 0 0 1-.2 2.2l-1 1a12.6 12.6 0 0 0 5.7 5.7l1-1a1.7 1.7 0 0 1 2.2-.2l2.3 1.6a1.7 1.7 0 0 1 .3 2.6l-1.1 1.2c-1 1-2.6 1.3-4 .7A19.6 19.6 0 0 1 5.2 9.5c-.6-1.4-.3-3 .7-4l.7-.7Z" />
        </svg>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" className="mr-1">
          <path d="m9 5 7 7-7 7" strokeLinecap="round" />
        </svg>
      </Press>
      <span className="text-[11px]" style={{ color: MUTED }}>
        {running ? 'สายย่อลอยติดขอบบน — แตะเพื่อพักสาย' : 'พักสายอยู่ — แตะเพื่อคุยต่อ'}
      </span>
    </div>
  )
}

// --- 07 FamilyMemberCard Badge (family/care_giver_screen.dart · _StatusBadge)-
// The vocabulary, both states at once like Pawmely's BadgeKit: "ปลอดภัยดี" as
// a light pill with a green shield-check, "พบการล้ม" filled alarm red — off the
// family capture, where the fall state also glows the whole card's edge.
function FamilyBadgeKit() {
  const [fell, setFell] = useState(true)
  return (
    <div className="flex w-full max-w-[240px] flex-col items-center gap-3">
      <div
        className="flex w-full items-center gap-2.5 rounded-[22px] p-3"
        style={{
          background: fell ? 'linear-gradient(135deg,#F5C0AE,#EFA795)' : 'linear-gradient(135deg,#BFE3D2,#A9DAC4)',
          boxShadow: fell ? `0 0 0 1px ${DANGER}33, 0 0 24px ${DANGER}59` : '0 1px 4px rgba(0,0,0,.06)',
          transition: 'box-shadow 260ms ease-out',
        }}
      >
        <span className="min-w-0 flex-1">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ backgroundColor: fell ? DANGER : '#FFFFFFE6' }}
          >
            {fell ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill={GREEN}>
                <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4-4 1.4 1.4-5.4 5.4Z" />
              </svg>
            )}
            <span className="text-[11px] font-bold" style={{ color: fell ? '#fff' : GREEN }}>
              {fell ? 'พบการล้ม' : 'ปลอดภัยดี'}
            </span>
          </span>
          <span className="mt-1.5 block truncate text-[13px] font-bold" style={{ color: INK }}>
            ปรีชา วงศ์สุวรรณ
          </span>
          <span className="block text-[10px]" style={{ color: `${INK}b3` }}>
            อายุ 70 ปี · หมู่เลือด B · แบต 15%
          </span>
        </span>
        <span className="grid size-11 shrink-0 place-items-center rounded-full text-[20px]" style={{ backgroundColor: '#ffffff88' }}>
          👴
        </span>
      </div>
      <Press
        scale={0.95}
        onClick={() => setFell((v) => !v)}
        className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
        style={{ backgroundColor: fell ? DANGER : GREEN, transition: 'background-color 220ms ease-out' }}
      >
        {fell ? 'เคลียร์เหตุ — กลับสู่ปลอดภัยดี' : 'จำลองเหตุการล้ม'}
      </Press>
    </div>
  )
}

// The panel looks each component up by the exact `name` its data carries
// (src/data/myatlasDesign.js · myatlasComponent.items).
export const MYATLAS_KIT = {
  LiquidGlassButton: LiquidGlassButtonKit,
  GlassCard: GlassCardKit,
  MetricCard: MetricCardKit,
  ActivityRing: ActivityRingKit,
  CustomTabBar: CustomTabBarKit,
  MiniCallOverlay: MiniCallOverlayKit,
  'FamilyMemberCard Badge': FamilyBadgeKit,
}

export default MYATLAS_KIT
