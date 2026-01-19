const OpenAIApi = require("openai");

const openai = new OpenAIApi({
  apiKey:
    "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",
});

exports.getFollowUpQuestions = async (userInput) => {
  const prompt = `
You are a medical advisory assistant. Based on the following user input, generate three follow-up questions to gather more details.

User Input:
Name: ${userInput.name}
Age: ${userInput.age}
Gender: ${userInput.gender}
Vitals: ${userInput.vitals || "N/A"}
Symptoms: ${userInput.symptoms}
History: ${userInput.history || "N/A"}

Follow-up Questions:
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a medical advisory assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim().split("\n");
  } catch (error) {
    console.error("Error interacting with ChatGPT:", error);
    throw new Error("Failed to generate follow-up questions.");
  }
};

// Generate medical advice based on answers
exports.getAdvice = async (input) => {
  const { patientDetails, questions, answers } = input;

  const formattedQuestionsAnswers = questions
    .map((question, index) => `Q: ${question}\nA: ${answers[index]}`)
    .join("\n\n");

  const prompt = `
You are a medical advisory assistant. Based on the user's responses to follow-up questions, generate a concise medical history summary (maximum 200 words) neatly categorized into the following sections: Patient Vitals (key vitals such as blood pressure, heart rate, temperature, etc.), Symptoms (reported symptoms), Relevant Medical History (personal and family medical history), and Department of Medicine (the medical specialty the patient should consult, e.g., cardiology, neurology). Ensure the summary is clear, concise, and professional to assist healthcare professionals effectively.

This is patient details:
${patientDetails}

${questions}
This is the question asked by gpt:

This is the answer given by the user:
${answers}

Advice:
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a medical advisory assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error interacting with ChatGPT:", error);
    throw new Error("Failed to generate advice.");
  }
};
