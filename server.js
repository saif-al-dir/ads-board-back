require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN, // Your React dev server
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/ads', require('./routes/ads'));
app.use('/auth', require('./routes/auth'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
