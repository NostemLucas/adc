import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { SessionCreatedEvent, SessionInvalidatedEvent, SessionRoleSwitchedEvent } from './events'

/**
 * Session Domain Entity - Representa una sesión de usuario activa
 *
 * Hereda de AggregateRoot para obtener:
 * - Campos técnicos: id, createdAt, updatedAt, deletedAt
 * - Gestión de eventos de dominio
 * - Métodos: touch(), softDelete(), restore()
 */

// ===== TIPOS PARA CONSTRUCTOR =====
interface SessionConstructorProps {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  userId: string
  refreshToken: string
  currentRole: string
  expiresAt: Date
  ipAddress?: string | null
  userAgent?: string | null
  isActive: boolean
  lastUsedAt?: Date | null
}

// ===== TIPOS PARA FACTORY METHOD =====
interface CreateSessionData {
  userId: string
  refreshToken: string
  currentRole: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

export class Session extends AggregateRoot {
  // Campos heredados de AggregateRoot:
  // - _id, _createdAt, _updatedAt, _deletedAt
  // - Getters: id, createdAt, updatedAt, deletedAt, isDeleted
  // - Métodos: touch(), softDelete(), restore()

  // ===== CAMPOS DE NEGOCIO =====
  private _userId: string
  private _refreshToken: string
  private _currentRole: string
  private _expiresAt: Date
  private _ipAddress: string | null
  private _userAgent: string | null
  private _isActive: boolean
  private _lastUsedAt: Date | null

  private constructor(props: SessionConstructorProps) {
    super()

    // Asignar campos técnicos heredados
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    // Asignar campos de negocio
    this._userId = props.userId
    this._refreshToken = props.refreshToken
    this._currentRole = props.currentRole
    this._expiresAt = props.expiresAt
    this._ipAddress = props.ipAddress ?? null
    this._userAgent = props.userAgent ?? null
    this._isActive = props.isActive
    this._lastUsedAt = props.lastUsedAt ?? null
  }

  // ===== GETTERS PÚBLICOS =====
  // id, createdAt, updatedAt, deletedAt, isDeleted → Heredados de AggregateRoot

  get userId(): string {
    return this._userId
  }

  get refreshToken(): string {
    return this._refreshToken
  }

  get currentRole(): string {
    return this._currentRole
  }

  get expiresAt(): Date {
    return this._expiresAt
  }

  get ipAddress(): string | null {
    return this._ipAddress
  }

  get userAgent(): string | null {
    return this._userAgent
  }

  get isActive(): boolean {
    return this._isActive
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt
  }

  // ===== GETTERS COMPUTADOS =====
  get isExpired(): boolean {
    return this._expiresAt < new Date()
  }

  get isValid(): boolean {
    return this._isActive && !this.isExpired
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====
  invalidate(): void {
    this._isActive = false
    this.touch()
    this.addDomainEvent(new SessionInvalidatedEvent(this._id, this._userId))
  }

  updateLastUsed(): void {
    this._lastUsedAt = new Date()
    this.touch()
  }

  switchRole(newRole: string): void {
    const previousRole = this._currentRole
    this._currentRole = newRole
    this.touch()
    this.addDomainEvent(new SessionRoleSwitchedEvent(
      this._id,
      this._userId,
      previousRole,
      newRole,
    ))
  }

  updateRefreshToken(newToken: string, newExpiresAt: Date): void {
    if (!newToken?.trim()) {
      throw new Error('El nuevo refresh token es requerido')
    }
    if (newExpiresAt <= new Date()) {
      throw new Error('La nueva fecha de expiración debe ser futura')
    }
    this._refreshToken = newToken
    this._expiresAt = newExpiresAt
    this.touch()
  }

  // ===== FACTORY METHOD: CREATE =====
  static create(data: CreateSessionData): Session {
    // Validaciones
    if (!data.userId?.trim()) {
      throw new Error('El ID de usuario es requerido')
    }

    if (!data.refreshToken?.trim()) {
      throw new Error('El refresh token es requerido')
    }

    if (!data.currentRole) {
      throw new Error('El rol activo es requerido')
    }

    if (!data.expiresAt || data.expiresAt <= new Date()) {
      throw new Error('La fecha de expiración debe ser futura')
    }

    const now = new Date()

    const session = new Session({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      userId: data.userId,
      refreshToken: data.refreshToken,
      currentRole: data.currentRole,
      expiresAt: data.expiresAt,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      isActive: true,
      lastUsedAt: now,
    })

    // Emitir evento de creación
    session.addDomainEvent(new SessionCreatedEvent(
      session._id,
      session._userId,
      session._currentRole,
    ))

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
    currentRole: string
    expiresAt: Date
    ipAddress?: string | null
    userAgent?: string | null
    isActive: boolean
    lastUsedAt?: Date | null
  }): Session {
    return new Session({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      userId: data.userId,
      refreshToken: data.refreshToken,
      currentRole: data.currentRole,
      expiresAt: data.expiresAt,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isActive: data.isActive,
      lastUsedAt: data.lastUsedAt,
    })
  }
}
