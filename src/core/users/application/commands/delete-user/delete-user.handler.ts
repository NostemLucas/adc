import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../domain/repositories'
import { USER_REPOSITORY } from '../../../domain/repositories'
import { DeleteUserCommand } from './delete-user.command'

/**
 * Handler para el comando DeleteUser.
 * Responsable de eliminar (soft delete) un usuario.
 */
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const { userId } = command

    // 1. Buscar usuario
    const user = await this.userRepository.findByIdOrFail(userId)

    // 2. Marcar como eliminado (desactiva el usuario + emite evento)
    user.markAsDeleted()

    // 3. Persistir cambios
    await this.userRepository.update(user)

    // 4. Publicar eventos de dominio
    user.domainEvents.forEach((event) => this.eventBus.publish(event))
    user.clearDomainEvents()
  }
}
