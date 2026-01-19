// Enhanced Cognitive Complexity calculation logic in JavaScript

// Code written by ChatGPT

/**
 * Calculates the Cognitive Complexity of given Python-like code.
 * @param {string} code - The source code to analyze.
 * @returns {Object} - The total complexity and detailed breakdown.
 */
function calculateCognitiveComplexity(code) {
    let totalComplexity = 0;
    let nestingLevel = 0;
    const complexities = [];
  
    const lines = code.split('\n');
  
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
  
        let lineComplexity = 0;
        let reasons = [];
  
        // Match control flow structures
        if (/^if\b|^elif\b/.test(line)) {
            lineComplexity = 1 + nestingLevel;
            reasons.push(`+${lineComplexity} (if/elif, nesting=${nestingLevel})`);
        } else if (/^else:/.test(line)) {
            lineComplexity = 1;
            reasons.push('+1 (else)');
        } else if (/^for\b|^while\b/.test(line)) {
            lineComplexity = 1 + nestingLevel;
            reasons.push(`+${lineComplexity} (loop, nesting=${nestingLevel})`);
        } else if (/^except\b/.test(line)) {
            lineComplexity = 1;
            reasons.push('+1 (except)');
        } else if (/\bbreak\b|\bcontinue\b/.test(line)) {
            lineComplexity = 1;
            reasons.push('+1 (break/continue)');
        }
  
        // Handle boolean sequences
        if (/(\s(and|or)\s)/.test(line) && !/^elif\b/.test(line)) {
            lineComplexity += 1;
            reasons.push('+1 (boolean sequence)');
        }
  
        // Track nesting
        if (/^if\b|^elif\b|^for\b|^while\b/.test(line)) {
            nestingLevel++;
        }
  
        if (/\breturn\b|\bpass\b|\braise\b/.test(line)) {
            nestingLevel = Math.max(0, nestingLevel - 1);
        } else if (i < lines.length - 1 && lines[i + 1].trim().length > 0 &&
                   lines[i + 1].search(/\S/) <= line.search(/\S/)) {
            nestingLevel = Math.max(0, nestingLevel - 1);
        }
  
        totalComplexity += lineComplexity;
        complexities.push({ line: line, complexity: lineComplexity, reasons });
    }
  
    console.log("Total Cognitive Complexity:", totalComplexity);
    console.table(complexities);
  
    return {
        total: totalComplexity,
        lineComplexities: complexities.map(c => ({
            line: c.line,
            value: c.complexity,
            reason: c.reasons.join(', ')
        })),
        complexities
    };
  }
  
  // Example usage
  const exampleCode = `
    def example_function():
        if condition1:
            for i in range(10):
                if condition2:
                    continue
        else:
            print("Done")
        return
  `;
  
  const result = calculateCognitiveComplexity(exampleCode);
  console.log("Total Cognitive Complexity:", result.totalComplexity);
  console.table(result.complexities);
  
  // Export the function as default
  export default calculateCognitiveComplexity;