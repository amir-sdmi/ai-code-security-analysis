
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/components/ChatMessage';
import { useEchooResponses } from '@/hooks/useEchooResponses';
import { useChatGPT } from '@/hooks/useChatGPT';
import { openaiService } from '@/services/openaiService';
import { useVoice } from '@/contexts/VoiceContext';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const { generateResponse: generateEchooResponse, isTyping } = useEchooResponses();
  const { generateResponse: generateChatGPTResponse, isGenerating, isSpeaking } = useChatGPT();
  const { voiceSettings, apiKey } = useVoice();
  
  // Check if ChatGPT is enabled
  const isChatGPTEnabled = openaiService.hasApiKey();
  
  const addInitialTutorMessage = (tutorSubject: string, tutorGrade: string) => {
    const initialGreeting: Message = {
      id: uuidv4(),
      content: `Welcome to your ${tutorSubject} tutoring session! I'm your AI tutor for ${tutorGrade} level. What would you like to learn about today?`,
      sender: 'echoo',
      timestamp: new Date()
    };
    setMessages([initialGreeting]);
    
    // If voice is enabled, speak the greeting
    if (voiceSettings.enabled && apiKey && isChatGPTEnabled) {
      generateChatGPTResponse(
        `Create a warm, welcoming greeting for a ${tutorGrade} level ${tutorSubject} tutoring session.`, 
        []
      );
    }
  };
  
  const resetMessages = () => {
    setMessages([]);
  };

  const handleSendMessage = async (content: string, useAI = false) => {
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setShowWelcome(false);
    
    // Show typing indicator
    if (isTyping || isGenerating) {
      const typingIndicator: Message = {
        id: 'typing',
        content: '...',
        sender: 'echoo',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, typingIndicator]);
    }
    
    // Generate response - either from ChatGPT or fallback to default
    let responseContent: string;
    let aiResponse: Message | null = null;
    
    if (useAI && isChatGPTEnabled) {
      // Use ChatGPT for response with voice if enabled
      aiResponse = await generateChatGPTResponse(content, messages);
    } 
    
    if (!aiResponse) {
      // Use default Echoo response as fallback
      responseContent = await generateEchooResponse(content);
      
      // Remove typing indicator if it exists
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      // Add Echoo's response
      const echooResponse: Message = {
        id: uuidv4(),
        content: responseContent,
        sender: 'echoo',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, echooResponse]);
    } else {
      // Remove typing indicator if it exists
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      // Add ChatGPT response
      setMessages(prev => [...prev, aiResponse!]);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    handleSendMessage(prompt, isChatGPTEnabled);
  };

  return {
    messages,
    showWelcome,
    setShowWelcome,
    handleSendMessage,
    handleSelectPrompt,
    isTyping,
    isGenerating,
    isSpeaking,
    isChatGPTEnabled,
    addInitialTutorMessage,
    resetMessages
  };
};
