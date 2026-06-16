// services/user-service/src/index.ts
// Handles: register, login, profiles, follow/unfollow, marketplace
import express, { Request, Response, NextFunction } from 'express'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

interface AuthRequest extends Request { userId?: string }

const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    req.userId = decoded.id
    next()
  } catch { res.status(401).json({ error: 'Invalid token' }) }
}

// ── Health ────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'user-service' }))

// ── REGISTER ─────────────────────────────────────────────────
app.post('/api/users/register', async (req, res) => {
  const { username, email, password, full_name } = req.body
  if (!username || !email || !password || !full_name)
    return res.status(400).json({ error: 'All fields required' })

  const hash = await bcrypt.hash(password, 12)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [user] } = await client.query(
      `INSERT INTO users (username, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, rank`,
      [username, email, hash, full_name]
    )
    await client.query('INSERT INTO user_stats (user_id) VALUES ($1)', [user.id])
    await client.query('COMMIT')
    const token = jwt.sign({ id: user.id, rank: user.rank }, JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ user, token })
  } catch (err: any) {
    await client.query('ROLLBACK')
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already taken' })
    res.status(500).json({ error: 'Registration failed' })
  } finally {
    client.release()
  }
})

// ── LOGIN ─────────────────────────────────────────────────────
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body
  const { rows: [user] } = await pool.query(
    'SELECT id, username, email, full_name, password_hash, rank, avatar_url FROM users WHERE email = $1',
    [email]
  )
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' })

  const { password_hash, ...safeUser } = user
  const token = jwt.sign({ id: user.id, rank: user.rank }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ user: safeUser, token })
})

// ── GET PROFILE ──────────────────────────────────────────────
app.get('/api/users/profile/:username', async (req, res) => {
  const { rows: [user] } = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.bio, u.avatar_url, u.location,
            u.rank, u.rank_points, u.created_at,
            s.total_distance_km, s.total_elevation_m, s.total_treks,
            s.highest_altitude_m, s.total_countries
     FROM users u
     LEFT JOIN user_stats s ON s.user_id = u.id
     WHERE u.username = $1`,
    [req.params.username]
  )
  if (!user) return res.status(404).json({ error: 'User not found' })

  const { rows: achievements } = await pool.query(
    `SELECT a.code, a.name, a.description, a.tier, ua.earned_at
     FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = $1 ORDER BY ua.earned_at DESC`,
    [user.id]
  )
  res.json({ ...user, achievements })
})

// ── UPDATE PROFILE ───────────────────────────────────────────
app.patch('/api/users/profile/me', auth, async (req: AuthRequest, res) => {
  const { full_name, bio, location, avatar_url } = req.body
  const { rows: [user] } = await pool.query(
    `UPDATE users SET
       full_name  = COALESCE($1, full_name),
       bio        = COALESCE($2, bio),
       location   = COALESCE($3, location),
       avatar_url = COALESCE($4, avatar_url),
       updated_at = NOW()
     WHERE id = $5
     RETURNING id, username, full_name, bio, location, avatar_url, rank`,
    [full_name, bio, location, avatar_url, req.userId]
  )
  res.json(user)
})

// ── FOLLOW / UNFOLLOW ────────────────────────────────────────
app.post('/api/users/:id/follow', auth, async (req: AuthRequest, res) => {
  if (req.userId === req.params.id) return res.status(400).json({ error: 'Cannot follow yourself' })
  await pool.query(
    'INSERT INTO connections (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.userId, req.params.id]
  )
  res.status(204).send()
})

app.delete('/api/users/:id/follow', auth, async (req: AuthRequest, res) => {
  await pool.query(
    'DELETE FROM connections WHERE follower_id = $1 AND followee_id = $2',
    [req.userId, req.params.id]
  )
  res.status(204).send()
})

// ── FOLLOWERS / FOLLOWING ────────────────────────────────────
app.get('/api/users/:id/followers', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.avatar_url, u.rank
     FROM connections c JOIN users u ON u.id = c.follower_id
     WHERE c.followee_id = $1 LIMIT 100`,
    [req.params.id]
  )
  res.json(rows)
})

app.get('/api/users/:id/following', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.avatar_url, u.rank
     FROM connections c JOIN users u ON u.id = c.followee_id
     WHERE c.follower_id = $1 LIMIT 100`,
    [req.params.id]
  )
  res.json(rows)
})

// ── SEARCH USERS ─────────────────────────────────────────────
app.get('/api/users/search', async (req, res) => {
  const { q = '', rank, limit = '20' } = req.query as Record<string, string>
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.avatar_url, u.rank, u.location,
            s.total_distance_km, s.total_treks
     FROM users u LEFT JOIN user_stats s ON s.user_id = u.id
     WHERE (u.username ILIKE $1 OR u.full_name ILIKE $1)
       ${rank ? `AND u.rank = '${rank}'` : ''}
     ORDER BY s.total_distance_km DESC NULLS LAST LIMIT $2`,
    [`%${q}%`, parseInt(limit)]
  )
  res.json(rows)
})

// ── MARKETPLACE: CREATE LISTING ──────────────────────────────
app.post('/api/marketplace', auth, async (req: AuthRequest, res) => {
  const { title, description, destination, country, dest_lat, dest_lng,
          start_date, end_date, difficulty, max_group_size, min_rank } = req.body
  const { rows: [listing] } = await pool.query(
    `INSERT INTO marketplace_listings
       (user_id, title, description, destination, country, dest_lat, dest_lng,
        start_date, end_date, difficulty, max_group_size, min_rank)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.userId, title, description, destination, country, dest_lat, dest_lng,
     start_date, end_date, difficulty, max_group_size || 10, min_rank || 'bronze']
  )
  res.status(201).json(listing)
})

// ── MARKETPLACE: BROWSE ──────────────────────────────────────
app.get('/api/marketplace', async (req, res) => {
  const { country, page = '1', limit = '20' } = req.query as Record<string, string>
  const offset = (parseInt(page) - 1) * parseInt(limit)
  const { rows } = await pool.query(
    `SELECT ml.*, u.username, u.full_name, u.avatar_url, u.rank AS creator_rank,
            s.total_distance_km AS creator_distance,
            COUNT(DISTINCT mi.user_id) AS interest_count
     FROM marketplace_listings ml
     JOIN users u ON u.id = ml.user_id
     LEFT JOIN user_stats s ON s.user_id = u.id
     LEFT JOIN marketplace_interests mi ON mi.listing_id = ml.id
     WHERE ml.is_active = true
       ${country ? `AND ml.country ILIKE '%${country.replace(/'/g,"''")}%'` : ''}
     GROUP BY ml.id, u.id, s.user_id
     ORDER BY ml.created_at DESC LIMIT $1 OFFSET $2`,
    [parseInt(limit), offset]
  )
  res.json(rows)
})

// ── MARKETPLACE: EXPRESS INTEREST ───────────────────────────
app.post('/api/marketplace/:id/interest', auth, async (req: AuthRequest, res) => {
  const { message } = req.body
  const { rows: [listing] } = await pool.query(
    'SELECT user_id FROM marketplace_listings WHERE id = $1', [req.params.id]
  )
  if (!listing) return res.status(404).json({ error: 'Listing not found' })
  if (listing.user_id === req.userId) return res.status(400).json({ error: 'Cannot join your own listing' })
  await pool.query(
    'INSERT INTO marketplace_interests (listing_id, user_id, message) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [req.params.id, req.userId, message]
  )
  res.status(204).send()
})

const PORT = parseInt(process.env.PORT || '5002')
app.listen(PORT, () => console.log(`User service running on :${PORT}`))
