import axios from 'axios';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

import {
  useImageControllerGenerateAndUploadImage,
  useRunpodControllerIsEndpointRunning,
} from '@/api';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ImageGenerationResult {
  imageURL: string;
  prompt: string;
}

export const useImageGeneration = () => {
  const messageIdCounter = useRef(0);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-message',
      role: 'system',
      content:
        "Welcome to MintMuse! Describe what you want to create and I'll transform it into a beautiful post-impressionist artwork.",
      timestamp: new Date(),
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] =
    useState<ImageGenerationResult | null>(null);

  const generateImageMutation = useImageControllerGenerateAndUploadImage();

  // Check server status
  const { data: serverStatus } = useRunpodControllerIsEndpointRunning({
    query: {
      refetchInterval: 30000, // Every 30 seconds
      staleTime: 15000, // Consider data stale after 15 seconds
    },
  });

  const generateUniqueId = (prefix: string): string => {
    messageIdCounter.current += 1;
    return `${prefix}-${Date.now().toString()}-${
      messageIdCounter.current
    }-${Math.random().toString(36).substring(2, 9)}`;
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: generateUniqueId('user'),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  // Add an assistant message to the chat
  const addAssistantMessage = (content: string, isLoading = false) => {
    const newMessage: Message = {
      id: generateUniqueId('assistant'),
      role: 'assistant',
      content,
      timestamp: new Date(),
      isLoading,
    };

    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  // Update a message by ID
  const updateMessage = (id: string, content: string, isLoading = false) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content, isLoading } : msg))
    );
  };

  // Handle the full process of enhancing a prompt and generating an image
  const handlePromptSubmission = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;

    // Check if the server is running
    const isServerRunning = serverStatus?.isRunning;

    if (!isServerRunning) {
      toast.error(
        'AI server is offline. Please wake up the server before generating images.'
      );
      addAssistantMessage(
        "I'm sorry, but our AI server appears to be offline. Please use the 'Wake up server' button above before creating artwork.",
        false
      );
      return;
    }

    try {
      // Add user message
      addUserMessage(userPrompt);

      // Add loading assistant message
      const enhancingMsgId = addAssistantMessage(
        'Enhancing your prompt to create the perfect post-impressionist artwork...',
        true
      );

      setIsGenerating(true);
      setGeneratedImage(null);

      // Step 1: Enhance the prompt with ChatGPT
      const enhanceResponse = await axios.post('/api/enhance-prompt', {
        prompt: userPrompt,
      });

      const enhancedPrompt = enhanceResponse.data.enhancedPrompt;

      // Update the enhancing message to show it's completed
      updateMessage(
        enhancingMsgId,
        "I've enhanced your prompt with post-impressionist elements.",
        false
      );

      // Add a small delay before adding the next message to prevent any timing issues
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Show the enhanced prompt in the chat
      addAssistantMessage(`"${enhancedPrompt}"`, false);

      // Add a small delay before adding the next message
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Add a new message for the generation process
      const generatingMsgId = addAssistantMessage(
        'Now generating your artwork using this enhanced description...',
        true
      );

      // Step 2: Generate the image with the enhanced prompt
      const result = await generateImageMutation.mutateAsync({
        data: { prompt: enhancedPrompt },
      });

      // Update the generating message with success
      updateMessage(
        generatingMsgId,
        'Your artwork has been created! You can now view, download, share, or mint it as an NFT.',
        false
      );

      // Set the generated image
      setGeneratedImage({
        imageURL: result.imageURL,
        prompt: enhancedPrompt,
      });
    } catch (error: any) {
      console.error('Error in image generation process:', error);

      // Add a new error message instead of updating an existing one to avoid any id issues
      addAssistantMessage(
        "I'm sorry, I encountered an error while creating your artwork. Please try again with a different prompt.",
        false
      );

      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset the generated image
  const resetGeneratedImage = () => {
    setGeneratedImage(null);
  };

  // Clear all messages and reset
  const resetConversation = () => {
    setMessages([
      {
        id: 'welcome-message-reset',
        role: 'system',
        content:
          "Welcome to MintMuse! Describe what you want to create and I'll transform it into a beautiful post-impressionist artwork.",
        timestamp: new Date(),
      },
    ]);
    setGeneratedImage(null);
  };

  return {
    messages,
    isGenerating,
    generatedImage,
    handlePromptSubmission,
    resetGeneratedImage,
    resetConversation,
    isServerRunning: serverStatus?.isRunning,
  };
};
