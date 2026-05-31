'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface Location {
  id: string
  userId: string
  lat: number
  lng: number
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

interface UserProfile {
  name?: string
  shareType: string
  homeDestination?: {
    id: string
    name: string
  }
  location?: {
    lat: number
    lng: number
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [name, setName] = useState('')
  const [shareType, setShareType] = useState('either')
  const [homeDestinationId, setHomeDestinationId] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [currentLocation, setCurrentLocation] = useState<UserProfile['location'] | null>(null)
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSettingLocation, setIsSettingLocation] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const initialProfileRef = useRef<UserProfile | null>(null)

  const getCurrentProfileSnapshot = () => ({
    name: name.trim(),
    shareType,
    homeDestinationId,
    location: currentLocation
  })

  const profileIsDirty = () => {
    const initial = initialProfileRef.current
    if (!initial) return false

    const current = getCurrentProfileSnapshot()
    if (current.name !== (initial.name || '')) return true
    if (current.shareType !== initial.shareType) return true
    if (current.homeDestinationId !== (initial.homeDestination?.id || '')) return true

    const initialLocation = initial.location || null
    const currentLocationValue = current.location || null
    if (!initialLocation && currentLocationValue) return true
    if (initialLocation && !currentLocationValue) return true
    if (initialLocation && currentLocationValue) {
      if (initialLocation.lat !== currentLocationValue.lat || initialLocation.lng !== currentLocationValue.lng) {
        return true
      }
    }

    return false
  }

  const validateProfile = () => {
    if (!name.trim()) {
      setError('Please enter your name.')
      return false
    }

    if (!homeDestinationId) {
      setError('Please select a home destination.')
      return false
    }

    return true
  }

  const saveProfile = async () => {
    setError('')
    setSuccess('')

    if (!validateProfile()) {
      return false
    }

    const payload: any = {
      name,
      shareType,
      homeDestinationId: homeDestinationId || null
    }

    if (pendingLocation) {
      payload.location = {
        lat: pendingLocation.lat,
        lng: pendingLocation.lng
      }
    } else if (currentLocation) {
      payload.location = {
        lat: currentLocation.lat,
        lng: currentLocation.lng
      }
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      setSuccess('Profile updated successfully')
      setIsSettingLocation(false)
      setPendingLocation(null)
      await fetchProfile()
      await fetchLocations()
      return true
    }

    const data = await res.json()
    setError(data.error || 'Update failed')
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveProfile()
  }

  const handleBackToMap = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!profileIsDirty()) {
      router.push('/map')
      return
    }

    const saveFirst = window.confirm(
      'You have unsaved changes. Click OK to save and continue to the map, or Cancel to stay on this page.'
    )

    if (!saveFirst) {
      return
    }

    const saved = await saveProfile()
    if (saved) {
      router.push('/map')
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }

    fetchProfile()
    fetchLocations()
    fetchDestinations()
  }, [session, status, router])

  const fetchProfile = async () => {
    const res = await fetch('/api/profile')
    if (res.ok) {
      const data: UserProfile = await res.json()
      setName(data.name || '')
      setShareType(data.shareType || 'either')
      setHomeDestinationId(data.homeDestination?.id || '')
      setCurrentLocation(data.location || null)
      initialProfileRef.current = {
        name: data.name || '',
        shareType: data.shareType,
        homeDestination: data.homeDestination || undefined,
        location: data.location || undefined
      }
    }
  }

  const fetchLocations = async () => {
    const res = await fetch('/api/locations')
    if (res.ok) {
      const data = await res.json()
      setLocations(data)
    }
  }

  const fetchDestinations = async () => {
    const res = await fetch('/api/destinations')
    if (res.ok) {
      const data = await res.json()
      setDestinations(data)
    }
  }

  const handleStartLocationSet = () => {
    setIsSettingLocation(true)
    setPendingLocation(null)
    setError('')
    setSuccess('')
  }

  const handleCancelLocationSet = () => {
    setIsSettingLocation(false)
    setPendingLocation(null)
  }

  const handleLocationSet = (lat: number, lng: number) => {
    if (!isSettingLocation) return
    setPendingLocation({ lat, lng })
    setCurrentLocation((prev) => ({
      lat,
      lng
    }))
  }

  const handleDeleteLocation = async () => {
    const res = await fetch('/api/locations', {
      method: 'DELETE'
    })

    if (res.ok) {
      setCurrentLocation(null)
      setPendingLocation(null)
      setSuccess('Location deleted successfully')
      setError('')
      fetchLocations()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to delete location')
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Edit Profile</h1>
            <p className="text-sm text-gray-600">Update your account and manage your home pin.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackToMap}
              className="text-blue-600 hover:underline"
            >
              Back to map
            </button>
            <button onClick={() => signOut()} className="text-red-600 hover:underline">Logout</button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Account Details</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Share Type</span>
                <select
                  value={shareType}
                  onChange={(e) => setShareType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="drive">Drive</option>
                  <option value="lift">Lift</option>
                  <option value="either">Either</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Home Destination</span>
                <select
                  value={homeDestinationId}
                  onChange={(e) => setHomeDestinationId(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">-- Select a destination --</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <button className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Home Pin</h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Current home destination</p>
                <p className="text-lg font-semibold">
                  {destinations.find((d) => d.id === homeDestinationId)?.name || 'No destination selected'}
                </p>
                <p className="text-sm text-gray-600">
                  {currentLocation ? `Pin at ${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` : 'No pin set yet.'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleStartLocationSet}
                  className="w-full rounded-md bg-blue-600 text-white py-2 hover:bg-blue-700"
                >
                  {currentLocation ? 'Move my pin' : 'Set my pin'}
                </button>
                {currentLocation && (
                  <button
                    onClick={handleDeleteLocation}
                    className="w-full rounded-md bg-red-600 text-white py-2 hover:bg-red-700"
                  >
                    Delete my pin
                  </button>
                )}
              </div>

              {isSettingLocation && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                  <p>Click on the map below to move your pin.</p>
                  {pendingLocation ? (
                    <p className="mt-2">Selected position: {pendingLocation.lat.toFixed(5)}, {pendingLocation.lng.toFixed(5)}</p>
                  ) : (
                    <p className="mt-2">Waiting for map click...</p>
                  )}
                  <button
                    onClick={handleCancelLocationSet}
                    className="mt-3 text-blue-700 underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Map Overview</h2>
          <p className="text-sm text-gray-600 mb-4">Click on the map after tapping "Set my pin" or "Move my pin" to update your home pin.</p>
          <div className="h-96">
            <MapView
              locations={locations}
              destinations={destinations}
              onLocationSet={isSettingLocation ? handleLocationSet : undefined}
              currentUserHomeDestinationId={homeDestinationId}
              previewLocation={pendingLocation || undefined}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
