import cors from "cors"
import express from "express"
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Thought } from "./models/Thought.js"
import expressListEndpoints from "express-list-endpoints";

dotenv.config();

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()


// middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB!');
    seed(); // optional: seed data only if DB is empty
  })
  .catch((err) => {
    console.error('Mongo error', err);
  });

// Optional: seed one thought if DB is empty
const seed = async () => {
  const existing = await Thought.find();
  if (existing.length === 0) {
    await new Thought({
      message: 'This is my very first seeded thought!',
    }).save();
    console.log('Seeded one thought');
  }
};

//basee route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Happy Thougts API",
    endpoints: listEndpoints(app),
  })
})

// Get all thoughts
app.get('/thoughts', async (req, res) => {
  try {
    const thoughts = await Thought.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(thoughts);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch thoughts' });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
