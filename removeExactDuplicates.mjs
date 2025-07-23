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

const removeExactDuplicates = (data) => {
  const seen = new Set();
  const uniqueRows = [];

  data.forEach((row) => {
    const snippet = String(row.snippet || "").trim();
    const tool = normalize(row.tool);
    const lang = normalize(row.lang);

    if (!snippet) return;

    const key = `${tool}||${lang}||${snippet}`;

    if (!seen.has(key)) {
      seen.add(key);
      uniqueRows.push(row);
    }
  });

  return uniqueRows;
};

const saveAsCSV = (data, filename = "ai_code_dataset_cleaned.csv") => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Cleaned");
  xlsx.writeFile(workbook, filename);
  console.log(`✅ Saved cleaned dataset as ${filename} (${data.length} rows)`);
};

const main = () => {
  const filePath = "./ai_code_dataset.csv"; // change if needed
  const data = loadData(filePath);
  const cleaned = removeExactDuplicates(data);
  saveAsCSV(cleaned);
};

main();
