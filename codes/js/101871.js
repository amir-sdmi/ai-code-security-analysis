const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create exam (Teacher only)
router.post('/', auth, async (req, res) => {
  try {
    console.log('Exam creation request received:', req.body);
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate required fields
    const requiredFields = ['title', 'subjectCode', 'date', 'duration', 'semester', 'branch', 'questions', 'totalMarks', 'passingMarks'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validate questions
    if (!Array.isArray(req.body.questions) || req.body.questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    // Create exam
    const exam = new Exam({
      ...req.body,
      createdBy: req.user._id
    });

    console.log('Attempting to save exam:', { title: exam.title, subjectCode: exam.subjectCode });
    await exam.save();
    console.log('Exam saved successfully');

    res.status(201).json(exam);
  } catch (error) {
    console.error('Exam creation error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all exams (filtered by semester and branch for students)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query = {
        semester: req.user.semester,
        branch: req.user.branch
      };
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name userId')
      .sort({ date: -1 });

    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get exam by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Validate ID format
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        message: 'Invalid exam ID format',
        error: 'The provided exam ID is not valid'
      });
    }

    console.log('Fetching exam with ID:', req.params.id);
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name userId');

    if (!exam) {
      return res.status(404).json({ 
        message: 'Exam not found',
        error: 'No exam found with the provided ID'
      });
    }

    // Check if student is eligible to take this exam
    if (req.user.role === 'student') {
      if (exam.semester !== req.user.semester || exam.branch !== req.user.branch) {
        return res.status(403).json({ 
          message: 'Access denied',
          error: 'You are not eligible to take this exam'
        });
      }
    }

    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Submit exam answers
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if student has already submitted
    const existingResult = await Result.findOne({
      exam: exam._id,
      student: req.user._id
    });

    if (existingResult) {
      return res.status(400).json({ message: 'You have already submitted this exam' });
    }

    const { answers } = req.body;
    let totalMarks = 0;
    let marksObtained = 0;
    const evaluatedAnswers = [];

    for (const answer of answers) {
      const question = exam.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) continue;

      totalMarks += question.maxMarks;
      let answerMarks = 0;
      let feedback = '';

      if (question.type === 'mcq') {
        // For MCQ, directly compare with correct answer
        if (answer.answer === question.correctAnswer) {
          answerMarks = question.maxMarks;
          feedback = 'Correct answer';
        } else {
          feedback = 'Incorrect answer';
        }
      } else {
        // For descriptive questions, use Gemini for evaluation
        try {
          const prompt = `Evaluate this answer for the following question:
            Question: ${question.question}
            Context: ${question.evaluationContext}
            Student's Answer: ${answer.answer}
            Maximum Marks: ${question.maxMarks}
            
            Evaluate the answer and provide a JSON response in this format:
            {
              "marks": number (between 0 and maxMarks),
              "feedback": "string explaining the evaluation"
            }`;

          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          
          // Clean the response text to remove markdown code blocks if present
          const cleanResponse = response.text().replace(/```json\n?|\n?```/g, '').trim();
          console.log('Cleaned Gemini response:', cleanResponse);
          
          const evaluation = JSON.parse(cleanResponse);
          console.log('Parsed evaluation:', evaluation);
          
          answerMarks = evaluation.marks;
          feedback = evaluation.feedback;
        } catch (error) {
          console.error('Error evaluating answer:', error);
          feedback = 'Error evaluating answer';
          answerMarks = 0;
        }
      }

      marksObtained += answerMarks;
      evaluatedAnswers.push({
        questionId: answer.questionId,
        answer: answer.answer,
        marksObtained: answerMarks,
        feedback
      });
    }

    const percentage = (marksObtained / totalMarks) * 100;
    const status = percentage >= exam.passingMarks ? 'pass' : 'fail';

    // Create result
    const result = new Result({
      exam: exam._id,
      student: req.user._id,
      totalMarks,
      marksObtained,
      percentage,
      status,
      answers: evaluatedAnswers,
      evaluatedBy: req.user._id
    });

    await result.save();

    res.json(result);
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 