import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject, BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import type { IUserRepository } from '../../../domain/repositories'
import { USER_REPOSITORY } from '../../../infrastructure'
import { User } from '../../../domain/user'
import { UserUniquenessValidator } from '../../../domain/services'
import { CreateUserCommand } from './create-user.command'
import { Role } from 'src/core/auth/domain/authorization'

/**
 * Handler para el comando CreateUser.
 * Responsable de crear un nuevo usuario en el sistema.
 */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const { dto } = command

    // 1. Validar unicidad usando Domain Service
    await this.uniquenessValidator.validateForCreate(
      dto.email,
      dto.username,
      dto.ci,
    )

    // 2. Validar que los roles sean válidos
    const invalidRoles = dto.roles.filter(
      (role) => !Object.values(Role).includes(role as Role),
    )
    if (invalidRoles.length > 0) {
      throw new BadRequestException(
        `Roles inválidos: ${invalidRoles.join(', ')}. Roles válidos: ${Object.values(Role).join(', ')}`,
      )
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
      roles: dto.roles as Role[],
      phone: dto.phone,
      address: dto.address,
      image: dto.image,
    })

    // 5. Persistir
    const savedUser = await this.userRepository.save(user)

    // 6. Marcar como creado (emite evento de dominio)
    savedUser.markAsCreated()

    // 7. Publicar eventos de dominio
    savedUser.domainEvents.forEach((event) => this.eventBus.publish(event))
    savedUser.clearDomainEvents()

    return savedUser
  }
}
