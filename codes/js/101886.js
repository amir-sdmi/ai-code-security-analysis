const express = require("express");
const Question = require("../models/question");
const Category = require("../models/category");
const Section = require("../models/section");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isCategoryAuthor } = require("../utils/middleware");
const { OpenAI } = require("openai");
const question = require("../models/question");

const openai = new OpenAI({ apiKey: process.env.CHATGPT_SECRET });

// **********************************
// NOT UPDATED FROM INLEGE FOR EDOOKIO
// **********************************

//generate test questions via OpenAI
router.get(
  "/category/:categoryId/section/:sectionId/question/generate",
  isLoggedIn,
  isCategoryAuthor,
  catchAsync(async (req, res) => {
    const { categoryId, sectionId } = req.params;
    const { user } = req;
    const foundSection = await Section.findById(sectionId).populate("cards");
    if (!foundSection) {
      req.flash("error", "Balíček nebyl nalezen");
      return res.redirect(`/review/${sectionId}/showAll`);
    }

    // Array to store promises
    const promises = [];

    //count how many question in the section do not have connectedQuestionId
    let questionsToGenerateCounter = 0;
    foundSection.cards.forEach((card) => {
      if (!card.connectedQuestionId) {
        questionsToGenerateCounter++;
      }
    });

    //check if user has enough credits
    if (user.credits < questionsToGenerateCounter) {
      req.flash(
        "error",
        `Nemáte dostatek kreditů pro vygenerování otázek (potřebujete ${questionsToGenerateCounter} a máte ${user.credits} kreditů).`
      );
      return res.redirect(`/review/${sectionId}/showAll`);
    }

    foundSection.cards.forEach((card) => {
      // Push each asynchronous operation into the promises array
      if (!card.connectedQuestionId) {
        promises.push(generateQuizQuestion(card, sectionId, categoryId, user));
        questionsCreatedCounter++;
      }
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    //Increase numOfQuestions in category
    const foundCategory = await Category.findById(categoryId);

    foundCategory.numOfQuestions =
      foundCategory.numOfQuestions + foundSection.cards.length;
    await foundCategory.save();

    // Update user's counters outside the loop
    user.generatedQuestionsCounterMonth += questionsCreatedCounter;
    user.generatedQuestionsCounterTotal += questionsCreatedCounter;
    user.usedCreditsMonth += questionsCreatedCounter;
    user.usedCreditsTotal += questionsCreatedCounter;

    //reduce used credits from user credits
    if (user.credits < questionsCreatedCounter) {
      user.questionsCreatedCounter = 0;
    } else {
      user.credits -= questionsCreatedCounter;
    }

    const savedUser = await user.save();

    // When all asynchronous operations are completed
    req.flash(
      "successOverlay",
      `Bylo vygenerováno ${questionsCreatedCounter} otázek`
    );
    res.status(200).redirect(`/review/${sectionId}/showAll`);
  })
);

//generate test questions via OpenAI EN
router.get(
  "/category/:categoryId/section/:sectionId/question/generateEN",
  isLoggedIn,
  isCategoryAuthor,
  catchAsync(async (req, res) => {
    const { categoryId, sectionId } = req.params;
    const { user } = req;
    const foundSection = await Section.findById(sectionId).populate("cards");
    if (!foundSection) {
      req.flash("error", "Balíček nebyl nalezen");
      return res.redirect(`/review/${sectionId}/showAll`);
    }

    // Array to store promises
    const promises = [];

    foundSection.cards.forEach((card) => {
      // Push each asynchronous operation into the promises array
      promises.push(generateEnQuizQuestion(card, sectionId, categoryId, user));
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    //Increase numOfQuestions in category
    const foundCategory = await Category.findById(categoryId);

    foundCategory.numOfQuestions =
      foundCategory.numOfQuestions + foundSection.cards.length;
    await foundCategory.save();

    // When all asynchronous operations are completed
    res.status(200).redirect(`/review/${sectionId}/showAll`);
  })
);

async function generateQuizQuestion(card, sectionId, categoryId, user) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Create a quiz question for bachelor university students in Czech language with three answers of which only one is correct based on the following text: 

        ${card.pageA}
        ${card.pageB}
        
        Return response in the following parseable JSON format: 
        
        {
            "Q":"question",
            "CA":"correct-answer",
            "WA1":"wrong-answer-1",
            "WA2":"wrong-answer-2"
        }
        
        `,
      },
    ],
    model: "gpt-4o-mini",
    temperature: 0.8,
  });

  try {
    const parsedResponse = JSON.parse(completion.choices[0].message.content);
    let newQuestion = new Question({
      category: categoryId,
      section: sectionId,
      author: user._id,
      question: parsedResponse.Q,
      correctAnswers: [parsedResponse.CA],
      wrongAnswers: [parsedResponse.WA1, parsedResponse.WA2],
      sourceCard: card._id,
    });

    //add connectedQuestionId to card
    card.connectedQuestionId = newQuestion._id;
    await card.save();

    const createdQuestion = await newQuestion.save();

    const foundSection = await Section.findById(sectionId);

    foundSection.questions.push(createdQuestion._id);
    await foundSection.save();
  } catch (error) {
    // Handle parsing error
    console.log("Error parsing JSON created by chatGPT", error);
  }
}

async function generateEnQuizQuestion(card, sectionId, categoryId, user) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Below you can see a flashcard where on one side there is an english legal term and a sentence with example usage. On the other side there is the Czech translation. Create a quiz question with three answers of which only one is correct where the question is the Czech word and the answers are the English words. For the wrong answers use english legal terms from the same area of law as the word on the flashcard and also from the same category of words (e.g. if the word is a type of contract, use other types of contracts as wrong answers).: 

        ${card.pageA}
        ${card.pageB}
        
        Return response in the following parseable JSON format: 
        
        {
            "Q":"question",
            "CA":"correct-answer",
            "WA1":"wrong-answer-1",
            "WA2":"wrong-answer-2"
        }
        
        `,
      },
    ],
    model: "gpt-4o-mini",
    temperature: 0.8,
  });

  try {
    const content = completion.choices[0].message.content;
    const cleanedContent = content.replace(/```json|```/g, "").trim();
    const parsedResponse = JSON.parse(cleanedContent);
    let newQuestion = new Question({
      category: categoryId,
      section: sectionId,
      author: user._id,
      question: parsedResponse.Q,
      correctAnswers: [parsedResponse.CA],
      wrongAnswers: [parsedResponse.WA1, parsedResponse.WA2],
      sourceCard: card._id,
    });

    const createdQuestion = await newQuestion.save();

    const foundSection = await Section.findById(sectionId);

    foundSection.questions.push(createdQuestion._id);
    await foundSection.save();
  } catch (error) {
    // Handle parsing error
    console.log("Error parsing JSON created by chatGPT", error);
  }
}

module.exports = router;
