import cors from "cors"
import express from "express"
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Thought } from "./models/Thought.js"
import { User } from './models/User.js';
import listEndpoints from 'express-list-endpoints';
import jwt from 'jsonwebtoken';


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
    //seed();    // optional
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

const auth = (req, res, next) => {
  const raw = req.header('Authorization') || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;

  console.log('[AUTH] raw header =', JSON.stringify(raw));
  console.log('[AUTH] token len =', token ? token.length : 0);
  console.log('[AUTH] token parts =', token ? token.split('.').length : 0);

  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    return next();
  } catch (err) {
    console.error('JWT verify error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token', details: err.message });
  }
};


//basee route
app.get('/', (req, res) => {
  try {
    const endpoints = listEndpoints(app).map(e => ({
      path: e.path,
      methods: e.methods.sort(),
    }));
    res.json({
      name: 'Happy Thoughts API',
      version: '1.0.0',
      endpoints
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list endpoints', details: err.message });
  }
});

// Get all thoughts
app.get('/thoughts', async (req, res) => {
  try {
    const thoughts = await Thought.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'email');

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

app.post('/thoughts', auth, async (req, res) => {
  const { message } = req.body;

  try {
    const newThought = await new Thought({
      message,
      createdBy: req.userId
    }).save();

    res.status(201).json(newThought);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.message });
    }
    res.status(500).json({ error: 'Could not save thought', details: err.message });
  }
});

app.patch('/thoughts/:id', auth, async (req, res) => {
  const { message } = req.body;
  if (typeof message !== 'string' || message.length < 5 || message.length > 140) {
    return res.status(400).json({ error: 'Message must be 5–140 chars' });
  }

  try {
    const t = await Thought.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Thought not found' });
    if (String(t.createdBy) !== req.userId) {
      return res.status(403).json({ error: 'Not your thought' });
    }

    t.message = message;
    await t.save();
    res.json(t);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID', details: err.message });
  }
});

app.delete('/thoughts/:id', auth, async (req, res) => {
  try {
    const t = await Thought.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Thought not found' });
    if (String(t.createdBy) !== req.userId) {
      return res.status(403).json({ error: 'Not your thought' });
    }

    await t.deleteOne();
    res.json({ success: true, message: 'Thought deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID', details: err.message });
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

    // after password check passes
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      userId: user._id,
      email: user.email,
      accessToken
    });


  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
