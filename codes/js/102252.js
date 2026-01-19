import Together from "together-ai";
import { chatResponse } from "$lib/chat";
import { imageResponse } from "$lib/image";
import { TOGETHER_API_TOKEN } from '$env/static/private'
import { PPLX_API_TOKEN } from "$env/static/private";

const together = new Together({ apiKey: TOGETHER_API_TOKEN });

export async function POST({ request, locals }) {
    const query = await request.json()
    // console.log(query)
    try {
        let selectedModel = 'deepseek-ai/DeepSeek-R1'
        let visionResponse
        // switch (query.model) {
        //     case 'llama3.1-8b':
        //         selectedModel = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
        //         break;
        //     case 'llama3.1-70b':
        //         selectedModel = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
        //         break;
        //     case 'llama3.3-70b':
        //         selectedModel = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
        //         break;
        //     case 'llama3.1-405b':
        //         selectedModel = 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo'
        //         break;
        //     case 'mistral-7B-Instruct-v0.1':
        //         selectedModel = 'mistralai/Mistral-7B-Instruct-v0.1'
        //         break;
        //     case 'mixtral-8x22B-Instruct-v0.1':
        //         selectedModel = 'mistralai/Mixtral-8x22B-Instruct-v0.1'
        //         break;
        //     case 'Qwen2-72B-Instruct':
        //         selectedModel = 'Qwen/Qwen2-72B-Instruct'
        //         break;
        //     default:
        //         selectedModel = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
        //         break;


        const visionOutput = await together.chat.completions.create({
            messages: [
                {
                    "role": "system",
                    "content": `You are a specialized visual analysis assistant powered by Llama 4 Maverick. Your purpose is to analyze design images uploaded to Kodiia, an AI-first sketchbook for architects, artists, and designers.

When presented with an image:

1. OBSERVE VISUAL ELEMENTS: Identify and describe design language, geometry logic, key materials, colors, textures, spatial relationships, and focal points visible in the image. Be precise and detailed in your observations.

2. RECOGNIZE STYLE & REFERENCES: Note any recognizable design styles, cultural references, or similar precedents that this design appears to draw inspiration from.

3. EXTRACT CONCEPTUAL ELEMENTS: Identify the underlying concepts, themes, or narratives that appear to be expressed through the visual elements.

4. TECHNICAL CONSIDERATIONS: Note any visible technical aspects related to implementation, materials, or construction that might be relevant to the designer.

5. CONTEXTUAL UNDERSTANDING: Consider how the design might interact with its intended environment or audience based on visual cues.

6. VIEW POINT: Specify the view point 

Present your analysis in clear, structured language without making assumptions about aspects not visible in the image. Your observations will serve as the foundation for deeper critique and feedback.

Format your response as a structured JSON object with these categories to enable seamless integration with the R1 critique module.
`
                },
                ...query.previousAnswers.map(answer => ({
                    "role": "assistant",
                    "content": answer
                })),
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": query.query
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": query.referenceImage
                            }
                        }
                    ]
                },
                // {
                //     "role": "assistant",
                //     "content": query.previousAnswers
                // }
            ],
            model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
            max_tokens: 2048,
            temperature: 0.7,
            top_p: 0.7,
            top_k: 50,
            repetition_penalty: 1,
            stop: ["<|eot_id|>", "<|eom_id|>"],
            stream: false
        });
        //console.log(visionOutput.choices[0].message.content)

        visionResponse = {
            generatedText: visionOutput.choices[0].message.content
        }    // }

        const designCritiqueAgentPromptV1 = `
        You are a design insights specialist powered by DeepSeek R1, working within Kodiia - an AI-first sketchbook for architects, artists, and designers. You receive visual analysis data from the Llama 4 vision module and transform it into thoughtful questions and constructive feedback to explore unobvious further design directions.

Your role is not to make definitive judgments but to stimulate reflection through insightful questions and observations that help designers refine their work.

When processing visual analysis data:

1. FORMULATE REFLECTIVE QUESTIONS: Create 3-5 thought-provoking questions that encourage the designer to reflect on their choices, intentions, and potential alternatives. Focus on areas like:
   - Conceptual clarity and communication
   - Material and color relationships
   - Spatial organization and hierarchy
   - Contextual appropriateness
   - Technical implementation considerations

2. SUGGEST EXPLORATION PATHS: Offer 2-3 potential directions the designer might explore to develop their concept further, presented as open-ended suggestions rather than prescriptive advice. 
Consider borrowed logic from unrelated fields.

3. HIGHLIGHT STRENGTHS: Identify 2-3 aspects of the design that appear particularly successful or compelling, explaining their potential impact.

4. REFERENCE CONNECTIONS: Suggest relevant precedents, references, or theoretical frameworks that might enrich the designer's thinking about their work. Briefly describe core ideas of suggestions and why they are relevant here. 
Suggest 1-2 *specific* projects/theories with:  
- Key conceptual overlap (not just stylistic)  
- Implementation contrasts ("Unlike [Famous Project], your approach could...")

5. IMPLEMENTATION CONSIDERATIONS: If applicable, note technical aspects that might affect the realization of the design.

Before presenting the response review your feedback. Dive deeper. Make it more profound.

Your feedback should be domain-adaptive, adjusting naturally whether the design is architectural, product-based, or game-related. Maintain a tone that is analytical, constructive, and encouraging rather than judgmental.

Present your response in a conversational format that invites further dialogue and iteration.

Here is the visual analysis data: ${visionResponse.generatedText}

Here is the whole user chat context: ${query.previousAnswers}`

        const designCritiqueAgentPromptV2 = `
        You are a design insights specialist powered by DeepSeek R1, working within Kodiia - an AI-first sketchbook for architects, artists, and designers. You receive visual analysis data from the Llama 4 vision module and transform it into thoughtful questions and constructive feedback to explore unobvious further design directions.

Your role is not to make definitive judgments but to stimulate reflection through insightful questions and observations that help designers refine their work.

When processing visual analysis data, organize your response using EXACTLY these section headings:

1. REFLECTIVE QUESTIONS: Create 3-5 thought-provoking questions that encourage the designer to reflect on their choices, intentions, and potential alternatives. Focus on areas like:
   - Conceptual clarity and communication
   - Material and color relationships
   - Spatial organization and hierarchy
   - Contextual appropriateness
   - Technical implementation considerations
   Use clear, professional language without metaphorical or poetic phrasing.
   Ensure questions probe beyond surface aesthetics to underlying design decisions and conceptual foundations. Each question should challenge fundamental assumptions or reveal tensions within the design.

2. EXPLORATION PATHS: Offer 2-3 potential directions the designer might explore to develop their concept further, presented as open-ended suggestions rather than prescriptive advice. 
   Each suggested path should include:
   - The conceptual underpinning of the suggestion
   - How it builds on existing strengths while addressing limitations
   - A concrete example of implementation
   - The potential transformative impact on the design
   - Explain each suggestion with concrete examples
   - If referencing concepts from other fields, define them clearly and explain their direct application
   - Avoid vague or abstract recommendations without implementation details

3. DESIGN STRENGTHS: Identify 2-3 aspects of the design that appear particularly successful or compelling, explaining their potential impact.
   - Be specific about why these elements work well
   - If making comparisons to art movements or styles, provide brief explanations of the reference
   - Explain how these strengths could be leveraged further

4. RELEVANT REFERENCES: Suggest relevant precedents, references, or theoretical frameworks that might enrich the designer's thinking about their work. For each reference:
   - Name the specific project/theory
   - Explain the core concept in 1-2 sentences
   - Clearly articulate why it's relevant to this specific design
   - The philosophical or theoretical foundation of the reference
   - Specific techniques or approaches that could be adapted
   - How the reference both aligns with and challenges the current design
   - Highlight implementation contrasts ("Unlike [Famous Project], your approach could...")
   Limited to 1-2 specific examples with detailed explanations

5. TECHNICAL CONSIDERATIONS: If applicable, note technical aspects that might affect the realization of the design.
   - Focus on practical implementation details
   - Use clear terminology with explanations where needed
   - Provide specific examples of how technical choices impact the design outcome

Use professional, clear language throughout. Avoid:
- Poetic or metaphorical section titles
- Jargon without explanation
- Vague suggestions without implementation details
- Abstract concepts without concrete applications

Before presenting your response, complete a thorough DEPTH REVIEW process:

1. REVIEW FOR CLARITY: Ensure every concept is clearly explained and all technical terms are defined.

2. DEEPEN ANALYSIS: For each section, ask yourself "How can I make this insight more profound?" Add at least one layer of deeper analysis to each major point.

3. CONNECT TO FUNDAMENTALS: Link suggestions to fundamental design principles rather than just surface observations.

4. ELIMINATE SUPERFICIAL FEEDBACK: Replace any generic observations with specific, actionable insights that demonstrate deep understanding of design challenges.

5. ADD DIMENSION: Consider how your feedback addresses multiple levels of the design (conceptual, functional, aesthetic, technical, experiential).

6. QUESTION YOUR ASSUMPTIONS: Challenge your initial interpretations and consider alternative perspectives.

Remember, profound feedback goes beyond obvious observations to reveal underlying patterns, tensions, and opportunities that might not be immediately apparent.

Present your response in a conversational format that invites further dialogue and iteration.

Here is the visual analysis data: ${visionResponse.generatedText}

Here is the whole user chat context: ${query.previousAnswers}
`



        const output = await together.chat.completions.create({
            messages: [{
                role: "system",
                content: designCritiqueAgentPromptV2
            }, {
                role: "user",
                content: query.query
            }],
            model: 'deepseek-ai/DeepSeek-R1',
            max_tokens: 2048,
            temperature: 0.7,
            top_p: 0.7,
            top_k: 50,
            repetition_penalty: 1,
            stop: ["<|eot_id|>"],
            stream: false
        });
        //console.log(output.choices[0].message.content)

        const answer = output.choices[0].message.content

        function splitMarkdown(markdown = '') {
            // Define the regex pattern to match content between <think> and </think> tags
            const thinkPattern = /<think>([\s\S]*?)<\/think>/;

            // Find the match
            const match = markdown.match(thinkPattern);

            // Extract the think content if there's a match
            const thinkContent = match ? match[1].trim() : '';

            // Remove the think content from the original markdown to get the rest
            const restContent = markdown.replace(thinkPattern, '').trim();

            return {
                thinkContent,
                restContent
            };
        }

        const updatedAnswer = splitMarkdown(answer).restContent;
        const thinkContent = splitMarkdown(answer).thinkContent;

        const conceptualRefsPrompt = `
            Given this text, extract a list of 3-5 most important Conceptual Connections provided. 
            - Extract reference connections mentioned in critique
            - Use format like this: ["Zaha Hadid's parametric designs", "Bauhaus color theory", "Open world game environmental storytelling"]
            - Answer with just an array. Here is the text: ${updatedAnswer}`

        const conceptualRefsList = await chatResponse('deepseek-V3', thinkContent, conceptualRefsPrompt)
        const projectType = await chatResponse('deepseek-V3', updatedAnswer, 'Describe the project area field in one word (pavilion, house, game, etc.). Be short and concise. Use nouns. Do not use any symbols. Answer with just a word.')
        console.log(`project: ${projectType}`)

        const conceptualRefsListArray = JSON.parse(conceptualRefsList)
        // console.log('refs array:')
        // console.log(conceptualRefsListArray)

        async function getFullConceptualRefsArray(array) {
            let conceptualRefsListDataArray = []
            try {
                for (let i = 0; i < array.length; i++) {
                    let item = conceptualRefsListArray[i]
                    const options = {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${PPLX_API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: `{
                        "temperature":0.2,
                        "top_p":0.9,
                        "return_images":true,
                        "return_related_questions":false,
                        "top_k":0,
                        "stream":false,
                        "presence_penalty":0,
                        "frequency_penalty":1,
                        "web_search_options":{"search_context_size":"low"},
                        "model":"sonar",
                        "messages":[
                        {
                        "content":"You are a reference researcher for Kodiia design platform. When given design feedback with references, your task is to provide concise information about each mentioned reference. For each reference: identify its creator, year/period, 1-2 key principles, and relevance to design in under 100 words. Format with bullet points, ensure accuracy, and focus on visual characteristics when relevant. Present information clearly with proper headings.",
                        "role":"system"
                        },
                        {
                        "content":"I need to find relevant info for this: ${item}. I'm working on this project: ${projectType}",
                        "role":"user"
                        }
                        ]}`
                    };

                    const pplxMessage = await fetch('https://api.perplexity.ai/chat/completions', options)
                    const pplxMessageObject = await pplxMessage.json()
                    conceptualRefsListDataArray.push({
                        request: item,
                        response: pplxMessageObject
                })
                }
                return conceptualRefsListDataArray
            } catch (err) {
                console.log(err)
            }
        }



        const promptDesignPromtV1 = `
        You are a prompt engineer specialist powered by DeepSeek V3, working within Kodiia - an AI-first sketchbook for architects, artists, and designers. You receive critique analysis data from the DEEPSEEK R1 module and transform it into a detailed image description for Flux model to best present the design concept.
        - Specify the project type
        - Come up with a detailed prompt based on the Conceptual References and Potential Exploration Vectors provided.
        - Use best propmt design practices corresponding to the project type.
        - Start your prompt with 'An image of'.
        - If applicable specify detailed geometry and design language description.
        - Specify view point.
        - Specify best lighting conditions to present the design idea. Use soft lighting with soft shadows unless it is necessary to do the opposite.
        
        - Answer with just a prompt.
        Here is the critique: ${thinkContent}
        Here are the conceptual references list: ${conceptualRefsList}`

        const promptDesignPromptV2 = `You are a conceptual visualization agent powered by DeepSeek V3, working within Kodiia's AI sketchbook ecosystem. Transform design critique analysis from DeepSeek R1 into visionary image descriptions that manifest both explicit feedback and subtle conceptual implications through metaphorical visual storytelling.

When processing ${thinkContent} and ${conceptualRefsList}:

1. SYNTHESIZE CORE INSIGHTS: 
   - Identify 2-3 fundamental design challenges/opportunities from the critique
   - Extract 1-2 unconventional material relationships or spatial paradoxes suggested in exploration paths
   - Note any referenced theoretical frameworks needing visual representation

2. CREATE CONCEPTUAL BLUEPRINT:
   [Combine these elements into coherent visual logic]
   - Primary design metaphor (e.g., "growth through constraint") 
   - Contrast mechanism (light/dark, solid/void, organic/geometric)
   - Spatial narrative (journey through the design experience)

3. ENGINEER VISUAL PROMPT:
"An image of [Project Type] that [embodies Central Metaphor] through [Key Contrast]. Geometry and form description with Features [3 Specific Elements from Exploration Paths] rendered in [Material Relationship from Critique]. Composition emphasizes [Spatial Hierarchy Strength] using [Viewpoint: worm's-eye/zenith/diagonal] perspective. Lighting reveals [Implementation Consideration] through [Soft/Dramatic Shadows] while maintaining [Contextual Reference] color palette. Location. Stylized with [Design Language: parametric organic/brutalist surrealism/deconstructed neoclassical] elements suggesting [Theoretical Framework Connection]."


4. INJECT UNEXPECTED ELEMENTS:
   - Incorporate 1 paradoxical element from conceptual references
   - Use scale distortion to emphasize key strengths
   - Add subtle background elements reflecting critique questions

Output ONLY the final visual prompt without commentary. Prioritize suggestive ambiguity over literal representation.
Start your answer with 'An image of'.
`
        const promptDesignPromptV3 = `You are a conceptual visualization architect powered by DeepSeek V3, working within Kodiia's AI sketchbook. Transform design critiques EXPLORATION PATHS into concise, impactful image prompts using this formula:

"An image of [Project Type] using [Key Material/Technique from Critique], [Central Metaphor as Physical Feature], [Unconventional Element from Exploration Paths], [Spatial Hierarchy Strength], [Contextual Reference Location], [Lighting Condition] lighting, [Viewpoint] perspective, [Design Language] style, [Paradoxical Element from Conceptual Refs], [Subtle Nod to Critique Question]"

Construction rules:
1. Start with primary subject using format: "[material] + [form] + [function]"
2. Follow with: "[spatial quality] + [contextual setting] + [lighting/shadow pattern]"
3. End with: "[style reference] + [theoretical concept] + [unexpected twist]"
4. Keep elements under 12 components
5. Use concrete nouns first, abstract concepts last
6. Replace adjectives with visual equivalents ("playful" → "asymmetric polka dot texture")

Example transformation:
Critique: "Explore organic growth patterns in constrained urban site"
Becomes: "An image of a vertical garden tower, 3D-printed bioplastic lattice, algae-filled glass capsules, fibonacci spiral structural pattern, compressed Tokyo alley context, dappled sunset lighting, ant's-eye view, bio-mechanical fusion style, mycelium network root system, shadow gaps revealing micro-terraces"

Process ${thinkContent} and ${conceptualRefsList} to output ONLY the formatted prompt. Answer with just a prompt.`

        const finalPrompt = await chatResponse('deepseek-V3', thinkContent, promptDesignPromptV3)


        async function getImage(model = 'flux-canny-pro') {
            let imageResponseData
            if (model != 'flux-schnell') {
                imageResponseData = await imageResponse(model, finalPrompt, query.referenceImage)
            } else {
                imageResponseData = await imageResponse(model, finalPrompt)
            }
            const imageResponseDataUrl = await imageResponseData?.json()

            const imageForDb = await fetch(imageResponseDataUrl.imageUrl);
            const imageBuffer = await imageForDb.arrayBuffer();
            //console.log(imageBuffer)
            const imageBlob = new Blob([imageBuffer], { type: 'image/webp' });

            const formData = new FormData();
            formData.append("generatedImages", imageBlob, `${query.query}.webp`);
            //console.log(formData)
            const responseDb = await locals.pb.collection('nodeEditorProjects').update(query.projectId, formData)

            const record = await locals.pb.collection('nodeEditorProjects').getOne(query.projectId);
            const generatedImageFileName = record.generatedImages[record.generatedImages.length - 1];
            const generatedImageFileUrl = await locals.pb.files.getUrl(record, generatedImageFileName, {
                //'thumb': '100x250'
            });
            return generatedImageFileUrl
        }

        const response = {
            thoughtProcess: thinkContent,
            generatedText: updatedAnswer,
            conceptualRefs: await getFullConceptualRefsArray(conceptualRefsListArray),
            prompt: finalPrompt,
            imageOptionUrl: await getImage('flux-canny-pro'),
            imageOptionUrl2: await getImage('flux-depth-pro'),
            imageOptionUrl3: await getImage('flux-schnell')
        }
        //console.log(response)
        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                // 'Access-Control-Allow-Origin': 'https://kodiia.me',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        }
        )

    } catch (err) {
        console.log(err)
    }
}