// backend/utils/gemini.js
import axios from "axios";

export const generateQuestions = async({ subject, difficulty, type, questionNumber }) => {
    // Validate input types
    const questionTypes = (Array.isArray(type) ? type : [type]).map(t => {
        // Convert common variants to standardized form
        if (t.toLowerCase().includes('short') && t.toLowerCase().includes('answer')) return 'Short Answer';
        if (t.toLowerCase().includes('long') && t.toLowerCase().includes('answer')) return 'Long Answer';
        if (t.toLowerCase().includes('multiple') || t.toLowerCase() === 'mcq') return 'Multiple Choice';
        if (t.toLowerCase().includes('true') || t.toLowerCase().includes('false')) return 'True/False';
        if (t.toLowerCase().includes('fill') || t.toLowerCase().includes('blank')) return 'Fill in the Blanks';
        return t; // Return original if no match
    });
    const validTypes = ['Multiple Choice', 'Short Answer', 'Long Answer', 'True/False', 'Fill in the Blanks'];

    // Check for invalid types
    const invalidTypes = questionTypes.filter(t => !validTypes.includes(t));
    if (invalidTypes.length > 0) {
        throw new Error(`Invalid question type(s): ${invalidTypes.join(', ')}. Valid types are: ${validTypes.join(', ')}`);
    }

    // Generate type-specific instructions
    const typeInstructions = questionTypes.map(t => {
        switch (t) {
            case 'Multiple Choice':
                return `- Provide 4 options (a-d) with one correct answer marked with "Answer: [letter]")`;
            case 'True/False':
                return `- Provide statement followed by "Answer: True" or "Answer: False"`;
            case 'Fill in the Blanks':
                return `- Provide sentence with blank marked as _____ followed by "Answer: [correct word/phrase]"`;
            case 'Short Answer':
                return `- Provide concise question requiring a brief answer (1-2 sentences) followed by "Answer: [correct answer]"`;
            case 'Long Answer':
                return `- Provide comprehensive question requiring detailed explanation followed by "Answer: [correct answer]"`;
            default:
                return `- Provide clear question followed by "Answer: [correct answer]"`;
        }
    }).join('\n');

    const prompt = `
    Generate exactly ${questionNumber} ${difficulty} difficulty questions about ${subject}.
    Include these question types: ${questionTypes.join(', ')}.

    FORMATTING RULES:
    1. Each question must begin with "Question [number]:"
    2. Follow the specific format for each question type:
    ${typeInstructions}
    3. Separate each question with "---"
    4. Make questions clear and test important ${subject} concepts
    5. For multiple choice, make incorrect options plausible

    EXAMPLES:
    ${generateExamples(questionTypes)}
    `;

    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.Gemini_api}`, {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        return extractGeneratedText(res);
    } catch (error) {
        console.error("Error generating questions:", error);
        throw new Error("Failed to generate questions");
    }
};

// Helper function to generate type-specific examples
function generateExamples(types) {
    return types.map(t => {
        switch (t) {
            case 'Multiple Choice':
                return `Question 1:
What is the primary function of an HTTP server?
a) Render graphics
b) Store databases
c) Handle client requests
d) Compile code
Answer: c)
---`;
            case 'True/False':
                return `Question 2:
JavaScript is a statically typed language.
Answer: False
---`;
            case 'Fill in the Blanks':
                return `Question 3:
The _____ protocol is used for secure web communication.
Answer: HTTPS
---`;
            case 'Short Answer':
                return `Question 4:
What does CSS stand for?
Answer: Cascading Style Sheets
---`;
            case 'Long Answer':
                return `Question 5:
                    Explain the concept of object-oriented programming.
                    Answer: OOP is a programming paradigm based on objects containing data and methods. It focuses on encapsulation, inheritance, and polymorphism to create modular and reusable code.
                    ---`;
            default:
                return `Question 6:
What is the capital of France?
Answer: Paris
---`;
        }
    }).join('\n');
}

// Helper function to extract generated text
function extractGeneratedText(response) {
    if (response &&
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0] &&
        response.data.candidates[0].content.parts[0].text) {
        return response.data.candidates[0].content.parts[0].text;
    }
    throw new Error("No content generated by Gemini");
}