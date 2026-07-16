import { PortfolioProvider } from './context/PortfolioContext'
import LayoutWrapper from './components/LayoutWrapper'

export default function App() {
  return (
    <PortfolioProvider>
      <LayoutWrapper />
    </PortfolioProvider>
  )
}
