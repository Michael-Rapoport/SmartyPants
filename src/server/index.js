const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost/knowledge_management', { useNewUrlParser: true, useUnifiedTopology: true });

// Models
const User = require('./models/User');
const KnowledgeEntry = require('./models/KnowledgeEntry');
const Workspace = require('./models/Workspace');
const Comment = require('./models/Comment');

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user == null) {
    return res.status(400).send('Cannot find user');
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign({ id: user._id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
      res.json({ accessToken: accessToken });
    } else {
      res.send('Not Allowed');
    }
  } catch {
    res.status(500).send();
  }
});

app.get('/api/search', authenticateToken, async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;
  try {
    const entries = await KnowledgeEntry.find({ $text: { $search: query } })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await KnowledgeEntry.countDocuments({ $text: { $search: query } });

    res.json({
      entries,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/api/process-url', authenticateToken, async (req, res) => {
  // Implement URL processing logic here
  res.status(200).send('URL processed successfully');
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  // Implement notifications fetching logic here
  res.json([/* notifications data */]);
});

app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/api/admin/metrics', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) return res.sendStatus(403);
  try {
    const totalUsers = await User.countDocuments();
    const totalEntries = await KnowledgeEntry.countDocuments();
    const activeUsers = await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 30*24*60*60*1000) } });
    res.json({ totalUsers, totalEntries, activeUsers });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/api/workspaces', authenticateToken, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user.id });
    res.json(workspaces);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/api/workspaces/:id/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await Comment.find({ workspace: req.params.id }).populate('author', 'name');
    res.json(comments);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/api/workspaces/:id/comments', authenticateToken, async (req, res) => {
  try {
    const comment = new Comment({
      content: req.body.content,
      author: req.user.id,
      workspace: req.params.id
    });
    await comment.save();
    const populatedComment = await Comment.findById(comment._id).populate('author', 'name');
    io.to(req.params.id).emit('new comment', populatedComment);
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('join workspace', (workspaceId) => {
    socket.join(workspaceId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
