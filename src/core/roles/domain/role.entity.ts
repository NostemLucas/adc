import { RoleType } from '../constants'

/**
 * Role Domain Entity - Pure domain logic without ORM decorators
 */
export class Role {
  // Base fields
  id!: string
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null

  // Role fields
  name!: string
  description?: string | null

  // Constructor privado para forzar uso de factory methods
  private constructor() {}

  // ===== GETTERS =====
  get isClient(): boolean {
    return this.name === RoleType.CLIENTE
  }

  get isAdmin(): boolean {
    return this.name === RoleType.ADMINISTRADOR
  }

  get isManager(): boolean {
    return this.name === RoleType.GERENTE
  }

  get isAuditor(): boolean {
    return this.name === RoleType.AUDITOR
  }

  // ===== FACTORY METHOD: CREATE =====
  static create(data: { name: string; description?: string }): Role {
    if (!data.name?.trim()) {
      throw new Error('El nombre del rol es requerido')
    }

    const validRoles = Object.values(RoleType)
    if (!validRoles.includes(data.name as RoleType)) {
      throw new Error(`Rol inválido. Roles permitidos: ${validRoles.join(', ')}`)
    }

    const role = new Role()
    role.name = data.name
    role.description = data.description?.trim() || null

    return role
  }

  // ===== FACTORY METHOD: FROM PERSISTENCE =====
  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    name: string
    description?: string | null
  }): Role {
    const role = new Role()

    role.id = data.id
    role.createdAt = data.createdAt
    role.updatedAt = data.updatedAt
    role.deletedAt = data.deletedAt || null
    role.name = data.name
    role.description = data.description || null

    return role
  }

  // ===== MÉTODO UPDATE =====
  update(data: { description?: string }): void {
    if (data.description !== undefined) {
      this.description = data.description?.trim() || null
    }
  }
}
