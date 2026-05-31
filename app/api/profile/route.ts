import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        shareType: true,
        homeDestination: {
          select: {
            id: true,
            name: true
          }
        },
        location: {
          select: {
            lat: true,
            lng: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, shareType, homeDestinationId, location } = await req.json()

    if (!['drive', 'lift', 'either'].includes(shareType)) {
      return NextResponse.json({ error: 'Invalid share type' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        shareType,
        homeDestinationId: homeDestinationId || null
      },
      include: {
        location: true
      }
    })

    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      await prisma.location.upsert({
        where: { userId: session.user.id },
        update: {
          lat: location.lat,
          lng: location.lng,
          destinationId: homeDestinationId || null
        },
        create: {
          userId: session.user.id,
          lat: location.lat,
          lng: location.lng,
          destinationId: homeDestinationId || null
        }
      })
    } else if (user.location) {
      await prisma.location.update({
        where: { userId: session.user.id },
        data: {
          destinationId: homeDestinationId || null
        }
      })
    }

    return NextResponse.json({ message: 'Profile updated' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
