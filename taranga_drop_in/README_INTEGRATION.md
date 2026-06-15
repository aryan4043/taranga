# Taranga — Backend Integration Guide

## What's in this drop-in

| File | Goes to |
|------|---------|
| `docker-compose.yml` | Replace root `docker-compose.yml` |
| `services/db/init.sql` | New file — create this folder |
| `services/trek-service/src/index.ts` | Replace your existing file |
| `services/user-service/src/index.ts` | Replace your existing file |
| `services/package.json.template` | Copy as `package.json` into BOTH service folders |
| `services/tsconfig.json.template` | Copy as `tsconfig.json` into BOTH service folders |
| `services/Dockerfile.template` | Copy as `Dockerfile` to trek-service (port 5001) and user-service (port 5002) |
| `frontend/src/components/TrekMap.tsx` | New file — add to your components |
| `frontend/src/lib/api.ts` | New file (or replace existing) |

---

## Step 1 — Create .env at project root

```
POSTGRES_USER=admin
POSTGRES_PASSWORD=strongpassword123
JWT_SECRET=replace_this_with_64_char_random_string
GOOGLE_MAPS_API_KEY=AIza...your_key_here
```

---

## Step 2 — Create the db folder

```bash
mkdir -p services/db
# copy init.sql there
```

---

## Step 3 — Install deps in both services

```bash
cd services/trek-service && npm install
cd ../user-service && npm install
```

---

## Step 4 — Install Google Maps in frontend

```bash
cd frontend
npm install @react-google-maps/api
```

Add to your `frontend/.env.local`:
```
NEXT_PUBLIC_MAPS_KEY=AIza...your_key_here
```

### Get a Google Maps API key:
1. Go to https://console.cloud.google.com
2. Create a project → Enable **Maps JavaScript API**
3. APIs & Services → Credentials → Create API Key
4. Restrict it to your domain in production

---

## Step 5 — Use TrekMap in your UI

```tsx
import { TrekMap, MarketplaceMap } from '@/components/TrekMap'

// On a trek detail page:
<TrekMap
  start_lat={trek.start_lat}
  start_lng={trek.start_lng}
  end_lat={trek.end_lat}
  end_lng={trek.end_lng}
  waypoints={trek.waypoints}  // array of {lat, lng, altitude_m}
  height="400px"
/>

// On the marketplace page:
<MarketplaceMap
  listings={listings}           // needs dest_lat, dest_lng fields
  onSelectListing={(id) => router.push(`/marketplace/${id}`)}
  height="500px"
/>
```

---

## Step 6 — Wire your UI to the API client

Replace any hardcoded/mock data calls with the api.ts client:

```tsx
import { treks, users, auth, marketplace } from '@/lib/api'

// Login
const { user, token } = await auth.login(email, password)

// Explore page
const trekList = await treks.explore({ country: 'India', sort: 'popular' })

// Leaderboard
const board = await treks.leaderboard('distance')

// Profile page
const profile = await users.profile('username123')
// profile.achievements — array of unlocked achievements
// profile.rank — 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend'
// profile.total_distance_km, .total_treks, etc.
```

---

## Step 7 — Launch everything

```bash
# From project root
docker-compose up --build
```

- Frontend:     http://localhost:3000
- Trek API:     http://localhost:5001
- User API:     http://localhost:5002
- DB (PostGIS): localhost:5432

---

## Rank system

| Rank     | Total Distance |
|----------|---------------|
| Bronze   | 0 – 99 km     |
| Silver   | 100 – 499 km  |
| Gold     | 500 – 1999 km |
| Platinum | 2000 – 4999 km|
| Legend   | 5000+ km      |

Ranks are recalculated automatically when a trek is marked complete via `PATCH /api/treks/:id/complete`.

---

## API quick reference

### Trek Service (:5001)
| Method | Path | Auth |
|--------|------|------|
| GET  | /api/treks/explore | No |
| GET  | /api/treks/leaderboard | No |
| GET  | /api/treks/:id | No |
| POST | /api/treks | Yes |
| PATCH| /api/treks/:id/complete | Yes |
| POST | /api/treks/:id/like | Yes |
| GET  | /api/treks/my | Yes |

### User Service (:5002)
| Method | Path | Auth |
|--------|------|------|
| POST | /api/users/register | No |
| POST | /api/users/login | No |
| GET  | /api/users/profile/:username | No |
| PATCH| /api/users/profile/me | Yes |
| POST | /api/users/:id/follow | Yes |
| GET  | /api/users/search | No |
| GET  | /api/marketplace | No |
| POST | /api/marketplace | Yes |
| POST | /api/marketplace/:id/interest | Yes |
