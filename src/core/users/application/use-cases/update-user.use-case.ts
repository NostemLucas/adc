import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../infrastructure/user.repository'
import { RoleRepository } from '../../../roles/infrastructure/role.repository'
import { User } from '../../domain/user.entity'
import { UpdateUserDto } from '../dto/update-user.dto'

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(id: string, dto: UpdateUserDto): Promise<User> {
    // 1. Buscar usuario
    const user = await this.userRepository.findByIdOrFail(id)

    // 2. Si hay roleIds, buscar roles
    let roles = user.roles
    if (dto.roleIds) {
      roles = await this.roleRepository.findByIds(dto.roleIds)
      if (roles.length !== dto.roleIds.length) {
        throw new Error('Algunos roles no existen')
      }
    }

    // 3. Actualizar con método de dominio (validaciones incluidas)
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

    // 4. Guardar
    return await this.userRepository.update(user)
  }
}
