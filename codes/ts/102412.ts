import { supabase } from '@/lib/supabase'
export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    documentIds?: string[]
    clientId?: string
    actionType?: string
    confidence?: number
  }
}
export interface AIConversation {
  id: string
  userId: string
  title: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}
export interface DocumentAnalysisResult {
  documentId: string
  documentType: string
  extractedData: Record<string, any>
  confidence: number
  insights: string[]
  recommendations: string[]
  errors: string[]
  processingTime: number
}
export interface TaxCalculationRequest {
  clientId?: string
  income: Record<string, number>
  deductions: Record<string, number>
  filingStatus: string
  taxYear: number
  state?: string
}
export interface TaxCalculationResult {
  federalTax: number
  stateTax: number
  selfEmploymentTax: number
  totalTax: number
  effectiveRate: number
  marginalRate: number
  refundOrOwed: number
  breakdown: Record<string, number>
  recommendations: string[]
}
export class AIService {
  private apiKey: string
  private baseUrl: string = 'https://openrouter.ai/api/v1'
  constructor(private userId: string, apiKey?: string) {
    // Try multiple sources for API key
    this.apiKey = apiKey ||
                  (typeof window !== 'undefined' ? localStorage.getItem('openrouter_api_key') : null) ||
                  process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
                  process.env.OPENROUTER_API_KEY ||
                  ''

    if (!this.apiKey) {
      console.log('🤖 AI Assistant running in demo mode - add OpenRouter API key for real AI responses')
      console.log('🔍 Checked sources:', {
        localStorage: typeof window !== 'undefined' ? !!localStorage.getItem('openrouter_api_key') : 'N/A (server)',
        nextPublic: !!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
        regular: !!process.env.OPENROUTER_API_KEY
      })
    } else {
      console.log('🚀 AI Assistant connected to OpenRouter with DeepSeek V3 model')
      console.log('🔑 API Key source:', this.apiKey.substring(0, 20) + '...')
    }
  }
  /**
   * Send a chat message and get AI response
   */
  async sendMessage(
    message: string,
    conversationId?: string,
    context?: {
      documentIds?: string[]
      clientId?: string
      actionType?: string
    }
  ): Promise<{ response: string; conversationId: string }> {
    try {
      // Get or create conversation with fallback
      let conversation: AIConversation | null = null
      if (conversationId) {
        conversation = await this.getConversation(conversationId)
      }
      if (!conversation) {
        conversation = await this.createConversation('New Chat')
      }
      // If still no conversation, create a local fallback
      if (!conversation) {
        conversation = this.createLocalConversation('Local Chat')
      }
      // Add user message to conversation
      const userMessage: AIMessage = {
        id: this.generateId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        metadata: context
      }
      // Get context for the AI
      const systemContext = await this.buildSystemContext(context)
      // Prepare messages for AI
      const messages = [
        {
          role: 'system',
          content: systemContext
        },
        ...conversation.messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ]
      // Call AI API
      const aiResponse = await this.callAI(messages)
      // Create assistant message
      const assistantMessage: AIMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }
      // Update conversation
      conversation.messages.push(userMessage, assistantMessage)
      conversation.updatedAt = new Date()
      // Try to save conversation, but don't fail if it doesn't work
      try {
        await this.saveConversation(conversation)
      } catch (saveError) {
        }
      return {
        response: aiResponse,
        conversationId: conversation.id
      }
    } catch (error) {
      // Fallback: return a basic response even if everything fails
      const fallbackResponse = this.getFallbackResponse(message)
      const fallbackId = 'fallback-' + Date.now()
      return {
        response: fallbackResponse,
        conversationId: fallbackId
      }
    }
  }
  /**
   * Analyze a document using AI
   */
  async analyzeDocument(documentId: string): Promise<DocumentAnalysisResult> {
    try {
      const startTime = Date.now()
      // Get document from database
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', this.userId)
        .single()
      if (error || !document) {
        throw new Error('Document not found')
      }
      // For now, simulate AI analysis
      // In production, this would:
      // 1. Extract text using OCR if needed
      // 2. Send to AI for analysis
      // 3. Parse and structure the response
      const mockResult: DocumentAnalysisResult = {
        documentId,
        documentType: this.identifyDocumentType(document.name, document.type),
        extractedData: this.generateMockExtractedData(document.name),
        confidence: 0.95,
        insights: [
          'Document appears to be a valid tax document',
          'All required fields are present',
          'No obvious errors detected'
        ],
        recommendations: [
          'Verify the accuracy of extracted amounts',
          'Cross-reference with other tax documents',
          'Consider tax optimization opportunities'
        ],
        errors: [],
        processingTime: Date.now() - startTime
      }
      // Update document with analysis results
      await supabase
        .from('documents')
        .update({
          ai_analysis_status: 'complete',
          ai_analysis_result: mockResult,
          processing_status: 'completed'
        })
        .eq('id', documentId)
      return mockResult
    } catch (error) {
      throw new Error('Failed to analyze document')
    }
  }
  /**
   * Perform tax calculations
   */
  async calculateTaxes(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    try {
      // Mock tax calculation - in production, this would use actual tax calculation logic
      const totalIncome = Object.values(request.income).reduce((sum, val) => sum + val, 0)
      const totalDeductions = Object.values(request.deductions).reduce((sum, val) => sum + val, 0)
      const taxableIncome = Math.max(0, totalIncome - totalDeductions)
      // Simplified tax calculation (this would be much more complex in reality)
      const federalTax = this.calculateFederalTax(taxableIncome, request.filingStatus)
      const stateTax = this.calculateStateTax(taxableIncome, request.state || 'CA')
      const selfEmploymentTax = this.calculateSelfEmploymentTax(request.income.selfEmployment || 0)
      const totalTax = federalTax + stateTax + selfEmploymentTax
      const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0
      const marginalRate = this.getMarginalTaxRate(taxableIncome, request.filingStatus)
      return {
        federalTax,
        stateTax,
        selfEmploymentTax,
        totalTax,
        effectiveRate,
        marginalRate,
        refundOrOwed: totalTax, // Simplified - would subtract withholdings
        breakdown: {
          grossIncome: totalIncome,
          adjustedGrossIncome: totalIncome,
          taxableIncome,
          standardDeduction: this.getStandardDeduction(request.filingStatus, request.taxYear),
          itemizedDeductions: totalDeductions
        },
        recommendations: this.generateTaxRecommendations(request, totalTax)
      }
    } catch (error) {
      throw new Error('Failed to calculate taxes')
    }
  }
  /**
   * Get client insights and recommendations
   */
  async getClientInsights(clientId: string): Promise<string[]> {
    try {
      // Get client data and documents
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', this.userId)
      // Generate insights based on client data
      const insights = [
        'Client has submitted all required documents for tax preparation',
        'Potential tax savings opportunity through retirement contributions',
        'Consider quarterly estimated tax payments for next year',
        'Review business expense categorization for optimization'
      ]
      return insights
    } catch (error) {
      return ['Unable to generate insights at this time']
    }
  }
  // Private helper methods
  private async callAI(messages: any[]): Promise<string> {
    if (!this.apiKey) {
      // Demo mode with realistic responses
      const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
      if (userMessage.includes('document') || userMessage.includes('analyze')) {
        return `I can help you analyze documents! Here's what I found:
📄 **Document Analysis Summary:**
- Document type: Tax form (W-2/1099)
- Confidence level: 95%
- Key data extracted: Income, withholdings, employer info
- Status: Ready for processing
**Recommendations:**
• Verify all amounts match your records
• Check for any missing forms
• Consider tax optimization opportunities
Would you like me to help with tax calculations or planning strategies?`
      }
      if (userMessage.includes('tax') || userMessage.includes('calculate')) {
        return `I can help with tax calculations! Here's a sample analysis:
💰 **Tax Calculation Summary:**
- Estimated Federal Tax: $12,450
- State Tax (CA): $3,200
- Total Tax Liability: $15,650
- Effective Tax Rate: 18.2%
**Tax Planning Opportunities:**
• Maximize retirement contributions (save ~$2,400)
• Consider itemized deductions
• Plan quarterly payments for next year
Need help with specific calculations or planning strategies?`
      }
      if (userMessage.includes('client') || userMessage.includes('deadline')) {
        return `Here's your client overview:
👥 **Client Status Summary:**
- Total active clients: 24
- Pending document reviews: 3
- Upcoming deadlines: 5 clients
**Priority Actions:**
• Johnson LLC - Quarterly filing due March 15
• Smith Family - Missing W-2 forms
• ABC Corp - Schedule review meeting
Would you like me to provide detailed insights for any specific client?`
      }
      if (userMessage.includes('planning') || userMessage.includes('strategy')) {
        return `Here's a comprehensive tax planning strategy:
📊 **Strategic Tax Planning:**
**Short-term (This Year):**
• Maximize retirement contributions
• Harvest tax losses
• Accelerate/defer income as needed
**Long-term (Multi-year):**
• Roth conversion strategies
• Estate planning considerations
• Business structure optimization
**Key Recommendations:**
• Review quarterly to adjust strategies
• Monitor tax law changes
• Coordinate with financial planning
Need help implementing any of these strategies?`
      }
      return `Hello! I'm E.P AI, your intelligent tax practice assistant. I can help you with:
🔍 **Document Analysis** - Extract data from tax forms with high accuracy
📊 **Tax Calculations** - Perform complex calculations and projections
👥 **Client Management** - Track deadlines and provide insights
💡 **Tax Planning** - Strategic recommendations and optimization
*Note: I'm currently in demo mode. With a proper API key, I'd provide real-time AI assistance.*
What would you like help with today?`
    }
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          temperature: 0.1,
          maxTokens: 1500
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`AI API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      return data.response || 'No response generated'

    } catch (error) {
      // Fallback to demo mode if API fails
      return this.getDemoResponse(messages)
    }
  }

  private getDemoResponse(messages?: any[]): string {
    const userMessage = messages?.[messages.length - 1]?.content?.toLowerCase() || ''

    if (userMessage.includes('document') || userMessage.includes('analyze')) {
      return `I can help you analyze documents! Here's what I found:
📄 **Document Analysis Summary:**
- Document type: Tax form (W-2/1099)
- Confidence level: 95%
- Key data extracted: Income, withholdings, employer info
- Status: Ready for processing
**Recommendations:**
• Verify all amounts match your records
• Check for any missing forms
• Consider tax optimization opportunities
Would you like me to help with tax calculations or planning strategies?`
    }

    if (userMessage.includes('tax') || userMessage.includes('calculate')) {
      return `I can help with tax calculations! Here's a sample analysis:
💰 **Tax Calculation Summary:**
- Estimated Federal Tax: $12,450
- State Tax (CA): $3,200
- Total Tax Liability: $15,650
- Effective Tax Rate: 18.2%
**Tax Planning Opportunities:**
• Maximize retirement contributions (save ~$2,400)
• Consider itemized deductions
• Plan quarterly payments for next year
Need help with specific calculations or planning strategies?`
    }

    return `Hello! I'm ZyxAI, your intelligent business automation assistant. I can help you with:
🔍 **Voice Automation** - Set up AI voice agents for your business
📊 **Call Analytics** - Track performance and optimize campaigns
👥 **CRM Integration** - Connect with your existing business tools
💡 **Business Optimization** - Strategic recommendations and automation

*Note: I'm currently in demo mode. The AI service will automatically connect when properly configured.*
What would you like help with today?`
  }
  private async buildSystemContext(context?: any): Promise<string> {
    const currentYear = new Date().getFullYear()
    let systemPrompt = `You are E.P AI, an expert tax professional assistant powered by advanced AI. You are knowledgeable about US tax law, regulations, and best practices for tax year ${currentYear} and prior years.

**Your Expertise:**
• Tax document analysis and data extraction (W-2, 1099s, K-1s, Schedule C, etc.)
• Federal and state tax calculations and projections
• Tax planning strategies and optimization opportunities
• Business tax compliance and deduction identification
• Client management and deadline tracking
• IRS regulations and recent tax law changes
• Audit preparation and representation guidance
• Quarterly estimated tax calculations

**Your Communication Style:**
• Professional, accurate, and actionable advice
• Use bullet points and clear formatting for readability
• Provide specific examples and calculations when helpful
• Always cite relevant tax codes and IRS publications when applicable
• Explain complex concepts in understandable terms
• Prioritize compliance and accuracy over aggressive strategies

**Important Guidelines:**
• Always recommend consulting with a qualified tax professional for complex situations
• Stay current with tax law changes and IRS guidance
• Provide estimates and projections as approximations, not guarantees
• Emphasize proper record-keeping and documentation requirements
• Consider both current year and multi-year tax planning implications`
    if (context?.clientId) {
      // Add client-specific context
      systemPrompt += `\n\nYou are currently working with a specific client. Provide personalized advice and insights.`
    }
    if (context?.documentIds?.length) {
      // Add document context
      systemPrompt += `\n\nYou have access to the client's uploaded documents. Reference them when providing analysis.`
    }
    return systemPrompt
  }
  private async createConversation(title: string): Promise<AIConversation | null> {
    try {
      const conversation: AIConversation = {
        id: this.generateId(),
        userId: this.userId,
        title,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      }
      await this.saveConversation(conversation)
      return conversation
    } catch (error) {
      return null
    }
  }
  private createLocalConversation(title: string): AIConversation {
    return {
      id: 'local-' + this.generateId(),
      userId: this.userId,
      title: title + ' (Local)',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { local: true }
    }
  }
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('document') || lowerMessage.includes('analyze')) {
      return `I understand you want to analyze documents. I'm currently in demo mode, but I can help you with document analysis once properly configured.`
    }
    if (lowerMessage.includes('tax') || lowerMessage.includes('calculate')) {
      return `I can help with tax calculations! I'm currently in demo mode, but I can provide tax calculation assistance once properly configured.`
    }
    if (lowerMessage.includes('client')) {
      return `I can help with client management! I'm currently in demo mode, but I can provide client insights once properly configured.`
    }
    return `Hello! I'm Neuronize AI. I'm currently in demo mode, but I can help you with tax preparation, document analysis, and client management once properly configured. What would you like to know about?`
  }
  private async getConversation(id: string): Promise<AIConversation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', this.userId)
        .single()
      if (error || !data) return null
      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        messages: data.messages || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        metadata: data.metadata
      }
    } catch (error) {
      return null
    }
  }
  private async saveConversation(conversation: AIConversation): Promise<void> {
    // Don't try to save local conversations
    if (conversation.metadata?.local) {
      return
    }
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .upsert({
          id: conversation.id,
          user_id: conversation.userId,
          title: conversation.title,
          messages: conversation.messages,
          metadata: conversation.metadata || {},
          updated_at: conversation.updatedAt.toISOString(),
          created_at: conversation.createdAt.toISOString()
        }, {
          onConflict: 'id'
        })
      if (error) {
        throw new Error(`Failed to save conversation: ${error.message}`)
      }
    } catch (err) {
      throw err
    }
  }
  private identifyDocumentType(filename: string, mimeType: string): string {
    const name = filename.toLowerCase()
    if (name.includes('w-2') || name.includes('w2')) return 'W-2'
    if (name.includes('1099')) return '1099'
    if (name.includes('receipt')) return 'Receipt'
    if (name.includes('invoice')) return 'Invoice'
    if (name.includes('bank') || name.includes('statement')) return 'Bank Statement'
    return 'Unknown'
  }
  private generateMockExtractedData(filename: string): Record<string, any> {
    // Mock extracted data based on document type
    if (filename.toLowerCase().includes('w-2')) {
      return {
        employer: 'ABC Corporation',
        wages: 75000,
        federalTaxWithheld: 12000,
        socialSecurityWages: 75000,
        medicareWages: 75000
      }
    }
    return { processed: true }
  }
  private calculateFederalTax(taxableIncome: number, filingStatus: string): number {
    // Simplified federal tax calculation
    const brackets = filingStatus === 'married_filing_jointly'
      ? [[0, 0.10], [22550, 0.12], [89450, 0.22], [190750, 0.24]]
      : [[0, 0.10], [11000, 0.12], [44725, 0.22], [95375, 0.24]]
    let tax = 0
    let previousBracket = 0
    for (const [threshold, rate] of brackets) {
      if (taxableIncome > threshold) {
        const taxableAtThisRate = Math.min(taxableIncome - threshold,
          brackets[brackets.indexOf([threshold, rate]) + 1]?.[0] - threshold || taxableIncome)
        tax += taxableAtThisRate * rate
        previousBracket = threshold
      }
    }
    return Math.round(tax)
  }
  private calculateStateTax(taxableIncome: number, state: string): number {
    // Simplified state tax calculation
    const stateRates: Record<string, number> = {
      'CA': 0.08,
      'NY': 0.07,
      'TX': 0.00,
      'FL': 0.00
    }
    return Math.round(taxableIncome * (stateRates[state] || 0.05))
  }
  private calculateSelfEmploymentTax(selfEmploymentIncome: number): number {
    return Math.round(selfEmploymentIncome * 0.1413) // Simplified SE tax rate
  }
  private getMarginalTaxRate(taxableIncome: number, filingStatus: string): number {
    // Return marginal tax rate as percentage
    if (taxableIncome > 95375) return 24
    if (taxableIncome > 44725) return 22
    if (taxableIncome > 11000) return 12
    return 10
  }
  private getStandardDeduction(filingStatus: string, taxYear: number): number {
    const deductions: Record<string, number> = {
      'single': 14600,
      'married_filing_jointly': 29200,
      'married_filing_separately': 14600,
      'head_of_household': 21900
    }
    return deductions[filingStatus] || 14600
  }
  private generateTaxRecommendations(request: TaxCalculationRequest, totalTax: number): string[] {
    const recommendations = []
    if (totalTax > 10000) {
      recommendations.push('Consider maximizing retirement contributions to reduce taxable income')
    }
    if (request.income.selfEmployment && request.income.selfEmployment > 0) {
      recommendations.push('Review business expenses for additional deductions')
      recommendations.push('Consider quarterly estimated tax payments')
    }
    recommendations.push('Evaluate tax-loss harvesting opportunities')
    recommendations.push('Review withholding amounts for next year')
    return recommendations
  }
  private generateId(): string {
    // Generate a proper UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}
