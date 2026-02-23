import { GROQ_API_KEY } from './secrets';

export interface Settings {
  app_name: string;
  app_version: string;
  openai_api_key: string | undefined;
  xai_api_key: string | undefined;
  groq_api_key: string | undefined;
  max_file_size: number;
  allowed_extensions: string[];
  target_genes: string[];
  supported_drugs: string[];
  gene_drug_map: Record<string, string>;
  warfarin_genes: string[];
}

export const settings: Settings = {
  app_name: "VaiK",
  app_version: "1.0.0",
  openai_api_key: process.env.OPENAI_API_KEY,
  xai_api_key: process.env.XAI_API_KEY,
  groq_api_key: GROQ_API_KEY || process.env.OPENAI_API_KEY,
  max_file_size: 5 * 1024 * 1024,
  allowed_extensions: [".vcf"],
  target_genes: ["CYP2D6", "CYP2C19", "CYP2C9", "VKORC1", "SLCO1B1", "TPMT", "DPYD"],
  supported_drugs: ["CODEINE", "CLOPIDOGREL", "WARFARIN", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"],
  gene_drug_map: {
    "CODEINE": "CYP2D6",
    "CLOPIDOGREL": "CYP2C19",
    "WARFARIN": "CYP2C9",
    "SIMVASTATIN": "SLCO1B1",
    "AZATHIOPRINE": "TPMT",
    "FLUOROURACIL": "DPYD"
  },
  warfarin_genes: ["CYP2C9", "VKORC1"]
};
