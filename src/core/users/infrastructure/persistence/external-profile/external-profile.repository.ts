import { Injectable } from '@nestjs/common'
import { PrismaService } from '@shared/database/prisma.service'
import { IExternalProfileRepository } from '../../../domain/external-profile/external-profile.repository.interface'
import { ExternalProfile } from '../../../domain/external-profile'
import { ExternalProfileORMMapper } from './external-profile.orm-mapper'

@Injectable()
export class ExternalProfileRepository implements IExternalProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(profile: ExternalProfile): Promise<ExternalProfile> {
    const data = ExternalProfileORMMapper.toPersistence(profile)

    const saved = await this.prisma.externalProfile.upsert({
      where: { id: profile.id },
      create: data,
      update: data,
    })

    return ExternalProfileORMMapper.toDomain(saved)
  }

  async findById(id: string): Promise<ExternalProfile | null> {
    const profile = await this.prisma.externalProfile.findUnique({
      where: { id },
    })

    return profile ? ExternalProfileORMMapper.toDomain(profile) : null
  }

  async findByUserId(userId: string): Promise<ExternalProfile | null> {
    const profile = await this.prisma.externalProfile.findUnique({
      where: { userId },
    })

    return profile ? ExternalProfileORMMapper.toDomain(profile) : null
  }

  async findByOrganizationId(organizationId: string): Promise<ExternalProfile[]> {
    const profiles = await this.prisma.externalProfile.findMany({
      where: { organizationId, deletedAt: null },
    })

    return profiles.map(ExternalProfileORMMapper.toDomain)
  }

  async findAll(): Promise<ExternalProfile[]> {
    const profiles = await this.prisma.externalProfile.findMany({
      where: { deletedAt: null },
    })

    return profiles.map(ExternalProfileORMMapper.toDomain)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.externalProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.externalProfile.count({
      where: { userId, deletedAt: null },
    })

    return count > 0
  }

  async existsByOrganizationalEmail(email: string): Promise<boolean> {
    const count = await this.prisma.externalProfile.count({
      where: { organizationalEmail: email, deletedAt: null },
    })

    return count > 0
  }
}
