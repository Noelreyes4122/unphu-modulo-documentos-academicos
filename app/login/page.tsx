'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
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
        loginType: 'student',
        redirect: false,
      })
      if (result?.error) {
        setError('Usuario o contraseña incorrectos. Verifique sus credenciales.')
      } else if (result?.ok) {
        router.push('/perfil')
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
      {/* LEFT PANEL */}
      <div style={{
        background: 'linear-gradient(160deg, #004d25 0%, #006837 40%, #439441 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 36px', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Logo */}
        <div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', marginBottom: 4 }}>
            UNPHU<span style={{ color: '#8CC63E' }}>SIST</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Sistema Universitario
          </div>
        </div>

        {/* Center content */}
        <div>
          <div style={{ fontSize: 48, marginBottom: 20, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>🎓</div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 22, lineHeight: 1.3, marginBottom: 12 }}>
            Portal Estudiantil
          </div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 28 }}>
            Accede a tus documentos académicos y gestiona tus solicitudes universitarias.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: 'bi-file-earmark-text', text: 'Solicitud de documentos' },
              { icon: 'bi-download', text: 'Descarga de documentos' },
              { icon: 'bi-clock-history', text: 'Seguimiento en tiempo real' },
            ].map(f => (
              <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${f.icon}`} style={{ fontSize: 13 }}></i>
                </span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>
          Universidad Nacional Pedro Henríquez Ureña<br />
          © UNPHU 2026
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Card */}
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 4px 32px rgba(0,62,126,0.10)', padding: '40px 36px' }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--navy)', marginBottom: 6 }}>
                Acceso Estudiantes
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--gray-500)' }}>
                Ingresa con tu matrícula UNPHU
              </div>
            </div>

            {/* Demo chip */}
            <div style={{ background: '#f0f4ff', border: '1px solid #d0deff', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12.5, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-info-circle-fill" style={{ color: '#4a7fe5', flexShrink: 0 }}></i>
              <span>Demo: <strong style={{ fontFamily: 'monospace' }}>nr21-2021</strong> / <strong style={{ fontFamily: 'monospace' }}>Demo2026!</strong></span>
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
                  Matrícula / Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="ej. nr21-2021"
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
                style={{ width: '100%', padding: '13px', background: loading ? 'var(--gray-400)' : 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }}></span> Iniciando sesión...</>
                ) : (
                  <><i className="bi bi-box-arrow-in-right"></i> Iniciar Sesión</>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--gray-200)', fontSize: 13, color: 'var(--gray-500)' }}>
              ¿Eres personal administrativo?{' '}
              <Link href="/admin-login" style={{ color: 'var(--navy)', fontWeight: 600 }}>Acceso administrativo</Link>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--gray-400)' }}>
            UNPHU © 2026 — Módulo de Documentos Académicos
          </div>
        </div>
      </div>
    </div>
  )
}
