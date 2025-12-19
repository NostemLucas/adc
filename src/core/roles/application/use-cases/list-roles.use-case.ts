import { Injectable } from '@nestjs/common'
import { RoleRepository } from '../../infrastructure/role.repository'
import { Role } from '../../domain/role.entity'

@Injectable()
export class ListRolesUseCase {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(): Promise<Role[]> {
    return await this.roleRepository.findAll()
  }
}
