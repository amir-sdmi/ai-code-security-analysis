/*eslint-disable*/
"use client";
import { useState, useEffect, useCallback } from "react";
import { useXMTPClient } from "./useXMTPClient";
import { useAccount } from "wagmi";
import { v4 as uuidv4 } from "uuid";
import type { AIAgent, AgentMessage, Message } from "../types";
import { geminiAgentService, agentPersonalities } from "../gemini-agent-service";

// Special agent identifier prefix for XMTP conversations
const AGENT_PREFIX = "ai-agent:";

// Create virtual agent addresses for XMTP conversations
const createAgentAddress = (agentId: string): string => {
  // Create a deterministic "address" for the agent based on its ID
  // This allows us to create consistent XMTP conversations
  const hash = Array.from(agentId).reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
  
  // Convert to hex and pad to 40 characters (Ethereum address format)
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${AGENT_PREFIX}${hexHash}${'0'.repeat(32 - hexHash.length)}`;
};

// Parse agent messages from XMTP messages
const parseAgentMessage = (message: Message, agentId: string): AgentMessage => {
  try {
    // Try to parse as JSON first (for structured agent messages)
    const parsed = JSON.parse(message.content);
    return {
      id: message.id,
      content: parsed.content || message.content,
      senderAddress: parsed.senderAddress || message.senderAddress,
      timestamp: message.sent,
      type: parsed.type || 'message',
      agentId,
      metadata: parsed.metadata
    };
  } catch {
    // Fallback to plain text message
    return {
      id: message.id,
      content: message.content,
      senderAddress: message.senderAddress,
      timestamp: message.sent,
      type: 'message',
      agentId
    };
  }
};

// Create structured message content for XMTP
const createAgentMessageContent = (
  content: string,
  type: AgentMessage['type'] = 'message',
  metadata?: AgentMessage['metadata']
): string => {
  return JSON.stringify({
    content,
    type,
    metadata,
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
};

export const useXMTPAgents = () => {
  const { address } = useAccount();
  const { client, conversations, isInitializing, error: xmtpError } = useXMTPClient();
  
  // State
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentConversations, setAgentConversations] = useState<Map<string, any>>(new Map());

  // Initialize demo agents with XMTP integration
  useEffect(() => {
    if (!client) return;

    const initializeAgents = async () => {
      const demoAgents: AIAgent[] = Object.keys(agentPersonalities).map(role => {
        const personality = agentPersonalities[role];
        return {
          id: `${role}-agent-1`,
          name: personality.name,
          description: personality.description,
          role: personality.role,
          capabilities: personality.capabilities,
          chainId: 1,
          createdAt: new Date(),
          isActive: true,
          owner: "0x0000000000000000000000000000000000000000",
          imageUrl: "https://via.placeholder.com/150"
        };
      });

      setAgents(demoAgents);

      // Initialize XMTP conversations for each agent
      const conversationMap = new Map();
      for (const agent of demoAgents) {
        try {
          const agentAddress = createAgentAddress(agent.id);
          const conversation = await client.conversations.newConversation(agentAddress);
          conversationMap.set(agent.id, conversation);
          
          // Send welcome message if conversation is new
          const welcomeContent = createAgentMessageContent(
            `Hello! I'm ${agent.name}, your AI ${agent.role} expert. I specialize in ${agent.capabilities.slice(0, 3).join(', ')} and more. How can I help you today?`,
            'system'
          );
          
          // Check if we already have messages in this conversation
          const existingMessages = await conversation.messages();
          if (existingMessages.length === 0) {
            await conversation.send(welcomeContent);
          }
        } catch (err) {
          console.error(`Failed to initialize conversation for agent ${agent.id}:`, err);
        }
      }
      
      setAgentConversations(conversationMap);
    };

    initializeAgents();
  }, [client]);

  // Load messages when an agent is selected
  useEffect(() => {
    if (!selectedAgent || !client) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setError(null);

      try {
        const conversation = agentConversations.get(selectedAgent.id);
        if (conversation) {
          const xmtpMessages = await conversation.messages();
          const agentMessages = xmtpMessages.map((msg: Message) => 
            parseAgentMessage(msg, selectedAgent.id)
          );
          
          // Sort by timestamp
          agentMessages.sort((a: { timestamp: string | number | Date; }, b: { timestamp: string | number | Date; }) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          setMessages(agentMessages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        setError("Failed to load messages. Please try again.");
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedAgent, client, agentConversations]);

  // Create a new agent
  const createAgent = async (agentData: {
    name: string;
    description: string;
    role: string;
    capabilities: string[];
    chainId?: number;
    contractAddress?: string;
    apiEndpoint?: string;
  }) => {
    try {
      setError(null);
      
      if (!client) {
        throw new Error("XMTP client not initialized");
      }

      // Generate enhanced capabilities using Gemini if needed
      let enhancedCapabilities = agentData.capabilities;
      if (enhancedCapabilities.length === 0) {
        try {
          enhancedCapabilities = await geminiAgentService.generateAgentCapabilities(
            agentData.role, 
            agentData.description
          );
        } catch (err) {
          console.warn("Failed to generate enhanced capabilities, using defaults");
          enhancedCapabilities = ["General Analysis", "Data Processing", "User Assistance"];
        }
      }

      // Create new agent object
      const newAgent: AIAgent = {
        id: `agent-${uuidv4()}`,
        name: agentData.name,
        description: agentData.description,
        role: agentData.role,
        capabilities: enhancedCapabilities,
        chainId: agentData.chainId,
        contractAddress: agentData.contractAddress,
        apiEndpoint: agentData.apiEndpoint,
        createdAt: new Date(),
        isActive: true,
        owner: address || "0x0000000000000000000000000000000000000000",
      };

      // Initialize XMTP conversation for the new agent
      const agentAddress = createAgentAddress(newAgent.id);
      const conversation = await client.conversations.newConversation(agentAddress);
      
      // Generate welcome message using Gemini
      let welcomeMessage: string;
      try {
        welcomeMessage = await geminiAgentService.generateAgentResponse(
          agentData.role,
          "Introduce yourself to a new user and explain how you can help them.",
          []
        );
      } catch (err) {
        console.warn("Failed to generate welcome message, using default");
        welcomeMessage = `Hello! I'm ${newAgent.name}, your AI ${newAgent.role} agent. I'm here to help you with ${newAgent.capabilities.join(', ')}. How can I assist you today?`;
      }

      // Send welcome message via XMTP
      const welcomeContent = createAgentMessageContent(welcomeMessage, 'system');
      await conversation.send(welcomeContent);

      // Update state
      setAgents(prev => [...prev, newAgent]);
      setAgentConversations(prev => new Map(prev.set(newAgent.id, conversation)));
      setSelectedAgent(newAgent);
      
      return newAgent;
    } catch (err) {
      console.error("Error creating agent:", err);
      setError("Failed to create agent. Please try again.");
      throw err;
    }
  };

  // Send message to agent
  const sendMessage = async (agentId: string, content: string) => {
    try {
      setError(null);
      
      if (!address) {
        setError("You must connect your wallet to send messages.");
        return;
      }

      if (!client) {
        setError("XMTP client not initialized.");
        return;
      }

      const conversation = agentConversations.get(agentId);
      if (!conversation) {
        setError("No conversation found for this agent.");
        return;
      }

      // Send user message via XMTP
      const userMessageContent = createAgentMessageContent(content, 'message');
      await conversation.send(userMessageContent);

      // Create immediate user message for UI
      const userMessage: AgentMessage = {
        id: `msg-${uuidv4()}`,
        content,
        senderAddress: address,
        timestamp: new Date(),
        type: "message",
        agentId
      };

      // Add user message to UI immediately
      setMessages(prev => [...prev, userMessage]);

      // Get conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.type === "message")
        .slice(-6) // Last 6 messages for context
        .map(msg => ({
          role: msg.senderAddress === address ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // Find the agent to get its role
      const selectedAgentObj = agents.find(a => a.id === agentId);
      const agentRole = selectedAgentObj?.role || 'finance';

      // Generate response using Gemini
      let agentResponseContent: string;
      try {
        agentResponseContent = await geminiAgentService.generateAgentResponse(
          agentRole,
          content,
          conversationHistory
        );
      } catch (err) {
        console.error("Failed to generate Gemini response:", err);
        agentResponseContent = "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment.";
      }

      // Determine message type based on content
      let messageType: 'message' | 'action' | 'result' | 'error' | 'system' = 'message';
      let metadata: any = undefined;

      if (content.toLowerCase().includes('transaction') || content.toLowerCase().includes('execute')) {
        messageType = 'action';
        metadata = {
          transactionHash: `0x${Math.random().toString(16).substring(2, 62)}`,
          functionName: "executeAction"
        };
      } else if (content.toLowerCase().includes('analyze') || content.toLowerCase().includes('calculate')) {
        messageType = 'result';
        metadata = {
          functionName: "performAnalysis",
          parameters: { query: content }
        };
      }

      // Send agent response via XMTP
      const agentResponseMessageContent = createAgentMessageContent(
        agentResponseContent, 
        messageType, 
        metadata
      );
      await conversation.send(agentResponseMessageContent);

      // Create agent response for UI
      const agentResponse: AgentMessage = {
        id: `msg-${uuidv4()}`,
        content: agentResponseContent,
        senderAddress: agentId,
        timestamp: new Date(),
        type: messageType,
        agentId,
        metadata
      };

      // Add agent response to UI
      setMessages(prev => [...prev, agentResponse]);

    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    }
  };

  // Disconnect agent (remove from local state but keep XMTP conversation)
  const disconnectAgent = async (agentId: string) => {
    try {
      setError(null);
      
      // Remove agent from local state
      const updatedAgents = agents.filter(agent => agent.id !== agentId);
      setAgents(updatedAgents);
      
      // Remove conversation from local map
      const newConversations = new Map(agentConversations);
      newConversations.delete(agentId);
      setAgentConversations(newConversations);
      
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error disconnecting agent:", err);
      setError("Failed to disconnect agent.");
      throw err;
    }
  };

  // Select an agent
  const selectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setMessages([]); // Clear previous messages, will reload from XMTP
  };

  // Stream messages for real-time updates
  useEffect(() => {
    if (!selectedAgent || !client) return;

    const conversation = agentConversations.get(selectedAgent.id);
    if (!conversation) return;

    let isActive = true;

    const streamMessages = async () => {
      try {
        for await (const message of conversation.streamMessages()) {
          if (!isActive) break;
          
          const agentMessage = parseAgentMessage(message, selectedAgent.id);
          
          // Only add if not already in messages
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === agentMessage.id);
            if (exists) return prev;
            return [...prev, agentMessage].sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
        }
      } catch (err) {
        console.error("Error streaming messages:", err);
      }
    };

    streamMessages();

    return () => {
      isActive = false;
    };
  }, [selectedAgent, client, agentConversations]);

  return {
    agents,
    selectedAgent,
    messages,
    isLoadingMessages,
    isCreateModalOpen,
    error: error || xmtpError,
    isInitializing,
    createAgent,
    sendMessage,
    disconnectAgent,
    selectAgent,
    setIsCreateModalOpen,
    setError,
    client,
  };
};
