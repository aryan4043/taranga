CREATE TABLE IF NOT EXISTS travelers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  next_dest VARCHAR(250),
  travel_date VARCHAR(100),
  rank VARCHAR(50) DEFAULT 'Bronze',
  total_distance FLOAT DEFAULT 0.0,
  total_altitude INTEGER DEFAULT 0,
  summits INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS treks (
  id SERIAL PRIMARY KEY,
  traveler_id INTEGER REFERENCES travelers(id) ON DELETE CASCADE,
  name VARCHAR(250) NOT NULL,
  distance FLOAT NOT NULL,
  altitude INTEGER NOT NULL,
  trek_date DATE NOT NULL
);

-- Seed initial data
INSERT INTO travelers (id, name, next_dest, travel_date, rank, total_distance, total_altitude, summits) VALUES
(100, 'You (Explorer)', 'Roopkund Trek', 'July 2026', 'Gold', 124.5, 4500, 4),
(1, 'Aarav Sharma', 'Everest Base Camp', 'Oct 2026', 'Platinum', 820.5, 9400, 12),
(2, 'Zoe Chen', 'Mont Blanc Circuit', 'July 2026', 'Gold', 410.0, 5200, 6),
(3, 'Marco Rossi', 'Dolomites Traverse', 'Aug 2026', 'Bronze', 85.0, 1800, 2),
(4, 'Priya Patel', 'Kanchenjunga Base', 'Nov 2026', 'Diamond', 1420.8, 16500, 18)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  next_dest = EXCLUDED.next_dest,
  travel_date = EXCLUDED.travel_date,
  rank = EXCLUDED.rank,
  total_distance = EXCLUDED.total_distance,
  total_altitude = EXCLUDED.total_altitude,
  summits = EXCLUDED.summits;

INSERT INTO treks (id, traveler_id, name, distance, altitude, trek_date) VALUES
-- You
(1, 100, 'Triund Peak', 18.0, 1100, '2025-04-12'),
(2, 100, 'Kedarkantha Trek', 20.0, 1200, '2025-05-10'),
(3, 100, 'Hampta Pass', 35.0, 1400, '2025-09-05'),
(4, 100, 'Beas Kund', 51.5, 800, '2026-02-18'),
-- Aarav
(5, 1, 'Hampta Pass', 35.0, 4270, '2024-05-10'),
(6, 1, 'Valley of Flowers', 38.0, 3858, '2024-07-22'),
(7, 1, 'Goechala Trek', 90.0, 4940, '2024-10-05'),
(8, 1, 'Stok Kangri Summit', 45.0, 6153, '2025-08-14'),
-- Zoe
(9, 2, 'Dolomites Altavia 1', 120.0, 3200, '2024-08-01'),
(10, 2, 'Tour du Mont Blanc', 170.0, 4810, '2025-06-15'),
-- Marco
(11, 3, 'Path of the Gods', 15.0, 650, '2024-09-02'),
(12, 3, 'Tour de Monte Rosa', 70.0, 1150, '2025-09-20'),
-- Priya
(13, 4, 'Annapurna Circuit', 230.0, 5416, '2023-10-12'),
(14, 4, 'Markha Valley', 75.0, 5260, '2024-08-05'),
(15, 4, 'Island Peak Climb', 32.0, 6189, '2025-04-20')
ON CONFLICT (id) DO NOTHING;

-- Adjust sequence values for auto-incrementing serial primary keys
SELECT setval('travelers_id_seq', COALESCE((SELECT MAX(id)+1 FROM travelers), 1), false);
SELECT setval('treks_id_seq', COALESCE((SELECT MAX(id)+1 FROM treks), 1), false);
