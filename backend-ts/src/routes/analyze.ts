import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { settings } from '../config';
import { parseVcfFile, VCFParser } from '../services/vcf_parser';
import { buildDiplotype, calculateWarfarinSensitivity } from '../services/diplotype_builder';
import { applyRule } from '../services/rule_engine';
import { generateExplanation } from '../services/llm_service';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: settings.max_file_size },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (settings.allowed_extensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${settings.allowed_extensions.join(', ')}`));
    }
  }
});

function validateDrug(drug: string): boolean {
  return settings.supported_drugs.includes(drug.toUpperCase());
}

function getGeneForDrug(drug: string): string {
  return settings.gene_drug_map[drug.toUpperCase()] || "";
}

function getGenesForDrug(drug: string): string[] {
  if (drug === "WARFARIN") {
    return settings.warfarin_genes;
  }
  return [getGeneForDrug(drug)];
}

const CPIC_REFS: Record<string, string> = {
  "CYP2C9": "CPIC Guidelines for Warfarin and CYP2C9 - https://www.pharmgkb.org/documents/pa164871035",
  "VKORC1": "CPIC Guidelines for Warfarin and VKORC1 - https://www.pharmgkb.org/documents/pa165825348",
  "CYP2D6": "CPIC Guidelines for Codeine and CYP2D6 - https://www.pharmgkb.org/documents/pa164743470",
  "CYP2C19": "CPIC Guidelines for Clopidogrel and CYP2C19 - https://www.pharmgkb.org/documents/pa165990037",
  "SLCO1B1": "CPIC Guidelines for Simvastatin and SLCO1B1 - https://www.pharmgkb.org/documents/pa164491475",
  "TPMT": "CPIC Guidelines for Azathioprine and TPMT - https://www.pharmgkb.org/documents/pa164493395",
  "DPYD": "CPIC Guidelines for Fluorouracil and DPYD - https://www.pharmgkb.org/documents/pa164493428"
};

router.post('/analyze', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a VCF file' });
    }

    const drugs = req.body.drugs as string;
    const patientId = req.body.patient_id as string | undefined;

    if (!drugs) {
      return res.status(400).json({ error: 'Please select at least one drug' });
    }

    const drugList = drugs.split(',').map(d => d.trim().toUpperCase());
    
    for (const drug of drugList) {
      if (!validateDrug(drug)) {
        return res.status(400).json({ 
          error: `Unsupported drug: ${drug}. Supported: ${settings.supported_drugs.join(', ')}` 
        });
      }
    }

    let parsedVcf, filteredVariants, numVariants;
    try {
      const result = parseVcfFile(req.file.buffer);
      parsedVcf = result.parsed;
      filteredVariants = result.filtered;
      numVariants = result.numVariants;
    } catch (e) {
      return res.status(400).json({ error: `VCF parsing error: ${e}` });
    }

    const sampleName = parsedVcf.sample_names[0] || "Unknown";
    const finalPatientId = patientId || `PATIENT_${sampleName.toUpperCase()}`;

    const results = [];

    for (const drug of drugList) {
      const genes = getGenesForDrug(drug);
      
      const parser = new VCFParser();
      
      if (drug === "WARFARIN") {
        const cyp2c9Variants = filteredVariants
          .filter(v => (v.info["GENE"] as string || "").toUpperCase() === "CYP2C9")
          .map(v => parser.extractRsidInfo(v));
        
        const vkorc1Variants = filteredVariants
          .filter(v => (v.info["GENE"] as string || "").toUpperCase() === "VKORC1")
          .map(v => parser.extractRsidInfo(v));
        
        // No variants = wild-type (*1/*1), continue with analysis
        if (cyp2c9Variants.length === 0 && vkorc1Variants.length === 0) {
          console.log("[GENOTYPE INFERENCE] No variants for Warfarin genes - assuming *1/*1, NM");
        }
        
        const cyp2c9Diplotype = buildDiplotype("CYP2C9", cyp2c9Variants);
        const vkorc1Diplotype = buildDiplotype("VKORC1", vkorc1Variants);
        const warfarinResult = calculateWarfarinSensitivity(cyp2c9Variants, vkorc1Variants);
        
        let riskLabel: string;
        let severity: string;
        let doseAdjustment: string;
        let alternativeDrugs: string[];
        
        if (warfarinResult.cyp2c9_phenotype === "PM") {
          riskLabel = "Toxic";
          severity = "high";
          doseAdjustment = `Reduce warfarin dose by ${warfarinResult.dose_reduction_percent}%. Use alternative anticoagulants if possible.`;
          alternativeDrugs = ["APIXABAN", "RIVAROXABAN", "DABIGATRAN"];
        } else if (warfarinResult.cyp2c9_phenotype === "IM" || vkorc1Variants.length > 0) {
          riskLabel = "Adjust Dosage";
          severity = "moderate";
          doseAdjustment = `Reduce warfarin dose by ${warfarinResult.dose_reduction_percent}%. Frequent INR monitoring required.`;
          alternativeDrugs = ["APIXABAN", "RIVAROXABAN", "DABIGATRAN"];
        } else {
          riskLabel = "Safe";
          severity = "none";
          doseAdjustment = "Standard warfarin dosing. Target INR 2-3.";
          alternativeDrugs = [];
        }
        
        const allVariants = [...cyp2c9Variants, ...vkorc1Variants];
        const cpicReference = CPIC_REFS["CYP2C9"];
        
        const llmExplanation = await generateExplanation(
          "WARFARIN",
          `CYP2C9 ${cyp2c9Diplotype.diplotype}, VKORC1 ${vkorc1Diplotype.diplotype}`,
          warfarinResult.cyp2c9_phenotype,
          drug,
          allVariants,
          cpicReference
        );
        
        const result = {
          patient_id: finalPatientId,
          drug,
          timestamp: new Date().toISOString() + "Z",
          risk_assessment: {
            risk_label: riskLabel,
            confidence_score: 0.92,
            severity: severity
          },
          pharmacogenomic_profile: {
            primary_gene: "CYP2C9",
            diplotype: cyp2c9Diplotype.diplotype,
            phenotype: warfarinResult.cyp2c9_phenotype,
            detected_variants: allVariants
          },
          clinical_recommendation: {
            dose_adjustment: doseAdjustment,
            alternative_drugs: alternativeDrugs,
            cpic_guideline_reference: cpicReference
          },
          llm_generated_explanation: llmExplanation,
          quality_metrics: {
            vcf_parsing_success: true,
            num_variants_parsed: numVariants,
            notes: `Warfarin: CYP2C9=${warfarinResult.cyp2c9_phenotype}, VKORC1=${warfarinResult.vkorc1_phenotype}. Dose reduction: ${warfarinResult.dose_reduction_percent}%`
          }
        };
        
        results.push(result);
      } else {
        const gene = genes[0];
        
        const geneVariants = filteredVariants
          .filter(v => (v.info["GENE"] as string || "").toUpperCase() === gene)
          .map(v => parser.extractRsidInfo(v));

        // No variants = wild-type (*1/*1), continue with genotype inference
        if (geneVariants.length === 0) {
          console.log(`[GENOTYPE INFERENCE] No variants for ${gene} - assuming *1/*1, NM`);
        }

        console.log(`[DETERMINISTIC] Building diplotype for ${gene}...`);
        
        const diplotypeResult = buildDiplotype(gene, geneVariants);
        console.log(`[DETERMINISTIC] Diplotype: ${diplotypeResult.diplotype}, Phenotype: ${diplotypeResult.phenotype}`);
        
        const ruleResult = applyRule(gene, diplotypeResult.phenotype);
        console.log(`[DETERMINISTIC] Risk: ${ruleResult.risk_label}, Severity: ${ruleResult.severity}`);
        
        const diplotype = diplotypeResult.diplotype;
        const phenotype = diplotypeResult.phenotype;
        const riskLabel = ruleResult.risk_label;
        const severity = ruleResult.severity;
        const doseAdjustment = ruleResult.dose_adjustment;
        const alternativeDrugs = ruleResult.alternative_drugs;
        const confidenceScore = ruleResult.confidence_score;
        const cpicReference = CPIC_REFS[gene] || "CPIC Guidelines";

        console.log(`Final result: ${diplotype} (${phenotype}) - ${riskLabel}`);
        
        const llmExplanation = await generateExplanation(
          gene,
          diplotype,
          phenotype,
          drug,
          geneVariants,
          cpicReference
        );

        const result = {
          patient_id: finalPatientId,
          drug,
          timestamp: new Date().toISOString() + "Z",
          risk_assessment: {
            risk_label: riskLabel,
            confidence_score: confidenceScore,
            severity: severity
          },
          pharmacogenomic_profile: {
            primary_gene: gene,
            diplotype: diplotype,
            phenotype: phenotype,
            detected_variants: diplotypeResult.variants
          },
          clinical_recommendation: {
            dose_adjustment: doseAdjustment,
            alternative_drugs: alternativeDrugs,
            cpic_guideline_reference: cpicReference
          },
          llm_generated_explanation: llmExplanation,
          quality_metrics: {
            vcf_parsing_success: true,
            num_variants_parsed: numVariants,
            notes: `Deterministic genotype parsing. ${gene} ${diplotype} diplotype → ${phenotype} phenotype.`
          }
        };

        results.push(result);
      }
    }

    if (results.length === 1) {
      return res.json(results[0]);
    } else {
      return res.json(results);
    }
  } catch (e) {
    console.error('Analysis error:', e);
    return res.status(500).json({ error: `Analysis failed: ${e}` });
  }
});

export default router;
