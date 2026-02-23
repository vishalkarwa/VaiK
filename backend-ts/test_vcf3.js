const { VCFParser } = require('./dist/services/vcf_parser');
const fs = require('fs');

const content = fs.readFileSync('../tests/data/sample_pm_clopidogrel.vcf', 'utf-8');
const parser = new VCFParser();

// Manually parse first line
const lines = content.trim().split('\n');
const dataLine = lines[13]; // Line 14 (0-indexed: 13)

console.log('Data line:', dataLine);

const parts = dataLine.split('\t');
console.log('Parts:', parts.length);
console.log('INFO field:', parts[7]);

const info = parser.parseInfoField(parts[7]);
console.log('Parsed info:', info);
