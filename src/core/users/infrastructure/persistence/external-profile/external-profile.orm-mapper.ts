import { ExternalProfile as ExternalProfilePrisma } from '@prisma/client'
import { ExternalProfile } from '../../../domain/external-profile'

export class ExternalProfileORMMapper {
  static toDomain(raw: ExternalProfilePrisma): ExternalProfile {
    return ExternalProfile.fromPersistence({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      userId: raw.userId,
      organizationId: raw.organizationId,
      jobTitle: raw.jobTitle,
      department: raw.department,
      organizationalEmail: raw.organizationalEmail,
      isActive: raw.isActive,
      joinedAt: raw.joinedAt,
      leftAt: raw.leftAt,
    })
  }

  static toPersistence(profile: ExternalProfile): ExternalProfilePrisma {
    return {
      id: profile.id,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      deletedAt: profile.deletedAt,
      userId: profile.userId,
      organizationId: profile.organizationId,
      jobTitle: profile.jobTitle,
      department: profile.department,
      organizationalEmail: profile.organizationalEmail?.getValue() ?? null,
      isActive: profile.isActive,
      joinedAt: profile.joinedAt,
      leftAt: profile.leftAt,
    } as ExternalProfilePrisma
  }
}
