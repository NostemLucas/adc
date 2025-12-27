import { Injectable } from '@nestjs/common'
import { PrismaService } from '@shared/database/prisma.service'
import { IOrganizationRepository } from '../../domain/repositories'
import { Organization } from '../../domain/organization'
import { OrganizationORMMapper } from './organization.orm-mapper'

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(organization: Organization): Promise<Organization> {
    const data = OrganizationORMMapper.toPersistence(organization)

    const saved = await this.prisma.organization.upsert({
      where: { id: organization.id },
      create: data,
      update: data,
    })

    return OrganizationORMMapper.toDomain(saved)
  }

  async findById(id: string): Promise<Organization | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    })

    return organization ? OrganizationORMMapper.toDomain(organization) : null
  }

  async findByName(name: string): Promise<Organization | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { name },
    })

    return organization ? OrganizationORMMapper.toDomain(organization) : null
  }

  async findByTaxId(taxId: string): Promise<Organization | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { taxId },
    })

    return organization ? OrganizationORMMapper.toDomain(organization) : null
  }

  async findAll(): Promise<Organization[]> {
    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
    })

    return organizations.map(OrganizationORMMapper.toDomain)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.organization.count({
      where: { name, deletedAt: null },
    })

    return count > 0
  }

  async existsByTaxId(taxId: string): Promise<boolean> {
    const count = await this.prisma.organization.count({
      where: { taxId, deletedAt: null },
    })

    return count > 0
  }
}
