import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure/di'
import { DeleteExternalProfileCommand } from './delete-external-profile.command'

@CommandHandler(DeleteExternalProfileCommand)
export class DeleteExternalProfileHandler
  implements ICommandHandler<DeleteExternalProfileCommand>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteExternalProfileCommand): Promise<void> {
    const { userId } = command

    // 1. Buscar usuario
    const user = await this.userRepository.findByIdOrFail(userId)

    // 2. Marcar como eliminado (soft delete)
    user.markAsDeleted()

    // 3. Persistir
    await this.userRepository.save(user)

    // 4. Publicar eventos de dominio
    user.domainEvents.forEach((event) => this.eventBus.publish(event))
    user.clearDomainEvents()
  }
}
