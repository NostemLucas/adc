import type { MenuItem } from '../domain/authorization'

export interface JwtPayload {
  sub: string // User ID
  username: string
  email: string
  fullName: string // Full name of the user
  profileId: string // ID del InternalProfile o ExternalProfile

  // Para usuarios INTERNAL (si tiene roles, es interno)
  roles?: string[] // All system roles (solo INTERNAL)
  currentRole?: string // Active role for this session (solo INTERNAL)

  // Para usuarios EXTERNAL (si tiene organizationId, es externo)
  organizationId?: string // ID de la organización (solo EXTERNAL)

  sessionId: string // Session ID
  iat?: number // Issued at
  exp?: number // Expiration
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: {
    id: string
    username: string
    email: string
    fullName: string

    // Para INTERNAL (si tiene roles, es interno)
    roles?: string[]
    currentRole?: string

    // Para EXTERNAL (si tiene organizationId, es externo)
    organizationId?: string
  }
  tokens: TokenPair
  menus: MenuItem[]
  permissions: string[]
}
