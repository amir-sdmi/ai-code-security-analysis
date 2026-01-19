/** Dungeon Mystery by Ana Konzen
 *
 * A dungeon-crawler RPG game in your computer's terminal, using ChatGPT.
 */

import * as process from "node:process"; //Node module to control current Node process and create Streams
import * as readline from "node:readline"; //Node module to read data from a Stream
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts"; //for text colors, from Cliffy

import {
  createGame,
  createMessage,
  createDialogue,
  createEpilogue,
  createPrologue,
} from "./chats.js"; //ChatGPT prompts and other utility functions for the game

import { randomInt, splitSentences, getOverlaps } from "./util.js";

import {
  placeAt,
  renderMainCharacter,
  showCursor,
  hideCursor,
  eraseScreen,
  clearScreen,
} from "./ansi.js";

import {
  createNarrativeBox,
  createDialogueBox,
  writeMessage,
} from "./components.js";

import { Chamber } from "./chamber.js";

const numChambers = 5;
const chatHistory = [];

let level = 0;
let playerX = 0;
let playerY = 0;
let dialogueIndex = 0;

let dialogue;
let playerOverlaps;

let talkMenu = false;
let doorLocked = true;
let epilogue;
let finalChamber = false;
let firstChamber = true;

const jsonStr = await Deno.readTextFile("game_info.json");

// const gameInfo = await createGame(numChambers);
const gameInfo = JSON.parse(jsonStr);

const chambersInfo = gameInfo.chambers;

// const prologue = await createPrologue(gameInfo, numChambers);
const prologue = `${gameInfo.setting}  ${gameInfo.mystery}  ${gameInfo.finalPrize}`;
const prologueSentences = splitSentences(prologue);

chatHistory.push({
  prologue: prologue,
});

let messages = await createMessage(
  chambersInfo[level],
  gameInfo,
  chatHistory,
  numChambers
);

const chambers = createChambers();

process.stdin.resume();

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

eraseScreen();
hideCursor();

chambers[0].create();

eraseScreen();
hideCursor();

createNarrativeBox(prologueSentences, 0);

process.stdin.on("keypress", async (str, key) => {
  eraseScreen();
  hideCursor();
  if (firstChamber) {
    placeAt(0, 4);

    if (key.name === "right" && dialogueIndex < prologueSentences.length - 1) {
      dialogueIndex++;
    }
    if (key.name === "left" && dialogueIndex > 0) {
      dialogueIndex--;
    }
    createNarrativeBox(prologueSentences, dialogueIndex, "prologue");

    if (key.name === "space") {
      firstChamber = false;
      playerX = chambers[0].x + 1;
      playerY = chambers[0].y + 1;
      chambers[0].create();
      renderMainCharacter(playerX, playerY);
    }
  } else {
    let currentChamber = chambers[level];
    playerOverlaps = getOverlaps(currentChamber, playerX, playerY);
    let character = chambersInfo[level].character;
    let trust = character.trustLevel;
    clearScreen();
    writeMessage(`${level + 1}: ${chambersInfo[level].name}`);
    if (key.name === "c" || trust >= 10) {
      writeMessage(colors.green("The character gave you a key!"), 4);
      doorLocked = false;
    }
    if (!talkMenu) {
      if (key.name === "d" || key.name === "right") {
        if (!playerOverlaps.wall.right && !playerOverlaps.npc.right)
          playerX += 2;
      }

      if (key.name === "a" || key.name === "left") {
        if (!playerOverlaps.wall.left && !playerOverlaps.npc.left) playerX -= 2;
      }

      if (key.name === "s" || key.name === "down") {
        if (!playerOverlaps.wall.bottom && !playerOverlaps.npc.bottom)
          playerY++;
      }
      if (key.name === "w" || key.name === "up") {
        if (!playerOverlaps.wall.top && !playerOverlaps.npc.top) playerY--;
      }
      if (
        playerY === currentChamber.exitY &&
        playerX >= currentChamber.exitX - 3
      ) {
        if (doorLocked) {
          writeMessage(colors.red("The door is locked"), 4);
        } else {
          writeMessage(
            colors.green(
              "The door is unlocked! Press 'e' to go to the next chamber"
            ),
            4
          );
          if (key.name === "e") {
            addLevel();
            messages = await createMessage(
              chambersInfo[level],
              gameInfo,
              chatHistory,
              numChambers
            );
            doorLocked = true;
            if (finalChamber) {
              eraseScreen();
              hideCursor();
              epilogue = await createEpilogue(
                gameInfo,
                chatHistory,
                numChambers
              );
              chatHistory.push({ epilogue: epilogue });
              dialogueIndex = 0;
              talkMenu = true;
            }
          }
        }
      }
      if (
        playerY <= currentChamber.npcY + 1 &&
        playerY >= currentChamber.npcY - 1 &&
        playerX >= currentChamber.npcX - 3 &&
        playerX <= currentChamber.npcX + 2
      ) {
        writeMessage("Press 'space' to talk", 4);

        if (key.name === "space") {
          renderChambers();
          renderMainCharacter(playerX, playerY);
          dialogue = await createDialogue(
            chambersInfo[level],
            messages,
            trust,
            chatHistory,
            numChambers
          );
          hideCursor();
          dialogueIndex = 0;
          talkMenu = true;
        }
      }
    } else {
      if (key.name === "space") {
        messages.push({
          role: "user",
          content: "I had to leave, but now I'm back.",
        });
        talkMenu = false;
      }
    }
    renderChambers();

    renderMainCharacter(playerX, playerY);

    if (talkMenu && !finalChamber && !firstChamber) {
      placeAt(0, 0);
      let sentences = splitSentences(dialogue);
      if (key.name === "right" && dialogueIndex < sentences.length - 1) {
        dialogueIndex++;
      }
      if (key.name === "left" && dialogueIndex > 0) {
        dialogueIndex--;
      }
      createDialogueBox(sentences, dialogueIndex, currentChamber, character);
      if (key.name === "t") {
        dialogueIndex = 0;
        showCursor();
        placeAt(0, 43);
        let playerResponse = prompt("Your response:");
        if (key.name === "return") {
          dialogueIndex = 0;
        }
        messages.push({ role: "user", content: playerResponse });
        chatHistory.push(`Player: ${playerResponse}`);
        dialogue = await createDialogue(
          chambersInfo[level],
          messages,
          trust,
          chatHistory,
          numChambers
        );
        dialogueIndex = 0;
        hideCursor();
        placeAt(0, 0);
      }
      placeAt(0, 0);
    }

    renderChambers();

    renderMainCharacter(playerX, playerY);

    if (talkMenu && finalChamber) {
      eraseScreen();
      hideCursor();
      let epilogueSentences = splitSentences(epilogue);
      if (
        key.name === "right" &&
        dialogueIndex < epilogueSentences.length - 1
      ) {
        dialogueIndex++;
      }
      if (key.name === "left" && dialogueIndex > 0) {
        dialogueIndex--;
      }
      createNarrativeBox(epilogueSentences, dialogueIndex, "epilogue");
    }
  }
  if (key.ctrl === true && key.name === "c") {
    eraseScreen();
    showCursor();
    let chatObject = { history: chatHistory };
    let jsonStr = JSON.stringify(chatObject);
    await Deno.writeTextFile("chat_history.json", jsonStr);
    process.exit();
  }
});

function renderChambers() {
  for (let i = level; i >= 0; i--) {
    chambers[i].create();
  }
}

function addLevel() {
  level++;
  if (level > numChambers - 1) {
    level = numChambers - 1;
    finalChamber = true;
  }
}

function createChambers() {
  const chambers = [];
  let offset = 0;
  for (let i = 0; i < numChambers; i++) {
    let w = randomInt(6, 15) * 2;
    let newChamber = new Chamber(
      w,
      randomInt(10, 12),
      i + offset,
      randomInt(5, 8)
    );
    chambers.push(newChamber);
    if (i > 0) {
      newChamber.entrance = true;
      newChamber.entranceY = chambers[i - 1].exitY;
    }
    offset += w;
  }
  return chambers;
}
