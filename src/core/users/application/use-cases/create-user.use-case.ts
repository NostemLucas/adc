import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { UserRepository } from '../../infrastructure/user.repository'
import { RoleRepository } from '../../../roles/infrastructure/role.repository'
import { User } from '../../domain/user.entity'
import { CreateUserDto } from '../dto/create-user.dto'
import { RoleNotFoundException } from '../../domain/exceptions'
import { UserUniquenessValidator } from '../../domain/services'

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    // 1. Validar unicidad usando Domain Service
    await this.uniquenessValidator.validateForCreate(
      dto.email,
      dto.username,
      dto.ci,
    )

    // 2. Buscar roles
    const roles = await this.roleRepository.findByIds(dto.roleIds)

    if (roles.length !== dto.roleIds.length) {
      throw new RoleNotFoundException('Algunos roles no existen')
    }

    // 3. Hashear contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    // 4. Crear entidad (validaciones de formato/dominio)
    const user = User.create({
      names: dto.names,
      lastNames: dto.lastNames,
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      ci: dto.ci,
      roles,
      phone: dto.phone,
      address: dto.address,
      image: dto.image,
    })

    // 5. Persistir
    return await this.userRepository.create(user)
  }
}
