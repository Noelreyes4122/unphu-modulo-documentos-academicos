import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const request = await prisma.documentRequest.findFirst({
      where: {
        id: parseInt(params.id),
        studentId: parseInt(session.user.id),
      },
      include: {
        docType: true,
        auditLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json(request)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json({ error: 'Error fetching request' }, { status: 500 })
  }
}
