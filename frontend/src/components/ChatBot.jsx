import { useState, useRef, useEffect } from 'react'

const CHAT_INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm your AI assistant. Ask me anything about your pharmacogenomic results, drug interactions, or how to interpret your analysis."
}

function ChatBot({ onClose, context }) {
  const [messages, setMessages] = useState([CHAT_INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEnd = useRef(null)

  const scrollToBottom = () => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: context
        })
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || "I couldn't generate a response. Please try again." }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-500 to-green-600">
        <div className="flex items-center gap-3">
          {/* Robot Logo */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              {/* Robot Head */}
              <rect x="20" y="15" width="60" height="45" rx="8" fill="white" />
              {/* Eyes */}
              <circle cx="38" cy="35" r="6" fill="#166534" />
              <circle cx="62" cy="35" r="6" fill="#166534" />
              {/* Eye shine */}
              <circle cx="40" cy="33" r="2" fill="white" />
              <circle cx="64" cy="33" r="2" fill="white" />
              {/* Antenna */}
              <rect x="47" y="5" width="6" height="12" fill="white" />
              <circle cx="50" cy="5" r="4" fill="#06b6d4" className="animate-pulse" />
              {/* Mouth */}
              <rect x="35" y="48" width="30" height="6" rx="3" fill="#166534" />
              {/* Body */}
              <rect x="30" y="63" width="40" height="30" rx="5" fill="white" />
              <rect x="38" y="70" width="24" height="16" rx="2" fill="#e2e8f0" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-white text-sm">AI Assistant</span>
            <p className="text-xs text-white/70">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px] bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-green-600 text-white rounded-br-md' 
                : 'bg-white text-slate-700 rounded-bl-md border border-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-slate-800 placeholder-gray-400 text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatBot
