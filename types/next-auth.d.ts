import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      role: string
      matricula: string
      cedula: string
      carrera: string
      carreraCodigo: string
      periodoActivo: string
      telefono: string
      celular: string
      correoPersonal: string
      correoInstitucional: string
      cargo: string
      isSuperuser: boolean
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    username: string
    role: string
    matricula: string
    cedula: string
    carrera: string
    carreraCodigo: string
    periodoActivo: string
    telefono: string
    celular: string
    correoPersonal: string
    correoInstitucional: string
    cargo: string
    isSuperuser: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    username: string
    role: string
    matricula: string
    cedula: string
    carrera: string
    carreraCodigo: string
    periodoActivo: string
    telefono: string
    celular: string
    correoPersonal: string
    correoInstitucional: string
    cargo: string
    isSuperuser: boolean
  }
}
