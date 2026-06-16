-- Seed Users
INSERT INTO users (id, username, email, password_hash, full_name, bio, location, rank, rank_points) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'aarav', 'aryaansingh121@gmail.com', '$2a$12$2nfk9rAJt9VqIjxc1BiI2u9KcHmEsICgkt0jQDjOwtHQUf0jWOSTq', 'Aarav Sharma', 'Avid climber and explorer of Himalayan peaks.', 'Delhi, India', 'platinum', 1200),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'zoe', 'zoe@taranga.app', '$2a$12$2nfk9rAJt9VqIjxc1BiI2u9KcHmEsICgkt0jQDjOwtHQUf0jWOSTq', 'Zoe Chen', 'Alpine hiker, trail runner, and nature photographer.', 'Chamonix, France', 'gold', 650),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'marco', 'marco@taranga.app', '$2a$12$2nfk9rAJt9VqIjxc1BiI2u9KcHmEsICgkt0jQDjOwtHQUf0jWOSTq', 'Marco Rossi', 'Exploring Dolomites and alpine routes since childhood.', 'Cortina, Italy', 'bronze', 90),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'priya', 'priya@taranga.app', '$2a$12$2nfk9rAJt9VqIjxc1BiI2u9KcHmEsICgkt0jQDjOwtHQUf0jWOSTq', 'Priya Patel', 'Summit seeker, high-altitude trekker, and guide.', 'Manali, India', 'legend', 5200)
ON CONFLICT (id) DO NOTHING;

-- Seed User Stats
INSERT INTO user_stats (user_id, total_distance_km, total_elevation_m, total_treks, highest_altitude_m, total_countries) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 820.50, 9400, 12, 6153, 3),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 410.00, 5200, 6, 4810, 2),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 85.00, 1800, 2, 1150, 1),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 5420.80, 16500, 18, 6189, 6)
ON CONFLICT (user_id) DO UPDATE SET
  total_distance_km = EXCLUDED.total_distance_km,
  total_elevation_m = EXCLUDED.total_elevation_m,
  total_treks = EXCLUDED.total_treks,
  highest_altitude_m = EXCLUDED.highest_altitude_m,
  total_countries = EXCLUDED.total_countries;

-- Seed Treks
INSERT INTO treks (id, user_id, title, description, status, start_location, end_location, country, start_lat, start_lng, end_lat, end_lng, distance_km, elevation_gain_m, max_altitude_m, difficulty, duration_hours, is_public) VALUES
  ('11111111-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Kedarkantha Peak Climb', 'Stunning winter climb with panoramic views of raw Himalayan ranges.', 'completed', 'Sankri', 'Kedarkantha Peak', 'India', 31.0772, 78.1887, 31.0253, 78.2045, 20.00, 1200, 3810, 3, 14.50, true),
  ('22222222-3333-4444-5555-666666666666', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Hampta Pass Route', 'Scenic transition from green valleys to stark desert high-pass landscape.', 'completed', 'Jobri', 'Chatru', 'India', 32.2396, 77.2023, 32.3211, 77.3541, 35.00, 1400, 4270, 4, 28.00, true),
  ('33333333-4444-5555-6666-777777777777', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Tour du Mont Blanc Segment', 'Beautiful trek around the iconic Mont Blanc massif.', 'completed', 'Chamonix', 'Courmayeur', 'France', 45.9227, 6.8685, 45.7909, 6.9678, 170.00, 4810, 2600, 4, 96.00, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Waypoints for Hampta Pass (User 1 - Aarav)
INSERT INTO trek_waypoints (trek_id, seq, lat, lng, altitude_m) VALUES
  ('22222222-3333-4444-5555-666666666666', 1, 32.2396, 77.2023, 2900.00),
  ('22222222-3333-4444-5555-666666666666', 2, 32.2596, 77.2223, 3200.00),
  ('22222222-3333-4444-5555-666666666666', 3, 32.2796, 77.2523, 3600.00),
  ('22222222-3333-4444-5555-666666666666', 4, 32.2996, 77.2923, 4000.00),
  ('22222222-3333-4444-5555-666666666666', 5, 32.3211, 77.3541, 4270.00)
ON CONFLICT DO NOTHING;

-- Seed Marketplace Listings
INSERT INTO marketplace_listings (id, user_id, title, description, destination, country, dest_lat, dest_lng, start_date, end_date, difficulty, max_group_size, min_rank, is_active) VALUES
  ('f1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Everest Base Camp Expedition', 'Looking for experienced hikers to join on a 14-day EBC trek. Custom itinerary.', 'Everest Base Camp', 'Nepal', 27.9881, 86.9250, '2026-10-01', '2026-10-15', 5, 8, 'gold', true),
  ('f2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Mont Blanc Circuit 2026', 'Group hike on the classic Tour du Mont Blanc. Sharing refuges and meals.', 'Mont Blanc', 'France', 45.8326, 6.8652, '2026-07-10', '2026-07-20', 4, 6, 'bronze', true)
ON CONFLICT (id) DO NOTHING;
