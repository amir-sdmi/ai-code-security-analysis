require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise"); // mysql2のpromise APIを使用
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 8000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Create a connection to the database
let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || "mysql",
      user: process.env.DB_USER || "Alan",
      password: process.env.DB_PASSWORD || "kokekiko2525",
      database: process.env.DB_NAME || "anki_db",
    });
    console.log("Successfully connected to the database.");
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
  }
})();

// ChatGPT API 呼び出し関数
async function generateText(prompt) {
  try {
    console.log("Sending request to ChatGPT API with prompt:", prompt);
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Received response from ChatGPT API:", response.data);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error generating text with ChatGPT:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

async function generateTextWithCardData(cardId) {
  try {
    const [results] = await db.execute(
      "SELECT flds FROM note WHERE id = (SELECT nid FROM card WHERE id = ?)",
      [cardId]
    );

    if (results.length === 0) {
      console.log("No data found for the given cardId.");
      return null;
    }

    const flds = JSON.parse(results[0].flds);
    const prompt = `京大レベルの世界史の一問一答です。"${flds[0]}"が答えとなるような問題文を生成してみてください`;
    // ChatGPT API を呼び出してテキストを生成
    return await generateText(prompt);
  } catch (error) {
    console.error("Error in generateTextWithCardData:", error.message);
    return null;
  }
}

// Define API endpoints
app.get("/api/client", async (req, res) => {
  console.log("Received request for /api/client");
  try {
    const [results] = await db.execute("SELECT id, deckname FROM DECK");
    console.log("Sending response with deck data:", results);
    res.json(results);
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.get("/api/deck/:id/cards", async (req, res) => {
  console.log(
    "Received request for /api/deck/:id/cards with id:",
    req.params.id
  );

  const deckId = req.params.id;
  const now = Math.floor(Date.now() / 1000); // 現在のUNIXタイムスタンプ

  const query = `
    SELECT 
      card.id, 
      note.flds, 
      card.queue, 
      card.type,
      card.due, 
      card.ivl, 
      card.factor, 
      card.reps, 
      card.lapses,
      card.odue, 
      card.odid,
      card.flags,
      card.data,
      card.generated_text
    FROM card
    JOIN note ON card.nid = note.id
    WHERE card.did = ? AND card.due < ?
  `;

  try {
    const [results] = await db.execute(query, [deckId, now]);
    if (results.length === 0) {
      console.log(`No cards found for deck id: ${deckId}`);
      return res.status(404).json({ error: "No cards found for this deck." });
    }

    console.log("Fetched cards:", results);
    results.forEach((card, index) => {
      console.log(`Card ${index + 1} generated_text:`, card.generated_text);
    });

    res.json(results);
  } catch (err) {
    console.error("Error fetching cards:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.post("/api/card/:id/update", async (req, res) => {
  const cardId = req.params.id;
  const { option } = req.body; // クライアントからの選択肢 (again, hard, good, easy)

  console.log(
    "Received request to update card with id:",
    cardId,
    "and option:",
    option
  );

  const selectQuery = "SELECT ivl, factor, reps, lapses FROM card WHERE id = ?";

  try {
    const [result] = await db.execute(selectQuery, [cardId]);

    if (result.length === 0) {
      console.log("Card not found with id:", cardId);
      return res.status(404).json({ error: "Card not found" });
    }

    let { ivl, factor, reps, lapses } = result[0];
    console.log("Current card data:", { ivl, factor, reps, lapses });

    // 選択に基づいて次のインターバルを計算
    switch (option) {
      case "again":
        lapses += 1;
        ivl = 1;
        factor = Math.max(factor - 200, 1300);
        break;
      case "hard":
        ivl = ivl * 1.2;
        factor = Math.max(factor - 150, 1300);
        break;
      case "good":
        reps += 1;
        ivl = (ivl * factor) / 1000;
        break;
      case "easy":
        reps += 1;
        ivl = ((ivl * factor) / 1000) * 1.5;
        factor = factor + 150;
        break;
      default:
        console.log("Invalid option received:", option);
        return res.status(400).json({ error: "Invalid option" });
    }

    console.log("Updated card data:", { ivl, factor, reps, lapses });

    const due = Math.floor(Date.now() / 1000) + Math.floor(ivl * 86400);

    let generatedText = null;
    if (factor >= 2900) {
      generatedText = await generateTextWithCardData(cardId);
      console.log("Generated motivational message:", generatedText);
    }

    const updateQuery = `
          UPDATE card 
          SET ivl = ?, factor = ?, reps = ?, lapses = ?, due = ?, generated_text = ?
          WHERE id = ?
      `;
    await db.execute(updateQuery, [
      ivl,
      factor,
      reps,
      lapses,
      due,
      generatedText,
      cardId,
    ]);

    console.log("Card updated successfully:", {
      ivl,
      factor,
      reps,
      lapses,
      due,
      generatedText,
    });

    res.json({
      message: "Card updated successfully",
      ivl,
      factor,
      generatedText,
    });
  } catch (err) {
    console.error("Error updating card:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
