import { InternalProfile } from '../internal-profile'

export interface IInternalProfileRepository {
  save(profile: InternalProfile): Promise<InternalProfile>
  findById(id: string): Promise<InternalProfile | null>
  findByUserId(userId: string): Promise<InternalProfile | null>
  findAll(): Promise<InternalProfile[]>
  delete(id: string): Promise<void>
  existsByUserId(userId: string): Promise<boolean>
  existsByEmployeeCode(employeeCode: string): Promise<boolean>
}
