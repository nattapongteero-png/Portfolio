// -----------------------------------------------------------------------------
// MMKit.jsx
// The METAHERB Mobile component set (shared by the Metaherb Mobile and Metaherb
// Cafe pages — same repo, same design system), rebuilt as working React so the
// Component panel hands you the real thing instead of a picture of it: the
// countdowns tick, the badge counts, the wheel steps, the skeleton shimmers.
//
// Everything is built out of MM_SYSTEM's own tokens (brand green #319754, the
// urgency reds reserved for Flash Sale, the 4/8/12/16/pill radii, 8-base
// spacing), so pressing one of these is the same gesture the app answers with.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'

// --- Tokens (MM_SYSTEM.color / grid) ----------------------------------------
const GREEN = '#319754'
const GREEN_DARK = '#267A43'
const PRICE_GREEN = '#226A3B'
const GREEN_TINT = '#E6F5EC'
const PRICE_RED = '#E62E05'
const COUNTDOWN_RED = '#BC1B06'
const BADGE_RED = '#EE4D2D'
const STAR = '#F59E0B'
const INK = '#0A0A0A'
const SUB = '#525252'
const MUTED = '#737373'
const SURFACE = '#F5F5F5'
const LINE = '#E5E7EB'

// Press feedback, same rule as the app: the smaller the target, the deeper it
// sinks, so the response stays equally visible at every size.
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
      style={{ transform: `scale(${down ? scale : 1})`, transition: 'transform 140ms ease-out', ...style }}
    >
      {children}
    </button>
  )
}

// One ticking clock for both Flash Sale specimens: 09:59:52 on the home grid.
function useCountdown(start = 35992) {
  const [sec, setSec] = useState(start)
  useEffect(() => {
    const t = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const p = (n) => String(n).padStart(2, '0')
  return [p(Math.floor(sec / 3600)), p(Math.floor((sec / 60) % 60)), p(Math.floor(sec % 60))]
}

// --- 01 ProductCard (mm-home: two-column grid card, Flash Sale ribbon) -------
function ProductCardKit() {
  const [h, m, s] = useCountdown()
  const [inCart, setInCart] = useState(false)
  return (
    <Press
      scale={0.98}
      onClick={() => setInCart((v) => !v)}
      className="w-[176px] overflow-hidden rounded-[16px] bg-white text-left shadow-sm ring-1 ring-black/[0.06]"
    >
      <div className="relative grid h-[76px] place-items-center text-[30px]" style={{ backgroundColor: GREEN_TINT }}>
        🌿
        {/* The Flash Sale ribbon that turns a 259 card into the 290 one. */}
        <span
          className="absolute bottom-0 left-0 flex items-center gap-1 rounded-tr-[8px] px-2 py-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: PRICE_RED }}
        >
          Flash Sale
          {[h, m, s].map((d, i) => (
            <span key={i} className="rounded-[4px] px-1" style={{ backgroundColor: COUNTDOWN_RED }}>
              {d}
            </span>
          ))}
        </span>
      </div>
      <div className="p-2">
        <span className="block truncate text-[12px] font-semibold" style={{ color: INK }}>
          เมต้าเฮิร์บ สมุนไพรหอม (ย...
        </span>
        <span className="mt-1 block text-[15px] font-bold" style={{ color: PRICE_RED }}>
          ฿249.00
        </span>
        <div className="mt-1 flex items-center justify-between text-[10px]" style={{ color: MUTED }}>
          <span className="flex items-center gap-1">
            <span style={{ color: STAR }}>★</span> 4.8/5
          </span>
          <span>{inCart ? 'อยู่ในตะกร้า ✓' : 'ขายได้ 200+'}</span>
        </div>
      </div>
    </Press>
  )
}

// --- 02 BottomSheet (mm-cart: order-summary sheet, top corners only) ---------
function BottomSheetKit() {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex h-[196px] w-[220px] flex-col justify-end overflow-hidden rounded-[12px]" style={{ backgroundColor: SURFACE }}>
      <Press
        scale={0.99}
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-white px-4 pb-3 pt-2 text-left shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        style={{ borderRadius: '15px 15px 0 0', transition: 'margin-bottom 260ms cubic-bezier(.2,.9,.3,1)', marginBottom: open ? 0 : -96 }}
      >
        <span className="mx-auto mb-2 block h-1 w-10 rounded-full" style={{ backgroundColor: LINE }} />
        <span className="block text-[13px] font-bold" style={{ color: INK }}>
          สรุปคำสั่งซื้อ
        </span>
        {[
          ['ยอดสินค้า (4 ชิ้น)', '฿847', INK],
          ['ส่วนลด', '-฿433', PRICE_RED],
          ['ค่าจัดส่ง', 'ฟรี', PRICE_GREEN],
        ].map(([k, v, c]) => (
          <span key={k} className="mt-1.5 flex justify-between text-[11px]">
            <span style={{ color: SUB }}>{k}</span>
            <span className="font-bold" style={{ color: c }}>{v}</span>
          </span>
        ))}
        <span className="mt-2 flex justify-between border-t pt-2 text-[12px] font-bold" style={{ borderColor: LINE }}>
          <span style={{ color: INK }}>รวมทั้งสิ้น</span>
          <span style={{ color: PRICE_RED }}>฿847</span>
        </span>
      </Press>
    </div>
  )
}

// --- 03 PageHeader (mm-shop: brand-green header, round back button) ----------
function PageHeaderKit() {
  const [page, setPage] = useState(0)
  const titles = [
    ['ร้านค้าของฉัน', 'ร้านค้าของคุณ'],
    ['ตะกร้าสินค้า', '5 ชิ้นในตะกร้า'],
  ]
  return (
    <div className="w-[240px] overflow-hidden rounded-[12px] shadow-sm">
      <div className="flex items-center gap-3 px-3 py-4" style={{ backgroundColor: GREEN }}>
        <Press
          scale={0.9}
          ariaLabel="back"
          onClick={() => setPage((p) => (p + 1) % titles.length)}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.5">
            <path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Press>
        <span className="min-w-0">
          <span className="block truncate text-[16px] font-bold text-white">{titles[page][0]}</span>
          <span className="block text-[11px] text-white/85">{titles[page][1]}</span>
        </span>
        <span className="ml-auto text-[16px]">🍃</span>
      </div>
      <div className="h-6 bg-white" />
    </div>
  )
}

// --- 04 IconButton (mm-detail: round white buttons over the photo) -----------
function IconButtonKit() {
  const [liked, setLiked] = useState(true)
  const [shared, setShared] = useState(0)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 rounded-[16px] p-4" style={{ backgroundColor: GREEN_TINT }}>
        <Press
          scale={0.9}
          ariaLabel="like"
          onClick={() => setLiked((v) => !v)}
          className="grid size-11 place-items-center rounded-full bg-white shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? PRICE_RED : 'none'} stroke={liked ? PRICE_RED : MUTED} strokeWidth="2">
            <path d="M12 20s-7-4.6-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.4-7 9-7 9Z" />
          </svg>
        </Press>
        <Press
          scale={0.9}
          ariaLabel="share"
          onClick={() => setShared((n) => n + 1)}
          className="grid size-11 place-items-center rounded-full bg-white shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2">
            <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
            <path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" />
          </svg>
        </Press>
      </div>
      {/* The system note the component exists for: hitSlop pads the touch area
          to 44pt without swelling the visible button. */}
      <span className="text-[10px]" style={{ color: MUTED }}>
        hitSlop → 44pt {shared ? `· แชร์แล้ว ${shared}` : ''}
      </span>
    </div>
  )
}

// --- 05 CountBadge (mm-home: red badge on the cart / bell icons) -------------
function CountBadgeKit() {
  const [count, setCount] = useState(4)
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4 rounded-[16px] px-5 py-4" style={{ backgroundColor: GREEN }}>
        {[['🔔', Math.max(count - 1, 0)], ['🛒', count]].map(([icon, n], i) => (
          <span key={i} className="relative">
            <span className="grid size-11 place-items-center rounded-full bg-white text-[18px] shadow-sm">{icon}</span>
            {n > 0 && (
              <span
                className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white"
                style={{ backgroundColor: BADGE_RED }}
              >
                {n > 99 ? '99+' : n}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Press scale={0.95} onClick={() => setCount((n) => n + 1)} className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: GREEN_DARK }}>
          + ใส่ตะกร้า
        </Press>
        <Press scale={0.95} onClick={() => setCount(0)} className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: SURFACE, color: SUB }}>
          ล้าง
        </Press>
      </div>
    </div>
  )
}

// --- 06 WheelPicker (Flash Sale filter: month wheel instead of a dropdown) ---
const MONTHS = ['ต.ค. 2568', 'พ.ย. 2568', 'ธ.ค. 2568', 'ม.ค. 2569', 'ก.พ. 2569', 'มี.ค. 2569']
function WheelPickerKit() {
  const [idx, setIdx] = useState(2)
  const ROW = 32
  const step = (d) => setIdx((i) => Math.min(MONTHS.length - 1, Math.max(0, i + d)))
  return (
    <div className="flex w-[200px] flex-col items-center gap-1 rounded-[16px] bg-white p-2 shadow-sm ring-1 ring-black/[0.06]">
      <Press scale={0.9} ariaLabel="up" onClick={() => step(-1)} style={{ color: MUTED }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 15 6-6 6 6" strokeLinecap="round" /></svg>
      </Press>
      {/* A wheel, not a dropdown: the scroll wheel steps it, tapping a
          neighbouring row steps it, and the highlight bar stays put. */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: ROW * 3 }}
        onWheel={(e) => step(e.deltaY > 0 ? 1 : -1)}
      >
        <span className="pointer-events-none absolute left-0 top-1/2 h-8 w-full -translate-y-1/2 rounded-[8px]" style={{ backgroundColor: GREEN_TINT }} />
        <div style={{ transform: `translateY(${ROW - idx * ROW}px)`, transition: 'transform 220ms cubic-bezier(.2,.9,.3,1)' }}>
          {MONTHS.map((m, i) => (
            <Press
              key={m}
              scale={0.97}
              onClick={() => setIdx(i)}
              className="grid w-full place-items-center"
              style={{
                height: ROW,
                color: i === idx ? GREEN_DARK : MUTED,
                fontSize: i === idx ? 14 : 12,
                fontWeight: i === idx ? 700 : 400,
                opacity: Math.abs(i - idx) > 1 ? 0.25 : 1,
                transition: 'all 220ms ease-out',
              }}
            >
              {m}
            </Press>
          ))}
        </div>
      </div>
      <Press scale={0.9} ariaLabel="down" onClick={() => step(1)} style={{ color: MUTED }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" strokeLinecap="round" /></svg>
      </Press>
    </div>
  )
}

// --- 07 StickyFilterList (search + chips pinned while the list scrolls) ------
const CAFE_ITEMS = [
  ['Iced Americano', '฿80'], ['Iced Caramel Macchiato', '฿70'], ['Iced Latte', '฿70'],
  ['Strawberry Milk', '฿85'], ['กาแฟดริป Signature Blend', '฿150'], ['Honey Lemon', '฿95'],
]
function StickyFilterListKit() {
  const [chip, setChip] = useState(0)
  const chips = ['ทั้งหมด', 'เมนูฮิต', 'Flash Sale']
  return (
    <div className="h-[196px] w-[220px] overflow-y-auto overscroll-contain rounded-[12px] bg-white shadow-sm ring-1 ring-black/[0.06]">
      {/* The part that earns the name: this block is sticky, the rows below scroll under it. */}
      <div className="sticky top-0 z-10 border-b bg-white/95 p-2 backdrop-blur" style={{ borderColor: LINE }}>
        <div className="flex h-8 items-center gap-2 rounded-full px-3" style={{ backgroundColor: SURFACE }}>
          <span className="text-[12px]" style={{ color: GREEN }}>⌕</span>
          <span className="text-[11px]" style={{ color: MUTED }}>ค้นหาเมนูคาเฟ่...</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {chips.map((c, i) => (
            <Press
              key={c}
              scale={0.95}
              onClick={() => setChip(i)}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: chip === i ? GREEN : SURFACE, color: chip === i ? '#fff' : SUB }}
            >
              {c}
            </Press>
          ))}
        </div>
      </div>
      {CAFE_ITEMS.map(([name, price], i) => (
        <div key={name} className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: LINE }}>
          <span className="grid size-8 shrink-0 place-items-center rounded-[8px] text-[14px]" style={{ backgroundColor: GREEN_TINT }}>
            {i % 2 ? '🧋' : '☕'}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold" style={{ color: INK }}>{name}</span>
          <span className="text-[11px] font-bold" style={{ color: PRICE_GREEN }}>{price}</span>
        </div>
      ))}
    </div>
  )
}

// --- 08 EmptyState (teaches with an example, not a paragraph) ----------------
function EmptyStateKit() {
  const [filled, setFilled] = useState(false)
  return (
    <div className="grid h-[190px] w-[210px] place-items-center rounded-[16px] bg-white shadow-sm ring-1 ring-black/[0.06]">
      {filled ? (
        <div className="flex w-full flex-col gap-2 px-4">
          <div className="flex items-center gap-2 rounded-[12px] p-2" style={{ backgroundColor: GREEN_TINT }}>
            <span className="text-[16px]">🌿</span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold" style={{ color: INK }}>เมต้าเฮิร์บ สมุนไพรหอม</span>
            <span className="text-[11px] font-bold" style={{ color: PRICE_RED }}>฿249.00</span>
          </div>
          <Press scale={0.95} onClick={() => setFilled(false)} className="text-[10px]" style={{ color: MUTED }}>
            ← กลับไปดูสถานะว่าง
          </Press>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <span className="grid size-14 place-items-center rounded-full text-[24px]" style={{ backgroundColor: GREEN_TINT }}>🛒</span>
          <span className="text-[13px] font-bold" style={{ color: INK }}>ตะกร้ายังว่างอยู่</span>
          <span className="text-[10px]" style={{ color: MUTED }}>ลองเริ่มจากสินค้าขายดีด้านล่าง</span>
          <Press
            scale={0.95}
            onClick={() => setFilled(true)}
            className="rounded-full px-4 text-[11px] font-bold text-white"
            style={{ height: 32, lineHeight: '32px', backgroundColor: GREEN }}
          >
            ดูสินค้าแนะนำ
          </Press>
        </div>
      )}
    </div>
  )
}

// --- 09 Skeleton (loading frames shaped like the real product card) ----------
function SkeletonKit() {
  // No loaded state and no button to reach it: a skeleton is the loading frame,
  // so the specimen stays in the state it documents, shimmering.
  const shimmer = {
    background: 'linear-gradient(90deg,#ECECEC 25%,#F7F7F7 37%,#ECECEC 63%)',
    backgroundSize: '400% 100%',
    animation: 'mm-shimmer 1100ms ease-in-out infinite',
  }
  return (
    <div className="flex gap-3">
      <style>{`@keyframes mm-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}`}</style>
      {[0, 1].map((card) => (
        <div key={card} className="w-[104px] overflow-hidden rounded-[16px] bg-white shadow-sm ring-1 ring-black/[0.06]">
          <span className="block h-[72px]" style={shimmer} />
          <div className="flex flex-col gap-2 p-2">
            <span className="block h-2.5 rounded-full" style={{ ...shimmer, width: '90%' }} />
            <span className="block h-3 rounded-full" style={{ ...shimmer, width: '55%' }} />
            <span className="block h-2 rounded-full" style={{ ...shimmer, width: '75%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// --- 10 FlashSaleHero (mm-detail: white digits on red #bc1b06 boxes) ---------
function FlashSaleHeroKit() {
  const [h, m, s] = useCountdown(35997)
  return (
    <div className="w-[240px] overflow-hidden rounded-[12px] shadow-sm">
      <div className="flex items-center justify-between px-3 py-2.5" style={{ backgroundColor: PRICE_RED }}>
        <span className="flex items-center gap-1.5 text-[14px] font-bold text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
          Flash Sale
        </span>
        <span className="flex items-center gap-1 text-[12px] font-bold text-white">
          {[h, m, s].map((d, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && ':'}
              <span className="grid h-[22px] min-w-[24px] place-items-center rounded-[4px] px-1" style={{ backgroundColor: COUNTDOWN_RED }}>
                {d}
              </span>
            </span>
          ))}
        </span>
      </div>
      <div className="bg-[#FDF0EA] px-3 py-2">
        <span className="text-[20px] font-bold" style={{ color: COUNTDOWN_RED }}>฿249</span>
        <span className="ml-2 text-[11px] line-through" style={{ color: MUTED }}>฿450</span>
      </div>
    </div>
  )
}

// The panel looks each component up by the exact name MM_SYSTEM carries.
export const MM_KIT = {
  'ProductCard': ProductCardKit,
  'BottomSheet': BottomSheetKit,
  'PageHeader': PageHeaderKit,
  'IconButton': IconButtonKit,
  'CountBadge': CountBadgeKit,
  'WheelPicker': WheelPickerKit,
  'StickyFilterList': StickyFilterListKit,
  'EmptyState': EmptyStateKit,
  'Skeleton': SkeletonKit,
  'FlashSaleHero': FlashSaleHeroKit,
}

export default MM_KIT
