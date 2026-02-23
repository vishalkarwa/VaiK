import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Results from './pages/Results'
import About from './pages/About'
import FAQ from './pages/FAQ'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
        <footer className="mt-auto py-4 text-center">
          <p className="text-slate-500 text-sm">Developed by Vishal</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
