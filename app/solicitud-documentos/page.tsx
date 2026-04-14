'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

interface DocumentType {
  id: number
  name: string
  slug: string
  icon: string
  price: number
  deliveryDays: number
  autoPdf: boolean
}

interface DocumentRequest {
  id: number
  code: string
  status: string
  copies: number
  purpose: string
  language: string
  institution: string
  observations: string
  createdAt: string
  estimatedDate: string | null
  adminNotes: string
  docType: DocumentType
  auditLogs: Array<{
    id: number
    action: string
    icon: string
    actor: string
    note: string
    createdAt: string
  }>
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    process: 'En Proceso',
    approved: 'Aprobado',
    ready: 'Listo',
    done: 'Entregado',
    rejected: 'Rechazado',
  }
  return (
    <span className={`sbadge ${status === 'rejected' ? 'reject' : status}`}>
      <span className="sbadge-dot"></span>
      {labels[status] || status}
    </span>
  )
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function formatPrice(price: number) {
  return `RD$${Number(price).toLocaleString('es-DO', { minimumFractionDigits: 0 })}`
}

export default function SolicitudDocumentosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'inicio' | 'nueva' | 'mis' | 'docs'>('inicio')
  const [step, setStep] = useState(1)
  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [toast, setToast] = useState({ show: false, msg: '' })

  // Form state
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null)
  const [copies, setCopies] = useState(1)
  const [purpose, setPurpose] = useState('personal')
  const [language, setLanguage] = useState('es')
  const [institution, setInstitution] = useState('')
  const [observations, setObservations] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDocTypes()
      fetchRequests()
    }
  }, [session])

  async function fetchDocTypes() {
    const res = await fetch('/api/document-types')
    if (res.ok) {
      const data = await res.json()
      setDocTypes(data)
    }
    setLoading(false)
  }

  async function fetchRequests() {
    const res = await fetch('/api/solicitudes')
    if (res.ok) {
      const data = await res.json()
      setRequests(data)
    }
  }

  function showToast(msg: string) {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 3500)
  }

  async function handleSubmit() {
    if (!selectedDocType) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docTypeId: selectedDocType.id,
          copies,
          purpose,
          language,
          institution,
          observations,
        }),
      })

      if (res.ok) {
        const newReq = await res.json()
        setRequests(prev => [newReq, ...prev])
        setSuccessMsg(`Solicitud ${newReq.code} creada exitosamente. En breve será procesada por el Departamento de Registro.`)
        showToast(`✅ Solicitud ${newReq.code} enviada`)
        // Reset form
        setSelectedDocType(null)
        setCopies(1)
        setPurpose('personal')
        setLanguage('es')
        setInstitution('')
        setObservations('')
        setCardNumber('')
        setCardName('')
        setCardExpiry('')
        setCardCvv('')
        setPaymentMethod('card')
        setStep(1)
        setActiveTab('mis')
      } else {
        showToast('❌ Error al crear la solicitud')
      }
    } catch {
      showToast('❌ Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner"></span>
      </div>
    )
  }

  if (!session) return null

  const user = session.user
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const readyCount = requests.filter(r => r.status === 'ready').length

  const deliveryLabel = (days: number) => {
    if (days === 0) return { label: 'Inmediato', cls: 'delivery-same' }
    if (days <= 2) return { label: `${days} día${days > 1 ? 's' : ''}`, cls: 'delivery-fast' }
    return { label: `${days} días`, cls: 'delivery-normal' }
  }

  return (
    <DashboardLayout currentPath="/solicitud-documentos" user={user}>
      {/* Header */}
      <div className="mod-header">
        <div>
          <div className="mod-title">Módulo de Documentos</div>
          <div className="mod-sub">Solicita y gestiona tus documentos universitarios</div>
        </div>
        <button className="btn-primary" onClick={() => { setActiveTab('nueva'); setStep(1) }}>
          <i className="bi bi-plus-lg"></i>
          Nueva Solicitud
        </button>
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="alert-success">
          <i className="bi bi-check-circle-fill"></i>
          {successMsg}
          <button className="alert-close" onClick={() => setSuccessMsg('')}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="sol-tabs">
        <button className={`sol-tab${activeTab === 'inicio' ? ' active' : ''}`} onClick={() => setActiveTab('inicio')}>
          <i className="bi bi-house"></i>
          Inicio
        </button>
        <button className={`sol-tab${activeTab === 'nueva' ? ' active' : ''}`} onClick={() => { setActiveTab('nueva'); setStep(1) }}>
          <i className="bi bi-plus-circle"></i>
          Nueva Solicitud
        </button>
        <button className={`sol-tab${activeTab === 'mis' ? ' active' : ''}`} onClick={() => setActiveTab('mis')}>
          <i className="bi bi-clock-history"></i>
          Mis Solicitudes
          {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
        </button>
        <button className={`sol-tab${activeTab === 'docs' ? ' active' : ''}`} onClick={() => setActiveTab('docs')}>
          <i className="bi bi-download"></i>
          Mis Documentos
          {readyCount > 0 && <span className="tab-badge">{readyCount}</span>}
        </button>
      </div>

      {/* TAB: Inicio */}
      {activeTab === 'inicio' && (
        <div>
          <div className="two-col-grid">
            <div>
              {/* Quick stats */}
              <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
                <div className="stat-card s-navy">
                  <div className="stat-ico"><i className="bi bi-file-earmark-text"></i></div>
                  <div className="stat-val">{requests.length}</div>
                  <div className="stat-lbl">Total Solicitudes</div>
                </div>
                <div className="stat-card s-orange">
                  <div className="stat-ico"><i className="bi bi-hourglass-split"></i></div>
                  <div className="stat-val">{pendingCount + requests.filter(r => r.status === 'process').length}</div>
                  <div className="stat-lbl">En Proceso</div>
                </div>
                <div className="stat-card s-green">
                  <div className="stat-ico"><i className="bi bi-check-circle"></i></div>
                  <div className="stat-val">{readyCount}</div>
                  <div className="stat-lbl">Listos para Retirar</div>
                </div>
              </div>

              {/* Recent requests */}
              <div className="white-card">
                <div className="card-header-row">
                  <div>
                    <div className="card-title">Solicitudes Recientes</div>
                    <div className="card-sub">Últimas solicitudes de documentos</div>
                  </div>
                  <span className="card-link" onClick={() => setActiveTab('mis')}>Ver todas →</span>
                </div>
                {requests.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-file-earmark-x" style={{ fontSize: 32, color: 'var(--gray-300)' }}></i>
                    No tienes solicitudes aún
                    <button className="btn-primary" onClick={() => { setActiveTab('nueva'); setStep(1) }}>
                      <i className="bi bi-plus-lg"></i> Crear primera solicitud
                    </button>
                  </div>
                ) : (
                  requests.slice(0, 5).map(req => (
                    <div key={req.id} className="req-row">
                      <div className="req-ico">{req.docType.icon}</div>
                      <div className="req-info">
                        <div className="req-title">{req.docType.name}</div>
                        <div className="req-meta">
                          <span className="code-chip">{req.code}</span>
                          <span>·</span>
                          <span>{req.copies} copia{req.copies !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="req-right">
                        <StatusBadge status={req.status} />
                        <div className="req-date">{formatDate(req.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: document types quick view */}
            <div>
              <div className="white-card" style={{ marginBottom: 14 }}>
                <div className="card-header-row">
                  <div>
                    <div className="card-title">Documentos Disponibles</div>
                    <div className="card-sub">Tiempos y costos</div>
                  </div>
                </div>
                {docTypes.map(dt => {
                  const dl = deliveryLabel(dt.deliveryDays)
                  return (
                    <div key={dt.id} className="delivery-row">
                      <span className="delivery-icon">{dt.icon}</span>
                      <div className="delivery-info">
                        <div className="delivery-name">{dt.name}</div>
                        <div className="delivery-price">{formatPrice(dt.price)}</div>
                      </div>
                      <span className={`delivery-badge ${dl.cls}`}>
                        <i className="bi bi-clock"></i> {dl.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="white-card notice-card">
                <div className="notice-ico"><i className="bi bi-info-circle"></i></div>
                <div>
                  <div className="notice-title">Información de Pago</div>
                  <div className="notice-text">
                    El pago se realiza mediante transferencia bancaria. Al solicitar el documento se le proporcionarán las instrucciones de pago.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Nueva Solicitud */}
      {activeTab === 'nueva' && (
        <div className="form-wrap">
          {/* Step bar */}
          <div className="step-bar">
            <div className="step-item">
              <div className={`step-circle ${step > 1 ? 'done' : step === 1 ? 'active' : 'wait'}`}>
                {step > 1 ? <i className="bi bi-check"></i> : '1'}
              </div>
              <div className={`step-lbl ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>Tipo</div>
            </div>
            <div className={`step-line ${step > 1 ? 'done' : ''}`}></div>
            <div className="step-item">
              <div className={`step-circle ${step > 2 ? 'done' : step === 2 ? 'active' : 'wait'}`}>
                {step > 2 ? <i className="bi bi-check"></i> : '2'}
              </div>
              <div className={`step-lbl ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>Detalles</div>
            </div>
            <div className={`step-line ${step > 2 ? 'done' : ''}`}></div>
            <div className="step-item">
              <div className={`step-circle ${step === 3 ? 'active' : 'wait'}`}>3</div>
              <div className={`step-lbl ${step === 3 ? 'active' : ''}`}>Pago</div>
            </div>
          </div>

          {/* Step 1: Select doc type */}
          {step === 1 && (
            <div className="form-card">
              <div className="form-card-title">Selecciona el tipo de documento</div>
              <div className="form-card-desc">
                Elige el documento que necesitas. Los precios incluyen las gestiones administrativas.
              </div>
              <div className="doc-grid">
                {docTypes.map(dt => {
                  const dl = deliveryLabel(dt.deliveryDays)
                  return (
                    <div
                      key={dt.id}
                      className={`doc-card${selectedDocType?.id === dt.id ? ' selected' : ''}`}
                      onClick={() => setSelectedDocType(dt)}
                    >
                      <div className="doc-card-ico">{dt.icon}</div>
                      <div className="doc-card-name">{dt.name}</div>
                      <div className="doc-card-price">{formatPrice(dt.price)}</div>
                      <span className={`doc-card-delivery ${dl.cls}`}>
                        <i className="bi bi-clock" style={{ fontSize: 9 }}></i> {dl.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="form-actions">
                <button
                  className="btn-primary"
                  disabled={!selectedDocType}
                  onClick={() => setStep(2)}
                >
                  Continuar <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && selectedDocType && (
            <div className="form-card">
              <div className="form-card-title">Detalles de la Solicitud</div>
              <div className="form-card-desc">
                Documento: <strong>{selectedDocType.name}</strong> — {formatPrice(selectedDocType.price)}
              </div>

              <div className="form-grid">
                <div className="fg">
                  <label>Nombre Completo</label>
                  <input type="text" value={user.name || user.username} readOnly />
                </div>
                <div className="fg">
                  <label>Matrícula</label>
                  <input type="text" value={user.matricula || user.username} readOnly />
                </div>
                <div className="fg full">
                  <label>Carrera</label>
                  <input type="text" value={user.carrera || '—'} readOnly />
                </div>

                <div className="fg">
                  <label>Propósito <span className="req-mark">*</span></label>
                  <select value={purpose} onChange={e => setPurpose(e.target.value)}>
                    <option value="personal">Personal</option>
                    <option value="laboral">Laboral</option>
                    <option value="académico">Académico</option>
                    <option value="visa">Trámite de Visa</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="fg">
                  <label>Idioma</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                  </select>
                </div>

                <div className="fg">
                  <label>Cantidad de Copias</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={copies}
                    onChange={e => setCopies(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="fg">
                  <label>Institución Destino</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="ej. Empresa o institución"
                  />
                </div>

                <div className="fg full">
                  <label>Observaciones</label>
                  <textarea
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                    placeholder="Información adicional (opcional)"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  <i className="bi bi-arrow-left"></i> Atrás
                </button>
                <button className="btn-primary" onClick={() => setStep(3)}>
                  Continuar <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && selectedDocType && (
            <div className="form-card">
              <div className="form-card-title">Pago de la Solicitud</div>
              <div className="form-card-desc">
                Selecciona tu método de pago para completar la solicitud.
              </div>

              {/* Payment method selector */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{ flex: 1, padding: '12px 16px', border: `2px solid ${paymentMethod === 'card' ? 'var(--navy)' : 'var(--gray-200)'}`, borderRadius: 8, background: paymentMethod === 'card' ? 'rgba(0,62,126,0.06)' : 'white', cursor: 'pointer', transition: 'all 0.16s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <i className="bi bi-credit-card-2-front" style={{ fontSize: 20, color: paymentMethod === 'card' ? 'var(--navy)' : 'var(--gray-400)' }}></i>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: paymentMethod === 'card' ? 'var(--navy)' : 'var(--gray-600)' }}>Tarjeta</span>
                  <span style={{ fontSize: 10.5, color: 'var(--gray-400)' }}>Crédito / Débito</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  style={{ flex: 1, padding: '12px 16px', border: `2px solid ${paymentMethod === 'transfer' ? 'var(--navy)' : 'var(--gray-200)'}`, borderRadius: 8, background: paymentMethod === 'transfer' ? 'rgba(0,62,126,0.06)' : 'white', cursor: 'pointer', transition: 'all 0.16s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <i className="bi bi-bank" style={{ fontSize: 20, color: paymentMethod === 'transfer' ? 'var(--navy)' : 'var(--gray-400)' }}></i>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: paymentMethod === 'transfer' ? 'var(--navy)' : 'var(--gray-600)' }}>Transferencia</span>
                  <span style={{ fontSize: 10.5, color: 'var(--gray-400)' }}>Banco Popular</span>
                </button>
              </div>

              {/* Card payment form */}
              {paymentMethod === 'card' && (
                <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '18px 20px', marginBottom: 18, border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="bi bi-credit-card-2-front"></i>
                    Datos de la Tarjeta
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <i className="bi bi-credit-card" style={{ fontSize: 16, color: '#1a1f71' }} title="Visa"></i>
                      <i className="bi bi-credit-card-fill" style={{ fontSize: 16, color: '#eb001b' }} title="Mastercard"></i>
                    </span>
                  </div>

                  {/* Card number */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Número de Tarjeta</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', letterSpacing: '0.08em', outline: 'none', background: 'white' }}
                    />
                  </div>

                  {/* Cardholder */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Nombre en la Tarjeta</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      placeholder="COMO APARECE EN LA TARJETA"
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: 6, fontSize: 13, letterSpacing: '0.05em', outline: 'none', background: 'white' }}
                    />
                  </div>

                  {/* Expiry + CVV */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Vencimiento</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCardExpiry(v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v)
                        }}
                        placeholder="MM/AA"
                        maxLength={5}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', outline: 'none', background: 'white' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', outline: 'none', background: 'white' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--gray-500)' }}>
                    <i className="bi bi-shield-check" style={{ color: 'var(--green)' }}></i>
                    Pago seguro — cifrado SSL de 256 bits
                  </div>
                </div>
              )}

              {/* Bank transfer info */}
              {paymentMethod === 'transfer' && (
                <div className="bank-info" style={{ marginBottom: 18 }}>
                  <div className="bank-info-title">
                    <i className="bi bi-bank"></i>
                    Datos Bancarios — UNPHU
                  </div>
                  <div className="bank-info-body">
                    Banco: <strong>Banco Popular Dominicano</strong><br />
                    Cuenta: <strong>800-123456-7</strong> (Cuenta Corriente)<br />
                    Nombre: <strong>Universidad Nacional Pedro Henríquez Ureña</strong><br />
                    RNC: <strong>1-01-01234-5</strong>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="summary-box">
                <div className="summary-title">
                  <i className="bi bi-receipt"></i>
                  Resumen
                </div>
                <div className="det-row">
                  <span className="det-lbl">Documento</span>
                  <span className="det-val">{selectedDocType.name}</span>
                </div>
                <div className="det-row">
                  <span className="det-lbl">Propósito</span>
                  <span className="det-val" style={{ textTransform: 'capitalize' }}>{purpose}</span>
                </div>
                <div className="det-row">
                  <span className="det-lbl">Idioma</span>
                  <span className="det-val">{language === 'es' ? 'Español' : 'Inglés'}</span>
                </div>
                <div className="det-row">
                  <span className="det-lbl">Copias</span>
                  <span className="det-val">{copies}</span>
                </div>
                <div className="det-row last">
                  <span className="det-lbl">Total a pagar</span>
                  <span className="total-val">{formatPrice(selectedDocType.price * copies)}</span>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setStep(2)}>
                  <i className="bi bi-arrow-left"></i> Atrás
                </button>
                <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Procesando...</>
                  ) : (
                    <><i className="bi bi-send-check"></i> Confirmar y Enviar</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Mis Solicitudes */}
      {activeTab === 'mis' && (
        <div>
          <div className="white-card">
            <div className="card-header-row">
              <div>
                <div className="card-title">Mis Solicitudes</div>
                <div className="card-sub">{requests.length} solicitud{requests.length !== 1 ? 'es' : ''} en total</div>
              </div>
              <button className="btn-primary" onClick={() => { setActiveTab('nueva'); setStep(1) }}>
                <i className="bi bi-plus-lg"></i> Nueva
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-file-earmark-x" style={{ fontSize: 32, color: 'var(--gray-300)' }}></i>
                No tienes solicitudes aún
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="req-row">
                  <div className="req-ico">{req.docType.icon}</div>
                  <div className="req-info">
                    <div className="req-title">{req.docType.name}</div>
                    <div className="req-meta">
                      <span className="code-chip">{req.code}</span>
                      <span>·</span>
                      <span>{req.copies} copia{req.copies !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>{req.purpose}</span>
                      {req.institution && <><span>·</span><span>{req.institution}</span></>}
                    </div>
                    {req.adminNotes && (
                      <div style={{ fontSize: 11.5, color: 'var(--gray-500)', marginTop: 4 }}>
                        <i className="bi bi-chat-left-text"></i> {req.adminNotes}
                      </div>
                    )}
                    {req.auditLogs.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div className="section-label">Historial</div>
                        <div className="timeline">
                          {req.auditLogs.slice(-3).map(log => (
                            <div key={log.id} className="tl-step">
                              <div className="tl-lc">
                                <div className="tl-dot done">{log.icon || '●'}</div>
                              </div>
                              <div className="tl-body">
                                <div className="tl-title">{log.note}</div>
                                <div className="tl-when">{log.actor} · {formatDate(log.createdAt)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="req-right">
                    <StatusBadge status={req.status} />
                    <div className="req-date">{formatDate(req.createdAt)}</div>
                    {req.estimatedDate && req.status !== 'done' && req.status !== 'rejected' && (
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                        Est: {formatDate(req.estimatedDate)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: Mis Documentos */}
      {activeTab === 'docs' && (
        <div>
          <div className="white-card">
            <div className="card-header-row">
              <div>
                <div className="card-title">Mis Documentos</div>
                <div className="card-sub">Documentos listos para descargar o retirar</div>
              </div>
            </div>

            {requests.filter(r => r.status === 'ready' || r.status === 'done').length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-file-earmark-check" style={{ fontSize: 32, color: 'var(--gray-300)' }}></i>
                No tienes documentos listos aún
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  Los documentos aparecen aquí cuando estén aprobados
                </div>
              </div>
            ) : (
              requests
                .filter(r => r.status === 'ready' || r.status === 'done')
                .map(req => (
                  <div key={req.id} className="req-row">
                    <div className="req-ico">{req.docType.icon}</div>
                    <div className="req-info">
                      <div className="req-title">{req.docType.name}</div>
                      <div className="req-meta">
                        <span className="code-chip">{req.code}</span>
                        <span>·</span>
                        <span>{req.copies} copia{req.copies !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="req-right">
                      <StatusBadge status={req.status} />
                      <div className="req-acts">
                        {req.docType.autoPdf && req.status === 'ready' && (
                          <button className="act-btn act-dl">
                            <i className="bi bi-download"></i> Descargar PDF
                          </button>
                        )}
                        {!req.docType.autoPdf && (
                          <span style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>
                            <i className="bi bi-geo-alt"></i> Retirar en Registro
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`toast${toast.show ? ' show' : ''}`}>
        <span className="toast-ico"><i className="bi bi-bell"></i></span>
        {toast.msg}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => { setActiveTab('nueva'); setStep(1) }} title="Nueva Solicitud">
        <i className="bi bi-plus-lg"></i>
      </button>
    </DashboardLayout>
  )
}
