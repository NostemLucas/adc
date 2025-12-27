/**
 * User ORM Mapper
 *
 * Responsible for mapping between Domain entities and Prisma models.
 * This keeps the repository clean and focused on data access logic.
 *
 * Domain Entity (User) ↔ Prisma Model (PrismaUser)
 */

import { User as PrismaUser } from '@prisma/client'
import { User } from '../../../domain/user'
import { UserType } from '../../../domain/shared/constants'
import { UserStatusMapper } from '../../mappers/user-status.mapper'

export class UserOrmMapper {
  static toDomain(prismaUser: PrismaUser): User {
    // Convertir de Prisma enum (INTERNAL/EXTERNAL) a domain enum (internal/external)
    const userType = prismaUser.type === 'INTERNAL' ? UserType.INTERNAL : UserType.EXTERNAL

    return User.fromPersistence({
      id: prismaUser.id,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt,
      type: userType,
      names: prismaUser.names,
      lastNames: prismaUser.lastNames,
      email: prismaUser.email,
      phone: prismaUser.phone,
      username: prismaUser.username,
      password: prismaUser.password,
      ci: prismaUser.ci,
      image: prismaUser.image,
      address: prismaUser.address,
      status: UserStatusMapper.toDomain(prismaUser.status),
      failedLoginAttempts: prismaUser.failedLoginAttempts,
      lockUntil: prismaUser.lockUntil,
    })
  }

  static toPrismaData(user: User) {
    // Convertir de domain enum (internal/external) a Prisma enum (INTERNAL/EXTERNAL)
    const prismaType = user.type === UserType.INTERNAL ? 'INTERNAL' : 'EXTERNAL'

    return {
      type: prismaType as 'INTERNAL' | 'EXTERNAL',
      names: user.names.getValue(),
      lastNames: user.lastNames.getValue(),
      email: user.email.getValue(),
      phone: user.phone?.getValue() || null,
      username: user.username.getValue(),
      password: user.password.getValue(),
      ci: user.ci.getValue(),
      image: user.image?.getValue() || null,
      address: user.address?.getValue() || null,
      status: UserStatusMapper.toPrisma(user.status),
      failedLoginAttempts: user.failedLoginAttempts,
      lockUntil: user.lockUntil,
    }
  }

  /**
   * Convert array of Prisma Users to Domain Users
   */
  static toDomainArray(prismaUsers: PrismaUser[]): User[] {
    return prismaUsers.map((user) => this.toDomain(user))
  }
}
