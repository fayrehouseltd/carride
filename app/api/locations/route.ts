import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            shareType: true
          }
        },
        destination: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    return NextResponse.json(locations)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lat, lng, destinationId } = await req.json()

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
    }

    const location = await prisma.location.upsert({
      where: { userId: session.user.id },
      update: { lat, lng, destinationId },
      create: { userId: session.user.id, lat, lng, destinationId }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.location.deleteMany({ where: { userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}