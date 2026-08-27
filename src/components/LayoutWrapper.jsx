// -----------------------------------------------------------------------------
// LayoutWrapper.jsx
// One responsive full-viewport shell: the vertical feed, plus the full-screen
// project profile (ProjectDetail) overlaid when a project avatar is tapped.
// -----------------------------------------------------------------------------

import { AnimatePresence } from 'framer-motion'
import VerticalFeed from './VerticalFeed'
import ProjectDetail from './ProjectDetail'
import { usePortfolio, VIEW } from '../context/PortfolioContext'

export default function LayoutWrapper() {
  const { view } = usePortfolio()
  return (
    // A shade under the pages, not the same #fafafa. The feed clips itself to a
    // circle during a stage change and THIS is what shows around it — matched to
    // the page it revealed nothing, because pale was opening over pale.
    <div className="h-dvh w-full bg-[#e7e4dd]">
      <VerticalFeed />
      <AnimatePresence>{view === VIEW.DETAIL && <ProjectDetail key="detail" />}</AnimatePresence>
    </div>
  )
}
