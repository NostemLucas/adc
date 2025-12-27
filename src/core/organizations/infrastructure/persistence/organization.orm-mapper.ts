import { Organization as OrganizationPrisma } from '@prisma/client'
import { Organization } from '../../domain/organization'

export class OrganizationORMMapper {
  static toDomain(raw: OrganizationPrisma): Organization {
    return Organization.fromPersistence({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      name: raw.name,
      description: raw.description,
      address: raw.address,
      phone: raw.phone,
      email: raw.email,
      logo: raw.logo,
      banner: raw.banner,
      mission: raw.mission,
      vision: raw.vision,
      values: raw.values,
      website: raw.website,
      taxId: raw.taxId,
      isActive: raw.isActive,
    })
  }

  static toPersistence(organization: Organization): OrganizationPrisma {
    return {
      id: organization.id,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      deletedAt: organization.deletedAt,
      name: organization.name.getValue(),
      description: organization.description,
      address: organization.address?.getValue() ?? null,
      phone: organization.phone?.getValue() ?? null,
      email: organization.email?.getValue() ?? null,
      logo: organization.logo?.getValue() ?? null,
      banner: organization.banner?.getValue() ?? null,
      mission: organization.mission,
      vision: organization.vision,
      values: organization.values,
      website: organization.website,
      taxId: organization.taxId,
      isActive: organization.isActive,
    } as OrganizationPrisma
  }
}
