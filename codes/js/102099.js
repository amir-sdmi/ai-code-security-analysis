'use client'
import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageCircle, Send, X, Minimize2, Maximize2, 
  Bot, User, Loader, Volume2, VolumeX, Copy, Trash2
} from 'lucide-react'

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const messagesEndRef = useRef(null)

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: `Hello! I'm your TAC-HUB AI Assistant, powered by ChatGPT-4 and specialized in Africa, the Congo Basin, and climate action!

I'm here to help you with:
• Congo Basin expertise - Forest conservation, biodiversity, traditional knowledge
• Climate action - Adaptation strategies, mitigation, community solutions  
• African environmental issues - Regional challenges and opportunities
• TAC-HUB platform - Features, tools, and community connections
• Traditional wisdom - Indigenous knowledge and sustainable practices

Ask me anything about:
- Climate change impacts in Central Africa
- Traditional ecological knowledge from Baka, Mbuti, and other communities
- Forest conservation and biodiversity protection
- Community-based climate solutions
- How to use TAC-HUB's monitoring tools and features
- Sustainable development in the Congo Basin

I'm designed to be conversational and helpful, just like ChatGPT, but with deep expertise in your region. What would you like to explore today?`,
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMessage])
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    const currentMessages = [...messages, userMessage]
    setMessages(currentMessages)
    setInputMessage('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Prepare conversation history for API
      const conversationHistory = currentMessages
        .slice(-10)
        .filter(msg => msg.type !== 'system')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
        .slice(0, -1)

      // Call OpenAI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          context: 'TAC-HUB platform - Congo Basin climate action and conservation',
          conversationHistory: conversationHistory
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.message,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, botMessage])
      
      // Text-to-speech if enabled
      if (voiceEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.message)
        utterance.rate = 0.8
        speechSynthesis.speak(utterance)
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `I apologize, but I'm having trouble connecting right now. Here's some general help:

Climate Information: I can help with climate change facts, Congo Basin conservation, and environmental solutions.

Community Features: 
- Use the Community page to connect with other users
- Share stories and experiences in the Knowledge Center
- Track weather patterns with traditional wisdom
- Monitor forest health and wildlife

Platform Navigation:
- Profile: Manage your account and preferences
- Marketplace: Find sustainable products
- Projects: Discover and support climate initiatives

Please try again in a moment, or explore the platform features above!`,
        timestamp: new Date().toISOString(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
  }

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      type: 'bot',
      content: `Chat cleared! I'm still here to help you with climate action, Congo Basin conservation, and platform features. What would you like to know?`,
      timestamp: new Date().toISOString()
    }])
  }

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="w-6 h-6" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-semibold">TAC-HUB AI Assistant</h3>
            <p className="text-xs text-blue-100">Climate & Conservation Expert</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="p-1 hover:bg-blue-700 rounded"
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={clearChat}
            className="p-1 hover:bg-blue-700 rounded"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-blue-700 rounded"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-blue-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[440px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : message.isError 
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div 
                      className="text-sm whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {message.type === 'bot' && (
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="text-xs opacity-70 hover:opacity-100"
                          title="Copy message"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about climate, Congo Basin, or platform features..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
