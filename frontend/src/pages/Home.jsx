import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'

const DRUGS = [
  { name: 'CODEINE', gene: 'CYP2D6' },
  { name: 'CLOPIDOGREL', gene: 'CYP2C19' },
  { name: 'WARFARIN', gene: 'CYP2C9' },
  { name: 'SIMVASTATIN', gene: 'SLCO1B1' },
  { name: 'AZATHIOPRINE', gene: 'TPMT' },
  { name: 'FLUOROURACIL', gene: 'DPYD' }
]

function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [file, setFile] = useState(null)
  const [selectedDrugs, setSelectedDrugs] = useState([])
  const [patientId, setPatientId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(searchParams.get('upload') === 'true')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [animatedSteps, setAnimatedSteps] = useState([])
  const containerRef = useRef(null)

  useEffect(() => {
    setIsLoaded(true)
    const timer = setTimeout(() => {
      setAnimatedSteps([0])
      setTimeout(() => setAnimatedSteps([0, 1]), 200)
      setTimeout(() => setAnimatedSteps([0, 1, 2]), 400)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 2
        })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0]
      const fileExt = uploadedFile.name.split('.').pop()?.toLowerCase()
      
      if (fileExt !== 'vcf') {
        setError('File is not in correct form. Please upload a .vcf file')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          setError('Data is not correct or file is empty')
          setFile(null)
          return
        }
        
        const trimmedContent = content.trim()
        if (!trimmedContent.startsWith('##') && !trimmedContent.startsWith('#')) {
          setError('Data is not correct or file is empty')
          setFile(null)
          return
        }
        
        setFile(uploadedFile)
        setError('')
      }
      reader.onerror = () => {
        setError('Data is not correct or file is empty')
        setFile(null)
      }
      reader.readAsText(uploadedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'text/vcf': ['.vcf'], 'text/plain': ['.vcf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDropRejected: () => {
      setError('File is not in correct form. Please upload a .vcf file')
    }
  })

  const toggleDrug = (drugName) => {
    setSelectedDrugs(prev => 
      prev.includes(drugName)
        ? prev.filter(d => d !== drugName)
        : [...prev, drugName]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!file) {
      setError('Please upload a VCF file')
      return
    }

    if (!file.name.toLowerCase().endsWith('.vcf')) {
      setError('File is not in correct form. Please upload a .vcf file')
      return
    }

    if (selectedDrugs.length === 0) {
      setError('Please select at least one drug')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('drugs', selectedDrugs.join(','))
      if (patientId) {
        formData.append('patient_id', patientId)
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      navigate('/results', { state: { result, source: 'backend' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      {/* Floating orbs with animation */}
      <div 
        className="absolute top-20 -left-20 w-96 h-96 rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
          transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px)`,
          animation: 'float 6s ease-in-out infinite'
        }}
      />
      <div 
        className="absolute bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.12) 0%, transparent 70%)',
          transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 25}px)`,
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-5"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 md:py-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { setShowUpload(false); setMobileMenuOpen(false); }}>
          <div className="w-8 md:w-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-green-500/25">
            <svg className="w-5 md:w-6 h-5 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">VaiK</span>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 text-slate-600" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#" onClick={() => setShowUpload(false)} className="text-sm text-slate-600 hover:text-slate-800 transition-all duration-300 relative group">
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-800 transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="/about" className="text-sm text-slate-600 hover:text-slate-800 transition-all duration-300 relative group">
            About
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-800 transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="/faq" className="text-sm text-slate-600 hover:text-slate-800 transition-all duration-300 relative group">
            FAQ
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-800 transition-all duration-300 group-hover:w-full"></span>
          </a>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 md:hidden shadow-lg">
            <div className="flex flex-col p-4 gap-4">
              <a href="#" onClick={() => { setShowUpload(false); setMobileMenuOpen(false); }} className="text-sm text-slate-600 hover:text-slate-800 py-2">
                Home
              </a>
              <a href="/about" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-600 hover:text-slate-800 py-2">
                About
              </a>
              <a href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-600 hover:text-slate-800 py-2">
                FAQ
              </a>
            </div>
          </div>
        )}
      </nav>

      {!showUpload ? (
        /* LANDING PAGE */
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[60vh] lg:min-h-[70vh]">
            {/* Left - Content */}
            <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-block px-3 py-1.5 md:px-4 md:py-1.5 bg-slate-100 border border-slate-200 rounded-full mb-4 md:mb-6 animate-fade-in">
                <span className="text-xs font-medium text-slate-600">AI-Powered Pharmacogenomics</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-4 md:mb-6">
                Precision Medicine
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 animate-pulse">Powered by AI</span>
              </h1>
              
              <p className="text-slate-600 text-base md:text-lg mb-6 md:mb-8 max-w-lg">
                Analyze genetic data to predict drug responses. Reduce adverse reactions. Make smarter decisions.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
                <button
                  onClick={() => setShowUpload(true)}
                  className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                >
                  Start Analysis
                </button>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 md:px-8 py-3 md:py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 text-sm md:text-base"
                >
                  Learn More
                </button>
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-slate-200 border-2 border-white animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-500">Trusted by researchers</p>
              </div>
            </div>

            {/* Right - DNA Visual */}
            <div 
              className={`relative transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
              style={{ transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }}
            >
              <div className="relative w-full aspect-square max-w-sm md:max-w-md mx-auto">
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-slate-100 to-amber-100 rounded-3xl blur-2xl animate-pulse" />
                
                {/* Main Card */}
                <div className="relative bg-white rounded-3xl border border-slate-200 p-4 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
                  {/* DNA Helix */}
                  <svg viewBox="0 0 200 300" className="w-full h-full">
                    <defs>
                      <linearGradient id="dnaGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="50%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#475569" />
                      </linearGradient>
                    </defs>
                    
                    <g className="animate-pulse">
                      <path 
                        d="M 70 0 Q 50 40 70 80 Q 90 120 70 160 Q 50 200 70 240 Q 90 280 70 300" 
                        stroke="url(#dnaGrad2)" 
                        strokeWidth="2" 
                        fill="none"
                        className="opacity-50"
                      />
                      <path 
                        d="M 130 0 Q 150 40 130 80 Q 110 120 130 160 Q 150 200 130 240 Q 110 280 130 300" 
                        stroke="url(#dnaGrad2)" 
                        strokeWidth="2" 
                        fill="none"
                        className="opacity-50"
                      />
                      
                      {[0,1,2,3,4,5].map(i => (
                        <g key={i}>
                          <line 
                            x1={75 + Math.sin(i * Math.PI / 3) * 25} 
                            y1={i * 50 + 25} 
                            x2={125 - Math.sin(i * Math.PI / 3) * 25} 
                            y2={i * 50 + 25} 
                            stroke="#cbd5e1" 
                            strokeWidth="1"
                          />
                          <circle cx={75 + Math.sin(i * Math.PI / 3) * 25} cy={i * 50 + 25} r="3" fill="#22c55e" className="animate-pulse" />
                          <circle cx={125 - Math.sin(i * Math.PI / 3) * 25} cy={i * 50 + 25} r="3" fill="#475569" className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                        </g>
                      ))}
                    </g>
                  </svg>

                  {/* Floating badges with bounce */}
                  <div className="absolute -top-3 -right-3 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md transform hover:scale-105 transition-transform duration-300 animate-bounce" style={{ animationDuration: '3s' }}>
                    <span className="text-xs font-mono text-green-600 font-bold">VCF</span>
                  </div>
                  <div className="absolute top-1/3 -left-4 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md transform hover:scale-105 transition-transform duration-300 animate-bounce" style={{ animationDuration: '4s', animationDelay: '500ms' }}>
                    <span className="text-xs font-mono text-cyan-600 font-bold">CPIC</span>
                  </div>
                  <div className="absolute bottom-1/3 -right-3 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md transform hover:scale-105 transition-transform duration-300 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
                    <span className="text-xs font-mono text-purple-600 font-bold">AI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div id="how-it-works" className="mt-16 md:mt-24">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">How It Works</h2>
              <p className="text-slate-500">Three simple steps</p>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {[
                { icon: '1', title: 'Upload VCF', desc: 'Drop your VCF file', color: 'from-green-500 to-green-600' },
                { icon: '2', title: 'AI Analysis', desc: 'We analyze variants', color: 'from-cyan-500 to-cyan-600' },
                { icon: '3', title: 'Get Results', desc: 'Risk predictions', color: 'from-purple-500 to-purple-600' }
              ].map((step, i) => (
                <div 
                  key={i} 
                  className={`group bg-white border border-slate-200 rounded-2xl p-4 md:p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-500 transform hover:-translate-y-2 ${
                    animatedSteps.includes(i) 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <div className={`w-10 md:w-12 h-10 md:h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold mb-3 md:mb-4 group-hover:scale-110 group-hover:shadow-lg shadow-green-500/25 transition-all duration-300 animate-pulse`}>
                    {step.icon}
                  </div>
                  <h3 className="text-slate-800 font-semibold mb-1">{step.title}</h3>
                  <p className="text-slate-500 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 md:mt-24">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Why Choose VaiK</h2>
              <p className="text-slate-500">Advanced features for precision medicine</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { title: 'AI-Powered', desc: 'Advanced LLM analysis', icon: '🤖' },
                { title: 'CPIC Guidelines', desc: 'Clinically validated', icon: '✓' },
                { title: 'Fast Results', desc: 'Instant analysis', icon: '⚡' },
                { title: 'Secure', desc: 'Privacy focused', icon: '🔒' }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-xl md:text-2xl mb-2 md:mb-3">{feature.icon}</div>
                  <h3 className="text-slate-800 font-semibold mb-1">{feature.title}</h3>
                  <p className="text-slate-500 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* UPLOAD PAGE */
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <button
            onClick={() => { setShowUpload(false); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-6 md:mb-8"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
            {/* Left Panel */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 mb-4 md:mb-6">Upload VCF File</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 md:mb-3">VCF File</label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-4 md:p-8 text-center cursor-pointer transition-all duration-300 ${
                      isDragReject
                        ? 'border-red-400 bg-red-50'
                        : isDragActive
                          ? 'border-green-500 bg-green-50'
                          : file
                            ? 'border-green-400 bg-green-50'
                            : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {file ? (
                      <div>
                        <svg className="w-8 md:w-10 h-8 md:h-10 mx-auto text-slate-600 mb-2 md:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-slate-800 font-medium text-sm md:text-base">{file.name}</p>
                        <p className="text-slate-500 text-xs md:text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          className="mt-3 md:mt-4 text-sm text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-8 md:w-10 h-8 md:h-10 mx-auto text-slate-400 mb-2 md:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-slate-600 text-sm md:text-base">
                          {isDragActive ? 'Drop here' : 'Drag & drop or click'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 md:mb-3">Select Drug</label>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {DRUGS.map(drug => (
                      <button
                        key={drug.name}
                        type="button"
                        onClick={() => toggleDrug(drug.name)}
                        className={`p-2 md:p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                          selectedDrugs.includes(drug.name)
                            ? 'border-green-400 bg-green-50 text-green-700'
                            : 'border-slate-200 text-slate-600 hover:border-green-300 hover:bg-green-50/50'
                        }`}
                      >
                        {drug.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 md:mb-3">Patient ID</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-400 transition-colors text-sm md:text-base"
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 md:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 md:w-5 h-4 md:h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : 'Analyze'}
                </button>
              </form>
            </div>

            {/* Right Panel */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
                <h3 className="font-semibold text-slate-800 mb-3 md:mb-4">Supported Genes</h3>
                <div className="space-y-1 md:space-y-2">
                  {DRUGS.map(drug => (
                    <div key={drug.name} className="flex items-center justify-between py-1.5 md:py-2 border-b border-slate-100 last:border-0">
                      <span className="font-mono text-xs md:text-sm text-slate-700">{drug.gene}</span>
                      <span className="text-xs md:text-sm text-slate-500">{drug.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-6">
                <h3 className="font-semibold text-slate-800 mb-3 md:mb-4">Phenotypes</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">PM</span>
                    <span className="text-slate-600">Poor Metabolizer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">IM</span>
                    <span className="text-slate-600">Intermediate</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">NM</span>
                    <span className="text-slate-600">Normal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-4 md:py-6 text-center bg-white">
        <p className="text-slate-500 text-xs md:text-sm">© 2026 VaiK • Precision Medicine</p>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translate(${mousePos.x * -30}px, ${mousePos.y * -30}px); }
          50% { transform: translateY(-20px) translate(${mousePos.x * -30}px, ${mousePos.y * -30}px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default Home
