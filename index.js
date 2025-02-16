const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const validUrl = require('valid-url');
const dotenv = require('dotenv');



dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// URL Schema and Model
const urlSchema = new mongoose.Schema({
  shortCode: { type: String, unique: true, required: true },
  longUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Url = mongoose.model('Url', urlSchema);

// Shorten a URL
app.post('/shorten', async (req, res) => {
  const { longUrl } = req.body;

  if (!validUrl.isUri(longUrl)) {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  try {
    let url = await Url.findOne({ longUrl });
    if (!url) {
      const shortCode = shortid.generate();
      url = new Url({ shortCode, longUrl });
      await url.save();
    }
    res.json({ shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}` });
  } catch (error) {
    res.status(500).json({ message: 'Error shortening URL', error });
  }
});

// Redirect to Original URL
app.get('/:shortCode', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });
    if (url) {
      return res.redirect(url.longUrl);
    }
    res.status(404).json({ message: 'Short URL not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving URL', error });
  }
});

// Get all shortened URLs
app.get('/urls', async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving URLs', error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`URL Shortener API running at http://localhost:${port}`);
});
