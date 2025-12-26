/**
 * User ORM Mapper
 *
 * Responsible for mapping between Domain entities and Prisma models.
 * This keeps the repository clean and focused on data access logic.
 *
 * Domain Entity (User) ↔ Prisma Model (PrismaUser)
 */

import { User as PrismaUser } from '@prisma/client'
import { User } from '../../domain/user'
import { Role } from 'src/core/auth/domain/authorization'
import { UserStatusMapper } from '../mappers/user-status.mapper'

export class UserOrmMapper {
  static toDomain(prismaUser: PrismaUser): User {
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
      status: UserStatusMapper.toDomain(prismaUser.status),
      failedLoginAttempts: prismaUser.failedLoginAttempts,
      lockUntil: prismaUser.lockUntil,
      roles: prismaUser.roles as Role[], // Array de roles
    })
  }

  static toPrismaData(user: User) {
    return {
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
      roles: user.roles, // Array de roles
    }
  }

  /**
   * Convert array of Prisma Users to Domain Users
   */
  static toDomainArray(prismaUsers: PrismaUser[]): User[] {
    return prismaUsers.map((user) => this.toDomain(user))
  }
}
