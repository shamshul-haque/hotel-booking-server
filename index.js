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
    origin: [
      "https://hotel-booking-57ae2.web.app",
      "https://hotel-booking-57ae2.firebaseapp.com",
    ],
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

// middleware for verify token
const verifyToken = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  jwt.verify(token, process.env.Secret_Token, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.user = decode;
    next();
  });
};

async function run() {
  try {
    // await client.connect();

    // db collections
    const roomCollection = client.db("haven-hotelDB").collection("rooms");
    const bookingCollection = client.db("haven-hotelDB").collection("booking");
    const reviewCollection = client.db("haven-hotelDB").collection("review");

    // post operation for access token
    app.post("/api/v1/auth/access-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.Secret_Token, {
        expiresIn: 60 * 60,
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // post operation for create booking
    app.post("/api/v1/user/create-booking", verifyToken, async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // post operation for create reviews
    app.post("/api/v1/user/review", async (req, res) => {
      const booking = req.body;
      const result = await reviewCollection.insertOne(booking);
      res.send(result);
    });

    // get operation for collecting all rooms
    app.get("/api/v1/rooms", async (req, res) => {
      const cursor = roomCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get operation for collecting specific room
    app.get("/api/v1/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomCollection.findOne(query);
      res.send(result);
    });

    // get operation for collecting all bookings
    app.get("/api/v1/user/bookings", verifyToken, async (req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;

      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      let query = {};
      if (queryEmail) {
        query.email = queryEmail;
      }

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // delete operations operation for specific booking
    app.delete("/api/v1/user/cancel-booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);

      // const date = 3;
      // const query = { _id: new ObjectId(id) };
      // if (date > 1) {
      //   const result = await bookingCollection.deleteOne(query);
      //   res.send(result);
      // } else {
      //   res.send({ message: "Cancelation time expired!" });
      // }
    });

    // update operation for specific booking
    app.put("/api/v1/user/manage-booking/:id", async (req, res) => {
      const id = req.params.id;
      const date = req.body.date;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.updateOne(query, {
        $set: { date: date },
      });
      res.send(result);
    });

    // send a ping to confirm a successful connection
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
