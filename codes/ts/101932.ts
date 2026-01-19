import { AuditRequest, AuditResult, Finding, SeverityLevel } from "@shared/schema";
import { analyzeContractWithGemini } from "./geminiService";

// Basic patterns to check for common vulnerabilities in Solidity contracts
const vulnerabilityPatterns = [
  {
    id: "reentrancy",
    pattern: /(\w+)\.call\{.*\}\(.*\).*[\s\S]*?\1\s*=\s*0/gm,
    title: "Reentrancy Vulnerability",
    description: "External calls are made before state variables are updated, allowing a potential reentrancy attack.",
    severity: SeverityLevel.CRITICAL,
    recommendation: "Update state variables before making external calls to prevent reentrancy attacks."
  },
  {
    id: "tx-origin",
    pattern: /tx\.origin\s*==/g,
    title: "Unsafe tx.origin Usage",
    description: "Using tx.origin for authorization can lead to phishing attacks.",
    severity: SeverityLevel.HIGH,
    recommendation: "Use msg.sender instead of tx.origin for authorization checks."
  },
  {
    id: "unchecked-return",
    pattern: /\.transfer\(/g,
    title: "Unchecked Transfer Return Value",
    description: "Using transfer() for sending Ether will revert on failure, which might cause DOS conditions.",
    severity: SeverityLevel.MEDIUM,
    recommendation: "Consider using call() with return value checks instead."
  },
  {
    id: "storage-array-loop",
    pattern: /for\s*\(\s*\w+\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*(\w+)\.length\s*;/g,
    title: "Gas Optimization: Unnecessary Storage",
    description: "Using storage variables inside loops increases gas consumption significantly.",
    severity: SeverityLevel.MEDIUM,
    recommendation: "Cache the array length and use memory variables inside loops to reduce gas costs."
  },
  {
    id: "integer-overflow",
    pattern: /\+\+|\+=|--|-=/g,
    title: "Potential Integer Overflow/Underflow",
    description: "Integer operations without overflow/underflow checks can lead to unexpected behavior.",
    severity: SeverityLevel.MEDIUM,
    recommendation: "Use SafeMath library or Solidity 0.8.0+ which includes overflow checks by default."
  },
  {
    id: "timestamp-dependence",
    pattern: /block\.timestamp/g,
    title: "Timestamp Dependence",
    description: "Relying on block.timestamp can be manipulated by miners within a certain threshold.",
    severity: SeverityLevel.LOW,
    recommendation: "Avoid using block.timestamp for critical logic or random number generation."
  }
];

// Gas optimization patterns
const gasOptimizationPatterns = [
  {
    id: "storage-vs-memory",
    pattern: /storage\s+\w+\s*=/g,
    title: "Unnecessary Storage Usage",
    description: "Using storage variables when memory would suffice increases gas costs.",
    severity: SeverityLevel.LOW,
    recommendation: "Use 'memory' instead of 'storage' when you don't need to modify the state."
  },
  {
    id: "multiple-loop-iterations",
    pattern: /for\s*\(\s*.*;\s*.*;\s*.*\)\s*\{[\s\S]*?for\s*\(\s*.*;\s*.*;\s*.*\)/g,
    title: "Nested Loop Operations",
    description: "Nested loops can lead to high gas consumption with large data sets.",
    severity: SeverityLevel.MEDIUM,
    recommendation: "Redesign the logic to avoid nested loops or use batching mechanisms."
  }
];

// Best practices patterns
const bestPracticesPatterns = [
  {
    id: "missing-events",
    pattern: /function\s+\w+\s*\(.*\)\s*public\s+((?!emit).)*\{/g,
    title: "Missing Event Emission",
    description: "Public state-changing functions should emit events for off-chain monitoring.",
    severity: SeverityLevel.INFO,
    recommendation: "Add events for all state-changing operations to improve contract observability."
  },
  {
    id: "magic-numbers",
    pattern: /[^\/\/].*[^a-zA-Z0-9_"](?<!\w)([0-9]{4,}|0x[0-9a-fA-F]{4,})(?!\w)/g,
    title: "Magic Numbers",
    description: "Hardcoded numeric literals reduce code readability and maintainability.",
    severity: SeverityLevel.INFO,
    recommendation: "Replace magic numbers with named constants."
  }
];

// Helper function to extract code context around a match
function extractCodeContext(source: string, match: RegExpExecArray): { line: number; code: string } {
  const lines = source.substring(0, match.index).split('\n');
  const lineNumber = lines.length;
  
  const startOfLine = source.lastIndexOf('\n', match.index - 1) + 1;
  const endOfLine = source.indexOf('\n', match.index);
  
  const code = source.substring(
    startOfLine, 
    endOfLine === -1 ? source.length : endOfLine
  ).trim();
  
  return {
    line: lineNumber,
    code
  };
}

// Function to detect patterns in the code
function detectPatterns(source: string, patterns: typeof vulnerabilityPatterns): Finding[] {
  const findings: Finding[] = [];
  
  for (const pattern of patterns) {
    let match;
    // Reset lastIndex to ensure we search from the beginning
    pattern.pattern.lastIndex = 0;
    
    while ((match = pattern.pattern.exec(source)) !== null) {
      const location = extractCodeContext(source, match);
      
      findings.push({
        id: `${pattern.id}-${findings.length + 1}`,
        title: pattern.title,
        description: pattern.description,
        severity: pattern.severity,
        location,
        recommendation: pattern.recommendation
      });
    }
  }
  
  return findings;
}

// Calculate security score based on findings
function calculateSecurityScore(findings: Finding[]): number {
  const severityWeights = {
    [SeverityLevel.CRITICAL]: 30,
    [SeverityLevel.HIGH]: 20,
    [SeverityLevel.MEDIUM]: 10,
    [SeverityLevel.LOW]: 5,
    [SeverityLevel.INFO]: 2
  };
  
  const totalPenalty = findings.reduce((sum, finding) => {
    return sum + severityWeights[finding.severity];
  }, 0);
  
  // Base score of 100, with deductions based on findings
  let score = 100 - totalPenalty;
  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

// Calculate gas efficiency score
function calculateGasEfficiency(findings: Finding[]): number {
  // Simple algorithm: base efficiency of 85%, + penalty for gas findings
  const gasFindings = findings.filter(f => f.id.includes('storage-vs-memory') || f.id.includes('multiple-loop-iterations'));
  const penalty = gasFindings.length * 5;
  return Math.max(50, 90 - penalty);
}

// Determine overall status based on security score
function determineStatus(securityScore: number): 'needs_improvement' | 'good' | 'excellent' {
  if (securityScore < 75) return 'needs_improvement';
  if (securityScore < 90) return 'good';
  return 'excellent';
}

export async function auditContract(request: AuditRequest): Promise<AuditResult> {
  const { contractSource, options } = request;
  
  try {
    // Check if AI recommendations are enabled and Gemini API key is available
    if (options.aiRecommendations && process.env.GEMINI_API_KEY) {
      try {
        console.log('Using Gemini AI for contract analysis');
        
        // Send contract to Gemini AI for analysis
        const aiResult = await analyzeContractWithGemini(contractSource, options);
        
        // If we get a valid result from Gemini, return it
        if (aiResult && aiResult.findings && aiResult.findings.length > 0) {
          console.log('Successfully analyzed contract with Gemini AI');
          return aiResult;
        }
        
        console.log('Gemini analysis returned empty results, falling back to pattern analysis');
      } catch (aiError) {
        console.error('Error using Gemini AI for analysis:', aiError);
        console.log('Falling back to pattern-based analysis');
      }
    }
    
    // If AI analysis is not enabled or failed, fall back to pattern-based analysis
    console.log('Using pattern-based contract analysis');
    let allFindings: Finding[] = [];
    
    // Apply requested audit options
    if (options.vulnerabilityScan) {
      const vulnerabilityFindings = detectPatterns(contractSource, vulnerabilityPatterns);
      allFindings = [...allFindings, ...vulnerabilityFindings];
    }
    
    if (options.gasOptimization) {
      const gasFindings = detectPatterns(contractSource, gasOptimizationPatterns);
      allFindings = [...allFindings, ...gasFindings];
    }
    
    if (options.bestPractices) {
      const practiceFindings = detectPatterns(contractSource, bestPracticesPatterns);
      allFindings = [...allFindings, ...practiceFindings];
    }
    
    // Calculate metrics
    const securityScore = calculateSecurityScore(allFindings);
    const gasEfficiency = calculateGasEfficiency(allFindings);
    const status = determineStatus(securityScore);
    
    return {
      securityScore,
      issuesCount: allFindings.length,
      gasEfficiency,
      findings: allFindings,
      status
    };
    
  } catch (error) {
    console.error('Error during contract audit:', error);
    
    // Return a basic error result with a helpful message
    return {
      securityScore: 0,
      gasEfficiency: 0,
      issuesCount: 1,
      findings: [{
        id: "audit-error-1",
        title: "Audit Process Failed",
        description: `Failed to analyze contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: SeverityLevel.INFO,
        location: {
          line: 1,
          code: "N/A"
        },
        recommendation: "Please try again or contact support if the issue persists."
      }],
      status: 'needs_improvement'
    };
  }
}
