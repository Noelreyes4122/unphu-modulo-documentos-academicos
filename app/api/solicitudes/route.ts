import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const requests = await prisma.documentRequest.findMany({
      where: { studentId: parseInt(session.user.id) },
      include: {
        docType: true,
        auditLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ error: 'Error fetching requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { docTypeId, copies, purpose, language, institution, observations } = body

    if (!docTypeId) {
      return NextResponse.json({ error: 'docTypeId is required' }, { status: 400 })
    }

    // Generate unique code SOL-YYYY-NNNN
    const year = new Date().getFullYear()
    const lastRequest = await prisma.documentRequest.findFirst({
      where: { code: { startsWith: `SOL-${year}-` } },
      orderBy: { code: 'desc' },
    })

    let seq = 1
    if (lastRequest) {
      const parts = lastRequest.code.split('-')
      seq = parseInt(parts[parts.length - 1]) + 1
    }

    const code = `SOL-${year}-${String(seq).padStart(4, '0')}`

    const docType = await prisma.documentType.findUnique({
      where: { id: parseInt(docTypeId) },
    })

    if (!docType) {
      return NextResponse.json({ error: 'Document type not found' }, { status: 404 })
    }

    // Calculate estimated date with same-day logic
    const now = new Date()
    const hourDR = now.getUTCHours() - 4 // Dominican Republic is UTC-4
    const isBeforeCutoff = hourDR < 10 // before 10 AM

    let estimatedDate: Date | null = new Date()
    if (docType.deliveryDays === 0) {
      // Immediate/auto PDF — same day always
      estimatedDate = new Date()
    } else if (docType.deliveryDays === 1) {
      // Same day if before 2PM, else next day
      if (!isBeforeCutoff) {
        estimatedDate.setDate(estimatedDate.getDate() + 1)
      }
    } else {
      estimatedDate.setDate(estimatedDate.getDate() + docType.deliveryDays)
    }

    const newRequest = await prisma.documentRequest.create({
      data: {
        code,
        studentId: parseInt(session.user.id),
        docTypeId: parseInt(docTypeId),
        copies: parseInt(copies) || 1,
        purpose: purpose || 'personal',
        language: language || 'es',
        institution: institution || '',
        observations: observations || '',
        status: 'pending',
        estimatedDate,
      },
      include: {
        docType: true,
        auditLogs: { orderBy: { createdAt: 'asc' } },
      },
    })

    await prisma.auditLog.create({
      data: {
        requestId: newRequest.id,
        action: 'created',
        icon: '📋',
        actor: session.user.username,
        note: 'Solicitud creada por el estudiante',
      },
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json({ error: 'Error creating request' }, { status: 500 })
  }
}
