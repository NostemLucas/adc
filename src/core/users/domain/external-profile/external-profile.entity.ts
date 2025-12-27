import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { Email } from '../shared/value-objects'
import { InvalidUserDataException } from '../user/exceptions'
import crypto from 'crypto'

interface ExternalProfileConstructorProps {
  id: string
  createdAt: Date
  updatedAt: Date
  userId: string
  organizationId: string
  jobTitle?: string | null
  department?: string | null
  organizationalEmail?: Email | null
  isActive: boolean
  joinedAt: Date
  leftAt?: Date | null
  deletedAt?: Date | null
}

interface CreateExternalProfileData {
  userId: string
  organizationId: string
  jobTitle?: string | null
  department?: string | null
  organizationalEmail?: string | null
}

export class ExternalProfile extends AggregateRoot {
  private _userId: string
  private _organizationId: string
  private _jobTitle: string | null
  private _department: string | null
  private _organizationalEmail: Email | null
  private _isActive: boolean
  private _joinedAt: Date
  private _leftAt: Date | null

  private constructor(props: ExternalProfileConstructorProps) {
    super()
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    this._userId = props.userId
    this._organizationId = props.organizationId
    this._jobTitle = props.jobTitle ?? null
    this._department = props.department ?? null
    this._organizationalEmail = props.organizationalEmail ?? null
    this._isActive = props.isActive
    this._joinedAt = props.joinedAt
    this._leftAt = props.leftAt ?? null
  }

  // ===== GETTERS =====

  get userId(): string {
    return this._userId
  }

  get organizationId(): string {
    return this._organizationId
  }

  get jobTitle(): string | null {
    return this._jobTitle
  }

  get department(): string | null {
    return this._department
  }

  get organizationalEmail(): Email | null {
    return this._organizationalEmail
  }

  get isActive(): boolean {
    return this._isActive
  }

  get joinedAt(): Date {
    return this._joinedAt
  }

  get leftAt(): Date | null {
    return this._leftAt
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====

  activate(): void {
    this._isActive = true
    this._leftAt = null
    this.touch()
  }

  deactivate(): void {
    this._isActive = false
    this._leftAt = new Date()
    this.touch()
  }

  updateProfile(data: {
    jobTitle?: string | null
    department?: string | null
    organizationalEmail?: string | null
  }): void {
    if (data.jobTitle !== undefined) {
      this._jobTitle = data.jobTitle
    }

    if (data.department !== undefined) {
      this._department = data.department
    }

    if (data.organizationalEmail !== undefined) {
      this._organizationalEmail = data.organizationalEmail
        ? Email.create(data.organizationalEmail)
        : null
    }

    this.touch()
  }

  changeOrganization(newOrganizationId: string): void {
    if (!newOrganizationId) {
      throw new InvalidUserDataException(
        'El ID de la nueva organización es requerido',
      )
    }

    this._organizationId = newOrganizationId
    this._joinedAt = new Date()
    this.touch()
  }

  // ===== FACTORY METHODS =====

  static create(data: CreateExternalProfileData): ExternalProfile {
    ExternalProfile.validateRequiredFields(data)

    const now = new Date()
    return new ExternalProfile({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      userId: data.userId,
      organizationId: data.organizationId,
      jobTitle: data.jobTitle ?? null,
      department: data.department ?? null,
      organizationalEmail: data.organizationalEmail
        ? Email.create(data.organizationalEmail)
        : null,
      isActive: true,
      joinedAt: now,
      leftAt: null,
      deletedAt: null,
    })
  }

  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    userId: string
    organizationId: string
    jobTitle?: string | null
    department?: string | null
    organizationalEmail?: string | null
    isActive: boolean
    joinedAt: Date
    leftAt?: Date | null
  }): ExternalProfile {
    return new ExternalProfile({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      userId: data.userId,
      organizationId: data.organizationId,
      jobTitle: data.jobTitle ?? null,
      department: data.department ?? null,
      organizationalEmail: data.organizationalEmail
        ? Email.create(data.organizationalEmail)
        : null,
      isActive: data.isActive,
      joinedAt: data.joinedAt,
      leftAt: data.leftAt ?? null,
      deletedAt: data.deletedAt ?? null,
    })
  }

  // ===== VALIDACIONES =====

  private static validateRequiredFields(data: {
    userId: string
    organizationId: string
  }): void {
    if (!data.userId) {
      throw new InvalidUserDataException('El ID de usuario es requerido')
    }

    if (!data.organizationId) {
      throw new InvalidUserDataException('El ID de organización es requerido')
    }
  }
}
