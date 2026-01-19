// I tried to make the code simpler to understand with chatGPT
// But even with many debugging steps, THIS CODE DOES NOT WORK CORRECTLY

async function transformInputFileToLines(
  inputPath: string = "5/sample.txt"
): Promise<{ pageOrderingRules: number[][]; pagesToProduce: number[][] }> {
  const inputString = await Bun.file(inputPath).text();

  const [rawPageOrderingRules, rawPagesToProduce] = inputString
    .trim()
    .split("\n\n");

  const pageOrderingRules = rawPageOrderingRules
    .trim()
    .split("\n")
    .map((line) => line.split("|").map(Number));

  const pagesToProduce = rawPagesToProduce
    .trim()
    .split("\n")
    .map((line) => line.split(",").map(Number));

  return { pageOrderingRules, pagesToProduce };
}

const { pageOrderingRules, pagesToProduce } = await transformInputFileToLines();

// Step 1: Create a dependency map
function createDependencyMap(rules: number[][]): Map<number, Set<number>> {
  const dependencyMap = new Map<number, Set<number>>();

  for (const [a, b] of rules) {
    if (!dependencyMap.has(b)) dependencyMap.set(b, new Set());
    dependencyMap.get(b)!.add(a); // b depends on a
  }

  console.log("Final Dependency Map:", dependencyMap);
  return dependencyMap;
}
const dependencyMap = createDependencyMap(pageOrderingRules);

// Step 2: Check if an order is valid
function isOrderValid(
  order: number[],
  dependencyMap: Map<number, Set<number>>
): boolean {
  const seen = new Set<number>();
  console.log(`Validating order: ${order}`);

  for (const page of order) {
    const dependencies = dependencyMap.get(page) || new Set();

    for (const dep of dependencies) {
      if (!seen.has(dep)) {
        console.log(
          `  ❌ Invalid: ${page} depends on ${dep}, but ${dep} has not been processed.`
        );
        return false;
      }
    }

    seen.add(page);
  }

  console.log(`  ✅ Valid Order: ${order}`);
  return true;
}

// Step 3: Sort a page order to make it valid
function sortOrder(
  order: number[],
  dependencyMap: Map<number, Set<number>>
): number[] {
  const dependencyCount = new Map<number, number>();
  const pages = new Set(order);

  for (const page of pages) {
    dependencyCount.set(page, 0);
  }

  for (const [page, dependencies] of dependencyMap.entries()) {
    if (!pages.has(page)) continue;

    for (const dep of dependencies) {
      if (pages.has(dep)) {
        dependencyCount.set(page, (dependencyCount.get(page) || 0) + 1);
      }
    }
  }

  const sorted: number[] = [];
  const queue = [...pages].filter((page) => dependencyCount.get(page) === 0);

  console.log("Initial Dependency Counts:", [...dependencyCount.entries()]);
  console.log("Initial Queue:", queue);

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const [page, dependencies] of dependencyMap.entries()) {
      if (dependencies.has(current)) {
        dependencyCount.set(page, (dependencyCount.get(page) || 0) - 1);

        if (dependencyCount.get(page) === 0) {
          queue.push(page);
        }
      }
    }
  }

  console.log("Sorted Order:", sorted);
  return sorted;
}

// Step 4: Process the pages
const validPages = pagesToProduce.filter((line) =>
  isOrderValid(line, dependencyMap)
);

console.log("Valid Pages:", validPages);

const invalidPages = pagesToProduce.filter(
  (line) => !isOrderValid(line, dependencyMap)
);
console.log("Invalid Pages Before Sorting:", invalidPages);

const correctedInvalidPages = invalidPages.map((line) =>
  sortOrder(line, dependencyMap)
);
console.log("Corrected Invalid Pages:", correctedInvalidPages);

const correctedValidPages = correctedInvalidPages.filter((line) =>
  isOrderValid(line, dependencyMap)
);

console.log("Corrected Valid Pages:", correctedValidPages);

const addMiddleElements = (pages: number[][]): number => {
  return pages.reduce((acc, line) => {
    if (isOrderValid(line, dependencyMap)) {
      const middleValue = line[Math.floor(line.length / 2)];
      console.log(`Processing line: ${line}, middle value: ${middleValue}`);
      acc += middleValue;
    }
    return acc;
  }, 0);
};

const result = addMiddleElements(correctedValidPages);
console.log("Final Result:", result);
