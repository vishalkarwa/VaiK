import React from 'react';

function FAQ() {
  const faqs = [
    { q: "Is this clinically approved?", a: "No. Research tool only." },
    { q: "Does it replace doctors?", a: "No. Verify with professionals." },
    { q: "What files are supported?", a: "Standard VCF v4.2 files." },
    { q: "What genes are analyzed?", a: "CYP2D6, CYP2C19, CYP2C9, VKORC1, SLCO1B1, TPMT, DPYD" }
  ];

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

        <h1 className="text-3xl font-bold text-slate-800 mb-3">FAQ</h1>
        <p className="text-slate-500 mb-10">Common questions</p>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-2">{faq.q}</h3>
              <p className="text-slate-600 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-amber-700 text-sm">
            AI-assisted research tool. Verify results with licensed professionals.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
