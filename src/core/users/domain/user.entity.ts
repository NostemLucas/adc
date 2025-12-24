import { Role } from 'src/core/roles/domain/role.entity'
import { UserStatus } from './constants'
import { RoleType, EXCLUSIVE_ROLE } from 'src/core/roles/constants'
import { LoginPolicy } from './login-policy'
import { Email, CI, Phone } from './value-objects'
import {
  InvalidPasswordException,
  EmptyFieldException,
  MissingRolesException,
  ExclusiveRoleViolationException,
} from './exceptions'
import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from './events'

export class User extends AggregateRoot {
  // Base fields
  id!: string
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null

  // User fields
  names!: string
  lastNames!: string
  email!: Email // ← Value Object
  phone?: Phone | null // ← Value Object
  username!: string
  password!: string
  ci!: CI // ← Value Object
  image?: string | null
  address?: string | null
  status!: UserStatus
  failedLoginAttempts!: number
  lockUntil?: Date | null

  // Relations (loaded on demand by repository)
  roles: Role[] = []

  // Constructor privado para forzar uso de factory methods
  private constructor() {
    super()
  }

  // ===== GETTERS =====
  get fullName(): string {
    return `${this.names} ${this.lastNames}`
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE
  }

  get isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date())
  }

  get isAdmin(): boolean {
    return this.hasRoleByName(RoleType.ADMINISTRADOR)
  }

  get isManager(): boolean {
    return this.hasRoleByName(RoleType.GERENTE)
  }

  get isAuditor(): boolean {
    return this.hasRoleByName(RoleType.AUDITOR)
  }

  get isClient(): boolean {
    return this.hasRoleByName(RoleType.CLIENTE)
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====
  activate(): void {
    this.status = UserStatus.ACTIVE
    this.resetLoginAttempts()
  }

  deactivate(): void {
    this.status = UserStatus.INACTIVE
  }

  changeStatus(): void {
    this.status = this.isActive ? UserStatus.INACTIVE : UserStatus.ACTIVE
  }

  /**
   * Verifica si el usuario tiene un rol específico por nombre.
   */
  hasRoleByName(roleName: string): boolean {
    return this.roles.some((role) => role.name === roleName)
  }

  /**
   * Verifica si el usuario tiene un rol específico por ID.
   */
  hasRoleById(roleId: string): boolean {
    return this.roles.some((role) => role.id === roleId)
  }

  /**
   * Busca un rol específico por ID.
   */
  getRoleById(roleId: string): Role | undefined {
    return this.roles.find((role) => role.id === roleId)
  }

  /**
   * Rol principal del usuario.
   * En este dominio, el rol principal es el rol con mayor jerarquía.
   * Si el usuario tiene el rol de CLIENTE, ese es siempre el rol principal (es exclusivo).
   * De lo contrario, se devuelve el primer rol asignado.
   */
  get primaryRole(): Role | undefined {
    if (!this.roles || this.roles.length === 0) return undefined

    // Si tiene rol de cliente, ese es el principal (es exclusivo)
    const clientRole = this.roles.find((role) => role.name === EXCLUSIVE_ROLE)
    if (clientRole) return clientRole

    // De lo contrario, el primer rol (puede mejorarse con jerarquía explícita)
    return this.roles[0]
  }

  updatePassword(hashedPassword: string): void {
    if (!User.isValidHashedPassword(hashedPassword)) {
      throw new InvalidPasswordException(
        'La contraseña debe estar hasheada correctamente',
      )
    }
    this.password = hashedPassword
    this.resetLoginAttempts()
  }

  // ===== MÉTODOS PARA BLOQUEO POR INTENTOS =====
  /**
   * Incrementa los intentos fallidos de login y bloquea la cuenta si es necesario.
   * @param policy Política de login a aplicar (por defecto, la política estándar del sistema)
   */
  incrementFailedAttempts(policy: LoginPolicy = LoginPolicy.default()): void {
    this.failedLoginAttempts++

    if (policy.shouldLockAccount(this.failedLoginAttempts)) {
      this.lockUntil = policy.calculateLockUntil()
    }
  }

  resetLoginAttempts(): void {
    this.failedLoginAttempts = 0
    this.lockUntil = null
  }

  canAttemptLogin(): boolean {
    if (!this.isActive) return false
    if (this.isLocked) return false
    return true
  }

  // ===== FACTORY METHOD: CREATE =====
  static create(data: {
    names: string
    lastNames: string
    email: string
    username: string
    password: string
    ci: string
    roles: Role[]
    phone?: string | null
    address?: string | null
    image?: string | null
  }): User {
    // Validaciones
    User.validateRequiredFields(data)
    User.validateFormats(data)
    User.validateRoles(data.roles)

    const user = new User()

    user.names = data.names.trim()
    user.lastNames = data.lastNames.trim()
    user.email = Email.create(data.email)
    user.username = data.username.trim()
    user.password = data.password
    user.ci = CI.create(data.ci)
    user.roles = data.roles
    user.phone = data.phone ? Phone.create(data.phone) : null
    user.address = data.address?.trim() || null
    user.image = data.image || null
    user.status = UserStatus.ACTIVE
    user.failedLoginAttempts = 0
    user.lockUntil = null

    // Nota: El evento se emitirá después de persistir (cuando ya tengamos el ID)
    // Ver método markAsCreated()

    return user
  }

  // ===== FACTORY METHOD: FROM PERSISTENCE =====
  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    names: string
    lastNames: string
    email: string
    phone?: string | null
    username: string
    password: string
    ci: string
    image?: string | null
    address?: string | null
    status: UserStatus
    failedLoginAttempts: number
    lockUntil?: Date | null
    roles?: Role[]
  }): User {
    const user = new User()

    // Base fields
    user.id = data.id
    user.createdAt = data.createdAt
    user.updatedAt = data.updatedAt
    user.deletedAt = data.deletedAt || null

    // User fields
    user.names = data.names
    user.lastNames = data.lastNames
    user.email = Email.create(data.email) // ← Crea Value Object
    user.phone = data.phone ? Phone.create(data.phone) : null // ← Crea Value Object
    user.username = data.username
    user.password = data.password
    user.ci = CI.create(data.ci) // ← Crea Value Object
    user.image = data.image || null
    user.address = data.address || null
    user.status = data.status
    user.failedLoginAttempts = data.failedLoginAttempts
    user.lockUntil = data.lockUntil || null

    // Relations
    user.roles = data.roles || []

    return user
  }

  // ===== MÉTODO: UPDATE =====
  update(data: {
    names?: string
    lastNames?: string
    email?: string
    username?: string
    ci?: string
    phone?: string | null
    address?: string | null
    image?: string | null
    roles?: Role[]
  }): void {
    if (data.names !== undefined) {
      if (!data.names.trim()) {
        throw new EmptyFieldException('nombres')
      }
      this.names = data.names.trim()
    }

    if (data.lastNames !== undefined) {
      if (!data.lastNames.trim()) {
        throw new EmptyFieldException('apellidos')
      }
      this.lastNames = data.lastNames.trim()
    }

    if (data.email !== undefined) {
      this.email = Email.create(data.email) // ← Crea Value Object (valida automáticamente)
    }

    if (data.username !== undefined) {
      if (!data.username.trim()) {
        throw new EmptyFieldException('nombre de usuario')
      }
      this.username = data.username.trim()
    }

    if (data.ci !== undefined) {
      this.ci = CI.create(data.ci) // ← Crea Value Object (valida automáticamente)
    }

    if (data.phone !== undefined) {
      this.phone = data.phone ? Phone.create(data.phone) : null // ← Crea Value Object
    }

    if (data.address !== undefined) {
      this.address = data.address?.trim() || null
    }

    if (data.image !== undefined) {
      this.image = data.image || null
    }

    if (data.roles !== undefined) {
      if (!data.roles || data.roles.length === 0) {
        throw new MissingRolesException()
      }
      User.validateRoles(data.roles)
      this.roles = data.roles
    }

    // Emitir evento de actualización
    const updatedFields = Object.keys(data)
    this.addDomainEvent(
      new UserUpdatedEvent(
        this.id,
        this.email.getValue(),
        this.username,
        this.fullName,
        updatedFields,
        new Date(),
      ),
    )
  }

  // ===== MÉTODOS PARA EVENTOS DE DOMINIO =====

  /**
   * Marca el usuario como creado y emite el evento UserCreatedEvent.
   * Se debe llamar después de persistir el usuario (cuando ya tiene ID y timestamps).
   */
  markAsCreated(): void {
    this.addDomainEvent(
      new UserCreatedEvent(
        this.id,
        this.email.getValue(),
        this.username,
        this.fullName,
        this.roles.map((r) => r.name),
        this.createdAt,
      ),
    )
  }

  /**
   * Marca el usuario como eliminado (soft delete) y emite el evento UserDeletedEvent.
   */
  markAsDeleted(): void {
    this.deactivate()
    this.deletedAt = new Date()

    this.addDomainEvent(
      new UserDeletedEvent(
        this.id,
        this.email.getValue(),
        this.username,
        this.deletedAt,
      ),
    )
  }

  // ===== VALIDACIONES PRIVADAS =====
  private static validateRequiredFields(data: {
    names: string
    lastNames: string
    email: string
    username: string
    password: string
    ci: string
    roles: Role[]
  }): void {
    if (!data.names?.trim()) {
      throw new EmptyFieldException('nombres')
    }

    if (!data.lastNames?.trim()) {
      throw new EmptyFieldException('apellidos')
    }

    if (!data.email?.trim()) {
      throw new EmptyFieldException('email')
    }

    if (!data.username?.trim()) {
      throw new EmptyFieldException('nombre de usuario')
    }

    if (!data.password) {
      throw new EmptyFieldException('contraseña')
    }

    if (!data.ci?.trim()) {
      throw new EmptyFieldException('cédula de identidad')
    }

    if (!data.roles || data.roles.length === 0) {
      throw new MissingRolesException()
    }
  }

  private static validateFormats(data: {
    email: string
    password: string
    ci: string
  }): void {
    // Email y CI se validan automáticamente en los Value Objects
    // Solo validamos password aquí

    if (!User.isValidHashedPassword(data.password)) {
      throw new InvalidPasswordException('La contraseña debe estar hasheada')
    }
  }

  private static validateRoles(roles: Role[]): void {
    if (!roles || roles.length === 0) {
      throw new MissingRolesException()
    }

    const hasClientRole = roles.some((role) => role.name === EXCLUSIVE_ROLE)

    if (hasClientRole && roles.length > 1) {
      throw new ExclusiveRoleViolationException('CLIENTE')
    }
  }

  /**
   * Valida que la contraseña esté hasheada (no texto plano).
   * Soporta múltiples algoritmos de hashing (bcrypt, argon2, etc.)
   */
  private static isValidHashedPassword(password: string): boolean {
    // Validación genérica: debe ser un hash (no texto plano)
    // Los hashes típicamente empiezan con $ y tienen formato específico
    const hashPatterns = [
      /^\$2[aby]\$/, // bcrypt
      /^\$argon2/, // argon2
      /^\$6\$/, // SHA-512
      /^\$5\$/, // SHA-256
    ]

    return hashPatterns.some((pattern) => pattern.test(password))
  }
}
