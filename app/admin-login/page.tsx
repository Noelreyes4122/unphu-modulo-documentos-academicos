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
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: -50, right: -70, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -50, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', top: '45%', right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(140,198,62,0.08)' }} />

        {/* Logo */}
        <div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', marginBottom: 4 }}>
            UNPHU<span style={{ color: '#8CC63E' }}>SIST</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Panel de Administración
          </div>
        </div>

        {/* Center content */}
        <div>
          <div style={{ fontSize: 48, marginBottom: 20, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>🛡️</div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 22, lineHeight: 1.3, marginBottom: 12 }}>
            Acceso Administrativo
          </div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 28 }}>
            Gestiona las solicitudes de documentos del Departamento de Registro y Evaluaciones.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>
          Universidad Nacional Pedro Henríquez Ureña<br />
          Dpto. de Registro y Evaluaciones © 2026
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 4px 32px rgba(0,62,126,0.10)', padding: '40px 36px' }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,62,126,0.07)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: 'var(--navy)', fontWeight: 600, marginBottom: 14 }}>
                <i className="bi bi-shield-lock-fill"></i>
                Acceso restringido
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--navy)', marginBottom: 6 }}>
                Iniciar Sesión
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--gray-500)' }}>
                Personal de Registro y Evaluaciones
              </div>
            </div>

            {/* Demo chip */}
            <div style={{ background: '#f0f4ff', border: '1px solid #d0deff', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12.5, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
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
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="ej. jperez"
                  required
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 7, fontSize: 14, outline: 'none', transition: 'border-color 0.16s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--navy)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: '100%', padding: '11px 42px 11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 7, fontSize: 14, outline: 'none', transition: 'border-color 0.16s' }}
                    onFocus={e => e.target.style.borderColor = 'var(--navy)'}
                    onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 15, padding: 0 }}>
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '13px', background: loading ? 'var(--gray-400)' : 'var(--navy-dark)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }}></span> Verificando...</>
                ) : (
                  <><i className="bi bi-shield-lock"></i> Acceder al Panel</>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--gray-200)', fontSize: 13, color: 'var(--gray-500)' }}>
              ¿Eres estudiante?{' '}
              <Link href="/login" style={{ color: 'var(--green-dark)', fontWeight: 600 }}>Portal estudiantil</Link>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--gray-400)' }}>
            UNPHU © 2026 — Uso exclusivo del personal autorizado
          </div>
        </div>
      </div>
    </div>
  )
}
