// frontend/src/components/TrekMap.tsx
// Maps component — supports Google Maps and Leaflet fallback with a location search bar

'use client'
import { useCallback, useRef, useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'

const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY || ''

const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a3a4a' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#1f2e1f' }] },
]

interface Waypoint { lat: number; lng: number; altitude_m?: number }

interface TrekMapProps {
  start_lat?: number
  start_lng?: number
  end_lat?: number
  end_lng?: number
  waypoints?: Waypoint[]
  height?: string
}

// ── Leaflet Dynamic Loader ───────────────────────────────────
const loadLeaflet = (callback: () => void) => {
  if (typeof window === 'undefined') return
  if ((window as any).L) {
    callback()
    return
  }

  if (document.getElementById('leaflet-css')) {
    const checkInterval = setInterval(() => {
      if ((window as any).L) {
        clearInterval(checkInterval)
        callback()
      }
    }, 100)
    return
  }

  // Load CSS
  const link = document.createElement('link')
  link.id = 'leaflet-css'
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)

  // Load JS
  const script = document.createElement('script')
  script.id = 'leaflet-js'
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  script.onload = () => callback()
  document.body.appendChild(script)
}

// ── Map Search overlay UI component ─────────────────────────
interface SearchOverlayProps {
  onSearch: (lat: number, lng: number) => void
}

function SearchOverlay({ onSearch }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        onSearch(lat, lng)
      } else {
        setSearchError('Location not found')
        setTimeout(() => setSearchError(''), 3000)
      }
    } catch (err) {
      setSearchError('Search failed')
      setTimeout(() => setSearchError(''), 3000)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      left: '12px',
      zIndex: 1000,
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(8px)',
        padding: '6px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}>
        <input
          type="text"
          placeholder="🔍 Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          style={{
            flex: 1,
            background: '#1f2937',
            border: '1px solid #374151',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
        >
          {searching ? '...' : 'Go'}
        </button>
      </div>
      {searchError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.9)',
          color: '#fff',
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '4px',
          width: 'max-content',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {searchError}
        </div>
      )}
    </div>
  )
}

// ── Leaflet Fallback Component ──────────────────────────────
function LeafletTrekMap({ start_lat, start_lng, end_lat, end_lng, waypoints = [], height = '400px' }: TrekMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    loadLeaflet(() => setLeafletLoaded(true))
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return

    const L = (window as any).L
    const centerLat = start_lat || 28.5
    const centerLng = start_lng || 84.1

    const map = L.map(mapRef.current).setView([centerLat, centerLng], waypoints.length > 0 ? 11 : 8)
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map)

    const pathCoords = waypoints.length > 0
      ? waypoints.map(w => [Number(w.lat), Number(w.lng)])
      : [
          ...(start_lat && start_lng ? [[Number(start_lat), Number(start_lng)]] : []),
          ...(end_lat && end_lng     ? [[Number(end_lat),   Number(end_lng)  ]] : []),
        ]

    if (pathCoords.length > 1) {
      L.polyline(pathCoords, { color: '#f59e0b', weight: 4, opacity: 0.9 }).addTo(map)
      const bounds = L.latLngBounds(pathCoords)
      map.fitBounds(bounds)
    }

    const startIcon = L.divIcon({
      html: '<div style="background-color: #10b981; color: white; font-weight: bold; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">S</div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    const endIcon = L.divIcon({
      html: '<div style="background-color: #ef4444; color: white; font-weight: bold; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">E</div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    if (start_lat && start_lng) {
      L.marker([Number(start_lat), Number(start_lng)], { icon: startIcon }).addTo(map).bindPopup('Start')
    }

    if (end_lat && end_lng) {
      L.marker([Number(end_lat), Number(end_lng)], { icon: endIcon }).addTo(map).bindPopup('End')
    }

    setMapInstance(map)

    return () => {
      map.remove()
      setMapInstance(null)
    }
  }, [leafletLoaded, start_lat, start_lng, end_lat, end_lng, waypoints])

  const handleSearchLoc = (lat: number, lng: number) => {
    if (mapInstance) {
      mapInstance.setView([lat, lng], 13)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <SearchOverlay onSearch={handleSearchLoc} />
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 12, border: '1px solid #374151', zIndex: 1 }} />
    </div>
  )
}

// ── Google Trek Map Component ──────────────────────────────
function GoogleTrekMap({ start_lat, start_lng, end_lat, end_lng, waypoints = [], height = '400px' }: TrekMapProps) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY })
  const mapRef = useRef<google.maps.Map | null>(null)

  const center = start_lat && start_lng
    ? { lat: Number(start_lat), lng: Number(start_lng) }
    : { lat: 28.5, lng: 84.1 }

  const path = waypoints.length > 0
    ? waypoints.map(w => ({ lat: Number(w.lat), lng: Number(w.lng) }))
    : [
        ...(start_lat && start_lng ? [{ lat: Number(start_lat), lng: Number(start_lng) }] : []),
        ...(end_lat && end_lng     ? [{ lat: Number(end_lat),   lng: Number(end_lng)   }] : []),
      ]

  if (!isLoaded) {
    return (
      <div style={{ height, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: 12 }}>
        Loading Google Map…
      </div>
    )
  }

  const handleSearchLoc = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng })
      mapRef.current.setZoom(13)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <SearchOverlay onSearch={handleSearchLoc} />
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: 12 }}
        center={center}
        zoom={waypoints.length > 0 ? 11 : 8}
        options={{ styles: MAP_STYLES, mapTypeId: 'terrain' }}
        onLoad={map => { mapRef.current = map }}
      >
        {path.length > 1 && (
          <Polyline
            path={path}
            options={{ strokeColor: '#f59e0b', strokeOpacity: 0.9, strokeWeight: 3 }}
          />
        )}

        {start_lat && start_lng && (
          <Marker
            position={{ lat: Number(start_lat), lng: Number(start_lng) }}
            label={{ text: 'S', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
          />
        )}

        {end_lat && end_lng && (
          <Marker
            position={{ lat: Number(end_lat), lng: Number(end_lng) }}
            label={{ text: 'E', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
          />
        )}
      </GoogleMap>
    </div>
  )
}

// ── EXPORTED TREK MAP (Adaptive switcher) ───────────────────
export function TrekMap(props: TrekMapProps) {
  if (!MAPS_KEY) {
    return <LeafletTrekMap {...props} />
  }
  return <GoogleTrekMap {...props} />
}


// ── Marketplace Map Interfaces ──────────────────────────────
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

// ── Leaflet Marketplace Map ──────────────────────────────────
function LeafletMarketplaceMap({ listings, onSelectListing, height = '500px' }: MarketplaceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    loadLeaflet(() => setLeafletLoaded(true))
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return

    const L = (window as any).L
    const validListings = listings.filter(l => l.dest_lat && l.dest_lng)

    const centerLat = validListings.length > 0 ? Number(validListings[0].dest_lat) : 28.5
    const centerLng = validListings.length > 0 ? Number(validListings[0].dest_lng) : 84.1

    const map = L.map(mapRef.current).setView([centerLat, centerLng], 4)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map)

    const markerGroup = L.featureGroup()

    validListings.forEach(listing => {
      const color = RANK_COLORS[listing.creator_rank] || '#888'
      
      const pinIcon = L.divIcon({
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color}"></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })

      const marker = L.marker([Number(listing.dest_lat), Number(listing.dest_lng)], { icon: pinIcon })
        .addTo(map)
        .bindPopup(`
          <div style="color: #111; font-family: sans-serif;">
            <b style="font-size: 13px;">${listing.title}</b><br/>
            <span style="color: #666; font-size: 11px;">${listing.destination}</span><br/>
            <button id="btn-${listing.id}" style="margin-top: 8px; background: #3b82f6; border: none; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: bold; width: 100%;">View Details</button>
          </div>
        `)

      marker.on('popupopen', () => {
        const button = document.getElementById(`btn-${listing.id}`)
        if (button) {
          button.onclick = () => onSelectListing?.(listing.id)
        }
      })

      marker.addTo(markerGroup)
    })

    if (validListings.length > 0) {
      map.fitBounds(markerGroup.getBounds().pad(0.1))
    }

    setMapInstance(map)

    return () => {
      map.remove()
      setMapInstance(null)
    }
  }, [leafletLoaded, listings])

  const handleSearchLoc = (lat: number, lng: number) => {
    if (mapInstance) {
      mapInstance.setView([lat, lng], 11)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <SearchOverlay onSearch={handleSearchLoc} />
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 12, border: '1px solid #374151', zIndex: 1 }} />
    </div>
  )
}

// ── Google Marketplace Map ───────────────────────────────────
function GoogleMarketplaceMap({ listings, onSelectListing, height = '500px' }: MarketplaceMapProps) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY })
  const mapRef = useRef<google.maps.Map | null>(null)

  const validListings = listings.filter(l => l.dest_lat && l.dest_lng)

  const center = validListings.length > 0
    ? { lat: Number(validListings[0].dest_lat), lng: Number(validListings[0].dest_lng) }
    : { lat: 28.5, lng: 84.1 }

  if (!isLoaded) {
    return (
      <div style={{ height, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: 12 }}>
        Loading Google Map…
      </div>
    )
  }

  const handleSearchLoc = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng })
      mapRef.current.setZoom(11)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <SearchOverlay onSearch={handleSearchLoc} />
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: 12 }}
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
    </div>
  )
}

// ── EXPORTED MARKETPLACE MAP (Adaptive switcher) ─────────────
export function MarketplaceMap(props: MarketplaceMapProps) {
  if (!MAPS_KEY) {
    return <LeafletMarketplaceMap {...props} />
  }
  return <GoogleMarketplaceMap {...props} />
}
