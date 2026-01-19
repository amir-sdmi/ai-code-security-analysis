import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, deleteDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Game, Round, Trick, Card, Player } from './game.service';

//the code in this section was largely written by chatgpt
// here is the link to the firbase project:
// https://console.firebase.google.com/u/0/project/lexemwellioeuchre/overview
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  firestore: Firestore = inject(Firestore);

  async saveGame(game: Game): Promise<void> {
    try {
      const gameCollection = collection(this.firestore, 'games');
  
      // Add the game document (basic game details)
      const gameDocRef = await addDoc(gameCollection, {
        roundCounter: game.roundCounter,
        score: game.score,
        timestamp: serverTimestamp(), // Add the timestamp
      });
  
      console.log('Game document created:', gameDocRef.id);
  
      // Save players as a subcollection
      const playersCollection = collection(gameDocRef, 'players');
      for (const player of game.players) {
        await setDoc(doc(playersCollection, player.index.toString()), {
          name: player.name,
          index: player.index,
        });
      }
  
      // Save the current round as a subcollection
      const roundsCollection = collection(gameDocRef, 'rounds');
      const roundDocRef = await addDoc(roundsCollection, {
        kittyCard: {
          suit: game.currentRound.kittyCard.suit,
          rank: game.currentRound.kittyCard.rank,
          photo: game.currentRound.kittyCard.photo,
        },
        dealer: {
          name: game.currentRound.dealer.name,
          index: game.currentRound.dealer.index,
        },
        caller: game.currentRound.caller
          ? {
              name: game.currentRound.caller.name,
              index: game.currentRound.caller.index,
            }
          : null,
        outPlayer: game.currentRound.outPlayer
          ? {
              name: game.currentRound.outPlayer.name,
              index: game.currentRound.outPlayer.index,
            }
          : null,
        trumpSuit: game.currentRound.trumpSuit,
        trickCounter: game.currentRound.trickCounter,
        tricksWon: game.currentRound.tricksWon,
        tricksWonPlayer: [...game.currentRound.tricksWonPlayer],
        passTrumpCount: game.currentRound.passTrumpCount,
        switchTime: game.currentRound.switchTime,
      });
  
      // Save the current trick as a subcollection
      const tricksCollection = collection(roundDocRef, 'tricks');
      await addDoc(tricksCollection, {
        leadPlayer: {
              name: game.currentRound.currentTrick.leadPlayer!.name,
              index: game.currentRound.currentTrick.leadPlayer!.index,
            },
        cardLed: game.currentRound.currentTrick.cardLed
          ? {
              suit: game.currentRound.currentTrick.cardLed.suit,
              rank: game.currentRound.currentTrick.cardLed.rank,
              photo: game.currentRound.currentTrick.cardLed.photo,
            }
          : null,
        cardsPlayed: game.currentRound.currentTrick.cardsPlayed.map((card) =>
          card
            ? {
                suit: card.suit,
                rank: card.rank,
                photo: card.photo,
              }
            : null
        ),
        currentPlayer: {
              name: game.currentRound.currentTrick.currentPlayer!.name,
              index: game.currentRound.currentTrick.currentPlayer!.index,
            },
        playedCounter: game.currentRound.currentTrick.playedCounter,
      });
      
        // Save each player's hand as a document
      const handsCollection = collection(roundDocRef, 'hands');
      for (let playerIndex = 0; playerIndex < game.currentRound.hands.length; playerIndex++) {
        const playerHand = game.currentRound.hands[playerIndex];
        
        // Store the hand as a document containing a list of cards
        await setDoc(doc(handsCollection, playerIndex.toString()), {
          cards: playerHand.map((card) => ({
            suit: card.suit,
            rank: card.rank,
            photo: card.photo,
          })),
        });
      }

  
      console.log('Game saved successfully.');
    } catch (error) {
      console.error('Error saving game:', error);
      throw error;
    }
  }

  async getGame(gameId: string): Promise<Game | null> {
    try {
      // Reference the game document
      const gameDocRef = doc(this.firestore, 'games', gameId);
      const gameDocSnap = await getDoc(gameDocRef);
  
      if (!gameDocSnap.exists()) {
        console.error('Game not found');
        return null;
      }
  
      // Basic game details
      const gameData = gameDocSnap.data();
      const game: Game = {
        players: [],
        roundCounter: gameData['roundCounter'],
        score: gameData['score'],
        currentRound: {} as Round, // Placeholder for now
        //winner: gameData['winner'], // added by EJW
      };
  
      // Fetch players subcollection
      const playersCollection = collection(gameDocRef, 'players');
      const playersSnap = await getDocs(playersCollection);
      const players: Player[] = playersSnap.docs.map((docSnap) => {
        const playerData = docSnap.data();
        return {
          name: playerData['name'],
          index: playerData['index'],
          isBot: playerData['isBot'],
        };
      });
      game.players = players;
  
      // Fetch rounds subcollection
      const roundsCollection = collection(gameDocRef, 'rounds');
      const roundsSnap = await getDocs(roundsCollection);
  
      if (roundsSnap.empty) {
        console.error('No rounds found');
        return null;
      }
  
      const currentRoundDoc = roundsSnap.docs[roundsSnap.docs.length - 1]; // Assuming the current round is the latest round
      const roundData = currentRoundDoc.data();
  
      // Fetch tricks subcollection
      const tricksCollection = collection(currentRoundDoc.ref, 'tricks');
      const tricksSnap = await getDocs(tricksCollection);
      const trickData = tricksSnap.docs[0].data(); // Assuming only the current trick is stored
  
      // Map current trick
      const currentTrick: Trick = {
        cardsPlayed: trickData['cardsPlayed'].map((card: any) =>
          card
            ? {
                suit: card['suit'],
                rank: card['rank'],
                photo: card['photo'],
              }
            : null
        ),
        leadPlayer:  {
              name: trickData['leadPlayer']['name'],
              index: trickData['leadPlayer']['index'],
              isBot: trickData['leadPlayer']['isBot'],
            },
        cardLed: trickData['cardLed']
          ? {
              suit: trickData['cardLed']['suit'],
              rank: trickData['cardLed']['rank'],
              photo: trickData['cardLed']['photo'],
            }
          : null,
        currentPlayer: {
              name: trickData['currentPlayer']['name'],
              index: trickData['currentPlayer']['index'],
              isBot: trickData['currentPlayer']['index'],
            },
        playedCounter: trickData['playedCounter'],
      };
  
      // Fetch hands collection
      const handsCollection = collection(currentRoundDoc.ref, 'hands');
      const handsSnap = await getDocs(handsCollection);
  
      const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []]; // Assuming 4 players
      handsSnap.docs.forEach((docSnap) => {
        const playerIndex = parseInt(docSnap.id, 10);
        const handData = docSnap.data();
        hands[playerIndex] = handData['cards'].map((card: any) => ({
          suit: card['suit'],
          rank: card['rank'],
          photo: card['photo'],
        }));
      });
  
      // Assemble the current round
      game.currentRound = {
        hands,
        kittyCard: {
          suit: roundData['kittyCard']['suit'],
          rank: roundData['kittyCard']['rank'],
          photo: roundData['kittyCard']['photo'],
        },
        dealer: {
          name: roundData['dealer']['name'],
          index: roundData['dealer']['index'],
          isBot: roundData['dealer']['index'],
        },
        caller: roundData['caller']
          ? {
              name: roundData['caller']['name'],
              index: roundData['caller']['index'],
              isBot: roundData['dealer']['index'],
            }
          : null,
        outPlayer: roundData['outPlayer']
          ? {
              name: roundData['outPlayer']['name'],
              index: roundData['outPlayer']['index'],
              isBot: roundData['dealer']['index'],
            }
          : null,
        trumpSuit: roundData['trumpSuit'],
        trickCounter: roundData['trickCounter'],
        currentTrick,
        tricksWon: roundData['tricksWon'],
        tricksWonPlayer: roundData['tricksWonPlayer'],
        passTrumpCount: roundData['passTrumpCount'],
        switchTime: roundData['switchTime'],
      };
  
      // Delete all related documents and collections
      await Promise.all(playersSnap.docs.map((docSnap) => deleteDoc(docSnap.ref))); // Delete all players
      await Promise.all(
        roundsSnap.docs.map(async (roundDoc) => {
          // Delete tricks subcollection
          const tricksCollection = collection(roundDoc.ref, 'tricks');
          const tricksSnap = await getDocs(tricksCollection);
          await Promise.all(tricksSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)));
  
          // Delete hands subcollection
          const handsCollection = collection(roundDoc.ref, 'hands');
          const handsSnap = await getDocs(handsCollection);
          await Promise.all(handsSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)));
  
          // Delete the round document itself
          await deleteDoc(roundDoc.ref);
        })
      );
  
      // Finally, delete the main game document
      await deleteDoc(gameDocRef);
  
      console.log('Game and all related documents deleted successfully.');
      return game;
    } catch (error) {
      console.error('Error loading and deleting game:', error);
      throw error;
    }
  }
  
  
  async getAllGames(): Promise<{ gameId: string, timestamp: any, players: Player[] }[]> {
    try {
      // Reference to the 'games' collection
      const gamesCollection = collection(this.firestore, 'games');

      // Retrieve all game documents from Firestore
      const gamesSnapshot = await getDocs(gamesCollection);

      const gamesList: { gameId: string, timestamp: any, players: Player[] }[] = [];

      // Iterate through all the games in the snapshot
      for (const gameDoc of gamesSnapshot.docs) {
        const gameData = gameDoc.data();

        // Get the game ID
        const gameId = gameDoc.id;

        // Get the timestamp of the game
        const timestamp = gameData['timestamp'];

        // Retrieve players subcollection for each game
        const playersCollection = collection(gameDoc.ref, 'players');
        const playersSnapshot = await getDocs(playersCollection);

        const players: Player[] = [];
        playersSnapshot.forEach(playerDoc => {
          players.push(playerDoc.data() as Player);
        });

        // Add the game information to the list
        gamesList.push({ gameId, timestamp, players });
      }

      return gamesList;
    } catch (error) {
      console.error('Error retrieving games:', error);
      return [];
    }
  }

}