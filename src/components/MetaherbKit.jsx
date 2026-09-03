// -----------------------------------------------------------------------------
// MetaherbKit.jsx
// The Metaherb (web) component set, rebuilt as working React so the Component
// panel can hand you the real thing instead of a picture of it: buttons count
// presses, fields take focus and text, the filter dropdown opens, the cart
// checkboxes cascade, the summary stepper re-totals the order.
//
// Everything is built out of the tokens documented for Metaherb in mockData.js
// (brand green #319754, price green, the Flash-Sale-only red, the grey neutral
// ramp) and every string is read off the four public/mh-*-390.webp captures of
// the live build — nothing invented.
// -----------------------------------------------------------------------------

import { useState } from 'react'

// --- Tokens ------------------------------------------------------------------
const GREEN = '#319754' // BRAND_GREEN — primary buttons, selected states
const GREEN_DARK = '#267A43' // BRAND_GREEN_DARK — pressed state
const PRICE = '#226A3B' // PRICE_GREEN — undiscounted prices
const TINT = '#E6F5EC' // BRAND_GREEN_TINT — soft grounds, chips
const RED = '#E62E05' // PRICE_RED — reserved for discounts / big totals
const STAR = '#F59E0B' // STAR_YELLOW — always next to a star shape
const INK = '#0A0A0A' // TEXT_PRIMARY
const SUB = '#525252' // TEXT_SECONDARY
const MUTED = '#737373' // TEXT_MUTED — captions, placeholders
const SURFACE = '#F5F5F5' // SURFACE_GRAY — input grounds
const LINE = '#E5E7EB' // BORDER_GRAY
const RFQ_BLUE = '#3B82F6' // "RFQ เท่านั้น" badge text (chip read off mh-cart)
const RFQ_BG = '#DBEAFE'
const FONT = "'IBM Plex Sans Thai Looped','IBM Plex Sans Thai',system-ui,sans-serif"

// Press feedback, same rule as the app: small targets sink deeper so the
// response stays equally visible at every size.
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
        fontFamily: FONT,
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
// The cart's three-way action stack: filled green pill for the main road
// (ซื้อสินค้า), green outline for the PR road, blue outline for the RFQ road.
function ButtonKit() {
  const [count, setCount] = useState(1)
  return (
    <div className="flex w-full max-w-[240px] flex-col gap-2" style={{ fontFamily: FONT }}>
      <Press
        scale={0.98}
        onClick={() => setCount((c) => c + 1)}
        className="flex w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-bold text-white"
        style={{ height: 44, backgroundColor: GREEN }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M5 8h14l-1 12H6ZM9 8a3 3 0 0 1 6 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ซื้อสินค้า ({count})
      </Press>
      <Press
        scale={0.98}
        onClick={() => setCount(1)}
        className="grid w-full place-items-center rounded-full border-2 text-[13px] font-bold"
        style={{ height: 40, borderColor: GREEN, color: GREEN_DARK }}
      >
        ออกใบ PR ({count})
      </Press>
      <Press
        scale={0.98}
        className="grid w-full place-items-center rounded-full border-2 text-[13px] font-bold"
        style={{ height: 40, borderColor: RFQ_BLUE, color: RFQ_BLUE }}
      >
        ขอใบเสนอราคา
      </Press>
    </div>
  )
}

// --- 02 Input Fields ---------------------------------------------------------
// The RFQ form's rounded grey fields, labels with the red required mark, and
// the real placeholders (เช่น บริษัท เฮอร์บาแบรนด์ จำกัด / 13 หลัก).
function InputKit() {
  const [name, setName] = useState('')
  const [tax, setTax] = useState('')
  const [focus, setFocus] = useState(null)
  const shell = (key) => ({
    className: 'flex items-center rounded-full px-4',
    style: {
      height: 44,
      backgroundColor: SURFACE,
      boxShadow: focus === key ? `0 0 0 2px ${GREEN}` : `inset 0 0 0 1px ${LINE}`,
      transition: 'box-shadow 220ms ease-out',
    },
  })
  const field = (key) => ({
    onFocus: () => setFocus(key),
    onBlur: () => setFocus(null),
    className: 'w-full bg-transparent text-[13px] outline-none',
    style: { color: INK, fontFamily: FONT },
  })
  return (
    <div className="flex w-full max-w-[240px] flex-col gap-2" style={{ fontFamily: FONT }}>
      <label className="text-[12px] font-bold" style={{ color: INK }}>
        ชื่อบริษัท / นิติบุคคล <span style={{ color: RED }}>*</span>
      </label>
      <div {...shell('name')}>
        <input {...field('name')} value={name} placeholder="เช่น บริษัท เฮอร์บาแบรนด์ จำกัด" onChange={(e) => setName(e.target.value)} />
      </div>
      <label className="mt-1 text-[12px] font-bold" style={{ color: INK }}>
        เลขประจำตัวผู้เสียภาษี
      </label>
      <div {...shell('tax')}>
        <input
          {...field('tax')}
          value={tax}
          inputMode="numeric"
          placeholder="13 หลัก"
          onChange={(e) => setTax(e.target.value.replace(/\D/g, '').slice(0, 13))}
        />
        {tax && (
          <span className="shrink-0 text-[11px] font-semibold" style={{ color: tax.length === 13 ? GREEN : MUTED }}>
            {tax.length}/13
          </span>
        )}
      </div>
    </div>
  )
}

// --- 03 Filter Dropdown ------------------------------------------------------
// The market header's rounded white selects (ทั้งหมด · เกรด ทั้งหมด · ยอดนิยม),
// one of them opened so the menu shape is part of the record.
const FILTERS = ['ทั้งหมด', 'ยอดนิยม', 'เกรด ทั้งหมด']
function DropdownKit() {
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState(0)
  const Chevron = ({ up }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4"
      style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform 220ms ease-out' }}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return (
    <div className="relative w-full max-w-[240px]" style={{ fontFamily: FONT, minHeight: 150 }}>
      <div className="flex gap-2">
        <Press
          scale={0.98}
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center justify-between rounded-[14px] bg-white px-3.5 text-[13px] font-semibold"
          style={{ height: 44, color: INK, boxShadow: open ? `0 0 0 2px ${GREEN}` : `inset 0 0 0 1.5px ${LINE}` }}
        >
          {FILTERS[pick]}
          <Chevron up={open} />
        </Press>
        <span
          className="flex items-center gap-2 rounded-[14px] bg-white px-3.5 text-[13px] font-semibold"
          style={{ height: 44, color: INK, boxShadow: `inset 0 0 0 1.5px ${LINE}` }}
        >
          เกรด ทั้งหมด <Chevron />
        </span>
      </div>
      {open && (
        <div className="absolute left-0 top-[52px] z-10 w-[150px] overflow-hidden rounded-[14px] bg-white shadow-lg ring-1 ring-black/[0.08]">
          {FILTERS.map((f, i) => (
            <Press
              key={f}
              scale={0.98}
              onClick={() => { setPick(i); setOpen(false) }}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13px] font-semibold"
              style={{ color: pick === i ? GREEN_DARK : INK, backgroundColor: pick === i ? TINT : '#fff' }}
            >
              {f}
              {pick === i && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3">
                  <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Press>
          ))}
        </div>
      )}
      <span className="mt-2.5 block text-[12px]" style={{ color: SUB }}>
        พบ <b style={{ color: GREEN_DARK }}>22</b> รายการ
      </span>
    </div>
  )
}

// --- 04 Product Tile ---------------------------------------------------------
// The market's ingredient tile: image with the stock chip and verified seal,
// name + shop line, then the grey ราคา/กก. + MOQ box and the star/sold row.
// Tapping the tile flips between the two ingredients read off mh-market.
const PRODUCTS = [
  { emoji: '🌿', name: 'หญ้าฝรั่นอิหร่าน (Sa…', shop: 'METAHERB Store', stock: 'คงเหลือ 18 กก.', price: '฿98,000', moq: '1 กก.', star: '5/5', sold: 'ขายแล้ว 8 กก.' },
  { emoji: '🪵', name: 'อบเชยซีลอนแท่ง (Ce…', shop: 'บ้านสมุนไพรไทย', stock: 'คงเหลือ 320 กก.', price: '฿880', moq: '5 กก.', star: '4.9/5', sold: 'ขายแล้ว 141 กก.' },
]
function TileKit() {
  const [i, setI] = useState(0)
  const p = PRODUCTS[i]
  return (
    <Press
      scale={0.98}
      onClick={() => setI((v) => (v + 1) % PRODUCTS.length)}
      className="block w-[168px] overflow-hidden rounded-[18px] bg-white text-left ring-1 ring-black/[0.06]"
    >
      <div className="relative grid h-[64px] place-items-center text-[26px]" style={{ backgroundColor: TINT }}>
        {p.emoji}
        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-white shadow-sm">
          <span className="grid size-4 place-items-center rounded-full" style={{ backgroundColor: GREEN }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4">
              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
        <span className="absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[9px] font-semibold text-white" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          {p.stock}
        </span>
      </div>
      <div className="p-2.5">
        <span className="block truncate text-[12px] font-bold" style={{ color: INK }}>{p.name}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[10px]" style={{ color: SUB }}>
          <span className="size-1.5 rounded-full" style={{ backgroundColor: GREEN }} />
          {p.shop}
        </span>
        <div className="mt-1.5 flex items-center justify-between rounded-[10px] px-2 py-1.5" style={{ backgroundColor: SURFACE }}>
          <span>
            <span className="block text-[9px]" style={{ color: MUTED }}>ราคา/กก.</span>
            <span className="block text-[13px] font-bold leading-tight" style={{ color: PRICE }}>{p.price}</span>
          </span>
          <span className="text-right">
            <span className="block text-[9px]" style={{ color: MUTED }}>MOQ</span>
            <span className="block text-[11px] font-bold leading-tight" style={{ color: INK }}>{p.moq}</span>
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: INK }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill={STAR}>
              <path d="m12 2 3 6.6 7 .8-5.2 4.8L18.3 21 12 17.4 5.7 21l1.5-6.8L2 9.4l7-.8Z" />
            </svg>
            {p.star}
          </span>
          <span className="text-[9px]" style={{ color: MUTED }}>{p.sold}</span>
        </div>
      </div>
    </Press>
  )
}

// --- 05 Order Summary Card ---------------------------------------------------
// The cart's สรุปคำสั่งซื้อ card, live: the − 1 + stepper from the cart item
// drives the totals, and the big closing number keeps the orange the system
// reserves for money that moves.
const UNIT = 105840
function SummaryKit() {
  const [qty, setQty] = useState(1)
  const baht = (n) => `฿${n.toLocaleString('en-US')}.00`
  const row = (k, v, color = INK, bold = false) => (
    <div className="flex items-center justify-between text-[11px]" style={{ color: SUB }}>
      <span>{k}</span>
      <span className={bold ? 'font-bold' : 'font-semibold'} style={{ color }}>{v}</span>
    </div>
  )
  return (
    <div className="w-full max-w-[240px] rounded-[18px] bg-white p-3.5 ring-1 ring-black/[0.06]" style={{ fontFamily: FONT }}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: INK }}>สรุปคำสั่งซื้อ</span>
        <span className="flex items-center overflow-hidden rounded-[8px]" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <Press scale={0.9} ariaLabel="ลด" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-6 place-items-center text-[13px]" style={{ color: SUB }}>−</Press>
          <span className="grid w-6 place-items-center text-[11px] font-bold" style={{ color: INK }}>{qty}</span>
          <Press scale={0.9} ariaLabel="เพิ่ม" onClick={() => setQty((q) => q + 1)} className="grid size-6 place-items-center text-[13px]" style={{ color: SUB }}>+</Press>
        </span>
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        {row('สินค้าที่เลือก', '1 รายการ', GREEN_DARK, true)}
        {row(`ยอดรวมสินค้า (${qty} ชิ้น)`, baht(UNIT * qty))}
        {row('ส่วนลด', '-฿0.00', RED)}
        {row('ค่าจัดส่ง', 'ฟรี', GREEN_DARK, true)}
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t pt-2.5" style={{ borderColor: LINE }}>
        <span className="text-[12px] font-bold" style={{ color: INK }}>มูลค่าสินค้ารวม</span>
        <span className="text-[16px] font-bold" style={{ color: RED }}>{baht(UNIT * qty)}</span>
      </div>
    </div>
  )
}

// --- 06 Checkbox -------------------------------------------------------------
// The cart's green rounded checks in their real hierarchy: select-all drives
// the shop row drives the item row, and the count in the label follows.
function CheckboxKit() {
  const [item, setItem] = useState(true)
  const Box = ({ on, toggle, label, sub, bold }) => (
    <Press scale={0.97} onClick={toggle} className="flex items-center gap-2.5 text-left">
      <span
        className="grid size-[22px] shrink-0 place-items-center rounded-[6px]"
        style={{
          backgroundColor: on ? GREEN : '#fff',
          boxShadow: on ? 'none' : `inset 0 0 0 2px ${LINE}`,
          transition: 'background-color 220ms ease-out',
        }}
      >
        {on && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={`text-[12px] ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color: INK }}>
        {label}
        {sub && <span className="ml-1 font-normal" style={{ color: MUTED }}>{sub}</span>}
      </span>
    </Press>
  )
  return (
    <div className="flex w-full max-w-[240px] flex-col gap-2" style={{ fontFamily: FONT }}>
      <div className="flex items-center justify-between rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-black/[0.06]">
        <Box on={item} toggle={() => setItem((v) => !v)} bold label={`เลือกทั้งหมด (${item ? 1 : 0} รายการ)`} />
        <span className="text-[11px] font-bold" style={{ color: item ? RED : LINE }}>ลบที่เลือก</span>
      </div>
      <div className="rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-black/[0.06]">
        <Box on={item} toggle={() => setItem((v) => !v)} bold label="METAHERB Store" />
        <div className="mt-2 border-t pt-2" style={{ borderColor: LINE }}>
          <Box on={item} toggle={() => setItem((v) => !v)} label="หญ้าฝรั่นอิหร่าน (Saffron)" sub="พรีเมียม · 1,000g" />
        </div>
      </div>
    </div>
  )
}

// --- 07 Status Badge ---------------------------------------------------------
// The read-in-a-glance set, all at once: the blue RFQ-only chip, the black
// stock chip that sits on product photos, and the verified-shop seal.
function BadgeKit() {
  return (
    <div className="flex w-full max-w-[240px] flex-col items-center gap-2.5" style={{ fontFamily: FONT }}>
      <span className="rounded-[8px] px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: RFQ_BG, color: RFQ_BLUE }}>
        RFQ เท่านั้น
      </span>
      {/* The stock chip only exists on top of imagery, so it brings its ground. */}
      <span className="flex items-center rounded-[12px] p-1.5" style={{ backgroundColor: TINT }}>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          คงเหลือ 18 กก.
        </span>
      </span>
      <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: INK }}>
        METAHERB Store
        <span className="grid size-4 place-items-center rounded-full" style={{ backgroundColor: GREEN }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </div>
  )
}

// The panel looks each component up by the exact item name it carries in
// metaherbDesign.js.
export const METAHERB_KIT = {
  'Button': ButtonKit,
  'Input Fields': InputKit,
  'Filter Dropdown': DropdownKit,
  'Product Tile': TileKit,
  'Order Summary Card': SummaryKit,
  'Checkbox': CheckboxKit,
  'Status Badge': BadgeKit,
}

export default METAHERB_KIT
