const { parseVcfFile } = require('./dist/services/vcf_parser');
const fs = require('fs');

const content = fs.readFileSync('../tests/data/sample_pm_clopidogrel.vcf');
const result = parseVcfFile(content);

console.log('All variants:');
result.parsed.variants.forEach((v, i) => {
  console.log(`Variant ${i}:`, {
    gene: v.info["GENE"],
    geneRaw: v.info,
    chrom: v.chrom,
    pos: v.pos,
    id: v.id
  });
});
