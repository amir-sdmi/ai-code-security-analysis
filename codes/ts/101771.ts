import { GoogleGenAI, Type } from "@google/genai";
import {Question, scaleBounds} from "../interfaces/question"
import { Career } from "../interfaces/career";

const KEYNAME = "MYKEY";

/**
 * @function setAPIKey Sets the API key in localStorage.
 * @param {string} key The new value of the key
 */
export function setAPIKey(key: string) {
    localStorage.setItem(KEYNAME, JSON.stringify(key));
}

/**
 * @function getAPIKey Gets the API key from localStorage.
 * @returns {string} The API key, the empty string if not found
 */
export function getAPIKey(): string {
    return JSON.parse(localStorage.getItem(KEYNAME) ?? '""');
}

/**
 * @function getGoogleGenAI Gets the object for interfacing with Gemini.
 * @returns {GoogleGenAI} The object for interfacing with Gemini
 */
function getGoogleGenAI(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: getAPIKey() });
}

/**
 * @function askQuestion Gets an answer from Gemini given a user-asked question (small a answer, small q question).
 * @param {string} question The question asked by the user
 * @returns {Promise<string | undefined>} The promise to the answer Gemini generated based on the given question
 */
export async function askQuestion(question: string): Promise<string | undefined> {
    const ai = getGoogleGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: question
    });
    return response.text;
}

/**
 * @function generateResults Gets a list of careers from Gemini, based on user responses
 * @param {Question[]} data The answered questions from the user
 * @returns {Promise<Career[]>} The promise to the careers
 */
export async function generateResults(data: Question[]): Promise<Career[]> {
    const ai = getGoogleGenAI();
    const quizAnswers = parseAnswers(data);
    const prompt = (
`Could you recommend me 3 jobs I might like based on the following carrer quiz questions and answers:

${quizAnswers}

as a json with each job in the following format:
{
    jobTitle: string,
    jobDescription: string,
    reasonForRecommendation: string,
    avgSalary: string,
    educationLevel: string
}
where reasonForRecommendation is why the job is suited for me based on my quiz answers`
    );
    const response = await ai.models.generateContent({
        model:"gemini-2.0-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        jobTitle: {type: Type.STRING},
                        jobDescription: {type: Type.STRING},
                        reasonForRecommendation: {
                            type: Type.STRING 
                        },
                        avgSalary: {type: Type.STRING},
                        educationLevel: {type: Type.STRING}
                    },
                    propertyOrdering: ["jobTitle", "jobDescription", "reasonForRecommendation", "avgSalary","educationLevel"]
                }
            }
        }
    });
    console.log(response.text);
    return parseResults(response.text);
}

/**
 * @function generateQuestions Takes a career field and returns a list of Question objects based on that field
 * @param {string} careerField The career field to base the questions off of
 * @returns {Promise<Question[]>} The promise to the array of Question objects
 */
export async function generateQuestions(careerField: string): Promise<Question[]> {
    const ai = getGoogleGenAI();
    const prompt = (
`Could you generate 10 questions, 6 scaled and 4 text, dispersed randomly, that would help me find a career in ${careerField},
using this object format for Likert scale questions:
{
    question: string,
    type: "scaled",
    answer: undefined,
    scale: [string, string]
}
and this JSON scheme for text answered questions:
{
    question: string,
    type: "text",
    answer: undefined,
    scale:[]
}
returning an array of these questions.`
    );
    const response = await ai.models.generateContent({
        model:"gemini-2.0-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        type: {
                            type: Type.STRING,
                            pattern: "(scaled)|(text)",
                        },
                        scale: {
                            type: Type.ARRAY,
                            description: "empty if text question, that is, if \"type\" is \"text\"",
                            items: {
                                type: Type.STRING
                            },
                            maxItems: "2"
                        }
                    },
                    propertyOrdering: ["question", "type", "scale"]
                }
            }
        }
    });
    console.log(response.text);
    return parseQuestions(response.text);
}

/**
 * @function parseQuestions takes a stringified array of json objects generated by Gemini and turns them into Questions
 * @param {string | undefined} questionsString a string in JSON format, from Gemini
 * @returns {Question[]} an array of Questions.
 */
function parseQuestions(questionsString: string | undefined): Question[] {
    const thingToParse = questionsString ?? "[]";
    try{
        const questions: Question[] = JSON.parse(thingToParse);
        console.log(questions);
        return [...questions];
    } catch (error){
        console.log("Could not parse JSON ", error, thingToParse);
    }
    return [];
}


const [low, high] = [scaleBounds.min, scaleBounds.max];
const mid = (low + high) / 2;
function stringifyAnswer(question: Question): string {
    return question.type === "scaled" ? 
        `I answered "${question.answer}" on a scale of ${low} to ${high}, where ${low} is "${question.scale[0]}", ${high} is "${question.scale[1]}" and ${mid} would express indifference`
    :   `I answered "${question.answer}"`;
}

function stringifyQuestion(question: Question, index: number): string {
    return `To question ${index+1}, "${question.question}":\n\t${stringifyAnswer(question)}.`;
}

function parseAnswers(questions: Question[]): string {
    const stringifiedQuestions = questions.map(stringifyQuestion);
    const answers = stringifiedQuestions.join("\n\n");
    return answers;
}

function parseResults(resultString: string | undefined): Career[] {
    const thingToParse = resultString ?? "[]";
    try {
        const careers: Career[] = JSON.parse(thingToParse);
        console.log(careers);
        return [...careers];
    } catch (error) {
        console.log("Could not parse results JSON ", error, thingToParse);
    }
    return [];
}
