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

  const prompt = `Quero que você me apresente o lançamento de música que foi um sucesso no Brasil no mês ${date.month} de ${date.year}. As respostas devem conter apenas o nome do cantor e o nome da música no seguinte formato:

      Cantor: [Nome do cantor]  
      Música: [Nome da música]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um historiador dos sucessos musicais brasileiros.",
        },
        { role: "user", content: prompt },
      ],
    });

    const fullResponse = response.choices[0].message.content;

    const artistMatch = fullResponse.match(/Cantor:\s*(.*)/);
    const songMatch = fullResponse.match(/Música:\s*(.*)/);

    const artist = artistMatch ? artistMatch[1].trim() : "Unknown";
    const songName = songMatch ? songMatch[1].trim() : "Unknown";

    responses.push({
      artist: artist,
      songName: songName,
      spotifyUrl: "",
      month: date.month,
      year: date.year,
    });
  } catch (error) {
    console.error(`Error processing song of ${date.month} of ${date.year} with ChatGPT:`, error);
  }

  return responses;
}

// Function to save responses in Firestore
async function saveResponsesToFirestore(responses) {
  try {
    const batch = db.batch();
    responses.forEach((response) => {
      const docRef = db.collection("brasil-songs").doc();
      batch.set(docRef, response);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error saving responses to Firestore:", error);
  }
}

// Main function
(async () => {
  // for (let y = 1925; y < 2025; y++) {
  //   for (let m = 1; m <= 12; m++) {
  //     const date =
  //       {
  //         month: m.toString(),
  //         year: y.toString(),
  //       };

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
    month: 1,
    year: 2002,
  };

  const processedData = await processWithChatGPT(date);

  console.log("\nChatGPT responses:");
  console.log(processedData);
})();