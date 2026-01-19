// Test script for Performance Prediction feature
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Sample project data for testing
const sampleProjects = [
  {
    name: "E-commerce Platform Redesign",
    status: "In Progress",
    progress: 45,
    tasks: {
      total: 32,
      completed: 14
    },
    budget: {
      total: 120000,
      spent: 58000
    },
    timeline: {
      startDate: "2023-09-15",
      completionDate: "2024-03-30",
      elapsed: 60
    }
  },
  {
    name: "Mobile App Development",
    status: "In Progress",
    progress: 72,
    tasks: {
      total: 45,
      completed: 32
    },
    budget: {
      total: 85000,
      spent: 72000
    },
    timeline: {
      startDate: "2023-11-01",
      completionDate: "2024-02-15",
      elapsed: 85
    }
  },
  {
    name: "Data Migration Project",
    status: "At Risk",
    progress: 35,
    tasks: {
      total: 28,
      completed: 9
    },
    budget: {
      total: 65000,
      spent: 42000
    },
    timeline: {
      startDate: "2023-12-10",
      completionDate: "2024-02-28",
      elapsed: 75
    }
  },
  {
    name: "Marketing Campaign Launch",
    status: "On Track",
    progress: 88,
    tasks: {
      total: 18,
      completed: 16
    },
    budget: {
      total: 45000,
      spent: 38000
    },
    timeline: {
      startDate: "2024-01-05",
      completionDate: "2024-02-20",
      elapsed: 90
    }
  },
  {
    name: "Infrastructure Upgrade",
    status: "Delayed",
    progress: 52,
    tasks: {
      total: 24,
      completed: 12
    },
    budget: {
      total: 95000,
      spent: 68000
    },
    timeline: {
      startDate: "2023-10-20",
      completionDate: "2024-01-31",
      elapsed: 95
    }
  }
];

// Function to generate a performance prediction for a project
async function generatePerformancePrediction(project) {
  try {
    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try with gemini-2.0-flash first, fall back to gemini-pro if needed
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    } catch (modelError) {
      console.warn('Failed to use gemini-2.0-flash, falling back to gemini-pro:', modelError.message);
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
    }
    
    // Calculate task completion rate
    const taskCompletionRate = project.tasks.total > 0 ? 
      (project.tasks.completed / project.tasks.total) * 100 : 0;
    
    // Calculate budget utilization
    const budgetUtilization = project.budget.total > 0 ? 
      (project.budget.spent / project.budget.total) * 100 : 0;
    
    // Create the prompt for the AI
    const prompt = `
      You are an expert project performance analyst with advanced predictive capabilities.
      Please analyze the following project data and provide detailed performance predictions:
      
      Project Name: ${project.name}
      Project Status: ${project.status}
      Current Progress: ${project.progress}%
      
      Task Metrics:
      - Total Tasks: ${project.tasks.total}
      - Completed Tasks: ${project.tasks.completed}
      - Task Completion Rate: ${taskCompletionRate.toFixed(2)}%
      
      Budget Metrics:
      - Total Budget: $${project.budget.total.toFixed(2)}
      - Current Expenses: $${project.budget.spent.toFixed(2)}
      - Budget Utilization: ${budgetUtilization.toFixed(2)}%
      
      Timeline Metrics:
      - Start Date: ${project.timeline.startDate}
      - Planned Completion Date: ${project.timeline.completionDate}
      - Time Elapsed: ${project.timeline.elapsed}%
      
      Please provide a comprehensive performance prediction in the following JSON format:
      {
        "timelinePrediction": {
          "predictedCompletionDate": "YYYY-MM-DD",
          "confidenceLevel": "High|Medium|Low",
          "delayRisk": "High|Medium|Low",
          "predictedDelay": "Number of days (0 if on time)",
          "keyMilestones": [
            {
              "name": "Milestone name",
              "predictedDate": "YYYY-MM-DD",
              "riskFactors": ["List of risk factors"]
            }
          ]
        },
        "budgetPrediction": {
          "predictedFinalCost": "Dollar amount",
          "predictedVariance": "Percentage over/under budget",
          "confidenceLevel": "High|Medium|Low",
          "riskAreas": ["List of budget risk areas"]
        },
        "qualityPrediction": {
          "predictedQualityScore": "1-10 score",
          "confidenceLevel": "High|Medium|Low",
          "potentialIssues": ["List of potential quality issues"]
        },
        "recommendations": [
          {
            "area": "Timeline|Budget|Quality|Resources",
            "recommendation": "Specific recommendation",
            "impact": "High|Medium|Low",
            "effort": "High|Medium|Low"
          }
        ],
        "overallHealthPrediction": {
          "score": "1-10 score",
          "trend": "Improving|Stable|Declining",
          "keyInsights": ["List of key insights about project health"]
        }
      }
      
      Your response must be valid JSON that can be parsed directly.
    `;
    
    // Set up generation config for more reliable JSON output
    const generationConfig = {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    };
    
    // Generate content with safety settings
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // If no JSON found, try to parse the entire response
      return JSON.parse(text);
    }
  } catch (error) {
    console.error(`Error generating prediction for ${project.name}:`, error);
    return {
      error: `Failed to generate prediction: ${error.message}`
    };
  }
}

// Function to run the test for a specific project
async function runTest(projectIndex = 0) {
  try {
    if (projectIndex < 0 || projectIndex >= sampleProjects.length) {
      console.error(`Invalid project index: ${projectIndex}. Must be between 0 and ${sampleProjects.length - 1}`);
      return;
    }
    
    const project = sampleProjects[projectIndex];
    console.log(`\n=== Generating prediction for "${project.name}" ===\n`);
    
    const prediction = await generatePerformancePrediction(project);
    
    console.log(`\n=== Performance Prediction for "${project.name}" ===\n`);
    console.log(JSON.stringify(prediction, null, 2));
    
    return prediction;
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Function to run tests for all sample projects
async function runAllTests() {
  console.log('=== Running Performance Prediction Tests ===');
  
  for (let i = 0; i < sampleProjects.length; i++) {
    await runTest(i);
  }
  
  console.log('\n=== All tests completed ===');
}

// Check if a specific project index was provided as a command line argument
const projectIndex = process.argv[2] ? parseInt(process.argv[2]) : null;

if (projectIndex !== null) {
  // Run test for the specified project
  runTest(projectIndex);
} else {
  // Run test for the first project by default
  runTest(0);
}

// Export functions and data for use in other scripts
module.exports = {
  sampleProjects,
  generatePerformancePrediction,
  runTest,
  runAllTests
}; 