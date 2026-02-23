const item = "GENE=CYP2C19";
const result = item.split("=", 1);
console.log('Result:', result);
console.log('Destructuring:', [key, value] = result);
