import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const destinations = await prisma.destination.findMany()
    return NextResponse.json(destinations)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, lat, lng, description } = await req.json()
    if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Invalid destination' }, { status: 400 })
    }

    const destination = await prisma.destination.create({
      data: { name, lat, lng, description }
    })

    return NextResponse.json(destination)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 })
  }
}