import {
  GoogleGenerativeAIEmbeddings
} from "@langchain/google-genai";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

interface Player {
  name: string;
  university: string;
  category: string;
  totalruns: number;
  inningsplayed: number;
  ballsfaced: number;
  wickets: number;
  overbowled: number;
  runsconceded: number;
}

function generatePlayerDescription(player: Player) {
  return `${player.name} from ${player.university} is a ${player.category}. 
      He has scored ${player.totalruns} runs in ${player.inningsplayed} innings, 
      facing ${player.ballsfaced} balls. 
      He has taken ${player.wickets} wickets in ${player.overbowled} overs, 
      conceding ${player.runsconceded} runs.`;
}

async function seedDatabase(): Promise<void> {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const db = client.db("test");
    const collection = db.collection("players");
    const seededCollection = db.collection("seeded_players");

    await seededCollection.deleteMany({});
    console.log("seeded_collection cleared");

    const players = await collection.find({}).toArray();
    const recordsWithSummaries = await Promise.all(
      players.map(async (player) => ({
        pageContent: generatePlayerDescription(player as unknown as Player),
        metadata: { ...player },
      }))
    );

    console.log("recordsWithSummaries created");
    for (const record of recordsWithSummaries) {
      await MongoDBAtlasVectorSearch.fromDocuments(
        [record],
        new GoogleGenerativeAIEmbeddings({ model: "models/embedding-001" }), // Use Gemini embeddings
        {
          collection: seededCollection,
          indexName: "vector_index",
          textKey: "embedding_text",
          embeddingKey: "embedding",
        }
      );

      console.log(
        "Successfully processed & saved record:",
        record.metadata.name
      );
    }

    console.log("Database seeding completed");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
  }
}

seedDatabase().catch(console.error);
