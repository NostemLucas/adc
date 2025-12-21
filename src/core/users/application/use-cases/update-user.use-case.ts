import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../infrastructure/user.repository'
import { RoleRepository } from '../../../roles/infrastructure/role.repository'
import { User } from '../../domain/user.entity'
import { UpdateUserDto } from '../dto/update-user.dto'
import { RoleNotFoundException } from '../../domain/exceptions'
import { UserUniquenessValidator } from '../../domain/services'

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
  ) {}

  async execute(id: string, dto: UpdateUserDto): Promise<User> {
    // 1. Buscar usuario
    const user = await this.userRepository.findByIdOrFail(id)

    // 2. Validar unicidad usando Domain Service
    await this.uniquenessValidator.validateForUpdate(
      id,
      dto.email,
      user.email.getValue(), // ← Extrae string del Value Object
      dto.username,
      user.username,
      dto.ci,
      user.ci.getValue(), // ← Extrae string del Value Object
    )

    // 3. Si hay roleIds, buscar roles
    let roles = user.roles
    if (dto.roleIds) {
      roles = await this.roleRepository.findByIds(dto.roleIds)
      if (roles.length !== dto.roleIds.length) {
        throw new RoleNotFoundException('Algunos roles no existen')
      }
    }

    // 4. Actualizar con método de dominio (validaciones de formato)
    user.update({
      names: dto.names,
      lastNames: dto.lastNames,
      email: dto.email,
      username: dto.username,
      ci: dto.ci,
      phone: dto.phone,
      address: dto.address,
      image: dto.image,
      roles: dto.roleIds ? roles : undefined,
    })

    // 5. Persistir
    return await this.userRepository.update(user)
  }
}
