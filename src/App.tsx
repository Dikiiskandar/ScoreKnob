import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navigation from './components/Navigation'
import ThemeProvider from './components/ThemeProvider'
import Home from './pages/Home'
import About from './pages/About'
import KnobPage from './pages/Knob'
import Versus from './pages/Versus'

function App() {
  const location = useLocation();
  const isFullscreenPage = ['/knob-page', '/versus'].includes(location.pathname);

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Diki Lab',
      '/about': 'Diki Lab',
      '/knob-page': 'Diki Lab: Knob Score',
      '/versus': 'Diki Lab: Versus Score',
    }
    document.title = titles[location.pathname] ?? 'Diki Lab'
  }, [location.pathname])

  return (
    <ThemeProvider>
      <div className={`bg-background ${isFullscreenPage ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
        {!isFullscreenPage && <Navigation />}
        <main className={isFullscreenPage ? 'h-full' : ''}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/knob-page" element={<KnobPage />} />
            <Route path="/versus" element={<Versus />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App
