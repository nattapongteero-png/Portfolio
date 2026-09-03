// Wireframe blocks for Metaherb Mobile and Metaherb Cafe, in the exact shape of
// Pawmely's wireframe block (mockData.js 593-729). MEASUREMENT METHOD: every
// capture is 860 × 1864 px = 430 × 932 at 2x (verified with PIL). Band edges were
// found with a PIL row-mean edge scan (per-row RGB mean, transitions above a
// threshold; narrow column windows to pin ambiguous bands), then divided by 2
// into 430-space. Every text string below is read off the corresponding capture
// (public/mm-*-430.webp, public/cafe-*-430.webp); h + mt reproduce the measured
// band starts on the page's own 16 margin and default 8 gap. Where a band's
// text could not be read (cut by an overlay or off-frame) it is left out.

export const mobileWireframe = {
  container: { screen: 430, content: 398, margin: 16 },
  note: 'Low-fi Wireframe คือโครงหน้าจอขาวดำ วางบล็อกและลำดับเนื้อหาให้ครบก่อนตัดสินใจเรื่องสีและงานภาพ ใช้ตกลงโครงสร้างกับทีมให้จบก่อนลงรายละเอียด',
  screens: [
    {
      name: 'Home',
      note: 'ค้นหา โปรโมชั่น และสินค้าแนะนำ',
      // MEASURED off mm-home-430.webp (430-space): logo 11–52 · search 74–118 ·
      // hero banner 146–264 · promo pair 276–346 · category circles 372–446 ·
      // heading 487–504 · product cards 526–784 · dots 797–803 · tab bar 855–920.
      blocks: [
        { kind: 'shoptitle', h: 50, title: 'METAHERB', subs: ['สมุนไพรไทยเพื่อสุขภาพดี'] },
        { kind: 'search', h: 44, placeholder: 'ค้นหาสินค้า, สมุนไพร, ร้านค้า...' },
        { kind: 'photo', h: 118, mt: 28, name: 'METAHERB Essence', sub: 'Volatile Oil · พิมเสนน้ำ' },
        { kind: 'row2', h: 70, mt: 12 },
        // Five circles on the capture; the fifth (ขวด...) is cut at the frame edge,
        // so only the four fully readable labels are carried.
        { kind: 'people', h: 74, mt: 26, items: ['ผลิตภัณฑ์สุขภาพ', 'อาหาร & เครื่องดื่ม', 'เครื่องหอม & อโรม่า', 'ผลิตภัณฑ์สมุนไพร'] },
        { kind: 'heading', h: 16, mt: 40, label: 'แนะนำสำหรับคุณ' },
        {
          kind: 'duo',
          h: 258,
          mt: 24,
          items: [
            { title: 'เมต้าเฮิร์บ สมุนไพรหอม (ย...', sub: 'Flash Sale 09 : 59 : 52', big: '฿249.00', foot: '4.8/5 · ขายได้ 200+' },
            { title: 'ชุดของขวัญ Happy New Y...', sub: 'แนะนำ', big: '฿95.00', foot: '4.5/5 · ขายได้ 220+' },
          ],
        },
        { kind: 'dots', h: 6, mt: 13 },
        { kind: 'tabbar', h: 64, mt: 'auto' },
      ],
    },
    {
      name: 'Product detail',
      note: 'ราคา ตัวเลือกกลิ่น และปุ่มซื้อ',
      // MEASURED off mm-detail-430.webp: photo 0–430 · Flash Sale bar 430–468 ·
      // ฿249 468–536 · title ~536–560 · rating 576 · option chips 646–678 ·
      // qty row 727–765 · section head 808 · buy bar 855–905.
      blocks: [
        { kind: 'photo', h: 414, name: 'เมต้าเฮิร์บ', sub: 'NATURAL · PREMIUM · AROMATIC' },
        { kind: 'actionrow', h: 38, label: 'Flash Sale', button: '09 : 59 : 57' },
        { kind: 'heading', h: 40, label: '฿249' },
        { kind: 'heading', h: 24, label: 'เมต้าเฮิร์บ สมุนไพรหอม (ยาดม)' },
        { kind: 'heading', h: 16, label: '4.8 (3 รีวิว) · ขายได้ 200+ · คูปอง' },
        { kind: 'heading', h: 16, mt: 24, label: 'ตัวเลือกสินค้า' },
        { kind: 'segs', h: 32, items: ['กลิ่นส้ม (Orange)', 'กลิ่นต้นตำรับ', 'เซ็ตคู่ (2 กลิ่น)'], active: 0 },
        { kind: 'heading', h: 16, mt: 16, label: 'จำนวนสินค้า' },
        { kind: 'actionrow', h: 38, label: 'เหลือเพียง 10 ชิ้น', button: '− 1 +' },
        { kind: 'heading', h: 16, mt: 32, label: 'รายละเอียดผลิตภัณฑ์' },
        { kind: 'segs', h: 50, mt: 'auto', items: ['ซื้อสินค้า'], active: 0 },
      ],
    },
    {
      name: 'Cart',
      note: 'เลือกของ สรุปยอด และชำระเงิน',
      // MEASURED off mm-cart-430.webp: title 15–48 · search 72–116 · select-all
      // 154–172 · shop row 219–247 · items 254–358 / 366–464 / 472–576 ·
      // summary sheet 584–770 · doc buttons 796–830 · pay button 856–906.
      blocks: [
        { kind: 'heading', h: 32, label: 'ตะกร้าสินค้า · 5 ชิ้นในตะกร้า' },
        { kind: 'search', h: 44, mt: 24, placeholder: 'ค้นหาในตะกร้า...' },
        { kind: 'actionrow', h: 18, mt: 38, label: 'เลือกทั้งหมด (3 รายการ)', button: 'ลบ 3 รายการ' },
        { kind: 'entry', h: 28, mt: 47, title: 'บ้านสมุนไพรไทย', badge: 'แนะนำ' },
        { kind: 'entry', h: 104, title: 'อบเชยเทศ Cinnamon Varum (Alba)', lines: ['ขนาด 150 g', '฿580 · ฿398'] },
        { kind: 'entry', h: 98, title: 'เมต้าเฮิร์บ สมุนไพรหอม Aromatic Herbals', lines: ['เซ็ต Aromatic คละกลิ่น', '฿450 · ฿299'] },
        { kind: 'entry', h: 104, title: 'กาแฟดริป Signature Blend (Medium Roast)', lines: ['Medium Roast · 9 ซอง', '฿250 · ฿150'] },
        {
          kind: 'fields',
          h: 186,
          rows: [
            ['รายการที่เลือก', '3 รายการ'],
            ['ยอดสินค้า (4 ชิ้น)', '฿847'],
            ['ส่วนลด', '-฿433'],
            ['ค่าจัดส่ง', 'ฟรี'],
            ['รวมทั้งสิ้น', '฿847'],
          ],
        },
        { kind: 'segs', h: 34, mt: 26, items: ['ออกใบ PR (1)', 'ขอใบเสนอราคา'], active: 0 },
        { kind: 'segs', h: 50, mt: 26, items: ['ชำระเงิน (3)'], active: 0 },
      ],
    },
    {
      name: 'Shop console',
      note: 'ทางลัดผู้ขายและสถานะออเดอร์',
      // MEASURED off mm-shop-430.webp: green head 16–48 · action grid 76–250
      // (row-1 labels ~151, row-2 labels ~249) · dots ~271 · AI banner 290–430 ·
      // ภาพรวม 462 · orders card 486–710 · quote head 753 · quote stats 761–861 ·
      // tab bar 855–920.
      blocks: [
        { kind: 'heading', h: 32, label: 'ร้านค้าของฉัน · ร้านค้าของคุณ' },
        { kind: 'people', h: 84, mt: 28, items: ['คำสั่งซื้อ', 'สินค้า', 'Flash Sale', 'โปรโมชั่น'] },
        { kind: 'people', h: 82, items: ['คูปอง', 'ใบเสนอราคา', 'ใบ PR', 'ใบ PO'] },
        { kind: 'dots', h: 6, mt: 15 },
        {
          kind: 'hero',
          h: 140,
          mt: 13,
          title: 'น้องเมต้า · ผู้จัดการ AI',
          sub: 'ช่วยจัดการข้อมูลร้านค้า · ถามยอดขาย สรุปออเดอร์',
          button: 'เริ่มแชท',
        },
        { kind: 'heading', h: 16, mt: 16, label: 'ภาพรวม' },
        { kind: 'heading', h: 16, mt: 30, label: 'ออเดอร์ล่าสุด · ทั้งหมด 51' },
        {
          kind: 'fields',
          h: 190,
          rows: [
            ['รอชำระเงิน', '5'],
            ['รอตรวจสอบ', '3'],
            ['รอจัดส่ง', '12'],
            ['กำลังส่ง', '7'],
            ['จัดส่งแล้ว', '23'],
            ['ยกเลิก', '1'],
          ],
        },
        { kind: 'heading', h: 16, mt: 31, label: 'สถานะใบเสนอราคา · ทั้งหมด 15' },
        {
          kind: 'fields',
          h: 100,
          rows: [
            ['รอตอบกลับ', '4'],
            ['ตอบรับแล้ว', '9'],
            ['หมดอายุ', '2'],
          ],
        },
        { kind: 'tabbar', h: 64, mt: 'auto' },
      ],
    },
  ],
}

export const cafeWireframe = {
  container: { screen: 430, content: 398, margin: 16 },
  note: 'Low-fi Wireframe คือโครงหน้าจอขาวดำ วางบล็อกและลำดับเนื้อหาให้ครบก่อนตัดสินใจเรื่องสีและงานภาพ ใช้ตกลงโครงสร้างกับทีมให้จบก่อนลงรายละเอียด',
  screens: [
    {
      name: 'Cafe home',
      note: 'แบนเนอร์ ค้นหา และเมนูฮิต',
      // MEASURED off cafe-home-430.webp: header 13–48 · green hero 72–200 ·
      // search 215–259 · heading 282–295 · menu cards 307–590 and 612–895
      // (rows 5–6 are cut at the frame's bottom edge and are left out).
      blocks: [
        { kind: 'heading', h: 32, label: 'META Caffe · GREEN BREW COFFEE' },
        { kind: 'photo', h: 128, mt: 24, name: 'กาแฟคั่วพิถีพิถัน', sub: 'หอมกรุ่น กลมกล่อมเข้มนุ่ม' },
        { kind: 'search', h: 44, mt: 15, placeholder: 'ค้นหาเมนูคาเฟ่...' },
        { kind: 'heading', h: 16, mt: 20, label: 'เมนูฮิต คนสั่งเยอะ · 6 อันดับ' },
        {
          kind: 'products',
          h: 580,
          mt: 12,
          items: [
            { name: 'Iced Americano', price: '฿80' },
            { name: 'Iced Caramel Macchiato', price: '฿70' },
            { name: 'Iced Latte', price: '฿70' },
            { name: 'Strawberry Milk', price: '฿85' },
          ],
        },
      ],
    },
    {
      name: 'Item detail',
      note: 'ระดับความหวานและเพิ่มลงตะกร้า',
      // MEASURED off cafe-item-430.webp: photo 0–430 · ฿80 ~448–470 · title
      // 486–505 · sub line 512–532 · sold 546–560 · sweetness head 598–613 ·
      // radio list 635–790 · qty row 810–842 · add-to-cart bar 849–899.
      blocks: [
        { kind: 'photo', h: 414, name: 'อันดับ 1' },
        { kind: 'heading', h: 32, label: '฿80' },
        { kind: 'heading', h: 26, label: 'Iced Americano' },
        { kind: 'heading', h: 20, label: 'เย็น · กาแฟสดคั่วพิเศษ หอมเข้มกลมกล่อม' },
        { kind: 'heading', h: 20, label: 'ขายแล้ว 276 แก้ว' },
        { kind: 'actionrow', h: 24, mt: 24, label: 'ระดับความหวาน', button: 'เลือก 1' },
        // Four radio rows; the capture marks หวานปกติ as the selected one, but a
        // radio state has no text to read, so the rows carry labels only.
        {
          kind: 'fields',
          h: 170,
          mt: 24,
          rows: [
            ['ไม่หวาน', ''],
            ['หวานน้อย', ''],
            ['หวานปกติ', ''],
            ['หวานมาก', ''],
          ],
        },
        { kind: 'actionrow', h: 32, label: 'จำนวน', button: '− 1 +' },
        { kind: 'segs', h: 50, items: ['เพิ่มลงตะกร้า · ฿80'], active: 0 },
      ],
    },
    {
      name: 'Cart',
      note: 'รายการเดียว พร้อมสั่งซื้อ',
      // MEASURED off cafe-cart-430.webp: header 15–48 · item row 76–156 ·
      // (empty page body) · order bar 855–905.
      blocks: [
        { kind: 'heading', h: 32, label: 'ตะกร้า · META Caffe' },
        { kind: 'entry', h: 80, mt: 28, title: 'Iced Americano', lines: ['หวานปกติ'], badge: '฿80' },
        { kind: 'segs', h: 50, mt: 'auto', items: ['สั่งซื้อ · ฿80'], active: 0 },
      ],
    },
    {
      name: 'Checkout',
      note: 'รับสินค้า วิธีจ่าย และยอดรวม',
      // MEASURED off cafe-pay-430.webp: header 15–48 · สรุปคำสั่งซื้อ 72–88 ·
      // item 112–162 · รับสินค้า ~200 · pickup card 232–297 · delivery card
      // 310–373 · payment head ~406–430 · PromptPay row 460–508 · totals
      // 548–648 · confirm bar 855–905.
      blocks: [
        { kind: 'heading', h: 32, label: 'ชำระเงิน · META Caffe' },
        { kind: 'heading', h: 16, mt: 24, label: 'สรุปคำสั่งซื้อ' },
        { kind: 'entry', h: 50, mt: 24, title: 'Iced Americano ×1', lines: ['หวานปกติ'], badge: '฿80' },
        { kind: 'heading', h: 16, mt: 30, label: 'รับสินค้า' },
        { kind: 'entry', h: 66, mt: 24, title: 'รับที่ร้าน', lines: ['รับเองที่เคาน์เตอร์'] },
        { kind: 'entry', h: 64, mt: 12, title: 'จัดส่ง', lines: ['ส่งถึงที่ · ค่าส่ง ฿20'] },
        { kind: 'actionrow', h: 28, mt: 32, label: 'วิธีชำระเงิน', button: 'เปลี่ยน' },
        { kind: 'entry', h: 48, mt: 26, title: 'พร้อมเพย์ (PromptPay)', lines: ['สแกน QR ชำระเงิน'] },
        {
          kind: 'fields',
          h: 100,
          mt: 40,
          rows: [
            ['ยอดสินค้า (1 รายการ)', '฿80'],
            ['ค่าจัดส่ง', 'ฟรี'],
            ['ยอดชำระทั้งหมด', '฿80'],
          ],
        },
        { kind: 'segs', h: 50, mt: 'auto', items: ['ยืนยันชำระเงิน · ฿80'], active: 0 },
      ],
    },
  ],
}
