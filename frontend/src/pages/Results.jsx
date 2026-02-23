import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ChatBot from '../components/ChatBot'

function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result
  const [showJson, setShowJson] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">No Results</h1>
          <p className="text-slate-500 mb-4">Upload a VCF file to see results</p>
          <button
            onClick={() => navigate('/?upload=true')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const results = Array.isArray(result) ? result : [result]

  const chatContext = results.length === 1 ? {
    drug: results[0].drug,
    primary_gene: results[0].pharmacogenomic_profile.primary_gene,
    diplotype: results[0].pharmacogenomic_profile.diplotype,
    phenotype: results[0].pharmacogenomic_profile.phenotype,
    risk_label: results[0].risk_assessment.risk_label,
    dose_adjustment: results[0].clinical_recommendation.dose_adjustment
  } : null

  const getRiskConfig = (riskLabel) => {
    switch (riskLabel?.toLowerCase()) {
      case 'safe':
        return { 
          bg: 'from-green-500 to-green-600', 
          text: 'text-white',
          icon: '🟢',
          bar: 'bg-gradient-to-r from-green-400 to-green-500',
          barWidth: '90%'
        }
      case 'adjust dosage':
        return { 
          bg: 'from-amber-500 to-orange-500', 
          text: 'text-white',
          icon: '🟡',
          bar: 'bg-gradient-to-r from-amber-400 to-orange-400',
          barWidth: '60%'
        }
      case 'toxic':
        return { 
          bg: 'from-red-600 to-red-700', 
          text: 'text-white',
          icon: '🔴',
          bar: 'bg-gradient-to-r from-red-500 to-red-600',
          barWidth: '30%'
        }
      case 'ineffective':
        return { 
          bg: 'from-red-600 to-red-700', 
          text: 'text-white',
          icon: '🔴',
          bar: 'bg-gradient-to-r from-red-500 to-red-600',
          barWidth: '30%'
        }
      default:
        return { 
          bg: 'from-slate-500 to-slate-600', 
          text: 'text-white',
          icon: '⚪',
          bar: 'bg-gradient-to-r from-slate-400 to-slate-500',
          barWidth: '50%'
        }
    }
  }

  const getGeneIcon = (gene) => {
    const icons = {
      CYP2D6: '🧬',
      CYP2C19: '💊',
      CYP2C9: '🩸',
      SLCO1B1: '❤️',
      TPMT: '🛡️',
      DPYD: '🔬',
      VKORC1: '🎯'
    }
    return icons[gene] || '🧬'
  }

  const getPhenotypeColor = (phenotype) => {
    if (phenotype?.includes('Poor')) return 'bg-red-100 text-red-700 border-red-200'
    if (phenotype?.includes('Intermediate')) return 'bg-amber-100 text-amber-700 border-amber-200'
    if (phenotype?.includes('Normal') || phenotype?.includes('Normal Metabolizer')) return 'bg-green-100 text-green-700 border-green-200'
    if (phenotype?.includes('Ultrarapid')) return 'bg-purple-100 text-purple-700 border-purple-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pharmaguard_result_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/?upload=true')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Analysis Results</h1>
                <p className="text-xs text-slate-500">{results.length} drug{results.length > 1 ? 's' : ''} analyzed</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyToClipboard} className="px-3 py-2 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-all">
              Copy
            </button>
            <button onClick={downloadJSON} className="px-3 py-2 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-all">
              Download
            </button>
            <button onClick={() => navigate('/?upload=true')} className="px-3 py-2 text-xs bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25">
              New
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            AI-assisted research tool. Verify results with a licensed professional.
          </p>
        </div>

        {showJson && (
          <pre className="mb-6 p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
        
        <button onClick={() => setShowJson(!showJson)} className="text-xs text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          {showJson ? 'Hide' : 'Show'} JSON
        </button>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Results Column */}
          <div className="lg:col-span-2">
          {results.map((r, idx) => {
            const riskConfig = getRiskConfig(r.risk_assessment.risk_label)
            return (
              <div 
                key={idx} 
                className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                {/* Header with Gradient */}
                <div className={`bg-gradient-to-r ${riskConfig.bg} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl">
                        {getGeneIcon(r.pharmacogenomic_profile.primary_gene)}
                      </div>
                      <div>
                        <h2 className="font-bold text-white text-xl">{r.drug}</h2>
                        <p className="text-white/80 text-sm">{r.pharmacogenomic_profile.primary_gene}</p>
                      </div>
                    </div>
                    <div className="text-4xl">{riskConfig.icon}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Key Info Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-slate-500 text-xs mb-1">Diplotype</p>
                      <p className="font-mono text-slate-800 font-semibold">{r.pharmacogenomic_profile.diplotype}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-slate-500 text-xs mb-1">Phenotype</p>
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getPhenotypeColor(r.pharmacogenomic_profile.phenotype)}`}>
                        {r.pharmacogenomic_profile.phenotype}
                      </span>
                    </div>
                  </div>

                  {/* Risk Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-600 text-sm font-medium">Risk Level</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskConfig.bg} ${riskConfig.text}`}>
                        {r.risk_assessment.risk_label?.toUpperCase()}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${riskConfig.bar} rounded-full transition-all duration-1000`} style={{ width: riskConfig.barWidth }}></div>
                    </div>
                  </div>

                  {/* Detected Variants */}
                  {r.pharmacogenomic_profile.detected_variants?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-slate-500 text-xs">Detected Variants</p>
                      <div className="flex gap-2 flex-wrap">
                        {r.pharmacogenomic_profile.detected_variants.map((v, i) => (
                          <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-mono rounded-lg border border-slate-200">
                            {v.rsid}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-500 text-xs mb-2">Recommendation</p>
                    <p className="text-slate-800 text-sm leading-relaxed">{r.clinical_recommendation?.dose_adjustment}</p>
                  </div>

                  {/* Alternative Drugs */}
                  {r.clinical_recommendation?.alternative_drugs?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-slate-500 text-xs">Alternative Drugs</p>
                      <div className="flex gap-2 flex-wrap">
                        {r.clinical_recommendation.alternative_drugs.map((drug, i) => (
                          <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200">
                            {drug}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mechanism */}
                  <div className="space-y-2">
                    <p className="text-slate-500 text-xs">How It Works</p>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-slate-700 text-sm">{r.llm_generated_explanation?.summary}</p>
                      <p className="text-slate-500 text-sm mt-2 italic">{r.llm_generated_explanation?.mechanism}</p>
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${r.quality_metrics?.vcf_parsing_success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-slate-500 text-xs">VCF Parsing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">Confidence:</span>
                      <span className="text-slate-800 font-semibold">{(r.risk_assessment.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Total Drugs</span>
                  <span className="text-slate-800 font-bold">{results.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Safe</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{results.filter(r => r.risk_assessment.risk_label?.toLowerCase() === 'safe').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Adjust Dose</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">{results.filter(r => r.risk_assessment.risk_label?.toLowerCase() === 'adjust dosage').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">High Risk</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">{results.filter(r => ['toxic', 'ineffective'].includes(r.risk_assessment.risk_label?.toLowerCase())).length}</span>
                </div>
              </div>
            </div>

            {/* Phenotype Legend */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Phenotypes
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-slate-600 text-sm">Poor Metabolizer</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600 text-sm">Intermediate</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-slate-600 text-sm">Normal Metabolizer</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span className="text-slate-600 text-sm">Ultrarapid</span>
                </div>
              </div>
            </div>

            {/* Genes Analyzed */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                Genes Analyzed
              </h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set(results.map(r => r.pharmacogenomic_profile.primary_gene))].map((gene, i) => (
                  <span key={i} className="px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">
                    {getGeneIcon(gene)} {gene}
                  </span>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="text-green-700 font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Quick Tips
              </h3>
              <ul className="text-slate-600 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  Always consult your healthcare provider
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  Share results with your pharmacist
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  Results are based on CPIC guidelines
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Button - 2x Larger */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-8 right-8 w-28 h-28 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:shadow-green-500/40 transition-all duration-300 z-50"
      >
        {showChat ? (
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <rect x="15" y="20" width="70" height="50" rx="8" fill="white" />
            <circle cx="35" cy="40" r="6" fill="#166534" />
            <circle cx="65" cy="40" r="6" fill="#166534" />
            <rect x="45" y="10" width="10" height="12" fill="white" />
            <circle cx="50" cy="10" r="4" fill="#22c55e" />
            <rect x="30" y="55" width="40" height="8" rx="4" fill="#166534" />
            <rect x="35" y="68" width="30" height="18" rx="4" fill="#dcfce7" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {showChat && <ChatBot onClose={() => setShowChat(false)} context={chatContext} />}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default Results
