import prisma from "../lib/prisma.js";
// import { OpenAI } from 'openai';

// Set up the OpenAI client (Use your API Key from OpenAI)
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// Function to grade short-answer questions using OpenAI
// const gradeShortAnswer = async (studentAnswer, correctAnswer) => {
//   try {
//     // Use ChatGPT to evaluate if the student's answer is correct
//     const response = await openai.chat.completions.create({
//       messages: [
//         {
//           role: 'system',
//           content: 'You are a helpful assistant who evaluates short answers based on correctness.',
//         },
//         {
//           role: 'user',
//           content: `Does the following student answer match the correct answer?\nStudent Answer: "${studentAnswer}"\nCorrect Answer: "${correctAnswer}"`,
//         },
//       ],
//       model: 'gpt-4', // You can adjust the model if needed
//     });

//     // If the response from ChatGPT indicates correctness, return true; otherwise, false

//     console.log(response.choices[0].message.content.toLowerCase().includes("correct"));
    

//     return response.choices[0].message.content.toLowerCase().includes("correct");
//   } catch (error) {
//     console.error("Error grading short answer:", error);
//     return false; // Assume incorrect answer if there is an error
//   }
// };

export const createTestResult = async (req, res) => {
  const { testId, studentId, answers } = req.body; // `answers` is the object with question IDs and selected answers
  let totalScore = 0;

  try {
    // Fetch all questions for the given test
    const questions = await prisma.question.findMany({
      where: { testId: parseInt(testId) },
    });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this test.' });
    }

    // Create an array to store individual question results
    const testResultQuestions = [];

    // Iterate through the questions and calculate the score
    questions.forEach((question) => {
      const studentAnswer = answers[question.id]; // Get the student's answer for this question
      const isCorrect = studentAnswer === question.correctAnswer; // Check if the answer is correct

      // Add points to the total score if the answer is correct
      if (isCorrect) {
        totalScore += question.points;
      }

      // Add the question result to the array
      testResultQuestions.push({
        questionId: question.id,
        isCorrect,
        studentAnswer
      });
    });

    // Save the test result in the database
    const testResult = await prisma.testResult.create({
      data: {
        testId: parseInt(testId),
        studentId: parseInt(studentId),
        score: totalScore,
      },
    });

    // Save the individual question results in the database
    const testResultQuestionRecords = testResultQuestions.map((result) => ({
      testResultId: testResult.id,
      questionId: result.questionId,
      isCorrect: result.isCorrect,
      studentAnswer: result.studentAnswer, // Save the student's answer
    }));

    await prisma.testResultQuestion.createMany({
      data: testResultQuestionRecords,
    });

    // Return the test result and individual question results
    res.status(201).json({
      message: 'Test result created successfully.',
      testResult,
      testResultQuestions,
    });
  } catch (error) {
    console.error('Error creating test result:', error);
    res.status(500).json({ error: 'Failed to create test result.' });
  }
};

export const getTestResult = async (req, res) => {
  const { testId } = req.params; // Get testId from request parameters
  const studentId = req.user.id; // Get studentId from the authenticated user

  try {
    // Fetch the test result for the given testId and studentId
    const testResult = await prisma.testResult.findFirst({
      where: {
        testId: parseInt(testId),
        studentId: parseInt(studentId),
      },
      include: {
        TestResultQuestion: true, // Include related question results
      },
    });

    if (!testResult) {
      return res.status(404).json({ message: "Test result not found." });
    }

    // Format the response
    const response = {
      score: testResult.score,
      submittedAt: testResult.submittedAt,
      testResultQuestions: testResult.TestResultQuestion.map((question) => ({
        questionId: question.questionId,
        isCorrect: question.isCorrect,
      })),
    };
    

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching test result:", error);
    res.status(500).json({ error: "Failed to fetch test result." });
  }
};


export const getTestHistory = async (req, res) => {
  const studentId = req.user.id; // Get the authenticated student's ID

  try {
    // Fetch test results for the student
    const testResults = await prisma.testResult.findMany({
      where: { studentId: studentId },
      include: {
        test: {
          include: {
            module: true, // Include the module details
          },
        },
        TestResultQuestion: true, // Include question results to calculate correct answers
      },
    });

    if (!testResults || testResults.length === 0) {
      return res.status(404).json({ message: "No test history found for this student." });
    }

    // Format the response
    const history = testResults.map((result) => {
      const correctAnswers = result.TestResultQuestion.filter((q) => q.isCorrect).length;
      const totalQuestions = result.TestResultQuestion.length;


      return {
        testId: result.test.id,
        testTitle: result.test.title,
        testDescription: result.test.description,
        moduleCode: result.test.module.code,
        moduleName: result.test.module.name,
        date: result.submittedAt,
        score: `${((result.score/totalQuestions)*100)}%`,
        correctAnswers: `${correctAnswers}/${totalQuestions} correct`,
      };
    });

    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching test history:", error);
    res.status(500).json({ error: "Failed to fetch test history." });
  }
};


export const getReport = async (req, res) => {
  const { testId } = req.params; // Get testId and studentId from request parameters
  const studentId = req.user.id; // Get studentId from the authenticated user

  try {
    // Fetch the test result for the given testId and studentId
    const testResult = await prisma.testResult.findFirst({
      where: {
        testId: parseInt(testId),
        studentId: parseInt(studentId),
      },
      include: {
        student: {
          include: {
            course: true, // Include course details
          },
        },
        test: {
          include: {
            module: true, // Include module details
            questions: true, // Include questions for the test
          },
        },
        TestResultQuestion: true, // Include question results
      },
    });

    if (!testResult) {
      return res.status(404).json({ message: "Test result not found." });
    }

    // Format the response
    const report = {
      student: {
        name: testResult.student.name,
        surname: testResult.student.surname,
        idNumber: testResult.student.idNumber,
      },
      course: {
        name: testResult.student.course?.name || "N/A",
        code: testResult.student.course?.code || "N/A",
      },
      module: {
        name: testResult.test.module.name,
        code: testResult.test.module.code,
      },
      test: {
        title: testResult.test.title,
        scheduledFor: testResult.test.scheduledFor,
      },
      questions: testResult.test.questions.map((question) => {
        const studentAnswer = testResult.TestResultQuestion.find(
          (resultQuestion) => resultQuestion.questionId === question.id
        )?.studentAnswer;

        return {
          text: question.text,
          options: question.options,
          points: question.points,
          correctAnswer: question.correctAnswer,
          studentAnswer: studentAnswer !== undefined ? studentAnswer : "No answer provided",
        };
      }),
    };

    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: "Failed to fetch report." });
  }
};