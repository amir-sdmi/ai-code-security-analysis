import fs from "fs";
import xlsx from "xlsx";

const loadData = (filePath) => {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: "" });
};

const saveAsCSV = (data, filename = "ai_code_dataset_no_challenges.csv") => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Cleaned");
  xlsx.writeFile(workbook, filename);
  console.log(`✅ Saved cleaned dataset as ${filename} (${data.length} rows)`);
};

const challengeKeywords = [
  "leetcode",
  "codewars",
  "hackerrank",
  "geeksforgeeks",
  "edabit",
  "exercism",
  "coderbyte",
  "algoexpert",
  "interviewbit",
  "codesignal",
  "topcoder",
  "binarysearch.com",
  "projecteuler",
  "programiz",
  "daily challenge",
  "daily coding problem",
];

const removeChallengeRows = (data) => {
  const keywordCounts = Object.fromEntries(
    challengeKeywords.map((k) => [k, 0])
  );
  const removed = [];
  const cleaned = [];

  for (const row of data) {
    const text = `${row.snippet || ""} ${row.repo || ""}`.toLowerCase();
    const matchedKeyword = challengeKeywords.find((k) => text.includes(k));

    if (matchedKeyword) {
      keywordCounts[matchedKeyword]++;
      removed.push(row);
    } else {
      cleaned.push(row);
    }
  }

  console.log(`\n🧹 Total Removed: ${removed.length}`);
  console.log(`\n📊 Breakdown by Keyword:`);

  Object.entries(keywordCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([keyword, count]) =>
      console.log(`• ${keyword.padEnd(20)} ${count} rows`)
    );

  return cleaned;
};

const main = () => {
  const filePath = "./ai_code_dataset_cleaned.csv"; // change if needed
  const data = loadData(filePath);
  const cleaned = removeChallengeRows(data);
  saveAsCSV(cleaned);
};

main();
