import { settings } from '../config';

const LLM_PROMPT_TEMPLATE = `STRICT PHARMACOGENOMIC EXPLANATION

GENOTYPE (Already Determined):
- Gene: {gene}
- Diplotype: {diplotype}
- Phenotype: {phenotype}
- Drug: {drug}

VARIANTS DETECTED:
{variants}

────────────────────────────────
CRITICAL RULES:
────────────────────────────────

1. DO NOT contradict the verified genotype
2. DO NOT re-interpret the genotype
3. DO NOT escalate severity beyond genotype
4. DO NOT add star alleles not present

────────────────────────────────
DRUG-SPECIFIC MECHANISM TEMPLATES:
────────────────────────────────

CODEINE → CYP2D6:
"CYP2D6 catalyzes O-demethylation of codeine to morphine. Codeine is a prodrug requiring CYP2D6 activation."

CLOPIDOGREL → CYP2C19:
"CYP2C19 catalyzes oxidative bioactivation of clopidogrel to its active thiol metabolite. Clopidogrel is a prodrug."

WARFARIN → CYP2C9+VKORC1:
"CYP2C9 metabolizes S-warfarin (more potent enantiomer). VKORC1 encodes the pharmacologic target inhibited by warfarin."

SIMVASTATIN → SLCO1B1:
"SLCO1B1 encodes a hepatic uptake transporter (OATP1B1). Reduced function increases systemic simvastatin exposure and myopathy risk."

AZATHIOPRINE → TPMT:
"TPMT catalyzes S-methylation of thiopurines, reducing active metabolite accumulation. Reduced TPMT activity increases risk of myelosuppression."

FLUOROURACIL → DPYD:
"DPYD encodes dihydropyrimidine dehydrogenase, which metabolizes 5-FU. Reduced DPYD activity increases systemic toxicity."

────────────────────────────────
OUTPUT FORMAT (JSON only):
────────────────────────────────

{
    "summary": "2-3 sentence clinical summary",
    "mechanism": "Use exact template above for mechanism",
    "evidence": ["CPIC guideline URL"]
}`;

function generatePrompt(gene: string, diplotype: string, phenotype: string, drug: string, variants: Record<string, unknown>[]): string {
  const variantTexts = variants.map(v => {
    const rsid = v.rsid || 'unknown';
    const gt = v.gt || 'N/A';
    const star = (v.info as Record<string, string>)?.STAR || 'N/A';
    return `${rsid}: GT=${gt}, STAR=${star}`;
  }).join('; ');
  
  return LLM_PROMPT_TEMPLATE
    .replace("{gene}", gene)
    .replace("{diplotype}", diplotype)
    .replace("{phenotype}", phenotype)
    .replace("{drug}", drug)
    .replace("{variants}", variantTexts || "No variants (wild-type)");
}

interface LLMResult {
  summary: string;
  mechanism: string;
  evidence: string[];
}

async function callLLM(prompt: string): Promise<LLMResult | null> {
  try {
    const apiKey = settings.groq_api_key;
    if (!apiKey) {
      console.log('No Groq API key configured');
      return null;
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are a clinical pharmacogenomics reasoning engine.

STRICT RULES:
- The genotype is ALREADY DETERMINED - do not re-interpret
- NEVER write "DRUG encodes..." - only GENES encode proteins
- CYP genes are ENZYMES, SLCO1B1 is a TRANSPORTER, VKORC1 is a TARGET
- Use exact drug-specific mechanism templates provided
- NEVER say "enzyme/transporter" - be specific
- Output valid JSON only`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.02,
        max_tokens: 600
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`Groq API error: ${response.status}`, errorData);
      return null;
    }
    
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }
    
    return null;
  } catch (e) {
    console.log(`LLM call failed: ${e}`);
    return null;
  }
}

const MECHANISM_TEMPLATES: Record<string, string> = {
  "CYP2D6": "CYP2D6 catalyzes O-demethylation of codeine to morphine. Codeine is a prodrug requiring CYP2D6 activation.",
  "CYP2C19": "CYP2C19 catalyzes oxidative bioactivation of clopidogrel to its active thiol metabolite. Clopidogrel is a prodrug.",
  "CYP2C9": "CYP2C9 metabolizes S-warfarin (more potent enantiomer). VKORC1 encodes the pharmacologic target inhibited by warfarin.",
  "SLCO1B1": "SLCO1B1 encodes a hepatic uptake transporter (OATP1B1). Reduced function increases systemic simvastatin exposure and myopathy risk.",
  "TPMT": "TPMT catalyzes S-methylation of thiopurines, reducing active metabolite accumulation. Reduced TPMT activity increases risk of myelosuppression.",
  "DPYD": "DPYD encodes dihydropyrimidine dehydrogenase, which metabolizes 5-FU. Reduced DPYD activity increases systemic toxicity."
};

export async function generateExplanation(
  gene: string,
  diplotype: string,
  phenotype: string,
  drug: string,
  variants: Record<string, unknown>[],
  cpicReference: string
): Promise<{
  summary: string;
  mechanism: string;
  evidence: string[];
}> {
  const prompt = generatePrompt(gene, diplotype, phenotype, drug, variants);
  
  const llmResult = await callLLM(prompt);
  
  if (llmResult) {
    const evidence = llmResult.evidence || [];
    if (!evidence.includes(cpicReference)) {
      evidence.unshift(cpicReference);
    }
    
    return {
      summary: llmResult.summary || "",
      mechanism: llmResult.mechanism || MECHANISM_TEMPLATES[gene] || "",
      evidence
    };
  }
  
  const summaryFallbacks: Record<string, string> = {
    "PM": "Patient has no functional enzyme activity. Drug therapy requires alternative.",
    "IM": "Patient has reduced enzyme activity. Dose adjustment recommended.",
    "NM": "Patient has normal enzyme activity. Standard dosing appropriate.",
    "RM": "Patient has increased enzyme activity. May require dose adjustment.",
    "UM": "Patient has very high enzyme activity. Monitor for enhanced effect."
  };
  
  const summary = summaryFallbacks[phenotype] || `Patient is a ${phenotype} for ${gene}.`;
  const mechanism = MECHANISM_TEMPLATES[gene] || `${gene} affects drug metabolism.`;
  
  return {
    summary,
    mechanism,
    evidence: [cpicReference]
  };
}
