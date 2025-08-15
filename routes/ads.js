const express = require('express');
const multer = require('multer');
const Ad = require('../models/Ads');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const getImageFileType = require('../utils/getImageFileType'); // Assuming you have this utility for image type validation
const router = express.Router();

// Setup Multer with storage and limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
});

// GET all ads
router.get('/', async (req, res) => {
  const ads = await Ad.find().populate('seller', 'login avatar phone').sort({ created: -1 });
  res.json(ads);
});

// SEARCH
router.get('/search/:phrase', async (req, res) => {
  const ads = await Ad.find({ title: { $regex: req.params.phrase, $options: 'i' } });
  res.json(ads);
});

// GET ad by ID
router.get('/:id', async (req, res) => {
  const ad = await Ad.findById(req.params.id).populate('seller', 'login avatar phone');
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  res.json(ad);
});

// CREATE new ad
router.post('/', auth, upload.single('image'), async (req, res) => {
  const ad = new Ad({
    title: req.body.title,
    content: req.body.content,
    price: req.body.price,
    location: req.body.location,
    image: req.file?.filename || '',
    seller: req.user.id,
  });
  
  try {
    await ad.save();
    res.status(201).json(ad);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path); // Delete file if save fails
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// UPDATE ad
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad || ad.seller.toString() !== req.user.id)
    return res.status(403).json({ error: 'Unauthorized' });

  if (req.file) {
    const imageType = await getImageFileType(req.file);
    if (imageType === 'unknown') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // If ad has an old image, delete it
    if (ad.image) {
      const oldPath = path.join(__dirname, '../public/uploads/', ad.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath); // 🧹 remove old image
      }
    }

    ad.image = req.file.filename;
  }

  // Update other fields regardless of file
  ad.title = req.body.title || ad.title;
  ad.content = req.body.content || ad.content;
  ad.price = req.body.price || ad.price;
  ad.location = req.body.location || ad.location;

  await ad.save();
  res.json(ad);
});

// DELETE ad
router.delete('/:id', auth, async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad || ad.seller.toString() !== req.user.id)
    return res.status(403).json({ error: 'Unauthorized' });

  await ad.deleteOne();
  res.json({ message: 'Ad deleted' });
});

module.exports = router;
