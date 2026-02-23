export interface VariantInfo {
  rsid: string;
  pos: string;
  alt: string;
  info: Record<string, string>;
}

export interface PharmacogenomicProfile {
  primary_gene: string;
  diplotype: string;
  phenotype: string;
  detected_variants: VariantInfo[];
}

export interface RiskAssessment {
  risk_label: string;
  confidence_score: number;
  severity: string;
}

export interface ClinicalRecommendation {
  dose_adjustment: string;
  alternative_drugs: string[];
  cpic_guideline_reference: string;
}

export interface LLMExplanation {
  summary: string;
  mechanism: string;
  evidence: string[];
}

export interface QualityMetrics {
  vcf_parsing_success: boolean;
  num_variants_parsed: number;
  notes: string;
}

export interface AnalysisResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: RiskAssessment;
  pharmacogenomic_profile: PharmacogenomicProfile;
  clinical_recommendation: ClinicalRecommendation;
  llm_generated_explanation: LLMExplanation;
  quality_metrics: QualityMetrics;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  timestamp: string;
}
