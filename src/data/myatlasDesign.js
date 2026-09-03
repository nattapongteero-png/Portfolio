// MyAtlas design-system data set — every value read from the Flutter source
// (myatlas_app/lib) or measured off the four captures in Portfolio/public
// (ma-hifi-*-390.webp, 780×1688 = 390×844 at 2x; measured px row ÷ 2).
// Shapes follow Pawmely's blocks in src/data/mockData.js.

// The face the app SHIPS, read off the deployed build's own font bundle —
// assets/FontManifest.json plus the font-picker table compiled into
// main.dart.js. NOT off the local clone: that clone is months behind (its
// gh-pages is a 2026-04-21 deploy, the live main.dart.js is 17 Aug) and its
// theme still calls GoogleFonts.dmSans. "DM Sans" appears ZERO times in the
// shipped bundle — printing it here was wrong, and the owner said so.
//
// What ships: the app's default pairing is `ibmNunito` —
//   fontFamily: 'Nunito'  ·  fontFamilyFallback: ['IBM Plex Sans Thai Looped']
// and the Nunito asset is NunitoNum.ttf, a 17 KB numerals-only subset against
// IBM Plex's 125 KB regular. So Nunito sets the DIGITS and every letter and
// Thai glyph falls through to IBM Plex Sans Thai Looped. The Display settings
// also let the reader swap the text face to Sukhumvit Set, Google Sans,
// Sarabun or Noto Sans Thai — all four keep IBM Plex Sans Thai Looped as their
// Thai baseline.
//
// The SIZE/WEIGHT table below still comes from lib/core/theme/
// app_typography.dart in the clone, so it describes the scale as authored;
// the shipped build may have moved on.
//
// `metrics` omitted: the font file was not measured, so no number is printed.
// Line-heights are in the source (1.20 → 1.36 down the scale) but the specimen
// has no column for them, so they are not invented into one.
export const myatlasTypography = {
  tone: '#1D8B6B',
  latin: 'IBM Plex Sans Thai Looped',
  thai: 'IBM Plex Sans Thai Looped',
  classification: 'Looped Thai · ตัวเลขใช้ Nunito',
  note: 'ตัวหนังสือทั้งแอปเป็น IBM Plex Sans Thai Looped ส่วนตัวเลขแยกไปใช้ Nunito — ไฟล์ที่ฝังมาเป็น NunitoNum.ttf ที่มีแต่ตัวเลขอย่างเดียว (17 KB) ตัวอักษรทุกตัวจึงตกมาที่ IBM Plex เสมอ เป็นคู่ฟอนต์ค่าเริ่มต้นที่อ่านจากบันเดิลของบิลด์จริง และในหน้าตั้งค่ายังสลับตัวอักษรได้อีกสี่แบบ — Sukhumvit Set, Google Sans, Sarabun, Noto Sans Thai — ซึ่งทุกแบบยังคง IBM Plex Sans Thai Looped ไว้เป็นฐานของตัวไทย ส่วนสเกลด้านล่างอ่านจาก app_typography.dart ทั้ง 11 ขั้น และยังมีอีกสองขนาดนอกตาราง คือ 21/400 ของตัวเลือกวันเวลา และ 10/500 ของป้ายแท็บ',
  // Weights actually used across app_typography.dart + app_theme.dart:
  // w400, w500 (tabLabel 10/500 in app_theme.dart), w600, w700.
  weights: [
    { name: 'Regular', value: 400 },
    { name: 'Medium', value: 500 },
    { name: 'SemiBold', value: 600 },
    { name: 'Bold', value: 700 },
  ],
  // Each step is a real static method in app_typography.dart, size/weight verbatim.
  scale: [
    { role: 'Large title', token: 'largeTitle/34', px: 34, weight: 700, usage: 'หัวข้อใหญ่ของหน้า' },
    { role: 'Title 1', token: 'title1/28', px: 28, weight: 700, usage: 'หัวข้อรอง' },
    { role: 'Title 2', token: 'title2/22', px: 22, weight: 700, usage: 'หัวข้อกลุ่มเนื้อหา' },
    { role: 'Title 3', token: 'title3/20', px: 20, weight: 600, usage: 'หัวข้อการ์ด' },
    { role: 'Headline', token: 'headline/17', px: 17, weight: 600, usage: 'ข้อความเน้นในแถว' },
    { role: 'Body', token: 'body/17', px: 17, weight: 400, usage: 'เนื้อความหลัก' },
    { role: 'Callout', token: 'callout/16', px: 16, weight: 400, usage: 'ข้อความประกอบ' },
    { role: 'Subheadline', token: 'subheadline/15', px: 15, weight: 400, usage: 'หัวข้อย่อย' },
    { role: 'Footnote', token: 'footnote/13', px: 13, weight: 400, usage: 'หมายเหตุ' },
    { role: 'Caption 1', token: 'caption1/12', px: 12, weight: 400, usage: 'คำบรรยายภาพ' },
    { role: 'Caption 2', token: 'caption2/11', px: 11, weight: 400, usage: 'ตัวเล็กสุด · ป้ายกำกับ' },
  ],
}

// The shipped palette, read off lib/core/theme/app_colors.dart and grouped the
// way that file groups it: brand greens (+ the iOS system blues it keeps),
// surfaces light/dark, text & separators, then the Apple-Health metric colours
// and the semantic set. Alpha-carrying labels are printed at their base hex
// with the opacity noted in `usage`.
export const myatlasColor = {
  brand: {
    name: 'Atlas Green',
    hex: '#1D8B6B',
    token: 'brandPrimary',
    harmony: 'Green ramp · iOS system blue · metric brights',
    note: 'เขียวสุขภาพเป็นสีแบรนด์เดี่ยวบนพื้นเขียวอ่อน #F4F8F5 — สีเมตริกจัด ๆ อย่างแดงหัวใจและส้มกิจกรรมยกมาจากภาษา Apple Health ตรง ๆ เพื่อให้คนที่คุ้นแอปสุขภาพอ่านออกทันที',
  },
  groups: [
    {
      name: 'Brand',
      on: '#FFFFFF',
      swatches: [
        { name: 'Primary 600', hex: '#1D8B6B', token: 'primary600 / brandPrimary', usage: 'สีแบรนด์ · แท็บที่เลือก · ปุ่มหลัก' },
        { name: 'Primary 400', hex: '#4AB99C', token: 'primary400', usage: 'เขียวอ่อน · กราเดียนต์วงแหวน' },
        { name: 'iOS Blue', hex: '#007AFF', token: 'primary', usage: 'สีระบบ iOS ธีมสว่าง' },
        { name: 'iOS Blue Dark', hex: '#0A84FF', token: 'primaryDark', usage: 'สีระบบ iOS ธีมมืด' },
        { name: 'Secondary 600', hex: '#A88B5B', token: 'secondary600', usage: 'น้ำตาลทองรอง' },
        { name: 'Secondary 50', hex: '#FAF7F1', token: 'secondary50', usage: 'พื้นครีมอ่อน' },
      ],
    },
    {
      name: 'Surface',
      on: '#1A1A1A',
      swatches: [
        { name: 'Background', hex: '#F4F8F5', token: 'background / bgPrimary', usage: 'พื้นหน้าจอเขียวอ่อน' },
        { name: 'Surface', hex: '#FFFFFF', token: 'surface / bgSurface', usage: 'พื้นการ์ด' },
        { name: 'Surface 2nd', hex: '#F9F9F9', token: 'surfaceSecondary', usage: 'พื้นรองในการ์ด' },
        { name: 'Surface Dark', hex: '#1C1C1E', token: 'surfaceDark', usage: 'การ์ดธีมมืด' },
        { name: 'Surface 2nd Dark', hex: '#2C2C2E', token: 'surfaceSecondaryDark', usage: 'พื้นรองธีมมืด' },
        { name: 'Background Dark', hex: '#000000', token: 'backgroundDark', usage: 'พื้นจอธีมมืด' },
      ],
    },
    {
      name: 'Text & Border',
      on: '#FFFFFF',
      swatches: [
        { name: 'Text Primary', hex: '#1A1A1A', token: 'textPrimary', usage: 'เนื้อหาหลัก' },
        { name: 'Text Secondary', hex: '#3E453F', token: 'textSecondary', usage: 'คำอธิบาย' },
        { name: 'Text Tertiary', hex: '#6D756E', token: 'textTertiary', usage: 'ข้อความจาง' },
        { name: 'Secondary Label', hex: '#3C3C43', token: 'secondaryLabel', usage: 'ป้าย iOS ที่ 60% opacity' },
        { name: 'Border', hex: '#DEDEE0', token: 'border', usage: 'เส้นกรอบ' },
        { name: 'Border Default', hex: '#E5E5E5', token: 'borderDefault', usage: 'เส้นคั่นการ์ด' },
      ],
    },
    {
      name: 'Metric & Semantic',
      on: '#FFFFFF',
      swatches: [
        { name: 'Health', hex: '#FF2D55', token: 'health', usage: 'หัวใจ · ความดัน' },
        { name: 'Activity', hex: '#FF9500', token: 'activity', usage: 'พลังงาน · กิจกรรม' },
        { name: 'Mindfulness', hex: '#5AC8FA', token: 'mindfulness', usage: 'จิตใจ · อุณหภูมิ' },
        { name: 'Nutrition', hex: '#34C759', token: 'nutrition', usage: 'โภชนาการ' },
        { name: 'Sleep', hex: '#AF52DE', token: 'sleep', usage: 'การนอน' },
        { name: 'Success 600', hex: '#4CA30D', token: 'success600', usage: 'ทำรายการสำเร็จ' },
      ],
    },
  ],
}

// Grid & layout — MyAtlas documents no 8px ladder anywhere in lib/core/theme,
// so this block prints only what the source defines: the responsive rules in
// lib/core/responsive/responsive.dart (baseWidth 390, pagePadding 16/20/24,
// vertical 12, breakpoints 375/768, columns 2/2/3, scale clamp 0.85–1.2) plus
// the radius/size defaults read off the widgets themselves.
export const myatlasGrid = {
  tone: '#1D8B6B',
  note: 'ระบบนี้ไม่ได้ประกาศบันไดระยะ 8px ไว้ในซอร์ส — ที่มีจริงคือกติกา responsive ชุดเดียว: ออกแบบที่ 390 ขอบจอ 16/20/24 ตามขนาดจอ และคอมโพเนนต์สเกลตามกว้างจอในกรอบ 0.85–1.2 เท่า',
  container: { screen: 390, content: 358, margin: 16 },
  // Real EdgeInsets defaults read off the source, in place of a spacing ladder.
  spacing: [
    { token: 'pagePadding/vertical', value: 12 },
    { token: 'glassCard/padding', value: 16 },
    { token: 'metricCard/padding', value: 16 },
  ],
  margins: [
    { value: 16, use: 'จอ compact ≤ 375 — ขอบจอมาตรฐานของมือถือ' },
    { value: 20, use: 'จอ regular ≤ 768 — เผื่อระยะบนจอกว้าง' },
    { value: 24, use: 'จอ large > 768 — แท็บเล็ตแนวนอน' },
  ],
  radius: [
    { name: 'card (GlassCard)', value: 22 },
    { name: 'button (LiquidGlassButton)', value: 999 },
  ],
  sizes: [{ name: 'LiquidGlassButton', value: 40 }],
  breakpoint: 768,
  layouts: [
    { name: 'Compact', range: '≤ 375pt', note: 'กริด 2 คอลัมน์ ขอบ 16 — ค่าตั้งต้นของทุกจอ' },
    { name: 'Regular', range: '≤ 768pt', note: 'ยังคง 2 คอลัมน์ ขอบขยายเป็น 20' },
    { name: 'Large', range: '> 768pt', note: 'กริดเพิ่มเป็น 3 คอลัมน์ ขอบ 24 และคอมโพเนนต์สเกลจากฐาน 390 ในกรอบ 0.85–1.2 เท่า' },
  ],
}

// The component library, read file-by-file off myatlas_app/lib — names are the
// real classes; `kind` picks the closest live preview FeedSheet renders.
export const myatlasComponent = {
  kit: 'myatlas',
  count: 7,
  tone: '#1D8B6B',
  platform: 'Flutter',
  source: 'อ่านจากไฟล์วิดเจ็ตจริงใน lib/ ทีละไฟล์',
  note: 'ทุกจอประกอบจากชุดเดียวกัน — ปุ่มกระจกเหลวสไตล์ iOS 26 นำทางลัด การ์ดกระจกเบลอถือเนื้อหา แถบแท็บห้าช่องคุมการเดินทาง และการ์ดสมาชิกครอบครัวรายงานสัญญาณชีพแบบเรียลไทม์',
  items: [
    // lib/core/widgets/liquid_glass_button.dart
    { name: 'LiquidGlassButton', kind: 'button', role: 'Action', use: 'ปุ่มไอคอนวงกลมกระจกเหลวสไตล์ iOS 26 — เบลอฉากหลัง เพิ่มความอิ่มสี ทับด้วยไฮไลต์มุมบนซ้ายและขอบกระจกไล่เฉด ขนาดตั้งต้น 40' },
    // lib/features/health/widgets/glass_card.dart
    { name: 'GlassCard', kind: 'card', role: 'Surface', use: 'การ์ดกระจกเบลอ มุมโค้ง 22 พื้นขาวโปร่ง 75% (ธีมมืด 65%) พร้อมเส้นขอบบาง — เป็นพื้นรองของการ์ดสุขภาพแทบทุกใบ' },
    // lib/features/health/widgets/metric_card.dart (+ summary_tile.dart)
    { name: 'MetricCard', kind: 'tile', role: 'Data', use: 'ไทล์ตัวชี้วัด — ไอคอนสีประจำเมตริก ป้ายชื่อ ตัวเลขใหญ่กับหน่วย และกราฟจิ๋วท้ายการ์ด แตะแล้วเข้าหน้ารายละเอียด' },
    // lib/features/health/widgets/activity_ring.dart
    { name: 'ActivityRing', kind: 'steps', role: 'Feedback', use: 'วงแหวนความคืบหน้าวาดด้วย CustomPainter — เส้นหนา 10 ขนาด 72 รับกราเดียนต์สีได้ ใช้ซ้อนสามวงบอกเคลื่อนไหว ออกกำลัง และยืน' },
    // lib/features/health/widgets/custom_tab_bar.dart (+ features/shell/main_shell.dart)
    { name: 'CustomTabBar', kind: 'tabbar', role: 'Navigation', use: 'แถบแท็บกระจกเบลอห้าช่อง — หน้าหลัก สุขภาพ ทานยา ครอบครัว ฉัน แท็บที่เลือกลงสีเขียวแบรนด์ #1D8B6B พร้อม haptic ตอนสลับ' },
    // lib/features/family/mini_call_overlay.dart
    { name: 'MiniCallOverlay', kind: 'call', role: 'Overlay', use: 'ย่อสายที่กำลังคุยเป็นการ์ดลอยติดขอบบน เห็นได้ทุกหน้า แตะแล้วกลับเข้าจอสายเดิมพร้อมเวลา ไมค์ และสถานะพักที่ค้างไว้' },
    // lib/features/family/care_giver_screen.dart · FamilyMemberCard + _StatusBadge
    { name: 'FamilyMemberCard Badge', kind: 'badge', role: 'Status', use: 'ป้ายสถานะบนการ์ดสมาชิก — "ปลอดภัยดี" พื้นอ่อน และ "พบการล้ม" พื้นแดงพร้อมเรืองขอบทั้งการ์ด อ่านออกในแวบเดียว' },
  ],
}

// Straight screenshots of the built Flutter app at 390×844, written out at 2x —
// the four captures live in Portfolio/public/ma-hifi-*-390.webp. Notes read off
// each capture itself.
export const myatlasHifi = {
  container: { screen: 390, height: 844 },
  note: 'Hi-fi คือหน้าจอจริงที่ลงสี ฟอนต์ และคอมโพเนนต์ครบตามดีไซน์ซิสเต็ม พร้อมส่งต่อให้ทีมพัฒนา — ชุดนี้จับจากแอป Flutter ที่รันจริง หน้าเดียวกับ Low-fi ทุกหน้า',
  screens: [
    { name: 'Home', note: 'ทักทาย คิวโรงพยาบาล A005 แคลลอรี่ และก้าวเดินในหน้าเดียว', src: `${import.meta.env.BASE_URL}ma-hifi-home-390.webp` },
    { name: 'Health', note: 'สรุปสุขภาพ — พลังงานที่ใช้ วงแหวนกิจกรรม และสัญญาณชีพ', src: `${import.meta.env.BASE_URL}ma-hifi-health-390.webp` },
    { name: 'Medicine', note: 'รายการทานยาแยกช่วงเวลา เช้า กลางวัน เย็น ก่อนนอน', src: `${import.meta.env.BASE_URL}ma-hifi-med-390.webp` },
    { name: 'Family', note: 'การ์ดสมาชิกครอบครัวพร้อมสถานะและสัญญาณชีพล่าสุด', src: `${import.meta.env.BASE_URL}ma-hifi-family-390.webp` },
  ],
}

// Four example screens blocked out to the same geometry as the captures:
// 390 screen, 358 content in a 16 margin. Every h/mt below is a band measured
// off the matching ma-hifi capture (pixel row ÷ 2), every string is read off
// the capture itself.
export const myatlasWireframe = {
  container: { screen: 390, content: 358, margin: 16 },
  note: 'Low-fi Wireframe คือโครงหน้าจอขาวดำ วางบล็อกและลำดับเนื้อหาให้ครบก่อนตัดสินใจเรื่องสีและงานภาพ ใช้ตกลงโครงสร้างกับทีมให้จบก่อนลงรายละเอียด',
  screens: [
    {
      name: 'Home',
      note: 'ทักทาย คิวโรงพยาบาล A005 แคลลอรี่ และก้าวเดินในหน้าเดียว',
      // Bands off ma-hifi-home-390.webp (390-space): greeting 28–110 ·
      // queue card 128–330 · calorie/watch row 353–457 · family 475–575 ·
      // steps/activity tiles 590–755 · tab bar 755–825.
      blocks: [
        { kind: 'entry', h: 84, mt: 12, title: 'คุณณัฐพงษ์', lines: ['GOOD MORNING'] },
        {
          kind: 'hero',
          h: 200,
          mt: 16,
          date: 'แจ้งเตือนคิว · ถึงคิวแล้ว',
          title: 'จุดซักประวัติ · อายุรกรรม 022 ห้องจ่ายยา OPD',
          sub: 'โรงพยาบาลสมเด็จพระยุพราชบ้านดุง · คิว A 005',
          button: 'ดูรายละเอียดคิว',
        },
        {
          kind: 'duo',
          h: 104,
          mt: 24,
          items: [
            { title: 'แคลลอรี่', sub: '1,500 kcal', big: '800', foot: '67 kg · 175 cm · 20.1 BMI' },
            { title: 'Smart Watch BM 2', sub: 'เชื่อมต่ออยู่', big: '30 %', foot: 'แบตเตอรี่' },
          ],
        },
        { kind: 'entry', h: 96, mt: 8, title: 'ครอบครัวของฉัน', lines: ['จำนวน 4 คน'] },
        {
          kind: 'duo',
          h: 160,
          mt: 24,
          items: [
            { title: 'ก้าวเดิน', big: '7,927', foot: 'ก้าว' },
            { title: 'กิจกรรม', sub: 'เคลื่อนไหว 420 แคล', big: '22 นาที', foot: 'ออกกำลัง' },
          ],
        },
        { kind: 'tabbar', h: 56, mt: 'auto' },
      ],
    },
    {
      name: 'Health',
      note: 'สรุปสุขภาพ — พลังงานที่ใช้ วงแหวนกิจกรรม และสัญญาณชีพ',
      // Bands off ma-hifi-health-390.webp: title 15–45 · energy card 68–255 ·
      // steps/activity 270–498 · section row ~535 · vitals 563–760 · tab bar 755+.
      blocks: [
        { kind: 'heading', h: 32, mt: 12, label: 'สรุปสุขภาพ' },
        {
          kind: 'chart4',
          h: 184,
          mt: 20,
          title: 'พลังงานที่ใช้',
          range: 'Active Kilocalories',
          big: '398 kcl',
          // Bar fractions measured off the capture's week chart.
          bars: [
            { v: '', x: 'อา', f: 0.55 },
            { v: '', x: 'จ', f: 0.5 },
            { v: '', x: 'อ', f: 0.45 },
            { v: '', x: 'พ', f: 0.55 },
            { v: '', x: 'พฤ', f: 0.6 },
            { v: '', x: 'ศ', f: 0.95 },
            { v: '', x: 'ส', f: 0.9 },
          ],
        },
        {
          kind: 'duo',
          h: 224,
          mt: 16,
          items: [
            { title: 'ก้าวเดิน', big: '7,927', foot: 'ก้าว' },
            { title: 'กิจกรรม', sub: 'เคลื่อนไหว 420 แคล', big: '22 นาที', foot: 'ออกกำลัง · ยืน 0.7 ชั่วโมง' },
          ],
        },
        { kind: 'actionrow', h: 40, mt: 32, label: 'สัญญาณชีพ', button: 'จัดเรียง' },
        {
          kind: 'duo',
          h: 196,
          mt: 16,
          items: [
            { title: 'ความดันโลหิต', big: '122/83', foot: 'mmHg' },
            { title: 'ดัชนีมวลกาย', big: '19.5', foot: 'น้ำหนัก 60 kg · ส่วนสูง 175 cm' },
          ],
        },
        { kind: 'tabbar', h: 56, mt: 'auto' },
      ],
    },
    {
      name: 'Medicine',
      note: 'รายการทานยาแยกช่วงเวลา เช้า กลางวัน เย็น ก่อนนอน',
      // Bands off ma-hifi-med-390.webp: title row 30–62 · date banner 88–238
      // (meal counts folded into the banner's sub line) · time slots 253–365 ·
      // ก่อนอาหาร 378–528 · หลังอาหาร 545–760, the third card runs behind the
      // tab bar in the capture.
      blocks: [
        { kind: 'heading', h: 36, mt: 12, label: 'รายการทานยา' },
        { kind: 'segs', h: 32, mt: 8, items: ['รายการยา', 'ใบสั่งยา'], active: 0 },
        { kind: 'photo', h: 88, mt: 16, name: '21 เมษายน 2569', sub: 'วันที่ปัจจุบัน · เช้า 3 · กลางวัน 3 · เย็น 2 · ก่อนนอน 2 รายการ' },
        { kind: 'people', h: 104, mt: 16, items: ['09:00 เช้า', '12:00 กลางวัน', '18:00 เย็น', '21:00 ก่อนนอน'] },
        { kind: 'actionrow', h: 36, mt: 16, label: 'ก่อนอาหาร · ยาทั้งหมด 1 รายการ', button: 'ทานทั้งหมด' },
        { kind: 'entry', h: 88, mt: 8, title: 'Omeprazole 20 mg', lines: ['รับประทาน ครั้งละ 1 เม็ด ก่อนอาหาร 30 นาที'] },
        { kind: 'actionrow', h: 36, mt: 16, label: 'หลังอาหาร · ยาทั้งหมด 2 รายการ', button: 'ทานทั้งหมด' },
        { kind: 'entry', h: 88, mt: 8, title: 'Vitamin B Complex', lines: ['รับประทาน ครั้งละ 1 เม็ด หลังอาหารเช้า'] },
        { kind: 'entry', h: 88, mt: 8, title: 'Paracetamol 500 mg', lines: ['รับประทาน ครั้งละ 1 เม็ด ทุก 4-6 ชม.'] },
        { kind: 'tabbar', h: 56, mt: 'auto' },
      ],
    },
    {
      name: 'Family',
      note: 'การ์ดสมาชิกครอบครัวพร้อมสถานะและสัญญาณชีพล่าสุด',
      // Bands off ma-hifi-family-390.webp: title 15–45 · tabs 72–108 ·
      // cards 140–330 / 345–528 / 543–725; the fourth card sits behind the
      // tab bar and only its edge shows, so it is not blocked here.
      blocks: [
        { kind: 'heading', h: 36, mt: 12, label: 'ครอบครัว' },
        { kind: 'segs', h: 36, mt: 16, items: ['ครอบครัว 5', 'พยาบาล 4'], active: 0 },
        {
          kind: 'entry', h: 184, mt: 24, title: 'ปรีชา วงศ์สุวรรณ', badge: 'พบการล้ม',
          lines: ['อายุ 70 ปี · หมู่เลือด B · แบต 15%', 'หัวใจ 98 bpm · ออกซิเจน 91% · น้ำตาล 184 mg/dl'],
        },
        {
          kind: 'entry', h: 184, mt: 16, title: 'สมศรี วงศ์สุวรรณ', badge: 'ปลอดภัยดี',
          lines: ['อายุ 60 ปี · หมู่เลือด A · แบต 68%', 'หัวใจ 72 bpm · ออกซิเจน 95% · น้ำตาล 120 mg/dl'],
        },
        {
          kind: 'entry', h: 184, mt: 16, title: 'ใจดี วงศ์สุวรรณ', badge: 'ปลอดภัยดี',
          lines: ['อายุ 35 ปี · หมู่เลือด AB · แบต 82%', 'หัวใจ 72 bpm · ออกซิเจน 95% · น้ำตาล 120 mg/dl'],
        },
        { kind: 'tabbar', h: 56, mt: 'auto' },
      ],
    },
  ],
}
