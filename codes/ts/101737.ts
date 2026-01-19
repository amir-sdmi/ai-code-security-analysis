import { STATUS_CODES } from "@/src/lib/constants/statusCodes.constants";
import { ApiError } from "@/src/lib/utils/apiError";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import axios from "axios";

const roles = {
  //ELON MUSK
  U08HHNVUA9E: {
    description:
      "Visionary co-founder pushing the boundaries of what's possible. Expect bold ideas, first-principles thinking, and a drive to make your startup 10x better. 'Why settle for normal?'",
    prompt:
      "You are Elon Musk, a bold co-founder. Use first-principles thinking, speak in short, provocative statements, and focus on innovation for Incrediforms, a no-code AI form builder. Use what you know about Elon Musk and his philosophy. Respond to: ",
  },
  //MARK ZUCKERBERG
  U08H74XEWL9: {
    description:
      "Data-driven CMSO obsessed with growth and user acquisition. Analytical and focused on scaling Incrediforms' user base efficiently.",
    prompt:
      "You are Mark Zuckerberg, a growth-obsessed CMSO. Use data-driven insights, speak concisely, and focus on scaling Incrediforms' users and engagement.Use what you know about Mark Zuckerberg and his philosophy. Respond to: ",
  },
  BillGurley: {
    description:
      "Legendary VC from Benchmark, focused on profitability and sustainable scaling for Incrediforms. Calm, direct, and grounded in unit economics.",
    prompt:
      "You are Bill Gurley, a VC advisor. Use data-backed reasoning, speak calmly, and focus on profitability and sustainable scaling for Incrediforms. Use what you know about Bill Gurley and his philosophy. Respond to: ",
  },
};

const conversationHistory = new Map<string, Array<{ role: string; content: string }>>();

const getContext = async (): Promise<string> => {
  return `
    # Introduction
    The company is Incrediforms, a no-code AI form builder that lets users attach prompts to forms. 
    It's a sandbox for building forms that generate AI responses from submissions based on prompts or files. 
    Forms can be shared via links, embedded in websites, or integrated via webhooks.

    # Supporting Article
    AI is revolutionizing every industry, and Incrediforms bridges the gap for mass adoption with no-code tools. 
    It's like Jotform or Google Forms mixed with ChatGPT—build a form, add a prompt, and get generative AI responses. 
    Power unlocks with custom data files. Current status: $0/month revenue, planning product launch.

    # Current Stage
    - 1 user
    - No revenue 
    - MVP Launched
    - Ramping up marketing
    - Most recent Feature
      - Scheduled Report Agent
        - Users can now schedule reports to be sent to them via email.
        - Reports can be scheduled daily, weekly, or monthly.
        - Reports can be scheduled for any form, and will be sent to the user's email address.
        - Reports will include an AI anlaysis of the current form submissions for the selected time period.
        - Reports will follow an AI prompt that the user inputs. 
     
  `;
};

const stripMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/`(.*?)`/g, '$1')       // Code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/#{1,6}\s/g, '')        // Headers
    .replace(/\n\s*[-*+]\s/g, '\n• ') // Lists
    .replace(/```[\s\S]*?```/g, (match) => {
      // For code blocks, just keep the content without the backticks
      return match.replace(/```\w*\n?|\n?```/g, '');
    });
};

const getSlackTokenForRole = (role: keyof typeof roles): string => {
  const tokenMap = {
    'U08HHNVUA9E': process.env.SLACK_ELON_BOT_TOKEN,
    'U08H74XEWL9': process.env.SLACK_MARK_BOT_TOKEN,
    'BillGurley': process.env.SLACK_BILL_BOT_TOKEN,
  };
  return tokenMap[role] || process.env.SLACK_ELON_BOT_TOKEN || '';
};

const readableNameMap = {
  'U08HHNVUA9E': 'Elon Musk',
  'U08H74XEWL9': 'Mark Zuckerberg',
  'BillGurley': 'Bill Gurley',
};

const generateResponse = async (role: keyof typeof roles, message: string, channelId: string): Promise<string> => {
  const context = await getContext();
  const fullPrompt = `${context}\n${roles[role].prompt}`;

  if (!conversationHistory.has(channelId)) {
    conversationHistory.set(channelId, []);
  }
  const history = conversationHistory.get(channelId)!;

  const model = new ChatOpenAI({
    streaming: false,
    model: "deepseek-chat",
    configuration: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    },
  });

  const messages = [
    ["system", fullPrompt],
    ...history.map(msg => [msg.role, msg.content] as const),
    ["user", `Message from Vequan Clark, founder of Incrediforms: ${message}`],
  ];

  const promptTemplate = ChatPromptTemplate.fromMessages(messages as [string, string][]);
  const promptValue = await promptTemplate.invoke({ message });

  try {
    const response = await model.invoke(promptValue);
    const responseContent = response.content as string;
    const cleanResponse = stripMarkdown(responseContent);
    const messageWithReadableName = message.replace(`@${role}`, `@${readableNameMap[role]}`);

    // Update conversation history
    history.push({ role: "user", content: messageWithReadableName });
    history.push({ role: "assistant", content: cleanResponse });

    console.log("HISTORY:", history);

    // Keep only last N messages (e.g., 10) to prevent context from growing too large
    if (history.length > 10) {
      history.splice(0, 2); // Remove oldest user-assistant pair
    }

    return cleanResponse;
  } catch (error) {
    throw new ApiError(STATUS_CODES.INTERNAL_SERVER_ERROR, (error as Error).message);
  }
};

const postMessageToSlack = async (channel: string, text: string, role: keyof typeof roles) => {
  try {
    await axios.post(
      "https://slack.com/api/chat.postMessage",
      { channel, text },
      {
        headers: {
          Authorization: `Bearer ${getSlackTokenForRole(role)}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Failed to post to Slack:", error);
  }
};

const handleSlackEvents = async (req: any, res: any) => {
  res.status(200).end();

  const event = req.body;

  if (event.type === "url_verification") {
    return res.json({ challenge: event.challenge });
  }

  if (event.type === "event_callback" && event.event?.type === "app_mention") {
    const message = event.event;
    const text = message.text || "";
    const channelId = message.channel;

    if (message.retry_num && message.retry_num > 0) {
      return;
    }

    for (const role of Object.keys(roles) as (keyof typeof roles)[]) {
      if (text.includes(`@${role}`)) {
        console.log("Generating response for role:", role);
        const reply = await generateResponse(role, text, channelId);
        await postMessageToSlack(channelId, reply, role);
        break;
      }
    }
  }
};

// Slack service
export const slackAssistantsService = {
  handleSlackEvents,
};