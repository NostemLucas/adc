import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure/di'
import { User } from '../../../../domain'
import { UserUniquenessValidator } from '../../../../domain'
import { UpdateInternalUserCommand } from './update-internal-user.command'

@CommandHandler(UpdateInternalUserCommand)
export class UpdateInternalUserHandler implements ICommandHandler<UpdateInternalUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateInternalUserCommand): Promise<User> {
    const { userId, dto } = command

    // 1. Buscar usuario
    const user = await this.userRepository.findByIdOrFail(userId)

    // 2. Validar unicidad si se cambian email, username o CI
    if (dto.email || dto.username || dto.ci) {
      await this.uniquenessValidator.validateForUpdate(
        userId,
        dto.email,
        user.email.getValue(),
        dto.username,
        user.username.getValue(),
        dto.ci,
        user.ci.getValue(),
      )
    }

    // 3. Actualizar usuario
    user.update(dto)

    // 4. Persistir
    const updatedUser = await this.userRepository.save(user)

    // 5. Publicar eventos de dominio
    updatedUser.domainEvents.forEach((event) => this.eventBus.publish(event))
    updatedUser.clearDomainEvents()

    return updatedUser
  }
}
