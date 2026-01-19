import { db } from "../connect.js";
import jwt from 'jsonwebtoken';
import { generateQuestionsForSkills } from "../utils/generateQuestionsForSkills.js"; 
import {analyzeAnswerWithChatGPT} from "../utils/analyzeAnswerWithChatGPT.js"
import { analyzeBinaryAnswerWithChatGPT } from '../utils/analyzeBinaryAnswerWithChatGPT.js';



export const fetchSkills = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json('Not logged in');

    jwt.verify(token, 'secretkey', { maxAge: '10h' }, async (err, userInfo) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json('Token is not valid');
      }

      const userId = userInfo.id;

      const fetchSkillsQuery = 'SELECT skill_name FROM skills WHERE user_id_num = ?';
      db.query(fetchSkillsQuery, [userId], async (err, result) => {
        if (err) {
          console.error('Error fetching skills:', err);
          return res.status(500).json('Internal server error');
        }
        const skills = result.map((row) => row.skill_name);
        console.log(skills)

        try {
          const questions = await generateQuestionsForSkills(skills);
          console.log("Generated questions:", questions);

          // Insert questions into the Conversation table
          for (const { skill, questions: skillQuestions } of questions) {
            for (const question of skillQuestions.questions) {
              const insertQuery = 'INSERT INTO conversations (user_id_numb, skill_name, question) VALUES (?, ?, ?)';
              db.query(insertQuery, [userId, skill, question], (err, result) => {
                if (err) {
                  console.error('Error inserting question:', err);
                  return res.status(500).json('Internal server error');
                }
                console.log('Question inserted successfully:', question);
              });
            }
          }


          return res.status(200).json({ questions });
        } catch (error) {
          console.error("Error generating questions:", error);
          return res.status(500).json('Internal server error');
        }
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json('Internal server error');
  }
};





export const fetchSkillsWithScores = async (req, res) => {
    try {

      const token = req.cookies.accessToken;
      if (!token) return res.status(401).json('Not logged in');
  
      jwt.verify(token, 'secretkey', { maxAge: '10h' }, async (err, userInfo) => {
        if (err) {
          console.error('JWT verification error:', err);
          return res.status(403).json('Token is not valid');
        }
  
        const userId = userInfo.id;
  
        // Fetch skills with scores from the skills table for the current user
        const fetchSkillsQuery = 'SELECT skill_name, score FROM skills WHERE user_id_num = ?';
        db.query(fetchSkillsQuery, [userId], (err, result) => {
          if (err) {
            console.error('Error fetching skills:', err);
            return res.status(500).json('Internal server error');
          }
  
          // Map result to an array of objects containing skill name and score
          const skillsWithScores = result.map(row => ({
            skill_name: row.skill_name,
            score: row.score
          }));
  
          return res.status(200).json({ skillsWithScores });
        });
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json('Internal server error');
    }
};




export const fetchQuestions = async (req, res) => {
    try {
      const token = req.cookies.accessToken;
      if (!token) return res.status(401).json('Not logged in');
  
      jwt.verify(token, 'secretkey', { maxAge: '10h' }, async (err, userInfo) => {
        if (err) {
          console.error('JWT verification error:', err);
          return res.status(403).json('Token is not valid');
        }
  
        const userId = userInfo.id;
  
        // Fetch questions from the conversations table for the current user
        const fetchQuestionsQuery = 'SELECT question FROM conversations WHERE user_id_numb = ?';
        db.query(fetchQuestionsQuery, [userId], (err, result) => {
          if (err) {
            console.error('Error fetching questions:', err);
            return res.status(500).json('Internal server error');
          }
  
          // Extract questions from the result
          const questions = result.map(row => row.question);
          console.log(questions)
          // Return the fetched questions
          return res.status(200).json({ questions });
        });
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json('Internal server error');
    }
};


export const analyzeAnswer = async (req, res) => {
  try {
    // Check if the access token exists in the cookies
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json('Not logged in');

    // Verify the access token
    jwt.verify(token, 'secretkey', { maxAge: '10h' }, async (err, userInfo) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json('Token is not valid');
      }

      // Retrieve user ID from the decoded token
      const userId = userInfo.id;

      // Retrieve answer and question from request body
      const { answer, question } = req.body;

      // Now you have the user's answer and the specific question
      // console.log("User's answer:", answer);
      // console.log("Question under consideration:", question);

      const feedback = await analyzeAnswerWithChatGPT(answer, question);
      console.log("Feedback from ChatGPT:", feedback);
      // Send response back to the client
      return res.status(200).json({ feedback});
    });
  } catch (error) {
    console.error("Error analyzing answer:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// skillsFetcher.js


export const analyzeBinaryAnswer = async (req, res) => {
  try {
    // Check if the access token exists in the cookies
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json('Not logged in');

    // Verify the access token
    jwt.verify(token, 'secretkey', { maxAge: '10h' }, async (err, userInfo) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json('Token is not valid');
      }

      // Retrieve user ID from the decoded token
      const userId = userInfo.id;

      // Retrieve answer and question from request body
      const { answer, question } = req.body;

      // Analyze the answer using ChatGPT and get the result
      const { result } = await analyzeBinaryAnswerWithChatGPT(answer, question);
      
      // Send response back to the client with the result
      return res.status(200).json({ result });
    });
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


  