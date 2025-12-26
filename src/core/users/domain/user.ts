import { UserStatus } from './constants'
import { LoginPolicy } from './policies/login-policy'
import { Role } from 'src/core/auth/domain/authorization'
import {
  Email,
  CI,
  Phone,
  PersonName,
  Username,
  Address,
  ImageUrl,
  HashedPassword,
} from './value-objects'
import {
  EmptyFieldException,
  InvalidUserDataException,
  MissingRolesException,
  ExclusiveRoleViolationException,
} from './exceptions'
import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from './events'
import crypto from 'crypto'

// ===== TIPOS PARA CONSTRUCTOR =====
interface UserConstructorProps {
  id: string
  createdAt: Date
  updatedAt: Date
  names: PersonName
  lastNames: PersonName
  email: Email
  username: Username
  password: HashedPassword
  ci: CI
  roles: Role[]
  status: UserStatus
  failedLoginAttempts: number
  lockUntil: Date | null
  phone?: Phone | null
  image?: ImageUrl | null
  address?: Address | null
  deletedAt?: Date | null
}

// ===== TIPOS PARA FACTORY METHODS =====
interface CreateUserData {
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
}

export class User extends AggregateRoot {
  private _names: PersonName
  private _lastNames: PersonName
  private _email: Email
  private _username: Username
  private _password: HashedPassword
  private _ci: CI
  private _phone: Phone | null
  private _image: ImageUrl | null
  private _address: Address | null
  private _status: UserStatus
  private _failedLoginAttempts: number
  private _lockUntil: Date | null
  private _roles: Role[]

  private constructor(props: UserConstructorProps) {
    super()
    // Asignar campos técnicos heredados
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    // Asignar campos de negocio
    this._names = props.names
    this._lastNames = props.lastNames
    this._email = props.email
    this._username = props.username
    this._password = props.password
    this._ci = props.ci
    this._roles = props.roles
    this._status = props.status
    this._failedLoginAttempts = props.failedLoginAttempts
    this._lockUntil = props.lockUntil
    this._phone = props.phone ?? null
    this._image = props.image ?? null
    this._address = props.address ?? null
  }

  get names(): PersonName {
    return this._names
  }

  get lastNames(): PersonName {
    return this._lastNames
  }

  get email(): Email {
    return this._email
  }

  get username(): Username {
    return this._username
  }

  get password(): HashedPassword {
    return this._password
  }

  get ci(): CI {
    return this._ci
  }

  get phone(): Phone | null {
    return this._phone
  }

  get image(): ImageUrl | null {
    return this._image
  }

  get address(): Address | null {
    return this._address
  }

  get status(): UserStatus {
    return this._status
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts
  }

  get lockUntil(): Date | null {
    return this._lockUntil
  }

  get roles(): Role[] {
    return this._roles
  }

  get primaryRole(): Role {
    return this._roles[0] // Primer rol asignado
  }

  // ===== GETTERS COMPUTADOS =====
  get fullName(): string {
    return `${this._names.getValue()} ${this._lastNames.getValue()}`
  }

  get isActive(): boolean {
    return this._status === UserStatus.ACTIVE
  }

  get IsInactive(): boolean {
    return this._status === UserStatus.INACTIVE
  }

  get isLocked(): boolean {
    return !!(this._lockUntil && this._lockUntil > new Date())
  }

  get isAdmin(): boolean {
    return this._roles.includes(Role.ADMINISTRADOR)
  }

  get isManager(): boolean {
    return this._roles.includes(Role.GERENTE)
  }

  get isAuditor(): boolean {
    return this._roles.includes(Role.AUDITOR)
  }

  get isClient(): boolean {
    return this._roles.includes(Role.CLIENTE)
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====
  activate(): void {
    this._status = UserStatus.ACTIVE
    this.resetLoginAttempts()
    this.touch()
  }

  deactivate(): void {
    this._status = UserStatus.INACTIVE
    this.touch()
  }

  changeStatus(): void {
    this._status = this.isActive ? UserStatus.INACTIVE : UserStatus.ACTIVE
    this.touch()
  }

  /**
   * Verifica si el usuario tiene un rol específico.
   */
  hasRole(role: Role): boolean {
    return this._roles.includes(role)
  }

  /**
   * Verifica si el usuario tiene al menos uno de los roles especificados.
   */
  hasAnyRole(...roles: Role[]): boolean {
    return roles.some((role) => this._roles.includes(role))
  }

  /**
   * Verifica si el usuario tiene todos los roles especificados.
   */
  hasAllRoles(...roles: Role[]): boolean {
    return roles.every((role) => this._roles.includes(role))
  }

  updatePassword(hashedPassword: string): void {
    this._password = HashedPassword.create(hashedPassword)
    this.resetLoginAttempts()
    this.touch()
  }

  // ===== MÉTODOS PARA BLOQUEO POR INTENTOS =====
  /**
   * Incrementa los intentos fallidos de login y bloquea la cuenta si es necesario.
   * @param policy Política de login a aplicar (por defecto, la política estándar del sistema)
   */
  incrementFailedAttempts(policy: LoginPolicy = LoginPolicy.default()): void {
    this._failedLoginAttempts++

    if (policy.shouldLockAccount(this._failedLoginAttempts)) {
      this._lockUntil = policy.calculateLockUntil()
    }
    this.touch()
  }

  resetLoginAttempts(): void {
    this._failedLoginAttempts = 0
    this._lockUntil = null
    this.touch()
  }

  canAttemptLogin(): boolean {
    if (!this.isActive) return false
    if (this.isLocked) return false
    return true
  }

  // ===== FACTORY METHOD: CREATE =====
  static create(data: CreateUserData): User {
    // Validaciones básicas
    User.validateRequiredFields(data)
    User.validateRoles(data.roles)
    const now = new Date()
    return new User({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      names: PersonName.create(data.names, 'nombres'),
      lastNames: PersonName.create(data.lastNames, 'apellidos'),
      email: Email.create(data.email),
      username: Username.create(data.username),
      password: HashedPassword.create(data.password),
      ci: CI.create(data.ci),
      roles: data.roles,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockUntil: null,
      phone: data.phone ? Phone.create(data.phone) : null,
      image: data.image ? ImageUrl.create(data.image) : null,
      address: Address.create(data.address),
      deletedAt: null,
    })
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
    roles: Role[]
  }): User {
    // Crear User usando objeto de configuración
    return new User({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      names: PersonName.create(data.names, 'nombres'),
      lastNames: PersonName.create(data.lastNames, 'apellidos'),
      email: Email.create(data.email),
      username: Username.create(data.username),
      password: HashedPassword.create(data.password), // ← VO valida
      ci: CI.create(data.ci),
      roles: data.roles,
      status: data.status,
      failedLoginAttempts: data.failedLoginAttempts,
      lockUntil: data.lockUntil || null,
      phone: data.phone ? Phone.create(data.phone) : null,
      image: ImageUrl.create(data.image),
      address: Address.create(data.address),
      deletedAt: data.deletedAt || null,
    })
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
      this._names = PersonName.create(data.names, 'nombres')
    }

    if (data.lastNames !== undefined) {
      this._lastNames = PersonName.create(data.lastNames, 'apellidos')
    }

    if (data.email !== undefined) {
      this._email = Email.create(data.email)
    }

    if (data.username !== undefined) {
      this._username = Username.create(data.username)
    }

    if (data.ci !== undefined) {
      this._ci = CI.create(data.ci)
    }

    if (data.phone !== undefined) {
      this._phone = data.phone ? Phone.create(data.phone) : null
    }

    if (data.address !== undefined) {
      this._address = Address.create(data.address)
    }

    if (data.image !== undefined) {
      this._image = ImageUrl.create(data.image)
    }

    if (data.roles !== undefined) {
      User.validateRoles(data.roles)
      this._roles = data.roles
    }

    // Actualizar timestamp
    this.touch()

    // Emitir evento de actualización
    const updatedFields = Object.keys(data)
    this.addDomainEvent(
      new UserUpdatedEvent(
        this._id,
        this._email.getValue(),
        this._username.getValue(),
        this.fullName,
        updatedFields,
        this._updatedAt,
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
        this._id,
        this._email.getValue(),
        this._username.getValue(),
        this.fullName,
        this._roles,
        this._createdAt,
      ),
    )
  }

  /**
   * Marca el usuario como eliminado (soft delete) y emite el evento UserDeletedEvent.
   */
  markAsDeleted(): void {
    this.deactivate()
    this._deletedAt = new Date()

    this.addDomainEvent(
      new UserDeletedEvent(
        this._id,
        this._email.getValue(),
        this._username.getValue(),
        this._deletedAt!,
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
    // Validación básica - Los Value Objects harán validaciones detalladas
    if (!data.password) {
      throw new EmptyFieldException('contraseña')
    }

    if (!data.roles || data.roles.length === 0) {
      throw new MissingRolesException()
    }
  }

  private static validateRoles(roles: Role[]): void {
    // 1. Debe tener al menos un rol
    if (!roles || roles.length === 0) {
      throw new MissingRolesException()
    }

    // 2. Máximo 3 roles
    if (roles.length > 3) {
      throw new InvalidUserDataException(
        'Un usuario no puede tener más de 3 roles',
      )
    }

    // 3. CLIENTE es exclusivo
    if (roles.includes(Role.CLIENTE) && roles.length > 1) {
      throw new ExclusiveRoleViolationException('CLIENTE')
    }

    // 4. No roles duplicados
    const uniqueRoles = new Set(roles)
    if (uniqueRoles.size !== roles.length) {
      throw new InvalidUserDataException('No se permiten roles duplicados')
    }
  }
}
