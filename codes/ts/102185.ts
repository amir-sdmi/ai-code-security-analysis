import { Router, Request, Response, NextFunction } from "express";
import {
  CopilotRuntime,
  AnthropicAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from "@copilotkit/runtime";
import { WorkflowRepository } from "../repositories/workflow.repository";
import { WorkflowService } from "../services/workflow.service";
import { WorkflowStreamService } from "../services/workflow-stream.service";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/config";

// Create a router factory function
export default (): Router => {
  // Initialize services
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const workflowRepo = new WorkflowRepository(supabase);
  const workflowService = new WorkflowService(workflowRepo);
  const workflowStreamService = new WorkflowStreamService(workflowService);
  const router = Router();

  // Log when the router is created
  console.log("[CopilotKitNewRoutes] Initializing new CopilotKit routes");

  // Create the Anthropic adapter
  // You'll need to set ANTHROPIC_API_KEY in your environment variables
  const serviceAdapter = new AnthropicAdapter({
    model: "claude-sonnet-4-20250514", // or any other Claude model you prefer
  });

  // Handle all requests to this router
  router.use("/", (req: Request, res: Response, next: NextFunction) => {
    const requestId = Math.random().toString(36).substring(2, 9);
    console.log(`[CopilotKitNewRoutes] [${requestId}] Received request:`, {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
        ? JSON.stringify(req.body).substring(0, 200) + "..."
        : null,
    });

    (async () => {
      try {
        // Create a new runtime instance for each request
        const runtime = new CopilotRuntime({
          // Define actions for the CopilotRuntime
          actions: [
            {
              name: "storyWorkflow",
              description: "Create a new user story with automated workflow",
              parameters: [
                {
                  name: "projectId",
                  type: "string",
                  description: "The project ID to associate with this story",
                  required: true,
                },
                {
                  name: "title",
                  type: "string",
                  description: "Brief title of the user story",
                  required: true,
                },
                {
                  name: "description",
                  type: "string",
                  description: "Detailed description of the feature",
                  required: true,
                },
              ],
              handler: async (params: any) => {
                console.log(
                  `[CopilotKitNewRoutes] [${requestId}] Story workflow triggered with params:`,
                  params
                );
                return {
                  success: true,
                  message: "Story workflow started successfully",
                };
              },
            },
            {
              name: "testCaseWorkflow",
              description: "Generate test cases for a user story with streaming updates",
              parameters: [
                {
                  name: "storyId",
                  type: "string",
                  description:
                    "The ID of the user story to generate test cases for",
                  required: true,
                },
                {
                  name: "projectId",
                  type: "string",
                  description: "The project ID",
                  required: true,
                },
                {
                  name: "storyTitle",
                  type: "string",
                  description: "Title of the user story",
                  required: true,
                },
                {
                  name: "storyDescription",
                  type: "string",
                  description: "Description of the user story",
                  required: true,
                },
                {
                  name: "acceptanceCriteria",
                  type: "string[]",
                  description: "Array of acceptance criteria strings",
                  required: true,
                },
                {
                  name: "projectDocuments",
                  type: "string[]",
                  description: "Array of project document IDs",
                  required: false,
                }
              ],
              handler: async (params: any) => {
                console.log(
                  `[CopilotKitNewRoutes] [${requestId}] Test case workflow triggered with params:`,
                  params
                );
                
                try {
                  // Set up streaming response
                  res.setHeader('Content-Type', 'text/event-stream');
                  res.setHeader('Cache-Control', 'no-cache');
                  res.setHeader('Connection', 'keep-alive');
                  
                  // Add this response to the stream service
                  workflowStreamService.addConnection(res);
                  
                  // Start the workflow
                  const workflowId = await workflowStreamService.startWorkflow(
                    params.projectId,
                    params.userId || 'system',
                    {
                      type: 'testCase',
                      storyId: params.storyId,
                      storyDetails: {
                        title: params.storyTitle,
                        description: params.storyDescription,
                        acceptanceCriteria: params.acceptanceCriteria || []
                      },
                      projectDocuments: params.projectDocuments || []
                    }
                  );
                  
                  // Return initial response
                  return {
                    success: true,
                    message: "Test case workflow started successfully",
                    workflowId: workflowId,
                    streaming: true
                  };
                } catch (error) {
                  console.error(`[CopilotKitNewRoutes] [${requestId}] Error starting workflow:`, error);
                  throw error;
                }
              },
            },
            {
              name: "getHelp",
              description: "Get help with using the application",
              parameters: [
                {
                  name: "topic",
                  type: "string",
                  description: "The topic to get help with",
                  required: true,
                },
              ],
              handler: async (params: any) => {
                console.log(
                  `[CopilotKitNewRoutes] [${requestId}] Help requested for topic:`,
                  params.topic
                );
                return {
                  success: true,
                  message: `Here's some help with ${params.topic}`,
                  topic: params.topic,
                };
              },
            },
          ],
        });

        // Create the handler
        const handler = copilotRuntimeNodeHttpEndpoint({
          endpoint: "/api/copilotkit", // This should match your frontend configuration
          runtime,
          serviceAdapter
        });

        // Handle the request with additional logging
        console.log(
          `[CopilotKitNewRoutes] [${requestId}] Handling request with CopilotKit runtime`
        );
        try {
          // Add detailed logging before handler execution
          console.log(
            `[CopilotKitNewRoutes] [${requestId}] Request body:`,
            JSON.stringify(req.body, null, 2)
          );
          
          // Sanitize and transform messages to match Mastra format
          if (req.body && req.body.messages && Array.isArray(req.body.messages)) {
            console.log(`[CopilotKitNewRoutes] [${requestId}] Sanitizing and transforming messages to prevent empty content and ensure correct format`);
            req.body.messages = req.body.messages
              .filter(
                (msg: any) =>
                  msg &&
                  typeof msg === 'object' &&
                  (msg.type === 'user' || msg.type === 'assistant' || msg.role === 'user' || msg.role === 'assistant')
              )
              .map((msg: any) => {
                // Normalize to { role, content }
                const role = msg.role || msg.type; // prefer role, fallback to type
                let content = msg.content;
                // Optionally, flatten array content to string if needed
                // if (Array.isArray(content)) content = content.map(...).join(' ');
                // Handle array content (Anthropic format)
                if (Array.isArray(content)) {
                  // Filter out any content blocks with empty text
                  const filteredContent = content.filter((item: any) => {
                    if (!item || typeof item !== 'object') return false;
                    if (item.type === 'text') {
                      return item.text !== undefined && item.text !== null && item.text.trim() !== '';
                    }
                    return true; // Keep non-text blocks
                  });
                  content = filteredContent.length > 0 ? filteredContent : [{ type: 'text', text: ' ' }];
                } else if (typeof content === 'string') {
                  if (content.trim() === '') {
                    content = ' ';
                  }
                } else if (content === undefined || content === null) {
                  content = ' ';
                }
                return { role, content };
              });
            console.log(`[CopilotKitNewRoutes] [${requestId}] Messages sanitized and transformed`);
          }

          // Check for empty messages in the request
          if (req.body && req.body.messages) {
            console.log(
              `[CopilotKitNewRoutes] [${requestId}] Messages count:`,
              req.body.messages.length
            );

            req.body.messages.forEach((msg: any, idx: number) => {
              if (msg.content) {
                const contentType = Array.isArray(msg.content)
                  ? "array"
                  : typeof msg.content;
                console.log(
                  `[CopilotKitNewRoutes] [${requestId}] Message ${idx} (${msg.role}): Content type: ${contentType}, Length: ${
                    Array.isArray(msg.content)
                      ? msg.content.length
                      : typeof msg.content === "string"
                        ? msg.content.length
                        : "N/A"
                  }`
                );

                // If content is an array, check each item
                if (Array.isArray(msg.content)) {
                  msg.content.forEach((item: any, itemIdx: number) => {
                    console.log(
                      `[CopilotKitNewRoutes] [${requestId}] Message ${idx}, Content item ${itemIdx}: Type: ${typeof item}, ${
                        item.type ? `Content type: ${item.type}` : ""
                      }, ${item.text ? `Text length: ${item.text.length}` : ""}`
                    );
                  });
                }
              } else {
                console.log(
                  `[CopilotKitNewRoutes] [${requestId}] Message ${idx} (${msg.role}): NO CONTENT`
                );
              }
            });
          }

          const result = await handler(req, res);
          console.log(
            `[CopilotKitNewRoutes] [${requestId}] Request handled successfully`
          );
          return result;
        } catch (handlerError) {
          console.error(
            `[CopilotKitNewRoutes] [${requestId}] Error in handler:`,
            handlerError
          );

          // Add more detailed error logging with proper type checking
          if (
            handlerError instanceof Error &&
            handlerError.message &&
            handlerError.message.includes(
              "text content blocks must be non-empty"
            )
          ) {
            console.error(
              `[CopilotKitNewRoutes] [${requestId}] Anthropic empty content error detected!`
            );

            // Examine the request body more carefully
            if (req.body && req.body.messages) {
              console.error(
                `[CopilotKitNewRoutes] [${requestId}] DETAILED MESSAGE INSPECTION:`
              );

              req.body.messages.forEach((msg: any, idx: number) => {
                console.error(
                  `[CopilotKitNewRoutes] [${requestId}] Message ${idx}:`
                );
                console.error(`  Role: ${msg.role || "undefined"}`);

                if (msg.content === undefined) {
                  console.error(`  Content: undefined`);
                } else if (msg.content === null) {
                  console.error(`  Content: null`);
                } else if (msg.content === "") {
                  console.error(`  Content: empty string`);
                } else if (Array.isArray(msg.content)) {
                  console.error(
                    `  Content: Array with ${msg.content.length} items`
                  );

                  msg.content.forEach((item: any, itemIdx: number) => {
                    console.error(`    Item ${itemIdx}:`);
                    console.error(`      Type: ${item.type || "undefined"}`);

                    if (item.text !== undefined) {
                      console.error(
                        `      Text: ${
                          item.text === ""
                            ? "empty string"
                            : item.text === null
                              ? "null"
                              : typeof item.text === "string"
                                ? `"${item.text.substring(0, 30)}${item.text.length > 30 ? "..." : ""}" (${item.text.length} chars)`
                                : typeof item.text
                        }`
                      );
                    }
                  });
                } else {
                  console.error(
                    `  Content: ${typeof msg.content} - ${
                      typeof msg.content === "string"
                        ? `"${msg.content.substring(0, 30)}${msg.content.length > 30 ? "..." : ""}" (${msg.content.length} chars)`
                        : JSON.stringify(msg.content)
                    }`
                  );
                }
              });
            }
          }

          throw handlerError;
        }
      } catch (error) {
        console.error(
          `[CopilotKitNewRoutes] [${requestId}] Error handling request:`,
          error
        );
        next(error);
      }
    })();
  });

  return router;
};
