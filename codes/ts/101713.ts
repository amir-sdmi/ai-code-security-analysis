

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, addDoc, where, limit, serverTimestamp, Timestamp, orderBy, QueryDocumentSnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';

// --- Environment Variable Checks (Keep as is) ---
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') { console.error("FATAL ERROR: GEMINI_API_KEY missing or placeholder."); /* Handle */ }
if (!process.env.FIREBASE_PROJECT_ID) { console.error("FATAL ERROR: FIREBASE_PROJECT_ID missing."); /* Handle */ }
// --- End Environment Variable Checks ---

// --- Firebase Initialization (Keep as is) ---
const firebaseConfig = { apiKey: process.env.FIREBASE_API_KEY, authDomain: process.env.FIREBASE_AUTH_DOMAIN, projectId: process.env.FIREBASE_PROJECT_ID, storageBucket: process.env.FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID, appId: process.env.FIREBASE_APP_ID, measurementId: process.env.FIREBASE_MEASUREMENT_ID };
let app: FirebaseApp;
if (!getApps().length) { if (firebaseConfig.apiKey && firebaseConfig.projectId) { console.log("Initializing Firebase app in ai-service..."); app = initializeApp(firebaseConfig); } else { console.error("Firebase config incomplete..."); throw new Error("Firebase config incomplete."); } } else { app = getApps()[0]; }
const db = getFirestore(app);
const THOUGHTS_COLLECTION = 'thoughts';
// --- End Firebase Initialization ---

// --- Gemini AI Initialization ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
console.log("Using Gemini Model: gemini-2.0-flash");
const generationConfig = { temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 2048 };
// *** WARNING: Using User's explicit safety settings - BLOCK_NONE is risky! ***
console.warn("AI Service Safety Settings are set to BLOCK_NONE. This disables safety filters and is not recommended for production.");
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];
// --- End Gemini AI Initialization ---

// --- Interface for ThoughtData (Keep as is) ---
export interface ThoughtData extends DocumentData {
  id?: string;
  text: string;
  author: string;
  likes: number;
  createdAt: Timestamp;
  parentThoughtId?: string;
}
// --- End Interface ---

// --- Firestore Interaction Functions ---

// addThought function (Keep as is)
export async function addThought(text: string, author: string, parentThoughtId?: string): Promise<string> {
  try {
    const thoughtsRef = collection(db, THOUGHTS_COLLECTION);
    const dataToAdd: any = { text: text, author: author, likes: 0, createdAt: serverTimestamp() };
    if (parentThoughtId) { dataToAdd.parentThoughtId = parentThoughtId; console.log(`AI Service: Adding thought as reply to ${parentThoughtId}`); }
    const docRef = await addDoc(thoughtsRef, dataToAdd);
    console.log(`AI Service: Added thought ${docRef.id} by ${author}`);
    return docRef.id;
  } catch (error) { console.error('AI Service Error adding thought:', error); throw error; }
}

// getThoughtTextsByIds function (Keep as is)
async function getThoughtTextsByIds(thoughtIds: string[]): Promise<Map<string, string>> {
    const parentTexts = new Map<string, string>();
    if (thoughtIds.length === 0) { return parentTexts; }
    console.log(`AI Service: Fetching parent text for ${thoughtIds.length} thoughts...`);
    const fetchPromises = thoughtIds.map(async (id) => {
        try {
            const docRef = doc(db, THOUGHTS_COLLECTION, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) { return { id, text: docSnap.data()?.text || '' }; }
            else { console.warn(`AI Service: Parent thought ID ${id} not found.`); return { id, text: '[Original Question Not Found]' }; }
        } catch (error) { console.error(`AI Service: Error fetching parent thought ${id}:`, error); return { id, text: '[Error Fetching Question]' }; }
    });
    const results = await Promise.all(fetchPromises);
    results.forEach(result => parentTexts.set(result.id, result.text));
    console.log(`AI Service: Fetched ${parentTexts.size} parent texts.`);
    return parentTexts;
}


/**
 * Finds relevant existing thoughts (similar questions & responses with context)
 * related to the user's current query using Gemini AI. Treats all thoughts equally for relevance checking.
 */
export async function findRelevantThoughts(userQueryText: string): Promise<{ similarQuestions: ThoughtData[], relevantResponses: ThoughtData[] }> {
    console.log("AI Service: Finding relevant thoughts for query:", userQueryText);
    try {
      const thoughtsRef = collection(db, THOUGHTS_COLLECTION);
      const q = query(thoughtsRef, orderBy('createdAt', 'desc'), limit(100));
      const thoughtsSnapshot = await getDocs(q);
  
      const existingThoughts: ThoughtData[] = thoughtsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          text: doc.data().text || '',
          author: doc.data().author || 'anonymous',
          likes: doc.data().likes || 0,
          createdAt: doc.data().createdAt || Timestamp.now(),
          parentThoughtId: doc.data().parentThoughtId || undefined,
      }));
  
      if (existingThoughts.length === 0) {
        console.log("AI Service: No existing thoughts found.");
        return { similarQuestions: [], relevantResponses: [] };
      }
  
      const responseThoughts = existingThoughts.filter(t => t.parentThoughtId);
      const parentIdsToFetch = [...new Set(responseThoughts.map(t => t.parentThoughtId).filter(id => id))];
      const parentThoughtTexts = await getThoughtTextsByIds(parentIdsToFetch as string[]);
  
      const thoughtsForPrompt = existingThoughts.map((thought, index) => {
          let entry = `${index + 1}.\n`;
          if (thought.parentThoughtId && parentThoughtTexts.has(thought.parentThoughtId)) {
              entry += `   Context: This was a response to the question "${parentThoughtTexts.get(thought.parentThoughtId)}".\n`;
              entry += `   Response Text: "${thought.text}"\n`;
          } else {
              entry += `   Thought Text: "${thought.text}"\n`;
          }
          entry += `   Author: ${thought.author}`;
          return entry;
      }).join('\n\n');
  
      // IMPROVED PROMPT: EXPLICIT SEMANTIC LINKAGE INSTRUCTIONS
      const prompt = `
  I'm giving you various user-generated thoughts. Some are standalone queries ("Thought Text"), others are responses ("Response Text") to earlier questions, showing context.
  
  Your task is to compare the user's current query to this provided list and categorically identify semantic relationships clearly:
  
  - Label as 'Q' (similar question): any entry that is essentially the same question, directly related to, conceptually overlapping, semantically similar, or clearly addresses the SAME TOPIC as the user's query (even if phrased slightly differently).
  - Label as 'R' (relevant response): any entry that provides information, insight, an answer, a viewpoint, or context directly relevant to helping answer or better understand the user's query.
  
  Use provided context explicitly when available ("Context"). When given linked contexts like "what is life" and "meaning of life," explicitly treat these as semantically related and relevant.
  
  Strictly respond using only this comma-separated format (no explanations), sorted most to least relevant. Example:
  Q:4, R:9, R:17
  
  If nothing matches, return exactly:
  0
  
  User Query: "${userQueryText}"
  
  Existing Thoughts:
  ${thoughtsForPrompt}
  `;
  
      const chatSession = model.startChat({ generationConfig, safetySettings, history: [] });
      console.log("AI Service: Sending revised semantic linkage prompt to Gemini...");
      const result = await chatSession.sendMessage(prompt);
      const responseText = result.response.text().trim();
      console.log("AI Service: Gemini response received:", responseText);
  
      const similarQuestions: ThoughtData[] = [];
      const relevantResponses: ThoughtData[] = [];
      if (responseText === '0' || !/^[QR]:\d+(,\s*[QR]:\d+)*$/.test(responseText)) {
         if(responseText !== '0') console.warn("AI Service: Invalid format from Gemini:", responseText);
         else console.log("AI Service: Gemini said no matches (0).");
      } else {
          const categorizedIndices = responseText.split(',');
          const usedIndices = new Set<number>();
          for (const item of categorizedIndices) {
              const match = item.trim().match(/^([QR]):(\d+)$/);
              if (match) {
                  const type = match[1];
                  const index = parseInt(match[2], 10) - 1;
                  if (!isNaN(index) && index >= 0 && index < existingThoughts.length && !usedIndices.has(index)) {
                      usedIndices.add(index);
                      const thought = existingThoughts[index];
                      if (type === 'Q') {
                          similarQuestions.push(thought);
                      } else { 
                          relevantResponses.push(thought);
                      }
                  } else { console.warn(`AI Service: Invalid or duplicate index ${match[2]}`); }
              } else { console.warn(`AI Service: Failed to parse item ${item}`); }
          }
      }
  
      console.log(`AI Service: Identified ${similarQuestions.length} Q(s), ${relevantResponses.length} R(s).`);
      return { similarQuestions, relevantResponses };
  
    } catch (error: any) {
      console.error('AI Service Error:', error);
      return { similarQuestions: [], relevantResponses: [] };
    }
  }