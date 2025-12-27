import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { OrganizationName } from './value-objects'
import {
  Email,
  Phone,
  Address,
  ImageUrl,
} from 'src/core/users/domain'
import {
  OrganizationCreatedEvent,
  OrganizationUpdatedEvent,
  OrganizationDeletedEvent,
} from './events'
import { EmptyFieldException } from './exceptions'
import crypto from 'crypto'

// ===== TIPOS PARA CONSTRUCTOR =====
interface OrganizationConstructorProps {
  id: string
  createdAt: Date
  updatedAt: Date
  name: OrganizationName
  description?: string | null
  address?: Address | null
  phone?: Phone | null
  email?: Email | null
  logo?: ImageUrl | null
  banner?: ImageUrl | null
  mission?: string | null
  vision?: string | null
  values?: string | null
  website?: string | null
  taxId?: string | null
  isActive: boolean
  deletedAt?: Date | null
}

// ===== TIPOS PARA FACTORY METHODS =====
interface CreateOrganizationData {
  name: string
  description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  logo?: string | null
  banner?: string | null
  mission?: string | null
  vision?: string | null
  values?: string | null
  website?: string | null
  taxId?: string | null
}

export class Organization extends AggregateRoot {
  private _name: OrganizationName
  private _description: string | null
  private _address: Address | null
  private _phone: Phone | null
  private _email: Email | null
  private _logo: ImageUrl | null
  private _banner: ImageUrl | null
  private _mission: string | null
  private _vision: string | null
  private _values: string | null
  private _website: string | null
  private _taxId: string | null
  private _isActive: boolean

  private constructor(props: OrganizationConstructorProps) {
    super()

    // Asignar campos técnicos heredados
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    // Asignar campos de negocio
    this._name = props.name
    this._description = props.description ?? null
    this._address = props.address ?? null
    this._phone = props.phone ?? null
    this._email = props.email ?? null
    this._logo = props.logo ?? null
    this._banner = props.banner ?? null
    this._mission = props.mission ?? null
    this._vision = props.vision ?? null
    this._values = props.values ?? null
    this._website = props.website ?? null
    this._taxId = props.taxId ?? null
    this._isActive = props.isActive
  }

  // ===== GETTERS =====

  get name(): OrganizationName {
    return this._name
  }

  get description(): string | null {
    return this._description
  }

  get address(): Address | null {
    return this._address
  }

  get phone(): Phone | null {
    return this._phone
  }

  get email(): Email | null {
    return this._email
  }

  get logo(): ImageUrl | null {
    return this._logo
  }

  get banner(): ImageUrl | null {
    return this._banner
  }

  get mission(): string | null {
    return this._mission
  }

  get vision(): string | null {
    return this._vision
  }

  get values(): string | null {
    return this._values
  }

  get website(): string | null {
    return this._website
  }

  get taxId(): string | null {
    return this._taxId
  }

  get isActive(): boolean {
    return this._isActive
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====

  activate(): void {
    this._isActive = true
    this.touch()
  }

  deactivate(): void {
    this._isActive = false
    this.touch()
  }

  updateProfile(data: {
    name?: string
    description?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    mission?: string | null
    vision?: string | null
    values?: string | null
    website?: string | null
    taxId?: string | null
  }): void {
    if (data.name !== undefined) {
      this._name = OrganizationName.create(data.name)
    }

    if (data.description !== undefined) {
      this._description = data.description
    }

    if (data.address !== undefined) {
      this._address = Address.create(data.address)
    }

    if (data.phone !== undefined) {
      this._phone = data.phone ? Phone.create(data.phone) : null
    }

    if (data.email !== undefined) {
      this._email = data.email ? Email.create(data.email) : null
    }

    if (data.mission !== undefined) {
      this._mission = data.mission
    }

    if (data.vision !== undefined) {
      this._vision = data.vision
    }

    if (data.values !== undefined) {
      this._values = data.values
    }

    if (data.website !== undefined) {
      this._website = data.website
    }

    if (data.taxId !== undefined) {
      this._taxId = data.taxId
    }

    this.touch()

    // Emitir evento de actualización
    this.addDomainEvent(
      new OrganizationUpdatedEvent(
        this._id,
        this._name.getValue(),
        Object.keys(data),
        this._updatedAt,
      ),
    )
  }

  updateLogo(logoUrl: string): void {
    this._logo = ImageUrl.create(logoUrl)
    this.touch()
  }

  updateBanner(bannerUrl: string): void {
    this._banner = ImageUrl.create(bannerUrl)
    this.touch()
  }

  // ===== FACTORY METHOD: CREATE =====

  static create(data: CreateOrganizationData): Organization {
    Organization.validateRequiredFields(data)

    const now = new Date()

    return new Organization({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      name: OrganizationName.create(data.name),
      description: data.description ?? null,
      address: Address.create(data.address),
      phone: data.phone ? Phone.create(data.phone) : null,
      email: data.email ? Email.create(data.email) : null,
      logo: ImageUrl.create(data.logo),
      banner: ImageUrl.create(data.banner),
      mission: data.mission ?? null,
      vision: data.vision ?? null,
      values: data.values ?? null,
      website: data.website ?? null,
      taxId: data.taxId ?? null,
      isActive: true,
      deletedAt: null,
    })
  }

  // ===== FACTORY METHOD: FROM PERSISTENCE =====

  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    name: string
    description?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    logo?: string | null
    banner?: string | null
    mission?: string | null
    vision?: string | null
    values?: string | null
    website?: string | null
    taxId?: string | null
    isActive: boolean
  }): Organization {
    return new Organization({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      name: OrganizationName.create(data.name),
      description: data.description ?? null,
      address: Address.create(data.address),
      phone: data.phone ? Phone.create(data.phone) : null,
      email: data.email ? Email.create(data.email) : null,
      logo: ImageUrl.create(data.logo),
      banner: ImageUrl.create(data.banner),
      mission: data.mission ?? null,
      vision: data.vision ?? null,
      values: data.values ?? null,
      website: data.website ?? null,
      taxId: data.taxId ?? null,
      isActive: data.isActive,
      deletedAt: data.deletedAt ?? null,
    })
  }

  // ===== MÉTODOS PARA EVENTOS DE DOMINIO =====

  markAsCreated(): void {
    this.addDomainEvent(
      new OrganizationCreatedEvent(
        this._id,
        this._name.getValue(),
        this._createdAt,
      ),
    )
  }

  markAsDeleted(): void {
    this.deactivate()
    this._deletedAt = new Date()

    this.addDomainEvent(
      new OrganizationDeletedEvent(this._id, this._name.getValue(), this._deletedAt),
    )
  }

  // ===== VALIDACIONES PRIVADAS =====

  private static validateRequiredFields(data: { name: string }): void {
    if (!data.name?.trim()) {
      throw new EmptyFieldException('nombre de organización')
    }
  }
}
