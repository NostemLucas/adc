import { InternalProfile as InternalProfilePrisma } from '@prisma/client'
import { InternalProfile } from '../../../domain/internal-profile'
import { SystemRole } from '../../../domain/shared/constants'

export class InternalProfileORMMapper {
  static toDomain(raw: InternalProfilePrisma): InternalProfile {
    return InternalProfile.fromPersistence({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      userId: raw.userId,
      roles: raw.roles as SystemRole[],
      department: raw.department,
      employeeCode: raw.employeeCode,
      hireDate: raw.hireDate,
    })
  }

  static toPersistence(profile: InternalProfile): InternalProfilePrisma {
    return {
      id: profile.id,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      deletedAt: profile.deletedAt,
      userId: profile.userId,
      roles: profile.roles as string[],
      department: profile.department,
      employeeCode: profile.employeeCode,
      hireDate: profile.hireDate,
    } as InternalProfilePrisma
  }
}
