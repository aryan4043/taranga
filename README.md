# ⛰️ TrekMate: Strava for Trekkers

TrekMate is a premium, microservices-based application for the trekking community.

## 🚀 Getting Started

To launch the entire platform (Frontend, Backend, Database):

```bash
docker-compose up --build
```

The application will be available at:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Trek API**: [http://localhost:5001](http://localhost:5001)
- **User API**: [http://localhost:5002](http://localhost:5002)

## 🏗️ Architecture

- **`frontend/`**: Next.js App Router with premium Glassmorphism UI.
- **`services/trek-service`**: Handles distance/altitude calculations and stats.
- **`services/user-service`**: Manages traveler connections and the marketplace.
- **`db`**: PostgreSQL + PostGIS for spatial data tracking.

## 🏅 Ranking System
Ranks are calculated based on:
1. **Total Distance (km)**
2. **Total Altitude Gain (m)**
3. **Number of Summits**

| Rank | Requirements |
| :--- | :--- |
| **Bronze** | < 100km or < 2000m altitude |
| **Gold** | > 500km or > 8000m altitude |
| **Platinum** | 8848m+ (Everest equivalent) |

---
*Built with Antigravity.*
