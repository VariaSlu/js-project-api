import cors from "cors"
import express from "express"
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Thought } from "./models/Thought.js"
import ListEndpoints from "express-list-endpoints";
import { User } from './models/User.js';
import bcrypt from 'bcryptjs';

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
    seed();    // optional
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
      hearts: 0
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

app.get('/thoughts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const thought = await Thought.findById(id);

    if (!thought) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.json(thought);
  } catch (err) {
    res.status(400).json({
      error: 'Invalid ID',
      details: err.message,
    });
  }
});

app.delete('/thoughts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedThought = await Thought.findByIdAndDelete(id);

    if (!deletedThought) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.status(200).json({ success: true, message: 'Thought deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID', details: err.message });
  }
});

app.post('/thoughts/:id/like', async (req, res) => {
  const { id } = req.params;

  try {
    console.log('ID received:', id); //for debugginng

    const updatedThought = await Thought.findByIdAndUpdate(
      id,
      { $inc: { hearts: 1 } },
      { new: true } //return the updaated document
    );

    if (!updatedThought) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.json(updatedThought);

  } catch (err) {
    res.status(400).json({
      error: 'Invalid ID or request',
      details: err.message //show whats wrong
    });
  }

});

app.post('/thoughts', async (req, res) => {
  const { message } = req.body;
  const userId = req.header('x-user-id');  // temporary auth
  console.log('Headers received:', req.headers); //fo test

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Missing X-User-Id header' })
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }


    const newThought = await new Thought({
      message,
      createdBy: user._id,
    }).save();

    // (Optional) populate the user info
    // await newThought.populate('createdBy', 'email username');

    res.status(201).json(newThought);
  } catch (err) {
    // Check for validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.message
      });
    }

    res.status(500).json({
      error: 'Could not save thought',
      details: err.message
    });
  }
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const newUser = await new User({ email, password }).save();
    res.status(201).json({
      email: newUser.email,
      _id: newUser._id
    });
  } catch (err) {
    res.status(400).json({ error: 'Could not create user', details: err.message });
  }
});

// LOGIN ROUTE
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2. Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Login successful
    res.json({
      success: true,
      message: 'Login successful',
      userId: user._id,
      email: user.email
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
