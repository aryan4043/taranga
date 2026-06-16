// frontend/src/components/TrekMap.tsx
// Google Maps component — shows trek route, start/end pins, and marketplace pins
// Requires: npm install @react-google-maps/api

'use client'
import { useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api'

const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY || ''

const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a3a4a' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#1f2e1f' }] },
]

// ── Trek Route Map ────────────────────────────────────────────
interface Waypoint { lat: number; lng: number; altitude_m?: number }

interface TrekMapProps {
  start_lat?: number
  start_lng?: number
  end_lat?: number
  end_lng?: number
  waypoints?: Waypoint[]
  height?: string
}

export function TrekMap({ start_lat, start_lng, end_lat, end_lng, waypoints = [], height = '400px' }: TrekMapProps) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY })

  const center = start_lat && start_lng
    ? { lat: start_lat, lng: start_lng }
    : { lat: 28.5, lng: 84.1 }  // default: Nepal

  const path = waypoints.length > 0
    ? waypoints.map(w => ({ lat: Number(w.lat), lng: Number(w.lng) }))
    : [
        ...(start_lat && start_lng ? [{ lat: Number(start_lat), lng: Number(start_lng) }] : []),
        ...(end_lat && end_lng     ? [{ lat: Number(end_lat),   lng: Number(end_lng)   }] : []),
      ]

  if (!isLoaded) return (
    <div style={{ height, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', borderRadius: 12 }}>
      Loading map…
    </div>
  )

  if (!MAPS_KEY) return (
    <div style={{ height, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', borderRadius: 12, fontSize: 14, textAlign: 'center', padding: 16 }}>
      ⚠️ Set NEXT_PUBLIC_MAPS_KEY in your .env to enable maps
    </div>
  )

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height, borderRadius: 12 }}
      center={center}
      zoom={waypoints.length > 0 ? 11 : 8}
      options={{ styles: MAP_STYLES, mapTypeId: 'terrain', disableDefaultUI: false }}
    >
      {/* Route polyline */}
      {path.length > 1 && (
        <Polyline
          path={path}
          options={{ strokeColor: '#f59e0b', strokeOpacity: 0.9, strokeWeight: 3 }}
        />
      )}

      {/* Start marker */}
      {start_lat && start_lng && (
        <Marker
          position={{ lat: Number(start_lat), lng: Number(start_lng) }}
          label={{ text: 'S', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
          title="Start"
        />
      )}

      {/* End marker */}
      {end_lat && end_lng && (
        <Marker
          position={{ lat: Number(end_lat), lng: Number(end_lng) }}
          label={{ text: 'E', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
          title="End"
        />
      )}
    </GoogleMap>
  )
}

// ── Marketplace Map — shows all active listings as pins ──────
interface ListingPin {
  id: string
  title: string
  destination: string
  dest_lat: number
  dest_lng: number
  creator_rank: string
}

interface MarketplaceMapProps {
  listings: ListingPin[]
  onSelectListing?: (id: string) => void
  height?: string
}

const RANK_COLORS: Record<string, string> = {
  bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700',
  platinum: '#E5E4E2', legend: '#9B59B6'
}

export function MarketplaceMap({ listings, onSelectListing, height = '500px' }: MarketplaceMapProps) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY })
  const mapRef = useRef<google.maps.Map | null>(null)

  const validListings = listings.filter(l => l.dest_lat && l.dest_lng)

  const center = validListings.length > 0
    ? { lat: Number(validListings[0].dest_lat), lng: Number(validListings[0].dest_lng) }
    : { lat: 28.5, lng: 84.1 }

  if (!isLoaded) return (
    <div style={{ height, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', borderRadius: 12 }}>
      Loading map…
    </div>
  )

  if (!MAPS_KEY) return (
    <div style={{ height, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', borderRadius: 12, fontSize: 14, textAlign: 'center', padding: 16 }}>
      ⚠️ Set NEXT_PUBLIC_MAPS_KEY in your .env to enable maps
    </div>
  )

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height, borderRadius: 12 }}
      center={center}
      zoom={4}
      options={{ styles: MAP_STYLES, mapTypeId: 'terrain' }}
      onLoad={map => { mapRef.current = map }}
    >
      {validListings.map(listing => (
        <Marker
          key={listing.id}
          position={{ lat: Number(listing.dest_lat), lng: Number(listing.dest_lng) }}
          title={`${listing.title} — ${listing.destination}`}
          onClick={() => onSelectListing?.(listing.id)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: RANK_COLORS[listing.creator_rank] || '#888',
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  )
}
