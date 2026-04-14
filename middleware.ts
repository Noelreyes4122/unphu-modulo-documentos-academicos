import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Protect /admin-panel - only admins or superusers
    if (pathname.startsWith('/admin-panel')) {
      if (!token || (token.role !== 'admin' && !token.isSuperuser)) {
        const url = req.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'access_denied')
        return NextResponse.redirect(url)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/perfil', '/solicitud-documentos', '/admin-panel', '/admin-panel/:path*'],
}
