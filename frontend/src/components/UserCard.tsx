'use client';

import React, { useState } from 'react';
import { User, MapPin, Calendar, Compass, Mountain, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface TravelerProps {
  name: string;
  nextDest: string;
  date: string;
  rank: string;
  totalDistance?: number;
  totalAltitude?: number;
  summits?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  email?: string;
}

export default function UserCard({
  name,
  nextDest,
  date,
  rank,
  totalDistance = 120,
  totalAltitude = 3200,
  summits = 3,
  isSelected = false,
  onSelect,
  email
}: TravelerProps) {
  const [connectStatus, setConnectStatus] = useState<'Connect' | 'Requested' | 'Connected'>('Connect');

  const getRankColor = (rankStr: string) => {
    switch (rankStr.toLowerCase()) {
      case 'platinum':
        return 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
      case 'gold':
        return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
      case 'silver':
        return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
      case 'bronze':
        return 'linear-gradient(135deg, #b45309 0%, #78350f 100%)';
      case 'diamond':
        return 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)';
      default:
        return 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)';
    }
  };

  const handleConnectClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card selection
    if (connectStatus === 'Connect') {
      setConnectStatus('Requested');
      const targetEmail = email || 'aryaansingh121@gmail.com';
      window.location.href = `mailto:${targetEmail}?subject=Connection Request on Taranga&body=Hi ${name},\n\nI saw your profile on Taranga and would love to connect and talk about trekking!`;
    } else if (connectStatus === 'Requested') {
      setConnectStatus('Connected');
    } else {
      setConnectStatus('Connect');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`traveler-card glass ${isSelected ? 'active-card' : ''}`}
    >
      {/* Badge/Rank header */}
      <div className="card-header">
        <div className="avatar-wrapper">
          <div className="avatar">
            <User size={20} className="avatar-icon" />
          </div>
          <div className="avatar-glow" style={{ background: getRankColor(rank) }} />
        </div>
        <div className="user-info">
          <h4>{name}</h4>
          <span 
            className="rank-badge" 
            style={{ 
              background: getRankColor(rank),
              color: rank.toLowerCase() === 'platinum' || rank.toLowerCase() === 'gold' ? '#0f172a' : '#ffffff'
            }}
          >
            {rank}
          </span>
        </div>
      </div>

      {/* Traveler Microstats */}
      <div className="micro-stats">
        <div className="micro-stat" title="Distance Traveled">
          <TrendingUp size={14} className="stat-icon text-blue" />
          <span>{totalDistance} km</span>
        </div>
        <div className="micro-stat" title="Altitude Gained">
          <Mountain size={14} className="stat-icon text-emerald" />
          <span>{totalAltitude} m</span>
        </div>
      </div>

      {/* Itinerary */}
      <div className="itinerary">
        <div className="itinerary-header">
          <Compass size={13} className="itinerary-icon" />
          <span>Next Destination</span>
        </div>
        <div className="itinerary-details">
          <div className="destination">
            <MapPin size={14} className="text-muted-icon" />
            <span className="dest-text">{nextDest}</span>
          </div>
          <div className="date">
            <Calendar size={14} className="text-muted-icon" />
            <span>{date}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        className={`connect-button ${connectStatus.toLowerCase()}`}
        onClick={handleConnectClick}
      >
        {connectStatus}
      </button>

      <style jsx>{`
        .traveler-card {
          padding: 1.25rem;
          min-width: 280px;
          width: 280px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .active-card {
          border-color: var(--accent-emerald) !important;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
          background: rgba(23, 37, 68, 0.5) !important;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar-wrapper {
          position: relative;
          width: 44px;
          height: 44px;
        }

        .avatar {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          background: #0f172a;
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-icon {
          color: var(--text-muted);
        }

        .avatar-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 50%;
          z-index: 1;
          filter: blur(4px);
          opacity: 0.6;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .user-info h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }

        .rank-badge {
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1.5px 8px;
          border-radius: 100px;
          width: fit-content;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .micro-stats {
          display: flex;
          gap: 1rem;
          padding: 0.5rem 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .micro-stat {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .stat-icon {
          opacity: 0.85;
        }

        .text-blue {
          color: var(--accent-blue);
        }

        .text-emerald {
          color: var(--accent-emerald);
        }

        .itinerary {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .itinerary-header {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .itinerary-icon {
          color: var(--accent-emerald);
        }

        .itinerary-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.85rem;
          color: var(--text-main);
        }

        .destination, .date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dest-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }

        .text-muted-icon {
          color: var(--text-dark);
          flex-shrink: 0;
        }

        .connect-button {
          width: 100%;
          padding: 0.6rem;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: white;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .connect-button.connect:hover {
          background: linear-gradient(135deg, var(--accent-emerald), var(--accent-blue));
          border-color: transparent;
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
        }

        .connect-button.requested {
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent-amber);
          border-color: rgba(245, 158, 11, 0.3);
        }
        
        .connect-button.requested:hover {
          background: rgba(245, 158, 11, 0.25);
        }

        .connect-button.connected {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-emerald);
          border-color: rgba(16, 185, 129, 0.3);
        }
        
        .connect-button.connected:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          content: 'Disconnect';
        }
      `}</style>
    </motion.div>
  );
}
