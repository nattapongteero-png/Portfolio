// -----------------------------------------------------------------------------
// PortfolioContext.jsx
// The single source of truth for navigation + view state across the app.
//
// It answers three questions the whole UI depends on:
//   1. Which project is "active" (the one in view / being inspected)?
//   2. Are we in the Feed view or the Detail (profile) view?
//   3. Which tab is selected inside the Detail view?
//
// On desktop the Detail view is shown side-by-side with the Feed (see the
// responsive layout), so `view` is mainly meaningful on mobile. Keeping it in
// context means both layouts read the same state without prop-drilling.
// -----------------------------------------------------------------------------

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import projects from '../data/mockData'

const PortfolioContext = createContext(null)

// Named view constants avoid stringly-typed bugs across components.
export const VIEW = {
  FEED: 'feed',
  DETAIL: 'detail',
}

export function PortfolioProvider({ children }) {
  // Index of the project currently centered in the feed.
  const [activeIndex, setActiveIndex] = useState(0)
  // 'feed' | 'detail' — drives the mobile full-screen transition.
  const [view, setView] = useState(VIEW.FEED)
  // Active tab id within the detail view (defaults to first tab of a project).
  const [activeTab, setActiveTab] = useState(projects[0]?.tabs[0]?.id ?? 'overview')
  // Set of liked project ids (client-side only, for the heart interaction).
  const [liked, setLiked] = useState(() => new Set())

  const activeProject = projects[activeIndex]

  // Move the feed to a specific project by index (clamped to valid range).
  const goToProject = useCallback((index) => {
    setActiveIndex((prev) => {
      const next = Math.max(0, Math.min(index, projects.length - 1))
      return next === prev ? prev : next
    })
  }, [])

  // Open the profile/detail view for a project, resetting to its first tab.
  const openDetail = useCallback((index) => {
    if (typeof index === 'number') setActiveIndex(index)
    const proj = typeof index === 'number' ? projects[index] : activeProject
    setActiveTab(proj?.tabs[0]?.id ?? 'overview')
    setView(VIEW.DETAIL)
  }, [activeProject])

  // Return to the feed (mobile back button).
  const closeDetail = useCallback(() => setView(VIEW.FEED), [])

  // Toggle a like; returns nothing, just mutates the liked set immutably.
  const toggleLike = useCallback((id) => {
    setLiked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      projects,
      activeIndex,
      activeProject,
      view,
      activeTab,
      liked,
      goToProject,
      openDetail,
      closeDetail,
      setActiveTab,
      toggleLike,
    }),
    [activeIndex, activeProject, view, activeTab, liked, goToProject, openDetail, closeDetail, toggleLike]
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

// Convenience hook so components never touch the raw context object.
export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within a <PortfolioProvider>')
  return ctx
}

export default PortfolioContext
