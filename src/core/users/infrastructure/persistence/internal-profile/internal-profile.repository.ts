import { Injectable } from '@nestjs/common'
import { PrismaService } from '@shared/database/prisma.service'
import { IInternalProfileRepository } from '../../../domain/internal-profile/internal-profile.repository.interface'
import { InternalProfile } from '../../../domain/internal-profile'
import { InternalProfileORMMapper } from './internal-profile.orm-mapper'

@Injectable()
export class InternalProfileRepository implements IInternalProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(profile: InternalProfile): Promise<InternalProfile> {
    const data = InternalProfileORMMapper.toPersistence(profile)

    const saved = await this.prisma.internalProfile.upsert({
      where: { id: profile.id },
      create: data,
      update: data,
    })

    return InternalProfileORMMapper.toDomain(saved)
  }

  async findById(id: string): Promise<InternalProfile | null> {
    const profile = await this.prisma.internalProfile.findUnique({
      where: { id },
    })

    return profile ? InternalProfileORMMapper.toDomain(profile) : null
  }

  async findByUserId(userId: string): Promise<InternalProfile | null> {
    const profile = await this.prisma.internalProfile.findUnique({
      where: { userId },
    })

    return profile ? InternalProfileORMMapper.toDomain(profile) : null
  }

  async findAll(): Promise<InternalProfile[]> {
    const profiles = await this.prisma.internalProfile.findMany({
      where: { deletedAt: null },
    })

    return profiles.map(InternalProfileORMMapper.toDomain)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.internalProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.internalProfile.count({
      where: { userId, deletedAt: null },
    })

    return count > 0
  }

  async existsByEmployeeCode(employeeCode: string): Promise<boolean> {
    const count = await this.prisma.internalProfile.count({
      where: { employeeCode, deletedAt: null },
    })

    return count > 0
  }
}
