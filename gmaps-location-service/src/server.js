const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DEFAULT_RADIUS = process.env.DEFAULT_RADIUS || 1000;
const MAX_RADIUS = process.env.MAX_RADIUS || 50000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Geocoding endpoint - convert address to coordinates
app.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        address: address,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Geocoding failed', details: response.data.error_message });
    }

    const results = response.data.results.map(result => ({
      formatted_address: result.formatted_address,
      geometry: result.geometry,
      place_id: result.place_id,
      types: result.types
    }));

    res.json({ results });
  } catch (error) {
    console.error('Geocoding error:', error.message);
    res.status(500).json({ error: 'Internal server error during geocoding' });
  }
});

// Reverse geocoding endpoint - convert coordinates to address
app.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Reverse geocoding failed', details: response.data.error_message });
    }

    const results = response.data.results.map(result => ({
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      types: result.types
    }));

    res.json({ results });
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    res.status(500).json({ error: 'Internal server error during reverse geocoding' });
  }
});

// Places nearby endpoint - find places near a location
app.get('/places/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 1000, type } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    const params = {
      location: `${lat},${lng}`,
      radius: parseInt(radius),
      key: GOOGLE_MAPS_API_KEY
    };

    if (type) {
      params.type = type;
    }

    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, params);

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Places search failed', details: response.data.error_message });
    }

    const results = response.data.results.map(place => ({
      name: place.name,
      place_id: place.place_id,
      vicinity: place.vicinity,
      geometry: place.geometry,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types
    }));

    res.json({ 
      results,
      next_page_token: response.data.next_page_token 
    });
  } catch (error) {
    console.error('Places search error:', error.message);
    res.status(500).json({ error: 'Internal server error during places search' });
  }
});

// Distance matrix endpoint - get travel distances/times between locations
app.post('/distance-matrix', async (req, res) => {
  try {
    const { origins, destinations, mode = 'driving' } = req.body;
    
    if (!origins || !destinations) {
      return res.status(400).json({ error: 'Origins and destinations are required in request body' });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
      params: {
        origins: origins.join('|'),
        destinations: destinations.join('|'),
        mode: mode,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Distance matrix calculation failed', details: response.data.error_message });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Distance matrix error:', error.message);
    res.status(500).json({ error: 'Internal server error during distance matrix calculation' });
  }
});

// Location autocomplete endpoint
app.get('/places/autocomplete', async (req, res) => {
  try {
    const { input, lat, lng, radius = 1000 } = req.query;
    
    if (!input) {
      return res.status(400).json({ error: 'Input parameter is required' });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    const params = {
      input: input,
      key: GOOGLE_MAPS_API_KEY
    };

    if (lat && lng) {
      params.location = `${lat},${lng}`;
      params.radius = parseInt(radius);
    }

    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, params);

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Autocomplete failed', details: response.data.error_message });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Autocomplete error:', error.message);
    res.status(500).json({ error: 'Internal server error during autocomplete' });
  }
});

// Main route
app.get('/', (req, res) => {
  res.json({
    message: 'GMaps Location Service',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/geocode', description: 'Geocode address to coordinates' },
      { method: 'GET', path: '/reverse-geocode', description: 'Reverse geocode coordinates to address' },
      { method: 'GET', path: '/places/nearby', description: 'Find places nearby' },
      { method: 'POST', path: '/distance-matrix', description: 'Calculate distance/time matrix' },
      { method: 'GET', path: '/places/autocomplete', description: 'Location autocomplete' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`GMaps Location Service running on port ${PORT}`);
});