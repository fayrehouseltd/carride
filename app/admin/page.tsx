'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface Destination {
  id: string
  name: string
  lat: number
  lng: number
  description?: string
}

interface Location {
  id: string
  userId: string
  lat: number
  lng: number
  user: {
    email: string
    name?: string
    shareType?: string
    homeDestination?: {
      id: string
      name: string
    }
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [name, setName] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }

    if (!session.user?.isAdmin) {
      router.push('/map')
      return
    }

    fetchDestinations()
  }, [session, status, router])

  const fetchDestinations = async () => {
    const res = await fetch('/api/destinations')
    if (res.ok) {
      const data = await res.json()
      setDestinations(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const payload = {
      name,
      lat: Number(lat),
      lng: Number(lng),
      description
    }

    const res = await fetch('/api/destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      setName('')
      setLat('')
      setLng('')
      setDescription('')
      fetchDestinations()
    } else {
      const data = await res.json()
      setError(data.error || 'Unable to create destination')
    }
  }

  const handleAddDestination = async (lat: number, lng: number) => {
    const name = prompt('Enter destination name:')
    if (!name) return

    const description = prompt('Enter description (optional):')

    const res = await fetch('/api/destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, lat, lng, description })
    })

    if (res.ok) {
      fetchDestinations()
    } else {
      alert('Failed to add destination')
    }
  }

  const handleDeleteDestination = async (id: string) => {
    const res = await fetch(`/api/destinations/${id}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      fetchDestinations()
    } else {
      alert('Failed to delete destination')
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  if (!session.user?.isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Manage available destinations for users.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/map" className="text-blue-600 hover:underline">Back to map</a>
            <button onClick={() => signOut()} className="text-red-600 hover:underline">Logout</button>
          </div>
        </header>

        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Add Destination</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Latitude</span>
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Longitude</span>
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              Save destination
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Map Management</h2>
          <p className="text-sm text-gray-600 mb-4">Click on the map to add destinations. Click on destination markers to delete them.</p>
          <div className="h-96">
            <MapView
              locations={locations}
              destinations={destinations}
              onLocationSet={() => {}}
              onDestinationSelect={() => {}}
              isAdmin={true}
              onAddDestination={handleAddDestination}
              onDeleteDestination={handleDeleteDestination}
            />
          </div>
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Destinations</h2>
          <div className="space-y-3">
            {destinations.length === 0 ? (
              <p className="text-sm text-gray-600">No destinations configured yet.</p>
            ) : (
              destinations.map((destination) => (
                <div key={destination.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{destination.name}</h3>
                      <p className="text-sm text-gray-500">{destination.description}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
