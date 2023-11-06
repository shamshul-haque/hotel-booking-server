const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// parsers
app.use(
  cors({
    origin: ["http://localhost:5173/"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// connecting uri
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DD_Pass}@cluster0.gwehrjf.mongodb.net/?retryWrites=true&w=majority`;

// db connection
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    // connect collections
    const roomCollection = client.db("haven-hotelDB").collection("rooms");
    const bookingCollection = client.db("haven-hotelDB").collection("booking");

    // create apis
    app.post("/api/v1/user/create-booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // find apis
    app.get("/api/v1/rooms", async (req, res) => {
      const cursor = roomCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // cancel apis
    app.delete("/api/v1/user/cancel-booking/:bookingId", async (req, res) => {
      const id = req.params.bookingId;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
