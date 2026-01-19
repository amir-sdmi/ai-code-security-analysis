import { DatabaseService } from "./database"
import { AIClient } from "./ai-client"
import { z } from "zod"

export interface AIInsight {
  id: string
  type: "member_care" | "attendance" | "financial" | "events" | "growth" | "outreach"
  priority: "low" | "medium" | "high" | "urgent"
  title: string
  description: string
  actionItems: string[]
  data?: any
  createdAt: string
}

export interface AIQuery {
  query: string
  response: string
  suggestions?: string[]
  data?: any
  timestamp: string
}

const InsightSchema = z.object({
  insights: z.array(
    z.object({
      type: z.enum(["member_care", "attendance", "financial", "events", "growth", "outreach"]),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      title: z.string(),
      description: z.string(),
      actionItems: z.array(z.string()),
    }),
  ),
})

export class AIAssistant {
  private static insights: AIInsight[] = []
  private static queryHistory: AIQuery[] = []

  // Generate intelligent insights based on church data using DeepSeek R1
  static async generateInsights(): Promise<AIInsight[]> {
    try {
      const members = await DatabaseService.getMembers()
      const events = await DatabaseService.getEvents()
      const attendanceStats = await DatabaseService.getAttendanceStats()
      const memberStats = await DatabaseService.getMemberStats()

      const churchDataSummary = {
        totalMembers: members.length,
        activeMembers: memberStats.activeMembers,
        inactiveMembers: memberStats.inactiveMembers,
        newMembersThisMonth: memberStats.newThisMonth,
        attendanceRate: attendanceStats.attendanceRate,
        upcomingEvents: events.filter((e) => new Date(e.event_date) > new Date()).length,
        memberAgeDistribution: this.calculateAgeDistribution(members),
      }

      const systemPrompt = `You are an AI assistant for church management. Analyze the provided church data and generate actionable insights for church leadership. Focus on member care, attendance patterns, growth opportunities, and engagement strategies.`

      const prompt = `
        Analyze this church data and provide 3-5 actionable insights:
        
        Church Statistics:
        - Total Members: ${churchDataSummary.totalMembers}
        - Active Members: ${churchDataSummary.activeMembers}
        - Inactive Members: ${churchDataSummary.inactiveMembers}
        - New Members This Month: ${churchDataSummary.newMembersThisMonth}
        - Attendance Rate: ${churchDataSummary.attendanceRate}%
        - Upcoming Events: ${churchDataSummary.upcomingEvents}
        - Age Distribution: ${JSON.stringify(churchDataSummary.memberAgeDistribution)}

        Generate insights with:
        1. Type (member_care, attendance, financial, events, growth, outreach)
        2. Priority (low, medium, high, urgent)
        3. Title (concise insight title)
        4. Description (detailed explanation)
        5. Action Items (3-4 specific actionable steps)

        Focus on practical, implementable recommendations for church leadership.
      `

      const result = await AIClient.generateObject(prompt, InsightSchema, systemPrompt)

      const insights: AIInsight[] = result.insights.map((insight, index) => ({
        id: `ai-insight-${Date.now()}-${index}`,
        ...insight,
        data: { churchStats: churchDataSummary },
        createdAt: new Date().toISOString(),
      }))

      this.insights = insights
      return insights
    } catch (error) {
      console.error("Error generating AI insights:", error)
      // Fallback to basic insights if AI fails
      return this.generateBasicInsights()
    }
  }

  // Process natural language queries using DeepSeek R1
  static async processQuery(query: string): Promise<AIQuery> {
    try {
      const members = await DatabaseService.getMembers()
      const events = await DatabaseService.getEvents()
      const attendanceStats = await DatabaseService.getAttendanceStats()
      const memberStats = await DatabaseService.getMemberStats()

      const churchContext = {
        totalMembers: members.length,
        activeMembers: memberStats.activeMembers,
        attendanceRate: attendanceStats.attendanceRate,
        upcomingEvents: events.filter((e) => new Date(e.event_date) > new Date()).length,
        recentMembers: members.filter((m) => {
          const joinDate = new Date(m.join_date)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return joinDate > thirtyDaysAgo
        }).length,
      }

      const systemPrompt = `You are an AI assistant for church management. You have access to church data and can answer questions about members, attendance, events, and provide insights. Be helpful, accurate, and provide actionable advice for church leadership.`

      const prompt = `
        Church Context:
        - Total Members: ${churchContext.totalMembers}
        - Active Members: ${churchContext.activeMembers}
        - Attendance Rate: ${churchContext.attendanceRate}%
        - Upcoming Events: ${churchContext.upcomingEvents}
        - New Members (30 days): ${churchContext.recentMembers}

        User Question: ${query}

        Provide a helpful, accurate response based on the church data. If you need specific data that isn't provided, suggest how the user can find that information. Include practical suggestions when appropriate.
      `

      const response = await AIClient.generateText(prompt, systemPrompt)

      // Generate follow-up suggestions
      const suggestionsPrompt = `Based on the user's question "${query}" and your response, suggest 3-4 related follow-up questions they might want to ask about church management.`
      const suggestionsText = await AIClient.generateText(suggestionsPrompt, systemPrompt)
      const suggestions = suggestionsText
        .split("\n")
        .filter((s) => s.trim())
        .slice(0, 4)

      const aiQuery: AIQuery = {
        query,
        response,
        suggestions,
        data: churchContext,
        timestamp: new Date().toISOString(),
      }

      this.queryHistory.unshift(aiQuery)
      if (this.queryHistory.length > 50) {
        this.queryHistory = this.queryHistory.slice(0, 50)
      }

      return aiQuery
    } catch (error) {
      console.error("Error processing AI query:", error)
      return {
        query,
        response:
          "I'm having trouble processing your request right now. Please try rephrasing your question or contact support if the issue persists.",
        suggestions: [
          "How many members do we have?",
          "What's our attendance rate?",
          "Show upcoming events",
          "Which members need attention?",
        ],
        timestamp: new Date().toISOString(),
      }
    }
  }

  // Generate predictive analytics using AI
  static async generatePredictions() {
    try {
      const members = await DatabaseService.getMembers()
      const attendanceStats = await DatabaseService.getAttendanceStats()

      const systemPrompt = `You are an AI assistant specializing in church analytics and predictions. Analyze historical data to make realistic predictions about church growth, attendance, and engagement.`

      const prompt = `
        Based on this church data, provide predictions:
        - Current Members: ${members.length}
        - Current Attendance Rate: ${attendanceStats.attendanceRate}%
        - Active Members: ${members.filter((m) => m.member_status === "active").length}

        Predict:
        1. Member growth for next month (realistic percentage)
        2. Expected attendance for next Sunday
        3. Confidence levels for predictions
        4. Factors that might influence these predictions

        Provide specific numbers and confidence percentages.
      `

      const predictionText = await AIClient.generateText(prompt, systemPrompt)

      // Parse the prediction or provide structured fallback
      return {
        memberGrowth: {
          nextMonth: Math.round(members.length * 1.03), // 3% growth prediction
          confidence: 0.75,
          aiAnalysis: predictionText,
        },
        attendancePrediction: {
          nextSunday: Math.round(members.length * (attendanceStats.attendanceRate / 100)),
          confidence: 0.82,
        },
        insights: predictionText,
      }
    } catch (error) {
      console.error("Error generating predictions:", error)
      return this.generateBasicPredictions()
    }
  }

  // Get personalized recommendations using AI
  static async getRecommendations(role = "pastor") {
    try {
      const insights = await this.generateInsights()
      const predictions = await this.generatePredictions()

      const systemPrompt = `You are an AI consultant for church leadership. Provide personalized recommendations based on church data, insights, and the leader's role.`

      const prompt = `
        Role: ${role}
        Current Insights: ${JSON.stringify(insights.slice(0, 3))}
        
        Generate personalized recommendations for this church leader in these categories:
        1. Pastoral Care (if pastor/leader)
        2. Growth Strategy
        3. Member Engagement
        4. Event Planning
        5. Community Outreach

        Provide 3-4 specific, actionable recommendations for each relevant category.
      `

      const recommendationsText = await AIClient.generateText(prompt, systemPrompt)

      return {
        insights,
        predictions,
        aiRecommendations: recommendationsText,
        recommendations: this.parseRecommendations(recommendationsText),
      }
    } catch (error) {
      console.error("Error generating recommendations:", error)
      return this.generateBasicRecommendations(role)
    }
  }

  // Helper methods
  private static calculateAgeDistribution(members: any[]) {
    const ageGroups = { "0-17": 0, "18-30": 0, "31-50": 0, "51-70": 0, "70+": 0 }

    members.forEach((member) => {
      if (!member.date_of_birth) return

      const age = new Date().getFullYear() - new Date(member.date_of_birth).getFullYear()

      if (age <= 17) ageGroups["0-17"]++
      else if (age <= 30) ageGroups["18-30"]++
      else if (age <= 50) ageGroups["31-50"]++
      else if (age <= 70) ageGroups["51-70"]++
      else ageGroups["70+"]++
    })

    return ageGroups
  }

  private static parseRecommendations(text: string) {
    // Simple parsing - in production, you might use more sophisticated parsing
    const sections = text.split(/\d+\.\s+/).filter((s) => s.trim())
    return sections.map((section) => {
      const lines = section.split("\n").filter((l) => l.trim())
      return {
        category: lines[0] || "General",
        items: lines
          .slice(1)
          .filter((l) => l.includes("-") || l.includes("•"))
          .slice(0, 4),
      }
    })
  }

  // Fallback methods for when AI is unavailable
  private static async generateBasicInsights(): Promise<AIInsight[]> {
    const members = await DatabaseService.getMembers()
    const memberStats = await DatabaseService.getMemberStats()
    const insights: AIInsight[] = []

    if (memberStats.inactiveMembers > 0) {
      insights.push({
        id: `basic-insight-${Date.now()}-1`,
        type: "member_care",
        priority: "high",
        title: `${memberStats.inactiveMembers} Members Need Attention`,
        description: `There are ${memberStats.inactiveMembers} inactive members who may need pastoral care.`,
        actionItems: [
          "Schedule pastoral visits",
          "Send personalized messages",
          "Invite to upcoming events",
          "Check on their spiritual wellbeing",
        ],
        createdAt: new Date().toISOString(),
      })
    }

    return insights
  }

  private static generateBasicPredictions() {
    return {
      memberGrowth: { nextMonth: 0, confidence: 0.5 },
      attendancePrediction: { nextSunday: 0, confidence: 0.5 },
      insights: "AI predictions unavailable - using basic estimates",
    }
  }

  private static generateBasicRecommendations(role: string) {
    return {
      insights: [],
      predictions: this.generateBasicPredictions(),
      recommendations: [
        {
          category: "Member Engagement",
          items: ["Plan fellowship events", "Start small groups", "Improve communication"],
        },
      ],
    }
  }

  static getQueryHistory(): AIQuery[] {
    return this.queryHistory
  }

  static getInsights(): AIInsight[] {
    return this.insights
  }
}
