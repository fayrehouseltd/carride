import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, shareType } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const hasAdmin = (await prisma.user.count({ where: { isAdmin: true } })) > 0

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        shareType: shareType || 'either',
        isAdmin: !hasAdmin
      }
    })

    return NextResponse.json({ message: 'User created', userId: user.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}