/**
 * Session Domain Entity - Pure domain logic without ORM decorators
 */
export class Session {
  // Base fields
  id!: string
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null

  // Session fields
  userId!: string
  refreshToken!: string
  expiresAt!: Date
  ipAddress?: string | null
  userAgent?: string | null
  isActive!: boolean
  lastUsedAt?: Date | null

  // Constructor privado para forzar uso de factory methods
  private constructor() {}

  // ===== GETTERS =====
  get isExpired(): boolean {
    return this.expiresAt < new Date()
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====
  invalidate(): void {
    this.isActive = false
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date()
  }

  // ===== FACTORY METHOD: CREATE =====
  static create(data: {
    userId: string
    refreshToken: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
  }): Session {
    if (!data.userId?.trim()) {
      throw new Error('El ID de usuario es requerido')
    }

    if (!data.refreshToken?.trim()) {
      throw new Error('El refresh token es requerido')
    }

    if (!data.expiresAt || data.expiresAt <= new Date()) {
      throw new Error('La fecha de expiración debe ser futura')
    }

    const session = new Session()
    session.userId = data.userId
    session.refreshToken = data.refreshToken
    session.expiresAt = data.expiresAt
    session.ipAddress = data.ipAddress || null
    session.userAgent = data.userAgent || null
    session.isActive = true
    session.lastUsedAt = new Date()

    return session
  }

  // ===== FACTORY METHOD: FROM PERSISTENCE =====
  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    userId: string
    refreshToken: string
    expiresAt: Date
    ipAddress?: string | null
    userAgent?: string | null
    isActive: boolean
    lastUsedAt?: Date | null
  }): Session {
    const session = new Session()

    session.id = data.id
    session.createdAt = data.createdAt
    session.updatedAt = data.updatedAt
    session.deletedAt = data.deletedAt || null
    session.userId = data.userId
    session.refreshToken = data.refreshToken
    session.expiresAt = data.expiresAt
    session.ipAddress = data.ipAddress || null
    session.userAgent = data.userAgent || null
    session.isActive = data.isActive
    session.lastUsedAt = data.lastUsedAt || null

    return session
  }
}
