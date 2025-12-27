import type { MenuItem } from '../domain/authorization'
import type { UserType } from 'src/core/users/domain'

export interface JwtPayload {
  sub: string // User ID
  username: string
  email: string
  type: UserType // INTERNAL o EXTERNAL
  profileId: string // ID del InternalProfile o ExternalProfile

  // Para usuarios INTERNAL
  roles?: string[] // All system roles (solo INTERNAL)
  currentRole?: string // Active role for this session (solo INTERNAL)

  // Para usuarios EXTERNAL
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
    type: UserType

    // Para INTERNAL
    roles?: string[]
    currentRole?: string

    // Para EXTERNAL
    organizationId?: string
  }
  tokens: TokenPair
  menus: MenuItem[]
  permissions: string[]
}
