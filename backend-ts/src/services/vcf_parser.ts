export interface VCFVariant {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string;
  qual: string | null;
  filter: string | null;
  info: Record<string, string | boolean>;
  format_fields: string[] | null;
  sample_data: string[] | null;
}

export interface ParsedVCF {
  header: Record<string, string>;
  variants: VCFVariant[];
  sample_names: string[];
}

export class VCFParser {
  TARGET_GENES = new Set(["CYP2D6", "CYP2C19", "CYP2C9", "VKORC1", "SLCO1B1", "TPMT", "DPYD"]);
  
  header: Record<string, string> = {};
  variants: VCFVariant[] = [];
  sample_names: string[] = [];

  parseInfoField(infoStr: string): Record<string, string | boolean> {
    const infoDict: Record<string, string | boolean> = {};
    if (!infoStr || infoStr === ".") return infoDict;
    
    for (const item of infoStr.split(";")) {
      if (item.includes("=")) {
        const eqIndex = item.indexOf("=");
        const key = item.substring(0, eqIndex);
        const value = item.substring(eqIndex + 1);
        infoDict[key] = value;
      } else {
        infoDict[item] = true;
      }
    }
    return infoDict;
  }

  parseFormatField(formatStr: string): string[] {
    if (!formatStr || formatStr === ".") return [];
    return formatStr.split(":");
  }

  parseLine(line: string): VCFVariant | null {
    if (line.startsWith("#")) return null;
    
    const parts = line.trim().split("\t");
    if (parts.length < 8) return null;
    
    const chrom = parts[0];
    const pos = parseInt(parts[1], 10);
    const idField = parts[2];
    const ref = parts[3];
    const alt = parts[4];
    const qual = parts[5] !== "." ? parts[5] : null;
    const filterField = parts[6] !== "." ? parts[6] : null;
    const info = this.parseInfoField(parts[7]);
    
    let formatFields: string[] | null = null;
    let sampleData: string[] | null = null;
    if (parts.length > 8) {
      formatFields = this.parseFormatField(parts[8]);
    }
    if (parts.length > 9) {
      sampleData = parts[9] ? parts[9].split(":") : null;
    }
    
    return {
      chrom,
      pos,
      id: idField,
      ref,
      alt,
      qual,
      filter: filterField,
      info,
      format_fields: formatFields,
      sample_data: sampleData
    };
  }

  parseHeader(lines: string[]): void {
    for (const line of lines) {
      if (line.startsWith("##")) {
        const match = line.match(/##(\w+)=(.+)/);
        if (match) {
          this.header[match[1]] = match[2];
        }
      } else if (line.startsWith("#CHROM")) {
        const parts = line.trim().split("\t");
        if (parts.length > 9) {
          this.sample_names = parts.slice(9);
        }
      }
    }
  }

  parse(content: string): ParsedVCF {
    const lines = content.trim().split("\n");
    
    const headerLines: string[] = [];
    const dataLines: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith("#")) {
        headerLines.push(line);
      } else {
        dataLines.push(line);
      }
    }
    
    this.parseHeader(headerLines);
    
    this.variants = [];
    for (const line of dataLines) {
      const variant = this.parseLine(line);
      if (variant) {
        this.variants.push(variant);
      }
    }
    
    return {
      header: this.header,
      variants: this.variants,
      sample_names: this.sample_names
    };
  }

  filterByGenes(variants: VCFVariant[], genes?: Set<string>): VCFVariant[] {
    if (!genes) genes = this.TARGET_GENES;
    
    const filtered: VCFVariant[] = [];
    for (const variant of variants) {
      const gene = (variant.info["GENE"] as string || "").toUpperCase();
      if (genes.has(gene)) {
        filtered.push(variant);
      }
    }
    return filtered;
  }

  extractStarAlleles(variants: VCFVariant[]): Record<string, string[]> {
    const starAlleles: Record<string, string[]> = {};
    
    for (const variant of variants) {
      const gene = (variant.info["GENE"] as string || "").toUpperCase();
      const star = variant.info["STAR"] as string;
      
      if (gene && star) {
        if (!starAlleles[gene]) {
          starAlleles[gene] = [];
        }
        starAlleles[gene].push(star);
      }
    }
    
    return starAlleles;
  }

  extractRsidInfo(variant: VCFVariant): { rsid: string; pos: string; alt: string; info: Record<string, string>; gt: string | null } {
    const gt = variant.sample_data && variant.format_fields 
      ? variant.sample_data[variant.format_fields.indexOf("GT")] || null
      : null;
    return {
      rsid: variant.id && variant.id !== "." ? variant.id : `chr${variant.chrom}:${variant.pos}`,
      pos: `${variant.chrom}:${variant.pos}`,
      alt: variant.alt,
      gt,
      info: {
        STAR: (variant.info["STAR"] as string) || "",
        GENE: (variant.info["GENE"] as string) || ""
      }
    };
  }
}

export function parseVcfFile(fileContent: Buffer): { parsed: ParsedVCF; filtered: VCFVariant[]; numVariants: number } {
  const content = fileContent.toString("utf-8");
  const parser = new VCFParser();
  const parsed = parser.parse(content);
  const filtered = parser.filterByGenes(parsed.variants);
  return { parsed, filtered, numVariants: parsed.variants.length };
}
