require("dotenv").config();
import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import { connectDB } from "./db";
import Ladder from "./models/Ladder";

connectDB();

const askChatGPT = async (message: string) => {
  try {
    // Make a request to the OpenAI API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // Use the desired model
        messages: [{ role: "user", content: message }], // Send user's message to ChatGPT
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Use the API key from the .env file
        },
      }
    );

    // Extract and send the response from ChatGPT back to the user
    const chatResponse = response.data.choices[0].message.content;
    return chatResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error communicating with ChatGPT:", error.response?.data);
    } else {
      console.error("Error communicating with ChatGPT:", error);
    }
    return "";
  }
};

const absurdWeaponsList = [
  "грязные трусы",
  "вяленая рыба",
  "плевок",
  "ружье деда",
  "ВИЧ-инфицированная акула",
  "BFG9000",
  "обидные оскорбления",
  "гниющий бутерброд",
  "смертельный пук",
  "освежитель воздуха с запахом кошачьей мочи",
  "спущенная шина",
  "газета с вчерашними новостями",
  "радиоактивный картофель",
  "кусочек заплесневелого сыра",
  "электрический носок",
  "водяной пистолет с кислой водой",
  "канцелярская кнопка на стуле",
  "удар тапком от бабушки",
  "невидимый кирпич",
  "кошачий коготь в носке",
];

type Player = {
  id: number;
  name: string;
  health: number;
  powerMin: number;
  powerMax: number;
  defense: number;
  critical: number;
  evasion: number;
};

const getRandomItem = (list: string[]) =>
  list[Math.floor(Math.random() * list.length)];

const getNormalPrompt = (name1: string, name2: string, weapon: string) =>
  `Опиши смешно используя 1 короткое предложение. Идет драка, человек по имени ${name1} атакует человека по имени ${name2} используя в качестве оружия ${weapon}. ${name2} получает серьезные повреждения`;

const getHitEvasionPrompt = (name1: string, name2: string, weapon: string) =>
  `Опиши смешно используя 1 короткое предложение. Идет драка, человек по имени ${name1} атакует человека по имени ${name2} используя в качестве оружия ${weapon}, но ${name2} уклоняется и не получает повреждений`;

const getKillingPrompt = (name1: string, name2: string, weapon: string) =>
  `Опиши смешно используя 2 короткое предложение. Идет драка, человек по имени ${name1} смертельно атакует человека по имени ${name2} используя в качестве оружия ${weapon}, и ${name2} погибает ужасным образом`;

const getDyingPrompt = (name1: string, name2: string, weapon: string) =>
  `Опиши смешно используя 1 короткое предложение. Идет драка, человек по имени ${name1} атакует человека по имени ${name2} используя в качестве оружия ${weapon}, но промахивается`;

// а вот тут у нас вся механика этой эбической баталии описана
const performRound = async (player1: Player, player2: Player) => {
  let p1text;
  let p2text;

  // ты ловкий штоле?
  const p2evaded = Math.random() * 100 < player2.evasion;
  let p1dmg = p2evaded
    ? 0
    : player1.powerMin +
      Math.floor(Math.random() * (player1.powerMax - player1.powerMin + 1));

  if (p1dmg === 0) {
    // промахнулся
    p1text = await askChatGPT(
      getHitEvasionPrompt(
        player1.name,
        player2.name,
        getRandomItem(absurdWeaponsList)
      )
    );
  } else {
    // тогда вычитаем урон из хп
    const p2health = player2.health - p1dmg;
    // p2 погиб и ходить не будет
    if (p2health <= 0) {
      // в статистику одному поражение, второму победу, главное не перепутать
      await Ladder.findOneAndUpdate(
        { fighter: player2.name },
        { $inc: { loses: 1 } },
        { upsert: true }
      );
      await Ladder.findOneAndUpdate(
        { fighter: player1.name },
        { $inc: { wins: 1 } },
        { upsert: true }
      );

      return {
        p1dmg,
        p2dmg: 0,
        p1text: await askChatGPT(
          getKillingPrompt(
            player1.name,
            player2.name,
            getRandomItem(absurdWeaponsList)
          )
        ),
        p2text: "",
      };
    } else {
      // не погиб а просто подамажился
      p1text = await askChatGPT(
        getNormalPrompt(
          player1.name,
          player2.name,
          getRandomItem(absurdWeaponsList)
        )
      );
    }
  }

  // если мы дошли до сюда, то второй игрок еще жив, а текст первого готов и лежит в p1text
  const p1evaded = Math.random() * 100 < player1.evasion;
  const p2dmg = p1evaded
    ? 0
    : player2.powerMin +
      Math.floor(Math.random() * (player2.powerMax - player2.powerMin + 1));

  if (p2dmg === 0) {
    // промахнулся
    p2text = await askChatGPT(
      getHitEvasionPrompt(
        player2.name,
        player1.name,
        getRandomItem(absurdWeaponsList)
      )
    );
  } else {
    // тогда вычитаем урон из хп
    const p1health = player1.health - p2dmg;
    // погиб, всё уже посчитано
    if (p1health <= 0) {
      // ну как же так, Хабиб?
      await Ladder.findOneAndUpdate(
        { fighter: player1.name },
        { $inc: { loses: 1 } },
        { upsert: true }
      );
      await Ladder.findOneAndUpdate(
        { fighter: player2.name },
        { $inc: { wins: 1 } },
        { upsert: true }
      );

      return {
        p1dmg,
        p2dmg,
        p1text,
        p2text: await askChatGPT(
          getKillingPrompt(
            player2.name,
            player1.name,
            getRandomItem(absurdWeaponsList)
          )
        ),
      };
    } else {
      // не погиб а просто подамажился
      p2text = await askChatGPT(
        getNormalPrompt(
          player2.name,
          player1.name,
          getRandomItem(absurdWeaponsList)
        )
      );
    }
  }

  // оба живы, весь текст и дамаг посчитан
  return { p1dmg, p2dmg, p1text, p2text };
};

const app = express();
const port = 3092;

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

app.post("/api/fight", async (req: Request, res: Response) => {
  const { fighter1, fighter2 } = req.body;

  const player1 = fighter1;
  const player2 = fighter2;

  // Validate the request body
  if (!fighter1 || !fighter2) {
    return res.status(400).send("Both fighter1 and fighter2 are required");
  }

  // players turn
  const round = await performRound(player1, player2);

  res.json(round);
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body; // Get the user's message from the request body

  return res.json({ response: await askChatGPT(message) });
});

app.post("/api/ladder/:fighter", async (req, res) => {
  try {
    const { fighter } = req.params;
    const { wins, loses } = req.body;

    const updatedFighter = await Ladder.findOneAndUpdate(
      { fighter },
      { wins, loses },
      { new: true, runValidators: true, upsert: true }
    );

    if (!updatedFighter) {
      return res.status(404).json({ message: "Fighter not found" });
    }

    res.status(200).json(updatedFighter);
  } catch (error) {
    res.status(400).json({ message: "Error updating fighter", error });
  }
});

app.get("/api/ladder", async (req, res) => {
  try {
    const fighters = await Ladder.find().sort({ wins: -1 }); // Sorting by wins in descending order
    res.status(200).json(fighters);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ladder", error });
  }
});

app.post("/api/ladder-reset", async (req, res) => {
  try {
    await Ladder.deleteMany(); // This removes all documents from the Ladder collection
    res
      .status(200)
      .json({ message: "Ladder has been reset, all fighters removed." });
  } catch (error) {
    res.status(500).json({ message: "Error resetting the ladder", error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
