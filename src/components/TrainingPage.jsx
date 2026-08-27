// -----------------------------------------------------------------------------
// TrainingPage.jsx
// การพัฒนาตนเอง as its own page, reached from the menu — section 2 of the
// appraisal form pulled out of the two project reports, because the training
// belongs to the person, not to either piece of work.
//
// The certificates ride React Bits' CardSwap: the three documents fanned into a
// stack that turns itself over, front card dropping away and sliding to the
// back. The column beside it prints the appraisal's three questions for
// whichever certificate is at the front — the stack reports each rotation, so
// the text keeps up with the card being looked at.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CardSwap, { Card } from './CardSwap'
import PageTitle from './PageTitle'
import { useReveal } from '../lib/reveal'
import { COURSES } from '../data/mockData'

export default function TrainingPage({ origin = null, onClose }) {
  // The same circle every page on this site arrives with, grown from the menu
  // row that asked for it.
  const { style: revealStyle } = useReveal('training', { start: true, origin })
  // Which certificate is at the front of the stack. CardSwap reports it on the
  // beat the front card starts its drop.
  const [front, setFront] = useState(0)
  const course = COURSES[front]

  // The stack's box has to be sized in JS: CardSwap takes pixel numbers, not
  // classes, and its own media queries only scale the container.
  const [isMd, setIsMd] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => setIsMd(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  // Wide enough that the certificate's text is legible, in the document's own
  // 1400×1082 aspect plus a caption strip under it.
  const cardW = isMd ? 520 : 340
  const cardH = Math.round((cardW * 1082) / 1400) + 74

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-[#fafafa]"
      style={revealStyle}
      role="dialog"
      aria-label="การพัฒนาตนเอง"
    >
      {/* No control of its own in the right corner: the feed's menu layer is
          lifted ABOVE this page while it is open, so the + here is literally the
          same button as everywhere else — same size, same rotate-to-close, same
          panel. A lookalike drawn here could match the picture but never the
          press. */}
      <div className="page-shell pointer-events-none absolute inset-x-0 top-0 z-20 w-full px-4 pt-[76px] md:pl-[120px] md:pr-12 md:pt-[25px]">
        {/* Pulled a further 72 left than PageTitle's own offset: that offset
            leaves room for the back disc in front of the title, and this page
            has no back disc — so the heading starts at 32, the same x the feed's
            section title starts at. */}
        <PageTitle className="sm:!text-4xl md:!text-5xl md:!ml-[calc(-88px-max(0px,(100vw-1600px)/2))]">
          Training
        </PageTitle>
      </div>

      <div className="page-shell mx-auto grid min-h-full w-full max-w-[1600px] grid-cols-1 items-center gap-x-12 gap-y-10 px-5 pb-16 pt-[150px] md:grid-cols-2 md:px-[120px] md:pt-[170px]">
        {/* The front certificate's answers — the three questions the appraisal
            form asks of every course, in the same visual language the report
            pages print them. Crossfaded per certificate, so the column reads as
            the same page updating rather than a new page arriving. */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={front}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mt-0"
            >
              <h2 className="text-[22px] font-medium leading-snug text-[#21221f] md:text-[26px]">
                {course.name}
              </h2>
              <div className="mt-2 text-[13px] font-normal leading-[1.6] text-[#757674]">
                {course.issuer} · จบหลักสูตร {course.date}
              </div>
              <dl className="mt-7 space-y-5">
                {[
                  ['วัตถุประสงค์การเรียนรู้', course.objective],
                  ['สิ่งที่ได้จากการอบรม', course.gained],
                  ['การนำไปใช้กับการทำงานจริง', course.applied],
                ].map(([label, value]) => (
                  <div key={label} className="border-t border-[#e7e4dd] pt-3">
                    <dt className="text-[12px] font-normal uppercase leading-none tracking-[0.045em] text-[#999998]">
                      {label}
                    </dt>
                    <dd className="mt-2.5 max-w-[560px] text-[14px] font-normal leading-[1.6] text-[#21221f]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {/* No resting underline — the arrow (the same leave-mark the
                  contact pills wear) is what marks this as a link, and the
                  underline draws itself in from the left on hover. */}
              <a
                href={course.verify}
                target="_blank"
                rel="noreferrer"
                className="slide-link mt-6 inline-flex items-center gap-1.5 text-[13px] font-normal text-[#757674] transition-colors hover:text-[#21221f]"
              >
                ตรวจสอบใบรับรองที่ Coursera
                <svg className="size-[14px]" viewBox="0 0 24 24" aria-hidden focusable="false">
                  <path
                    d="M8 16 L16 8 M9.5 8 H16 V14.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* The stack. CardSwap pins itself to the bottom-right of the nearest
            positioned box, so this box IS the layout: tall enough for the fan,
            padded off the edge by its own transform. */}
        <div className="training-stack relative h-[340px] md:h-[560px]">
          <CardSwap
            width={cardW}
            height={cardH}
            cardDistance={isMd ? 60 : 40}
            verticalDistance={isMd ? 70 : 50}
            delay={5000}
            pauseOnHover
            onFrontChange={setFront}
            skewAmount={6}
            easing="elastic"
          >
            {COURSES.map((c) => (
              <Card key={c.name} customClass="overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}${c.img}`}
                  alt={`ใบรับรอง ${c.name}`}
                  className="w-full"
                  draggable={false}
                />
                <div className="border-t border-[#e7e4dd] px-5 py-4">
                  <div className="truncate text-[14px] font-medium leading-tight text-[#21221f]">
                    {c.name}
                  </div>
                  <div className="mt-1 truncate text-[12px] font-normal text-[#999998]">
                    {c.issuer} · {c.date}
                  </div>
                </div>
              </Card>
            ))}
          </CardSwap>
        </div>
      </div>
    </div>
  )
}
