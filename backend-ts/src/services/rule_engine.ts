export interface RuleResult {
  risk_label: string;
  confidence_score: number;
  severity: string;
  dose_adjustment: string;
  alternative_drugs: string[];
  cpic_reference: string;
}

const CPIC_RULES: Record<string, RuleData> = {
  "CYP2D6|PM": {
    risk_label: "Inefficacy",
    severity: "high",
    dose_adjustment: "Avoid codeine. Use non-opioid analgesics. If opioid necessary, consider morphine.",
    alternative_drugs: ["MORPHINE", "HYDROMORPHONE", "OXYCODONE"],
    cpic_reference: "CPIC Guidelines for Codeine and CYP2D6"
  },
  "CYP2D6|IM": {
    risk_label: "Adjust Dosage",
    severity: "moderate",
    dose_adjustment: "Use caution. Consider reduced dose and monitor for analgesia.",
    alternative_drugs: ["MORPHINE", "HYDROMORPHONE"],
    cpic_reference: "CPIC Guidelines for Codeine and CYP2D6"
  },
  "CYP2D6|NM": {
    risk_label: "Safe",
    severity: "none",
    dose_adjustment: "Standard dosing. No adjustment needed.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Codeine and CYP2D6"
  },
  "CYP2D6|RM": {
    risk_label: "Safe",
    severity: "none",
    dose_adjustment: "Standard dosing. No adjustment needed.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Codeine and CYP2D6"
  },
  "CYP2D6|UM": {
    risk_label: "Toxic",
    severity: "critical",
    dose_adjustment: "Avoid codeine. Ultra-rapid metabolizers may experience toxicity.",
    alternative_drugs: ["MORPHINE", "HYDROMORPHONE", "OXYCODONE"],
    cpic_reference: "CPIC Guidelines for Codeine and CYP2D6"
  },
  "CYP2C19|PM": {
    risk_label: "Inefficacy",
    severity: "high",
    dose_adjustment: "Avoid clopidogrel. Use alternative antiplatelet agents.",
    alternative_drugs: ["PRASUGREL", "TICAGRELOR"],
    cpic_reference: "CPIC Guidelines for Clopidogrel and CYP2C19"
  },
  "CYP2C19|IM": {
    risk_label: "Adjust Dosage",
    severity: "moderate",
    dose_adjustment: "Consider alternative antiplatelets. If clopidogrel used, consider higher dose.",
    alternative_drugs: ["PRASUGREL", "TICAGRELOR"],
    cpic_reference: "CPIC Guidelines for Clopidogrel and CYP2C19"
  },
  "CYP2C19|NM": {
    risk_label: "Safe",
    severity: "none",
    dose_adjustment: "Standard clopidogrel dosing.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Clopidogrel and CYP2C19"
  },
  "CYP2C19|RM": {
    risk_label: "Enhanced Response",
    severity: "low",
    dose_adjustment: "Standard dosing. May have increased platelet inhibition.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Clopidogrel and CYP2C19"
  },
  "CYP2C19|UM": {
    risk_label: "Toxic",
    severity: "high",
    dose_adjustment: "Use caution. Ultra-rapid metabolizers may have increased bleeding risk.",
    alternative_drugs: ["PRASUGREL", "TICAGRELOR"],
    cpic_reference: "CPIC Guidelines for Clopidogrel and CYP2C19"
  },
  "CYP2C9|PM": {
    risk_label: "Toxic",
    severity: "high",
    dose_adjustment: "Reduce warfarin dose by 30-50%. Frequent INR monitoring required.",
    alternative_drugs: ["APIXABAN", "RIVAROXABAN", "DABIGATRAN"],
    cpic_reference: "CPIC Guidelines for Warfarin and CYP2C9"
  },
  "CYP2C9|IM": {
    risk_label: "Adjust Dosage",
    severity: "moderate",
    dose_adjustment: "Reduce warfarin dose by 15-25%. Monitor INR closely.",
    alternative_drugs: ["APIXABAN", "RIVAROXABAN", "DABIGATRAN"],
    cpic_reference: "CPIC Guidelines for Warfarin and CYP2C9"
  },
  "CYP2C9|NM": {
    risk_label: "Safe",
    severity: "none",
    dose_adjustment: "Standard warfarin dosing. Target INR 2-3.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Warfarin and CYP2C9"
  },
  "SLCO1B1|PM": {
    risk_label: "Toxic",
    severity: "high",
    dose_adjustment: "Avoid simvastatin. Use alternate statin (pravastatin, rosuvastatin).",
    alternative_drugs: ["PRAVASTATIN", "ROSUVASTATIN", "ATORVASTATIN"],
    cpic_reference: "CPIC Guidelines for Simvastatin and SLCO1B1"
  },
  "SLCO1B1|IM": {
    risk_label: "Adjust Dosage",
    severity: "moderate",
    dose_adjustment: "Use caution. Limit simvastatin to 20mg daily.",
    alternative_drugs: ["PRAVASTATIN", "ROSUVASTATIN", "ATORVASTATIN"],
    cpic_reference: "CPIC Guidelines for Simvastatin and SLCO1B1"
  },
  "SLCO1B1|NM": {
    risk_label: "Safe",
    severity: "none",
    dose_adjustment: "Standard simvastatin dosing.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Simvastatin and SLCO1B1"
  },
  "TPMT|PM": {
    risk_label: "Toxic",
    severity: "critical",
    dose_adjustment: "Avoid azathioprine. Use alternative immunosuppressant.",
    alternative_drugs: ["MYCOPHENOLATE_MOFETIL", "MYCOPHENOLATE_SODIUM"],
    cpic_reference: "CPIC Guidelines for Azathioprine and TPMT"
  },
  "TPMT|IM": {
    risk_label: "Adjust Dosage",
    severity: "high",
    dose_adjustment: "Reduce starting dose by 30-70%. Monitor blood counts closely.",
    alternative_drugs: ["MYCOPHENOLATE_MOFETIL"],
    cpic_reference: "CPIC Guidelines for Azathioprine and TPMT"
  },
  "TPMT|NM": {
    risk_label: "Safe",
    severity: "none",
    dose_adjustment: "Standard dosing. Routine monitoring.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Azathioprine and TPMT"
  },
  "DPYD|PM": {
    risk_label: "Toxic",
    severity: "critical",
    dose_adjustment: "Avoid 5-FU. Use alternative therapy.",
    alternative_drugs: ["IRINOTECAN", "LEUCOVORIN", "OXALIPLATIN", "BEVACIZUMAB"],
    cpic_reference: "CPIC Guidelines for Fluorouracil and DPYD"
  },
  "DPYD|IM": {
    risk_label: "Adjust Dosage",
    severity: "high",
    dose_adjustment: "Reduce 5-FU dose by 50%. Monitor for toxicity.",
    alternative_drugs: ["IRINOTECAN", "LEUCOVORIN", "OXALIPLATIN"],
    cpic_reference: "CPIC Guidelines for Fluorouracil and DPYD"
  },
  "DPYD|NM": {
    risk_label: "Safe",
    severity: "none",
    dose_adjustment: "Standard 5-FU dosing.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Fluorouracil and DPYD"
  },
  "VKORC1|PM": {
    risk_label: "Adjust Dosage",
    severity: "moderate",
    dose_adjustment: "Reduced warfarin dose may be needed due to increased sensitivity.",
    alternative_drugs: ["APIXABAN", "RIVAROXABAN", "DABIGATRAN"],
    cpic_reference: "CPIC Guidelines for Warfarin and VKORC1"
  },
  "VKORC1|IM": {
    risk_label: "Adjust Dosage",
    severity: "moderate",
    dose_adjustment: "Reduced warfarin dose may be needed due to increased sensitivity.",
    alternative_drugs: ["APIXABAN", "RIVAROXABAN", "DABIGATRAN"],
    cpic_reference: "CPIC Guidelines for Warfarin and VKORC1"
  },
  "VKORC1|NM": {
    risk_label: "Safe",
    severity: "none",
    dose_adjustment: "Standard warfarin dosing.",
    alternative_drugs: [],
    cpic_reference: "CPIC Guidelines for Warfarin and VKORC1"
  },
};

const CONFIDENCE_SCORES: Record<string, number> = {
  "PM": 0.98,
  "IM": 0.92,
  "NM": 0.95,
  "RM": 0.88,
  "UM": 0.90,
  "Poor": 0.98,
  "Intermediate": 0.92,
  "Normal": 0.95,
  "Unknown": 0.50
};

interface RuleData {
  risk_label: string;
  severity: string;
  dose_adjustment: string;
  alternative_drugs: string[];
  cpic_reference: string;
}

export function applyRule(gene: string, phenotype: string): RuleResult {
  const key = `${gene}|${phenotype}`;
  
  if (key in CPIC_RULES) {
    const rule = CPIC_RULES[key];
    const confidence = CONFIDENCE_SCORES[phenotype] ?? 0.5;
    
    return {
      risk_label: rule.risk_label,
      confidence_score: confidence,
      severity: rule.severity,
      dose_adjustment: rule.dose_adjustment,
      alternative_drugs: rule.alternative_drugs,
      cpic_reference: rule.cpic_reference
    };
  }
  
  return {
    risk_label: "Unknown",
    confidence_score: 0.85,
    severity: "low",
    dose_adjustment: "Insufficient data. Clinical judgment required.",
    alternative_drugs: [],
    cpic_reference: "No specific CPIC guideline available"
  };
}
