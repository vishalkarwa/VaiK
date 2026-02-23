export interface DiplotypeResult {
  gene: string;
  diplotype: string;
  phenotype: string;
  variants: Record<string, unknown>[];
}

const STAR_ALLELE_FUNCTIONS: Record<string, string> = {
  "*1": "normal",
  "*2": "normal",
  "*3": "no",
  "*4": "no",
  "*5": "no",
  "*6": "no",
  "*7": "no",
  "*8": "no",
  "*9": "decreased",
  "*10": "decreased",
  "*11": "normal",
  "*12": "normal",
  "*14": "no",
  "*15": "no",
  "*17": "increased",
  "*29": "decreased",
  "*41": "decreased",
  "*1xN": "increased",
  "*2xN": "increased",
  "*4xN": "increased",
  "*10xN": "increased",
  "*36": "no",
};

const CYP2C19_FUNCTIONS: Record<string, string> = {
  "*1": "normal",
  "*2": "no",
  "*3": "no",
  "*4": "no",
  "*5": "no",
  "*6": "no",
  "*7": "no",
  "*8": "no",
  "*17": "increased",
};

const CYP2C9_FUNCTIONS: Record<string, string> = {
  "*1": "normal",
  "*2": "decreased",
  "*3": "no",
  "*5": "decreased",
  "*6": "decreased",
  "*8": "decreased",
  "*11": "decreased",
};

const SLCO1B1_FUNCTIONS: Record<string, string> = {
  "*5": "decreased",
  "*17": "decreased",
  "*1B": "normal",
};

const TPMT_FUNCTIONS: Record<string, string> = {
  "*1": "normal",
  "*2": "no",
  "*3A": "no",
  "*3B": "no",
  "*3C": "no",
  "*4": "no",
  "*6": "no",
};

const VKORC1_FUNCTIONS: Record<string, string> = {
  "*1": "normal",
  "*2": "decreased",
  "*3": "decreased",
};

const DPYD_FUNCTIONS: Record<string, string> = {
  "*1": "normal",
  "*2A": "no",
  "*13": "no",
  "*14": "no",
  "*15": "no",
  "*16": "no",
  "*17": "decreased",
  "*18": "no",
  "*19": "no",
  "*20": "no",
  "*21": "no",
  "*29": "decreased",
  "*30": "decreased",
  "*31": "decreased",
  "*32": "decreased",
  "*34": "decreased",
  "*35": "decreased",
};

function getAlleleFunction(allele: string, gene: string): string {
  const normalized = allele.toUpperCase();
  if (gene === "CYP2D6") return STAR_ALLELE_FUNCTIONS[normalized] || "unknown";
  if (gene === "CYP2C19") return CYP2C19_FUNCTIONS[normalized] || (STAR_ALLELE_FUNCTIONS[normalized] || "unknown");
  if (gene === "CYP2C9") return CYP2C9_FUNCTIONS[normalized] || "unknown";
  if (gene === "VKORC1") return VKORC1_FUNCTIONS[normalized] || "unknown";
  if (gene === "SLCO1B1") return SLCO1B1_FUNCTIONS[normalized] || "unknown";
  if (gene === "TPMT") return TPMT_FUNCTIONS[normalized] || "unknown";
  if (gene === "DPYD") return DPYD_FUNCTIONS[normalized] || "unknown";
  return "unknown";
}

function getActivityScore(allele: string, gene: string): number {
  const func = getAlleleFunction(allele, gene);
  const scores: Record<string, Record<string, number>> = {
    "CYP2D6": { "no": 0, "decreased": 0.5, "normal": 1, "increased": 2, "unknown": 1 },
    "CYP2C19": { "no": 0, "decreased": 0.5, "normal": 1, "increased": 1.5, "unknown": 1 },
    "CYP2C9": { "no": 0, "decreased": 0.5, "normal": 1, "increased": 1, "unknown": 1 },
    "SLCO1B1": { "no": 0, "decreased": 0.5, "normal": 1, "increased": 1, "unknown": 1 },
    "TPMT": { "no": 0, "decreased": 0.5, "normal": 1, "increased": 2, "unknown": 1 },
    "DPYD": { "no": 0, "decreased": 0.5, "normal": 1, "increased": 1, "unknown": 1 }
  };
  return scores[gene]?.[func] ?? 1;
}

function parseGT(gt: string | null): { isVariant: boolean; isHomozygous: boolean; isHeterozygous: boolean } {
  if (!gt || gt === "./." || gt === ".") {
    return { isVariant: false, isHomozygous: false, isHeterozygous: false };
  }
  
  const normalized = gt.replace(/\|/g, "/");
  
  if (normalized === "0/0") {
    return { isVariant: false, isHomozygous: false, isHeterozygous: false };
  }
  
  const parts = normalized.split("/");
  if (parts.length !== 2) {
    return { isVariant: false, isHomozygous: false, isHeterozygous: false };
  }
  
  const [a, b] = parts;
  const isHeterozygous = (a === "0" && b !== "0") || (b === "0" && a !== "0");
  const isHomozygous = a !== "0" && b !== "0" && a === b;
  const isVariant = isHeterozygous || isHomozygous;
  
  return { isVariant, isHomozygous, isHeterozygous };
}

function calculatePhenotype(diplotype: string, gene: string): string {
  const alleles = diplotype.split("/");
  let totalScore = 0;
  
  for (const allele of alleles) {
    totalScore += getActivityScore(allele, gene);
  }
  
  const hasNoFunction = alleles.some(a => getAlleleFunction(a, gene) === "no");
  const hasDecreased = alleles.some(a => getAlleleFunction(a, gene) === "decreased");
  const hasIncreased = alleles.some(a => getAlleleFunction(a, gene) === "increased");
  
  if (gene === "CYP2D6") {
    if (hasNoFunction && alleles.every(a => getAlleleFunction(a, gene) === "no")) return "PM";
    if (hasNoFunction) return "IM";
    if (totalScore >= 2.25) return "URM";
    if (totalScore >= 1.25) return "NM";
    return "IM";
  }
  
  if (gene === "CYP2C19") {
    if (hasNoFunction && alleles.every(a => getAlleleFunction(a, gene) === "no")) return "PM";
    if (hasNoFunction) return "IM";
    if (hasIncreased && alleles.every(a => getAlleleFunction(a, gene) === "increased")) return "UM";
    if (hasIncreased) return "RM";
    if (totalScore >= 1.5) return "NM";
    return "IM";
  }
  
  if (gene === "CYP2C9") {
    if (hasNoFunction && alleles.every(a => getAlleleFunction(a, gene) === "no")) return "PM";
    if (hasNoFunction || hasDecreased) return "IM";
    return "NM";
  }
  
  if (gene === "VKORC1") {
    if (hasNoFunction || hasDecreased) return "IM";
    return "NM";
  }
  
  if (gene === "SLCO1B1") {
    if (hasNoFunction && alleles.every(a => getAlleleFunction(a, gene) === "no")) return "PM";
    if (hasNoFunction || hasDecreased) return "IM";
    return "NM";
  }
  
  if (gene === "TPMT" || gene === "DPYD") {
    if (hasNoFunction && alleles.every(a => getAlleleFunction(a, gene) === "no")) return "PM";
    if (hasNoFunction || hasDecreased) return "IM";
    return "NM";
  }
  
  return "Unknown";
}

function constructDiplotype(starAlleles: string[]): string {
  if (starAlleles.length === 0) return "*1/*1";
  if (starAlleles.length === 1) return `*1/${starAlleles[0]}`;
  
  const unique = [...new Set(starAlleles)];
  if (unique.length === 1) {
    return `${unique[0]}/${unique[0]}`;
  }
  
  const sorted = unique.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, "") || "1");
    const numB = parseInt(b.replace(/\D/g, "") || "1");
    return numA - numB;
  });
  
  return `${sorted[0]}/${sorted[1]}`;
}

export function buildDiplotype(gene: string, variants: Record<string, unknown>[]): DiplotypeResult {
  const variantInfo: Record<string, unknown>[] = [];
  const alleleList: string[] = [];
  
  for (const v of variants) {
    const star = (v.info as Record<string, string>)?.STAR || "";
    const gt = v.gt as string | null;
    
    if (!star) continue;
    
    const gtResult = parseGT(gt);
    if (!gtResult.isVariant) continue;
    
    variantInfo.push(v);
    
    if (gtResult.isHomozygous) {
      alleleList.push(star, star);
    } else {
      alleleList.push(star);
    }
  }
  
  let starAlleles: string[];
  
  if (alleleList.length === 0) {
    starAlleles = ["*1"];
  } else if (alleleList.length === 1) {
    starAlleles = ["*1", alleleList[0]];
  } else {
    starAlleles = alleleList;
  }
  
  const diplotype = constructDiplotype(starAlleles);
  const phenotype = calculatePhenotype(diplotype, gene);
  
  return {
    gene,
    diplotype,
    phenotype,
    variants: variantInfo
  };
}

export interface WarfarinSensitivityResult {
  cyp2c9_phenotype: string;
  vkorc1_phenotype: string;
  combined_sensitivity: string;
  dose_reduction_percent: number;
}

export function calculateWarfarinSensitivity(
  cyp2c9Variants: Record<string, unknown>[],
  vkorc1Variants: Record<string, unknown>[]
): WarfarinSensitivityResult {
  const cyp2c9Result = buildDiplotype("CYP2C9", cyp2c9Variants);
  const vkorc1Result = buildDiplotype("VKORC1", vkorc1Variants);
  
  const cyp2c9Pheno = cyp2c9Result.phenotype;
  const vkorc1Pheno = vkorc1Result.phenotype;
  
  let doseReduction = 0;
  let sensitivity = "Normal";
  
  if (cyp2c9Pheno === "PM" || vkorc1Pheno === "Increased Sensitivity") {
    if (cyp2c9Pheno === "PM" && vkorc1Pheno === "Increased Sensitivity") {
      sensitivity = "High";
      doseReduction = 60;
    } else if (cyp2c9Pheno === "PM") {
      sensitivity = "High";
      doseReduction = 50;
    } else if (vkorc1Pheno === "Increased Sensitivity") {
      sensitivity = "Moderate";
      doseReduction = 30;
    }
  } else if (cyp2c9Pheno === "IM" || vkorc1Pheno === "Increased Sensitivity") {
    if (cyp2c9Pheno === "IM" && vkorc1Pheno === "Increased Sensitivity") {
      sensitivity = "Moderate-High";
      doseReduction = 40;
    } else if (cyp2c9Pheno === "IM") {
      sensitivity = "Moderate";
      doseReduction = 25;
    } else {
      sensitivity = "Moderate";
      doseReduction = 20;
    }
  } else {
    sensitivity = "Normal";
    doseReduction = 0;
  }
  
  return {
    cyp2c9_phenotype: cyp2c9Pheno,
    vkorc1_phenotype: vkorc1Pheno,
    combined_sensitivity: sensitivity,
    dose_reduction_percent: doseReduction
  };
}
