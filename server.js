import cors from "cors"
import express from "express"
import listEndpoints from "express-list-endpoints";
//import thoughtsData from "./thoughts.json" assert { type: 'json' };

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('DB error:', err));

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

//set up what we need for data base from Jennies video
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/something"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

// Start defining your routes here
app.get("/", (req, res) => {
  res.json({
    message: 'Welcome to the Happy Thoughts API!',
    endpoints: listEndpoints(app)
  })
})

app.get('/thoughts', (req, res) => {
  res.json(thoughtsData);
});

app.get('/thoughts/:id', (req, res) => {
  const thought = thoughtsData.find(t => t.id === +req.params.id);
  if (!thought) {
    res.status(404).json({ error: 'Thought not found' });
  } else {
    res.json(thought);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
