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
    <div className="h-dvh w-full bg-[#fafafa]">
      <VerticalFeed />
      <AnimatePresence>{view === VIEW.DETAIL && <ProjectDetail key="detail" />}</AnimatePresence>
    </div>
  )
}
