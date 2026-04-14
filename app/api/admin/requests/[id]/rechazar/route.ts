import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin' && !session.user.isSuperuser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const reason = body.reason || 'Solicitud rechazada'
    const observations = body.observations || ''
    const adminNotes = observations ? `${reason}. ${observations}` : reason

    const request = await prisma.documentRequest.update({
      where: { id: parseInt(params.id) },
      data: {
        status: 'rejected',
        processedById: parseInt(session.user.id),
        adminNotes,
        updatedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        requestId: request.id,
        action: 'rejected',
        icon: '❌',
        actor: session.user.username,
        note: adminNotes,
      },
    })

    return NextResponse.json(request)
  } catch (error) {
    console.error('Error rejecting request:', error)
    return NextResponse.json({ error: 'Error rejecting request' }, { status: 500 })
  }
}
