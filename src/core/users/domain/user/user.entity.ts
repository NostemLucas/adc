import { UserStatus, UserType } from '../shared/constants'
import { LoginPolicy } from '../shared/policies/login-policy'
import {
  Email,
  CI,
  Phone,
  PersonName,
  Username,
  Address,
  ImageUrl,
  HashedPassword,
} from '../shared/value-objects'
import { EmptyFieldException, ImmutableUserTypeException } from './exceptions'
import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from './events'
import crypto from 'crypto'

// ===== TIPOS PARA CONSTRUCTOR =====
interface UserConstructorProps {
  id: string
  createdAt: Date
  updatedAt: Date
  type: UserType
  names: PersonName
  lastNames: PersonName
  email: Email
  username: Username
  password: HashedPassword
  ci: CI
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
  type: UserType // OBLIGATORIO
  names: string
  lastNames: string
  email: string
  username: string
  password: string
  ci: string
  phone?: string | null
  address?: string | null
  image?: string | null
}

export class User extends AggregateRoot {
  // CAMPO INMUTABLE
  private readonly _type: UserType

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

  protected constructor(props: UserConstructorProps) {
    super()
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    // INMUTABLE: Se asigna una sola vez
    this._type = props.type

    this._names = props.names
    this._lastNames = props.lastNames
    this._email = props.email
    this._username = props.username
    this._password = props.password
    this._ci = props.ci
    this._status = props.status
    this._failedLoginAttempts = props.failedLoginAttempts
    this._lockUntil = props.lockUntil
    this._phone = props.phone ?? null
    this._image = props.image ?? null
    this._address = props.address ?? null
  }

  // ===== GETTERS =====

  get type(): UserType {
    return this._type
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

  // ===== GETTERS COMPUTADOS =====

  get fullName(): string {
    return `${this._names.getValue()} ${this._lastNames.getValue()}`
  }

  get isActive(): boolean {
    return this._status === UserStatus.ACTIVE
  }

  get isInactive(): boolean {
    return this._status === UserStatus.INACTIVE
  }

  get isLocked(): boolean {
    return !!(this._lockUntil && this._lockUntil > new Date())
  }

  get isInternal(): boolean {
    return this._type === UserType.INTERNAL
  }

  get isExternal(): boolean {
    return this._type === UserType.EXTERNAL
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

  updatePassword(hashedPassword: string): void {
    this._password = HashedPassword.create(hashedPassword)
    this.resetLoginAttempts()
    this.touch()
  }

  // ===== MÉTODOS PARA BLOQUEO POR INTENTOS =====

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

  // PROHIBIR CAMBIO DE TIPO (Inmutabilidad)
  changeType(newType: UserType): never {
    throw new ImmutableUserTypeException()
  }

  update(data: {
    names?: string
    lastNames?: string
    email?: string
    username?: string
    ci?: string
    phone?: string | null
    address?: string | null
    image?: string | null
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

    this.touch()

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

  // ===== FACTORY METHOD: CREATE =====
  static create(data: CreateUserData): User {
    User.validateRequiredFields(data)

    const now = new Date()
    return new User({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      type: data.type, // INMUTABLE desde el inicio
      names: PersonName.create(data.names, 'nombres'),
      lastNames: PersonName.create(data.lastNames, 'apellidos'),
      email: Email.create(data.email),
      username: Username.create(data.username),
      password: HashedPassword.create(data.password),
      ci: CI.create(data.ci),
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
    type: UserType
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
  }): User {
    return new User({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      type: data.type,
      names: PersonName.create(data.names, 'nombres'),
      lastNames: PersonName.create(data.lastNames, 'apellidos'),
      email: Email.create(data.email),
      username: Username.create(data.username),
      password: HashedPassword.create(data.password),
      ci: CI.create(data.ci),
      status: data.status,
      failedLoginAttempts: data.failedLoginAttempts,
      lockUntil: data.lockUntil || null,
      phone: data.phone ? Phone.create(data.phone) : null,
      image: ImageUrl.create(data.image),
      address: Address.create(data.address),
      deletedAt: data.deletedAt || null,
    })
  }

  // ===== MÉTODOS PARA EVENTOS DE DOMINIO =====

  markAsCreated(): void {
    this.addDomainEvent(
      new UserCreatedEvent(
        this._id,
        this._email.getValue(),
        this._username.getValue(),
        this.fullName,
        this._type,
        this._createdAt,
      ),
    )
  }

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
    type: UserType
    names: string
    lastNames: string
    email: string
    username: string
    password: string
    ci: string
  }): void {
    if (!data.password) {
      throw new EmptyFieldException('contraseña')
    }

    if (!data.type) {
      throw new EmptyFieldException('tipo de usuario')
    }
  }
}
