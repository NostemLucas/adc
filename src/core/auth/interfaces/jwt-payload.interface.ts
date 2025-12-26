export interface JwtPayload {
  sub: string // User ID
  username: string
  email: string
  roles: string[] // All user roles
  currentRole: string // Active role for this session
  sessionId: string // Session ID
  iat?: number // Issued at
  exp?: number // Expiration
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

import type { MenuItem } from '../domain/authorization'

export interface LoginResponse {
  user: {
    id: string
    username: string
    email: string
    fullName: string
    roles: string[]
    currentRole: string
  }
  tokens: TokenPair
  menus: MenuItem[]
  permissions: string[]
}
