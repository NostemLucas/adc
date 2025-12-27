import { Injectable } from '@nestjs/common'
import { BaseRepository, TransactionContext } from '@shared/database'
import { RequestContext } from '@shared/context'
import { User } from '../../../domain/user'
import { IUserRepository } from '../../../domain/user/user.repository.interface'
import { UserOrmMapper } from './user.orm-mapper'

/**
 * UserRepository - Con soporte de transacciones y auditoría automática mediante contexto CLS
 * Extiende BaseRepository para participar automáticamente en transacciones y auditoría
 *
 * Implements IUserRepository interface (port) defined in domain layer.
 * This follows the Dependency Inversion Principle.
 *
 * Uses UserOrmMapper for all Domain ↔ Prisma conversions.
 */
@Injectable()
export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(
    transactionContext: TransactionContext,
    requestContext: RequestContext,
  ) {
    super(transactionContext, requestContext)
  }

  /**
   * Buscar por ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    return user ? UserOrmMapper.toDomain(user) : null
  }

  /**
   * Buscar por ID o lanzar error
   */
  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
    })

    return UserOrmMapper.toDomain(user)
  }

  /**
   * Buscar por username o email
   */
  async findByUsernameOrEmail(username: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    })

    return user ? UserOrmMapper.toDomain(user) : null
  }

  /**
   * Buscar por email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    return user ? UserOrmMapper.toDomain(user) : null
  }

  /**
   * Buscar por username
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    })

    return user ? UserOrmMapper.toDomain(user) : null
  }

  /**
   * Buscar por CI
   */
  async findByCi(ci: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { ci },
    })

    return user ? UserOrmMapper.toDomain(user) : null
  }

  /**
   * Crear usuario
   *
   * NOTA: Para habilitar auditoría automática (createdBy), agrega el campo a tu schema:
   * ```prisma
   * model User {
   *   createdBy String?
   *   // ...
   * }
   * ```
   * Y luego usa: data: this.withAuditCreate({ ...userData })
   */
  async create(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: UserOrmMapper.toPrismaData(user),
    })

    return UserOrmMapper.toDomain(created)
  }

  /**
   * Actualizar usuario
   *
   * NOTA: Para habilitar auditoría automática (updatedBy), agrega el campo a tu schema:
   * ```prisma
   * model User {
   *   updatedBy String?
   *   // ...
   * }
   * ```
   * Y luego usa: data: this.withAuditUpdate({ ...userData })
   */
  async update(user: User): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: UserOrmMapper.toPrismaData(user),
    })

    return UserOrmMapper.toDomain(updated)
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
   * Automáticamente agrega deletedBy y deletedAt desde el RequestContext
   */
  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: this.withAuditDelete(),
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
    })

    return UserOrmMapper.toDomainArray(users)
  }

  /**
   * Buscar usuarios por tipo (INTERNAL/EXTERNAL)
   */
  async findByType(type: 'internal' | 'external'): Promise<User[]> {
    const prismaType = type === 'internal' ? 'INTERNAL' : 'EXTERNAL'
    const users = await this.prisma.user.findMany({
      where: {
        type: prismaType,
      },
    })

    return UserOrmMapper.toDomainArray(users)
  }

  /**
   * Check if email exists
   * @param email Email to check
   * @param excludeUserId Optional user ID to exclude (for updates)
   * @returns True if exists, false otherwise
   */
  async existsByEmail(email: string, excludeUserId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email,
        id: excludeUserId ? { not: excludeUserId } : undefined,
        deletedAt: null,
      },
    })

    return count > 0
  }

  /**
   * Check if username exists
   * @param username Username to check
   * @param excludeUserId Optional user ID to exclude (for updates)
   * @returns True if exists, false otherwise
   */
  async existsByUsername(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        username,
        id: excludeUserId ? { not: excludeUserId } : undefined,
        deletedAt: null,
      },
    })

    return count > 0
  }

  /**
   * Check if CI exists
   * @param ci CI to check
   * @param excludeUserId Optional user ID to exclude (for updates)
   * @returns True if exists, false otherwise
   */
  async existsByCi(ci: string, excludeUserId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        ci,
        id: excludeUserId ? { not: excludeUserId } : undefined,
        deletedAt: null,
      },
    })

    return count > 0
  }
}
