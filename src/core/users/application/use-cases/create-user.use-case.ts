import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { UserRepository } from '../../infrastructure/user.repository'
import { RoleRepository } from '../../../roles/infrastructure/role.repository'
import { User } from '../../domain/user.entity'
import { CreateUserDto } from '../dto/create-user.dto'

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    // 1. Buscar roles
    const roles = await this.roleRepository.findByIds(dto.roleIds)

    if (roles.length !== dto.roleIds.length) {
      throw new Error('Algunos roles no existen')
    }

    // 2. Hashear contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    // 3. Crear entidad (con validaciones de dominio)
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

    // 4. Guardar (Prisma Exception Filter maneja errores)
    return await this.userRepository.create(user)
  }
}
