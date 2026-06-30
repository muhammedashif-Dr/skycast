import express from 'express';
import axios from 'axios';
import { getDBStatus } from '../config/db.js';
import Favorite from '../models/Favorite.js';
import History from '../models/History.js';

const router = express.Router();

// In-memory fallbacks when MongoDB is offline
let inMemoryFavorites = [];
let inMemoryHistory = [];

// Helper to keep history limited to 10 items
const trimInMemoryHistory = () => {
  if (inMemoryHistory.length > 10) {
    inMemoryHistory = inMemoryHistory.slice(-10);
  }
};

// 1. Geocode search: proxy to Open-Meteo Geocoding API
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`;
    const response = await axios.get(url);
    
    // If no results, Open-Meteo API might return undefined 'results'
    const results = response.data.results || [];
    res.json(results);
  } catch (error) {
    console.error('Error fetching geocoding data:', error.message);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

// 2. Fetch live weather and forecast
router.get('/live', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// 3. Favorites Endpoints
// GET Favorites
router.get('/favorites', async (req, res) => {
  const dbConnected = getDBStatus();
  if (dbConnected) {
    try {
      const favorites = await Favorite.find().sort({ createdAt: -1 });
      return res.json(favorites);
    } catch (error) {
      console.error('Failed to get favorites from DB, using fallback:', error.message);
    }
  }
  // Fallback
  res.json([...inMemoryFavorites].reverse());
});

// POST Favorite
router.post('/favorites', async (req, res) => {
  const { name, lat, lon, country, state } = req.body;
  if (!name || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'Name, lat, and lon are required' });
  }

  const dbConnected = getDBStatus();
  if (dbConnected) {
    try {
      // Find if already exists
      const existing = await Favorite.findOne({ lat, lon });
      if (existing) {
        return res.json(existing);
      }
      const newFav = new Favorite({ name, lat, lon, country, state });
      await newFav.save();
      return res.status(201).json(newFav);
    } catch (error) {
      console.error('Failed to save favorite to DB, using fallback:', error.message);
    }
  }

  // Fallback
  const exists = inMemoryFavorites.find(item => item.lat === lat && item.lon === lon);
  if (exists) {
    return res.json(exists);
  }
  const newInMemory = { _id: `mem-fav-${Date.now()}`, name, lat, lon, country, state, createdAt: new Date() };
  inMemoryFavorites.push(newInMemory);
  res.status(201).json(newInMemory);
});

// DELETE Favorite
router.delete('/favorites/:id', async (req, res) => {
  const { id } = req.params;
  const { lat, lon } = req.query; // Fallback helper

  const dbConnected = getDBStatus();
  if (dbConnected && !id.startsWith('mem-')) {
    try {
      await Favorite.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Removed from favorites' });
    } catch (error) {
      console.error('Failed to delete favorite from DB, trying fallback:', error.message);
    }
  }

  // Fallback deletion (matches id OR coordinates)
  inMemoryFavorites = inMemoryFavorites.filter(item => {
    if (item._id === id) return false;
    if (lat !== undefined && lon !== undefined) {
      return !(Math.abs(item.lat - parseFloat(lat)) < 0.001 && Math.abs(item.lon - parseFloat(lon)) < 0.001);
    }
    return true;
  });
  
  res.json({ success: true, message: 'Removed from favorites' });
});

// 4. Search History Endpoints
// GET Search History
router.get('/history', async (req, res) => {
  const dbConnected = getDBStatus();
  if (dbConnected) {
    try {
      const history = await History.find().sort({ createdAt: -1 }).limit(10);
      return res.json(history);
    } catch (error) {
      console.error('Failed to get history from DB, using fallback:', error.message);
    }
  }
  // Fallback
  res.json([...inMemoryHistory].reverse());
});

// POST Search History
router.post('/history', async (req, res) => {
  const { name, lat, lon, country, state } = req.body;
  if (!name || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'Name, lat, and lon are required' });
  }

  const dbConnected = getDBStatus();
  if (dbConnected) {
    try {
      // Remove any existing exact same coordinates in the recent history to keep it clean and push to top
      await History.deleteMany({ lat, lon });
      
      const newHistory = new History({ name, lat, lon, country, state });
      await newHistory.save();
      
      // Trim db history to keep only top 15-20 items (limit in query keeps returned size at 10)
      const count = await History.countDocuments();
      if (count > 20) {
        const oldest = await History.find().sort({ createdAt: 1 }).limit(count - 20);
        const oldestIds = oldest.map(doc => doc._id);
        await History.deleteMany({ _id: { $in: oldestIds } });
      }

      return res.status(201).json(newHistory);
    } catch (error) {
      console.error('Failed to save history to DB, using fallback:', error.message);
    }
  }

  // Fallback
  // Remove exact duplicates in memory
  inMemoryHistory = inMemoryHistory.filter(item => !(Math.abs(item.lat - lat) < 0.001 && Math.abs(item.lon - lon) < 0.001));
  const newInMemory = { _id: `mem-his-${Date.now()}`, name, lat, lon, country, state, createdAt: new Date() };
  inMemoryHistory.push(newInMemory);
  trimInMemoryHistory();
  res.status(201).json(newInMemory);
});

// DELETE History (Clear history)
router.delete('/history', async (req, res) => {
  const dbConnected = getDBStatus();
  if (dbConnected) {
    try {
      await History.deleteMany({});
      return res.json({ success: true, message: 'Search history cleared' });
    } catch (error) {
      console.error('Failed to clear history in DB, using fallback:', error.message);
    }
  }

  // Fallback
  inMemoryHistory = [];
  res.json({ success: true, message: 'Search history cleared' });
});

export default router;
