'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  homeDestination?: {
    id: string
    name: string
  }
}

export default function MapPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [userHomeDestinationId, setUserHomeDestinationId] = useState<string>('')

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
      setUserHomeDestinationId(data.homeDestination?.id || '')
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

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Location App</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {session.user?.name || session.user?.email}</span>
          <a href="/profile" className="text-blue-600 hover:underline">Profile</a>
          {session.user?.isAdmin && (
            <a href="/admin" className="text-blue-600 hover:underline">Admin</a>
          )}
          <button onClick={() => signOut()} className="text-red-600 hover:underline">Logout</button>
        </div>
      </header>

      <div className="flex-1">
        <MapView
          locations={locations}
          destinations={destinations}
          currentUserHomeDestinationId={userHomeDestinationId}
        />
      </div>
    </div>
  )
}
