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

// Mock data for initial development
const mockTrekStats = {
  totalDistance: 124.5, // km
  totalAltitude: 4500, // m
  rank: 'Gold',
  history: [
    { id: 1, name: 'Kedarkantha Trek', distance: 20, altitude: 1200, date: '2024-05-10' },
    { id: 2, name: 'Roopkund Trek', distance: 53, altitude: 2500, date: '2024-06-01' }
  ]
};

app.get('/api/stats', async (req, res) => {
  try {
    // In production, we would query the DB
    // const result = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [req.user.id]);
    res.json(mockTrekStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Trek Service listening at http://localhost:${port}`);
});
