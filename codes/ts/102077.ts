import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { streamText, CoreMessage } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { searchDocumentsOptimized, detectSimpleQuery } from '../../../lib/ai/optimized-documents';
import { visualizationTools } from './visualization_tools';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// getModelConfig will now be the primary way to get a configured model instance
function getModelConfig(modelId: string, mode: string = 'chat') {
  let baseSystem = '';

  if (mode === 'generate') {
    baseSystem = `You are an expert React developer who excels at creating clean, accessible, and responsive UI components. You're helping a user create React components based on their prompts. Always generate the most minimal, clean React code that fulfills the requirements. Use TypeScript type annotations when appropriate. Always use modern React patterns (e.g., functional components, hooks). Format the JSX beautifully.\r\n\r\nWhen generating code, invoke the 'generateReactComponent' tool to provide the complete, ready-to-use component. Each component should be:\r\n1. Complete and self-contained\r\n2. Well-typed with TypeScript\r\n3. Using modern React patterns\r\n4. Following best practices for accessibility and responsiveness`;
  } else { // 'chat' mode
    baseSystem = `You are a helpful STEM assistant. Focus on providing accurate, educational information about science, technology, engineering, and mathematics. Explain concepts clearly and provide examples where appropriate. If you're unsure about something, acknowledge the limits of your knowledge instead of making up information.

## CRITICAL: MATHEMATICAL FORMATTING REQUIREMENTS

**MANDATORY**: ALL mathematical expressions MUST use dollar sign delimiters - NEVER use parentheses or brackets!

WRONG: (f(x)), (\\frac{dy}{dx}), [ \\frac{dy}{dx} = f'(x) ]
CORRECT: $f(x)$, $\\frac{dy}{dx}$, $$\\frac{dy}{dx} = f'(x)$$

**INLINE MATH**: Use single dollar signs for math within sentences:
- Variables: Use $x$, $y$, $f(x)$, $g(x)$
- Simple expressions: Use $E = mc^2$, $F = ma$, $\\frac{dy}{dx}$
- Constants: Use $\\pi$, $e$, $\\alpha$, $\\beta$

**BLOCK MATH**: Use double dollar signs for standalone equations:
- Important formulas: Use $$\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$$
- Complex expressions: Use $$\\int_a^b f(x) dx = F(b) - F(a)$$

**EXAMPLES OF CORRECT FORMATTING**:
The chain rule formula is $\\frac{dy}{dx} = \\frac{df}{dg} \\cdot \\frac{dg}{dx}$.
For a composite function $h(x) = f(g(x))$, we have: $$h'(x) = f'(g(x)) \\cdot g'(x)$$
Where $f'(g(x))$ is the derivative of the outer function and $g'(x)$ is the derivative of the inner function.

## TEXT FORMATTING GUIDELINES

### Mathematical Elements (Remember: Always use $ delimiters!)
- Fractions: $\frac{numerator}{denominator}$
- Square roots: $\sqrt{x}$, $\sqrt[n]{x}$
- Subscripts/superscripts: $x_1^2$, $H_2O$
- Integrals: $\int_a^b f(x) dx$
- Derivatives: $\frac{d}{dx}$, $\frac{\partial f}{\partial x}$
- Greek letters: $\alpha$, $\beta$, $\gamma$, $\Delta$, $\Omega$
- Functions: $\sin(x)$, $\cos(x)$, $\log(x)$, $\ln(x)$
- Chemistry: $\text{H}_2\text{SO}_4$, $\text{CaCO}_3$

### Content Structure
- Use clear headers (# ## ###) for organization
- Format lists with proper bullets or numbers
- Use code blocks with language specification
- Include tables when comparing data
- Use **bold** for key terms, *italics* for emphasis
- Define all mathematical variables when introduced
- Include units for physical quantities
- Break complex derivations into clear steps

**REMINDER**: Every single mathematical expression, variable, or formula MUST be wrapped in dollar signs!

When a user asks about molecules, chemical structures, or wants to see a 3D molecular visualization, you MUST call the 'displayMolecule3D' tool. Do NOT generate text tokens like [NEEDS_VISUALIZATION]. Instead, directly call the tool.

For molecule visualization:
- Tool name: displayMolecule3D
- Required parameters: identifierType ('pdb' or 'smiles'), identifier (the actual SMILES string or PDB ID)
- Optional: description

Example: If user asks about ethanol (CCO), call displayMolecule3D with:
{
  "identifierType": "smiles", 
  "identifier": "CCO", 
  "description": "3D model of Ethanol"
}

For physics simulations and mechanics demonstrations, use the 'displayPhysicsSimulation' tool:

PREDEFINED PHYSICS SCENARIOS:
- "collision_demo" - Demonstrates elastic/inelastic collisions with conservation of momentum
- "spring_system" - Shows simple harmonic motion and spring dynamics
- "projectile_motion" - Demonstrates parabolic trajectory under gravity
- "inclined_plane" - Forces and motion on angled surfaces
- "pendulum" - Simple pendulum with customizable parameters
- "falling_objects" - Objects falling under gravity with different properties

NATURAL LANGUAGE TO PHYSICS MAPPING:
- "Two balls colliding" or "collision" → collision_demo
- "Mass on a spring" or "harmonic motion" → spring_system  
- "Ball rolling down a ramp" → inclined_plane
- "Projectile" or "trajectory" → projectile_motion
- "Pendulum" or "oscillation" → pendulum
- "Falling" or "gravity" → falling_objects

For predefined scenarios, use minimal parameters:
{
  "simulationType": "collision_demo",
  "simConfig": {},
  "metadata": {
    "title": "Collision Demonstration",
    "description": "Watch two objects collide and observe momentum conservation"
  }
}

For custom physics scenarios, use the full configuration system:
{
  "simulationType": "custom_matter_js_setup",
  "simConfig": {
    "objects": [
      {
        "id": "ball1",
        "type": "ball",
        "position": {"x": 100, "y": 200},
        "velocity": {"x": 2, "y": 0},
        "dimensions": {"radius": 15},
        "properties": {"mass": 1, "color": "#ff6b6b"}
      }
    ],
    "environment": {
      "gravity": {"x": 0, "y": 0.98},
      "boundaries": {"ground": true, "walls": true}
    }
  },
  "metadata": {
    "title": "Custom Physics Simulation",
    "educational_context": "Demonstrates specific physics principles"
  }
}

Object types: "ball", "box", "polygon"
Colors: Use hex codes like "#ff6b6b", "#4ecdc4", "#9b59b6"
Always include educational_context in metadata to explain the physics concept.

For mathematical function plotting:
- For 2D functions (single variable): use 'plotFunction2D' tool
  * Required: functionString (math.js syntax), variable (name and range)
  * Optional: plotType ('line' or 'scatter'), title
  * Example: sin(x) from -π to π would be:
    {
      "functionString": "sin(x)",
      "variable": {"name": "x", "range": [-3.14159, 3.14159]},
      "plotType": "line",
      "title": "Sine Wave"
    }

- For 3D functions (two variables): use 'plotFunction3D' tool  
  * Required: functionString (math.js syntax), variables (array of 2 variables with names and ranges)
  * Optional: plotType ('surface' or 'contour'), title
  * Example: sin(x)*cos(y) would be:
    {
      "functionString": "sin(x) * cos(y)",
      "variables": [
        {"name": "x", "range": [-5, 5]},
        {"name": "y", "range": [-5, 5]}
      ],
      "plotType": "surface",
      "title": "3D Plot of sin(x)*cos(y)"
    }

For general charts and plots with raw data, use the 'displayPlotlyChart' tool with data array and optional layout object.

IMPORTANT: 
- Always use the actual tool calls, never generate text tokens or placeholders
- Call each tool only ONCE per response - do not repeat tool calls
- After calling a tool, provide a brief explanation of what was displayed
- For physics, always explain the educational concept being demonstrated
- CRITICAL: Use ONLY dollar signs for mathematical expressions - NEVER parentheses or brackets!
- Structure responses with clear headers, proper markdown formatting, and logical flow
- Use appropriate emphasis, lists, and code blocks to enhance readability`;
  }

  switch (modelId) {
    case 'gemini-1.5-flash-latest':
      return {
        model: google('models/gemini-1.5-flash-latest'),
        system: `${baseSystem}\n\nYou are powered by Gemini 1.5 Flash.`,
      };
    case 'claude-3-haiku-20240307':
      return {
        model: anthropic('claude-3-haiku-20240307'),
        system: `${baseSystem}\n\nYou are powered by Claude 3 Haiku.`,
      };
    case 'gpt-4o':
      return {
        model: openai('gpt-4o'),
        system: `${baseSystem}\n\nYou are powered by GPT-4o.`,
      };
    default:
      return {
        model: xai('grok-3-mini'),
        system: `${baseSystem}\n\nYou are powered by Grok-3-Mini with reasoning capabilities.`,
      };
  }
}

export function errorHandler(error: unknown): string {
  if (error == null) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  try {
    const strError = JSON.stringify(error);
    return strError.length > 200 ? strError.substring(0, 197) + '...' : strError;
  } catch {
    return 'Complex error object that could not be stringified';
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { 
    messages, 
    model: modelId = 'grok-3-mini',
    mode = 'chat',
  }: { 
    messages: CoreMessage[], 
    model?: string, 
    mode?: 'chat' | 'generate',
  } = body;

  const lastUserMessage = messages
    .filter((message: CoreMessage) => message.role === 'user')
    .pop();
  
  let context = '';
  if (process.env.RAG_ENABLED === 'true' && lastUserMessage && typeof lastUserMessage.content === 'string') {
    try {
      // Fast path for simple queries (no RAG needed)
      const isSimpleQuery = detectSimpleQuery(lastUserMessage.content);
      
      if (!isSimpleQuery) {
        console.log('RAG is enabled, searching documents for:', lastUserMessage.content.substring(0, 50) + '...');
        const relevantDocs = await searchDocumentsOptimized(lastUserMessage.content, 3);
        if (relevantDocs && relevantDocs.length > 0) {
          context = `Here is some relevant information that may help answer the question:\n\n` +
            relevantDocs.map((doc) => {
              return `Document: \"${doc.title}\"\nContent: ${doc.content}\n`;
            }).join('\n');
        }
      } else {
        console.log('Simple query detected - skipping RAG for:', lastUserMessage.content.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('Error searching documents (RAG enabled):', error);
    }
  } else if (lastUserMessage && typeof lastUserMessage.content === 'string'){
    console.log('RAG is disabled or last user message is not suitable for search. Skipping document search.');
  }

  const modelConfig = getModelConfig(modelId, mode);
  
  const systemPromptWithContext = context 
    ? `${modelConfig.system}\n\n${context}`
    : modelConfig.system;

  console.log('[Chat API] ===== NEW REQUEST =====');
  console.log('[Chat API] Model:', modelId, 'Mode:', mode);
  console.log('[Chat API] Messages count:', messages.length);
  console.log('[Chat API] Last message:', messages[messages.length - 1]?.content?.toString().substring(0, 100));
  console.log('[Chat API] Available tools:', mode === 'chat' ? Object.keys(visualizationTools) : ['generateReactComponent']);
  console.log('[Chat API] System prompt includes:', systemPromptWithContext.includes('displayMolecule3D') ? 'displayMolecule3D instructions' : 'no tool instructions');

  try {
    const result = await streamText({
      model: modelConfig.model,
      system: systemPromptWithContext,
      messages,
      maxSteps: mode === 'generate' ? 5 : 3,
      tools: mode === 'generate' ? { 
        generateReactComponent: {
          description: 'Generate a React component based on the user request',
          parameters: z.object({
            jsx: z.string().describe('The React JSX code for the component'),
            componentName: z.string().describe('The name of the component'),
            description: z.string().describe('A brief description of what the component does'),
          }),
          execute: async function ({ jsx, componentName, description }) {
            return { jsx, componentName, description, timestamp: new Date().toISOString() };
          }
        }
      } : visualizationTools,
      onFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
        console.log('[onFinish] ===== STREAM FINISHED =====');
        console.log('[onFinish] Finish Reason:', finishReason);
        console.log('[onFinish] Usage:', usage);
        console.log('[onFinish] Text:', text?.substring(0, 200) + (text?.length > 200 ? '...' : ''));
        console.log('[onFinish] Tool Calls Count:', toolCalls?.length || 0);
        if (toolCalls && toolCalls.length > 0) {
          console.log('[onFinish] Tool Calls:', JSON.stringify(toolCalls, null, 2));
        }
        if (toolResults && toolResults.length > 0) {
          console.log('[onFinish] Tool Results:', JSON.stringify(toolResults, null, 2));
        }
        console.log('[onFinish] Available Tools:', Object.keys(visualizationTools));
      }
    });

    return result.toDataStreamResponse({ 
      getErrorMessage: errorHandler 
    });

  } catch (error) {
    console.error('Error in streamText call or its setup:', error);
    const message = errorHandler(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 