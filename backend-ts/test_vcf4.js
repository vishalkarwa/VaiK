const infoStr = "GENE=CYP2C19;STAR=*2;RS=rs4244285;CLNSIG=Pathogenic";
const items = infoStr.split(";");
console.log('Items:', items);

for (const item of items) {
  console.log('Item:', item, 'includes =:', item.includes("="));
  if (item.includes("=")) {
    const [key, value] = item.split("=", 1);
    console.log('  Key:', key, 'Value:', value);
  }
}
