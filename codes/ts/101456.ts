import { readSync } from "to-vfile";
import { matter } from "vfile-matter";

type frontmatterData = {
  [key: string]: string | frontmatterData;
};

export function parseFrontmatter(filePath: string): frontmatterData {
  const file = readSync(filePath);
  matter(file);
  return file.data.matter as any;
}

/**
 * CREATED WITH CHATGPT
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Helper function to convert camel case to title case
function camelCaseToTitleCase(camelCase: string) {
  return camelCase
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Helper function to get git timestamps
function getGitTimestamps(filePath: string) {
  const createdAt = execSync(
    `git log --diff-filter=A --format=%at -- ${filePath}`
  )
    .toString()
    .trim();
  const modifiedAt = execSync(`git log -1 --format=%at -- ${filePath}`)
    .toString()
    .trim();
  return {
    createdAt: parseInt(createdAt, 10),
    modifiedAt: parseInt(modifiedAt, 10),
  };
}

// Function to process files and directories
function processDirectory(directoryPath: string, root: string, outDir: string) {
  const files = fs.readdirSync(directoryPath, { withFileTypes: true });
  const pages = [];

  for (const file of files) {
    const filePath = path.join(directoryPath, file.name);
    const ext = path.extname(file.name);
    let title = "";
    let isMdx = false;
    let isFolder = false;
    let route = path.relative(root, filePath).replace(/\\/g, "/"); // Handle cross-platform paths

    if (file.isDirectory()) {
      isFolder = true;
      let indexFilePath = "";
      if (fs.existsSync(path.join(filePath, "index.mdx"))) {
        indexFilePath = path.join(filePath, "index.mdx");
        isMdx = true;
      } else if (fs.existsSync(path.join(filePath, "index.md"))) {
        indexFilePath = path.join(filePath, "index.md");
      }

      if (indexFilePath) {
        const frontmatter = parseFrontmatter(indexFilePath);
        title =
          typeof frontmatter.title === "string"
            ? frontmatter.title
            : camelCaseToTitleCase(path.basename(filePath));
        const { createdAt, modifiedAt } = getGitTimestamps(indexFilePath);

        pages.push({
          title,
          id: pages.length,
          isMdx,
          isFolder,
          createdAt,
          modifiedAt,
          ...frontmatter,
          route: path.relative(root, indexFilePath).replace(/\\/g, "/"),
        });
      }

      // Recursively process the folder and create pages.json inside it
      generatePagesJson(filePath, outDir + "/" + route);
    } else if (ext === ".mdx" || ext === ".md") {
      const frontmatter = ext === ".mdx" ? parseFrontmatter(filePath) : {};
      title =
        typeof frontmatter.title === "string"
          ? frontmatter.title
          : camelCaseToTitleCase(path.basename(filePath).slice(0, -ext.length));
      isMdx = ext === ".mdx";
      const { createdAt, modifiedAt } = getGitTimestamps(filePath);

      pages.push({
        title,
        id: pages.length,
        isMdx,
        isFolder,
        createdAt,
        modifiedAt,
        route,
        ...frontmatter,
      });
    }
  }

  return {
    directoryTitle: camelCaseToTitleCase(path.basename(directoryPath)),
    directoryDescription: "",
    pages,
  };
}

// Main function to generate pages.json
function generatePagesJson(root: string, outDir = "dist") {
  const distDir = path.join(outDir);
  fs.mkdirSync(distDir, { recursive: true });

  const rootPages = processDirectory(root, root, outDir);
  //   fs.writeFileSync(
  //     path.join(distDir, "pages.json"),
  //     JSON.stringify(rootPages, null, 2)
  //   );
  console.log(rootPages);
}

generatePagesJson("src");
