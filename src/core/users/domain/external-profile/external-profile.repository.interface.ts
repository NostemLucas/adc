import { ExternalProfile } from '../external-profile'

export interface IExternalProfileRepository {
  save(profile: ExternalProfile): Promise<ExternalProfile>
  findById(id: string): Promise<ExternalProfile | null>
  findByUserId(userId: string): Promise<ExternalProfile | null>
  findByOrganizationId(organizationId: string): Promise<ExternalProfile[]>
  findAll(): Promise<ExternalProfile[]>
  delete(id: string): Promise<void>
  existsByUserId(userId: string): Promise<boolean>
  existsByOrganizationalEmail(email: string): Promise<boolean>
}
