import genAI from './geminiClient';

/**
 * Service for generating questions using Gemini AI
 */
class QuestionGenerationService {
  constructor() {
    this.generatedQuestions = new Map(); // Cache for generated questions
    this.studentQuestionHistory = new Map(); // Track questions per student
  }

  /**
   * Generates questions for exam based on configuration
   * @param {Object} config - Exam configuration
   * @param {string} studentId - Student ID to prevent question repetition
   * @returns {Promise<Array>} Array of generated questions
   */
  async generateQuestions(config, studentId = 'default') {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = this.buildPrompt(config, studentId);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();
      
      const questions = this.parseQuestions(generatedText, config);
      
      // Store questions in history to prevent repetition
      this.updateStudentQuestionHistory(studentId, questions);
      
      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }

  /**
   * Builds the prompt for question generation
   * @param {Object} config - Exam configuration
   * @param {string} studentId - Student ID
   * @returns {string} Generated prompt
   */
  buildPrompt(config, studentId) {
    const previousQuestions = this.getStudentQuestionHistory(studentId);
    const previousTopics = previousQuestions.map(q => q.topic).join(', ');
    
    const difficultyDistribution = this.getDifficultyDistribution(config.difficulty, config.questionCount);
    
    return `Generate ${config.questionCount} unique ${config.examType} questions with the following specifications:

EXAM DETAILS:
- Exam Type: ${config.examType}
- Subjects: ${config.subjects?.join(', ') || 'All'}
- Difficulty: ${config.difficulty}
- Question Types: ${this.getQuestionTypesString(config.questionTypes)}
- Target Level: Class 11-12

DIFFICULTY DISTRIBUTION:
${difficultyDistribution}

IMPORTANT REQUIREMENTS:
1. Generate questions that are different from these previously used topics: ${previousTopics || 'None'}
2. Ensure variety in topics within each subject
3. Include detailed explanations for each answer
4. Format as valid JSON array

QUESTION TYPES TO INCLUDE:
${this.getQuestionTypeInstructions(config.questionTypes)}

OUTPUT FORMAT:
Return a JSON array where each question object has this exact structure:
{
  "id": number,
  "subject": "string",
  "topic": "string", 
  "difficulty": "Easy|Medium|Hard",
  "type": "SCA|MCA|NAT|Assertion-Reason",
  "question": "string",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"], // Only for SCA, MCA, Assertion-Reason
  "correctAnswer": "A", // For SCA and Assertion-Reason
  "correctAnswers": ["A", "B"], // For MCA only
  "numericalAnswer": number, // For NAT only
  "explanation": "string"
}

SAMPLE SUBJECTS AND TOPICS:
${this.getSubjectTopics(config.examType, config.subjects)}

Generate exactly ${config.questionCount} questions with proper JSON formatting.`;
  }

  /**
   * Gets difficulty distribution based on configuration
   * @param {string} difficulty - Selected difficulty
   * @param {number} questionCount - Total questions
   * @returns {string} Distribution description
   */
  getDifficultyDistribution(difficulty, questionCount) {
    if (difficulty === 'Mixed') {
      const easy = Math.round(questionCount * 0.3);
      const medium = Math.round(questionCount * 0.5);
      const hard = questionCount - easy - medium;
      return `- Easy: ${easy} questions\n- Medium: ${medium} questions\n- Hard: ${hard} questions`;
    }
    return `- All questions should be ${difficulty} level`;
  }

  /**
   * Gets question types string for prompt
   * @param {Object} questionTypes - Question type configuration
   * @returns {string} Question types description
   */
  getQuestionTypesString(questionTypes) {
    const types = [];
    if (questionTypes?.singleCorrect) types.push('Single Correct Answer (SCA)');
    if (questionTypes?.multipleCorrect) types.push('Multiple Correct Answers (MCA)');
    if (questionTypes?.numerical) types.push('Numerical Answer Type (NAT)');
    if (questionTypes?.assertionReason) types.push('Assertion-Reason');
    return types.join(', ') || 'Single Correct Answer (SCA)';
  }

  /**
   * Gets detailed instructions for question types
   * @param {Object} questionTypes - Question type configuration
   * @returns {string} Detailed instructions
   */
  getQuestionTypeInstructions(questionTypes) {
    let instructions = '';
    
    if (questionTypes?.singleCorrect) {
      instructions += '- SCA: One correct answer among 4 options\n';
    }
    if (questionTypes?.multipleCorrect) {
      instructions += '- MCA: Multiple correct answers among 4 options\n';
    }
    if (questionTypes?.numerical) {
      instructions += '- NAT: Numerical answer without options\n';
    }
    if (questionTypes?.assertionReason) {
      instructions += '- Assertion-Reason: Statement and reason evaluation\n';
    }
    
    return instructions || '- SCA: One correct answer among 4 options';
  }

  /**
   * Gets subject topics based on exam type
   * @param {string} examType - JEE Main or NEET
   * @param {Array} subjects - Selected subjects
   * @returns {string} Subject topics description
   */
  getSubjectTopics(examType, subjects) {
    const topicMap = {
      'JEE Main': {
        'Physics': 'Mechanics, Thermodynamics, Waves, Electromagnetism, Optics, Modern Physics',
        'Chemistry': 'Physical Chemistry, Inorganic Chemistry, Organic Chemistry',
        'Mathematics': 'Algebra, Calculus, Coordinate Geometry, Trigonometry, Statistics'
      },
      'NEET': {
        'Physics': 'Mechanics, Thermodynamics, Waves, Electromagnetism, Optics, Modern Physics',
        'Chemistry': 'Physical Chemistry, Inorganic Chemistry, Organic Chemistry',
        'Biology': 'Botany (Plant Physiology, Ecology, Genetics), Zoology (Animal Physiology, Evolution, Reproduction)'
      }
    };

    const examTopics = topicMap[examType] || topicMap['JEE Main'];
    return subjects?.map(subject => `${subject}: ${examTopics[subject] || 'General Topics'}`).join('\n') || 'All standard topics';
  }

  /**
   * Parses generated questions from AI response
   * @param {string} generatedText - AI response text
   * @param {Object} config - Exam configuration
   * @returns {Array} Parsed questions array
   */
  parseQuestions(generatedText, config) {
    try {
      // Extract JSON from response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate and format questions
      return questions.map((q, index) => ({
        id: index + 1,
        subject: q.subject || config.subjects?.[0] || 'General',
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'Medium',
        type: q.type || 'SCA',
        question: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctAnswers: q.correctAnswers,
        numericalAnswer: q.numericalAnswer,
        explanation: q.explanation || 'Explanation not provided'
      }));
    } catch (error) {
      console.error('Error parsing questions:', error);
      // Return fallback questions if parsing fails
      return this.getFallbackQuestions(config);
    }
  }

  /**
   * Gets student's question history
   * @param {string} studentId - Student ID
   * @returns {Array} Previous questions
   */
  getStudentQuestionHistory(studentId) {
    return this.studentQuestionHistory.get(studentId) || [];
  }

  /**
   * Updates student's question history
   * @param {string} studentId - Student ID
   * @param {Array} newQuestions - New questions to add
   */
  updateStudentQuestionHistory(studentId, newQuestions) {
    const existing = this.getStudentQuestionHistory(studentId);
    const updated = [...existing, ...newQuestions];
    
    // Keep only last 1000 questions to prevent memory issues
    if (updated.length > 1000) {
      updated.splice(0, updated.length - 1000);
    }
    
    this.studentQuestionHistory.set(studentId, updated);
  }

  /**
   * Provides fallback questions if generation fails
   * @param {Object} config - Exam configuration
   * @returns {Array} Fallback questions
   */
  getFallbackQuestions(config) {
    const fallbackQuestions = [
      {
        id: 1,
        subject: config.subjects?.[0] || 'Physics',
        topic: 'General',
        difficulty: 'Medium',
        type: 'SCA',
        question: 'A sample question will be generated. Please try again for AI-generated content.',
        options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
        correctAnswer: 'A',
        explanation: 'This is a fallback question. The AI service is temporarily unavailable.'
      }
    ];

    // Repeat fallback question to match requested count
    const questions = [];
    for (let i = 0; i < Math.min(config.questionCount, 5); i++) {
      questions.push({
        ...fallbackQuestions[0],
        id: i + 1,
        question: `Fallback question ${i + 1}. ${fallbackQuestions[0].question}`
      });
    }

    return questions;
  }

  /**
   * Clears student question history
   * @param {string} studentId - Student ID
   */
  clearStudentHistory(studentId) {
    this.studentQuestionHistory.delete(studentId);
  }

  /**
   * Gets cache size
   * @returns {number} Number of cached entries
   */
  getCacheSize() {
    return this.generatedQuestions.size;
  }
}

// Export singleton instance
export default new QuestionGenerationService();