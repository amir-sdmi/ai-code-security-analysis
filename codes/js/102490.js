const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Contest = require('../models/Contest');
const { geminiChat, geminiGenerateJSON } = require('../utils/gemini');

const router = express.Router();

// @route   GET /api/ai/recommendations
// @desc    Get AI-powered problem recommendations
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { limit = 10, difficulty, topics } = req.query;
    const user = await User.findById(req.user._id)
      .populate('solvedProblems.problemId', 'title difficulty topics');
    const solvedProblemIds = user.solvedProblems.map(sp => sp.problemId._id);
    const userStats = user.getProgress();
    const query = { isActive: true };
    if (difficulty && difficulty !== 'mixed') query.difficulty = difficulty;
    if (topics && topics.length > 0) query.topics = { $in: topics.split(',') };
    if (solvedProblemIds.length > 0) query._id = { $nin: solvedProblemIds };
    const problems = await Problem.find(query)
      .select('title slug difficulty topics stats aiContent')
      .limit(parseInt(limit) * 2);
    // Use Gemini to score and recommend
    const recommendations = await Promise.all(
      problems.map(async (problem) => {
        const prompt = `Given a user with level ${user.level}, solved ${userStats.totalSolved} problems, and a problem titled "${problem.title}" (difficulty: ${problem.difficulty}, topics: ${problem.topics.join(', ')}), rate the suitability of this problem for the user on a scale of 0-100. Return only the number.`;
        let score = 50;
        try {
          const geminiResp = await geminiChat(prompt);
          score = parseInt(geminiResp.match(/\d+/)?.[0] || '50');
        } catch {}
        return { problem, score };
      })
    );
    recommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = recommendations
      .slice(0, parseInt(limit))
      .map(rec => ({
        ...rec.problem.toObject(),
        recommendationScore: rec.score,
        reason: rec.score >= 80 ? 'Perfect match for your level!' : rec.score >= 60 ? 'Great challenge to improve your skills' : 'Good practice problem for your level'
      }));
    res.json({ recommendations: topRecommendations, userStats, filters: { difficulty, topics } });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// @route   POST /api/ai/chat
// @desc    Send a message to AI assistant
// @access  Private
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const prompt = `You are DSA Genie, an AI assistant for Data Structures and Algorithms. User message: ${message}\nProvide a helpful, educational response.`;
    const aiResponse = await geminiChat(prompt);
    res.json({ reply: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// @route   POST /api/ai/hint
// @desc    Get AI-generated hint for a problem
// @access  Private
router.post('/hint', auth, async (req, res) => {
  try {
    const { problemId, hintLevel = 1, userCode } = req.body;
    if (!problemId) return res.status(400).json({ error: 'Problem ID is required' });
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    const prompt = `Generate a level ${hintLevel} hint for this coding problem:\nTitle: ${problem.title}\nDescription: ${problem.description}\nDifficulty: ${problem.difficulty}\nTopics: ${problem.topics.join(', ')}\n${userCode ? `User's code: ${userCode}` : ''}`;
    const hint = await geminiChat(prompt);
    res.json({ hint, hintLevel });
  } catch (error) {
    console.error('AI hint error:', error);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

// @route   POST /api/ai/explanation
// @desc    Get AI-generated explanation for a problem
// @access  Private
router.post('/explanation', auth, async (req, res) => {
  try {
    const { problemId, userSolution, approach } = req.body;
    if (!problemId) return res.status(400).json({ error: 'Problem ID is required' });
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    const prompt = `Provide a detailed explanation for this coding problem:\nTitle: ${problem.title}\nDescription: ${problem.description}\nDifficulty: ${problem.difficulty}\nTopics: ${problem.topics.join(', ')}\n${userSolution ? `User's solution: ${userSolution}` : ''}\n${approach ? `User's approach: ${approach}` : ''}`;
    const explanation = await geminiChat(prompt);
    res.json({ explanation, problem: { title: problem.title, difficulty: problem.difficulty, topics: problem.topics } });
  } catch (error) {
    console.error('AI explanation error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// @route   POST /api/ai/learning-path
// @desc    Generate personalized learning path
// @access  Private
router.post('/learning-path', auth, async (req, res) => {
  try {
    const { targetTopics, difficulty, duration } = req.body;
    const user = await User.findById(req.user._id)
      .populate('solvedProblems.problemId', 'title difficulty topics');
    const prompt = `Create a personalized learning path for a user with level ${user.level}, solved problems: ${user.stats.totalSolved}, target topics: ${targetTopics.join(', ')}, target difficulty: ${difficulty}, duration: ${duration} weeks.`;
    const learningPath = await geminiChat(prompt);
    res.json({ learningPath, userProgress: user.getProgress() });
  } catch (error) {
    console.error('AI learning path error:', error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

// @route   POST /api/ai/analyze-solution
// @desc    Analyze user's solution and provide feedback
// @access  Private
router.post('/analyze-solution', auth, async (req, res) => {
  try {
    const { problemId, solution, language } = req.body;
    if (!problemId || !solution) return res.status(400).json({ error: 'Problem ID and solution are required' });
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    const prompt = `Analyze this coding solution:\nProblem: ${problem.title}\nLanguage: ${language}\nSolution: ${solution}\nProvide analysis on correctness, edge cases, time/space complexity, code quality, improvements, and best practices.`;
    const analysis = await geminiChat(prompt);
    res.json({ analysis, problem: { title: problem.title, difficulty: problem.difficulty } });
  } catch (error) {
    console.error('AI solution analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze solution' });
  }
});

// @route   POST /api/ai/generate-problem
// @desc    Generate a new DSA problem using Gemini and save it to database
// @access  Private (Admin only)
router.post('/generate-problem', auth, async (req, res) => {
  try {
    const { topic = 'arrays', difficulty = 'easy', description = '' } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const prompt = `Generate a complete DSA problem about ${topic} with ${difficulty} difficulty level. ${description ? `Additional context: ${description}` : ''} Make it realistic, educational, and well-structured. Include proper examples and constraints.

IMPORTANT RULES:
- Use only valid topic values: arrays, strings, linked-lists, trees, graphs, dynamic-programming, greedy, backtracking, binary-search, two-pointers, sliding-window, stack, queue, heap, trie, union-find, bit-manipulation, math, geometry
- Use only valid difficulty values: easy, medium, hard
- Make sure topics array contains only valid topic values (lowercase)
- Test cases should be objects with input, output, and isHidden fields
- Do not include prerequisites or nextProblems fields
- Create a unique and creative title that doesn't exist in common DSA problems (avoid titles like "Two Sum", "Reverse String", etc.)
- Make the title descriptive and engaging
- All string values should be properly escaped

Return the response as a valid JSON object with this structure:
{
  "title": "Unique Problem Title",
  "description": "Detailed problem description",
  "difficulty": "easy|medium|hard",
  "topics": ["valid_topic"],
  "constraints": ["constraint1", "constraint2"],
  "examples": [{"input": "example input", "output": "example output", "explanation": "explanation"}],
  "testCases": [{"input": "test input", "output": "test output", "isHidden": false}],
  "solutionTemplate": {"javascript": "code", "python": "code", "java": "code", "cpp": "code"}
}`;

    const response = await geminiChat(prompt);
    
    // Try to extract JSON from the response
    let cleanedResponse = response.trim();
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    let problemData;
    try {
      problemData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', response);
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }
    
    // Validate required fields
    if (!problemData.title || !problemData.description) {
      throw new Error('Generated problem is missing required fields');
    }

    // Clean and validate the data
    const cleanProblemData = {
      title: problemData.title.trim(),
      description: problemData.description.trim(),
      difficulty: ['easy', 'medium', 'hard'].includes(problemData.difficulty?.toLowerCase()) 
        ? problemData.difficulty.toLowerCase() 
        : difficulty,
      topics: [],
      constraints: [],
      examples: [],
      testCases: [],
      solutionTemplate: {
        javascript: `function solve(input) {\n  // Your code here\n}`,
        python: `def solve(input):\n    # Your code here`,
        java: `public class Solution {\n    public static String solve(String input) {\n        // Your code here\n    }\n}`,
        cpp: `string solve(string input) {\n    // Your code here\n}`
      },
      aiContent: {
        hints: [],
        explanation: {
          approach: '',
          timeComplexity: '',
          spaceComplexity: '',
          detailedSolution: ''
        },
        learningObjectives: [],
        commonMistakes: [],
        tips: []
      },
      stats: {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
        averageTimeToSolve: 0,
        difficultyRating: 0,
        ratingCount: 0
      },
      source: 'DSA Genie AI',
      isPremium: false,
      isActive: true,
      tags: []
    };

    // Validate and clean topics
    const validTopics = ['arrays', 'strings', 'linked-lists', 'trees', 'graphs', 'dynamic-programming', 'greedy', 'backtracking', 'binary-search', 'two-pointers', 'sliding-window', 'stack', 'queue', 'heap', 'trie', 'union-find', 'bit-manipulation', 'math', 'geometry'];
    if (Array.isArray(problemData.topics)) {
      cleanProblemData.topics = problemData.topics
        .map(t => t.toLowerCase().trim())
        .filter(t => validTopics.includes(t));
    }
    if (cleanProblemData.topics.length === 0) {
      cleanProblemData.topics = [topic];
    }
    cleanProblemData.tags = [...cleanProblemData.topics];

    // Clean constraints
    if (Array.isArray(problemData.constraints)) {
      cleanProblemData.constraints = problemData.constraints
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    // Clean examples
    if (Array.isArray(problemData.examples)) {
      cleanProblemData.examples = problemData.examples
        .filter(ex => ex && typeof ex === 'object')
        .map(ex => ({
          input: (ex.input || '').trim(),
          output: (ex.output || '').trim(),
          explanation: (ex.explanation || '').trim()
        }))
        .filter(ex => ex.input && ex.output);
    }

    // Clean test cases
    if (Array.isArray(problemData.testCases)) {
      cleanProblemData.testCases = problemData.testCases
        .map(tc => {
          if (typeof tc === 'string') {
            return { input: String(tc).trim(), output: '', isHidden: false };
          }
          if (tc && typeof tc === 'object') {
            return {
              input: String(tc.input || '').trim(),
              output: String(tc.output || '').trim(),
              isHidden: Boolean(tc.isHidden)
            };
          }
          return null;
        })
        .filter(tc => tc && tc.input);
    }

    // Clean solution template
    if (problemData.solutionTemplate && typeof problemData.solutionTemplate === 'object') {
      if (problemData.solutionTemplate.javascript) {
        cleanProblemData.solutionTemplate.javascript = problemData.solutionTemplate.javascript;
      }
      if (problemData.solutionTemplate.python) {
        cleanProblemData.solutionTemplate.python = problemData.solutionTemplate.python;
      }
      if (problemData.solutionTemplate.java) {
        cleanProblemData.solutionTemplate.java = problemData.solutionTemplate.java;
      }
      if (problemData.solutionTemplate.cpp) {
        cleanProblemData.solutionTemplate.cpp = problemData.solutionTemplate.cpp;
      }
    }

    // Create unique slug
    const baseSlug = cleanProblemData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug exists and make it unique
    let slug = baseSlug;
    let counter = 1;
    while (await Problem.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    cleanProblemData.slug = slug;

    // Check if title exists and make it unique
    let title = cleanProblemData.title;
    counter = 1;
    while (await Problem.findOne({ title })) {
      title = `${cleanProblemData.title} ${counter}`;
      counter++;
    }
    cleanProblemData.title = title;

    const problem = new Problem(cleanProblemData);
    await problem.save();

    res.json({
      message: 'Problem generated and saved successfully',
      problem: {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        topics: problem.topics
      }
    });
  } catch (error) {
    console.error('AI problem generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate problem',
      details: error.message 
    });
  }
});

// @route   POST /api/ai/generate-contest
// @desc    Generate a new DSA contest using Gemini and save it to database
// @access  Private (Admin only)
router.post('/generate-contest', auth, async (req, res) => {
  try {
    const { topic = 'arrays', difficulty = 'easy', numProblems = 3, type = 'special', duration = 60, description = '' } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Define the contest schema
    const contestSchema = {
      title: "string",
      slug: "string",
      description: "string", 
      type: "daily|weekly|monthly|special|adaptive",
      difficulty: "easy|medium|hard|mixed",
      topics: ["string"],
      duration: "number",
      startTime: "string",
      endTime: "string",
      problems: [{
        title: "string",
        slug: "string",
        description: "string",
        difficulty: "easy|medium|hard",
        topics: ["string"],
        constraints: ["string"],
        examples: [{
          input: "string",
          output: "string",
          explanation: "string"
        }],
        testCases: ["string"],
        solutionTemplate: {
          javascript: "string",
          python: "string",
          java: "string", 
          cpp: "string"
        },
        points: "number"
      }],
      isActive: true,
      isPremium: false,
      maxParticipants: 1000,
      prizes: [],
      rules: ["string"]
    };

    const prompt = `Generate a DSA contest with ${numProblems} problems about ${topic} with ${difficulty} difficulty level. Contest type: ${type}, duration: ${duration} minutes. ${description ? `Additional context: ${description}` : ''} Make it realistic and educational.`;

    const contestData = await geminiGenerateJSON(prompt, contestSchema);
    
    // Validate required fields
    if (!contestData.title || !contestData.description || !contestData.problems || contestData.problems.length === 0) {
      throw new Error('Generated contest is missing required fields');
    }

    // Create slug if not provided
    if (!contestData.slug) {
      contestData.slug = contestData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Set contest times
    const now = new Date();
    contestData.startTime = contestData.startTime || new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Start tomorrow
    contestData.endTime = contestData.endTime || new Date(new Date(contestData.startTime).getTime() + duration * 60 * 1000).toISOString();

    // Save problems first
    const savedProblems = [];
    for (const problemData of contestData.problems) {
      const problem = new Problem({
        ...problemData,
        source: `Contest: ${contestData.title}`,
        isActive: true
      });
      await problem.save();
      savedProblems.push(problem._id);
    }

    // Create contest with problem references
    const contest = new Contest({
      ...contestData,
      problems: savedProblems
    });
    await contest.save();

    res.json({
      message: 'Contest generated and saved successfully',
      contest: {
        _id: contest._id,
        title: contest.title,
        slug: contest.slug,
        type: contest.type,
        difficulty: contest.difficulty,
        problemsCount: contest.problems.length
      }
    });
  } catch (error) {
    console.error('AI contest generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate contest',
      details: error.message 
    });
  }
});

// @route   POST /api/ai/manual-problem
// @desc    Create a problem manually with AI assistance
// @access  Private (Admin only)
router.post('/manual-problem', auth, async (req, res) => {
  try {
    const { title, description, difficulty, topics, constraints, examples } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!title || !description || !difficulty || !topics) {
      return res.status(400).json({ error: 'Title, description, difficulty, and topics are required' });
    }

    // Validate topics
    const validTopics = ['arrays', 'strings', 'linked-lists', 'trees', 'graphs', 'dynamic-programming', 'greedy', 'backtracking', 'binary-search', 'two-pointers', 'sliding-window', 'stack', 'queue', 'heap', 'trie', 'union-find', 'bit-manipulation', 'math', 'geometry'];
    const validatedTopics = Array.isArray(topics) ? topics.filter(t => validTopics.includes(t)) : [topics].filter(t => validTopics.includes(t));
    
    if (validatedTopics.length === 0) {
      return res.status(400).json({ error: 'At least one valid topic is required' });
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be easy, medium, or hard' });
    }

    // Generate additional content using AI
    const prompt = `Given this problem:
Title: ${title}
Description: ${description}
Difficulty: ${difficulty}
Topics: ${validatedTopics.join(', ')}

Generate the following in JSON format:
1. A slug for the URL
2. Additional constraints if not provided
3. Test cases as objects with input, output, and isHidden fields
4. Solution templates for JavaScript, Python, Java, and C++
5. AI-generated hints and explanations

Return only valid JSON with proper structure.`;

    let aiGeneratedContent = {};
    try {
      aiGeneratedContent = await geminiGenerateJSON(prompt);
    } catch (aiError) {
      console.log('AI generation failed, using basic content');
    }

    // Create unique slug
    const baseSlug = aiGeneratedContent.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Problem.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Check if title exists and make it unique
    let finalTitle = title;
    counter = 1;
    while (await Problem.findOne({ title: finalTitle })) {
      finalTitle = `${title} ${counter}`;
      counter++;
    }

    const problemData = {
      title: finalTitle,
      slug: slug,
      description: description.trim(),
      difficulty,
      topics: validatedTopics,
      constraints: Array.isArray(constraints) ? constraints.filter(c => c && c.trim()) : [],
      examples: Array.isArray(examples) ? examples.filter(ex => ex && ex.input && ex.output).map(ex => ({
        input: String(ex.input).trim(),
        output: String(ex.output).trim(),
        explanation: String(ex.explanation || '').trim()
      })) : [],
      testCases: [],
      solutionTemplate: aiGeneratedContent.solutionTemplate || {
        javascript: `function solve(input) {\n  // Your code here\n}`,
        python: `def solve(input):\n    # Your code here`,
        java: `public class Solution {\n    public static String solve(String input) {\n        // Your code here\n    }\n}`,
        cpp: `string solve(string input) {\n    // Your code here\n}`
      },
      aiContent: aiGeneratedContent.aiContent || {
        hints: [],
        explanation: {
          approach: '',
          timeComplexity: '',
          spaceComplexity: '',
          detailedSolution: ''
        },
        learningObjectives: [],
        commonMistakes: [],
        tips: []
      },
      stats: {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
        averageTimeToSolve: 0,
        difficultyRating: 0,
        ratingCount: 0
      },
      source: 'Manual Creation',
      isPremium: false,
      isActive: true,
      tags: validatedTopics
    };

    // Clean test cases from AI content
    if (Array.isArray(aiGeneratedContent.testCases)) {
      problemData.testCases = aiGeneratedContent.testCases
        .map(tc => {
          if (typeof tc === 'string') {
            return { input: String(tc).trim(), output: '', isHidden: false };
          }
          if (tc && typeof tc === 'object') {
            return {
              input: String(tc.input || '').trim(),
              output: String(tc.output || '').trim(),
              isHidden: Boolean(tc.isHidden)
            };
          }
          return null;
        })
        .filter(tc => tc && tc.input);
    }

    const problem = new Problem(problemData);
    await problem.save();

    res.json({
      message: 'Problem created successfully',
      problem: {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        topics: problem.topics
      }
    });
  } catch (error) {
    console.error('Manual problem creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create problem',
      details: error.message 
    });
  }
});

// @route   GET /api/leetcode/:username
// @desc    Get LeetCode stats for a user
// @access  Private
router.get('/leetcode/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const axios = require('axios');
    const url = `https://leetcode-api-faisalshohag.vercel.app/${username}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('LeetCode API error:', error);
    res.status(500).json({ error: 'Failed to fetch LeetCode data' });
  }
});

// @route   DELETE /api/ai/problem/:id
// @desc    Delete a problem (Admin only)
// @access  Private (Admin only)
router.delete('/problem/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Check if the problem was created by an admin (optional additional security)
    if (problem.source && !problem.source.includes('Admin') && !problem.source.includes('Manual') && !problem.source.includes('AI')) {
      return res.status(403).json({ error: 'Can only delete admin-created problems' });
    }

    await Problem.findByIdAndDelete(id);

    res.json({
      message: 'Problem deleted successfully',
      deletedProblem: {
        id: problem._id,
        title: problem.title,
        slug: problem.slug
      }
    });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ 
      error: 'Failed to delete problem',
      details: error.message 
    });
  }
});

// @route   GET /api/ai/admin-problems
// @desc    Get all problems created by admin (Admin only)
// @access  Private (Admin only)
router.get('/admin-problems', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 10, search = '', difficulty = '', topic = '' } = req.query;
    
    const query = {
      $or: [
        { source: 'DSA Genie AI' },
        { source: 'Manual Creation' },
        { source: { $regex: /Admin/i } }
      ]
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (topic && topic !== 'all') {
      query.topics = topic;
    }

    const problems = await Problem.find(query)
      .select('title slug difficulty topics source createdAt stats')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Problem.countDocuments(query);

    res.json({
      problems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProblems: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get admin problems error:', error);
    res.status(500).json({ 
      error: 'Failed to get admin problems',
      details: error.message 
    });
  }
});

// @route   PUT /api/ai/problem/:id
// @desc    Update a problem (Admin only)
// @access  Private (Admin only)
router.put('/problem/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, difficulty, topics, constraints, examples, isActive } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Check if the problem was created by an admin
    if (problem.source && !problem.source.includes('Admin') && !problem.source.includes('Manual') && !problem.source.includes('AI')) {
      return res.status(403).json({ error: 'Can only update admin-created problems' });
    }

    // Validate topics if provided
    if (topics) {
      const validTopics = ['arrays', 'strings', 'linked-lists', 'trees', 'graphs', 'dynamic-programming', 'greedy', 'backtracking', 'binary-search', 'two-pointers', 'sliding-window', 'stack', 'queue', 'heap', 'trie', 'union-find', 'bit-manipulation', 'math', 'geometry'];
      const validatedTopics = Array.isArray(topics) ? topics.filter(t => validTopics.includes(t)) : [topics].filter(t => validTopics.includes(t));
      
      if (validatedTopics.length === 0) {
        return res.status(400).json({ error: 'At least one valid topic is required' });
      }
    }

    // Validate difficulty if provided
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be easy, medium, or hard' });
    }

    // Update fields
    const updateFields = {};
    if (title) updateFields.title = title.trim();
    if (description) updateFields.description = description.trim();
    if (difficulty) updateFields.difficulty = difficulty;
    if (topics) updateFields.topics = topics;
    if (constraints) updateFields.constraints = constraints;
    if (examples) updateFields.examples = examples;
    if (typeof isActive === 'boolean') updateFields.isActive = isActive;

    // Update slug if title changed
    if (title && title !== problem.title) {
      const baseSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      while (await Problem.findOne({ slug, _id: { $ne: id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateFields.slug = slug;
    }

    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Problem updated successfully',
      problem: {
        _id: updatedProblem._id,
        title: updatedProblem.title,
        slug: updatedProblem.slug,
        difficulty: updatedProblem.difficulty,
        topics: updatedProblem.topics,
        isActive: updatedProblem.isActive
      }
    });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ 
      error: 'Failed to update problem',
      details: error.message 
    });
  }
});

module.exports = router; 