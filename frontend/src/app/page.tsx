'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Mountain, Map, Users, Trophy, TrendingUp, Compass, 
  Search, Plus, MapPin, Calendar, Check, Star, RefreshCw,
  LogOut, Lock, Mail, User as UserIcon, BookOpen, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserCard from '../components/UserCard';
import { TrekMap, MarketplaceMap } from '../components/TrekMap';
import { auth, users, treks, marketplace } from '../lib/api';

// TS Interfaces
interface Waypoint {
  lat: number;
  lng: number;
  altitude_m?: number;
}

interface Trek {
  id: string;
  title: string;
  description?: string;
  status: 'planned' | 'active' | 'completed';
  start_location?: string;
  end_location?: string;
  country?: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  distance_km: number;
  elevation_gain_m: number;
  max_altitude_m: number;
  difficulty?: number;
  duration_hours?: number;
  completed_at?: string;
  waypoints?: Waypoint[];
}

interface Achievement {
  code: string;
  name: string;
  description: string;
  tier: string;
  earned_at: string;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  rank: string;
  rank_points: number;
  total_distance_km: number;
  total_elevation_m: number;
  total_treks: number;
  highest_altitude_m: number;
  total_countries: number;
  achievements?: Achievement[];
}

interface MarketplaceTrip {
  id: string;
  title: string;
  description?: string;
  destination: string;
  country?: string;
  dest_lat: number;
  dest_lng: number;
  start_date?: string;
  end_date?: string;
  difficulty?: number;
  max_group_size: number;
  min_rank: string;
  creator_rank: string;
}

export default function Dashboard() {
  // Authentication states
  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Profile & User lists
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [discoveredUsers, setDiscoveredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trek logbook & Maps
  const [userTreks, setUserTreks] = useState<Trek[]>([]);
  const [activeTrek, setActiveTrek] = useState<Trek | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ trek: Trek; x: number; y: number } | null>(null);
  
  // Marketplace states
  const [trips, setTrips] = useState<MarketplaceTrip[]>([]);
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripTitle, setTripTitle] = useState('');
  const [tripDesc, setTripDesc] = useState('');
  const [tripDest, setTripDest] = useState('');
  const [tripLat, setTripLat] = useState('28.5');
  const [tripLng, setTripLng] = useState('84.1');
  
  // Record trek modal states
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [trekTitle, setTrekTitle] = useState('');
  const [trekDesc, setTrekDesc] = useState('');
  const [trekDist, setTrekDist] = useState('');
  const [trekElev, setTrekElev] = useState('');
  const [trekMaxAlt, setTrekMaxAlt] = useState('');
  const [trekStartLat, setTrekStartLat] = useState('28.5');
  const [trekStartLng, setTrekStartLng] = useState('84.1');
  const [trekEndLat, setTrekEndLat] = useState('28.6');
  const [trekEndLng, setTrekEndLng] = useState('84.2');

  const [loading, setLoading] = useState(true);

  // Read Token from local storage on load
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (savedToken) {
      setToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch logged in profile and marketplace trips
  useEffect(() => {
    if (!token) return;

    async function loadData() {
      try {
        // Search user profile dynamically. Defaulting to 'aarav' or the registered username.
        const currentUsername = typeof window !== 'undefined' ? localStorage.getItem('username') || 'aarav' : 'aarav';
        
        const [profileData, tripsList, searchList] = await Promise.all([
          users.profile(currentUsername).catch(() => null),
          marketplace.list().catch(() => []),
          users.search('').catch(() => [])
        ]);

        if (profileData) {
          setMyProfile(profileData);
          setActiveProfile(profileData);
          
          // Load my treks
          const myTreksList = await treks.my().catch(() => []);
          setUserTreks(myTreksList);
          if (myTreksList.length > 0) {
            // Fetch detailed first trek containing waypoints
            const detailTrek = await treks.get(myTreksList[0].id).catch(() => myTreksList[0]);
            setActiveTrek(detailTrek);
          }
        }
        
        setTrips(tripsList);
        setDiscoveredUsers(searchList.filter((u: any) => u.username !== currentUsername));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // Handle Search for travelers in real-time
  useEffect(() => {
    if (!token) return;
    
    const delayDebounce = setTimeout(async () => {
      try {
        const results = await users.search(searchQuery);
        const currentUsername = localStorage.getItem('username') || 'aarav';
        setDiscoveredUsers(results.filter((u: any) => u.username !== currentUsername));
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token]);

  // Auth Submit Action
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    
    try {
      if (authMode === 'login') {
        const res = await auth.login(email, password);
        if (res && res.token) {
          localStorage.setItem('username', res.user.username);
          setToken(res.token);
        } else {
          setAuthError('Authentication failed');
        }
      } else {
        const res = await auth.register({
          username,
          email,
          password,
          full_name: fullName
        });
        if (res && res.token) {
          localStorage.setItem('username', res.user.username);
          setToken(res.token);
        } else {
          setAuthError('Registration failed');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication request failed');
    } finally {
      setLoading(false);
    }
  };

  // Sign out Handler
  const handleLogout = () => {
    auth.logout();
    localStorage.removeItem('username');
    setToken(null);
    setMyProfile(null);
    setActiveProfile(null);
    setUserTreks([]);
    setActiveTrek(null);
  };

  // Select traveler to view profile
  const handleSelectTraveler = async (travelerUsername: string) => {
    try {
      setLoading(true);
      const profileData = await users.profile(travelerUsername);
      setActiveProfile(profileData);
      
      // Load public treks for this user from explore feed
      const allTreks = await treks.explore().catch(() => []);
      const userPublicTreks = allTreks.filter((t: any) => t.username === travelerUsername);
      setUserTreks(userPublicTreks);
      
      if (userPublicTreks.length > 0) {
        const detailedTrek = await treks.get(userPublicTreks[0].id).catch(() => userPublicTreks[0]);
        setActiveTrek(detailedTrek);
      } else {
        setActiveTrek(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Select specific trek to view route map
  const handleSelectTrek = async (trek: Trek) => {
    try {
      const detailedTrek = await treks.get(trek.id).catch(() => trek);
      setActiveTrek(detailedTrek);
    } catch (err) {
      setActiveTrek(trek);
    }
  };

  // Create new Trek and complete it immediately to rank up
  const handleRecordTrekSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trekTitle || !trekDist || !trekElev) return;

    try {
      setLoading(true);
      // 1. Create Trek
      const trekResult = await treks.create({
        title: trekTitle,
        description: trekDesc,
        start_location: 'Start Point',
        end_location: 'End Point',
        country: 'India',
        start_lat: parseFloat(trekStartLat),
        start_lng: parseFloat(trekStartLng),
        end_lat: parseFloat(trekEndLat),
        end_lng: parseFloat(trekEndLng),
        distance_km: parseFloat(trekDist),
        elevation_gain_m: parseInt(trekElev),
        max_altitude_m: parseInt(trekMaxAlt) || parseInt(trekElev) + 500,
        difficulty: 3,
        duration_hours: 6,
        started_at: new Date().toISOString(),
        waypoints: [
          { lat: parseFloat(trekStartLat), lng: parseFloat(trekStartLng), altitude_m: 2000 },
          { lat: (parseFloat(trekStartLat) + parseFloat(trekEndLat)) / 2, lng: (parseFloat(trekStartLng) + parseFloat(trekEndLng)) / 2, altitude_m: 2500 },
          { lat: parseFloat(trekEndLat), lng: parseFloat(trekEndLng), altitude_m: parseInt(trekMaxAlt) || 3000 }
        ]
      });

      if (trekResult && trekResult.id) {
        // 2. Mark completed to unlock achievements and update rank
        await treks.complete(trekResult.id);

        // 3. Reload profile
        const currentUsername = localStorage.getItem('username') || 'aarav';
        const profileData = await users.profile(currentUsername);
        setMyProfile(profileData);
        setActiveProfile(profileData);

        const myTreksList = await treks.my().catch(() => []);
        setUserTreks(myTreksList);
        if (myTreksList.length > 0) {
          const detailTrek = await treks.get(myTreksList[0].id).catch(() => myTreksList[0]);
          setActiveTrek(detailTrek);
        }

        // Reset fields
        setTrekTitle('');
        setTrekDesc('');
        setTrekDist('');
        setTrekElev('');
        setTrekMaxAlt('');
        setShowRecordModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit trek to database");
    } finally {
      setLoading(false);
    }
  };

  // Create group trip listing in marketplace
  const handleCreateTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripTitle || !tripDest) return;

    try {
      setLoading(true);
      await marketplace.create({
        title: tripTitle,
        description: tripDesc,
        destination: tripDest,
        country: 'India',
        dest_lat: parseFloat(tripLat),
        dest_lng: parseFloat(tripLng),
        start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days out
        end_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        difficulty: 4,
        max_group_size: 8,
        min_rank: 'bronze'
      });

      const list = await marketplace.list();
      setTrips(list);
      
      setTripTitle('');
      setTripDesc('');
      setTripDest('');
      setShowTripModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create marketplace listing");
    } finally {
      setLoading(false);
    }
  };

  // Rank milestone thresholds helper
  const getRankThresholds = (rankStr: string) => {
    switch (rankStr.toLowerCase()) {
      case 'bronze': return { current: 'Bronze', next: 'Silver', targetDistance: 100 };
      case 'silver': return { current: 'Silver', next: 'Gold', targetDistance: 500 };
      case 'gold': return { current: 'Gold', next: 'Platinum', targetDistance: 2000 };
      case 'platinum': return { current: 'Platinum', next: 'Legend', targetDistance: 5000 };
      case 'legend': return { current: 'Legend', next: 'Max RankReached', targetDistance: 10000 };
      default: return { current: 'Bronze', next: 'Silver', targetDistance: 100 };
    }
  };

  const currentThresholds = activeProfile ? getRankThresholds(activeProfile.rank) : getRankThresholds('Bronze');
  const progressPercent = useMemo(() => {
    if (!activeProfile) return 0;
    return Math.min(Math.round((activeProfile.total_distance_km / currentThresholds.targetDistance) * 100), 100);
  }, [activeProfile, currentThresholds]);

  // SVG Line Chart coordinates math
  const svgChartProps = useMemo(() => {
    if (!userTreks || userTreks.length === 0) return null;
    
    const width = 680;
    const height = 180;
    const padding = 25;
    
    const completed = userTreks.filter(t => t.status === 'completed');
    if (completed.length === 0) return null;
    
    const maxAltitude = Math.max(...completed.map(t => t.max_altitude_m), 1000);
    const minAltitude = 0;
    
    const xStep = completed.length > 1 ? (width - padding * 2) / (completed.length - 1) : 0;
    
    const coordinates = completed.map((trek, index) => {
      const x = padding + index * xStep;
      const y = height - padding - ((trek.max_altitude_m - minAltitude) / (maxAltitude - minAltitude)) * (height - padding * 2);
      return { x, y, trek };
    });

    let pathD = "";
    let areaD = "";
    
    if (coordinates.length > 0) {
      pathD = `M ${coordinates[0].x} ${coordinates[0].y}`;
      for (let i = 1; i < coordinates.length; i++) {
        pathD += ` L ${coordinates[i].x} ${coordinates[i].y}`;
      }
      areaD = `${pathD} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;
    }

    return { coordinates, pathD, areaD, width, height };
  }, [userTreks]);

  // Auth view overlay if token is missing
  if (!token) {
    return (
      <div className="auth-screen">
        <div className="auth-box glass pulse-glow-emerald">
          <div className="auth-header">
            <Compass size={40} className="logo-icon animate-bounce" />
            <h1 className="logo-text gradient-text">Taranga</h1>
            <p>Connect, track adventures, and rank up with fellow trekkers.</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={authMode === 'login' ? 'active-tab' : ''} 
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
            >
              Sign In
            </button>
            <button 
              className={authMode === 'register' ? 'active-tab' : ''} 
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="auth-error glass">
              <AlertTriangle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === 'register' && (
              <>
                <div className="form-group">
                  <label><UserIcon size={14} /> Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label><Star size={14} /> Username</label>
                  <input 
                    type="text" 
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label><Mail size={14} /> Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label><Lock size={14} /> Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn gradient-border-btn" disabled={loading}>
              <span className="gradient-border-btn-content">
                {loading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Register'}
              </span>
            </button>
          </form>

          <div className="demo-banner glass">
            <span>💡 <strong>Quick Demo Login:</strong> aryaansingh121@gmail.com / password123</span>
          </div>
        </div>

        <style jsx>{`
          .auth-screen {
            min-height: 100vh;
            background: #030712;
            background-image: 
              radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 40%),
              radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 45%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }
          .auth-box {
            width: 100%;
            max-width: 440px;
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            border-radius: 28px;
          }
          .auth-header {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }
          .logo-icon {
            color: #10b981;
            filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.4));
          }
          .logo-text {
            font-size: 2.2rem;
            font-weight: 900;
          }
          .auth-header p {
            font-size: 0.85rem;
            color: #9ca3af;
            line-height: 1.4;
          }
          .auth-tabs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            padding: 0.25rem;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .auth-tabs button {
            background: none;
            border: none;
            color: #9ca3af;
            padding: 0.6rem;
            border-radius: 10px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.2s;
          }
          .auth-tabs .active-tab {
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          .auth-error {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
          }
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }
          .form-group label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #9ca3af;
            display: flex;
            align-items: center;
            gap: 0.35rem;
          }
          .form-group input {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 0.7rem 1rem;
            color: white;
            font-family: inherit;
            font-size: 0.9rem;
          }
          .form-group input:focus {
            outline: none;
            border-color: #10b981;
          }
          .submit-btn {
            width: 100%;
            margin-top: 0.5rem;
          }
          .demo-banner {
            padding: 0.65rem 0.85rem;
            border-radius: 12px;
            font-size: 0.75rem;
            color: #f59e0b;
            border-color: rgba(245, 158, 11, 0.15);
            background: rgba(245, 158, 11, 0.05);
            text-align: center;
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
          <button onClick={() => activeProfile && handleSelectTraveler(myProfile?.username || '')} className="nav-item active">
            <Map size={18} /><span>Dashboard</span>
          </button>
        </div>
        <div className="nav-profile">
          <div className="user-avatar-small">
            <Star size={14} className="gold-star" />
          </div>
          <span className="user-name">{myProfile?.full_name || 'Hiker'}</span>
          <button className="logout-btn" onClick={handleLogout} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <main className="dashboard-grid">
        {/* Left Side: Stats and Route/Chart Panel */}
        <section className="main-panel">
          {activeProfile && (
            <div className="profile-detail-card glass">
              <div className="profile-detail-header">
                <div>
                  <h1 className="traveler-main-name">{activeProfile.full_name}</h1>
                  <p className="traveler-sub">@{activeProfile.username} — {activeProfile.location || 'Unknown location'}</p>
                </div>
                
                {/* Record Trek Trigger */}
                {myProfile && activeProfile.id === myProfile.id && (
                  <div className="action-buttons-row">
                    <button 
                      onClick={() => setShowTripModal(true)} 
                      className="trip-btn glass"
                    >
                      <Plus size={14} /> Plan a Trip
                    </button>
                    <button 
                      onClick={() => setShowRecordModal(true)} 
                      className="gradient-border-btn pulse-glow-emerald"
                    >
                      <span className="gradient-border-btn-content">
                        <Plus size={16} /> Record a Trek
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {activeProfile.bio && (
                <div className="bio-block glass">
                  <p>{activeProfile.bio}</p>
                </div>
              )}

              {/* Grid of 3 Main Statistics Cards */}
              <div className="detailed-stats-grid">
                <div className="stat-pill glass">
                  <TrendingUp className="stat-pill-icon text-blue" />
                  <div>
                    <span className="stat-label">Total Distance</span>
                    <h3 className="stat-val">{activeProfile.total_distance_km || 0} <span className="unit">KM</span></h3>
                  </div>
                </div>

                <div className="stat-pill glass">
                  <Mountain className="stat-pill-icon text-emerald" />
                  <div>
                    <span className="stat-label">Elevation Gain</span>
                    <h3 className="stat-val">{activeProfile.total_elevation_m || 0} <span className="unit">M</span></h3>
                  </div>
                </div>

                <div className="stat-pill glass">
                  <Trophy className="stat-pill-icon text-amber" />
                  <div>
                    <span className="stat-label">Completed Treks</span>
                    <h3 className="stat-val">{activeProfile.total_treks || 0} <span className="unit">DONE</span></h3>
                  </div>
                </div>
              </div>

              {/* Gamification Progress Bar */}
              <div className="gamification-card glass">
                <div className="gamification-header">
                  <div className="rank-display">
                    <span className="label">Rank:</span>
                    <span className="rank-name gradient-text">{activeProfile.rank}</span>
                  </div>
                  <div className="next-rank-display">
                    <span>Target: {currentThresholds.targetDistance} km for {currentThresholds.next}</span>
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
                  <span>Current: {activeProfile.total_distance_km} km</span>
                  <span>{progressPercent}% Milestone Achieved</span>
                  <span>Target: {currentThresholds.targetDistance} km</span>
                </div>
              </div>

              {/* Map & Chart Section */}
              <div className="mapping-grid">
                {/* 1. Trek Route Map */}
                <div className="map-view-container glass">
                  <h3 className="view-title"><Map size={16} className="text-emerald" /> Route Coordinates & Map</h3>
                  <TrekMap
                    start_lat={activeTrek?.start_lat}
                    start_lng={activeTrek?.start_lng}
                    end_lat={activeTrek?.end_lat}
                    end_lng={activeTrek?.end_lng}
                    waypoints={activeTrek?.waypoints}
                    height="320px"
                  />
                  {activeTrek && (
                    <div className="active-trek-badge">
                      <span>Currently View: <strong>{activeTrek.title}</strong> ({activeTrek.distance_km} km)</span>
                    </div>
                  )}
                </div>

                {/* 2. Elevation Profile Chart */}
                <div className="elevation-chart-container glass">
                  <h3 className="chart-title"><Mountain size={16} className="text-blue" /> Elevation Profile</h3>
                  
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
                        <line x1="25" y1="25" x2="655" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="25" y1="90" x2="655" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="25" y1="155" x2="655" y2="155" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <path d={svgChartProps.areaD} fill="url(#chartGrad)" />
                        <path d={svgChartProps.pathD} stroke="url(#lineGrad)" fill="none" strokeWidth="2.5" />
                        {svgChartProps.coordinates.map((pt) => (
                          <circle
                            key={pt.trek.id}
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredPoint?.trek.id === pt.trek.id ? 7 : 5}
                            fill={hoveredPoint?.trek.id === pt.trek.id ? "#ffffff" : "#10b981"}
                            stroke="#030712"
                            strokeWidth="2"
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={() => {
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

                      {/* Tooltip */}
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
                            <h4>{hoveredPoint.trek.title}</h4>
                            <div className="tooltip-details">
                              <div><span>Max Alt:</span> <strong>{hoveredPoint.trek.max_altitude_m} m</strong></div>
                              <div><span>Distance:</span> <strong>{hoveredPoint.trek.distance_km} km</strong></div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="empty-chart">No trek logs found. Record a trek to populate!</div>
                  )}
                </div>
              </div>

              {/* Logbook list */}
              {userTreks.length > 0 && (
                <div className="trek-history-section">
                  <h3 className="section-subtitle"><BookOpen size={16} /> Hiker Logbook</h3>
                  <div className="trek-log-list">
                    {userTreks.map((t) => (
                      <div 
                        className={`trek-log-row glass ${activeTrek?.id === t.id ? 'selected-row' : ''}`} 
                        key={t.id}
                        onClick={() => handleSelectTrek(t)}
                      >
                        <div className="log-icon-box">
                          <MapPin size={16} className="text-emerald" />
                        </div>
                        <div className="log-main">
                          <span className="log-name">{t.title}</span>
                          <span className="log-date">{t.country || 'India'} — {t.status}</span>
                        </div>
                        <div className="log-metrics">
                          <div className="metric">
                            <TrendingUp size={13} className="text-blue" />
                            <span>{t.distance_km} km</span>
                          </div>
                          <div className="metric">
                            <Mountain size={13} className="text-emerald" />
                            <span>{t.elevation_gain_m} m</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements Block */}
              {activeProfile.achievements && activeProfile.achievements.length > 0 && (
                <div className="achievements-section">
                  <h3 className="section-subtitle"><Star size={16} className="text-amber" /> Badges & Achievements</h3>
                  <div className="badges-grid">
                    {activeProfile.achievements.map((ach) => (
                      <div className="badge-pill glass" key={ach.code}>
                        <div className={`badge-icon ${ach.tier}`}>
                          <Star size={16} />
                        </div>
                        <div className="badge-info">
                          <h4>{ach.name}</h4>
                          <p>{ach.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Side: Traveler Search & Marketplace Map */}
        <section className="side-panel">
          {/* Marketplace Map Pin display */}
          <div className="marketplace-map-container glass">
            <h3><Map size={16} className="text-emerald" /> Marketplace Trips</h3>
            <MarketplaceMap
              listings={trips}
              height="260px"
            />
          </div>

          {/* Traveler Finder Search Bar */}
          <div className="marketplace-header glass">
            <h2>Discover Hikers</h2>
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search travelers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Scrollable list of users */}
          <div className="travelers-scroll-grid">
            {discoveredUsers.length > 0 ? (
              discoveredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  name={user.full_name}
                  nextDest={user.location || 'Exploration'}
                  date="Active Hiker"
                  rank={user.rank}
                  totalDistance={parseFloat(user.total_distance_km || '0')}
                  totalAltitude={parseInt(user.total_elevation_m || '0')}
                  summits={parseInt(user.total_treks || '0')}
                  isSelected={activeProfile?.id === user.id}
                  onSelect={() => handleSelectTraveler(user.username)}
                  email={user.email}
                />
              ))
            ) : (
              <div className="no-results glass">
                <Compass size={24} className="text-dark" />
                <p>No hikers found.</p>
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
                <h2>Record Hiker Adventure</h2>
                <button className="close-btn" onClick={() => setShowRecordModal(false)}>×</button>
              </div>
              <form onSubmit={handleRecordTrekSubmit} className="modal-form">
                <div className="form-group">
                  <label>Trek Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Triund Summit, Roopkund Route"
                    value={trekTitle}
                    onChange={(e) => setTrekTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input 
                    type="text" 
                    placeholder="Describe the climb..."
                    value={trekDesc}
                    onChange={(e) => setTrekDesc(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Distance (km)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="18.5"
                      value={trekDist}
                      onChange={(e) => setTrekDist(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Elevation Gain (m)</label>
                    <input 
                      type="number" 
                      placeholder="1200"
                      value={trekElev}
                      onChange={(e) => setTrekElev(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Max Altitude (m)</label>
                    <input 
                      type="number" 
                      placeholder="2875"
                      value={trekMaxAlt}
                      onChange={(e) => setTrekMaxAlt(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Coords (Lat/Lng)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="number" step="0.0001" value={trekStartLat} onChange={(e) => setTrekStartLat(e.target.value)} required />
                      <input type="number" step="0.0001" value={trekStartLng} onChange={(e) => setTrekStartLng(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>End Coords (Lat/Lng)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="number" step="0.0001" value={trekEndLat} onChange={(e) => setTrekEndLat(e.target.value)} required />
                      <input type="number" step="0.0001" value={trekEndLng} onChange={(e) => setTrekEndLng(e.target.value)} required />
                    </div>
                  </div>
                </div>
                <button type="submit" className="submit-btn gradient-border-btn" disabled={loading}>
                  <span className="gradient-border-btn-content">
                    {loading ? 'Submitting...' : 'Record & Calculate Rank'}
                  </span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plan Trip Modal Overlay */}
      <AnimatePresence>
        {showTripModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-box glass"
            >
              <div className="modal-header">
                <h2>Create Group Listing</h2>
                <button className="close-btn" onClick={() => setShowTripModal(false)}>×</button>
              </div>
              <form onSubmit={handleCreateTripSubmit} className="modal-form">
                <div className="form-group">
                  <label>Trip Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Everest Base Camp 2026"
                    value={tripTitle}
                    onChange={(e) => setTripTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Everest Camp, Nepal"
                    value={tripDest}
                    onChange={(e) => setTripDest(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input 
                    type="text" 
                    placeholder="Refuge details, dates details..."
                    value={tripDesc}
                    onChange={(e) => setTripDesc(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Destination Lat</label>
                    <input type="number" step="0.0001" value={tripLat} onChange={(e) => setTripLat(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Destination Lng</label>
                    <input type="number" step="0.0001" value={tripLng} onChange={(e) => setTripLng(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="submit-btn gradient-border-btn" disabled={loading}>
                  <span className="gradient-border-btn-content">
                    {loading ? 'Submitting...' : 'Post Trip to Marketplace'}
                  </span>
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

        /* Navbar */
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
          background: none;
          border: none;
          color: var(--text-muted);
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-item.active {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.04);
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
        .logout-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 5px;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .logout-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        /* Layout Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
        }
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Left Panel */
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
        .action-buttons-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .trip-btn {
          border: 1px solid var(--border-color);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          transition: background 0.2s;
        }
        .trip-btn:hover {
          background: rgba(255,255,255,0.05);
        }
        .bio-block {
          padding: 1rem 1.25rem;
          border-radius: 14px;
          font-size: 0.9rem;
          color: var(--text-muted);
          background: rgba(0,0,0,0.15);
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

        /* Gamification Progress */
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

        /* Mapping Section Grid */
        .mapping-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .mapping-grid {
            grid-template-columns: 1fr;
          }
        }
        .map-view-container {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .view-title {
          font-size: 1.05rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .active-trek-badge {
          font-size: 0.8rem;
          color: var(--text-muted);
          padding: 0.35rem 0.5rem;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          text-align: center;
        }

        .elevation-chart-container {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .chart-title {
          font-size: 1.05rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
        .chart-tooltip {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          min-width: 150px;
          font-size: 0.8rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
          z-index: 10;
        }
        .chart-tooltip h4 {
          font-size: 0.85rem;
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
        .empty-chart {
          padding: 4.5rem 2rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Logbook List */
        .trek-history-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .section-subtitle {
          font-size: 1.15rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
          cursor: pointer;
          transition: all 0.2s;
        }
        .trek-log-row:hover, .selected-row {
          border-color: var(--accent-emerald);
          background: rgba(255,255,255,0.05);
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
          text-transform: uppercase;
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

        /* Achievements Badges */
        .achievements-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.75rem;
        }
        .badge-pill {
          padding: 0.85rem 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .badge-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .badge-icon.bronze { background: rgba(180, 83, 9, 0.15); color: #b45309; border: 1px solid rgba(180, 83, 9, 0.3); }
        .badge-icon.silver { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }
        .badge-icon.gold { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-icon.platinum { background: rgba(226, 232, 240, 0.15); color: #e2e8f0; border: 1px solid rgba(226, 232, 240, 0.3); }
        .badge-icon.legend { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); }
        .badge-info h4 {
          font-size: 0.85rem;
          font-weight: 700;
        }
        .badge-info p {
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        /* Right Panel */
        .side-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .marketplace-map-container {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .marketplace-map-container h3 {
          font-size: 1.05rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .marketplace-header {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .marketplace-header h2 {
          font-size: 1.25rem;
        }
        .search-bar {
          position: relative;
          width: 100%;
        }
        .search-bar input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          color: white;
          font-family: inherit;
          font-size: 0.85rem;
        }
        .search-bar input:focus {
          outline: none;
          border-color: var(--accent-emerald);
        }
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-dark);
        }
        .travelers-scroll-grid {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          max-height: 480px;
          overflow-y: auto;
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

        /* Modal Overlays */
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
          max-width: 480px;
          padding: 2rem;
          position: relative;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
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
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group label {
          font-size: 0.75rem;
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
          padding: 0.65rem 0.85rem;
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
          gap: 0.75rem;
        }

        .text-blue { color: var(--accent-blue); }
        .text-emerald { color: var(--accent-emerald); }
        .text-amber { color: var(--accent-amber); }
        .text-dark { color: var(--text-dark); }
      `}</style>
    </div>
  );
}
