'use client'

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

interface Location {
  id: string
  userId: string
  lat: number
  lng: number
  destination?: {
    id: string
    name: string
  }
  user: {
    email: string
    name?: string
    shareType?: string
  }
}

interface Destination {
  id: string
  name: string
  lat: number
  lng: number
  description?: string
}

interface MapViewProps {
  locations: Location[]
  destinations: Destination[]
  onLocationSet?: (lat: number, lng: number) => void
  onDestinationSelect?: (destinationId: string) => void
  isAdmin?: boolean
  onAddDestination?: (lat: number, lng: number) => void
  onDeleteDestination?: (id: string) => void
  currentUserHomeDestinationId?: string
  previewLocation?: { lat: number; lng: number }
}

function MapClickHandler({ onLocationSet, isAdmin, onAddDestination }: { onLocationSet?: (lat: number, lng: number) => void, isAdmin?: boolean, onAddDestination?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (isAdmin && onAddDestination) {
        onAddDestination(e.latlng.lat, e.latlng.lng)
      } else if (onLocationSet) {
        onLocationSet(e.latlng.lat, e.latlng.lng)
      }
    }
  })
  return null
}

export default function MapView({ locations, destinations, onLocationSet, onDestinationSelect, isAdmin, onAddDestination, onDeleteDestination, currentUserHomeDestinationId, previewLocation }: MapViewProps) {
  // Create colored markers
  const createMarkerIcon = (color: string) => {
    const markerSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40">
        <path d="M14 0C6.3 0 0 6.3 0 14c0 11.2 14 26 14 26s14-14.8 14-26c0-7.7-6.3-14-14-14zm0 19.3c-3 0-5.3-2.4-5.3-5.3S11 8.7 14 8.7s5.3 2.4 5.3 5.3-2.4 5.3-5.3 5.3z" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
    `)

    return L.icon({
      iconUrl: `data:image/svg+xml;charset=UTF-8,${markerSvg}`,
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -38]
    })
  }

  const filteredLocations = currentUserHomeDestinationId
    ? locations.filter((location) => location.destination?.id === currentUserHomeDestinationId)
    : locations

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} className="h-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClickHandler onLocationSet={onLocationSet} isAdmin={isAdmin} onAddDestination={onAddDestination} />

      {filteredLocations.map((location) => {
        let markerColor = '#3b82f6'
        if (location.user.shareType === 'drive') {
          markerColor = '#10b981'
        } else if (location.user.shareType === 'lift') {
          markerColor = '#f59e0b'
        } else if (location.user.shareType === 'either') {
          markerColor = '#8b5cf6'
        }

        return (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={createMarkerIcon(markerColor)}
          >
            <Popup>
              <div>
                <p><strong>{location.user.name || 'User'}</strong></p>
                <p>{location.user.email}</p>
                {location.destination && (
                  <p className="text-sm text-gray-600 mt-1">
                    Destination: {location.destination.name}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Type: {location.user.shareType || 'either'}
                </p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {previewLocation && (
        <Marker
          key="preview-location"
          position={[previewLocation.lat, previewLocation.lng]}
          icon={createMarkerIcon('#2563eb')}
        >
          <Popup>
            <div>
              <p><strong>New home pin</strong></p>
              <p className="text-sm text-gray-600">Click save to keep this location.</p>
            </div>
          </Popup>
        </Marker>
      )}

      {destinations.map((destination) => (
        <Marker
          key={destination.id}
          position={[destination.lat, destination.lng]}
          icon={createMarkerIcon('#ef4444')}
          eventHandlers={{
            click: () => {
              if (isAdmin && onDeleteDestination) {
                if (confirm(`Delete destination "${destination.name}"?`)) {
                  onDeleteDestination(destination.id)
                }
              } else if (onDestinationSelect) {
                onDestinationSelect(destination.id)
              }
            }
          }}
        >
          <Popup>
            <div>
              <p><strong>{destination.name}</strong></p>
              {destination.description && <p>{destination.description}</p>}
              {isAdmin && <p className="text-xs text-gray-500 mt-1">Click marker to delete</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
