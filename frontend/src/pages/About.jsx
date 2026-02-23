import React from 'react';

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">About VaiK</h1>
        <p className="text-slate-500 mb-12">AI-powered pharmacogenomic analysis</p>

        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">What is VaiK?</h2>
            <p className="text-slate-600 leading-relaxed">
              VaiK is an AI-powered pharmacogenomic interpretation platform. It analyzes VCF files to detect clinically relevant variants and predicts drug-specific risk categories aligned with CPIC guidelines.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Key Features</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Explainable AI', desc: 'Clear mechanism explanations' },
                { title: 'CPIC Aligned', desc: 'Clinical guidelines' },
                { title: 'VCF Support', desc: 'Standard file format' },
                { title: 'JSON Export', desc: 'Research-ready data' }
              ].map((f, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <h3 className="font-medium text-slate-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Supported Genes</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { gene: 'CYP2D6', drug: 'Codeine' },
                { gene: 'CYP2C19', drug: 'Clopidogrel' },
                { gene: 'CYP2C9', drug: 'Warfarin' },
                { gene: 'VKORC1', drug: 'Warfarin' },
                { gene: 'SLCO1B1', drug: 'Simvastatin' },
                { gene: 'TPMT', drug: 'Azathioprine' },
                { gene: 'DPYD', drug: 'Fluorouracil' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="font-mono text-sm text-cyan-600">{item.gene}</span>
                  <span className="text-sm text-slate-500">{item.drug}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <p className="text-amber-700 text-sm">
              For research and educational purposes. Verify results with healthcare professionals.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About;
