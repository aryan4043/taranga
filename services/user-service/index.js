const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5002;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// GET /api/travelers: Fetches all travelers in the marketplace
app.get('/api/travelers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM travelers ORDER BY id ASC');
    
    // Map database snake_case keys to frontend camelCase keys
    const formattedTravelers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      nextDest: row.next_dest,
      date: row.travel_date,
      rank: row.rank,
      totalDistance: row.total_distance,
      totalAltitude: row.total_altitude,
      summits: row.summits
    }));

    res.json(formattedTravelers);
  } catch (err) {
    console.error('Error fetching travelers:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});
