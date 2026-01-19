import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";
import { db } from "./config"; // Import the initialized db instance
import type { Game, Player, Team, Word } from "@/types/firestore"; // Import all types
import { GameVerificationService } from "./gameVerificationService"; // Import verification service
import { generateGameCode } from "../utils/gameCode"; // Import code generation utility
import { generateWords } from '../services/geminiService';

// Add new types for turn sequence
interface Turn {
  teamId: string;
  playerId: string;
}

interface TurnSequence {
  turns: Turn[];
  currentIndex: number;
}

/**
 * Creates a new game session document in Firestore.
 * @returns {Promise<{id: string, code: string}>} The ID and code of the newly created game document.
 * @throws {Error} If there's an issue creating the document in Firestore.
 */
export async function createNewGame(): Promise<{id: string, code: string}> {
  try {
    const gamesCollectionRef = collection(db, "games");
    let code: string;
    let codeExists: boolean;

    // Generate a unique code
    do {
      code = generateGameCode();
      const codeQuery = query(gamesCollectionRef, where("code", "==", code), where("state", "!=", "finished"));
      const codeSnapshot = await getDocs(codeQuery);
      codeExists = !codeSnapshot.empty;
    } while (codeExists);

    // Prepare the initial game data
    const newGameData: Omit<Game, 'id'> = {
      code,
      state: 'lobby',
      currentRound: null,
      activeTeamId: null,
      activePlayerId: null,
      turnOrder: [],
      createdAt: serverTimestamp() as any, // Use server timestamp
      turnState: null
    };

    const docRef = await addDoc(gamesCollectionRef, newGameData);
    console.log("New game created with ID: ", docRef.id, "and code:", code);
    return { id: docRef.id, code };
  } catch (error) {
    console.error("Error creating new game:", error);
    throw new Error("Failed to create game session.");
  }
}

/**
 * Finds a game by its code.
 * @param {string} code - The game code to search for.
 * @returns {Promise<Game | null>} The game document if found, null otherwise.
 */
export async function findGameByCode(code: string): Promise<Game | null> {
  try {
    const gamesCollectionRef = collection(db, "games");
    const q = query(gamesCollectionRef, where("code", "==", code.toUpperCase()), where("state", "!=", "finished"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const gameDoc = querySnapshot.docs[0];
    return { id: gameDoc.id, ...gameDoc.data() } as Game;
  } catch (error) {
    console.error("Error finding game by code:", error);
    throw new Error("Failed to find game.");
  }
}

/**
 * Adds a host player to a game. This player will have isHost set to true.
 * @param {string} gameId - The ID of the game to add the host to.
 * @param {Pick<Player, 'name'>} playerData - The data for the new host (just name initially).
 * @returns {Promise<string>} The ID of the newly created player document.
 * @throws {Error} If there's an issue creating the document.
 */
export async function addHostToGame(gameId: string, playerData: Pick<Player, 'name'>): Promise<string> {
  try {
    const playersCollectionRef = collection(db, "games", gameId, "players");
    const newPlayerData = {
      ...playerData,
      teamId: null, // Host starts without a team but can join one
      isHost: true, // Mark this player as the host
      joinedAt: serverTimestamp() as any,
    };
    const docRef = await addDoc(playersCollectionRef, newPlayerData);
    console.log(`Host '${playerData.name}' added to game ${gameId} with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding host to game ${gameId}:`, error);
    throw new Error("Failed to add host.");
  }
}

// Potential future functions for this service:
// export async function getGame(gameId: string): Promise<Game | null> { ... }
// export async function updateGameState(gameId: string, newState: Partial<Game>) { ... }

/**
 * Adds a new player subdocument to a specific game document in Firestore.
 * @param {string} gameId - The ID of the game to add the player to.
 * @param {Pick<Player, 'name'>} playerData - The data for the new player (just name initially).
 * @returns {Promise<string>} The ID of the newly created player document.
 * @throws {Error} If there's an issue creating the document.
 */
export async function addPlayerToGame(gameId: string, playerData: Pick<Player, 'name'>): Promise<string> {
  try {
    const playersCollectionRef = collection(db, "games", gameId, "players");
    const newPlayerData = {
      ...playerData,
      teamId: null, // Player starts without a team
      isHost: false, // Assume not host by default, might need adjustment later
      joinedAt: serverTimestamp() as any,
    };
    const docRef = await addDoc(playersCollectionRef, newPlayerData);
    console.log(`Player '${playerData.name}' added to game ${gameId} with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding player to game ${gameId}:`, error);
    throw new Error("Failed to add player.");
  }
}

/**
 * Adds a new team subdocument to a specific game document in Firestore.
 * @param {string} gameId - The ID of the game to add the team to.
 * @param {Omit<Team, 'id' | 'score'>} teamData - The data for the new team (name). Score defaults to 0.
 * @returns {Promise<string>} The ID of the newly created team document.
 * @throws {Error} If there's an issue creating the document.
 */
export async function addTeamToGame(gameId: string, teamData: Omit<Team, 'id' | 'score'>): Promise<string> {
  try {
    const teamsCollectionRef = collection(db, "games", gameId, "teams");
    const newTeamData = {
      ...teamData,
      score: 0, // Initialize score to 0
    };
    const docRef = await addDoc(teamsCollectionRef, newTeamData);
    console.log(`Team '${teamData.name}' added to game ${gameId} with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding team to game ${gameId}:`, error);
    throw new Error("Failed to add team.");
  }
}

// export async function getTeamsForGame(gameId: string): Promise<Team[]> { ... }
// export async function updateTeam(gameId: string, teamId: string, teamUpdate: Partial<Team>) { ... }

/**
 * Updates a player's team assignment.
 * @param {string} gameId - The ID of the game
 * @param {string} playerId - The ID of the player to update
 * @param {string | null} teamId - The ID of the team to assign, or null to unassign
 * @returns {Promise<void>}
 * @throws {Error} If there's an issue updating the player
 */
export async function updatePlayerTeam(gameId: string, playerId: string, teamId: string | null): Promise<void> {
  try {
    const playerRef = doc(db, "games", gameId, "players", playerId);
    await updateDoc(playerRef, { teamId });
    console.log(`Updated player ${playerId} team to ${teamId || 'none'}`);
  } catch (error) {
    console.error(`Error updating player team:`, error);
    throw new Error("Failed to update player team");
  }
}

/**
 * Adds a new word to the game's word collection.
 * @param {string} gameId - The ID of the game to add the word to.
 * @param {string} playerId - The ID of the player submitting the word.
 * @param {string} wordText - The text of the word to add.
 * @param {number} wordLimit - The maximum number of words per player allowed.
 * @returns {Promise<string>} The ID of the newly created word document.
 * @throws {Error} If there's an issue adding the word.
 */
export async function addWord(gameId: string, playerId: string, wordText: string, wordLimit: number = 5): Promise<string> {
  try {
    // Check current word count for this player
    const playerWords = await getPlayerWords(gameId, playerId);
    if (playerWords.length >= wordLimit) {
      throw new Error(`You've reached the maximum limit of ${wordLimit} words per player.`);
    }
    const wordsCollectionRef = collection(db, "games", gameId, "words");
    const newWordData: Omit<Word, 'id'> = {
      text: wordText.trim(),
      submittedByPlayerId: playerId,
    };
    const docRef = await addDoc(wordsCollectionRef, newWordData);
    console.log(`Word '${wordText}' added to game ${gameId} by player ${playerId}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding word to game ${gameId}:`, error);
    throw error instanceof Error ? error : new Error("Failed to add word.");
  }
}

/**
 * Removes a word from the game's word collection.
 * @param {string} gameId - The ID of the game containing the word.
 * @param {string} wordId - The ID of the word to remove.
 * @param {string} playerId - The ID of the player attempting to remove the word (for validation).
 * @returns {Promise<void>}
 * @throws {Error} If the word doesn't exist, the player didn't submit it, or there's another issue.
 */
export async function removeWord(gameId: string, wordId: string, playerId: string): Promise<void> {
  try {
    // Get the word document to check if this player submitted it
    const wordRef = doc(db, "games", gameId, "words", wordId);
    const wordSnap = await getDoc(wordRef);
    
    if (!wordSnap.exists()) {
      throw new Error("Word not found.");
    }
    
    const wordData = wordSnap.data() as Word;
    
    // Check if this player submitted the word
    if (wordData.submittedByPlayerId !== playerId) {
      throw new Error("You can only remove words you submitted.");
    }
    
    // Delete the word document
    await deleteDoc(wordRef);
    console.log(`Word ${wordId} removed from game ${gameId} by player ${playerId}`);
  } catch (error) {
    console.error(`Error removing word from game ${gameId}:`, error);
    throw error; // Pass through the specific error
  }
}

/**
 * Gets all words submitted by a specific player.
 * @param {string} gameId - The ID of the game.
 * @param {string} playerId - The ID of the player whose words to fetch.
 * @returns {Promise<Word[]>} Array of words submitted by the player.
 */
export async function getPlayerWords(gameId: string, playerId: string): Promise<Word[]> {
  try {
    const wordsQuery = query(
      collection(db, "games", gameId, "words"),
      where("submittedByPlayerId", "==", playerId)
    );
    
    const querySnapshot = await getDocs(wordsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word));
  } catch (error) {
    console.error(`Error fetching player words for game ${gameId}:`, error);
    throw new Error("Failed to load words.");
  }
}

/**
 * Gets a count of all words in the game.
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<number>} The number of words in the game.
 */
export async function getWordCount(gameId: string): Promise<number> {
  try {
    const wordsQuery = query(collection(db, "games", gameId, "words"));
    const querySnapshot = await getDocs(wordsQuery);
    return querySnapshot.size;
  } catch (error) {
    console.error(`Error counting words for game ${gameId}:`, error);
    throw new Error("Failed to count words.");
  }
}

/**
 * Adds a set of AI-generated words to the game.
 * @param {string} gameId - The ID of the game.
 * @param {string} playerId - The ID of the player requesting AI words.
 * @param {string} description - Description of the type of words to generate (optional).
 * @param {number} count - Number of words to generate (default: 5).
 * @param {number} wordLimit - The maximum number of words per player allowed.
 * @returns {Promise<string[]>} The IDs of the newly created word documents.
 */
export async function addAIWords(
  gameId: string, 
  playerId: string, 
  description: string = '', 
  count: number = 5,
  wordLimit: number = 5
): Promise<string[]> {
  try {
    // Check current word count for this player
    const playerWords = await getPlayerWords(gameId, playerId);
    const remainingSlots = wordLimit - playerWords.length;
    if (remainingSlots <= 0) {
      throw new Error(`You've reached the maximum limit of ${wordLimit} words per player.`);
    }
    // Adjust count to not exceed the remaining slots
    const adjustedCount = Math.min(count, remainingSlots);
    // Generate words using Gemini
    const words = await generateWords(description, adjustedCount);
    // Add the words to the game
    const wordIds: string[] = [];
    for (const word of words) {
      const wordId = await addWord(gameId, playerId, word, wordLimit);
      wordIds.push(wordId);
    }
    return wordIds;
  } catch (error) {
    console.error(`Error adding AI words to game ${gameId}:`, error);
    throw error instanceof Error ? error : new Error("Failed to add AI words.");
  }
}

/**
 * Starts the game by transitioning from lobby to round1.
 * Randomly determines team turn order, sets the game state to round1,
 * and assigns the first active team and player.
 * 
 * @param {string} gameId - The ID of the game to start.
 * @returns {Promise<void>}
 * @throws {Error} If there's an issue starting the game.
 */
export async function startGame(gameId: string): Promise<void> {
  console.log("🚀 Starting game:", gameId);
  try {
    // 1. Get all teams for this game
    console.log("1️⃣ Fetching teams");
    const teams = await getTeamsForGame(gameId);
    console.log(`Teams (${teams.length}):`, teams);
    
    // 2. Get all players for this game
    console.log("2️⃣ Fetching players");
    const players = await getAllPlayers(gameId);
    console.log(`Players (${players.length}):`, players);
    
    // Fetch game settings for word limit
    const settingsRef = doc(db, "games", gameId);
    const settingsSnap = await getDoc(settingsRef);
    let wordLimit = 5;
    if (settingsSnap.exists() && settingsSnap.data().settings && typeof settingsSnap.data().settings.wordCountPerPerson === 'number') {
      wordLimit = settingsSnap.data().settings.wordCountPerPerson;
    }
    // 3. Verify game can be started
    console.log("3️⃣ Verifying game can be started");
    const verificationResult = await GameVerificationService.verifyGameCanStart(gameId, teams, players, true, wordLimit);
    if (!verificationResult.valid) {
      console.error("❌ Game validation failed:", verificationResult.errors);
      throw new Error(verificationResult.errors[0]);
    }
    console.log("✅ Game validation passed");
    
    // 4. Generate complete turn sequence
    console.log("4️⃣ Generating turn sequence");
    const shuffledTeamIds = teams.map(team => team.id).sort(() => Math.random() - 0.5);
    const turnSequence: Turn[] = [];
    
    // Create a sequence that covers all teams multiple times to ensure we have enough turns
    for (let round = 0; round < 3; round++) {
      // Get players for each team and track current player index
      const teamPlayerIndices = new Map<string, number>();
      const teamPlayers = new Map<string, Player[]>();
      
      // Initialize player arrays and indices for each team
      shuffledTeamIds.forEach(teamId => {
        const playersInTeam = players.filter(p => p.teamId === teamId);
        teamPlayers.set(teamId, playersInTeam);
        teamPlayerIndices.set(teamId, 0);
      });
      
      // Calculate how many turns we need to ensure everyone gets equal turns
      const maxPlayersInAnyTeam = Math.max(...Array.from(teamPlayers.values()).map(p => p.length));
      const totalTurnsNeeded = maxPlayersInAnyTeam * teams.length;
      
      // Generate turns for this round
      for (let turn = 0; turn < totalTurnsNeeded; turn++) {
        const teamId = shuffledTeamIds[turn % teams.length];
        const teamPlayerList = teamPlayers.get(teamId)!;
        let playerIndex = teamPlayerIndices.get(teamId)!;
        
        // If we've used all players in this team, start over
        if (playerIndex >= teamPlayerList.length) {
          playerIndex = 0;
          teamPlayerIndices.set(teamId, 0);
        }
        
        const player = teamPlayerList[playerIndex];
        turnSequence.push({ teamId, playerId: player.id });
        
        // Increment the player index for this team
        teamPlayerIndices.set(teamId, playerIndex + 1);
      }
    }
    
    console.log("Generated turn sequence:", turnSequence);
    
    // 5. Set initial turn from the sequence
    const firstTurn = turnSequence[0];
    
    // 6. Update the game document with all the new state
    console.log("6️⃣ Updating game state in Firestore");
    const gameRef = doc(db, "games", gameId);
    const updateData = {
      state: "round1",
      currentRound: 1,
      turnOrder: shuffledTeamIds,
      activeTeamId: firstTurn.teamId,
      activePlayerId: firstTurn.playerId,
      turnState: 'paused',
      turnStartTime: null,
      turnSequence: {
        turns: turnSequence,
        currentIndex: 0
      }
    };
    console.log("Update data:", updateData);
    
    await updateDoc(gameRef, updateData);
    
    console.log("✅ Game started successfully!");
  } catch (error) {
    console.error(`❌ Error starting game ${gameId}:`, error);
    throw error;
  }
}

/**
 * Retrieves all teams for a specific game.
 * 
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<Team[]>} Array of team objects.
 * @throws {Error} If there's an issue retrieving the teams.
 */
export async function getTeamsForGame(gameId: string): Promise<Team[]> {
  try {
    const teamsCollectionRef = collection(db, "games", gameId, "teams");
    const querySnapshot = await getDocs(teamsCollectionRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
  } catch (error) {
    console.error(`Error getting teams for game ${gameId}:`, error);
    throw new Error("Failed to retrieve teams.");
  }
}

/**
 * Retrieves all players assigned to a specific team.
 * 
 * @param {string} gameId - The ID of the game.
 * @param {string} teamId - The ID of the team.
 * @returns {Promise<Player[]>} Array of player objects.
 * @throws {Error} If there's an issue retrieving the players.
 */
export async function getPlayersForTeam(gameId: string, teamId: string): Promise<Player[]> {
  try {
    const playersQuery = query(
      collection(db, "games", gameId, "players"),
      where("teamId", "==", teamId)
    );
    
    const querySnapshot = await getDocs(playersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Player));
  } catch (error) {
    console.error(`Error getting players for team ${teamId} in game ${gameId}:`, error);
    throw new Error("Failed to retrieve team players.");
  }
}

/**
 * Updates the score for a team.
 * 
 * @param {string} gameId - The ID of the game.
 * @param {string} teamId - The ID of the team.
 * @param {number} points - The number of points to add (positive) or subtract (negative).
 * @returns {Promise<void>}
 * @throws {Error} If there's an issue updating the score.
 */
export async function updateTeamScore(gameId: string, teamId: string, points: number): Promise<void> {
  try {
    const teamRef = doc(db, "games", gameId, "teams", teamId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      throw new Error("Team not found.");
    }
    
    const teamData = teamSnap.data() as Team;
    const newScore = teamData.score + points;
    
    await updateDoc(teamRef, { score: newScore });
    console.log(`Updated score for team ${teamId} to ${newScore}`);
  } catch (error) {
    console.error(`Error updating score for team ${teamId}:`, error);
    throw new Error("Failed to update team score.");
  }
}

/**
 * Advances to the next team's turn.
 * 
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<void>}
 * @throws {Error} If there's an issue advancing the turn.
 */
export async function advanceToNextTeam(gameId: string): Promise<void> {
  try {
    // 1. Get current game state
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error("Game not found.");
    }
    
    const gameData = gameSnap.data() as Game & { turnSequence: TurnSequence };
    
    // 2. Get next turn from the sequence
    const nextIndex = (gameData.turnSequence.currentIndex + 1) % gameData.turnSequence.turns.length;
    const nextTurn = gameData.turnSequence.turns[nextIndex];
    
    // 3. Update game state with new team and player
    await updateDoc(gameRef, {
      activeTeamId: nextTurn.teamId,
      activePlayerId: nextTurn.playerId,
      turnState: 'paused',
      turnStartTime: null,
      'turnSequence.currentIndex': nextIndex,
      [`lastSpeakerIds.${gameData.activeTeamId}`]: gameData.activePlayerId
    });
    
    console.log(`Advanced turn to team ${nextTurn.teamId}, player ${nextTurn.playerId}`);
  } catch (error) {
    console.error(`Error advancing to next team in game ${gameId}:`, error);
    throw new Error("Failed to advance to next team.");
  }
}

/**
 * Advances to the next round (e.g., from round1 to round2).
 * Resets the active team to the first in the turn order.
 * 
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<void>}
 * @throws {Error} If there's an issue advancing the round.
 */
export async function advanceToNextRound(gameId: string): Promise<void> {
  try {
    // 1. Get current game state
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error("Game not found.");
    }
    
    const gameData = gameSnap.data() as Game & { turnSequence: TurnSequence };
    
    // 2. Determine the next round
    const currentRound = gameData.currentRound as number;
    
    if (currentRound >= 3) {
      throw new Error("Game already at final round.");
    }
    
    const nextRound = currentRound + 1;
    const nextRoundState = `round${nextRound}` as 'round1' | 'round2' | 'round3';
    
    // 3. Get next turn from the sequence
    const nextIndex = (gameData.turnSequence.currentIndex + 1) % gameData.turnSequence.turns.length;
    const nextTurn = gameData.turnSequence.turns[nextIndex];
    
    // 4. Update game state
    await updateDoc(gameRef, {
      state: nextRoundState,
      currentRound: nextRound,
      activeTeamId: nextTurn.teamId,
      activePlayerId: nextTurn.playerId,
      turnState: 'paused',
      turnStartTime: null,
      'turnSequence.currentIndex': nextIndex
    });
    
    console.log(`Advanced to round ${nextRound}`);
  } catch (error) {
    console.error(`Error advancing round in game ${gameId}:`, error);
    throw new Error("Failed to advance to next round.");
  }
}

/**
 * Ends the game, setting the state to 'finished'.
 * 
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<void>}
 * @throws {Error} If there's an issue ending the game.
 */
export async function endGame(gameId: string): Promise<void> {
  try {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, {
      state: "finished"
    });
    console.log(`Game ${gameId} marked as finished`);
  } catch (error) {
    console.error(`Error ending game ${gameId}:`, error);
    throw new Error("Failed to end game.");
  }
}

/**
 * Retrieves all words for a game.
 * 
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<Word[]>} Array of word objects.
 * @throws {Error} If there's an issue retrieving the words.
 */
export async function getAllWords(gameId: string): Promise<Word[]> {
  try {
    const wordsCollectionRef = collection(db, "games", gameId, "words");
    const querySnapshot = await getDocs(wordsCollectionRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Word));
  } catch (error) {
    console.error(`Error getting words for game ${gameId}:`, error);
    throw new Error("Failed to retrieve words.");
  }
}

/**
 * Gets a random unguessed word for the current round.
 * 
 * @param {string} gameId - The ID of the game.
 * @param {number} roundNumber - The current round number (1, 2, or 3).
 * @returns {Promise<Word | null>} A random unguessed word or null if none available.
 * @throws {Error} If there's an issue retrieving the words.
 */
export async function getRandomUnguessedWord(gameId: string, roundNumber: number): Promise<Word | null> {
  try {
    // Get all words
    const words = await getAllWords(gameId);
    
    // Filter out words already guessed in this round
    const roundField = `guessedInRound${roundNumber}` as keyof Word;
    const unguessedWords = words.filter(word => !word[roundField]);
    
    if (unguessedWords.length === 0) {
      return null; // No unguessed words remaining
    }
    
    // Select a random word from the unguessed words
    const randomIndex = Math.floor(Math.random() * unguessedWords.length);
    return unguessedWords[randomIndex];
  } catch (error) {
    console.error(`Error getting random word for game ${gameId}:`, error);
    throw new Error("Failed to get random word.");
  }
}

/**
 * Marks a word as guessed in the current round.
 * 
 * @param {string} gameId - The ID of the game.
 * @param {string} wordId - The ID of the word.
 * @param {number} roundNumber - The current round number (1, 2, or 3).
 * @returns {Promise<void>}
 * @throws {Error} If there's an issue updating the word.
 */
export async function markWordAsGuessed(gameId: string, wordId: string, roundNumber: number): Promise<void> {
  try {
    const wordRef = doc(db, "games", gameId, "words", wordId);
    const roundField = `guessedInRound${roundNumber}`;
    
    // Update the word document with the guessed status for this round
    await updateDoc(wordRef, { [roundField]: true });
    console.log(`Word ${wordId} marked as guessed in round ${roundNumber}`);
  } catch (error) {
    console.error(`Error marking word ${wordId} as guessed:`, error);
    throw new Error("Failed to mark word as guessed.");
  }
}

/**
 * Checks if all words have been guessed in the current round.
 * 
 * @param {string} gameId - The ID of the game.
 * @param {number} roundNumber - The current round number (1, 2, or 3).
 * @returns {Promise<boolean>} True if all words have been guessed in this round.
 * @throws {Error} If there's an issue checking the words.
 */
export async function areAllWordsGuessedInRound(gameId: string, roundNumber: number): Promise<boolean> {
  try {
    // Get all words
    const words = await getAllWords(gameId);
    
    if (words.length === 0) {
      return true; // No words at all, technically all are "guessed"
    }
    
    // Check if any words are not guessed in this round
    const roundField = `guessedInRound${roundNumber}` as keyof Word;
    const unguessedWords = words.filter(word => !word[roundField]);
    
    return unguessedWords.length === 0;
  } catch (error) {
    console.error(`Error checking if all words guessed in round ${roundNumber}:`, error);
    throw new Error("Failed to check word guessing status.");
  }
}

/**
 * Returns the count of words guessed and total words for a given round.
 * 
 * @param {string} gameId - The ID of the game.
 * @param {number} roundNumber - The current round number (1, 2, or 3).
 * @returns {Promise<{guessed: number, total: number}>} Object with guessed and total counts.
 * @throws {Error} If there's an issue counting the words.
 */
export async function getWordCountsForRound(gameId: string, roundNumber: number): Promise<{guessed: number, total: number}> {
  try {
    // Get all words
    const words = await getAllWords(gameId);
    const total = words.length;
    
    // Count words guessed in this round
    const roundField = `guessedInRound${roundNumber}` as keyof Word;
    const guessedWords = words.filter(word => word[roundField]);
    const guessed = guessedWords.length;
    
    return { guessed, total };
  } catch (error) {
    console.error(`Error counting words for round ${roundNumber}:`, error);
    throw new Error("Failed to count words for round.");
  }
}

/**
 * Gets the current game state including active team, active player, and current round.
 * 
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<Game>} The game object.
 * @throws {Error} If there's an issue retrieving the game.
 */
export async function getGameState(gameId: string): Promise<Game> {
  try {
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error("Game not found.");
    }
    
    return { id: gameId, ...gameSnap.data() } as Game;
  } catch (error) {
    console.error(`Error getting game state for ${gameId}:`, error);
    throw new Error("Failed to retrieve game state.");
  }
}

/**
 * Gets all players for a game.
 * 
 * @param {string} gameId - The ID of the game.
 * @returns {Promise<Player[]>} The list of players.
 */
export async function getAllPlayers(gameId: string): Promise<Player[]> {
  try {
    const playersQuery = query(collection(db, "games", gameId, "players"));
    const playersSnapshot = await getDocs(playersQuery);
    return playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
  } catch (error) {
    console.error(`Error getting all players for game ${gameId}:`, error);
    throw new Error("Failed to get all players.");
  }
}

export async function createGame(code: string): Promise<string> {
  try {
    const gamesCollection = collection(db, "games");
    const initialGameState = {
      code,
      state: "lobby" as const,
      currentRound: null,
      activeTeamId: null,
      activePlayerId: null,
      turnOrder: [],
      createdAt: serverTimestamp(),
      turnState: null
    };
    
    const docRef = await addDoc(gamesCollection, initialGameState);
    console.log("Created new game with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating game:", error);
    throw new Error("Failed to create game");
  }
}

/**
 * Updates the settings for a game.
 * @param {string} gameId - The ID of the game.
 * @param {object} settings - The settings object to update.
 * @returns {Promise<void>}
 */
export async function updateGameSettings(gameId: string, settings: { wordCountPerPerson: number; roundLengthSeconds: number; skipPenaltySeconds: number }) {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, { settings });
}
