import { Routes, Route, useLocation } from 'react-router-dom'
import Navigation from './components/Navigation'
import ThemeProvider from './components/ThemeProvider'
import Home from './pages/Home'
import About from './pages/About'
import KnobPage from './pages/Knob'

function App() {
  const location = useLocation();
  const isKnobPage = location.pathname === '/knob-page';

  return (
    <ThemeProvider>
      <div className={`bg-background ${isKnobPage ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
        {!isKnobPage && <Navigation />}
        <main className={isKnobPage ? 'h-full' : ''}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/knob-page" element={<KnobPage />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App
