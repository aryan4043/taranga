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

const mockTravelers = [
  { id: 1, name: "Aarav Sharma", nextDest: "Everest Base Camp", date: "Oct 2024", rank: "Platinum" },
  { id: 2, name: "Zoe Chen", nextDest: "Mont Blanc", date: "July 2024", rank: "Gold" },
  { id: 3, name: "Marco Rossi", nextDest: "Dolomites", date: "Aug 2024", rank: "Bronze" }
];

app.get('/api/travelers', (req, res) => {
  res.json(mockTravelers);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});
