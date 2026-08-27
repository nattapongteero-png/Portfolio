// -----------------------------------------------------------------------------
// PageHead.jsx
// The heading every page of this site wears: the page's name, centred, with an
// optional row of label/value fields under it. Shared because it is a form, not a
// decision to be made again per page — the contact page nearly grew its own.
// -----------------------------------------------------------------------------

export default function PageHead({ title, lead, fields = [], children }) {
  const rows = fields.filter(Boolean)
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="text-center">
        {/* The reference (hirotos.com/about, measured): the title LARGE at weight
            500 — never bolder — on a leading of 1.0, so the head is a mass of
            medium type rather than a bold word. */}
        <h2 className="text-[clamp(32px,4.5vw,64px)] font-medium leading-[1.0] tracking-tight text-[#21221f]">
          {title}
        </h2>
        {children}
      </div>

      {/* The standfirst, the reference's own shape (hirotos.com/about, measured):
          a hairline across the column, then ONE centred paragraph set narrower
          than the column it sits in. Every page states its case once, at the same
          place, before it breaks into fields. */}
      {lead && (
        <div className="mt-10 border-t border-[#e7e4dd] pt-9">
          <p className="mx-auto max-w-[560px] text-center text-[15px] font-normal leading-[1.65] text-[#757674]">
            {lead}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-3">
          {rows.map((f) => (
            <div key={f.label} className="border-t border-[#e7e4dd] pt-2">
              {/* Two axes at once, so a caption can never be read as its value:
                  the caption is light (400) at 42% ink, the value is medium (500)
                  at full ink. The reference separates them by colour alone at
                  12px Latin caps; Thai at this size needs the weight too. */}
              {/* Caption and value in the reference's two inks: caption 46%,
                  value full — the weight never changes between them. */}
              <div className="text-[12px] font-normal uppercase leading-none tracking-[0.045em] text-[#999998]">
                {f.label}
              </div>
              <div className="mt-2 text-[14px] font-normal leading-5 text-[#21221f]">{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
