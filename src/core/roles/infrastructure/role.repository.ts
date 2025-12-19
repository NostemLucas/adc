import { Injectable } from '@nestjs/common'
import { Role as PrismaRole } from '@prisma/client'
import { PrismaService } from '@shared/database/prisma.service'
import { Role } from '../domain/role.entity'

/**
 * RoleRepository - Simple e independiente
 */
@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convierte Prisma Role a Domain Role
   */
  private toDomain(prismaRole: PrismaRole): Role {
    return Role.fromPersistence({
      id: prismaRole.id,
      createdAt: prismaRole.createdAt,
      updatedAt: prismaRole.updatedAt,
      deletedAt: prismaRole.deletedAt,
      name: prismaRole.name,
      description: prismaRole.description,
    })
  }

  /**
   * Buscar por ID
   */
  async findById(id: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    })

    return role ? this.toDomain(role) : null
  }

  /**
   * Buscar por nombre
   */
  async findByName(name: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
    })

    return role ? this.toDomain(role) : null
  }

  /**
   * Buscar por nombres
   */
  async findByNames(names: string[]): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        name: { in: names },
      },
    })

    return roles.map((role) => this.toDomain(role))
  }

  /**
   * Buscar por IDs
   */
  async findByIds(ids: string[]): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: ids },
      },
    })

    return roles.map((role) => this.toDomain(role))
  }

  /**
   * Buscar todos
   */
  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
    })

    return roles.map((role) => this.toDomain(role))
  }

  /**
   * Crear rol
   */
  async create(role: Role): Promise<Role> {
    const created = await this.prisma.role.create({
      data: {
        name: role.name,
        description: role.description,
      },
    })

    return this.toDomain(created)
  }

  /**
   * Actualizar rol
   */
  async update(role: Role): Promise<Role> {
    const updated = await this.prisma.role.update({
      where: { id: role.id },
      data: {
        description: role.description,
      },
    })

    return this.toDomain(updated)
  }

  /**
   * Guardar (crear o actualizar)
   */
  async save(role: Role): Promise<Role> {
    if (role.id) {
      return this.update(role)
    } else {
      return this.create(role)
    }
  }

  /**
   * Eliminar (soft delete)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
