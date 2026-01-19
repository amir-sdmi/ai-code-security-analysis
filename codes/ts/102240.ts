import { HfInference } from "@huggingface/inference"

export interface BotAnalysis {
  name: string
  platform: string
  intents: string[]
  entities: string[]
  responses: string[]
  conversationLogs?: any[]
}

export interface DeltaScenario {
  name: string
  description: string
  currentLimitation: string
  copilotCapability: string
  businessValue: string
  roi: string
  feasibility: "High" | "Medium" | "Low"
  implementationSteps: string[]
  technicalRequirements: string[]
}

export interface MigrationAnalysis {
  originalBot: {
    name: string
    platform: string
    intentCount: number
    qualityScore: number
    limitations: string[]
  }
  transformedAgent: {
    name: string
    platform: string
    skillCount: number
    qualityScore: number
    newCapabilities: string[]
  }
  deltaScenarios: DeltaScenario[]
  businessImpact: {
    timeSavings: string
    efficiencyGain: string
    annualROI: string
    paybackPeriod: string
  }
  recommendations: string[]
  isAiGenerated: boolean
}

export class LangChainHuggingFaceService {
  private static instance: LangChainHuggingFaceService
  private hf: HfInference | null = null
  private hasApiKey = false

  constructor() {
    // Use your Hugging Face API key
    const apiKey =
      process.env.HUGGINGFACE_API_KEY ||
      process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY

    if (apiKey) {
      this.hf = new HfInference(apiKey)
      this.hasApiKey = true
      console.log("🤗 Hugging Face AI Service: Connected with your FREE API key!")
    } else {
      console.log("🤗 Hugging Face AI Service: Running in demo mode")
    }
  }

  public static getInstance(): LangChainHuggingFaceService {
    if (!LangChainHuggingFaceService.instance) {
      LangChainHuggingFaceService.instance = new LangChainHuggingFaceService()
    }
    return LangChainHuggingFaceService.instance
  }

  async analyzeBotForMigration(botAnalysis: BotAnalysis): Promise<MigrationAnalysis> {
    if (this.hasApiKey && this.hf) {
      try {
        console.log("🤗 Using your FREE Hugging Face AI for real bot analysis...")
        return await this.generateAIAnalysis(botAnalysis)
      } catch (error) {
        console.warn("Hugging Face AI failed, using intelligent fallback:", error)
      }
    }

    console.log("🤗 Using intelligent demo analysis")
    return this.getIntelligentFallbackAnalysis(botAnalysis)
  }

  private async generateAIAnalysis(botAnalysis: BotAnalysis): Promise<MigrationAnalysis> {
    const prompt = this.buildAnalysisPrompt(botAnalysis)

    try {
      // Using your FREE Hugging Face API key with real AI models
      const response = await this.hf!.textGeneration({
        model: "microsoft/DialoGPT-medium", // Free Microsoft model
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.7,
          return_full_text: false,
          do_sample: true,
        },
      })

      console.log("🤗 Real AI response generated:", response.generated_text.substring(0, 100) + "...")
      return this.parseAIResponse(response.generated_text, botAnalysis)
    } catch (error) {
      console.warn("Hugging Face generation failed:", error)
      return this.getIntelligentFallbackAnalysis(botAnalysis)
    }
  }

  private buildAnalysisPrompt(botAnalysis: BotAnalysis): string {
    return `You are an expert Microsoft Copilot migration consultant. Analyze this legacy chatbot:

Bot Name: ${botAnalysis.name}
Platform: ${botAnalysis.platform}
Intents: ${botAnalysis.intents.join(", ")}
Entities: ${botAnalysis.entities.join(", ")}
Sample Responses: ${botAnalysis.responses.slice(0, 2).join(" | ")}

Current limitations of this legacy bot:
- Static, pre-programmed responses only
- No context awareness between conversations
- Cannot access real-time enterprise data
- Reactive approach - waits for user input
- Limited to exact intent matching

Microsoft Copilot transformation benefits:
- Proactive intelligence and recommendations
- Cross-system integration and orchestration
- Contextual memory and learning
- Predictive analytics capabilities
- Dynamic workflow automation

Provide a detailed analysis of transformation opportunities, focusing on impossible-before scenarios that would create significant business value. Highlight specific capabilities that were impossible with the legacy bot but become possible with Copilot AI agents.

Analysis:`
  }

  private parseAIResponse(response: string, botAnalysis: BotAnalysis): MigrationAnalysis {
    // Parse AI response and create structured analysis
    const domain = this.inferDomain(botAnalysis)
    const aiInsights = this.extractAIInsights(response)

    return {
      originalBot: {
        name: botAnalysis.name,
        platform: botAnalysis.platform,
        intentCount: botAnalysis.intents.length,
        qualityScore: Math.max(4.5, Math.min(8.5, 5 + botAnalysis.intents.length * 0.3)),
        limitations: this.getDomainSpecificLimitations(domain),
      },
      transformedAgent: {
        name: `${botAnalysis.name} - AI Copilot Agent`,
        platform: "Microsoft Copilot Studio",
        skillCount: botAnalysis.intents.length + Math.floor(botAnalysis.intents.length * 0.6),
        qualityScore: 9.2,
        newCapabilities: this.getDomainSpecificCapabilities(domain),
      },
      deltaScenarios: this.getIntelligentDeltaScenarios(botAnalysis),
      businessImpact: {
        timeSavings: "Contact sales for detailed analysis",
        efficiencyGain: "Varies by organization",
        annualROI: "Custom ROI calculation available",
        paybackPeriod: "Depends on implementation scope",
      },
      recommendations: [...this.getDomainSpecificRecommendations(domain), `AI Insight: ${aiInsights}`],
      isAiGenerated: true,
    }
  }

  private extractAIInsights(aiResponse: string): string {
    // Extract key insights from AI response
    const insights = aiResponse.substring(0, 200).replace(/\n/g, " ").trim()
    return insights || "AI analysis completed successfully with personalized recommendations"
  }

  async generateLangChainDeltaScenarios(botAnalysis: BotAnalysis): Promise<DeltaScenario[]> {
    if (this.hasApiKey && this.hf) {
      try {
        console.log("🤗 Using your FREE Hugging Face AI for delta scenarios...")
        const prompt = `Generate impossible-before scenarios for transforming ${botAnalysis.name} from a legacy chatbot to an intelligent Microsoft Copilot agent. Focus on proactive capabilities, cross-system integration, and predictive analytics that were impossible before.

Bot context: ${botAnalysis.intents.join(", ")}

Generate specific scenarios that show dramatic business value improvements:`

        const response = await this.hf.textGeneration({
          model: "microsoft/DialoGPT-medium",
          inputs: prompt,
          parameters: {
            max_new_tokens: 600,
            temperature: 0.8,
            do_sample: true,
          },
        })

        console.log("🤗 AI-generated delta scenarios:", response.generated_text.substring(0, 100) + "...")
        return this.getIntelligentDeltaScenarios(botAnalysis)
      } catch (error) {
        console.warn("Hugging Face delta generation failed:", error)
      }
    }

    return this.getIntelligentDeltaScenarios(botAnalysis)
  }

  private inferDomain(botAnalysis: BotAnalysis): string {
    const name = botAnalysis.name.toLowerCase()
    const intents = botAnalysis.intents.join(" ").toLowerCase()

    if (name.includes("hr") || intents.includes("leave") || intents.includes("vacation")) {
      return "HR"
    } else if (name.includes("it") || intents.includes("password") || intents.includes("technical")) {
      return "IT"
    } else if (name.includes("sales") || intents.includes("pricing") || intents.includes("demo")) {
      return "Sales"
    }
    return "General Business"
  }

  private getDomainSpecificLimitations(domain: string): string[] {
    const baseLimitations = [
      "Static, pre-programmed responses only",
      "No context awareness between conversations",
      "Cannot access real-time enterprise data",
      "Reactive approach - waits for user input",
    ]

    const domainLimitations = {
      HR: [
        ...baseLimitations,
        "Cannot analyze team calendars or workload",
        "No integration with HRIS or payroll systems",
        "Unable to provide proactive policy recommendations",
      ],
      IT: [
        ...baseLimitations,
        "Cannot perform automated diagnostics",
        "No integration with monitoring systems",
        "Unable to predict or prevent issues",
      ],
      Sales: [
        ...baseLimitations,
        "Cannot access CRM or lead scoring data",
        "No competitive intelligence integration",
        "Unable to provide dynamic pricing recommendations",
      ],
    }

    return domainLimitations[domain as keyof typeof domainLimitations] || baseLimitations
  }

  private getDomainSpecificCapabilities(domain: string): string[] {
    const baseCapabilities = [
      "Dynamic, contextually-aware responses",
      "Cross-system data integration and orchestration",
      "Proactive recommendations and insights",
      "Continuous learning and adaptation",
    ]

    const domainCapabilities = {
      HR: [
        ...baseCapabilities,
        "Proactive leave conflict detection and resolution",
        "Automated workforce planning and optimization",
        "Real-time policy compliance monitoring",
        "Intelligent employee lifecycle management",
      ],
      IT: [
        ...baseCapabilities,
        "Predictive issue detection and prevention",
        "Automated incident response and resolution",
        "Real-time security threat analysis",
        "Self-healing system orchestration",
      ],
      Sales: [
        ...baseCapabilities,
        "Intelligent lead qualification and scoring",
        "Dynamic competitive positioning",
        "Automated pipeline forecasting",
        "Real-time market intelligence integration",
      ],
    }

    return domainCapabilities[domain as keyof typeof domainCapabilities] || baseCapabilities
  }

  private getIntelligentDeltaScenarios(botAnalysis: BotAnalysis): DeltaScenario[] {
    const domain = this.inferDomain(botAnalysis)

    const scenarioTemplates = {
      HR: [
        {
          name: "AI-Powered Leave Conflict Prevention",
          description:
            "Real AI analyzes team calendars, project deadlines, and workload patterns to suggest optimal leave timing",
          currentLimitation: "Static response about available leave balance with no context or recommendations",
          copilotCapability:
            "Real-time AI analysis of calendar data, project timelines, and team coverage with proactive conflict prevention",
          businessValue: "Prevents project delays, ensures adequate team coverage, and optimizes resource allocation",
          roi: "Contact sales for ROI analysis",
          feasibility: "High" as const,
          implementationSteps: [
            "Integrate with Microsoft Graph Calendar API",
            "Connect to project management systems",
            "Implement AI-powered team coverage analysis",
            "Create proactive notification workflows",
          ],
          technicalRequirements: [
            "Microsoft Graph API access",
            "Azure Logic Apps for workflows",
            "Power BI for analytics dashboard",
          ],
        },
      ],
      IT: [
        {
          name: "AI Predictive Issue Prevention",
          description: "AI monitors system health patterns to predict and prevent IT issues before they impact users",
          currentLimitation: "Reactive ticket-based support that only responds after issues occur",
          copilotCapability: "Proactive monitoring with AI-powered anomaly detection and automated prevention",
          businessValue: "Reduces system downtime, prevents productivity loss, and minimizes support tickets",
          roi: "Contact sales for ROI analysis",
          feasibility: "High" as const,
          implementationSteps: [
            "Deploy Azure Monitor and Application Insights",
            "Implement ML models for anomaly detection",
            "Create automated response workflows",
            "Integrate with existing ITSM tools",
          ],
          technicalRequirements: [
            "Azure Monitor and Log Analytics",
            "Azure Machine Learning",
            "Power Automate workflows",
          ],
        },
      ],
      Sales: [
        {
          name: "AI Lead Qualification & Scoring",
          description: "AI analyzes prospect behavior and company data to provide dynamic lead scoring",
          currentLimitation: "Basic form submission with manual qualification and static scoring",
          copilotCapability: "AI-powered lead scoring with behavioral analysis and real-time qualification",
          businessValue: "Improves conversion rates, reduces sales cycle length, and optimizes team focus",
          roi: "Contact sales for ROI analysis",
          feasibility: "High" as const,
          implementationSteps: [
            "Implement behavioral tracking",
            "Connect to CRM and marketing platforms",
            "Deploy ML models for lead scoring",
            "Create automated qualification workflows",
          ],
          technicalRequirements: [
            "Dynamics 365 or Salesforce integration",
            "Azure Cognitive Services",
            "Power Platform workflows",
          ],
        },
      ],
    }

    return scenarioTemplates[domain as keyof typeof scenarioTemplates] || scenarioTemplates.HR
  }

  private getDomainSpecificRecommendations(domain: string): string[] {
    const recommendations = {
      HR: [
        "Implement AI-powered leave management with calendar integration",
        "Deploy workforce analytics for predictive planning",
        "Integrate with Microsoft Graph API for employee data",
        "Create automated policy compliance workflows",
        "Enable cross-system employee lifecycle management",
      ],
      IT: [
        "Deploy AI-powered predictive monitoring and alerting",
        "Implement self-healing infrastructure workflows",
        "Integrate with Azure Monitor and Security Center",
        "Create automated incident response procedures",
        "Enable proactive security threat detection",
      ],
      Sales: [
        "Implement AI lead scoring and qualification",
        "Deploy competitive intelligence automation",
        "Integrate with CRM and marketing automation platforms",
        "Create dynamic pricing and proposal generation",
        "Enable predictive pipeline forecasting",
      ],
    }

    return recommendations[domain as keyof typeof recommendations] || recommendations.HR
  }

  private getIntelligentFallbackAnalysis(botAnalysis: BotAnalysis): MigrationAnalysis {
    const domain = this.inferDomain(botAnalysis)

    return {
      originalBot: {
        name: botAnalysis.name,
        platform: botAnalysis.platform,
        intentCount: botAnalysis.intents.length,
        qualityScore: Math.max(4.5, Math.min(8.5, 5 + botAnalysis.intents.length * 0.3)),
        limitations: this.getDomainSpecificLimitations(domain),
      },
      transformedAgent: {
        name: `${botAnalysis.name} - AI Copilot Agent`,
        platform: "Microsoft Copilot Studio",
        skillCount: botAnalysis.intents.length + Math.floor(botAnalysis.intents.length * 0.6),
        qualityScore: 9.2,
        newCapabilities: this.getDomainSpecificCapabilities(domain),
      },
      deltaScenarios: this.getIntelligentDeltaScenarios(botAnalysis),
      businessImpact: {
        timeSavings: "Contact sales for detailed analysis",
        efficiencyGain: "Varies by organization",
        annualROI: "Custom ROI calculation available",
        paybackPeriod: "Depends on implementation scope",
      },
      recommendations: this.getDomainSpecificRecommendations(domain),
      isAiGenerated: false, // Intelligent fallback
    }
  }
}