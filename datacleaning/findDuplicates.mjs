import fs from "fs";
import xlsx from "xlsx";

const loadData = (filePath) => {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: "" });
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const findExactDuplicates = (data) => {
  const seen = new Map();
  const duplicates = [];

  data.forEach((row, index) => {
    const snippet = String(row.snippet || "").trim();
    const tool = normalize(row.tool);
    const lang = normalize(row.lang);

    if (!snippet) return;

    const key = `${tool}||${lang}||${snippet}`;

    if (seen.has(key)) {
      duplicates.push({ index, ...row, duplicateOf: seen.get(key) });
    } else {
      seen.set(key, index); // first occurrence
    }
  });

  return duplicates;
};

const exportDuplicates = (duplicates, filename = "exact_duplicates.json") => {
  fs.writeFileSync(filename, JSON.stringify(duplicates, null, 2));
  console.log(`✅ Found ${duplicates.length} exact duplicates`);
  console.log(`💾 Saved to ${filename}`);
};

const main = () => {
  const filePath = "./ai_code_dataset.csv"; // ← change this if needed
  const data = loadData(filePath);
  const duplicates = findExactDuplicates(data);
  exportDuplicates(duplicates);
};

main();
