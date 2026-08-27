// -----------------------------------------------------------------------------
// idBadge.js
// Draws the face of the pass that hangs on the home screen — an employee badge
// in this site's own system: white card, one ink, hairlines, uppercase mono
// captions, no colour. Every field comes from site.js, so the badge cannot drift
// from the name and role printed everywhere else on the page.
//
// Returned as a data URL because that is what the card's texture loader takes.
// -----------------------------------------------------------------------------

// Drawn DARKER than the same tones would be set in HTML. This card is a lit
// surface in a 3D scene: the ambient term and the environment both add light to
// whatever is painted here, so the site's own #a2a2a1 caption grey came out as a
// ghost on the pass. These are the values that land on the site's tones once the
// card is lit — checked against the render, not against the page.
const INK = '#111110'
const RULE = '#b9b5ab'
const MUTED = '#5f5c54'
const PAPER = '#ffffff'
const WELL = '#eceae4'

// Portrait, matching the card's own face. Drawn at 2× the size it is sampled at
// so the type survives the card being brought close on a zoom.
const W = 900
const H = 1300

// One caption style for every caption on the badge — the issuer line, the role,
// and the two field names. They are the same KIND of thing, so they are set the
// same way rather than each being sized by feel.
const CAPTION = 40
const VALUE = 48
// Cap height of the caption face at CAPTION size. The footer gap has to be
// measured to the TOP of the letters, not to their baseline: at the same 32 to
// the baseline the visible air came out at 19 and the rule read as crowding the
// contact block.
const CAPTION_CAP = 29
// Cap height of the value face at VALUE size — the mark that leads a value is
// sized to this, so it stands the same height as the characters beside it.
const VALUE_CAP = 34
// 16x16 as it is SEEN. The badge is painted at 900px and the card renders about
// 228px wide, so a size given for the screen has to be divided by that 0.253 to
// be drawn — asked for at 16 and drawn at 16, the mark would have arrived at 4px.
const SHOWN_SCALE = 228 / 900
const MARK_SIZE = Math.round(16 / SHOWN_SCALE)
// One row per field, spaced off the mark rather than off the type — the mark is
// the tallest thing in a row.
const ROW_STEP = Math.round(MARK_SIZE * 1.45)

// The tool marks on the front. Small — these are a footnote about what the work
// was made with, not a headline, and blown up to fill the card they outweighed the
// name above them. 16px as it is SEEN, through the same 0.253 the rest of this file
// works in, which is the size the contact marks are set at.
const TOOL_SIZE = Math.round(16 / SHOWN_SCALE)
const TOOL_GAP = Math.round(TOOL_SIZE * 0.38)

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'
const SANS = 'Anuphan, Inter, system-ui, -apple-system, sans-serif'

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// The largest size at which a string still fits the width given. Used for the
// name: it has to hold ONE line, and a fixed size either overflows the card or
// is set small enough for the longest name anyone might have.
function fitFont(ctx, text, maxWidth, start, min, weight = 500, family = SANS) {
  let size = start
  while (size > min) {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  return size
}

// A supplied logo, drawn square at MARK_SIZE. These are the brands' own files —
// the marks used to be redrawn here with canvas paths, which is fine for a
// monochrome glyph and wrong for a logo that has a specific gradient in it.
function drawMark(ctx, img, x, top, size) {
  if (img) ctx.drawImage(img, x, top, size, size)
  return size
}

// Where an image's ink actually starts, as a fraction of its height. A portrait
// PNG carries transparent air above the head, and "align this with the top of the
// head" means the head, not the file.
function inkTopFraction(img) {
  const c = document.createElement('canvas')
  const h = Math.min(img.height, 400)
  const w = Math.max(1, Math.round((img.width / img.height) * h))
  c.width = w
  c.height = h
  const x = c.getContext('2d')
  if (!x) return 0
  x.drawImage(img, 0, 0, w, h)
  const d = x.getImageData(0, 0, w, h).data
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const i = (row * w + col) * 4
      // Opaque, and not the paper it is drawn on.
      if (d[i + 3] > 40 && !(d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)) return row / h
    }
  }
  return 0
}

// The mirror of the above: where an image's ink ENDS, as a fraction of its
// height. The chin, not the bottom of the file.
function inkBottomFraction(img) {
  const c = document.createElement('canvas')
  const h = Math.min(img.height, 400)
  const w = Math.max(1, Math.round((img.width / img.height) * h))
  c.width = w
  c.height = h
  const x = c.getContext('2d')
  if (!x) return 1
  x.drawImage(img, 0, 0, w, h)
  const d = x.getImageData(0, 0, w, h).data
  for (let row = h - 1; row >= 0; row--) {
    for (let col = 0; col < w; col++) {
      const i = (row * w + col) * 4
      if (d[i + 3] > 40 && !(d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)) return (row + 1) / h
    }
  }
  return 1
}

// The "opens elsewhere" arrow, drawn rather than set as a character: ↗ is not in
// every mono face and a missing glyph on a texture is a tofu box baked into the
// card. Stroked to the same weight the type reads at, and sized to the cap height
// of the value it follows so it sits on the line rather than above or below it.
function drawArrow(ctx, x, top, size, color) {
  const pad = size * 0.16
  const x0 = x + pad
  const y1 = top + pad
  const x1 = x + size - pad
  const y0 = top + size - pad
  const head = size * 0.44
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(2, size * 0.12)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1 - head, y1)
  ctx.lineTo(x1, y1)
  ctx.lineTo(x1, y1 + head)
  ctx.stroke()
  ctx.restore()
}

// The nickname is the quieter of the two names, on all three axes a reader
// notices: smaller, lighter and grey against the name's black. It was set by its
// OWN fit before, which let a short nickname come out at 48 beside a long name
// fitted down to 40 — the second line ended up bigger than the first, which reads
// as the nickname being the important one.
// Quieter, but still a line someone has to be able to READ — this is the name to
// call the person by, and a portfolio that prints it too faint to make out has
// printed nothing. At 0.8 and weight 400 it came out at 32 drawn (8px as seen),
// under this file's own floor of about 42 drawn / 11 shown for readable type.
//
// So the distance is carried by WEIGHT and COLOUR, which cost no size: 500 against
// the name's 700, grey against black. The size steps down only slightly, because
// the name itself is only 40 — it is long, and fitted to the column — and there is
// no room under it for a real size step that stays legible.
const NICK_WEIGHT = 500
const NICK_RATIO = 0.95
// Never smaller than this, whatever the name does.
const NICK_MIN = 38

function nickSizeFor(ctx, nickname, colW, nameSize) {
  const wanted = Math.max(NICK_MIN, Math.round(nameSize * NICK_RATIO))
  // Still fitted, so a long nickname cannot run off the card — it just cannot
  // grow past its step below the name.
  return fitFont(ctx, nickname || ' ', colW, wanted, NICK_MIN, NICK_WEIGHT)
}

// A phone, drawn rather than loaded. The other rows carry a company's own logo
// file, which is the only honest way to show a brand; a telephone number belongs
// to no brand, so its mark is a glyph in this card's own ink instead of somebody
// else's icon set.
function drawPhoneMark(ctx, x, top, size) {
  const w = size * 0.62
  const h = size * 0.92
  const bx = x + (size - w) / 2
  const by = top + (size - h) / 2
  ctx.save()
  ctx.strokeStyle = INK
  ctx.fillStyle = INK
  ctx.lineWidth = Math.max(2, size * 0.09)
  ctx.lineJoin = 'round'
  roundRect(ctx, bx, by, w, h, size * 0.16)
  ctx.stroke()
  // The earpiece slot and the home dot — two marks that turn a rounded rectangle
  // into a telephone at a glance.
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(bx + w * 0.34, by + h * 0.11)
  ctx.lineTo(bx + w * 0.66, by + h * 0.11)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(bx + w / 2, by + h * 0.86, size * 0.055, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function rule(ctx, x, y, w) {
  ctx.fillStyle = RULE
  ctx.fillRect(x, y, w, 2)
}

function label(ctx, text, x, y, size = 22, align = 'left') {
  const tracking = size * 0.16
  ctx.font = `500 ${size}px ${MONO}`
  ctx.fillStyle = MUTED
  ctx.letterSpacing = `${tracking}px`
  // Tracking is added AFTER every character including the last, so a string
  // measured with it is one gap wider than its ink. Right-aligned that gap sits
  // between the last letter and the margin, and the line reads as not reaching
  // the edge the rest of the card is aligned to — so it is given back.
  ctx.textAlign = align
  ctx.fillText(text.toUpperCase(), align === 'right' ? x + tracking : x, y)
  ctx.textAlign = 'left'
  ctx.letterSpacing = '0px'
}

// The front, laid out to the approved design: the role set once, very large, and
// turned on its side down the left edge; everything else — portrait, name,
// nickname, tools — in one column to its right. The issuer line and the year are
// gone; the vertical role is the card's title now, and a second title above the
// name would only compete with it.
export function drawBadge(photo, { name, role, nickname, tools = [] }) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return { url: null, links: [] }

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // Every gap on this card comes off the app's own spacing ladder — base 8, with
  // 4 as the half step — asked for in the size it is SEEN at and converted here.
  // The card renders about 228px wide from a 900px drawing, so a 24 asked for on
  // screen has to be drawn at 95, and a number typed straight in here means
  // nothing to anyone reading the design system.
  const sp = n => Math.round(n / SHOWN_SCALE)

  // 24, the widest margin the system offers, described there as the one for "a
  // page with little on it — let it breathe". That is this card.
  const M = sp(24)
  // Between the turned role and the column beside it: 16, one step tighter than
  // the outer margin, so the two blocks read as one pair inside the card rather
  // than as two things drifting apart in the middle.
  const GUTTER = sp(16)
  // The right margin is drawn WIDER than the left. This face is composited into
  // the card's texture atlas with a `cover` fit, and that crop does not land
  // symmetrically on the mesh's own face: measured on the render, ink drawn 61 in
  // from the left arrived 23 device px from the card's edge while ink drawn 64 in
  // from the right arrived at 14. The extra is what makes the two edges read
  // equal on the card, which is the only place this drawing is ever seen.
  const CROP_BIAS = 18
  const RIGHT = W - M - CROP_BIAS

  const PHOTO_TOP = sp(32)
  // The column's vertical rhythm, all off the ladder and all measured from INK to
  // INK rather than from baselines — a baseline is not what the eye spaces things
  // by. 16 under the portrait and 12 between the two names bind the portrait and
  // the two names into ONE block; the 48 before the rule is the only real
  // separation on this face, so it is the gap that carries the card's spare
  // height. The top margin went to 32 with it, to answer the bottom margin the
  // shorter column leaves.
  const GAP_PHOTO = sp(16)
  const GAP_NAME = sp(12)
  const GAP_RULE = sp(48)
  const GAP_TOOLS = sp(16)

  const nameText = name.toUpperCase()

  // The layout is circular by nature — the role's size comes from the column's
  // height, the column's left edge comes from the role's width, and the column's
  // height comes from how tall the portrait can be in it — so it is solved rather
  // than declared: run the geometry twice, feeding the first pass's answer back
  // in. The second pass moves by a pixel or two; a third would not move at all.
  const solve = toolsBottom => {
    const span = toolsBottom - PHOTO_TOP
    const PROBE = 200
    ctx.font = `700 ${PROBE}px ${SANS}`
    const probe = ctx.measureText(role)
    const roleSize = Math.round((PROBE * span) / (probe.actualBoundingBoxLeft + probe.actualBoundingBoxRight))
    ctx.font = `700 ${roleSize}px ${SANS}`
    const rm = ctx.measureText(role)

    const COL = Math.round(M + rm.actualBoundingBoxAscent + rm.actualBoundingBoxDescent + GUTTER)
    const colW = RIGHT - COL

    // The portrait is the elastic part: it is sized by the column's width, and
    // everything under it is then stacked off where its ink ends.
    const discR = Math.round(colW * 0.52)
    const target = discR * 2.35
    const scale = photo ? Math.min(target / photo.width, target / photo.height) : 1
    const photoH = photo ? photo.height * scale : target
    const photoW = photo ? photo.width * scale : target
    // Placed by the HEAD, not by the file: a portrait PNG carries transparent air
    // above the hair, and hanging the file at PHOTO_TOP put the head 35px lower
    // than the role text it is supposed to line up with.
    const inkTop = photo ? inkTopFraction(photo) : 0
    const inkBottom = photo ? inkBottomFraction(photo) : 1
    const photoY = PHOTO_TOP - inkTop * photoH
    const discY = photoY + photoH / 2 + discR * 0.12
    // The block's bottom is whichever of the two ends lower — the chin, or the
    // disc behind it. Spaced off the chin alone, the disc came out 20px closer to
    // the name than the ladder asked for, because the eye reads the disc as the
    // edge of the portrait and the chin is not the thing it measures from.
    const photoInkBottom = Math.max(photoY + inkBottom * photoH, discY + discR)

    const nameSize = fitFont(ctx, nameText, colW, 62, 34, 700)
    ctx.font = `700 ${nameSize}px ${SANS}`
    const nm = ctx.measureText(nameText)
    ctx.font = `${NICK_WEIGHT} ${nickSizeFor(ctx, nickname, colW, nameSize)}px ${SANS}`
    const km = ctx.measureText(nickname || ' ')

    const nameBase = photoInkBottom + GAP_PHOTO + nm.actualBoundingBoxAscent
    const nickBase = nickname ? nameBase + GAP_NAME + km.actualBoundingBoxAscent : nameBase
    const ruleY = Math.round(nickBase + (nickname ? km.actualBoundingBoxDescent : 0) + GAP_RULE)
    const toolsTop = ruleY + GAP_TOOLS

    return { roleSize, rm, COL, colW, discR, photoY, photoW, photoH, nameSize, nameBase, nickBase, ruleY, toolsTop,
             toolsBottom: toolsTop + TOOL_SIZE }
  }

  let L = solve(H - sp(30))
  L = solve(L.toolsBottom)

  // --- the portrait ---------------------------------------------------------
  // A disc behind the head, not a well around it: the well was a box the photo sat
  // in, and this design lets the head break its own background, which is what
  // makes it read as a person rather than a passport photo.
  ctx.fillStyle = WELL
  ctx.beginPath()
  ctx.arc(L.COL + L.colW / 2, Math.round(L.photoY + L.photoH / 2 + L.discR * 0.12), L.discR, 0, Math.PI * 2)
  ctx.fill()
  if (photo) ctx.drawImage(photo, L.COL + L.colW / 2 - L.photoW / 2, L.photoY, L.photoW, L.photoH)

  // --- the role, turned -----------------------------------------------------
  // Fitted to the column's own span rather than to the card: the ink runs from the
  // top of the head down to the bottom of the tool marks, which is the block it
  // stands beside. Rotated -90°, so it reads bottom-to-top with the letters' tops
  // facing left — which puts the baseline on the RIGHT of the block.
  ctx.save()
  // Rotated, the advance runs UP the card, so the string's own left bearing sits
  // at the bottom end; the baseline is placed off that rather than off the card's
  // margin. Across the text, the ascent is what stands left of the baseline, so
  // the baseline goes a full ascent in from the margin.
  ctx.translate(M + L.rm.actualBoundingBoxAscent, L.toolsBottom - L.rm.actualBoundingBoxLeft)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = INK
  ctx.font = `700 ${L.roleSize}px ${SANS}`
  ctx.fillText(role, 0, 0)
  ctx.restore()

  // --- the person -----------------------------------------------------------
  // Name in caps, the nickname under it in grey and pushed to the right edge: two
  // different facts, told apart by weight, colour and side rather than by a label.
  ctx.fillStyle = INK
  ctx.font = `700 ${L.nameSize}px ${SANS}`
  // Justified to the column, not merely fitted into it. `fitFont` steps the size
  // down by 2 until the string fits, so it stops SHORT of the right edge by
  // whatever the last step overshot — measured, the final T landed inside the
  // nickname's own right edge, and two lines that both close on the same edge
  // read as misaligned when one of them misses it by a few px. The leftover is
  // spread between the letters instead. Capped, so a name far narrower than the
  // column is left alone rather than pulled apart.
  const nameW = ctx.measureText(nameText).width
  const slack = L.colW - nameW
  const track = nameText.length > 1 ? slack / (nameText.length - 1) : 0
  const justify = track > 0 && track <= L.nameSize * 0.05
  if (justify) ctx.letterSpacing = `${track}px`
  ctx.fillText(nameText, L.COL, L.nameBase)
  if (justify) ctx.letterSpacing = '0px'

  if (nickname) {
    ctx.fillStyle = MUTED
    ctx.font = `${NICK_WEIGHT} ${nickSizeFor(ctx, nickname, L.colW, L.nameSize)}px ${SANS}`
    ctx.textAlign = 'right'
    ctx.fillText(nickname, RIGHT, L.nickBase)
    ctx.textAlign = 'left'
  }

  // --- what the work is made with -------------------------------------------
  // Marks, not a list — the row is read in one look, which is the only way a row
  // of 16px logos is read at all. Right-aligned under its own rule so the block
  // closes on the same edge the nickname does.
  rule(ctx, L.COL, L.ruleY, L.colW)

  const rowW = tools.length * TOOL_SIZE + (tools.length - 1) * TOOL_GAP
  tools.forEach((img, i) =>
    drawMark(ctx, img, RIGHT - rowW + (TOOL_SIZE + TOOL_GAP) * i, L.toolsTop, TOOL_SIZE)
  )

  // The width the turned role occupies, so the back can set its own word to the
  // same block and both faces put their column in the same place.
  return {
    url: canvas.toDataURL('image/png'),
    links: [],
    blockW: L.rm.actualBoundingBoxAscent + L.rm.actualBoundingBoxDescent,
  }
}

// The back. A pass says who on the front and how to reach them on the back, and
// keeping both on one face was what left no room for either. Drawn by the same
// hand as the front — same margins, same caption style, same rule — so the two
// faces read as one card.

export function drawBack({ title = 'Contact', line = null }) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return { url: null, links: [] }

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // Same ladder, same margins and the same crop compensation as the front — the
  // two faces are one card, and a back drawn to its own margins reads as a
  // different object the moment it turns.
  const sp = n => Math.round(n / SHOWN_SCALE)
  const M = sp(24)
  const CROP_BIAS = 18
  const innerW = W - M - CROP_BIAS - M

  // Nothing on this face is a control any more — the handles that carried the
  // links are off it — so it hands back an empty list and every tap on it turns
  // the card.
  const links = []

  // The invitation the site already leads its contact section with, and under it
  // the word for what the face is. No caption above the sentence: CONTACT closes
  // the block instead of labelling it from both ends.
  const closeBase = H - M
  const headTop = M + sp(16)

  if (line) {
    const words = line.split(' ')
    const wrap = size => {
      ctx.font = `700 ${size}px ${SANS}`
      const rows = []
      let row = ''
      words.forEach(w => {
        const next = row ? `${row} ${w}` : w
        if (ctx.measureText(next).width > innerW && row) {
          rows.push(row)
          row = w
        } else row = next
      })
      if (row) rows.push(row)
      return rows
    }
    // Set as large as BOTH constraints allow: wide enough to reach the margins,
    // and short enough to stop above the closing line. Fitted on width alone it
    // wrapped to more lines than the face had room for and ran straight through
    // whatever was under it.
    const bandH = closeBase - CAPTION_CAP - sp(32) - headTop
    // Start from the size the WIDEST WORD can hold, not from a chosen ceiling: the
    // wrapper can only break between words, so a word wider than the column runs
    // off the card however the lines are counted.
    //
    // Widest by MEASUREMENT, not by letter count. Picked by length, this sentence
    // offered "together." and "something" at nine characters each and the reduce
    // returned the first — which fitted at 688 while the other needed 793, and the
    // headline hung 91px past the card's edge.
    const widest = size => {
      ctx.font = `700 ${size}px ${SANS}`
      return Math.max(...words.map(w => ctx.measureText(w).width))
    }
    let size = 160
    while (size > 40 && widest(size) > innerW) size -= 2
    let rows = wrap(size)
    while (size > 40 && rows.length * size * 1.06 > bandH) {
      size -= 4
      rows = wrap(size)
    }
    ctx.fillStyle = INK
    ctx.font = `700 ${size}px ${SANS}`
    rows.forEach((r, i) => ctx.fillText(r, M, headTop + size + i * size * 1.06))
  }

  label(ctx, title, M, closeBase, CAPTION)

  return { url: canvas.toDataURL('image/png'), links }
}

const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

// Both faces in one call. They are made together because they are one object: a
// card with a front drawn from a loaded photo and a back drawn from files that
// had not arrived yet is a card with a blank side.
export function makeCard({ photoSrc, toolSrcs = [], front, back }) {
  return Promise.all([
    // Canvas takes the face that is loaded AT DRAW TIME and never redraws — so
    // without this the card was painted in the fallback while Anuphan was still
    // in flight, and stayed there.
    document.fonts?.ready ?? Promise.resolve(),
    loadImage(photoSrc),
    Promise.all(toolSrcs.map(loadImage)),
    Promise.all((back.fields ?? []).map((f) => loadImage(f.markSrc))),
  ]).then(([, photo, tools, marks]) => {
    const face = drawBadge(photo, { ...front, tools: tools.filter(Boolean) })
    return {
      front: face,
      back: drawBack({
        ...back,
        fields: (back.fields ?? []).map((f, i) => ({ ...f, mark: marks[i] })),
      }),
    }
  })
}
