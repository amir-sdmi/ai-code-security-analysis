const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://emaJhonShop:ci7U2ESoR999OptV@cluster0.hfhifix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productCollection = client.db("emaJohnDB").collection("products");
    // console.log(productCollection)

    app.get("/products", async (req, res) => {
      console.log("from pagination",req.query)
      const page = parseInt(req.query.page)
      const size = parseInt(req.query.size)
      console.log(page,size)
      const result = await productCollection.find()
      .skip(page*size)
      .limit(size)
      .toArray();
      // console.log(result)
      res.send(result);
    });

    app.post("/productByIds",async(req,res)=>{
      const ids = req.body
      console.log(ids)
      // const idsWithObjectId = ids.map((id)=>new Object(id))
      const idsWithObjectId = ids.map((id)=>new ObjectId(id))
      console.log(idsWithObjectId)
      const query = {
        _id : {
          $in : idsWithObjectId
        }
      }
      const result = await productCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/productsCount", async (req, res) => {
      const count = await productCollection.estimatedDocumentCount();
      console.log(count);
      res.send({ count });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!enJoy MERN");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(`server is running at http://localhost:${port}`);
});

//62-5 (Interesting) Set current page state and next prev button
//62-7 (Interesting) Load data based on the page number and size using chatGPT