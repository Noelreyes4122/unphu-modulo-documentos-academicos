'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

interface Student {
  id: number; firstName: string; lastName: string; username: string; matricula: string; carrera: string; correoInstitucional: string
}
interface DocumentType {
  id: number; name: string; slug: string; icon: string; price: number; deliveryDays: number
}
interface AuditLog {
  id: number; action: string; icon: string; actor: string; note: string; createdAt: string
}
interface DocumentRequest {
  id: number; code: string; status: string; copies: number; purpose: string; language: string
  institution: string; observations: string; adminNotes: string; createdAt: string
  estimatedDate: string | null; student: Student; docType: DocumentType; auditLogs: AuditLog[]
}

const REJECTION_REASONS = [
  'Documentación incompleta o incorrecta',
  'Pago no verificado o insuficiente',
  'Deuda pendiente con la universidad',
  'Información del estudiante no coincide',
  'Solicitud duplicada',
  'Documento no disponible en este momento',
  'Estudiante no activo en el período indicado',
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: string; leftBorder: string }> = {
  pending:  { label: 'Pendiente',  color: '#B7791F', bg: 'rgba(245,166,35,0.10)',  border: 'rgba(245,166,35,0.30)',  icon: 'bi-hourglass-split',  leftBorder: '#F5A623' },
  process:  { label: 'En Proceso', color: '#2B6CB0', bg: 'rgba(43,108,176,0.10)',  border: 'rgba(43,108,176,0.30)',  icon: 'bi-gear-fill',        leftBorder: '#2B6CB0' },
  approved: { label: 'Aprobado',   color: '#006837', bg: 'rgba(67,148,65,0.10)',   border: 'rgba(67,148,65,0.30)',   icon: 'bi-check-circle-fill',leftBorder: '#439441' },
  ready:    { label: 'Listo',      color: '#006837', bg: 'rgba(67,148,65,0.10)',   border: 'rgba(67,148,65,0.30)',   icon: 'bi-bag-check-fill',   leftBorder: '#439441' },
  done:     { label: 'Entregado',  color: '#004d25', bg: 'rgba(0,77,37,0.08)',     border: 'rgba(0,77,37,0.25)',     icon: 'bi-patch-check-fill', leftBorder: '#006837' },
  rejected: { label: 'Rechazado', color: '#C53030', bg: 'rgba(229,62,62,0.08)',   border: 'rgba(229,62,62,0.25)',   icon: 'bi-x-circle-fill',   leftBorder: '#E53E3E' },
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] || { label: status, color: '#718096', bg: '#EDF2F7', border: '#CBD5E0', icon: 'bi-circle', leftBorder: '#CBD5E0' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:20, fontSize:11.5, fontWeight:700, color:c.color, background:c.bg, border:`1px solid ${c.border}` }}>
      <i className={`bi ${c.icon}`} style={{ fontSize:10 }}></i>{c.label}
    </span>
  )
}

function Avatar({ student }: { student: Student }) {
  const initials = ((student.firstName?.[0]||'')+(student.lastName?.[0]||'')).toUpperCase() || student.username.slice(0,2).toUpperCase()
  const colors = ['#003E7E','#006837','#2B6CB0','#1A4B6E','#439441']
  return (
    <div style={{ width:44, height:44, borderRadius:'50%', background:colors[(student.id||0)%colors.length], display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontSize:15, fontWeight:800, color:'white', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
      {initials}
    </div>
  )
}

const fd = (d: string) => d ? new Date(d).toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const ft = (d: string) => d ? new Date(d).toLocaleTimeString('es-DO', { hour:'2-digit', minute:'2-digit' }) : ''
const fp = (p: number, c=1) => `RD$${(Number(p)*c).toLocaleString('es-DO',{minimumFractionDigits:0})}`

export default function AdminPanelPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending'|'process'|'ready'|'rejected'|'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState({ show:false, msg:'', type:'success' })
  const [actionLoading, setActionLoading] = useState<number|null>(null)
  const [openAudits, setOpenAudits] = useState<Set<number>>(new Set())
  const [rejectModal, setRejectModal] = useState<{ open:boolean; id:number|null }>({ open:false, id:null })
  const [rejectReason, setRejectReason] = useState('')
  const [rejectObs, setRejectObs] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      if (session.user.role !== 'admin' && !session.user.isSuperuser) { router.push('/perfil'); return }
      fetchRequests()
    }
  }, [status, session])

  async function fetchRequests() {
    setLoading(true)
    try { const r = await fetch('/api/admin/requests'); if(r.ok) setRequests(await r.json()) }
    finally { setLoading(false) }
  }

  function showToast(msg: string, type='success') {
    setToast({ show:true, msg, type })
    setTimeout(() => setToast(t => ({...t, show:false})), 3500)
  }

  async function handleAction(id: number, action: 'aprobar'|'proceso') {
    setActionLoading(id)
    try {
      const r = await fetch(`/api/admin/requests/${id}/${action}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' })
      if(r.ok) { showToast(action==='aprobar' ? '✅ Marcada como lista' : '⚙️ En proceso'); await fetchRequests() }
      else showToast('❌ Error al actualizar','error')
    } catch { showToast('❌ Error de conexión','error') }
    finally { setActionLoading(null) }
  }

  async function handleRechazar() {
    if(!rejectModal.id || !rejectReason) return
    const id = rejectModal.id
    setRejectModal({ open:false, id:null })
    setActionLoading(id)
    try {
      const r = await fetch(`/api/admin/requests/${id}/rechazar`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ reason:rejectReason, observations:rejectObs }) })
      if(r.ok) { showToast('Solicitud rechazada','info'); await fetchRequests() }
      else showToast('❌ Error al rechazar','error')
    } catch { showToast('❌ Error de conexión','error') }
    finally { setActionLoading(null); setRejectReason(''); setRejectObs('') }
  }

  if (status==='loading'||loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <span className="spinner"></span>
      <span style={{ fontSize:13, color:'var(--gray-400)' }}>Cargando panel...</span>
    </div>
  )
  if (!session) return null

  const stats = {
    total:requests.length, pending:requests.filter(r=>r.status==='pending').length,
    process:requests.filter(r=>r.status==='process').length, ready:requests.filter(r=>r.status==='ready').length,
    rejected:requests.filter(r=>r.status==='rejected').length, done:requests.filter(r=>r.status==='done').length,
  }

  const TABS = [
    { key:'pending',  label:'Pendientes', count:stats.pending,  accent:'#F5A623' },
    { key:'process',  label:'En Proceso', count:stats.process,  accent:'#2B6CB0' },
    { key:'ready',    label:'Listos',     count:stats.ready,    accent:'#439441' },
    { key:'rejected', label:'Rechazados', count:stats.rejected, accent:'#E53E3E' },
    { key:'all',      label:'Todas',      count:stats.total,    accent:'#003E7E' },
  ]

  const filtered = requests.filter(req => {
    const matchTab = activeTab==='all' || req.status===activeTab
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || req.code.toLowerCase().includes(q) ||
      req.student.firstName.toLowerCase().includes(q) || req.student.lastName.toLowerCase().includes(q) ||
      req.student.username.toLowerCase().includes(q) || req.student.matricula.toLowerCase().includes(q) ||
      req.docType.name.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  return (
    <DashboardLayout currentPath="/admin-panel" user={session.user}>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:22, color:'var(--navy)', marginBottom:3 }}>Panel Administrativo</div>
          <div style={{ fontSize:13, color:'var(--gray-500)' }}>Departamento de Registro y Evaluaciones — UNPHU</div>
        </div>
        <button onClick={fetchRequests} className="btn-secondary"><i className="bi bi-arrow-clockwise"></i> Actualizar</button>
      </div>

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total',      val:stats.total,    icon:'bi-file-earmark-text', accent:'#003E7E', bg:'rgba(0,62,126,0.07)' },
          { label:'Pendientes', val:stats.pending,  icon:'bi-hourglass-split',   accent:'#B7791F', bg:'rgba(245,166,35,0.09)' },
          { label:'En Proceso', val:stats.process,  icon:'bi-gear-fill',         accent:'#2B6CB0', bg:'rgba(43,108,176,0.09)' },
          { label:'Listos',     val:stats.ready,    icon:'bi-bag-check-fill',    accent:'#006837', bg:'rgba(67,148,65,0.09)' },
          { label:'Rechazados', val:stats.rejected, icon:'bi-x-circle-fill',     accent:'#C53030', bg:'rgba(229,62,62,0.07)' },
        ].map(s => (
          <div key={s.label} style={{ background:'white', borderRadius:10, padding:'16px 18px', boxShadow:'0 1px 8px rgba(0,62,126,0.08)', borderTop:`3px solid ${s.accent}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</span>
              <span style={{ width:30, height:30, borderRadius:8, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className={`bi ${s.icon}`} style={{ fontSize:13, color:s.accent }}></i>
              </span>
            </div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:30, fontWeight:800, color:'var(--text)', lineHeight:1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* SEARCH + TABS */}
      <div style={{ background:'white', borderRadius:10, boxShadow:'0 1px 8px rgba(0,62,126,0.08)', marginBottom:20, overflow:'hidden' }}>
        <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--gray-100)', display:'flex', alignItems:'center', gap:10 }}>
          <i className="bi bi-search" style={{ color:'var(--gray-400)', fontSize:14, flexShrink:0 }}></i>
          <input type="text" placeholder="Buscar por código, nombre, matrícula o tipo de documento..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
            style={{ flex:1, border:'none', outline:'none', fontSize:13.5, color:'var(--text)', background:'transparent' }} />
          {searchQuery && <button onClick={()=>setSearchQuery('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', fontSize:14, padding:0 }}><i className="bi bi-x-lg"></i></button>}
        </div>
        <div style={{ display:'flex', padding:'0 8px', borderBottom:'2px solid var(--gray-100)', overflowX:'auto' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={()=>setActiveTab(tab.key as typeof activeTab)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'12px 16px', border:'none', background:'none', cursor:'pointer', fontSize:13, fontWeight:activeTab===tab.key?700:500, color:activeTab===tab.key?tab.accent:'var(--gray-500)', borderBottom:activeTab===tab.key?`2px solid ${tab.accent}`:'2px solid transparent', marginBottom:-2, transition:'all 0.16s', whiteSpace:'nowrap' }}>
              {tab.label}
              {tab.count>0 && <span style={{ minWidth:20, height:20, padding:'0 5px', borderRadius:10, fontSize:10.5, fontWeight:700, background:activeTab===tab.key?tab.accent:'var(--gray-200)', color:activeTab===tab.key?'white':'var(--gray-600)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* CARDS */}
      {filtered.length===0 ? (
        <div style={{ background:'white', borderRadius:10, padding:'60px 24px', textAlign:'center', boxShadow:'0 1px 8px rgba(0,62,126,0.07)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--gray-600)', marginBottom:6 }}>{searchQuery?'Sin resultados para tu búsqueda':'No hay solicitudes en esta categoría'}</div>
          <div style={{ fontSize:12.5, color:'var(--gray-400)' }}>{searchQuery?`"${searchQuery}" no coincide con ninguna solicitud`:'Las solicitudes aparecerán aquí cuando los estudiantes las envíen'}</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(req => {
            const cfg = STATUS_CFG[req.status] || STATUS_CFG['pending']
            const isLoading = actionLoading===req.id
            const auditOpen = openAudits.has(req.id)
            const canAct = req.status==='pending'||req.status==='process'
            return (
              <div key={req.id} style={{ background:'white', borderRadius:10, boxShadow:'0 1px 8px rgba(0,62,126,0.07)', borderLeft:`4px solid ${cfg.leftBorder}`, overflow:'hidden', transition:'box-shadow 0.16s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(0,62,126,0.12)'}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 8px rgba(0,62,126,0.07)'}>
                <div style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'16px 18px' }}>
                  <Avatar student={req.student} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:6 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14.5, color:'var(--text)', marginBottom:2 }}>{req.student.firstName} {req.student.lastName}</div>
                        <div style={{ fontSize:12, color:'var(--gray-500)', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                          <span style={{ fontFamily:'monospace', background:'var(--gray-100)', padding:'1px 6px', borderRadius:4, fontSize:11, color:'var(--navy)', fontWeight:600, border:'1px solid var(--gray-200)' }}>{req.student.matricula||req.student.username}</span>
                          {req.student.carrera && <><span style={{ color:'var(--gray-300)' }}>·</span><span>{req.student.carrera}</span></>}
                        </div>
                      </div>
                      <StatusPill status={req.status} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--gray-50)', borderRadius:7, padding:'8px 12px', marginBottom:10, flexWrap:'wrap' }}>
                      <span style={{ fontSize:18 }}>{req.docType.icon}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{req.docType.name}</span>
                      <span style={{ color:'var(--gray-300)' }}>·</span>
                      <span style={{ fontSize:12.5, color:'var(--gray-500)' }}>{req.copies} copia{req.copies!==1?'s':''}</span>
                      <span style={{ color:'var(--gray-300)' }}>·</span>
                      <span style={{ fontSize:12.5, fontWeight:700, color:'var(--green-dark)' }}>{fp(req.docType.price,req.copies)}</span>
                      {req.language && <><span style={{ color:'var(--gray-300)' }}>·</span><span style={{ fontSize:12, color:'var(--gray-500)' }}>{req.language==='es'?'🇩🇴 ES':'🇺🇸 EN'}</span></>}
                      {req.purpose && <><span style={{ color:'var(--gray-300)' }}>·</span><span style={{ fontSize:12, color:'var(--gray-500)', textTransform:'capitalize' }}>{req.purpose}</span></>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:14, fontSize:11.5, color:'var(--gray-400)', flexWrap:'wrap' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}><i className="bi bi-hash" style={{ fontSize:10 }}></i><span style={{ fontFamily:'monospace', fontWeight:600, color:'var(--navy)' }}>{req.code}</span></span>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}><i className="bi bi-calendar3"></i>{fd(req.createdAt)} · {ft(req.createdAt)}</span>
                      {req.institution && <span style={{ display:'flex', alignItems:'center', gap:4 }}><i className="bi bi-building"></i>{req.institution}</span>}
                      {req.estimatedDate && req.status!=='done' && req.status!=='rejected' && <span style={{ display:'flex', alignItems:'center', gap:4 }}><i className="bi bi-clock"></i>Est. {fd(req.estimatedDate)}</span>}
                    </div>
                    {req.adminNotes && (
                      <div style={{ marginTop:8, padding:'6px 10px', background:'rgba(229,62,62,0.06)', borderRadius:6, fontSize:12, color:'#C53030', display:'flex', alignItems:'flex-start', gap:6, borderLeft:'3px solid rgba(229,62,62,0.3)' }}>
                        <i className="bi bi-chat-left-text" style={{ marginTop:1, flexShrink:0 }}></i>{req.adminNotes}
                      </div>
                    )}
                    {req.auditLogs.length>0 && (
                      <div style={{ marginTop:10 }}>
                        <button onClick={()=>setOpenAudits(prev=>{ const n=new Set(prev); n.has(req.id)?n.delete(req.id):n.add(req.id); return n })}
                          style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--gray-500)', padding:0, fontWeight:600 }}>
                          <i className={`bi bi-chevron-${auditOpen?'up':'down'}`} style={{ fontSize:10 }}></i>
                          Historial ({req.auditLogs.length} registros)
                        </button>
                        {auditOpen && (
                          <div style={{ marginTop:8, paddingLeft:4, borderLeft:'2px solid var(--gray-200)', marginLeft:6 }}>
                            {req.auditLogs.map((log,i) => (
                              <div key={log.id} style={{ display:'flex', gap:8, alignItems:'flex-start', paddingBottom:i<req.auditLogs.length-1?10:0 }}>
                                <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, marginLeft:-12, border:'2px solid white' }}>{log.icon||'·'}</div>
                                <div>
                                  <div style={{ fontSize:12, color:'var(--text)', fontWeight:500 }}>{log.note}</div>
                                  <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:2 }}>{log.actor} · {fd(log.createdAt)} {ft(log.createdAt)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0, minWidth:130 }}>
                    {isLoading ? (
                      <div style={{ display:'flex', justifyContent:'center', padding:8 }}><span className="spinner" style={{ width:22, height:22, borderWidth:2 }}></span></div>
                    ) : canAct ? (
                      <>
                        {req.status==='pending' && (
                          <button onClick={()=>handleAction(req.id,'proceso')} className="act-btn act-process" style={{ width:'100%', justifyContent:'center', padding:'8px 12px', borderRadius:7 }}>
                            <i className="bi bi-gear-fill" style={{ fontSize:11 }}></i> Procesar
                          </button>
                        )}
                        <button onClick={()=>handleAction(req.id,'aprobar')} className="act-btn act-approve" style={{ width:'100%', justifyContent:'center', padding:'8px 12px', borderRadius:7 }}>
                          <i className="bi bi-check-lg" style={{ fontSize:11 }}></i> {req.status==='process'?'Marcar Listo':'Aprobar'}
                        </button>
                        <button onClick={()=>{ setRejectModal({open:true,id:req.id}); setRejectReason(''); setRejectObs('') }} className="act-btn act-reject" style={{ width:'100%', justifyContent:'center', padding:'8px 12px', borderRadius:7 }}>
                          <i className="bi bi-x-lg" style={{ fontSize:11 }}></i> Rechazar
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize:11.5, color:cfg.color, display:'flex', alignItems:'center', gap:5, padding:'4px 0' }}>
                        <i className={`bi ${cfg.icon}`}></i>{cfg.label}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* REJECT MODAL */}
      <div style={{ position:'fixed', inset:0, background:'rgba(10,30,60,0.55)', display:rejectModal.open?'flex':'none', alignItems:'center', justifyContent:'center', zIndex:600, padding:20, backdropFilter:'blur(2px)' }}>
        <div style={{ background:'white', borderRadius:12, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', width:'100%', maxWidth:520, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--gray-200)', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{ width:32, height:32, borderRadius:8, background:'rgba(229,62,62,0.10)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="bi bi-x-circle-fill" style={{ color:'#E53E3E', fontSize:15 }}></i>
                </span>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:16, fontWeight:800, color:'var(--text)' }}>Rechazar Solicitud</div>
              </div>
              <div style={{ fontSize:12.5, color:'var(--gray-500)' }}>Selecciona el motivo para notificar al estudiante</div>
            </div>
            <button onClick={()=>setRejectModal({open:false,id:null})} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', fontSize:18, padding:'2px 6px', borderRadius:4 }}><i className="bi bi-x"></i></button>
          </div>
          <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
            <div style={{ fontSize:11.5, fontWeight:700, color:'var(--gray-400)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:10 }}>Motivo del rechazo</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
              {REJECTION_REASONS.map(reason => (
                <label key={reason} onClick={()=>setRejectReason(reason)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:`1.5px solid ${rejectReason===reason?'#E53E3E':'var(--gray-200)'}`, borderRadius:8, cursor:'pointer', background:rejectReason===reason?'rgba(229,62,62,0.05)':'white', transition:'all 0.15s', fontSize:13, color:rejectReason===reason?'#C53030':'var(--gray-700)', fontWeight:rejectReason===reason?600:400 }}>
                  <i className={`bi ${rejectReason===reason?'bi-record-circle-fill':'bi-circle'}`} style={{ color:rejectReason===reason?'#E53E3E':'var(--gray-300)', flexShrink:0 }}></i>
                  {reason}
                </label>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11.5, fontWeight:700, color:'var(--gray-400)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:8 }}>Observaciones adicionales (opcional)</div>
              <textarea value={rejectObs} onChange={e=>setRejectObs(e.target.value)} placeholder="Información adicional para el estudiante..."
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--gray-200)', borderRadius:7, fontSize:13, outline:'none', minHeight:80, resize:'vertical', fontFamily:'inherit' }} />
            </div>
          </div>
          <div style={{ padding:'14px 24px', borderTop:'1px solid var(--gray-200)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--gray-50)' }}>
            <button onClick={()=>setRejectModal({open:false,id:null})} className="btn-secondary">Cancelar</button>
            <button onClick={handleRechazar} disabled={!rejectReason} className="btn-danger" style={{ opacity:rejectReason?1:0.45 }}>
              <i className="bi bi-x-lg"></i> Confirmar Rechazo
            </button>
          </div>
        </div>
      </div>

      {/* TOAST */}
      <div style={{ position:'fixed', bottom:toast.show?22:-70, right:22, background:toast.type==='error'?'#C53030':toast.type==='info'?'#2B6CB0':'#006837', color:'white', padding:'12px 18px', borderRadius:9, display:'flex', alignItems:'center', gap:10, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(0,0,0,0.22)', zIndex:9999, transition:'bottom 0.32s cubic-bezier(0.34,1.56,0.64,1)', minWidth:240, maxWidth:340 }}>
        <i className={`bi ${toast.type==='error'?'bi-exclamation-triangle-fill':toast.type==='info'?'bi-info-circle-fill':'bi-check-circle-fill'}`} style={{ fontSize:15 }}></i>
        {toast.msg}
      </div>

    </DashboardLayout>
  )
}
