require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const router = express.Router();
// import upload from './middleware/upload';
const upload = require('../middleware/upload');
const jwtSecret = process.env.JWT_SECRET; // Consider moving this to an environment variable

// Register
router.post('/register', upload.single('avatar'), async (req, res) => {
  const { login, password, phone } = req.body;

  if (!login || !password) {
    if (req.file) fs.unlinkSync(req.file.path); // delete unused file
    return res.status(400).json({ error: 'Login and password are required' });
  }

  const existingUser  = await User.findOne({ login });
  if (existingUser ) {
    if (req.file) fs.unlinkSync(req.file.path); // delete file if user exists
    return res.status(409).json({ error: 'Login already taken' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ login, password: hashedPassword, phone, avatar: req.file?.filename || '' });
  
  try {
    await user.save();
    res.status(201).json({ message: 'User  created' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path); // delete file if save fails
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  const user = await User.findOne({ login });
  if (!user) return res.status(404).json({ error: 'User  not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user._id }, jwtSecret);
  res.json({ token });
});

// Get current user
router.get('/user', require('../middleware/auth'), async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

module.exports = router;
