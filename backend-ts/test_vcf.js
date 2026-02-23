const { parseVcfFile } = require('./dist/services/vcf_parser');
const fs = require('fs');

const content = fs.readFileSync('../tests/data/sample_pm_clopidogrel.vcf');
const result = parseVcfFile(content);

console.log('Total variants:', result.numVariants);
console.log('Filtered variants:', result.filtered.length);

result.filtered.forEach((v, i) => {
  console.log(`Variant ${i}:`, {
    gene: v.info["GENE"],
    star: v.info["STAR"],
    chrom: v.chrom,
    pos: v.pos,
    id: v.id
  });
});
