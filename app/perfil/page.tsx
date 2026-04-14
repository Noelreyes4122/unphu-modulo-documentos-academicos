import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = session.user

  const recentRequests = await prisma.documentRequest.findMany({
    where: { studentId: parseInt(user.id) },
    include: { docType: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const initials = (() => {
    const name = user.name || user.username || ''
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  })()

  const fullName = user.name || user.username

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  function statusBadge(status: string) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      pending:    { label: 'Pendiente',   bg: '#FEF3C7', color: '#92400E' },
      processing: { label: 'En Proceso',  bg: '#DBEAFE', color: '#1E40AF' },
      approved:   { label: 'Aprobado',    bg: '#D1FAE5', color: '#065F46' },
      ready:      { label: 'Listo',       bg: '#059669', color: '#fff'    },
      delivered:  { label: 'Entregado',   bg: '#F3F4F6', color: '#6B7280' },
      rejected:   { label: 'Rechazado',   bg: '#FEE2E2', color: '#991B1B' },
    }
    const s = map[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' }
    return (
      <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11.5, fontWeight: 700, display: 'inline-block' }}>
        {s.label}
      </span>
    )
  }

  function isToday(date: Date | null) {
    if (!date) return false
    return new Date(date).toISOString().slice(0, 10) === todayStr
  }

  const doneStatuses = ['delivered', 'rejected']

  return (
    <DashboardLayout currentPath="/perfil" user={user}>
      <div className="mod-header">
        <div>
          <div className="mod-title">Mi Perfil</div>
          <div className="mod-sub">Información académica y de contacto</div>
        </div>
        <Link href="/solicitud-documentos" className="btn-primary">
          <i className="bi bi-plus-lg"></i>
          Nueva Solicitud
        </Link>
      </div>

      <div className="perfil-grid">
        {/* Left card */}
        <div className="white-card">
          <div className="perfil-left">
            <div className="perfil-mat">
              {user.matricula && (
                <span>
                  <i className="bi bi-hash" style={{ fontSize: 11 }}></i> Matrícula: <strong>{user.matricula}</strong>
                </span>
              )}
            </div>

            <div className="perfil-av">{initials}</div>
            <div className="perfil-name">{fullName}</div>

            {user.carrera && (
              <div style={{ fontSize: 12.5, color: 'var(--gray-500)', marginTop: 4 }}>
                {user.carrera}
              </div>
            )}

            {user.periodoActivo && (
              <div style={{
                display: 'inline-block',
                marginTop: 8,
                padding: '3px 12px',
                background: 'rgba(67,148,65,0.10)',
                color: 'var(--green-dark)',
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 600,
              }}>
                Periodo {user.periodoActivo}
              </div>
            )}

            <button className="perfil-qr-btn" style={{ marginTop: 16 }}>
              <i className="bi bi-qr-code"></i>
              Generar QR Estudiantil
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {user.correoInstitucional && (
                <div className="perfil-info-row">
                  <i className="bi bi-envelope perfil-info-ico"></i>
                  <div>
                    <div className="perfil-info-label">Correo Institucional</div>
                    <div className="perfil-info-val">{user.correoInstitucional}</div>
                  </div>
                </div>
              )}

              {user.cedula && (
                <div className="perfil-info-row">
                  <i className="bi bi-card-text perfil-info-ico"></i>
                  <div>
                    <div className="perfil-info-label">Cédula</div>
                    <div className="perfil-info-val">{user.cedula}</div>
                  </div>
                </div>
              )}

              {user.cargo && (
                <div className="perfil-info-row">
                  <i className="bi bi-briefcase perfil-info-ico"></i>
                  <div>
                    <div className="perfil-info-label">Cargo</div>
                    <div className="perfil-info-val">{user.cargo}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="perfil-right">
          {/* Academic info */}
          <div className="white-card">
            <div className="info-panel">
              <div className="panel-title">Información Académica</div>
              <div className="otras-grid">
                {user.matricula && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-hash"></i> Matrícula</div>
                    <div className="otras-val">{user.matricula}</div>
                  </div>
                )}
                {user.carrera && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-mortarboard"></i> Carrera</div>
                    <div className="otras-val">{user.carrera}</div>
                  </div>
                )}
                {user.carreraCodigo && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-tag"></i> Código</div>
                    <div className="otras-val">{user.carreraCodigo}</div>
                  </div>
                )}
                {user.periodoActivo && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-calendar3"></i> Periodo Activo</div>
                    <div className="otras-val">{user.periodoActivo}</div>
                  </div>
                )}
                <div className="otras-item">
                  <div className="otras-label"><i className="bi bi-person-check"></i> Rol</div>
                  <div className="otras-val" style={{ textTransform: 'capitalize' }}>{user.role}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="white-card">
            <div className="info-panel">
              <div className="panel-title">Información de Contacto</div>
              <div className="otras-grid">
                {user.correoInstitucional && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-envelope"></i> Correo Institucional</div>
                    <div className="otras-val">{user.correoInstitucional}</div>
                  </div>
                )}
                {user.correoPersonal && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-envelope-at"></i> Correo Personal</div>
                    <div className="otras-val">{user.correoPersonal || '—'}</div>
                  </div>
                )}
                {user.telefono && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-telephone"></i> Teléfono</div>
                    <div className="otras-val">{user.telefono || '—'}</div>
                  </div>
                )}
                {user.celular && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-phone"></i> Celular</div>
                    <div className="otras-val">{user.celular || '—'}</div>
                  </div>
                )}
                {user.cedula && (
                  <div className="otras-item">
                    <div className="otras-label"><i className="bi bi-card-text"></i> Cédula</div>
                    <div className="otras-val">{user.cedula}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Solicitar documentos promo */}
          <div className="white-card">
            <div className="sol-promo">
              <div className="sol-promo-inner">
                <div className="sol-promo-icon">📄</div>
                <div style={{ flex: 1 }}>
                  <div className="sol-promo-title">Solicitar Documentos Universitarios</div>
                  <div className="sol-promo-sub">
                    Gestiona tus solicitudes de Carta Universitaria, Constancia de Estudios, Récord de Notas y más.
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#718096', background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 10px', display: 'inline-block' }}>
                    📌 Carta Universitaria y Constancia de Estudios: entrega el mismo día si se solicita antes de las 2:00 PM.
                  </div>
                </div>
                <Link href="/solicitud-documentos" className="btn-primary">
                  <i className="bi bi-arrow-right"></i>
                  Ir a Solicitudes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de Solicitudes */}
      <div className="white-card" style={{ marginTop: 24 }}>
        <div className="info-panel">
          <div className="panel-title" style={{ marginBottom: 16 }}>
            <i className="bi bi-clock-history" style={{ marginRight: 8, color: 'var(--navy)' }}></i>
            Estado de Solicitudes Recientes
          </div>
          {recentRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray-400)', fontSize: 13.5 }}>
              <i className="bi bi-inbox" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}></i>
              No tienes solicitudes aún.{' '}
              <Link href="/solicitud-documentos" style={{ color: 'var(--navy)', fontWeight: 600 }}>Crear una ahora</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentRequests.map((req) => {
                const deliveryToday = isToday(req.estimatedDate) && !doneStatuses.includes(req.status)
                const deliveryDate = req.estimatedDate
                  ? isToday(req.estimatedDate)
                    ? 'hoy'
                    : new Date(req.estimatedDate).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
                  : null
                return (
                  <div key={req.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 10,
                    background: '#F7FAFC', border: '1px solid #E2E8F0',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, var(--navy), var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="bi bi-file-earmark-text" style={{ color: 'white', fontSize: 15 }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.docType.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                        {req.code}
                        {deliveryDate && (
                          <span style={{ marginLeft: 8 }}>
                            · Entrega estimada: <strong>{deliveryDate}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {deliveryToday && (
                        <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          ⏰ Entrega hoy
                        </span>
                      )}
                      {statusBadge(req.status)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {recentRequests.length > 0 && (
            <div style={{ marginTop: 14, textAlign: 'right' }}>
              <Link href="/solicitud-documentos" style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600 }}>
                Ver todas las solicitudes <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
