// services/trek-service/src/index.ts
// Handles: treks CRUD, waypoints, stats, leaderboard, likes
import express, { Request, Response, NextFunction } from 'express'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

// ── Auth middleware ───────────────────────────────────────────
interface AuthRequest extends Request { userId?: string; userRank?: string }

const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; rank: string }
    req.userId = decoded.id
    req.userRank = decoded.rank
    next()
  } catch { res.status(401).json({ error: 'Invalid token' }) }
}

// ── Rank helpers ─────────────────────────────────────────────
const getRank = (km: number): string => {
  if (km >= 5000) return 'legend'
  if (km >= 2000) return 'platinum'
  if (km >= 500)  return 'gold'
  if (km >= 100)  return 'silver'
  return 'bronze'
}

const checkAndUnlockAchievements = async (userId: string, client: any) => {
  const { rows: [stats] } = await client.query(
    'SELECT * FROM user_stats WHERE user_id = $1', [userId]
  )
  if (!stats) return []

  const checks: Record<string, boolean> = {
    first_trek:       stats.total_treks >= 1,
    century_km:       stats.total_distance_km >= 100,
    summit_3k:        stats.highest_altitude_m >= 3000,
    five_countries:   stats.total_countries >= 5,
    iron_feet:        stats.total_distance_km >= 500,
    everest_gain:     stats.total_elevation_m >= 8848,
    platinum_paths:   stats.total_distance_km >= 2000,
    legend_of_trails: stats.total_distance_km >= 5000,
  }

  const { rows: earned } = await client.query(
    `SELECT a.code FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.user_id = $1`,
    [userId]
  )
  const earnedCodes = new Set(earned.map((e: any) => e.code))
  const newlyEarned: string[] = []

  for (const [code, met] of Object.entries(checks)) {
    if (met && !earnedCodes.has(code)) {
      await client.query(
        `INSERT INTO user_achievements (user_id, achievement_id)
         SELECT $1, id FROM achievements WHERE code = $2 ON CONFLICT DO NOTHING`,
        [userId, code]
      )
      newlyEarned.push(code)
    }
  }
  return newlyEarned
}

// ── Health ───────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'trek-service' }))

// ── CREATE TREK ──────────────────────────────────────────────
app.post('/api/treks', auth, async (req: AuthRequest, res) => {
  const { title, description, start_location, end_location, country,
          start_lat, start_lng, end_lat, end_lng,
          distance_km, elevation_gain_m, max_altitude_m,
          difficulty, duration_hours, started_at, waypoints } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [trek] } = await client.query(
      `INSERT INTO treks
        (user_id, title, description, start_location, end_location, country,
         start_lat, start_lng, end_lat, end_lng,
         distance_km, elevation_gain_m, max_altitude_m, difficulty, duration_hours, started_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [req.userId, title, description, start_location, end_location, country,
       start_lat, start_lng, end_lat, end_lng,
       distance_km, elevation_gain_m, max_altitude_m, difficulty, duration_hours, started_at]
    )

    // Insert waypoints if provided (for Google Maps route rendering)
    if (Array.isArray(waypoints) && waypoints.length > 0) {
      const waypointValues = waypoints
        .map((_: any, i: number) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`)
        .join(', ')
      const waypointParams = [trek.id, ...waypoints.flatMap((w: any, i: number) => [i + 1, w.lat, w.lng, w.altitude_m ?? null])]
      await client.query(
        `INSERT INTO trek_waypoints (trek_id, seq, lat, lng, altitude_m) VALUES ${waypointValues}`,
        waypointParams
      )
    }

    await client.query('COMMIT')
    res.status(201).json(trek)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Failed to create trek' })
  } finally {
    client.release()
  }
})

// ── COMPLETE TREK + recalculate stats ────────────────────────
app.patch('/api/treks/:id/complete', auth, async (req: AuthRequest, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [trek] } = await client.query(
      `UPDATE treks SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.userId]
    )
    if (!trek) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Trek not found' }) }

    // Recalculate user stats
    await client.query(
      `INSERT INTO user_stats (user_id, total_distance_km, total_elevation_m, total_treks, highest_altitude_m, total_countries)
       SELECT user_id,
         COALESCE(SUM(distance_km), 0),
         COALESCE(SUM(elevation_gain_m), 0),
         COUNT(*),
         COALESCE(MAX(max_altitude_m), 0),
         COUNT(DISTINCT country)
       FROM treks WHERE user_id = $1 AND status = 'completed'
       GROUP BY user_id
       ON CONFLICT (user_id) DO UPDATE SET
         total_distance_km  = EXCLUDED.total_distance_km,
         total_elevation_m  = EXCLUDED.total_elevation_m,
         total_treks        = EXCLUDED.total_treks,
         highest_altitude_m = EXCLUDED.highest_altitude_m,
         total_countries    = EXCLUDED.total_countries,
         updated_at         = NOW()`,
      [req.userId]
    )

    // Update rank
    const { rows: [stats] } = await client.query(
      'SELECT total_distance_km FROM user_stats WHERE user_id = $1', [req.userId]
    )
    const newRank = getRank(parseFloat(stats?.total_distance_km || '0'))
    await client.query('UPDATE users SET rank = $1, updated_at = NOW() WHERE id = $2', [newRank, req.userId])

    const newAchievements = await checkAndUnlockAchievements(req.userId!, client)

    await client.query('COMMIT')
    res.json({ trek, new_rank: newRank, new_achievements: newAchievements })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Failed to complete trek' })
  } finally {
    client.release()
  }
})

// ── GET TREK (with waypoints for Google Maps) ─────────────────
app.get('/api/treks/:id', async (req, res) => {
  const { rows: [trek] } = await pool.query(
    `SELECT t.*, u.username, u.full_name, u.avatar_url, u.rank,
            COUNT(DISTINCT tl.user_id) AS like_count
     FROM treks t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN trek_likes tl ON tl.trek_id = t.id
     WHERE t.id = $1 AND t.is_public = true
     GROUP BY t.id, u.id`,
    [req.params.id]
  )
  if (!trek) return res.status(404).json({ error: 'Not found' })

  const { rows: waypoints } = await pool.query(
    'SELECT lat, lng, altitude_m FROM trek_waypoints WHERE trek_id = $1 ORDER BY seq',
    [req.params.id]
  )
  res.json({ ...trek, waypoints })
})

// ── EXPLORE FEED ─────────────────────────────────────────────
app.get('/api/treks/explore', async (req, res) => {
  const { page = '1', limit = '20', country, sort = 'recent' } = req.query as Record<string, string>
  const offset = (parseInt(page) - 1) * parseInt(limit)
  const order  = sort === 'popular' ? 'like_count DESC' : 't.completed_at DESC NULLS LAST'

  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.distance_km, t.elevation_gain_m, t.max_altitude_m,
            t.difficulty, t.country, t.cover_photo_url, t.completed_at,
            t.start_lat, t.start_lng, t.end_lat, t.end_lng,
            u.username, u.full_name, u.avatar_url, u.rank,
            COUNT(DISTINCT tl.user_id) AS like_count
     FROM treks t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN trek_likes tl ON tl.trek_id = t.id
     WHERE t.is_public = true AND t.status = 'completed'
       ${country ? `AND t.country = '${country.toString().replace(/'/g,"''")}'` : ''}
     GROUP BY t.id, u.id
     ORDER BY ${order}
     LIMIT $1 OFFSET $2`,
    [parseInt(limit), offset]
  )
  res.json(rows)
})

// ── MY TREKS ─────────────────────────────────────────────────
app.get('/api/treks/my', auth, async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM treks WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  )
  res.json(rows)
})

// ── LIKE / UNLIKE ────────────────────────────────────────────
app.post('/api/treks/:id/like', auth, async (req: AuthRequest, res) => {
  await pool.query(
    'INSERT INTO trek_likes (user_id, trek_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.userId, req.params.id]
  )
  res.status(204).send()
})

app.delete('/api/treks/:id/like', auth, async (req: AuthRequest, res) => {
  await pool.query('DELETE FROM trek_likes WHERE user_id = $1 AND trek_id = $2', [req.userId, req.params.id])
  res.status(204).send()
})

// ── LEADERBOARD ──────────────────────────────────────────────
app.get('/api/treks/leaderboard', async (req, res) => {
  const { type = 'distance', limit = '50' } = req.query as Record<string, string>
  const col = { distance: 'total_distance_km', elevation: 'total_elevation_m', treks: 'total_treks', altitude: 'highest_altitude_m' }[type] || 'total_distance_km'
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.avatar_url, u.rank,
            s.total_distance_km, s.total_elevation_m, s.total_treks, s.highest_altitude_m
     FROM users u JOIN user_stats s ON s.user_id = u.id
     ORDER BY s.${col} DESC LIMIT $1`,
    [parseInt(limit)]
  )
  res.json(rows.map((r, i) => ({ ...r, position: i + 1 })))
})

// ── Start ────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5001')
app.listen(PORT, () => console.log(`Trek service running on :${PORT}`))
