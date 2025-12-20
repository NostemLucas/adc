import { Injectable } from '@nestjs/common'
import {
  User as PrismaUser,
  Role as PrismaRole,
  Permission as PrismaPermission,
} from '@prisma/client'
import { BaseRepository, TransactionContext } from '@shared/database'
import { User } from '../domain/user.entity'
import { Role } from 'src/core/roles/domain/role.entity'
import { Permission } from 'src/core/permissions/domain/permission.entity'

type PrismaRoleWithPermissions = PrismaRole & {
  permissions?: PrismaPermission[]
}
type PrismaUserWithRoles = PrismaUser & { roles?: PrismaRoleWithPermissions[] }

/**
 * UserRepository - Con soporte de transacciones mediante contexto CLS
 * Extiende BaseRepository para participar automáticamente en transacciones
 */
@Injectable()
export class UserRepository extends BaseRepository {
  constructor(transactionContext: TransactionContext) {
    super(transactionContext)
  }

  /**
   * Convierte Prisma User a Domain User
   */
  private toDomain(prismaUser: PrismaUserWithRoles): User {
    return User.fromPersistence({
      id: prismaUser.id,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt,
      names: prismaUser.names,
      lastNames: prismaUser.lastNames,
      email: prismaUser.email,
      phone: prismaUser.phone,
      username: prismaUser.username,
      password: prismaUser.password,
      ci: prismaUser.ci,
      image: prismaUser.image,
      address: prismaUser.address,
      status: prismaUser.status,
      failedLoginAttempts: prismaUser.failedLoginAttempts,
      lockUntil: prismaUser.lockUntil,
      roles:
        prismaUser.roles?.map((role) =>
          Role.fromPersistence({
            id: role.id,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            deletedAt: role.deletedAt,
            name: role.name,
            description: role.description,
            permissions:
              role.permissions?.map((permission) =>
                Permission.fromPersistence({
                  id: permission.id,
                  name: permission.name,
                  resource: permission.resource,
                  action: permission.action,
                  description: permission.description,
                  createdAt: permission.createdAt,
                  updatedAt: permission.updatedAt,
                }),
              ) || [],
          }),
        ) || [],
    })
  }

  /**
   * Buscar por ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return user ? this.toDomain(user) : null
  }

  /**
   * Buscar por ID o lanzar error
   */
  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return this.toDomain(user)
  }

  /**
   * Buscar por username o email
   */
  async findByUsernameOrEmail(username: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return user ? this.toDomain(user) : null
  }

  /**
   * Buscar por email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return user ? this.toDomain(user) : null
  }

  /**
   * Buscar por username
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return user ? this.toDomain(user) : null
  }

  /**
   * Buscar por CI
   */
  async findByCi(ci: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { ci },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return user ? this.toDomain(user) : null
  }

  /**
   * Crear usuario
   */
  async create(user: User): Promise<User> {
    const created: PrismaUserWithRoles = await this.prisma.user.create({
      data: {
        names: user.names,
        lastNames: user.lastNames,
        email: user.email,
        phone: user.phone,
        username: user.username,
        password: user.password,
        ci: user.ci,
        image: user.image,
        address: user.address,
        status: user.status,
        failedLoginAttempts: user.failedLoginAttempts,
        lockUntil: user.lockUntil,
        roles: {
          connect: user.roles.map((role) => ({ id: role.id })),
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return this.toDomain(created)
  }

  /**
   * Actualizar usuario
   */
  async update(user: User): Promise<User> {
    const updated: PrismaUserWithRoles = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        names: user.names,
        lastNames: user.lastNames,
        email: user.email,
        phone: user.phone,
        username: user.username,
        password: user.password,
        ci: user.ci,
        image: user.image,
        address: user.address,
        status: user.status,
        failedLoginAttempts: user.failedLoginAttempts,
        lockUntil: user.lockUntil,
        roles: {
          set: user.roles.map((role) => ({ id: role.id })),
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return this.toDomain(updated)
  }

  /**
   * Guardar (crear o actualizar)
   */
  async save(user: User): Promise<User> {
    if (user.id) {
      return this.update(user)
    } else {
      return this.create(user)
    }
  }

  /**
   * Eliminar (soft delete)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Buscar usuarios activos
   */
  async findActiveUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return users.map((user) => this.toDomain(user))
  }

  /**
   * Buscar usuarios por rol
   */
  async findByRole(roleId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        roles: {
          some: { id: roleId },
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })

    return users.map((user) => this.toDomain(user))
  }
}
