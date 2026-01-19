const firestore = require('../firebase/firestore');
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fileType = require('file-type');

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

const sendCv = async (req, res) => {
    try {
        const userId = req.auth.id;
        const userDocRef = firestore.collection('user').doc(userId);
        const userDoc = await userDocRef.get();
        const pdfFile = req.file;

        if (!userDoc.exists) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: 'User not found'
                },
            });
        }

        if (!pdfFile || !pdfFile.path) {
            console.log(pdfFile);
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: 'PDF file is required'
                },
            });
        }

        const fileBuffer = fs.readFileSync(pdfFile.path);
        const fileDetectionType = await fileType.fromBuffer(fileBuffer);
        console.log("Detected MIME Type", fileDetectionType);

        // Fix MIME type checking
        if (!fileDetectionType || fileDetectionType.mime !== "application/pdf") {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: 'Only PDF files are accepted.'
                },
            });
        }

        const pdfData = await pdfParse(fileBuffer);
        const data = userDoc.data();
        const interest = data.identity?.skill || [];

        console.log("Skills from Firestore (identity.skill):", interest);

        const prompt = `
The following document is a CV. Analyze the content of the CV and evaluate how well it matches the following list of skills: ${interest.join(", ")}.

⚠️ Important:
- Only use the skills provided in the list.
- Do not add any skills that are not in the list.
- Provide a match percentage (from 0 to 100).
- The output format MUST match exactly the following structure (keep the JSON keys and structure):

{
  "code": 200,
  "message": "cv detected successfully",
  "data": {
    "skills": {
      "UI": 70,
      "UX": 60,
      "Design": 50
    }
  }
}

Do not include any additional explanations or outputs besides the JSON above.`;

        const combineInput = `${prompt}\n\nExtracted PDF Content:\n${pdfData.text}`;

        const result = await model.generateContent([combineInput]);

        let generateText = result.response.text();
        console.log("Generated Text:", generateText);

        if (generateText.includes("this is not a CV or Resume!")) {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: "This is not a CV or Resume."
                }
            });
        }

        generateText = generateText.replace(/```json|```/g, "").trim();

        const jsonMatch = generateText.match(/^\{.*\}$/s);

        if (!jsonMatch) {
            console.error("Invalid JSON format detected.");
            console.log("Generated Text (raw):", generateText);
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: 'Invalid output format from model.'
                }
            });
        }

        const jsonOutput = jsonMatch[0];

        let parsedOutput;
        try {
            parsedOutput = JSON.parse(jsonOutput);
            const filteredSkills = {};
            interest.forEach(skill => {
                filteredSkills[skill] = parsedOutput.data.skills[skill] || 0;
            });
            parsedOutput.data.skills = filteredSkills;
        } catch (error) {
            console.error("Error parsing generated text as JSON:", error);
            console.log("Generated Text (raw):", generateText);
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: "Invalid output format from model."
                }
            });
        }

        try {
            const historyScanRef = userDocRef.collection("HistoryScan");
            await historyScanRef.add({
                skills: parsedOutput.data.skills,
                createAt: new Date()
            });
        } catch (firestoreError) {
            console.error("Error saving to Firestore:", firestoreError);
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: "Failed to save analysis to database."
                }
            });
        }

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: parsedOutput.data
        });
    } catch (error) {
        console.error("Error processing PDF:", error);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: "Failed to process PDF."
            }
        });
    } finally {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
    }
};

const getSkillDetail = async (req, res) => {
    try {
        const userId = req.auth.id;
        const skillChoice = req.body.skill_choice;

        if (!skillChoice) {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: "Skill choice is required"
                }
            });
        }

        const userDocRef = firestore.collection('user').doc(userId);
        const historyScanRef = userDocRef.collection("HistoryScan");

        const snapshot = await historyScanRef.orderBy("createAt", "desc").limit(1).get();
        if (snapshot.empty) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: "No scan history found"
                }
            });
        }

        const latestDoc = snapshot.docs[0];
        const skills = latestDoc.data().skills || {};

        const level = skills[skillChoice];

        if (level === undefined) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: `Skill '${skillChoice}' not found in latest history`
                }
            });
        }

        // Use Gemini to describe the skill
        const prompt = `
Write a brief description of the skill "${skillChoice}" based on the user's high level of mastery. Use second-person perspective, as if you're giving feedback directly to the user. Avoid using the words "level", numbers, or scores in the description. Use "you" instead of "I". Focus on how this skill reflects the user's professional strengths and career potential. Write in 2–4 concise, relevant sentences. Avoid exaggerated language, and use professional but friendly English.

Example:
"With a solid foundation in server-side programming and database management, you excel at building efficient and scalable applications. Your problem-solving abilities and attention to detail make you highly suited for backend development."`;

        const result = await model.generateContent([prompt]);
        let description = result.response.text().trim();
        description = description.replace(/^```(?:\w+)?|```$/g, '').trim();

        try {
            const SkillChoice = userDocRef.collection("SkillChoice");
            await SkillChoice.add({
                skill_choice: skillChoice,
                level: level,
                description: description,
                createAt: new Date()
            });
        } catch(firestoreError){
            console.error("Error saving to Firestore:", firestoreError);
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: "Failed to save Skill Choice to database."
                }
            });
        }

        return res.status(200).json({
            code: 200,
            data: {
                skill_choice: skillChoice,
                level: level,
                description: description
            }
        });

    } catch (error) {
        console.error("Error retrieving skill detail:", error);
        return res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: "Internal server error"
            }
        });
    }
};

module.exports = { sendCv, getSkillDetail };