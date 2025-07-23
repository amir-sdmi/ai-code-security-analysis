import fs from "fs";
import xlsx from "xlsx";
import _ from "lodash";
import Table from "cli-table3";

// Helper: Load Excel file
const loadData = (filePath) => {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws);
};

// Helper: Create and print table
const printTable = (title, rows) => {
  console.log(`\n=== ${title} ===`);
  const table = new Table({ head: Object.keys(rows[0]) });
  rows.forEach((row) => table.push(Object.values(row)));
  console.log(table.toString());
};

// Helper: Frequency count
const frequencyCount = (data, key) => {
  const counts = _.countBy(data, (row) => (row[key] || "").toLowerCase());
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ [key]: name, count: value }));
};

// Helper: Unique combinations
const combinationCount = (data, key1, key2) => {
  const combos = _.countBy(
    data,
    (row) => `${row[key1]?.toLowerCase()}||${row[key2]?.toLowerCase()}`
  );
  return Object.entries(combos).map(([combo, count]) => {
    const [k1, k2] = combo.split("||");
    return { [key1]: k1, [key2]: k2, count };
  });
};
const exportCombinedMatrixJSON = (data) => {
  const tools = [
    ...new Set(data.map((d) => (d.tool || "").toLowerCase())),
  ].sort();
  const phrases = [...new Set(data.map((d) => (d.phrase || "").toLowerCase()))]
    .filter(Boolean)
    .sort();
  const langs = [...new Set(data.map((d) => (d.lang || "").toLowerCase()))]
    .filter(Boolean)
    .sort();

  const columns = [...phrases, ...langs];
  const matrix = [];

  tools.forEach((tool) => {
    const row = { tool };

    columns.forEach((col) => {
      let count = 0;
      if (phrases.includes(col)) {
        count = data.filter(
          (d) =>
            (d.tool || "").toLowerCase() === tool &&
            (d.phrase || "").toLowerCase() === col
        ).length;
      } else if (langs.includes(col)) {
        count = data.filter(
          (d) =>
            (d.tool || "").toLowerCase() === tool &&
            (d.lang || "").toLowerCase() === col
        ).length;
      }
      row[col] = count;
    });

    matrix.push(row);
  });

  fs.writeFileSync("matrix_output.json", JSON.stringify(matrix, null, 2));
  console.log("\n✅ JSON file saved as matrix_output.json");
};

// Main
const main = async () => {
  const filePath = "./ai_code_dataset_cleaned.csv"; // or your real path
  const data = loadData(filePath);

  // Tool frequency
  const toolFreq = frequencyCount(data, "tool");
  printTable("Tool Frequency", toolFreq);

  // Phrase frequency
  const phraseFreq = frequencyCount(data, "phrase");
  printTable("Phrase Frequency", phraseFreq);

  // Language frequency
  const langFreq = frequencyCount(data, "lang");
  printTable("Language Frequency", langFreq);

  // Unique repos
  const uniqueRepos = new Set(data.map((d) => d.repo)).size;
  console.log(`\n=== Unique Repositories: ${uniqueRepos} ===`);

  // Top repos by snippet count
  const topRepos = _(data)
    .countBy("repo")
    .toPairs()
    .orderBy([1], ["desc"])
    .slice(0, 10)
    .map(([repo, count]) => ({ repo, count }))
    .value();
  printTable("Top Repositories by Snippet Count", topRepos);

  // LOC per tool
  const locStats = _(data)
    .groupBy((d) => d.tool?.toLowerCase())
    .map((items, tool) => {
      const locs = items.map((i) => parseFloat(i.loc) || 0);
      return {
        tool,
        count: locs.length,
        sum: _.sum(locs),
        avg: _.round(_.mean(locs), 2),
        min: _.min(locs),
        max: _.max(locs),
        median: _.round(_.sortBy(locs)[Math.floor(locs.length / 2)] || 0, 2),
      };
    })
    .orderBy("sum", "desc")
    .value();
  printTable("LOC per Tool", locStats);

  // Tool + Language
  const toolLang = combinationCount(data, "tool", "lang");
  printTable("Tool + Language Combination", toolLang); // show top 10

  // Tool + Phrase
  const toolPhrase = combinationCount(data, "tool", "phrase");
  printTable("Tool + Phrase Combination", toolPhrase);

  // Language + Phrase
  const langPhrase = combinationCount(data, "lang", "phrase");
  printTable("Language + Phrase Combination", langPhrase);

  // Distinct sorted sets

  exportCombinedMatrixJSON(data);
};

main();
