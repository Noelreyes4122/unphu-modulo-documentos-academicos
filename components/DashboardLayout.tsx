'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'

interface Props {
  children: React.ReactNode
  currentPath: string
  user: Session['user']
}

export default function DashboardLayout({ children, currentPath, user }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const isAdmin = user.role === 'admin' || user.isSuperuser

  const initials = (() => {
    const name = user.name || user.username || ''
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  })()

  const displayName = user.name || user.username

  function handleLogout() {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-brand">
          <span className="brand-text">
            UNPHU <span className="brand-sist">SIST</span>
          </span>
        </div>
        <div className="topbar-right">
          <div
            className="user-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <i className="bi bi-person-circle"></i>
            <span>{displayName}</span>
            <span className="user-arrow"><i className="bi bi-chevron-down"></i></span>

            <div className={`user-dropdown${dropdownOpen ? ' open' : ''}`}>
              <Link href="/perfil" className="dd-item" onClick={() => setDropdownOpen(false)}>
                <i className="bi bi-person"></i>
                Mi Perfil
              </Link>
              {isAdmin && (
                <Link href="/admin-panel" className="dd-item" onClick={() => setDropdownOpen(false)}>
                  <i className="bi bi-shield-check"></i>
                  Panel Admin
                </Link>
              )}
              <div className="dd-divider"></div>
              <div className="dd-item dd-logout" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i>
                Cerrar Sesión
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div style={{ padding: '8px 0', flex: 1 }}>
          <Link href="/perfil" className={`nav-item nav-highlight${currentPath === '/perfil' ? ' active' : ''}`}>
            <i className="bi bi-person-circle nav-ico"></i>
            <span className="nav-txt">Mi Perfil</span>
          </Link>

          <div className="nav-divider"></div>

          <Link href="/solicitud-documentos" className={`nav-item${currentPath === '/solicitud-documentos' ? ' active' : ''}`}>
            <i className="bi bi-file-earmark-text nav-ico"></i>
            <span className="nav-txt">Solicitar Documentos</span>
            <span className="nav-badge-new">NUEVO</span>
          </Link>

          <Link href="/solicitud-documentos" className={`nav-item${currentPath === '/solicitud-documentos?tab=mis' ? ' active' : ''}`}>
            <i className="bi bi-clock-history nav-ico"></i>
            <span className="nav-txt">Mis Solicitudes</span>
          </Link>

          <Link href="/solicitud-documentos" className={`nav-item`}>
            <i className="bi bi-download nav-ico"></i>
            <span className="nav-txt">Mis Documentos</span>
          </Link>

          {isAdmin && (
            <>
              <div className="nav-divider"></div>
              <Link href="/admin-panel" className={`nav-item nav-admin${currentPath === '/admin-panel' ? ' active' : ''}`}>
                <i className="bi bi-shield-check nav-ico"></i>
                <span className="nav-txt">Panel Administrativo</span>
                <i className="bi bi-chevron-right nav-ext"></i>
              </Link>
            </>
          )}
        </div>

        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
          <span className="nav-txt">{collapsed ? '' : 'Contraer menú'}</span>
        </button>
      </div>

      {/* Main */}
      <main className={`main${collapsed ? ' sb-collapsed' : ''}`}>
        {children}
      </main>

      {/* Footer */}
      <div className={`footer-bar${collapsed ? ' sb-collapsed' : ''}`}>
        © {new Date().getFullYear()} Universidad Nacional Pedro Henríquez Ureña — UNPHU SIST v1.0
      </div>
    </>
  )
}
