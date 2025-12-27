import { Organization } from '../organization'

export interface IOrganizationRepository {
  save(organization: Organization): Promise<Organization>
  findById(id: string): Promise<Organization | null>
  findByName(name: string): Promise<Organization | null>
  findByTaxId(taxId: string): Promise<Organization | null>
  findAll(): Promise<Organization[]>
  delete(id: string): Promise<void>
  existsByName(name: string): Promise<boolean>
  existsByTaxId(taxId: string): Promise<boolean>
}
