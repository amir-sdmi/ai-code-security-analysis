import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { retrieveRelevantInformation, formatRetrievedInformation } from './rag-utils';

// Enhanced first aid instruction prompt template with better injury detection guidance
const FIRST_AID_PROMPT = `You are a medical vision AI specializing in injury detection and first aid guidance. Carefully analyze this image to identify any injuries or medical conditions.

INJURY DETECTION GUIDANCE:
- Look for visible wounds, cuts, burns, swelling, bruising, deformities, or discoloration
- Pay attention to body positioning that might indicate sprains, strains, or fractures
- Note the affected body part(s): knee, ankle, shoulder, wrist, elbow, head, face, back, etc.
- Identify any visual indicators like limping, uneven weight bearing, or protective posturing
- Assess for injury-specific visual cues: redness around joints, visible bone deformity, blisters
- Look for contextual clues: sports equipment, activity setting, protective gear
- Recognize common injury mechanisms: falls, twisting motions, impacts, or overextension
- Identify any medical equipment or context clues (bandages, splints, etc.)
- Specifically assess for: cuts/lacerations, burns, sprains/strains, fractures, head injuries, bleeding
- Look for asymmetry between body parts (swelling on one side compared to the other)
- Check for signs of infection: excessive redness, yellow/green discharge, unusual skin texture
- Notice any visible skin temperature changes (redness that might indicate heat/inflammation)
- Observe environmental factors that may have contributed to the injury
- Detect subtle signs of pain in facial expressions or body posture

If you identify a specific injury or medical condition, provide detailed step-by-step first aid instructions:

1. State EXACTLY what injury or condition you've identified with high confidence 
2. Determine the severity (Mild, Moderate, Severe) based on visual assessment
3. List all visible indicators that led to your assessment
4. List step-by-step first aid procedures that should be followed
5. Include important warnings or precautions
6. Indicate when professional medical help should be sought
7. Provide estimated treatment time and recovery expectations
8. Mention any circumstances that would require immediate emergency attention

Format your response with these clear sections:
- INJURY TYPE: [specific injury identified]
- SEVERITY: [Mild/Moderate/Severe]
- VISUAL INDICATORS: [list the visual signs that informed your assessment]
- FIRST AID INSTRUCTIONS: [numbered steps]
- SEEK MEDICAL ATTENTION: [Yes/No, with specific conditions]
- EMERGENCY WARNING: [if applicable]
- TREATMENT TIME: [estimated time for first aid procedures]
- RECOVERY NOTE: [general guidance on recovery expectations]

If no clear injury is visible or you cannot confidently identify the specific condition, state clearly "Cannot confidently identify specific injury" and provide general first aid guidance instead.`;

// API Key - Replace with your actual API key or use environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY';

/**
 * Convert a File object to a base64 string
 * @param file - The file to convert
 * @returns Promise that resolves with the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extract the base64 part
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = reject;
  });
};

/**
 * Analyze an injury image using the Gemini API and RAG
 * @param imageFile - The image file to analyze
 * @param useRag - Whether to use RAG enhancement
 * @returns Promise with the analysis result
 */
export const analyzeInjuryImage = async (imageFile: File, useRag: boolean = true) => {
  try {
    // Convert the image to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    // Determine whether to use RAG based on toggle state
    let finalPrompt = FIRST_AID_PROMPT;
    let relevantInfo: any[] = [];
    
    if (useRag) {
      // RAG Enhancement: Extract potential visual keywords from the image context
      const visualContext = "Injury analysis with potential visual indicators including swelling, bruising, cuts, deformity, sports injuries, limping, redness, joint injuries";
      
      // Retrieve relevant information from knowledge base with emphasis on visual indicators
      relevantInfo = retrieveRelevantInformation(visualContext, 3); // Retrieve 3 relevant documents
      const contextInfo = formatRetrievedInformation(relevantInfo);
      
      // Add the retrieved information to the prompt
      finalPrompt = FIRST_AID_PROMPT + "\n\nRELEVANT MEDICAL KNOWLEDGE:\n" + contextInfo;
    }
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Use flash for faster responses
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      generationConfig: {
        temperature: 0.1, // Lower temperature for more deterministic responses
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048, // Ensure we get detailed responses
      }
    });

    // Create proper parts array for the content
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg'
      }
    };
    
    const textPart = {
      text: finalPrompt
    };

    // Call the model with the proper content format
    const result = await model.generateContent([imagePart, textPart]);
    const response = await result.response;
    const text = response.text();
    
    return {
      generatedText: text,
      ragInfo: useRag ? relevantInfo.map(info => ({
        title: info.title,
        similarity: info.similarity,
        content: info.content.substring(0, 200) + (info.content.length > 200 ? '...' : ''),
        visualIndicators: info.visual_indicators || []
      })) : [],
      success: true
    };
    
  } catch (error: any) {
    console.error('Error analyzing image with Gemini:', error);
    return {
      generatedText: '',
      error: error.message || 'Failed to analyze image',
      success: false
    };
  }
};

/**
 * Parse the Gemini generated text into structured first aid instructions
 * @param generatedText - The raw text generated by Gemini
 * @returns Structured first aid instructions
 */
export const parseFirstAidInstructions = (generatedText: string) => {
  // Remove asterisks from entire text first to ensure we catch all instances
  const cleanedText = generatedText.replace(/\*\*/g, "");
  
  // Extract injury type with improved pattern matching
  let injuryType = "Injury Analysis";
  
  // Handle case where no specific injury is detected
  if (cleanedText.includes("Cannot confidently identify specific injury") || 
      cleanedText.includes("No specific injury could be confidently identified")) {
    return {
      injuryType: "No Specific Injury Detected",
      severity: "medium" as "low" | "medium" | "high",
      steps: [
        {
          id: 1,
          content: "This image doesn't clearly show an identifiable injury. For accurate first aid guidance, please upload a clearer image of the affected area.",
          important: true,
        },
        {
          id: 2,
          content: "If you're experiencing pain, swelling, or discomfort, it's recommended to consult with a healthcare professional.",
          important: true,
        },
        {
          id: 3,
          content: "For general injury care, ensure the area is clean, apply appropriate compression if swelling is present, and rest the affected area.",
        }
      ],
      warning: "Unable to provide specific first aid instructions without clearly identifying the injury. Please seek professional medical advice if you're experiencing discomfort or pain.",
      note: "For better analysis, ensure the injured area is clearly visible in the image with good lighting.",
      estimatedTime: "N/A",
      bloodLevel: "none" as "none" | "minimal" | "moderate" | "severe",
      foreignObjects: false,
    };
  }
  
  // First check for the structured INJURY TYPE format
  const structuredTypeMatch = cleanedText.match(/INJURY TYPE:?\s*([^\n]+)/i);
  if (structuredTypeMatch && structuredTypeMatch[1]) {
    injuryType = structuredTypeMatch[1].trim();
  } else {
    // Try to extract injury type with expanded pattern matching
    const injuryPatterns = [
      /(?:identified|diagnosed|assessment|analyzing|analysis reveals|detected)(?:[\s:]*)((?:a|an)\s+)?([a-z\s-]+(?:burn|cut|laceration|fracture|break|sprain|strain|bleeding|wound|injury|trauma|concussion|bruise|knee|ankle|shoulder|elbow))/i,
      /(?:this appears to be|this is|this image shows|the image shows)(?:[\s:]*)((?:a|an)\s+)?([a-z\s-]+(?:burn|cut|laceration|fracture|break|sprain|strain|bleeding|wound|injury|trauma|concussion|bruise|knee|ankle|shoulder|elbow))/i,
      /(?:burn|cut|fracture|sprain|strain|bleeding|choking|poisoning|heat|stroke|heart attack|concussion|wound|injury|trauma|bruise|laceration|knee injury|ankle injury|shoulder injury|elbow injury)/i,
    ];
    
    for (const pattern of injuryPatterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        // Use the most specific match - either full group 2+3 or just group 3 if it exists
        if (match[2] && match[3]) {
          injuryType = (match[2] + " " + match[3]).trim();
        } else if (match[3]) {
          injuryType = match[3].trim();
        } else if (match[2]) {
          injuryType = match[2].trim();
        } else if (match[1]) {
          injuryType = match[1].trim();
        } else {
          injuryType = match[0].trim();
        }
        
        break;
      }
    }
    
    // Additional checks for common injury types that might not be caught above
    if (injuryType === "Injury Analysis") {
      const bodyPartInjuryPatterns = [
        /(?:knee|ankle|shoulder|elbow|wrist|foot|hand|finger|toe|back|leg|arm|head)(?:\s+)(?:injury|pain|sprain|strain|fracture)/i,
        /(?:injured|damaged|hurt)(?:\s+)(?:knee|ankle|shoulder|elbow|wrist|foot|hand|finger|toe|back|leg|arm|head)/i
      ];
      
      for (const pattern of bodyPartInjuryPatterns) {
        const match = cleanedText.match(pattern);
        if (match) {
          injuryType = match[0].trim();
          break;
        }
      }
    }
  }
  
  // Capitalize the first letter of each word
  injuryType = injuryType
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Check if we need to append "Injury" to the type
  if (!injuryType.toLowerCase().includes("injury") && 
      !injuryType.toLowerCase().includes("sprain") && 
      !injuryType.toLowerCase().includes("strain") &&
      !injuryType.toLowerCase().includes("fracture") &&
      !injuryType.toLowerCase().includes("burn") &&
      !injuryType.toLowerCase().includes("laceration")) {
    injuryType += " Injury";
  }
  
  // Extract severity with improved pattern matching
  let severity: "low" | "medium" | "high" = "medium";
  
  // First check for the structured SEVERITY format
  const structuredSeverityMatch = cleanedText.match(/SEVERITY:?\s*([^\n]+)/i);
  if (structuredSeverityMatch && structuredSeverityMatch[1]) {
    const severityText = structuredSeverityMatch[1].toLowerCase().trim();
    if (severityText.includes('mild')) severity = "low";
    else if (severityText.includes('severe')) severity = "high";
    else severity = "medium";
  } else {
    // Fall back to other patterns
    const severityPatterns = [
      /severity(?:\s*):(?:\s*)(mild|moderate|severe)/i,
      /(?:a|an)\s+(mild|moderate|severe)/i,
      /(mild|moderate|severe)(?:\s+)(?:burn|cut|fracture|sprain|strain|bleeding|injury)/i,
      /(mild|moderate|severe)/i
    ];
    
    for (const pattern of severityPatterns) {
      const match = cleanedText.match(pattern);
      if (match && match[1]) {
        const severityText = match[1].toLowerCase();
        if (severityText === 'mild') severity = "low";
        else if (severityText === 'severe') severity = "high";
        else severity = "medium";
        break;
      }
    }
  }
  
  // Extract treatment time
  let estimatedTime = "20-30 minutes";
  const timePatterns = [
    /treatment time(?:\s*):(?:\s*)([0-9]+(?:\s*-\s*[0-9]+)?\s*(?:minutes|min|hours|hrs))/i,
    /estimated time(?:\s*):(?:\s*)([0-9]+(?:\s*-\s*[0-9]+)?\s*(?:minutes|min|hours|hrs))/i,
    /take(?:s)?(?:\s+)([0-9]+(?:\s*-\s*[0-9]+)?\s*(?:minutes|min|hours|hrs))/i,
    /([0-9]+(?:\s*-\s*[0-9]+)?\s*(?:minutes|min|hours|hrs))/i
  ];
  
  for (const pattern of timePatterns) {
    const match = cleanedText.match(pattern);
    if (match && match[1]) {
      estimatedTime = match[1].trim();
      break;
    }
  }
  
  // Check for blood level indicators
  let bloodLevel: "none" | "minimal" | "moderate" | "severe" = "none";
  if (cleanedText.toLowerCase().includes("severe bleeding") || 
      cleanedText.toLowerCase().includes("heavy bleeding") ||
      cleanedText.toLowerCase().includes("profuse bleeding")) {
    bloodLevel = "severe";
  } else if (cleanedText.toLowerCase().includes("moderate bleeding") ||
             cleanedText.toLowerCase().includes("significant bleeding")) {
    bloodLevel = "moderate";
  } else if (cleanedText.toLowerCase().includes("slight bleeding") || 
             cleanedText.toLowerCase().includes("minimal bleeding") ||
             cleanedText.toLowerCase().includes("small amount of blood") ||
             cleanedText.toLowerCase().includes("minor bleeding")) {
    bloodLevel = "minimal";
  }
  
  // Check for emergency warning
  const hasEmergency = /(?:emergency|immediate medical attention|call 911|seek medical|hospital|urgent|seek professional|paramedics)/i.test(cleanedText);
  let warning = "";
  
  if (hasEmergency) {
    const warningPatterns = [
      /Warning(?:\s*):(?:\s*)([^.]+(?:\.[^.]+)*)/i,
      /Caution(?:\s*):(?:\s*)([^.]+(?:\.[^.]+)*)/i,
      /Emergency(?:\s*):(?:\s*)([^.]+(?:\.[^.]+)*)/i,
      /Seek medical attention(?:\s*):?(?:\s*)([^.]+(?:\.[^.]+)*)/i,
      /Seek medical attention([^.]+(?:\.[^.]+)*)/i,
      /(?:emergency|immediate medical attention|call 911|seek medical|hospital|urgent|seek professional|paramedics)([^.]+(?:\.[^.]+)*)/i
    ];
    
    for (const pattern of warningPatterns) {
      const match = cleanedText.match(pattern);
      if (match && match[1]) {
        warning = match[0].trim();
        break;
      }
    }
    
    if (warning === "") {
      // Default warning if specific one not found
      warning = "This injury may require immediate medical attention. Consult with a healthcare professional.";
    }
  }
  
  // Extract steps with improved pattern
  const steps = [];
  let id = 1;
  
  // Try different step extraction patterns
  const stepPatterns = [
    /(?:^|\n)(\d+)[\.\s]+([^\n]+)/gm,  // Numbered steps with period
    /(?:^|\n)Step\s+(\d+)[\s:]+([^\n]+)/gmi, // Steps prefixed with "Step"
    /(?:^|\n)([A-Z][^:]+):\s+([^\n]+)/gm, // Steps with a capitalized label and colon
  ];
  
  let foundSteps = false;
  
  for (const pattern of stepPatterns) {
    const matches = [...cleanedText.matchAll(pattern)];
    if (matches.length > 0) {
      for (const match of matches) {
        const content = match[2].trim();
        const important = /(?:immediately|urgent|critical|emergency|important|crucial)/i.test(content);
        
        // Extract duration if present in the step
        let duration = undefined;
        const durationMatch = content.match(/(\d+(?:-\d+)?\s*(?:minutes?|min|seconds?|sec|hours?|hr))/i);
        if (durationMatch) {
          duration = durationMatch[1];
        }
        
        steps.push({
          id: id++,
          content,
          important,
          duration,
          hasVideo: Math.random() > 0.5, // Simulated
          hasAudio: Math.random() > 0.5, // Simulated
        });
      }
      foundSteps = true;
      break;
    }
  }
  
  // If no steps were found with the patterns, try to extract paragraphs as steps
  if (!foundSteps) {
    const paragraphs = cleanedText.split(/\n\s*\n/);
    // Skip the first few paragraphs which likely contain injury description
    const startIndex = Math.min(2, paragraphs.length - 1);
    
    for (let i = startIndex; i < paragraphs.length && steps.length < 6; i++) {
      const paragraph = paragraphs[i].trim();
      // Skip short paragraphs and those that don't look like instructions
      if (paragraph.length < 20 || /disclaimer|warning|caution|note:/i.test(paragraph)) {
        continue;
      }
      
      const important = /(?:immediately|urgent|critical|emergency|important|crucial)/i.test(paragraph);
      
      steps.push({
        id: id++,
        content: paragraph,
        important,
        hasVideo: Math.random() > 0.5, // Simulated
        hasAudio: Math.random() > 0.5, // Simulated
      });
    }
  }
  
  // If still no steps were extracted, create some generic ones
  if (steps.length === 0) {
    steps.push({
      id: 1,
      content: "Assess the situation and ensure your safety before approaching the injured person.",
      important: true,
    });
    steps.push({
      id: 2,
      content: "Call emergency services if the injury appears serious or life-threatening.",
      important: true,
    });
    steps.push({
      id: 3,
      content: "Provide appropriate first aid based on the type of injury identified.",
    });
  }
  
  // Extract any notes
  let note = "";
  const notePatterns = [
    /Note(?:\s*):([^.]+(?:\.[^.]+)*)/i,
    /Important note(?:\s*):([^.]+(?:\.[^.]+)*)/i,
    /Additional information(?:\s*):([^.]+(?:\.[^.]+)*)/i
  ];
  
  for (const pattern of notePatterns) {
    const match = cleanedText.match(pattern);
    if (match && match[1]) {
      note = match[0].trim();
      break;
    }
  }
  
  // Check for presence of foreign objects
  const foreignObjects = /(?:foreign object|embedded|debris|glass|splinter|metal|stuck|lodged)/i.test(cleanedText);
  
  return {
    injuryType,
    severity,
    steps,
    warning,
    note,
    estimatedTime,
    bloodLevel,
    foreignObjects,
  };
}; 