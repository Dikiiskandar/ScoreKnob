import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import KnobPage from './pages/Knob'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/knob-page" element={<KnobPage />} />
    </Routes>
  )
}

export default App
