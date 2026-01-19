import { GoogleGenerativeAI } from '@google/generative-ai'
import { ethers } from 'ethers'
import { ProtectedPayAIService } from './aiService'
import { getSupportedTokensForChain } from '@/utils/constants'
import { getUserTransfers, getUserTokenTransfers } from '@/utils/contract'

interface GeminiAIResponse {
  message: string
  action?: {
    type: 'send' | 'claim' | 'refund' | 'balance' | 'transfers' | 'chain_info' | 'supported_tokens' | 'register_username' | 'create_group_payment' | 'create_savings_pot' | 'view_group_payments' | 'view_savings_pots' | 'contribute_group_payment' | 'contribute_savings_pot' | 'break_savings_pot' | 'transaction_history' | 'filtered_transactions'
    data?: any
  }
  confirmation?: {
    message: string
    data: any
  }
  data?: any
}

interface ConversationContext {
  pendingAction?: {
    type: 'send' | 'claim' | 'refund' | 'register_username' | 'create_group_payment' | 'create_savings_pot' | 'contribute_group_payment' | 'contribute_savings_pot' | 'break_savings_pot'
    data: any
    message: string
  }
  lastResponse?: string
  messageHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>
}

export class GeminiProtectedPayService {
  private genAI: GoogleGenerativeAI
  private model: any
  private aiService: ProtectedPayAIService
  private conversationContext: ConversationContext
  private lastRequestTime: number = 0
  private minRequestInterval: number = 1000 // 1 second between requests
  
  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error('Google API key not found. Please set NEXT_PUBLIC_GOOGLE_API_KEY in your environment variables.')
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    // Use Gemini 2.5 Flash model
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    })
    this.aiService = new ProtectedPayAIService()
    this.conversationContext = {
      messageHistory: []
    }
  }

  async processUserMessage(
    userMessage: string,
    context: {
      address?: string
      chainId?: number
      signer?: ethers.Signer
    }
  ): Promise<GeminiAIResponse> {
    try {
      // Rate limiting to prevent quota issues
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest))
      }
      this.lastRequestTime = Date.now()

      // Add user message to conversation history
      this.conversationContext.messageHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
      })

      // Check if this is a confirmation response (yes/no/confirm/cancel)
      const confirmationResponse = this.checkForConfirmationResponse(userMessage)
      if (confirmationResponse !== null) {
        return await this.handleConfirmationResponse(confirmationResponse, context)
      }

      const { address, chainId, signer } = context
      
      // Build conversation history for context
      const conversationHistory = this.conversationContext.messageHistory
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')
      
      // Check if this is a follow-up query based on context
      const lastResponse = this.conversationContext.messageHistory
        .slice(-2) // Look at last 2 messages (user and assistant)
        .filter(msg => msg.role === 'assistant')[0]
      
      // Also check if user mentioned a token and then said "balance"
      const recentTokenMention = this.conversationContext.messageHistory
        .slice(-3) // Look at last 3 messages
        .find(msg => msg.role === 'user' && 
          msg.content.toLowerCase().match(/\b(bdag|usdc|usdt|blockdag)\b/i))
      
      let contextualPrompt = ''
      if (lastResponse && lastResponse.content.includes('Balance:')) {
        // Previous message was a balance response, check if this is asking for different token or all tokens
        const tokenPatterns = [
          /\b(bdag|block-dag|BDAG|in\s+bdag)\b/i,
          /\b(usdc|usd-c|USDC|in\s+usdc)\b/i,
          /\b(usdt|usd-t|USDT|in\s+usdt)\b/i
        ]
        
        const allTokenPatterns = [
          /\b(for\s+all|all\s+tokens|all\s+balances|show\s+all)\b/i
        ]
        
        let hasTokenPattern = false
        for (const pattern of tokenPatterns) {
          if (pattern.test(userMessage)) {
            hasTokenPattern = true
            break
          }
        }
        
        let hasAllPattern = false
        for (const pattern of allTokenPatterns) {
          if (pattern.test(userMessage)) {
            hasAllPattern = true
            break
          }
        }
        
        if (hasTokenPattern || hasAllPattern) {
          contextualPrompt = `\nCONTEXT: User just asked for balance and now wants to see ${hasAllPattern ? 'all token balances' : 'a specific token balance'}. Convert this to a balance query.`
        }
      }

      // Create context-aware prompt for Gemini
      const systemPrompt = `You are an AI assistant for ProtectedPay, a blockchain payment system. You help users interact with smart contracts using natural language.

AVAILABLE ACTIONS:
1. CHECK BALANCE - Get token balances for an address
2. SEND TRANSFER - Send protected transfers to addresses or usernames  
3. CLAIM TRANSFER - Claim pending transfers by ID, address, or username
4. REFUND TRANSFER - Refund unclaimed transfers
5. VIEW TRANSFERS - Get pending transfers for an address
6. REGISTER USERNAME - Register a username for the wallet address
7. CHAIN INFO - Get supported blockchain networks
8. SUPPORTED TOKENS - Get supported tokens for a chain
9. CREATE GROUP PAYMENT - Create a new group payment for multiple contributors
10. VIEW GROUP PAYMENTS - Show all user's group payments
11. CONTRIBUTE GROUP PAYMENT - Add funds to an existing group payment
12. CREATE SAVINGS POT - Create a new savings goal with target amount
13. VIEW SAVINGS POTS - Show all user's savings pots
14. CONTRIBUTE SAVINGS POT - Add funds to a savings pot
15. BREAK SAVINGS POT - Withdraw all funds from a savings pot
16. TRANSACTION HISTORY - View all transactions, group payments, and savings pots
17. FILTERED TRANSACTIONS - Search transactions by status, direction, or token type

TRANSACTION FILTERING OPTIONS:
- By Status: "show refunded transactions", "pending transfers", "completed payments"
- By Direction: "sent transactions", "received transfers", "outgoing payments"  
- By Token: "BDAG transactions", "USDC transfers", "USDT payments"
- Combined: "show my refunded BDAG transfers", "pending USDC transactions"

SUPPORTED CHAINS:
- BlockDAG Testnet (Chain ID: 1043)

CURRENT CONTEXT:
- User Address: ${address || 'Not connected'}
- Current Chain: ${chainId || 'Unknown'}
- Wallet: ${signer ? 'Connected' : 'Not connected'}
${this.conversationContext.pendingAction ? `- PENDING ACTION: ${this.conversationContext.pendingAction.type} (waiting for confirmation)` : ''}

CONVERSATION HISTORY:
${conversationHistory}${contextualPrompt}

CURRENT MESSAGE: "${userMessage}"

${recentTokenMention && userMessage.toLowerCase().includes('balance') ? 
  `ADDITIONAL CONTEXT: User previously mentioned token in recent messages. This balance query may be related to that token.` : ''}

INSTRUCTIONS:
1. Analyze the user's request and determine if it requires calling a blockchain function
2. If it's a balance check, transfer operation, username registration, or chain query, specify the action needed
3. Always be helpful and explain what you're doing
4. If the user's request is unclear, ask for clarification
5. For transactions (send, claim, refund, register username), ask for confirmation before proceeding
6. For balance checks, information queries, execute immediately (no confirmation needed)
7. Use friendly, conversational language and maintain context from previous messages
8. If users ask about token prices or market data, explain that you don't have access to real-time data but can help with wallet operations

RESPONSE FORMAT:
Provide a helpful response and if action is needed, specify the action type and required data.

Examples:
- "Check my balance" → ACTION: balance check (execute immediately)
- "Send 100 BDAG to 0x123..." → ACTION: send transfer (ask for confirmation)
- "Register username alice" → ACTION: register username (ask for confirmation)
- "What chains are supported?" → ACTION: chain info (execute immediately)
- "Show pending transfers" → ACTION: view transfers (execute immediately)`

      const prompt = `${systemPrompt}\n\nPlease respond to the user's message: "${userMessage}"`
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const geminiResponse = response.text()
      
      // Add assistant response to conversation history
      this.conversationContext.messageHistory.push({
        role: 'assistant',
        content: geminiResponse,
        timestamp: Date.now()
      })
      
      // Parse the response to extract actions
      const action = this.extractActionFromResponse(userMessage, geminiResponse)
      
      if (action) {
        // Execute the action using the AI service
        try {
          const actionResult = await this.executeAction(action, context)
          
          // Balance checks, chain info, and transaction queries should return results immediately (no confirmation)
          if (action.type === 'balance' || action.type === 'chain_info' || action.type === 'transfers' || action.type === 'supported_tokens' || action.type === 'transaction_history' || action.type === 'filtered_transactions' || action.type === 'view_group_payments' || action.type === 'view_savings_pots') {
            return {
              message: actionResult.message,
              action: action,
              data: actionResult.data
            }
          }
          
          // Other actions (send, claim, refund, register_username) require confirmation - store the pending action
          this.conversationContext.pendingAction = {
            type: action.type as 'send' | 'claim' | 'refund' | 'register_username',
            data: action.data,
            message: geminiResponse
          }
          
          return {
            message: geminiResponse,
            action: action,
            confirmation: actionResult
          }
        } catch (error) {
          return {
            message: `${geminiResponse}\n\n❌ **Error executing action**: ${error instanceof Error ? error.message : 'Unknown error'}`,
            action: action
          }
        }
      }
      
      return {
        message: geminiResponse
      }
      
    } catch (error) {
      console.error('Gemini AI Error:', error)
      
      // Handle specific API errors
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota')) {
          return {
            message: `⚠️ **API Quota Exceeded**\n\nThe Gemini AI service has reached its usage limit. This can happen due to:\n\n• **Free tier limits**: You may have exceeded the free quota\n• **Rate limiting**: Too many requests in a short time\n\n**Solutions:**\n1. Wait a few minutes and try again\n2. Check your [Google AI Studio](https://aistudio.google.com/) quota\n3. Consider upgrading to a paid plan for higher limits\n\n*For now, you can still use the basic wallet functions without AI assistance.*`
          }
        } else if (error.message.includes('API key')) {
          return {
            message: `🔑 **API Key Error**\n\nThere's an issue with the Google API key. Please check that your GOOGLE_API_KEY is set correctly in the .env file.\n\nGet a new API key at: https://aistudio.google.com/`
          }
        }
      }
      
      return {
        message: `❌ **AI Service Error**: ${error instanceof Error ? error.message : 'Failed to process your request. Please try again.'}`
      }
    }
  }

  private extractActionFromResponse(userMessage: string, geminiResponse: string): any {
    const userLower = userMessage.toLowerCase()
    
    // Check for follow-up balance queries based on context
    const lastResponse = this.conversationContext.messageHistory
      .slice(-2)
      .filter(msg => msg.role === 'assistant')[0]
    
    const isFollowUpBalanceQuery = lastResponse && lastResponse.content.includes('Balance:') && 
      (userLower.includes('for all') || userLower.includes('all tokens') || 
       userLower.includes('all balances') || userLower.includes('show all') ||
       userLower.match(/^\s*(bdag|usdc|usdt|blockdag)\s*$/i) ||
       userLower.match(/\b(in|for)\s+(bdag|usdc|usdt|blockdag)\b/i) ||
       userLower.match(/^(for|in)\s+(bdag|usdc|usdt|blockdag)$/i))
    
    // Also check if user mentioned a token and then said "balance"
    const recentTokenMention = this.conversationContext.messageHistory
      .slice(-3) // Look at last 3 messages
      .find(msg => msg.role === 'user' && 
        msg.content.toLowerCase().match(/\b(bdag|usdc|usdt|blockdag)\b/i))
    
    const isTokenBalanceFollowUp = recentTokenMention && userLower.includes('balance') && 
      !userLower.match(/\b(bdag|usdc|usdt|blockdag)\b/i)
    
    // Balance check patterns - improved to detect specific tokens and follow-up queries
    if (userLower.includes('balance') || userLower.includes('how much') || 
        userLower.match(/\b(in|my)\s+(bdag|usdc|usdt|blockdag)\b/i) ||
        userLower.match(/^\s*(bdag|usdc|usdt|blockdag)\s*$/i) ||
        userLower.includes('for all') || userLower.includes('all tokens') || 
        userLower.includes('all balances') || userLower.includes('show all') ||
        isFollowUpBalanceQuery || isTokenBalanceFollowUp) {
      
      const addressMatch = userMessage.match(/0x[a-fA-F0-9]{40}/)
      const chainMatch = userMessage.match(/chain\s+(\d+)|on\s+(\d+)|testnet|mainnet|blockdag/)
      
      // Extract specific token mentions - improved pattern matching including follow-up queries
      const tokenPatterns = [
        /\b(bdag|block-dag|BDAG|in\s+bdag|^\s*bdag\s*$)\b/i,        // BDAG variations
        /\b(usdc|usd-c|USDC|in\s+usdc|^\s*usdc\s*$)\b/i,            // USDC variations  
        /\b(usdt|usd-t|USDT|in\s+usdt|^\s*usdt\s*$)\b/i             // USDT variations
      ]
      
      let detectedToken = null
      for (const pattern of tokenPatterns) {
        const match = userMessage.match(pattern)
        if (match) {
          let tokenSymbol = match[1].toUpperCase()
          // Normalize token symbols
          if (tokenSymbol.includes('TUSDFC') || tokenSymbol.includes('T-USDFC')) {
            tokenSymbol = 'tUSDFC'
          } else if (tokenSymbol.includes('TFIL') || tokenSymbol.includes('T-FIL')) {
            tokenSymbol = 'tFIL'
          }
          detectedToken = tokenSymbol
          break
        }
      }
      
      // If no token detected in current message but this is a follow-up to a token mention
      if (!detectedToken && isTokenBalanceFollowUp && recentTokenMention) {
        const tokenMatch = recentTokenMention.content.toLowerCase().match(/\b(bdag|usdc|usdt)\b/i)
        if (tokenMatch) {
          let tokenSymbol = tokenMatch[1].toUpperCase()
          detectedToken = tokenSymbol
        }
      }
      
      const allBalanceMatch = userLower.includes('all') || userLower.includes('every') || userLower.includes('total') || 
                             userLower.includes('for all') || userLower.includes('all tokens') || userLower.includes('all balances')
      
      return {
        type: 'balance',
        data: {
          address: addressMatch ? addressMatch[0] : null,
          chainId: chainMatch ? (chainMatch[1] || chainMatch[2]) : null,
          token: detectedToken,
          showAll: allBalanceMatch
        }
      }
    }
    
    // Send transfer patterns
    if (userLower.includes('send') && (userLower.includes('to') || userLower.includes('transfer'))) {
      const amountMatch = userMessage.match(/(\d+(?:\.\d+)?)\s*(\w+)?/)
      const addressMatch = userMessage.match(/to\s+(0x[a-fA-F0-9]{40}|\w+)/)
      const messageMatch = userMessage.match(/message[:\s]+"([^"]+)"|note[:\s]+"([^"]+)"/)
      
      return {
        type: 'send',
        data: {
          amount: amountMatch ? amountMatch[1] : null,
          token: amountMatch ? amountMatch[2] : 'BDAG',
          recipient: addressMatch ? addressMatch[1] : null,
          message: messageMatch ? (messageMatch[1] || messageMatch[2]) : ''
        }
      }
    }
    
    // Claim transfer patterns
    if (userLower.includes('claim')) {
      const idMatch = userMessage.match(/id\s+(0x[a-fA-F0-9]+)/)
      const addressMatch = userMessage.match(/from\s+(0x[a-fA-F0-9]{40}|\w+)/)
      
      return {
        type: 'claim',
        data: {
          identifier: idMatch ? idMatch[1] : (addressMatch ? addressMatch[1] : null)
        }
      }
    }
    
    // Filtered transaction queries - CHECK THESE FIRST before general refund patterns
    if (userLower.includes('show') || userLower.includes('get') || userLower.includes('find') || userLower.includes('list')) {
      // Check for group payments FIRST
      if ((userLower.includes('group') && userLower.includes('payment')) || 
          (userLower.includes('grp') && userLower.includes('payment')) ||
          userLower.includes('group payments') || userLower.includes('grp payments') ||
          userLower.includes('grp txns') || userLower.includes('group txns') ||
          (userLower.includes('grp') && userLower.includes('txn')) ||
          (userLower.includes('group') && userLower.includes('txn'))) {
        return {
          type: 'view_group_payments',
          data: {}
        }
      }
      
      // Check for savings pots FIRST
      if (userLower.includes('savings pot') || userLower.includes('saving pot') || 
          userLower.includes('savings pots') || userLower.includes('saving pots') ||
          (userLower.includes('savings') && userLower.includes('pot')) || 
          (userLower.includes('saving') && userLower.includes('pot'))) {
        return {
          type: 'view_savings_pots',
          data: {}
        }
      }
      
      // Check for refunded transactions
      if (userLower.includes('refunded') || (userLower.includes('refund') && (userLower.includes('transaction') || userLower.includes('transfer') || userLower.includes('txn')))) {
        return {
          type: 'filtered_transactions',
          data: { filter: 'refunded transactions' }
        }
      }
      
      // Check for completed/claimed transactions
      if (userLower.includes('completed') || userLower.includes('claimed') || userLower.includes('successful')) {
        return {
          type: 'filtered_transactions',
          data: { filter: 'completed transactions' }
        }
      }
      
      // Check for pending transactions
      if (userLower.includes('pending') || userLower.includes('unclaimed')) {
        return {
          type: 'filtered_transactions',
          data: { filter: 'pending transactions' }
        }
      }
      
      // Check for sent transactions
      if (userLower.includes('sent') || userLower.includes('outgoing') || userLower.includes('i sent')) {
        return {
          type: 'filtered_transactions',
          data: { filter: 'sent transactions' }
        }
      }
      
      // Check for received transactions
      if (userLower.includes('received') || userLower.includes('incoming') || userLower.includes('i received')) {
        return {
          type: 'filtered_transactions',
          data: { filter: 'received transactions' }
        }
      }
      
      // Check for token-specific transactions
      const tokenPatterns = [
        { pattern: /\b(bdag|bdagtoken)\s+(transaction|transfer|payment)/i, filter: 'BDAG transactions' },
        { pattern: /\b(usdc|usd-c)\s+(transaction|transfer|payment)/i, filter: 'USDC transactions' },
        { pattern: /\b(usdt|usd-t)\s+(transaction|transfer|payment)/i, filter: 'USDT transactions' },
        { pattern: /\b(tusdfc|t-usdfc)\s+(transaction|transfer|payment)/i, filter: 'tUSDFC transactions' },
        { pattern: /\b(tfil|t-fil)\s+(transaction|transfer|payment)/i, filter: 'tFIL transactions' }
      ]
      
      for (const { pattern, filter } of tokenPatterns) {
        if (pattern.test(userMessage)) {
          return {
            type: 'filtered_transactions',
            data: { filter }
          }
        }
      }
    }

    // Refund transfer patterns - ONLY for specific refund actions with transfer IDs
    if (userLower.includes('refund') && !userLower.includes('show') && !userLower.includes('find') && !userLower.includes('list')) {
      const idMatch = userMessage.match(/(0x[a-fA-F0-9]+)/)
      
      return {
        type: 'refund',
        data: {
          transferId: idMatch ? idMatch[1] : null
        }
      }
    }
    
    // View transfers patterns - only for specific pending transfers requests
    if (userLower.includes('pending') && userLower.includes('transfers')) {
      const addressMatch = userMessage.match(/for\s+(0x[a-fA-F0-9]{40})/)
      
      return {
        type: 'transfers',
        data: {
          address: addressMatch ? addressMatch[1] : null
        }
      }
    }
    
    // Chain info patterns
    if (userLower.includes('chain') || userLower.includes('network') || userLower.includes('support')) {
      return {
        type: 'chain_info',
        data: {}
      }
    }
    
    // Supported tokens patterns
    if (userLower.includes('token') && userLower.includes('support')) {
      const chainMatch = userMessage.match(/chain\s+(\d+)|on\s+(\d+)/)
      
      return {
        type: 'supported_tokens',
        data: {
          chainId: chainMatch ? parseInt(chainMatch[1] || chainMatch[2]) : null
        }
      }
    }
    
    // Username registration patterns
    if (userLower.includes('register') && (userLower.includes('username') || userLower.includes('name'))) {
      // Handle various patterns: "register spy as my username", "register username spy", etc.
      const usernameMatch = userMessage.match(/register\s+(?:username\s+)?(\w+)(?:\s+as\s+my\s+username)?|register\s+(\w+)\s+as\s+my\s+(?:username|name)/i)
      
      let username = null
      if (usernameMatch) {
        username = usernameMatch[1] || usernameMatch[2]
      }
      
      return {
        type: 'register_username',
        data: {
          username: username
        }
      }
    }
    
    // Group payment patterns - improved to handle abbreviations (create/contribute only, view handled earlier)
    if ((userLower.includes('group') && userLower.includes('payment')) || 
        (userLower.includes('grp') && userLower.includes('payment')) ||
        userLower.includes('group payments') || userLower.includes('grp payments')) {
      if (userLower.includes('create') || userLower.includes('new') || userLower.includes('start')) {
        // Create group payment: "Create group payment for 100 BDAG with 5 people for Alice"
        const amountMatch = userMessage.match(/(\d+(?:\.\d+)?)\s*(\w+)?/)
        const participantsMatch = userMessage.match(/(\d+)\s*(?:people|participants|users|members)/)
        const recipientMatch = userMessage.match(/for\s+(\w+|0x[a-fA-F0-9]{40})/)
        
        return {
          type: 'create_group_payment',
          data: {
            amount: amountMatch ? amountMatch[1] : null,
            token: amountMatch ? amountMatch[2] : 'BDAG',
            participants: participantsMatch ? parseInt(participantsMatch[1]) : null,
            recipient: recipientMatch ? recipientMatch[1] : null
          }
        }
      } else if (userLower.includes('contribute') || userLower.includes('add')) {
        // Contribute to group payment: "Contribute 10 BDAG to group payment 0x123"
        const amountMatch = userMessage.match(/(\d+(?:\.\d+)?)\s*(\w+)?/)
        const idMatch = userMessage.match(/(0x[a-fA-F0-9]+)/)
        
        return {
          type: 'contribute_group_payment',
          data: {
            amount: amountMatch ? amountMatch[1] : null,
            token: amountMatch ? amountMatch[2] : 'BDAG',
            paymentId: idMatch ? idMatch[1] : null
          }
        }
      }
    }
    
    // Savings pot patterns - improved to handle variations (create/contribute/break only, view handled earlier)
    if (userLower.includes('savings pot') || userLower.includes('saving pot') || 
        userLower.includes('savings pots') || userLower.includes('saving pots') ||
        (userLower.includes('savings') && userLower.includes('pot')) || 
        (userLower.includes('saving') && userLower.includes('pot'))) {
      if (userLower.includes('create') || userLower.includes('new') || userLower.includes('start')) {
        // Create savings pot: "Create savings pot 'Vacation' with target 500 BDAG"
        const nameMatch = userMessage.match(/['"]([^'"]+)['"]|pot\s+(\w+)/)
        const targetMatch = userMessage.match(/target\s+(\d+(?:\.\d+)?)\s*(\w+)?|(\d+(?:\.\d+)?)\s*(\w+)?/)
        
        return {
          type: 'create_savings_pot',
          data: {
            name: nameMatch ? (nameMatch[1] || nameMatch[2]) : null,
            targetAmount: targetMatch ? (targetMatch[1] || targetMatch[3]) : null,
            token: targetMatch ? (targetMatch[2] || targetMatch[4]) : 'BDAG'
          }
        }
      } else if (userLower.includes('contribute') || userLower.includes('add')) {
        // Contribute to savings pot: "Add 50 BDAG to pot 0x123"
        const amountMatch = userMessage.match(/(\d+(?:\.\d+)?)\s*(\w+)?/)
        const idMatch = userMessage.match(/(0x[a-fA-F0-9]+)/)
        
        return {
          type: 'contribute_savings_pot',
          data: {
            amount: amountMatch ? amountMatch[1] : null,
            token: amountMatch ? amountMatch[2] : 'BDAG',
            potId: idMatch ? idMatch[1] : null
          }
        }
      } else if (userLower.includes('break') || userLower.includes('withdraw') || userLower.includes('cash')) {
        // Break savings pot: "Break pot 0x123"
        const idMatch = userMessage.match(/(0x[a-fA-F0-9]+)/)
        
        return {
          type: 'break_savings_pot',
          data: {
            potId: idMatch ? idMatch[1] : null
          }
        }
      }
    }
    
    // Handle action button commands from the UI
    if (userLower.startsWith('show details for')) {
      const idMatch = userMessage.match(/0x[a-fA-F0-9]+/)
      if (idMatch) {
        // For now, just provide a simple details response
        return {
          type: 'transaction_history',
          data: { 
            filter: userMessage, 
            showOnlyTransfers: true,
            specificId: idMatch[0]
          }
        }
      }
    }
    
    // Enhanced contribute patterns for button actions
    if (userLower.includes('contribute to group payment') && userMessage.match(/0x[a-fA-F0-9]+/)) {
      const idMatch = userMessage.match(/(0x[a-fA-F0-9]+)/)
      const amountMatch = userMessage.match(/(\d+(?:\.\d+)?)\s*(bdag|usdc|usdt)?/i)
      
      if (!amountMatch) {
        // Prompt for amount when missing
        return {
          message: `💰 **Contribute to Group Payment**\n\nPlease specify the amount you'd like to contribute.\n\n**Example:** "Contribute 50 BDAG to group payment ${idMatch ? idMatch[1] : '[ID]'}"\n\nℹ️ You can contribute any amount to help reach the group goal!`,
          action: {
            type: 'contribute_group_payment',
            data: {
              paymentId: idMatch ? idMatch[1] : null,
              requiresAmount: true
            }
          }
        }
      }
      
      return {
        type: 'contribute_group_payment',
        data: {
          amount: amountMatch ? parseFloat(amountMatch[1]) : null,
          token: amountMatch?.[2]?.toUpperCase() || 'BDAG',
          paymentId: idMatch ? idMatch[1] : null
        }
      }
    }
    
    // Enhanced savings pot contribution patterns
    if (userLower.includes('contribute to savings pot') && userMessage.match(/0x[a-fA-F0-9]+/)) {
      const idMatch = userMessage.match(/(0x[a-fA-F0-9]+)/)
      const amountMatch = userMessage.match(/(\d+(?:\.\d+)?)\s*(bdag|usdc|usdt)?/i)
      
      if (!amountMatch) {
        // Prompt for amount when missing
        return {
          message: `🏦 **Deposit to Savings Pot**\n\nPlease specify the amount you'd like to deposit.\n\n**Example:** "Contribute 100 BDAG to savings pot ${idMatch ? idMatch[1] : '[ID]'}"\n\nℹ️ Every deposit helps you reach your savings goal!`,
          action: {
            type: 'contribute_savings_pot',
            data: {
              potId: idMatch ? idMatch[1] : null,
              requiresAmount: true
            }
          }
        }
      }
      
      return {
        type: 'contribute_savings_pot',
        data: {
          amount: amountMatch ? parseFloat(amountMatch[1]) : null,
          token: amountMatch?.[2]?.toUpperCase() || 'BDAG',
          potId: idMatch ? idMatch[1] : null
        }
      }
    }
    
    // Enhanced break savings pot patterns
    if (userLower.includes('break savings pot') && userMessage.match(/0x[a-fA-F0-9]+/)) {
      const idMatch = userMessage.match(/(0x[a-fA-F0-9]+)/)
      
      return {
        message: `⚠️ **Break Savings Pot Confirmation**\n\nYou're about to withdraw **ALL FUNDS** from savings pot \`${idMatch ? idMatch[1] : '[ID]'}\`.\n\n🔥 **This action cannot be undone!**\n\nType "yes break pot ${idMatch ? idMatch[1] : '[ID]'}" to confirm, or "cancel" to abort.`,
        action: {
          type: 'break_savings_pot',
          data: {
            potId: idMatch ? idMatch[1] : null,
            requiresConfirmation: true
          }
        }
      }
    }
    
    // Confirmation for breaking savings pot
    if (userLower.includes('yes break pot') && userMessage.match(/0x[a-fA-F0-9]+/)) {
      const idMatch = userMessage.match(/(0x[a-fA-F0-9]+)/)
      
      return {
        type: 'break_savings_pot',
        data: {
          potId: idMatch ? idMatch[1] : null,
          confirmed: true
        }
      }
    }
    
    // Transaction history patterns - ONLY show normal transfers by default, exclude group payments and savings pots
    if ((userLower.includes('history') || 
        userLower.includes('my txn') || userLower.includes('my transaction') ||
        (userLower.includes('show') && (userLower.includes('my') || userLower.includes('all')) && (userLower.includes('txn') || userLower.includes('transaction'))) ||
        (userLower.includes('transaction') && (userLower.includes('show') || userLower.includes('my') || userLower.includes('all'))) ||
        (userLower.includes('txn') && (userLower.includes('show') || userLower.includes('my') || userLower.includes('all'))) ||
        userLower.includes('tansaction') || // typo handling
        (userLower.includes('complete') && (userLower.includes('transaction') || userLower.includes('history')))) &&
        // BUT exclude if it's asking for group payments or savings pots specifically
        !userLower.includes('group') && !userLower.includes('grp') && 
        !userLower.includes('saving') && !userLower.includes('pot')) {
      return {
        type: 'transaction_history',
        data: { filter: userMessage, showOnlyTransfers: true }
      }
    }
    
    return null
  }

  private async executeAction(action: any, context: any): Promise<any> {
    const { address, chainId, signer } = context
    
    switch (action.type) {
      case 'balance':
        if (!signer) throw new Error('Wallet not connected')
        const targetAddress = action.data.address || address
        if (!targetAddress) throw new Error('No address specified')
        
        const supportedTokens = getSupportedTokensForChain(chainId || 545)
        
        // Handle specific token request
        if (action.data.token && !action.data.showAll) {
          const requestedToken = supportedTokens.find(t => 
            t.symbol.toLowerCase() === action.data.token.toLowerCase() ||
            t.symbol === action.data.token ||
            (action.data.token === 'tUSDFC' && (t.symbol === 'tUSDFC' || t.symbol === 'USDFC')) ||
            (action.data.token === 'tFIL' && (t.symbol === 'tFIL' || t.symbol === 'FIL'))
          )
          
          if (!requestedToken) {
            return {
              message: `❌ Token ${action.data.token} not supported on ${this.getChainName(chainId)}. Supported tokens: ${supportedTokens.map(t => t.symbol).join(', ')}`,
              data: { error: 'Token not supported' }
            }
          }
          
          const balanceResult = await this.aiService.getBalance(signer, targetAddress, requestedToken)
          
          if (balanceResult.success) {
            return {
              message: `💰 **${requestedToken.symbol} Balance**: ${balanceResult.data?.balance || '0'} ${requestedToken.symbol}\n📍 Address: ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}\n⛓️ Chain: ${this.getChainName(chainId)}`,
              data: balanceResult.data
            }
          } else {
            throw new Error(balanceResult.error || 'Failed to fetch balance')
          }
        }
        
        // Handle all balances request
        if (action.data.showAll) {
          let allBalances = []
          let totalValue = 0
          
          for (const token of supportedTokens) {
            try {
              const result = await this.aiService.getBalance(signer, targetAddress, token)
              if (result.success && result.data?.balance) {
                const balance = parseFloat(result.data.balance)
                if (balance > 0) {
                  allBalances.push({
                    token: token.symbol,
                    balance: result.data.balance,
                    isNative: token.isNative
                  })
                }
              }
            } catch (error) {
              console.log(`Error fetching ${token.symbol} balance:`, error)
            }
          }
          
          if (allBalances.length === 0) {
            return {
              message: `💰 **All Balances**: No tokens found\n📍 Address: ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}\n⛓️ Chain: ${this.getChainName(chainId)}`,
              data: { balances: [] }
            }
          }
          
          let balanceText = `💰 **All Token Balances**\n\n`
          allBalances.forEach(bal => {
            balanceText += `• **${bal.token}**: ${bal.balance}${bal.isNative ? ' (Native)' : ''}\n`
          })
          balanceText += `\n📍 Address: ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}\n⛓️ Chain: ${this.getChainName(chainId)}`
          
          return {
            message: balanceText,
            data: { balances: allBalances }
          }
        }
        
        // Default to native token if no specific token requested
        const nativeToken = supportedTokens.find(t => t.isNative) || supportedTokens[0]
        const balanceResult = await this.aiService.getBalance(signer, targetAddress, nativeToken)
        
        if (balanceResult.success) {
          return {
            message: `💰 **${nativeToken.symbol} Balance**: ${balanceResult.data?.balance || '0'} ${nativeToken.symbol}\n📍 Address: ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}\n⛓️ Chain: ${this.getChainName(chainId)}`,
            data: balanceResult.data
          }
        } else {
          throw new Error(balanceResult.error || 'Failed to fetch balance')
        }
        break
        
      case 'transfers':
        if (!signer) throw new Error('Wallet not connected')
        const transferAddress = action.data.address || address
        if (!transferAddress) throw new Error('No address specified')
        
        const transfersResult = await this.aiService.getTransactionHistory(signer, transferAddress, chainId || 545)
        
        if (transfersResult.success) {
          const { transfers, groupPayments, savingsPots } = transfersResult.data
          let message = `📋 **Your Transaction History**\n\n`
          
          // Transfers
          const totalTransfers = (transfers.received?.length || 0) + (transfers.sent?.length || 0)
          message += `💸 **Transfers**: ${totalTransfers} total\n`
          message += `📥 **Received**: ${transfers.received?.length || 0}\n`
          message += `📤 **Sent**: ${transfers.sent?.length || 0}\n\n`
          
          // Group Payments
          message += `👥 **Group Payments**: ${groupPayments?.length || 0} created\n\n`
          
          // Savings Pots
          message += `🏦 **Savings Pots**: ${savingsPots?.length || 0} created\n\n`
          
          if (totalTransfers === 0 && (groupPayments?.length || 0) === 0 && (savingsPots?.length || 0) === 0) {
            message += `🤷 No transactions found yet. Start by sending some funds or creating a savings pot!`
          } else {
            message += `💡 Try: "show refunded transactions", "show my sent transfers", or "find BDAG payments" for filtered results.`
          }
          
          return {
            message: message,
            data: transfersResult.data
          }
        } else {
          throw new Error(transfersResult.error || 'Failed to fetch transfers')
        }
        break
        
      case 'chain_info':
        return {
          message: `⛓️ **Supported Chains:**\n• BlockDAG Testnet (ID: 1043)`,
          data: {
            chains: [
              { name: 'BlockDAG Testnet', id: 1043 }
            ]
          }
        }
        break
        
      case 'send':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.recipient || !action.data.amount) {
          throw new Error('Missing recipient or amount for transfer')
        }
        
        // This would require confirmation in the UI
        return {
          message: `🔄 **Transfer Confirmation Required**\nSend ${action.data.amount} ${action.data.token} to ${action.data.recipient}`,
          data: {
            type: 'confirmation_needed',
            action: 'send',
            details: action.data
          }
        }
        break
        
      case 'claim':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.identifier) {
          throw new Error('Missing transfer identifier for claim')
        }
        
        return {
          message: `🔄 **Claim Confirmation Required**\nClaim transfer: ${action.data.identifier}`,
          data: {
            type: 'confirmation_needed',
            action: 'claim',
            details: action.data
          }
        }
        break
        
      case 'refund':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.transferId) {
          throw new Error('Missing transfer ID for refund')
        }
        
        return {
          message: `🔄 **Refund Confirmation Required**\nRefund transfer: ${action.data.transferId}`,
          data: {
            type: 'confirmation_needed',
            action: 'refund',
            details: action.data
          }
        }
        break
        
      case 'register_username':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.username) {
          throw new Error('Missing username for registration')
        }
        
        return {
          message: `🔄 **Username Registration Confirmation Required**\nRegister username "${action.data.username}" for your address`,
          data: {
            type: 'confirmation_needed',
            action: 'register_username',
            details: action.data
          }
        }
        break
        
      case 'create_group_payment':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.amount || !action.data.participants || !action.data.recipient) {
          throw new Error('Missing required data for group payment (amount, participants, recipient)')
        }
        
        return {
          message: `🔄 **Group Payment Creation Confirmation Required**\nCreate group payment: ${action.data.amount} ${action.data.token} for ${action.data.recipient} with ${action.data.participants} participants`,
          data: {
            type: 'confirmation_needed',
            action: 'create_group_payment',
            details: action.data
          }
        }
        break
        
      case 'create_savings_pot':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.name || !action.data.targetAmount) {
          throw new Error('Missing required data for savings pot (name, target amount)')
        }
        
        return {
          message: `🔄 **Savings Pot Creation Confirmation Required**\nCreate savings pot "${action.data.name}" with target ${action.data.targetAmount} ${action.data.token}`,
          data: {
            type: 'confirmation_needed',
            action: 'create_savings_pot',
            details: action.data
          }
        }
        break
        
      case 'contribute_group_payment':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.amount || !action.data.paymentId) {
          throw new Error('Missing required data for group payment contribution (amount, payment ID)')
        }
        
        return {
          message: `🔄 **Group Payment Contribution Confirmation Required**\nContribute ${action.data.amount} ${action.data.token} to group payment ${action.data.paymentId}`,
          data: {
            type: 'confirmation_needed',
            action: 'contribute_group_payment',
            details: action.data
          }
        }
        break
        
      case 'contribute_savings_pot':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.amount || !action.data.potId) {
          throw new Error('Missing required data for savings pot contribution (amount, pot ID)')
        }
        
        return {
          message: `🔄 **Savings Pot Contribution Confirmation Required**\nAdd ${action.data.amount} ${action.data.token} to savings pot ${action.data.potId}`,
          data: {
            type: 'confirmation_needed',
            action: 'contribute_savings_pot',
            details: action.data
          }
        }
        break
        
      case 'break_savings_pot':
        if (!signer) throw new Error('Wallet not connected')
        if (!action.data.potId) {
          throw new Error('Missing pot ID for breaking savings pot')
        }
        
        return {
          message: `🔄 **Break Savings Pot Confirmation Required**\nWithdraw all funds from savings pot ${action.data.potId}`,
          data: {
            type: 'confirmation_needed',
            action: 'break_savings_pot',
            details: action.data
          }
        }
        break
        
      case 'view_group_payments':
        if (!signer) throw new Error('Wallet not connected')
        const groupPaymentAddress = action.data.address || address
        if (!groupPaymentAddress) throw new Error('No address specified')
        
        const groupPaymentsResult = await this.aiService.getGroupPayments(signer, groupPaymentAddress)
        
        if (groupPaymentsResult.success) {
          const payments = groupPaymentsResult.data?.payments || []
          let message = `👥 **Your Group Payments (${payments.length})**\n\n`
          
          if (payments.length === 0) {
            message += '📭 No group payments found.\n\n'
            message += '💡 **Create your first group payment:**\n'
            message += '• "Create group payment for 100 BDAG with 5 people for Alice"\n'
            message += '• "Start group payment for birthday gift"\n'
          } else {
            // Use modern card-based UI for group payments
            message += `<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: #0a0a0a; border-radius: 12px; border: 1px solid #1a1a1a;">\n`
            
            payments.forEach((payment: any, index: number) => {
              const amount = payment.amount ? (typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount) : 0
              const displayAmount = amount > 0 ? (amount / 1e18).toFixed(4) : '0.0000'
              const participants = payment.numParticipants || 0
              const isCompleted = payment.status === 2 || payment.isCompleted
              const statusColor = isCompleted ? '#10b981' : '#f59e0b'
              const statusText = isCompleted ? '✅ Complete' : '🟡 Active'
              const shortRecipient = payment.recipient ? `${payment.recipient.slice(0, 6)}...${payment.recipient.slice(-4)}` : 'Unknown'
              const txId = payment.id ? `${payment.id.slice(0, 8)}...${payment.id.slice(-6)}` : 'N/A'
              
              if (index > 0) {
                message += `<div style="height: 1px; background: #374151; margin: 4px 0;"></div>\n`
              }
              
              message += `<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 6px; border-left: 3px solid #10b981; transition: all 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateX(2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.15)'" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">\n`
              message += `  <div style="display: flex; align-items: center; gap: 12px; flex: 1;">\n`
              message += `    <span style="font-size: 16px;">👥</span>\n`
              message += `    <div>\n`
              message += `      <div style="color: #ffffff; font-weight: 600; font-size: 14px;">${displayAmount} BDAG</div>\n`
              message += `      <div style="color: #a1a1aa; font-size: 11px;">${participants} people → ${shortRecipient}</div>\n`
              message += `    </div>\n`
              message += `  </div>\n`
              message += `  <div style="display: flex; align-items: center; gap: 6px;">\n`
              message += `    <span style="background: ${statusColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">${statusText}</span>\n`
              if (!isCompleted) {
                message += `    <button style="background: #10b981; color: white; border: none; padding: 4px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'contribute', id: '${payment.id}'}, '*')">💰</button>\n`
              }
              message += `    <button style="background: #374151; color: white; border: none; padding: 4px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'details', id: '${payment.id}'}, '*')">📊</button>\n`
              message += `  </div>\n`
              message += `</div>\n`
            })
            
            message += `</div>\n\n`
            
            message += `💡 **Quick Actions:**\n`
            message += `• Click the 💰 button on any active group payment to contribute\n`
            message += `• Try: "Create group payment for 200 FLOW with 4 people for Alice"\n`
            message += `• Try: "Create group payment for 200 BDAG with 4 people for Alice"\n`
            message += `• Ask: "Show my group payment contributions"\n`
          }
          
          return {
            message: message,
            data: groupPaymentsResult.data
          }
        } else {
          throw new Error(groupPaymentsResult.error || 'Failed to fetch group payments')
        }
        break
        
      case 'view_savings_pots':
        if (!signer) throw new Error('Wallet not connected')
        const targetAddressPots = action.data.address || address
        if (!targetAddressPots) throw new Error('No address specified')
        
        const savingsPotsResult = await this.aiService.getSavingsPots(signer, targetAddressPots)
        
        if (savingsPotsResult.success) {
          const pots = savingsPotsResult.data?.pots || []
          let message = `🏦 **Your Savings Pots (${pots.length})**\n\n`
          
          if (pots.length === 0) {
            message += `<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #374151;">\n`
            message += `  <div style="font-size: 48px; margin-bottom: 16px;">🏦</div>\n`
            message += `  <div style="color: #ffffff; font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Savings Pots Yet</div>\n`
            message += `  <div style="color: #a1a1aa; font-size: 14px; margin-bottom: 16px;">Start saving for your goals today!</div>\n`
            message += `  <div style="color: #10b981; font-size: 14px; font-weight: 500;">\n`
            message += `    💡 Try: "Create savings pot 'Vacation' with target 500 BDAG"\n`
            message += `  </div>\n`
            message += `</div>\n\n`
          } else {
            // Use modern card-based UI for savings pots
            message += `<style>
              .pp-card { transition: all 0.2s ease; cursor: pointer; }
              .pp-card:hover { transform: translateX(2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); }
              .pp-btn { transition: all 0.15s ease; }
              .pp-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
              .pp-btn:active { transform: scale(0.95); }
            </style>\n`
            message += `<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: #0a0a0a; border-radius: 12px; border: 1px solid #1a1a1a;">\n`
            
            pots.forEach((pot: any, index: number) => {
              const currentAmount = pot.currentAmount ? (typeof pot.currentAmount === 'string' ? parseFloat(pot.currentAmount) : pot.currentAmount) : 0
              const targetAmount = pot.targetAmount ? (typeof pot.targetAmount === 'string' ? parseFloat(pot.targetAmount) : pot.targetAmount) : 0
              const displayCurrent = currentAmount > 0 ? (currentAmount / 1e18).toFixed(2) : '0.00'
              const displayTarget = targetAmount > 0 ? (targetAmount / 1e18).toFixed(2) : '0.00'
              const progress = targetAmount > 0 ? Math.min(((currentAmount / targetAmount) * 100), 100).toFixed(1) : '0.0'
              const isCompleted = parseFloat(progress) >= 100
              const statusColor = isCompleted ? '#10b981' : '#3b82f6'
              const statusText = isCompleted ? '✅ Goal Reached' : '🎯 Saving'
              const potId = pot.id ? `${pot.id.slice(0, 8)}...${pot.id.slice(-6)}` : 'N/A'
              
              if (index > 0) {
                message += `<div style="height: 1px; background: #374151; margin: 4px 0;"></div>\n`
              }
              
              message += `<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 8px; padding: 16px; border-left: 4px solid #3b82f6;">\n`
              message += `  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">\n`
              message += `    <div style="display: flex; align-items: center; gap: 8px;">\n`
              message += `      <span style="font-size: 18px;">🏦</span>\n`
              message += `      <div>\n`
              message += `        <div style="color: #ffffff; font-weight: 600; font-size: 14px;">${pot.name || 'Unnamed Pot'}</div>\n`
              message += `        <div style="color: #a1a1aa; font-size: 12px;">ID: ${potId}</div>\n`
              message += `      </div>\n`
              message += `    </div>\n`
              message += `    <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${statusText}</span>\n`
              message += `  </div>\n`
              message += `  <div style="margin-bottom: 12px;">\n`
              message += `    <div style="color: #ffffff; font-size: 16px; font-weight: 700; margin-bottom: 4px;">${displayCurrent} / ${displayTarget} FLOW</div>\n`
              message += `    <div style="color: #ffffff; font-size: 16px; font-weight: 700; margin-bottom: 4px;">${displayCurrent} / ${displayTarget} BDAG</div>\n`
              message += `    <div style="background: #374151; border-radius: 8px; height: 6px; overflow: hidden;">\n`
              message += `      <div style="background: linear-gradient(90deg, #10b981 0%, #34d399 100%); height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>\n`
              message += `    </div>\n`
              message += `    <div style="color: #a1a1aa; font-size: 12px; margin-top: 4px;">${progress}% complete</div>\n`
              message += `  </div>\n`
              message += `  <div style="display: flex; gap: 8px;">\n`
              if (!isCompleted) {
                message += `    <button style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'deposit', id: '${pot.id}'}, '*')">💰 Deposit</button>\n`
                message += `    <button style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'withdraw', id: '${pot.id}'}, '*')">💸 Withdraw</button>\n`
              }
              message += `    <button style="background: #374151; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'details', id: '${pot.id}'}, '*')">📊 Details</button>\n`
              message += `  </div>\n`
              message += `</div>\n`
            })
            
            message += `</div>\n\n`
            
            message += `💡 **Quick Actions:**\n`
            message += `• Click the 💰 Deposit button to add funds to any pot\n`
            message += `• Try: "Create savings pot 'Vacation Fund' with target 1000 FLOW"\n`
            message += `• Try: "Create savings pot 'Vacation Fund' with target 1000 BDAG"\n`
            message += `• Ask: "Show my savings progress"\n`
          }
          
          return {
            message: message,
            data: savingsPotsResult.data
          }
        } else {
          throw new Error(savingsPotsResult.error || 'Failed to fetch savings pots')
        }
        break
        
      case 'transaction_history':
        try {
          if (!signer) throw new Error('Wallet not connected')
          const targetAddressHistory = action.data.address || address
          if (!targetAddressHistory) throw new Error('No address specified')

          // Use the same methods as the dashboard for consistent data
          const nativeTransfers = await getUserTransfers(signer, targetAddressHistory)
          const tokenTransfers = await getUserTokenTransfers(signer, targetAddressHistory)
          
          let allTransfers: any[] = []
          
          // Process native transfers
          if (nativeTransfers && nativeTransfers.length > 0) {
            const processedNative = nativeTransfers.map((transfer: any) => ({
              ...transfer,
              type: 'transfer',
              tokenInfo: { symbol: 'BDAG', isNative: true },
              id: `${transfer.sender}-${transfer.recipient}-${transfer.timestamp}`
            }))
            allTransfers = [...allTransfers, ...processedNative]
          }

          // Process token transfers  
          if (tokenTransfers && tokenTransfers.length > 0) {
            const processedTokens = tokenTransfers.map((transfer: any) => ({
              ...transfer,
              type: 'transfer',
              tokenInfo: { 
                symbol: transfer.token === ethers.constants.AddressZero ? 'BDAG' : 'TOKEN',
                isNative: transfer.isNativeToken || false
              },
              id: `${transfer.sender}-${transfer.recipient}-${transfer.timestamp}`
            }))
            allTransfers = [...allTransfers, ...processedTokens]
          }
          
          // Filter valid transfers and sort by timestamp
          const validTransfers = allTransfers
            .filter(transfer => {
              const amount = transfer.amount ? (typeof transfer.amount === 'string' ? parseFloat(transfer.amount) : transfer.amount) : 0
              return amount > 0
            })
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          
          let message = `📊 **Transaction History (${validTransfers.length})**\n\n`
          
          if (validTransfers.length === 0) {
            message += `<div style="background: #1a1a1a; border: 1px solid #374151; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">\n`
            message += `  <div style="font-size: 42px; margin-bottom: 12px;">📊</div>\n`
            message += `  <div style="color: #ffffff; font-size: 18px; font-weight: 600; margin-bottom: 6px;">No Transactions Yet</div>\n`
            message += `  <div style="color: #a1a1aa; font-size: 14px;">Your transaction history will appear here</div>\n`
            message += `</div>\n\n`
          } else {
            // Clean, consistent card layout
            message += `<div style="display: flex; flex-direction: column; gap: 10px; margin: 16px 0;">\n`
            
            const displayTransfers = validTransfers.slice(0, 12)
            
            for (const transfer of displayTransfers) {
              const isOutgoing = transfer.sender?.toLowerCase() === targetAddressHistory.toLowerCase()
              const amount = transfer.amount ? (typeof transfer.amount === 'string' ? parseFloat(transfer.amount) : transfer.amount) : 0
              const displayAmount = amount > 0 ? (amount / 1e18).toFixed(4) : '0.0000'
              const counterparty = isOutgoing ? transfer.recipient : transfer.sender
              const shortAddress = counterparty ? `${counterparty.slice(0, 6)}...${counterparty.slice(-4)}` : 'Unknown'
              const date = transfer.timestamp ? new Date(transfer.timestamp * 1000).toLocaleDateString('en-US', {
                month: 'short', day: '2-digit'
              }) : 'N/A'
              
              const statusColor = this.getStatusColor(transfer.status || 0)
              const statusText = this.getTransferStatus(transfer.status || 0)
              const borderColor = isOutgoing ? '#ef4444' : '#10b981'
              const directionIcon = isOutgoing ? '📤' : '📥'
              const typeColor = transfer.isNativeToken ? '#3b82f6' : '#8b5cf6'
              const typeText = transfer.isNativeToken ? 'Native' : 'Token'
              
              message += `<div style="background: #1a1a1a; border: 1px solid #374151; border-radius: 10px; padding: 14px; border-left: 3px solid ${borderColor};">\n`
              message += `  <div style="display: flex; justify-content: space-between; align-items: center;">\n`
              message += `    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">\n`
              message += `      <div style="background: ${borderColor}15; color: ${borderColor}; padding: 6px; border-radius: 6px; font-size: 14px;">${directionIcon}</div>\n`
              message += `      <div>\n`
              message += `        <div style="color: #ffffff; font-weight: 600; font-size: 14px; margin-bottom: 2px;">\n`
              message += `          ${isOutgoing ? 'Sent to' : 'Received from'} ${shortAddress}\n`
              message += `        </div>\n`
              message += `        <div style="display: flex; align-items: center; gap: 6px;">\n`
              message += `          <span style="color: #71717a; font-size: 11px;">${date}</span>\n`
              message += `          <span style="background: ${typeColor}15; color: ${typeColor}; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: 500;">${typeText}</span>\n`
              message += `          <span style="background: ${statusColor}15; color: ${statusColor}; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: 500;">${statusText}</span>\n`
              message += `        </div>\n`
              message += `      </div>\n`
              message += `    </div>\n`
              message += `    <div style="text-align: right; display: flex; align-items: center; gap: 8px;">\n`
              message += `      <div>\n`
              message += `        <div style="color: #ffffff; font-weight: 700; font-size: 15px;">${displayAmount}</div>\n`
              message += `        <div style="color: #a1a1aa; font-size: 11px;">${transfer.tokenSymbol}</div>\n`
              message += `      </div>\n`
              
              // Compact action buttons
              if (transfer.status === 0 && !isOutgoing) {
                message += `      <button style="background: #10b981; color: white; border: none; padding: 3px 6px; border-radius: 4px; font-size: 9px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'claim', id: '${transfer.id}'}, '*')">💰</button>\n`
              } else if (transfer.status === 0 && isOutgoing) {
                message += `      <button style="background: #ef4444; color: white; border: none; padding: 3px 6px; border-radius: 4px; font-size: 9px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'refund', id: '${transfer.id}'}, '*')">↩️</button>\n`
              }
              
              message += `    </div>\n`
              message += `  </div>\n`
              message += `</div>\n`
            }
            
            message += `</div>\n\n`
            
            if (validTransfers.length > 12) {
              message += `💡 Showing 12 recent transactions. Total: ${validTransfers.length}\n\n`
            }
          }
          
          message += `🛠️ **Quick Actions:**\n`
          message += `• Use buttons on cards for quick actions\n`
          message += `• "Show my group payments" | "Show my savings pots"\n`
          message += `• "Send [amount] FLOW to [address]"\n`
          message += `• "Send [amount] BDAG to [address]"\n`
          
          return {
            message: message,
            data: validTransfers
          }
        } catch (err) {
          console.error('Error fetching transaction history:', err)
          throw new Error('Failed to fetch transaction history. Please try again.')
        }
        break

      case 'filtered_transactions':
        if (!signer) throw new Error('Wallet not connected')
        const targetAddressFiltered = action.data.address || address
        if (!targetAddressFiltered) throw new Error('No address specified')
        
        const filteredResult = await this.aiService.getFilteredTransactions(signer, targetAddressFiltered, chainId || 545, action.data.filter)
        
        if (filteredResult.success) {
          const { transfers, groupPayments, savingsPots } = filteredResult.data
          let message = `🔍 **Filtered Results**: ${action.data.filter}\n\n`
          
          // Show filtered transfers in modern card format
          if (transfers) {
            const allTransfers = [...(transfers.received || []), ...(transfers.sent || [])]
            
            if (allTransfers.length === 0) {
              message += `<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #374151;">\n`
              message += `  <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>\n`
              message += `  <div style="color: #ffffff; font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Matching Transactions</div>\n`
              message += `  <div style="color: #a1a1aa; font-size: 14px; margin-bottom: 16px;">Try different filters to find your transactions</div>\n`
              message += `  <div style="color: #10b981; font-size: 12px; line-height: 1.4;">\n`
              message += `    💡 <strong>Try these filters:</strong><br/>\n`
              message += `    • "show my sent transfers"<br/>\n`
              message += `    • "show my received transfers"<br/>\n`
              message += `    • "show completed transactions"<br/>\n`
              message += `    • "show pending transactions"\n`
              message += `  </div>\n`
              message += `</div>\n\n`
            } else {
              message += `💸 **MATCHING TRANSFERS (${allTransfers.length} found)**\n\n`
              
              const sortedTransfers = allTransfers
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, 15) // Show up to 15 results
              
              // Create modern card-based display
              message += `<div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #0a0a0a; border-radius: 12px; border: 1px solid #1a1a1a;">\n`
              
              for (const transfer of sortedTransfers) {
                const direction = transfer.sender?.toLowerCase() === targetAddressFiltered.toLowerCase() ? 'SENT' : 'RECV'
                const isOutgoing = direction === 'SENT'
                const directionIcon = isOutgoing ? '📤' : '📥'
                const statusColor = this.getStatusColor(transfer.status || 0)
                const statusText = this.getTransferStatus(transfer.status || 0)
                const amount = transfer.amount ? (typeof transfer.amount === 'string' ? parseFloat(transfer.amount) : transfer.amount) : 0
                const displayAmount = amount > 0 ? (amount / 1e18).toFixed(4) : '0.0000'
                const counterparty = isOutgoing ? transfer.recipient : transfer.sender
                const shortAddress = counterparty ? `${counterparty.slice(0, 6)}...${counterparty.slice(-4)}` : 'Unknown'
                const token = transfer.token?.symbol || 'BDAG'
                const date = transfer.timestamp ? new Date(transfer.timestamp * 1000).toLocaleDateString('en-US', {
                  month: 'short', day: '2-digit', year: 'numeric'
                }) : 'N/A'
                const txId = transfer.id ? `${transfer.id.slice(0, 8)}...${transfer.id.slice(-6)}` : 'N/A'
                const borderColor = isOutgoing ? '#ef4444' : '#10b981'
                const directionColor = isOutgoing ? '#ef4444' : '#10b981'
                
                message += `<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 8px; padding: 12px; border-left: 4px solid ${borderColor}; transition: all 0.2s ease; cursor: pointer;" onmouseover="this.style.transform='translateX(2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.15)'" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">\n`
                message += `  <div style="display: flex; align-items: center; justify-content: space-between;">\n`
                message += `    <div style="display: flex; align-items: center; gap: 12px; flex: 1;">\n`
                message += `      <div style="display: flex; align-items: center; gap: 8px;">\n`
                message += `        <span style="font-size: 18px;">${directionIcon}</span>\n`
                message += `        <div>\n`
                message += `          <div style="color: #ffffff; font-weight: 700; font-size: 16px;">${displayAmount} ${token}</div>\n`
                message += `          <div style="color: #a1a1aa; font-size: 12px;">${isOutgoing ? 'To:' : 'From:'} ${shortAddress}</div>\n`
                message += `        </div>\n`
                message += `      </div>\n`
                message += `    </div>\n`
                message += `    <div style="display: flex; align-items: center; gap: 8px;">\n`
                message += `      <div style="text-align: right; margin-right: 8px;">\n`
                message += `        <div style="color: ${statusColor}; font-size: 11px; background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 8px; margin-bottom: 2px;">${statusText}</div>\n`
                message += `        <div style="color: #71717a; font-size: 10px;">${date}</div>\n`
                message += `      </div>\n`
                
                // Add action buttons based on status and direction
                if (transfer.status === 0 && !isOutgoing) {
                  message += `      <button style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; margin-left: 4px;" onclick="window.parent.postMessage({type: 'action', action: 'claim', id: '${transfer.id}'}, '*')">💰</button>\n`
                  message += `      <button style="background: #374151; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'details', id: '${transfer.id}'}, '*')">🔍</button>\n`
                } else if (transfer.status === 0 && isOutgoing) {
                  message += `      <button style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; margin-left: 4px;" onclick="window.parent.postMessage({type: 'action', action: 'refund', id: '${transfer.id}'}, '*')">↩️</button>\n`
                  message += `      <button style="background: #374151; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'details', id: '${transfer.id}'}, '*')">🔍</button>\n`
                } else if (transfer.status === 2) {
                  message += `      <button style="background: #374151; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; margin-left: 4px;" onclick="window.parent.postMessage({type: 'action', action: 'explorer', id: '${transfer.id}'}, '*')">🔍</button>\n`
                }
                
                message += `    </div>\n`
                message += `  </div>\n`
                message += `</div>\n`
              }
              
              message += `</div>\n\n`
              
              if (allTransfers.length > 15) {
                message += `... and ${allTransfers.length - 15} more matching transfers\n\n`
              }
              
              // Show action options summary for filtered results
              message += `\n🛠️ **QUICK ACTIONS:**\n`
              message += `• Try interactive buttons on the cards above\n`
              message += `• Or use voice commands like "claim transfer [ID]" or "refund transfer [ID]"\n`
            }
          }
          
          // Show filtered group payments and savings pots if relevant
          if (groupPayments?.length > 0) {
            message += `\n**👥 MATCHING GROUP PAYMENTS (${groupPayments.length})**\n\n`
            
            message += `<div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #0a0a0a; border-radius: 12px; border: 1px solid #1a1a1a;">\n`
            
            for (const payment of groupPayments.slice(0, 5)) {
              const amount = payment.amount ? (typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount) : 0
              const displayAmount = amount > 0 ? (amount / 1e18).toFixed(4) : '0.0000'
              const date = payment.timestamp ? new Date(payment.timestamp * 1000).toLocaleDateString('en-US', {
                month: 'short', day: '2-digit', year: 'numeric'
              }) : 'N/A'
              const participants = payment.numParticipants || 0
              const isCompleted = payment.isCompleted || false
              const statusColor = isCompleted ? '#10b981' : '#f59e0b'
              const statusText = isCompleted ? 'Complete' : 'Active'
              const shortRecipient = payment.recipient ? `${payment.recipient.slice(0, 6)}...${payment.recipient.slice(-4)}` : 'Unknown'
              const txId = payment.id ? `${payment.id.slice(0, 8)}...${payment.id.slice(-6)}` : 'N/A'
              
              message += `<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 8px; padding: 16px; border-left: 4px solid #10b981;">\n`
              message += `  <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">\n`
              message += `    <div style="display: flex; align-items: center; gap: 8px;">\n`
              message += `      <span style="font-size: 20px;">👥</span>\n`
              message += `      <span style="color: #10b981; font-weight: 600; font-size: 14px;">GROUP PAYMENT</span>\n`
              message += `    </div>\n`
              message += `    <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;">${statusText}</span>\n`
              message += `  </div>\n`
              message += `  <div style="color: #ffffff; font-size: 18px; font-weight: 700; margin-bottom: 8px;">${displayAmount} FLOW</div>\n`
              message += `  <div style="color: #a1a1aa; font-size: 14px; margin-bottom: 4px;">For ${participants} participants → ${shortRecipient}</div>\n`
              message += `  <div style="display: flex; justify-content: between; align-items: center;">\n`
              message += `    <span style="color: #71717a; font-size: 12px;">${date}</span>\n`
              message += `    <span style="color: #71717a; font-size: 12px;">ID: ${txId}</span>\n`
              message += `  </div>\n`
              message += `  <div style="margin-top: 12px; display: flex; gap: 8px;">\n`
              if (!isCompleted) {
                message += `    <button style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'contribute', id: '${payment.id}'}, '*')">💰 Contribute</button>\n`
              }
              message += `    <button style="background: #374151; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'details', id: '${payment.id}'}, '*')">📊 View Details</button>\n`
              message += `  </div>\n`
              message += `</div>\n`
            }
            
            message += `</div>\n`
          }
          
          if (savingsPots?.length > 0) {
            message += `\n**🏦 MATCHING SAVINGS POTS (${savingsPots.length})**\n\n`
            
            message += `<div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #0a0a0a; border-radius: 12px; border: 1px solid #1a1a1a;">\n`
            
            for (const pot of savingsPots.slice(0, 5)) {
              const currentAmount = pot.currentAmount ? (typeof pot.currentAmount === 'string' ? parseFloat(pot.currentAmount) : pot.currentAmount) : 0
              const targetAmount = pot.targetAmount ? (typeof pot.targetAmount === 'string' ? parseFloat(pot.targetAmount) : pot.targetAmount) : 0
              const displayCurrent = currentAmount > 0 ? (currentAmount / 1e18).toFixed(4) : '0.0000'
              const displayTarget = targetAmount > 0 ? (targetAmount / 1e18).toFixed(4) : '0.0000'
              const progress = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0
              const date = pot.timestamp ? new Date(pot.timestamp * 1000).toLocaleDateString('en-US', {
                month: 'short', day: '2-digit', year: 'numeric'
              }) : 'N/A'
              const isBroken = pot.isBroken || false
              const statusColor = isBroken ? '#ef4444' : '#10b981'
              const statusText = isBroken ? 'Broken' : 'Active'
              const txId = pot.id ? `${pot.id.slice(0, 8)}...${pot.id.slice(-6)}` : 'N/A'
              
              message += `<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 8px; padding: 16px; border-left: 4px solid #3b82f6;">\n`
              message += `  <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">\n`
              message += `    <div style="display: flex; align-items: center; gap: 8px;">\n`
              message += `      <span style="font-size: 20px;">🏦</span>\n`
              message += `      <span style="color: #3b82f6; font-weight: 600; font-size: 14px;">SAVINGS POT</span>\n`
              message += `    </div>\n`
              message += `    <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;">${statusText}</span>\n`
              message += `  </div>\n`
              message += `  <div style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">"${pot.name || 'Unnamed Pot'}"</div>\n`
              message += `  <div style="color: #ffffff; font-size: 18px; font-weight: 700; margin-bottom: 8px;">${displayCurrent} / ${displayTarget} FLOW</div>\n`
              message += `  <div style="background: #374151; border-radius: 8px; height: 8px; margin-bottom: 8px; overflow: hidden;">\n`
              message += `    <div style="background: linear-gradient(90deg, #10b981 0%, #34d399 100%); height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>\n`
              message += `  </div>\n`
              message += `  <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">\n`
              message += `    <span style="color: #a1a1aa; font-size: 14px;">${progress}% complete</span>\n`
              message += `    <span style="color: #71717a; font-size: 12px;">${date}</span>\n`
              message += `  </div>\n`
              message += `  <div style="display: flex; gap: 8px;">\n`
              if (!isBroken) {
                message += `    <button style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'deposit', id: '${pot.id}'}, '*')">💰 Deposit</button>\n`
                message += `    <button style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'withdraw', id: '${pot.id}'}, '*')">💸 Withdraw</button>\n`
              }
              message += `    <button style="background: #374151; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="window.parent.postMessage({type: 'action', action: 'details', id: '${pot.id}'}, '*')">📊 Details</button>\n`
              message += `  </div>\n`
              message += `</div>\n`
            }
            
            message += `</div>\n`
          }
          
          return {
            message: message,
            data: filteredResult.data
          }
        } else {
          throw new Error(filteredResult.error || 'Failed to fetch filtered transactions')
        }
        break
        
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  // Execute confirmed actions (called after user confirms)
  async executeConfirmedAction(
    action: string,
    data: any,
    context: { signer?: ethers.Signer; chainId?: number }
  ): Promise<any> {
    const { signer, chainId } = context
    if (!signer) throw new Error('Wallet not connected')

    switch (action) {
      case 'send':
        // Get proper token from supported tokens
        const supportedTokens = getSupportedTokensForChain(chainId || 545)
        const token = supportedTokens.find(t => 
          t.symbol.toLowerCase() === (data.token || 'FLOW').toLowerCase()
        ) || supportedTokens.find(t => t.isNative) || supportedTokens[0]
        
        return await this.aiService.sendTransfer(
          signer,
          data.recipient,
          data.amount,
          token,
          data.message || ''
        )
        
      case 'claim':
        return await this.aiService.claimTransfer(signer, data.identifier)
        
      case 'refund':
        return await this.aiService.refundTransfer(signer, data.transferId)
        
      case 'register_username':
        // Import the username registration function
        const { registerUsername } = await import('@/utils/contract')
        await registerUsername(signer, data.username)
        return {
          success: true,
          message: `✅ Username "${data.username}" registered successfully!`,
          data: { username: data.username }
        }
        
      case 'create_group_payment':
        return await this.aiService.createGroupPayment(
          signer,
          data.recipient,
          data.participants,
          data.amount,
          data.message || 'Created via AI Assistant'
        )
        
      case 'create_savings_pot':
        return await this.aiService.createSavingsPot(
          signer,
          data.name,
          data.targetAmount,
          data.remarks || 'Created via AI Assistant'
        )
        
      case 'contribute_group_payment':
        return await this.aiService.contributeToGroupPayment(
          signer,
          data.paymentId,
          data.amount
        )
        
      case 'contribute_savings_pot':
        return await this.aiService.contributeToSavingsPot(
          signer,
          data.potId,
          data.amount
        )
        
      case 'break_savings_pot':
        return await this.aiService.breakSavingsPot(
          signer,
          data.potId
        )
        
      default:
        throw new Error(`Cannot execute action: ${action}`)
    }
  }

  // Method to clear conversation context (useful for debugging)
  clearContext(): void {
    this.conversationContext = {
      messageHistory: []
    }
  }

  // Method to get current context (useful for debugging)
  getContext(): ConversationContext {
    return this.conversationContext
  }

  private getTransferStatus(status: number): string {
    switch (status) {
      case 0: return '⏳ Pending'
      case 1: return '🔄 Processing'  
      case 2: return '✅ Completed'
      case 3: return '↩️ Refunded'
      default: return '❓ Unknown'
    }
  }

  private getChainName(chainId?: number): string {
    switch (chainId) {
      case 1043: return 'BlockDAG Testnet'
      default: return 'Unknown Chain'
    }
  }

  private getStatusColor(status: number): string {
    switch (status) {
      case 0: return '#f59e0b' // yellow for pending
      case 1: return '#3b82f6' // blue for processing
      case 2: return '#10b981' // green for completed
      case 3: return '#ef4444' // red for refunded
      default: return '#6b7280' // gray for unknown
    }
  }

  private checkForConfirmationResponse(userMessage: string): boolean | null {
    const lowerInput = userMessage.toLowerCase().trim()
    
    // Positive confirmations
    if (lowerInput === 'yes' || lowerInput === 'y' || lowerInput === 'confirm' || 
        lowerInput === 'ok' || lowerInput === 'proceed' || lowerInput === 'accept') {
      return true
    }
    
    // Negative confirmations
    if (lowerInput === 'no' || lowerInput === 'n' || lowerInput === 'cancel' || 
        lowerInput === 'deny' || lowerInput === 'reject' || lowerInput === 'abort') {
      return false
    }
    
    // Not a confirmation response
    return null
  }

  private async handleConfirmationResponse(
    confirmed: boolean, 
    context: { address?: string; chainId?: number; signer?: ethers.Signer }
  ): Promise<GeminiAIResponse> {
    if (!this.conversationContext.pendingAction) {
      return {
        message: "I don't have any pending actions to confirm. How can I help you with ProtectedPay?"
      }
    }

    if (!confirmed) {
      const pendingAction = this.conversationContext.pendingAction
      this.conversationContext.pendingAction = undefined
      
      let cancelMessage = ''
      switch (pendingAction.type) {
        case 'send':
          cancelMessage = `❌ **Transfer cancelled.** I won't send the transfer.`
          break
        case 'claim':
          cancelMessage = `❌ **Claim cancelled.** I won't claim the transfer.`
          break
        case 'refund':
          cancelMessage = `❌ **Refund cancelled.** I won't refund the transfer.`
          break
        case 'register_username':
          cancelMessage = `❌ **Username registration cancelled.** I won't register the username.`
          break
        case 'create_group_payment':
          cancelMessage = `❌ **Group payment creation cancelled.** I won't create the group payment.`
          break
        case 'create_savings_pot':
          cancelMessage = `❌ **Savings pot creation cancelled.** I won't create the savings pot.`
          break
        case 'contribute_group_payment':
          cancelMessage = `❌ **Group payment contribution cancelled.** I won't add funds to the group payment.`
          break
        case 'contribute_savings_pot':
          cancelMessage = `❌ **Savings pot contribution cancelled.** I won't add funds to the savings pot.`
          break
        case 'break_savings_pot':
          cancelMessage = `❌ **Savings pot break cancelled.** I won't withdraw funds from the savings pot.`
          break
        default:
          cancelMessage = `❌ **Action cancelled.**`
      }
      
      return {
        message: `${cancelMessage} Let me know if you need help with anything else!`
      }
    }

    // User confirmed - execute the pending action
    const pendingAction = this.conversationContext.pendingAction
    this.conversationContext.pendingAction = undefined

    try {
      const result = await this.executeConfirmedAction(
        pendingAction.type,
        pendingAction.data,
        context
      )

      if (result.success) {
        let successMessage = ''
        switch (pendingAction.type) {
          case 'send':
            successMessage = `✅ **Transfer sent successfully!**\n\n🔗 **Transaction Hash**: ${result.txHash}\n${result.transferId ? `📋 **Transfer ID**: ${result.transferId}\n` : ''}💡 You can view this transaction on the blockchain explorer.`
            break
          case 'claim':
            successMessage = `✅ **Transfer claimed successfully!**\n\n🔗 **Transaction Hash**: ${result.txHash}\n💰 **Amount**: ${result.amount || 'N/A'}`
            break
          case 'refund':
            successMessage = `✅ **Transfer refunded successfully!**\n\n🔗 **Transaction Hash**: ${result.txHash}`
            break
          case 'register_username':
            successMessage = `✅ **Username "${pendingAction.data.username}" registered successfully!**\n\n👤 Your wallet address is now linked to username "${pendingAction.data.username}". Others can send transfers to you using this username instead of your address.`
            break
          case 'create_group_payment':
            successMessage = `✅ **Group payment created successfully!**\n\n🔗 **Transaction Hash**: ${result.txHash}\n👥 **For**: ${pendingAction.data.recipient}\n💰 **Amount**: ${pendingAction.data.amount} ${pendingAction.data.token}\n👫 **Participants**: ${pendingAction.data.participants}`
            break
          case 'create_savings_pot':
            successMessage = `✅ **Savings pot "${pendingAction.data.name}" created successfully!**\n\n🔗 **Transaction Hash**: ${result.txHash}\n🎯 **Target**: ${pendingAction.data.targetAmount} ${pendingAction.data.token}\n🏦 Start saving towards your goal!`
            break
          case 'contribute_group_payment':
            successMessage = `✅ **Contribution to group payment successful!**\n\n🔗 **Transaction Hash**: ${result.txHash}\n💰 **Amount**: ${pendingAction.data.amount} ${pendingAction.data.token}\n📋 **Payment ID**: ${pendingAction.data.paymentId}`
            break
          case 'contribute_savings_pot':
            successMessage = `✅ **Contribution to savings pot successful!**\n\n🔗 **Transaction Hash**: ${result.txHash}\n💰 **Amount**: ${pendingAction.data.amount} ${pendingAction.data.token}\n🏦 **Pot ID**: ${pendingAction.data.potId}`
            break
          case 'break_savings_pot':
            successMessage = `✅ **Savings pot broken successfully!**\n\n🔗 **Transaction Hash**: ${result.txHash}\n💰 All funds have been withdrawn from the pot.\n🏦 **Pot ID**: ${pendingAction.data.potId}`
            break
          default:
            successMessage = `✅ **Action completed successfully!**`
        }
        
        return {
          message: successMessage,
          data: {
            txHash: result.txHash,
            transferId: result.transferId,
            action: pendingAction.type
          }
        }
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
    } catch (error) {
      return {
        message: `❌ **Transaction Failed**: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\n` +
                 `Please try again or check your wallet connection.`
      }
    }
  }

  private getStatusFormatted(status: number): string {
    switch (status) {
      case 0: return '🟡 Pending'
      case 1: return '🔵 Processing'  
      case 2: return '🟢 Complete'
      case 3: return '🔴 Refunded'
      default: return '⚪ Unknown'
    }
  }
}
