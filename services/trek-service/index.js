const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper to calculate rank based on distance and altitude
const calculateRank = (distance, altitude) => {
  if (distance >= 1200 || altitude >= 15000) return 'Diamond';
  if (distance >= 800 || altitude >= 9000) return 'Platinum';
  if (distance >= 400 || altitude >= 5000) return 'Gold';
  if (distance >= 150 || altitude >= 3000) return 'Silver';
  return 'Bronze';
};

// GET /api/stats: Fetches stats and history for a given traveler ID
app.get('/api/stats', async (req, res) => {
  const userId = parseInt(req.query.userId || '100', 10);
  
  try {
    // 1. Fetch traveler details
    const travelerRes = await pool.query('SELECT * FROM travelers WHERE id = $1', [userId]);
    
    if (travelerRes.rows.length === 0) {
      return res.status(404).json({ error: `Traveler with ID ${userId} not found` });
    }
    
    const traveler = travelerRes.rows[0];
    
    // 2. Fetch trek history
    const treksRes = await pool.query(
      'SELECT id, name, distance, altitude, to_char(trek_date, \'YYYY-MM-DD\') as date FROM treks WHERE traveler_id = $1 ORDER BY trek_date ASC',
      [userId]
    );

    // Format response matching frontend expectations
    res.json({
      id: traveler.id,
      name: traveler.name,
      nextDest: traveler.next_dest,
      date: traveler.travel_date,
      rank: traveler.rank,
      totalDistance: traveler.total_distance,
      totalAltitude: traveler.total_altitude,
      summits: traveler.summits,
      history: treksRes.rows
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/treks: Records a new trek and updates traveler stats and rank
app.post('/api/treks', async (req, res) => {
  const { userId, name, distance, altitude } = req.body;
  
  if (!userId || !name || distance === undefined || altitude === undefined) {
    return res.status(400).json({ error: 'Missing required fields: userId, name, distance, altitude' });
  }

  const parsedUserId = parseInt(userId, 10);
  const parsedDistance = parseFloat(distance);
  const parsedAltitude = parseInt(altitude, 10);

  if (isNaN(parsedUserId) || isNaN(parsedDistance) || isNaN(parsedAltitude)) {
    return res.status(400).json({ error: 'Invalid numeric fields for userId, distance, or altitude' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Check if traveler exists
    const travelerCheck = await client.query('SELECT * FROM travelers WHERE id = $1', [parsedUserId]);
    if (travelerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Traveler with ID ${parsedUserId} not found` });
    }

    // 2. Insert new trek
    const trekRes = await client.query(
      'INSERT INTO treks (traveler_id, name, distance, altitude, trek_date) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *',
      [parsedUserId, name, parsedDistance, parsedAltitude]
    );

    // 3. Fetch aggregated statistics
    const aggRes = await client.query(
      'SELECT SUM(distance) as total_dist, SUM(altitude) as total_alt, COUNT(*) as summits_count FROM treks WHERE traveler_id = $1',
      [parsedUserId]
    );

    const totalDist = parseFloat(parseFloat(aggRes.rows[0].total_dist || 0).toFixed(1));
    const totalAlt = parseInt(aggRes.rows[0].total_alt || 0, 10);
    const summitsCount = parseInt(aggRes.rows[0].summits_count || 0, 10);

    // 4. Calculate new rank
    const newRank = calculateRank(totalDist, totalAlt);

    // 5. Update traveler statistics & rank
    const updatedTravelerRes = await client.query(
      'UPDATE travelers SET total_distance = $1, total_altitude = $2, summits = $3, rank = $4 WHERE id = $5 RETURNING *',
      [totalDist, totalAlt, summitsCount, newRank, parsedUserId]
    );

    await client.query('COMMIT');

    const updatedTraveler = updatedTravelerRes.rows[0];
    
    // 6. Fetch updated trek list for response
    const treksRes = await pool.query(
      'SELECT id, name, distance, altitude, to_char(trek_date, \'YYYY-MM-DD\') as date FROM treks WHERE traveler_id = $1 ORDER BY trek_date ASC',
      [parsedUserId]
    );

    res.json({
      id: updatedTraveler.id,
      name: updatedTraveler.name,
      nextDest: updatedTraveler.next_dest,
      date: updatedTraveler.travel_date,
      rank: updatedTraveler.rank,
      totalDistance: updatedTraveler.total_distance,
      totalAltitude: updatedTraveler.total_altitude,
      summits: updatedTraveler.summits,
      history: treksRes.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed, rolled back:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Trek Service listening at http://localhost:${port}`);
});
