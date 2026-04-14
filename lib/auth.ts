import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
        loginType: { label: 'Tipo de Login', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          return null
        }

        const loginType = credentials.loginType || 'student'

        // Block students from admin login
        if (loginType === 'admin' && user.role === 'student') {
          throw new Error('ACCESS_DENIED_STUDENT')
        }

        // Block admins from student login
        if (loginType === 'student' && user.role === 'admin') {
          throw new Error('ACCESS_DENIED_ADMIN')
        }

        return {
          id: user.id.toString(),
          username: user.username,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          role: user.role,
          matricula: user.matricula,
          cedula: user.cedula,
          carrera: user.carrera,
          carreraCodigo: user.carreraCodigo,
          periodoActivo: user.periodoActivo,
          telefono: user.telefono,
          celular: user.celular,
          correoPersonal: user.correoPersonal,
          correoInstitucional: user.correoInstitucional,
          cargo: user.cargo,
          isSuperuser: user.isSuperuser,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.matricula = user.matricula
        token.cedula = user.cedula
        token.carrera = user.carrera
        token.carreraCodigo = user.carreraCodigo
        token.periodoActivo = user.periodoActivo
        token.telefono = user.telefono
        token.celular = user.celular
        token.correoPersonal = user.correoPersonal
        token.correoInstitucional = user.correoInstitucional
        token.cargo = user.cargo
        token.isSuperuser = user.isSuperuser
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.username = token.username
      session.user.role = token.role
      session.user.matricula = token.matricula
      session.user.cedula = token.cedula
      session.user.carrera = token.carrera
      session.user.carreraCodigo = token.carreraCodigo
      session.user.periodoActivo = token.periodoActivo
      session.user.telefono = token.telefono
      session.user.celular = token.celular
      session.user.correoPersonal = token.correoPersonal
      session.user.correoInstitucional = token.correoInstitucional
      session.user.cargo = token.cargo
      session.user.isSuperuser = token.isSuperuser
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
