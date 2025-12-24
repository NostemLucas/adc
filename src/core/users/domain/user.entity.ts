import { Role } from 'src/core/roles/domain/role.entity'
import { UserStatus } from './constants'
import { RoleType, EXCLUSIVE_ROLE } from 'src/core/roles/constants'
import { LoginPolicy } from './login-policy'
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
  // Campos privados
  private readonly _id: string
  private readonly _createdAt: Date
  private readonly _updatedAt: Date
  private _deletedAt: Date | null
  private _names: PersonName
  private _lastNames: PersonName
  private _email: Email
  private _username: Username
  private _password: HashedPassword
  private _ci: CI
  private _roles: Role[]
  private _status: UserStatus
  private _failedLoginAttempts: number
  private _lockUntil: Date | null
  private _phone: Phone | null
  private _image: ImageUrl | null
  private _address: Address | null

  // Constructor privado que recibe un objeto de configuración
  private constructor(props: UserConstructorProps) {
    super()
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
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
    this._deletedAt = props.deletedAt ?? null
  }

  // ===== GETTERS PÚBLICOS =====
  get id(): string {
    return this._id
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get deletedAt(): Date | null {
    return this._deletedAt
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
    // Devolver copia para proteger inmutabilidad
    return [...this._roles]
  }

  // ===== GETTERS COMPUTADOS =====
  get fullName(): string {
    return `${this._names.getValue()} ${this._lastNames.getValue()}`
  }

  get isActive(): boolean {
    return this._status === UserStatus.ACTIVE
  }

  get isLocked(): boolean {
    return !!(this._lockUntil && this._lockUntil > new Date())
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
    this._status = UserStatus.ACTIVE
    this.resetLoginAttempts()
  }

  deactivate(): void {
    this._status = UserStatus.INACTIVE
  }

  changeStatus(): void {
    this._status = this.isActive ? UserStatus.INACTIVE : UserStatus.ACTIVE
  }

  /**
   * Verifica si el usuario tiene un rol específico por nombre.
   */
  hasRoleByName(roleName: string): boolean {
    return this._roles.some((role) => role.name === roleName)
  }

  /**
   * Verifica si el usuario tiene un rol específico por ID.
   */
  hasRoleById(roleId: string): boolean {
    return this._roles.some((role) => role.id === roleId)
  }

  /**
   * Busca un rol específico por ID.
   */
  getRoleById(roleId: string): Role | undefined {
    return this._roles.find((role) => role.id === roleId)
  }

  /**
   * Rol principal del usuario.
   * En este dominio, el rol principal es el rol con mayor jerarquía.
   * Si el usuario tiene el rol de CLIENTE, ese es siempre el rol principal (es exclusivo).
   * De lo contrario, se devuelve el primer rol asignado.
   */
  get primaryRole(): Role | undefined {
    if (!this._roles || this._roles.length === 0) return undefined

    // Si tiene rol de cliente, ese es el principal (es exclusivo)
    const clientRole = this._roles.find((role) => role.name === EXCLUSIVE_ROLE)
    if (clientRole) return clientRole

    // De lo contrario, el primer rol (puede mejorarse con jerarquía explícita)
    return this._roles[0]
  }

  updatePassword(hashedPassword: string): void {
    // El VO HashedPassword se encarga de validar
    this._password = HashedPassword.create(hashedPassword)
    this.resetLoginAttempts()
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
  }

  resetLoginAttempts(): void {
    this._failedLoginAttempts = 0
    this._lockUntil = null
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

    // Crear User usando objeto de configuración (más seguro que 14+ parámetros)
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
    roles?: Role[]
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
      roles: data.roles || [],
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
    // Los Value Objects ya hacen las validaciones necesarias
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
      if (!data.roles || data.roles.length === 0) {
        throw new MissingRolesException()
      }
      User.validateRoles(data.roles)
      this._roles = data.roles
    }

    // Emitir evento de actualización
    const updatedFields = Object.keys(data)
    this.addDomainEvent(
      new UserUpdatedEvent(
        this._id,
        this._email.getValue(),
        this._username.getValue(),
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
        this._id,
        this._email.getValue(),
        this._username.getValue(),
        this.fullName,
        this._roles.map((r) => r.name),
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
    if (!roles || roles.length === 0) {
      throw new MissingRolesException()
    }

    const hasClientRole = roles.some((role) => role.name === EXCLUSIVE_ROLE)

    if (hasClientRole && roles.length > 1) {
      throw new ExclusiveRoleViolationException('CLIENTE')
    }
  }
}
