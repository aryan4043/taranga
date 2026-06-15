-- ─────────────────────────────────────────────────────────────
-- Taranga DB Schema  —  services/db/init.sql
-- PostgreSQL 15 + PostGIS
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE rank_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'legend');
CREATE TYPE trek_status AS ENUM ('planned', 'active', 'completed');

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  location      VARCHAR(150),
  rank          rank_tier    NOT NULL DEFAULT 'bronze',
  rank_points   INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── USER STATS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stats (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_distance_km     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_elevation_m     INTEGER       NOT NULL DEFAULT 0,
  total_treks           INTEGER       NOT NULL DEFAULT 0,
  highest_altitude_m    INTEGER       NOT NULL DEFAULT 0,
  total_countries       INTEGER       NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── TREKS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  status           trek_status  NOT NULL DEFAULT 'planned',
  -- location
  start_location   VARCHAR(200),
  end_location     VARCHAR(200),
  country          VARCHAR(100),
  -- start/end coords for Google Maps
  start_lat        NUMERIC(9,6),
  start_lng        NUMERIC(9,6),
  end_lat          NUMERIC(9,6),
  end_lng          NUMERIC(9,6),
  -- stats
  distance_km      NUMERIC(10,2),
  elevation_gain_m INTEGER,
  max_altitude_m   INTEGER,
  difficulty       SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  duration_hours   NUMERIC(8,2),
  -- media
  cover_photo_url  TEXT,
  -- timestamps
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_public        BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_treks_user_id  ON treks(user_id);
CREATE INDEX idx_treks_country  ON treks(country);
CREATE INDEX idx_treks_status   ON treks(status);

-- ── GPS WAYPOINTS ────────────────────────────────────────────
-- Stored as PostGIS points; used to draw route on Google Maps
CREATE TABLE IF NOT EXISTS trek_waypoints (
  id        BIGSERIAL PRIMARY KEY,
  trek_id   UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
  seq       INTEGER NOT NULL,
  lat       NUMERIC(9,6) NOT NULL,
  lng       NUMERIC(9,6) NOT NULL,
  altitude_m NUMERIC(8,2),
  recorded_at TIMESTAMPTZ
);

CREATE INDEX idx_waypoints_trek ON trek_waypoints(trek_id, seq);

-- ── TREK LIKES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trek_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trek_id    UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, trek_id)
);

-- ── CONNECTIONS (follow model) ───────────────────────────────
CREATE TABLE IF NOT EXISTS connections (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);

-- ── MARKETPLACE LISTINGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  destination    VARCHAR(200) NOT NULL,
  country        VARCHAR(100),
  -- coords for map pin
  dest_lat       NUMERIC(9,6),
  dest_lng       NUMERIC(9,6),
  start_date     DATE,
  end_date       DATE,
  difficulty     SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  max_group_size INTEGER NOT NULL DEFAULT 10,
  min_rank       rank_tier NOT NULL DEFAULT 'bronze',
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MARKETPLACE INTERESTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_interests (
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (listing_id, user_id)
);

-- ── ACHIEVEMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  tier        rank_tier,
  points      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ── SEED ACHIEVEMENTS ────────────────────────────────────────
INSERT INTO achievements (code, name, description, tier, points) VALUES
  ('first_trek',       'First Steps',         'Complete your first trek',              'bronze',   10),
  ('century_km',       'Century Club',        'Trek 100 km total distance',            'silver',  100),
  ('summit_3k',        'Summit Seeker',       'Reach 3000m altitude',                  'silver',  150),
  ('five_countries',   'Globe Trotter',       'Trek in 5 different countries',         'gold',    300),
  ('iron_feet',        'Iron Feet',           'Trek 500 km total',                     'gold',    500),
  ('everest_gain',     'Everest Dreamer',     'Gain 8848m elevation total',            'gold',    500),
  ('platinum_paths',   'Platinum Paths',      'Trek 2000 km total',                    'platinum',1000),
  ('legend_of_trails', 'Legend of Trails',    'Trek 5000 km total',                    'legend',  5000)
ON CONFLICT (code) DO NOTHING;
