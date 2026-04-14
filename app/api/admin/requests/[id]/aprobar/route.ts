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
    const body = await req.json().catch(() => ({}))
    const notes = body.notes || 'Solicitud aprobada y lista para entrega'

    const request = await prisma.documentRequest.update({
      where: { id: parseInt(params.id) },
      data: {
        status: 'ready',
        processedById: parseInt(session.user.id),
        adminNotes: notes,
        updatedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        requestId: request.id,
        action: 'ready',
        icon: '✅',
        actor: session.user.username,
        note: notes,
      },
    })

    return NextResponse.json(request)
  } catch (error) {
    console.error('Error approving request:', error)
    return NextResponse.json({ error: 'Error approving request' }, { status: 500 })
  }
}
