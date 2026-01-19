const admin = require("firebase-admin");
const OpenAIApi = require("openai").default;

require("dotenv").config();

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// OpenAI API Configuration
const openai = new OpenAIApi({
  project: process.env.OPEN_AI_PROJECT_KEY,
  apiKey: process.env.OPEN_AI_API_KEY,
});

// Function to process data using ChatGPT
async function processWithChatGPT(date) {
  const responses = [];
  const prompt = `Quero que você me dê uma curiosidade que não seja política que aconteceu no Brasil no mês ${date.month} de ${date.year}.`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "developer",
          content:
            "Você é um historiador de curiosidades que aconteceram no Brasil.",
        },
        { role: "user", content: prompt },
      ],
      store: true,
    });

    responses.push({
      fact: response.choices[0].message.content,
      imageUrl: "",
      month: date.month,
      year: date.year,
    });
  } catch (error) {
    console.error(`Error processing fact "${fact.event}" with ChatGPT:`, error);
  }

  return responses;
}

// Function to save responses in Firestore
async function saveResponsesToFirestore(responses) {
  try {
    const batch = db.batch();
    responses.forEach((response) => {
      const docRef = db.collection("brasil-curiosities").doc();
      batch.set(docRef, response);
    });
    await batch.commit();
  } catch (error) {
    console.error("Erro ao salvar as respostas no Firestore:", error);
  }
}

// Main function
(async () => {
  // for (let y = 1925; y < 2025; y++) {
  //   for (let m = 1; m <= 12; m++) {
  //     const date = {
  //       month: m.toString(),
  //       year: y.toString(),
  //     };

  //     // Proccess ChatGPT data
  //     const processedData = await processWithChatGPT(date);
  //     // Save ChatGPT responses to Firebase
  //     await saveResponsesToFirestore(processedData);

  //     console.log("\nChatGPT responses:");
  //     console.log(processedData);
  //   }
  // }

  // ------------------------------------------------------------------

  const date = {
    month: 4,
    year: 1925,
  };

  const processedData = await processWithChatGPT(date);

  console.log("\nChatGPT responses:");
  console.log(processedData);
})();
