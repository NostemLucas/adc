import { UserStatus as PrismaUserStatus } from '@prisma/client'
import { UserStatus as DomainUserStatus } from '../../domain/shared/constants'

/**
 * Mapper para convertir entre UserStatus de Prisma y UserStatus del dominio.
 * Esto mantiene el dominio independiente de la capa de infraestructura.
 */
export class UserStatusMapper {
  /**
   * Convierte de Prisma UserStatus a Domain UserStatus
   */
  static toDomain(prismaStatus: PrismaUserStatus): DomainUserStatus {
    switch (prismaStatus) {
      case PrismaUserStatus.ACTIVE:
        return DomainUserStatus.ACTIVE
      case PrismaUserStatus.INACTIVE:
        return DomainUserStatus.INACTIVE
      default:
        throw new Error(`Estado de usuario desconocido: ${prismaStatus}`)
    }
  }

  /**
   * Convierte de Domain UserStatus a Prisma UserStatus
   */
  static toPrisma(domainStatus: DomainUserStatus): PrismaUserStatus {
    switch (domainStatus) {
      case DomainUserStatus.ACTIVE:
        return PrismaUserStatus.ACTIVE
      case DomainUserStatus.INACTIVE:
        return PrismaUserStatus.INACTIVE
      default:
        throw new Error(`Estado de usuario desconocido: ${domainStatus}`)
    }
  }
}
