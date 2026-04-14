import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const docTypes = await prisma.documentType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(docTypes)
  } catch (error) {
    console.error('Error fetching document types:', error)
    return NextResponse.json({ error: 'Error fetching document types' }, { status: 500 })
  }
}
