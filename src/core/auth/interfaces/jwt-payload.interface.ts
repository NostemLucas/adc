export interface JwtPayload {
  sub: string // User ID
  username: string
  email: string
  roles: string[] // Role names
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
    roles: string[]
  }
  tokens: TokenPair
}
