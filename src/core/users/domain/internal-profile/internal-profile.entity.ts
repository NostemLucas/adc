import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { SystemRole } from '../shared/constants'
import { InvalidUserDataException } from '../user/exceptions'
import crypto from 'crypto'

interface InternalProfileConstructorProps {
  id: string
  createdAt: Date
  updatedAt: Date
  userId: string
  roles: SystemRole[]
  department?: string | null
  employeeCode?: string | null
  hireDate?: Date | null
  deletedAt?: Date | null
}

interface CreateInternalProfileData {
  userId: string
  roles: SystemRole[]
  department?: string | null
  employeeCode?: string | null
  hireDate?: Date | null
}

export class InternalProfile extends AggregateRoot {
  private _userId: string
  private _roles: SystemRole[]
  private _department: string | null
  private _employeeCode: string | null
  private _hireDate: Date | null

  private constructor(props: InternalProfileConstructorProps) {
    super()
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    this._userId = props.userId
    this._roles = props.roles
    this._department = props.department ?? null
    this._employeeCode = props.employeeCode ?? null
    this._hireDate = props.hireDate ?? null
  }

  // ===== GETTERS =====

  get userId(): string {
    return this._userId
  }

  get roles(): SystemRole[] {
    return this._roles
  }

  get department(): string | null {
    return this._department
  }

  get employeeCode(): string | null {
    return this._employeeCode
  }

  get hireDate(): Date | null {
    return this._hireDate
  }

  // ===== GETTERS COMPUTADOS =====

  get isAdmin(): boolean {
    return this._roles.includes(SystemRole.ADMINISTRADOR)
  }

  get isManager(): boolean {
    return this._roles.includes(SystemRole.GERENTE)
  }

  get isAuditor(): boolean {
    return this._roles.includes(SystemRole.AUDITOR)
  }

  get primaryRole(): SystemRole {
    return this._roles[0]
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====

  hasRole(role: SystemRole): boolean {
    return this._roles.includes(role)
  }

  hasAnyRole(...roles: SystemRole[]): boolean {
    return roles.some((role) => this._roles.includes(role))
  }

  hasAllRoles(...roles: SystemRole[]): boolean {
    return roles.every((role) => this._roles.includes(role))
  }

  updateRoles(roles: SystemRole[]): void {
    InternalProfile.validateRoles(roles)
    this._roles = roles
    this.touch()
  }

  updateProfile(data: {
    department?: string | null
    employeeCode?: string | null
    hireDate?: Date | null
  }): void {
    if (data.department !== undefined) {
      this._department = data.department
    }

    if (data.employeeCode !== undefined) {
      this._employeeCode = data.employeeCode
    }

    if (data.hireDate !== undefined) {
      this._hireDate = data.hireDate
    }

    this.touch()
  }

  // ===== FACTORY METHODS =====

  static create(data: CreateInternalProfileData): InternalProfile {
    InternalProfile.validateRoles(data.roles)

    const now = new Date()
    return new InternalProfile({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      userId: data.userId,
      roles: data.roles,
      department: data.department ?? null,
      employeeCode: data.employeeCode ?? null,
      hireDate: data.hireDate ?? null,
      deletedAt: null,
    })
  }

  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    userId: string
    roles: SystemRole[]
    department?: string | null
    employeeCode?: string | null
    hireDate?: Date | null
  }): InternalProfile {
    return new InternalProfile({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      userId: data.userId,
      roles: data.roles,
      department: data.department ?? null,
      employeeCode: data.employeeCode ?? null,
      hireDate: data.hireDate ?? null,
      deletedAt: data.deletedAt ?? null,
    })
  }

  // ===== VALIDACIONES =====

  private static validateRoles(roles: SystemRole[]): void {
    if (!roles || roles.length === 0) {
      throw new InvalidUserDataException(
        'El perfil interno debe tener al menos un rol',
      )
    }

    if (roles.length > 3) {
      throw new InvalidUserDataException(
        'El perfil interno no puede tener más de 3 roles',
      )
    }

    // Verificar que no haya roles duplicados
    const uniqueRoles = new Set(roles)
    if (uniqueRoles.size !== roles.length) {
      throw new InvalidUserDataException('No se permiten roles duplicados')
    }

    // Verificar que todos los roles sean válidos
    const validRoles = Object.values(SystemRole)
    for (const role of roles) {
      if (!validRoles.includes(role)) {
        throw new InvalidUserDataException(`Rol inválido: ${role}`)
      }
    }
  }
}
