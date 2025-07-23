import xlsx from "xlsx";
import fs from "fs";

const FILE_PATH = "./ai_code_dataset_cleaned.csv"; // change this to your real dataset path

const analyzeDataset = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  const toolCount = new Map();
  const phraseCount = new Map();
  const langCount = new Map();

  for (const row of data) {
    const tool = row.tool?.toLowerCase();
    const phrase = row.phrase?.toLowerCase();
    const lang = row.lang?.toLowerCase();

    if (tool) toolCount.set(tool, (toolCount.get(tool) || 0) + 1);
    if (phrase) phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1);
    if (lang) langCount.set(lang, (langCount.get(lang) || 0) + 1);
  }

  const logStats = (title, map) => {
    console.log(`\n--- ${title} ---`);
    for (const [key, count] of map.entries()) {
      console.log(`${key}: ${count}`);
    }
  };

  logStats("Tool Count", toolCount);
  logStats("Phrase Count", phraseCount);
  logStats("Language Count", langCount);
};

analyzeDataset(FILE_PATH);
