const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  title: { type: String, required: true, minlength: 10, maxlength: 50 },
  content: { type: String, required: true, minlength: 20, maxlength: 1000 },
  created: { type: Date, default: Date.now },
  image: String,
  price: Number,
  location: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Ad', AdSchema);
