import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject, BadRequestException } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure'
import { User } from '../../../../domain/user'
import { UserUniquenessValidator } from '../../../../domain'
import { UpdateUserCommand } from './update-user.command'
import { Role } from 'src/core/auth/domain/authorization'

/**
 * Handler para el comando UpdateUser.
 * Responsable de actualizar un usuario existente.
 */
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const { userId, dto } = command

    // 1. Buscar usuario
    const user = await this.userRepository.findByIdOrFail(userId)

    // 2. Validar unicidad usando Domain Service
    await this.uniquenessValidator.validateForUpdate(
      userId,
      dto.email,
      user.email.getValue(),
      dto.username,
      user.username.getValue(),
      dto.ci,
      user.ci.getValue(),
    )

    // 3. Validar que los roles sean válidos si se proporcionan
    if (dto.roles) {
      const invalidRoles = dto.roles.filter(
        (role) => !Object.values(Role).includes(role as Role),
      )
      if (invalidRoles.length > 0) {
        throw new BadRequestException(
          `Roles inválidos: ${invalidRoles.join(', ')}. Roles válidos: ${Object.values(Role).join(', ')}`,
        )
      }
    }

    // 4. Actualizar con método de dominio (validaciones de formato + emite evento)
    user.update({
      names: dto.names,
      lastNames: dto.lastNames,
      email: dto.email,
      username: dto.username,
      ci: dto.ci,
      phone: dto.phone,
      address: dto.address,
      image: dto.image,
    })

    // 5. Persistir
    const updatedUser = await this.userRepository.update(user)

    // 6. Publicar eventos de dominio
    updatedUser.domainEvents.forEach((event) => this.eventBus.publish(event))
    updatedUser.clearDomainEvents()

    return updatedUser
  }
}
