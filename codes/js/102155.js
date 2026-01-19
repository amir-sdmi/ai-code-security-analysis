/** Dungeon Mystery by Ana Konzen
 *
 * A dungeon-crawler RPG game in your computer's terminal, using ChatGPT.
 */

/* globals Deno */

import { keypress } from "https://deno.land/x/cliffy@v1.0.0-rc.4/keypress/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";

import { createGame, createMessage, createDialogue, createEpilogue, createPrologue } from "./util/chats.js"; //ChatGPT prompts and other utility functions for the game

import { splitSentences, getOverlaps } from "./util/util.js";

import {
  cursorTo,
  showCursor,
  hideCursor,
  eraseScreen,
  clearScreen,
  eraseDown,
  eraseLine,
} from "./util/ansi.js";

import {
  renderNarrativeBox,
  renderDialogueBox,
  renderMessage,
  renderMenu,
  renderLandingPage,
  renderGameOverPage,
  calculateBoxHeight,
} from "./util/components.js";

import { Character } from "./util/character.js";

import { createChambers } from "./util/chamber.js";

eraseScreen();
hideCursor();

renderLandingPage();

const numChambers = 5;
const chatHistory = [];

let level = 0;
let room = 0;
let dialogueIndex = 0;
const navActions = ["[w][a][s][d] move"];
const firstListenActions = ["[>] next"];
const listenActions = ["[<] previous", "[>] next"];
const listenActionsLast = ["[<] previous", colors.magenta("[r] reply"), "[l] leave"];
const navActionsNpc = ["[w][a][s][d] move", colors.magenta("[t] talk")];
const navActionsDoor = ["[w][a][s][d] move", colors.magenta("[e] open door")];

let dialogue;
let playerOverlaps;
let trust;

const player = new Character(0, 0);

let epilogue;
let finalChamber = false;
let chamberColor = "white";
const gray = 0x808080;
const white = 0xffffff;
const cyan = 0x48d1cc;
const brown = 0xed9755;
let doorColor = brown;

const gameInfo = await createGame(numChambers);

const prologue = await createPrologue(gameInfo, numChambers);
chatHistory.push(prologue);
const prologueSentences = splitSentences(prologue);

const chambersInfo = gameInfo.chambers;
const chambers = createChambers(numChambers, chambersInfo);

chatHistory.push({
  prologue: prologue,
});

let currentChamber = chambers[0];

currentChamber.messages = await createMessage(chambersInfo[level], gameInfo, chatHistory, numChambers);
player.state = "prologue";
hideCursor();

for await (const event of keypress()) {
  eraseScreen();
  hideCursor();
  if (player.state === "prologue") {
    cursorTo(0, 4);

    //create narrative box
    if (event.key === "right" && dialogueIndex < prologueSentences.length - 1) dialogueIndex++;
    if (event.key === "left" && dialogueIndex > 0) dialogueIndex--;

    renderNarrativeBox(prologueSentences, dialogueIndex, "prologue");

    //start the main game after space if pressed
    if (dialogueIndex === prologueSentences.length - 1) {
      if (event.key === "space") startGame(currentChamber);
    }
  } else if (player.state === "navigation" || player.state === "dialogue" || player.state === "talking") {
    //game started
    clearScreen();
    cursorTo(0, 0);
    currentChamber = chambers[room]; //level defaults to 0
    player.placeInChamber(currentChamber);
    playerOverlaps = getOverlaps(currentChamber, player.x, player.y);

    const npc = chambersInfo[room].character;

    trust = npc.trustLevel ?? npc.initialTrustLevel;

    if ((event.key === "c" && !event.ctrlKey) || trust >= 10) unlockDoor(currentChamber);
    if (trust < 0 || event.key === "g") {
      player.state = "gameover";
      eraseScreen();
      renderGameOverPage();
      continue;
    }

    //if player is moving
    if (player.state === "navigation") {
      renderMenu(navActions, currentChamber);
      player.color = white;

      if (event.key === "d" || event.key === "right")
        if (!playerOverlaps.wall.right && !playerOverlaps.npc.right) player.x += 2;

      if (event.key === "a" || event.key === "left")
        if (!playerOverlaps.wall.left && !playerOverlaps.npc.left) player.x -= 2;

      if (event.key === "s" || event.key === "down")
        if (!playerOverlaps.wall.bottom && !playerOverlaps.npc.bottom) player.y++;

      if (event.key === "w" || event.key === "up")
        if (!playerOverlaps.wall.top && !playerOverlaps.npc.top) player.y--;

      if (player.isCloseToExit()) {
        renderMenu(navActionsDoor, currentChamber);
        if (!currentChamber.locked && room === level) {
          renderMessage(colors.green("The door is now unlocked!"));
        }

        if (event.key === "e") {
          if (currentChamber.locked) {
            renderMessage(colors.red("The door is locked"));
          } else {
            if (room === level) {
              await addLevel();
              if (finalChamber) {
                player.state = "epilogue";
                eraseScreen();
                hideCursor();
                epilogue = await createEpilogue(gameInfo, chatHistory, numChambers);
                let sentences = splitSentences(epilogue);
                chatHistory.push({ epilogue: epilogue });
                dialogueIndex = 0;
                renderNarrativeBox(sentences, dialogueIndex, "epilogue");
                continue;
              }
            } else {
              await goToNextRoom();
            }
          }
        }
      }

      if (player.isCloseToEntrance()) {
        renderMenu(navActionsDoor, currentChamber);
        if (event.key === "e") await goBack();
      }

      if (player.isCloseToNPC()) {
        renderMenu(navActionsNpc, currentChamber);
        if (event.key === "t") {
          hideCursor();
          await startDialogue(currentChamber);
          hideCursor();
          let sentences = splitSentences(dialogue.trust + dialogue.content);
          hideCursor();
          renderMenu(firstListenActions, currentChamber, true, sentences[dialogueIndex]);

          renderDialogueBox(sentences, dialogueIndex, currentChamber, npc);
        }
      }
    } else if (player.state === "dialogue" || player.state === "talking") {
      cursorTo(0, 0);

      let sentences = splitSentences(dialogue.trust + dialogue.content);
      if (event.key === "right" && dialogueIndex < sentences.length - 1) dialogueIndex++;
      if (event.key === "left" && dialogueIndex > 0) dialogueIndex--;
      if (dialogueIndex === 0) {
        renderMenu(firstListenActions, currentChamber, true, sentences[dialogueIndex]);
      } else {
        renderMenu(listenActions, currentChamber, true, sentences[dialogueIndex]);
      }

      renderDialogueBox(sentences, dialogueIndex, currentChamber, npc);

      if (dialogueIndex === sentences.length - 1) {
        renderMenu(listenActionsLast, currentChamber, true, sentences[dialogueIndex]);

        if (event.key === "r") {
          renderDialogueBox(sentences, dialogueIndex, currentChamber, npc);

          startTalking();
          player.state = "talking";
          player.color = white;
          cursorTo(1, calculateBoxHeight(sentences[sentences.length - 1]));
          eraseLine();
          const playerResponse = await Input.prompt({ message: "Your response:", prefix: "" });
          await finishTalking(playerResponse, currentChamber);
          eraseDown();
          hideCursor();
        }
        renderMenu(listenActionsLast, currentChamber, true, sentences[dialogueIndex]);
        if (dialogueIndex === 0) {
          renderMenu(firstListenActions, currentChamber, true, sentences[dialogueIndex]);
        }
        sentences = splitSentences(dialogue.trust + dialogue.content);
        renderDialogueBox(sentences, dialogueIndex, currentChamber, npc);

        if (event.key === "l") {
          leaveDialogue(currentChamber);
          clearScreen();
          renderMenu(navActionsNpc, currentChamber);
        }
      }

      cursorTo(0, 0);
    }

    renderChambers();
    player.render();
  } else if (player.state === "epilogue") {
    eraseScreen();
    hideCursor();
    const epilogueSentences = splitSentences(epilogue);
    if (event.key === "right" && dialogueIndex < epilogueSentences.length - 1) dialogueIndex++;

    if (event.key === "left" && dialogueIndex > 0) dialogueIndex--;

    renderNarrativeBox(epilogueSentences, dialogueIndex, "epilogue");
  } else if (player.state === "gameover") {
    clearScreen();
    renderGameOverPage();
  }
  if (event.ctrlKey && event.key === "c") {
    await endGame();
    break;
  }
}

function renderChambers() {
  // if (finalChamber) return;
  for (let i = level; i >= 0; i--) {
    if (i === room) {
      chambers[i].color = chamberColor;
      chambers[i].doorColor = doorColor;
      chambers[i].npcColor = cyan;
    } else {
      chambers[i].color = "gray";
      chambers[i].doorColor = gray;
      chambers[i].npcColor = gray;
    }
    chambers[i].render();
  }
}

async function addLevel() {
  level++;
  if (level > numChambers - 1) {
    finalChamber = true;
    return;
  }
  chambers[level].messages = await createMessage(chambersInfo[level], gameInfo, chatHistory, numChambers);
  goToNextRoom();
}

async function goToNextRoom() {
  currentChamber.openExit();
  room++;
  if (room > numChambers - 1) room = numChambers - 1;
  chambers[room].openEntrance();
}

async function goBack() {
  currentChamber.openEntrance();
  room--;
  if (room < 0) room = 0;
  chambers[room].openExit();
}

async function endGame(clear = true) {
  if (clear) eraseScreen();
  showCursor();
  let chatObject = { history: chatHistory };
  let jsonStr = JSON.stringify(chatObject);
  await Deno.writeTextFile("src/game_info/chat_history.json", jsonStr);
}

function unlockDoor(chamber) {
  if (chamber.locked) renderMessage(colors.green("You received a key!"));
  chamber.locked = false;
}

async function startDialogue(chamber) {
  hideCursor();
  chamberColor = "gray";
  doorColor = gray;
  player.color = gray;
  renderChambers();
  player.render();
  dialogue = await createDialogue(chambersInfo[room], chamber.messages, trust, chatHistory, numChambers);
  player.state = "dialogue";

  dialogueIndex = 0;
}

function startGame(currentChamber) {
  player.state = "navigation";
  player.x = chambers[0].x + 1;
  player.y = chambers[0].y + 1;
  chambers[0].render();
  player.render();
  renderMenu(navActions, currentChamber);
}

function leaveDialogue(chamber) {
  player.state = "navigation";
  chamberColor = "white";
  doorColor = brown;
  player.color = white;
  chamber.messages.push({
    role: "user",
    content: "Hello, I'm back. We can now continue our conversation where we left off.",
  });
}

async function startTalking() {
  player.color = white;
  player.state = "talking";
  renderChambers();
  player.render();
  dialogueIndex = 0;
  cursorTo(1, 43);
  showCursor();
}

async function finishTalking(playerResponse, chamber) {
  hideCursor();
  player.state = "dialogue";
  player.color = gray;
  dialogueIndex = 0;
  chamber.messages.push({ role: "user", content: playerResponse });
  chatHistory.push(`Player: ${playerResponse}`);
  dialogue = await createDialogue(chambersInfo[room], chamber.messages, trust, chatHistory, numChambers);
  trust = chambersInfo[room].character.trustLevel;
  cursorTo(0, 0);
}
