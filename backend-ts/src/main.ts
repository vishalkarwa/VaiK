import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze';
import { settings } from './config';

console.log('API Key loaded:', settings.groq_api_key ? 'Yes (starts with: ' + settings.groq_api_key.substring(0, 8) + '...)' : 'No');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: "VaiK API", version: settings.app_version });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    groq_configured: !!settings.groq_api_key
  });
});

app.get('/api/drugs', (req, res) => {
  res.json({
    drugs: [
      { name: "CODEINE", gene: "CYP2D6", description: "Opioid analgesic" },
      { name: "CLOPIDOGREL", gene: "CYP2C19", description: "Antiplatelet agent" },
      { name: "WARFARIN", gene: "CYP2C9", description: "Anticoagulant" },
      { name: "SIMVASTATIN", gene: "SLCO1B1", description: "HMG-CoA reductase inhibitor" },
      { name: "AZATHIOPRINE", gene: "TPMT", description: "Immunosuppressant" },
      { name: "FLUOROURACIL", gene: "DPYD", description: "Chemotherapeutic agent" }
    ]
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = settings.groq_api_key;
    if (!apiKey) {
      return res.json({ response: 'AI chat is not configured. Please set GROQ_API_KEY.' });
    }

    const contextStr = context ? `
Current analysis results:
- Drug: ${context.drug || 'N/A'}
- Gene: ${context.primary_gene || 'N/A'}
- Diplotype: ${context.diplotype || 'N/A'}
- Phenotype: ${context.phenotype || 'N/A'}
- Risk: ${context.risk_label || 'N/A'}
- Recommendation: ${context.dose_adjustment || 'N/A'}
` : '';

    const systemPrompt = `You are a helpful AI assistant for VaiK, a pharmacogenomic analysis platform. 
You help users understand their genetic test results, drug interactions, and clinical recommendations.
Always provide accurate, evidence-based information aligned with CPIC guidelines.
If you're unsure about something, say so rather than guessing.
Keep responses concise and easy to understand.
${contextStr}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error('AI service unavailable');
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
    
    res.json({ response: content });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ response: "I'm sorry, I encountered an error. Please try again." });
  }
});

app.use('/api', analyzeRouter);

const PORT = parseInt(process.env.PORT || '8000', 10);

app.listen(PORT, () => {
  console.log(`VaiK API running on port ${PORT}`);
});

export default app;
