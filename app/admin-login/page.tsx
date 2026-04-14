'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        username,
        password,
        loginType: 'admin',
        redirect: false,
      })
      if (result?.error) {
        setError('Usuario o contraseña incorrectos, o no tiene permisos de administrador.')
      } else if (result?.ok) {
        router.push('/admin-panel')
        router.refresh()
      }
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '420px 1fr', background: '#f0f2f5' }}>
      {/* LEFT PANEL — Navy admin theme */}
      <div style={{
        background: 'linear-gradient(160deg, #0a1f38 0%, #0F2D4F 45%, #003E7E 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 36px', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        {/* Diagonal decorative lines */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 60px)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 26, letterSpacing: '-0.01em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>UNPHU</span>
            <span style={{
              fontSize: 11, fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.5)',
              borderRadius: 4, padding: '2px 6px', letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.8)',
            }}>SIST</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Panel de Administración
          </div>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 44, marginBottom: 16, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>🛡️</div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 34, lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.01em' }}>
            Acceso<br />Administrativo
          </div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.70)', lineHeight: 1.7, marginBottom: 28 }}>
            Gestiona las solicitudes de documentos del Departamento de Registro y Evaluaciones.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {[
              { icon: 'bi-check2-circle', text: 'Aprobar y rechazar solicitudes' },
              { icon: 'bi-search', text: 'Seguimiento por estudiante' },
              { icon: 'bi-clock-history', text: 'Historial de auditoría completo' },
            ].map(f => (
              <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${f.icon}`} style={{ fontSize: 13 }}></i>
                </span>
                {f.text}
              </div>
            ))}
          </div>

          {/* Admin badge */}
          <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            <i className="bi bi-shield-fill-check" style={{ color: '#8CC63E' }}></i>
            Área restringida — solo personal autorizado
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', position: 'relative', zIndex: 1 }}>
          Universidad Nacional Pedro Henríquez Ureña<br />
          Dpto. de Registro y Evaluaciones © 2026
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#f0f2f5' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,62,126,0.11)', padding: '40px 36px' }}>
            {/* Logo / brand */}
            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #0a1f38, #003E7E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-shield-lock-fill" style={{ color: 'white', fontSize: 20 }}></i>
              </div>
              <div>
                <span style={{ color: '#003E7E', fontWeight: 900, fontSize: 22, fontFamily: 'Montserrat, sans-serif' }}>UNPHU</span>
                <span style={{ fontSize: 11, fontWeight: 700, border: '1.5px solid #003E7E', borderRadius: 4, padding: '1px 5px', marginLeft: 6, color: '#003E7E' }}>SIST</span>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,62,126,0.07)', borderRadius: 6, padding: '4px 11px', fontSize: 12, color: '#003E7E', fontWeight: 600, marginBottom: 12 }}>
                <i className="bi bi-shield-lock-fill"></i>
                Acceso restringido
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 20, color: '#0F2D4F', marginBottom: 4 }}>
                Acceso Administrativo
              </div>
              <div style={{ fontSize: 13, color: '#718096' }}>
                Personal de Registro y Evaluaciones
              </div>
            </div>

            {/* Demo chip */}
            <div style={{ background: '#f0f4ff', border: '1px solid #d0deff', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12.5, color: '#003E7E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-info-circle-fill" style={{ color: '#4a7fe5', flexShrink: 0 }}></i>
              <span>Demo: <strong style={{ fontFamily: 'monospace' }}>jperez</strong> / <strong style={{ fontFamily: 'monospace' }}>Admin2026!</strong></span>
            </div>

            {error && (
              <div style={{ background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', borderRadius: 7, padding: '10px 14px', fontSize: 13, color: '#c53030', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#4A5568', marginBottom: 6 }}>
                  Usuario
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }}>
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="ej. jperez"
                    required
                    style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.16s', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#003E7E'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#4A5568', marginBottom: 6 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }}>
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: '100%', paddingLeft: 38, paddingRight: 42, paddingTop: 11, paddingBottom: 11, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.16s', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#003E7E'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', fontSize: 15, padding: 0 }}>
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 22 }}>
                <span style={{ fontSize: 12, color: '#718096', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</span>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '13px', background: loading ? '#A0AEC0' : '#003E7E', color: 'white', border: 'none', borderRadius: 8, fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }}></span> Verificando...</>
                ) : (
                  <><i className="bi bi-shield-lock"></i> Ingresar</>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 18, borderTop: '1px solid #E2E8F0', fontSize: 13, color: '#718096' }}>
              ¿Eres estudiante?{' '}
              <Link href="/login" style={{ color: '#006837', fontWeight: 600 }}>Portal estudiantil</Link>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#A0AEC0' }}>
            UNPHU © 2026 — Uso exclusivo del personal autorizado
          </div>
        </div>
      </div>
    </div>
  )
}
