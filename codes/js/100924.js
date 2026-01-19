// written by ChatGPT

const fs = require("fs");
const path = require("path");

const includedFiles = new Set();

function expandIncludes(filePath, currentDir = process.cwd()) {
  if (includedFiles.has(filePath)) return "";
  includedFiles.add(filePath);

  const fullPath = path.resolve(currentDir, filePath);
  const dir = path.dirname(fullPath);
  let content = fs.readFileSync(fullPath, "utf-8");
  let result = `#line 1 ${JSON.stringify(fullPath)}\n`;

  const includeRegex = /^[ \t]*#\s*include\s*"(.+)"/gm;
  let match;
  let lastIndex = 0;

  while ((match = includeRegex.exec(content)) !== null) {
    const [includeDirective, includePath] = match;
    const beforeInclude = content.slice(lastIndex, match.index);
    lastIndex = includeRegex.lastIndex;

    result += beforeInclude;
    result += `/* ${includeDirective} */\n`;
    result += expandIncludes(includePath, dir);
    result += `#line ${getLineNumber(content, match.index)} ${JSON.stringify(fullPath)}\n`;
  }

  result += content.slice(lastIndex);

  // If the current file is a header file, check for corresponding source file
  if (isHeaderFile(filePath)) {
    const sourceFile = getSourceFilePath(filePath, dir);
    if (sourceFile && fs.existsSync(sourceFile)) {
      result += expandIncludes(path.relative(dir, sourceFile), dir);
    }
  }

  return result;
}

function isHeaderFile(filePath) {
  return /\.(h|hpp)$/i.test(filePath);
}

function getSourceFilePath(headerFilePath, dir) {
  const baseName = path.basename(headerFilePath, path.extname(headerFilePath));
  const possibleExtensions = [".c", ".cpp"]; // Add other extensions if needed
  for (const ext of possibleExtensions) {
    const sourceFilePath = path.resolve(dir, baseName + ext);
    if (fs.existsSync(sourceFilePath)) {
      return sourceFilePath;
    }
  }
  return null;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

if (process.argv.length < 3) {
  console.error("Usage: node expand_includes.js <source-file>");
  process.exit(1);
}

const sourceFile = process.argv[2];
const expandedSource = expandIncludes(sourceFile);
console.log(expandedSource);
