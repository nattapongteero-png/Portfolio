// Metaherb (web) — Design System tab: `component` + `wireframe` blocks.
// Shapes follow Pawmely's blocks in src/data/mockData.js (component ~472-490,
// wireframe 593-729). Splice into the Metaherb design-system section by hand.
//
// SOURCES (nothing invented):
// - Live build https://oommiemie.github.io/Metaherb/market (prototypeUrl in
//   mockData.js), driven with puppeteer-core headless at 390×844: 4 <select>
//   filter dropdowns, 30 buttons, page title METAHERB — all components below
//   are visible there or in the four captures.
// - public/mh-market-390.webp, mh-cart-390.webp, mh-pr-390.webp,
//   mh-quote-390.webp (780×1688 = 390-wide at 2x). Band boundaries found with
//   PIL by row-mean transitions, divided by 2 into 390-space; every text
//   string below is read off the captures. tone #319754 is the tone already
//   documented for Metaherb in mockData.js (sampled from the build; the
//   header green in the captures reads #36a15b at the top of the gradient).
// - Quantity stepper (− 1 +) and the third blue-outline cart button are
//   visible but have no matching preview/wire kind, so they carry no item.

export const metaherbComponent = {
  count: 7,
  kit: 'metaherb',
  tone: '#319754',
  platform: 'React + TypeScript',
  source: 'อ่านจากบิลด์สาธารณะที่รันอยู่จริง',
  note: 'ทุกจอประกอบจากชุดเดียวกัน — ปุ่มพิลล์เขียวนำทางหลัก ไทล์วัตถุดิบถือราคาต่อกิโลกรัมกับ MOQ และป้ายสถานะคุมการอ่านให้จบในแวบเดียว',
  items: [
    { name: 'Button', kind: 'button', role: 'Action', use: 'พิลล์เขียวเต็มความกว้างสำหรับทางหลักอย่างซื้อสินค้า แบบขอบสำหรับทางรองอย่างออกใบ PR และขอใบเสนอราคา' },
    { name: 'Input Fields', kind: 'input', role: 'Form', use: 'ช่องกรอกทรงมนพื้นเทาอ่อนในฟอร์ม PR และ RFQ พร้อม placeholder บอกรูปแบบที่ต้องกรอก เช่น เลขผู้เสียภาษี 13 หลัก' },
    { name: 'Filter Dropdown', kind: 'input', role: 'Form', use: 'ตัวกรองหัวตลาดแถวเดียวกัน — หมวดวัตถุดิบ เกรด และการเรียงลำดับ — เป็น select ทรงมนขอบเทาสี่ตัวในบิลด์จริง' },
    { name: 'Product Tile', kind: 'tile', role: 'Commerce', use: 'ไทล์วัตถุดิบ ภาพจัตุรัสพร้อมชิปคงเหลือและตราร้านยืนยัน ราคาต่อกก.เป็นสีเขียว คู่กับ MOQ คะแนน และยอดขายแล้ว' },
    { name: 'Order Summary Card', kind: 'card', role: 'Surface', use: 'การ์ดสรุปคำสั่งซื้อ ไล่จากรายการที่เลือก ยอดรวม ส่วนลด ค่าจัดส่ง จบที่มูลค่าสินค้ารวมตัวใหญ่สีส้ม' },
    { name: 'Checkbox', kind: 'toggle', role: 'Form', use: 'เช็กบ็อกซ์เขียวมุมมนในรถเข็น — เลือกทั้งหมด รายร้าน และรายชิ้น — ทุกสถานะติ๊กลงสีแบรนด์เดียวกัน' },
    { name: 'Status Badge', kind: 'badge', role: 'Status', use: 'ป้ายอ่านแวบเดียว — RFQ เท่านั้นสีฟ้า ชิปคงเหลือดำโปร่งบนภาพสินค้า และตราเช็กเขียวของร้านที่ยืนยันแล้ว' },
  ],
}

export const metaherbWireframe = {
  container: { screen: 390, content: 358, margin: 16 },
  note: 'Low-fi Wireframe คือโครงหน้าจอขาวดำ วางบล็อกและลำดับเนื้อหาให้ครบก่อนตัดสินใจเรื่องสีและงานภาพ ใช้ตกลงโครงสร้างกับทีมให้จบก่อนลงรายละเอียด',
  // Every h/mt below reproduces band positions MEASURED off the four captures
  // (PIL row scan, 2x → /2 into 390-space); every string is read off them.
  screens: [
    {
      name: 'ตลาดวัตถุดิบ',
      note: 'รายการวัตถุดิบ กรองตามหมวดและเกรด',
      // mh-market-390.webp: navbar 0–98 · title 112–140 (wash ends 164) ·
      // filter pills 180–221 · "พบ 22 รายการ" ~245 · product grid 274–~834.
      blocks: [
        { kind: 'nav', h: 96 },
        { kind: 'heading', h: 28, mt: 20, label: 'ตลาดวัตถุดิบสมุนไพร' },
        { kind: 'chips', h: 40, mt: 32 },
        { kind: 'heading', h: 16, mt: 24, label: 'พบ 22 รายการ' },
        {
          kind: 'products',
          h: 560,
          mt: 16,
          items: [
            { name: 'หญ้าฝรั่นอิหร่าน (Sa…', price: '฿98,000' },
            { name: 'อบเชยซีลอนแท่ง (Ce…', price: '฿880' },
            { name: 'ชุดสมุนไพรเสริมภูมิร…', price: '฿1,250' },
            { name: 'ลาเวนเดอร์แห้ง (Lav…', price: '฿1,600' },
          ],
        },
      ],
    },
    {
      name: 'ตะกร้า',
      note: 'รวมยอดจากน้ำหนักจริงและ MOQ ของแต่ละรายการ',
      // mh-cart-390.webp: navbar 0–98 · "รถเข็น" ~115–135 · select-all row
      // 180–226 · cart item card 240–406 · summary card 444–716 (title ~460,
      // k/v rows 500–670) · green button 716–761 · outline button 769–816.
      blocks: [
        { kind: 'nav', h: 96 },
        { kind: 'heading', h: 28, mt: 24, label: 'รถเข็น' },
        { kind: 'actionrow', h: 48, mt: 32, label: 'เลือกทั้งหมด (1 รายการ)', button: 'ลบที่เลือก' },
        {
          kind: 'entry',
          h: 168,
          mt: 16,
          title: 'หญ้าฝรั่นอิหร่าน (Saffron)',
          lines: ['พรีเมียม · 1,000g', '฿105840.00'],
          badge: 'RFQ เท่านั้น',
        },
        { kind: 'heading', h: 24, mt: 40, label: 'สรุปคำสั่งซื้อ' },
        {
          kind: 'fields',
          h: 224,
          mt: 8,
          rows: [
            ['สินค้าที่เลือก', '1 รายการ'],
            ['ยอดรวมสินค้า (1 ชิ้น)', '฿105840.00'],
            ['ส่วนลด', '-฿0.00'],
            ['ค่าจัดส่ง', 'ฟรี'],
            ['มูลค่าสินค้ารวม', '฿105840.00'],
          ],
        },
        { kind: 'button', h: 44, mt: 12 },
        { kind: 'button', h: 44, mt: 8 },
      ],
    },
    {
      name: 'ใบขอซื้อ (PR)',
      note: 'ยื่นขออนุมัติ ระบบแปลงเป็น PO ให้เมื่ออนุมัติ',
      // mh-pr-390.webp: navbar 0–98 · two-line title 118–178 · lead 190–230
      // (wash ends 253) · back link 282–292 · PR-number pills ~305–335 ·
      // Priority 384 + dropdown 412–453 · Required Date 477 + field 497–541 ·
      // Total Amount 569 + field 589–632 · duration label 660 + chip rows
      // 690–724 / 738–768 · Description 798 (cut at 844).
      blocks: [
        { kind: 'nav', h: 96 },
        { kind: 'heading', h: 64, mt: 24, label: 'ออกใบขอสั่งซื้อ (Purchase Requisition)' },
        { kind: 'box', h: 48, mt: 8 },
        { kind: 'heading', h: 16, mt: 40, label: 'กลับสู่รายละเอียดวัตถุดิบ' },
        { kind: 'segs', h: 32, mt: 12, items: ['เลขที่ PR', 'PR-2569-1241', '24/08/2569'], active: 1 },
        { kind: 'heading', h: 16, mt: 40, label: 'Priority' },
        { kind: 'box', h: 44, mt: 12 },
        { kind: 'heading', h: 16, mt: 24, label: 'Required Date' },
        { kind: 'box', h: 44, mt: 12 },
        { kind: 'heading', h: 16, mt: 24, label: 'Total Amount' },
        { kind: 'box', h: 44, mt: 12 },
        { kind: 'heading', h: 16, mt: 24, label: 'ระยะเวลาใบ PR (กำหนดยื่นเพื่ออนุมัติ)' },
        { kind: 'chips', h: 36, mt: 16 },
        { kind: 'chips', h: 36, mt: 8 },
        { kind: 'heading', h: 16, mt: 20, label: 'Description' },
      ],
    },
    {
      name: 'ใบเสนอราคา',
      note: 'ขอราคาจากซัพพลายเออร์ตามจำนวนที่ต้องการ',
      // mh-quote-390.webp: navbar 0–98 · title 118–142 · lead 155–195 (wash
      // ends 217) · back link 246–256 · product card 281–378 · company card
      // from 399: "ข้อมูลบริษัท" 425 + caption 450 · label 480 + input
      // 505–545 · label 568 + input 592–632 · label 656 + textarea 680–745 ·
      // "ผู้ติดต่อ" ~790 (cut at 844).
      blocks: [
        { kind: 'nav', h: 96 },
        { kind: 'heading', h: 28, mt: 24, label: 'ขอใบเสนอราคา (RFQ)' },
        { kind: 'box', h: 44, mt: 12 },
        { kind: 'heading', h: 16, mt: 44, label: 'กลับสู่รายละเอียดวัตถุดิบ' },
        {
          kind: 'entry',
          h: 96,
          mt: 20,
          title: 'หญ้าฝรั่นอิหร่าน (Saffron)',
          lines: ['Crocus sativus', 'METAHERB Store'],
        },
        { kind: 'heading', h: 24, mt: 44, label: 'ข้อมูลบริษัท' },
        { kind: 'box', h: 12, mt: 8 },
        { kind: 'heading', h: 16, mt: 16, label: 'ชื่อบริษัท / นิติบุคคล' },
        { kind: 'box', h: 44, mt: 8 },
        { kind: 'heading', h: 16, mt: 20, label: 'เลขประจำตัวผู้เสียภาษี' },
        { kind: 'box', h: 44, mt: 8 },
        { kind: 'heading', h: 16, mt: 20, label: 'ที่อยู่บริษัท' },
        { kind: 'box', h: 64, mt: 8 },
        { kind: 'heading', h: 24, mt: 40, label: 'ผู้ติดต่อ' },
      ],
    },
  ],
}

// Add to the design-system `cards` array (Component before Color, Low-fi
// before Hi-fi, matching Pawmely's ordering):
export const metaherbCards = [
  { id: 'component', label: 'Component', color: '#21221f', pills: ['Button', 'Input Fields', 'Filter Dropdown', 'Product Tile', 'Order Summary Card', 'Checkbox', 'Status Badge'] },
  { id: 'lowfi', label: 'Low-fi', color: '#46433c', art: 'wire' },
]
