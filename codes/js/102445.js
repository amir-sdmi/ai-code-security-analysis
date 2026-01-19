require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cors = require('cors');
const pdf = require('pdf-parse');
const crypto = require('crypto');

console.log('=== PATH DEBUG ===');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());
console.log('quizzesDir:', path.join(__dirname, '..', 'quizzes'));
console.log('study_materials:', path.join(__dirname, '..', 'study_materials'));
console.log('==================');

const app = express();
const port = 3001;

const quizzesDir = path.join(__dirname, '..', 'quizzes');
const statsFilePath = path.join(__dirname, '..', 'quizzes', 'stats.json');

console.log('Final quizzesDir path:', quizzesDir);
console.log('statsFilePath:', statsFilePath);

if (!fs.existsSync(quizzesDir)) fs.mkdirSync(quizzesDir);

app.use(cors());
app.use(express.json());

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// Add this function near the top of your server/index.js if not present
const createQuestionId = (questionText) => {
  return crypto.createHash('sha256').update(questionText.trim().toLowerCase()).digest('hex').substring(0, 16);
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const shuffleQuestionOptions = (question) => {
  const correctAnswer = question.answer;
  const shuffledOptions = shuffleArray(question.options);
  
  return {
    ...question,
    options: shuffledOptions,
    answer: correctAnswer // Keep the correct answer text, not position
  };
};

// Add this near the top with other configuration
const DISABLE_GENERATION = process.env.DISABLE_GENERATION === 'true';

console.log('=== CONFIGURATION ===');
console.log('Generation disabled:', DISABLE_GENERATION);
console.log('=====================');

// Modify the generation endpoints to check this flag
app.post('/api/quizzes', async (req, res) => {
  if (DISABLE_GENERATION) {
    return res.status(403).json({ 
      message: 'Question generation is disabled on this server. Use your local development environment to generate questions.' 
    });
  }
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).send('Server configuration error: Missing API Key.');
  }
  const materialsDir = path.join(__dirname, '..', 'study_materials');
  let combinedContent = '';
  try {
    const files = fs.readdirSync(materialsDir);
    for (const file of files) {
      const filePath = path.join(materialsDir, file);
      if (file.endsWith('.txt')) combinedContent += fs.readFileSync(filePath, 'utf-8') + '\n\n';
      else if (file.endsWith('.pdf')) {
        const data = await pdf(fs.readFileSync(filePath));
        combinedContent += data.text + '\n\n';
      }
    }
  } catch (err) {
    return res.status(500).send('Failed to read study materials.');
  }
  if (combinedContent.trim() === '') {
    return res.status(400).send('No study materials (.txt or .pdf) found.');
  }

  // Update the prompt to be more specific about generating different questions
  const promptInstructions = `Based on the following text, generate 10 NEW and DIFFERENT multiple choice questions and answers in a valid JSON array format.

**JSON Structure Requirements:**
Each object in the array must have the following keys: "question", "options", "answer", and "explanation".
- "question": A string containing the question text.
- "options": An array of 4 strings representing the multiple-choice options.
- "answer": A string containing the **full text** of the correct option. This value **must exactly match** one of the strings in the "options" array. Do NOT use a letter like "A" or "B" or "C" or "D".
- "explanation": A string explaining why the answer is correct, referencing the source text if possible.

**Example of a single JSON object:**
{
  "question": "What is the primary purpose of a load balancer?",
  "options": [
    "To encrypt data traffic",
    "To distribute incoming network traffic across multiple servers",
    "To store user session data",
    "To cache static content"
  ],
  "answer": "To distribute incoming network traffic across multiple servers",
  "explanation": "A load balancer acts as a reverse proxy and distributes network or application traffic across a number of servers to improve reliability and capacity."
}

**Question Generation Guidelines:**
Make the questions UNIQUE and cover DIFFERENT aspects, concepts, and details from the material. Focus on:
- Different technical concepts
- Various implementation details
- Different scenarios and use cases
- Alternative approaches mentioned
- Specific examples and edge cases

Current timestamp for uniqueness: ${Date.now()}

Here is the text:\n\n---\n\n`;
  const fullInput = promptInstructions + combinedContent;
  const tempFilePath = path.join(os.tmpdir(), `gemini-prompt-${Date.now()}.txt`);
  fs.writeFileSync(tempFilePath, fullInput, 'utf-8');
  const command = `gemini --model ${getGeminiModel()} < "${tempFilePath}"`;
  
  exec(command, { maxBuffer: 1024 * 1024 * 10, env: process.env }, (error, stdout, stderr) => {
    fs.unlinkSync(tempFilePath);
    if (error) return res.status(500).send(`Failed to execute Gemini CLI. Error: ${stderr}`);
    
    try {
      const jsonResponse = stdout.substring(stdout.indexOf('['), stdout.lastIndexOf(']') + 1);
      const questions = JSON.parse(jsonResponse);
      const filename = `quiz_${new Date().toISOString().replace(/:/g, '-')}.json`;
      fs.writeFileSync(path.join(quizzesDir, filename), JSON.stringify(questions, null, 2));
      res.status(201).json({ message: 'Quiz saved successfully!', filename });
    } catch (e) {
      res.status(500).send('Failed to parse or save the quiz from Gemini response.');
    }
  });
});

app.get('/api/quizzes/all', (req, res) => {
  try {
    let allQuestions = [];
    let stats = {};

    if (fs.existsSync(statsFilePath)) {
      stats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
    }

    const files = fs.readdirSync(quizzesDir);
    const quizFiles = files.filter(file => file.endsWith('.json') && file !== 'stats.json');

    quizFiles.forEach(file => {
      const content = fs.readFileSync(path.join(quizzesDir, file), 'utf8');
      const questions = JSON.parse(content);
      allQuestions.push(...questions);
    });

    let questionPool = allQuestions.map(q => {
      const id = createQuestionId(q.question);
      const qStats = stats[id] || { correct: 0, incorrect: 0, seen: 0 };
      const weight = 1 + (qStats.incorrect * 2) - (qStats.correct * 0.5) + (1 / (qStats.seen + 1));
      return { ...q, weight: Math.max(0.1, weight) };
    });

    const quizQuestions = [];
    const quizSize = Math.min(10, questionPool.length);

    for (let i = 0; i < quizSize; i++) {
      const totalWeight = questionPool.reduce((sum, q) => sum + q.weight, 0);
      let randomWeight = Math.random() * totalWeight;
      
      for (let j = 0; j < questionPool.length; j++) {
        randomWeight -= questionPool[j].weight;
        if (randomWeight <= 0) {
          // Shuffle options before adding to quiz
          quizQuestions.push(shuffleQuestionOptions(questionPool[j]));
          questionPool.splice(j, 1);
          break;
        }
      }
    }

    res.json(quizQuestions);
  } catch (err) {
    console.error('Error in /api/quizzes/all:', err);
    res.status(500).send('Error loading or processing quizzes.');
  }
});

app.get('/api/quizzes/count', (req, res) => {
    try {
        let allQuestions = [];
        const files = fs.readdirSync(quizzesDir).filter(file => file.endsWith('.json') && file !== 'stats.json');
        files.forEach(file => {
            const content = fs.readFileSync(path.join(quizzesDir, file), 'utf8');
            allQuestions.push(...JSON.parse(content));
        });
        const uniqueQuestions = new Set(allQuestions.map(q => q.question));
        res.json({ count: uniqueQuestions.size });
    } catch(err) {
        res.status(500).json({ count: 0 });
    }
});


app.post('/api/quizzes/consolidate', (req, res) => {
  try {
    const files = fs.readdirSync(quizzesDir);
    const quizFiles = files.filter(file => file.endsWith('.json') && file !== 'stats.json' && file !== 'master-quiz-bank.json');
    let stats = fs.existsSync(statsFilePath) ? JSON.parse(fs.readFileSync(statsFilePath, 'utf8')) : {};
    
    let allQuestions = [];
    // If a master bank already exists, start with it
    const masterBankPath = path.join(quizzesDir, 'master-quiz-bank.json');
    if (fs.existsSync(masterBankPath)) {
        allQuestions.push(...JSON.parse(fs.readFileSync(masterBankPath, 'utf8')));
    }

    // Add questions from any new, non-master quiz files
    quizFiles.forEach(file => {
      const content = fs.readFileSync(path.join(quizzesDir, file), 'utf8');
      allQuestions.push(...JSON.parse(content));
    });

    const uniqueQuestionsMap = new Map();
    allQuestions.forEach(q => {
      const id = createQuestionId(q.question);
      if (!uniqueQuestionsMap.has(id)) {
        uniqueQuestionsMap.set(id, q);
      }
    });
    
    const finalQuestions = Array.from(uniqueQuestionsMap.values());
    const duplicatesRemoved = allQuestions.length - finalQuestions.length;

    // Write the new consolidated master file
    fs.writeFileSync(masterBankPath, JSON.stringify(finalQuestions, null, 2));

    // Delete the old individual quiz files
    quizFiles.forEach(file => {
      fs.unlinkSync(path.join(quizzesDir, file));
    });

    res.status(200).json({
      message: `Consolidation complete! ${duplicatesRemoved} duplicate questions removed.`,
    });
  } catch (err) {
    console.error('Error during consolidation:', err);
    res.status(500).send('Error consolidating question bank.');
  }
});


app.post('/api/stats', (req, res) => {
    const results = req.body.results;
    if (!results) return res.status(400).send('No results provided.');
    
    let stats = {};
    if (fs.existsSync(statsFilePath)) {
        stats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
    }

    results.forEach(result => {
        const id = createQuestionId(result.question);
        if (!stats[id]) stats[id] = { correct: 0, incorrect: 0, seen: 0 };
        stats[id].seen++;
        if (result.wasCorrect) stats[id].correct++;
        else stats[id].incorrect++;
    });

    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
    res.status(200).send('Stats updated successfully.');
});

// Generate quiz for specific topic
app.post('/api/quizzes/:topicId', async (req, res) => {
  const { topicId } = req.params;
  
  if (DISABLE_GENERATION) {
    return res.status(403).json({ 
      message: 'Question generation is disabled on this server. Use your local development environment to generate questions.' 
    });
  }
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Server configuration error: Missing API Key.' });
  }
  
  try {
    const topicPath = path.join(__dirname, '..', 'study_materials', topicId);
    if (!fs.existsSync(topicPath)) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Read all files in the topic directory
    const files = fs.readdirSync(topicPath);
    let combinedContent = '';
    
    for (const file of files) {
      const filePath = path.join(topicPath, file);
      const ext = path.extname(file).toLowerCase();
      
      if (ext === '.txt') {
        combinedContent += fs.readFileSync(filePath, 'utf8') + '\n\n';
      } else if (ext === '.pdf') {
        try {
          const data = await pdf(fs.readFileSync(filePath));
          combinedContent += data.text + '\n\n';
        } catch (pdfError) {
          console.log(`Error reading PDF ${file}:`, pdfError.message);
        }
      }
    }
    
    if (!combinedContent.trim()) {
      return res.status(400).json({ message: 'No readable content found in topic folder' });
    }
    
    const promptInstructions = `Based on the following text, generate 10 NEW and DIFFERENT multiple choice questions and answers in a valid JSON array format.

**JSON Structure Requirements:**
Each object in the array must have the following keys: "question", "options", "answer", and "explanation".
- "question": A string containing the question text.
- "options": An array of 4 strings representing the multiple-choice options.
- "answer": A string containing the **full text** of the correct option. This value **must exactly match** one of the strings in the "options" array. Do NOT use a letter like "A" or "B".
- "explanation": A string explaining why the answer is correct, referencing the source text if possible.

**Example of a single JSON object:**
{
  "question": "What is the primary purpose of a load balancer?",
  "options": [
    "To encrypt data traffic",
    "To distribute incoming network traffic across multiple servers",
    "To store user session data",
    "To cache static content"
  ],
  "answer": "To distribute incoming network traffic across multiple servers",
  "explanation": "A load balancer acts as a reverse proxy and distributes network or application traffic across a number of servers to improve reliability and capacity."
}

**Question Generation Guidelines:**
Make the questions UNIQUE and cover DIFFERENT aspects, concepts, and details from the material. Focus on:
- Different technical concepts
- Various implementation details
- Different scenarios and use cases
- Alternative approaches mentioned
- Specific examples and edge cases

Current timestamp for uniqueness: ${Date.now()}

Here is the text:\n\n---\n\n`;
    const fullInput = promptInstructions + combinedContent;
    
    const tempFilePath = path.join(os.tmpdir(), `gemini-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tempFilePath, fullInput, 'utf-8');
    const command = `gemini --model ${getGeminiModel()} < "${tempFilePath}"`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 10, env: process.env }, (error, stdout, stderr) => {
      fs.unlinkSync(tempFilePath);
      
      if (error) {
        console.error('Gemini CLI error:', stderr);
        
        // Handle rate limit specifically
        if (stderr.includes('429') || stderr.includes('Resource has been exhausted')) {
          return res.status(429).json({ 
            message: 'API rate limit exceeded. Please wait a few minutes before trying again. Consider using a smaller amount of study material or waiting for your quota to reset.' 
          });
        }
        
        return res.status(500).json({ message: `Failed to execute Gemini CLI. Error: ${stderr}` });
      }
      
      try {
        const jsonResponse = stdout.substring(stdout.indexOf('['), stdout.lastIndexOf(']') + 1);
        const newQuestions = JSON.parse(jsonResponse);
        
        console.log(`Generated ${newQuestions.length} new questions from Gemini`);
        
        const outputPath = path.join(__dirname, '..', 'quizzes', `${topicId}-quiz.json`);
        
        // Check if file exists and merge questions instead of overwriting
        let existingQuestions = [];
        if (fs.existsSync(outputPath)) {
          try {
            existingQuestions = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            console.log(`Found ${existingQuestions.length} existing questions`);
          } catch (e) {
            console.log('Error reading existing quiz file, starting fresh:', e.message);
            existingQuestions = [];
          }
        }
        
        // Add debugging for duplicate detection
        console.log('Checking for duplicates...');
        const existingHashes = new Set();
        existingQuestions.forEach(q => {
          const hash = createQuestionId(q.question);
          existingHashes.add(hash);
        });
        
        let actuallyNewQuestions = [];
        newQuestions.forEach(q => {
          const hash = createQuestionId(q.question);
          if (!existingHashes.has(hash)) {
            actuallyNewQuestions.push(q);
            existingHashes.add(hash);
          } else {
            console.log(`Duplicate detected: "${q.question.substring(0, 50)}..."`);
          }
        });
        
        console.log(`${actuallyNewQuestions.length} questions are actually new`);
        
        // Combine existing and new questions
        const allQuestions = [...existingQuestions, ...actuallyNewQuestions];
        
        // Save the combined questions
        fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));
        
        res.json({ 
          message: `Added ${actuallyNewQuestions.length} new questions to ${topicId}. Total: ${allQuestions.length} questions${newQuestions.length - actuallyNewQuestions.length > 0 ? ` (${newQuestions.length - actuallyNewQuestions.length} duplicates removed)` : ''}`, 
          questions: allQuestions.length,
          newQuestions: actuallyNewQuestions.length,
          duplicatesRemoved: newQuestions.length - actuallyNewQuestions.length,
          modelUsed: getGeminiModel() // Add this line
        });
        
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Gemini output:', stdout);
        res.status(500).json({ message: 'Failed to parse or save the quiz from Gemini response.' });
      }
    });
    
  } catch (error) {
    console.error('Error generating topic quiz:', error);
    res.status(500).json({ message: 'Failed to generate quiz: ' + error.message });
  }
});

// Get quiz questions for specific topic
app.get('/api/quizzes/:topicId', (req, res) => {
  const { topicId } = req.params;
  
  try {
    // FIX: Use the correct path
    const quizPath = path.join(__dirname, '..', 'quizzes', `${topicId}-quiz.json`);
    if (!fs.existsSync(quizPath)) {
      return res.status(404).json({ message: 'No quiz found for this topic' });
    }
    
    const quizData = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
    
    // Apply smart review logic here too
    const statsPath = path.join(__dirname, '..', 'quizzes', 'stats.json');
    let stats = {};
    if (fs.existsSync(statsPath)) {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    }
    
    // Select and shuffle questions
    const selectedQuestions = selectQuestionsWithWeights(quizData, stats, 10)
      .map(q => shuffleQuestionOptions(q));
    
    res.json(selectedQuestions);
    
  } catch (error) {
    console.error('Error getting topic quiz:', error);
    res.status(500).json({ message: 'Failed to get quiz' });
  }
});

// Also fix the topics endpoint to count questions correctly
app.get('/api/topics', (req, res) => {
  try {
    const studyMaterialsPath = path.join(__dirname, '..', 'study_materials');
    if (!fs.existsSync(studyMaterialsPath)) {
      return res.json([]);
    }
    
    const topics = fs.readdirSync(studyMaterialsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        id: dirent.name,
        name: dirent.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        questionCount: 0 // Will be populated below
      }));
    
    // Count questions for each topic - FIX: Use correct path
    topics.forEach(topic => {
      const topicQuizPath = path.join(__dirname, '..', 'quizzes', `${topic.id}-quiz.json`);
      if (fs.existsSync(topicQuizPath)) {
        try {
          const quizData = JSON.parse(fs.readFileSync(topicQuizPath, 'utf8'));
          topic.questionCount = quizData.length || 0; // FIX: quizData is an array, not an object with questions property
        } catch (e) {
          topic.questionCount = 0;
        }
      }
    });
    
    res.json(topics);
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({ message: 'Failed to get topics' });
  }
});

// Add this function (it was referenced but missing)
const selectQuestionsWithWeights = (questions, stats, count) => {
  let questionPool = questions.map(q => {
    const id = createQuestionId(q.question);
    const qStats = stats[id] || { correct: 0, incorrect: 0, seen: 0 };
    const weight = 1 + (qStats.incorrect * 2) - (qStats.correct * 0.5) + (1 / (qStats.seen + 1));
    return { ...q, weight: Math.max(0.1, weight) };
  });

  const selectedQuestions = [];
  const quizSize = Math.min(count, questionPool.length);

  for (let i = 0; i < quizSize; i++) {
    const totalWeight = questionPool.reduce((sum, q) => sum + q.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (let j = 0; j < questionPool.length; j++) {
      randomWeight -= questionPool[j].weight;
      if (randomWeight <= 0) {
        selectedQuestions.push(questionPool[j]);
        questionPool.splice(j, 1);
        break;
      }
    }
  }

  return selectedQuestions;
};

// Add this function for validation
const SUPPORTED_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

const getGeminiModel = () => {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  
  // Validate that the model is supported
  if (!SUPPORTED_MODELS.includes(model)) {
    console.warn(`Warning: Model '${model}' may not be supported. Using default: ${DEFAULT_GEMINI_MODEL}`);
    return DEFAULT_GEMINI_MODEL;
  }
  
  console.log(`Using Gemini model: ${model}`);
  return model;
};

// Add environment validation at startup:
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

app.get('/api/topics/stats', (req, res) => {
  try {
    let stats = {};
    let topicStats = {};

    // Load general stats
    if (fs.existsSync(statsFilePath)) {
      stats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
    }

    // Calculate stats for each topic by analyzing quiz results
    const files = fs.readdirSync(quizzesDir);
    
    files.forEach(file => {
      if (file.endsWith('-quiz.json')) {
        const topicId = file.replace('-quiz.json', '');
        const topicName = topicId.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        try {
          const questions = JSON.parse(fs.readFileSync(path.join(quizzesDir, file), 'utf8'));
          
          // Initialize topic stats
          topicStats[topicId] = {
            id: topicId,
            name: topicName,
            questionCount: questions.length,
            totalAttempts: 0,
            correctAnswers: 0,
            accuracy: 0,
            averageWeight: 0,
            needsFocus: false
          };

          // Calculate stats from question weights and performance
          let totalWeight = 0;
          let questionsWithStats = 0;
          
          questions.forEach(q => {
            const questionId = createQuestionId(q.question);
            if (stats[questionId]) {
              const qStats = stats[questionId];
              topicStats[topicId].totalAttempts += qStats.seen || 0;
              topicStats[topicId].correctAnswers += qStats.correct || 0;
              // FIX: Add fallback values and ensure no division errors
              const incorrect = qStats.incorrect || 0;
              const correct = qStats.correct || 0;
              const seen = qStats.seen || 0;
              const weight = 1 + (incorrect * 2) - (correct * 0.5) + (1 / (seen + 1));
              totalWeight += Math.max(0.1, weight);
              questionsWithStats++;
            } else {
              totalWeight += 1; // Default weight for new questions
            }
          });

          if (topicStats[topicId].totalAttempts > 0) {
            topicStats[topicId].accuracy = Math.round(
              (topicStats[topicId].correctAnswers / topicStats[topicId].totalAttempts) * 100
            );
          }

          if (questions.length > 0) {
            topicStats[topicId].averageWeight = Math.round((totalWeight / questions.length) * 100) / 100;
          }

          // Determine if topic needs focus (low accuracy or high average weight)
          topicStats[topicId].needsFocus = 
            topicStats[topicId].accuracy < 70 || topicStats[topicId].averageWeight > 1.5;
            
        } catch (error) {
          console.error(`Error processing ${file}:`, error);
        }
      }
    });

    res.json(Object.values(topicStats));
  } catch (error) {
    console.error('Error getting topic stats:', error);
    res.status(500).json({ message: 'Failed to get topic statistics' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Serve static files and React app in production
const publicPath = path.join(__dirname, 'public');
console.log('Checking for public directory at:', publicPath);
console.log('Public directory exists:', fs.existsSync(publicPath));

if (fs.existsSync(publicPath)) {
  console.log('Production mode: Serving static files from public directory');
  app.use(express.static(publicPath));
  
  // Express 5.0 compatible catchall route
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    console.log('Serving React app for path:', req.path);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
} else {
  console.log('Public directory not found - API only mode');
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Quiz App API Server is running!',
      mode: 'API only - no frontend files found',
      endpoints: [
        'GET /api/test',
        'GET /api/topics',
        'GET /api/topics/stats', 
        'GET /api/quizzes/all',
        'GET /api/quizzes/count'
      ]
    });
  });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
