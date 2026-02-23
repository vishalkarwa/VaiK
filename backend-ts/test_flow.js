const { parseVcfFile, VCFParser } = require('./dist/services/vcf_parser');
const { buildDiplotype } = require('./dist/services/diplotype_builder');
const fs = require('fs');

const content = fs.readFileSync('../tests/data/sample_pm_clopidogrel.vcf');
const result = parseVcfFile(content);

console.log('Filtered:', result.filtered.length);

const gene = 'CYP2C19';
const parser = new VCFParser();
const geneVariants = result.filtered
  .filter(v => (v.info["GENE"] || "").toUpperCase() === gene)
  .map(v => parser.extractRsidInfo(v));

console.log('Gene variants:', geneVariants);

const diplotypeResult = buildDiplotype(gene, geneVariants);
console.log('Diplotype:', diplotypeResult);
