import express, { Express, Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import { Card, Deck, User } from './types';
import { generateFlashcards } from './services/aiService';

const cors = require('cors');

dotenv.config();

const PORT = process.env.PORT;

const app: Application = express();

// CORS middleware configuration
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Add middleware to parse JSON bodies
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri: string = process.env.MONGODB_URI || '';
const DB_NAME: string = process.env.MONGODB_NAME || '';
const DB_COLLECTION: string = process.env.MONGODB_COLLECTION_NAME || '';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB once at startup
let database: any;

async function connectToDatabase() {
  try {
    await client.connect();
    database = client.db(DB_NAME);
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
    process.exit(1);
  }
}

// Create User route
app.post('/api/createUser', async (req: Request, res: Response) => {
  try {
    const { userID }: { userID: string } = req.body;

    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ userID });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const newUser: User = {
      userID,
      decks: []
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
      insertedId: result.insertedId
    });
    return;
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete User route
app.delete('/api/deleteUser', async (req: Request, res: Response) => {
  try {
    const { userID }: { userID: string } = req.body;

    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Check if user exists before deletion
    const user = await usersCollection.findOne({ userID });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete the user
    const result = await usersCollection.deleteOne({ userID });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'User deleted successfully' });
      return;
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
      return;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Create Deck route with ChatGPT integration
app.post('/api/createDeck', async (req: Request, res: Response) => {
  try {
    const { userID, title, colour, num_cards, content }: {
      userID: string;
      title: string;
      colour: string;
      num_cards: number;
      content: string;
    } = req.body;

    // Validate required fields
    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Valid title is required' });
      return;
    }

    if (!colour || typeof colour !== 'string') {
      res.status(400).json({ error: 'Valid colour is required' });
      return;
    }

    if (num_cards === undefined || typeof num_cards !== 'number') {
      res.status(400).json({ error: 'Valid num_cards is required' });
      return;
    }

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Valid content is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Check if user exists
    const user = await usersCollection.findOne({ userID });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    try {
      // Generate flashcards using the AI service
      const cards = await generateFlashcards(content, num_cards);

      // Create new deck object with the generated cards
      const newDeck: Deck = {
        _id: new ObjectId(),
        title,
        colour,
        num_cards,
        cards,
        created_at: new Date()
      };

      // Add deck to user's decks array
      const result = await usersCollection.updateOne(
        { userID },
        { $push: { decks: newDeck } }
      );

      if (result.modifiedCount === 0) {
        res.status(500).json({ error: 'Failed to add deck to user' });
        return;
      }

      res.status(201).json({
        message: 'Deck created successfully',
        deck: newDeck
      });
      return;
    } catch (aiError) {
      console.error("AI Service error:", aiError);
      res.status(500).json({ error: 'Failed to generate flashcards' });
      return;
    }
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Generate deck route - does not require userID or save to database
app.post('/api/generateDeck', async (req: Request, res: Response) => {
  try {
    const { num_cards, content }: {
      num_cards: number;
      content: string;
    } = req.body;

    if (num_cards === undefined || typeof num_cards !== 'number') {
      res.status(400).json({ error: 'Valid num_cards is required' });
      return;
    }

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Valid content is required' });
      return;
    }

    try {
      // Generate flashcards using the AI service
      const cards = await generateFlashcards(content, num_cards);

      // Create new deck object with the generated cards but don't save to database
      const generatedDeck: Deck = {
        _id: new ObjectId(), // Generate an ID for consistency but it won't be stored
        title: 'Generated Deck', // Default title
        colour: 'blue', // Default colour
        num_cards,
        cards,
        created_at: new Date()
      };

      // Return the generated deck without saving
      res.status(200).json({
        message: 'Flashcards generated successfully',
        deck: generatedDeck
      });
      return;
    } catch (aiError) {
      console.error("AI Service error:", aiError);
      res.status(500).json({ error: 'Failed to generate flashcards' });
      return;
    }
  } catch (error) {
    console.error('Error generating deck:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Get User Decks route
app.get('/api/getUserDecks/:userID', async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;

    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Find the user by ID
    const user = await usersCollection.findOne({ userID });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return the decks array
    res.status(200).json({
      message: 'Decks retrieved successfully',
      decks: user.decks || []
    });
    return;
  } catch (error) {
    console.error('Error retrieving user decks:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Get Deck by ID route
app.get('/api/getDeck/:userID/:deckID', async (req: Request, res: Response) => {
  try {
    const { userID, deckID } = req.params;

    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    if (!deckID || typeof deckID !== 'string') {
      res.status(400).json({ error: 'Valid deckID is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Find the user by ID
    const user = await usersCollection.findOne({ userID });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find the deck by ID within the user's decks array
    const deck = user.decks.find((d: Deck) => d._id && d._id.toString() === deckID);

    if (!deck) {
      res.status(404).json({ error: 'Deck not found' });
      return;
    }


    // Return the deck
    res.status(200).json({
      message: 'Deck retrieved successfully',
      deck
    });
    return;
  } catch (error) {
    console.error('Error retrieving deck:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Edit a card in a deck
app.put('/api/card/:userID/:deckID/:cardIndex', async (req: Request, res: Response) => {
  try {
    const { userID, deckID, cardIndex } = req.params;
    const { question, answer } = req.body;
    const cardIdx = parseInt(cardIndex);

    // Validate required parameters
    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    if (!deckID || typeof deckID !== 'string') {
      res.status(400).json({ error: 'Valid deckID is required' });
      return;
    }

    if (isNaN(cardIdx) || cardIdx < 0) {
      res.status(400).json({ error: 'Valid card index is required' });
      return;
    }

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    if (!answer || typeof answer !== 'string') {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Find the user
    const user = await usersCollection.findOne({ userID });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find deck index
    const deckIndex = user.decks.findIndex((d: Deck) => d._id && d._id.toString() === deckID);

    // Check if card index is valid
    if (cardIdx >= user.decks[deckIndex].cards.length) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    // Create the update operation for MongoDB
    const updatePath = `decks.${deckIndex}.cards.${cardIdx}`;
    const updateOperation = {
      $set: {
        [`${updatePath}.question`]: question,
        [`${updatePath}.answer`]: answer
      }
    };

    // Update the card
    const result = await usersCollection.updateOne({ userID }, updateOperation);

    if (result.modifiedCount === 0) {
      res.status(500).json({ error: 'Failed to update card' });
      return;
    }

    // Get the updated deck
    const updatedUser = await usersCollection.findOne({ userID });
    const updatedDeck = updatedUser.decks[deckIndex];

    res.status(200).json({
      message: 'Card updated successfully',
      card: updatedDeck.cards[cardIdx],
      deck: updatedDeck
    });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Delete a card from a deck
app.delete('/api/card/:userID/:deckID/:cardIndex', async (req: Request, res: Response) => {
  try {
    const { userID, deckID, cardIndex } = req.params;
    const cardIdx = parseInt(cardIndex);

    // Validate required parameters
    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    if (!deckID || typeof deckID !== 'string') {
      res.status(400).json({ error: 'Valid deckID is required' });
      return;
    }

    if (isNaN(cardIdx) || cardIdx < 0) {
      res.status(400).json({ error: 'Valid card index is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Find the user
    const user = await usersCollection.findOne({ userID });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find deck index
    const deckIndex = user.decks.findIndex((d: Deck) => d._id && d._id.toString() === deckID);

    if (deckIndex === -1) {
      res.status(404).json({ error: 'Deck not found' });
      return;
    }

    // Check if card index is valid
    if (cardIdx >= user.decks[deckIndex].cards.length) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    // Create the update operation for MongoDB
    const updatePath = `decks.${deckIndex}.cards`;
    const updateOperation = {
      $pull: {
        [updatePath]: { $position: cardIdx }
      }
    };

    // Alternative approach using array filtering
    const deck = user.decks[deckIndex];
    const updatedCards = [
      ...deck.cards.slice(0, cardIdx),
      ...deck.cards.slice(cardIdx + 1)
    ];

    // Update the cards array and the num_cards value
    const result = await usersCollection.updateOne(
      { userID, "decks._id": new ObjectId(deckID) },
      {
        $set: {
          [`decks.${deckIndex}.cards`]: updatedCards,
          [`decks.${deckIndex}.num_cards`]: updatedCards.length
        }
      }
    );

    if (result.modifiedCount === 0) {
      res.status(500).json({ error: 'Failed to delete card' });
      return;
    }

    // Get the updated deck
    const updatedUser = await usersCollection.findOne({ userID });
    const updatedDeck = updatedUser.decks[deckIndex];

    res.status(200).json({
      message: 'Card deleted successfully',
      deck: updatedDeck
    });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Add a new card to a deck (modified to add card to the beginning)
app.post('/api/card/:userID/:deckID', async (req: Request, res: Response) => {
  try {
    const { userID, deckID } = req.params;
    const { question, answer } = req.body;

    // Validate required parameters
    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    if (!deckID || typeof deckID !== 'string') {
      res.status(400).json({ error: 'Valid deckID is required' });
      return;
    }

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    if (!answer || typeof answer !== 'string') {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Find the user
    const user = await usersCollection.findOne({ userID });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find deck index
    const deckIndex = user.decks.findIndex((d: Deck) => d._id && d._id.toString() === deckID);

    if (deckIndex === -1) {
      res.status(404).json({ error: 'Deck not found' });
      return;
    }

    // Create new card
    const newCard: Card = {
      question,
      answer
    };

    // Add the new card to the beginning of the deck
    const result = await usersCollection.updateOne(
      { userID, "decks._id": new ObjectId(deckID) },
      { 
        $push: { 
          [`decks.${deckIndex}.cards`]: { 
            $each: [newCard],  // The card to add
            $position: 0       // Insert at the beginning (position 0)
          }
        },
        $inc: { [`decks.${deckIndex}.num_cards`]: 1 }
      }
    );

    if (result.modifiedCount === 0) {
      res.status(500).json({ error: 'Failed to add card' });
      return;
    }

    // Get the updated deck
    const updatedUser = await usersCollection.findOne({ userID });
    const updatedDeck = updatedUser.decks[deckIndex];

    res.status(201).json({
      message: 'Card added successfully',
      card: newCard,
      deck: updatedDeck
    });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Delete Deck route
app.delete('/api/deck/:userID/:deckID', async (req: Request, res: Response) => {
  try {
    const { userID, deckID } = req.params;

    // Validate required parameters
    if (!userID || typeof userID !== 'string') {
      res.status(400).json({ error: 'Valid userID is required' });
      return;
    }

    if (!deckID || typeof deckID !== 'string') {
      res.status(400).json({ error: 'Valid deckID is required' });
      return;
    }

    const usersCollection = database.collection(DB_COLLECTION);

    // Find the user
    const user = await usersCollection.findOne({ userID });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find and remove the deck with matching ID
    const result = await usersCollection.updateOne(
      { userID },
      { $pull: { decks: { _id: new ObjectId(deckID) } } }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({ error: 'Deck not found or already deleted' });
      return;
    }

    res.status(200).json({
      message: 'Deck deleted successfully'
    });
    return;
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Connect to database before starting server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
});