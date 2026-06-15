'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Mountain, Map, Users, Trophy, TrendingUp, Compass, 
  Search, Plus, MapPin, Calendar, Check, Star, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserCard from '../components/UserCard';

// Define TS Interfaces
interface Trek {
  id: number;
  name: string;
  distance: number;
  altitude: number;
  date: string;
}

interface Traveler {
  id: number;
  name: string;
  nextDest: string;
  date: string;
  rank: string;
  totalDistance: number;
  totalAltitude: number;
  summits: number;
  history: Trek[];
}

export default function Dashboard() {
  // State for active profile being viewed
  const [activeTraveler, setActiveTraveler] = useState<Traveler | null>(null);
  
  // State for travelers list
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states for recording trek
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [newTrekName, setNewTrekName] = useState('');
  const [newTrekDistance, setNewTrekDistance] = useState('');
  const [newTrekAltitude, setNewTrekAltitude] = useState('');
  
  // Loading & service status
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Hovered trek point on the SVG chart
  const [hoveredPoint, setHoveredPoint] = useState<{ trek: Trek; x: number; y: number } | null>(null);

  // Hardcoded premium fallback data if services are loading/unavailable
  const defaultTravelers: Traveler[] = useMemo(() => [
    {
      id: 100,
      name: "You (Explorer)",
      nextDest: "Roopkund Trek",
      date: "July 2026",
      rank: "Gold",
      totalDistance: 124.5,
      totalAltitude: 4500,
      summits: 4,
      history: [
        { id: 1, name: 'Triund Peak', distance: 18, altitude: 1100, date: '2025-04-12' },
        { id: 2, name: 'Kedarkantha Trek', distance: 20, altitude: 1200, date: '2025-05-10' },
        { id: 3, name: 'Hampta Pass', distance: 35, altitude: 1400, date: '2025-09-05' },
        { id: 4, name: 'Beas Kund', distance: 51.5, altitude: 800, date: '2026-02-18' }
      ]
    },
    {
      id: 1,
      name: "Aarav Sharma",
      nextDest: "Everest Base Camp",
      date: "Oct 2026",
      rank: "Platinum",
      totalDistance: 820.5,
      totalAltitude: 9400,
      summits: 12,
      history: [
        { id: 11, name: 'Hampta Pass', distance: 35, altitude: 4270, date: '2024-05-10' },
        { id: 12, name: 'Valley of Flowers', distance: 38, altitude: 3858, date: '2024-07-22' },
        { id: 13, name: 'Goechala Trek', distance: 90, altitude: 4940, date: '2024-10-05' },
        { id: 14, name: 'Stok Kangri Summit', distance: 45, altitude: 6153, date: '2025-08-14' }
      ]
    },
    {
      id: 2,
      name: "Zoe Chen",
      nextDest: "Mont Blanc Circuit",
      date: "July 2026",
      rank: "Gold",
      totalDistance: 410,
      totalAltitude: 5200,
      summits: 6,
      history: [
        { id: 21, name: 'Dolomites Altavia 1', distance: 120, altitude: 3200, date: '2024-08-01' },
        { id: 22, name: 'Tour du Mont Blanc', distance: 170, altitude: 4810, date: '2025-06-15' }
      ]
    },
    {
      id: 3,
      name: "Marco Rossi",
      nextDest: "Dolomites Traverse",
      date: "Aug 2026",
      rank: "Bronze",
      totalDistance: 85,
      totalAltitude: 1800,
      summits: 2,
      history: [
        { id: 31, name: 'Path of the Gods', distance: 15, altitude: 650, date: '2024-09-02' },
        { id: 32, name: 'Tour de Monte Rosa', distance: 70, altitude: 1150, date: '2025-09-20' }
      ]
    },
    {
      id: 4,
      name: "Priya Patel",
      nextDest: "Kanchenjunga Base",
      date: "Nov 2026",
      rank: "Diamond",
      totalDistance: 1420.8,
      totalAltitude: 16500,
      summits: 18,
      history: [
        { id: 41, name: 'Annapurna Circuit', distance: 230, altitude: 5416, date: '2023-10-12' },
        { id: 42, name: 'Markha Valley', distance: 75, altitude: 5260, date: '2024-08-05' },
        { id: 43, name: 'Island Peak Climb', distance: 32, altitude: 6189, date: '2025-04-20' }
      ]
    }
  ], []);

  // Fetch data from Trek and User services
  useEffect(() => {
    async function fetchData() {
      try {
        const trekApiUrl = process.env.NEXT_PUBLIC_TREK_API || 'http://localhost:5001';
        const userApiUrl = process.env.NEXT_PUBLIC_USER_API || 'http://localhost:5002';
        
        // Parallel fetches
        const [statsRes, travelersRes] = await Promise.all([
          fetch(`${trekApiUrl}/api/stats`).catch(() => null),
          fetch(`${userApiUrl}/api/travelers`).catch(() => null)
        ]);

        let fetchedStats = null;
        let fetchedTravelers = null;

        if (statsRes && statsRes.ok) fetchedStats = await statsRes.json();
        if (travelersRes && travelersRes.ok) fetchedTravelers = await travelersRes.json();

        if (fetchedTravelers) {
          // Format travelers with custom histories if missing
          const formatted = fetchedTravelers.map((t: any) => {
            const fallbackItem = defaultTravelers.find(dt => dt.id === t.id) || defaultTravelers[1];
            return {
              ...fallbackItem,
              ...t
            };
          });
          setTravelers(formatted);
          
          // Set user profile as active initially
          const userProfile = defaultTravelers[0];
          const hasUser = formatted.some((t: any) => t.id === 100);
          if (!hasUser) {
            setTravelers([userProfile, ...formatted]);
            setActiveTraveler(userProfile);
          } else {
            setActiveTraveler(formatted[0]);
          }
        } else {
          // Fallback to default mock data if service unavailable
          setTravelers(defaultTravelers);
          setActiveTraveler(defaultTravelers[0]);
        }
      } catch (err: any) {
        console.error("Fetch error, using default mock data", err);
        setTravelers(defaultTravelers);
        setActiveTraveler(defaultTravelers[0]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [defaultTravelers]);

  // Handle selecting a traveler to view details
  const handleSelectTraveler = (traveler: Traveler) => {
    setActiveTraveler(traveler);
    // Reset tooltip
    setHoveredPoint(null);
  };

  // Gamification Rank system math
  const getRankThresholds = (rankStr: string) => {
    switch (rankStr.toLowerCase()) {
      case 'bronze': return { current: 'Bronze', next: 'Silver', targetDistance: 150, targetAltitude: 3000 };
      case 'silver': return { current: 'Silver', next: 'Gold', targetDistance: 400, targetAltitude: 5000 };
      case 'gold': return { current: 'Gold', next: 'Platinum', targetDistance: 800, targetAltitude: 9000 };
      case 'platinum': return { current: 'Platinum', next: 'Diamond', targetDistance: 1200, targetAltitude: 15000 };
      case 'diamond': return { current: 'Diamond', next: 'Max Rank', targetDistance: 2000, targetAltitude: 25000 };
      default: return { current: 'Bronze', next: 'Silver', targetDistance: 150, targetAltitude: 3000 };
    }
  };

  const currentThresholds = activeTraveler ? getRankThresholds(activeTraveler.rank) : getRankThresholds('Bronze');
  
  const progressPercent = useMemo(() => {
    if (!activeTraveler) return 0;
    const distRatio = activeTraveler.totalDistance / currentThresholds.targetDistance;
    const altRatio = activeTraveler.totalAltitude / currentThresholds.targetAltitude;
    // Average progress between the two targets
    const average = (Math.min(distRatio, 1) + Math.min(altRatio, 1)) / 2;
    return Math.round(average * 100);
  }, [activeTraveler, currentThresholds]);

  // Recalculates rank based on stats
  const calculateNewRank = (dist: number, alt: number) => {
    if (dist >= 1200 && alt >= 15000) return 'Diamond';
    if (dist >= 800 && alt >= 9000) return 'Platinum';
    if (dist >= 400 && alt >= 5000) return 'Gold';
    if (dist >= 150 && alt >= 3000) return 'Silver';
    return 'Bronze';
  };

  // Add new trek handler (simulated dynamic update)
  const handleRecordTrek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrekName || !newTrekDistance || !newTrekAltitude || !activeTraveler) return;

    const distVal = parseFloat(newTrekDistance);
    const altVal = parseFloat(newTrekAltitude);
    
    if (isNaN(distVal) || isNaN(altVal)) return;

    // Create new trek object
    const newTrek: Trek = {
      id: Date.now(),
      name: newTrekName,
      distance: distVal,
      altitude: altVal,
      date: new Date().toISOString().split('T')[0]
    };

    // Update active traveler stats
    const updatedHistory = [...activeTraveler.history, newTrek];
    const newDistance = parseFloat((activeTraveler.totalDistance + distVal).toFixed(1));
    const newAltitude = activeTraveler.totalAltitude + altVal;
    const newSummits = activeTraveler.summits + 1;
    const newRank = calculateNewRank(newDistance, newAltitude);

    const updatedTraveler = {
      ...activeTraveler,
      totalDistance: newDistance,
      totalAltitude: newAltitude,
      summits: newSummits,
      rank: newRank,
      history: updatedHistory
    };

    // Update state lists
    setTravelers(prev => prev.map(t => t.id === activeTraveler.id ? updatedTraveler : t));
    setActiveTraveler(updatedTraveler);

    // Reset fields
    setNewTrekName('');
    setNewTrekDistance('');
    setNewTrekAltitude('');
    setShowRecordModal(false);
  };

  // Search filter
  const filteredTravelers = travelers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.nextDest.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // SVG Chart points calculation
  const svgChartProps = useMemo(() => {
    if (!activeTraveler || activeTraveler.history.length === 0) return null;
    
    const width = 680;
    const height = 180;
    const padding = 25;
    
    const history = activeTraveler.history;
    const pointsCount = history.length;
    
    const maxAltitude = Math.max(...history.map(t => t.altitude), 1000);
    const minAltitude = 0;
    
    const xStep = pointsCount > 1 ? (width - padding * 2) / (pointsCount - 1) : 0;
    
    const coordinates = history.map((trek, index) => {
      const x = padding + index * xStep;
      // Invert Y axis for SVG (0,0 is top-left)
      const y = height - padding - ((trek.altitude - minAltitude) / (maxAltitude - minAltitude)) * (height - padding * 2);
      return { x, y, trek };
    });

    // Generate Path D
    let pathD = "";
    let areaD = "";
    
    if (coordinates.length > 0) {
      // Line path
      pathD = `M ${coordinates[0].x} ${coordinates[0].y}`;
      for (let i = 1; i < coordinates.length; i++) {
        pathD += ` L ${coordinates[i].x} ${coordinates[i].y}`;
      }
      
      // Area path
      areaD = `${pathD} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;
    }

    return { coordinates, pathD, areaD, width, height };
  }, [activeTraveler]);

  if (loading) {
    return (
      <div className="flex-center screen-center">
        <RefreshCw size={40} className="animate-spin text-emerald" />
        <p className="loading-text">Loading Taranga Dashboard...</p>
        <style jsx>{`
          .flex-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
          }
          .screen-center {
            min-height: 100vh;
            background: #030712;
          }
          .animate-spin {
            animation: spin 1.5s linear infinite;
            color: #10b981;
          }
          .loading-text {
            font-family: 'Outfit', sans-serif;
            font-weight: 500;
            color: #9ca3af;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="taranga-container">
      {/* Navbar */}
      <nav className="navbar glass">
        <div className="nav-brand">
          <Compass size={28} className="logo-icon" />
          <span className="logo-text gradient-text">Taranga</span>
        </div>
        <div className="nav-menu">
          <a href="#" className="nav-item active"><Map size={18} /><span>Dashboard</span></a>
          <a href="#" className="nav-item"><Users size={18} /><span>Marketplace</span></a>
          <a href="#" className="nav-item"><Trophy size={18} /><span>Rankings</span></a>
        </div>
        <div className="nav-profile">
          <div className="user-avatar-small">
            <Star size={14} className="gold-star" />
          </div>
          <span className="user-name">Guest Explorer</span>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <main className="dashboard-grid">
        {/* Left Side: Stats and Chart Panel */}
        <section className="main-panel">
          {activeTraveler && (
            <div className="profile-detail-card glass">
              <div className="profile-detail-header">
                <div>
                  <h1 className="traveler-main-name">{activeTraveler.name}</h1>
                  <p className="traveler-sub">Traveler Statistics & Elevation Profile</p>
                </div>
                
                {/* Record Trek Trigger */}
                {activeTraveler.id === 100 && (
                  <button 
                    onClick={() => setShowRecordModal(true)} 
                    className="gradient-border-btn pulse-glow-emerald"
                  >
                    <span className="gradient-border-btn-content">
                      <Plus size={16} /> Record a Trek
                    </span>
                  </button>
                )}
              </div>

              {/* Grid of 3 Main Statistics Cards */}
              <div className="detailed-stats-grid">
                <div className="stat-pill glass">
                  <TrendingUp className="stat-pill-icon text-blue" />
                  <div>
                    <span className="stat-label">Total Distance</span>
                    <h3 className="stat-val">{activeTraveler.totalDistance} <span className="unit">KM</span></h3>
                  </div>
                </div>

                <div className="stat-pill glass">
                  <Mountain className="stat-pill-icon text-emerald" />
                  <div>
                    <span className="stat-label">Altitude Gained</span>
                    <h3 className="stat-val">{activeTraveler.totalAltitude} <span className="unit">M</span></h3>
                  </div>
                </div>

                <div className="stat-pill glass">
                  <Trophy className="stat-pill-icon text-amber" />
                  <div>
                    <span className="stat-label">Summits & Peaks</span>
                    <h3 className="stat-val">{activeTraveler.summits} <span className="unit">DONE</span></h3>
                  </div>
                </div>
              </div>

              {/* Gamification Progress Bar */}
              <div className="gamification-card glass">
                <div className="gamification-header">
                  <div className="rank-display">
                    <span className="label">Rank:</span>
                    <span className="rank-name gradient-text">{activeTraveler.rank}</span>
                  </div>
                  <div className="next-rank-display">
                    <span>Next Rank: {currentThresholds.next}</span>
                  </div>
                </div>
                
                <div className="full-progress-bar">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="progress-fill" 
                  />
                </div>
                
                <div className="progress-legend">
                  <span>Target: {currentThresholds.targetDistance} km</span>
                  <span>{progressPercent}% Complete</span>
                  <span>Target: {currentThresholds.targetAltitude} m</span>
                </div>
              </div>

              {/* Elevation Profile Chart */}
              <div className="elevation-chart-container glass">
                <h3 className="chart-title">Elevation Profile & History</h3>
                
                {svgChartProps ? (
                  <div className="svg-wrapper" style={{ position: 'relative' }}>
                    <svg viewBox={`0 0 ${svgChartProps.width} ${svgChartProps.height}`} className="elevation-svg">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="25" y1="25" x2="655" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="25" y1="90" x2="655" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="25" y1="155" x2="655" y2="155" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Filled Area */}
                      <path d={svgChartProps.areaD} fill="url(#chartGrad)" />
                      
                      {/* Main Stroke Line */}
                      <path d={svgChartProps.pathD} stroke="url(#lineGrad)" fill="none" strokeWidth="2.5" />
                      
                      {/* Circles for Trek Peaks */}
                      {svgChartProps.coordinates.map((pt, idx) => (
                        <circle
                          key={pt.trek.id}
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint?.trek.id === pt.trek.id ? 7 : 5}
                          fill={hoveredPoint?.trek.id === pt.trek.id ? "#ffffff" : "#10b981"}
                          stroke="#030712"
                          strokeWidth="2"
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPoint({
                              trek: pt.trek,
                              x: pt.x,
                              y: pt.y - 10
                            });
                          }}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </svg>

                    {/* Chart Tooltip */}
                    <AnimatePresence>
                      {hoveredPoint && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="chart-tooltip glass"
                          style={{
                            position: 'absolute',
                            left: `${(hoveredPoint.x / 680) * 100}%`,
                            bottom: `${((180 - hoveredPoint.y) / 180) * 100 + 4}%`,
                            transform: 'translateX(-50%)',
                            pointerEvents: 'none'
                          }}
                        >
                          <h4>{hoveredPoint.trek.name}</h4>
                          <div className="tooltip-details">
                            <div><span>Alt Gain:</span> <strong>{hoveredPoint.trek.altitude} m</strong></div>
                            <div><span>Distance:</span> <strong>{hoveredPoint.trek.distance} km</strong></div>
                            <div className="tooltip-date"><span>Date:</span> {hoveredPoint.trek.date}</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="empty-chart">No trek history documented. Record a trek to begin!</div>
                )}
              </div>

              {/* Complete Trek Log list */}
              <div className="trek-history-section">
                <h3 className="section-subtitle">Trek Logbook</h3>
                <div className="trek-log-list">
                  {activeTraveler.history.slice().reverse().map((t) => (
                    <div className="trek-log-row glass" key={t.id}>
                      <div className="log-icon-box">
                        <MapPin size={16} className="text-emerald" />
                      </div>
                      <div className="log-main">
                        <span className="log-name">{t.name}</span>
                        <span className="log-date">{t.date}</span>
                      </div>
                      <div className="log-metrics">
                        <div className="metric">
                          <TrendingUp size={13} className="text-blue" />
                          <span>{t.distance} km</span>
                        </div>
                        <div className="metric">
                          <Mountain size={13} className="text-emerald" />
                          <span>{t.altitude} m</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Side: Traveler Marketplace / Connections list */}
        <section className="side-panel">
          <div className="marketplace-header glass">
            <h2>Marketplace</h2>
            <p>Meet other travelers, view stats, and plan next treks.</p>
            
            {/* Real-time search filter */}
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by destination or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="travelers-scroll-grid">
            {filteredTravelers.length > 0 ? (
              filteredTravelers.map((traveler) => (
                <UserCard
                  key={traveler.id}
                  name={traveler.name}
                  nextDest={traveler.nextDest}
                  date={traveler.date}
                  rank={traveler.rank}
                  totalDistance={traveler.totalDistance}
                  totalAltitude={traveler.totalAltitude}
                  summits={traveler.summits}
                  isSelected={activeTraveler?.id === traveler.id}
                  onSelect={() => handleSelectTraveler(traveler)}
                />
              ))
            ) : (
              <div className="no-results glass">
                <Compass size={24} className="text-dark" />
                <p>No travelers match your search.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Record Trek Modal Overlay */}
      <AnimatePresence>
        {showRecordModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-box glass"
            >
              <div className="modal-header">
                <h2>Record New Adventure</h2>
                <button className="close-btn" onClick={() => setShowRecordModal(false)}>×</button>
              </div>
              <form onSubmit={handleRecordTrek} className="modal-form">
                <div className="form-group">
                  <label>Trek/Location Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Roopkund Pass, Triund Summit"
                    value={newTrekName}
                    onChange={(e) => setNewTrekName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Distance Traveled (km)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="e.g. 15.5"
                      value={newTrekDistance}
                      onChange={(e) => setNewTrekDistance(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Altitude Gained (meters)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 850"
                      value={newTrekAltitude}
                      onChange={(e) => setNewTrekAltitude(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="submit-btn gradient-border-btn">
                  <span className="gradient-border-btn-content">Record & Rank Up</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .taranga-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-height: 100vh;
        }

        /* Navbar CSS */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-radius: 20px;
        }
        
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .logo-icon {
          color: var(--accent-emerald);
          filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.8rem;
          letter-spacing: -0.04em;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--text-muted);
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .nav-item:hover, .nav-item.active {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-item.active {
          border-bottom: 2px solid var(--accent-emerald);
          border-radius: 10px 10px 0 0;
        }

        .nav-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar-small {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-blue) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gold-star {
          color: #fff;
        }

        .user-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-main);
        }

        /* Layout Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Main Left Panel */
        .main-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .profile-detail-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .profile-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
        }

        .traveler-main-name {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.1;
        }

        .traveler-sub {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        .detailed-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-pill {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-pill-icon {
          width: 44px;
          height: 44px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 12px;
        }

        .stat-label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .stat-val {
          font-size: 1.6rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .unit {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Gamification Progress Styling */
        .gamification-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .gamification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
        }

        .rank-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rank-display .label {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .rank-name {
          font-size: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .next-rank-display {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .full-progress-bar {
          height: 8px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 100px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, var(--accent-emerald) 0%, var(--accent-blue) 100%);
        }

        .progress-legend {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-dark);
          font-weight: 500;
        }

        /* Elevation Chart Styles */
        .elevation-chart-container {
          padding: 1.5rem;
        }

        .chart-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }

        .svg-wrapper {
          width: 100%;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 16px;
          padding: 0.5rem;
        }

        .elevation-svg {
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }

        /* Chart Tooltip */
        .chart-tooltip {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          min-width: 160px;
          font-size: 0.8rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
          z-index: 10;
        }

        .chart-tooltip h4 {
          font-size: 0.9rem;
          margin-bottom: 0.35rem;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tooltip-details {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          color: var(--text-muted);
        }

        .tooltip-details strong {
          color: var(--text-main);
        }

        .tooltip-date {
          font-size: 0.75rem;
          color: var(--text-dark);
          margin-top: 0.15rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 0.15rem;
        }

        .empty-chart {
          padding: 3rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        /* Trek logbook lists */
        .trek-history-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .section-subtitle {
          font-size: 1.15rem;
          font-weight: 600;
        }

        .trek-log-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .trek-log-row {
          padding: 0.85rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-radius: 16px;
        }

        .log-icon-box {
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .log-main {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .log-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .log-date {
          font-size: 0.75rem;
          color: var(--text-dark);
        }

        .log-metrics {
          display: flex;
          gap: 1rem;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 500;
        }

        /* Right Side Panel / Marketplace */
        .side-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .marketplace-header {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .marketplace-header h2 {
          font-size: 1.4rem;
        }

        .marketplace-header p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .search-bar {
          position: relative;
          width: 100%;
          margin-top: 0.75rem;
        }

        .search-bar input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.65rem 1rem 0.65rem 2.5rem;
          color: white;
          font-family: inherit;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .search-bar input:focus {
          outline: none;
          border-color: var(--accent-emerald);
          background: rgba(0, 0, 0, 0.3);
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-dark);
          pointer-events: none;
        }

        .travelers-scroll-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 700px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .no-results {
          padding: 3rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Modal / Record Trek Overlays */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(3, 7, 18, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1.5rem;
        }

        .modal-box {
          width: 100%;
          max-width: 460px;
          padding: 2rem;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          font-size: 1.3rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.8rem;
          cursor: pointer;
          line-height: 1;
        }

        .close-btn:hover {
          color: white;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: white;
          font-family: inherit;
          font-size: 0.9rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent-emerald);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .submit-btn {
          width: 100%;
          margin-top: 0.5rem;
        }

        .text-blue { color: var(--accent-blue); }
        .text-emerald { color: var(--accent-emerald); }
        .text-amber { color: var(--accent-amber); }
        .text-dark { color: var(--text-dark); }
      `}</style>
    </div>
  );
}
