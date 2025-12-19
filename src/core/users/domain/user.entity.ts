import { Role } from 'src/core/roles/domain/role.entity'
import { UserStatus } from '@prisma/client'
import { RoleType, EXCLUSIVE_ROLE } from 'src/core/roles/constants'


export class User {
  // Base fields
  id!: string
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null

  // User fields
  names!: string
  lastNames!: string
  email!: string
  phone?: string | null
  username!: string
  password!: string
  ci!: string
  image?: string | null
  address?: string | null
  status!: UserStatus
  failedLoginAttempts!: number
  lockUntil?: Date | null

  // Relations (loaded on demand by repository)
  roles: Role[] = []

  // Constructor privado para forzar uso de factory methods
  private constructor() {}

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
    return this.hasRole(RoleType.ADMINISTRADOR)
  }

  get isManager(): boolean {
    return this.hasRole(RoleType.GERENTE)
  }

  get isAuditor(): boolean {
    return this.hasRole(RoleType.AUDITOR)
  }

  get isClient(): boolean {
    return this.hasRole(RoleType.CLIENTE)
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

  hasRole(roleNameOrId: string): boolean {
    return this.roles.some((role) => role.id === roleNameOrId || role.name === roleNameOrId)
  }

  getRole(id?: string): Role | undefined {
    if (!this.roles || this.roles.length === 0) return undefined

    if (id) {
      return this.roles.find((role) => role.id === id)
    }

    return this.roles[0]
  }

  updatePassword(hashedPassword: string): void {
    if (!User.isValidHashedPassword(hashedPassword)) {
      throw new Error('La contraseña debe estar hasheada correctamente')
    }
    this.password = hashedPassword
    this.resetLoginAttempts()
  }

  // ===== MÉTODOS PARA BLOQUEO POR INTENTOS =====
  incrementFailedAttempts(): void {
    this.failedLoginAttempts++

    const MAX_ATTEMPTS = 3
    const LOCK_DURATION_MINUTES = 30

    if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
      const lockUntil = new Date()
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES)
      this.lockUntil = lockUntil
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
    user.email = data.email.trim().toLowerCase()
    user.username = data.username.trim()
    user.password = data.password
    user.ci = data.ci.trim()
    user.roles = data.roles
    user.phone = data.phone?.trim() || null
    user.address = data.address?.trim() || null
    user.image = data.image || null
    user.status = UserStatus.ACTIVE
    user.failedLoginAttempts = 0
    user.lockUntil = null

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
    user.email = data.email
    user.phone = data.phone || null
    user.username = data.username
    user.password = data.password
    user.ci = data.ci
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
        throw new Error('Los nombres no pueden estar vacíos')
      }
      this.names = data.names.trim()
    }

    if (data.lastNames !== undefined) {
      if (!data.lastNames.trim()) {
        throw new Error('Los apellidos no pueden estar vacíos')
      }
      this.lastNames = data.lastNames.trim()
    }

    if (data.email !== undefined) {
      const cleanEmail = data.email.trim().toLowerCase()
      if (!User.isValidEmail(cleanEmail)) {
        throw new Error('Formato de email inválido')
      }
      this.email = cleanEmail
    }

    if (data.username !== undefined) {
      if (!data.username.trim()) {
        throw new Error('El nombre de usuario no puede estar vacío')
      }
      this.username = data.username.trim()
    }

    if (data.ci !== undefined) {
      if (!User.isValidCi(data.ci.trim())) {
        throw new Error('Formato de CI inválido')
      }
      this.ci = data.ci.trim()
    }

    if (data.phone !== undefined) {
      this.phone = data.phone?.trim() || null
    }

    if (data.address !== undefined) {
      this.address = data.address?.trim() || null
    }

    if (data.image !== undefined) {
      this.image = data.image || null
    }

    if (data.roles !== undefined) {
      if (!data.roles || data.roles.length === 0) {
        throw new Error('El usuario debe tener al menos un rol')
      }
      User.validateRoles(data.roles)
      this.roles = data.roles
    }
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
      throw new Error('Los nombres son requeridos')
    }

    if (!data.lastNames?.trim()) {
      throw new Error('Los apellidos son requeridos')
    }

    if (!data.email?.trim()) {
      throw new Error('El email es requerido')
    }

    if (!data.username?.trim()) {
      throw new Error('El nombre de usuario es requerido')
    }

    if (!data.password) {
      throw new Error('La contraseña es requerida')
    }

    if (!data.ci?.trim()) {
      throw new Error('La cédula de identidad es requerida')
    }

    if (!data.roles || data.roles.length === 0) {
      throw new Error('El usuario debe tener al menos un rol')
    }
  }

  private static validateFormats(data: {
    email: string
    password: string
    ci: string
  }): void {
    const cleanEmail = data.email.trim().toLowerCase()
    if (!User.isValidEmail(cleanEmail)) {
      throw new Error('Formato de email inválido')
    }

    if (!User.isValidHashedPassword(data.password)) {
      throw new Error('La contraseña debe estar hasheada')
    }

    if (!User.isValidCi(data.ci.trim())) {
      throw new Error('Formato de CI inválido')
    }
  }

  private static validateRoles(roles: Role[]): void {
    if (!roles || roles.length === 0) {
      throw new Error('El usuario debe tener al menos un rol')
    }

    const hasClientRole = roles.some((role) => role.name === EXCLUSIVE_ROLE)

    if (hasClientRole && roles.length > 1) {
      throw new Error(
        'El rol de CLIENTE es exclusivo y no puede combinarse con otros roles',
      )
    }
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  private static isValidHashedPassword(password: string): boolean {
    return password.length === 60 && password.startsWith('$2')
  }

  private static isValidCi(ci: string): boolean {
    return /^\d{7,10}$/.test(ci)
  }
}
