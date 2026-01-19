"use server"

import { generateWithGroq, parsePackageResponse } from "@/lib/groq"
import { getCurrentUser } from "@/lib/session"
import { db } from "@/lib/db"

type ModelType = 'llama3' | 'mixtral' | 'gemma' | 'gpt4o'

interface GeneratePackageParams {
  name: string
  description: string
  framework: string
  prompt: string
  model: ModelType
}

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  npmToken: string | null
  githubToken: string | null
  twoFactorEnabled: boolean
  subscriptionPlan: 'FREE' | 'PRO' | 'TEAM'
  subscriptionStatus: 'active' | 'inactive' | 'past_due' | 'canceled'
}

export async function generatePackage({ name, description, framework, prompt, model }: GeneratePackageParams) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get user's subscription plan directly from user model
    const subscriptionPlan = user.subscriptionPlan || 'FREE'

    // Check if user has enough credits for the selected model
    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
    })

    // If using GPT-4o on free tier, check daily usage
    if (model === "gpt4o" && subscriptionPlan === "FREE") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const usageCount = await db.aIUsage.count({
        where: {
          userId: user.id,
          model: "gpt4o",
          createdAt: {
            gte: today,
          },
        },
      })

      if (usageCount >= 10) {
        throw new Error(
          "You've reached your daily limit of 10 GPT-4o prompts. Upgrade your plan or try again tomorrow.",
        )
      }
    }
    // For other models or paid plans, check credits
    else if (subscriptionPlan !== "FREE") {
      if (!wallet || wallet.credits < 1) {
        throw new Error("Insufficient credits. Please add more credits to your wallet.")
      }
    }

    // Generate a complete npm package structure
    const enhancedPrompt = `
You are an expert npm package developer assistant. Your task is to generate a production-ready npm package based on the following requirements:

Package Name: ${name}
Description: ${description}
Framework: ${framework}
User Requirements: ${prompt}

Please follow these rules:

1. **Output Structure**:
   - Generate all files as separate markdown code blocks.
   - Required files: package.json, src/index.js/ts, tests/index.test.js/ts, README.md, .gitignore, tsconfig.json (if TypeScript).
   - Use JSDoc/TypeDoc comments for all exports.

2. **Package Requirements**:
   - Use TypeScript by default unless specified otherwise.
   - Target ES Modules (ESM) format.
   - Include unit tests with 100% coverage using Vitest.
   - Add "prepublishOnly": "npm run build && npm test" to package.json scripts.
   - Use peerDependencies for framework packages (React, Vue, etc).

3. **Validation Rules**:
   - Ensure dependencies use latest stable versions
   - Add "type": "module" to package.json for ESM
   - Include "files": ["dist"] for build outputs
   - Never include API keys/secrets in code

4. **Documentation Standards**:
   - README must include:
     - Installation instructions
     - Usage examples with code blocks
     - API documentation table
     - Contribution guidelines
     - MIT license section

For each file, use the following format:
\`\`\`filetype path/to/file.ext
// File content here
\`\`\`

For example:
\`\`\`json package.json
{
  "name": "example-package",
  "version": "0.1.0"
}
\`\`\`

\`\`\`typescript src/index.ts
export function hello() {
  return "Hello, world!";
}
\`\`\`

Generate a complete, production-ready npm package with all necessary files.
`

    const systemPrompt = `You are an expert npm package developer specializing in creating production-ready packages for ${framework}. 
Your task is to create high-quality, well-documented code that follows best practices for ${framework}.
Always structure your response as a series of markdown code blocks, each representing a file in the package.
Include all required files in the proper directory structure.`

    // Use Groq to generate the package with the selected model
    const result = await generateWithGroq({
      prompt: enhancedPrompt,
      model,
      systemPrompt,
    })

    // Parse the response into a structured package
    const parsedPackage = parsePackageResponse(result)

    // Serialize the files for storage
    const serializedFiles = JSON.stringify(parsedPackage.files)

    // Record AI usage
    await db.aIUsage.create({
      data: {
        userId: user.id,
        model,
        prompt,
        tokensUsed: estimateTokens(enhancedPrompt) + estimateTokens(result),
      },
    })

    // Deduct credits if not using GEMMA on free tier
    if (model !== "gemma" || user.subscriptionPlan !== "FREE") {
      await db.wallet.update({
        where: { userId: user.id },
        data: {
          credits: { decrement: 1 },
        },
      })
    }

    return {
      code: serializedFiles,
      documentation: parsedPackage.readme,
    }
  } catch (error) {
    console.error("Error generating package:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to generate package")
  }
}

// Helper function to estimate tokens (very rough estimate)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}


//     // Check if user has reached their limit
//     const canUseAI = await checkSubscriptionLimit(user.id, data.model)
//     // @ts-ignore
//     if (!canUseAI.allowed) {
//       // @ts-ignore
//       throw new Error(canUseAI.message)
//     }

//     // Determine which AI model to use
//     let result
//     switch (data.model) {
//       case "gpt4o":
//         result = await generateWithGPT4(data)
//         break
//       case "claude":
//         result = await generateWithClaude(data)
//         break
//       case "deepseek":
//         result = await generateWithDeepSeek(data)
//         break
//       case "groq":
//         result = await generateWithGroq(data)
//         break
//       default:
//         result = await generateWithGPT4(data)
//     }

//     // Track API usage
//     const usage = {
//       tokens: result.usage.totalTokens,
//       cost: calculateCost(data.model, result.usage.totalTokens),
//     }

//     await db.apiUsage.create({
//       data: {
//         userId: user.id,
//         model: data.model,
//         tokens: usage.tokens,
//         cost: usage.cost,
//       },
//     })

//     // Update user's free tier usage if applicable

//     // @ts-ignore
//     if (user.subscriptionPlan === "FREE" && data.model === "gpt4o") {
//       await updateFreeUsage(user.id)
//     }

//     revalidatePath("/dashboard")
//     return result
//   } catch (error) {
//     console.error("Error generating package:", error)
//     throw new Error(error instanceof Error ? error.message : "Failed to generate package")
//   }
// }

// async function generateWithGPT4(data: z.infer<typeof generateSchema>) {
//   const openai = new OpenAI({
//     apiKey: env.OPENAI_API_KEY,
//   })

//   const systemPrompt = `You are an expert JavaScript/TypeScript developer specializing in creating NPM packages. 
//   Create a complete NPM package based on the following details:
//   - Name: ${data.name}
//   - Description: ${data.description}
//   - Framework: ${data.framework}
  
//   Generate two parts:
//   1. Complete, production-ready code for the package
//   2. Comprehensive documentation in Markdown format
  
//   The code should follow best practices, include proper error handling, and be well-commented.
//   The documentation should include installation instructions, API reference, examples, and usage guidelines.`

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o",
//     messages: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: data.prompt },
//     ],
//     temperature: 0.7,
//     max_tokens: 4000,
//   })

//   // Parse the response to extract code and documentation
//   const fullResponse = response.choices[0].message.content || ""

//   // Simple parsing - in a real app, you'd want more robust parsing
//   const codeSection = fullResponse.includes("```")
//     ? fullResponse.split("```")[1].startsWith("javascript") || fullResponse.split("```")[1].startsWith("typescript")
//       ? fullResponse.split("```")[1].replace(/^(javascript|typescript)\n/, "")
//       : fullResponse.split("```")[1]
//     : fullResponse

//   const documentationSection = fullResponse.includes("# ")
//     ? fullResponse.substring(fullResponse.indexOf("# "))
//     : `# ${data.name}\n\n${data.description}`

//   return {
//     code: codeSection,
//     documentation: documentationSection,
//     usage: {
//       totalTokens: response.usage?.total_tokens || 0,
//       promptTokens: response.usage?.prompt_tokens || 0,
//       completionTokens: response.usage?.completion_tokens || 0,
//     },
//   }
// }

// async function generateWithClaude(data: z.infer<typeof generateSchema>) {
//   if (!env.ANTHROPIC_API_KEY) {
//     throw new Error("Anthropic API key not configured")
//   }

//   const anthropic = new Anthropic({
//     apiKey: env.ANTHROPIC_API_KEY,
//   })

//   const systemPrompt = `You are an expert JavaScript/TypeScript developer specializing in creating NPM packages. 
//   Create a complete NPM package based on the following details:
//   - Name: ${data.name}
//   - Description: ${data.description}
//   - Framework: ${data.framework}
  
//   Generate two parts:
//   1. Complete, production-ready code for the package
//   2. Comprehensive documentation in Markdown format
  
//   The code should follow best practices, include proper error handling, and be well-commented.
//   The documentation should include installation instructions, API reference, examples, and usage guidelines.`

//   const response = await anthropic.messages.create({
//     model: "claude-3-opus-20240229",
//     max_tokens: 4000,
//     system: systemPrompt,
//     messages: [{ role: "user", content: data.prompt }],
//   })

//   // Parse the response to extract code and documentation
//   /// @ts-ignore
//   const fullResponse = response.content[0].text || ""

//   // Simple parsing - in a real app, you'd want more robust parsing
//   const codeSection = fullResponse.includes("```")
//     ? fullResponse.split("```")[1].startsWith("javascript") || fullResponse.split("```")[1].startsWith("typescript")
//       ? fullResponse.split("```")[1].replace(/^(javascript|typescript)\n/, "")
//       : fullResponse.split("```")[1]
//     : fullResponse

//   const documentationSection = fullResponse.includes("# ")
//     ? fullResponse.substring(fullResponse.indexOf("# "))
//     : `# ${data.name}\n\n${data.description}`

//   // Estimate token usage (Claude doesn't provide this directly)
//   const estimatedTokens = Math.ceil(fullResponse.length / 4)

//   return {
//     code: codeSection,
//     documentation: documentationSection,
//     usage: {
//       totalTokens: estimatedTokens,
//       promptTokens: Math.ceil(data.prompt.length / 4),
//       completionTokens: estimatedTokens - Math.ceil(data.prompt.length / 4),
//     },
//   }
// }

// async function generateWithDeepSeek(data: z.infer<typeof generateSchema>) {
//   // Implementation would use DeepSeek API
//   // For now, return mock data with estimated usage
//   return {
//     code: `// ${data.name}\n// A package for ${data.framework}\n// ${data.description}\n\n/**\n* Main function for ${data.name}\n*/\nexport function main() {\n console.log("Hello from ${data.name}!");\n return true;\n}\n\n/**\n* Helper function\n*/\nexport function helper() {\n return "I'm a helper function";\n}\n\n// Export default\nexport default {\n main,\n helper\n};`,
//     documentation: `# ${data.name}\n\n${data.description}\n\n## Installation\n\n\`\`\`bash\nnpm install ${data.name}\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\nimport { main } from '${data.name}';\n\n// Call the main function\nmain();\n\`\`\`\n\n## API\n\n### main()\n\nThe main function of the package.\n\n### helper()\n\nA helper function.\n\n## License\n\nMIT`,
//     usage: {
//       totalTokens: 1500,
//       promptTokens: 500,
//       completionTokens: 1000,
//     },
//   }
// }

// async function generateWithGroq(data: z.infer<typeof generateSchema>) {
//   // Implementation would use Groq API
//   // For now, return mock data with estimated usage
//   return {
//     code: `// ${data.name}\n// A package for ${data.framework}\n// ${data.description}\n\n/**\n* Main function for ${data.name}\n*/\nexport function main() {\n console.log("Hello from ${data.name}!");\n return true;\n}\n\n/**\n* Helper function\n*/\nexport function helper() {\n return "I'm a helper function";\n}\n\n// Export default\nexport default {\n main,\n helper\n};`,
//     documentation: `# ${data.name}\n\n${data.description}\n\n## Installation\n\n\`\`\`bash\nnpm install ${data.name}\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\nimport { main } from '${data.name}';\n\n// Call the main function\nmain();\n\`\`\`\n\n## API\n\n### main()\n\nThe main function of the package.\n\n### helper()\n\nA helper function.\n\n## License\n\nMIT`,
//     usage: {
//       totalTokens: 1200,
//       promptTokens: 400,
//       completionTokens: 800,
//     },
//   }
// }

// function calculateCost(model: string, tokens: number): number {
//   // Cost per 1000 tokens in USD
//   const costPer1000Tokens = {
//     gpt4o: 0.01,
//     claude: 0.015,
//     deepseek: 0.005,
//     groq: 0.0025,
//   }

//   const modelCost = costPer1000Tokens[model as keyof typeof costPer1000Tokens] || 0.01
//   return (tokens / 1000) * modelCost
// }

// async function updateFreeUsage(userId: string) {
//   const today = new Date()
//   today.setHours(0, 0, 0, 0)

//   const tomorrow = new Date(today)
//   tomorrow.setDate(tomorrow.getDate() + 1)

//   // Count today's usage
//   const todayUsage = await db.apiUsage.count({
//     where: {
//       userId,
//       model: "gpt4o",
//       createdAt: {
//         gte: today,
//         lt: tomorrow,
//       },
//     },
//   })

//   // If user has reached their daily limit, update their wallet to reflect this
//   if (todayUsage >= 10) {
//     await db.wallet.update({
//       where: { userId },
//       data: {
//         credits: { decrement: 1 },
//       },
//     })
//   }
// }


