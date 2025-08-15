const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use the JWT secret from the environment variable
const jwtSecret = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};
