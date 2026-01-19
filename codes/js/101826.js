// THIS WAS FIRST MADE WITH COPILOT BECAUSE I REALLY COULDNT BE ARSED TO FIGURE IT OUT MYSELF

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Parse the XML sitemap
async function main() {
  try {
    const rootDir = process.cwd();
    const astroDir = path.join(rootDir, 'sanastro');
    
    // Read the generated sitemap.xml
    const sitemapPath = path.join(astroDir, 'dist', 'sitemap-index.xml');
    const fallbackPath = path.join(astroDir, 'dist', 'sitemap-0.xml');
    
    const sitemapExists = fs.existsSync(sitemapPath);
    const fallbackExists = fs.existsSync(fallbackPath);
    
    let sitemapXml;
    if (sitemapExists) {
      sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
    } else if (fallbackExists) {
      sitemapXml = fs.readFileSync(fallbackPath, 'utf8');
    } else {
      throw new Error('Sitemap file not found');
    }
    
    // Parse sitemap
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(sitemapXml);
    
    let urls = [];
    
    if (result.sitemapindex) {
      // It's a sitemap index, we need to fetch each sitemap
      for (const sitemap of result.sitemapindex.sitemap) {
        const loc = sitemap.loc[0];
        const filename = path.basename(loc);
        const individualSitemapPath = path.join(astroDir, 'dist', filename);
        
        if (fs.existsSync(individualSitemapPath)) {
          const individualSitemapXml = fs.readFileSync(individualSitemapPath, 'utf8');
          const individualResult = await parser.parseStringPromise(individualSitemapXml);
          if (individualResult.urlset && individualResult.urlset.url) {
            urls = [...urls, ...individualResult.urlset.url];
          }
        }
      }
    } else if (result.urlset && result.urlset.url) {
      // It's a direct sitemap
      urls = result.urlset.url;
    }

    // Process URLs to build a hierarchical site structure
    const siteTree = { name: 'home', children: {}, path: '/', count: 0 };
    const siteUrl = 'https://sanalog.net'; // Base URL to remove from paths
    
    urls.forEach(urlObj => {
      const fullUrl = urlObj.loc[0];
      // Remove the base URL to get the path
      let urlPath = fullUrl.replace(siteUrl, '');
      
      // Skip the home page as we already have it
      if (urlPath === '/' || urlPath === '') return;
      
      // Remove trailing slash if present
      if (urlPath.endsWith('/')) {
        urlPath = urlPath.slice(0, -1);
      }
      
      // Split the path into segments
      const segments = urlPath.split('/').filter(segment => segment);
      
      // Add to the tree structure
      let currentNode = siteTree;
      let currentPath = '';
      
      segments.forEach((segment, index) => {
        currentPath += '/' + segment;
        
        if (!currentNode.children[segment]) {
          currentNode.children[segment] = {
            name: segment,
            children: {},
            path: currentPath,
            count: 0
          };
        }
        
        // Increment count for parent nodes to track number of children
        currentNode.count++;
        
        // Move to the next level
        currentNode = currentNode.children[segment];
      });
    });
    
    // Generate Mermaid Mindmap diagram
    let mermaidDiagram = 'mindmap\n';
    
    function generateMindmap(node, indent = '', parentId = '') {
      // Create a unique ID for the node
      const nodeId = parentId ? `${parentId}_${node.name}` : node.name;
      
      // Format the node's name with proper capitalization
      let displayName = node.name;
      if (displayName !== 'home') {
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      }
      
      // Add the node to the diagram
      mermaidDiagram += `${indent}${nodeId}[${displayName}]\n`;
      
      // Add children count as a separate node if there are children
      if (node.count > 0) {
        const countNodeId = `${nodeId}_count`;
        mermaidDiagram += `${indent}  ${countNodeId}(${node.count}:::countNode)\n`;
      }
      
      // Add child nodes
      Object.values(node.children).forEach(child => {
        generateMindmap(child, indent + '  ', nodeId);
      });
    }
    
    // Start generating the mindmap
    generateMindmap(siteTree);
    
    // Add custom styling for Obsidian-like graph
    mermaidDiagram += `
    classDef default fill:#282a36,stroke:#bd93f9,color:#f8f8f2,stroke-width:2px
    classDef countNode fill:#44475a,stroke:#50fa7b,color:#f8f8f2,stroke-width:1px,font-size:14px
    `;
    

    
    // Generate ASCII tree for alternative view
    let asciiTree = 'Site Structure\n============\n\n';
    
    function generateAsciiTree(node, indent = '') {
      const entries = Object.entries(node.children);
      
      entries.forEach(([key, childNode], index) => {
        const isLast = index === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        
        asciiTree += `${indent}${connector}${childNode.name}\n`;
        
        if (Object.keys(childNode.children).length > 0) {
          const childIndent = indent + (isLast ? '    ' : '│   ');
          generateAsciiTree(childNode, childIndent);
        }
      });
    }
    
    generateAsciiTree(siteTree);
    
    // Create or update the markdown file
    const markdown = 
`---
# cover:
# coverAlt:
# banner:
# bannerAlt:

title: "Sitemap"
# description: ""
# author:
# publicationDate:
# creationDate: 
sortOrder: 1
---

<pre class="wide mermaid">
  ${mermaidDiagram}
</pre>

<details>
  <summary>DEBUG</summary>
  <pre>
    ${mermaidDiagram}
  </pre>
</details>

<details>
  <summary>ASCII version — click to expand</summary>
  <pre>
    ${asciiTree}
  </pre>
</details>

<br>

<span class="muted">last updated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
`;

    // Make sure the directory exists
    const outputDir = path.join(astroDir, 'src', 'content', 'blog');
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Write the markdown file to the new location
    fs.writeFileSync(path.join(outputDir, 'sitemap.md'), markdown);
    
    console.log('Sitemap diagram generated successfully at src/content/blog/sitemap.md!');
    
  } catch (error) {
    console.error('Error generating sitemap diagram:', error);
    process.exit(1);
  }
}

main();